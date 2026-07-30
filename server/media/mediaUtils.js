'use strict';
const { imageSize } = require('image-size');

const KIND_FOR_MIME = (mimeType) => {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'image';
};

// Reads only the image header (no full decode/pixel processing — no sharp needed).
// Returns {} for non-images or any buffer image-size can't parse (corrupt/unsupported).
const getImageDimensions = (buffer, mimeType) => {
  if (!mimeType.startsWith('image/')) return {};
  try {
    const { width, height } = imageSize(buffer);
    return { width, height };
  } catch {
    return {};
  }
};

module.exports = { KIND_FOR_MIME, getImageDimensions };
