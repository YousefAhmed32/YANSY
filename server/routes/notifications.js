const express = require('express');
const router = express.Router();
const { authenticate, requirePermission } = require('../middleware/auth');
const {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
  broadcast,
} = require('../controllers/notificationController');

router.get('/',              authenticate, getNotifications);
router.patch('/read-all',    authenticate, markAllRead);
router.patch('/:id/read',    authenticate, markRead);
router.delete('/:id',        authenticate, deleteNotification);

// Admin broadcast
router.post('/broadcast', authenticate, requirePermission('notifications.broadcast'), broadcast);

module.exports = router;
