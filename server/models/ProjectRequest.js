const mongoose = require('mongoose');

const projectRequestSchema = new mongoose.Schema(
  {
    // ── New fields ──────────────────────────────────────
    projectType: {
      type: String,
      enum: ['restaurant', 'clinic', 'pharmacy', 'ecommerce', 'saas', 'realestate', 'education', 'delivery', 'other'],
      required: true,
    },
    referenceUrl: {
      type: String,
      trim: true,
      default: undefined,
    },
    tags: {
      type: [String],
      default: [],
    },
    timeline: {
      type: String,
      enum: ['asap', '1month', '2-3months', 'flexible'],
      required: true,
    },

    // ── Existing fields ─────────────────────────────────
    clientType: {
      type: String,
      enum: ['individual', 'company'],
      required: true,
    },
    projectDescription: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
    },
    budgetRange: {
      type: String,
      enum: ['less-than-500', '500-1000', '1000-3000', '3000-10000', '10000-plus'],
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: undefined,
    },
    companyName: {
      type: String,
      trim: true,
      default: undefined,
    },
    companySize: {
      type: String,
      enum: ['less-than-10', '10-50', '50-plus', null],
      default: undefined,
    },

    // ── Relations ───────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: undefined,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: undefined,
    },

    // ── Admin ───────────────────────────────────────────
    status: {
      type: String,
      enum: ['new', 'in-progress', 'completed'],
      default: 'new',
    },
    adminNotes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProjectRequest', projectRequestSchema);