const ActivityLog = require('../models/ActivityLog');

// Helper to log an activity — called from other controllers
exports.logActivity = async ({ userId, type, description, metadata = {}, req = null }) => {
  try {
    await ActivityLog.create({
      user: userId,
      type,
      description,
      metadata,
      ip: req?.ip || null,
      userAgent: req?.headers?.['user-agent'] || null,
    });
  } catch (err) {
    console.error('[ActivityLog] Failed to log:', err.message);
  }
};

// GET /api/activity — user's own activity
exports.getMyActivity = async (req, res, next) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const page  = Math.max(1, parseInt(req.query.page) || 1);

    const [logs, total] = await Promise.all([
      ActivityLog.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
      ActivityLog.countDocuments({ user: req.user._id }),
    ]);

    res.json({ logs, total, totalPages: Math.ceil(total / limit), currentPage: page });
  } catch (err) {
    next(err);
  }
};

// GET /api/activity/user/:userId — admin view of a customer's timeline
exports.getUserActivity = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const limit = Math.min(100, parseInt(req.query.limit) || 30);
    const page  = Math.max(1, parseInt(req.query.page) || 1);

    const [logs, total] = await Promise.all([
      ActivityLog.find({ user: req.params.userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
      ActivityLog.countDocuments({ user: req.params.userId }),
    ]);

    res.json({ logs, total, totalPages: Math.ceil(total / limit), currentPage: page });
  } catch (err) {
    next(err);
  }
};
