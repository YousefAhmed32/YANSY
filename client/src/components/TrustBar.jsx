import { useEffect, useRef, useState } from 'react';

/* ═══════════════════════════════════════════════════════════════
   TrustBar v2 — "Industries We Serve"
   ─────────────────────────────────────────────────────────────
   Psychological role (distinct from Hero & MetricsSection):
     Hero       → "Can you be trusted at a glance?"  (capacity numbers)
     TrustBar   → "Have you worked in MY industry?"  (sector breadth)
     Metrics    → "What outcomes do you produce?"    (outcome numbers)
   ═══════════════════════════════════════════════════════════════ */

/* ── Sector SVG icons ── */
const IconEcommerce = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"
    style={{ width: 26, height: 26 }}>
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const IconHealthcare = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"
    style={{ width: 26, height: 26 }}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const IconSaaS = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"
    style={{ width: 26, height: 26 }}>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    <polyline points="6 9 9 12 13 8 16 11" />
  </svg>
);

const IconEnterprise = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"
    style={{ width: 26, height: 26 }}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IconEducation = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"
    style={{ width: 26, height: 26 }}>
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const IconBooking = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"
    style={{ width: 26, height: 26 }}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
  </svg>
);

/* ── Single sector card ── */
const SectorCard = ({ sector, isRTL, index, animate }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      ref.current.style.opacity = '1';
      ref.current.style.transform = 'none';
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          ref.current.style.transition = `opacity .6s ${index * 0.08}s ease, transform .6s ${index * 0.08}s ease`;
          ref.current.style.opacity = '1';
          ref.current.style.transform = 'translateY(0)';
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [index]);

  return (
    <div
      ref={ref}
      className="group relative flex flex-col items-center py-8 sm:py-10 px-4 sm:px-6 cursor-default
        transition-all duration-400"
      style={{
        opacity: 0,
        transform: 'translateY(16px)',
        /* border-inline-end respects dir — right border in LTR, left border in RTL */
        borderInlineEnd: '1px solid rgba(255,255,255,.05)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,.025)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Hover top accent line */}
      <div
        aria-hidden
        className="absolute top-0 left-1/2 -translate-x-1/2 h-px transition-all duration-400"
        style={{ width: 0, background: 'linear-gradient(to right, transparent, #d4af37, transparent)' }}
        ref={(el) => {
          if (!el) return;
          const p = el.parentElement;
          const show = () => { el.style.width = '60%'; };
          const hide = () => { el.style.width = '0'; };
          p.addEventListener('mouseenter', show);
          p.addEventListener('mouseleave', hide);
        }}
      />

      {/* Icon */}
      <div
        className="mb-4 transition-all duration-300 group-hover:scale-110 origin-center"
        style={{ color: 'rgba(212,175,55,.55)' }}
      >
        {sector.icon}
      </div>

      {/* Sector name */}
      <h3
        className="text-sm font-semibold text-center mb-2 leading-snug"
        style={{
          color        : 'rgba(255,255,255,.88)',
          letterSpacing: isRTL ? '0' : '-0.01em',
          lineHeight   : isRTL ? 1.5 : 1.35,
        }}
      >
        {isRTL ? sector.nameAR : sector.nameEN}
      </h3>

      {/* Outcome */}
      <p
        className="text-[10px] font-normal text-center leading-relaxed"
        style={{ color: 'rgba(212,175,55,.55)', maxWidth: 140 }}
      >
        {isRTL ? sector.descAR : sector.descEN}
      </p>
    </div>
  );
};

/* ── Main component ── */
const TrustBar = ({ isRTL }) => {
  const ref          = useRef(null);
  const [fired, setFired] = useState(false);

  const sectors = [
    {
      icon   : <IconEcommerce />,
      nameEN : 'E-commerce',
      nameAR : 'التجارة الإلكترونية',
      descEN : '+40% avg. conversion uplift vs. previous platforms',
      descAR : 'زيادة 40% في التحويل مقارنة بالمنصات السابقة',
    },
    {
      icon   : <IconHealthcare />,
      nameEN : 'Healthcare',
      nameAR : 'الرعاية الصحية',
      descEN : 'Up to 80% fewer no-shows with automated booking',
      descAR : 'تقليل الغيابات 80% بأنظمة الحجز التلقائية',
    },
    {
      icon   : <IconSaaS />,
      nameEN : 'SaaS & Tech',
      nameAR : 'SaaS والتقنية',
      descEN : 'MVPs shipped in 6–10 weeks, not 6–10 months',
      descAR : 'إطلاق MVPs في 6-10 أسابيع، لا أشهر',
    },
    {
      icon   : <IconEnterprise />,
      nameEN : 'Enterprise',
      nameAR : 'المؤسسات',
      descEN : '60% less admin time after deploying custom systems',
      descAR : 'توفير 60% من وقت الإدارة بعد الأنظمة المخصصة',
    },
    {
      icon   : <IconEducation />,
      nameEN : 'EdTech',
      nameAR : 'التعليم',
      descEN : 'Full platform ownership — no revenue sharing or limits',
      descAR : 'ملكية كاملة للمنصة — لا مشاركة إيرادات أو قيود',
    },
    {
      icon   : <IconBooking />,
      nameEN : 'Booking & Hospitality',
      nameAR : 'الحجز والضيافة',
      descEN : 'Calendars that fill themselves — 24/7, automatically',
      descAR : 'تقويمات تمتلئ تلقائياً — 24 ساعة، 7 أيام',
    },
  ];

  /* Trigger reveal on first visibility */
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setFired(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      aria-label={isRTL ? 'الصناعات التي نخدمها' : 'Industries we serve'}
      style={{
        background  : 'linear-gradient(180deg,#000 0%,#030200 50%,#000 100%)',
        borderTop   : '1px solid rgba(255,255,255,.04)',
        borderBottom: '1px solid rgba(255,255,255,.04)',
        position    : 'relative',
        overflow    : 'hidden',
      }}
    >
      {/* Subtle center glow */}
      <div
        aria-hidden
        style={{
          position    : 'absolute',
          top         : '50%',
          left        : '50%',
          transform   : 'translate(-50%,-50%)',
          width       : '60vw',
          height      : '100%',
          background  : 'radial-gradient(ellipse at center,rgba(212,175,55,.02) 0%,transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          maxWidth : 1280,
          margin   : '0 auto',
          padding  : '0 clamp(16px,5vw,48px)',
          position : 'relative',
          zIndex   : 1,
        }}
      >
        {/* Eyebrow label */}
        <div
          style={{
            paddingTop   : 'clamp(20px,3vw,32px)',
            paddingBottom: 'clamp(8px,1.5vw,16px)',
            textAlign    : 'center',
          }}
        >
          <p style={{
            fontSize     : 10,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            color        : 'rgba(212,175,55,.6)',
            fontWeight   : 500,
          }}>
            {isRTL ? 'نتائج حقيقية عبر 6 قطاعات' : 'Proven results across 6 industries'}
          </p>
        </div>

        {/* Sectors grid — border-inline-start is the logical start edge */}
        <div
          className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 ${isRTL ? 'rtl' : ''}`}
          style={{ borderInlineStart: '1px solid rgba(255,255,255,.05)' }}
        >
          {sectors.map((s, i) => (
            <SectorCard
              key={i}
              sector={s}
              isRTL={isRTL}
              index={i}
              animate={fired}
            />
          ))}
        </div>

        {/* Bottom label */}
        <div
          className="text-center py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,.04)' }}
        >
          <p style={{
            fontSize     : 10,
            letterSpacing: '.05em',
            textTransform: 'uppercase',
            color        : 'rgba(255,255,255,.22)',
            fontWeight   : 400,
          }}>
            {isRTL
              ? 'من المشاريع الناشئة إلى المؤسسات الكبيرة — نتائج قابلة للقياس في كل قطاع'
              : 'From pre-revenue startups to enterprise — measurable outcomes across every sector'}
          </p>
        </div>
      </div>
    </section>
  );
};

export default TrustBar;
