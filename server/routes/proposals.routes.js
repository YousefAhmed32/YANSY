'use strict';
const express = require('express');
const { authenticate, requireRole, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/proposals/proposalController');

const router = express.Router();

// Proposals are an internal sales tool — Manager and up can create/send
// them, same tier as project management elsewhere in the app.
router.use(authenticate, requireRole('MANAGER', 'ADMIN', 'SUPER_ADMIN'));

router.get('/stats/overview', ctrl.stats);

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.post('/from-template/:templateId', ctrl.createFromTemplate);

router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);
router.delete('/:id', requireAdmin, ctrl.remove); // delete stays Admin+ only

router.post('/:id/publish', ctrl.publish);
router.post('/:id/duplicate', ctrl.duplicate);
router.post('/:id/archive', ctrl.archive);
router.post('/:id/status', ctrl.changeStatus);

router.get('/:id/versions', ctrl.listVersions);
router.post('/:id/restore/:versionId', ctrl.restoreVersion);

router.get('/:id/pdf', ctrl.downloadPdf);

module.exports = router;
