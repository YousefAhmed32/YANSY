'use strict';
const express          = require('express');
const router           = express.Router();
const multer           = require('multer');
const mongoose         = require('mongoose');
const PortfolioProject = require('../models/PortfolioProject');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { audit }         = require('../utils/auditLogger');
const { uploadPortfolioImage, deletePortfolioImage, buildResponsiveUrl } = require('../utils/portfolioMedia');

const protect   = authenticate;
const adminOnly = requireAdmin;

// ── Multer — memory storage, single image per request ──────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /jpeg|jpg|png|webp|gif/.test(file.mimetype)),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const slugify = (str) =>
  (str || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

const ensureUniqueSlug = async (title, excludeId) => {
  const base = slugify(title) || `project-${Date.now()}`;
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const clash = await PortfolioProject.findOne({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }).select('_id');
    if (!clash) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
};

// Decorate a project doc's media assets with ready-to-use responsive URLs (doesn't mutate DB)
const withResponsiveMedia = (projectDoc) => {
  const project = projectDoc.toObject ? projectDoc.toObject() : projectDoc;
  const decorate = (asset) => asset && {
    ...asset,
    srcSm: buildResponsiveUrl(asset, { width: 480 }),
    srcMd: buildResponsiveUrl(asset, { width: 960 }),
    srcLg: buildResponsiveUrl(asset, { width: 1600 }),
  };
  if (project.coverImage) project.coverImage = decorate(project.coverImage);
  if (project.gallery)    project.gallery    = project.gallery.map(decorate);
  if (project.testimonial?.avatar) project.testimonial.avatar = decorate(project.testimonial.avatar);
  return project;
};

const CURSOR_SORT = { createdAt: -1, _id: -1 };

const decodeCursor = (cursor) => {
  if (!cursor) return null;
  try {
    const [iso, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|');
    return { createdAt: new Date(iso), _id: new mongoose.Types.ObjectId(id) };
  } catch {
    return null;
  }
};

const encodeCursor = (doc) =>
  Buffer.from(`${doc.createdAt.toISOString()}|${doc._id}`).toString('base64url');

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES — specific paths MUST come before /:idOrSlug
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/portfolio — listing with cursor pagination, filters, search, sort
router.get('/', async (req, res) => {
  try {
    const { category, industry, tag, featured, search, sort = 'latest' } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 12, 60);
    const filter = { status: 'published' };

    if (category && category !== 'All') filter.category = category;
    if (industry) filter.industry = industry;
    if (tag)      filter.tags = tag;
    if (featured === 'true') filter.featured = true;

    // Search — small result sets expected, so plain text-score ranking without cursoring
    if (search?.trim()) {
      filter.$text = { $search: search.trim() };
      const projects = await PortfolioProject.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .select('-challenge -challengeAr -solution -solutionAr -process -processAr -results -resultsAr');
      return res.json({ projects: projects.map(withResponsiveMedia), nextCursor: null });
    }

    if (sort === 'featured') {
      filter.featured = true;
    }

    const cursor = decodeCursor(req.query.cursor);
    if (cursor) {
      filter.$or = [
        { createdAt: { $lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, _id: { $lt: cursor._id } },
      ];
    }

    const sortSpec = sort === 'oldest' ? { createdAt: 1, _id: 1 } : CURSOR_SORT;

    const projects = await PortfolioProject.find(filter)
      .sort(sortSpec)
      .limit(limit + 1)
      .select('-challenge -challengeAr -solution -solutionAr -process -processAr -results -resultsAr');

    const hasMore = projects.length > limit;
    const page = hasMore ? projects.slice(0, limit) : projects;
    const nextCursor = hasMore ? encodeCursor(page[page.length - 1]) : null;

    res.json({ projects: page.map(withResponsiveMedia), nextCursor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/portfolio/meta — distinct categories/industries for filter chips
router.get('/meta', async (req, res) => {
  try {
    const [categories, industries] = await Promise.all([
      PortfolioProject.distinct('category', { status: 'published' }),
      PortfolioProject.distinct('industry', { status: 'published', industry: { $nin: [null, ''] } }),
    ]);
    res.json({ categories, industries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES — registered before the public /:idOrSlug catch-all
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/portfolio/admin — full list, all statuses, filters + search + pagination
router.get('/admin', protect, adminOnly, async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const page  = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const filter = {};

    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'All') filter.category = category;
    if (search?.trim()) filter.$text = { $search: search.trim() };

    const [projects, total, counts] = await Promise.all([
      PortfolioProject.find(filter)
        .sort(search?.trim() ? { score: { $meta: 'textScore' } } : { order: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      PortfolioProject.countDocuments(filter),
      PortfolioProject.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const statusCounts = { draft: 0, published: 0, archived: 0 };
    counts.forEach((c) => { if (c._id) statusCounts[c._id] = c.count; });

    res.json({
      projects: projects.map(withResponsiveMedia),
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      statusCounts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/portfolio/admin/:id — single project, any status (for the edit wizard)
router.get('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    const project = await PortfolioProject.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project: withResponsiveMedia(project) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/portfolio/admin/media — upload one image, returns a ready media asset
router.post('/admin/media', protect, adminOnly, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const asset = await uploadPortfolioImage(req.file.buffer, req.file.originalname, req.file.mimetype);
    audit({ req, action: 'portfolio.media_upload', entityType: 'PortfolioProject', metadata: { publicId: asset.publicId } });
    res.status(201).json({ asset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/portfolio/admin/media — remove an (orphaned or replaced) uploaded asset
router.delete('/admin/media', protect, adminOnly, async (req, res) => {
  try {
    const { publicId, provider } = req.body;
    if (!publicId) return res.status(400).json({ error: 'publicId required' });
    await deletePortfolioImage({ publicId, provider });
    audit({ req, action: 'portfolio.media_delete', entityType: 'PortfolioProject', metadata: { publicId } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/portfolio/admin — create
router.post('/admin', protect, adminOnly, async (req, res) => {
  try {
    const body = req.body;
    if (!body.coverImage?.url) return res.status(400).json({ error: 'Cover image is required' });

    const slug = await ensureUniqueSlug(body.title);
    const status = ['draft', 'published', 'archived'].includes(body.status) ? body.status : 'draft';

    const project = await PortfolioProject.create({
      ...body,
      slug,
      status,
      publishedAt: status === 'published' ? new Date() : undefined,
    });

    audit({ req, action: 'portfolio.create', entityType: 'PortfolioProject', entityId: project._id, after: { title: project.title, status: project.status } });
    res.status(201).json({ project: withResponsiveMedia(project) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/portfolio/admin/:id — update
router.put('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    const project = await PortfolioProject.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const before = { title: project.title, status: project.status, featured: project.featured };
    const body = req.body;

    if (body.title && body.title !== project.title) {
      body.slug = await ensureUniqueSlug(body.title, project._id);
    }

    const wasPublished = project.status === 'published';
    Object.assign(project, body);
    if (project.status === 'published' && !wasPublished) project.publishedAt = new Date();

    await project.save();
    audit({ req, action: 'portfolio.update', entityType: 'PortfolioProject', entityId: project._id, before, after: { title: project.title, status: project.status, featured: project.featured } });
    res.json({ project: withResponsiveMedia(project) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/portfolio/admin/:id/status — draft / publish / archive
router.patch('/admin/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['draft', 'published', 'archived'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const project = await PortfolioProject.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const before = project.status;
    project.status = status;
    if (status === 'published' && !project.publishedAt) project.publishedAt = new Date();
    await project.save();

    audit({ req, action: 'portfolio.status_change', entityType: 'PortfolioProject', entityId: project._id, before: { status: before }, after: { status } });
    res.json({ project: withResponsiveMedia(project) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/portfolio/admin/reorder — persist new drag order
router.patch('/admin/reorder', protect, adminOnly, async (req, res) => {
  try {
    const { items } = req.body; // [{ id, order }]
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });

    await PortfolioProject.bulkWrite(
      items.map(({ id, order }) => ({
        updateOne: { filter: { _id: id }, update: { $set: { order } } },
      }))
    );

    audit({ req, action: 'portfolio.reorder', entityType: 'PortfolioProject', metadata: { count: items.length } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/portfolio/admin/bulk — bulk publish / archive / draft / delete
router.post('/admin/bulk', protect, adminOnly, async (req, res) => {
  try {
    const { ids, action } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids array required' });

    if (action === 'delete') {
      const projects = await PortfolioProject.find({ _id: { $in: ids } });
      await Promise.all(projects.flatMap((p) => [
        deletePortfolioImage(p.coverImage),
        ...(p.gallery || []).map(deletePortfolioImage),
      ]));
      await PortfolioProject.deleteMany({ _id: { $in: ids } });
    } else if (['draft', 'published', 'archived'].includes(action)) {
      await PortfolioProject.updateMany(
        { _id: { $in: ids } },
        { $set: { status: action, ...(action === 'published' ? { publishedAt: new Date() } : {}) } }
      );
    } else {
      return res.status(400).json({ error: 'Invalid bulk action' });
    }

    audit({ req, action: 'portfolio.bulk_action', entityType: 'PortfolioProject', metadata: { action, count: ids.length } });
    res.json({ ok: true, count: ids.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/portfolio/admin/:id
router.delete('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    const project = await PortfolioProject.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    await Promise.all([
      deletePortfolioImage(project.coverImage),
      ...(project.gallery || []).map(deletePortfolioImage),
    ]);
    await project.deleteOne();

    audit({ req, action: 'portfolio.delete', entityType: 'PortfolioProject', entityId: project._id, before: { title: project.title } });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC — single project + related (registered last: catch-all params)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/portfolio/:idOrSlug
router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const query = mongoose.isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
    const project = await PortfolioProject.findOne({ ...query, status: 'published' });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    PortfolioProject.updateOne({ _id: project._id }, { $inc: { viewCount: 1 } }).catch(() => {});

    res.json({ project: withResponsiveMedia(project) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/portfolio/:id/related
router.get('/:id/related', async (req, res) => {
  try {
    const project = await PortfolioProject.findById(req.params.id).select('category industry');
    if (!project) return res.json({ projects: [] });

    const limit = Math.min(parseInt(req.query.limit, 10) || 3, 6);
    const related = await PortfolioProject.find({
      _id: { $ne: project._id },
      status: 'published',
      $or: [{ category: project.category }, { industry: project.industry }],
    })
      .sort({ order: 1, createdAt: -1 })
      .limit(limit)
      .select('-challenge -challengeAr -solution -solutionAr -process -processAr -results -resultsAr');

    res.json({ projects: related.map(withResponsiveMedia) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
