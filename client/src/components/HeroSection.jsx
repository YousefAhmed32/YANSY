import { useState, useEffect, forwardRef } from 'react';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { trackCTAClick } from '../utils/ga4';

const SERVICES_EN = ['Websites', 'E-commerce', 'SaaS', 'Mobile Apps', 'ERP & CRM', 'Automation'];
const SERVICES_AR = ['مواقع ويب', 'متاجر إلكترونية', 'SaaS', 'تطبيقات موبايل', '⁦ERP و CRM⁩', 'أتمتة'];

const FeaturedResultCard = ({ isRTL }) => (
  <div style={{
    background: '#FFFFFF',
    border: '1px solid #E8EBF0',
    borderRadius: 18,
    padding: 'clamp(20px, 2.5vw, 28px)',
    boxShadow: '0 12px 40px rgba(37,99,235,0.07), 0 2px 8px rgba(0,0,0,0.04)',
    position: 'relative',
    overflow: 'hidden',
  }}>
    {/* Subtle top accent line */}
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #2563EB, rgba(37,99,235,0.15))', borderRadius: '18px 18px 0 0' }} aria-hidden />
    {/* Header row */}
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 18,
      flexDirection: isRTL ? 'row-reverse' : 'row',
    }}>
      <span style={{
        fontSize: 10, fontWeight: 700, color: '#9BA3AE',
        letterSpacing: isRTL ? 0 : '0.08em', textTransform: isRTL ? 'none' : 'uppercase',
      }}>
        {isRTL ? 'نتيجة حديثة' : 'Recent delivery'}
      </span>
      <span style={{
        fontSize: 10, fontWeight: 700, color: '#16a34a',
        background: '#DCFCE7', border: '1px solid #BBF7D0',
        padding: '3px 9px', borderRadius: '100px',
      }}>
        {isRTL ? 'مُسلَّم' : 'Delivered'}
      </span>
    </div>

    {/* Project name */}
    <div style={{ marginBottom: 12, textAlign: isRTL ? 'right' : 'left' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#0D1117', marginBottom: 3 }}>
        NexusCommerce Platform
      </div>
      <div style={{ fontSize: 12, color: '#9BA3AE', fontWeight: 500 }}>
        {isRTL ? 'منصة تجارة إلكترونية · 3 أسابيع' : 'E-commerce Platform · 3-week delivery'}
      </div>
    </div>

    {/* Quote */}
    <blockquote style={{
      margin: '0 0 16px',
      padding: isRTL ? '0 12px 0 0' : '0 0 0 12px',
      borderInlineStart: '2px solid #E8EBF0',
      textAlign: isRTL ? 'right' : 'left',
    }}>
      <p style={{
        fontSize: 13, color: '#374151', lineHeight: 1.65,
        margin: '0 0 8px',
        fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
        fontStyle: 'italic',
      }}>
        {isRTL
          ? '"YANSY بنوا منصتنا بالكامل. الإيرادات ارتفعت 40٪ في 90 يوماً."'
          : '"YANSY built our entire platform. Revenue up 40% in 90 days."'}
      </p>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: '#5C6370' }}>
        — Ahmed Al-Rashidi, NexusCommerce
      </span>
    </blockquote>

    {/* Metrics row */}
    <div style={{
      display: 'flex', gap: 8,
      flexDirection: isRTL ? 'row-reverse' : 'row',
    }}>
      {[
        isRTL ? '⁦+40٪⁩ إيرادات' : '+40% revenue',
        isRTL ? 'ملكية كاملة' : 'Full ownership',
        isRTL ? 'React + Node.js' : 'React + Node.js',
      ].map((tag, i) => (
        <span key={i} style={{
          fontSize: 10.5, fontWeight: 600,
          color: i === 0 ? '#2563EB' : '#5C6370',
          background: i === 0 ? '#EFF6FF' : '#F6F7F9',
          border: `1px solid ${i === 0 ? '#DBEAFE' : '#E8EBF0'}`,
          padding: '3px 9px', borderRadius: '100px',
          whiteSpace: 'nowrap',
        }}>
          {tag}
        </span>
      ))}
    </div>
  </div>
);

const AvailabilityCard = ({ isRTL }) => (
  <div style={{
    background: '#FFFFFF',
    border: '1px solid rgba(34,197,94,0.2)',
    borderRadius: 14,
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexDirection: isRTL ? 'row-reverse' : 'row',
    boxShadow: '0 2px 12px rgba(34,197,94,0.06)',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      flexDirection: isRTL ? 'row-reverse' : 'row',
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: '#22c55e', flexShrink: 0,
        animation: 'pulse-dot 2s ease-in-out infinite',
      }} aria-hidden />
      <span style={{ fontSize: 12, fontWeight: 600, color: '#0D1117' }}>
        {isRTL ? 'نقبل مشاريع جديدة' : 'Accepting new projects'}
      </span>
    </div>
    <span style={{ fontSize: 11, color: '#9BA3AE', fontWeight: 500, whiteSpace: 'nowrap' }}>
      {isRTL ? 'رد خلال ساعتين' : 'Reply < 2 hours'}
    </span>
  </div>
);

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
  const heroBackground = isRTL
    ? '/Futuristic tech city overview-9-ar.png'
    : '/Futuristic tech city overview-9-en.png';

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
          justify-content: center;
          /* 68px clears the fixed Header (Header.jsx height); rest is breathing room */
          padding-top: calc(68px + clamp(1.5rem, 3vw, 3rem));
          padding-bottom: clamp(2.5rem, 5vw, 4rem);
          padding-left: clamp(1.25rem, 5vw, 3rem);
          padding-right: clamp(1.25rem, 5vw, 3rem);
          position: relative;
          overflow: hidden;
        }
        .hero-inner {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        /* Below 1024px the visual-column card (which visually masks the busiest
           part of the background artwork on desktop) is hidden, so the artwork's
           baked-in label bubbles are exposed directly behind the full-width text.
           A soft white scrim keeps the headline/paragraph legible without losing
           the art entirely. */
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
          gap: clamp(3.5rem, 7vw, 5.5rem);
          align-items: center;
        }
        @media (min-width: 1024px) {
          .hero-grid {
            grid-template-columns: 58fr 42fr;
          }
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
          margin-bottom: clamp(28px, 4vh, 40px);
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
        .hero-visual-col {
          display: none;
          flex-direction: column;
          gap: 14px;
        }
        @media (min-width: 1024px) {
          .hero-visual-col { display: flex; }
        }
      `}</style>

      <section
        ref={ref}
        id="hero"
        className="hero-section"
        dir={isRTL ? 'rtl' : 'ltr'}
        aria-label={isRTL ? 'القسم الرئيسي' : 'Hero'}
        style={{ backgroundImage: `url('${heroBackground}')` }}
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

            {/* ── Right: Visual — real delivered-project proof, not stock imagery ── */}
            {/* <div className="hero-visual-col" style={fly(0.2)}>
              <FeaturedResultCard isRTL={isRTL} />
              <AvailabilityCard isRTL={isRTL} />
            </div> */}

          </div>
        </div>
      </section>
    </>
  );
});

export default HeroSection;
