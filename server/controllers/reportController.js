'use strict';

const Report = require('../models/Report');

// ── User: submit a report ─────────────────────────────────────────────────────
exports.createReport = async (req, res, next) => {
  try {
    const { type, targetType, targetId, description } = req.body;

    if (!type || !targetType || !targetId || !description) {
      return res.status(400).json({ error: 'type, targetType, targetId, and description are required.' });
    }

    if (description.length < 10) {
      return res.status(400).json({ error: 'Description must be at least 10 characters.' });
    }

    // Prevent duplicate reports from same user for same target
    const existing = await Report.findOne({
      reporter: req.user._id,
      targetId,
      targetType,
      status: { $in: ['pending', 'under_review'] },
    });

    if (existing) {
      return res.status(409).json({ error: 'You have already submitted a report for this item. It is currently under review.' });
    }

    const report = await Report.create({
      type,
      targetType,
      targetId,
      description: description.trim(),
      reporter: req.user._id,
    });

    // Audit log — non-critical
    try {
      const AuditLog = require('../models/AuditLog');
      AuditLog.create({ actor: req.user._id, actorEmail: req.user.email, actorRole: req.user.role, action: 'report.created', entityType: 'Report', entityId: report._id, ip: req.ip }).catch(() => {});
    } catch { /* non-critical */ }

    res.status(201).json({ report, message: 'Report submitted. Our team will review it shortly.' });
  } catch (error) {
    next(error);
  }
};

// ── Admin: list all reports ───────────────────────────────────────────────────
exports.getReports = async (req, res, next) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (type)   query.type   = type;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('reporter', 'fullName email')
        .populate('resolvedBy', 'fullName email')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit)),
      Report.countDocuments(query),
    ]);

    res.json({
      reports,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
    });
  } catch (error) {
    next(error);
  }
};

// ── Admin: get report stats ───────────────────────────────────────────────────
exports.getReportStats = async (req, res, next) => {
  try {
    const [total, pending, underReview, resolved, dismissed, byType] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'under_review' }),
      Report.countDocuments({ status: 'resolved' }),
      Report.countDocuments({ status: 'dismissed' }),
      Report.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json({ total, pending, underReview, resolved, dismissed, byType });
  } catch (error) {
    next(error);
  }
};

// ── Admin: update report status ───────────────────────────────────────────────
exports.updateReport = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const validStatuses = ['pending', 'under_review', 'resolved', 'dismissed'];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    if (status) report.status = status;
    if (adminNotes !== undefined) report.adminNotes = adminNotes;

    if (status === 'resolved' || status === 'dismissed') {
      report.resolvedBy = req.user._id;
      report.resolvedAt = new Date();
    }

    await report.save();

    try {
      const AuditLog = require('../models/AuditLog');
      AuditLog.create({ actor: req.user._id, actorEmail: req.user.email, actorRole: req.user.role, action: 'report.updated', entityType: 'Report', entityId: report._id, after: { status }, ip: req.ip }).catch(() => {});
    } catch { /* non-critical */ }

    const populated = await Report.findById(report._id)
      .populate('reporter', 'fullName email')
      .populate('resolvedBy', 'fullName email');

    res.json({ report: populated });
  } catch (error) {
    next(error);
  }
};

// ── Admin: delete report ──────────────────────────────────────────────────────
exports.deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    try {
      const AuditLog = require('../models/AuditLog');
      AuditLog.create({ actor: req.user._id, actorEmail: req.user.email, actorRole: req.user.role, action: 'report.deleted', entityType: 'Report', entityId: req.params.id, ip: req.ip }).catch(() => {});
    } catch { /* non-critical */ }
    res.json({ message: 'Report deleted.' });
  } catch (error) {
    next(error);
  }
};
