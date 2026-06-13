'use strict';
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,  // one subscription per user
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true,
  },

  status: {
    type: String,
    enum: ['trialing', 'active', 'past_due', 'cancelled', 'paused', 'incomplete', 'free'],
    default: 'free',
  },

  billingCycle: {
    type: String,
    enum: ['monthly', 'annual'],
    default: 'monthly',
  },

  // Trial tracking
  trialStartedAt: { type: Date, default: null },
  trialEndsAt:    { type: Date, default: null },

  // Billing period (from Stripe)
  currentPeriodStart: { type: Date, default: null },
  currentPeriodEnd:   { type: Date, default: null },
  cancelAtPeriodEnd:  { type: Boolean, default: false },
  cancelledAt:        { type: Date, default: null },

  // Stripe IDs
  stripeSubscriptionId:  { type: String, default: null, index: true },
  stripeCustomerId:      { type: String, default: null, index: true },
  stripePaymentMethodId: { type: String, default: null },
  stripeLatestInvoiceId: { type: String, default: null },

  // Processed Stripe event IDs (idempotency)
  processedEventIds: [{ type: String }],

  // History tracking
  upgradedFrom:   { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', default: null },
  downgradedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', default: null },
  lastEventAt:    { type: Date, default: null },
}, {
  timestamps: true,
});

// Virtual: is the trial still active?
subscriptionSchema.virtual('isTrialActive').get(function () {
  return this.status === 'trialing' && this.trialEndsAt && this.trialEndsAt > new Date();
});

// Virtual: is the subscription currently in a paid/usable state?
subscriptionSchema.virtual('isPaidActive').get(function () {
  return ['active', 'trialing'].includes(this.status);
});

// Indexes
subscriptionSchema.index({ user: 1 }, { unique: true });
subscriptionSchema.index({ stripeSubscriptionId: 1 });
subscriptionSchema.index({ stripeCustomerId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ trialEndsAt: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
