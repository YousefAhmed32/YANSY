import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { mediaSrc } from '../utils/media';
import api from '../utils/api';
import SectionHeader from './SectionHeader';
import Reveal from './Reveal';

const FONT_EN = "'Inter',system-ui,sans-serif";
const FONT_AR = "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif";

// Only skip the muted->color-on-hover treatment for the one case where
// desaturating would visibly hurt legibility: a near-white logo against our
// (always-light) card background. Anything else keeps the normal treatment.
const LIGHT_LOGO_LUMINANCE = 0.86;

/**
 * Samples a *separate* off-DOM copy of the image (not the visible <img>) so a
 * CORS-blocked read can never affect what's actually rendered — worst case,
 * detection silently fails and the tile keeps the default muted treatment.
 */
const detectExtremeLuminance = (src, onResult) => {
  const probe = new Image();
  probe.crossOrigin = 'anonymous';
  probe.onload = () => {
    try {
      const size = 24;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(probe, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);
      let total = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 16) continue; // ignore transparent pixels
        total += 0.2126 * (data[i] / 255) + 0.7152 * (data[i + 1] / 255) + 0.0722 * (data[i + 2] / 255);
        count += 1;
      }
      onResult(count ? total / count : null);
    } catch {
      onResult(null); // tainted canvas — fall back to default treatment
    }
  };
  probe.onerror = () => onResult(null);
  probe.src = src;
};

const LogoTile = memo(({ brand, isRTL }) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [vivid, setVivid] = useState(false); // true = skip the grayscale treatment
  const src = mediaSrc(brand.logo);
  const showImage = brand.logo?.url && !errored;

  const handleLoad = useCallback(() => {
    setLoaded(true);
    if (!src) return;
    detectExtremeLuminance(src, (avg) => {
      if (avg !== null && avg > LIGHT_LOGO_LUMINANCE) setVivid(true);
    });
  }, [src]);

  const tile = (
    <div className={`trusted-by-tile${vivid ? ' trusted-by-tile--vivid' : ''}`}>
      {showImage && !loaded && <span className="trusted-by-skeleton trusted-by-skeleton--overlay" aria-hidden="true" />}
      {showImage ? (
        <img
          src={src}
          alt={brand.name}
          width={brand.logo.width || undefined}
          height={brand.logo.height || undefined}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          onLoad={handleLoad}
          onError={() => setErrored(true)}
          className="trusted-by-tile__img"
          style={{ opacity: loaded ? 1 : 0 }}
        />
      ) : (
        <span className="trusted-by-tile__fallback" style={{ fontFamily: isRTL ? FONT_AR : FONT_EN }}>
          {brand.name}
        </span>
      )}
    </div>
  );

  return (
    <div role="listitem" className="trusted-by-listitem">
      {brand.website ? (
        <a href={brand.website} target="_blank" rel="noopener noreferrer" aria-label={brand.name} className="trusted-by-tile__link">
          {tile}
        </a>
      ) : tile}
    </div>
  );
});
LogoTile.displayName = 'LogoTile';

const SkeletonHeader = () => (
  <div aria-hidden="true" style={{ marginBottom: 'var(--header-gap, 40px)' }}>
    <span className="trusted-by-skeleton" style={{ display: 'inline-block', width: 84, height: 22, borderRadius: 999 }} />
    <span className="trusted-by-skeleton" style={{ display: 'block', width: '56%', maxWidth: 380, height: 38, borderRadius: 8, marginTop: 18 }} />
    <span className="trusted-by-skeleton" style={{ display: 'block', width: '38%', maxWidth: 280, height: 15, borderRadius: 6, marginTop: 14 }} />
  </div>
);

const SkeletonGrid = () => (
  <div className="trusted-by-grid" aria-hidden="true">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="trusted-by-tile trusted-by-tile--loading">
        <span className="trusted-by-skeleton trusted-by-skeleton--block" />
      </div>
    ))}
  </div>
);

