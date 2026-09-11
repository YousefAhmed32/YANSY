const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
    index: true,
  },
  visitorType: {
    type: String,
    enum: ['admin', 'client', 'guest'],
    default: 'guest',
    index: true,
  },
  userName: {
    type: String,
    trim: true,
  },
  userEmail: {
    type: String,
    trim: true,
  },
  eventType: {
    type: String,
    required: true,
    index: true,
  },
  page: {
    type: String,
    required: true,
  },
  title: {
    type: String,
  },
  section: {
    type: String,
  },
  scrollDepth: {
    type: Number,
    min: 0,
    max: 100,
  },
  viewTime: {
    type: Number, // milliseconds
  },
  elementId: {
    type: String,
  },
  elementType: {
    type: String,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
  userAgent: {
    type: String,
  },
  device: {
    type: String,
  },
  browser: {
    type: String,
  },
  os: {
    type: String,
  },
  ip: {
    type: String,
  },
  country: {
    type: String,
  },
  city: {
    type: String,
  },
  screenResolution: {
    type: String,
  },
  language: {
    type: String,
  },
  utm: {
    source: String,
    medium: String,
    campaign: String,
    term: String,
    content: String,
  },
  referrer: {
    type: String,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
analyticsEventSchema.index({ sessionId: 1, createdAt: 1 });
analyticsEventSchema.index({ userId: 1, createdAt: -1 });
analyticsEventSchema.index({ eventType: 1, createdAt: -1 });
analyticsEventSchema.index({ page: 1, createdAt: -1 });
analyticsEventSchema.index({ createdAt: -1, isAdmin: 1 });
analyticsEventSchema.index({ createdAt: -1, visitorType: 1 });

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isAdmin: {
    type: Boolean,
    default: false,
    index: true,
  },
  visitorType: {
    type: String,
    enum: ['admin', 'client', 'guest'],
    default: 'guest',
    index: true,
  },
  userName: {
    type: String,
    trim: true,
  },
  userEmail: {
    type: String,
    trim: true,
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endTime: {
    type: Date,
  },
  duration: {
    type: Number, // milliseconds
  },
  entryPage: {
    type: String,
    default: '/',
  },
  exitPage: {
    type: String,
  },
  pages: [{
    page: String,
    title: String,
    viewTime: Number,
    scrollDepth: Number,
    enteredAt: Date,
  }],
  pageViewsCount: {
    type: Number,
    default: 0,
  },
  eventsCount: {
    type: Number,
    default: 0,
  },
  hasConversion: {
    type: Boolean,
    default: false,
    index: true,
  },
  conversions: [{
    type: String,
  }],
  userAgent: {
    type: String,
  },
  device: {
    type: String,
  },
  browser: {
    type: String,
  },
  os: {
    type: String,
  },
  ip: {
    type: String,
  },
  country: {
    type: String,
  },
  city: {
    type: String,
  },
  screenResolution: {
    type: String,
  },
  language: {
    type: String,
  },
  utm: {
    source: String,
    medium: String,
    campaign: String,
    term: String,
    content: String,
  },
  intentLevel: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'low',
    index: true,
  },
  visitCount: {
    type: Number,
    default: 1,
  },
  referrer: {
    type: String,
  },
  clarityUrl: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

sessionSchema.index({ userId: 1, startTime: -1 });
sessionSchema.index({ isActive: 1 });
sessionSchema.index({ startTime: -1, isAdmin: 1 });
sessionSchema.index({ startTime: -1, visitorType: 1 });
sessionSchema.index({ hasConversion: 1, startTime: -1 });
sessionSchema.index({ intentLevel: 1, startTime: -1 });
sessionSchema.index({ 'utm.campaign': 1, startTime: -1 });


const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);
const Session = mongoose.model('Session', sessionSchema);

module.exports = { AnalyticsEvent, Session };

