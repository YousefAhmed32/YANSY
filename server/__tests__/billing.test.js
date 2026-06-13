'use strict';
/**
 * Phase 3 — Billing system tests.
 * All tests run without database or Stripe connections.
 */

const fs   = require('fs');
const path = require('path');

const readFile = (relPath) =>
  fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');

// ── Plan model ────────────────────────────────────────────────────────────────
describe('Plan model', () => {
  const Plan = require('../models/Plan');

  it('exports a Mongoose model', () => {
    expect(Plan.modelName).toBe('Plan');
  });

  it('has name, displayName, price, features, trialDays', () => {
    const schema = Plan.schema;
    expect(schema.path('name')).toBeDefined();
    expect(schema.path('displayName')).toBeDefined();
    expect(schema.path('price.monthly')).toBeDefined();
    expect(schema.path('price.annual')).toBeDefined();
    expect(schema.path('trialDays')).toBeDefined();
  });

  it('name enum includes FREE PROFESSIONAL ENTERPRISE', () => {
    const schema = Plan.schema;
    const nameEnum = schema.path('name').enumValues;
    expect(nameEnum).toContain('FREE');
    expect(nameEnum).toContain('PROFESSIONAL');
    expect(nameEnum).toContain('ENTERPRISE');
  });

  it('features schema includes all expected flags', () => {
    const schema = Plan.schema;
    const featureFlags = [
      'features.aiFeatures',
      'features.invoicing',
      'features.apiAccess',
      'features.customBranding',
      'features.prioritySupport',
      'features.advancedAnalytics',
      'features.whiteLabel',
      'features.sso',
    ];
    featureFlags.forEach(flag => {
      expect(schema.path(flag)).toBeDefined();
    });
  });

  it('defaults trialDays to 0', () => {
    const plan = new Plan({ name: 'FREE', displayName: 'Free' });
    expect(plan.trialDays).toBe(0);
  });

  it('defaults isActive to true', () => {
    const plan = new Plan({ name: 'FREE', displayName: 'Free' });
    expect(plan.isActive).toBe(true);
  });
});

// ── Subscription model ────────────────────────────────────────────────────────
describe('Subscription model', () => {
  const Subscription = require('../models/Subscription');
  const mongoose     = require('mongoose');

  it('exports a Mongoose model', () => {
    expect(Subscription.modelName).toBe('Subscription');
  });

  it('has user, plan, status, billingCycle, stripeSubscriptionId', () => {
    const schema = Subscription.schema;
    expect(schema.path('user')).toBeDefined();
    expect(schema.path('plan')).toBeDefined();
    expect(schema.path('status')).toBeDefined();
    expect(schema.path('billingCycle')).toBeDefined();
    expect(schema.path('stripeSubscriptionId')).toBeDefined();
  });

  it('status enum includes all expected values', () => {
    const schema = Subscription.schema;
    const statusEnum = schema.path('status').enumValues;
    ['trialing', 'active', 'past_due', 'cancelled', 'paused', 'incomplete', 'free'].forEach(s => {
      expect(statusEnum).toContain(s);
    });
  });

  it('defaults status to free', () => {
    const sub = new Subscription({
      user: new mongoose.Types.ObjectId(),
      plan: new mongoose.Types.ObjectId(),
    });
    expect(sub.status).toBe('free');
  });

  it('defaults billingCycle to monthly', () => {
    const sub = new Subscription({
      user: new mongoose.Types.ObjectId(),
      plan: new mongoose.Types.ObjectId(),
    });
    expect(sub.billingCycle).toBe('monthly');
  });

  it('has processedEventIds array for idempotency', () => {
    const schema = Subscription.schema;
    expect(schema.path('processedEventIds')).toBeDefined();
  });
});

