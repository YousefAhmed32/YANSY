'use strict';
const express = require('express');
const router  = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { requirePlan } = require('../middleware/requirePlan');
const { aiRateLimit } = require('../middleware/aiRateLimit');
const { rateLimitAIChat } = require('../middleware/rateLimit');
const ctrl = require('../controllers/aiController');

// ── Public chat (no auth required — rate limited by IP) ───────────────────────
router.post('/chat', rateLimitAIChat, ctrl.chat);

// ── Authenticated user AI features (PROFESSIONAL plan required) ───────────────
const aiAuth = [authenticate, requirePlan('PROFESSIONAL'), aiRateLimit];

router.post('/insight',         authenticate, aiRateLimit, ctrl.getDashboardInsight);
router.post('/brief',           ...aiAuth, ctrl.generateBrief);
router.post('/estimate',        ...aiAuth, ctrl.estimateProject);
router.post('/proposal',        ...aiAuth, ctrl.generateProposal);
router.post('/project-summary', ...aiAuth, ctrl.summarizeProject);
router.post('/message-summary', ...aiAuth, ctrl.summarizeMessages);
router.post('/onboarding',      authenticate, ctrl.onboardingAssistant);

// ── Usage for current user ────────────────────────────────────────────────────
router.get('/usage/me', authenticate, ctrl.getMyUsage);

// ── Admin-only routes ─────────────────────────────────────────────────────────
router.get('/admin/insights', authenticate, requireAdmin, ctrl.getAdminInsights);
router.get('/admin/usage',    authenticate, requireAdmin, ctrl.getAdminUsage);

module.exports = router;
