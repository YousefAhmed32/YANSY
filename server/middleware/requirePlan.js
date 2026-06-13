'use strict';
const Subscription = require('../models/Subscription');

const PLAN_HIERARCHY = { FREE: 0, PROFESSIONAL: 1, ENTERPRISE: 2 };

/**
 * Middleware that ensures the authenticated user's subscription plan
 * meets the minimum required plan level.
 *
 * Usage:
 *   router.post('/ai', authenticate, requirePlan('PROFESSIONAL'), ctrl.ai);
 */
const requirePlan = (...requiredPlans) => async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Admins bypass plan checks
    if (req.user.role === 'ADMIN') {
      return next();
    }

    const sub = await Subscription.findOne({ user: req.user._id })
      .populate('plan')
      .lean();

    // No subscription → treat as FREE
    const planName = sub?.plan?.name || 'FREE';

    // Check if trial has expired
    if (sub?.status === 'trialing' && sub?.trialEndsAt && new Date(sub.trialEndsAt) < new Date()) {
      // Trial expired — treat as FREE
      const isAllowedOnFree = requiredPlans.some(r => PLAN_HIERARCHY['FREE'] >= PLAN_HIERARCHY[r]);
      if (!isAllowedOnFree) {
        return res.status(402).json({
          error:         'Your free trial has ended. Upgrade to continue.',
          requiredPlan:  requiredPlans[0],
          currentPlan:   'FREE',
          trialExpired:  true,
        });
      }
      return next();
    }

    // Check subscription status for paid plans
    if (sub && !['trialing', 'active', 'free'].includes(sub.status) && planName !== 'FREE') {
      const isAllowedOnFree = requiredPlans.some(r => PLAN_HIERARCHY['FREE'] >= PLAN_HIERARCHY[r]);
      if (!isAllowedOnFree) {
        return res.status(402).json({
          error:        `Your subscription is ${sub.status}. Please update your billing.`,
          requiredPlan: requiredPlans[0],
          currentPlan:  'FREE',
        });
      }
      return next();
    }

    const userLevel = PLAN_HIERARCHY[planName] ?? 0;
    const meetsRequirement = requiredPlans.some(r => userLevel >= (PLAN_HIERARCHY[r] ?? 0));

    if (!meetsRequirement) {
      return res.status(402).json({
        error:        `This feature requires the ${requiredPlans[0]} plan or higher.`,
        requiredPlan: requiredPlans[0],
        currentPlan:  planName,
        upgradeUrl:   '/app/billing',
      });
    }

    // Attach subscription to request for downstream use
    req.subscription = sub;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware that checks a specific feature flag on the user's plan.
 *
 * Usage:
 *   router.post('/invoice', authenticate, requireFeature('invoicing'), ctrl.create);
 */
const requireFeature = (featureName) => async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
    if (req.user.role === 'ADMIN') return next();

    const sub = await Subscription.findOne({ user: req.user._id }).populate('plan').lean();
    const features = sub?.plan?.features || {};
    const planName  = sub?.plan?.name || 'FREE';

    if (!features[featureName]) {
      return res.status(402).json({
        error:       `The '${featureName}' feature is not available on your current plan.`,
        feature:     featureName,
        currentPlan: planName,
        upgradeUrl:  '/app/billing',
      });
    }

    req.subscription = sub;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requirePlan, requireFeature };
