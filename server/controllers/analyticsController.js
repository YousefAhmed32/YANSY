const { AnalyticsEvent, Session } = require('../models/Analytics');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

// ── Simple in-memory cache (5-minute TTL) ────────────────────────────────────
const _cache = new Map();
const cache = {
  get(key) {
    const entry = _cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) { _cache.delete(key); return null; }
    return entry.value;
  },
  set(key, value, ttlMs = 5 * 60 * 1000) {
    _cache.set(key, { value, expires: Date.now() + ttlMs });
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const parseDevice = (ua) => {
  if (!ua) return 'Unknown';
  const parser = new UAParser(ua);
  const device = parser.getDevice();
  if (device.type === 'mobile') return 'Mobile';
  if (device.type === 'tablet') return 'Tablet';
  return 'Desktop';
};

const parseBrowser = (ua) => {
  if (!ua) return 'Unknown';
  const parser = new UAParser(ua);
  const browser = parser.getBrowser();
  const name = (browser.name || '').toLowerCase();
  if (name.includes('chrome') && !name.includes('edge') && !name.includes('opera')) return 'Chrome';
  if (name.includes('safari') && !name.includes('chrome')) return 'Safari';
  if (name.includes('firefox')) return 'Firefox';
  if (name.includes('edge')) return 'Edge';
  return browser.name || 'Other';
};

const parseCountry = (ip) => {
  if (!ip) return null;
  const clean = ip.replace('::ffff:', '');
  if (clean === '127.0.0.1' || clean.startsWith('192.168') || clean.startsWith('10.')) return null;
  const geo = geoip.lookup(clean);
  return geo ? { country: geo.country, city: geo.city || null, ll: geo.ll } : null;
};

const parseSource = (referrer) => {
  if (!referrer) return 'Direct';
  const r = referrer.toLowerCase();
  if (r.includes('google.')) return 'Google';
  if (r.includes('facebook.') || r.includes('instagram.') || r.includes('twitter.') ||
      r.includes('linkedin.') || r.includes('tiktok.') || r.includes('youtube.')) return 'Social';
  if (r.includes('utm_source') || r.includes('utm_campaign')) return 'Campaign';
  return 'Referral';
};

const dateRange = (range = '30d') => {
  const now = new Date();
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
};

// ── Track event ───────────────────────────────────────────────────────────────
exports.trackEvent = async (req, res, next) => {
  try {
    const { eventType, page, section, scrollDepth, viewTime, elementId, elementType, metadata } = req.body;

    const event = await AnalyticsEvent.create({
      sessionId: req.sessionId || req.body.sessionId,
      userId: req.user?._id,
      eventType,
      page,
      section,
      scrollDepth,
      viewTime,
      elementId,
      elementType,
      metadata,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection?.remoteAddress,
      referrer: req.headers.referer,
    });

    res.status(201).json({ event });
  } catch (error) {
    next(error);
  }
};

// ── End session ───────────────────────────────────────────────────────────────
exports.endSession = async (req, res, next) => {
  try {
    const sessionId = req.sessionId || req.body.sessionId;
    if (!sessionId) return res.status(400).json({ error: 'Session ID required' });

    const session = await Session.findOne({ sessionId, isActive: true });
    if (session) {
      session.endTime = new Date();
      session.duration = session.endTime - session.startTime;
      session.isActive = false;
      await session.save();
    }

    res.json({ message: 'Session ended' });
  } catch (error) {
    next(error);
  }
};

// ── Visitors overview ─────────────────────────────────────────────────────────
exports.getVisitors = async (req, res, next) => {
  try {
    const { range = '30d' } = req.query;
    const cacheKey = `visitors:${range}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const rangeStart   = dateRange(range);

    const [
      visitorsToday,
      visitorsWeek,
      visitorsMonth,
      totalPageViews,
      uniqueSessionsRange,
      totalSessionsRange,
      sessionDurations,
      bounceData,
      timelineData,
    ] = await Promise.all([
      Session.countDocuments({ startTime: { $gte: startOfToday } }),
      Session.countDocuments({ startTime: { $gte: startOfWeek } }),
      Session.countDocuments({ startTime: { $gte: startOfMonth } }),
      AnalyticsEvent.countDocuments({ eventType: 'page_view', createdAt: { $gte: rangeStart } }),
      Session.countDocuments({ startTime: { $gte: rangeStart } }),
      Session.countDocuments({ startTime: { $gte: rangeStart }, userId: { $exists: true, $ne: null } }),
      Session.find({ startTime: { $gte: rangeStart }, duration: { $exists: true } }).select('duration').lean(),
      Session.aggregate([
        { $match: { startTime: { $gte: rangeStart } } },
        { $lookup: { from: 'analyticsevents', localField: 'sessionId', foreignField: 'sessionId', as: 'events' } },
        { $project: { pageViewCount: { $size: { $filter: { input: '$events', cond: { $eq: ['$$this.eventType', 'page_view'] } } } } } },
        { $group: { _id: null, total: { $sum: 1 }, bounces: { $sum: { $cond: [{ $lte: ['$pageViewCount', 1] }, 1, 0] } } } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { eventType: 'page_view', createdAt: { $gte: rangeStart } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, views: { $sum: 1 }, sessions: { $addToSet: '$sessionId' } } },
        { $project: { _id: 1, views: 1, sessions: { $size: '$sessions' } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const avgDuration = sessionDurations.length > 0
      ? Math.round(sessionDurations.reduce((s, d) => s + (d.duration || 0), 0) / sessionDurations.length / 1000)
      : 0;
    const bounceRate = bounceData[0]?.total > 0
      ? Math.round((bounceData[0].bounces / bounceData[0].total) * 100)
      : 0;

    const result = {
      visitorsToday,
      visitorsWeek,
      visitorsMonth,
      totalPageViews,
      uniqueSessions: uniqueSessionsRange,
      returningVisitors: totalSessionsRange,
      avgSessionDuration: avgDuration,
      bounceRate,
      timeline: timelineData,
    };

    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ── Real-time ─────────────────────────────────────────────────────────────────
exports.getRealtime = async (req, res, next) => {
  try {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

    const [activeNow, recentActivity, recentSessions] = await Promise.all([
      Session.countDocuments({ isActive: true, startTime: { $gte: thirtyMinAgo } }),
      AnalyticsEvent.find({ eventType: 'page_view', createdAt: { $gte: fiveMinAgo } })
        .sort({ createdAt: -1 })
        .limit(20)
        .select('page createdAt sessionId')
        .lean(),
      Session.countDocuments({ startTime: { $gte: fiveMinAgo } }),
    ]);

    res.json({ activeNow, recentSessions, recentActivity });
  } catch (error) {
    next(error);
  }
};

// ── Geography ─────────────────────────────────────────────────────────────────
exports.getGeography = async (req, res, next) => {
  try {
    const { range = '30d' } = req.query;
    const cacheKey = `geo:${range}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const rangeStart = dateRange(range);

    const sessions = await Session.find({ startTime: { $gte: rangeStart }, ip: { $exists: true, $ne: null } })
      .select('ip')
      .lean();

    const countryCounts = {};
    const cityCounts = {};

    for (const s of sessions) {
      const geo = parseCountry(s.ip);
      if (!geo) continue;
      countryCounts[geo.country] = (countryCounts[geo.country] || 0) + 1;
      if (geo.city) cityCounts[geo.city] = (cityCounts[geo.city] || 0) + 1;
    }

    const topCountries = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }));

    const topCities = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([city, count]) => ({ city, count }));

    const result = { topCountries, topCities, total: sessions.length };
    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ── Traffic sources ───────────────────────────────────────────────────────────
