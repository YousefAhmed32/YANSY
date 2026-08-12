'use strict';
const mongoose = require('mongoose');
const {
  proposalSectionSchema, pricingSchema, timelineSchema, termsSchema, brandingSchema,
} = require('./schemas');

/**
 * A reusable proposal starting point ("Custom Software", "SaaS Platform",
 * "LMS", ...). Shares its `sections`/`pricing`/`timeline`/`terms`/`branding`
 * shape 1:1 with `Proposal` so `proposalController.createFromTemplate` can
 * copy them across with zero transformation.
 */
const proposalTemplateSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    nameAr:      { type: String, trim: true },
    slug:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
    category:    { type: String, trim: true },

    sections:        [proposalSectionSchema],
    defaultPricing:  { type: pricingSchema, default: () => ({}) },
    defaultTimeline: { type: timelineSchema, default: () => ({}) },
    defaultTerms:    { type: termsSchema, default: () => ({}) },
    branding:        { type: brandingSchema, default: () => ({}) },

    isDefault:  { type: Boolean, default: false },
    usageCount: { type: Number, default: 0 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

proposalTemplateSchema.index({ category: 1 });

module.exports = mongoose.model('ProposalTemplate', proposalTemplateSchema);
