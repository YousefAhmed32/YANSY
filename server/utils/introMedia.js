'use strict';
const { uploadToCloud, deleteFromCloud } = require('./cloudStorage');

const uploadIntroVideo = async (fileBuffer, filename, mimeType) => {
  const uploaded = await uploadToCloud(fileBuffer, filename, mimeType, {
    folder: 'yansy/intro',
    tags: ['yansy-intro'],
    resourceType: 'video',
  });

  return {
    videoUrl:       uploaded.url,
    videoPublicId:  uploaded.cloudId,
    videoProvider:  uploaded.provider,
    videoSizeBytes: fileBuffer.length,
  };
};

const deleteIntroVideo = async ({ videoPublicId, videoProvider }) => {
  if (!videoPublicId || videoProvider === 'static') return;
  await deleteFromCloud(videoPublicId, videoProvider);
};

module.exports = { uploadIntroVideo, deleteIntroVideo };
