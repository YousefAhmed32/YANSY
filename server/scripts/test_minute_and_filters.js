const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });
const { getVisitors, getHourly, getSessions } = require('../controllers/analyticsController');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yansy');
  console.log('Connected to MongoDB.');

  // Test 1: 60m range
  console.log('\n--- 1. Testing range=60m with visitorFilter=clients_only ---');
  let mockReq = { query: { range: '60m', visitorFilter: 'clients_only' } };
  let mockRes = { json: (d) => console.log('60m response:', { isMinute: d.isMinute, periodLabel: d.periodLabel, visitors: d.visitorsInPeriod, pageViews: d.totalPageViews }) };
  await getVisitors(mockReq, mockRes);

  // Test 2: Hourly distribution for 60m
  console.log('\n--- 2. Testing getHourly for range=60m ---');
  mockRes = { json: (d) => console.log('Hourly 60m intervals count:', d.hours?.length, 'sample interval:', d.hours?.[0]) };
  await getHourly(mockReq, mockRes);

  // Test 3: Custom range with minute precision (e.g. 90 minutes span)
  console.log('\n--- 3. Testing custom 90-minute range ---');
  const end = new Date();
  const start = new Date(end.getTime() - 90 * 60 * 1000);
  mockReq = { query: { range: 'custom', startDate: start.toISOString(), endDate: end.toISOString(), visitorFilter: 'clients_only' } };
  mockRes = { json: (d) => console.log('Custom 90m response:', { isMinute: d.isMinute, periodLabel: d.periodLabel, visitors: d.visitorsInPeriod, pageViews: d.totalPageViews }) };
  await getVisitors(mockReq, mockRes);

  // Test 4: Active only sessions
  console.log('\n--- 4. Testing getSessions with activeOnly=true ---');
  mockReq = { query: { activeOnly: 'true', visitorFilter: 'all' } };
  mockRes = { json: (d) => console.log('Active sessions count:', d.total, 'returned:', d.sessions?.length) };
  await getSessions(mockReq, mockRes);

  await mongoose.disconnect();
  console.log('\nDone successfully!');
}

run().catch(console.error);
