'use strict';
const mongoose = require('mongoose');

/**
 * Immutable snapshot of a Proposal taken on every publish and every
 * meaningful edit to an already-published proposal (see
 * proposalController.js `snapshotVersion`). Editing a live proposal never
 * mutates history — it creates a new version and advances
 * `Proposal.currentVersion`; `restoreVersion` copies a snapshot's fields
 * back onto the live document (itself preceded by its own snapshot, so
 * restoring is also non-destructive).
 */
const proposalVersionSchema = new mongoose.Schema(
  {
    proposal:      { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', required: true, index: true },
    versionNumber: { type: Number, required: true },
    // Full plain-object snapshot of the proposal's editable fields at save
    // time (project/sections/pricing/timeline/terms/branding/status) —
    // intentionally Mixed rather than re-declaring the whole schema here,
    // since a version's job is "what did this look like", not "validate
    // against today's schema".
    snapshot:      { type: mongoose.Schema.Types.Mixed, required: true },
    changeSummary: { type: String, trim: true },
    createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

proposalVersionSchema.index({ proposal: 1, versionNumber: -1 });

module.exports = mongoose.model('ProposalVersion', proposalVersionSchema);
