import { useState, useEffect, forwardRef } from 'react';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { trackWhatsAppClick, trackCTAClick } from '../utils/ga4';

const SERVICES_EN = ['Websites', 'E-commerce', 'SaaS', 'Mobile Apps', 'ERP & CRM', 'Automation'];
const SERVICES_AR = ['مواقع ويب', 'متاجر إلكترونية', 'SaaS', 'تطبيقات موبايل', 'ERP وCRM', 'أتمتة'];

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
        isRTL ? '+40٪ إيرادات' : '+40% revenue',
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

const AvailabilityCard = ({ isRTL, services }) => (
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

  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setLoaded(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  const fly = (delay = 0) => ({
    opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(28px)',
    transition: `opacity 0.8s ${delay}s cubic-bezier(0.16,1,0.3,1), transform 0.8s ${delay}s cubic-bezier(0.16,1,0.3,1)`,
  });

  const whatsappUrl = 'https://wa.me/201090385390?text=Hello%2C%20I%27d%20like%20to%20discuss%20a%20project';
  const services = isRTL ? SERVICES_AR : SERVICES_EN;

  return (
    <>
      <style>{`
        .hero-section {
          background: #FFFFFF;
          padding-top: clamp(100px, 14vw, 148px);
          padding-bottom: clamp(5rem, 10vw, 9rem);
          padding-left: clamp(1.25rem, 5vw, 3rem);
          padding-right: clamp(1.25rem, 5vw, 3rem);
          position: relative;
          overflow: hidden;
        }
        .hero-dot-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, #C9CDD6 1px, transparent 1px);
          background-size: 32px 32px;
          opacity: 0.28;
          pointer-events: none;
        }
        .hero-glow-right {
          position: absolute;
          top: 0;
          right: 0;
          width: 50%;
          height: 100%;
          background: radial-gradient(ellipse at 70% 40%, rgba(37,99,235,0.05) 0%, transparent 60%);
          pointer-events: none;
        }
        .hero-inner {
          max-width: 1280px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
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
          color: #0D1117;
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
        .hero-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 0;
          border-top: 1px solid #E8EBF0;
          padding-top: clamp(20px, 3vw, 28px);
        }
        .hero-stat-item {
          padding-inline-end: clamp(20px, 3vw, 36px);
          border-inline-end: 1px solid #E8EBF0;
          margin-inline-end: clamp(20px, 3vw, 36px);
        }
        .hero-stat-item:last-child {
          border-inline-end: none;
          padding-inline-end: 0;
          margin-inline-end: 0;
        }
        .hero-stat-num {
          font-size: clamp(1.5rem, 2.8vw, 2.125rem);
          font-weight: 800;
          color: #0D1117;
          letter-spacing: -0.045em;
          line-height: 1;
          margin-bottom: 5px;
          font-variant-numeric: tabular-nums;
        }
        [dir="rtl"] .hero-stat-num { letter-spacing: 0; }
        .hero-stat-label {
          font-size: 10.5px;
          font-weight: 600;
          color: #9BA3AE;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          line-height: 1.3;
        }
        [dir="rtl"] .hero-stat-label { text-transform: none; letter-spacing: 0; }
        .hero-visual-col {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        @media (max-width: 560px) {
          .hero-stat-item:nth-child(3),
          .hero-stat-item:nth-child(4) { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-dot-grid { display: none; }
        }
      `}</style>

      <section
        ref={ref}
        id="hero"
        className="hero-section"
        dir={isRTL ? 'rtl' : 'ltr'}
        aria-label={isRTL ? 'القسم الرئيسي' : 'Hero'}
      >
        <div className="hero-dot-grid" aria-hidden />
        <div className="hero-glow-right" aria-hidden />
        <div className="hero-inner">
          <div className="hero-grid">

            {/* ── Left: Content ── */}
            <div style={{ textAlign: isRTL ? 'right' : 'left' }}>

              {/* Available badge */}
              <div style={{ ...fly(0), marginBottom: 24, display: 'flex', justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '6px 13px', borderRadius: '100px',
                  border: '1px solid rgba(34,197,94,0.25)',
                  background: 'rgba(34,197,94,0.05)',
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                }}>
                  <span style={{
                    display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                    background: '#22c55e', animation: 'pulse-dot 2s ease-in-out infinite',
                  }} aria-hidden />
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#16a34a' }}>
                    {isRTL ? 'نقبل مشاريع جديدة — الشهر الحالي' : 'Accepting new projects — this month'}
                  </span>
                </div>
              </div>

              {/* H1 */}
              <h1 className="hero-h1" style={fly(0.07)}>
                {isRTL ? (
                  <>
                    نبني المواقع والتطبيقات{' '}
                    <br />
                    والأنظمة الرقمية
                    <br />
                    <span style={{ color: '#2563EB' }}>لتنمية عملك.</span>
                  </>
                ) : (
                  <>
                    We build websites,
                    <br />
                    apps & digital systems
                    <br />
                    <span style={{ color: '#2563EB' }}>for growing businesses.</span>
                  </>
                )}
              </h1>

              {/* Subtitle */}
              <p style={{
                ...fly(0.15),
                fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
                fontSize: 'clamp(0.9375rem, 1.15vw, 1.0625rem)',
                fontWeight: 400,
                color: '#5C6370',
                lineHeight: isRTL ? 1.9 : 1.75,
                maxWidth: 520,
                margin: '0 0 clamp(22px, 3vh, 32px)',
              }}>
                {isRTL
                  ? 'من صفحة هبوط إلى نظام ERP كامل — نصمم ونبرمج ونطلق منتجك الرقمي في 30 يوماً. لا تجاوز للميزانية. لا أسابيع صامتة. ملكية كاملة للكود.'
                  : 'From a landing page to a full ERP platform — we design, build, and launch your digital product in 30 days. No budget overruns. No silent weeks. Full code ownership.'}
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

              {/* Stats strip */}
              {/* <div className="hero-stats" style={fly(0.34)}>
                {(isRTL ? [
                  { num: '50+',  label: 'مشروع مُسلَّم' },
                  { num: '98%',  label: 'رضا العملاء' },
                  { num: '30d',  label: 'متوسط الإطلاق' },
                  { num: '4+',   label: 'سنوات خبرة' },
                ] : [
                  { num: '50+',  label: 'Projects\nDelivered' },
                  { num: '98%',  label: 'Client\nSatisfaction' },
                  { num: '30d',  label: 'Average\nLaunch' },
                  { num: '4+',   label: 'Years\nExperience' },
                ]).map((s, i) => (
                  <div key={i} className="hero-stat-item">
                    <div className="hero-stat-num">{s.num}</div>
                    <div className="hero-stat-label" style={{ whiteSpace: 'pre-line' }}>{s.label}</div>
                  </div>
                ))}
              </div> */}
            </div>

            {/* ── Right: Visual ── */}
            <div className="hero-visual-col" style={fly(0.2)}>
              <FeaturedResultCard isRTL={isRTL} />
              <AvailabilityCard isRTL={isRTL} services={services} />
            </div>

          </div>
        </div>
      </section>
    </>
  );
});

export default HeroSection;
