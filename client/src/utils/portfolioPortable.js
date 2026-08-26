/**
 * Portfolio "portable JSON" data-portability system — shared by both the
 * Full Case Study wizard and the Quick Showcase editor's Import/Export
 * actions (see PortfolioIOMenu.jsx / PortfolioImportModal.jsx). One
 * implementation instead of duplicating serialize/parse/merge logic per
 * editor — see AGENTS.md's "avoid duplicate implementations."
 *
 * Full format documentation + worked examples: docs/PORTFOLIO_PORTABLE_FORMAT.md
 *
 * Design summary:
 *   - Library relations (category/industry/projectType/client/services/
 *     technologies/projectTags/team) are exported as portable DESCRIPTORS
 *     ({ slug, name, nameAr }), never as MongoDB ObjectIds — an export must
 *     be re-importable into a different environment/database.
 *   - No media binaries, signed URLs, or upload-provider internals are ever
 *     exported — a `mediaManifest` instead lists what slots had media, as a
 *     manual-upload checklist.
 *   - Testimonials/Awards are exported as read-only reference text (they
 *     don't have the simple name/slug identity every other library here
 *     does) — never auto-resolved or auto-created on import.
 *   - `relatedProjectsOverride` is intentionally NOT part of the portable
 *     format — it references other portfolio projects specifically, which
 *     is out of scope for a single-project portability file; re-set it
 *     manually in the SEO & Publish tab after import if needed.
 */

export const PORTABLE_FORMAT = 'yansy-portfolio-project';
export const PORTABLE_SCHEMA_VERSION = 1;

// Mirrors server/utils/portfolioPortable.js's guards — the server is the
// authority (never trusts the client validated anything), but validating
// here too means a bad/hostile file is rejected instantly, with a specific
// message, before any network round-trip.
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_DEPTH = 8;
const MAX_ARRAY_LEN = 200;
const MAX_STRING_LEN = 2000;
const MAX_JSON_BYTES = 2 * 1024 * 1024;

export class PortableFileError extends Error {
  constructor(message, code = 'INVALID_FILE') {
    super(message);
    this.code = code;
  }
}

// ── Serialize: admin form state -> portable JSON ────────────────────────────

const descriptor = (obj) => (obj && (obj.slug || obj.name || obj.nameAr) ? { slug: obj.slug || undefined, name: obj.name || undefined, nameAr: obj.nameAr || undefined } : null);
const descriptorList = (arr) => (arr || []).filter(Boolean).map(descriptor).filter(Boolean);

const teamDescriptor = (credit) => (credit?.member ? {
  ...descriptor(credit.member),
  roleOverride: credit.roleOverride || undefined,
  roleArOverride: credit.roleArOverride || undefined,
} : null);

// Media assets are never exported — only enough safe metadata to rebuild a
// manual-upload checklist after import. `order` is the array position for
// gallery/proofScreenshots so the admin knows what order to re-upload in.
const manifestEntry = (field, asset, order) => {
  if (!asset?.url) return null;
  return {
    field,
    order,
    kind: asset.kind || 'image',
    alt: asset.alt || undefined,
    altAr: asset.altAr || undefined,
    caption: asset.caption || undefined,
    captionAr: asset.captionAr || undefined,
  };
};

const buildMediaManifest = (f) => {
  const manifest = [];
  const push = (entry) => { if (entry) manifest.push(entry); };
  push(manifestEntry('coverImage', f.coverImage));
  push(manifestEntry('coverVideo', f.coverVideo));
  (f.gallery || []).forEach((a, i) => push(manifestEntry('gallery', a, i)));
  (f.proofScreenshots || []).forEach((a, i) => push(manifestEntry('proofScreenshots', a, i)));
  (f.blocks || []).forEach((b, i) => {
    push(manifestEntry(`blocks[${i}].asset`, b.asset));
    push(manifestEntry(`blocks[${i}].before`, b.before));
    push(manifestEntry(`blocks[${i}].after`, b.after));
    push(manifestEntry(`blocks[${i}].poster`, b.poster));
    (b.images || []).forEach((a, j) => push(manifestEntry(`blocks[${i}].images`, a, j)));
  });
  return manifest;
};

