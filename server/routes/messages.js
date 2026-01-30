const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

router.get('/threads', authenticate, messageController.getThreads);
router.get('/threads/:id', authenticate, messageController.getThread);
router.get('/projects/:projectId/thread', authenticate, messageController.getThreadByProject);
router.post('/threads', authenticate, messageController.createThread);
router.post('/threads/:id/messages', authenticate, messageController.sendMessage);
router.patch('/threads/:id/status', authenticate, messageController.updateThreadStatus);

module.exports = router;

