'use strict';
const Plan         = require('../models/Plan');
const Subscription = require('../models/Subscription');
const Invoice      = require('../models/Invoice');
const User         = require('../models/User');
const stripeService = require('../utils/stripeService');
const emailService  = require('../utils/emailService');
const { audit }     = require('../utils/auditLogger');
const { createNotification } = require('./notificationController');
const { seedPlans }  = require('../seeds/plans');

const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();

// ── Helper: get or create subscription (always returns something) ─────────────
const getOrCreateSubscription = async (userId) => {
  let sub = await Subscription.findOne({ user: userId }).populate('plan');
  if (!sub) {
    const freePlan = await Plan.findOne({ name: 'FREE' });
    if (!freePlan) return null;
    sub = await Subscription.create({
      user:   userId,
      plan:   freePlan._id,
      status: 'free',
    });
    sub = await Subscription.findById(sub._id).populate('plan');
  }
  return sub;
};

// ── GET /api/billing/plans ────────────────────────────────────────────────────
exports.getPlans = async (req, res, next) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ order: 1 }).lean();
    res.json({ plans });
  } catch (err) { next(err); }
};

// ── GET /api/billing/subscription ────────────────────────────────────────────
exports.getSubscription = async (req, res, next) => {
  try {
    const sub = await getOrCreateSubscription(req.user._id);
    if (!sub) return res.status(404).json({ error: 'Subscription not found.' });

    // Auto-expire trial
    if (sub.status === 'trialing' && sub.trialEndsAt && new Date(sub.trialEndsAt) < new Date()) {
      const freePlan = await Plan.findOne({ name: 'FREE' });
      if (freePlan) {
        await Subscription.findByIdAndUpdate(sub._id, {
          plan:   freePlan._id,
          status: 'free',
        });
      }
      return exports.getSubscription(req, res, next);
    }

    res.json({ subscription: sub });
  } catch (err) { next(err); }
};

// ── POST /api/billing/checkout ────────────────────────────────────────────────
exports.createCheckout = async (req, res, next) => {
  try {
    if (!stripeService.isStripeConfigured()) {
      return res.status(503).json({ error: 'Payment processing is not configured. Contact support.' });
    }

    const { planId, billingCycle = 'monthly' } = req.body;
    if (!planId) return res.status(400).json({ error: 'planId is required.' });

    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) return res.status(404).json({ error: 'Plan not found.' });

    if (plan.name === 'FREE') {
      return res.status(400).json({ error: 'Cannot checkout for the free plan.' });
    }

    if (!plan.stripePriceId?.[billingCycle]) {
      return res.status(400).json({
        error: `Stripe Price ID not configured for ${plan.name} (${billingCycle}). Contact admin.`,
      });
    }

    const session = await stripeService.createCheckoutSession({
      user:        req.user,
      plan,
      billingCycle,
      successUrl:  `${CLIENT_URL}/app/billing?checkout=success`,
      cancelUrl:   `${CLIENT_URL}/app/billing?checkout=cancelled`,
    });

    res.json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (err) { next(err); }
};

// ── POST /api/billing/portal ──────────────────────────────────────────────────
exports.createPortal = async (req, res, next) => {
  try {
    if (!stripeService.isStripeConfigured()) {
      return res.status(503).json({ error: 'Payment processing is not configured.' });
    }

    if (!req.user.stripeCustomerId) {
      await stripeService.ensureStripeCustomer(req.user);
    }

    const session = await stripeService.createPortalSession({
      stripeCustomerId: req.user.stripeCustomerId,
      returnUrl:        `${CLIENT_URL}/app/billing`,
    });

    res.json({ portalUrl: session.url });
  } catch (err) { next(err); }
};

