'use strict';

let stripeInstance = null;

const getStripe = () => {
  if (stripeInstance) return stripeInstance;
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }
  stripeInstance = require('stripe')(process.env.STRIPE_SECRET_KEY);
  return stripeInstance;
};

/**
 * Returns true if Stripe is configured and available.
 */
const isStripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);

/**
 * Create or retrieve a Stripe customer for a user.
 */
const ensureStripeCustomer = async (user) => {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in .env');

  if (user.stripeCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      if (!customer.deleted) return customer;
    } catch {
      // Fall through to create new
    }
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name:  user.fullName,
    metadata: { userId: user._id.toString() },
  });

  user.stripeCustomerId = customer.id;
  await user.save();

  return customer;
};

/**
 * Create a Stripe Checkout Session for plan subscription.
 */
const createCheckoutSession = async ({ user, plan, billingCycle, successUrl, cancelUrl }) => {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe not configured');

  const priceId = plan.stripePriceId?.[billingCycle];
  if (!priceId) {
    throw new Error(`No Stripe price configured for plan '${plan.name}' (${billingCycle}). Add Stripe Price IDs in admin.`);
  }

  const customer = await ensureStripeCustomer(user);

  const session = await stripe.checkout.sessions.create({
    customer:             customer.id,
    mode:                 'subscription',
    payment_method_types: ['card'],
    line_items: [{
      price:    priceId,
      quantity: 1,
    }],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  cancelUrl,
    metadata: {
      userId:       user._id.toString(),
      planId:       plan._id.toString(),
      billingCycle,
    },
    subscription_data: {
      metadata: {
        userId:       user._id.toString(),
        planId:       plan._id.toString(),
        billingCycle,
      },
    },
    allow_promotion_codes: true,
  });

  return session;
};

/**
 * Create a Stripe Billing Portal session for self-service management.
 */
const createPortalSession = async ({ stripeCustomerId, returnUrl }) => {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe not configured');

  const session = await stripe.billingPortal.sessions.create({
    customer:   stripeCustomerId,
    return_url: returnUrl,
  });

  return session;
};

/**
 * Create a Stripe Payment Intent for a one-time invoice payment.
 */
const createInvoicePaymentIntent = async ({ invoice, stripeCustomerId }) => {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe not configured');

  // Convert to cents (Stripe uses smallest currency unit)
  const amountCents = Math.round(invoice.total * 100);

  const intent = await stripe.paymentIntents.create({
    amount:   amountCents,
    currency: (invoice.currency || 'USD').toLowerCase(),
    customer: stripeCustomerId,
    metadata: {
      invoiceId:     invoice._id.toString(),
      invoiceNumber: invoice.invoiceNumber,
    },
    description: `Payment for YANSY Invoice #${invoice.invoiceNumber}`,
    automatic_payment_methods: { enabled: true },
  });

  return intent;
};

/**
 * Cancel a Stripe subscription at period end.
 */
const cancelSubscription = async (stripeSubscriptionId, immediately = false) => {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe not configured');

  if (immediately) {
    return stripe.subscriptions.cancel(stripeSubscriptionId);
  }
  return stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  });
};

/**
 * Reactivate a subscription that was set to cancel at period end.
 */
const reactivateSubscription = async (stripeSubscriptionId) => {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe not configured');

  return stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: false,
  });
};

/**
 * Verify a Stripe webhook signature and construct the event.
 */
const constructWebhookEvent = (rawBody, signature, secret) => {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe not configured');
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
};

module.exports = {
  getStripe,
  isStripeConfigured,
  ensureStripeCustomer,
  createCheckoutSession,
  createPortalSession,
  createInvoicePaymentIntent,
  cancelSubscription,
  reactivateSubscription,
  constructWebhookEvent,
};
