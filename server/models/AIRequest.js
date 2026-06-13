'use strict';
const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  content:  { type: String, required: true },
  addedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  addedAt:  { type: Date, default: Date.now },
}, { _id: true });

const aiRequestSchema = new mongoose.Schema({
  // ── Identity ──────────────────────────────────────────────────────────────
  requestCode: {
    type:    String,
    unique:  true,
    default: () => `AIR-${Date.now().toString(36).toUpperCase().slice(-7)}`,
  },

  // ── Lead data (snapshot at time of qualification) ─────────────────────────
  name:        { type: String, required: true },
  phone:       { type: String, default: null },
  email:       { type: String, default: null },
  company:     { type: String, default: null },
  projectType: { type: String, default: null },
  features:    { type: String, default: null },     // comma-separated or free text
  business:    { type: String, default: null },     // business context
  timeline:    { type: String, default: null },
  goals:       { type: String, default: null },
  requirementsSummary: { type: String, default: null },

  // ── AI intelligence ───────────────────────────────────────────────────────
  leadScore:           { type: Number, default: 0, min: 0, max: 100 },
  conversationSummary: { type: String, default: null },
  sentiment:           { type: String, enum: ['positive', 'neutral', 'frustrated', 'urgent'], default: 'neutral' },
  priority:            { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  aiRecommendation:    { type: String, default: null },  // AI-generated recommendation text

  // ── Status pipeline ───────────────────────────────────────────────────────
  status: {
    type:    String,
    enum:    ['new', 'contacted', 'proposal_sent', 'won', 'lost'],
    default: 'new',
    index:   true,
  },
  contactedAt:    { type: Date, default: null },
  proposalSentAt: { type: Date, default: null },
  closedAt:       { type: Date, default: null },

  // ── Relations ─────────────────────────────────────────────────────────────
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupportConversation', default: null, index: true },
  sessionId:      { type: String, default: null, index: true },
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userType:       { type: String, enum: ['registered', 'guest'], default: 'guest' },
  assignedTo:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // ── Admin ─────────────────────────────────────────────────────────────────
  notes:     [noteSchema],
  adminNotes:{ type: String, default: '' },
  isRead:    { type: Boolean, default: false },
  tags:      { type: [String], default: ['ai-qualified'] },

  // ── Source tracking ───────────────────────────────────────────────────────
  source:      { type: String, default: 'ai_chat' },
  browserInfo: {
    browser: String,
    os:      String,
    device:  String,
  },
  ip: { type: String, default: null },

}, { timestamps: true });

aiRequestSchema.index({ createdAt: -1 });
aiRequestSchema.index({ leadScore: -1 });
aiRequestSchema.index({ priority: 1, status: 1 });
aiRequestSchema.index({ name: 'text', phone: 'text', email: 'text', projectType: 'text' });

module.exports = mongoose.model('AIRequest', aiRequestSchema);
