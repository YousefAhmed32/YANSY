'use strict';
const multer = require('multer');
const Proposal = require('../../models/proposals/Proposal');
const mediaService = require('../../media/media.service');
const { assertSize } = require('../../media/mediaValidators');
const { HTML_MIMES, HTML_MAX_BYTES } = require('../../media/mediaConstants');
const { sanitizeHtml, inspectWarnings } = require('../../media/htmlSanitizer');
const { snapshotVersion } = require('./versionHelpers');
const { audit } = require('../../utils/auditLogger');

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
    url: asset.url,
    originalName: file.originalname,
    size: safeBuffer.length,
    mimeType: 'text/html',
    uploadedAt: new Date(),
    warnings,
  };
};

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
