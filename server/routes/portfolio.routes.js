'use strict';
const express          = require('express');
const router           = express.Router();
const multer           = require('multer');
const mongoose         = require('mongoose');
const PortfolioProject = require('../models/PortfolioProject');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { audit }         = require('../utils/auditLogger');
const { uploadPortfolioMedia, deletePortfolioImage, buildResponsiveUrl } = require('../utils/portfolioMedia');

const protect   = authenticate;
const adminOnly = requireAdmin;

// ── Multer — memory storage, single file per request ────────────────────────
// Images, plus video/audio for hero clips, gallery/block video, and voice-note
// testimonials. One combined size ceiling (60MB) rather than a second multer
// instance per media kind — simpler, and a case-study video clip is expected
// to already be a short, compressed snippet, not a raw export.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 60 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^(image\/(jpeg|jpg|png|webp|gif)|video\/(mp4|webm|quicktime)|audio\/(mpeg|mp3|wav|x-wav|ogg))$/.test(file.mimetype)),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

// `description`/`coverImage` are deliberately NOT required at the schema
// level (see the comment on those fields in models/PortfolioProject.js) so a
// brand-new draft can exist — and autosave — the moment it has a title.
// They're only mandatory the moment a project actually goes live; this is
// the one place that's enforced, called from every status-change path.
const assertPublishable = (doc) => {
  const missing = [];
  if (!doc.description?.trim()) missing.push('description');
  if (!doc.coverImage?.url) missing.push('coverImage');
  return missing;
};

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

// Every field an admin write is allowed to touch. Deliberately excludes
// system-managed ones (_id, slug — re-derived from title, publishedAt —
// managed by the status-transition logic below, viewCount, timestamps) so a
// PUT body can never smuggle in an unrelated field. Replaces the v1 route's
// unguarded `Object.assign(project, body)`, which merged the request body
// onto the document wholesale.
const WRITABLE_FIELDS = [
  'title', 'titleAr', 'tagline', 'taglineAr', 'category', 'industry',
  'clientName', 'clientNameAr', 'clientLogo', 'location', 'locationAr', 'confidential', 'private',
  'description', 'descriptionAr',
  'myRole', 'myRoleAr', 'goals', 'goalsAr', 'painPoints', 'painPointsAr',
  'challenge', 'challengeAr', 'solution', 'solutionAr', 'process', 'processAr', 'results', 'resultsAr',
  'metrics', 'performanceMetrics', 'testimonial', 'proofScreenshots', 'faqs', 'awards', 'team', 'blocks',
  'liveUrl', 'figmaUrl', 'githubUrl', 'tags', 'duration', 'teamSize', 'startDate', 'launchDate', 'year',
  'relatedProjectsOverride',
  'coverImage', 'coverVideo', 'gallery',
  'status', 'featured', 'order',
  'metaTitle', 'metaDescription',
];
const pickWritable = (body) => Object.fromEntries(WRITABLE_FIELDS.filter((k) => k in body).map((k) => [k, body[k]]));

// Every media-asset-bearing spot in the schema, flattened into one array —
// used so delete/duplicate never orphans a file in Cloudinary/local storage
// just because it lives inside `team[]` or a content block rather than the
// top-level cover/gallery fields.
const collectMediaAssets = (project) => {
  const assets = [
    project.coverImage, project.coverVideo, project.clientLogo,
    project.testimonial?.avatar, project.testimonial?.audio,
    ...(project.gallery || []),
    ...(project.proofScreenshots || []),
    ...(project.team || []).map((m) => m.avatar),
  ];
  (project.blocks || []).forEach((b) => {
    assets.push(b.asset, b.before, b.after, b.poster);
    if (Array.isArray(b.images)) assets.push(...b.images);
  });
  return assets.filter((a) => a?.publicId);
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
  if (project.coverVideo) project.coverVideo = decorate(project.coverVideo);
  if (project.clientLogo) project.clientLogo = decorate(project.clientLogo);
  if (project.gallery)    project.gallery    = project.gallery.map(decorate);
  if (project.proofScreenshots) project.proofScreenshots = project.proofScreenshots.map(decorate);
  if (project.testimonial?.avatar) project.testimonial.avatar = decorate(project.testimonial.avatar);
  if (project.testimonial?.audio)  project.testimonial.audio  = decorate(project.testimonial.audio);
  if (project.team) project.team = project.team.map((m) => (m.avatar ? { ...m, avatar: decorate(m.avatar) } : m));
  if (project.blocks) {
    project.blocks = project.blocks.map((b) => ({
      ...b,
      asset:  decorate(b.asset),
      before: decorate(b.before),
      after:  decorate(b.after),
      poster: decorate(b.poster),
      images: Array.isArray(b.images) ? b.images.map(decorate) : b.images,
    }));
  }
  return project;
};

