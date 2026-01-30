const { AnalyticsEvent, Session } = require('../models/Analytics');
const { v4: uuidv4 } = require('uuid');

// Track analytics events
const trackEvent = async (req, res, next) => {
  // Skip tracking for analytics endpoints to avoid recursion
  if (req.path.startsWith('/api/analytics')) {
    return next();
  }

  const sessionId = req.cookies?.sessionId || req.headers['x-session-id'] || uuidv4();
  
  // Set session cookie if not exists
  if (!req.cookies?.sessionId) {
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
  }

  // Store session info for later use
  req.sessionId = sessionId;
  req.startTime = Date.now();

  // Track page view
  if (req.method === 'GET' && req.path.startsWith('/api/')) {
    try {
      await AnalyticsEvent.create({
        sessionId,
        userId: req.user?._id,
        eventType: 'page_view',
        page: req.path,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress,
        referrer: req.headers.referer
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
      // Don't block request if analytics fails
    }
  }

  next();
};

// Create or update session
const trackSession = async (req, res, next) => {
  if (req.path.startsWith('/api/analytics')) {
    return next();
  }

  const sessionId = req.sessionId || req.cookies?.sessionId;
  if (!sessionId) return next();

  try {
    let session = await Session.findOne({ sessionId, isActive: true });
    
    if (!session) {
      session = await Session.create({
        sessionId,
        userId: req.user?._id,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress,
        referrer: req.headers.referer
      });
    }

    req.session = session;
  } catch (error) {
    console.error('Session tracking error:', error);
  }

  next();
};

module.exports = { trackEvent, trackSession };

