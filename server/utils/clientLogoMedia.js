'use strict';
const mediaService = require('../media/media.service');
const { IMAGE_ONLY_MIMES, LOGO_MAX_BYTES } = require('../media/mediaConstants');

const uploadClientLogo = async (fileBuffer, filename, mimeType) => {
  const asset = await mediaService.uploadMedia(fileBuffer, filename, mimeType, {
    allowedMimes: IMAGE_ONLY_MIMES,
    maxSizeBytes: LOGO_MAX_BYTES,
  });

  return {
    url:      asset.url,
    publicId: asset.publicId,
    provider: asset.provider,
    width:    asset.width,
    height:   asset.height,
  };
};

const deleteClientLogo = async (asset) => {
  if (!asset?.publicId) return;
  await mediaService.deleteMedia(asset.publicId, asset.provider);
};

module.exports = { uploadClientLogo, deleteClientLogo };
