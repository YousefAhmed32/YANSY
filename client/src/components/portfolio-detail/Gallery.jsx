import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, Play } from 'lucide-react';
import Reveal from '../Reveal';
import ProgressiveImage from '../ProgressiveImage';
import { mediaSrc } from '../../utils/media';

const TRAFFIC = ['#FF5F57', '#FEBC2E', '#28C840'];

const hostnameOf = (url) => {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return null; }
};

/**
 * Screenshots framed in a lightweight browser chrome — signals "this is a
 * real, live product" far more than a bare image ever does, which matters
 * since every gallery item here is a software screenshot, not photography.
 * Filmstrip is horizontally scrollable and shows every image (the previous
 * version silently capped navigation at 6 via `.slice(0, 6)`, so anything
 * past that was only reachable through the lightbox's arrow keys).
 */
const Gallery = ({ images, activeImg, setActiveImg, onOpenLightbox, onPrev, onNext, isRTL, liveUrl, title }) => {
  const domain = useMemo(() => (liveUrl ? hostnameOf(liveUrl) : null), [liveUrl]);
  const activeAsset = images[activeImg];
  const isActiveVideo = activeAsset?.kind === 'video';

  return (
    <section className="section-shell section-shell--tint" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="section-inner" style={{ maxWidth: 1350 }}>
        <Reveal distance={16}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 26, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <span className="section-label">{isRTL ? 'معرض المشروع' : 'Project Gallery'}</span>
            <span dir="ltr" style={{ [isRTL ? 'marginRight' : 'marginLeft']: 'auto', fontSize: 11, color: 'rgb(var(--text-tertiary))', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {activeImg + 1} / {images.length}
            </span>
          </div>

          <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid rgb(var(--border))', boxShadow: 'var(--shadow-lg)', background: '#fff' }}>
            {/* Browser chrome bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgb(var(--bg-surface))', borderBottom: '1px solid rgb(var(--border))' }}>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} aria-hidden>
                {TRAFFIC.map((c) => <span key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.85 }} />)}
              </div>
              {domain && (
                <div style={{
                  flex: 1, maxWidth: 320, margin: '0 auto', textAlign: 'center',
                  padding: '4px 12px', borderRadius: 999, background: '#fff', border: '1px solid rgb(var(--border))',
                  fontSize: 11.5, color: 'rgb(var(--text-tertiary))', fontFamily: "'Inter',system-ui,sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }} dir="ltr">
                  {domain}
                </div>
              )}
            </div>

            {/* Main viewer */}
            <div
              className={`relative overflow-hidden group ${isActiveVideo ? '' : 'cursor-zoom-in'}`}
              style={{ aspectRatio: '16/9' }}
              onClick={isActiveVideo ? undefined : onOpenLightbox}
              role={isActiveVideo ? undefined : 'button'} tabIndex={isActiveVideo ? undefined : 0}
              onKeyDown={isActiveVideo ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') onOpenLightbox(); }}
              aria-label={isActiveVideo ? undefined : (isRTL ? `فتح صورة المشروع ${title} بملء الشاشة` : `Open ${title} screenshot fullscreen`)}
            >
              {isActiveVideo ? (
                <video
                  key={activeAsset.publicId || activeImg}
                  src={mediaSrc(activeAsset)}
                  poster={mediaSrc(activeAsset)}
                  controls playsInline
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', background: '#000' }}
                />
              ) : (
                <>
                  <ProgressiveImage
                    asset={activeAsset}
                    alt={`${title} — ${activeImg + 1}`}
                    fill
                    imgClassName="transition-transform duration-700 group-hover:scale-[1.02]"
                    priority={activeImg === 0}
                  />
                  <div className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center border border-border bg-surface-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full">
                    <ZoomIn className="w-4 h-4 text-content-primary" />
                  </div>
                </>
              )}

              {images.length > 1 && (
                <>
                  {/* Physically-left/right controls swap which action they perform
                      under RTL, matching the Lightbox's keyboard-arrow semantics —
                      reading direction reverses which side is "back". */}
                  <button onClick={(e) => { e.stopPropagation(); isRTL ? onNext() : onPrev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center border border-border bg-surface-white/90 text-content-secondary hover:text-content-primary hover:border-border-strong transition-all opacity-0 group-hover:opacity-100 rounded-full" aria-label={isRTL ? 'الصورة التالية' : 'Previous'}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); isRTL ? onPrev() : onNext(); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center border border-border bg-surface-white/90 text-content-secondary hover:text-content-primary hover:border-border-strong transition-all opacity-0 group-hover:opacity-100 rounded-full" aria-label={isRTL ? 'الصورة السابقة' : 'Next'}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Filmstrip — every image, horizontally scrollable */}
          {images.length > 1 && (
            <div className="scrollbar-hide" style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  style={{
                    position: 'relative', flexShrink: 0, width: 108, aspectRatio: '16/9', overflow: 'hidden', borderRadius: 8,
                    border: `2px solid ${i === activeImg ? 'rgb(var(--accent))' : 'transparent'}`,
                    opacity: i === activeImg ? 1 : 0.55, transition: 'all 0.25s', cursor: 'pointer', padding: 0, background: '#000',
                  }}
                  aria-label={isRTL ? (img.kind === 'video' ? `عرض الفيديو ${i + 1}` : `عرض الصورة ${i + 1}`) : (img.kind === 'video' ? `View video ${i + 1}` : `View image ${i + 1}`)}
                  aria-pressed={i === activeImg}
                  onMouseEnter={(e) => { if (i !== activeImg) e.currentTarget.style.opacity = '0.85'; }}
                  onMouseLeave={(e) => { if (i !== activeImg) e.currentTarget.style.opacity = '0.55'; }}
                >
                  {img.kind === 'video' ? (
                    <video src={mediaSrc(img)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <ProgressiveImage asset={img} alt="" className="w-full h-full" />
                  )}
                  {img.kind === 'video' && (
                    <span aria-hidden style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(13,17,23,0.25)' }}>
                      <Play style={{ width: 16, height: 16, color: '#fff' }} fill="#fff" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
};

export default Gallery;
