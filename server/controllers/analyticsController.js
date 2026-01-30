const { AnalyticsEvent, Session } = require('../models/Analytics');

// Track event
exports.trackEvent = async (req, res, next) => {
  try {
    const {
      eventType,
      page,
      section,
      scrollDepth,
      viewTime,
      elementId,
      elementType,
      metadata
    } = req.body;

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
      ip: req.ip || req.connection.remoteAddress,
      referrer: req.headers.referer
    });

    res.status(201).json({ event });
  } catch (error) {
    next(error);
  }
};

// Get analytics dashboard data
exports.getDashboard = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};

    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Total sessions
    const totalSessions = await Session.countDocuments(dateFilter);

    // Active sessions (last 24 hours)
    const activeSessions = await Session.countDocuments({
      ...dateFilter,
      isActive: true,
      startTime: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    // Average session duration
    const sessions = await Session.find({
      ...dateFilter,
      duration: { $exists: true }
    });
    const avgDuration = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length
      : 0;

    // Page views
    const pageViews = await AnalyticsEvent.countDocuments({
      ...dateFilter,
      eventType: 'page_view'
    });

    // Most viewed pages
    const topPages = await AnalyticsEvent.aggregate([
      { $match: { ...dateFilter, eventType: 'page_view' } },
      { $group: { _id: '$page', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Most viewed sections
    const topSections = await AnalyticsEvent.aggregate([
      { $match: { ...dateFilter, eventType: 'section_view', section: { $exists: true } } },
      { $group: { _id: '$section', count: { $sum: 1 }, avgViewTime: { $avg: '$viewTime' } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Scroll depth distribution
    const scrollData = await AnalyticsEvent.aggregate([
      { $match: { ...dateFilter, eventType: 'scroll', scrollDepth: { $exists: true } } },
      {
        $group: {
          _id: null,
          avgScrollDepth: { $avg: '$scrollDepth' },
          maxScrollDepth: { $max: '$scrollDepth' }
        }
      }
    ]);

    // Click events
    const clickEvents = await AnalyticsEvent.countDocuments({
      ...dateFilter,
      eventType: 'click'
    });

    // Top clicked elements
    const topClicks = await AnalyticsEvent.aggregate([
      { $match: { ...dateFilter, eventType: 'click', elementId: { $exists: true } } },
      { $group: { _id: '$elementId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // User activity over time (last 30 days)
    const activityOverTime = await AnalyticsEvent.aggregate([
      {
        $match: {
          ...dateFilter,
          createdAt: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          events: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      overview: {
        totalSessions,
        activeSessions,
        avgDuration: Math.round(avgDuration / 1000), // Convert to seconds
        pageViews,
        clickEvents
      },
      topPages,
      topSections,
      scrollData: scrollData[0] || { avgScrollDepth: 0, maxScrollDepth: 0 },
      topClicks,
      activityOverTime
    });
  } catch (error) {
    next(error);
  }
};

// End session
exports.endSession = async (req, res, next) => {
  try {
    const sessionId = req.sessionId || req.body.sessionId;
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

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

