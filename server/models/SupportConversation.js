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
    unique:  true, // `unique: true` already creates the index — `index: true` alongside it was a duplicate
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

  // ── Live Project Blueprint — the full structured output (industry, techStack,
  //    pages, budget, risks, nextSteps, etc). Previously this only ever lived in
  //    the browser's localStorage and was lost on device switch / storage clear —
  //    persisting it here is what makes "returning user" resume actually work,
  //    and lets admins see the full blueprint, not just the narrow `lead` subset. ──
  intelligence:  { type: mongoose.Schema.Types.Mixed, default: {} },
  customerSegment: { type: String, enum: ['Startup', 'SMB', 'Enterprise', 'Agency', ''], default: '' },

  // ── Files/links shared during the conversation — surfaced in the sidebar's
  //    "Uploaded Files" section and in the admin conversation viewer. ─────────
  attachmentsLog: [{
    kind:    { type: String, enum: ['image', 'document', 'website'] },
    name:    String,
    url:     String,
    addedAt: { type: Date, default: Date.now },
  }],

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

supportConversationSchema.index({ sentiment: 1 });
supportConversationSchema.index({ primaryIntent: 1 });
supportConversationSchema.index({ userId: 1 });
supportConversationSchema.index({ userType: 1, createdAt: -1 });

// Match the admin leads-list query exactly (supportController.js `getLeads`):
// find({'lead.detected':true, isArchived:false, ...}).sort({leadScore:-1, updatedAt:-1}).
// The old `{'lead.detected':1, createdAt:-1}` index didn't cover `isArchived`
// or the actual sort fields, so this was a full collection scan + in-memory
// sort on the fastest-growing collection in the app (every AI chat logs here).
supportConversationSchema.index({ 'lead.detected': 1, isArchived: 1, leadScore: -1, updatedAt: -1 });

// Match the admin escalations-list query (supportController.js `getEscalations`):
// find({'escalation.needed':true, isArchived:false}).sort({'escalation.flaggedAt':-1}).
supportConversationSchema.index({ 'escalation.needed': 1, isArchived: 1, 'escalation.flaggedAt': -1 });

module.exports = mongoose.model('SupportConversation', supportConversationSchema);
