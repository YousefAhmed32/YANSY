const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

router.get('/threads/search',           authenticate, ctrl.searchThreads);
router.get('/threads',                  authenticate, ctrl.getThreads);
router.get('/threads/:id',              authenticate, ctrl.getThread);
router.get('/projects/:projectId/thread', authenticate, ctrl.getThreadByProject);
router.post('/threads',                 authenticate, ctrl.createThread);
router.post('/threads/:id/messages',    authenticate, ctrl.sendMessage);
router.patch('/threads/:id/status',     authenticate, ctrl.updateThreadStatus);
router.patch('/threads/:id/priority',   authenticate, ctrl.updateThreadPriority);
router.patch('/threads/:id/archive',    authenticate, ctrl.archiveThread);
router.patch('/threads/:id/pin',        authenticate, ctrl.pinThread);
router.patch('/threads/:id/assign',     authenticate, ctrl.assignThread);

module.exports = router;
