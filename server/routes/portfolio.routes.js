'use strict';
const express          = require('express');
const router           = express.Router();
const multer           = require('multer');
const mongoose         = require('mongoose');
const PortfolioProject = require('../models/PortfolioProject');
const Category    = require('../models/Category');
const Industry    = require('../models/Industry');
const Technology  = require('../models/Technology');
const TeamMember  = require('../models/TeamMember');
const Client      = require('../models/Client');
const Tag         = require('../models/Tag');
const Testimonial = require('../models/Testimonial');
const Award       = require('../models/Award');
const Service     = require('../models/Service');
const ProjectType = require('../models/ProjectType');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { audit }         = require('../utils/auditLogger');
const { uploadPortfolioMedia, deletePortfolioImage, buildResponsiveUrl } = require('../utils/portfolioMedia');
const { slugify } = require('../utils/slugify');
const { touchUsage } = require('./libraryRouter.factory');
const { UNRANKED_DISPLAY_ORDER, normalizeDisplayOrderInput, serializeDisplayOrder } = require('../utils/displayOrder');
const {
  FORMAT_ID: PORTABLE_FORMAT_ID, CURRENT_SCHEMA_VERSION: PORTABLE_SCHEMA_VERSION,
  assertSafeShape, assertSafePayloadSize, resolveRelations,
} = require('../utils/portfolioPortable');

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
// the one place that's enforced, called from every status-change path
// (create-as-published, update-while-published, status-change, bulk-publish
// — see every `assertPublishable(...)` call site below, all four use this
// exact same function so frontend/backend can never silently disagree on
// what "ready to publish" means).
//
// Returns an array of stable field keys, never a human sentence — the
// caller (`publishValidationError` below) turns that into the structured
// `{ code, error, missingFields }` response; the SAME keys are mirrored in
// client/src/components/portfolio-wizard/publishValidation.js so the admin
// UI's field-level errors/focus-management never drift from what the server
// actually enforces.
//
// `title`/`category` are already guaranteed non-empty by Mongoose (title has
// `required: true`; category has `required: true`) for any document that
// successfully saved — checked here anyway as defense-in-depth so the
// missingFields contract is complete and self-describing even in an
// unexpected state, not because either check is expected to ever fire in
// practice.
const assertPublishable = (doc) => {
  const missing = [];
  if (!doc.title?.trim?.()) missing.push('title');
  if (!doc.category) missing.push('category');
  if (!doc.description?.trim()) missing.push('description');
  if (!doc.coverImage?.url) missing.push('coverImage');
  // A Quick Showcase has no narrative fields to fall back on for context —
  // Project Type is how a visitor (and the card/badge UI) knows what they're
  // even looking at, so it's hard-required for this mode only. Full case
  // studies leave it optional, unchanged from before this field existed.
  if (doc.presentationMode === 'showcase' && !doc.projectType) missing.push('projectType');
  return missing;
};

// Structured shape every publish-blocking response uses — see the doc
// comment on `assertPublishable` above. `code` lets the frontend distinguish
// "you're missing required fields" (recoverable inline, no toast-only dead
// end) from any other 400 (validation errors, bad input, etc.).
const publishValidationError = (missing) => ({
  code: 'PUBLISH_VALIDATION_FAILED',
  error: 'Project is not ready to publish',
  missingFields: missing,
});

// Applied to every route that returns a project doc to the client, so
// callers get usable objects (client name/logo, team member names, category
// labels, ...) instead of bare ObjectIds — see the CMS normalization plan.
const PROJECT_POPULATE = [
  { path: 'client', populate: { path: 'industry', select: 'name nameAr slug' } },
  { path: 'category' },
  { path: 'industry' },
  { path: 'projectType' },
  { path: 'technologies' },
  { path: 'projectTags' },
  { path: 'services' },
  { path: 'testimonials', populate: { path: 'client', select: 'name nameAr' } },
  { path: 'awards' },
  { path: 'team.member' },
  { path: 'relatedProjectsOverride', select: 'title titleAr slug coverImage category' },
];

