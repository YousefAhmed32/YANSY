'use strict';
/**
 * Portfolio migration — Quick Showcase (schema v3.3, see the doc comment on
 * `presentationMode` in server/models/PortfolioProject.js).
 *
 * Backfills `presentationMode: 'caseStudy'` on every project missing it.
 * The schema default already covers brand-new documents; this explicit
 * backfill matters for the SAME reason the Phase 1 `deliveryStatus`
 * backfill did — filtering/sorting/aggregating on a field ($group, $match)
 * needs a real stored value, not just a schema default that only applies
 * when Mongoose constructs a NEW document. Every project that existed
 * before this field shipped is, by definition, a full case study — this
 * migration changes zero visible behavior for any existing project.
 *
 * Idempotent — only touches documents where the field is missing, safe to
 * re-run any number of times.
 *
 * Usage: node scripts/migrate-add-presentation-mode.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yansy';

const run = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('[migrate] Connected to', MONGODB_URI.replace(/\/\/[^@]+@/, '//***@'));

  const projectCol = mongoose.connection.db.collection('portfolioprojects');

  const missing = await projectCol.countDocuments({ presentationMode: { $exists: false } });
  if (missing === 0) {
    console.log('[migrate] Every project already has presentationMode set — nothing to do.');
  } else {
    const result = await projectCol.updateMany(
      { presentationMode: { $exists: false } },
      { $set: { presentationMode: 'caseStudy' } }
    );
    console.log(`[migrate] Backfilled presentationMode: 'caseStudy' on ${result.modifiedCount} project(s).`);
  }

  await mongoose.disconnect();
  console.log('[migrate] Done.');
};

run().catch((err) => {
  console.error('[migrate] Failed:', err);
  process.exit(1);
});
