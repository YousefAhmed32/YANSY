'use strict';
const express       = require('express');
const router        = express.Router();
const multer        = require('multer');
const IntroSettings = require('../models/IntroSettings');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { audit } = require('../utils/auditLogger');
const { uploadIntroVideo, deleteIntroVideo } = require('../utils/introMedia');

const protect   = authenticate;
const adminOnly = requireAdmin;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 120 * 1024 * 1024 }, // 120MB — generous for a short cinematic clip
  fileFilter: (req, file, cb) => {
    const validMime = /mp4|webm|quicktime|x-matroska|octet-stream/.test(file.mimetype);
    const validExt  = /\.(mp4|webm|mov|mkv)$/i.test(file.originalname || '');
    cb(null, validMime || validExt);
  },
});

const DEVICE_MODES = ['both', 'desktop', 'mobile'];
const PLAY_MODES   = ['once-per-session', 'always'];

const toPublicShape = (doc) => ({
  enabled:              doc.enabled,
  videoUrl:             doc.videoUrl,
  deviceMode:            doc.deviceMode,
  playMode:              doc.playMode,
  loop:                  doc.loop,
  waitForInteraction:    doc.waitForInteraction,
  autoplayMuted:         doc.autoplayMuted,
  playWithSound:         doc.playWithSound,
  skipEnabled:           doc.skipEnabled,
  skipDelaySeconds:      doc.skipDelaySeconds,
  fadeDurationMs:        doc.fadeDurationMs,
  transitionDurationMs:  doc.transitionDurationMs,
});

const toAdminShape = (doc) => {
  const { views, completions, skips, totalWatchSeconds } = doc.analytics;
  return {
    ...doc.toObject(),
    analytics: {
      views, completions, skips, totalWatchSeconds,
      completionRate: views ? Math.round((completions / views) * 1000) / 10 : 0,
      skipRate:       views ? Math.round((skips / views) * 1000) / 10 : 0,
      avgWatchSeconds: views ? Math.round((totalWatchSeconds / views) * 10) / 10 : 0,
    },
  };
};

// ── PUBLIC ───────────────────────────────────────────────────────────────────

// GET /api/intro/settings
router.get('/settings', async (req, res) => {
  try {
    const doc = await IntroSettings.getSingleton();
    res.json({ settings: toPublicShape(doc) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/intro/event — analytics beacon (view | complete | skip)
router.post('/event', async (req, res) => {
  try {
    const { type, watchSeconds } = req.body;
    if (!['view', 'complete', 'skip'].includes(type)) {
      return res.status(400).json({ error: 'Invalid event type' });
    }

    const inc = {};
    if (type === 'view')     inc['analytics.views'] = 1;
    if (type === 'complete') inc['analytics.completions'] = 1;
    if (type === 'skip')     inc['analytics.skips'] = 1;

    const seconds = Number(watchSeconds);
    if (Number.isFinite(seconds) && seconds > 0 && seconds < 3600) {
      inc['analytics.totalWatchSeconds'] = seconds;
    }

    await IntroSettings.updateOne({}, { $inc: inc }, { upsert: true });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN ─────────────────────────────────────────────────────────────────────

// GET /api/intro/admin
router.get('/admin', protect, adminOnly, async (req, res) => {
  try {
    const doc = await IntroSettings.getSingleton();
    res.json({ settings: toAdminShape(doc) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/intro/admin — update config (not the video file itself)
router.put('/admin', protect, adminOnly, async (req, res) => {
  try {
    const doc = await IntroSettings.getSingleton();
    const before = doc.toObject();
    const body = req.body;

    if (body.enabled !== undefined) doc.enabled = Boolean(body.enabled);
    if (body.deviceMode !== undefined) {
      if (!DEVICE_MODES.includes(body.deviceMode)) return res.status(400).json({ error: 'Invalid deviceMode' });
      doc.deviceMode = body.deviceMode;
    }
    if (body.playMode !== undefined) {
      if (!PLAY_MODES.includes(body.playMode)) return res.status(400).json({ error: 'Invalid playMode' });
      doc.playMode = body.playMode;
    }
    if (body.loop !== undefined) doc.loop = Boolean(body.loop);
    if (body.waitForInteraction !== undefined) doc.waitForInteraction = Boolean(body.waitForInteraction);
    if (body.autoplayMuted !== undefined) doc.autoplayMuted = Boolean(body.autoplayMuted);
    if (body.playWithSound !== undefined) doc.playWithSound = Boolean(body.playWithSound);
    if (body.skipEnabled !== undefined) doc.skipEnabled = Boolean(body.skipEnabled);
    if (body.skipDelaySeconds !== undefined) doc.skipDelaySeconds = Math.min(Math.max(Number(body.skipDelaySeconds) || 0, 0), 30);
    if (body.fadeDurationMs !== undefined) doc.fadeDurationMs = Math.min(Math.max(Number(body.fadeDurationMs) || 0, 0), 5000);
    if (body.transitionDurationMs !== undefined) doc.transitionDurationMs = Math.min(Math.max(Number(body.transitionDurationMs) || 0, 0), 5000);

    doc.updatedBy = req.user._id;
    await doc.save();

    audit({ req, action: 'intro.update', entityType: 'IntroSettings', entityId: doc._id, before, after: doc.toObject() });
    res.json({ settings: toAdminShape(doc) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/intro/admin/video — upload / replace
router.post('/admin/video', protect, adminOnly, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No video file provided' });

    const doc = await IntroSettings.getSingleton();
    const oldVideo = { videoPublicId: doc.videoPublicId, videoProvider: doc.videoProvider };

    const media = await uploadIntroVideo(req.file.buffer, req.file.originalname, req.file.mimetype);
    Object.assign(doc, media);
    doc.updatedBy = req.user._id;
    await doc.save();

    deleteIntroVideo(oldVideo).catch(() => {});

    audit({ req, action: 'intro.video_upload', entityType: 'IntroSettings', entityId: doc._id, metadata: { videoProvider: doc.videoProvider } });
    res.status(201).json({ settings: toAdminShape(doc) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/intro/admin/video — remove current video (also disables the intro)
router.delete('/admin/video', protect, adminOnly, async (req, res) => {
  try {
    const doc = await IntroSettings.getSingleton();
    await deleteIntroVideo({ videoPublicId: doc.videoPublicId, videoProvider: doc.videoProvider });

    doc.videoUrl = null;
    doc.videoPublicId = null;
    doc.videoProvider = 'static';
    doc.enabled = false;
    doc.updatedBy = req.user._id;
    await doc.save();

    audit({ req, action: 'intro.video_delete', entityType: 'IntroSettings', entityId: doc._id });
    res.json({ settings: toAdminShape(doc) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
