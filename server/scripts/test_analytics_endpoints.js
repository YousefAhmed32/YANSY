const mongoose = require('mongoose');
require('dotenv').config();

async function testEndpoints() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yansy');
  const controller = require('../controllers/analyticsController');

  const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.data = data; return res; };
    return res;
  };

  console.log('Testing /analytics/visitors with 30d...');
  const res1 = mockRes();
  await controller.getVisitors({ query: { range: '30d', visitorFilter: 'all' } }, res1, (err) => console.error(err));
  console.log('30d results:', {
    uniqueSessions: res1.data?.uniqueSessions,
    totalPageViews: res1.data?.totalPageViews,
    avgDuration: res1.data?.avgSessionDuration,
    bounceRate: res1.data?.bounceRate,
    conversions: res1.data?.conversionsCount,
    timelinePoints: res1.data?.timeline?.length
  });

  console.log('Testing /analytics/visitors with custom date & time (with minute resolution)...');
  const res2 = mockRes();
  await controller.getVisitors({
    query: {
      range: 'custom',
      startDate: '2026-09-01T10:00',
      endDate: '2026-09-05T18:30',
      visitorFilter: 'all'
    }
  }, res2, (err) => console.error(err));
  console.log('Custom datetime results:', {
    uniqueSessions: res2.data?.uniqueSessions,
    totalPageViews: res2.data?.totalPageViews,
    isHourly: res2.data?.isHourly,
    isMinute: res2.data?.isMinute,
    periodLabel: res2.data?.periodLabel
  });

  console.log('Testing /analytics/sessions...');
  const res3 = mockRes();
  await controller.getSessions({ query: { range: '30d', visitorFilter: 'all', page: 1, limit: 5 } }, res3, (err) => console.error(err));
  console.log('Sessions results:', {
    total: res3.data?.total,
    returned: res3.data?.sessions?.length,
    firstSession: res3.data?.sessions?.[0] ? {
      sessionId: res3.data.sessions[0].sessionId,
      durationSec: res3.data.sessions[0].durationSec,
      viewsCount: res3.data.sessions[0].viewsCount,
      isLive: res3.data.sessions[0].isLive,
      visitorType: res3.data.sessions[0].visitorType,
      isAdmin: res3.data.sessions[0].isAdmin,
    } : null
  });

  process.exit(0);
}

testEndpoints().catch(e => { console.error('Test error:', e); process.exit(1); });
