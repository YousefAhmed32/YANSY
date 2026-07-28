import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import Reveal from '../Reveal';
import ProgressiveImage from '../ProgressiveImage';

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

  return (
    <section className="section-shell section-shell--tint" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="section-inner" style={{ maxWidth: 1100 }}>
        <Reveal distance={16}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 26, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <span className="section-label">{isRTL ? 'معرض المشروع' : 'Project Gallery'}</span>
            <span dir="ltr" style={{ [isRTL ? 'marginRight' : 'marginLeft']: 'auto', fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {activeImg + 1} / {images.length}
            </span>
          </div>

          <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', background: '#fff' }}>
            {/* Browser chrome bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} aria-hidden>
                {TRAFFIC.map((c) => <span key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.85 }} />)}
              </div>
              {domain && (
                <div style={{
                  flex: 1, maxWidth: 320, margin: '0 auto', textAlign: 'center',
                  padding: '4px 12px', borderRadius: 999, background: '#fff', border: '1px solid var(--border)',
                  fontSize: 11.5, color: 'var(--text-tertiary)', fontFamily: "'Inter',system-ui,sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }} dir="ltr">
                  {domain}
                </div>
              )}
            </div>

            {/* Main viewer */}
            <div
              className="relative overflow-hidden cursor-zoom-in group"
              style={{ aspectRatio: '16/9' }}
              onClick={onOpenLightbox}
              role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpenLightbox(); }}
              aria-label={isRTL ? `فتح صورة المشروع ${title} بملء الشاشة` : `Open ${title} screenshot fullscreen`}
            >
              <ProgressiveImage
                asset={images[activeImg]}
                alt={`${title} — ${activeImg + 1}`}
                fill
                imgClassName="transition-transform duration-700 group-hover:scale-[1.02]"
                priority={activeImg === 0}
              />
              <div className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center border border-[#E8EBF0] bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full">
                <ZoomIn className="w-4 h-4 text-[#0D1117]" />
              </div>

              {images.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center border border-[#E8EBF0] bg-white/90 text-[#6B7280] hover:text-[#0D1117] hover:border-[#C9CDD6] transition-all opacity-0 group-hover:opacity-100 rounded-full" aria-label={isRTL ? 'الصورة السابقة' : 'Previous'}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center border border-[#E8EBF0] bg-white/90 text-[#6B7280] hover:text-[#0D1117] hover:border-[#C9CDD6] transition-all opacity-0 group-hover:opacity-100 rounded-full" aria-label={isRTL ? 'الصورة التالية' : 'Next'}>
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
                    flexShrink: 0, width: 108, aspectRatio: '16/9', overflow: 'hidden', borderRadius: 8,
                    border: `2px solid ${i === activeImg ? 'var(--accent)' : 'transparent'}`,
                    opacity: i === activeImg ? 1 : 0.55, transition: 'all 0.25s', cursor: 'pointer', padding: 0, background: 'none',
                  }}
                  aria-label={isRTL ? `عرض الصورة ${i + 1}` : `View image ${i + 1}`}
                  aria-pressed={i === activeImg}
                  onMouseEnter={(e) => { if (i !== activeImg) e.currentTarget.style.opacity = '0.85'; }}
                  onMouseLeave={(e) => { if (i !== activeImg) e.currentTarget.style.opacity = '0.55'; }}
                >
                  <ProgressiveImage asset={img} alt="" className="w-full h-full" />
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
