const express = require('express');
const router = express.Router();
const projectRequestController = require('../controllers/projectRequestController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Public endpoints
router.post('/submit',   projectRequestController.submitRequest);
router.post('/ai-lead',  projectRequestController.submitAiLead);

// Authenticated user endpoints
router.post('/create', authenticate, projectRequestController.submitAuthenticatedRequest);
router.get('/my-requests', authenticate, projectRequestController.getUserRequests);

// Admin-only endpoints
router.get('/', authenticate, requireAdmin, projectRequestController.getAllRequests);
router.get('/stats', authenticate, requireAdmin, projectRequestController.getRequestStats);
router.get('/:id', authenticate, requireAdmin, projectRequestController.getRequestById);
router.patch('/:id/status', authenticate, requireAdmin, projectRequestController.updateRequestStatus);
router.delete('/:id', authenticate, requireAdmin, projectRequestController.deleteRequest);

module.exports = router;

