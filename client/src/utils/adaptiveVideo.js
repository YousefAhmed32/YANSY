// Cloudinary can pick an appropriate bitrate/quality for the visitor's connection
// on the fly via a URL transformation — no bitrate-ladder infrastructure needed.
export const adaptiveVideoSrc = (url) => {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  const marker = '/upload/';
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  return `${url.slice(0, idx + marker.length)}q_auto/${url.slice(idx + marker.length)}`;
};
