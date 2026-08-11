'use strict';
/**
 * Portfolio migration — Phase 1 (Design Showcase, see PROJECT_REVIEW.md) +
 * Phase 2 (correction + manual ordering, see IMPLEMENTATION_PLAN.md).
 *
 * Supersedes `migrate-add-project-type-fields.js` — same first two steps,
 * renamed to reflect its now-broader scope, plus two new idempotent steps.
 * All four steps are safe to re-run; each one only touches documents that
 * still need it.
 *
 *   1. Seed the ProjectType library (six starter types) if it's empty.
 *   2. Backfill `deliveryStatus: 'live'` on any project missing it.
 *   3. Rename `order` -> `displayOrder`, converting every stored default-`0`
 *      value to the "unranked" sentinel. `order` has never been exposed in
 *      any UI before this diff, so every existing `0` is schema-default
 *      noise, not a deliberate admin ranking — safe to treat uniformly as
 *      "not manually ranked," which is exactly what the sentinel means.
 *      See server/utils/displayOrder.js for why a sentinel is used instead
 *      of `null` (Mongo's native ascending sort puts null/missing FIRST,
 *      not last).
 *   4. Backfill `publishedAt` from `createdAt` on any `published` project
 *      missing it — closes a gap for very old projects published before
 *      that field's assignment logic existed, so the public listing's
 *      "Publish Date DESC" tiebreaker never sorts against `undefined`.
 *
 * Usage: node scripts/migrate-portfolio-phase2.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { UNRANKED_DISPLAY_ORDER } = require('../utils/displayOrder');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yansy';

const STARTER_TYPES = [
  { name: 'Web Project',        nameAr: 'مشروع ويب',        slug: 'web-project',        order: 0, isConceptType: false },
  { name: 'Mobile App',         nameAr: 'تطبيق جوال',        slug: 'mobile-app',         order: 1, isConceptType: false },
  { name: 'Dashboard / SaaS',   nameAr: 'لوحة تحكم / SaaS',  slug: 'dashboard-saas',     order: 2, isConceptType: false },
  { name: 'Landing Page',       nameAr: 'صفحة هبوط',         slug: 'landing-page',       order: 3, isConceptType: false },
  { name: 'Branding / Identity', nameAr: 'هوية بصرية',       slug: 'branding-identity',  order: 4, isConceptType: false },
  { name: 'UI/UX Concept',      nameAr: 'مفهوم تصميم UI/UX', slug: 'ui-ux-concept',      order: 5, isConceptType: true },
];

const run = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('[migrate] Connected to', MONGODB_URI.replace(/\/\/[^@]+@/, '//***@'));

  const projectCol = mongoose.connection.db.collection('portfolioprojects');

  // ── 1. Seed ProjectType library ─────────────────────────────────────────
  const typeCol = mongoose.connection.db.collection('projecttypes');
  const existingTypeCount = await typeCol.countDocuments({});
  if (existingTypeCount > 0) {
    console.log(`[migrate] ProjectType library already has ${existingTypeCount} entr(y/ies) — skipping seed.`);
  } else {
    const now = new Date();
    const docs = STARTER_TYPES.map((t) => ({
      ...t,
      usageCount: 0, lastUsedAt: null, isPinned: false, isActive: true,
      createdAt: now, updatedAt: now,
    }));
    await typeCol.insertMany(docs);
    console.log(`[migrate] Seeded ${docs.length} ProjectType entries.`);
  }

  // ── 2. Backfill deliveryStatus on existing projects ─────────────────────
  const deliveryResult = await projectCol.updateMany(
    { deliveryStatus: { $exists: false } },
    { $set: { deliveryStatus: 'live' } }
  );
  console.log(`[migrate] Backfilled deliveryStatus='live' on ${deliveryResult.modifiedCount} existing project(s).`);

  // ── 3. Rename order -> displayOrder, defaulting to the "unranked" sentinel ──
  // Every stored `order` (0 by schema default, since it was never surfaced
  // in any UI before this diff) becomes UNRANKED_DISPLAY_ORDER, not its old
  // numeric value — see the file header for why. Docs already migrated
  // (no `order` field left) are skipped automatically.
  const orderResult = await projectCol.updateMany(
    { order: { $exists: true } },
    [
      { $set: { displayOrder: UNRANKED_DISPLAY_ORDER } },
      { $unset: 'order' },
    ]
  );
  console.log(`[migrate] Renamed order -> displayOrder (sentinel) on ${orderResult.modifiedCount} project(s).`);

  // Docs created after the schema change already get displayOrder from the
  // Mongoose default at write time, but that default is only applied when a
  // document is hydrated/saved through the model — a raw query filter needs
  // it to actually exist in storage (same reasoning as step 2's backfill).
  const displayOrderBackfill = await projectCol.updateMany(
    { displayOrder: { $exists: false } },
    { $set: { displayOrder: UNRANKED_DISPLAY_ORDER } }
  );
  if (displayOrderBackfill.modifiedCount) {
    console.log(`[migrate] Backfilled displayOrder sentinel on ${displayOrderBackfill.modifiedCount} additional project(s) missing it entirely.`);
  }

  // ── 4. Backfill publishedAt from createdAt on published projects missing it ──
  const publishedAtResult = await projectCol.updateMany(
    { status: 'published', publishedAt: { $exists: false } },
    [{ $set: { publishedAt: '$createdAt' } }]
  );
  console.log(`[migrate] Backfilled publishedAt from createdAt on ${publishedAtResult.modifiedCount} published project(s).`);

  // ── Verification ──────────────────────────────────────────────────────
  const total = await projectCol.countDocuments({});
  const stillMissingDelivery = await projectCol.countDocuments({ deliveryStatus: { $exists: false } });
  const stillMissingDisplayOrder = await projectCol.countDocuments({ displayOrder: { $exists: false } });
  const stillHasOldOrder = await projectCol.countDocuments({ order: { $exists: true } });
  const stillMissingPublishedAt = await projectCol.countDocuments({ status: 'published', publishedAt: { $exists: false } });
  console.log(
    `\n[migrate] Verification: ${total} total project(s) — ` +
    `${stillMissingDelivery} missing deliveryStatus, ` +
    `${stillMissingDisplayOrder} missing displayOrder, ` +
    `${stillHasOldOrder} still holding the legacy 'order' field, ` +
    `${stillMissingPublishedAt} published project(s) missing publishedAt (expect 0 for all four).`
  );

  const ok = stillMissingDelivery === 0 && stillMissingDisplayOrder === 0 && stillHasOldOrder === 0 && stillMissingPublishedAt === 0;
  console.log(ok ? '\n[migrate] Done.' : '\n[migrate] Completed with unresolved gaps — see verification line above.');
  await mongoose.disconnect();
  process.exit(ok ? 0 : 1);
};

run().catch((err) => {
  console.error('[migrate] Fatal error:', err);
  process.exit(1);
});
