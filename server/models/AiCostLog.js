'use strict';
const mongoose = require('mongoose');

// Per-call cost/token ledger for the public AI chat widget specifically.
// Deliberately separate from AIUsage (which requires a logged-in `user` and
// serves the authenticated client-portal AI features) — most chat-widget
// traffic is anonymous, keyed by sessionId, and needs its own lightweight log.
const aiCostLogSchema = new mongoose.Schema({
  sessionId: { type: String, index: true },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  feature: {
    type: String,
    enum: ['chat', 'vision', 'tts', 'embed', 'url_analysis', 'document_generation'],
    required: true,
  },
  model:        { type: String, default: '' },
  inputTokens:  { type: Number, default: 0 },
  outputTokens: { type: Number, default: 0 },
  costUSD:      { type: Number, default: 0 }, // 0 if no rate configured for this model — see SystemSettings aiChat.pricingTable
}, { timestamps: true });

aiCostLogSchema.index({ createdAt: -1 });
aiCostLogSchema.index({ feature: 1, createdAt: -1 });
aiCostLogSchema.index({ model: 1, createdAt: -1 });

// TTL: auto-expire after 180 days — enough for monthly trend analytics without unbounded growth
aiCostLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

module.exports = mongoose.model('AiCostLog', aiCostLogSchema);
