const { AnalyticsEvent, Session } = require('../models/Analytics');
const User = require('../models/User');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

// ── Cache with 45-second TTL for responsive updates ──────────────────────────
const _cache = new Map();
const cache = {
  get(key) {
    const entry = _cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) { _cache.delete(key); return null; }
    return entry.value;
  },
  set(key, value, ttlMs = 45 * 1000) {
    _cache.set(key, { value, expires: Date.now() + ttlMs });
  },
  clear() {
    _cache.clear();
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
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
  const browser = parser.getBrowser();
  const name = (browser.name || '').toLowerCase();
  if (name.includes('chrome') && !name.includes('edge') && !name.includes('opera')) return 'Chrome';
  if (name.includes('safari') && !name.includes('chrome')) return 'Safari';
  if (name.includes('firefox')) return 'Firefox';
  if (name.includes('edge')) return 'Edge';
  return browser.name || 'Other';
};

const parseOS = (ua) => {
  if (!ua) return 'Unknown';
  const parser = new UAParser(ua);
  return parser.getOS().name || 'Other';
};

const parseCountry = (ip) => {
  if (!ip) return null;
  const clean = ip.replace('::ffff:', '');
  if (clean === '127.0.0.1' || clean === '::1' || clean.startsWith('192.168') || clean.startsWith('10.')) {
    return { country: 'Local / Dev', city: 'Localhost' };
  }
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

const parseDateFilter = (query = {}) => {
  const { range = '30d', startDate, endDate } = query;
  const now = new Date();

  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return {
      start,
      end,
      isHourly: diffHours <= 48,
      cacheKeySuffix: `custom_${startDate}_${endDate}`,
    };
  }

  if (range === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return {
      start,
      end: now,
      isHourly: true,
      cacheKeySuffix: 'today',
    };
  }

  if (range === 'yesterday') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    return {
      start,
      end,
      isHourly: true,
      cacheKeySuffix: 'yesterday',
    };
  }

  if (range === '24h') {
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return {
      start,
      end: now,
      isHourly: true,
      cacheKeySuffix: '24h',
    };
  }

  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    start,
    end: now,
    isHourly: false,
    cacheKeySuffix: `${days}d`,
  };
};

const parseVisitorFilter = (visitorFilter) => {
  if (visitorFilter === 'clients_only') {
    return {
      isAdmin: { $ne: true },
      visitorType: { $ne: 'admin' },
    };
  }
  if (visitorFilter === 'admin_only') {
    return {
      $or: [{ isAdmin: true }, { visitorType: 'admin' }],
    };
  }
  return {};
};