// Fire-and-forget: bumps usageCount/lastUsedAt on every library entry this
// project references, so each library's Recent/Most-Used picker sections
// stay accurate. Never awaited from the request path — a slow/failed usage
// bump must not delay or fail the actual save.
const bumpLibraryUsage = (project) => {
  touchUsage(TeamMember, (project.team || []).map((t) => t.member)).catch(() => {});
  touchUsage(Client, project.client).catch(() => {});
  touchUsage(Technology, project.technologies).catch(() => {});
  touchUsage(Tag, project.projectTags).catch(() => {});
  touchUsage(Testimonial, project.testimonials).catch(() => {});
  touchUsage(Award, project.awards).catch(() => {});
  touchUsage(Category, project.category).catch(() => {});
  touchUsage(Industry, project.industry).catch(() => {});
  touchUsage(Service, project.services).catch(() => {});
  touchUsage(ProjectType, project.projectType).catch(() => {});
};

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
  'projectType', 'deliveryStatus', 'presentationMode', 'projectOrigin',
  'client', 'location', 'locationAr', 'confidential', 'private',
  'description', 'descriptionAr',
  'myRole', 'myRoleAr', 'goals', 'goalsAr', 'painPoints', 'painPointsAr',
  'challenge', 'challengeAr', 'solution', 'solutionAr', 'process', 'processAr', 'results', 'resultsAr',
  'metrics', 'performanceMetrics', 'testimonials', 'proofScreenshots', 'faqs', 'awards', 'team', 'services', 'highlights', 'blocks',
  'liveUrl', 'figmaUrl', 'githubUrl', 'technologies', 'projectTags', 'duration', 'teamSize', 'startDate', 'launchDate', 'year',
  'relatedProjectsOverride',
  'coverImage', 'coverVideo', 'gallery',
  'status', 'featured', 'displayOrder',
  'metaTitle', 'metaDescription',
];
const pickWritable = (body) => Object.fromEntries(WRITABLE_FIELDS.filter((k) => k in body).map((k) => [k, body[k]]));

// `highlights` is capped at 3 by the schema validator too (see
// models/PortfolioProject.js), but that only rejects an over-limit write
// outright — this normalizes it instead, the same "be forgiving on write,
// strict on what's stored" approach the rest of this route file uses
// (see e.g. applyDisplayOrderCoercion). Trims each side, drops an item that's
// blank on BOTH languages (an empty item must never reach the DB, let alone
// render publicly — see the feature brief), and truncates to the schema's
// own max lengths so a client bug can't silently produce a Mongoose
// ValidationError instead of a clean, capped save.
const sanitizeHighlights = (raw) => {
  if (!Array.isArray(raw)) return undefined;
  return raw
    .map((h) => ({
      text: (h?.text || '').toString().trim().slice(0, PortfolioProject.HIGHLIGHT_TEXT_MAXLEN),
      textAr: (h?.textAr || '').toString().trim().slice(0, PortfolioProject.HIGHLIGHT_TEXT_AR_MAXLEN),
    }))
    .filter((h) => h.text || h.textAr)
    .slice(0, PortfolioProject.HIGHLIGHTS_MAX);
};
const applyHighlightsSanitization = (body) => {
  if ('highlights' in body) body.highlights = sanitizeHighlights(body.highlights);
  return body;
};

// `displayOrder` needs its blank/null/omitted -> sentinel coercion applied
// on every write path that goes through `pickWritable` (create + update).
// Throws (caller catches -> 400) on a non-integer, non-blank value.
const applyDisplayOrderCoercion = (body) => {
  if ('displayOrder' in body) body.displayOrder = normalizeDisplayOrderInput(body.displayOrder);
  return body;
};

