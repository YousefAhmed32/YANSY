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
  { num: '50+',      label: 'Projects delivered',   sub: 'Across 6+ industries' },
  { num: '⭐ 4.9/5',  label: 'Average client rating', sub: 'Based on client reviews' },
  { num: 'Fast',     label: 'Launch, scoped to you', sub: 'No fixed-day promises' },
  { num: '5+',       label: 'Years building',        sub: 'Since 2020' },
];
const STATS_AR = [
  { num: '50+',       label: 'مشروع مُسلَّم',       sub: 'في أكثر من 6 قطاعات' },
  { num: '⭐ 4.9/5',   label: 'تقييم العملاء',       sub: 'بناءً على آراء العملاء' },
  { num: 'سريع',      label: 'حسب نطاق مشروعك',     sub: 'بدون وعود بمدة ثابتة' },
  { num: '5+',        label: 'سنوات خبرة',           sub: 'منذ 2020' },
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
          color: rgb(var(--text-primary));
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
          color: rgb(var(--text-secondary));
          background: rgb(var(--bg-elevated));
          border: 1px solid rgb(var(--border));
          padding: 5px 12px;
          border-radius: 100px;
          white-space: nowrap;
          transition: border-color 0.18s, color 0.18s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          cursor: default;
        }
        .hero-service-pill:hover {
          border-color: rgb(var(--border-strong));
          color: rgb(var(--text-primary));
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
          color: rgb(var(--text-secondary));
          background: rgb(var(--bg-elevated));
          border: 1.5px solid rgb(var(--border));
          border-radius: 10px;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
          transition: border-color 0.2s, background 0.2s, transform 0.15s, color 0.2s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        .hero-cta-wa:hover {
          border-color: rgb(var(--border-strong));
          background: rgb(var(--bg-surface));
          color: rgb(var(--text-primary));
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
          border-top: 1px solid rgb(var(--border));
        }
        .hero-stat {
          padding: clamp(1rem, 2.2vh, 1.5rem) clamp(0.5rem, 1.5vw, 1.25rem);
          border-inline-end: 1px solid rgb(var(--border-light));
        }
        .hero-stat:last-child { border-inline-end: none; }
        .hero-stat-num {
          font-size: clamp(1.375rem, 2.2vw, 1.875rem);
          font-weight: 800;
          color: rgb(var(--text-primary));
          letter-spacing: -0.035em;
          line-height: 1.1;
          font-variant-numeric: tabular-nums;
          margin-bottom: 2px;
        }
        [dir="rtl"] .hero-stat-num { letter-spacing: 0; }
        .hero-stat-label { font-size: 12px; font-weight: 700; color: rgb(var(--text-secondary)); line-height: 1.35; }
        .hero-stat-sub   { font-size: 10.5px; color: rgb(var(--text-tertiary)); font-weight: 500; line-height: 1.4; margin-top: 1px; }

        /* Two-up below the tablet breakpoint; the 4-across rail can't hold
           legible numbers and two lines of label under ~640px. */
        @media (max-width: 640px) {
          .hero-stats { grid-template-columns: repeat(2, 1fr); }
          .hero-stat:nth-child(2) { border-inline-end: none; }
          .hero-stat:nth-child(-n+2) { border-bottom: 1px solid rgb(var(--border-light)); }
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
                  border: '1px solid rgb(var(--success) / 0.3)',
                  background: 'rgb(var(--bg-elevated))',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                }}>
                  <span style={{
                    display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                    background: 'rgb(var(--success))', animation: 'pulse-dot 2s ease-in-out infinite',
                  }} aria-hidden />
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: 'rgb(var(--success))' }}>
                    {isRTL ? 'نقبل مشاريع جديدة — الشهر الحالي' : 'Accepting new projects — this month'}
                  </span>
                </div>
              </div>

              {/* H1 */}
            <h1
  className="hero-h1 line-through-1"
  style={{
    ...fly(0.07),
    lineHeight: 1.4, // جرّب 1.1 أو 1.15 أو 1.2
  }}
>
  {isRTL ? (
    <>
      نبني المواقع والتطبيقات{' '}
      {stackHeadline && <br />}
      والأنظمة الرقمية{' '}
      {stackHeadline && <br />}
      <span style={{ color: 'rgb(var(--accent))', lineHeight: 'inherit' }}>
        لتنمية عملك.
      </span>
    </>
  ) : (
    <>
      We build websites,{' '}
      {stackHeadline && <br />}
      apps & digital systems{' '}
      {stackHeadline && <br />}
      <span style={{ color: 'rgb(var(--accent))', lineHeight: 'inherit' }}>
        for growing businesses.
      </span>
    </>
  )}
