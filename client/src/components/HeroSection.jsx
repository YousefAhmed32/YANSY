import { useState, useEffect, forwardRef } from 'react';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { trackCTAClick } from '../utils/ga4';

const SERVICES_EN = ['Websites', 'E-commerce', 'SaaS', 'Mobile Apps', 'ERP & CRM', 'Automation'];
const SERVICES_AR = ['مواقع ويب', 'متاجر إلكترونية', 'SaaS', 'تطبيقات موبايل', '⁦ERP و CRM⁩', 'أتمتة'];

/* Proof stats live in the hero rather than in a strip below it. They used to be
   a separate 159px-tall section immediately after a 1029px video block, which
   read as a stray sliver between two heavy blocks — and pushed the only hard
   numbers on the page below the fold. The hero is min-height:100vh and its
   content only filled ~750px of that, so this occupies space that was empty. */
const STATS_EN = [
  { num: '50+',  label: 'Projects delivered',  sub: 'Across 6+ industries' },
  { num: '98%',  label: 'Client satisfaction', sub: 'Measured retention' },
  { num: '14d',  label: 'Average launch',      sub: 'Contract to live' },
  { num: '4+',   label: 'Years building',      sub: 'Since 2020' },
];
const STATS_AR = [
  { num: '50+',       label: 'مشروع مُسلَّم',     sub: 'في أكثر من 6 قطاعات' },
  { num: '98%',       label: 'رضا العملاء',       sub: 'معدل احتفاظ مقاس' },
  { num: '14 يوم',    label: 'متوسط الإطلاق',     sub: 'من العقد للنشر' },
  { num: '4+',        label: 'سنوات خبرة',        sub: 'منذ 2020' },
];

