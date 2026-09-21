const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yansy');
  const { AnalyticsEvent, Session } = require('../models/Analytics');

  const oldestEvent = await AnalyticsEvent.findOne().sort({ createdAt: 1 }).select('createdAt').lean();
  const newestEvent = await AnalyticsEvent.findOne().sort({ createdAt: -1 }).select('createdAt').lean();
  console.log('Events range:', oldestEvent?.createdAt, 'to', newestEvent?.createdAt);

  const oldestSession = await Session.findOne().sort({ startTime: 1 }).select('startTime').lean();
  const newestSession = await Session.findOne().sort({ startTime: -1 }).select('startTime').lean();
  console.log('Sessions range:', oldestSession?.startTime, 'to', newestSession?.startTime);

  // Check event types
  const eventTypes = await AnalyticsEvent.aggregate([
    { $group: { _id: '$eventType', count: { $sum: 1 } } }
  ]);
  console.log('Event types:', eventTypes);

  // Check visitor types in Sessions
  const sessionTypes = await Session.aggregate([
    { $group: { _id: { visitorType: '$visitorType', isAdmin: '$isAdmin' }, count: { $sum: 1 } } }
  ]);
  console.log('Session types:', sessionTypes);

  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
