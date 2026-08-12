'use strict';
const mongoose = require('mongoose');

/**
 * Shared sub-schemas for the Proposal Management System.
 * Used by both `Proposal` (a live, client-facing document) and
 * `ProposalTemplate` (a reusable starting point an admin picks from when
 * creating a new proposal) — one shape for both so a template's `sections`
 * can be copied verbatim onto a new proposal with no transform step.
 *
 * `sections[]` only covers wizard Step 3 (Scope) — pricing/timeline/terms
 * are dedicated top-level fields (wizard Steps 4-6), not sections, so the
 * renderer never has to guess which section id "is" the pricing block.
 */

const bulletSchema = new mongoose.Schema({
  text:   { type: String, trim: true, required: true },
  textAr: { type: String, trim: true },
}, { _id: false });

// A single card within a 'features-grid' section (one system/module) or a
// single step within a 'process' section. Kept as a real sub-document (not
// `_id:false`) so the editor's reorder/move-up-down UI always has a stable
// key to act on, even before the parent proposal is saved.
const sectionItemSchema = new mongoose.Schema({
  title:         { type: String, trim: true },
  titleAr:       { type: String, trim: true },
  description:   { type: String },
  descriptionAr: { type: String },
  icon:          { type: String, trim: true }, // lucide-react icon name, resolved client-side
  bullets:       [bulletSchema],
  span:          { type: Number, default: 1, min: 1, max: 4 }, // bento grid column span
  order:         { type: Number, default: 0 },
});

const SECTION_TYPES = ['vision', 'features-grid', 'spotlight', 'process', 'terms', 'custom'];

const proposalSectionSchema = new mongoose.Schema({
  type:          { type: String, enum: SECTION_TYPES, required: true },
  title:         { type: String, trim: true },
  titleAr:       { type: String, trim: true },
  eyebrow:       { type: String, trim: true },
  eyebrowAr:     { type: String, trim: true },
  description:   { type: String },
  descriptionAr: { type: String },
  bullets:       [bulletSchema],      // flat list — used by 'terms' and simple 'spotlight'/'custom'
  items:         [sectionItemSchema], // cards — used by 'features-grid' and 'process'
  emphasis:      { type: Boolean, default: false }, // dark/spotlight visual treatment
  order:         { type: Number, default: 0 },
  isHidden:      { type: Boolean, default: false }, // manual hide without deleting — ProposalRenderer skips it
});

const milestoneSchema = new mongoose.Schema({
  name:           { type: String, trim: true, required: true },
  nameAr:         { type: String, trim: true },
  percentage:     { type: Number, min: 0, max: 100 },
  amount:         { type: Number, min: 0 }, // recomputed from percentage server-side — see utils/proposals/pricing.js
  dueCondition:   { type: String, trim: true },
  dueConditionAr: { type: String, trim: true },
  order:          { type: Number, default: 0 },
});

const pricingSchema = new mongoose.Schema({
  price:               { type: Number, min: 0, default: 0 },
  currency:            { type: String, trim: true, default: 'EGP' },
  discount:            { type: Number, min: 0, default: 0 },
  discountType:        { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  tax:                 { type: Number, min: 0, default: 0 },
  taxType:             { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  finalPrice:          { type: Number, min: 0, default: 0 }, // computed on save, never hand-edited
  // "Sell the scope, discuss the number in the meeting" — a first-class
  // per-proposal toggle instead of the price simply being omitted by hand
  // from one document (see the academy-platform.html precedent).
  hidePriceFromClient: { type: Boolean, default: false },
  paymentScheduleType: { type: String, enum: ['full', '50-50', '40-30-30', 'custom'], default: 'full' },
  milestones:          [milestoneSchema],
}, { _id: false });

const timelinePhaseSchema = new mongoose.Schema({
  title:         { type: String, trim: true, required: true },
  titleAr:       { type: String, trim: true },
  description:   { type: String },
  descriptionAr: { type: String },
  duration:      { type: String, trim: true }, // free text, e.g. "Week 1–2"
  order:         { type: Number, default: 0 },
});

const timelineSchema = new mongoose.Schema({
  totalDuration:   { type: String, trim: true }, // e.g. "6–8 weeks"
  totalDurationAr: { type: String, trim: true },
  phases:          [timelinePhaseSchema],
}, { _id: false });

const termsSchema = new mongoose.Schema({
  scopeLimitations:   { type: String },
  revisionPolicy:     { type: String },
  paymentTerms:        { type: String },
  supportPeriod:       { type: String },
  hostingTerms:        { type: String },
  maintenanceTerms:    { type: String },
  ownership:           { type: String },
  cancellationPolicy:  { type: String },
  validityPeriod:      { type: String },
}, { _id: false });

const brandingSchema = new mongoose.Schema({
  logoUrl:        { type: String, trim: true, default: '/assets/image/logo/logo-2.png' },
  primaryColor:   { type: String, trim: true, default: '#2563EB' },
  accentColor:    { type: String, trim: true, default: '#A98A52' },
  coverStyle:     { type: String, enum: ['light', 'dark'], default: 'light' },
  footerText:     { type: String, trim: true, default: 'YANSY Tech' },
  footerTextAr:   { type: String, trim: true, default: 'YANSY Tech' },
  contactEmail:   { type: String, trim: true, default: 'yansytech@gmail.com' },
  contactPhone:   { type: String, trim: true, default: '+201090385390' },
  contactWebsite: { type: String, trim: true, default: 'yansytech.com' },
}, { _id: false });

module.exports = {
  SECTION_TYPES,
  bulletSchema, sectionItemSchema, proposalSectionSchema,
  milestoneSchema, pricingSchema,
  timelinePhaseSchema, timelineSchema,
  termsSchema, brandingSchema,
};
