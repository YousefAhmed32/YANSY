// Builds responsive image attributes from a PortfolioProject media asset
// (as returned by the API's withResponsiveMedia decorator: { url, provider, srcSm, srcMd, srcLg, blurDataURL, dominantColor }).
import { MEDIA_ORIGIN } from './api';

// Local (non-Cloudinary) assets are stored as relative paths so they aren't frozen to a
// particular host/port — resolve them against the configured API origin here. Cloudinary URLs
// and data: URIs are already fully-qualified and pass through unchanged.
const resolveUrl = (url) => {
  if (!url) return null;
  if (/^(https?:|data:|blob:)/.test(url)) return url;
  return `${MEDIA_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const mediaSrcSet = (asset) => {
  if (!asset?.url || asset.provider !== 'cloudinary') return undefined;
  const parts = [];
  if (asset.srcSm) parts.push(`${resolveUrl(asset.srcSm)} 480w`);
  if (asset.srcMd) parts.push(`${resolveUrl(asset.srcMd)} 960w`);
  if (asset.srcLg) parts.push(`${resolveUrl(asset.srcLg)} 1600w`);
  return parts.length ? parts.join(', ') : undefined;
};

export const mediaSrc = (asset) => resolveUrl(asset?.srcMd || asset?.url) || null;

export const CARD_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
export const HERO_SIZES = '100vw';

// Converts a Media-library catalog item (server/models/Media.js, as returned
// by POST /media-library/upload) into the embedded mediaAssetSchema shape
// every avatar/logo/cover/gallery field on the library models and
// PortfolioProject expects — keeping the `asset` back-reference so the item
// stays linked to the catalog (searchable/reusable/"replace everywhere").
export const assetFromMediaLibraryItem = (item) => (item && {
  url: item.url,
  publicId: item.publicId,
  provider: 'gridfs',
  kind: item.type === 'video' ? 'video' : item.type === 'audio' ? 'audio' : 'image',
  alt: item.alt || '',
  altAr: item.altAr || '',
  caption: item.caption || '',
  captionAr: item.captionAr || '',
  asset: item._id,
});