// ── Stripe service ────────────────────────────────────────────────────────────
describe('stripeService', () => {
  it('exports all required functions', () => {
    const svc = require('../utils/stripeService');
    const expected = [
      'getStripe', 'isStripeConfigured', 'ensureStripeCustomer',
      'createCheckoutSession', 'createPortalSession',
      'createInvoicePaymentIntent', 'cancelSubscription',
      'reactivateSubscription', 'constructWebhookEvent',
    ];
    expected.forEach(fn => {
      expect(typeof svc[fn]).toBe('function');
    });
  });

  it('isStripeConfigured returns false when key not set', () => {
    const original = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    const { isStripeConfigured } = require('../utils/stripeService');
    expect(isStripeConfigured()).toBe(false);
    if (original) process.env.STRIPE_SECRET_KEY = original;
  });
});

// ── requirePlan middleware ────────────────────────────────────────────────────
describe('requirePlan middleware', () => {
  it('exports requirePlan and requireFeature functions', () => {
    const mw = require('../middleware/requirePlan');
    expect(typeof mw.requirePlan).toBe('function');
    expect(typeof mw.requireFeature).toBe('function');
  });

  it('requirePlan returns a middleware function', () => {
    const { requirePlan } = require('../middleware/requirePlan');
    const mw = requirePlan('PROFESSIONAL');
    expect(typeof mw).toBe('function');
    expect(mw.length).toBe(3); // (req, res, next)
  });

  it('requireFeature returns a middleware function', () => {
    const { requireFeature } = require('../middleware/requirePlan');
    const mw = requireFeature('invoicing');
    expect(typeof mw).toBe('function');
    expect(mw.length).toBe(3);
  });

  it('requirePlan allows ADMIN to bypass plan check', async () => {
    const { requirePlan } = require('../middleware/requirePlan');
    const mw = requirePlan('ENTERPRISE');

    const req  = { user: { _id: 'admin123', role: 'ADMIN' } };
    const res  = {};
    const next = jest.fn();

    await mw(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('requirePlan returns 401 when no user', async () => {
    const { requirePlan } = require('../middleware/requirePlan');
    const mw = requirePlan('PROFESSIONAL');

    const req  = {};
    const res  = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await mw(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

// ── Billing controller ────────────────────────────────────────────────────────
describe('billingController', () => {
  it('exports all required handler functions', () => {
    const ctrl = require('../controllers/billingController');
    const expected = [
      'getPlans', 'getSubscription', 'createCheckout', 'createPortal',
      'cancelSubscription', 'reactivateSubscription', 'createInvoicePayment',
      'handleWebhook', 'getBillingHistory',
      'adminGetSubscriptions', 'adminChangePlan', 'adminSeedPlans', 'adminGetRevenue',
    ];
    expected.forEach(fn => {
      expect(typeof ctrl[fn]).toBe('function');
    });
  });
});

// ── Billing routes ────────────────────────────────────────────────────────────
describe('billing routes', () => {
  it('billing routes module loads without error', () => {
    const routes = require('../routes/billing');
    expect(routes).toBeDefined();
  });
});

// ── Plan seed script ──────────────────────────────────────────────────────────
describe('plan seed script', () => {
  it('exports seedPlans function and PLANS array', () => {
    const { seedPlans, PLANS } = require('../seeds/plans');
    expect(typeof seedPlans).toBe('function');
    expect(Array.isArray(PLANS)).toBe(true);
    expect(PLANS.length).toBe(3);
  });

  it('PLANS array has FREE, PROFESSIONAL, ENTERPRISE in order', () => {
    const { PLANS } = require('../seeds/plans');
    expect(PLANS[0].name).toBe('FREE');
    expect(PLANS[1].name).toBe('PROFESSIONAL');
    expect(PLANS[2].name).toBe('ENTERPRISE');
  });

  it('PROFESSIONAL plan has 14-day trial', () => {
    const { PLANS } = require('../seeds/plans');
    const pro = PLANS.find(p => p.name === 'PROFESSIONAL');
    expect(pro.trialDays).toBe(14);
  });

  it('FREE plan has price 0', () => {
    const { PLANS } = require('../seeds/plans');
    const free = PLANS.find(p => p.name === 'FREE');
    expect(free.price.monthly).toBe(0);
    expect(free.price.annual).toBe(0);
  });

  it('ENTERPRISE plan has unlimited projects (-1)', () => {
    const { PLANS } = require('../seeds/plans');
    const ent = PLANS.find(p => p.name === 'ENTERPRISE');
    expect(ent.features.maxProjects).toBe(-1);
    expect(ent.features.maxTeamMembers).toBe(-1);
  });

  it('PROFESSIONAL plan has AI features enabled', () => {
    const { PLANS } = require('../seeds/plans');
    const pro = PLANS.find(p => p.name === 'PROFESSIONAL');
    expect(pro.features.aiFeatures).toBe(true);
    expect(pro.features.invoicing).toBe(true);
  });
});

// ── User model stripe field ───────────────────────────────────────────────────
describe('User model stripeCustomerId', () => {
  it('User schema has stripeCustomerId field', () => {
    const User = require('../models/User');
    expect(User.schema.path('stripeCustomerId')).toBeDefined();
  });
});

// ── Email service billing templates ──────────────────────────────────────────
describe('emailService billing templates', () => {
  it('exports all billing email functions', () => {
    const svc = require('../utils/emailService');
    const billingFns = [
      'sendSubscriptionConfirmed',
      'sendSubscriptionCancelled',
      'sendPaymentFailed',
      'sendTrialEndingEmail',
    ];
    billingFns.forEach(fn => {
      expect(typeof svc[fn]).toBe('function');
    });
  });

  it('sendSubscriptionConfirmed does not throw without SMTP', async () => {
    const { sendSubscriptionConfirmed } = require('../utils/emailService');
    const user = { email: 'test@test.com', fullName: 'Test User' };
    const plan = { displayName: 'Professional' };
    await expect(sendSubscriptionConfirmed(user, plan)).resolves.not.toThrow();
  });

  it('sendPaymentFailed does not throw without SMTP', async () => {
    const { sendPaymentFailed } = require('../utils/emailService');
    await expect(sendPaymentFailed({ email: 'test@test.com' })).resolves.not.toThrow();
  });
});

// ── Billing source code checks ────────────────────────────────────────────────
describe('Billing code quality', () => {
  it('webhook handler verifies Stripe signature before processing', () => {
    const src = readFile('controllers/billingController.js');
    expect(src).toContain('constructWebhookEvent');
    expect(src).toContain('stripe-signature');
    expect(src).toContain('STRIPE_WEBHOOK_SECRET');
  });

  it('webhook handler has idempotency check', () => {
    const src = readFile('controllers/billingController.js');
    expect(src).toContain('processedEventIds');
  });

  it('checkout validates that FREE plan cannot be checked out', () => {
    const src = readFile('controllers/billingController.js');
    expect(src).toContain("plan.name === 'FREE'");
    expect(src).toContain("Cannot checkout for the free plan");
  });

  it('stripeService returns null when key not configured (not throws)', () => {
    const src = readFile('utils/stripeService.js');
    expect(src).toContain('return null');
    expect(src).toContain('STRIPE_SECRET_KEY');
  });

  it('requirePlan hierarchy has correct ordering', () => {
    const src = readFile('middleware/requirePlan.js');
    expect(src).toContain('FREE: 0');
    expect(src).toContain('PROFESSIONAL: 1');
    expect(src).toContain('ENTERPRISE: 2');
  });

  it('billing routes file has webhook with raw body parser', () => {
    const src = readFile('routes/billing.js');
    expect(src).toContain('express.raw');
    expect(src).toContain('/webhook');
  });

  it('server.js registers billing routes', () => {
    const src = readFile('server.js');
    expect(src).toContain('billingRoutes');
    expect(src).toContain('/api/billing');
  });
});
