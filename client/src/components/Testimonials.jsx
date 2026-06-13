import { useEffect, useState, useRef } from 'react';
import api from '../utils/api';

/* ═══════════════════════════════════════════════════════════════
   Testimonials — Premium masonry-grid with static fallback
   ═══════════════════════════════════════════════════════════════ */

const STATIC_TESTIMONIALS = [
  {
    _id         : 'st1',
    name        : 'Ahmed Al-Rashidi',
    role        : 'Founder, NexusCommerce',
    projectTitle: 'E-commerce Platform',
    reviewText  : 'YANSY built our entire online store from scratch. The quality exceeded our expectations and sales increased significantly in the first weeks after launch. Their attention to performance and UX was remarkable.',
    rating      : 5,
    initials    : 'AR',
  },
  {
    _id         : 'st2',
    name        : 'Sarah Mohamed',
    role        : 'Director, MedCare Clinics',
    projectTitle: 'Medical Booking System',
    reviewText  : "Outstanding work. They delivered a complete clinic management system on time and within budget. Communication throughout the project was excellent — always proactive, never reactive.",
    rating      : 5,
    initials    : 'SM',
  },
  {
    _id         : 'st3',
    name        : 'Khalid Al-Thani',
    role        : 'CTO, Vault Analytics',
    projectTitle: 'SaaS Dashboard',
    reviewText  : 'Professional team with deep technical expertise. They transformed our complex data pipeline into a beautiful, intuitive dashboard. Our non-technical team actually uses it now — which was the real goal.',
    rating      : 5,
    initials    : 'KA',
  },
  {
    _id         : 'st4',
    name        : 'Layla Ibrahim',
    role        : 'CEO, AcademyEdge',
    projectTitle: 'Educational Platform',
    reviewText  : 'We launched our online academy with YANSY and the platform they built is world-class. Student enrollment doubled within the first month. The LMS they built saved us thousands in recurring platform fees.',
    rating      : 5,
    initials    : 'LI',
  },
  {
    _id         : 'st5',
    name        : 'Omar Faris',
    role        : 'VP Sales, GrowthCRM',
    projectTitle: 'CRM System',
    reviewText  : 'The CRM YANSY built completely transformed how we manage clients. Response times improved, follow-ups are automated, and we never miss an opportunity. ROI was visible within 60 days of launch.',
    rating      : 5,
    initials    : 'OF',
  },
  {
    _id         : 'st6',
    name        : 'Nora Al-Sayed',
    role        : 'Brand Director',
    projectTitle: 'Corporate Website',
    reviewText  : "From concept to launch in three weeks. The design is stunning, performance is exceptional, and our brand finally looks premium online. Multiple clients mentioned the website before even asking about our services.",
    rating      : 5,
    initials    : 'NS',
  },
];

/* ── Geometric Avatar — premium alternative to plain initials ── */
const GeoAvatar = ({ initials = '?', size = 42 }) => {
  // Use char codes as a deterministic seed for pattern variation
  const a = initials.charCodeAt(0) || 65;
  const b = initials.charCodeAt(1) || 65;
  const seed = (a * 7 + b * 13) % 4; // 0–3 distinct patterns
  const gold = '#d4af37';
  const dim  = 'rgba(212,175,55,0.18)';

  const patterns = [
    // Pattern 0: diamond corner marks
    <>
      <rect x="2" y="2" width="8" height="1" fill={dim} />
      <rect x="2" y="2" width="1" height="8" fill={dim} />
      <rect x={size-10} y="2" width="8" height="1" fill={dim} />
      <rect x={size-3} y="2" width="1" height="8" fill={dim} />
      <rect x="2" y={size-3} width="8" height="1" fill={dim} />
      <rect x="2" y={size-10} width="1" height="8" fill={dim} />
      <rect x={size-10} y={size-3} width="8" height="1" fill={dim} />
      <rect x={size-3} y={size-10} width="1" height="8" fill={dim} />
    </>,
    // Pattern 1: center crosshair
    <>
      <line x1={size/2} y1="4" x2={size/2} y2="12" stroke={dim} strokeWidth="1" />
      <line x1={size/2} y1={size-12} x2={size/2} y2={size-4} stroke={dim} strokeWidth="1" />
      <line x1="4" y1={size/2} x2="12" y2={size/2} stroke={dim} strokeWidth="1" />
      <line x1={size-12} y1={size/2} x2={size-4} y2={size/2} stroke={dim} strokeWidth="1" />
    </>,
    // Pattern 2: dots
    <>
      {[4,size-5].map((cx) => [4,size-5].map((cy) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.2" fill={dim} />
      )))}
      <circle cx={size/2} cy="4" r="1" fill={dim} />
      <circle cx={size/2} cy={size-4} r="1" fill={dim} />
    </>,
    // Pattern 3: diagonal lines
    <>
      <line x1="2" y1="2" x2="10" y2="10" stroke={dim} strokeWidth="1" />
      <line x1={size-2} y1="2" x2={size-10} y2="10" stroke={dim} strokeWidth="1" />
      <line x1="2" y1={size-2} x2="10" y2={size-10} stroke={dim} strokeWidth="1" />
      <line x1={size-2} y1={size-2} x2={size-10} y2={size-10} stroke={dim} strokeWidth="1" />
    </>,
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {/* Background */}
      <rect width={size} height={size} fill="rgba(212,175,55,0.06)" rx="2" />
      {/* Border */}
      <rect width={size} height={size} fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="1" rx="2" />
      {/* Pattern */}
      {patterns[seed]}
      {/* Initials — centered */}
      <text
        x={size / 2}
        y={size / 2 + 5}
        textAnchor="middle"
        fill={gold}
        fontSize="13"
        fontFamily="'Inter',system-ui,sans-serif"
        fontWeight="600"
        letterSpacing="0.04em"
      >
        {initials.slice(0, 2).toUpperCase()}
      </text>
    </svg>
  );
};