// ── POST /api/billing/cancel ──────────────────────────────────────────────────
exports.cancelSubscription = async (req, res, next) => {
  try {
    const sub = await Subscription.findOne({ user: req.user._id }).populate('plan');
    if (!sub || sub.status === 'free') {
      return res.status(400).json({ error: 'No active subscription to cancel.' });
    }

    if (sub.stripeSubscriptionId && stripeService.isStripeConfigured()) {
      await stripeService.cancelSubscription(sub.stripeSubscriptionId, false);
    }

    sub.cancelAtPeriodEnd = true;
    sub.cancelledAt = new Date();
    await sub.save();

    audit({
      req, action: 'subscription.cancel',
      entityType: 'User', entityId: req.user._id,
      after: { plan: sub.plan?.name, cancelAtPeriodEnd: true },
    });

    setImmediate(() => {
      emailService.sendSubscriptionCancelled(req.user, sub).catch(() => {});
    });

    res.json({ message: 'Subscription will be cancelled at the end of the billing period.', subscription: sub });
  } catch (err) { next(err); }
};

// ── POST /api/billing/reactivate ──────────────────────────────────────────────
exports.reactivateSubscription = async (req, res, next) => {
  try {
    const sub = await Subscription.findOne({ user: req.user._id });
    if (!sub || !sub.cancelAtPeriodEnd) {
      return res.status(400).json({ error: 'No pending cancellation to reactivate.' });
    }

    if (sub.stripeSubscriptionId && stripeService.isStripeConfigured()) {
      await stripeService.reactivateSubscription(sub.stripeSubscriptionId);
    }

    sub.cancelAtPeriodEnd = false;
    sub.cancelledAt = null;
    await sub.save();

    res.json({ message: 'Subscription reactivated successfully.', subscription: sub });
  } catch (err) { next(err); }
};

// ── POST /api/billing/invoice/:id/checkout ────────────────────────────────────
exports.createInvoicePayment = async (req, res, next) => {
  try {
    if (!stripeService.isStripeConfigured()) {
      return res.status(503).json({ error: 'Payment processing is not configured.' });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });

    if (invoice.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'This invoice has already been paid.' });
    }

    if (!req.user.stripeCustomerId) {
      await stripeService.ensureStripeCustomer(req.user);
    }

    const intent = await stripeService.createInvoicePaymentIntent({
      invoice,
      stripeCustomerId: req.user.stripeCustomerId,
    });

    // Store PaymentIntent ID on invoice
    invoice.stripePaymentIntentId = intent.id;
    await invoice.save();

    res.json({
      clientSecret:    intent.client_secret,
      paymentIntentId: intent.id,
      amount:          invoice.total,
      currency:        invoice.currency,
    });
  } catch (err) { next(err); }
};

