// sections/ServicesSlider.jsx
// ─────────────────────────────────────────────────────────────
// المشكلة القديمة:
//   - useServicesSlider بتستقبل ref object
//     لكن في Home.jsx بتتبعت { current: s.current?.servicesSlider }
//     اللي بيكون null وقت تنفيذ الـ hook
//
// الحل:
//   - الـ section تشيل الـ ref الداخلي بنفسها
//   - useServicesSlider بتشتغل على internal ref — مفيش race condition
//   - autoplay + drag + wheel + touch كلها شغالة
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';

/* ─── Slide data ─────────────────────────────────────────── */
const buildSlides = (homeT, isRTL) => [
  {
    bg    : '/assets/image/GoImage/strategy-2.png',
    num   : '01',
    color : '#d4af37',
    tKey  : 'services.strategy',
    tDef  : 'Strategy',
    dKey  : 'services.strategyDesc',
    dDef  : 'Research. Discovery. Architecture.',
    tags  : isRTL
      ? ['بحث المستخدم', 'هندسة المعلومات', 'خارطة الطريق']
      : ['User Research', 'Information Architecture', 'Roadmapping'],
  },
  {
    bg    : '/assets/image/GoImage/Design-3.png',
    num   : '02',
    color : '#c9a227',
    tKey  : 'services.design',
    tDef  : 'Design',
    dKey  : 'services.designDesc',
    dDef  : 'User experience. Interface. Motion.',
    tags  : isRTL
      ? ['تجربة المستخدم', 'واجهة المستخدم', 'حركة']
      : ['UX/UI', 'Design Systems', 'Motion'],
  },
  {
    bg    : '/assets/image/GoImage/ENG.png',
    num   : '03',
    color : '#b8911f',
    tKey  : 'services.engineering',
    tDef  : 'Engineering',
    dKey  : 'services.engineeringDesc',
    dDef  : 'Development. Integration. Deployment.',
    tags  : isRTL
      ? ['تطوير', 'تكامل', 'نشر']
      : ['Development', 'Integration', 'Deployment'],
  },
  {
    bg    : '/assets/image/GoImage/grow-w-1.png',
    num   : '04',
    color : '#a07c18',
    tKey  : 'services.growth',
    tDef  : 'Growth',
    dKey  : 'services.growthDesc',
    dDef  : 'Optimization. Analytics. Scale.',
    tags  : isRTL
      ? ['تحسين', 'تحليلات', 'توسع']
      : ['Optimization', 'Analytics', 'Scale'],
  },
];

