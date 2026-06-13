const { AnalyticsEvent, Session } = require('../models/Analytics');
const { v4: uuidv4 } = require('uuid');

// ─── Paths that must never be blocked by analytics ────────────────────────────
const SKIP_PREFIXES = ['/api/analytics', '/api/auth'];

/**
 * trackEvent — fire-and-forget page-view recording.
 * NEVER awaits DB; calls next() synchronously so auth and all routes
 * are never blocked by analytics writes.
 */
const trackEvent = (req, res, next) => {
  // Resolve / assign sessionId synchronously
  const sessionId =
    req.cookies?.sessionId || req.headers['x-session-id'] || uuidv4();

  if (!req.cookies?.sessionId) {
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
  }

  req.sessionId = sessionId;
  req.startTime = Date.now();

  // ── Proceed immediately — analytics is a side-effect, not a gate ──────────
  next();

  // ── Fire-and-forget: only track GET requests to non-skip paths ────────────
  const shouldSkip = SKIP_PREFIXES.some((p) => req.path.startsWith(p));
  if (req.method !== 'GET' || shouldSkip) return;

  setImmediate(() => {
    AnalyticsEvent.create({
      sessionId,
      userId: req.user?._id,
      eventType: 'page_view',
      page: req.path,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.socket?.remoteAddress,
      referrer: req.headers.referer,
    }).catch((err) => {
      // Non-critical — log only, never propagate
      console.error('[Analytics] trackEvent error:', err.message);
    });
  });
};

/**
 * trackSession — fire-and-forget session creation / lookup.
 * Calls next() immediately so zero latency is added to any route.
 */
const trackSession = (req, res, next) => {
  // ── Proceed immediately ───────────────────────────────────────────────────
  next();

  const shouldSkip = SKIP_PREFIXES.some((p) => req.path.startsWith(p));
  if (shouldSkip) return;

  const sessionId = req.sessionId || req.cookies?.sessionId;
  if (!sessionId) return;

  // ── Fire-and-forget: upsert session record asynchronously ─────────────────
  setImmediate(() => {
    Session.findOne({ sessionId, isActive: true })
      .lean()
      .then((existing) => {
        if (!existing) {
          return Session.create({
            sessionId,
            userId: req.user?._id,
            userAgent: req.headers['user-agent'],
            ip: req.ip || req.socket?.remoteAddress,
            referrer: req.headers.referer,
          });
        }
      })
      .catch((err) => {
        console.error('[Analytics] trackSession error:', err.message);
      });
  });
};

module.exports = { trackEvent, trackSession };
