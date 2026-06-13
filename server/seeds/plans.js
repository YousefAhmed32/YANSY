'use strict';
/**
 * Seed default subscription plans.
 * Safe to run multiple times (upserts).
 *
 * Usage: node seeds/plans.js
 * Or via API: POST /api/admin/billing/plans/seed (admin only)
 */

const PLANS = [
  {
    name:        'FREE',
    displayName: 'Starter',
    description: 'Perfect for individuals and small projects.',
    price:       { monthly: 0, annual: 0 },
    trialDays:   0,
    order:       0,
    features: {
      maxProjects:       1,
      maxStorageGb:      1,
      maxTeamMembers:    1,
      aiFeatures:        false,
      invoicing:         false,
      apiAccess:         false,
      customBranding:    false,
      prioritySupport:   false,
      advancedAnalytics: false,
      whiteLabel:        false,
      sso:               false,
    },
  },
  {
    name:        'PROFESSIONAL',
    displayName: 'Professional',
    description: 'For growing teams and agencies.',
    price:       { monthly: 4900, annual: 47040 }, // $49/mo, $392/yr (save 20%)
    trialDays:   14,
    order:       1,
    features: {
      maxProjects:       10,
      maxStorageGb:      20,
      maxTeamMembers:    5,
      aiFeatures:        true,
      invoicing:         true,
      apiAccess:         false,
      customBranding:    false,
      prioritySupport:   true,
      advancedAnalytics: true,
      whiteLabel:        false,
      sso:               false,
    },
  },
  {
    name:        'ENTERPRISE',
    displayName: 'Enterprise',
    description: 'Unlimited scale. White-label. Custom everything.',
    price:       { monthly: 19900, annual: 191040 }, // $199/mo, $1592/yr (save 33%)
    trialDays:   0,
    order:       2,
    features: {
      maxProjects:       -1,
      maxStorageGb:      100,
      maxTeamMembers:    -1,
      aiFeatures:        true,
      invoicing:         true,
      apiAccess:         true,
      customBranding:    true,
      prioritySupport:   true,
      advancedAnalytics: true,
      whiteLabel:        true,
      sso:               true,
    },
  },
];

const seedPlans = async () => {
  const Plan = require('../models/Plan');
  const results = [];

  for (const planData of PLANS) {
    const plan = await Plan.findOneAndUpdate(
      { name: planData.name },
      { $set: planData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    results.push(plan);
    console.log(`[seed] Plan ${plan.name} (${plan.displayName}) — upserted`);
  }

  return results;
};

module.exports = { seedPlans, PLANS };

// Allow direct CLI execution
if (require.main === module) {
  require('dotenv').config();
  const mongoose = require('mongoose');
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yansy')
    .then(async () => {
      await seedPlans();
      console.log('[seed] Plans seeded successfully.');
      process.exit(0);
    })
    .catch(err => {
      console.error('[seed] Error:', err.message);
      process.exit(1);
    });
}
