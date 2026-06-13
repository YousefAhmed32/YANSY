'use strict';
const express    = require('express');
const rateLimit  = require('express-rate-limit');
const router     = express.Router();
const ctrl       = require('../controllers/supportController');
const { authenticate: protect, requireAdmin } = require('../middleware/auth');

// Public chat rate limit — 30 messages per hour per IP
const chatLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             30,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Too many messages. Please wait before sending more.' },
  skip: (req) => process.env.NODE_ENV === 'development',
});

// ── Public ────────────────────────────────────────────────────────────────────
router.post('/chat',                           chatLimiter, ctrl.chat);
router.get ('/conversation/:sessionId',                     ctrl.getConversation);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get  ('/admin/analytics',               protect, requireAdmin, ctrl.adminGetAnalytics);
router.get  ('/admin/conversations',           protect, requireAdmin, ctrl.adminGetConversations);
router.get  ('/admin/conversation/:id',        protect, requireAdmin, ctrl.adminGetConversation);
router.patch('/admin/conversation/:id',        protect, requireAdmin, ctrl.adminUpdateConversation);
router.get  ('/admin/leads',                   protect, requireAdmin, ctrl.adminGetLeads);
router.get  ('/admin/escalations',             protect, requireAdmin, ctrl.adminGetEscalations);
router.get  ('/admin/tickets',                 protect, requireAdmin, ctrl.adminGetTickets);
router.get  ('/admin/ticket/:id',              protect, requireAdmin, ctrl.adminGetTicket);
router.patch('/admin/ticket/:id',              protect, requireAdmin, ctrl.adminUpdateTicket);
router.get  ('/admin/requests',                protect, requireAdmin, ctrl.adminGetRequests);
router.get  ('/admin/request/:id',             protect, requireAdmin, ctrl.adminGetRequest);
router.patch('/admin/request/:id',             protect, requireAdmin, ctrl.adminUpdateRequest);

module.exports = router;
