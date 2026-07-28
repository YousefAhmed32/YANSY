import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import SectionHeader from './SectionHeader';
import Reveal from './Reveal';

const FONT_EN = "'Inter',system-ui,sans-serif";
const FONT_AR = "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif";

/* Same 8 industries as the Industries page — icons/keys/accents kept identical
   so the two pages read as one system. Copy here is a short one-line hook,
   deliberately NOT the Industries page's fuller problem/solutions copy — this
   section's only job is to get someone to click through. */
const ICONS = {
  restaurant: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22" aria-hidden>
      <path d="M7 2v7a2 2 0 002 2v11M7 2a2 2 0 00-2 2v5a2 2 0 002 2M11 2v9M17 2c-1.5 0-3 1.5-3 4v3a2 2 0 002 2h1v10" />
    </svg>
  ),
  medical: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22" aria-hidden>
      <path d="M12 2a2 2 0 012 2v4h4a2 2 0 012 2v4a2 2 0 01-2 2h-4v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4H4a2 2 0 01-2-2v-4a2 2 0 012-2h4V4a2 2 0 012-2h4z" />
    </svg>
  ),
  academy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22" aria-hidden>
      <path d="M22 10L12 5 2 10l10 5 10-5z" /><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" />
    </svg>
  ),
  realestate: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22" aria-hidden>
      <path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" />
    </svg>
  ),
  hotel: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22" aria-hidden>
      <path d="M3 21V7a2 2 0 012-2h6v16M3 21h18M11 21V9h8a2 2 0 012 2v10M7 9h.01M7 13h.01" />
    </svg>
  ),
  factory: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22" aria-hidden>
      <path d="M2 21V11l6 4v-4l6 4V8l6 4v9H2z" />
    </svg>
  ),
  startup: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22" aria-hidden>
      <path d="M12 2a10 10 0 00-8 16l3-3M12 2a10 10 0 018 16l-3-3M9 15l-3 6 6-3M15 15l3 6-6-3" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  ecommerce: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22" aria-hidden>
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </svg>
  ),
};

const INDUSTRIES = [
  { key: 'restaurant',  accent: '#EA580C', titleEN: 'Restaurants & Food',   titleAR: 'المطاعم والأغذية',    hookEN: 'Multi-branch orders, kitchen displays, and delivery — unified.', hookAR: 'طلبات متعددة الفروع وشاشات مطبخ وتوصيل — كلها موحّدة.' },
  { key: 'medical',     accent: '#0891B2', titleEN: 'Healthcare & Clinics', titleAR: 'الرعاية الصحية',      hookEN: 'Patient booking and records that just work.',                    hookAR: 'حجز وسجلات مرضى تعمل بسلاسة.' },
  { key: 'realestate',  accent: '#2563EB', titleEN: 'Real Estate',          titleAR: 'العقارات',            hookEN: 'Listings, leads, and tours — under one roof.',                   hookAR: 'قوائم وعملاء وجولات — في مكان واحد.' },
  { key: 'academy',     accent: '#7C3AED', titleEN: 'Education & Academies',titleAR: 'التعليم والأكاديميات', hookEN: 'Courses, certificates, and progress — one platform.',            hookAR: 'دورات وشهادات ومتابعة تقدّم في منصة واحدة.' },
  { key: 'hotel',       accent: '#0E7490', titleEN: 'Hotels & Hospitality', titleAR: 'الفنادق والضيافة',    hookEN: 'Direct bookings, without the commission tax.',                   hookAR: 'حجوزات مباشرة، بلا ضريبة عمولة.' },
  { key: 'factory',     accent: '#D97706', titleEN: 'Manufacturing',        titleAR: 'التصنيع',             hookEN: 'Production, inventory, and orders — finally connected.',        hookAR: 'الإنتاج والمخزون والطلبات — أخيرًا متصلة.' },
  { key: 'startup',     accent: '#059669', titleEN: 'Startups & SaaS',      titleAR: 'الشركات الناشئة',      hookEN: 'From validated idea to production-grade platform.',              hookAR: 'من فكرة مُثبتة إلى منصة جاهزة للإنتاج.' },
  { key: 'ecommerce',   accent: '#DC2626', titleEN: 'E-commerce & Retail',  titleAR: 'التجارة الإلكترونية',  hookEN: 'Storefronts built for speed and conversion.',                    hookAR: 'متاجر مبنية للسرعة والتحويل.' },
];

