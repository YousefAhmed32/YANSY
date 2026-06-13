'use strict';
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/settingsController');
const { authenticate, requireAdmin, requirePermission, requireSuperAdmin } = require('../middleware/auth');

// ── Public settings (no auth required) ───────────────────────────────────────
router.get('/public', ctrl.getPublic);

// ── Admin settings ────────────────────────────────────────────────────────────
router.get('/',         authenticate, requirePermission('settings.view'), ctrl.getAll);
router.patch('/:key',   authenticate, requirePermission('settings.edit'), ctrl.update);
router.patch('/',       authenticate, requirePermission('settings.edit'), ctrl.bulkUpdate);
router.post('/seed',    authenticate, requireSuperAdmin,                  ctrl.seed);

// ── System health ─────────────────────────────────────────────────────────────
router.get('/health',   authenticate, requirePermission('settings.view'), ctrl.getHealth);

module.exports = router;
