const Notification = require('../models/Notification');

// ── Get notifications for current user ────────────────────────────────────────
exports.getNotifications = async (req, res, next) => {
  try {
    const { limit = 30, unreadOnly } = req.query;
    const query = { user: req.user._id };
    if (unreadOnly === 'true') query.read = false;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });

    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

// ── Mark single notification as read ─────────────────────────────────────────
exports.markRead = async (req, res, next) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { read: true } },
      { new: true }
    );
    if (!n) return res.status(404).json({ error: 'Notification not found' });
    res.json({ notification: n });
  } catch (error) {
    next(error);
  }
};

// ── Mark all notifications as read ────────────────────────────────────────────
exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { $set: { read: true } }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// ── Delete a notification ─────────────────────────────────────────────────────
exports.deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};

// ── Broadcast notification to all users or by role (admin) ───────────────────
exports.broadcast = async (req, res, next) => {
  try {
    const { title, message, type = 'info', link, targetRole } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'title and message are required.' });
    }

    const User = require('../models/User');
    const query = targetRole ? { role: targetRole, isActive: true } : { isActive: true };
    const users = await User.find(query).select('_id').lean();

    const notifications = await Notification.insertMany(
      users.map(u => ({ user: u._id, type, title, message, link: link || null }))
    );

    // Real-time push via Socket.IO
    const io = req.io;
    if (io) {
      const notifData = { type, title, message, link, createdAt: new Date() };
      if (targetRole) {
        users.forEach(u => io.to(`user:${u._id}`).emit('notification', notifData));
      } else {
        io.emit('notification', notifData);
      }
    }

    const { audit } = require('../utils/auditLogger');
    audit({
      req, action: 'notification.broadcast', entityType: 'Notification', entityId: null,
      after: { count: notifications.length, targetRole: targetRole || 'all', title },
    });

    res.json({ message: `Broadcast sent to ${notifications.length} users.`, count: notifications.length });
  } catch (error) {
    next(error);
  }
};

// ── Create notification (internal helper — not a route) ───────────────────────
exports.createNotification = async ({ userId, type, title, message, link, refType, refId, io, priority = 'medium', groupKey = null }) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type: type || 'info',
      title,
      message,
      link,
      refType,
      refId,
      priority,
      groupKey,
    });

    // Push real-time notification via Socket.IO
    if (io) {
      io.to(`user:${userId}`).emit('notification', notification);
      io.to(`user_${userId}`).emit('notification', notification);
    }

    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
};
