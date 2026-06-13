'use strict';
const AuditLog = require('../models/AuditLog');

// GET /api/audit — Admin only
exports.getLogs = async (req, res, next) => {
  try {
    const {
      page      = 1,
      limit     = 50,
      action,
      entityType,
      actorId,
      startDate,
      endDate,
    } = req.query;

    const query = {};
    if (action)     query.action     = action;
    if (entityType) query.entityType = entityType;
    if (actorId)    query.actor      = actorId;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate)   query.createdAt.$lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actor', 'fullName email role')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      logs,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/audit/actions — Available action types for filter UI
exports.getActions = async (req, res) => {
  const actions = await AuditLog.distinct('action');
  res.json({ actions });
};

// GET /api/audit/stats
exports.getStats = async (req, res, next) => {
  try {
    const [totalLogs, recentLogs, topActors, topActions] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      AuditLog.aggregate([
        { $group: { _id: '$actor', count: { $sum: 1 }, email: { $first: '$actorEmail' } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      AuditLog.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    res.json({ totalLogs, recentLogs, topActors, topActions });
  } catch (error) {
    next(error);
  }
};
