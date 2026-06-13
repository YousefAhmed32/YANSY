const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', authenticate, projectController.getAllProjects);
router.get('/:id', authenticate, projectController.getProjectById);
router.post('/', authenticate, projectController.createProject); // Users can create projects
router.patch('/:id', authenticate, projectController.updateProject);
router.post('/:id/updates', authenticate, requireAdmin, projectController.addUpdate);
router.post('/:id/files', authenticate, projectController.addFile);
router.delete('/:id', authenticate, requireAdmin, projectController.deleteProject);

module.exports = router;