const StarRow = ({ rating = 5 }) => (
  <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
    {Array.from({ length: 5 }).map((_, i) => (
      <svg key={i} width="13" height="13" viewBox="0 0 24 24"
        fill={i < rating ? '#d4af37' : 'rgba(212,175,55,.14)'}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ))}
  </div>
);

const Card = ({ item, index }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          const el = ref.current;
          el.style.transition = `opacity .7s ${index * 0.07}s ease, transform .7s ${index * 0.07}s ease`;
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [index]);

  const rating  = typeof item.ratings === 'object'
    ? Math.round(item.ratings.overall ?? 5)
    : (item.rating ?? 5);
  const initial = item.initials || item.name?.charAt(0).toUpperCase() || '?';

  return (
    <article
      ref={ref}
      style={{
        opacity      : 0,
        transform    : 'translateY(28px)',
        background   : 'rgba(255,255,255,.025)',
        border       : '1px solid rgba(255,255,255,.065)',
        padding      : '28px 28px 24px',
        display      : 'flex',
        flexDirection: 'column',
        transition   : 'border-color .35s, background .35s, transform .35s',
        position     : 'relative',
        overflow     : 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(212,175,55,.22)';
        e.currentTarget.style.background  = 'rgba(255,255,255,.04)';
        e.currentTarget.style.transform   = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,.065)';
        e.currentTarget.style.background  = 'rgba(255,255,255,.025)';
        e.currentTarget.style.transform   = 'translateY(0)';
      }}
    >
      {/* Top gold accent (hover) */}
      <div
        aria-hidden
        style={{
          position  : 'absolute',
          top       : 0, left: 0, right: 0,
          height    : '1px',
          background: 'linear-gradient(to right, transparent, rgba(212,175,55,.4), transparent)',
          opacity   : 0,
          transition: 'opacity .35s',
        }}
        ref={(el) => {
          if (!el) return;
          const p = el.parentElement;
          if (!p) return;
          const onE = () => { el.style.opacity = '1'; };
          const onL = () => { el.style.opacity = '0'; };
          p.addEventListener('mouseenter', onE);
          p.addEventListener('mouseleave', onL);
        }}
      />

      {/* Opening quote mark */}
      <svg
        width="26" height="18" viewBox="0 0 28 20"
        fill="rgba(212,175,55,.2)"
        style={{ marginBottom: 16, flexShrink: 0 }}
        aria-hidden
      >
        <path d="M0 20V12.667C0 9.556 1.111 6.89 3.333 4.667 5.556 2.444 8.444.889 12 0l1.333 2.667C9.778 3.556 7.778 5 6.333 7S4.444 11.111 4.444 13.333H8V20H0zm16 0V12.667c0-3.111 1.111-5.778 3.333-8 2.222-2.223 5.11-3.778 8.667-4.667L29.333 2.667C25.778 3.556 23.778 5 22.333 7S20.444 11.111 20.444 13.333H24V20H16z" />
      </svg>

      <StarRow rating={rating} />

      {/* Review text */}
      <p style={{
        fontSize             : 13.5,
        lineHeight           : 1.78,
        color                : 'rgba(255,255,255,.65)',
        fontWeight           : 300,
        flex                 : 1,
        marginBottom         : 22,
        display              : '-webkit-box',
        WebkitLineClamp      : 5,
        WebkitBoxOrient      : 'vertical',
        overflow             : 'hidden',
      }}>
        {item.reviewText}
      </p>

      {/* Author */}
      <div style={{
        display    : 'flex',
        alignItems : 'center',
        gap        : 12,
        borderTop  : '1px solid rgba(255,255,255,.05)',
        paddingTop : 18,
      }}>
        {/* Geometric Avatar */}
        <GeoAvatar initials={initial} size={42} />
        <div>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,.88)', fontWeight: 400 }}>
            {item.name}
          </p>
          {item.role && (
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,.32)', marginTop: 1, fontWeight: 300 }}>
              {item.role}
            </p>
          )}
          {item.projectTitle && (
            <p style={{ margin: 0, fontSize: 10, color: 'rgba(212,175,55,.5)', marginTop: 2, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              {item.projectTitle}
            </p>
          )}
        </div>
      </div>
    </article>
  );
};

