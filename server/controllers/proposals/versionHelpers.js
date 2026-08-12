'use strict';
const ProposalVersion = require('../../models/proposals/ProposalVersion');
const { snapshotOf } = require('../../utils/proposals/versioning');

/**
 * Snapshots a proposal's *current, pre-edit* in-memory state into a new
 * ProposalVersion, then advances `proposal.currentVersion` in memory —
 * caller is responsible for `proposal.save()` afterwards so this never
 * causes an extra write of its own. Shared by proposalController.js
 * (content edits, publish, restore) and htmlImportController.js (HTML
 * replace) — one version history mechanism for both proposal types.
 */
const snapshotVersion = async (proposal, { changeSummary, userId } = {}) => {
  const latest = await ProposalVersion.findOne({ proposal: proposal._id }).sort({ versionNumber: -1 }).select('versionNumber');
  const versionNumber = (latest?.versionNumber || 0) + 1;
  await ProposalVersion.create({
    proposal: proposal._id,
    versionNumber,
    snapshot: snapshotOf(proposal),
    changeSummary: changeSummary || null,
    createdBy: userId,
  });
  proposal.currentVersion = versionNumber;
  return versionNumber;
};

module.exports = { snapshotVersion };
