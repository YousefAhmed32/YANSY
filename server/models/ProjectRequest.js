const mongoose = require('mongoose');

const projectRequestSchema = new mongoose.Schema({
  // Step 1: Client Type
  clientType: {
    type: String,
    enum: ['individual', 'company'],
    required: true
  },
  
  // Step 2: Project Description
  projectDescription: {
    type: String,
    required: true,
    trim: true
  },
  
  // Step 3: Budget Range
  budgetRange: {
    type: String,
    enum: ['less-than-500', '500-1000', '1000-3000', '3000-10000', '10000-plus'],
    required: true
  },
  
  // Step 4: Contact Details
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        // Email is optional if phone exists, but if provided must be valid
        return !v || /^\S+@\S+\.\S+$/.test(v);
      },
      message: 'Please provide a valid email address'
    }
  },
  
  // Conditional fields for Company type
  companyName: {
    type: String,
    trim: true
  },
  companySize: {
    type: String,
    enum: ['less-than-10', '10-50', '50-plus']
  },
  
  // Status management
  status: {
    type: String,
    enum: ['new', 'in-progress', 'completed'],
    default: 'new'
  },
  
  // Admin notes
  adminNotes: {
    type: String,
    trim: true
  },
  
  // Assigned admin
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Linked user (for authenticated requests)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
projectRequestSchema.index({ status: 1, createdAt: -1 });
projectRequestSchema.index({ clientType: 1 });
projectRequestSchema.index({ budgetRange: 1 });
projectRequestSchema.index({ user: 1 });

module.exports = mongoose.model('ProjectRequest', projectRequestSchema);

