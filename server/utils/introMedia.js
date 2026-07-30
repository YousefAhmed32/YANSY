'use strict';
const mediaService = require('../media/media.service');
const { VIDEO_ONLY_MIMES, VIDEO_MAX_BYTES } = require('../media/mediaConstants');

const uploadIntroVideo = async (fileBuffer, filename, mimeType) => {
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

const deleteIntroVideo = async ({ videoPublicId, videoProvider }) => {
  if (!videoPublicId || videoProvider === 'static') return;
  await mediaService.deleteMedia(videoPublicId, videoProvider);
};

module.exports = { uploadIntroVideo, deleteIntroVideo };