const TrustedByLogos = () => {
  const { isRTL } = useLanguage();
  const [data, setData] = useState(null);
  // loading -> ready (has logos) | collapsing (disabled/empty, animating out) | gone (removed)
  const [status, setStatus] = useState('loading');
  const collapseRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    api.get('/client-logos').then(({ data: res }) => {
      if (cancelled) return;
      if (res.enabled && res.logos?.length) {
        setData(res);
        setStatus('ready');
      } else {
        setStatus('collapsing');
      }
    }).catch(() => { if (!cancelled) setStatus('collapsing'); });
    return () => { cancelled = true; };
  }, []);

  // Once the collapse transition finishes, remove the section from the DOM
  // entirely rather than leaving a permanent zero-height, aria-hidden stub.
  const handleTransitionEnd = useCallback((e) => {
    if (e.target !== collapseRef.current) return;
    if (status === 'collapsing') setStatus('gone');
  }, [status]);

  if (status === 'gone') return null;

  const ready = status === 'ready' && data;
  const title = ready ? (isRTL ? data.title?.ar : data.title?.en) || '' : '';
  const subtitle = ready ? (isRTL ? data.subtitle?.ar : data.subtitle?.en) || '' : '';

  return (
    <div
      ref={collapseRef}
      className="trusted-by-collapse"
      data-collapsed={status === 'collapsing'}
      onTransitionEnd={handleTransitionEnd}
    >
      <div className="trusted-by-collapse__inner">
        <section
          dir={isRTL ? 'rtl' : 'ltr'}
          className="section-shell section-shell--plain"
          aria-label={isRTL ? 'العملاء الموثوقون' : 'Trusted by our clients'}
          aria-hidden={!ready}
        >
          <style>{`
            .trusted-by-collapse {
              display: grid;
              grid-template-rows: 1fr;
              transition: grid-template-rows 0.5s cubic-bezier(0.16,1,0.3,1);
            }
            .trusted-by-collapse[data-collapsed="true"] { grid-template-rows: 0fr; }
            .trusted-by-collapse__inner { overflow: hidden; min-height: 0; }

            .trusted-by-grid {
              display: grid;
              grid-template-columns: repeat(6, 1fr);
              gap: clamp(14px, 1.6vw, 24px);
              list-style: none;
              margin: 0;
              padding: 0;
            }
            @media (max-width: 1024px) { .trusted-by-grid { grid-template-columns: repeat(4, 1fr); } }
            @media (max-width: 640px)  { .trusted-by-grid { grid-template-columns: repeat(3, 1fr); } }
            @media (max-width: 420px)  { .trusted-by-grid { grid-template-columns: repeat(2, 1fr); } }

            .trusted-by-listitem, .trusted-by-tile__link { display: block; height: 100%; }
            .trusted-by-tile__link { text-decoration: none; border-radius: 18px; }

            .trusted-by-tile {
              position: relative;
              display: flex; align-items: center; justify-content: center;
              height: 112px; padding: 24px;
              background: rgb(var(--bg-elevated));
              border: 1px solid rgb(var(--border));
              border-radius: 18px;
              overflow: hidden;
              transition: transform 0.4s cubic-bezier(0.16,1,0.3,1),
                          box-shadow 0.4s cubic-bezier(0.16,1,0.3,1),
                          border-color 0.3s ease;
            }
            .trusted-by-tile--loading { background: rgb(var(--bg-elevated)); }

            /* Hover/focus lift — bubbles from .trusted-by-listitem so linked
               and non-linked tiles (no website set) get identical feedback.
               :focus-within gives keyboard users the same lift as mouse
               hover; the dedicated :focus-visible rule below adds the
               actual outline ring on top of it. */
            .trusted-by-listitem:hover .trusted-by-tile,
            .trusted-by-listitem:focus-within .trusted-by-tile {
              transform: translateY(-4px) scale(1.012);
              border-color: rgba(37,99,235,0.3);
              box-shadow: 0 16px 32px rgba(15,23,42,0.07), 0 4px 10px rgba(37,99,235,0.06);
            }
            a.trusted-by-tile__link:focus-visible {
              outline: 2px solid rgb(var(--accent));
              outline-offset: 3px;
              border-radius: 18px;
            }

            .trusted-by-tile__img {
              height: 38px; width: auto; max-width: 82%;
              object-fit: contain;
              filter: grayscale(0.9) opacity(0.75);
              transition: filter 0.45s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease;
            }
            .trusted-by-tile--vivid .trusted-by-tile__img { filter: none; }
            .trusted-by-listitem:hover .trusted-by-tile__img,
            .trusted-by-listitem:focus-within .trusted-by-tile__img {
              filter: none;
              transform: scale(1.03);
            }

            .trusted-by-tile__fallback {
              font-size: 13.5px; font-weight: 600; letter-spacing: -0.01em;
              color: rgb(var(--text-secondary));
            }

            .trusted-by-skeleton {
              display: block;
              border-radius: 10px;
              background: linear-gradient(100deg, rgb(var(--border-light)) 20%, rgb(var(--bg-surface)) 40%, rgb(var(--border-light)) 60%);
              background-size: 200% 100%;
              animation: trusted-by-shimmer 1.8s ease-in-out infinite;
            }
            /* Overlays the image while it decodes (inside a real tile). */
            .trusted-by-skeleton--overlay { position: absolute; inset: 0; border-radius: 18px; }
            /* Fills a placeholder tile before the section knows it has data. */
            .trusted-by-skeleton--block { width: 100%; height: 100%; }
            @keyframes trusted-by-shimmer {
              0%   { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
            @media (prefers-reduced-motion: reduce) {
              .trusted-by-tile, .trusted-by-tile__img, .trusted-by-collapse { transition: none !important; }
              .trusted-by-skeleton { animation: none !important; }
            }
          `}</style>

          <div className="section-inner">
            {ready ? (
              <SectionHeader
                eyebrow={isRTL ? 'الثقة' : 'Trust'}
                title={title}
                lead={subtitle}
                align="stack"
                maxLeadWidth={480}
              />
            ) : (
              <SkeletonHeader />
            )}

            {ready ? (
              <Reveal
                stagger
                className="trusted-by-grid"
                role="list"
                aria-label={isRTL ? 'قائمة الشركاء' : 'Partner companies'}
                step={0.04}
                distance={16}
              >
                {data.logos.map((brand) => (
                  <LogoTile key={brand._id} brand={brand} isRTL={isRTL} />
                ))}
              </Reveal>
            ) : (
              <SkeletonGrid />
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default TrustedByLogos;
