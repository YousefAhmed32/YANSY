'use strict';
const express          = require('express');
const router           = express.Router();
const multer           = require('multer');
const ClientLogo         = require('../models/ClientLogo');
const ClientLogoSettings = require('../models/ClientLogoSettings');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { audit } = require('../utils/auditLogger');
const { uploadClientLogo, deleteClientLogo } = require('../utils/clientLogoMedia');
const { slugify } = require('../utils/slugify');

const protect   = authenticate;
const adminOnly = requireAdmin;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\/(png|svg\+xml|webp)$/.test(file.mimetype)),
});

// Admins commonly type "acme.com" rather than a full URL — without a
// protocol that renders as a same-site relative link on the public page,
// silently taking visitors to a 404 instead of the client's site.
const normalizeWebsite = (url) => {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const ensureUniqueSlug = async (name, excludeId) => {
  const base = slugify(name) || `brand-${Date.now()}`;
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const clash = await ClientLogo.findOne({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }).select('_id');
    if (!clash) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC — settings + active logos in one round trip
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/client-logos
router.get('/', async (req, res) => {
  try {
    const settings = await ClientLogoSettings.getSingleton();

    // Section is fully hidden when disabled — no logos payload needed either.
    if (!settings.enabled) {
      return res.json({ enabled: false, title: settings.title, subtitle: settings.subtitle, logos: [] });
    }

    const logos = await ClientLogo.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .select('name slug logo website order');

    res.json({ enabled: true, title: settings.title, subtitle: settings.subtitle, logos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN — section settings
// ═══════════════════════════════════════════════════════════════════════════

router.get('/admin/settings', protect, adminOnly, async (req, res) => {
  try {
    const settings = await ClientLogoSettings.getSingleton();
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/admin/settings', protect, adminOnly, async (req, res) => {
  try {
    const settings = await ClientLogoSettings.getSingleton();
    const before = settings.toObject();
    const { enabled, title, subtitle } = req.body;

    if (enabled !== undefined) settings.enabled = Boolean(enabled);
    if (title !== undefined) {
      settings.title = { en: title.en ?? settings.title?.en ?? '', ar: title.ar ?? settings.title?.ar ?? '' };
    }
    if (subtitle !== undefined) {
      settings.subtitle = { en: subtitle.en ?? settings.subtitle?.en ?? '', ar: subtitle.ar ?? settings.subtitle?.ar ?? '' };
    }

    settings.updatedBy = req.user._id;
    await settings.save();

    audit({ req, action: 'client_logos.settings_update', entityType: 'ClientLogoSettings', entityId: settings._id, before, after: settings.toObject() });
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN — brand logos CRUD
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/client-logos/admin — full list, active + inactive, in display order
router.get('/admin', protect, adminOnly, async (req, res) => {
  try {
    const logos = await ClientLogo.find().sort({ order: 1, createdAt: 1 });
    res.json({ logos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/client-logos/admin/media — upload one logo image, returns a ready asset
router.post('/admin/media', protect, adminOnly, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const asset = await uploadClientLogo(req.file.buffer, req.file.originalname, req.file.mimetype);
    audit({ req, action: 'client_logos.media_upload', entityType: 'ClientLogo', metadata: { publicId: asset.publicId } });
    res.status(201).json({ asset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/client-logos/admin/media — remove an orphaned/replaced uploaded asset
router.delete('/admin/media', protect, adminOnly, async (req, res) => {
  try {
    const { publicId, provider } = req.body;
    if (!publicId) return res.status(400).json({ error: 'publicId required' });
    await deleteClientLogo({ publicId, provider });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/client-logos/admin — create
router.post('/admin', protect, adminOnly, async (req, res) => {
  try {
    const { name, website, logo, isActive } = req.body;
    if (!name?.trim())  return res.status(400).json({ error: 'Name is required' });
    if (!logo?.url)     return res.status(400).json({ error: 'Logo image is required' });

    const slug  = await ensureUniqueSlug(name);
    const count = await ClientLogo.countDocuments();

    const clientLogo = await ClientLogo.create({
      name:     name.trim(),
      slug,
      logo,
      website:  normalizeWebsite(website),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      order:    count, // append to the end of the current display order
    });

    audit({ req, action: 'client_logos.create', entityType: 'ClientLogo', entityId: clientLogo._id, after: { name: clientLogo.name } });
    res.status(201).json({ logo: clientLogo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/client-logos/admin/reorder — persist new drag order
router.patch('/admin/reorder', protect, adminOnly, async (req, res) => {
  try {
    const { items } = req.body; // [{ id, order }]
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });

    await ClientLogo.bulkWrite(
      items.map(({ id, order }) => ({
        updateOne: { filter: { _id: id }, update: { $set: { order } } },
      }))
    );

    audit({ req, action: 'client_logos.reorder', entityType: 'ClientLogo', metadata: { count: items.length } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/client-logos/admin/:id/toggle — quick active/inactive flip
router.patch('/admin/:id/toggle', protect, adminOnly, async (req, res) => {
  try {
    const clientLogo = await ClientLogo.findById(req.params.id);
    if (!clientLogo) return res.status(404).json({ error: 'Brand not found' });

    clientLogo.isActive = !clientLogo.isActive;
    await clientLogo.save();

    audit({ req, action: 'client_logos.toggle', entityType: 'ClientLogo', entityId: clientLogo._id, after: { isActive: clientLogo.isActive } });
    res.json({ logo: clientLogo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/client-logos/admin/:id — update
router.put('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    const clientLogo = await ClientLogo.findById(req.params.id);
    if (!clientLogo) return res.status(404).json({ error: 'Brand not found' });

    const before = { name: clientLogo.name, isActive: clientLogo.isActive };
    const { name, website, logo, isActive } = req.body;

    if (name !== undefined && name.trim() && name.trim() !== clientLogo.name) {
      clientLogo.name = name.trim();
      clientLogo.slug = await ensureUniqueSlug(name, clientLogo._id);
    }
    if (website !== undefined) clientLogo.website = normalizeWebsite(website);
    if (logo !== undefined && logo?.url) clientLogo.logo = logo;
    if (isActive !== undefined) clientLogo.isActive = Boolean(isActive);

    await clientLogo.save();

    audit({ req, action: 'client_logos.update', entityType: 'ClientLogo', entityId: clientLogo._id, before, after: { name: clientLogo.name, isActive: clientLogo.isActive } });
    res.json({ logo: clientLogo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/client-logos/admin/:id
router.delete('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    const clientLogo = await ClientLogo.findById(req.params.id);
    if (!clientLogo) return res.status(404).json({ error: 'Brand not found' });

    await deleteClientLogo(clientLogo.logo);
    await clientLogo.deleteOne();

    audit({ req, action: 'client_logos.delete', entityType: 'ClientLogo', entityId: clientLogo._id, before: { name: clientLogo.name } });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
