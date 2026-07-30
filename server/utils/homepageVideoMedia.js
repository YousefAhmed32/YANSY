'use strict';
const mediaService = require('../media/media.service');
const { VIDEO_ONLY_MIMES, VIDEO_MAX_BYTES, IMAGE_ONLY_MIMES, LOGO_MAX_BYTES } = require('../media/mediaConstants');

const uploadShowcaseVideo = async (fileBuffer, filename, mimeType) => {
  const asset = await mediaService.uploadMedia(fileBuffer, filename, mimeType, {
    allowedMimes: VIDEO_ONLY_MIMES,
    maxSizeBytes: VIDEO_MAX_BYTES,
  });
  return {
    videoUrl:       asset.url,
    videoPublicId:  asset.publicId,
    videoProvider:  asset.provider,
    videoSizeBytes: fileBuffer.length,
  };
};

const deleteShowcaseVideo = async ({ videoPublicId, videoProvider }) => {
  if (!videoPublicId) return;
  await mediaService.deleteMedia(videoPublicId, videoProvider);
};

const uploadShowcasePoster = async (fileBuffer, filename, mimeType) => {
  const asset = await mediaService.uploadMedia(fileBuffer, filename, mimeType, {
    allowedMimes: IMAGE_ONLY_MIMES,
    maxSizeBytes: LOGO_MAX_BYTES,
  });

  return {
    url:           asset.url,
    publicId:      asset.publicId,
    provider:      asset.provider,
    width:         asset.width,
    height:        asset.height,
    dominantColor: undefined, // was Cloudinary-derived; not available for GridFS uploads
    blurDataURL:   null,      // was Cloudinary-derived; not available for GridFS uploads
  };
};

const deleteShowcasePoster = async (poster) => {
  if (!poster?.publicId) return;
  await mediaService.deleteMedia(poster.publicId, poster.provider);
};

module.exports = { uploadShowcaseVideo, deleteShowcaseVideo, uploadShowcasePoster, deleteShowcasePoster };
