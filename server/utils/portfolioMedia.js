'use strict';
const mediaService = require('../media/media.service');
const { PORTFOLIO_MIMES, PORTFOLIO_MAX_BYTES } = require('../media/mediaConstants');

/**
 * GridFS has no on-the-fly transform pipeline (that was a Cloudinary-only
 * feature), so responsive srcset variants are no longer generated. Kept as a
 * no-op function (rather than removed) so `withResponsiveMedia` in
 * portfolio.routes.js — which already treats a null return as "no responsive
 * variant available", the same as it always has for the 'local' fallback
 * provider — needs no changes.
 */
const buildResponsiveUrl = () => null;

/**
 * Blur-up placeholders required fetching a Cloudinary `e_blur` transform —
 * no equivalent exists without real pixel decoding (sharp/jimp), which this
 * codebase deliberately avoids adding. New uploads get no blur placeholder;
 * already-generated ones on existing documents are self-contained base64
 * data: URIs and keep rendering regardless.
 */
const generateBlurDataURL = async () => null;

const KIND_FOR_MIME = (mimeType) => {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'image';
};

/**
 * Upload one media file (image, video, or audio) and return a fully-formed
 * asset ready to store on any mediaAssetSchema field — cover, gallery,
 * testimonial.avatar/audio, proofScreenshots, team[].avatar, or a block's
 * asset/images/before/after/poster.
 */
const uploadPortfolioMedia = async (fileBuffer, filename, mimeType) => {
  const asset = await mediaService.uploadMedia(fileBuffer, filename, mimeType, {
    allowedMimes: PORTFOLIO_MIMES,
    maxSizeBytes: PORTFOLIO_MAX_BYTES,
  });

  return {
    url:           asset.url,
    publicId:      asset.publicId,
    provider:      asset.provider,
    kind:          asset.kind || KIND_FOR_MIME(mimeType),
    width:         asset.width,
    height:        asset.height,
    duration:      undefined,   // was Cloudinary-derived; not available for GridFS uploads
    dominantColor: undefined,   // was Cloudinary-derived; not available for GridFS uploads
    blurDataURL:   null,
    alt: '', altAr: '',
    caption: '', captionAr: '',
  };
};

// Kept as an alias — every existing call site (routes, migration scripts)
// only ever uploaded images before v3 introduced video/audio support.
const uploadPortfolioImage = uploadPortfolioMedia;

const deletePortfolioImage = async (asset) => {
  if (!asset?.publicId) return;
  await mediaService.deleteMedia(asset.publicId, asset.provider);
};

module.exports = {
  buildResponsiveUrl,
  generateBlurDataURL,
  uploadPortfolioMedia,
  uploadPortfolioImage,
  deletePortfolioImage,
};
