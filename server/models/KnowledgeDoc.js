'use strict';
const mongoose = require('mongoose');

// RAG knowledge base — admin-managed facts (services, pricing, FAQs, policies,
// case studies) that get embedded once and retrieved per-chat-turn so the AI
// consultant answers from real company knowledge instead of inventing it.
const knowledgeDocSchema = new mongoose.Schema({
  title:    { type: String, required: true, trim: true },
  content:  { type: String, required: true },
  category: {
    type: String,
    enum: ['services', 'pricing', 'faq', 'case-study', 'policy', 'brand', 'other'],
    default: 'other',
  },
  lang:      { type: String, enum: ['en', 'ar', 'both'], default: 'both' },
  embedding: { type: [Number], default: [] },
  isActive:  { type: Boolean, default: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

knowledgeDocSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('KnowledgeDoc', knowledgeDocSchema);
