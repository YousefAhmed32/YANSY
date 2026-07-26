'use strict';
const express    = require('express');
const rateLimit  = require('express-rate-limit');
const router     = express.Router();
const ctrl       = require('../controllers/supportController');
const knowledge  = require('../controllers/knowledgeController');
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

// Uploads/analysis/voice are heavier calls — tighter limit than plain chat turns
const heavyLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             20,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Too many requests. Please wait before trying again.' },
  skip: (req) => process.env.NODE_ENV === 'development',
});

// ── Public ────────────────────────────────────────────────────────────────────
router.post('/chat',                           chatLimiter,  ctrl.chat);
router.get ('/config',                                       ctrl.getConfig);
router.get ('/conversation/:sessionId',                      ctrl.getConversation);
router.get ('/my-conversation',              protect,        ctrl.getMyConversation);
router.post('/upload',       heavyLimiter, ctrl.uploadMiddleware, ctrl.uploadFiles);
router.post('/analyze-url',  heavyLimiter,                   ctrl.analyzeUrl);
router.post('/tts',          heavyLimiter,                   ctrl.tts);
router.post('/generate-document', heavyLimiter,               ctrl.generateDocument);

// ── Admin: knowledge base (RAG) ────────────────────────────────────────────────
router.get   ('/admin/knowledge',       protect, requireAdmin, knowledge.adminList);
router.post  ('/admin/knowledge',       protect, requireAdmin, knowledge.adminCreate);
router.patch ('/admin/knowledge/:id',   protect, requireAdmin, knowledge.adminUpdate);
router.delete('/admin/knowledge/:id',   protect, requireAdmin, knowledge.adminDelete);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get  ('/admin/analytics',               protect, requireAdmin, ctrl.adminGetAnalytics);
router.get  ('/admin/cost-analytics',          protect, requireAdmin, ctrl.adminGetCostAnalytics);
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
