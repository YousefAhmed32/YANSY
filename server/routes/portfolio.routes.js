'use strict';
const express          = require('express');
const router           = express.Router();
const multer           = require('multer');
const mongoose         = require('mongoose');
const PortfolioProject = require('../models/PortfolioProject');
const { getBucket }    = require('../config/gridfs');
const { authenticate, requireAdmin } = require('../middleware/auth');

const protect   = authenticate;
const adminOnly = requireAdmin;

// ── Multer — memory storage ────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 6, fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, /jpeg|jpg|png|webp/.test(file.mimetype));
  },
});

const uploadToGridFS = (file) =>
  new Promise((resolve, reject) => {
    try {
      const bucket       = getBucket();
      const uploadStream = bucket.openUploadStream(file.originalname, { contentType: file.mimetype });
      uploadStream.end(file.buffer);
      uploadStream.on('finish', () => resolve(uploadStream.id));
      uploadStream.on('error',  reject);
    } catch (err) {
      reject(err);
    }
  });

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES — specific paths MUST come before /:id
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/portfolio
router.get('/', async (req, res) => {
  try {
    const { category, featured } = req.query;
    const limit  = Math.min(parseInt(req.query.limit) || 50, 100); // cap at 100
    const filter = { isPublished: true };
    if (category && category !== 'All') filter.category = category;
    if (featured === 'true') filter.featured = true;

    const projects = await PortfolioProject.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .limit(limit);

    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/portfolio/image/:id  — MUST be before /:id
router.get('/image/:id', async (req, res) => {
  try {
    const bucket = getBucket();
    const fileId = new mongoose.Types.ObjectId(req.params.id);

    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.set('Content-Type',  files[0].contentType);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');

    const downloadStream = bucket.openDownloadStream(fileId);

    downloadStream.on('error', () => {
      if (!res.headersSent) {
        res.status(404).json({ error: 'Image not found' });
      }
    });

    downloadStream.pipe(res);
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

// GET /api/portfolio/:id — AFTER all specific paths
router.get('/:id', async (req, res) => {
  try {
    const project = await PortfolioProject.findById(req.params.id);
    if (!project || !project.isPublished)
      return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES — MUST be before /:id (now placed before it above via ordering)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/portfolio/admin/all — NOTE: Express matches this BEFORE /:id
// because this route is registered after /:id... we need to use a different path.
// Using /api/portfolio?admin=1 OR registering on a sub-router.
// Solution: register as GET / with admin flag (already done via query param in admin frontend)
// For admin-only full list, use the existing GET / but with admin middleware

// GET /api/portfolio/admin/all — admin sees all projects (published + drafts)
// Note: /admin/all has two path segments so it does NOT conflict with /:id (one segment)
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const projects = await PortfolioProject.find().sort({ order: 1, createdAt: -1 });
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/portfolio — create
router.post(
  '/',
  protect,
  adminOnly,
  upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'images', maxCount: 5 }]),
  async (req, res) => {
    try {
      const {
        title, titleAr, category, description, descriptionAr,
        liveUrl, tags, featured, order, isPublished,
      } = req.body;

      if (!req.files?.coverImage?.[0])
        return res.status(400).json({ error: 'Cover image is required' });

      const coverId    = await uploadToGridFS(req.files.coverImage[0]);
      const imagesIds  = await Promise.all((req.files.images || []).map(uploadToGridFS));

      const project = await PortfolioProject.create({
        title, titleAr, category, description, descriptionAr, liveUrl,
        coverImage: coverId,
        images:     imagesIds,
        tags:       tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
        featured:   featured === 'true',
        order:      order ? Number(order) : 0,
        isPublished: isPublished !== 'false',
      });

      res.status(201).json({ project });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// PUT /api/portfolio/:id — update
router.put(
  '/:id',
  protect,
  adminOnly,
  upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'images', maxCount: 5 }]),
  async (req, res) => {
    try {
      const project = await PortfolioProject.findById(req.params.id);
      if (!project) return res.status(404).json({ error: 'Project not found' });

      const textFields = ['title', 'titleAr', 'category', 'description', 'descriptionAr', 'liveUrl'];
      textFields.forEach(f => { if (req.body[f] !== undefined) project[f] = req.body[f]; });

      if (req.body.tags !== undefined) {
        project.tags = Array.isArray(req.body.tags)
          ? req.body.tags
          : req.body.tags.split(',').map(t => t.trim());
      }
      if (req.body.featured    !== undefined) project.featured    = req.body.featured    === 'true';
      if (req.body.order       !== undefined) project.order       = Number(req.body.order);
      if (req.body.isPublished !== undefined) project.isPublished = req.body.isPublished !== 'false';

      if (req.files?.coverImage?.[0]) {
        project.coverImage = await uploadToGridFS(req.files.coverImage[0]);
      }
      if (req.files?.images?.length) {
        project.images = await Promise.all(req.files.images.map(uploadToGridFS));
      }

      await project.save();
      res.json({ project });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// DELETE /api/portfolio/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await PortfolioProject.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
