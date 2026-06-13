'use strict';
const AIUsage  = require('../models/AIUsage');
const Subscription = require('../models/Subscription');

// Daily limits per plan name
const DAILY_LIMITS = {
  FREE:         0,
  PROFESSIONAL: parseInt(process.env.AI_RATE_LIMIT_PRO        || '20'),
  ENTERPRISE:   parseInt(process.env.AI_RATE_LIMIT_ENTERPRISE || '100'),
};

/**
 * Middleware that checks whether the authenticated user is within their
 * daily AI request budget before allowing the AI controller to run.
 *
 * Must be placed AFTER `authenticate` and `requirePlan('PROFESSIONAL')`.
 */
const aiRateLimit = async (req, res, next) => {
  try {
    // Admins are exempt
    if (req.user.role === 'ADMIN') return next();

    // Determine plan
    let planName = 'FREE';
    try {
      const sub = await Subscription.findOne({ user: req.user._id })
        .populate('plan', 'name')
        .lean();
      planName = sub?.plan?.name || 'FREE';

      // Check trial expiry
      if (sub?.status === 'trialing' && sub?.trialEndsAt && new Date(sub.trialEndsAt) < new Date()) {
        planName = 'FREE';
      }
    } catch { /* treat as FREE */ }

    const limit = DAILY_LIMITS[planName] ?? 0;

    if (limit === 0) {
      return res.status(402).json({
        error:       'AI features require a Professional or Enterprise subscription.',
        currentPlan: planName,
        upgradeUrl:  '/app/billing',
      });
    }

    // Count today's requests
    const usedToday = await AIUsage.dailyCount(req.user._id);

    if (usedToday >= limit) {
      return res.status(429).json({
        error:       `Daily AI limit reached (${usedToday}/${limit}). Resets at midnight UTC.`,
        usedToday,
        limit,
        upgradeUrl:  '/app/billing',
      });
    }

    // Attach limit info to request for logging
    req.aiContext = { planName, usedToday, limit };
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { aiRateLimit };
