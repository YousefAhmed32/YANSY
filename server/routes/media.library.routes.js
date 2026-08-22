'use strict';
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const Media   = require('../models/Media');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { audit } = require('../utils/auditLogger');
const { uploadPortfolioMedia, deletePortfolioImage } = require('../utils/portfolioMedia');
const { sha256Hex } = require('../media/mediaValidators');

// Mounted at /api/media-library — deliberately NOT under /api/media, which
// media/media.routes.js already owns for GridFS blob streaming via a
// GET /:fileId catch-all. Sharing that base path would mean whichever router
// registers first swallows requests meant for the other (e.g. `/api/media/library`
// would be parsed as fileId="library" by the streaming route if it won the
// registration race). A separate path sidesteps that fragility entirely.

const protect   = authenticate;
const adminOnly = requireAdmin;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 60 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^(image\/(jpeg|jpg|png|webp|gif|svg\+xml)|video\/(mp4|webm|quicktime)|audio\/(mpeg|mp3|wav|x-wav|ogg))$/.test(file.mimetype)),
});

router.use(protect, adminOnly);

const catalogTypeForMime = (mimeType) => {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'image';
};

// GET /api/media-library — browse: search + filter by type + paginate
router.get('/', async (req, res) => {
  try {
    const { q, type, page = 1, limit = 60 } = req.query;
    const filter = {};
    // Accepts a single type ('image') or a comma-separated list ('image,video')
    // — the portfolio gallery/media pickers browse image+video together.
    if (type) filter.type = type.includes(',') ? { $in: type.split(',').map((t) => t.trim()).filter(Boolean) } : type;
    if (q?.trim()) {
      const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ filename: rx }, { alt: rx }, { altAr: rx }, { caption: rx }, { tags: rx }];
    }
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(120, Number(limit) || 60);

    const [items, total] = await Promise.all([
      Media.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      Media.countDocuments(filter),
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/media-library/upload — upload (or reuse, if byte-identical) and catalog the asset
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const hash = sha256Hex(req.file.buffer);

    const existing = await Media.findOne({ sha256: hash });
    if (existing) {
      // Byte-identical file already in the library — GridFS already dedupes
      // the blob (see media/media.service.js); this makes that dedup visible
      // instead of silently creating a second catalog entry.
      return res.status(200).json({ item: existing, reused: true });
    }

    const asset = await uploadPortfolioMedia(req.file.buffer, req.file.originalname, req.file.mimetype);
    const item = await Media.create({
      url:      asset.url,
      publicId: asset.publicId,
      sha256:   hash,
      mimeType: req.file.mimetype,
      type:     catalogTypeForMime(req.file.mimetype),
      width:    asset.width,
      height:   asset.height,
      filename: req.file.originalname,
    });

    audit({ req, action: 'media_library.upload', entityType: 'Media', entityId: item._id, after: { publicId: item.publicId } });
    res.status(201).json({ item, reused: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/media-library/:id — edit alt/caption/tags/folder/type metadata
router.patch('/:id', async (req, res) => {
  try {
    const item = await Media.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    const before = item.toObject();

    const { alt, altAr, caption, captionAr, tags, folder, type } = req.body;
    if (alt !== undefined)       item.alt = alt;
    if (altAr !== undefined)     item.altAr = altAr;
    if (caption !== undefined)   item.caption = caption;
    if (captionAr !== undefined) item.captionAr = captionAr;
    if (tags !== undefined)      item.tags = tags;
    if (folder !== undefined)    item.folder = folder;
    if (type !== undefined)      item.type = type;

    await item.save();
    audit({ req, action: 'media_library.update', entityType: 'Media', entityId: item._id, before, after: item.toObject() });
    res.json({ item });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/media-library/:id — blocked while still referenced by a
// project, so "replace everywhere" data can't silently go stale.
router.delete('/:id', async (req, res) => {
  try {
    const item = await Media.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (item.usedIn?.length) {
      return res.status(409).json({ error: 'This asset is still used by one or more projects. Remove it from those projects first.' });
    }

    await deletePortfolioImage({ publicId: item.publicId, provider: 'gridfs' });
    await item.deleteOne();

    audit({ req, action: 'media_library.delete', entityType: 'Media', entityId: item._id, before: { publicId: item.publicId } });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
