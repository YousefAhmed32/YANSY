const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  actorEmail: { type: String, required: true },
  actorRole:  { type: String, required: true },

  action: {
    type: String,
    required: true,
    enum: [
      // User actions
      'user.create', 'user.update', 'user.delete', 'user.role_change', 'user.deactivate', 'user.activate',
      'user.export', 'user.impersonate', 'user.self_delete',
      // Project actions
      'project.create', 'project.update', 'project.delete', 'project.status_change', 'project.progress_update',
      // Feedback actions
      'feedback.delete', 'feedback.flag', 'feedback.highlight', 'feedback.review',
      // Portfolio actions
      'portfolio.create', 'portfolio.update', 'portfolio.delete', 'portfolio.feature',
      // Invoice actions
      'invoice.create', 'invoice.send', 'invoice.mark_paid', 'invoice.delete',
      // System actions
      'auth.login', 'auth.logout', 'auth.password_reset',
      // File actions
      'file.upload', 'file.delete',
      // Report / moderation actions
      'report.created', 'report.updated', 'report.deleted',
    ],
  },

  entityType: {
    type: String,
    enum: ['User', 'Project', 'Feedback', 'PortfolioProject', 'Invoice', 'File', 'System', 'Report'],
    required: true,
  },

  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },

  // Snapshot of relevant data before and after the change
  before: { type: mongoose.Schema.Types.Mixed, default: null },
  after:  { type: mongoose.Schema.Types.Mixed, default: null },

  metadata: { type: mongoose.Schema.Types.Mixed, default: null },

  ip:        { type: String, default: null },
  userAgent: { type: String, default: null },
}, {
  timestamps: true,
});

// Indexes for efficient admin queries
auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

// Auto-delete after 1 year
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