const HeroSection = forwardRef(function HeroSection({ onStartProject }, ref) {
  const { isRTL } = useLanguage();
  const [loaded, setLoaded] = useState(false);
  // The headline's manual line breaks are tuned for the desktop copy width; at
  // phone widths the font floor makes each hard-broken line wrap a 2nd time on
  // its own, ballooning the hero's height. Below 640px we skip the <br> and let
  // the browser wrap the whole headline naturally against the real container
  // width instead. (Rendered conditionally, not just CSS-hidden, so a display:none
  // <br> can't leave a stray inline box behind in the line-height calculation.)
  const [stackHeadline, setStackHeadline] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 640 : true
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const handler = () => setStackHeadline(mq.matches);
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setLoaded(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  const fly = (delay = 0) => ({
    opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(28px)',
    transition: `opacity 0.8s ${delay}s cubic-bezier(0.16,1,0.3,1), transform 0.8s ${delay}s cubic-bezier(0.16,1,0.3,1)`,
  });

  const services = isRTL ? SERVICES_AR : SERVICES_EN;
  const stats    = isRTL ? STATS_AR : STATS_EN;
  const lang     = isRTL ? 'ar' : 'en';

  return (
    <>
      <style>{`
        .hero-section {
          background-size: cover;
          background-position: center center;
          background-repeat: no-repeat;
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          /* 68px clears the fixed Header (Header.jsx height); rest is breathing room */
          padding-top: calc(68px + clamp(1.5rem, 3vw, 3rem));
          padding-bottom: 0;
          padding-left: clamp(1.25rem, 5vw, 3rem);
          padding-right: clamp(1.25rem, 5vw, 3rem);
          position: relative;
          overflow: hidden;
        }
        /* The artwork is a 6688px-wide master; serving it at that size cost
           1.38MB on the LCP element. Three WebP widths, picked by media query
           rather than image-set() so the selection is predictable and the
           browser only ever fetches one. */
        .hero-section { background-image: url('/hero-${lang}-768.webp'); }
        @media (min-width: 769px)  { .hero-section { background-image: url('/hero-${lang}-1280.webp'); } }
        @media (min-width: 1281px) { .hero-section { background-image: url('/hero-${lang}-1920.webp'); } }

        .hero-inner {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        /* Below 1024px the artwork sits directly behind the full-width text, so
           its baked-in label bubbles collide with the headline. A soft white
           scrim keeps the copy legible without losing the art entirely. */
        @media (max-width: 1023px) {
          .hero-section::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, rgba(255,255,255,0.93) 0%, rgba(255,255,255,0.85) 45%, rgba(255,255,255,0.93) 100%);
            z-index: 0;
            pointer-events: none;
          }
        }
        .hero-grid {
          display: grid;
          grid-template-columns: 1fr;
          align-items: center;
        }
        /* The right track is deliberately empty: it is the window onto the
           artwork's isometric city, which carries its own industry labels. */
        @media (min-width: 1024px) {
          .hero-grid { grid-template-columns: 58fr 42fr; }
        }
        .hero-h1 {
          font-size: var(--text-hero);
          font-weight: 800;
          line-height: 0.98;
          letter-spacing: -0.045em;
          color: #0F172A;
          margin: 0 0 clamp(18px, 2.5vh, 30px);
          font-family: 'Inter', system-ui, sans-serif;
        }
        [dir="rtl"] .hero-h1 {
          font-family: 'IBM Plex Sans Arabic', 'Alexandria', system-ui, sans-serif;
          letter-spacing: 0 !important;
          line-height: 1.22;
          font-size: clamp(2.5rem, 6vw, 4.5rem);
        }
        .hero-service-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: clamp(20px, 3vh, 30px);
        }
        .hero-service-pill {
          font-size: 11px;
          font-weight: 600;
          color: #374151;
          background: #FFFFFF;
          border: 1px solid #E8EBF0;
          padding: 5px 12px;
          border-radius: 100px;
          white-space: nowrap;
          transition: border-color 0.18s, color 0.18s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          cursor: default;
        }
        .hero-service-pill:hover {
          border-color: #C9CDD6;
          color: #0D1117;
        }
        .hero-cta-group {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .hero-cta-wa {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 22px;
          font-size: 13.5px;
          font-weight: 600;
          color: #374151;
          background: #FFFFFF;
          border: 1.5px solid #E8EBF0;
          border-radius: 10px;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
          transition: border-color 0.2s, background 0.2s, transform 0.15s, color 0.2s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        .hero-cta-wa:hover {
          border-color: #C9CDD6;
          background: #F6F7F9;
          color: #0D1117;
          transform: translateY(-1px);
        }

        /* ── Proof rail, anchored to the bottom of the 100vh hero ── */
        .hero-stats {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1280px;
          margin: clamp(2.5rem, 5vh, 4rem) auto 0;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid rgba(13,17,23,0.08);
        }
        .hero-stat {
          padding: clamp(1rem, 2.2vh, 1.5rem) clamp(0.5rem, 1.5vw, 1.25rem);
          border-inline-end: 1px solid rgba(13,17,23,0.06);
        }
        .hero-stat:last-child { border-inline-end: none; }
        .hero-stat-num {
          font-size: clamp(1.375rem, 2.2vw, 1.875rem);
          font-weight: 800;
          color: #0D1117;
          letter-spacing: -0.035em;
          line-height: 1.1;
          font-variant-numeric: tabular-nums;
          margin-bottom: 2px;
        }
        [dir="rtl"] .hero-stat-num { letter-spacing: 0; }
        .hero-stat-label { font-size: 12px; font-weight: 700; color: #374151; line-height: 1.35; }
        .hero-stat-sub   { font-size: 10.5px; color: #9BA3AE; font-weight: 500; line-height: 1.4; margin-top: 1px; }

        /* Two-up below the tablet breakpoint; the 4-across rail can't hold
           legible numbers and two lines of label under ~640px. */
        @media (max-width: 640px) {
          .hero-stats { grid-template-columns: repeat(2, 1fr); }
          .hero-stat:nth-child(2) { border-inline-end: none; }
          .hero-stat:nth-child(-n+2) { border-bottom: 1px solid rgba(13,17,23,0.06); }
          .hero-stat-sub { display: none; }
        }
        /* Short viewports (landscape phones, small laptops) can't fit hero copy
           and a stat rail in 100vh — let the section grow instead of clipping. */
        @media (max-height: 700px) {
          .hero-section { min-height: auto; padding-bottom: clamp(2rem, 4vh, 3rem); }
        }
      `}</style>

      <section
        ref={ref}
        id="hero"
        className="hero-section"
        dir={isRTL ? 'rtl' : 'ltr'}
        aria-label={isRTL ? 'القسم الرئيسي' : 'Hero'}
      >
        <div className="hero-inner">
          <div className="hero-grid">

            {/* ── Left: Content ── */}
            <div style={{ textAlign: isRTL ? 'right' : 'left' }}>

              {/* Available badge */}
              <div style={{ ...fly(0), marginBottom: 24, display: 'flex', justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '6px 13px', borderRadius: '100px',
                  border: '1px solid #BBF7D0',
                  background: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                }}>
                  <span style={{
                    display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                    background: '#22C55E', animation: 'pulse-dot 2s ease-in-out infinite',
                  }} aria-hidden />
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#15803D' }}>
                    {isRTL ? 'نقبل مشاريع جديدة — الشهر الحالي' : 'Accepting new projects — this month'}
                  </span>
                </div>
              </div>

              {/* H1 */}
              <h1 className="hero-h1" style={fly(0.07)}>
                {isRTL ? (
                  <>
                    نبني المواقع والتطبيقات{' '}
                    {stackHeadline && <br />}
                    والأنظمة الرقمية{' '}
                    {stackHeadline && <br />}
                    <span style={{ color: '#2563EB', lineHeight: 'inherit' }}>لتنمية عملك.</span>
                  </>
                ) : (
                  <>
                    We build websites,{' '}
                    {stackHeadline && <br />}
                    apps & digital systems{' '}
                    {stackHeadline && <br />}
                    <span style={{ color: '#2563EB', lineHeight: 'inherit' }}>for growing businesses.</span>
                  </>
                )}
              </h1>

              {/* Subtitle */}
              <p style={{
                ...fly(0.15),
                fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
                fontSize: 'clamp(0.9375rem, 1.15vw, 1.0625rem)',
                fontWeight: 400,
                color: '#4B5563',
                lineHeight: isRTL ? 1.9 : 1.75,
                maxWidth: 520,
                margin: '0 0 clamp(22px, 3vh, 32px)',
              }}>
                {isRTL
                  ? 'من صفحة هبوط إلى نظام ERP كامل — نصمم ونبرمج ونطلق منتجك الرقمي خلال 14 يوماً في المتوسط. لا تجاوز للميزانية. لا أسابيع صامتة. ملكية كاملة للكود.'
                  : 'From a landing page to a full ERP platform — we design, build, and launch your digital product in as little as 14 days on average. No budget overruns. No silent weeks. Full code ownership.'}
              </p>

              {/* Service pills */}
              <div className="hero-service-pills" style={{ ...fly(0.2), justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
                {services.map((s, i) => (
                  <span key={i} className="hero-service-pill">{s}</span>
                ))}
              </div>

              {/* CTAs */}
              <div className="hero-cta-group" style={{ ...fly(0.26), justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
                <button
                  onClick={() => { trackCTAClick('hero-primary'); onStartProject?.(); }}
                  className="btn-primary"
                  style={{ fontSize: '13.5px', padding: '13px 26px' }}
                >
                  {isRTL ? 'احجز استشارة مجانية' : 'Book Free Strategy Call'}
                  <ArrowUpRight style={{ width: 15, height: 15, flexShrink: 0 }} aria-hidden />
                </button>
                <a
                  href="/portfolio"
                  onClick={() => trackCTAClick('hero-secondary')}
                  className="hero-cta-wa"
                  style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
                >
                  {isRTL ? 'عرض أعمالنا' : 'See Our Work'}
                  <ArrowRight style={{ width: 14, height: 14, flexShrink: 0, transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
                </a>
              </div>

            </div>

            {/* Right track intentionally empty — see .hero-grid note above. */}

          </div>
        </div>

        {/* Proof rail */}
        <div className="hero-stats" style={fly(0.34)}>
          {stats.map((s, i) => (
            <div key={i} className="hero-stat" style={{ textAlign: isRTL ? 'right' : 'left' }}>
              <div className="hero-stat-num">{s.num}</div>
              <div className="hero-stat-label">{s.label}</div>
              <div className="hero-stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
});

export default HeroSection;
