const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: [
      'project_update', 'project_completed', 'milestone',
      'message', 'admin_reply', 'customer_reply', 'mention',
      'invoice_generated', 'invoice_paid', 'subscription_changed',
      'security_alert', 'login_detected', 'password_changed', 'plan_updated',
      'feedback', 'alert', 'info', 'success', 'system',
    ],
    default: 'info',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  groupKey: { type: String, default: null },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  read: {
    type: Boolean,
    default: false,
  },
  // Optional link target
  link: {
    type: String,
    trim: true,
    default: null,
  },
  // Reference to relevant entity
  refType: {
    type: String,
    enum: ['Project', 'Message', 'User', null],
    default: null,
  },
  refId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
}, {
  timestamps: true,
});

// Index for fast unread queries
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

// Auto-delete old read notifications after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = mongoose.model('Notification', notificationSchema);