const IndustryTile = ({ industry, isRTL }) => {
  const [hovered, setHovered] = useState(false);
  const font = isRTL ? FONT_AR : FONT_EN;
  return (
    <Link
      to="/industries"
      data-industry-tile
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', display: 'block', textDecoration: 'none',
        background: hovered ? `linear-gradient(160deg, ${industry.accent}08 0%, #FFFFFF 60%)` : '#FFFFFF',
        border: `1px solid ${hovered ? `${industry.accent}45` : '#E8EBF0'}`,
        borderRadius: 18, padding: 'clamp(20px, 2.2vw, 28px)',
        overflow: 'hidden',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? `0 16px 40px ${industry.accent}1c, 0 4px 12px rgba(13,17,23,0.04)` : '0 1px 2px rgba(13,17,23,0.02)',
        transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s cubic-bezier(0.16,1,0.3,1), border-color 0.3s, background 0.4s',
      }}
    >
      {/* Ambient corner glow on hover */}
      <div aria-hidden style={{
        position: 'absolute', top: -30, [isRTL ? 'left' : 'right']: -30, width: 100, height: 100, borderRadius: '50%',
        background: industry.accent, opacity: hovered ? 0.1 : 0, filter: 'blur(30px)',
        transition: 'opacity 0.4s ease', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12, flexShrink: 0,
            background: hovered ? industry.accent : `${industry.accent}0D`,
            border: `1px solid ${hovered ? industry.accent : `${industry.accent}22`}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: hovered ? '#FFFFFF' : industry.accent,
            transform: hovered ? 'scale(1.08) rotate(-4deg)' : 'scale(1) rotate(0deg)',
            transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            {ICONS[industry.key]}
          </div>
          <ArrowUpRight style={{
            width: 17, height: 17, color: industry.accent, flexShrink: 0,
            opacity: hovered ? 1 : 0, transform: hovered ? 'translate(0,0)' : (isRTL ? 'translate(4px,4px)' : 'translate(-4px,4px)'),
            transition: 'opacity 0.25s ease, transform 0.3s cubic-bezier(0.16,1,0.3,1)',
          }} />
        </div>

        <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
          <h3 style={{
            margin: '0 0 6px', fontSize: 'clamp(0.95rem, 1.15vw, 1.05rem)', fontWeight: 700, color: '#0D1117',
            letterSpacing: isRTL ? 0 : '-0.015em', lineHeight: 1.25, fontFamily: font,
          }}>
            {isRTL ? industry.titleAR : industry.titleEN}
          </h3>
          <p style={{ margin: 0, fontSize: 12.5, color: '#5C6370', lineHeight: 1.6, fontFamily: font }}>
            {isRTL ? industry.hookAR : industry.hookEN}
          </p>
        </div>
      </div>
    </Link>
  );
};

const IndustriesPreview = () => {
  const { isRTL } = useLanguage();

  return (
    <section
      dir={isRTL ? 'rtl' : 'ltr'}
      className="section-shell section-shell--plain"
      aria-label={isRTL ? 'القطاعات التي نخدمها' : 'Industries we serve'}
    >
      <style>{`
        .industries-preview-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: clamp(12px, 1.5vw, 18px);
        }
        @media (max-width: 1024px) { .industries-preview-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px)  { .industries-preview-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="section-inner">
        <SectionHeader
          eyebrow={isRTL ? 'القطاعات التي نخدمها' : 'Industries We Serve'}
          title={isRTL ? 'كل قطاع يعمل بطريقته.\nنبني وفقًا لذلك.' : 'Every industry runs differently.\nWe build accordingly.'}
          lead={isRTL
            ? 'من المطاعم إلى العقارات — برمجيات مصمَّمة حول عملياتك الفعلية، لا قوالب عامة.'
            : 'From restaurants to real estate — software shaped around your actual operations, not a generic template.'}
          maxLeadWidth={380}
          action={
            <Link
              to="/industries"
              className="industries-preview-cta"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0,
                fontSize: 13.5, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none',
                flexDirection: isRTL ? 'row-reverse' : 'row',
              }}
            >
              {isRTL ? 'استكشف كل القطاعات' : 'Explore All Industries'}
              <ArrowRight style={{ width: 15, height: 15, transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
            </Link>
          }
        />

        {/* Grid. Tiles animate on hover, so each gets its own reveal wrapper
            rather than sharing a node with the hover transform. */}
        <Reveal stagger className="industries-preview-grid" step={0.05} distance={24}>
          {INDUSTRIES.map((industry) => (
            <IndustryTile key={industry.key} industry={industry} isRTL={isRTL} />
          ))}
        </Reveal>
      </div>

      <style>{`
        .industries-preview-cta svg { transition: transform 0.25s cubic-bezier(0.16,1,0.3,1); }
        .industries-preview-cta:hover svg { transform: ${isRTL ? 'scaleX(-1) translateX(3px)' : 'translateX(3px)'}; }
      `}</style>
    </section>
  );
};

export default IndustriesPreview;
