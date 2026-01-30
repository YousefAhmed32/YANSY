const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  eventType: {
    type: String,
    enum: ['page_view', 'section_view', 'scroll', 'click', 'session_start', 'session_end'],
    required: true
  },
  page: {
    type: String,
    required: true
  },
  section: {
    type: String
  },
  scrollDepth: {
    type: Number,
    min: 0,
    max: 100
  },
  viewTime: {
    type: Number // milliseconds
  },
  elementId: {
    type: String
  },
  elementType: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  userAgent: {
    type: String
  },
  ip: {
    type: String
  },
  referrer: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
analyticsEventSchema.index({ sessionId: 1, createdAt: -1 });
analyticsEventSchema.index({ userId: 1, createdAt: -1 });
analyticsEventSchema.index({ eventType: 1, createdAt: -1 });
analyticsEventSchema.index({ page: 1, createdAt: -1 });

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number // milliseconds
  },
  pages: [{
    page: String,
    viewTime: Number,
    scrollDepth: Number,
    enteredAt: Date
  }],
  userAgent: {
    type: String
  },
  ip: {
    type: String
  },
  referrer: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

sessionSchema.index({ userId: 1, startTime: -1 });
sessionSchema.index({ isActive: 1 });

const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);
const Session = mongoose.model('Session', sessionSchema);

module.exports = { AnalyticsEvent, Session };

