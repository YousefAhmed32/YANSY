const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  feedbackType: {
    type: String,
    enum: ['project', 'general'],
    required: true,
    default: 'general'
  },
  ratings: {
    quality: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    speed: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    professionalism: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    overall: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    }
  },
  reviewText: {
    type: String,
    trim: true,
    default: ''
  },
  // Admin management fields
  isReviewed: {
    type: Boolean,
    default: false
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  isHighlighted: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  adminNotes: {
    type: String,
    trim: true,
    default: ''
  },
  // IP address for rate limiting (guest users)
  ipAddress: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Virtual for average rating
feedbackSchema.virtual('averageRating').get(function() {
  const { quality, speed, communication, professionalism, overall } = this.ratings;
  return ((quality + speed + communication + professionalism + overall) / 5).toFixed(1);
});

// Indexes for efficient queries
feedbackSchema.index({ userId: 1, projectId: 1 });
feedbackSchema.index({ projectId: 1 });
feedbackSchema.index({ isDeleted: 1, isHighlighted: 1 });
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ 'ratings.overall': 1 });

// Prevent duplicate feedback from same user for same project
feedbackSchema.index({ userId: 1, projectId: 1 }, { 
  unique: true, 
  partialFilterExpression: { userId: { $ne: null }, projectId: { $ne: null } }
});

// Method to check if feedback is low satisfaction (overall <= 2)
feedbackSchema.methods.isLowSatisfaction = function() {
  return this.ratings.overall <= 2;
};

module.exports = mongoose.model('Feedback', feedbackSchema);

