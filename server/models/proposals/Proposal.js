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
const TYPES = ['DYNAMIC', 'IMPORTED_HTML'];

// The uploaded HTML document backing an IMPORTED_HTML proposal — stored in
// the app's existing GridFS bucket (server/media/gridfsRepository.js), not
// inline in this document, matching how every other uploaded asset in this
// app is stored. `fileId` is the GridFS file's own _id; the document is
// streamed back on demand by controllers/proposals/htmlImportController.js,
// never embedded as a string here. Dormant/empty for `type: 'DYNAMIC'`.
const htmlAssetSchema = new mongoose.Schema({
  storageType:  { type: String, enum: ['gridfs'], default: 'gridfs' },
  fileId:       { type: mongoose.Schema.Types.ObjectId, default: null },
  originalName: { type: String, trim: true },
  size:         { type: Number },
  mimeType:     { type: String, trim: true, default: 'text/html' },
  uploadedAt:   { type: Date },
  // Non-blocking heads-up surfaced at upload time (see media/htmlSanitizer.js
  // inspectWarnings) — e.g. "relies on relative local asset paths".
  warnings:     [{ type: String }],
}, { _id: false });

const proposalSchema = new mongoose.Schema(
  {
    proposalNumber: { type: String, required: true, unique: true },
    slug:           { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },

    // DYNAMIC (default) is rendered by <ProposalRenderer> from
    // sections/pricing/timeline/terms/branding below. IMPORTED_HTML is an
    // already-designed standalone document hosted as-is — see htmlAsset.
    type: { type: String, enum: TYPES, default: 'DYNAMIC', index: true },

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

    // Only populated for type: 'IMPORTED_HTML'.
    htmlAsset: { type: htmlAssetSchema, default: () => ({}) },

    template: { type: mongoose.Schema.Types.ObjectId, ref: 'ProposalTemplate', default: null },

    status: { type: String, enum: STATUSES, default: 'DRAFT', index: true },

    // Private admin-only note — never exposed via the public projection
    // (publicProposalController.toPublicProposal).
    notes: { type: String, trim: true },

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
proposalSchema.statics.TYPES = TYPES;

module.exports = mongoose.model('Proposal', proposalSchema);