exports.getSources = async (req, res, next) => {
  try {
    const { range = '30d' } = req.query;
    const cacheKey = `sources:${range}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const rangeStart = dateRange(range);

    const sessions = await Session.find({ startTime: { $gte: rangeStart } })
      .select('referrer')
      .lean();

    const sourceCounts = { Direct: 0, Google: 0, Social: 0, Referral: 0, Campaign: 0 };
    for (const s of sessions) {
      const src = parseSource(s.referrer);
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    }

    const total = sessions.length || 1;
    const result = Object.entries(sourceCounts).map(([source, count]) => ({
      source,
      count,
      percent: Math.round((count / total) * 100),
    }));

    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ── Devices ───────────────────────────────────────────────────────────────────
exports.getDevices = async (req, res, next) => {
  try {
    const { range = '30d' } = req.query;
    const cacheKey = `devices:${range}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const rangeStart = dateRange(range);

    const sessions = await Session.find({ startTime: { $gte: rangeStart }, userAgent: { $exists: true } })
      .select('userAgent')
      .lean();

    const deviceCounts = {};
    const browserCounts = {};

    for (const s of sessions) {
      const dev = parseDevice(s.userAgent);
      const brw = parseBrowser(s.userAgent);
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
      browserCounts[brw] = (browserCounts[brw] || 0) + 1;
    }

    const total = sessions.length || 1;

    const devices = Object.entries(deviceCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([device, count]) => ({ device, count, percent: Math.round((count / total) * 100) }));

    const browsers = Object.entries(browserCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([browser, count]) => ({ browser, count, percent: Math.round((count / total) * 100) }));

    const result = { devices, browsers, total: sessions.length };
    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ── Pages detail ──────────────────────────────────────────────────────────────
exports.getPages = async (req, res, next) => {
  try {
    const { range = '30d' } = req.query;
    const cacheKey = `pages:${range}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const rangeStart = dateRange(range);

    const [mostVisited, entryPages, exitData] = await Promise.all([
      AnalyticsEvent.aggregate([
        { $match: { eventType: 'page_view', createdAt: { $gte: rangeStart } } },
        { $group: { _id: '$page', views: { $sum: 1 }, sessions: { $addToSet: '$sessionId' } } },
        { $project: { page: '$_id', views: 1, uniqueSessions: { $size: '$sessions' } } },
        { $sort: { views: -1 } },
        { $limit: 15 },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { eventType: 'page_view', createdAt: { $gte: rangeStart } } },
        { $sort: { createdAt: 1 } },
        { $group: { _id: '$sessionId', firstPage: { $first: '$page' } } },
        { $group: { _id: '$firstPage', entries: { $sum: 1 } } },
        { $sort: { entries: -1 } },
        { $limit: 10 },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { eventType: 'page_view', createdAt: { $gte: rangeStart } } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$sessionId', lastPage: { $first: '$page' } } },
        { $group: { _id: '$lastPage', exits: { $sum: 1 } } },
        { $sort: { exits: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const result = {
      mostVisited: mostVisited.map(p => ({ page: p.page, views: p.views, uniqueSessions: p.uniqueSessions })),
      entryPages: entryPages.map(p => ({ page: p._id, entries: p.entries })),
      exitPages: exitData.map(p => ({ page: p._id, exits: p.exits })),
    };

    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ── Conversions ───────────────────────────────────────────────────────────────
exports.getConversions = async (req, res, next) => {
  try {
    const { range = '30d' } = req.query;
    const cacheKey = `conversions:${range}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const rangeStart = dateRange(range);

    const conversionTypes = ['whatsapp_click', 'contact_form', 'booking_request', 'cta_click', 'lead'];

    const results = await Promise.all(
      conversionTypes.map(type =>
        AnalyticsEvent.countDocuments({
          createdAt: { $gte: rangeStart },
          $or: [{ eventType: type }, { elementId: { $regex: type, $options: 'i' } }],
        })
      )
    );

    const [whatsappClicks, contactForms, bookingRequests, ctaClicks, leads] = results;

    const timeline = await AnalyticsEvent.aggregate([
      {
        $match: {
          createdAt: { $gte: rangeStart },
          $or: conversionTypes.map(t => ({ eventType: t })),
        },
      },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, conversions: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const result = {
      whatsappClicks,
      contactForms,
      bookingRequests,
      ctaClicks,
      leads,
      total: whatsappClicks + contactForms + bookingRequests + leads,
      timeline,
    };

    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ── Legacy dashboard (keep for backward compat) ────────────────────────────────
exports.getDashboard = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate)   dateFilter.createdAt.$lte = new Date(endDate);
    }

    const [totalSessions, activeSessions, pageViews, clickEvents, topPages, topSections, scrollData, topClicks, activityOverTime, sessionDocs] =
      await Promise.all([
        Session.countDocuments(dateFilter),
        Session.countDocuments({ ...dateFilter, isActive: true, startTime: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
        AnalyticsEvent.countDocuments({ ...dateFilter, eventType: 'page_view' }),
        AnalyticsEvent.countDocuments({ ...dateFilter, eventType: 'click' }),
        AnalyticsEvent.aggregate([{ $match: { ...dateFilter, eventType: 'page_view' } }, { $group: { _id: '$page', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
        AnalyticsEvent.aggregate([{ $match: { ...dateFilter, eventType: 'section_view', section: { $exists: true } } }, { $group: { _id: '$section', count: { $sum: 1 }, avgViewTime: { $avg: '$viewTime' } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
        AnalyticsEvent.aggregate([{ $match: { ...dateFilter, eventType: 'scroll', scrollDepth: { $exists: true } } }, { $group: { _id: null, avgScrollDepth: { $avg: '$scrollDepth' }, maxScrollDepth: { $max: '$scrollDepth' } } }]),
        AnalyticsEvent.aggregate([{ $match: { ...dateFilter, eventType: 'click', elementId: { $exists: true } } }, { $group: { _id: '$elementId', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
        AnalyticsEvent.aggregate([{ $match: { ...dateFilter, createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, events: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
        Session.find({ ...dateFilter, duration: { $exists: true } }).select('duration').lean(),
      ]);

    const avgDuration = sessionDocs.length > 0
      ? sessionDocs.reduce((sum, s) => sum + (s.duration || 0), 0) / sessionDocs.length
      : 0;

    res.json({
      overview: { totalSessions, activeSessions, avgDuration: Math.round(avgDuration / 1000), pageViews, clickEvents },
      topPages, topSections,
      scrollData: scrollData[0] || { avgScrollDepth: 0, maxScrollDepth: 0 },
      topClicks, activityOverTime,
    });
  } catch (error) {
    next(error);
  }
};