// ── POST /api/billing/webhook ─────────────────────────────────────────────────
exports.handleWebhook = async (req, res) => {
  const sig    = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET not set — rejecting');
    return res.status(400).json({ error: 'Webhook secret not configured.' });
  }

  let event;
  try {
    event = stripeService.constructWebhookEvent(req.body, sig, secret);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  // Idempotency: skip already-processed events
  const existingSub = await Subscription.findOne({
    processedEventIds: event.id,
  });
  if (existingSub) {
    return res.json({ received: true, duplicate: true });
  }

  try {
    await processWebhookEvent(event);
    res.json({ received: true });
  } catch (err) {
    console.error('[webhook] Processing error:', err.message);
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
};

// ── Webhook event processor ───────────────────────────────────────────────────
const processWebhookEvent = async (event) => {
  const data   = event.data.object;
  const type   = event.type;

  console.log(`[webhook] Processing: ${type}`);

  switch (type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(data, event.id);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(data, event.id);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(data, event.id);
      break;

    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(data, event.id);
      break;

    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(data, event.id);
      break;

    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(data, event.id);
      break;

    case 'customer.subscription.trial_will_end':
      await handleTrialWillEnd(data);
      break;

    default:
      console.log(`[webhook] Unhandled event type: ${type}`);
  }
};

const handleCheckoutCompleted = async (session, eventId) => {
  if (session.mode !== 'subscription') return;

  const { userId, planId, billingCycle } = session.metadata || {};
  if (!userId || !planId) return;

  const stripeSubscription = await stripeService.getStripe().subscriptions.retrieve(
    session.subscription
  );

  const plan = await Plan.findById(planId);
  if (!plan) return;

  const sub = await Subscription.findOneAndUpdate(
    { user: userId },
    {
      plan:                 planId,
      status:               stripeSubscription.status === 'trialing' ? 'trialing' : 'active',
      billingCycle,
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId:     session.customer,
      currentPeriodStart:   new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd:     new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd:    false,
      $addToSet:            { processedEventIds: eventId },
    },
    { new: true, upsert: true }
  );

  // Update user stripeCustomerId
  await User.findByIdAndUpdate(userId, { stripeCustomerId: session.customer });

  // Send confirmation email
  const user = await User.findById(userId);
  if (user) {
    setImmediate(() => {
      emailService.sendSubscriptionConfirmed(user, plan).catch(() => {});
    });
    await createNotification({
      userId:  user._id,
      type:    'success',
      title:   `${plan.displayName} Plan Activated`,
      message: `Your ${plan.displayName} subscription is now active. Enjoy all features!`,
      link:    '/app/billing',
    });
  }

  console.log(`[webhook] Checkout completed: user ${userId} → ${plan.name}`);
};

const handleSubscriptionUpdated = async (stripeSub, eventId) => {
  const sub = await Subscription.findOne({ stripeSubscriptionId: stripeSub.id });
  if (!sub) return;

  const statusMap = {
    trialing:  'trialing',
    active:    'active',
    past_due:  'past_due',
    canceled:  'cancelled',
    unpaid:    'past_due',
    paused:    'paused',
    incomplete: 'incomplete',
    incomplete_expired: 'cancelled',
  };

  sub.status             = statusMap[stripeSub.status] || stripeSub.status;
  sub.cancelAtPeriodEnd  = stripeSub.cancel_at_period_end;
  sub.currentPeriodStart = new Date(stripeSub.current_period_start * 1000);
  sub.currentPeriodEnd   = new Date(stripeSub.current_period_end * 1000);
  sub.lastEventAt        = new Date();
  sub.processedEventIds.push(eventId);
  await sub.save();

  console.log(`[webhook] Subscription updated: ${stripeSub.id} → ${sub.status}`);
};

const handleSubscriptionDeleted = async (stripeSub, eventId) => {
  const sub = await Subscription.findOne({ stripeSubscriptionId: stripeSub.id }).populate('user');
  if (!sub) return;

  const freePlan = await Plan.findOne({ name: 'FREE' });

  sub.status               = 'cancelled';
  sub.cancelledAt          = new Date();
  sub.stripeSubscriptionId = null;
  if (freePlan) sub.plan   = freePlan._id;
  sub.processedEventIds.push(eventId);
  await sub.save();

  const user = await User.findById(sub.user);
  if (user) {
    setImmediate(() => {
      emailService.sendSubscriptionCancelled(user, sub).catch(() => {});
    });
    await createNotification({
      userId:  sub.user,
      type:    'alert',
      title:   'Subscription Cancelled',
      message: 'Your subscription has ended. You have been moved to the Free plan.',
      link:    '/app/billing',
    });
  }

  console.log(`[webhook] Subscription deleted: ${stripeSub.id}`);
};

const handleInvoicePaymentSucceeded = async (stripeInvoice, eventId) => {
  if (!stripeInvoice.subscription) return;

  const sub = await Subscription.findOne({ stripeSubscriptionId: stripeInvoice.subscription });
  if (!sub) return;

  if (sub.status !== 'active') {
    sub.status = 'active';
  }
  sub.stripeLatestInvoiceId = stripeInvoice.id;
  sub.processedEventIds.push(eventId);
  await sub.save();

  console.log(`[webhook] Invoice payment succeeded: ${stripeInvoice.id}`);
};

const handleInvoicePaymentFailed = async (stripeInvoice, eventId) => {
  if (!stripeInvoice.subscription) return;

  const sub = await Subscription.findOne({ stripeSubscriptionId: stripeInvoice.subscription }).populate('user');
  if (!sub) return;

  sub.status = 'past_due';
  sub.processedEventIds.push(eventId);
  await sub.save();

  const user = await User.findById(sub.user);
  if (user) {
    setImmediate(() => {
      emailService.sendPaymentFailed(user).catch(() => {});
    });
    await createNotification({
      userId:  sub.user,
      type:    'alert',
      title:   'Payment Failed',
      message: 'Your subscription payment failed. Please update your payment method to avoid losing access.',
      link:    '/app/billing',
    });
  }

  console.log(`[webhook] Invoice payment failed: ${stripeInvoice.id}`);
};

const handlePaymentIntentSucceeded = async (paymentIntent, eventId) => {
  const invoiceId = paymentIntent.metadata?.invoiceId;
  if (!invoiceId) return;

  await Invoice.findByIdAndUpdate(invoiceId, {
    status:        'paid',
    paidAt:        new Date(),
    paymentMethod: 'stripe',
    amountPaid:    paymentIntent.amount / 100,
  });

  console.log(`[webhook] Invoice paid: ${invoiceId}`);
};

const handleTrialWillEnd = async (stripeSub) => {
  const sub = await Subscription.findOne({ stripeSubscriptionId: stripeSub.id }).populate('plan');
  if (!sub) return;

  const user = await User.findById(sub.user);
  if (user) {
    setImmediate(() => {
      emailService.sendTrialEndingEmail(user, sub).catch(() => {});
    });
    await createNotification({
      userId:  sub.user,
      type:    'alert',
      title:   'Trial Ending in 3 Days',
      message: 'Your free trial ends in 3 days. Upgrade now to keep all your features.',
      link:    '/app/billing',
    });
  }

  console.log(`[webhook] Trial will end: ${stripeSub.id}`);
};

// ── GET /api/billing/history ──────────────────────────────────────────────────
exports.getBillingHistory = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(20, parseInt(req.query.limit) || 10);

    const [invoices, total] = await Promise.all([
      Invoice.find({ client: req.user._id, status: { $ne: 'draft' } })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
      Invoice.countDocuments({ client: req.user._id, status: { $ne: 'draft' } }),
    ]);

    res.json({ invoices, total, totalPages: Math.ceil(total / limit), currentPage: page });
  } catch (err) { next(err); }
};

