'use strict';
const express = require('express');
const router = express.Router();
const StartProjectSettings = require('../models/StartProjectSettings');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { audit } = require('../utils/auditLogger');

const protect   = authenticate;
const adminOnly = requireAdmin;

const EVENT_TYPES = ['decision_view', 'whatsapp_click', 'whatsapp_submit', 'form_open', 'form_step', 'form_complete'];
const BUTTON_ORDERS = ['whatsapp-first', 'form-first'];
const DEFAULT_OPTIONS = ['whatsapp', 'form', null];

const toPublicShape = (doc) => ({
  whatsappEnabled:      doc.whatsappEnabled,
  formEnabled:           doc.formEnabled,
  whatsappNumber:        doc.whatsappNumber,
  whatsappTitle:         doc.whatsappTitle,
  whatsappDescription:   doc.whatsappDescription,
  whatsappResponseTime:  doc.whatsappResponseTime,
  formTitle:             doc.formTitle,
  formDescription:       doc.formDescription,
  formResponseTime:      doc.formResponseTime,
  buttonOrder:           doc.buttonOrder,
  defaultOption:         doc.defaultOption,
});

const toAdminShape = (doc) => {
  const a = doc.analytics;
  const decisions = (a.whatsappChosen || 0) + (a.formChosen || 0);
  // The form has 5 steps (Project Type · Brief · Capabilities · Scope ·
  // Review & Contact) as of the guided-workspace redesign. Rebuilding from
  // the raw array index-by-index (rather than requiring an exact length
  // match) means a pre-redesign document with only 4 recorded slots keeps
  // its existing counts instead of being silently reset to all zeros.
  const rawStepReached = Array.isArray(a.formStepReached) ? a.formStepReached : [];
  const stepReached = Array.from({ length: 5 }, (_, i) => rawStepReached[i] || 0);
  const dropOff = stepReached.map((count, i) => {
    const prev = i === 0 ? a.decisionViews || decisions : stepReached[i - 1];
    return prev ? Math.round((1 - count / prev) * 1000) / 10 : 0;
  });
  return {
    ...doc.toObject(),
    analytics: {
      ...a,
      formStepReached: stepReached,
      whatsappSharePct: decisions ? Math.round((a.whatsappChosen / decisions) * 1000) / 10 : 0,
      formSharePct:     decisions ? Math.round((a.formChosen / decisions) * 1000) / 10 : 0,
      formCompletionRate: stepReached[0] ? Math.round((a.formCompleted / stepReached[0]) * 1000) / 10 : 0,
      whatsappCompletionRate: a.whatsappChosen ? Math.round((a.whatsappSubmitted / a.whatsappChosen) * 1000) / 10 : 0,
      avgCompletionSeconds: a.formCompleted ? Math.round((a.totalCompletionSeconds / a.formCompleted) * 10) / 10 : 0,
      dropOffPerStep: dropOff,
    },
  };
};

// ── PUBLIC ───────────────────────────────────────────────────────────────────

// GET /api/start-project/settings
router.get('/settings', async (req, res) => {
  try {
    const doc = await StartProjectSettings.getSingleton();
    res.json({ settings: toPublicShape(doc) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/start-project/event — analytics beacon
router.post('/event', async (req, res) => {
  try {
    const { type, step, completionSeconds } = req.body;
    if (!EVENT_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Invalid event type' });
    }

    const inc = {};
    if (type === 'decision_view')     inc['analytics.decisionViews'] = 1;
    if (type === 'whatsapp_click')    inc['analytics.whatsappChosen'] = 1;
    if (type === 'whatsapp_submit')   inc['analytics.whatsappSubmitted'] = 1;
    if (type === 'form_open')         inc['analytics.formChosen'] = 1;
    if (type === 'form_complete')     inc['analytics.formCompleted'] = 1;

    if (type === 'form_step') {
      const idx = Number(step) - 1;
      if (!Number.isInteger(idx) || idx < 0 || idx > 4) {
        return res.status(400).json({ error: 'Invalid step' });
      }
      inc[`analytics.formStepReached.${idx}`] = 1;
    }

    if (type === 'form_complete') {
      const seconds = Number(completionSeconds);
      if (Number.isFinite(seconds) && seconds > 0 && seconds < 3600) {
        inc['analytics.totalCompletionSeconds'] = seconds;
      }
    }

    await StartProjectSettings.updateOne({}, { $inc: inc }, { upsert: true });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN ─────────────────────────────────────────────────────────────────────

// GET /api/start-project/admin
router.get('/admin', protect, adminOnly, async (req, res) => {
  try {
    const doc = await StartProjectSettings.getSingleton();
    res.json({ settings: toAdminShape(doc) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/start-project/admin
router.put('/admin', protect, adminOnly, async (req, res) => {
  try {
    const doc = await StartProjectSettings.getSingleton();
    const before = doc.toObject();
    const body = req.body;

    if (body.whatsappEnabled !== undefined) doc.whatsappEnabled = Boolean(body.whatsappEnabled);
    if (body.formEnabled !== undefined) doc.formEnabled = Boolean(body.formEnabled);
    if (!doc.whatsappEnabled && !doc.formEnabled) {
      return res.status(400).json({ error: 'At least one channel must remain enabled' });
    }

    if (body.whatsappNumber !== undefined) doc.whatsappNumber = String(body.whatsappNumber).trim();

    for (const field of ['whatsappTitle', 'whatsappDescription', 'whatsappResponseTime', 'formTitle', 'formDescription', 'formResponseTime']) {
      if (body[field] !== undefined) {
        doc[field] = {
          en: String(body[field]?.en || '').slice(0, 300),
          ar: String(body[field]?.ar || '').slice(0, 300),
        };
      }
    }

    if (body.buttonOrder !== undefined) {
      if (!BUTTON_ORDERS.includes(body.buttonOrder)) return res.status(400).json({ error: 'Invalid buttonOrder' });
      doc.buttonOrder = body.buttonOrder;
    }
    if (body.defaultOption !== undefined) {
      const val = body.defaultOption || null;
      if (!DEFAULT_OPTIONS.includes(val)) return res.status(400).json({ error: 'Invalid defaultOption' });
      doc.defaultOption = val;
    }

    doc.updatedBy = req.user._id;
    await doc.save();

    audit({ req, action: 'startProject.update', entityType: 'StartProjectSettings', entityId: doc._id, before, after: doc.toObject() });
    res.json({ settings: toAdminShape(doc) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
