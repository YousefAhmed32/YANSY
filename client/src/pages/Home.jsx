// pages/Home.jsx — World-class premium conversion flow
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useLanguage } from '../contexts/LanguageContext';
import { useSEO } from '../hooks/useSEO';

// Core layout
import Header            from '../components/Header';
import Footer            from '../components/Footer';
import ProjectRequestForm from '../components/ProjectRequestForm';

// Landing sections (ordered for conversion)
import HeroSection       from '../components/HeroSection';
import TrustBar          from '../components/TrustBar';
import Solutions         from '../components/Solutions';
import PortfolioSection  from '../components/PortfolioSection';
import Testimonials      from '../components/Testimonials';
import AIChatWidget      from '../components/AIChatWidget';

// Page sections
import MetricsSection    from '../sections/MetricsSection';
import ProcessSection    from '../sections/ProcessSection';
import TechSection       from '../sections/TechSection';
import ContactSection    from '../sections/ContactSection';
import FAQ               from '../components/FAQ';

// GSAP hooks
import { useHomeRefs }   from '../hooks/useHomeRefs';
import { useHomeGSAP }   from '../hooks/useHomeGSAP';

/* ── Minimal film-grain noise overlay ──────────────────────── */
const NoiseOverlay = () => (
  <div
    aria-hidden
    className="pointer-events-none fixed inset-0 z-[1] opacity-[0.025]"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'repeat',
      backgroundSize  : '200px',
    }}
  />
);

/* ── Section Divider ─────────────────────────────────────────── */
const SectionDivider = ({ isRTL }) => (
  <div
    aria-hidden
    className="mx-auto"
    style={{
      maxWidth   : 1280,
      padding    : '0 clamp(16px,5vw,48px)',
    }}
  >
    <div style={{
      height      : 1,
      background  : `linear-gradient(to ${isRTL ? 'left' : 'right'}, transparent, rgba(212,175,55,.08), transparent)`,
    }} />
  </div>
);

/* ── Works data ──────────────────────────────────────────────── */
const WORKS = [
  {
    imgSrc  : '/assets/image/GoImage/Ecommrce.png',
    catEN   : 'E-commerce · Conversion Problem',
    catAR   : 'تجارة إلكترونية · مشكلة التحويل',
    titleEN : 'Nexus Commerce',
    titleAR : 'نيكسوس كوميرس',
    descEN  : 'A fast-growing brand was losing 60% of customers at checkout due to a slow, outdated platform. We rebuilt their store from scratch — headless architecture, one-click checkout, real-time inventory. Conversion jumped 40% in 90 days.',
    descAR  : 'علامة تجارية ناشئة كانت تفقد 60% من العملاء عند الدفع بسبب منصة بطيئة وقديمة. أعدنا بناء متجرهم من الصفر — هندسة headless، دفع بنقرة واحدة، مخزون فوري. ارتفع التحويل 40% في 90 يوماً.',
    result  : { en: '+40% checkout conversions in 90 days', ar: '+40٪ في إتمام الطلبات خلال 90 يوماً' },
    imgLeft : false,
  },
  {
    imgSrc  : '/assets/image/GoImage/SaaS.png',
    catEN   : 'SaaS · Activation Problem',
    catAR   : 'SaaS · مشكلة التفعيل',
    titleEN : 'Vault Analytics',
    titleAR : 'فولت أناليتكس',
    descEN  : 'A B2B SaaS founder was losing 70% of trial signups before they saw value — the onboarding was too complex. We rebuilt the entire activation flow with smart walkthroughs, instant chart setup, and role-based access. Users activated 3x faster.',
    descAR  : 'مؤسس SaaS كان يفقد 70% من التسجيلات التجريبية قبل أن يروا القيمة — الإعداد كان معقداً. أعدنا بناء تدفق التفعيل بأدلة إرشادية ذكية وإعداد فوري للمخططات. أصبح المستخدمون يتفعلون أسرع 3 أضعاف.',
    result  : { en: '3x faster user activation — 70% less churn in week 1', ar: '3× تسريع التفعيل — 70% تقليل في الانسحاب خلال الأسبوع الأول' },
    imgLeft : true,
  },
];

