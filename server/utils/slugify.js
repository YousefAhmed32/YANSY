'use strict';

/**
 * Shared string-to-slug transform. Previously duplicated verbatim across
 * portfolio.routes.js, clientLogos.routes.js, and scripts/migratePortfolioV2.js
 * — three independent copies that could silently drift (e.g. one handling a
 * Unicode edge case the others don't), producing inconsistent slug behavior
 * between features. `ensureUniqueSlug` (the uniqueness-suffix loop) stays
 * per-call-site since it's parameterized by a different Mongoose model each
 * time, but the actual string transform is identical everywhere and belongs
 * in one place.
 */
const slugify = (str) =>
  (str || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

module.exports = { slugify };
