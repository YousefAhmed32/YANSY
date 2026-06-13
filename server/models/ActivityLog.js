const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: [
      'account_created', 'login', 'logout', 'profile_updated', 'password_changed',
      'message_sent', 'message_received',
      'project_created', 'project_updated', 'project_completed',
      'invoice_viewed', 'invoice_paid',
      'file_uploaded',
      'support_requested',
      'plan_changed', 'plan_upgraded', 'plan_downgraded',
      'onboarding_completed',
    ],
    required: true,
  },
  description: { type: String, trim: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  ip: { type: String, default: null },
  userAgent: { type: String, default: null },
}, {
  timestamps: true,
});

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ type: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 }); // 1 year TTL

module.exports = mongoose.model('ActivityLog', activityLogSchema);
