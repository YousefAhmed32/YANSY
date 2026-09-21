const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });
const { getDashboard } = require('../controllers/analyticsController');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yansy');
  console.log('MongoDB connected.');

  const req = { query: { range: '30d', visitorFilter: 'all' } };
  const res = {
    json: (d) => {
      console.log('--- getDashboard Response Summary ---');
      console.log('Active Now:', d.activeNow);
      console.log('Today:', d.today);
      console.log('Period:', d.period);
      console.log('New vs Returning:', d.newVsReturning);
      console.log('CTA metrics:', d.cta);
      console.log('Top Pages Count:', d.topPages?.length);
      console.log('Activity Feed Count:', d.activityFeed?.length);
      if (d.activityFeed?.length > 0) {
        console.log('Sample Activity Item:', d.activityFeed[0]);
      }
    }
  };

  await getDashboard(req, res, console.error);
  await mongoose.disconnect();
}

test().catch(console.error);
