const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/reportController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// User routes
router.post('/',              authenticate, ctrl.createReport);

// Admin routes
router.get('/',               authenticate, requireAdmin, ctrl.getReports);
router.get('/stats',          authenticate, requireAdmin, ctrl.getReportStats);
router.patch('/:id',          authenticate, requireAdmin, ctrl.updateReport);
router.delete('/:id',         authenticate, requireAdmin, ctrl.deleteReport);

module.exports = router;
