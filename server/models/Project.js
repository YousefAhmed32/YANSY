const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Budget and client info
  budget: {
    type: String,
    enum: ['less-than-500', '500-1000', '1000-3000', '3000-10000', '10000-plus'],
    required: true
  },
  clientType: {
    type: String,
    enum: ['individual', 'company'],
    required: true
  },
  companyName: {
    type: String,
    trim: true
  },
  companySize: {
    type: String,
    enum: ['less-than-10', '10-50', '50-plus']
  },
  // Progress tracking
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  phase: {
    type: String,
    enum: ['planning', 'design', 'development', 'testing', 'launch', 'completed'],
    default: 'planning'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'near-completion', 'delivered', 'cancelled'],
    default: 'pending'
  },
  updates: [{
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    attachments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File'
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  files: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  }],
  startDate: {
    type: Date
  },
  targetDate: {
    type: Date
  },
  completedDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Virtual method to get status text based on progress
projectSchema.virtual('statusText').get(function() {
  if (this.status === 'cancelled') return 'Cancelled';
  if (this.status === 'delivered' || this.progress === 100) return 'Delivered';
  if (this.progress >= 80) return 'Near Completion';
  if (this.progress > 0) return 'In Progress';
  return 'Pending';
});

// Method to update progress and auto-update status
projectSchema.methods.updateProgress = function(progress) {
  this.progress = Math.max(0, Math.min(100, progress));
  
  // Auto-update status based on progress
  if (this.status !== 'cancelled') {
    if (progress === 100) {
      this.status = 'delivered';
      if (!this.completedDate) {
        this.completedDate = new Date();
      }
    } else if (progress >= 80) {
      this.status = 'near-completion';
    } else if (progress > 0) {
      this.status = 'in-progress';
    } else {
      this.status = 'pending';
    }
  }
  
  return this.save();
};

// Index for efficient queries
projectSchema.index({ client: 1, status: 1 });
projectSchema.index({ phase: 1 });
projectSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);

