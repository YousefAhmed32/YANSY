const mongoose = require('mongoose');
require('dotenv').config();

async function runCleanup() {
  console.log('--- Starting Analytics Database Cleanup & Normalization ---');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yansy');
  const { AnalyticsEvent, Session } = require('../models/Analytics');

  // 1. Count and delete /api/* polluted events
  const apiEventsCount = await AnalyticsEvent.countDocuments({ page: { $regex: '^/api' } });
  console.log(`Found ${apiEventsCount} internal API events logged as page views.`);

  if (apiEventsCount > 0) {
    const delRes = await AnalyticsEvent.deleteMany({ page: { $regex: '^/api' } });
    console.log(`Successfully purged ${delRes.deletedCount} polluted /api/* events.`);
  }

  // 2. Identify and fix sessions
  const sessions = await Session.find().lean();
  console.log(`Processing ${sessions.length} sessions...`);

  let updatedCount = 0;
  for (const s of sessions) {
    const isLocal = !s.ip || s.ip === '::1' || s.ip === '127.0.0.1' || s.ip === 'localhost';
    const isAdmin = isLocal || s.isAdmin === true || s.visitorType === 'admin';
    const visitorType = isAdmin ? 'admin' : (s.visitorType || 'client');

    // Get real events for this session
    const events = await AnalyticsEvent.find({ sessionId: s.sessionId }).sort({ createdAt: 1 }).lean();
    const realPageViews = events.filter(e => e.eventType === 'page_view');
    const hasConversion = events.some(e => ['whatsapp_click', 'contact_form', 'booking_request', 'cta_click', 'lead'].includes(e.eventType));

    let duration = s.duration;
    if (!duration || duration > 4 * 60 * 60 * 1000) {
      if (events.length > 1) {
        const first = new Date(events[0].createdAt).getTime();
        const last = new Date(events[events.length - 1].createdAt).getTime();
        duration = Math.min(2 * 60 * 60 * 1000, Math.max(10 * 1000, last - first));
      } else {
        duration = 25 * 1000; // 25 seconds realistic single-view duration
      }
    }

    let intentLevel = s.intentLevel || 'low';
    if (hasConversion) {
      intentLevel = 'high';
    } else if (realPageViews.length >= 3 || duration > 90 * 1000) {
      intentLevel = 'medium';
    }

    const cleanPages = (s.pages || []).filter(p => p.page && !p.page.startsWith('/api'));

    await Session.updateOne(
      { _id: s._id },
      {
        $set: {
          isAdmin,
          visitorType,
          duration,
          pageViewsCount: realPageViews.length,
          eventsCount: events.length,
          hasConversion,
          intentLevel,
          pages: cleanPages,
        }
      }
    );
    updatedCount++;
  }

  console.log(`Finished normalizing ${updatedCount} sessions.`);
  
  // Verify final numbers
  const finalEvents = await AnalyticsEvent.countDocuments();
  const finalSessions = await Session.countDocuments();
  const clientSessions = await Session.countDocuments({ isAdmin: false, visitorType: 'client' });
  const adminSessions = await Session.countDocuments({ $or: [{ isAdmin: true }, { visitorType: 'admin' }] });

  console.log('Final database stats:', {
    finalEvents,
    finalSessions,
    clientSessions,
    adminSessions
  });

  process.exit(0);
}

runCleanup().catch(e => {
  console.error('Cleanup failed:', e);
  process.exit(1);
});
