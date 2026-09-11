const { AnalyticsEvent, Session } = require('../models/Analytics');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const parseDevice = (ua) => {
  if (!ua) return 'Desktop';
  const parser = new UAParser(ua);
  const type = parser.getDevice().type;
  if (type === 'mobile') return 'Mobile';
  if (type === 'tablet') return 'Tablet';
  return 'Desktop';
};

const parseBrowser = (ua) => {
  if (!ua) return 'Unknown';
  const parser = new UAParser(ua);
  return parser.getBrowser().name || 'Other';
};

const parseOS = (ua) => {
  if (!ua) return 'Unknown';
  const parser = new UAParser(ua);
  return parser.getOS().name || 'Other';
};

const parseGeo = (ip) => {
  if (!ip) return { country: null, city: null };
  const clean = ip.replace('::ffff:', '');
  if (clean === '127.0.0.1' || clean === '::1' || clean.startsWith('192.168') || clean.startsWith('10.')) {
    return { country: 'Local / Dev', city: 'Localhost' };
  }
  const geo = geoip.lookup(clean);
  return {
    country: geo?.country || null,
    city: geo?.city || null,
  };
};

const extractUserAuth = (req) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
    if (!token) return null;
    const decoded = jwt.decode(token);
    return decoded || null;
  } catch (_) {
    return null;
  }
};

/**
 * trackEvent — attaches sessionId and only records server-rendered public views.
 * NEVER records /api/* calls as user page views!
 */
const trackEvent = (req, res, next) => {
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

  next();

  // CRITICAL FIX: Never record backend /api requests as user page views!
  // Client SPA routes are explicitly tracked via POST /api/analytics/events.
  if (req.method !== 'GET' || req.path.startsWith('/api')) return;

  setImmediate(async () => {
    try {
      const decoded = extractUserAuth(req);
      let isAdmin = false;
      let visitorType = 'guest';
      let userName = null;
      let userEmail = null;
      let userId = req.user?._id || decoded?.userId;

      if (userId) {
        const u = await User.findById(userId).select('fullName email role').lean();
        if (u) {
          userName = u.fullName;
          userEmail = u.email;
          isAdmin = u.role === 'ADMIN' || u.role === 'SUPER_ADMIN';
          visitorType = isAdmin ? 'admin' : 'client';
        }
      }

      const ip = req.ip || req.socket?.remoteAddress;
      const ua = req.headers['user-agent'];
      const geo = parseGeo(ip);

      await AnalyticsEvent.create({
        sessionId,
        userId,
        isAdmin,
        visitorType,
        userName,
        userEmail,
        eventType: 'page_view',
        page: req.path,
        userAgent: ua,
        device: parseDevice(ua),
        browser: parseBrowser(ua),
        os: parseOS(ua),
        ip,
        country: geo.country,
        city: geo.city,
        referrer: req.headers.referer,
      });
    } catch (err) {
      console.error('[Analytics] trackEvent error:', err.message);
    }
  });
};

/**
 * trackSession — records or updates visitor session with rich telemetry and identity.
 */
const trackSession = (req, res, next) => {
  next();

  // Skip internal analytics telemetry polling
  if (req.path.startsWith('/api/analytics')) return;

  const sessionId = req.sessionId || req.cookies?.sessionId || req.headers['x-session-id'];
  if (!sessionId) return;

  setImmediate(async () => {
    try {
      const existing = await Session.findOne({ sessionId, isActive: true });
      const decoded = extractUserAuth(req);
      let userId = req.user?._id || decoded?.userId;
      let isAdmin = false;
      let visitorType = 'guest';
      let userName = null;
      let userEmail = null;

      if (userId) {
        const u = await User.findById(userId).select('fullName email role').lean();
        if (u) {
          userName = u.fullName;
          userEmail = u.email;
          isAdmin = u.role === 'ADMIN' || u.role === 'SUPER_ADMIN';
          visitorType = isAdmin ? 'admin' : 'client';
        }
      }

      const ip = req.ip || req.socket?.remoteAddress;
      const ua = req.headers['user-agent'];
      const geo = parseGeo(ip);
      const device = parseDevice(ua);
      const browser = parseBrowser(ua);
      const os = parseOS(ua);

      if (!existing) {
        await Session.create({
          sessionId,
          userId,
          isAdmin,
          visitorType,
          userName,
          userEmail,
          userAgent: ua,
          device,
          browser,
          os,
          ip,
          country: geo.country,
          city: geo.city,
          referrer: req.headers.referer,
          entryPage: req.path.startsWith('/api') ? '/' : req.path,
        });
      } else if (userId && !existing.userId) {
        // Associate session with user upon login
        existing.userId = userId;
        existing.isAdmin = isAdmin;
        existing.visitorType = visitorType;
        if (userName) existing.userName = userName;
        if (userEmail) existing.userEmail = userEmail;
        await existing.save();
      }
    } catch (err) {
      console.error('[Analytics] trackSession error:', err.message);
    }
  });
};

module.exports = { trackEvent, trackSession };
