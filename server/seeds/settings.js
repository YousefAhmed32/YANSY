'use strict';
/**
 * Seed default system settings.
 * Safe to run multiple times (upserts by key).
 * Existing values are NOT overwritten — only inserts missing keys.
 *
 * Usage: node seeds/settings.js
 * Or via API: POST /api/admin/settings/seed (SUPER_ADMIN only)
 */

const DEFAULT_SETTINGS = [
  // ── General ──────────────────────────────────────────────────────────────
  { key: 'platform.name',            value: 'YANSY',                  type: 'string',  category: 'general',  label: 'Platform Name',           isPublic: true  },
  { key: 'platform.tagline',         value: 'Premium Digital Agency',  type: 'string',  category: 'general',  label: 'Tagline',                 isPublic: true  },
  { key: 'platform.supportEmail',    value: 'support@yansytech.com',   type: 'string',  category: 'general',  label: 'Support Email',           isPublic: true  },
  { key: 'platform.whatsappNumber',  value: '+201090385390',           type: 'string',  category: 'general',  label: 'WhatsApp Number',         isPublic: true  },

  // ── Platform controls ────────────────────────────────────────────────────
  { key: 'platform.maintenanceMode',     value: false, type: 'boolean', category: 'platform', label: 'Maintenance Mode',         isPublic: false },
  { key: 'platform.maintenanceMessage',  value: 'We are performing scheduled maintenance. Back shortly.', type: 'string', category: 'platform', label: 'Maintenance Message', isPublic: true },
  { key: 'platform.registrationEnabled', value: true,  type: 'boolean', category: 'platform', label: 'User Registration Enabled', isPublic: false },
  { key: 'platform.feedbackEnabled',     value: true,  type: 'boolean', category: 'platform', label: 'Public Feedback Form',      isPublic: false },

  // ── Security ─────────────────────────────────────────────────────────────
  { key: 'security.sessionTimeoutMinutes', value: 10080, type: 'number', category: 'security', label: 'Session Timeout (minutes)', description: '10080 = 7 days', isPublic: false },
  { key: 'security.maxLoginAttempts',      value: 10,    type: 'number', category: 'security', label: 'Max Login Attempts',        isPublic: false },
  { key: 'security.minPasswordLength',     value: 8,     type: 'number', category: 'security', label: 'Minimum Password Length',   isPublic: false },
  { key: 'security.requireUppercase',      value: false, type: 'boolean', category: 'security', label: 'Require Uppercase',        isPublic: false },
  { key: 'security.require2FA',            value: false, type: 'boolean', category: 'security', label: 'Require 2FA',              isPublic: false },

  // ── AI ───────────────────────────────────────────────────────────────────
  { key: 'ai.enabled',              value: true,                  type: 'boolean', category: 'ai', label: 'AI Features Enabled',      isPublic: true  },
  { key: 'ai.defaultModel',         value: 'claude-sonnet-4-6',   type: 'string',  category: 'ai', label: 'Default AI Model',         isPublic: false },
  { key: 'ai.rateLimitPro',         value: 20,                    type: 'number',  category: 'ai', label: 'PRO Daily AI Limit',        isPublic: false },
  { key: 'ai.rateLimitEnterprise',  value: 100,                   type: 'number',  category: 'ai', label: 'ENTERPRISE Daily AI Limit', isPublic: false },
  { key: 'ai.maxOutputTokens',      value: 2048,                  type: 'number',  category: 'ai', label: 'Max Output Tokens',         isPublic: false },
  { key: 'ai.systemPromptAddendum', value: '',                    type: 'string',  category: 'ai', label: 'System Prompt Addendum',   isPublic: false },

  // ── Features ─────────────────────────────────────────────────────────────
  { key: 'features.search',         value: true,  type: 'boolean', category: 'features', label: 'Global Search',          isPublic: true  },
  { key: 'features.notifications',  value: true,  type: 'boolean', category: 'features', label: 'Notifications',          isPublic: true  },
  { key: 'features.invoicing',      value: true,  type: 'boolean', category: 'features', label: 'Client Invoicing',       isPublic: true  },
  { key: 'features.billing',        value: true,  type: 'boolean', category: 'features', label: 'Subscription Billing',   isPublic: true  },
  { key: 'features.aiChat',         value: true,  type: 'boolean', category: 'features', label: 'AI Chat Widget',         isPublic: true  },
  { key: 'features.referrals',      value: false, type: 'boolean', category: 'features', label: 'Referral System',        isPublic: false },

  // ── Files ────────────────────────────────────────────────────────────────
  { key: 'files.maxSizeMb',         value: 10,    type: 'number', category: 'files', label: 'Max Upload Size (MB)',  isPublic: true  },
  { key: 'files.allowedTypes',      value: 'jpeg,jpg,png,gif,pdf,doc,docx,xls,xlsx,zip', type: 'string', category: 'files', label: 'Allowed File Types', isPublic: true },
];

const seedSettings = async () => {
  const SystemSettings = require('../models/SystemSettings');
  const results = [];

  for (const setting of DEFAULT_SETTINGS) {
    const existing = await SystemSettings.findOne({ key: setting.key });
    if (!existing) {
      const doc = await SystemSettings.create(setting);
      results.push({ key: doc.key, action: 'created' });
      console.log(`[settings:seed] Created: ${doc.key}`);
    } else {
      // Update metadata but NOT value (preserve admin customizations)
      await SystemSettings.findByIdAndUpdate(existing._id, {
        $set: {
          type:       setting.type,
          category:   setting.category,
          label:      setting.label,
          description: setting.description || '',
          isPublic:   setting.isPublic,
        },
      });
      results.push({ key: existing.key, action: 'skipped' });
    }
  }

  return results;
};

module.exports = { seedSettings, DEFAULT_SETTINGS };

if (require.main === module) {
  require('dotenv').config();
  const mongoose = require('mongoose');
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yansy')
    .then(async () => {
      await seedSettings();
      console.log('[settings:seed] Done.');
      process.exit(0);
    })
    .catch(err => { console.error(err.message); process.exit(1); });
}
