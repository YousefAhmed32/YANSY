'use strict';
const { uploadToCloud, deleteFromCloud } = require('./cloudStorage');

const uploadClientLogo = async (fileBuffer, filename, mimeType) => {
  const uploaded = await uploadToCloud(fileBuffer, filename, mimeType, {
    folder: 'yansy/client-logos',
    tags:   ['yansy-client-logo'],
  });

  return {
    url:      uploaded.url,
    publicId: uploaded.cloudId,
    provider: uploaded.provider,
    width:    uploaded.width,
    height:   uploaded.height,
  };
};

const deleteClientLogo = async (asset) => {
  if (!asset?.publicId) return;
  await deleteFromCloud(asset.publicId, asset.provider);
};

module.exports = { uploadClientLogo, deleteClientLogo };
