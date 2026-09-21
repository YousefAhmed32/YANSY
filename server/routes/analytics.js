const express = require('express');
const router = express.Router();
const c = require('../controllers/analyticsController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Public (no auth) — track events from any visitor
router.post('/events',            c.trackEvent);
router.post('/sessions/end',      c.endSession);
router.post('/sessions/heartbeat', c.heartbeatSession);

// Admin-only analytics endpoints
router.get('/dashboard',                  authenticate, requireAdmin, c.getDashboard);
router.get('/visitors',                   authenticate, requireAdmin, c.getVisitors);
router.get('/hourly',                     authenticate, requireAdmin, c.getHourly);
router.get('/sessions',                   authenticate, requireAdmin, c.getSessions);
router.get('/sessions/:sessionId/journey', authenticate, requireAdmin, c.getSessionJourney);
router.get('/realtime',                   authenticate, requireAdmin, c.getRealtime);
router.get('/geography',                  authenticate, requireAdmin, c.getGeography);
router.get('/sources',                    authenticate, requireAdmin, c.getSources);
router.get('/devices',                    authenticate, requireAdmin, c.getDevices);
router.get('/pages/detail',               authenticate, requireAdmin, c.getPages);
router.get('/conversions',                authenticate, requireAdmin, c.getConversions);
router.get('/funnel',                     authenticate, requireAdmin, c.getFunnel);
router.get('/heatmap',                    authenticate, requireAdmin, c.getHeatmap);
router.get('/campaigns',                  authenticate, requireAdmin, c.getCampaigns);

module.exports = router;