// ── Admin endpoints ───────────────────────────────────────────────────────────

exports.adminGetSubscriptions = async (req, res, next) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 20);
    const { status, plan } = req.query;

    const query = {};
    if (status) query.status = status;
    if (plan)   query['plan.name'] = plan; // Note: needs aggregation for this

    const [subscriptions, total] = await Promise.all([
      Subscription.find(query)
        .populate('user', 'fullName email createdAt stripeCustomerId')
        .populate('plan', 'name displayName price')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
      Subscription.countDocuments(query),
    ]);

    res.json({ subscriptions, total, totalPages: Math.ceil(total / limit), currentPage: page });
  } catch (err) { next(err); }
};

exports.adminChangePlan = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { planId, status } = req.body;

    if (!planId) return res.status(400).json({ error: 'planId is required.' });

    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ error: 'Plan not found.' });

    const before = await Subscription.findOne({ user: userId }).populate('plan').lean();

    const sub = await Subscription.findOneAndUpdate(
      { user: userId },
      {
        plan:   planId,
        status: status || (plan.name === 'FREE' ? 'free' : 'active'),
      },
      { new: true, upsert: true }
    ).populate('plan');

    audit({
      req,
      action:     'subscription.admin_change',
      entityType: 'User',
      entityId:   userId,
      before:     { plan: before?.plan?.name, status: before?.status },
      after:      { plan: plan.name, status: sub.status },
    });

    const user = await User.findById(userId);
    if (user) {
      await createNotification({
        userId:  userId,
        type:    'info',
        title:   `Plan Updated: ${plan.displayName}`,
        message: `Your account has been moved to the ${plan.displayName} plan by an admin.`,
        link:    '/app/billing',
      });
    }

    res.json({ subscription: sub });
  } catch (err) { next(err); }
};

exports.adminSeedPlans = async (req, res, next) => {
  try {
    const plans = await seedPlans();
    res.json({ message: 'Plans seeded successfully.', plans });
  } catch (err) { next(err); }
};

