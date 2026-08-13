'use strict';
const multer = require('multer');
const mongoose = require('mongoose');
const Proposal = require('../../models/proposals/Proposal');
const mediaService = require('../../media/media.service');
const gridfsRepository = require('../../media/gridfsRepository');
const { getMedia } = require('../../media/media.controller');
const { assertSize } = require('../../media/mediaValidators');
const { HTML_MIMES, HTML_MAX_BYTES } = require('../../media/mediaConstants');
const { sanitizeHtml, inspectWarnings } = require('../../media/htmlSanitizer');
const { snapshotVersion } = require('./versionHelpers');
const { audit } = require('../../utils/auditLogger');

// Same origin allow-list the app's CORS config trusts (see server.js
// ALLOWED_ORIGINS) — reused here as the `frame-ancestors` allow-list so this
// route only ever relaxes framing for our *own* frontend, never arbitrary
// third-party sites. In dev, Vite's port isn't fixed (5173 is often already
// taken by another running instance and it silently picks 5174/5175/...),
// so — mirroring corsOptions' own "allow any origin in development" rule
// right below it in server.js — this allows any localhost port instead of
// hardcoding one, rather than making the preview flaky depending on which
// port Vite happened to grab.
const FRAME_ANCESTOR_ORIGINS = process.env.NODE_ENV === 'production'
  ? (process.env.CLIENT_URL || 'https://yansytech.com').split(',').map((s) => s.trim()).filter(Boolean)
  : ['http://localhost:*', 'http://127.0.0.1:*'];

/**
 * "Import HTML Proposal" — upload, sanitize, and store an already-designed
 * standalone HTML document via the app's existing media pipeline
 * (server/media/media.service.js: same GridFS bucket, same content-hash
 * dedupe, same public streaming route `/api/media/:id` every other
 * uploaded asset already uses). No new storage architecture, no new
 * streaming route — see the CLAUDE.md instruction this feature was built
 * against: "inspect existing infra first".
 */

// Multer only gates the obvious case (file extension) — the real content
// check is sanitizeHtml()'s structural test below. HTML has no fixed
// binary signature the way images/PDFs do, same reasoning media/svgSanitizer.js
// already applies to SVG uploads elsewhere in this app.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: HTML_MAX_BYTES },
  fileFilter: (req, file, cb) => {
    const ext = (file.originalname.split('.').pop() || '').toLowerCase();
    if (!['html', 'htm'].includes(ext)) {
      return cb(new Error('Only .html or .htm files are accepted.'));
    }
    cb(null, true);
  },
}).single('html');

/**
 * Validates, sanitizes, and stores one uploaded HTML document. Returns the
 * `htmlAsset` shape stored on Proposal.htmlAsset — never the raw content
 * itself, and never a string blob written directly into the Proposal
 * document (see server/models/proposals/Proposal.js htmlAssetSchema).
 */
const processAndStoreHtml = async (file, { isRTL = true } = {}) => {
  assertSize(file.buffer, HTML_MAX_BYTES);

  // Throws a 400 if the buffer doesn't structurally look like an HTML
  // document — the one hard content gate (no magic-byte signature to check
  // first, unlike images/PDFs). Also strips the handful of dangerous
  // constructs that fight the iframe sandbox rather than relying on it
  // alone (see media/htmlSanitizer.js for the full reasoning).
  const safeBuffer = sanitizeHtml(file.buffer);
  const warnings = inspectWarnings(safeBuffer.toString('utf8'), isRTL);

  const asset = await mediaService.uploadMedia(safeBuffer, file.originalname, 'text/html', {
    allowedMimes: HTML_MIMES,
    maxSizeBytes: HTML_MAX_BYTES,
  });

  return {
    storageType: 'gridfs',
    fileId: asset.publicId,
    // NOT the generic /api/media/:id URL (asset.url) — that route inherits
    // the app-wide helmet X-Frame-Options: SAMEORIGIN + CSP frame-ancestors
    // 'self', which is correct for every other asset type but blocks this
    // one case, since it needs to render inside <iframe sandbox> in
    // ImportedHTMLViewer.jsx and the API is a different origin from the
    // frontend in both dev (different port) and prod (api.yansytech.com vs
    // yansytech.com). See serveHtmlAsset() below.
    url: htmlAssetUrl(asset.publicId),
    originalName: file.originalname,
    size: safeBuffer.length,
    mimeType: 'text/html',
    uploadedAt: new Date(),
    warnings,
  };
};

// Single source of truth for "how do you fetch this HTML asset for
// rendering" — used by processAndStoreHtml (pre-save wizard preview) and
// mirrored by proposalController.getById / publicProposalController for
// already-saved proposals, so admin and public always resolve the exact
// same URL scheme.
const htmlAssetUrl = (fileId) => `/api/proposals/public/html/${fileId}`;
exports.htmlAssetUrl = htmlAssetUrl;