// Content blocks carry rich non-media structure worth preserving
// (heading/paragraph text, captions, embed URLs, frame/layout choices) —
// only the actual uploaded-asset sub-fields are stripped (those are covered
// by mediaManifest instead).
const stripBlockMedia = (b) => ({
  type: b.type,
  text: b.text || undefined, textAr: b.textAr || undefined,
  level: b.level, frame: b.frame, layout: b.layout,
  author: b.author || undefined, role: b.role || undefined,
  stats: (b.stats || []).length ? b.stats : undefined,
  beforeLabel: b.beforeLabel || undefined, afterLabel: b.afterLabel || undefined,
  embedUrl: b.embedUrl || undefined, url: b.url || undefined, title: b.title || undefined,
  caption: b.caption || undefined, captionAr: b.captionAr || undefined,
});

const compact = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== '' && v !== null));

/**
 * Builds the full portable envelope from the CURRENT (possibly unsaved)
 * admin form state — this is why export is a pure client-side function
 * rather than a server round-trip against the last-saved document.
 */
export const serializeProjectToPortable = (form) => {
  const project = compact({
    title: form.title || undefined,
    titleAr: form.titleAr || undefined,
    tagline: form.tagline || undefined,
    taglineAr: form.taglineAr || undefined,
    description: form.description || undefined,
    descriptionAr: form.descriptionAr || undefined,

    presentationMode: form.presentationMode || 'caseStudy',
    deliveryStatus: form.deliveryStatus || undefined,
    projectOrigin: form.projectOrigin || undefined,

    category: descriptor(form.category),
    industry: descriptor(form.industry),
    projectType: descriptor(form.projectType),
    client: descriptor(form.client),
    location: form.location || undefined,
    locationAr: form.locationAr || undefined,
    confidential: form.confidential || undefined,
    private: form.private || undefined,

    myRole: form.myRole || undefined, myRoleAr: form.myRoleAr || undefined,
    goals: form.goals || undefined, goalsAr: form.goalsAr || undefined,
    painPoints: form.painPoints || undefined, painPointsAr: form.painPointsAr || undefined,
    challenge: form.challenge || undefined, challengeAr: form.challengeAr || undefined,
    solution: form.solution || undefined, solutionAr: form.solutionAr || undefined,
    process: form.process || undefined, processAr: form.processAr || undefined,
    results: form.results || undefined, resultsAr: form.resultsAr || undefined,

    metrics: (form.metrics || []).length ? form.metrics : undefined,
    performanceMetrics: (form.performanceMetrics || []).length ? form.performanceMetrics : undefined,
    faqs: (form.faqs || []).length ? form.faqs : undefined,
    highlights: (form.highlights || []).filter((h) => h?.text || h?.textAr).length
      ? form.highlights.filter((h) => h?.text || h?.textAr).slice(0, 3)
      : undefined,

    services: descriptorList(form.services).length ? descriptorList(form.services) : undefined,
    technologies: descriptorList(form.technologies).length ? descriptorList(form.technologies) : undefined,
    projectTags: descriptorList(form.projectTags).length ? descriptorList(form.projectTags) : undefined,
    team: (form.team || []).map(teamDescriptor).filter(Boolean).length ? form.team.map(teamDescriptor).filter(Boolean) : undefined,

    // Read-only reference text — never auto-resolved on import (see doc
    // comment at the top of this file).
    testimonials: (form.testimonials || []).length
      ? form.testimonials.map((t) => compact({ author: t.author, authorAr: t.authorAr, role: t.role, roleAr: t.roleAr, quote: t.quote, quoteAr: t.quoteAr }))
      : undefined,
    awards: (form.awards || []).length
      ? form.awards.map((a) => compact({ title: a.title, titleAr: a.titleAr, org: a.org, year: a.year }))
      : undefined,

    liveUrl: form.liveUrl || undefined,
    figmaUrl: form.figmaUrl || undefined,
    githubUrl: form.githubUrl || undefined,
    duration: form.duration || undefined,
    teamSize: form.teamSize || undefined,
    startDate: form.startDate || undefined,
    launchDate: form.launchDate || undefined,
    year: form.year || undefined,

    featured: form.featured || undefined,
    displayOrder: (form.displayOrder ?? null) !== null ? form.displayOrder : undefined,
    metaTitle: form.metaTitle || undefined,
    metaDescription: form.metaDescription || undefined,

    blocks: (form.blocks || []).length ? form.blocks.map(stripBlockMedia) : undefined,
  });

  const mediaManifest = buildMediaManifest(form);

  return {
    format: PORTABLE_FORMAT,
    schemaVersion: PORTABLE_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    project,
    ...(mediaManifest.length ? { mediaManifest } : {}),
  };
};

