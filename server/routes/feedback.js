const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { rateLimitFeedback } = require('../middleware/rateLimit');

// Public routes
router.post('/', rateLimitFeedback, feedbackController.createFeedback); // Public, but rate-limited
router.get('/testimonials', feedbackController.getPublicTestimonials); // Public testimonials

// Authenticated routes
router.get('/my-projects', authenticate, feedbackController.getUserProjects); // Get user's projects for form

// Admin routes
router.get('/', authenticate, requireAdmin, feedbackController.getAllFeedback);
router.get('/stats', authenticate, requireAdmin, feedbackController.getFeedbackStats);
router.get('/:id', authenticate, requireAdmin, feedbackController.getFeedbackById);
router.patch('/:id', authenticate, requireAdmin, feedbackController.updateFeedback);

module.exports = router;

