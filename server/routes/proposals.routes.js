'use strict';
const express = require('express');
const { authenticate, requireRole, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/proposals/proposalController');
const htmlImportCtrl = require('../controllers/proposals/htmlImportController');

const router = express.Router();

// Public, unauthenticated — must be registered *before* the router.use(authenticate, ...)
// gate below, since Express applies router-level middleware to every route
// registered after it. Serves an IMPORTED_HTML proposal's document for
// <iframe> rendering (both the admin preview and the public /p/:slug page
// use it, via the same ImportedHTMLViewer component) — see
// htmlImportController.serveHtmlAsset for why this can't just be the
// generic /api/media/:id route.
router.get('/public/html/:id', htmlImportCtrl.serveHtmlAsset);

// Proposals are an internal sales tool — Manager and up can create/send
// them, same tier as project management elsewhere in the app.
router.use(authenticate, requireRole('MANAGER', 'ADMIN', 'SUPER_ADMIN'));

router.get('/stats/overview', ctrl.stats);

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.post('/from-template/:templateId', ctrl.createFromTemplate);

// "Import HTML Proposal" — standalone upload, not yet attached to any
// proposal document (see htmlImportController.js for the full flow).
router.post('/import/upload', htmlImportCtrl.importUpload);

router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);
router.delete('/:id', requireAdmin, ctrl.remove); // delete stays Admin+ only

router.post('/:id/publish', ctrl.publish);
router.post('/:id/duplicate', ctrl.duplicate);
router.post('/:id/archive', ctrl.archive);
router.post('/:id/status', ctrl.changeStatus);
router.post('/:id/html', htmlImportCtrl.replaceHtml); // "Replace HTML" — versioned, see htmlImportController.js

router.get('/:id/versions', ctrl.listVersions);
router.post('/:id/restore/:versionId', ctrl.restoreVersion);

router.get('/:id/pdf', ctrl.downloadPdf);

module.exports = router;
