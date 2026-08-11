'use strict';
const Media = require('../models/Media');
const { deletePortfolioImage } = require('../utils/portfolioMedia');

/**
 * Keeps Media.usedIn/usageCount in sync for reusable-content-library models
 * (Client.logo, TeamMember.avatar, Testimonial.avatar/audio, ...) whose
 * embedded mediaAssetSchema field carries an `asset` back-reference into the
 * Media catalog (i.e. it was picked/uploaded via POST /api/media-library/upload).
 * Called from libraryRouter.factory.js on create/update/delete — see its
 * `assetFields` option.
 *
 * The catalog's dedup-by-sha256 means the same logo file can legitimately be
 * referenced by more than one library entry, so a naive "delete the old
 * asset on replace" would silently break every other entry pointing at that
 * same blob. Reference-counting here instead: attach on adopt, detach on
 * replace/remove/delete, and only delete the catalog entry (+ its GridFS
 * blob) once nothing references it anymore — replacing or removing a logo
 * never leaves an orphaned file behind, and never breaks a shared one.
 *
 * Both functions are best-effort bookkeeping: a failure here must never fail
 * the library item's own create/update/delete, so errors are logged and
 * swallowed rather than thrown — matching the codebase's existing pattern
 * for non-critical side effects (see PortfolioWizard's deleteMedia, or
 * RelationPicker's togglePin).
 */

const attachUsage = async (assetId, { model, id, field }) => {
  if (!assetId) return;
  try {
    const item = await Media.findByIdAndUpdate(
      assetId,
      { $addToSet: { usedIn: { model, id, field } }, $set: { lastUsedAt: new Date() } },
      { new: true }
    );
    if (item && item.usageCount !== item.usedIn.length) {
      item.usageCount = item.usedIn.length;
      await item.save();
    }
  } catch (err) {
    console.error(`[mediaCatalog] attachUsage failed for asset ${assetId} (${model}.${field}):`, err.message);
  }
};

const detachUsage = async (assetId, { model, id, field }) => {
  if (!assetId) return;
  try {
    const item = await Media.findByIdAndUpdate(
      assetId,
      { $pull: { usedIn: { model, id, field } } },
      { new: true }
    );
    if (!item) return;

    if (item.usedIn.length === 0) {
      await deletePortfolioImage({ publicId: item.publicId, provider: 'gridfs' });
      await item.deleteOne();
    } else if (item.usageCount !== item.usedIn.length) {
      item.usageCount = item.usedIn.length;
      await item.save();
    }
  } catch (err) {
    console.error(`[mediaCatalog] detachUsage failed for asset ${assetId} (${model}.${field}):`, err.message);
  }
};

module.exports = { attachUsage, detachUsage };
