const express = require('express');
const router = express.Router();
const projectRequestController = require('../controllers/projectRequestController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { rateLimitLeadSubmission } = require('../middleware/rateLimit');

// Public endpoints — rate-limited per IP (10/hour) so the site's primary
// lead-gen forms aren't left with only the blanket 300/min API limiter.
router.post('/submit',   rateLimitLeadSubmission, projectRequestController.submitRequest);
router.post('/ai-lead',  rateLimitLeadSubmission, projectRequestController.submitAiLead);

// Public brief enrichment endpoints (magic token)
router.get('/brief/:token',   projectRequestController.getBriefByToken);
router.patch('/brief/:token', projectRequestController.updateBriefByToken);

// Authenticated user endpoints
router.post('/create', authenticate, projectRequestController.submitAuthenticatedRequest);
router.get('/my-requests', authenticate, projectRequestController.getUserRequests);

// Admin-only endpoints
router.get('/', authenticate, requireAdmin, projectRequestController.getAllRequests);
router.get('/pipeline', authenticate, requireAdmin, projectRequestController.getPipeline);
router.get('/stats', authenticate, requireAdmin, projectRequestController.getRequestStats);
router.get('/:id', authenticate, requireAdmin, projectRequestController.getRequestById);
router.patch('/:id/status', authenticate, requireAdmin, projectRequestController.updateRequestStatus);
router.delete('/:id', authenticate, requireAdmin, projectRequestController.deleteRequest);

module.exports = router;