const slugifyLocal = (str) => (str || '').toString().trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

export const portableFilename = (form) => {
  const base = slugifyLocal(form.slug || form.title) || 'untitled-project';
  const year = form.year || new Date().getFullYear();
  return `yansy-portfolio-${base}-${year}.json`;
};

/** Triggers a browser download of the given form's portable export. */
export const downloadPortableJson = (form) => {
  const envelope = serializeProjectToPortable(form);
  const json = JSON.stringify(envelope, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = portableFilename(form);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return envelope;
};

export const buildPortableTemplate = (presentationMode = 'showcase') => ({
  format: PORTABLE_FORMAT,
  schemaVersion: PORTABLE_SCHEMA_VERSION,
  project: {
    title: '', titleAr: '', description: '', descriptionAr: '',
    presentationMode,
    deliveryStatus: 'live', projectOrigin: 'selfInitiated',
    highlights: [{ text: '', textAr: '' }, { text: '', textAr: '' }, { text: '', textAr: '' }],
    liveUrl: '', figmaUrl: '', githubUrl: '', year: new Date().getFullYear(),
    featured: false, metaTitle: '', metaDescription: '',
    ...(presentationMode === 'caseStudy' ? {
      tagline: '', taglineAr: '', myRole: '', myRoleAr: '', goals: '', goalsAr: '',
      challenge: '', challengeAr: '', solution: '', solutionAr: '', process: '', processAr: '', results: '', resultsAr: '',
      metrics: [], performanceMetrics: [], faqs: [], blocks: [],
    } : {}),
  },
  mediaManifest: [{ field: 'coverImage', kind: 'image', alt: '', altAr: '' }],
});

export const downloadPortableTemplate = (presentationMode = 'showcase') => {
  const json = JSON.stringify(buildPortableTemplate(presentationMode), null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `yansy-portfolio-${presentationMode === 'showcase' ? 'quick-showcase' : 'case-study'}-import-template-v${PORTABLE_SCHEMA_VERSION}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// ── Parse + validate an imported file ───────────────────────────────────────

const assertSafeShape = (value, depth = 0) => {
  if (depth > MAX_DEPTH) throw new PortableFileError('This file is nested too deeply to be a valid export.', 'TOO_DEEP');
  if (typeof value === 'string') {
    if (value.length > MAX_STRING_LEN) throw new PortableFileError('This file contains a field that is too long.', 'FIELD_TOO_LONG');
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_LEN) throw new PortableFileError('This file contains a list with too many items.', 'ARRAY_TOO_LARGE');
    value.forEach((v) => assertSafeShape(v, depth + 1));
    return;
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (DANGEROUS_KEYS.has(key)) throw new PortableFileError('This file contains a disallowed key and cannot be imported.', 'UNSAFE_KEY');
      assertSafeShape(value[key], depth + 1);
    }
  }
};

/**
 * Parses + validates raw file text into a portable envelope. Never mutates
 * any editor state — pure parse/validate only (see PortfolioImportModal.jsx
 * for why that separation matters: previewing an import must never trigger
 * autosave).
 */
export const parsePortableFile = (text) => {
  if (typeof text !== 'string') throw new PortableFileError('This file could not be read as text.', 'UNREADABLE_FILE');
  const bytes = new Blob([text]).size;
  if (bytes > MAX_JSON_BYTES) throw new PortableFileError('This file is too large to import.', 'TOO_LARGE');

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new PortableFileError('This file is not valid JSON.', 'MALFORMED_JSON');
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new PortableFileError('This file is not a valid portfolio export.', 'INVALID_SHAPE');
  }
  assertSafeShape(data);

  if (data.format !== PORTABLE_FORMAT) {
    throw new PortableFileError(`This file's format ("${data.format || 'unknown'}") is not a recognized YANSY portfolio export.`, 'INVALID_FORMAT');
  }
  if (typeof data.schemaVersion !== 'number') {
    throw new PortableFileError('This file is missing a schema version.', 'MISSING_SCHEMA_VERSION');
  }
  if (data.schemaVersion !== PORTABLE_SCHEMA_VERSION) {
    throw new PortableFileError(`This file uses schema version ${data.schemaVersion}, which this admin does not support (supported: ${PORTABLE_SCHEMA_VERSION}).`, 'UNSUPPORTED_SCHEMA_VERSION');
  }
  if (!data.project || typeof data.project !== 'object' || Array.isArray(data.project)) {
    throw new PortableFileError('This file has no project data.', 'MISSING_PROJECT');
  }

  return data;
};

// ── Review summary ──────────────────────────────────────────────────────────

const PRESENTATION_MODE_LABEL = { caseStudy: { en: 'Full Case Study', ar: 'دراسة حالة كاملة' }, showcase: { en: 'Quick Showcase', ar: 'عرض سريع' } };

const RELATION_FIELDS_SINGLE = ['category', 'industry', 'projectType', 'client'];
const RELATION_FIELDS_MULTI = ['services', 'technologies', 'projectTags', 'team'];

const NEVER_IMPORT_FIELDS = new Set([
  '_id', 'slug', 'status', 'publishedAt', 'viewCount', 'createdAt', 'updatedAt', '__v',
  'coverImage', 'coverVideo', 'gallery', 'proofScreenshots', 'testimonials', 'awards',
  'relatedProjectsOverride', 'presentationMode',
]);
const TEXT_FIELDS = new Set([
  'title', 'titleAr', 'tagline', 'taglineAr', 'description', 'descriptionAr',
  'location', 'locationAr', 'myRole', 'myRoleAr', 'goals', 'goalsAr',
  'painPoints', 'painPointsAr', 'challenge', 'challengeAr', 'solution', 'solutionAr',
  'process', 'processAr', 'results', 'resultsAr', 'duration', 'teamSize',
  'metaTitle', 'metaDescription',
]);
const URL_FIELDS = new Set(['liveUrl', 'figmaUrl', 'githubUrl']);
const DATE_FIELDS = new Set(['startDate', 'launchDate']);
const BOOLEAN_FIELDS = new Set(['confidential', 'private', 'featured']);
const ARRAY_FIELDS = new Set(['metrics', 'performanceMetrics', 'faqs', 'blocks']);
const DELIVERY_STATUSES = new Set(['live', 'concept', 'archived']);
const PROJECT_ORIGINS = new Set(['clientWork', 'selfInitiated', 'internalProduct', 'experimental']);
const BLOCK_TYPES = new Set(['heading', 'paragraph', 'image', 'gallery', 'quote', 'statRow', 'beforeAfter', 'video', 'embed', 'divider']);

const emptyValue = (v) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
const safeUrl = (value) => {
  try { const u = new URL(value); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; }
};

/**
 * Builds a field-level partial-import plan. Envelope/security errors remain
 * fatal in parsePortableFile; content errors are deliberately non-fatal and
 * become skipped rows so one bad URL/relation can never discard good copy.
 */
export const analyzePortableImport = (project, resolved = {}, existingForm = {}, strategy = 'fillEmpty') => {
  const normalized = {};
  const rows = [];
  const ready = (path, value, status = 'ready') => {
    normalized[path] = value;
    rows.push({ path, status, value });
  };
  const skip = (path, reason, status = 'skippedInvalid') => rows.push({ path, status, reason });
  const consider = (key, value) => {
    if (NEVER_IMPORT_FIELDS.has(key)) { skip(key, key === 'presentationMode' ? 'editorModeIsFixed' : 'protectedField', 'skippedMode'); return; }
    if (strategy === 'fillEmpty' && !emptyValue(existingForm[key])) { rows.push({ path: key, status: 'preserved', reason: 'existingValue' }); return; }
    if (TEXT_FIELDS.has(key)) {
      if (typeof value !== 'string') return skip(key, 'expectedText');
      if (!value.trim()) return skip(key, 'emptyItem');
      return ready(key, value.trim());
    }
    if (URL_FIELDS.has(key)) {
      if (value === '') return skip(key, 'emptyItem');
      if (typeof value !== 'string' || !safeUrl(value)) return skip(key, 'invalidUrl');
      return ready(key, value.trim());
    }
    if (DATE_FIELDS.has(key)) {
      if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) return skip(key, 'invalidDate');
      return ready(key, value);
    }
    if (BOOLEAN_FIELDS.has(key)) {
      if (typeof value !== 'boolean') return skip(key, 'expectedBoolean');
      return ready(key, value);
    }
    if (key === 'deliveryStatus') {
      if (!DELIVERY_STATUSES.has(value)) return skip(key, 'invalidEnum');
      return ready(key, value);
    }
    if (key === 'projectOrigin') {
      if (!PROJECT_ORIGINS.has(value)) return skip(key, 'invalidEnum');
      return ready(key, value);
    }
    if (key === 'year') {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 1900 || n > 2100) return skip(key, 'invalidYear');
      return ready(key, n);
    }
    if (key === 'displayOrder') {
      const n = Number(value);
      if (!Number.isInteger(n)) return skip(key, 'expectedInteger');
      return ready(key, n);
    }
    if (key === 'highlights') {
      if (!Array.isArray(value)) return skip(key, 'expectedArray');
      const valid = [];
      value.forEach((item, index) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return skip(`highlights[${index}]`, 'invalidItem');
        const text = typeof item.text === 'string' ? item.text.trim() : '';
        const textAr = typeof item.textAr === 'string' ? item.textAr.trim() : '';
        if (!text && !textAr) return skip(`highlights[${index}]`, 'emptyItem');
        if (text.length > 140 || textAr.length > 160) return skip(`highlights[${index}]`, 'textTooLong');
        if (valid.length >= 3) return skip(`highlights[${index}]`, 'maximumThree');
        valid.push({ text, textAr });
        rows.push({ path: `highlights[${index}]`, status: 'ready', value: { text, textAr } });
      });
      if (valid.length) normalized.highlights = valid;
      return;
    }
    if (ARRAY_FIELDS.has(key)) {
      if (!Array.isArray(value)) return skip(key, 'expectedArray');
      const valid = value.filter((item, index) => {
        const objectItem = item && typeof item === 'object' && !Array.isArray(item);
        const ok = objectItem && (
          (key === 'blocks' && BLOCK_TYPES.has(item.type)) ||
          (key === 'metrics' && typeof item.label === 'string' && typeof item.value === 'string') ||
          (key === 'performanceMetrics' && typeof item.label === 'string' && typeof item.before === 'string' && typeof item.after === 'string') ||
          (key === 'faqs' && typeof item.question === 'string' && typeof item.answer === 'string')
        );
        if (!ok) skip(`${key}[${index}]`, key === 'blocks' ? 'unsupportedBlock' : 'invalidItem');
        else rows.push({ path: `${key}[${index}]`, status: 'ready', value: item });
        return ok;
      });
      if (valid.length) normalized[key] = key === 'blocks'
        ? valid.map((b) => ({ ...b, asset: null, images: [], before: null, after: null, poster: null }))
        : valid;
      return;
    }
    skip(key, 'unknownField', 'skippedUnknown');
  };

  Object.entries(project || {}).forEach(([key, value]) => {
    if (RELATION_FIELDS_SINGLE.includes(key) || RELATION_FIELDS_MULTI.includes(key)) return;
    consider(key, value);
  });

  RELATION_FIELDS_SINGLE.forEach((field) => {
    if (project?.[field] == null) return;
    if (strategy === 'fillEmpty' && !emptyValue(existingForm[field])) return rows.push({ path: field, status: 'preserved', reason: 'existingValue' });
    const result = resolved?.[field];
    if (result?.status === 'resolved') ready(field, result.item, 'resolved');
    else skip(field, result?.status === 'ambiguous' ? 'ambiguousRelation' : 'unresolvedRelation', result?.status === 'ambiguous' ? 'skippedAmbiguous' : 'skippedUnresolved');
  });
  RELATION_FIELDS_MULTI.forEach((field) => {
    if (!Array.isArray(project?.[field])) return;
    if (strategy === 'fillEmpty' && !emptyValue(existingForm[field])) return rows.push({ path: field, status: 'preserved', reason: 'existingValue' });
    const values = [];
    (resolved?.[field] || []).forEach((result, index) => {
      if (result.status === 'resolved') {
        const value = field === 'team' ? { member: result.item, roleOverride: result.requested?.roleOverride || '', roleArOverride: result.requested?.roleArOverride || '' } : result.item;
        values.push(value); rows.push({ path: `${field}[${index}]`, status: 'resolved', value });
      } else skip(`${field}[${index}]`, result.status === 'ambiguous' ? 'ambiguousRelation' : 'unresolvedRelation', result.status === 'ambiguous' ? 'skippedAmbiguous' : 'skippedUnresolved');
    });
    if (values.length) normalized[field] = values;
  });

  const counts = rows.reduce((acc, row) => {
    if (row.status === 'ready' || row.status === 'resolved') acc.ready += 1;
    else if (row.status === 'preserved') acc.preserved += 1;
    else acc.skipped += 1;
    return acc;
  }, { ready: 0, skipped: 0, preserved: 0 });
  return { normalized, rows, counts };
};

