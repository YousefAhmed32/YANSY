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
  status: {
    type: String,
    enum: ['open', 'replied', 'closed'],
    default: 'open'
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
messageThreadSchema.index({ lastActivity: -1 });

const Message = mongoose.model('Message', messageSchema);
const MessageThread = mongoose.model('MessageThread', messageThreadSchema);

module.exports = { Message, MessageThread };

