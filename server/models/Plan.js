'use strict';
const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema({
  maxProjects:       { type: Number, default: 1 },   // -1 = unlimited
  maxStorageGb:      { type: Number, default: 1 },
  maxTeamMembers:    { type: Number, default: 1 },   // -1 = unlimited
  aiFeatures:        { type: Boolean, default: false },
  invoicing:         { type: Boolean, default: false },
  apiAccess:         { type: Boolean, default: false },
  customBranding:    { type: Boolean, default: false },
  prioritySupport:   { type: Boolean, default: false },
  advancedAnalytics: { type: Boolean, default: false },
  whiteLabel:        { type: Boolean, default: false },
  sso:               { type: Boolean, default: false },
}, { _id: false });

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['FREE', 'PROFESSIONAL', 'ENTERPRISE'],
    uppercase: true,
  },
  displayName: { type: String, required: true, trim: true },
  description:  { type: String, trim: true, default: '' },

  price: {
    monthly: { type: Number, default: 0 }, // in USD cents
    annual:  { type: Number, default: 0 }, // in USD cents / year
  },

  stripePriceId: {
    monthly: { type: String, default: null },
    annual:  { type: String, default: null },
  },
  stripeProductId: { type: String, default: null },

  features:  { type: featureSchema, default: () => ({}) },

  trialDays: { type: Number, default: 0 },
  isActive:  { type: Boolean, default: true },
  order:     { type: Number, default: 0 },   // display order (0 = first)
}, {
  timestamps: true,
});

// Computed: human-readable monthly price
planSchema.virtual('monthlyUSD').get(function () {
  return this.price.monthly / 100;
});

// `name` is already indexed via the field-level `unique: true` above —
// declaring it again here triggered a Mongoose duplicate-index boot warning.
planSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('Plan', planSchema);