export const buildReviewSummary = (envelope, isRTL) => {
  const { project } = envelope;
  const populatedFields = Object.keys(project).filter((k) => {
    const v = project[k];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  });
  return {
    title: project.title || (isRTL ? '(بدون عنوان)' : '(untitled)'),
    presentationMode: project.presentationMode || 'caseStudy',
    presentationModeLabel: isRTL ? PRESENTATION_MODE_LABEL[project.presentationMode]?.ar : PRESENTATION_MODE_LABEL[project.presentationMode]?.en,
    schemaVersion: envelope.schemaVersion,
    exportedAt: envelope.exportedAt,
    populatedFieldCount: populatedFields.length,
    mediaManifestCount: (envelope.mediaManifest || []).length,
    hasTestimonials: (project.testimonials || []).length > 0,
    hasAwards: (project.awards || []).length > 0,
  };
};

// Pulls just the relation descriptors out of a parsed portable project, in
// the exact shape POST /portfolio/admin/import/resolve expects — kept here
// (not inline in the import modal) so the request shape and the response
// shaping below (summarizeResolution/mergeIntoForm) stay obviously in sync.
export const extractRelationsForResolve = (project) => ({
  category: project.category || null,
  industry: project.industry || null,
  projectType: project.projectType || null,
  client: project.client || null,
  services: project.services || [],
  technologies: project.technologies || [],
  projectTags: project.projectTags || [],
  team: project.team || [],
});

