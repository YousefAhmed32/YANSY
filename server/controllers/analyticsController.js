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

// ── Non-API Page Filter (ensure internal API polling never corrupts telemetry) ─
const nonApiPageFilter = { page: { $not: { $regex: '^/api' } } };

const parseDateFilter = (query = {}) => {
  const { range = '30d', startDate, endDate } = query;
  const now = new Date();

  // If explicit custom date range provided:
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // If inputs did not specify time (e.g. standard YYYY-MM-DD), expand to full start and end of days
    const hasTimeComponent = String(startDate).includes('T') || String(startDate).includes(':');
    if (!hasTimeComponent) {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    const diffMinutes = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60));
    const diffHours = diffMinutes / 60;

    return {
      start,
      end,
      isMinute: diffMinutes <= 180, // <= 3 hours: minute-level breakdown (5-min slots)
      isHourly: diffHours <= 72 && diffMinutes > 180, // 3h to 72h: hourly breakdown
      cacheKeySuffix: `custom_${start.getTime()}_${end.getTime()}`,
    };
  }

  if (range === 'realtime' || range === 'now') {
    const start = new Date(now.getTime() - 30 * 60 * 1000);
    return {
      start,
      end: now,
      isMinute: true,
      isHourly: false,
      cacheKeySuffix: 'realtime',
    };
  }

  if (range === '60m' || range === '1h') {
    const start = new Date(now.getTime() - 60 * 60 * 1000);
    return {
      start,
      end: now,
      isMinute: true,
      isHourly: false,
      cacheKeySuffix: '60m',
    };
  }

  if (range === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return {
      start,
      end: now,
      isMinute: false,
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
      isMinute: false,
      isHourly: true,
      cacheKeySuffix: 'yesterday',
    };
  }

  if (range === '24h') {
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return {
      start,
      end: now,
      isMinute: false,
      isHourly: true,
      cacheKeySuffix: '24h',
    };
  }

  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    start,
    end: now,
    isMinute: false,
    isHourly: false,
    cacheKeySuffix: `${days}d`,
  };
};