// Every media-asset-bearing spot in the schema, flattened into one array —
// used so delete/duplicate never orphans a file in GridFS just because it
// lives inside a content block rather than the top-level cover/gallery
// fields. Deliberately does NOT include client logo / team avatars /
// testimonial avatar+audio — those now live on shared library documents
// (Client/TeamMember/Testimonial) that other projects may still reference,
// so deleting THIS project must never delete THEIR media.
const collectMediaAssets = (project) => {
  const assets = [
    project.coverImage, project.coverVideo,
    ...(project.gallery || []),
    ...(project.proofScreenshots || []),
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
  // The sentinel is a storage-layer detail (see server/utils/displayOrder.js)
  // — every response, admin or public, shows `null` for "unranked" instead
  // of the raw large number.
  project.displayOrder = serializeDisplayOrder(project.displayOrder);
  const decorate = (asset) => asset && {
    ...asset,
    srcSm: buildResponsiveUrl(asset, { width: 480 }),
    srcMd: buildResponsiveUrl(asset, { width: 960 }),
    srcLg: buildResponsiveUrl(asset, { width: 1600 }),
  };
  if (project.coverImage) project.coverImage = decorate(project.coverImage);
  if (project.coverVideo) project.coverVideo = decorate(project.coverVideo);
  if (project.gallery)    project.gallery    = project.gallery.map(decorate);
  if (project.proofScreenshots) project.proofScreenshots = project.proofScreenshots.map(decorate);
  if (project.client?.logo) project.client = { ...project.client, logo: decorate(project.client.logo) };
  if (project.testimonials) {
    project.testimonials = project.testimonials.map((t) => (t && (t.avatar || t.audio)
      ? { ...t, avatar: decorate(t.avatar), audio: decorate(t.audio) }
      : t));
  }
  if (project.team) {
    project.team = project.team.map((credit) => (credit?.member?.avatar
      ? { ...credit, member: { ...credit.member, avatar: decorate(credit.member.avatar) } }
      : credit));
  }
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
// who the client is — drop the populated `client` object entirely rather
// than exposing its name/logo. Admin routes never call this, so editors
// always see the real client.
const redactConfidential = (project) => {
  if (!project.confidential) return project;
  return { ...project, client: undefined };
};

// Default public sort — see IMPLEMENTATION_PLAN.md Part 2 and
// server/utils/displayOrder.js: displayOrder ASC (empty sorts last via the
// sentinel), featured DESC as a tiebreaker, publishedAt DESC after that.
// This is a plain compound sort (no aggregation) so it stays fully
// index-friendly and cursor-paginable — see the matching index on the model.
const CURSOR_SORT = { displayOrder: 1, featured: -1, publishedAt: -1, _id: -1 };
// sort=oldest is a visitor-chosen alternate view, deliberately unrelated to
// manual display order — plain date-ascending, same as before this change.
const OLDEST_SORT = { createdAt: 1, _id: 1 };

// Cursor carries all four CURSOR_SORT keys so seek-pagination can resume
// correctly past a tie at any level (near-certain at the displayOrder level,
// since most projects share the "unranked" sentinel until manually ranked).
const encodeCursor = (doc) => Buffer.from(JSON.stringify({
  o: doc.displayOrder,
  f: doc.featured ? 1 : 0,
  p: (doc.publishedAt || doc.createdAt).toISOString(),
  id: String(doc._id),
})).toString('base64url');

const decodeCursor = (cursor) => {
  if (!cursor) return null;
  try {
    const c = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    return { displayOrder: c.o, featured: Boolean(c.f), publishedAt: new Date(c.p), _id: new mongoose.Types.ObjectId(c.id) };
  } catch {
    return null;
  }
};

// sort=oldest keeps its own simple 2-key cursor — a separate shape from the
// default's 4-key one, not a subset of it.
const encodeOldestCursor = (doc) =>
  Buffer.from(`${doc.createdAt.toISOString()}|${doc._id}`).toString('base64url');

const decodeOldestCursor = (cursor) => {
  if (!cursor) return null;
  try {
    const [iso, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|');
    return { createdAt: new Date(iso), _id: new mongoose.Types.ObjectId(id) };
  } catch {
    return null;
  }
};

// List/related payloads never need the long-form narrative or the full block
// stream — only the single-project detail route and admin routes do.
const LIST_EXCLUDE = '-myRole -myRoleAr -goals -goalsAr -painPoints -painPointsAr -challenge -challengeAr -solution -solutionAr -process -processAr -results -resultsAr -blocks -faqs';

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES — specific paths MUST come before /:idOrSlug
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/portfolio — listing with cursor pagination, filters, search, sort
router.get('/', async (req, res, next) => {
  try {
    const { category, industry, tag, featured, search, sort = 'latest', mode, work } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 12, 60);
    const filter = { status: 'published', private: { $ne: true } };

    // `mode` = presentationMode ('caseStudy' | 'showcase'), `work` =
    // deliveryStatus ('live' | 'concept' | 'archived') — the public
    // "Case Studies / Visual Showcases" and "Live Work / Concepts" filter
    // chips. Independent of each other and of category/industry/tag.
    if (mode && ['caseStudy', 'showcase'].includes(mode)) filter.presentationMode = mode;
    if (work && ['live', 'concept', 'archived'].includes(work)) filter.deliveryStatus = work;

    // category/industry/tag arrive as library slugs (readable URLs) — resolve
    // to the referenced ObjectId. An unknown slug filters to zero results
    // (Category.findOne returns null -> filter.category = a value nothing
    // can match) rather than silently ignoring the filter.
    const NO_MATCH = new mongoose.Types.ObjectId();
    if (category && category !== 'All') {
      const cat = await Category.findOne({ slug: category }).select('_id');
      filter.category = cat?._id || NO_MATCH;
    }
    if (industry) {
      const ind = await Industry.findOne({ slug: industry }).select('_id');
      filter.industry = ind?._id || NO_MATCH;
    }
    if (tag) {
      const tech = await Technology.findOne({ slug: tag }).select('_id');
      filter.technologies = tech?._id || NO_MATCH;
    }
    if (featured === 'true') filter.featured = true;

    // Search — small result sets expected, so plain text-score ranking without cursoring
    if (search?.trim()) {
      filter.$text = { $search: search.trim() };
      const projects = await PortfolioProject.find(filter, { score: { $meta: 'textScore' } })
        .populate(PROJECT_POPULATE)
        .sort(sort === 'popular' ? { viewCount: -1 } : { score: { $meta: 'textScore' } })
        .limit(limit)
        .select(LIST_EXCLUDE)
        .lean();
      return res.json({ projects: projects.map((p) => redactConfidential(withResponsiveMedia(p))), nextCursor: null });
    }

    // "Most viewed" doesn't cursor on createdAt, so it gets its own simple,
    // uncursored branch — consistent with the search branch above rather
    // than trying to force viewCount into the default cursor shape.
    if (sort === 'popular') {
      const projects = await PortfolioProject.find(filter).populate(PROJECT_POPULATE).sort({ viewCount: -1, _id: -1 }).limit(limit).select(LIST_EXCLUDE).lean();
      return res.json({ projects: projects.map((p) => redactConfidential(withResponsiveMedia(p))), nextCursor: null });
    }

    // sort=oldest is a visitor-chosen alternate view — pure date order,
    // deliberately bypassing manual Display Order (same as sort=featured/
    // popular already bypass the default ordering entirely).
    if (sort === 'oldest') {
      const cursor = decodeOldestCursor(req.query.cursor);
      if (cursor) {
        filter.$or = [
          { createdAt: { $gt: cursor.createdAt } },
          { createdAt: cursor.createdAt, _id: { $gt: cursor._id } },
        ];
      }
      const projects = await PortfolioProject.find(filter).populate(PROJECT_POPULATE).sort(OLDEST_SORT).limit(limit + 1).select(LIST_EXCLUDE).lean();
      const hasMore = projects.length > limit;
      const page = hasMore ? projects.slice(0, limit) : projects;
      const nextCursor = hasMore ? encodeOldestCursor(page[page.length - 1]) : null;
      return res.json({ projects: page.map((p) => redactConfidential(withResponsiveMedia(p))), nextCursor });
    }

    if (sort === 'featured') {
      filter.featured = true;
    }

    // Default listing — Display Order ASC, Featured DESC tiebreak, Publish
    // Date DESC (see IMPLEMENTATION_PLAN.md Part 2). sort=featured shares
    // this branch (just with `filter.featured = true` added above), so a
    // featured-only view still respects manual ranking within itself.
    const cursor = decodeCursor(req.query.cursor);
    if (cursor) {
      filter.$or = [
        { displayOrder: { $gt: cursor.displayOrder } },
        { displayOrder: cursor.displayOrder, featured: { $lt: cursor.featured } },
        { displayOrder: cursor.displayOrder, featured: cursor.featured, publishedAt: { $lt: cursor.publishedAt } },
        { displayOrder: cursor.displayOrder, featured: cursor.featured, publishedAt: cursor.publishedAt, _id: { $lt: cursor._id } },
      ];
    }

    const projects = await PortfolioProject.find(filter)
      .populate(PROJECT_POPULATE)
      .sort(CURSOR_SORT)
      .limit(limit + 1)
      .select(LIST_EXCLUDE)
      .lean();

    const hasMore = projects.length > limit;
    const page = hasMore ? projects.slice(0, limit) : projects;
    const nextCursor = hasMore ? encodeCursor(page[page.length - 1]) : null;

    res.json({ projects: page.map((p) => redactConfidential(withResponsiveMedia(p))), nextCursor });
  } catch (err) {
    next(err);
  }
});

// GET /api/portfolio/meta — categories/industries/technologies actually in use, for filter chips
router.get('/meta', async (req, res, next) => {
  try {
    const baseFilter = { status: 'published', private: { $ne: true } };
    const [categoryIds, industryIds, technologyIds, presentationCounts, deliveryCounts] = await Promise.all([
      PortfolioProject.distinct('category', baseFilter),
      PortfolioProject.distinct('industry', { ...baseFilter, industry: { $ne: null } }),
      PortfolioProject.distinct('technologies', baseFilter),
      PortfolioProject.aggregate([{ $match: baseFilter }, { $group: { _id: '$presentationMode', count: { $sum: 1 } } }]),
      PortfolioProject.aggregate([{ $match: baseFilter }, { $group: { _id: '$deliveryStatus', count: { $sum: 1 } } }]),
    ]);
    const [categories, industries, technologies] = await Promise.all([
      Category.find({ _id: { $in: categoryIds } }).select('name nameAr slug icon').sort({ order: 1, name: 1 }),
      Industry.find({ _id: { $in: industryIds } }).select('name nameAr slug icon').sort({ order: 1, name: 1 }),
      Technology.find({ _id: { $in: technologyIds } }).select('name slug icon color').sort({ name: 1 }),
    ]);
    // Counts drive whether the public "Visual Showcases" / "Concepts" filter
    // chips render at all — a site with zero showcases/concepts published
    // shouldn't show a filter that always returns empty.
    const presentationModes = { caseStudy: 0, showcase: 0 };
    presentationCounts.forEach((c) => { if (c._id) presentationModes[c._id] = c.count; });
    const deliveryStatuses = { live: 0, concept: 0, archived: 0 };
    deliveryCounts.forEach((c) => { if (c._id) deliveryStatuses[c._id] = c.count; });
    res.json({ categories, industries, technologies, presentationModes, deliveryStatuses });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES — registered before the public /:idOrSlug catch-all
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/portfolio/admin — full list, all statuses, filters + search + pagination
router.get('/admin', protect, adminOnly, async (req, res, next) => {
  try {
    const { status, category, search, presentationMode } = req.query;
    const page  = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const filter = {};

    if (status && status !== 'all') filter.status = status;
    // Admin filter sends the Category _id directly (picked from the library
    // dropdown), unlike the public route's slug-based filter.
    if (category && category !== 'All') filter.category = category;
    if (presentationMode && ['caseStudy', 'showcase'].includes(presentationMode)) filter.presentationMode = presentationMode;
    if (search?.trim()) filter.$text = { $search: search.trim() };

    const [projects, total, counts] = await Promise.all([
      PortfolioProject.find(filter)
        .populate(PROJECT_POPULATE)
        .sort(search?.trim() ? { score: { $meta: 'textScore' } } : { displayOrder: 1, featured: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select(LIST_EXCLUDE)
        .lean(),
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
    next(err);
  }
});

// GET /api/portfolio/admin/:id — single project, any status (for the edit wizard)
router.get('/admin/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const project = await PortfolioProject.findById(req.params.id).populate(PROJECT_POPULATE);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project: withResponsiveMedia(project) });
  } catch (err) {
    next(err);
  }
});

// POST /api/portfolio/admin/media — upload one image/video/audio, returns a ready media asset
router.post('/admin/media', protect, adminOnly, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const asset = await uploadPortfolioMedia(req.file.buffer, req.file.originalname, req.file.mimetype);
    audit({ req, action: 'portfolio.media_upload', entityType: 'PortfolioProject', metadata: { publicId: asset.publicId, kind: asset.kind } });
    res.status(201).json({ asset });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/portfolio/admin/media — remove an (orphaned or replaced) uploaded asset
router.delete('/admin/media', protect, adminOnly, async (req, res, next) => {
  try {
    const { publicId, provider } = req.body;
    if (!publicId) return res.status(400).json({ error: 'publicId required' });
    await deletePortfolioImage({ publicId, provider });
    audit({ req, action: 'portfolio.media_delete', entityType: 'PortfolioProject', metadata: { publicId } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/portfolio/admin/import/resolve — dry-run relation resolution for
// the JSON Import flow (see client/src/utils/portfolioPortable.js and
// docs/PORTFOLIO_PORTABLE_FORMAT.md). Read-only: matches portable relation
// descriptors (slug, then unambiguous name/nameAr) against the real content
// libraries and reports what resolved/is ambiguous/is unresolved — it never
// writes anything, never creates a library record, and is called from the
// import review step BEFORE the admin applies anything to the form.
router.post('/admin/import/resolve', protect, adminOnly, async (req, res, next) => {
  try {
    const { format, schemaVersion, relations } = req.body || {};
    assertSafePayloadSize(req.body);
    assertSafeShape(req.body);

    if (format !== PORTABLE_FORMAT_ID) {
      return res.status(400).json({ error: `Unrecognized file format${format ? `: "${format}"` : ''}.`, code: 'INVALID_FORMAT' });
    }
    if (schemaVersion !== PORTABLE_SCHEMA_VERSION) {
      return res.status(400).json({
        error: `Unsupported schema version ${schemaVersion} — this server supports version ${PORTABLE_SCHEMA_VERSION}.`,
        code: 'UNSUPPORTED_SCHEMA_VERSION',
      });
    }

    const resolved = await resolveRelations(
      {
        category:     { Model: Category },
        industry:     { Model: Industry },
        projectType:  { Model: ProjectType },
        client:       { Model: Client },
        services:     { Model: Service, multiple: true },
        technologies: { Model: Technology, multiple: true },
        projectTags:  { Model: Tag, multiple: true },
        team:         { Model: TeamMember, multiple: true },
      },
      relations || {}
    );

    res.json({ resolved, schemaVersion: PORTABLE_SCHEMA_VERSION, format: PORTABLE_FORMAT_ID });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message, code: err.code });
    next(err);
  }
});

// POST /api/portfolio/admin — create
// Deliberately lightweight: a title (and, from Mongoose's own schema, a
// category) is all that's required to bring a draft into existence — this
// is the endpoint the wizard's autosave calls the moment those two fields
// are filled in, well before the rest of the case study is written.
router.post('/admin', protect, adminOnly, async (req, res, next) => {
  try {
    const body = pickWritable(req.body);
    if (!body.title?.trim()) return res.status(400).json({ error: 'Title is required' });
    try { applyDisplayOrderCoercion(body); } catch (e) { return res.status(400).json({ error: e.message }); }
    applyHighlightsSanitization(body);

    const slug = await ensureUniqueSlug(body.title);
    const status = ['draft', 'published', 'archived'].includes(body.status) ? body.status : 'draft';

    if (status === 'published') {
      const missing = assertPublishable(body);
      if (missing.length) return res.status(400).json(publishValidationError(missing));
    }

    const project = await PortfolioProject.create({
      ...body,
      slug,
      status,
      publishedAt: status === 'published' ? new Date() : undefined,
    });
    await project.populate(PROJECT_POPULATE);
    bumpLibraryUsage(project);

    audit({ req, action: 'portfolio.create', entityType: 'PortfolioProject', entityId: project._id, after: { title: project.title, status: project.status } });
    res.status(201).json({ project: withResponsiveMedia(project) });
  } catch (err) {
    next(err);
  }
});

// PUT /api/portfolio/admin/:id — update
router.put('/admin/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const project = await PortfolioProject.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const before = { title: project.title, status: project.status, featured: project.featured };
    const body = pickWritable(req.body);
    try { applyDisplayOrderCoercion(body); } catch (e) { return res.status(400).json({ error: e.message }); }
    applyHighlightsSanitization(body);

    if (body.title && body.title !== project.title) {
      body.slug = await ensureUniqueSlug(body.title, project._id);
    }

    const wasPublished = project.status === 'published';
    Object.assign(project, body);

    if (project.status === 'published') {
      const missing = assertPublishable(project);
      if (missing.length) return res.status(400).json(publishValidationError(missing));
      if (!wasPublished) project.publishedAt = new Date();
    }

    await project.save();
    await project.populate(PROJECT_POPULATE);
    bumpLibraryUsage(project);

    audit({ req, action: 'portfolio.update', entityType: 'PortfolioProject', entityId: project._id, before, after: { title: project.title, status: project.status, featured: project.featured } });
    res.json({ project: withResponsiveMedia(project) });
  } catch (err) {
    next(err);
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
router.post('/admin/:id/duplicate', protect, adminOnly, async (req, res, next) => {
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
      // A duplicate is a new, undecided draft — it shouldn't silently
      // inherit the source's manual rank (imagine duplicating the project
      // ranked #1 and ending up with two #1s with no indication why).
      displayOrder: UNRANKED_DISPLAY_ORDER,
      viewCount: 0,
      publishedAt: undefined,
    });
    await clone.populate(PROJECT_POPULATE);
    // The clone re-references the same library entries (client, team,
    // technologies, ...) as the source, not copies — so it's a genuine new
    // usage of each, same as any other save.
    bumpLibraryUsage(clone);

    audit({ req, action: 'portfolio.duplicate', entityType: 'PortfolioProject', entityId: clone._id, metadata: { sourceId: source._id } });
    res.status(201).json({ project: withResponsiveMedia(clone) });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/portfolio/admin/:id/status — draft / publish / archive
router.patch('/admin/:id/status', protect, adminOnly, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['draft', 'published', 'archived'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const project = await PortfolioProject.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (status === 'published') {
      const missing = assertPublishable(project);
      if (missing.length) return res.status(400).json(publishValidationError(missing));
    }

    const before = project.status;
    project.status = status;
    if (status === 'published' && !project.publishedAt) project.publishedAt = new Date();
    await project.save();
    await project.populate(PROJECT_POPULATE);

    audit({ req, action: 'portfolio.status_change', entityType: 'PortfolioProject', entityId: project._id, before: { status: before }, after: { status } });
    res.json({ project: withResponsiveMedia(project) });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/portfolio/admin/reorder — persist new drag order (small,
// single-page, unfiltered catalogs only — see AdminPortfolio.jsx's
// `canReorder`; the Display Order field in the wizard is the reliable
// mechanism at any catalog size).
router.patch('/admin/reorder', protect, adminOnly, async (req, res, next) => {
  try {
    const { items } = req.body; // [{ id, order }] — dense 0-based ranks for every visible row
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });

    await PortfolioProject.bulkWrite(
      items.map(({ id, order }) => ({
        updateOne: { filter: { _id: id }, update: { $set: { displayOrder: order } } },
      }))
    );

    audit({ req, action: 'portfolio.reorder', entityType: 'PortfolioProject', metadata: { count: items.length } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/portfolio/admin/bulk — bulk publish / archive / draft / delete
router.post('/admin/bulk', protect, adminOnly, async (req, res, next) => {
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
      const projects = await PortfolioProject.find({ _id: { $in: ids } }).select('title category description coverImage presentationMode projectType');
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
    next(err);
  }
});

// DELETE /api/portfolio/admin/:id
router.delete('/admin/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const project = await PortfolioProject.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    await Promise.all(collectMediaAssets(project).map(deletePortfolioImage));
    await project.deleteOne();

    audit({ req, action: 'portfolio.delete', entityType: 'PortfolioProject', entityId: project._id, before: { title: project.title } });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC — single project + related (registered last: catch-all params)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/portfolio/:idOrSlug
router.get('/:idOrSlug', async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const query = mongoose.isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
    const project = await PortfolioProject.findOne({ ...query, status: 'published', private: { $ne: true } }).populate(PROJECT_POPULATE);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    PortfolioProject.updateOne({ _id: project._id }, { $inc: { viewCount: 1 } }).catch(() => {});

    res.json({ project: redactConfidential(withResponsiveMedia(project)) });
  } catch (err) {
    next(err);
  }
});

// GET /api/portfolio/:id/related
router.get('/:id/related', async (req, res, next) => {
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
      }).populate(PROJECT_POPULATE).select(LIST_EXCLUDE).limit(limit);
    } else {
      related = await PortfolioProject.find({
        _id: { $ne: project._id },
        status: 'published',
        private: { $ne: true },
        $or: [{ category: project.category }, { industry: project.industry }],
      })
        .populate(PROJECT_POPULATE)
        .sort({ displayOrder: 1, featured: -1, createdAt: -1 })
        .limit(limit)
        .select(LIST_EXCLUDE);
    }

    res.json({ projects: related.map((p) => redactConfidential(withResponsiveMedia(p))) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