// ── Relation resolution result shaping ──────────────────────────────────────
// Turns the server's { resolved: { field: {status, item, requested} } }
// response into UI-friendly resolved/unresolved/ambiguous buckets, and
// reports whether the one REQUIRED relation (category — the only relation
// the schema itself requires) is blocking.
export const summarizeResolution = (project, resolved) => {
  const rows = [];
  RELATION_FIELDS_SINGLE.forEach((field) => {
    const r = resolved?.[field];
    if (!r || r.status === 'empty') return;
    rows.push({ field, multiple: false, ...r });
  });
  RELATION_FIELDS_MULTI.forEach((field) => {
    const list = resolved?.[field] || [];
    list.forEach((r, i) => rows.push({ field, multiple: true, index: i, ...r }));
  });

  // Import is intentionally partial: even Category is non-blocking here.
  // Publish readiness remains responsible for requiring a real Category.
  const unresolvedRequired = false;
  const unresolvedOptional = rows.filter((r) => r.field !== 'category' && r.status !== 'resolved');
  const ambiguous = rows.filter((r) => r.status === 'ambiguous');

  return { rows, unresolvedRequired, unresolvedOptional, ambiguous, canApplyWithoutAck: unresolvedOptional.length === 0 && ambiguous.length === 0 };
};

// ── Merge into the live editor form ─────────────────────────────────────────

/**
 * Produces the NEXT form object from ONE resolved import — never mutates
 * `existingForm`, and the caller applies the result with a single setForm()
 * call so applying an import is one coherent state transition (see
 * PortfolioImportModal.jsx).
 *
 * `strategy`: 'fillEmpty' (default, safer — only fills currently-empty
 * fields) | 'replace' (overwrites every textual/structured field the import
 * provides; media and the never-import fields above are still untouched).
 *
 * `resolvedRelations`: the resolved library objects keyed by field name
 * (single object or array), already resolved via the /import/resolve
 * endpoint — unresolved relations are simply skipped (left at whatever the
 * merge strategy would otherwise produce for an absent value).
 */
export const mergeIntoForm = (existingForm, project, resolvedRelations, strategy = 'fillEmpty') => {
  const plan = analyzePortableImport(project, resolvedRelations, existingForm, strategy);
  return { ...existingForm, ...plan.normalized };
};