exports.adminGetRevenue = async (req, res, next) => {
  try {
    const [
      totalSubs,
      activeSubs,
      trialSubs,
      cancelledSubs,
      planBreakdown,
      invoiceRevenue,
    ] = await Promise.all([
      Subscription.countDocuments(),
      Subscription.countDocuments({ status: 'active' }),
      Subscription.countDocuments({ status: 'trialing' }),
      Subscription.countDocuments({ status: 'cancelled' }),
      Subscription.aggregate([
        { $lookup: { from: 'plans', localField: 'plan', foreignField: '_id', as: 'planData' } },
        { $unwind: '$planData' },
        { $group: { _id: '$planData.name', count: { $sum: 1 }, displayName: { $first: '$planData.displayName' } } },
        { $sort: { _id: 1 } },
      ]),
      Invoice.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: '$currency', total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      subscriptions: { total: totalSubs, active: activeSubs, trialing: trialSubs, cancelled: cancelledSubs },
      planBreakdown,
      invoiceRevenue,
    });
  } catch (err) { next(err); }
};

// ── GET /api/billing/admin/financial-stats ──────────────────────────────────
exports.adminGetFinancialStats = async (req, res, next) => {
  try {
    const now        = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startYear  = new Date(now.getFullYear(), 0, 1);
    const lastMonth  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      activeSubscriptions,
      planData,
      mrrThisMonth,
      mrrLastMonth,
      invoiceStats,
      recentInvoices,
      subscriptionsByStatus,
    ] = await Promise.all([
      Subscription.countDocuments({ status: 'active' }),
      Subscription.aggregate([
        { $match: { status: { $in: ['active', 'trialing'] } } },
        { $lookup: { from: 'plans', localField: 'plan', foreignField: '_id', as: 'planData' } },
        { $unwind: '$planData' },
        {
          $group: {
            _id:         '$planData.name',
            count:       { $sum: 1 },
            displayName: { $first: '$planData.displayName' },
            monthlyRevenue: {
              $sum: {
                $cond: [
                  { $eq: ['$billingCycle', 'monthly'] },
                  { $arrayElemAt: ['$planData.price.monthly', 0] },
                  { $divide: [{ $arrayElemAt: ['$planData.price.annual', 0] }, 12] },
                ],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Invoice.aggregate([{ $match: { status: 'paid', paidAt: { $gte: startMonth } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Invoice.aggregate([{ $match: { status: 'paid', paidAt: { $gte: lastMonth, $lte: lastMonthEnd } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Invoice.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$total' } } },
      ]),
      Invoice.find({ status: 'paid' }).sort({ paidAt: -1 }).limit(10)
        .populate('client', 'fullName email').lean(),
      Subscription.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    // Calculate MRR from plan data
    const mrr = planData.reduce((sum, p) => sum + (p.monthlyRevenue || 0), 0);
    const arr  = mrr * 12;

    const thisMonthRevenue = mrrThisMonth[0]?.total || 0;
    const lastMonthRevenue = mrrLastMonth[0]?.total || 0;
    const revenueGrowth = lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : null;

    const invoiceStatusMap = invoiceStats.reduce((acc, s) => { acc[s._id] = { count: s.count, total: s.total }; return acc; }, {});
    const subStatusMap = subscriptionsByStatus.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {});

    res.json({
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(arr * 100) / 100,
      activeSubscriptions,
      planBreakdown:      planData,
      thisMonthRevenue,
      lastMonthRevenue,
      revenueGrowth,
      invoiceStatus:      invoiceStatusMap,
      subscriptionStatus: subStatusMap,
      recentPayments:     recentInvoices,
    });
  } catch (err) { next(err); }
};

exports.adminUpdatePlanPricing = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const { stripePriceId, stripeProductId, price } = req.body;

    const updates = {};
    if (stripePriceId)   updates.stripePriceId    = stripePriceId;
    if (stripeProductId) updates.stripeProductId  = stripeProductId;
    if (price)           updates.price            = price;

    const plan = await Plan.findByIdAndUpdate(planId, { $set: updates }, { new: true });
    if (!plan) return res.status(404).json({ error: 'Plan not found.' });

    res.json({ plan });
  } catch (err) { next(err); }
};
