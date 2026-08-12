'use strict';
const express = require('express');
const ctrl = require('../controllers/proposals/publicProposalController');

let rateLimit;
try { rateLimit = require('express-rate-limit'); } catch (_) { /* optional, see server.js */ }

const router = express.Router();

// No authentication — this is the client-facing surface. Rate-limited
// separately from the global /api limiter since accept/request-changes are
// write actions a bad actor could otherwise hammer against a guessed slug.
if (rateLimit) {
  const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many requests. Please try again shortly.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  router.use(['/:slug/accept', '/:slug/request-changes'], writeLimiter);

  // PDF generation spins up headless Chromium per request — expensive
  // enough that it needs a tighter cap than the plain read/write endpoints.
  const pdfLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many PDF requests. Please try again shortly.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  router.use('/:slug/pdf', pdfLimiter);
}

router.get('/:slug', ctrl.getBySlug);
router.post('/:slug/view', ctrl.recordView);
router.get('/:slug/pdf', ctrl.downloadPdf);
router.post('/:slug/accept', ctrl.accept);
router.post('/:slug/request-changes', ctrl.requestChanges);

module.exports = router;
