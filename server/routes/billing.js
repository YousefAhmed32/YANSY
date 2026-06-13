'use strict';
const express = require('express');
const router  = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/billingController');

// ── Public ───────────────────────────────────────────────────────────────────
router.get('/plans', ctrl.getPlans);

// ── Stripe webhook — must use raw body (registered before express.json in server.js) ──
// This route is wired up in server.js BEFORE the json middleware with raw body parsing.
// The handler here is just a named export reference.
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  ctrl.handleWebhook
);

// ── Authenticated user routes ─────────────────────────────────────────────────
router.get('/subscription',     authenticate, ctrl.getSubscription);
router.get('/history',          authenticate, ctrl.getBillingHistory);
router.post('/checkout',        authenticate, ctrl.createCheckout);
router.post('/portal',          authenticate, ctrl.createPortal);
router.post('/cancel',          authenticate, ctrl.cancelSubscription);
router.post('/reactivate',      authenticate, ctrl.reactivateSubscription);
router.post('/invoice/:id/checkout', authenticate, ctrl.createInvoicePayment);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get('/admin/subscriptions',       authenticate, requireAdmin, ctrl.adminGetSubscriptions);
router.get('/admin/revenue',             authenticate, requireAdmin, ctrl.adminGetRevenue);
router.get('/admin/financial-stats',     authenticate, requireAdmin, ctrl.adminGetFinancialStats);
router.post('/admin/plans/seed',         authenticate, requireAdmin, ctrl.adminSeedPlans);
router.patch('/admin/plans/:planId',     authenticate, requireAdmin, ctrl.adminUpdatePlanPricing);
router.patch('/admin/:userId/plan',      authenticate, requireAdmin, ctrl.adminChangePlan);

module.exports = router;
