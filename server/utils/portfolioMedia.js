'use strict';
const axios = require('axios');
const { uploadToCloud, deleteFromCloud } = require('./cloudStorage');

/**
 * Insert a Cloudinary transformation string into a delivery URL, right after `/upload/`.
 * No-op for non-Cloudinary URLs (e.g. the local dev fallback), which have no transform pipeline.
 */
const withTransform = (url, transform) => {
  const marker = '/upload/';
  const idx = url?.indexOf(marker);
  if (!url || idx === -1) return url;
  return `${url.slice(0, idx + marker.length)}${transform}/${url.slice(idx + marker.length)}`;
};

/**
 * Build a responsive delivery URL (auto format/quality, capped width) for a stored media asset.
 * Used by the API to hand the client a ready-to-use `srcset` source per breakpoint.
 *
 * Only Cloudinary assets can actually be resized this way — for any other provider there is no
 * transform pipeline, so this returns null rather than echoing back `asset.url`. The decorator
 * that calls this (`withResponsiveMedia`) would otherwise duplicate the raw url into srcSm/srcMd/srcLg,
 * quadrupling the payload for every non-Cloudinary asset (catastrophic for inline data: URIs).
 */
const buildResponsiveUrl = (asset, { width, quality = 'auto', format = 'auto' } = {}) => {
  if (!asset?.url || asset.provider !== 'cloudinary') return null;
  const parts = [`f_${format}`, `q_${quality}`, 'c_limit'];
  if (width) parts.push(`w_${width}`);
  return withTransform(asset.url, parts.join(','));
};

/**
 * Download a tiny, heavily-blurred rendition of a Cloudinary image and inline it as a base64
 * data URI — used as the blur-up placeholder while the real image lazy-loads.
 */
const generateBlurDataURL = async (url, provider) => {
  if (provider !== 'cloudinary') return null;
  try {
    const tinyUrl = withTransform(url, 'f_jpg,q_1,w_16,e_blur:2000');
    const res = await axios.get(tinyUrl, { responseType: 'arraybuffer', timeout: 8000 });
    return `data:image/jpeg;base64,${Buffer.from(res.data).toString('base64')}`;
  } catch (err) {
    console.warn('[portfolioMedia] blur placeholder generation failed:', err.message);
    return null;
  }
};

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
 *
 * The blur-up placeholder only makes sense for images (it's a blurred still
 * frame), so it's skipped for video/audio — `generateBlurDataURL` already
 * no-ops for non-Cloudinary assets, but here it's skipped before the network
 * round-trip even happens rather than after.
 */
const uploadPortfolioMedia = async (fileBuffer, filename, mimeType) => {
  const kind = KIND_FOR_MIME(mimeType);
  const uploaded = await uploadToCloud(fileBuffer, filename, mimeType, {
    folder: 'yansy/portfolio',
    tags:   ['yansy-portfolio'],
  });

  const blurDataURL = kind === 'image' ? await generateBlurDataURL(uploaded.url, uploaded.provider) : null;

  return {
    url:           uploaded.url,
    publicId:      uploaded.cloudId,
    provider:      uploaded.provider,
    kind,
    width:         uploaded.width,
    height:        uploaded.height,
    duration:      uploaded.duration,
    dominantColor: uploaded.dominantColor,
    blurDataURL,
    alt: '', altAr: '',
    caption: '', captionAr: '',
  };
};

// Kept as an alias — every existing call site (routes, migration scripts)
// only ever uploaded images before v3 introduced video/audio support.
const uploadPortfolioImage = uploadPortfolioMedia;

const deletePortfolioImage = async (asset) => {
  if (!asset?.publicId) return;
  await deleteFromCloud(asset.publicId, asset.provider);
};

module.exports = {
  buildResponsiveUrl,
  generateBlurDataURL,
  uploadPortfolioMedia,
  uploadPortfolioImage,
  deletePortfolioImage,
};
