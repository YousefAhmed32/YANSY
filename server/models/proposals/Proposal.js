'use strict';
const mongoose = require('mongoose');
const {
  proposalSectionSchema, pricingSchema, timelineSchema, termsSchema, brandingSchema,
} = require('./schemas');
const { computeFinalPrice, computeMilestoneAmounts } = require('../../utils/proposals/pricing');

const viewLogEntrySchema = new mongoose.Schema({
  viewedAt: { type: Date, default: Date.now },
  device:   { type: String, trim: true },
  browser:  { type: String, trim: true },
  os:       { type: String, trim: true },
  // Coarse, derived server-side from geoip-lite at request time — country
  // only, never the raw IP and never a precise location. See
  // publicProposalController.recordView.
  country:  { type: String, trim: true },
}, { _id: false });

const clientResponseSchema = new mongoose.Schema({
  type:        { type: String, enum: ['accepted', 'change_requested'] },
  name:        { type: String, trim: true },
  email:       { type: String, trim: true },
  message:     { type: String, trim: true },
  respondedAt: { type: Date },
}, { _id: false });

const STATUSES = ['DRAFT', 'SENT', 'VIEWED', 'CHANGE_REQUESTED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'ARCHIVED'];

const proposalSchema = new mongoose.Schema(
  {
    proposalNumber: { type: String, required: true, unique: true },
    slug:           { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },

    client: { type: mongoose.Schema.Types.ObjectId, ref: 'ProposalClient', required: true },

    project: {
      title:             { type: String, required: true, trim: true },
      titleAr:           { type: String, trim: true },
      type:              { type: String, trim: true },
      description:       { type: String },
      descriptionAr:     { type: String },
      objective:         { type: String },
      objectiveAr:       { type: String },
      startDate:         { type: Date },
      estimatedDuration: { type: String, trim: true },
      priority:          { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    },

    sections: [proposalSectionSchema],
    pricing:  { type: pricingSchema, default: () => ({}) },
    timeline: { type: timelineSchema, default: () => ({}) },
    terms:    { type: termsSchema, default: () => ({}) },
    branding: { type: brandingSchema, default: () => ({}) },

    template: { type: mongoose.Schema.Types.ObjectId, ref: 'ProposalTemplate', default: null },

    status: { type: String, enum: STATUSES, default: 'DRAFT', index: true },

    validityDate:   { type: Date },
    publishedAt:    { type: Date },
    firstViewedAt:  { type: Date },
    lastViewedAt:   { type: Date },
    viewCount:      { type: Number, default: 0 },
    viewLog:        [viewLogEntrySchema],
    clientResponse: clientResponseSchema,

    currentVersion: { type: Number, default: 1 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

proposalSchema.index({ status: 1, createdAt: -1 });
proposalSchema.index({ client: 1 });
proposalSchema.index({ 'project.title': 'text', proposalNumber: 'text' });

// Keeps finalPrice/milestone amounts in sync with price/discount/tax on
// every save — controllers only ever write the raw inputs, never
// finalPrice itself, so this is the one place the derived numbers can go
// stale, and it can't.
proposalSchema.pre('save', function (next) {
  if (this.isModified('pricing')) {
    this.pricing.finalPrice = computeFinalPrice(this.pricing);
    if (this.pricing.milestones?.length) {
      const withAmounts = computeMilestoneAmounts(this.pricing);
      this.pricing.milestones.forEach((m, i) => { m.amount = withAmounts[i]?.amount ?? m.amount; });
    }
  }
  next();
});

proposalSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('Proposal', proposalSchema);