// A confidential (but public) project keeps its case study visible but hides
// who the client is — swap the identifying fields for a neutral stand-in
// rather than exposing clientName/clientNameAr/clientLogo. Admin routes never
// call this, so editors always see the real client name.
const redactConfidential = (project) => {
  if (!project.confidential) return project;
  return { ...project, clientName: undefined, clientNameAr: undefined, clientLogo: undefined };
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

// List/related payloads never need the long-form narrative or the full block
// stream — only the single-project detail route and admin routes do.
const LIST_EXCLUDE = '-myRole -myRoleAr -goals -goalsAr -painPoints -painPointsAr -challenge -challengeAr -solution -solutionAr -process -processAr -results -resultsAr -blocks -faqs';

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES — specific paths MUST come before /:idOrSlug
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/portfolio — listing with cursor pagination, filters, search, sort
router.get('/', async (req, res) => {
  try {
    const { category, industry, tag, featured, search, sort = 'latest' } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 12, 60);
    const filter = { status: 'published', private: { $ne: true } };

    if (category && category !== 'All') filter.category = category;
    if (industry) filter.industry = industry;
    if (tag)      filter.tags = tag;
    if (featured === 'true') filter.featured = true;

    // Search — small result sets expected, so plain text-score ranking without cursoring
    if (search?.trim()) {
      filter.$text = { $search: search.trim() };
      const projects = await PortfolioProject.find(filter, { score: { $meta: 'textScore' } })
        .sort(sort === 'popular' ? { viewCount: -1 } : { score: { $meta: 'textScore' } })
        .limit(limit)
        .select(LIST_EXCLUDE);
      return res.json({ projects: projects.map((p) => redactConfidential(withResponsiveMedia(p))), nextCursor: null });
    }

    if (sort === 'featured') {
      filter.featured = true;
    }

    // "Most viewed" doesn't cursor on createdAt, so it gets its own simple,
    // uncursored branch — consistent with the search branch above rather
    // than trying to force viewCount into the createdAt/_id cursor shape.
    if (sort === 'popular') {
      const projects = await PortfolioProject.find(filter).sort({ viewCount: -1, _id: -1 }).limit(limit).select(LIST_EXCLUDE);
      return res.json({ projects: projects.map((p) => redactConfidential(withResponsiveMedia(p))), nextCursor: null });
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
      .select(LIST_EXCLUDE);

    const hasMore = projects.length > limit;
    const page = hasMore ? projects.slice(0, limit) : projects;
    const nextCursor = hasMore ? encodeCursor(page[page.length - 1]) : null;

    res.json({ projects: page.map((p) => redactConfidential(withResponsiveMedia(p))), nextCursor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/portfolio/meta — distinct categories/industries/tags for filter chips
router.get('/meta', async (req, res) => {
  try {
    const baseFilter = { status: 'published', private: { $ne: true } };
    const [categories, industries, tags] = await Promise.all([
      PortfolioProject.distinct('category', baseFilter),
      PortfolioProject.distinct('industry', { ...baseFilter, industry: { $nin: [null, ''] } }),
      PortfolioProject.distinct('tags', baseFilter),
    ]);
    res.json({ categories, industries, tags: tags.filter(Boolean).sort() });
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
        .limit(limit)
        .select(LIST_EXCLUDE),
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

// POST /api/portfolio/admin/media — upload one image/video/audio, returns a ready media asset
router.post('/admin/media', protect, adminOnly, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const asset = await uploadPortfolioMedia(req.file.buffer, req.file.originalname, req.file.mimetype);
    audit({ req, action: 'portfolio.media_upload', entityType: 'PortfolioProject', metadata: { publicId: asset.publicId, kind: asset.kind } });
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
// Deliberately lightweight: a title (and, from Mongoose's own schema, a
// category) is all that's required to bring a draft into existence — this
// is the endpoint the wizard's autosave calls the moment those two fields
// are filled in, well before the rest of the case study is written.
router.post('/admin', protect, adminOnly, async (req, res) => {
  try {
    const body = pickWritable(req.body);
    if (!body.title?.trim()) return res.status(400).json({ error: 'Title is required' });

    const slug = await ensureUniqueSlug(body.title);
    const status = ['draft', 'published', 'archived'].includes(body.status) ? body.status : 'draft';

    if (status === 'published') {
      const missing = assertPublishable(body);
      if (missing.length) return res.status(400).json({ error: `Cannot publish — missing: ${missing.join(', ')}` });
    }

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
    const body = pickWritable(req.body);

    if (body.title && body.title !== project.title) {
      body.slug = await ensureUniqueSlug(body.title, project._id);
    }

    const wasPublished = project.status === 'published';
    Object.assign(project, body);

    if (project.status === 'published') {
      const missing = assertPublishable(project);
      if (missing.length) return res.status(400).json({ error: `Cannot publish — missing: ${missing.join(', ')}` });
      if (!wasPublished) project.publishedAt = new Date();
    }

    await project.save();
    audit({ req, action: 'portfolio.update', entityType: 'PortfolioProject', entityId: project._id, before, after: { title: project.title, status: project.status, featured: project.featured } });
    res.json({ project: withResponsiveMedia(project) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/portfolio/admin/:id/duplicate — clone as a new draft
//
// The clone re-references the same media assets (same Cloudinary publicIds)
// rather than re-uploading copies — cheap and instant, but it means deleting
// EITHER the original or the duplicate while the other still points at that
// media will break images in both. Acceptable for a "start a new project
// from this one" convenience action (the expected next step is editing text/
// data, rarely touching media untouched) as long as it's a known tradeoff,
// not a silent one — flagged here and in the admin UI's duplicate confirmation.
router.post('/admin/:id/duplicate', protect, adminOnly, async (req, res) => {
  try {
    const source = await PortfolioProject.findById(req.params.id).lean();
    if (!source) return res.status(404).json({ error: 'Project not found' });

    const { _id, __v, createdAt, updatedAt, slug, viewCount, publishedAt, ...rest } = source;
    const title = `${source.title} (Copy)`;
    const newSlug = await ensureUniqueSlug(title);

    const clone = await PortfolioProject.create({
      ...rest,
      title,
      titleAr: source.titleAr ? `${source.titleAr} (نسخة)` : source.titleAr,
      slug: newSlug,
      status: 'draft',
      featured: false,
      viewCount: 0,
      publishedAt: undefined,
    });

    audit({ req, action: 'portfolio.duplicate', entityType: 'PortfolioProject', entityId: clone._id, metadata: { sourceId: source._id } });
    res.status(201).json({ project: withResponsiveMedia(clone) });
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

    if (status === 'published') {
      const missing = assertPublishable(project);
      if (missing.length) return res.status(400).json({ error: `Cannot publish — missing: ${missing.join(', ')}` });
    }

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

    let skipped = 0;

    if (action === 'delete') {
      const projects = await PortfolioProject.find({ _id: { $in: ids } });
      await Promise.all(projects.flatMap(collectMediaAssets).map(deletePortfolioImage));
      await PortfolioProject.deleteMany({ _id: { $in: ids } });
    } else if (action === 'published') {
      // Not every selected draft is necessarily publish-ready — silently
      // publishing an incomplete one would put an unfinished case study
      // live. Split the batch instead of failing it outright.
      const projects = await PortfolioProject.find({ _id: { $in: ids } }).select('description coverImage');
      const publishableIds = projects.filter((p) => assertPublishable(p).length === 0).map((p) => p._id);
      skipped = ids.length - publishableIds.length;
      if (publishableIds.length) {
        await PortfolioProject.updateMany({ _id: { $in: publishableIds } }, { $set: { status: 'published', publishedAt: new Date() } });
      }
    } else if (['draft', 'archived'].includes(action)) {
      await PortfolioProject.updateMany({ _id: { $in: ids } }, { $set: { status: action } });
    } else {
      return res.status(400).json({ error: 'Invalid bulk action' });
    }

    audit({ req, action: 'portfolio.bulk_action', entityType: 'PortfolioProject', metadata: { action, count: ids.length, skipped } });
    res.json({ ok: true, count: ids.length - skipped, skipped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/portfolio/admin/:id
router.delete('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    const project = await PortfolioProject.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    await Promise.all(collectMediaAssets(project).map(deletePortfolioImage));
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
    const project = await PortfolioProject.findOne({ ...query, status: 'published', private: { $ne: true } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    PortfolioProject.updateOne({ _id: project._id }, { $inc: { viewCount: 1 } }).catch(() => {});

    res.json({ project: redactConfidential(withResponsiveMedia(project)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/portfolio/:id/related
router.get('/:id/related', async (req, res) => {
  try {
    const project = await PortfolioProject.findById(req.params.id).select('category industry relatedProjectsOverride');
    if (!project) return res.json({ projects: [] });

    const limit = Math.min(parseInt(req.query.limit, 10) || 3, 6);

    let related;
    if (project.relatedProjectsOverride?.length) {
      related = await PortfolioProject.find({
        _id: { $in: project.relatedProjectsOverride },
        status: 'published',
        private: { $ne: true },
      }).select(LIST_EXCLUDE).limit(limit);
    } else {
      related = await PortfolioProject.find({
        _id: { $ne: project._id },
        status: 'published',
        private: { $ne: true },
        $or: [{ category: project.category }, { industry: project.industry }],
      })
        .sort({ order: 1, createdAt: -1 })
        .limit(limit)
        .select(LIST_EXCLUDE);
    }

    res.json({ projects: related.map((p) => redactConfidential(withResponsiveMedia(p))) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
