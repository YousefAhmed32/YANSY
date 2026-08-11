'use strict';
/**
 * Manual portfolio ordering — shared sentinel + coercion helpers.
 *
 * `PortfolioProject.displayOrder` needs "empty sorts last" semantics on the
 * public listing. MongoDB's native ascending sort puts null/missing fields
 * BEFORE real numbers, which is the opposite of what "leave it empty to
 * sort last" requires — and fixing that with an aggregation pipeline would
 * mean rebuilding the public listing's cursor pagination (deliberately kept
 * flat/index-friendly to scale — see PROJECT_REVIEW.md §10) as a phased or
 * computed-field query.
 *
 * Instead: every project always stores a real integer. Projects nobody has
 * manually ranked store a large sentinel value that sorts after any
 * realistic manual rank, so a single flat `find().sort({ displayOrder: 1 })`
 * already does the right thing with no aggregation and full index support.
 *
 * The sentinel is an internal storage detail — it must never reach an admin
 * screen as a raw number. Every read path that puts this field in front of
 * a human runs it through `serializeDisplayOrder` first (blank input, not
 * "1000000"); every write path runs untrusted input through
 * `normalizeDisplayOrderInput` first (blank/null -> sentinel, integer ->
 * itself, anything else -> a 400).
 */

// Larger than any realistic manual rank (the brief's own examples top out
// at 100) but small enough to stay readable in a DB browser, unlike
// Number.MAX_SAFE_INTEGER.
const UNRANKED_DISPLAY_ORDER = 1_000_000;

const normalizeDisplayOrderInput = (raw) => {
  if (raw === null || raw === undefined || raw === '') return UNRANKED_DISPLAY_ORDER;
  const n = Number(raw);
  if (!Number.isInteger(n)) {
    const err = new Error('displayOrder must be an integer');
    err.status = 400;
    throw err;
  }
  return n;
};

const serializeDisplayOrder = (v) => (v === UNRANKED_DISPLAY_ORDER || v === undefined ? null : v);

module.exports = { UNRANKED_DISPLAY_ORDER, normalizeDisplayOrderInput, serializeDisplayOrder };
