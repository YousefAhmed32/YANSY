'use strict';

/**
 * Fields that make up a "version" of a proposal — everything that defines
 * the offer the client sees, but not operational metadata (view tracking,
 * timestamps, createdBy) which would make every version look "changed" for
 * no content reason.
 */
// 'type'/'htmlAsset' cover IMPORTED_HTML proposals — dormant/empty on
// DYNAMIC ones, so including them here is a no-op for the existing flow.
const VERSIONED_FIELDS = ['project', 'sections', 'pricing', 'timeline', 'terms', 'branding', 'status', 'type', 'htmlAsset'];

const snapshotOf = (proposalDoc) => {
  const obj = proposalDoc.toObject ? proposalDoc.toObject() : proposalDoc;
  const snapshot = {};
  VERSIONED_FIELDS.forEach((f) => { snapshot[f] = obj[f]; });
  return snapshot;
};

module.exports = { VERSIONED_FIELDS, snapshotOf };
