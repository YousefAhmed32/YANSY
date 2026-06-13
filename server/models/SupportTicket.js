'use strict';
const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  content:  { type: String, required: true },
  addedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  addedAt:  { type: Date, default: Date.now },
}, { _id: false });

const supportTicketSchema = new mongoose.Schema({
  ticketId: { type: String, unique: true, index: true },

  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'SupportConversation',
  },

  customer: {
    name:    { type: String, default: 'Anonymous Visitor' },
    email:   String,
    phone:   String,
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    userType: { type: String, enum: ['registered', 'guest'], default: 'guest' },
  },

  subject:         { type: String, required: true },
  summary:         String,
  projectType:     String,
  requirementsList: [String],

  priority: {
    type:    String,
    enum:    ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },

  status: {
    type:    String,
    enum:    ['open', 'pending', 'in_progress', 'resolved', 'closed'],
    default: 'open',
  },

  conversationSnapshot: [{
    role:    String,
    content: String,
  }],

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User',
  },

  requestId:  String,
  notes:      [noteSchema],
  tags:       [String],
  resolvedAt: Date,
  closedAt:   Date,

}, { timestamps: true });

supportTicketSchema.pre('save', async function (next) {
  if (this.ticketId) return next();
  try {
    const count   = await this.constructor.countDocuments();
    this.ticketId = `TICK-${String(count + 1).padStart(4, '0')}`;
  } catch {
    this.ticketId = `TICK-${Date.now()}`;
  }
  next();
});

supportTicketSchema.index({ status: 1, priority: 1, createdAt: -1 });
supportTicketSchema.index({ 'customer.userId': 1 });
supportTicketSchema.index({ 'customer.userType': 1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