/* ─── Main Component ─────────────────────────────────────── */
const ServicesSlider = ({ isRTL, homeT }) => {
  const [active, setActive]   = useState(0);
  const sectionRef            = useRef(null);   // ← internal, binded to DOM directly
  const trackRef              = useRef(null);
  const stRef                 = useRef({
    current   : 0,
    isDragging: false,
    startX    : 0,
    dragDelta : 0,
    velX      : 0,
    lastX     : 0,
    lastT     : 0,
    locked    : false,
    paused    : false,
    timer     : null,
  });

  const TOTAL  = 4;
  const slides = buildSlides(homeT, isRTL);

  /* ── goTo ─────────────────────────────────────────────── */
  const goTo = (idx) => {
    const st   = stRef.current;
    const next = Math.max(0, Math.min(TOTAL - 1, idx));
    st.current = next;
    setActive(next);
    if (trackRef.current) {
      trackRef.current.style.transition = 'transform .9s cubic-bezier(.77,0,.175,1)';
      trackRef.current.style.transform  = `translateX(-${next * 25}%)`;
    }
  };

  /* ── autoplay ─────────────────────────────────────────── */
  const resetAutoPlay = () => {
    const st = stRef.current;
    clearInterval(st.timer);
    st.timer = setInterval(() => {
      if (!st.paused) goTo(st.current >= TOTAL - 1 ? 0 : st.current + 1);
    }, 4500);
  };

  /* ── Event listeners ──────────────────────────────────── */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const st = stRef.current;
    resetAutoPlay();

    /* wheel */
    const onWheel = (e) => {
      const { top, bottom } = section.getBoundingClientRect();
      if (top > 4 || bottom < window.innerHeight - 4) return;
      e.preventDefault();
      if (st.locked) return;
      st.locked = true;
      const d = e.deltaY || e.deltaX;
      if (Math.abs(d) > 15) { goTo(d > 0 ? st.current + 1 : st.current - 1); resetAutoPlay(); }
      setTimeout(() => { st.locked = false; }, 960);
    };

    /* mouse drag */
    const onMouseDown = (e) => {
      if (e.target.closest('button')) return;
      st.isDragging = true;
      st.startX = st.lastX = e.clientX;
      st.lastT  = Date.now();
      st.velX   = st.dragDelta = 0;
      st.paused = true;
      section.style.cursor = 'grabbing';
    };
    const onMouseMove = (e) => {
      if (!st.isDragging) return;
      const now = Date.now();
      st.velX      = (e.clientX - st.lastX) / Math.max(now - st.lastT, 1);
      st.lastX     = e.clientX;
      st.lastT     = now;
      st.dragDelta = e.clientX - st.startX;
      if (trackRef.current) {
        const nudge = st.dragDelta * 0.055;
        trackRef.current.style.transition = 'none';
        trackRef.current.style.transform  = `translateX(calc(-${st.current * 25}% + ${nudge}px))`;
      }
    };
    const onMouseUp = () => {
      if (!st.isDragging) return;
      st.isDragging = false;
      st.paused     = false;
      section.style.cursor = 'grab';
      const total = st.dragDelta + st.velX * 100;
      if      (total < -55 && st.current < TOTAL - 1) goTo(st.current + 1);
      else if (total >  55 && st.current > 0)          goTo(st.current - 1);
      else                                              goTo(st.current);
      resetAutoPlay();
    };

    /* touch */
    let touchX = 0;
    const onTouchStart = (e) => { touchX = e.touches[0].clientX; st.paused = true; };
    const onTouchEnd   = (e) => {
      st.paused = false;
      const dx  = touchX - e.changedTouches[0].clientX;
      goTo(Math.abs(dx) > 44 ? (dx > 0 ? st.current + 1 : st.current - 1) : st.current);
      resetAutoPlay();
    };

    section.style.cursor = 'grab';
    section.addEventListener('wheel',      onWheel,      { passive: false });
    section.addEventListener('mousedown',  onMouseDown);
    section.addEventListener('touchstart', onTouchStart, { passive: true });
    section.addEventListener('touchend',   onTouchEnd);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);

    return () => {
      clearInterval(st.timer);
      section.removeEventListener('wheel',      onWheel);
      section.removeEventListener('mousedown',  onMouseDown);
      section.removeEventListener('touchstart', onTouchStart);
      section.removeEventListener('touchend',   onTouchEnd);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    };
  }, []); // ← runs once, ref is stable

  const dotColors = ['#d4af37', '#c9a227', '#b8911f', '#a07c18'];

  return (
    <section
      ref={sectionRef}
      dir="ltr"
      id="services"
      className="relative h-screen min-h-screen overflow-hidden bg-black select-none"
    >
      <style>{`
        @keyframes srv-ring{from{stroke-dashoffset:44}to{stroke-dashoffset:0}}
        @keyframes srv-grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
        /* Drag-hint nudge direction matches reading direction */
        @keyframes srv-nudge{
          0%,100%{transform:translateX(0)}
          50%{transform:translateX(${isRTL ? '-6px' : '6px'})}
        }
        /* Progress bar grows from the "start" side */
        .srv-bar{
          animation:srv-grow 4.5s linear forwards;
          transform-origin:${isRTL ? 'right' : 'left'};
        }
        @media(prefers-reduced-motion:reduce){
          .srv-bar{animation:none;transform:scaleX(1)}
        }
      `}</style>

      {/* ── Top progress line ── */}
      <div className="absolute top-0 left-0 right-0 h-px z-30" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div
          key={`bar-${active}`}
          className="srv-bar h-full"
          style={{ background: 'linear-gradient(to right,#d4af37,#a07c18)' }}
        />
      </div>

      {/* ── Counter ── */}
      <div className={`absolute top-7 z-30 flex items-baseline gap-1 ${isRTL ? 'left-8' : 'right-8'}`}>
        <span
          className="text-2xl font-bold"
          style={{ color: '#d4af37', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}
        >
          0{active + 1}
        </span>
        <span className="text-white/20 text-sm mx-1">/</span>
        <span className="text-white/30 text-sm">04</span>
      </div>

      {/* ── Prev arrow — positioned at inline-start edge ── */}
      <button
        onClick={() => goTo(active - 1)}
        disabled={active === 0}
        aria-label="Previous service"
        className={`absolute top-1/2 -translate-y-1/2 z-30 w-11 h-11 border border-white/15 flex items-center justify-center text-white/40 hover:border-[#d4af37]/60 hover:text-[#d4af37] hover:bg-[#d4af37]/5 transition-all duration-300 disabled:opacity-0 disabled:pointer-events-none ${isRTL ? 'right-6' : 'left-6'}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* ── Next arrow — inline-end side, offset to clear thumbnail strip ── */}
      <button
        onClick={() => goTo(active + 1)}
        disabled={active === TOTAL - 1}
        aria-label="Next service"
        className="absolute z-30 w-11 h-11 border border-white/15 flex items-center justify-center text-white/40 hover:border-[#d4af37]/60 hover:text-[#d4af37] hover:bg-[#d4af37]/5 transition-all duration-300 disabled:opacity-0 disabled:pointer-events-none top-1/2 -translate-y-1/2"
        style={{ [isRTL ? 'left' : 'right']: '96px' }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* ── Thumbnail strip — inline-end edge ── */}
      <div
        className="absolute top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3"
        style={{ [isRTL ? 'left' : 'right']: '20px' }}
      >
        {slides.map((sl, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Service ${sl.num}`}
            style={{
              width      : active === i ? '48px' : '32px',
              height     : active === i ? '64px' : '32px',
              border     : `1px solid ${active === i ? sl.color + '70' : 'rgba(255,255,255,.1)'}`,
              background : 'transparent',
              cursor     : 'pointer',
              padding    : 0,
              outline    : 'none',
              position   : 'relative',
              overflow   : 'hidden',
              transition : 'width .4s ease, height .4s ease, border-color .4s ease',
            }}
          >
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage   : `url(${sl.bg})`,
              backgroundSize    : 'cover',
              backgroundPosition: 'center',
              filter            : active === i ? 'brightness(.6)' : 'brightness(.3)',
              transition        : 'filter .5s',
            }} />
            <span style={{
              position  : 'absolute',
              bottom    : '3px',
              left      : '50%',
              transform : 'translateX(-50%)',
              fontFamily: "'Inter',system-ui,sans-serif",
              fontSize  : '8px',
              fontWeight: 600,
              color     : active === i ? sl.color : 'rgba(255,255,255,.25)',
              transition: 'color .3s',
              letterSpacing: '.02em',
            }}>{sl.num}</span>
          </button>
        ))}
      </div>

      {/* ── Bottom dots with ring timer ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-5">
        {[0,1,2,3].map((i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="relative w-5 h-5 flex items-center justify-center"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {active === i && (
              <svg
                className="absolute inset-0 w-5 h-5"
                style={{ transform: 'rotate(-90deg)' }}
                viewBox="0 0 20 20"
                aria-hidden
              >
                <circle cx="10" cy="10" r="7" fill="none" stroke={dotColors[i]} strokeWidth="1" strokeOpacity=".25" />
                <circle
                  key={`ring-${active}`}
                  cx="10" cy="10" r="7"
                  fill="none"
                  stroke={dotColors[i]}
                  strokeWidth="1.5"
                  strokeDasharray="44"
                  strokeDashoffset="44"
                  style={{ animation: 'srv-ring 4.5s linear forwards' }}
                />
              </svg>
            )}
            <span style={{
              display        : 'block',
              width          : active === i ? '5px' : '3px',
              height         : active === i ? '5px' : '3px',
              borderRadius   : '50%',
              backgroundColor: active === i ? dotColors[i] : 'rgba(255,255,255,.28)',
              transition     : 'all .4s',
            }} />
          </button>
        ))}
      </div>

      {/* ── Drag hint — visible only on first slide ── */}
      <div
        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 pointer-events-none transition-opacity duration-700"
        style={{ opacity: active === 0 ? 0.4 : 0 }}
        aria-hidden
      >
        {/* Arrow points toward "next" slide: right in LTR, left in RTL */}
        <svg
          className="w-3 h-3 text-white/40"
          style={{
            animation: 'srv-nudge 2s ease-in-out infinite',
            transform: isRTL ? 'rotate(180deg)' : 'none',
          }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-[9px] tracking-[.3em] uppercase text-white/25">
          {isRTL ? 'اسحب' : 'drag'}
        </span>
      </div>

      {/* ── Slides track ── */}
      <div
        ref={trackRef}
        className="flex h-full"
        dir="ltr"
        style={{
          width      : '400%',
          transform  : 'translateX(0%)',
          transition : 'transform .9s cubic-bezier(.77,0,.175,1)',
          willChange : 'transform',
        }}
      >
        {slides.map((sl, si) => (
          <div
            key={sl.tDef}
            className="relative h-full overflow-hidden"
            style={{ width: '25%', flexShrink: 0 }}
          >
            {/* Background image with parallax */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage   : `url(${sl.bg})`,
                backgroundSize    : 'cover',
                backgroundPosition: 'center',
                transform         : active === si ? 'scale(1.05)' : 'scale(1)',
                transition        : 'transform 12s ease-out',
              }}
            />

            {/* Cinematic overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to right, rgba(0,0,0,.75) 0%, rgba(0,0,0,.35) 55%, rgba(0,0,0,.65) 100%)',
              }}
            />

            {/* Vertical accent — on the "start" edge of the slide content */}
            <div
              className="absolute top-[15%] bottom-[15%]"
              style={{
                /* inset-inline-start: 0 = left in LTR, right in RTL */
                [isRTL ? 'right' : 'left']: 0,
                width      : '2px',
                background : `linear-gradient(to bottom, transparent, ${sl.color}, transparent)`,
                opacity    : active === si ? 0.8 : 0,
                transform  : active === si ? 'scaleY(1)' : 'scaleY(0)',
                transition : 'all .7s .3s',
                transformOrigin: 'center',
              }}
            />

            {/* Ghost number */}
            <div
              className="absolute pointer-events-none select-none"
              aria-hidden
              style={{
                fontFamily    : "'Inter',system-ui,sans-serif",
                fontWeight    : 800,
                fontSize      : 'clamp(7rem,14vw,14rem)',
                lineHeight    : 1,
                color         : `${sl.color}10`,
                bottom        : '4%',
                right         : '2%',
                letterSpacing : '-0.05em',
                opacity       : active === si ? 1 : 0,
                transform     : active === si ? 'translateY(0)' : 'translateY(50px)',
                transition    : 'all 1s .15s',
              }}
            >
              {sl.num}
            </div>

            {/* Content — dir attr makes text RTL without breaking slider transform logic */}
            <div
              className={`absolute inset-0 flex items-center ${isRTL ? 'justify-end' : 'justify-start'}`}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div
                className="w-full max-w-2xl"
                style={{
                  /* Logical padding: heavy on start side, light on end side */
                  paddingInlineStart: '5rem',
                  paddingInlineEnd  : '3rem',
                }}
              >
                {/* Eyebrow */}
                <p
                  style={{
                    fontFamily    : "'Montserrat',sans-serif",
                    fontSize      : '10px',
                    letterSpacing : '.45em',
                    textTransform : 'uppercase',
                    color         : sl.color,
                    opacity       : active === si ? 0.9 : 0,
                    transform     : active === si ? 'translateY(0)' : 'translateY(10px)',
                    transition    : 'all .5s .3s',
                    marginBottom  : '14px',
                  }}
                >
                  {isRTL ? 'خدماتنا' : 'Our Services'}
                </p>

                {/* Title */}
                <h3
                  style={{
                    fontFamily    : "'Inter',system-ui,sans-serif",
                    fontSize      : 'clamp(2.5rem,5.5vw,6rem)',
                    fontWeight    : 700,
                    lineHeight    : .95,
                    letterSpacing : '-0.035em',
                    color         : '#fff',
                    marginBottom  : '18px',
                    opacity       : active === si ? 1 : 0,
                    transform     : active === si ? 'translateY(0)' : 'translateY(22px)',
                    transition    : 'all .65s .42s',
                    textShadow    : '0 2px 24px rgba(0,0,0,.8)',
                  }}
                >
                  {homeT(sl.tKey, sl.tDef)}
                </h3>

                {/* Divider line — grows from inline-start edge */}
                <div
                  style={{
                    height     : '1px',
                    width      : active === si ? '55px' : '0px',
                    background : `linear-gradient(to ${isRTL ? 'left' : 'right'}, ${sl.color}, transparent)`,
                    marginBottom: '18px',
                    transition : 'width .55s .56s',
                  }}
                />

                {/* Description */}
                <p
                  style={{
                    fontFamily  : "'Montserrat',sans-serif",
                    fontSize    : 'clamp(.9rem,1.5vw,1.2rem)',
                    fontWeight  : 300,
                    color       : 'rgba(255,255,255,.82)',
                    lineHeight  : 1.8,
                    marginBottom: '24px',
                    opacity     : active === si ? 1 : 0,
                    transform   : active === si ? 'translateY(0)' : 'translateY(15px)',
                    transition  : 'all .55s .62s',
                    textShadow  : '0 1px 12px rgba(0,0,0,.9)',
                  }}
                >
                  {homeT(sl.dKey, sl.dDef)}
                </p>

                {/* Tags */}
                <div
                  style={{
                    display   : 'flex',
                    flexWrap  : 'wrap',
                    gap       : '8px',
                    opacity   : active === si ? 1 : 0,
                    transform : active === si ? 'translateY(0)' : 'translateY(10px)',
                    transition: 'all .5s .72s',
                  }}
                >
                  {sl.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding      : '6px 14px',
                        fontSize     : '10px',
                        fontFamily   : "'Montserrat',sans-serif",
                        letterSpacing: '.22em',
                        textTransform: 'uppercase',
                        color        : sl.color,
                        border       : `1px solid ${sl.color}55`,
                        background   : 'rgba(0,0,0,.45)',
                        backdropFilter: 'blur(6px)',
                        transition   : 'all .3s',
                        cursor       : 'default',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = sl.color;
                        e.currentTarget.style.background  = `${sl.color}20`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${sl.color}55`;
                        e.currentTarget.style.background  = 'rgba(0,0,0,.45)';
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom progress fill */}
            <div
              className="absolute bottom-0 left-0 right-0 h-px"
              style={{ backgroundColor: `${sl.color}20` }}
            >
              <div
                style={{
                  height         : '100%',
                  backgroundColor: sl.color,
                  width          : active === si ? '100%' : '0%',
                  transition     : active === si ? 'width 4.5s linear' : 'width 0s',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ServicesSlider;