</h1>

              {/* Subtitle */}
              <p style={{
                ...fly(0.15),
                fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
                fontSize: 'clamp(0.9375rem, 1.15vw, 1.0625rem)',
                fontWeight: 400,
                color: 'rgb(var(--text-secondary))',
                lineHeight: isRTL ? 1.9 : 1.75,
                maxWidth: 520,
                margin: '0 0 clamp(22px, 3vh, 32px)',
              }}>
                {isRTL
                  ? 'من صفحة هبوط إلى نظام ERP كامل — نطوّر منتجك الرقمي بأعلى جودة وفي أسرع وقت يناسب حجم مشروعك، بميزانية واضحة بدون مفاجآت. لا أسابيع صامتة. ملكية كاملة للكود.'
                  : 'From a landing page to a full ERP platform — we build your digital product to the highest quality, delivered as fast as your project\'s scope allows, with a clear budget and no surprises. No silent weeks. Full code ownership.'}
              </p>

              {/* Service pills */}
              <div className="hero-service-pills" style={{ ...fly(0.2), justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
                {services.map((s, i) => (
                  <span key={i} className="hero-service-pill">{s}</span>
                ))}
              </div>

              {/* CTAs */}
              <div className="hero-cta-group" style={{ ...fly(0.26), justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
                <a
                  href="https://wa.me/201090385390?text=%D8%A3%D9%87%D9%84%D8%A3%20YANSY%D9%80%20%D8%AD%D8%A7%D8%A8%D8%A8%20%D8%A3%D8%B3%D8%AA%D9%81%D8%B3%D8%B1%20%D8%B9%D9%86%20%D8%AA%D8%B7%D9%88%D9%8A%D8%B1%20%D9%85%D8%B4%D8%B1%D9%88%D8%B9%20%D8%AC%D8%AF%D9%8A%D8%AF"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackCTAClick('hero-whatsapp-direct')}
                  className="btn-primary"
                  style={{
                    fontSize: '14px',
                    padding: '13px 26px',
                    background: '#25D366',
                    borderColor: '#25D366',
                    boxShadow: '0 4px 20px rgba(37,211,102,0.3)',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  <span>{isRTL ? 'تواصل عبر واتساب فوراً' : 'Chat on WhatsApp'}</span>
                </a>

                <button
                  onClick={() => { trackCTAClick('hero-primary'); onStartProject?.(); }}
                  className="hero-cta-wa"
                  style={{ fontSize: '13.5px', padding: '13px 22px' }}
                >
                  {isRTL ? 'احجز استشارة مجانية' : 'Book Strategy Call'}
                  <ArrowUpRight style={{ width: 15, height: 15, flexShrink: 0 }} aria-hidden />
                </button>
              </div>

              {/* Direct Trust Micro-copy */}
              <div style={{ ...fly(0.3), marginTop: 14, display: 'flex', itemsCenter: 'center', gap: 12, fontSize: 12, color: 'rgb(var(--text-tertiary))', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <span>⚡ {isRTL ? 'رد خلال 15 دقيقة على الواتساب' : '15-min instant WhatsApp reply'}</span>
                <span>•</span>
                <span>🔒 {isRTL ? 'استشارة مجانية 100% بدون التزام' : '100% Free Consultation'}</span>
              </div>

            </div>

            {/* Right track: Interactive Product Preview for Desktop */}
            {/* <div className="hidden lg:block relative" style={fly(0.28)}>
              <div className="relative rounded-2xl overflow-hidden border border-[rgb(var(--border))] shadow-2xl bg-slate-900 group">
                <div className="p-3 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">yansytech.com/showcase</span>
                  <div className="w-12" />
                </div>
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src="/placeholders/case-studies/nexusrealty.jpg"
                    alt="YANSY Tech Shipped Product Showcase"
                    className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-5">
                    <div className="text-white">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-600 text-white mb-2 inline-block">
                        {isRTL ? 'منتج حي مُسلَّم' : 'Live Product'}
                      </span>
                      <h4 className="text-sm font-bold">{isRTL ? 'منصة NexusRealty العقارية المتكاملة' : 'NexusRealty Platform'}</h4>
                      <p className="text-[11px] text-slate-300">{isRTL ? 'زيادة 300% في العملاء المحتملين + لوحة تحكم فورية' : '3x Lead Generation & Real-time Analytics'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div> */}

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
