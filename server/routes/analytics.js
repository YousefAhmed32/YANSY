const express = require('express');
const router = express.Router();
const c = require('../controllers/analyticsController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Public (no auth) — track events from any visitor
router.post('/events',       c.trackEvent);
router.post('/sessions/end', c.endSession);

// Admin-only analytics endpoints
router.get('/dashboard',    authenticate, requireAdmin, c.getDashboard);
router.get('/visitors',     authenticate, requireAdmin, c.getVisitors);
router.get('/realtime',     authenticate, requireAdmin, c.getRealtime);
router.get('/geography',    authenticate, requireAdmin, c.getGeography);
router.get('/sources',      authenticate, requireAdmin, c.getSources);
router.get('/devices',      authenticate, requireAdmin, c.getDevices);
router.get('/pages/detail', authenticate, requireAdmin, c.getPages);
router.get('/conversions',  authenticate, requireAdmin, c.getConversions);

module.exports = router;
