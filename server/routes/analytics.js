const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.post('/events', analyticsController.trackEvent);
router.post('/sessions/end', analyticsController.endSession);
router.get('/dashboard', authenticate, requireAdmin, analyticsController.getDashboard);

module.exports = router;