// ── POST /api/proposals/import/upload ──────────────────────────────────
// Standalone upload — not yet attached to any Proposal document. The
// import wizard holds the returned `htmlAsset` in local state and sends it
// along with client/project metadata on Save Draft / Publish (the existing
// POST /api/proposals), matching the "drop → preview → client info →
// publish" flow instead of forcing metadata entry before the admin has
// even seen the file.
// `upload` is invoked manually with a callback (not mounted as router
// middleware) so a multer validation failure (wrong extension, too large)
// resolves to a clean 400 JSON response here — same pattern
// controllers/fileController.js already uses for the generic file uploader.
exports.importUpload = (req, res) => {
  upload(req, res, async (multerErr) => {
    if (multerErr) return res.status(400).json({ error: multerErr.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    try {
      const htmlAsset = await processAndStoreHtml(req.file, { isRTL: true });
      audit({
        req, action: 'proposal.html_import_upload', entityType: 'Proposal',
        metadata: { originalName: req.file.originalname, size: req.file.size, warnings: htmlAsset.warnings },
      });
      res.status(201).json({ htmlAsset, htmlAssetUrl: htmlAsset.url, warnings: htmlAsset.warnings });
    } catch (err) {
      res.status(err.status || 400).json({ error: err.message });
    }
  });
};

// ── POST /api/proposals/:id/html ("Replace HTML") ──────────────────────
// Never destroys the previous version: snapshots the proposal's current
// state — which still points at the old GridFS file — *before* swapping in
// the new htmlAsset, exactly mirroring how content edits are versioned for
// DYNAMIC proposals (proposalController.js). The old file is never
// deleted; it stays referenced forever by that version's snapshot.
exports.replaceHtml = (req, res) => {
  upload(req, res, async (multerErr) => {
    if (multerErr) return res.status(400).json({ error: multerErr.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    try {
      const proposal = await Proposal.findById(req.params.id);
      if (!proposal) return res.status(404).json({ error: 'Not found' });
      if (proposal.type !== 'IMPORTED_HTML') {
        return res.status(400).json({ error: 'This proposal is not an imported-HTML proposal' });
      }

      const previousVersion = proposal.currentVersion;
      const newAsset = await processAndStoreHtml(req.file, { isRTL: true });

      await snapshotVersion(proposal, { changeSummary: 'HTML replaced', userId: req.user._id });
      proposal.htmlAsset = newAsset;
      proposal.updatedBy = req.user._id;
      await proposal.save();

      audit({
        req, action: 'proposal.html_replace', entityType: 'Proposal', entityId: proposal._id,
        metadata: { previousVersion, newVersion: proposal.currentVersion },
      });
      res.json({ item: proposal, htmlAssetUrl: newAsset.url, previousVersion, newVersion: proposal.currentVersion });
    } catch (err) {
      res.status(err.status || 400).json({ error: err.message });
    }
  });
};

// ── GET /api/proposals/public/html/:id ──────────────────────────────────
// Public, unauthenticated (mounted *before* proposals.routes.js's
// `router.use(authenticate, ...)` — see routes/proposals.routes.js), and
// deliberately NOT the generic /api/media/:id route.
//
// Streams the exact same GridFS bytes via the exact same streaming code
// (getMedia — Range support, ETag, RAM cache, all of it) so there is no
// second storage/streaming implementation, only a thin header adjustment on
// top of it: the app-wide helmet middleware (server.js) sends every
// response `X-Frame-Options: SAMEORIGIN` and CSP `frame-ancestors 'self'`,
// which is the right default for images/videos/PDFs (never embedded in a
// frame) but wrongly blocks *this* asset type, since ImportedHTMLViewer.jsx
// renders it inside <iframe sandbox> and the API is a different origin
// from the frontend in both dev (different port) and prod
// (api.yansytech.com vs yansytech.com) — the generic route's framing
// headers made the sandboxed iframe unrenderable (a blank/broken-document
// iframe in every browser), which is what this route exists to fix.
//
// Scoped to `text/html` GridFS files only (not "any asset id") — an image
// or video can't be exploited by relaxed framing (browsers don't apply
// X-Frame-Options/frame-ancestors to <img>/<video>), but this keeps the
// route's actual behavior matching its name/intent instead of doubling as
// a general-purpose framing bypass for the whole media store.
exports.serveHtmlAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid media id' });
    }
    const file = await gridfsRepository.findFileById(id);
    const contentType = file?.metadata?.contentType || file?.contentType;
    if (!file || contentType !== 'text/html') {
      return res.status(404).json({ error: 'Media not found' });
    }

    res.removeHeader('X-Frame-Options');
    res.setHeader('Content-Security-Policy', `frame-ancestors 'self' ${FRAME_ANCESTOR_ORIGINS.join(' ')}`);

    return getMedia(req, res, next);
  } catch (err) {
    next(err);
  }
};
