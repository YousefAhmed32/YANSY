'use strict';
const { uploadToCloud, deleteFromCloud } = require('./cloudStorage');
const { generateBlurDataURL } = require('./portfolioMedia');

const uploadShowcaseVideo = async (fileBuffer, filename, mimeType) => {
  const uploaded = await uploadToCloud(fileBuffer, filename, mimeType, {
    folder: 'yansy/homepage-video',
    tags:   ['yansy-homepage-video'],
    resourceType: 'video',
  });
  return {
    videoUrl:       uploaded.url,
    videoPublicId:  uploaded.cloudId,
    videoProvider:  uploaded.provider,
    videoSizeBytes: fileBuffer.length,
  };
};

const deleteShowcaseVideo = async ({ videoPublicId, videoProvider }) => {
  if (!videoPublicId) return;
  await deleteFromCloud(videoPublicId, videoProvider);
};

const uploadShowcasePoster = async (fileBuffer, filename, mimeType) => {
  const uploaded = await uploadToCloud(fileBuffer, filename, mimeType, {
    folder: 'yansy/homepage-video',
    tags:   ['yansy-homepage-poster'],
  });
  const blurDataURL = await generateBlurDataURL(uploaded.url, uploaded.provider);

  return {
    url:           uploaded.url,
    publicId:      uploaded.cloudId,
    provider:      uploaded.provider,
    width:         uploaded.width,
    height:        uploaded.height,
    dominantColor: uploaded.dominantColor,
    blurDataURL,
  };
};

const deleteShowcasePoster = async (poster) => {
  if (!poster?.publicId) return;
  await deleteFromCloud(poster.publicId, poster.provider);
};

module.exports = { uploadShowcaseVideo, deleteShowcaseVideo, uploadShowcasePoster, deleteShowcasePoster };
