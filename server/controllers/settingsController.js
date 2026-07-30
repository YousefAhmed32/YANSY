'use strict';
const SystemSettings = require('../models/SystemSettings');
const { audit }      = require('../utils/auditLogger');
const { seedSettings } = require('../seeds/settings');
const mongoose = require('mongoose');

// ── GET /api/admin/settings ───────────────────────────────────────────────────
exports.getAll = async (req, res, next) => {
  try {
    const { category } = req.query;
    const query = {};
    if (category) query.category = category;

    const settings = await SystemSettings.find(query)
      .sort({ category: 1, key: 1 })
      .lean();

    // Group by category for easier UI consumption
    const grouped = {};
    settings.forEach(s => {
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category].push(s);
    });

    res.json({ settings, grouped, total: settings.length });
  } catch (err) { next(err); }
};

// ── GET /api/admin/settings/public ───────────────────────────────────────────
// Returns only public settings (safe to expose to frontend without auth)
exports.getPublic = async (req, res, next) => {
  try {
    const settings = await SystemSettings.find({ isPublic: true }).lean();
    const flat = {};
    settings.forEach(s => { flat[s.key] = s.value; });
    res.json({ settings: flat });
  } catch (err) { next(err); }
};

// ── PATCH /api/admin/settings/:key ───────────────────────────────────────────
exports.update = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'value is required.' });
    }

    const setting = await SystemSettings.findOne({ key });
    if (!setting) {
      return res.status(404).json({ error: `Setting '${key}' not found.` });
    }

    // Type coercion
    let coerced = value;
    if (setting.type === 'boolean') coerced = Boolean(value === true || value === 'true' || value === 1);
    if (setting.type === 'number')  coerced = Number(value);

    const before = setting.value;
    setting.value     = coerced;
    setting.updatedBy = req.user._id;
    await setting.save();

    audit({
      req, action: 'settings.update',
      entityType: 'SystemSettings', entityId: setting._id,
      before: { key, value: before },
      after:  { key, value: coerced },
    });

    res.json({ setting });
  } catch (err) { next(err); }
};

// ── PATCH /api/admin/settings (bulk update) ───────────────────────────────────
exports.bulkUpdate = async (req, res, next) => {
  try {
    const { updates } = req.body; // [{ key, value }, ...]
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'updates array is required.' });
    }

    const results = [];
    for (const { key, value } of updates) {
      const setting = await SystemSettings.findOne({ key });
      if (!setting) continue;

      let coerced = value;
      if (setting.type === 'boolean') coerced = Boolean(value === true || value === 'true' || value === 1);
      if (setting.type === 'number')  coerced = Number(value);

      const before   = setting.value;
      setting.value     = coerced;
      setting.updatedBy = req.user._id;
      await setting.save();

      audit({ req, action: 'settings.update', entityType: 'SystemSettings', entityId: setting._id, before: { key, value: before }, after: { key, value: coerced } });
      results.push({ key, value: coerced, updated: true });
    }

    res.json({ results, updated: results.length });
  } catch (err) { next(err); }
};

// ── POST /api/admin/settings/seed ────────────────────────────────────────────
exports.seed = async (req, res, next) => {
  try {
    const results = await seedSettings();
    res.json({ message: 'Settings seeded successfully.', results });
  } catch (err) { next(err); }
};

// ── GET /api/admin/health ─────────────────────────────────────────────────────
exports.getHealth = async (req, res, next) => {
  const checks = [];
  const t0 = Date.now();

  // 1. Database
  try {
    const dbState   = mongoose.connection.readyState;
    const dbOk      = dbState === 1;
    const pingStart = Date.now();
    if (dbOk) await mongoose.connection.db.admin().ping();
    checks.push({
      name: 'Database', status: dbOk ? 'ok' : 'error',
      message: dbOk ? 'Connected' : 'Disconnected',
      latencyMs: Date.now() - pingStart,
    });
  } catch (err) {
    checks.push({ name: 'Database', status: 'error', message: err.message });
  }

  // 2. Stripe
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      checks.push({ name: 'Stripe', status: 'warning', message: 'Not configured (STRIPE_SECRET_KEY missing)' });
    } else {
      const stripeStart = Date.now();
      const stripe      = require('stripe')(stripeKey);
      await stripe.balance.retrieve();
      checks.push({ name: 'Stripe', status: 'ok', message: 'Connected', latencyMs: Date.now() - stripeStart });
    }
  } catch (err) {
    checks.push({ name: 'Stripe', status: 'error', message: `Connection failed: ${err.message}` });
  }

  // 3. Email (SMTP)
  try {
    const smtpOk = Boolean(process.env.SMTP_HOST || process.env.SMTP_SERVICE);
    checks.push({
      name:    'Email (SMTP)',
      status:  smtpOk ? 'ok' : 'warning',
      message: smtpOk ? 'Configured' : 'Not configured (emails log to console)',
    });
  } catch (err) {
    checks.push({ name: 'Email (SMTP)', status: 'error', message: err.message });
  }

  // 4. File Storage (GridFS)
  try {
    const { getBucket } = require('../config/gridfs');
    getBucket(); // throws if initGridFS() hasn't run yet (only possible in the brief window right after boot, before Mongo connects)
    checks.push({ name: 'File Storage (GridFS)', status: 'ok', message: 'Initialized' });
  } catch (err) {
    checks.push({ name: 'File Storage (GridFS)', status: 'error', message: err.message });
  }

  // 5. AI (Anthropic)
  try {
    const aiOk = Boolean(process.env.ANTHROPIC_API_KEY);
    checks.push({
      name:    'AI (Claude)',
      status:  aiOk ? 'ok' : 'warning',
      message: aiOk ? 'Configured' : 'Not configured (ANTHROPIC_API_KEY missing)',
    });
  } catch (err) {
    checks.push({ name: 'AI', status: 'error', message: err.message });
  }

  // 6. Server uptime
  checks.push({
    name:    'Server',
    status:  'ok',
    message: 'Running',
    uptimeSeconds: Math.round(process.uptime()),
    memoryMb:      Math.round(process.memoryUsage().rss / 1024 / 1024),
  });

  const overallStatus = checks.every(c => c.status === 'ok')
    ? 'ok'
    : checks.some(c => c.status === 'error')
    ? 'degraded'
    : 'warning';

  res.json({
    status:   overallStatus,
    checks,
    checkedAt: new Date().toISOString(),
    durationMs: Date.now() - t0,
  });
};
