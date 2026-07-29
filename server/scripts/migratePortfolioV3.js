'use strict';
/**
 * Migrates PortfolioProject documents from schema v2 to v3 (rich case-study
 * fields: tagline, client, team, blocks, performance metrics, etc. — see
 * models/PortfolioProject.js).
 *
 * Nearly every v3 field is new and optional, so old documents are already
 * schema-valid without a migration — this script exists purely to backfill
 * two things that would otherwise leave real (already-published) projects
 * looking unfinished under the v3 UI rather than to fix broken data:
 *
 *   1. `tagline` — derived from `description` (truncated to a clean word
 *      boundary) wherever a project doesn't already have one, so the new
 *      hero's tagline slot doesn't render blank for every pre-v3 project.
 *   2. `kind: 'image'` on embedded media assets (coverImage / gallery /
 *      testimonial.avatar) that predate the field — Mongoose already applies
 *      this as a read-time default, but persisting it explicitly keeps the
 *      stored documents self-describing for anything that reads the
 *      collection directly (migration/report scripts, aggregations).
 *
 * Safe to re-run: a doc is skipped once it already has a non-empty `tagline`
 * AND every existing media asset already has `kind` set.
 * Non-destructive: no field is ever removed or overwritten with a guess —
 * only empty/missing values are filled in.
 *
 * Usage: node scripts/migratePortfolioV3.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yansy';

// Truncate to ~length chars without cutting a word in half, then drop any
// trailing punctuation before adding the ellipsis so it doesn't read "...,…".
const truncateToTagline = (text, length = 90) => {
  if (!text) return null;
  const clean = text.trim().replace(/\s+/g, ' ');
  if (clean.length <= length) return clean;
  const cut = clean.slice(0, length);
  const lastSpace = cut.lastIndexOf(' ');
  const trimmed = (lastSpace > length * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\-–—\s]+$/, '');
  return `${trimmed}…`;
};

const withKind = (asset) => {
  if (!asset || typeof asset !== 'object') return { changed: false, asset };
  if (asset.kind) return { changed: false, asset };
  return { changed: true, asset: { ...asset, kind: 'image' } };
};

const run = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('[migrate] Connected to', MONGODB_URI.replace(/\/\/[^@]+@/, '//***@'));

  const col = mongoose.connection.db.collection('portfolioprojects');
  const docs = await col.find({}).toArray();
  console.log(`[migrate] Found ${docs.length} portfolio project(s).`);

  let migrated = 0, skipped = 0, failed = 0;

  for (const doc of docs) {
    try {
      const set = {};
      let touched = false;

      if (!doc.tagline) {
        const tagline = truncateToTagline(doc.description);
        if (tagline) { set.tagline = tagline; touched = true; }
      }
      if (!doc.taglineAr) {
        const taglineAr = truncateToTagline(doc.descriptionAr);
        if (taglineAr) { set.taglineAr = taglineAr; touched = true; }
      }

      const cover = withKind(doc.coverImage);
      if (cover.changed) { set.coverImage = cover.asset; touched = true; }

      if (Array.isArray(doc.gallery) && doc.gallery.length) {
        const results = doc.gallery.map(withKind);
        if (results.some((r) => r.changed)) { set.gallery = results.map((r) => r.asset); touched = true; }
      }

      if (doc.testimonial?.avatar) {
        const avatar = withKind(doc.testimonial.avatar);
        if (avatar.changed) { set['testimonial.avatar'] = avatar.asset; touched = true; }
      }

      if (!touched) { skipped += 1; continue; }

      await col.updateOne({ _id: doc._id }, { $set: set });
      migrated += 1;
      console.log(`  ✓ migrated "${doc.title || doc._id}" (${Object.keys(set).join(', ')})`);
    } catch (err) {
      failed += 1;
      console.error(`  ✗ failed "${doc.title || doc._id}": ${err.message}`);
    }
  }

  console.log(`\n[migrate] Done. migrated=${migrated} skipped=${skipped} failed=${failed}`);
  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error('[migrate] Fatal error:', err);
  process.exit(1);
});
