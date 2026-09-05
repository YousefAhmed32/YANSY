const mongoose = require('mongoose');

const projectRequestSchema = new mongoose.Schema(
  {
    // ── New fields ──────────────────────────────────────
    projectType: {
      type: String,
      enum: ['restaurant', 'clinic', 'pharmacy', 'ecommerce', 'saas', 'realestate', 'education', 'delivery', 'website', 'mobile', 'erp', 'crm', 'booking', 'automation', 'other'],
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
      enum: ['asap', '1month', '2-3months', 'flexible', 'unknown'],
      default: 'unknown',
    },

    // ── Existing fields ─────────────────────────────────
    clientType: {
      type: String,
      enum: ['individual', 'company', 'unknown'],
      default: 'unknown',
    },
    projectDescription: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
    },
    budgetRange: {
      type: String,
      enum: ['less-than-500', '500-1000', '1000-3000', '3000-10000', '10000-plus', 'not-sure', 'unknown'],
      default: 'unknown',
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: false,
      trim: true,
      default: '',
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

    // ── Admin & Pipeline ─────────────────────────────────
    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiating', 'won', 'lost', 'in-progress', 'completed'],
      default: 'new',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    estimatedValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    nextFollowUpDate: {
      type: Date,
      default: undefined,
    },
    lossReason: {
      type: String,
      trim: true,
      default: undefined,
    },
    stageHistory: [
      {
        stage:   { type: String, required: true },
        movedAt: { type: Date, default: Date.now },
        movedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note:    { type: String, trim: true, default: '' },
      }
    ],
    magicToken: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    briefData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    convertedProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: undefined,
    },
    convertedProposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      default: undefined,
    },
    adminNotes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// Auto-generate magicToken before saving if not present
projectRequestSchema.pre('save', function (next) {
  if (!this.magicToken) {
    const crypto = require('crypto');
    this.magicToken = 'pb_' + crypto.randomBytes(12).toString('hex');
  }
  next();
});

// Admin list/filter view queries by status + sorts by createdAt (projectRequestController.getAllRequests);
// getUserRequests queries by user.
projectRequestSchema.index({ status: 1, createdAt: -1 });
projectRequestSchema.index({ user: 1 });
projectRequestSchema.index({ createdAt: -1 });
projectRequestSchema.index({ nextFollowUpDate: 1 });

module.exports = mongoose.model('ProjectRequest', projectRequestSchema);