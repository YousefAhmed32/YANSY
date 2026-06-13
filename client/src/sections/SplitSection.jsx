// sections/SplitSection.jsx
// ─────────────────────────────────────────────────────────────
// إعادة هيكلة كاملة
//
// المشكلة القديمة:
//   - pin: true على section بدون h-screen صريح = GSAP يتخبط
//   - opacity-0 على العناصر = invisible لو animation مش اشتغلت
//   - border-r على موبايل = border في مكان غلط
//
// الحل الجديد:
//   - بدل pinned scroll → editorial section فاخرة
//   - Two-panel design: نص + visual statement
//   - على الموبايل: stacked بشكل واضح
//   - مفيش opacity-0 initial = يظهر دايماً حتى لو JS فشل
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef } from 'react';

const SplitSection = ({ splitLeftRef, splitRightRef, isRTL, homeT }) => {
  const sectionRef = useRef(null);

  // Intersection observer بدل GSAP pin — أكثر reliability
  useEffect(() => {
    const els = [splitLeftRef?.current, splitRightRef?.current].filter(Boolean);
    if (!els.length || typeof IntersectionObserver === 'undefined') return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateX(0) translateY(0)';
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [splitLeftRef, splitRightRef]);

  return (
    <section
      ref={sectionRef}
      className="relative py-0 overflow-hidden bg-black"
      aria-label={isRTL ? 'سريع وآمن' : 'Fast and Secure'}
    >
      <style>{`
        .sp-panel {
          transition: opacity .9s cubic-bezier(.4,0,.2,1),
                      transform .9s cubic-bezier(.4,0,.2,1);
        }
        @media (prefers-reduced-motion: reduce) {
          .sp-panel { transition: opacity .3s ease !important; transform: none !important; }
        }
        .sp-word-bg {
          -webkit-text-stroke: 1px rgba(212,175,55,0.12);
          color: transparent;
          user-select: none;
          pointer-events: none;
        }
      `}</style>

      <div className={`grid grid-cols-1 lg:grid-cols-2 ${isRTL ? 'rtl' : ''}`}>

        {/* ── Panel LEFT / Fast ─────────────────────────────── */}
        <div
          ref={splitLeftRef}
          className="sp-panel relative min-h-[60vh] lg:min-h-[80vh] flex items-center justify-center px-8 sm:px-16 py-20 lg:py-0 bg-black overflow-hidden"
          style={{
            opacity: 0,
            transform: isRTL ? 'translateX(40px)' : 'translateX(-40px)',
            /* border-inline-end = right in LTR (✓), left in RTL (✓) — always faces the Secure panel */
            borderInlineEnd: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Ghost word background */}
          <span
            aria-hidden
            className="sp-word-bg absolute select-none"
            style={{
              fontFamily: "'Inter',system-ui,sans-serif",
              fontSize: 'clamp(6rem, 18vw, 16rem)',
              fontWeight: 800,
              lineHeight: 1,
              bottom: '-0.08em',
              right: isRTL ? 'auto' : '-0.05em',
              left: isRTL ? '-0.05em' : 'auto',
              letterSpacing: '-0.05em',
            }}
          >
            {homeT('split.fast.title', 'Fast')}
          </span>

          {/* Gold vertical accent line */}
          <div
            aria-hidden
            className="absolute top-16 bottom-16"
            style={{
              [isRTL ? 'right' : 'left']: '2.5rem',
              width: '1px',
              background: 'linear-gradient(to bottom, transparent, rgba(212,175,55,0.4), transparent)',
            }}
          />

          {/* Content — text-start + ps-10 are CSS logical properties (auto-flip with dir) */}
          <div className={`relative z-10 max-w-sm ${isRTL ? 'text-right' : 'text-left'} ps-10`}>
            <p
              className="text-[10px] tracking-[.45em] uppercase mb-8 font-light"
              style={{ color: 'rgba(212,175,55,0.65)' }}
            >
              {isRTL ? '01 — الأداء' : '01 — Performance'}
            </p>

            <h3
              className="font-bold tracking-tight mb-6 text-white"
              style={{
                fontSize: 'clamp(2.75rem, 5vw, 4.5rem)',
                letterSpacing: '-0.04em',
                lineHeight: 0.97,
              }}
            >
              {homeT('split.fast.title', 'Fast')}
            </h3>

            {/* Gold divider — direction-aware gradient, aligned to inline-start */}
            <div
              className="mb-8"
              style={{
                width: 48,
                height: 1,
                /* Gradient starts from the text edge (start side) */
                background: `linear-gradient(to ${isRTL ? 'left' : 'right'}, #d4af37, transparent)`,
                marginInlineStart: 0,
                marginInlineEnd: 'auto',
              }}
            />

            <p
              className="font-light leading-relaxed"
              style={{
                fontSize: 'clamp(1rem, 1.6vw, 1.2rem)',
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              {homeT(
                'split.fast.description',
                'Performance is not optional. Every millisecond matters. We build systems that feel instant.'
              )}
            </p>

            {/* Stat */}
            <div className="mt-10 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span
                className="font-bold"
                style={{
                  fontSize: '2.5rem',
                  letterSpacing: '-0.03em',
                  color: '#d4af37',
                }}
              >
                &lt;1s
              </span>
              <p className="text-xs tracking-widest uppercase mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {isRTL ? 'وقت التحميل المستهدف' : 'Target Load Time'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Panel RIGHT / Secure ──────────────────────────── */}
        <div
          ref={splitRightRef}
          className="sp-panel relative min-h-[60vh] lg:min-h-[80vh] flex items-center justify-center px-8 sm:px-16 py-20 lg:py-0 overflow-hidden"
          style={{
            opacity: 0,
            transform: isRTL ? 'translateX(-40px)' : 'translateX(40px)',
            background: '#fafaf8',
          }}
        >
          {/* Ghost word */}
          <span
            aria-hidden
            className="absolute select-none"
            style={{
              fontFamily: "'Inter',system-ui,sans-serif",
              fontSize: 'clamp(6rem, 18vw, 16rem)',
              fontWeight: 800,
              lineHeight: 1,
              bottom: '-0.08em',
              left: isRTL ? 'auto' : '-0.05em',
              right: isRTL ? '-0.05em' : 'auto',
              letterSpacing: '-0.05em',
              WebkitTextStroke: '1px rgba(0,0,0,0.06)',
              color: 'transparent',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          >
            {homeT('split.secure.title', 'Secure')}
          </span>

          {/* Dark vertical accent */}
          <div
            aria-hidden
            className="absolute top-16 bottom-16"
            style={{
              [isRTL ? 'left' : 'right']: '2.5rem',
              width: '1px',
              background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.12), transparent)',
            }}
          />

          {/* Content — logical padding (ps-10 = padding-inline-start) */}
          <div className={`relative z-10 max-w-sm ${isRTL ? 'text-right' : 'text-left'} ps-10`}>
            <p
              className="text-[10px] tracking-[.45em] uppercase mb-8 font-light"
              style={{ color: 'rgba(0,0,0,0.4)' }}
            >
              {isRTL ? '02 — الأمان' : '02 — Security'}
            </p>

            <h3
              className="font-bold tracking-tight mb-6"
              style={{
                fontSize: 'clamp(2.75rem, 5vw, 4.5rem)',
                letterSpacing: '-0.04em',
                lineHeight: 0.97,
                color: '#0a0a0a',
              }}
            >
              {homeT('split.secure.title', 'Secure')}
            </h3>

            {/* Dark divider — direction-aware, aligned to inline-start */}
            <div
              className="mb-8"
              style={{
                width: 48,
                height: 1,
                background: `linear-gradient(to ${isRTL ? 'left' : 'right'}, rgba(0,0,0,0.3), transparent)`,
                marginInlineStart: 0,
                marginInlineEnd: 'auto',
              }}
            />

            <p
              className="font-light leading-relaxed"
              style={{
                fontSize: 'clamp(1rem, 1.6vw, 1.2rem)',
                color: 'rgba(0,0,0,0.5)',
              }}
            >
              {homeT(
                'split.secure.description',
                'Security built into every layer. From infrastructure to code. No compromises.'
              )}
            </p>

            {/* Stat */}
            <div
              className="mt-10 pt-8"
              style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}
            >
              <span
                className="font-bold"
                style={{
                  fontSize: '2.5rem',
                  letterSpacing: '-0.03em',
                  color: '#0a0a0a',
                }}
              >
                256-bit
              </span>
              <p
                className="text-xs tracking-widest uppercase mt-1"
                style={{ color: 'rgba(0,0,0,0.3)' }}
              >
                {isRTL ? 'تشفير من طرف لطرف' : 'End-to-end Encryption'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SplitSection;