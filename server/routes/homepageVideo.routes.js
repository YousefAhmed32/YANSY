'use strict';
const express               = require('express');
const router                = express.Router();
const multer                = require('multer');
const HomepageVideoSettings = require('../models/HomepageVideoSettings');
const IntroSettings         = require('../models/IntroSettings');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { audit } = require('../utils/auditLogger');
const {
  uploadShowcaseVideo, deleteShowcaseVideo, uploadShowcasePoster, deleteShowcasePoster,
} = require('../utils/homepageVideoMedia');

const protect   = authenticate;
const adminOnly = requireAdmin;

const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 120 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const validMime = /mp4|webm|quicktime|x-matroska|octet-stream/.test(file.mimetype);
    const validExt  = /\.(mp4|webm|mov|mkv)$/i.test(file.originalname || '');
    cb(null, validMime || validExt);
  },
});
const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /jpeg|jpg|png|webp|gif/.test(file.mimetype)),
});

const PLAY_TRIGGERS      = ['autoplay', 'click', 'scroll', 'visible'];
const SECTION_HEIGHTS    = ['compact', 'standard', 'large', 'cinematic'];
const BACKGROUND_STYLES  = ['dark', 'light', 'gradient', 'black'];
const ANIMATION_STYLES   = ['fade', 'scale', 'slide', 'cinematic'];
const SHADOW_STYLES      = ['none', 'soft', 'elevated', 'glow'];
const SPACINGS           = ['compact', 'comfortable', 'spacious'];

// Resolve the video that should actually be shown — live intro reference or own upload
const resolveEffectiveVideo = async (doc) => {
  if (doc.videoSource === 'intro') {
    const intro = await IntroSettings.getSingleton();
    return { videoUrl: intro.videoUrl, videoProvider: intro.videoProvider };
  }
  return { videoUrl: doc.videoUrl, videoProvider: doc.videoProvider };
};

const toPublicShape = (doc, effectiveVideo) => ({
  enabled:               doc.enabled,
  videoUrl:              effectiveVideo.videoUrl,
  poster:                doc.poster?.url ? doc.poster : null,
  headline:              doc.headline,
  subtitle:              doc.subtitle,
  description:           doc.description,
  ctaText:               doc.ctaText,
  ctaLink:               doc.ctaLink,
  autoplay:              doc.autoplay,
  muted:                 doc.muted,
  loop:                  doc.loop,
  playTrigger:           doc.playTrigger,
  showControls:          doc.showControls,
  showProgress:          doc.showProgress,
  showSoundButton:       doc.showSoundButton,
  showFullscreenButton:  doc.showFullscreenButton,
  sectionHeight:         doc.sectionHeight,
  backgroundStyle:       doc.backgroundStyle,
  overlayOpacity:        doc.overlayOpacity,
  animationStyle:        doc.animationStyle,
  roundedCorners:        doc.roundedCorners,
  borderRadius:          doc.borderRadius,
  shadowStyle:           doc.shadowStyle,
  glowEffect:            doc.glowEffect,
  spacing:               doc.spacing,
  marginTop:             doc.marginTop,
  marginBottom:          doc.marginBottom,
  hideOnMobile:          doc.hideOnMobile,
  hideOnDesktop:         doc.hideOnDesktop,
});

const toAdminShape = (doc, effectiveVideo) => {
  const { views, playCount, completions, totalWatchSeconds, clicks } = doc.analytics;
  return {
    ...doc.toObject(),
    effectiveVideoUrl: effectiveVideo.videoUrl,
    analytics: {
      views, playCount, completions, totalWatchSeconds, clicks,
      completionRate: playCount ? Math.round((completions / playCount) * 1000) / 10 : 0,
      avgWatchSeconds: playCount ? Math.round((totalWatchSeconds / playCount) * 10) / 10 : 0,
      ctr: views ? Math.round((clicks / views) * 1000) / 10 : 0,
    },
  };
};

// ── PUBLIC ───────────────────────────────────────────────────────────────────