const parseVisitorFilter = (visitorFilter) => {
  if (visitorFilter === 'clients_only') {
    return {
      isAdmin: { $ne: true },
      visitorType: { $ne: 'admin' },
      ip: { $nin: ['::1', '127.0.0.1', 'localhost'] },
    };
  }
  if (visitorFilter === 'admin_only') {
    return {
      $or: [
        { isAdmin: true },
        { visitorType: 'admin' },
        { ip: { $in: ['::1', '127.0.0.1', 'localhost'] } },
      ],
    };
  }
  if (visitorFilter === 'high_intent') {
    return {
      intentLevel: 'high',
      isAdmin: { $ne: true },
      visitorType: { $ne: 'admin' },
      ip: { $nin: ['::1', '127.0.0.1', 'localhost'] },
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

    // Discard any backend /api route from telemetry
    if (page && page.startsWith('/api')) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    const sessionId = req.sessionId || req.body.sessionId;
    const ip = req.ip || req.connection?.remoteAddress;
    const ua = req.headers['user-agent'];
    const geo = parseCountry(ip);

    const isLocal = !ip || ip === '::1' || ip === '127.0.0.1' || ip === 'localhost';
    let isAdmin = Boolean(clientIsAdmin) || isLocal;
    let visitorType = isAdmin ? 'admin' : (clientVisitorType || 'guest');
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
        isAdmin = u.role === 'ADMIN' || u.role === 'SUPER_ADMIN' || isLocal;
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
          $set: { exitPage: page || '/', isActive: true, endTime: new Date() },
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

// ── Heartbeat Session (keeps session alive and updates exact duration) ────────
exports.heartbeatSession = async (req, res) => {
  try {
    const { sessionId, durationSec, lastPage } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'Session ID required' });

    const safeDuration = Math.min(4 * 3600 * 1000, Math.max(5000, Number(durationSec || 0) * 1000));

    await Session.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          isActive: true,
          endTime: new Date(),
          duration: safeDuration,
          ...(lastPage ? { exitPage: lastPage } : {}),
        },
      }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── End session ───────────────────────────────────────────────────────────────
exports.endSession = async (req, res, next) => {
  try {
    const sessionId = req.sessionId || req.body.sessionId;
    if (!sessionId) return res.status(400).json({ error: 'Session ID required' });

    const session = await Session.findOne({ sessionId });
    if (session) {
      session.endTime = new Date();
      const rawDur = session.endTime - session.startTime;
      session.duration = Math.min(4 * 3600 * 1000, Math.max(5000, rawDur));
      session.isActive = false;
      await session.save();
    }

    res.json({ message: 'Session ended' });
  } catch (error) {
    next(error);
  }
};

// ── Visitors overview (Dynamic Period-Specific Metrics + Minute/Hourly Resolution) ──
exports.getVisitors = async (req, res, next) => {
  try {
    const { range = '30d', startDate, endDate, visitorFilter = 'clients_only' } = req.query;
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
      ...nonApiPageFilter,
      createdAt: { $gte: dateFilter.start, $lte: dateFilter.end },
      ...vFilter,
    };

    const timelineFormat = dateFilter.isMinute
      ? '%H:%M'
      : dateFilter.isHourly
        ? '%Y-%m-%d %H:00'
        : '%Y-%m-%d';

    const conversionTypes = ['whatsapp_click', 'contact_form', 'booking_request', 'cta_click', 'lead'];

    const [
      uniqueSessionsRange,
      totalPageViews,
      sessionDurations,
      returningVisitorsRange,
      highIntentRange,
      conversionsRange,
      singleViewSessions,
      timelineData,
      visitorsToday,
      visitorsWeek,
      visitorsMonth,
    ] = await Promise.all([
      Session.countDocuments(sessionMatchRange),
      AnalyticsEvent.countDocuments(eventMatchRange),
      Session.find(sessionMatchRange).select('duration pages startTime endTime').lean(),
      Session.countDocuments({ ...sessionMatchRange, $or: [{ visitCount: { $gt: 1 } }, { userId: { $exists: true, $ne: null } }] }),
      Session.countDocuments({ ...sessionMatchRange, intentLevel: 'high' }),
      AnalyticsEvent.countDocuments({
        createdAt: { $gte: dateFilter.start, $lte: dateFilter.end },
        eventType: { $in: conversionTypes },
        ...vFilter,
      }),
      Session.countDocuments({ ...sessionMatchRange, pageViewsCount: { $lte: 1 } }),
      AnalyticsEvent.aggregate([
        { $match: eventMatchRange },
        { $group: { _id: { $dateToString: { format: timelineFormat, date: '$createdAt' } }, views: { $sum: 1 }, sessions: { $addToSet: '$sessionId' } } },
        { $project: { _id: 1, views: 1, sessions: { $size: '$sessions' } } },
        { $sort: { _id: 1 } },
      ]),
      // Reference baseline counters
      Session.countDocuments({ startTime: { $gte: startOfToday }, ...vFilter }),
      Session.countDocuments({ startTime: { $gte: startOfWeek }, ...vFilter }),
      Session.countDocuments({ startTime: { $gte: startOfMonth }, ...vFilter }),
    ]);

    // Calculate avg duration safely
    let totalDurationSec = 0;
    let countedSessions = 0;
    sessionDurations.forEach((s) => {
      let durSec = 0;
      if (s.duration && s.duration > 0 && s.duration < 4 * 3600 * 1000) {
        durSec = Math.round(s.duration / 1000);
      } else if (s.endTime && s.startTime) {
        const delta = Math.round((new Date(s.endTime) - new Date(s.startTime)) / 1000);
        if (delta > 0 && delta < 4 * 3600) durSec = delta;
      }
      if (durSec > 0) {
        totalDurationSec += durSec;
        countedSessions++;
      }
    });
    const avgDuration = countedSessions > 0 ? Math.round(totalDurationSec / countedSessions) : 0;

    const bounceRate = uniqueSessionsRange > 0
      ? Math.min(100, Math.round((singleViewSessions / uniqueSessionsRange) * 100))
      : 0;

    const conversionRate = uniqueSessionsRange > 0
      ? Number(((conversionsRange / uniqueSessionsRange) * 100).toFixed(1))
      : 0;

    const result = {
      // Dynamic period metrics (matching active date filter)
      visitorsInPeriod: uniqueSessionsRange,
      uniqueSessions: uniqueSessionsRange,
      totalPageViews,
      avgSessionDuration: avgDuration,
      bounceRate,
      conversionsCount: conversionsRange,
      conversionRate,
      highIntentSessions: highIntentRange,
      returningVisitors: returningVisitorsRange,

      // Baseline compatibility
      visitorsToday,
      visitorsWeek,
      visitorsMonth,

      timeline: timelineData,
      isMinute: dateFilter.isMinute,
      isHourly: dateFilter.isHourly,
      periodLabel: dateFilter.cacheKeySuffix,
      startDate: dateFilter.start,
      endDate: dateFilter.end,
    };

    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ── Hourly & Minute analytics (00:00 to 23:00 / 5-min intervals) & Peak Hours ──
exports.getHourly = async (req, res, next) => {
  try {
    const { range = 'today', startDate, endDate, visitorFilter = 'clients_only' } = req.query;
    const dateFilter = parseDateFilter({ range, startDate, endDate });
    const vFilter = parseVisitorFilter(visitorFilter);

    const cacheKey = `hourly:${dateFilter.cacheKeySuffix}:${visitorFilter}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const matchCond = {
      createdAt: { $gte: dateFilter.start, $lte: dateFilter.end },
      ...nonApiPageFilter,
      ...vFilter,
    };

    const conversionTypes = ['whatsapp_click', 'contact_form', 'booking_request', 'cta_click', 'lead'];

    // If minute-level (e.g. 60m or <= 3 hours):
    if (dateFilter.isMinute) {
      const slots = [];
      const endTime = dateFilter.end.getTime();
      for (let i = 11; i >= 0; i--) {
        const slotEnd = new Date(endTime - i * 5 * 60 * 1000);
        const slotStart = new Date(endTime - (i + 1) * 5 * 60 * 1000);
        const label = slotStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const labelAr = slotStart.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
        slots.push({ slotStart, slotEnd, label, labelAr, views: 0, sessions: 0, conversions: 0 });
      }

      const events = await AnalyticsEvent.find(matchCond).select('createdAt eventType sessionId').lean();
      events.forEach((ev) => {
        const t = new Date(ev.createdAt).getTime();
        for (const slot of slots) {
          if (t >= slot.slotStart.getTime() && t < slot.slotEnd.getTime()) {
            if (ev.eventType === 'page_view') slot.views++;
            if (conversionTypes.includes(ev.eventType)) slot.conversions++;
            slot.sessions++;
            break;
          }
        }
      });

      let peak = slots[0];
      slots.forEach(s => { if (s.views + s.sessions > peak.views + peak.sessions) peak = s; });

      const result = {
        isMinute: true,
        hours: slots,
        peakHour: {
          label: peak.label,
          labelAr: peak.labelAr,
          sessions: peak.sessions,
          views: peak.views,
          conversions: peak.conversions,
        },
        totalViews: slots.reduce((a, b) => a + b.views, 0),
        totalSessions: slots.reduce((a, b) => a + b.sessions, 0),
        totalConversions: slots.reduce((a, b) => a + b.conversions, 0),
        period: dateFilter.cacheKeySuffix,
      };

      cache.set(cacheKey, result);
      return res.json(result);
    }

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
      isMinute: false,
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
      visitorFilter = 'clients_only',
      hasConversion,
      intentLevel,
      activeOnly,
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

    if (activeOnly === 'true') {
      filter.isActive = true;
      filter.startTime = { $gte: new Date(Date.now() - 30 * 60 * 1000) };
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
      let durationSec = 15;
      if (s.duration && s.duration > 0 && s.duration < 4 * 3600 * 1000) {
        durationSec = Math.round(s.duration / 1000);
      } else if (s.endTime && s.startTime) {
        const delta = Math.round((new Date(s.endTime) - new Date(s.startTime)) / 1000);
        if (delta > 0 && delta < 4 * 3600) durationSec = delta;
      }

      const isLive = Boolean(s.isActive && (Date.now() - new Date(s.startTime).getTime() < 30 * 60 * 1000));

      return {
        ...s,
        durationSec,
        viewsCount: s.pageViewsCount || (s.pages ? s.pages.filter(p => !p.page?.startsWith('/api')).length : 1),
        isLive,
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

    const events = await AnalyticsEvent.find({ sessionId, ...nonApiPageFilter })
      .sort({ createdAt: 1 })
      .lean();

    const sessionStart = new Date(session.startTime).getTime();

    const journey = events.map((ev, index) => {
      const evTime = new Date(ev.createdAt).getTime();
      const elapsedSec = Math.max(0, Math.round((evTime - sessionStart) / 1000));

      let timeSpentOnStepSec = 0;
      if (index < events.length - 1) {
        const nextTime = new Date(events[index + 1].createdAt).getTime();
        timeSpentOnStepSec = Math.max(0, Math.round((nextTime - evTime) / 1000));
      }

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

      const evDate = new Date(ev.createdAt);
      const timeWallAr = evDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      const timeWallEn = evDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

      return {
        id: ev._id,
        index: index + 1,
        eventType: ev.eventType,
        page: ev.page,
        title: ev.title,
        titleAr,
        titleEn,
        time: ev.createdAt,
        timeWallAr,
        timeWallEn,
        elapsedSec,
        timeSpentOnStepSec,
        scrollDepth: ev.scrollDepth,
        viewTime: ev.viewTime,
        elementId: ev.elementId,
        metadata: ev.metadata,
        badge,
        icon,
      };
    });

    let durationSec = 15;
    if (session.duration && session.duration > 0 && session.duration < 4 * 3600 * 1000) {
      durationSec = Math.round(session.duration / 1000);
    } else if (session.endTime && session.startTime) {
      const delta = Math.round((new Date(session.endTime) - new Date(session.startTime)) / 1000);
      if (delta > 0 && delta < 4 * 3600) durationSec = delta;
    }

    const isLive = Boolean(session.isActive && (Date.now() - new Date(session.startTime).getTime() < 30 * 60 * 1000));

    res.json({
      session: {
        ...session,
        durationSec,
        isLive,
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
    const { visitorFilter = 'clients_only' } = req.query;
    const vFilter = parseVisitorFilter(visitorFilter);

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

    const [activeNow, recentActivity, recentSessions, liveSessions] = await Promise.all([
      Session.countDocuments({ isActive: true, startTime: { $gte: thirtyMinAgo }, ...vFilter }),
      AnalyticsEvent.find({ createdAt: { $gte: fiveMinAgo }, ...nonApiPageFilter, ...vFilter })
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
    const { range = '30d', startDate, endDate, visitorFilter = 'clients_only' } = req.query;
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
    const { range = '30d', startDate, endDate, visitorFilter = 'clients_only' } = req.query;
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
    const { range = '30d', startDate, endDate, visitorFilter = 'clients_only' } = req.query;
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
    const { range = '30d', startDate, endDate, visitorFilter = 'clients_only' } = req.query;
    const dateFilter = parseDateFilter({ range, startDate, endDate });
    const vFilter = parseVisitorFilter(visitorFilter);

    const cacheKey = `pages:${dateFilter.cacheKeySuffix}:${visitorFilter}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const matchCond = {
      eventType: 'page_view',
      ...nonApiPageFilter,
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
    const { range = '30d', startDate, endDate, visitorFilter = 'clients_only' } = req.query;
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
    const { range = '30d', startDate, endDate, visitorFilter = 'clients_only' } = req.query;
    const dateFilter = parseDateFilter({ range, startDate, endDate });
    const vFilter = parseVisitorFilter(visitorFilter);

    const cacheKey = `funnel:${dateFilter.cacheKeySuffix}:${visitorFilter}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const matchCond = {
      createdAt: { $gte: dateFilter.start, $lte: dateFilter.end },
      ...nonApiPageFilter,
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
    const { range = '30d', startDate, endDate, visitorFilter = 'clients_only' } = req.query;
    const dateFilter = parseDateFilter({ range, startDate, endDate });
    const vFilter = parseVisitorFilter(visitorFilter);

    const cacheKey = `heatmap:${dateFilter.cacheKeySuffix}:${visitorFilter}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const matchCond = {
      createdAt: { $gte: dateFilter.start, $lte: dateFilter.end },
      ...nonApiPageFilter,
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
    const { range = '30d', startDate, endDate, visitorFilter = 'clients_only' } = req.query;
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

// ── Mission Control & Main Admin Dashboard ──────────────────────────────────
exports.getDashboard = async (req, res, next) => {
  try {
    const { range = 'today', startDate, endDate, visitorFilter = 'clients_only' } = req.query;

    // Unified Date & Visitor parsing
    const { start, end, isMinute, isHourly } = parseDateFilter(req.query);
    const visitorMatch = parseVisitorFilter(visitorFilter);

    const sessionDateFilter = {
      startTime: { $gte: start, $lte: end },
      ...visitorMatch,
    };
    const eventDateFilter = {
      createdAt: { $gte: start, $lte: end },
      ...visitorMatch,
    };

    // 1. Live Active Clients right now (within last 15 mins)
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const activeNowFilter = {
      $or: [
        { updatedAt: { $gte: fifteenMinsAgo } },
        { startTime: { $gte: fifteenMinsAgo } },
      ],
      ...parseVisitorFilter('clients_only'),
    };

    // 2. Today stats (always calculated from midnight to now for baseline comparison)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      activeNow,
      todayVisitors,
      todayPageViews,
      totalSessions,
      pageViews,
      returningSessions,
      firstTimeSessions,
      whatsappHovers,
      whatsappClicks,
      startProjectClicks,
      formSubmissions,
      durationAgg,
      topPagesAgg,
      recentEvents,
      topSections,
      scrollData,
      topClicks,
      activityOverTime
    ] = await Promise.all([
      Session.countDocuments(activeNowFilter),
      Session.countDocuments({ startTime: { $gte: startOfToday }, ...visitorMatch }),
      AnalyticsEvent.countDocuments({ createdAt: { $gte: startOfToday }, eventType: 'page_view', ...nonApiPageFilter, ...visitorMatch }),
      Session.countDocuments(sessionDateFilter),
      AnalyticsEvent.countDocuments({ ...eventDateFilter, eventType: 'page_view', ...nonApiPageFilter }),
      Session.countDocuments({ ...sessionDateFilter, visitCount: { $gt: 1 } }),
      Session.countDocuments({ ...sessionDateFilter, $or: [{ visitCount: 1 }, { visitCount: { $exists: false } }] }),
      AnalyticsEvent.countDocuments({
        ...eventDateFilter,
        $or: [
          { eventType: 'whatsapp_hover' },
          { elementId: 'whatsapp_cta', eventType: 'hover' },
        ],
      }),
      AnalyticsEvent.countDocuments({
        ...eventDateFilter,
        $or: [
          { eventType: 'whatsapp_click' },
          { elementId: 'whatsapp_cta', eventType: 'click' },
          { 'metadata.source': 'whatsapp' },
          { elementId: 'hero-whatsapp-direct' },
        ],
      }),
      AnalyticsEvent.countDocuments({
        ...eventDateFilter,
        $or: [
          { eventType: 'cta_click', elementId: /start.*project/i },
          { eventType: 'click', elementId: /start.*project/i },
          { elementId: 'start_project_cta' },
          { elementId: 'hero-primary' },
        ],
      }),
      AnalyticsEvent.countDocuments({
        ...eventDateFilter,
        $or: [
          { eventType: 'lead' },
          { eventType: 'contact_form' },
          { eventType: 'booking_request' },
          { 'metadata.formType': 'start-project' },
        ],
      }),
      Session.aggregate([
        { $match: sessionDateFilter },
        { $group: { _id: null, avgDur: { $avg: '$duration' } } }
      ]),
      AnalyticsEvent.aggregate([
        { $match: { ...eventDateFilter, eventType: 'page_view', ...nonApiPageFilter } },
        {
          $group: {
            _id: '$page',
            title: { $first: '$title' },
            count: { $sum: 1 },
            avgViewTime: { $avg: '$viewTime' },
          }
        },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      AnalyticsEvent.find({
        ...visitorMatch,
        eventType: { $in: ['session_start', 'session_end', 'page_view', 'whatsapp_click', 'whatsapp_hover', 'cta_click', 'lead'] },
        ...nonApiPageFilter,
      })
      .sort({ createdAt: -1 })
      .limit(12)
      .select('eventType page title elementId city country device browser createdAt sessionId userName visitorType')
      .lean(),
      AnalyticsEvent.aggregate([
        { $match: { ...eventDateFilter, eventType: 'section_view', section: { $exists: true } } },
        { $group: { _id: '$section', count: { $sum: 1 }, avgViewTime: { $avg: '$viewTime' } } },
        { $sort: { count: -1 } },
        { $limit: 6 }
      ]),
      AnalyticsEvent.aggregate([
        { $match: { ...eventDateFilter, eventType: 'scroll', scrollDepth: { $exists: true } } },
        { $group: { _id: null, avgScrollDepth: { $avg: '$scrollDepth' }, maxScrollDepth: { $max: '$scrollDepth' } } }
      ]),
      AnalyticsEvent.aggregate([
        { $match: { ...eventDateFilter, eventType: 'click', elementId: { $exists: true } } },
        { $group: { _id: '$elementId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 }
      ]),
      AnalyticsEvent.aggregate([
        { $match: { ...eventDateFilter, createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, events: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
    ]);

    const avgDurationSec = Math.round((durationAgg[0]?.avgDur || 0) / 1000);
    const repeatRate = (returningSessions + firstTimeSessions) > 0
      ? Math.round((returningSessions / (returningSessions + firstTimeSessions)) * 100)
      : 0;

    // Format In/Out Live Visitor Activity Stream
    const activityFeed = recentEvents.map((e) => {
      let actionAr = 'تصفح صفحة';
      let actionEn = 'Viewed page';
      let tone = 'neutral';

      if (e.eventType === 'session_start') {
        actionAr = 'دخل إلى المنصة الآن 🟢';
        actionEn = 'Entered platform 🟢';
        tone = 'success';
      } else if (e.eventType === 'session_end') {
        actionAr = 'أنهى التصفح وغادر 🔴';
        actionEn = 'Exited platform 🔴';
        tone = 'danger';
      } else if (e.eventType === 'whatsapp_click') {
        actionAr = 'ضغط على زر الواتساب للتواصل 🔥';
        actionEn = 'Clicked WhatsApp CTA 🔥';
        tone = 'success';
      } else if (e.eventType === 'whatsapp_hover') {
        actionAr = 'وقف بالماوس عند زر الواتساب 💬';
        actionEn = 'Hovered WhatsApp button 💬';
        tone = 'warning';
      } else if (e.eventType === 'cta_click') {
        actionAr = 'نقر على زر بدء المشروع 🚀';
        actionEn = 'Clicked Start Project 🚀';
        tone = 'purple';
      } else if (e.eventType === 'lead') {
        actionAr = 'قدّم طلب مشروع جديد 🎯';
        actionEn = 'Submitted project inquiry 🎯';
        tone = 'success';
      } else if (e.title || e.page) {
        actionAr = `تصفح صفحة: ${e.title || e.page}`;
        actionEn = `Viewed: ${e.title || e.page}`;
      }

      return {
        id: e._id,
        eventType: e.eventType,
        actionAr,
        actionEn,
        tone,
        page: e.page,
        city: e.city || '',
        country: e.country || '',
        device: e.device || 'Desktop',
        browser: e.browser || 'Browser',
        userName: e.userName || null,
        visitorType: e.visitorType || 'guest',
        time: e.createdAt,
      };
    });

    // Format top pages with percentages
    const maxPageCount = topPagesAgg[0]?.count || 1;
    const topPages = topPagesAgg.map((p) => ({
      _id: p._id,
      title: p.title || p._id,
      count: p.count,
      pct: Math.round((p.count / Math.max(pageViews, 1)) * 100),
      relativeToTopPct: Math.round((p.count / maxPageCount) * 100),
      avgViewTimeSec: Math.round((p.avgViewTime || 0) / 1000),
    }));

    res.json({
      activeNow,
      today: {
        visitors: todayVisitors,
        pageViews: todayPageViews,
      },
      period: {
        range,
        startDate: start,
        endDate: end,
        isMinute,
        isHourly,
        totalSessions,
        pageViews,
        avgDurationSec,
      },
      newVsReturning: {
        returning: returningSessions,
        firstTime: firstTimeSessions,
        repeatRate,
      },
      cta: {
        whatsappHovers,
        whatsappClicks,
        startProjectClicks,
        formSubmissions,
      },
      topPages,
      activityFeed,
      overview: {
        totalSessions,
        activeSessions: activeNow,
        avgDuration: avgDurationSec,
        pageViews,
        clickEvents: whatsappClicks + startProjectClicks,
      },
      topSections,
      scrollData: scrollData[0] || { avgScrollDepth: 0, maxScrollDepth: 0 },
      topClicks,
      activityOverTime,
    });
  } catch (error) {
    next(error);
  }
};

