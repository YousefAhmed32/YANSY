const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  cloudProvider: {
    type: String,
    enum: ['cloudinary', 's3', 'firebase'],
    default: 'cloudinary'
  },
  cloudId: {
    type: String // Cloud provider's file ID
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  message: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

// Indexes
fileSchema.index({ uploadedBy: 1, createdAt: -1 });
fileSchema.index({ project: 1 });
fileSchema.index({ message: 1 });

module.exports = mongoose.model('File', fileSchema);

