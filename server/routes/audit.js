const express = require('express');
const router  = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const auditController = require('../controllers/auditController');

router.get('/',        authenticate, requireAdmin, auditController.getLogs);
router.get('/actions', authenticate, requireAdmin, auditController.getActions);
router.get('/stats',   authenticate, requireAdmin, auditController.getStats);

module.exports = router;