// ── Track event ───────────────────────────────────────────────────────────────
exports.trackEvent = async (req, res, next) => {
  try {
    const {
      eventType,
      page,
      title,
      section,
      scrollDepth,
      viewTime,
      elementId,
      elementType,
      metadata,
      isAdmin: clientIsAdmin,
      visitorType: clientVisitorType,
      userEmail: clientEmail,
      userName: clientName,
      screenResolution,
      language,
      utm,
      visitCount,
    } = req.body;

    const sessionId = req.sessionId || req.body.sessionId;
    const ip = req.ip || req.connection?.remoteAddress;
    const ua = req.headers['user-agent'];
    const geo = parseCountry(ip);

    let isAdmin = Boolean(clientIsAdmin);
    let visitorType = clientVisitorType || 'guest';
    let userName = clientName || null;
    let userEmail = clientEmail || null;
    let userId = req.user?._id;

    if (!userId && req.headers.authorization) {
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.replace('Bearer ', '');
        const decoded = jwt.decode(token);
        if (decoded?.userId) userId = decoded.userId;
      } catch (_) {}
    }

    if (userId) {
      const u = await User.findById(userId).select('fullName email role').lean();
      if (u) {
        userName = u.fullName;
        userEmail = u.email;
        isAdmin = u.role === 'ADMIN' || u.role === 'SUPER_ADMIN';
        visitorType = isAdmin ? 'admin' : 'client';
      }
    }

    const event = await AnalyticsEvent.create({
      sessionId,
      userId,
      isAdmin,
      visitorType,
      userName,
      userEmail,
      eventType: eventType || 'page_view',
      page: page || '/',
      title,
      section,
      scrollDepth,
      viewTime,
      elementId,
      elementType,
      metadata,
      screenResolution,
      language,
      utm: utm && (utm.source || utm.campaign || utm.medium) ? utm : undefined,
      userAgent: ua,
      device: parseDevice(ua),
      browser: parseBrowser(ua),
      os: parseOS(ua),
      ip,
      country: geo?.country || null,
      city: geo?.city || null,
      referrer: req.headers.referer,
    });

    // Update Session stats asynchronously
    setImmediate(async () => {
      try {
        if (!sessionId) return;
        const conversionTypes = ['whatsapp_click', 'contact_form', 'booking_request', 'cta_click', 'lead'];
        const isConversion = conversionTypes.includes(eventType) || (elementId && /whatsapp|contact|lead/i.test(elementId));

        const updateOps = {
          $inc: { eventsCount: 1 },
          $set: { exitPage: page || '/' },
        };

        if (eventType === 'page_view') {
          updateOps.$inc.pageViewsCount = 1;
          updateOps.$push = {
            pages: {
              page: page || '/',
              title: title || '',
              scrollDepth: scrollDepth || 0,
              viewTime: viewTime || 0,
              enteredAt: new Date(),
            },
          };
        }

        if (screenResolution) updateOps.$set.screenResolution = screenResolution;
        if (language) updateOps.$set.language = language;
        if (utm && (utm.source || utm.campaign || utm.medium)) updateOps.$set.utm = utm;
        if (visitCount && Number(visitCount) > 1) updateOps.$set.visitCount = Number(visitCount);
        updateOps.$set.clarityUrl = 'https://clarity.microsoft.com/projects/view/x58kfxz02f/recordings';

        if (isConversion) {
          updateOps.$set.hasConversion = true;
          updateOps.$set.intentLevel = 'high';
          updateOps.$addToSet = { conversions: eventType };
        } else if (
          (eventType === 'page_view' && (scrollDepth >= 60 || (viewTime && viewTime > 30000))) ||
          (page && /contact|services|portfolio|quote/i.test(page)) ||
          (elementId && /contact|cta|quote|booking/i.test(elementId))
        ) {
          // Check if session is already high intent, if not upgrade to medium
          const existingSession = await Session.findOne({ sessionId }).select('intentLevel').lean();
          if (existingSession?.intentLevel !== 'high') {
            updateOps.$set.intentLevel = 'medium';
          }
        }

        if (isAdmin) {
          updateOps.$set.isAdmin = true;
          updateOps.$set.visitorType = 'admin';
        } else if (visitorType === 'client') {
          updateOps.$set.visitorType = 'client';
        }
        if (userName) updateOps.$set.userName = userName;
        if (userEmail) updateOps.$set.userEmail = userEmail;

        await Session.findOneAndUpdate({ sessionId }, updateOps, { new: true });
      } catch (err) {
        console.error('[Analytics] Session update error:', err.message);
      }
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

// ── Visitors overview (supports custom date, hourly resolution, and visitor filtering) ──
exports.getVisitors = async (req, res, next) => {
  try {
    const { range = '30d', startDate, endDate, visitorFilter = 'all' } = req.query;
    const dateFilter = parseDateFilter({ range, startDate, endDate });
    const vFilter = parseVisitorFilter(visitorFilter);

    const cacheKey = `visitors:${dateFilter.cacheKeySuffix}:${visitorFilter}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const startOfWeek  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const sessionMatchRange = {
      startTime: { $gte: dateFilter.start, $lte: dateFilter.end },
      ...vFilter,
    };
    const eventMatchRange = {
      eventType: 'page_view',
      createdAt: { $gte: dateFilter.start, $lte: dateFilter.end },
      ...vFilter,
    };

    // Timeline grouping format: Hourly if 24h/today/yesterday or <= 48h, else Daily
    const timelineFormat = dateFilter.isHourly ? '%Y-%m-%d %H:00' : '%Y-%m-%d';

    const [
      visitorsToday,
      visitorsWeek,
      visitorsMonth,
      totalPageViews,
      uniqueSessionsRange,
      returningVisitorsRange,
      sessionDurations,
      bounceData,
      timelineData,
    ] = await Promise.all([
      Session.countDocuments({ startTime: { $gte: startOfToday }, ...vFilter }),
      Session.countDocuments({ startTime: { $gte: startOfWeek }, ...vFilter }),
      Session.countDocuments({ startTime: { $gte: startOfMonth }, ...vFilter }),
      AnalyticsEvent.countDocuments(eventMatchRange),
      Session.countDocuments(sessionMatchRange),
      Session.countDocuments({ ...sessionMatchRange, userId: { $exists: true, $ne: null } }),
      Session.find({ ...sessionMatchRange, duration: { $exists: true } }).select('duration').lean(),
      Session.aggregate([
        { $match: sessionMatchRange },
        { $lookup: { from: 'analyticsevents', localField: 'sessionId', foreignField: 'sessionId', as: 'events' } },
        { $project: { pageViewCount: { $size: { $filter: { input: '$events', cond: { $eq: ['$$this.eventType', 'page_view'] } } } } } },
        { $group: { _id: null, total: { $sum: 1 }, bounces: { $sum: { $cond: [{ $lte: ['$pageViewCount', 1] }, 1, 0] } } } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: eventMatchRange },
        { $group: { _id: { $dateToString: { format: timelineFormat, date: '$createdAt' } }, views: { $sum: 1 }, sessions: { $addToSet: '$sessionId' } } },
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
      returningVisitors: returningVisitorsRange,
      avgSessionDuration: avgDuration,
      bounceRate,
      timeline: timelineData,
      isHourly: dateFilter.isHourly,
      periodLabel: dateFilter.cacheKeySuffix,
    };

    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ── Hourly analytics (00:00 to 23:00) & Peak Hours ─────────────────────────────
exports.getHourly = async (req, res, next) => {
  try {
    const { range = 'today', startDate, endDate, visitorFilter = 'all' } = req.query;
    const dateFilter = parseDateFilter({ range, startDate, endDate });
    const vFilter = parseVisitorFilter(visitorFilter);

    const cacheKey = `hourly:${dateFilter.cacheKeySuffix}:${visitorFilter}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const matchCond = {
      createdAt: { $gte: dateFilter.start, $lte: dateFilter.end },
      ...vFilter,
    };

    const conversionTypes = ['whatsapp_click', 'contact_form', 'booking_request', 'cta_click', 'lead'];

    const hourlyStats = await AnalyticsEvent.aggregate([
      { $match: matchCond },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          views: { $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] } },
          totalEvents: { $sum: 1 },
          sessions: { $addToSet: '$sessionId' },
          conversions: {
            $sum: {
              $cond: [
                { $in: ['$eventType', conversionTypes] },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          hour: '$_id',
          views: 1,
          events: '$totalEvents',
          sessions: { $size: '$sessions' },
          conversions: 1,
        },
      },
      { $sort: { hour: 1 } },
    ]);

    const hourMap = {};
    hourlyStats.forEach((h) => {
      hourMap[h.hour] = h;
    });

    const hours = Array.from({ length: 24 }, (_, i) => {
      const data = hourMap[i] || { hour: i, views: 0, sessions: 0, conversions: 0, events: 0 };
      const period = i >= 12 ? 'PM' : 'AM';
      const displayHour = i === 0 ? 12 : i > 12 ? i - 12 : i;
      const label = `${displayHour}:00 ${period}`;
      const labelAr = `${displayHour}:00 ${i >= 12 ? 'م' : 'ص'}`;
      return {
        hour: i,
        label,
        labelAr,
        views: data.views || 0,
        sessions: data.sessions || 0,
        conversions: data.conversions || 0,
        events: data.events || 0,
      };
    });

    let peakHour = hours[0];
    for (const h of hours) {
      if ((h.sessions + h.views) > (peakHour.sessions + peakHour.views)) {
        peakHour = h;
      }
    }

    const totalViews = hours.reduce((s, h) => s + h.views, 0);
    const totalSessions = hours.reduce((s, h) => s + h.sessions, 0);
    const totalConversions = hours.reduce((s, h) => s + h.conversions, 0);

    const result = {
      hours,
      peakHour: {
        hour: peakHour.hour,
        label: peakHour.label,
        labelAr: peakHour.labelAr,
        sessions: peakHour.sessions,
        views: peakHour.views,
        conversions: peakHour.conversions,
      },
      totalViews,
      totalSessions,
      totalConversions,
      period: dateFilter.cacheKeySuffix,
    };

    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ── Sessions explorer (Visitor Sessions List) ─────────────────────────────────
exports.getSessions = async (req, res, next) => {
  try {
    const {
      range = '30d',
      startDate,
      endDate,
      visitorFilter = 'all',
      hasConversion,
      intentLevel,
      search,
      page = 1,
      limit = 15,
    } = req.query;

    const dateFilter = parseDateFilter({ range, startDate, endDate });
    const vFilter = parseVisitorFilter(visitorFilter);

    const filter = {
      startTime: { $gte: dateFilter.start, $lte: dateFilter.end },
      ...vFilter,
    };

    if (hasConversion === 'true') {
      filter.hasConversion = true;
    }

    if (intentLevel && ['high', 'medium', 'low'].includes(intentLevel)) {
      filter.intentLevel = intentLevel;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { ip: { $regex: q, $options: 'i' } },
        { city: { $regex: q, $options: 'i' } },
        { country: { $regex: q, $options: 'i' } },
        { userName: { $regex: q, $options: 'i' } },
        { userEmail: { $regex: q, $options: 'i' } },
        { entryPage: { $regex: q, $options: 'i' } },
        { device: { $regex: q, $options: 'i' } },
        { 'utm.campaign': { $regex: q, $options: 'i' } },
        { 'utm.source': { $regex: q, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const [sessions, total] = await Promise.all([
      Session.find(filter)
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Session.countDocuments(filter),
    ]);

    const enhanced = sessions.map((s) => {
      const durationSec = s.duration
        ? Math.round(s.duration / 1000)
        : s.endTime
          ? Math.round((new Date(s.endTime) - new Date(s.startTime)) / 1000)
          : Math.max(0, Math.round((Date.now() - new Date(s.startTime).getTime()) / 1000));

      return {
        ...s,
        durationSec,
        viewsCount: s.pageViewsCount || s.pages?.length || 0,
      };
    });

    res.json({
      sessions: enhanced,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (error) {
    next(error);
  }
};

// ── Visitor Journey (What exactly did this client do step-by-step) ─────────────
exports.getSessionJourney = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) return res.status(400).json({ error: 'Session ID required' });

    const session = await Session.findOne({ sessionId }).lean();
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const events = await AnalyticsEvent.find({ sessionId })
      .sort({ createdAt: 1 })
      .lean();

    const sessionStart = new Date(session.startTime).getTime();

    const journey = events.map((ev, index) => {
      const evTime = new Date(ev.createdAt).getTime();
      const elapsedSec = Math.max(0, Math.round((evTime - sessionStart) / 1000));

      let titleAr = '';
      let titleEn = '';
      let badge = 'neutral';
      let icon = 'eye';

      switch (ev.eventType) {
        case 'page_view':
          titleAr = `زيارة صفحة ${ev.title || ev.page}`;
          titleEn = `Viewed page ${ev.title || ev.page}`;
          icon = 'globe';
          badge = 'info';
          break;
        case 'whatsapp_click':
          titleAr = 'نقر على زر واتساب للتواصل (تحويل ناجح 🎯)';
          titleEn = 'Clicked WhatsApp CTA (Conversion 🎯)';
          icon = 'message';
          badge = 'success';
          break;
        case 'contact_form':
        case 'lead':
          titleAr = 'إرسال طلب مشروع / تواصل (تحويل ناجح 🎯)';
          titleEn = 'Submitted contact / project form (Conversion 🎯)';
          icon = 'check-circle';
          badge = 'success';
          break;
        case 'booking_request':
          titleAr = 'طلب حجز موعد / استشارة (تحويل ناجح 🎯)';
          titleEn = 'Requested booking / consultation (Conversion 🎯)';
          icon = 'calendar';
          badge = 'success';
          break;
        case 'cta_click':
        case 'click':
          titleAr = `نقر على عنصر ${ev.elementId || ev.section || 'في الصفحة'}`;
          titleEn = `Clicked ${ev.elementId || ev.section || 'page element'}`;
          icon = 'mouse-pointer';
          badge = 'purple';
          break;
        case 'scroll':
          titleAr = `تمرير بالصفحة بنسبة ${ev.scrollDepth || 0}%`;
          titleEn = `Scrolled page to ${ev.scrollDepth || 0}%`;
          icon = 'arrow-down';
          badge = 'neutral';
          break;
        case 'section_view':
          titleAr = `مشاهدة قسم ${ev.section || ''} (${Math.round((ev.viewTime || 0) / 1000)} ثانية)`;
          titleEn = `Viewed section ${ev.section || ''} (${Math.round((ev.viewTime || 0) / 1000)}s)`;
          icon = 'eye';
          badge = 'info';
          break;
        default:
          titleAr = `إجراء: ${ev.eventType}`;
          titleEn = `Action: ${ev.eventType}`;
          icon = 'activity';
          badge = 'neutral';
      }

      return {
        id: ev._id,
        index: index + 1,
        eventType: ev.eventType,
        page: ev.page,
        title: ev.title,
        titleAr,
        titleEn,
        time: ev.createdAt,
        elapsedSec,
        scrollDepth: ev.scrollDepth,
        viewTime: ev.viewTime,
        elementId: ev.elementId,
        metadata: ev.metadata,
        badge,
        icon,
      };
    });

    const durationSec = session.duration
      ? Math.round(session.duration / 1000)
      : session.endTime
        ? Math.round((new Date(session.endTime) - new Date(session.startTime)) / 1000)
        : Math.max(0, Math.round((Date.now() - new Date(session.startTime).getTime()) / 1000));

    res.json({
      session: {
        ...session,
        durationSec,
      },
      journey,
      totalEvents: events.length,
    });
  } catch (error) {
    next(error);
  }
};

// ── Real-time ─────────────────────────────────────────────────────────────────
exports.getRealtime = async (req, res, next) => {
  try {
    const { visitorFilter = 'all' } = req.query;
    const vFilter = parseVisitorFilter(visitorFilter);

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

    const [activeNow, recentActivity, recentSessions, liveSessions] = await Promise.all([
      Session.countDocuments({ isActive: true, startTime: { $gte: thirtyMinAgo }, ...vFilter }),
      AnalyticsEvent.find({ createdAt: { $gte: fiveMinAgo }, ...vFilter })
        .sort({ createdAt: -1 })
        .limit(25)
        .select('page title eventType createdAt sessionId visitorType isAdmin userName userEmail city country device')
        .lean(),
      Session.countDocuments({ startTime: { $gte: fiveMinAgo }, ...vFilter }),
      Session.find({ isActive: true, startTime: { $gte: thirtyMinAgo }, ...vFilter })
        .sort({ startTime: -1 })
        .limit(10)
        .select('sessionId startTime visitorType isAdmin userName userEmail country city device browser entryPage pageViewsCount hasConversion')
        .lean(),
    ]);

    res.json({
      activeNow,
      recentSessions,
      recentActivity,
      liveSessions,
    });
  } catch (error) {
    next(error);
  }
};

// ── Geography ─────────────────────────────────────────────────────────────────
exports.getGeography = async (req, res, next) => {
  try {
    const { range = '30d', startDate, endDate, visitorFilter = 'all' } = req.query;
    const dateFilter = parseDateFilter({ range, startDate, endDate });
    const vFilter = parseVisitorFilter(visitorFilter);

    const cacheKey = `geo:${dateFilter.cacheKeySuffix}:${visitorFilter}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const sessions = await Session.find({
      startTime: { $gte: dateFilter.start, $lte: dateFilter.end },
      ip: { $exists: true, $ne: null },
      ...vFilter,
    })
      .select('ip country city')
      .lean();

    const countryCounts = {};
    const cityCounts = {};

    for (const s of sessions) {
      const country = s.country || (s.ip ? parseCountry(s.ip)?.country : null);
      const city = s.city || (s.ip ? parseCountry(s.ip)?.city : null);

      if (country) countryCounts[country] = (countryCounts[country] || 0) + 1;
      if (city) cityCounts[city] = (cityCounts[city] || 0) + 1;
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
    const { range = '30d', startDate, endDate, visitorFilter = 'all' } = req.query;
    const dateFilter = parseDateFilter({ range, startDate, endDate });
    const vFilter = parseVisitorFilter(visitorFilter);

    const cacheKey = `sources:${dateFilter.cacheKeySuffix}:${visitorFilter}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const sessions = await Session.find({
      startTime: { $gte: dateFilter.start, $lte: dateFilter.end },
      ...vFilter,
    })
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

// ── Devices & Browsers ────────────────────────────────────────────────────────
exports.getDevices = async (req, res, next) => {
  try {
    const { range = '30d', startDate, endDate, visitorFilter = 'all' } = req.query;
    const dateFilter = parseDateFilter({ range, startDate, endDate });
    const vFilter = parseVisitorFilter(visitorFilter);

    const cacheKey = `devices:${dateFilter.cacheKeySuffix}:${visitorFilter}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const sessions = await Session.find({
      startTime: { $gte: dateFilter.start, $lte: dateFilter.end },
      userAgent: { $exists: true },
      ...vFilter,
    })
      .select('userAgent device browser')
      .lean();

    const deviceCounts = {};
    const browserCounts = {};

    for (const s of sessions) {
      const dev = s.device || parseDevice(s.userAgent);
      const brw = s.browser || parseBrowser(s.userAgent);
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
    const { range = '30d', startDate, endDate, visitorFilter = 'all' } = req.query;
    const dateFilter = parseDateFilter({ range, startDate, endDate });
    const vFilter = parseVisitorFilter(visitorFilter);

    const cacheKey = `pages:${dateFilter.cacheKeySuffix}:${visitorFilter}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const matchCond = {
      eventType: 'page_view',
      createdAt: { $gte: dateFilter.start, $lte: dateFilter.end },
      ...vFilter,
    };

    const [mostVisited, entryPages, exitData] = await Promise.all([
      AnalyticsEvent.aggregate([
        { $match: matchCond },
        { $group: { _id: '$page', views: { $sum: 1 }, sessions: { $addToSet: '$sessionId' } } },
        { $project: { page: '$_id', views: 1, uniqueSessions: { $size: '$sessions' } } },
        { $sort: { views: -1 } },
        { $limit: 15 },
      ]),
      AnalyticsEvent.aggregate([
        { $match: matchCond },
        { $sort: { createdAt: 1 } },
        { $group: { _id: '$sessionId', firstPage: { $first: '$page' } } },
        { $group: { _id: '$firstPage', entries: { $sum: 1 } } },
        { $sort: { entries: -1 } },
        { $limit: 10 },
      ]),
      AnalyticsEvent.aggregate([
        { $match: matchCond },
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
    const { range = '30d', startDate, endDate, visitorFilter = 'all' } = req.query;
    const dateFilter = parseDateFilter({ range, startDate, endDate });
    const vFilter = parseVisitorFilter(visitorFilter);

    const cacheKey = `conversions:${dateFilter.cacheKeySuffix}:${visitorFilter}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const conversionTypes = ['whatsapp_click', 'contact_form', 'booking_request', 'cta_click', 'lead'];

    const matchBase = {
      createdAt: { $gte: dateFilter.start, $lte: dateFilter.end },
      ...vFilter,
    };

    const results = await Promise.all(
      conversionTypes.map(type =>
        AnalyticsEvent.countDocuments({
          ...matchBase,
          $or: [{ eventType: type }, { elementId: { $regex: type, $options: 'i' } }],
        })
      )
    );

    const [whatsappClicks, contactForms, bookingRequests, ctaClicks, leads] = results;

    const timelineFormat = dateFilter.isHourly ? '%Y-%m-%d %H:00' : '%Y-%m-%d';

    const timeline = await AnalyticsEvent.aggregate([
      {
        $match: {
          ...matchBase,
          $or: conversionTypes.map(t => ({ eventType: t })),
        },
      },
      { $group: { _id: { $dateToString: { format: timelineFormat, date: '$createdAt' } }, conversions: { $sum: 1 } } },
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
      isHourly: dateFilter.isHourly,
    };

    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ── Conversion Funnel (مسار التحويل) ───────────────────────────────────────────
exports.getFunnel = async (req, res, next) => {
  try {
    const { range = '30d', startDate, endDate, visitorFilter = 'all' } = req.query;
    const dateFilter = parseDateFilter({ range, startDate, endDate });
    const vFilter = parseVisitorFilter(visitorFilter);

    const cacheKey = `funnel:${dateFilter.cacheKeySuffix}:${visitorFilter}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const matchCond = {
      createdAt: { $gte: dateFilter.start, $lte: dateFilter.end },
      ...vFilter,
    };

    const conversionTypes = ['whatsapp_click', 'contact_form', 'booking_request', 'cta_click', 'lead'];

    const [funnelAgg, convEvents] = await Promise.all([
      AnalyticsEvent.aggregate([
        { $match: matchCond },
        {
          $group: {
            _id: '$sessionId',
            totalEvents: { $sum: 1 },
            pageViews: { $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] } },
            hasIntent: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $regexMatch: { input: '$page', regex: /contact|services|portfolio|quote/i } },
                      { $in: ['$eventType', ['click', 'cta_click']] },
                      { $regexMatch: { input: { $ifNull: ['$elementId', ''] }, regex: /contact|cta|quote|whatsapp/i } },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            hasConversion: {
              $sum: {
                $cond: [
                  { $in: ['$eventType', conversionTypes] },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            step2Explored: {
              $sum: {
                $cond: [
                  { $or: [{ $gte: ['$pageViews', 2] }, { $gte: ['$totalEvents', 2] }] },
                  1,
                  0,
                ],
              },
            },
            step3Intent: {
              $sum: {
                $cond: [
                  { $gt: ['$hasIntent', 0] },
                  1,
                  0,
                ],
              },
            },
            step4Converted: {
              $sum: {
                $cond: [
                  { $gt: ['$hasConversion', 0] },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      AnalyticsEvent.aggregate([
        {
          $match: {
            ...matchCond,
            eventType: { $in: conversionTypes },
          },
        },
        {
          $group: {
            _id: '$eventType',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const stats = funnelAgg[0] || { totalSessions: 0, step2Explored: 0, step3Intent: 0, step4Converted: 0 };
    const totalSessions = stats.totalSessions || 0;
    const engagedSessions = stats.step2Explored || 0;
    const highIntentSessions = stats.step3Intent || 0;
    const convertedSessions = stats.step4Converted || 0;

    const conversionBreakdown = {};
    convEvents.forEach((c) => {
      conversionBreakdown[c._id] = c.count;
    });

    const safeTotal = totalSessions || 1;
    const steps = [
      {
        id: 'step_1_landing',
        labelAr: '1. زيارة الموقع (الهبوط)',
        labelEn: '1. Landing & First Touch',
        descAr: 'إجمالي الزيارات والجلسات التي بدأت في الموقع',
        descEn: 'Total visitor sessions initiated on the site',
        count: totalSessions,
        conversionRate: 100,
        dropOffCount: Math.max(0, totalSessions - engagedSessions),
        dropOffRate: totalSessions > 0 ? Math.round(((totalSessions - engagedSessions) / totalSessions) * 100) : 0,
      },
      {
        id: 'step_2_explored',
        labelAr: '2. استكشاف المحتوى والخدمات',
        labelEn: '2. Explored Content & Services',
        descAr: 'زوار تصفحوا صفحتين أو أكثر أو قضوا أكثر من 30 ثانية',
        descEn: 'Visitors who explored 2+ pages or spent >30 seconds',
        count: engagedSessions,
        conversionRate: Math.round((engagedSessions / safeTotal) * 100),
        dropOffCount: Math.max(0, engagedSessions - highIntentSessions),
        dropOffRate: engagedSessions > 0 ? Math.round(((engagedSessions - highIntentSessions) / engagedSessions) * 100) : 0,
      },
      {
        id: 'step_3_intent',
        labelAr: '3. نية التعاقد والاهتمام الجاد',
        labelEn: '3. Purchase Intent & Evaluation',
        descAr: 'زيارة صفحات الخدمات/التواصل أو تفاعل مباشر مع أزرار CTA',
        descEn: 'Viewed services/contact pages or engaged with CTAs',
        count: highIntentSessions,
        conversionRate: Math.round((highIntentSessions / safeTotal) * 100),
        dropOffCount: Math.max(0, highIntentSessions - convertedSessions),
        dropOffRate: highIntentSessions > 0 ? Math.round(((highIntentSessions - convertedSessions) / highIntentSessions) * 100) : 0,
      },
      {
        id: 'step_4_converted',
        labelAr: '4. إتمام التحويل الفعلي (عملاء محتملين)',
        labelEn: '4. Final Conversion (Leads & Contacts)',
        descAr: 'تواصل مباشر عبر واتساب، أو إرسال طلب مشروع، أو حجز موعد',
        descEn: 'Direct WhatsApp contact, project form inquiry, or booking',
        count: convertedSessions,
        conversionRate: Math.round((convertedSessions / safeTotal) * 100),
        dropOffCount: 0,
        dropOffRate: 0,
      },
    ];

    const result = {
      steps,
      totalSessions,
      convertedSessions,
      overallConversionRate: totalSessions > 0 ? Number(((convertedSessions / totalSessions) * 100).toFixed(1)) : 0,
      breakdown: {
        whatsappClicks: conversionBreakdown['whatsapp_click'] || 0,
        contactForms: conversionBreakdown['contact_form'] || 0,
        bookingRequests: conversionBreakdown['booking_request'] || 0,
        leads: conversionBreakdown['lead'] || 0,
        ctaClicks: conversionBreakdown['cta_click'] || 0,
      },
    };

    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ── Weekly Activity Heatmap (7 Days x 24 Hours Matrix) ────────────────────────
exports.getHeatmap = async (req, res, next) => {
  try {
    const { range = '30d', startDate, endDate, visitorFilter = 'all' } = req.query;
    const dateFilter = parseDateFilter({ range, startDate, endDate });
    const vFilter = parseVisitorFilter(visitorFilter);

    const cacheKey = `heatmap:${dateFilter.cacheKeySuffix}:${visitorFilter}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const matchCond = {
      createdAt: { $gte: dateFilter.start, $lte: dateFilter.end },
      ...vFilter,
    };

    const rawData = await AnalyticsEvent.aggregate([
      { $match: matchCond },
      {
        $group: {
          _id: {
            day: { $dayOfWeek: '$createdAt' },
            hour: { $hour: '$createdAt' },
          },
          views: { $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] } },
          events: { $sum: 1 },
          sessions: { $addToSet: '$sessionId' },
        },
      },
      {
        $project: {
          day: '$_id.day',
          hour: '$_id.hour',
          views: 1,
          events: 1,
          sessions: { $size: '$sessions' },
        },
      },
    ]);

    // Map days: 1=Sunday, 2=Monday, 3=Tuesday, 4=Wednesday, 5=Thursday, 6=Friday, 7=Saturday
    const dayNames = [
      { day: 1, key: 'sun', ar: 'الأحد', en: 'Sun' },
      { day: 2, key: 'mon', ar: 'الإثنين', en: 'Mon' },
      { day: 3, key: 'tue', ar: 'الثلاثاء', en: 'Tue' },
      { day: 4, key: 'wed', ar: 'الأربعاء', en: 'Wed' },
      { day: 5, key: 'thu', ar: 'الخميس', en: 'Thu' },
      { day: 6, key: 'fri', ar: 'الجمعة', en: 'Fri' },
      { day: 7, key: 'sat', ar: 'السبت', en: 'Sat' },
    ];

    const dataMap = {};
    let maxIntensity = 1;
    let peakSlot = { day: 1, hour: 0, views: 0, sessions: 0, events: 0 };

    rawData.forEach((item) => {
      const key = `${item.day}-${item.hour}`;
      dataMap[key] = item;
      const intensity = item.sessions || item.views || 0;
      if (intensity > maxIntensity) maxIntensity = intensity;
      if (intensity > (peakSlot.sessions || 0)) {
        peakSlot = item;
      }
    });

    const matrix = dayNames.map((d) => {
      const hours = Array.from({ length: 24 }, (_, h) => {
        const item = dataMap[`${d.day}-${h}`] || { views: 0, sessions: 0, events: 0 };
        const score = item.sessions || item.views || 0;
        const normalized = Math.min(100, Math.round((score / maxIntensity) * 100));
        return {
          hour: h,
          views: item.views,
          sessions: item.sessions,
          events: item.events,
          intensity: score === 0 ? 0 : Math.max(12, normalized),
        };
      });
      return {
        day: d.day,
        key: d.key,
        nameAr: d.ar,
        nameEn: d.en,
        hours,
        totalSessions: hours.reduce((acc, h) => acc + h.sessions, 0),
        totalViews: hours.reduce((acc, h) => acc + h.views, 0),
      };
    });

    const bestDay = [...matrix].sort((a, b) => b.totalSessions - a.totalSessions)[0] || matrix[0];

    const peakDayMeta = dayNames.find((d) => d.day === peakSlot.day) || dayNames[0];
    const peakHourPeriod = peakSlot.hour >= 12 ? 'مساءً' : 'صباحاً';
    const peakHourDisplay = peakSlot.hour === 0 ? 12 : peakSlot.hour > 12 ? peakSlot.hour - 12 : peakSlot.hour;

    const result = {
      matrix,
      maxIntensity,
      peakSlot: {
        day: peakDayMeta.day,
        dayAr: peakDayMeta.ar,
        dayEn: peakDayMeta.en,
        hour: peakSlot.hour,
        labelAr: `${peakDayMeta.ar} الساعة ${peakHourDisplay}:00 ${peakHourPeriod}`,
        labelEn: `${peakDayMeta.en} at ${peakHourDisplay}:00 ${peakSlot.hour >= 12 ? 'PM' : 'AM'}`,
        sessions: peakSlot.sessions,
        views: peakSlot.views,
      },
      bestDay: {
        nameAr: bestDay.nameAr,
        nameEn: bestDay.nameEn,
        sessions: bestDay.totalSessions,
        views: bestDay.totalViews,
      },
    };

    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ── Marketing & Campaign Attribution (UTM & Traffic Sources) ─────────────────
exports.getCampaigns = async (req, res, next) => {
  try {
    const { range = '30d', startDate, endDate, visitorFilter = 'all' } = req.query;
    const dateFilter = parseDateFilter({ range, startDate, endDate });
    const vFilter = parseVisitorFilter(visitorFilter);

    const cacheKey = `campaigns:${dateFilter.cacheKeySuffix}:${visitorFilter}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const sessionMatch = {
      startTime: { $gte: dateFilter.start, $lte: dateFilter.end },
      ...vFilter,
    };

    const sessions = await Session.find(sessionMatch)
      .select('utm referrer hasConversion duration pageViewsCount')
      .lean();

    const campaignMap = {};
    let totalCampaignSessions = 0;
    let totalDirectOrganic = 0;

    for (const s of sessions) {
      const cName = s.utm?.campaign || (s.utm?.source ? `[${s.utm.source}] Source` : null);
      const isTrackedCampaign = Boolean(s.utm?.campaign || s.utm?.source);

      if (isTrackedCampaign) {
        totalCampaignSessions += 1;
      } else {
        totalDirectOrganic += 1;
      }

      const key = cName || 'Direct / Organic (عضوي ومباشر)';
      if (!campaignMap[key]) {
        campaignMap[key] = {
          name: key,
          source: s.utm?.source || parseSource(s.referrer),
          medium: s.utm?.medium || (isTrackedCampaign ? 'campaign' : 'direct/referral'),
          sessions: 0,
          pageViews: 0,
          conversions: 0,
          totalDurationSec: 0,
        };
      }

      campaignMap[key].sessions += 1;
      campaignMap[key].pageViews += (s.pageViewsCount || 1);
      if (s.hasConversion) campaignMap[key].conversions += 1;
      if (s.duration) campaignMap[key].totalDurationSec += Math.round(s.duration / 1000);
    }

    const campaigns = Object.values(campaignMap).map((c) => {
      const convRate = c.sessions > 0 ? Number(((c.conversions / c.sessions) * 100).toFixed(1)) : 0;
      const avgDurationSec = c.sessions > 0 ? Math.round(c.totalDurationSec / c.sessions) : 0;
      return {
        ...c,
        conversionRate: convRate,
        avgDurationSec,
      };
    }).sort((a, b) => b.sessions - a.sessions);

    const totalSessions = sessions.length || 1;
    const totalConversions = sessions.filter((s) => s.hasConversion).length;

    const result = {
      campaigns,
      totalCampaignSessions,
      totalDirectOrganic,
      totalSessions,
      totalConversions,
      overallConversionRate: Number(((totalConversions / totalSessions) * 100).toFixed(1)),
    };

    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ── Legacy dashboard ──────────────────────────────────────────────────────────
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

