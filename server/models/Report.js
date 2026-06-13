const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['abuse', 'spam', 'fraud', 'harassment', 'inappropriate_content', 'other'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'resolved', 'dismissed'],
    default: 'pending',
  },
  // Who filed the report
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // What/who is being reported
  targetType: {
    type: String,
    enum: ['user', 'project', 'message'],
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  // Report content
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
  // Admin resolution
  adminNotes: {
    type: String,
    trim: true,
    maxlength: 2000,
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  resolvedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reporter: 1 });
reportSchema.index({ targetId: 1, targetType: 1 });

module.exports = mongoose.model('Report', reportSchema);