/* ── Main ── */
const Testimonials = ({ isRTL = false }) => {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const titleRef = useRef(null);

  useEffect(() => {
    api.get('/feedback/testimonials?limit=6')
      .then((r) => {
        const data = r.data?.testimonials ?? [];
        setItems(data.length >= 3 ? data : STATIC_TESTIMONIALS);
      })
      .catch(() => setItems(STATIC_TESTIMONIALS))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!titleRef.current || loading) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          titleRef.current.style.transition = 'opacity .9s ease, transform .9s ease';
          titleRef.current.style.opacity = '1';
          titleRef.current.style.transform = 'translateY(0)';
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(titleRef.current);
    return () => io.disconnect();
  }, [loading]);

  if (loading) return null;

  return (
    <section
      id="testimonials"
      style={{
        background : 'linear-gradient(180deg, #000 0%, #040301 50%, #000 100%)',
        padding    : 'clamp(64px,10vw,120px) clamp(16px,5vw,48px)',
      }}
      aria-label={isRTL ? 'آراء العملاء' : 'Client testimonials'}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }} dir={isRTL ? 'rtl' : 'ltr'}>

        {/* ── Header ── */}
        <div
          ref={titleRef}
          style={{
            opacity    : 0,
            transform  : 'translateY(24px)',
            marginBottom: 'clamp(40px,6vw,72px)',
          }}
        >
          <div style={{
            display        : 'flex',
            alignItems     : 'center',
            gap            : 14,
            marginBottom   : 20,
            justifyContent : isRTL ? 'flex-end' : 'flex-start',
            flexDirection  : isRTL ? 'row-reverse' : 'row',
          }}>
            <span style={{
              display   : 'block',
              width     : 40,
              height    : 1,
              background: `linear-gradient(to ${isRTL ? 'left' : 'right'}, #d4af37, transparent)`,
            }} />
            <p style={{
              fontSize      : 10,
              letterSpacing : '.35em',
              textTransform : 'uppercase',
              color         : 'rgba(212,175,55,.6)',
              margin        : 0,
              fontWeight    : 300,
            }}>
              {isRTL ? 'ماذا يقول عملاؤنا' : 'Client Testimonials'}
            </p>
          </div>

          <h2 style={{
            fontFamily  : "'Inter',system-ui,sans-serif",
            fontSize    : 'clamp(2rem,4vw,3.75rem)',
            fontWeight  : 700,
            lineHeight  : 1.06,
            letterSpacing: '-0.03em',
            color       : '#fff',
            margin      : 0,
            textAlign   : isRTL ? 'right' : 'left',
          }}>
            {isRTL ? 'نتائج حقيقية،' : 'Real results,'}
            <br />
            <span style={{
              color                  : 'transparent',
              backgroundImage        : 'linear-gradient(135deg, #d4af37 0%, rgba(255,255,255,.65) 60%)',
              WebkitBackgroundClip   : 'text',
              backgroundClip         : 'text',
            }}>
              {isRTL ? 'عملاء سعداء' : 'happy clients'}
            </span>
          </h2>
        </div>

        {/* ── Cards grid ── */}
        <div style={{
          display              : 'grid',
          gridTemplateColumns  : 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
          gap                  : 16,
        }}>
          {items.slice(0, 6).map((item, i) => (
            <Card key={item._id} item={item} index={i} />
          ))}
        </div>

        {/* ── Bottom CTA ── */}
        <div style={{ marginTop: 52, textAlign: 'center' }}>
          <a
            href={`https://wa.me/201090385390?text=${encodeURIComponent(
              isRTL ? 'مرحباً! أريد التحدث عن مشروع.' : "Hello! I'd like to discuss a project."
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display        : 'inline-flex',
              alignItems     : 'center',
              gap            : 10,
              padding        : '14px 32px',
              border         : '1px solid rgba(212,175,55,.3)',
              color          : 'rgba(212,175,55,.75)',
              fontSize       : 10,
              letterSpacing  : '.24em',
              textTransform  : 'uppercase',
              textDecoration : 'none',
              fontWeight     : 300,
              transition     : 'all .3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(212,175,55,.65)';
              e.currentTarget.style.color       = '#d4af37';
              e.currentTarget.style.background  = 'rgba(212,175,55,.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(212,175,55,.3)';
              e.currentTarget.style.color       = 'rgba(212,175,55,.75)';
              e.currentTarget.style.background  = 'transparent';
            }}
          >
            {isRTL ? 'انضم لعملائنا السعداء' : 'Join our happy clients'}
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>

      </div>
    </section>
  );
};

export default Testimonials;
