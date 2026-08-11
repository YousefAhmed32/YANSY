'use strict';
const repo = require('./gridfsRepository');
const { sanitizeFilename, sha256Hex, assertSize, assertMagicBytes } = require('./mediaValidators');
const { KIND_FOR_MIME, getImageDimensions } = require('./mediaUtils');
const { GENERIC_FILE_MIMES, GENERIC_FILE_MAX_BYTES } = require('./mediaConstants');
const { sanitizeSvg } = require('./svgSanitizer');

const urlFor = (fileId) => `/api/media/${fileId}`;

const toAsset = (fileId, mimeType, buffer) => ({
  url:      urlFor(fileId),
  publicId: String(fileId),
  provider: 'gridfs',
  kind:     KIND_FOR_MIME(mimeType),
  ...getImageDimensions(buffer, mimeType),
});

/**
 * Validate, dedupe, and store one file in GridFS. This is the single upload path
 * every feature wrapper (portfolio/logo/homepage-video/intro/generic-file/support-chat)
 * goes through — no feature implements its own upload logic.
 */
const uploadMedia = async (
  buffer,
  filename,
  mimeType,
  { allowedMimes = GENERIC_FILE_MIMES, maxSizeBytes = GENERIC_FILE_MAX_BYTES } = {}
) => {
  assertSize(buffer, maxSizeBytes);
  await assertMagicBytes(buffer, mimeType, allowedMimes);

  // SVG is XML, not a fixed binary format — strip <script>/on*/javascript:
  // constructs before this buffer is hashed or stored, since it's later
  // served back from a public, unauthenticated route as image/svg+xml (see
  // svgSanitizer.js for why that matters). Everything downstream (hash,
  // dedupe, storage, dimensions) operates on the sanitized bytes.
  const safeBuffer = mimeType === 'image/svg+xml' ? sanitizeSvg(buffer) : buffer;

  const hash = sha256Hex(safeBuffer);
  const existing = await repo.findFileBySha256(hash);
  if (existing) {
    return toAsset(existing._id, mimeType, safeBuffer);
  }

  const safeFilename = sanitizeFilename(filename);
  const fileId = await repo.uploadBuffer(safeBuffer, safeFilename, {
    contentType: mimeType,
    metadata: { sha256: hash, originalName: filename },
  });

  return toAsset(fileId, mimeType, safeBuffer);
};

/**
 * Best-effort delete. Only acts on GridFS-provider assets — this module has no
 * Cloudinary/local-disk code path by design. Deleting a pre-migration asset still
 * tagged provider 'cloudinary'/'local' is a no-op (logged): those blobs are cleaned
 * up by running scripts/migrateToGridFS.js, not by runtime delete calls.
 */
const deleteMedia = async (publicId, provider) => {
  if (!publicId) return;
  if (provider && provider !== 'gridfs') {
    console.warn(`[media.service] Skipping delete of non-GridFS asset (provider=${provider}, id=${publicId}) — run the GridFS migration script.`);
    return;
  }
  await repo.deleteFile(publicId);
};

/**
 * Upload-new -> caller-saves-document -> delete-old, in that order, so a mid-failure
 * never leaves a document pointing at a deleted file. This function only does the
 * "upload new, and clean it back up if the caller's save fails" half; the caller is
 * responsible for calling deleteMedia(oldAsset...) only AFTER its own save succeeds
 * (see media/README pattern below, or the two try/catch blocks in gridfsRepository
 * callers) — kept as two explicit steps rather than one call so the document write
 * in between is never hidden inside this service.
 */
const replaceMedia = async (buffer, filename, mimeType, options) => {
  const newAsset = await uploadMedia(buffer, filename, mimeType, options);
  return {
    asset: newAsset,
    // Call after the caller's own document save succeeds.
    commit: async (oldAsset) => {
      if (oldAsset?.publicId) await deleteMedia(oldAsset.publicId, oldAsset.provider);
    },
    // Call if the caller's document save fails, to avoid an orphaned upload.
    rollback: async () => {
      await deleteMedia(newAsset.publicId, 'gridfs');
    },
  };
};

module.exports = { uploadMedia, deleteMedia, replaceMedia };
