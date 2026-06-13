'use strict';
const mongoose = require('mongoose');

const aiUsageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  feature: {
    type: String,
    required: true,
    enum: [
      'insight',        // Dashboard AI insight
      'brief',          // Project brief generator
      'estimator',      // Timeline + budget estimator
      'proposal',       // Full proposal generator
      'project_summary',// Project updates summary
      'message_summary',// Message thread summary
      'onboarding',     // Onboarding assistant
      'chat',           // Public chat widget
      'admin_insights', // Admin platform insights
    ],
  },
  model: {
    type: String,
    default: 'claude-sonnet-4-6',
  },
  // Token usage
  inputTokens:      { type: Number, default: 0 },
  outputTokens:     { type: Number, default: 0 },
  cacheReadTokens:  { type: Number, default: 0 },
  cacheWriteTokens: { type: Number, default: 0 },

  // Cost tracking (USD)
  estimatedCostUSD: { type: Number, default: 0 },

  // Performance
  durationMs: { type: Number, default: 0 },

  // Status
  success:   { type: Boolean, default: true },
  errorCode: { type: String, default: null },

  // Feature-specific metadata (project id, etc.)
  metadata: { type: mongoose.Schema.Types.Mixed, default: null },
}, {
  timestamps: true,
});

// Indexes for efficient queries
aiUsageSchema.index({ user: 1, createdAt: -1 });
aiUsageSchema.index({ feature: 1, createdAt: -1 });
aiUsageSchema.index({ createdAt: -1 });

// TTL: auto-delete after 90 days (keep costs down on storage)
aiUsageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Static: count requests for a user today
aiUsageSchema.statics.dailyCount = async function (userId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return this.countDocuments({
    user: userId,
    success: true,
    createdAt: { $gte: startOfDay },
  });
};

// Static: aggregate usage stats for a user
aiUsageSchema.statics.userStats = async function (userId) {
  return this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id:             null,
        totalRequests:   { $sum: 1 },
        successCount:    { $sum: { $cond: ['$success', 1, 0] } },
        totalInputTokens:  { $sum: '$inputTokens'  },
        totalOutputTokens: { $sum: '$outputTokens' },
        totalCostUSD:    { $sum: '$estimatedCostUSD' },
        byFeature: {
          $push: { feature: '$feature', success: '$success' },
        },
      },
    },
  ]);
};

module.exports = mongoose.model('AIUsage', aiUsageSchema);
