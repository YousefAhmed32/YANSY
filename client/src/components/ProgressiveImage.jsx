import { useState } from 'react';
import { mediaSrcSet, mediaSrc, CARD_SIZES } from '../utils/media';
import GeneratedPlaceholder from './BrandedPlaceholder';

/**
 * Renders a media asset with a blur-up / dominant-color placeholder that fades into
 * the real image once it loads.
 *
 * `fit` (default "cover") controls whether the image crops to fill its frame or
 * stays fully visible (contain). `ambient` adds an ultra-smooth, blurred glow
 * behind contained media matching the image's own colors, completely eliminating
 * hard empty bands while keeping the foreground 100% visible and uncropped.
 */
const ProgressiveImage = ({
  asset,
  alt = '',
  className = '',
  imgClassName = '',
  sizes = CARD_SIZES,
  priority = false,
  style,
  fill = false,
  fit = 'cover',
  ambient = false,
  fallbackIcon,
  fallbackLabel,
  fallbackColor = 'rgb(var(--accent))',
  fallbackVariant = 'card',
  isRTL = false,
}) => {
  const hasBlur = Boolean(asset?.blurDataURL);
  const [loaded, setLoaded] = useState(() => !hasBlur);
  const wrapperPosition = fill ? { position: 'absolute', inset: 0 } : { position: 'relative' };
  const imageFitClass = fit === 'contain' ? 'object-contain' : 'object-cover';
  const showAmbient = ambient && fit === 'contain' && Boolean(asset?.url);

  if (!asset?.url) {
    return (
      <div className={className} style={{ ...wrapperPosition, overflow: 'hidden', background: 'rgb(var(--bg-surface))', ...style }}>
        <GeneratedPlaceholder icon={fallbackIcon} label={fallbackLabel} color={fallbackColor} isRTL={isRTL} variant={fallbackVariant} />
      </div>
    );
  }

  const srcSet = mediaSrcSet(asset);

  return (
    <div
      className={className}
      style={{ ...wrapperPosition, overflow: 'hidden', background: asset.dominantColor || 'rgb(var(--bg-surface))', ...style }}
    >
      {showAmbient && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <img
            src={mediaSrc(asset)}
            alt=""
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="absolute inset-0 h-full w-full select-none object-cover scale-125 blur-2xl opacity-90 saturate-125"
          />
          <span className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
        </div>
      )}
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
        className={`relative z-10 w-full h-full ${imageFitClass} transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
      />
    </div>
  );
};

export default ProgressiveImage;
