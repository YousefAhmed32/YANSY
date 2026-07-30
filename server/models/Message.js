const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageThread',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  attachments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }
}, {
  timestamps: true
});

// Index for efficient queries
messageSchema.index({ threadId: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, isRead: 1 });

const messageThreadSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  subject: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['support', 'sales', 'project', 'billing', 'technical', 'custom', 'general'],
    default: 'general',
  },
  status: {
    type: String,
    enum: ['open', 'waiting_for_admin', 'waiting_for_customer', 'resolved', 'closed',
           'pending', 'in_progress'],  // legacy values kept for compat
    default: 'waiting_for_admin',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  isArchived: { type: Boolean, default: false },
  isPinned:   { type: Boolean, default: false },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  unreadCounts: {
    type: Map,
    of: Number,
    default: {},
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

messageThreadSchema.index({ participants: 1 });

// Cover the two base access patterns in messageController.getThreads — every
// query there always includes `isArchived` plus either `participants` (a
// customer's own inbox) or nothing extra (an admin sees all threads), sorted
// {isPinned:-1, lastActivity:-1}. Neither shape was covered before (only a
// bare `participants` and a bare `lastActivity` index existed), so every
// admin inbox load and every customer inbox load did a full collection scan
// + in-memory sort.
messageThreadSchema.index({ participants: 1, isArchived: 1, isPinned: -1, lastActivity: -1 });
messageThreadSchema.index({ isArchived: 1, isPinned: -1, lastActivity: -1 });

const Message = mongoose.model('Message', messageSchema);
const MessageThread = mongoose.model('MessageThread', messageThreadSchema);

module.exports = { Message, MessageThread };

