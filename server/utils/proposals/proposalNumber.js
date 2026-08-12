'use strict';

/**
 * Human-readable sequential proposal number, e.g. YT-2026-0001. Sequencing
 * is "count of proposals created this year + 1" (computed by the caller)
 * rather than a dedicated always-incrementing counter collection — the
 * unique index on Proposal.proposalNumber plus a retry-on-collision loop in
 * the controller (same pattern as slug uniqueness) is enough at YANSY's
 * proposal volume and avoids a second collection to keep consistent under
 * concurrent writes.
 */
const buildProposalNumber = (sequence, year = new Date().getFullYear()) =>
  `YT-${year}-${String(sequence).padStart(4, '0')}`;

module.exports = { buildProposalNumber };
