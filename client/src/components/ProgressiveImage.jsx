import { useState } from 'react';
import { mediaSrcSet, mediaSrc, CARD_SIZES } from '../utils/media';
import GeneratedPlaceholder from './BrandedPlaceholder';

/**
 * Renders a media asset with a blur-up / dominant-color placeholder that fades into
 * the real image once it loads. Responsive srcset sources are only ever populated for
 * assets with a transform pipeline (historically Cloudinary); GridFS-stored assets have
 * none, so `mediaSrcSet` returns undefined and this falls back to a single `src`.
 *
 * When there's no usable asset at all (missing/broken upload), falls back to a premium
 * on-brand generated placeholder — never an empty box — via the fallback* props.
 *
 * `fill` (default false) controls how the wrapper is positioned:
 *  - fill=true:  the wrapper absolutely fills its positioned parent (`position:absolute; inset:0`) —
 *    for cover/hero images inside an aspect-ratio-boxed container (see PortfolioCard, hero shots).
 *  - fill=false: the wrapper stays in normal flow, sized by `className`/`style` (e.g. a fixed-size
 *    avatar or a thumbnail whose parent already has a definite size) — this was previously the only
 *    behavior, hardcoded via inline `position:'relative'`, which silently defeated any caller
 *    passing `className="absolute inset-0"` (inline styles always win over classes for the same
 *    CSS property) — collapsing the wrapper to zero height and clipping the image out of view.
 */
const ProgressiveImage = ({
  asset, alt = '', className = '', imgClassName = '', sizes = CARD_SIZES, priority = false, style, fill = false,
  fallbackIcon, fallbackLabel, fallbackColor = 'rgb(var(--accent))', fallbackVariant = 'card', isRTL = false,
}) => {
  const hasBlur = Boolean(asset.blurDataURL);
  const [loaded, setLoaded] = useState(() => !hasBlur);
  const wrapperPosition = fill ? { position: 'absolute', inset: 0 } : { position: 'relative' };

  if (!asset?.url) {
    return (
      <div className={className} style={{ ...wrapperPosition, overflow: 'hidden', background: 'rgb(var(--bg-contrast))', ...style }}>
        <GeneratedPlaceholder icon={fallbackIcon} label={fallbackLabel} color={fallbackColor} isRTL={isRTL} variant={fallbackVariant} />
      </div>
    );
  }

  const srcSet = mediaSrcSet(asset);

  return (
    <div
      className={className}
      style={{ ...wrapperPosition, overflow: 'hidden', background: asset.dominantColor || 'rgb(var(--border-light))', ...style }}
    >
      {asset.blurDataURL && (
        <img
          src={asset.blurDataURL}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-cover scale-110 blur-xl transition-opacity duration-500 ${loaded ? 'opacity-0' : 'opacity-100'}`}
        />
      )}
      <img
        src={mediaSrc(asset)}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
      />
    </div>
  );
};

export default ProgressiveImage;