router.get('/settings', async (req, res) => {
  try {
    const doc = await HomepageVideoSettings.getSingleton();
    const effectiveVideo = await resolveEffectiveVideo(doc);
    res.json({ settings: toPublicShape(doc, effectiveVideo) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/homepage-video/event — analytics beacon (view | play | complete | click)
router.post('/event', async (req, res) => {
  try {
    const { type, watchSeconds } = req.body;
    if (!['view', 'play', 'complete', 'click'].includes(type)) {
      return res.status(400).json({ error: 'Invalid event type' });
    }

    const inc = {};
    if (type === 'view')     inc['analytics.views'] = 1;
    if (type === 'play')     inc['analytics.playCount'] = 1;
    if (type === 'complete') inc['analytics.completions'] = 1;
    if (type === 'click')    inc['analytics.clicks'] = 1;

    const seconds = Number(watchSeconds);
    if (Number.isFinite(seconds) && seconds > 0 && seconds < 3600) {
      inc['analytics.totalWatchSeconds'] = seconds;
    }

    await HomepageVideoSettings.updateOne({}, { $inc: inc }, { upsert: true });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN ─────────────────────────────────────────────────────────────────────

router.get('/admin', protect, adminOnly, async (req, res) => {
  try {
    const doc = await HomepageVideoSettings.getSingleton();
    const effectiveVideo = await resolveEffectiveVideo(doc);
    res.json({ settings: toAdminShape(doc, effectiveVideo) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/admin', protect, adminOnly, async (req, res) => {
  try {
    const doc = await HomepageVideoSettings.getSingleton();
    const before = doc.toObject();
    const body = req.body;

    if (body.enabled !== undefined) doc.enabled = Boolean(body.enabled);

    if (body.videoSource !== undefined) {
      if (!['intro', 'own'].includes(body.videoSource)) return res.status(400).json({ error: 'Invalid videoSource' });
      doc.videoSource = body.videoSource;
    }

    for (const field of ['headline', 'subtitle', 'description', 'ctaText']) {
      if (body[field] !== undefined) {
        doc[field] = { en: body[field].en ?? doc[field]?.en ?? '', ar: body[field].ar ?? doc[field]?.ar ?? '' };
      }
    }
    if (body.ctaLink !== undefined) doc.ctaLink = String(body.ctaLink);

    if (body.autoplay !== undefined) doc.autoplay = Boolean(body.autoplay);
    if (body.muted !== undefined) doc.muted = Boolean(body.muted);
    if (body.loop !== undefined) doc.loop = Boolean(body.loop);
    if (body.playTrigger !== undefined) {
      if (!PLAY_TRIGGERS.includes(body.playTrigger)) return res.status(400).json({ error: 'Invalid playTrigger' });
      doc.playTrigger = body.playTrigger;
    }

    if (body.showControls !== undefined) doc.showControls = Boolean(body.showControls);
    if (body.showProgress !== undefined) doc.showProgress = Boolean(body.showProgress);
    if (body.showSoundButton !== undefined) doc.showSoundButton = Boolean(body.showSoundButton);
    if (body.showFullscreenButton !== undefined) doc.showFullscreenButton = Boolean(body.showFullscreenButton);

    if (body.sectionHeight !== undefined) {
      if (!SECTION_HEIGHTS.includes(body.sectionHeight)) return res.status(400).json({ error: 'Invalid sectionHeight' });
      doc.sectionHeight = body.sectionHeight;
    }
    if (body.backgroundStyle !== undefined) {
      if (!BACKGROUND_STYLES.includes(body.backgroundStyle)) return res.status(400).json({ error: 'Invalid backgroundStyle' });
      doc.backgroundStyle = body.backgroundStyle;
    }
    if (body.overlayOpacity !== undefined) doc.overlayOpacity = Math.min(Math.max(Number(body.overlayOpacity) || 0, 0), 100);
    if (body.animationStyle !== undefined) {
      if (!ANIMATION_STYLES.includes(body.animationStyle)) return res.status(400).json({ error: 'Invalid animationStyle' });
      doc.animationStyle = body.animationStyle;
    }
    if (body.roundedCorners !== undefined) doc.roundedCorners = Boolean(body.roundedCorners);
    if (body.borderRadius !== undefined) doc.borderRadius = Math.min(Math.max(Number(body.borderRadius) || 0, 0), 64);
    if (body.shadowStyle !== undefined) {
      if (!SHADOW_STYLES.includes(body.shadowStyle)) return res.status(400).json({ error: 'Invalid shadowStyle' });
      doc.shadowStyle = body.shadowStyle;
    }
    if (body.glowEffect !== undefined) doc.glowEffect = Boolean(body.glowEffect);
    if (body.spacing !== undefined) {
      if (!SPACINGS.includes(body.spacing)) return res.status(400).json({ error: 'Invalid spacing' });
      doc.spacing = body.spacing;
    }
    if (body.marginTop !== undefined) doc.marginTop = Math.min(Math.max(Number(body.marginTop) || 0, 0), 400);
    if (body.marginBottom !== undefined) doc.marginBottom = Math.min(Math.max(Number(body.marginBottom) || 0, 0), 400);
    if (body.sectionOrder !== undefined) doc.sectionOrder = Number(body.sectionOrder) || 0;

    if (body.hideOnMobile !== undefined) doc.hideOnMobile = Boolean(body.hideOnMobile);
    if (body.hideOnDesktop !== undefined) doc.hideOnDesktop = Boolean(body.hideOnDesktop);

    doc.updatedBy = req.user._id;
    await doc.save();

    const effectiveVideo = await resolveEffectiveVideo(doc);
    audit({ req, action: 'homepage_video.update', entityType: 'HomepageVideoSettings', entityId: doc._id, before, after: doc.toObject() });
    res.json({ settings: toAdminShape(doc, effectiveVideo) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/video', protect, adminOnly, uploadVideo.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No video file provided' });

    const doc = await HomepageVideoSettings.getSingleton();
    const old = { videoPublicId: doc.videoPublicId, videoProvider: doc.videoProvider };

    const media = await uploadShowcaseVideo(req.file.buffer, req.file.originalname, req.file.mimetype);
    Object.assign(doc, media);
    doc.videoSource = 'own';
    doc.updatedBy = req.user._id;
    await doc.save();

    deleteShowcaseVideo(old).catch(() => {});

    audit({ req, action: 'homepage_video.video_upload', entityType: 'HomepageVideoSettings', entityId: doc._id });
    const effectiveVideo = await resolveEffectiveVideo(doc);
    res.status(201).json({ settings: toAdminShape(doc, effectiveVideo) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/video', protect, adminOnly, async (req, res) => {
  try {
    const doc = await HomepageVideoSettings.getSingleton();
    await deleteShowcaseVideo({ videoPublicId: doc.videoPublicId, videoProvider: doc.videoProvider });

    doc.videoUrl = null;
    doc.videoPublicId = null;
    doc.videoSource = 'intro'; // fall back to the intro video rather than leaving nothing
    doc.updatedBy = req.user._id;
    await doc.save();

    audit({ req, action: 'homepage_video.video_delete', entityType: 'HomepageVideoSettings', entityId: doc._id });
    const effectiveVideo = await resolveEffectiveVideo(doc);
    res.json({ settings: toAdminShape(doc, effectiveVideo) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/poster', protect, adminOnly, uploadImage.single('poster'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });

    const doc = await HomepageVideoSettings.getSingleton();
    const old = doc.poster;

    doc.poster = await uploadShowcasePoster(req.file.buffer, req.file.originalname, req.file.mimetype);
    doc.updatedBy = req.user._id;
    await doc.save();

    if (old) deleteShowcasePoster(old).catch(() => {});

    audit({ req, action: 'homepage_video.poster_upload', entityType: 'HomepageVideoSettings', entityId: doc._id });
    const effectiveVideo = await resolveEffectiveVideo(doc);
    res.status(201).json({ settings: toAdminShape(doc, effectiveVideo) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/poster', protect, adminOnly, async (req, res) => {
  try {
    const doc = await HomepageVideoSettings.getSingleton();
    await deleteShowcasePoster(doc.poster);

    doc.poster = undefined;
    doc.updatedBy = req.user._id;
    await doc.save();

    audit({ req, action: 'homepage_video.poster_delete', entityType: 'HomepageVideoSettings', entityId: doc._id });
    const effectiveVideo = await resolveEffectiveVideo(doc);
    res.json({ settings: toAdminShape(doc, effectiveVideo) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