/* ── Main Home Component ─────────────────────────────────────── */
const Home = () => {
  const { t }                    = useTranslation();
  const { isRTL, dir, language } = useLanguage();
  const user                     = useSelector(s => s.auth?.user);
  const homeT = (key, fb) => t(`landing.home.${key}`, fb);

  const containerRef = useRef(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const open  = () => setIsFormOpen(true);
  const close = () => setIsFormOpen(false);

  useSEO({
    title      : isRTL ? 'يانسي تك | هندسة المنتجات الرقمية' : 'Premium Digital Product Studio',
    description: isRTL
      ? 'YANSY Tech تبني مواقع ومتاجر ومنصات SaaS وأنظمة مؤسسية احترافية. 50+ مشروع مسلّم. استشارة مجانية خلال 24 ساعة.'
      : 'YANSY TECH is a premium digital product studio. We build enterprise-grade websites, e-commerce platforms, SaaS products, and custom software. 50+ projects delivered. Free consultation.',
    keywords   : isRTL
      ? 'تطوير مواقع, تطوير تطبيقات, تطوير SaaS, متجر إلكتروني, تطوير برمجيات'
      : 'digital product studio, web development agency, SaaS development, e-commerce development, enterprise software, React development, Node.js, Egypt',
    canonical  : 'https://yansytech.com/',
    ogLocale   : isRTL ? 'ar_SA' : 'en_US',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': 'https://yansytech.com/#webpage',
      'url': 'https://yansytech.com/',
      'name': 'YANSY TECH | Premium Digital Product Studio',
      'isPartOf': { '@id': 'https://yansytech.com/#website' },
      'about': { '@id': 'https://yansytech.com/#organization' },
      'breadcrumb': {
        '@type': 'BreadcrumbList',
        'itemListElement': [{ '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://yansytech.com/' }],
      },
    },
  });

  // GSAP refs
  const { s, imgs, tx, team, works, techCards, process } = useHomeRefs();
  useHomeGSAP({ s, imgs, tx, team, works, techCards, process, isRTL, language, containerRef });

  const sr  = (key) => (el) => { s.current[key]    = el; };
  const ir  = (key) => (el) => { imgs.current[key] = el; };
  const txr = (key) => (el) => { tx.current[key]   = el; };

  return (
  <div
  ref={containerRef}
  key={`home-${language}`}
  className="bg-black text-white overflow-x-hidden"
>
      <NoiseOverlay />
      <Header onStartProject={open} />

      {/* ══════════════════════════════════════════════════════
          01  HERO — First impression, primary CTA
      ══════════════════════════════════════════════════════ */}
      <HeroSection
        ref={(el) => { s.current.hero = el; }}
        onStartProject={open}
        isRTL={isRTL}
        t={t}
      />

      {/* ══════════════════════════════════════════════════════
          02  TRUST BAR — Animated credibility signals
      ══════════════════════════════════════════════════════ */}
      <TrustBar isRTL={isRTL} />

      {/* ══════════════════════════════════════════════════════
          03  ABOUT — Who we are & what we deliver
      ══════════════════════════════════════════════════════ */}
      <section
        id="about"
        ref={sr('about')}
        className="relative flex items-center px-4 sm:px-8 py-20 sm:py-36"
        style={{ background: 'linear-gradient(180deg, #000 0%, #030201 50%, #000 100%)' }}
      >
        {/* Subtle grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage : 'linear-gradient(#d4af37 1px,transparent 1px),linear-gradient(90deg,#d4af37 1px,transparent 1px)',
            backgroundSize  : '80px 80px',
          }}
        />
        <div className={`max-w-7xl mx-auto w-full relative z-10`}>
          {/*
            RTL: DOM-first = RIGHT column (copy on right — correct).
            DOM-second = LEFT column (metric cards on left — correct).
            No order manipulation needed.
          */}
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center ${isRTL ? 'text-right' : ''}`}>

            {/* ── Left: Copy ── */}
            <div className="space-y-8 sm:space-y-10">
              <div>
                <span
                  className={`block w-16 h-px mb-10 ${isRTL ? 'bg-gradient-to-l ml-auto' : 'bg-gradient-to-r'} from-[#d4af37] to-transparent`}
                  aria-hidden
                />
              </div>
              <h2
                ref={txr('aboutTitle')}
                className={`text-4xl sm:text-5xl xl:text-6xl font-semibold leading-[1.06] ${isRTL ? '' : 'tracking-tight'}`}
                style={{ letterSpacing: isRTL ? '0' : '-0.025em' }}
              >
                {homeT('about.title', 'Your business problem')}
                <br />
                <span className={`text-transparent bg-clip-text ${isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-[#d4af37] to-white/80`}>
                  {homeT('about.titleHighlight', 'is our product brief.')}
                </span>
              </h2>
              <p
                ref={txr('aboutDesc')}
                className={`max-w-2xl text-base sm:text-lg lg:text-xl font-normal text-white/65 leading-relaxed`}
              >
                {homeT(
                  'about.description',
                  "We don't sell development hours — we engineer business outcomes. Every feature we build exists to grow your revenue, reduce your costs, or eliminate the manual work that's holding you back."
                )}
              </p>
              <p
                ref={txr('aboutServices')}
                className="text-sm font-normal text-white/45 tracking-wide"
              >
                {homeT('about.services', 'Revenue Growth · Cost Reduction · Operations Automation · Market Positioning')}
              </p>
            </div>

            {/* ── Right: Visual anchor — outcome promise cards ── */}
            <div className="hidden lg:grid grid-cols-2 gap-3" aria-hidden>
              {[
                { metric: '+40%', label: isRTL ? 'زيادة في التحويل' : 'avg. conversion uplift', color: '#34d399', icon: '↑' },
                { metric: '30d',  label: isRTL ? 'متوسط وقت الإطلاق' : 'avg. time to launch', color: '#60a5fa', icon: '⚡' },
                { metric: '3×',   label: isRTL ? 'تسريع تفعيل المستخدمين' : 'faster user activation', color: '#a78bfa', icon: '🚀' },
                { metric: '60%',  label: isRTL ? 'تقليل وقت الإدارة' : 'less admin time', color: '#d4af37', icon: '✓' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="group relative p-5 cursor-default transition-all duration-400"
                  style={{
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${item.color}30`;
                    e.currentTarget.style.background = `${item.color}08`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
                  }}
                >
                  <div
                    className="absolute top-0 inset-x-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                    style={{ background: `linear-gradient(to right, transparent, ${item.color}60, transparent)` }}
                  />
                  <div
                    className="text-3xl font-bold mb-2 transition-all duration-300"
                    style={{ color: item.color, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}
                  >
                    {item.metric}
                  </div>
                  <p className="text-xs font-normal leading-snug" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      <SectionDivider isRTL={isRTL} />

      {/* ══════════════════════════════════════════════════════
          04  SOLUTIONS — What we build (accordion)
      ══════════════════════════════════════════════════════ */}
      <Solutions onStartProject={open} />

      <SectionDivider isRTL={isRTL} />

      {/* ══════════════════════════════════════════════════════
          05  FEATURED WORK — Case studies with results
      ══════════════════════════════════════════════════════ */}
      <section
        id="work"
        ref={sr('works')}
        className="px-4 sm:px-8 py-20 sm:py-36"
        style={{ background: 'linear-gradient(180deg, #000 0%, #040200 50%, #000 100%)' }}
      >
<div
  className={`max-w-7xl mx-auto`}
  dir={isRTL ? 'rtl' : 'ltr'}
>
          {/* Header */}
          <div className={`mb-16 sm:mb-28 ${isRTL ? 'text-right' : ''}`}>
            <div className={`flex items-center gap-4 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className={`block w-10 h-px ${isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-[#d4af37] to-transparent`} aria-hidden />
              <p className="text-[10px] tracking-[.1em] text-[#d4af37]/65 uppercase font-medium">
                {isRTL ? 'نتائج حقيقية' : 'Real results, real clients'}
              </p>
            </div>
            <h2
              className={`text-3xl sm:text-5xl lg:text-6xl font-semibold leading-[1.08] ${isRTL ? '' : 'tracking-tight'}`}
              style={{ letterSpacing: isRTL ? '0' : '-0.025em' }}
            >
              {homeT('works.subtitle', 'Problems we solved.')}
              <br />
              <span className={`text-transparent bg-clip-text ${isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-[#d4af37]/80 to-white/60`}>
                {homeT('works.subtitle2', 'Revenue they gained.')}
              </span>
            </h2>
          </div>

          {/* Case studies */}
          {WORKS.map((w, wi) => (
            <div
              key={wi}
              ref={(el) => (works.current[wi] = el)}
              className={`${wi < WORKS.length - 1 ? 'mb-24 sm:mb-40' : ''} group`}
            >
              <div className={`grid grid-cols-1 lg:grid-cols-5 gap-8 sm:gap-16 items-center`}>
                {/* Text content */}
                <div className={`lg:col-span-2 space-y-5 ${w.imgLeft ? 'lg:order-2' : ''}`}>
                  <span className="text-[10px] uppercase tracking-[0.08em] text-white/45 font-medium">
                    {isRTL ? w.catAR : w.catEN}
                  </span>
                  <h3
                    data-work-title
                    className="text-2xl sm:text-4xl lg:text-5xl font-semibold tracking-tight"
                    style={{ letterSpacing: '-0.025em' }}
                  >
                    {isRTL ? w.titleAR : w.titleEN}
                  </h3>
                  <p
                    data-work-desc
                    className="text-base sm:text-lg font-normal text-white/60 leading-relaxed"
                  >
                    {isRTL ? w.descAR : w.descEN}
                  </p>
                  {/* Result tag */}
                  <div
                    className="inline-flex items-center gap-2 px-4 py-2"
                    style={{ border: '1px solid rgba(212,175,55,.2)', background: 'rgba(212,175,55,.04)' }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4af37', flexShrink: 0 }} aria-hidden />
                    <span className="text-[11px] tracking-wider uppercase text-[#d4af37]/75 font-light">
                      {isRTL ? w.result.ar : w.result.en}
                    </span>
                  </div>
                </div>

                {/* Image */}
                <div className={`lg:col-span-3 ${w.imgLeft ? 'lg:order-1' : ''}`}>
                  <div
                    data-work-image
                    className="relative aspect-[16/10] overflow-hidden bg-white/[0.03] transition-transform duration-700 group-hover:scale-[1.015]"
                    style={{ border: '1px solid rgba(255,255,255,.04)' }}
                  >
                    <img
                      src={w.imgSrc}
                      alt={isRTL ? w.titleAR : w.titleEN}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      width="800"
                      height="500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/55 via-transparent to-black/20" />
                    {/* Bottom gold accent */}
                    <span
                      className={`absolute bottom-4 ${isRTL ? 'right-4' : 'left-4'} w-16 h-px ${isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-[#d4af37]/70 to-transparent`}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* See all work */}
          <div className="text-center mt-16 sm:mt-24">
            <Link
              to="/portfolio"
              className="group relative inline-flex items-center gap-3 px-10 sm:px-14 py-4 sm:py-5 border border-[#d4af37]/55 text-[#d4af37] text-[10px] font-light tracking-widest uppercase hover:bg-[#d4af37] hover:text-black transition-all duration-500 active:scale-95 overflow-hidden"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="relative">{isRTL ? 'عرض كل الأعمال' : 'View All Work'}</span>
              <svg
                className={`relative w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 ${isRTL ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          06  PORTFOLIO — Dynamic grid from API
      ══════════════════════════════════════════════════════ */}
      <PortfolioSection />

      <SectionDivider isRTL={isRTL} />

      {/* ══════════════════════════════════════════════════════
          07  PROCESS — How we work
      ══════════════════════════════════════════════════════ */}
      <ProcessSection
        sectionRef={sr('process')}
        processRef={process}
        isRTL={isRTL}
        onStartProject={open}
      />

      <SectionDivider isRTL={isRTL} />

      {/* ══════════════════════════════════════════════════════
          08  METRICS — Results that speak (NEW)
      ══════════════════════════════════════════════════════ */}
      <MetricsSection isRTL={isRTL} onStartProject={open} />

      <SectionDivider isRTL={isRTL} />

      {/* ══════════════════════════════════════════════════════
          09  TECH STACK — Enterprise credibility
      ══════════════════════════════════════════════════════ */}
      <TechSection
        sectionRef={sr('tech')}
        techCardsRef={techCards}
        isRTL={isRTL}
      />

      <SectionDivider isRTL={isRTL} />

      {/* ══════════════════════════════════════════════════════
          10  TESTIMONIALS — Social proof
      ══════════════════════════════════════════════════════ */}
      <Testimonials isRTL={isRTL} />

      <SectionDivider isRTL={isRTL} />

      {/* ══════════════════════════════════════════════════════
          11  FAQ — Objection handling
      ══════════════════════════════════════════════════════ */}
      <FAQ onStartProject={open} />

      <SectionDivider isRTL={isRTL} />

      {/* ══════════════════════════════════════════════════════
          12  CONTACT — Final conversion CTA
      ══════════════════════════════════════════════════════ */}
      <ContactSection
        isRTL={isRTL}
        onStartProject={open}
        t={t}
        homeT={homeT}
      />

      <Footer />

      {/* AI Chat Widget */}
      <AIChatWidget isRTL={isRTL} onStartProject={open} user={user} />

      {/* Project request form modal */}
      <ProjectRequestForm isOpen={isFormOpen} onClose={close} />
    </div>
  );
};

export default Home;
