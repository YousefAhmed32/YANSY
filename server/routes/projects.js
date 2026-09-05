const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const projectMilestoneController = require('../controllers/projectMilestoneController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', authenticate, projectController.getAllProjects);
router.get('/:id', authenticate, projectController.getProjectById);
router.post('/', authenticate, projectController.createProject); // Users can create projects
router.patch('/:id', authenticate, projectController.updateProject);
router.post('/:id/updates', authenticate, requireAdmin, projectController.addUpdate);
router.post('/:id/files', authenticate, projectController.addFile);
router.delete('/:id', authenticate, requireAdmin, projectController.deleteProject);

// ── Milestone Review & Sign-off ──────────────────────────────────────────────
router.post('/:id/milestones/:mId/submit-deliverable', authenticate, requireAdmin, projectMilestoneController.submitDeliverable);
router.post('/:id/milestones/:mId/approve',            authenticate, projectMilestoneController.approveMilestone);
router.post('/:id/milestones/:mId/request-revision',   authenticate, projectMilestoneController.requestRevision);

// ── Scope Change Orders ───────────────────────────────────────────────────────
router.post('/:id/change-requests',                   authenticate, projectMilestoneController.createChangeRequest);
router.post('/:id/change-requests/:crId/respond',     authenticate, projectMilestoneController.respondToChangeRequest);

// ── Project Resource URLs ────────────────────────────────────────────────────
router.patch('/:id/urls',                             authenticate, requireAdmin, projectMilestoneController.updateProjectUrls);

module.exports = router;

