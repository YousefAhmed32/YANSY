'use strict';
const mongoose = require('mongoose');
const { v4: uuid } = require('uuid');

const msgSchema = new mongoose.Schema({
  role:      { type: String, enum: ['user', 'assistant'], required: true },
  content:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const supportConversationSchema = new mongoose.Schema({
  sessionId: {
    type:    String,
    default: uuid,
    unique:  true,
    index:   true,
  },
  messages: [msgSchema],
  lang: { type: String, default: 'en' },

  // ── User identification ─────────────────────────────────────────────────────
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userType: { type: String, enum: ['registered', 'guest'], default: 'guest' },
  userEmail: { type: String, default: null },

  // ── Lead data ───────────────────────────────────────────────────────────────
  lead: {
    detected:    { type: Boolean, default: false },
    name:        String,
    phone:       String,
    email:       String,
    business:    String,
    budget:      String,
    timeline:    String,
    projectType: String,
    goals:       String,
    features:    [String],
    requirementsSummary: String,
    savedAt:     Date,
  },

  // ── AI-generated insights ───────────────────────────────────────────────────
  leadScore:           { type: Number, default: 0, min: 0, max: 100 },
  conversationSummary: { type: String, default: null },
  priority:            { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },

  // ── Relations ───────────────────────────────────────────────────────────────
  ticket:    { type: mongoose.Schema.Types.ObjectId, ref: 'SupportTicket', default: null },
  requestId: { type: String, default: null },

  // ── Escalation ──────────────────────────────────────────────────────────────
  escalation: {
    needed:    { type: Boolean, default: false },
    priority:  { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    reason:    String,
    flaggedAt: Date,
  },

  whatsappSuggested: { type: Boolean, default: false },

  // ── Analytics ───────────────────────────────────────────────────────────────
  sentiment:     { type: String, enum: ['positive', 'neutral', 'frustrated', 'urgent'], default: 'neutral' },
  primaryIntent: { type: String, enum: ['lead', 'support', 'inquiry', 'complaint', 'other'], default: 'inquiry' },

  // ── Visitor info ─────────────────────────────────────────────────────────────
  ip:          String,
  userAgent:   String,
  browserInfo: {
    browser:  String,
    os:       String,
    device:   String,
  },

  // ── Admin ────────────────────────────────────────────────────────────────────
  adminNotes: String,
  isRead:     { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },

}, { timestamps: true });

supportConversationSchema.index({ 'lead.detected': 1, createdAt: -1 });
supportConversationSchema.index({ sentiment: 1 });
supportConversationSchema.index({ primaryIntent: 1 });
supportConversationSchema.index({ userId: 1 });
supportConversationSchema.index({ userType: 1, createdAt: -1 });
supportConversationSchema.index({ leadScore: -1 });
supportConversationSchema.index({ 'escalation.needed': 1 });

module.exports = mongoose.model('SupportConversation', supportConversationSchema);
