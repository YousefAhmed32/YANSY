import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProjectRequestForm from '../components/ProjectRequestForm';
import Testimonials from '../components/Testimonials';

gsap.registerPlugin(ScrollTrigger);

// ── Cursor Glow ──────────────────────────────────────────────────────────────
const CursorGlow = () => {
  const ref = useRef(null);
  useEffect(() => {
    const move = (e) => {
      if (!ref.current) return;
      ref.current.style.transform = `translate(${e.clientX - 150}px, ${e.clientY - 150}px)`;
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);
  return (
    <div
      ref={ref}
      className="pointer-events-none fixed z-0 w-[300px] h-[300px] rounded-full opacity-[0.04] transition-transform duration-700 ease-out"
      style={{ background: 'radial-gradient(circle, #d4af37 0%, transparent 70%)', top: 0, left: 0 }}
    />
  );
};

// ── Noise Overlay ────────────────────────────────────────────────────────────
const NoiseOverlay = () => (
  <div
    className="pointer-events-none fixed inset-0 z-[1] opacity-[0.025]"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'repeat',
      backgroundSize: '128px',
    }}
  />
);

// ── ProcessNode sub-component ────────────────────────────────────────────────
const ProcessNode = ({ step, idx, activeProcess, setActiveProcess, refCallback }) => (
  <div
    ref={refCallback}
    className="opacity-0 flex flex-col items-center text-center px-3 cursor-pointer group"
    onMouseEnter={() => setActiveProcess(idx)}
    onMouseLeave={() => setActiveProcess(null)}
  >
    <div
      className="relative w-[104px] h-[104px] rounded-full flex items-center justify-center border-2 transition-all duration-500 mb-5 z-10"
      style={{
        borderColor:     activeProcess === idx ? step.color : 'rgba(255,255,255,0.1)',
        backgroundColor: activeProcess === idx ? `${step.color}15` : 'rgba(0,0,0,0.8)',
        boxShadow:       activeProcess === idx ? `0 0 30px ${step.color}30` : 'none',
        transform:       activeProcess === idx ? 'scale(1.1)' : 'scale(1)',
      }}
    >
      <span className="text-3xl">{step.icon}</span>
      <span
        className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-light transition-transform duration-300"
        style={{ backgroundColor: step.color, color: '#000', transform: activeProcess === idx ? 'scale(1.2)' : 'scale(1)' }}
      >
        {step.num}
      </span>
    </div>
    <h3 className="text-base font-light mb-1 transition-colors duration-300" style={{ color: activeProcess === idx ? step.color : 'rgba(255,255,255,0.85)' }}>
      {step.title}
    </h3>
    <p className="text-[11px] text-white/30 mb-2 tracking-wide">{step.sub}</p>
    <div
      className="overflow-hidden transition-all duration-500"
      style={{ maxHeight: activeProcess === idx ? '180px' : '0', opacity: activeProcess === idx ? 1 : 0 }}
    >
      <p className="text-xs text-white/55 leading-relaxed mb-2 px-1">{step.desc}</p>
      <p className="text-[11px] text-white/30 leading-loose px-1">{step.detail}</p>
    </div>
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────
const Home = () => {
  const { t } = useTranslation();
  const { isRTL, dir, language } = useLanguage();

  const homeT = (key, fallback) => t(`landing.home.${key}`, fallback);

  const sectionsRef   = useRef([]);
  const imagesRef     = useRef([]);
  const textsRef      = useRef([]);
  const horizontalRef = useRef(null);
  const teamRef       = useRef([]);
  const worksRef      = useRef([]);
  const clientsRef    = useRef([]);
  const processRef    = useRef([]);
  const containerRef  = useRef(null);

  const [isFormOpen,    setIsFormOpen]    = useState(false);
  const [activeProcess, setActiveProcess] = useState(null);

  // ── Process Steps ──────────────────────────────────────────────────────────
  const processSteps = isRTL
    ? [
        { num: '01', icon: '📋', title: 'إرسال الطلب',      sub: 'Request',     desc: 'أرسل لنا فكرتك من خلال نموذج المشروع. سنستلم طلبك فوراً ونبدأ في مراجعته بعناية.',          detail: 'نموذج بسيط • استجابة خلال 2 ساعة • متاح 24/7',         color: '#d4af37' },
        { num: '02', icon: '🤝', title: 'استلام الطلب',      sub: 'Received',    desc: 'يستلم فريقنا طلبك ويُعيّن له مدير مشروع مخصص يتواصل معك خلال 24 ساعة.',                   detail: 'مدير مشروع مخصص • تأكيد فوري • أولوية للعملاء الجدد',  color: '#c9a227' },
        { num: '03', icon: '📞', title: 'حجز استشارة',       sub: 'Consultation', desc: 'جلسة مجانية 30 دقيقة نفهم فيها متطلباتك بعمق ونُجيب على جميع أسئلتك.',                   detail: 'فيديو أو هاتف • 30 دقيقة • مجاناً تماماً',             color: '#b8911f' },
        { num: '04', icon: '🗺️', title: 'وضع الخطة',        sub: 'Planning',     desc: 'نُعد خارطة طريق تفصيلية للمشروع: المراحل، الجدول الزمني، التقنيات المستخدمة.',            detail: 'خارطة طريق مفصلة • جدول زمني واضح • ميلستون محددة',    color: '#a07c18' },
        { num: '05', icon: '✍️', title: 'الاتفاق والعقد',   sub: 'Agreement',    desc: 'نوقّع عقد واضح يحدد كل التفاصيل: النطاق، الأسعار، المواعيد، وحقوق الملكية.',             detail: 'عقد شفاف • حماية قانونية • دفع آمن',                    color: '#8a6810' },
        { num: '06', icon: '⚡', title: 'بداية التنفيذ',     sub: 'Kickoff',      desc: 'نبدأ العمل الفعلي مع تقارير أسبوعية وإمكانية متابعة التقدم لحظة بلحظة.',                 detail: 'تقارير أسبوعية • وصول للوحة تحكم • تواصل مستمر',       color: '#d4af37' },
        { num: '07', icon: '🎯', title: 'المراجعة والتسليم', sub: 'Delivery',     desc: 'جولة مراجعة شاملة، تعديلات حتى رضاك التام، ثم تسليم رسمي مع كامل الملفات.',              detail: '3 جولات تعديل • ضمان الجودة • تسليم كامل الملفات',     color: '#c9a227' },
        { num: '08', icon: '🚀', title: 'الإطلاق والدعم',    sub: 'Launch',       desc: 'نُطلق مشروعك ونقدم دعماً فنياً لمدة 30 يوماً لضمان عمل كل شيء بكفاءة.',                 detail: 'دعم 30 يوماً • مراقبة الأداء • تحديثات مجانية',         color: '#b8911f' },
      ]
    : [
        { num: '01', icon: '📋', title: 'Submit Request',      sub: 'إرسال الطلب',       desc: 'Send us your idea through the project form. We receive your request immediately and begin reviewing it carefully.',  detail: 'Simple form • 2-hour response • Available 24/7',           color: '#d4af37' },
        { num: '02', icon: '🤝', title: 'Request Received',    sub: 'استلام الطلب',      desc: 'Our team receives your request and assigns a dedicated project manager who contacts you within 24 hours.',          detail: 'Dedicated PM • Instant confirmation • New client priority', color: '#c9a227' },
        { num: '03', icon: '📞', title: 'Book Consultation',   sub: 'حجز استشارة',       desc: 'A free 30-minute session where we deeply understand your requirements and answer all your questions.',              detail: 'Video or call • 30 minutes • Completely free',             color: '#b8911f' },
        { num: '04', icon: '🗺️', title: 'Project Planning',   sub: 'وضع الخطة',         desc: 'We prepare a detailed project roadmap: phases, timeline, technologies, and success metrics.',                      detail: 'Detailed roadmap • Clear timeline • Defined milestones',   color: '#a07c18' },
        { num: '05', icon: '✍️', title: 'Agreement & Contract',sub: 'الاتفاق والعقد',   desc: 'We sign a clear contract covering all details: scope, pricing, deadlines, and ownership rights.',                  detail: 'Transparent contract • Legal protection • Secure payment', color: '#8a6810' },
        { num: '06', icon: '⚡', title: 'Development Kickoff', sub: 'بداية التنفيذ',     desc: 'We begin actual work with weekly reports and real-time progress tracking through your dashboard.',                detail: 'Weekly reports • Dashboard access • Continuous communication', color: '#d4af37' },
        { num: '07', icon: '🎯', title: 'Review & Delivery',   sub: 'المراجعة والتسليم', desc: 'A comprehensive review round, revisions until full satisfaction, then official delivery with all files.',          detail: '3 revision rounds • Quality assurance • Complete file delivery', color: '#c9a227' },
        { num: '08', icon: '🚀', title: 'Launch & Support',    sub: 'الإطلاق والدعم',    desc: 'We launch your project and provide 30-day technical support to ensure everything runs efficiently.',               detail: '30-day support • Performance monitoring • Free updates',   color: '#b8911f' },
      ];

  // ── GSAP ───────────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    let ctx = null;
    let tid  = null;

    tid = setTimeout(() => {
      if (!containerRef.current) return;

      ctx = gsap.context(() => {
        // HERO
        const heroSection     = sectionsRef.current[0];
        const heroImage       = imagesRef.current[0];
        const heroTitle       = textsRef.current[0];
        const heroCredentials = textsRef.current[0.5];
        const heroSubtitle    = textsRef.current[1];
        const heroValueProp   = textsRef.current[1.5];
        const heroCTAs        = textsRef.current[1.6];

        if (heroSection && heroImage && heroTitle) {
          const heroTl = gsap.timeline({
            scrollTrigger: { trigger: heroSection, start: 'top top', end: '+=180%', scrub: 1.5, pin: true, anticipatePin: 1 },
          });
          heroTl
            .fromTo(heroCredentials, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3 })
            .fromTo(heroTitle,       { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.4 }, '-=0.2')
            .fromTo(heroSubtitle,    { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3 }, '-=0.2')
            .fromTo(heroValueProp,   { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3 }, '-=0.2')
            .fromTo(heroCTAs,        { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3 }, '-=0.2')
            .to([heroCredentials, heroTitle, heroSubtitle, heroValueProp, heroCTAs], { opacity: 1, duration: 0.3 })
            .to([heroCredentials, heroTitle, heroSubtitle, heroValueProp, heroCTAs], { opacity: 0, y: -30, duration: 0.4 }, '+=0.2')
            .to(heroImage, { scale: 1.05, opacity: 1, duration: 0.6 }, '-=0.2');
        }

        // EDITORIAL
        const editorialSection = sectionsRef.current[1];
        if (editorialSection) {
          gsap.fromTo(
            [textsRef.current[2], textsRef.current[3], textsRef.current[4]].filter(Boolean),
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 1, stagger: 0.15, ease: 'power2.out',
              scrollTrigger: { trigger: editorialSection, start: 'top 75%', toggleActions: 'play none none none' } }
          );
        }

        // TEAM
        const teamSection = sectionsRef.current[2];
        if (teamSection && teamRef.current.length > 0) {
          gsap.fromTo(
            teamRef.current.filter(Boolean),
            { opacity: 0, y: 60 },
            { opacity: 1, y: 0, duration: 1.2, stagger: 0.2, ease: 'power2.out',
              scrollTrigger: { trigger: teamSection, start: 'top 70%', toggleActions: 'play none none none' } }
          );
        }

        // PROCESS JOURNEY
        const processSection = sectionsRef.current[10];
        if (processSection && processRef.current.length > 0) {
          const line = processSection.querySelector('[data-process-line]');
          if (line) {
            gsap.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 2, ease: 'power2.out',
              scrollTrigger: { trigger: processSection, start: 'top 70%', toggleActions: 'play none none none' } });
          }
          gsap.fromTo(
            processRef.current.filter(Boolean),
            { opacity: 0, y: 50, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out',
              scrollTrigger: { trigger: processSection, start: 'top 70%', toggleActions: 'play none none none' } }
          );
        }

        // SIDE-BY-SIDE
        const sideSection = sectionsRef.current[3];
        const sideImage   = imagesRef.current[1];
        const sideTexts   = [textsRef.current[5], textsRef.current[6], textsRef.current[7]];
        if (sideSection && sideImage) {
          const textXFrom  = isRTL ?  60 : -60;
          const imageXFrom = isRTL ? -60 :  60;
          gsap.fromTo(sideTexts.filter(Boolean), { opacity: 0, x: textXFrom },
            { opacity: 1, x: 0, duration: 1, stagger: 0.1, ease: 'power2.out',
              scrollTrigger: { trigger: sideSection, start: 'top 70%', toggleActions: 'play none none none' } });
          gsap.fromTo(sideImage, { opacity: 0, x: imageXFrom, scale: 0.98 },
            { opacity: 1, x: 0, scale: 1, duration: 1.2, ease: 'power2.out',
              scrollTrigger: { trigger: sideSection, start: 'top 70%', toggleActions: 'play none none none' } });
        }

        // WORKS
        const worksSection = sectionsRef.current[4];
        if (worksSection && worksRef.current.length > 0) {
          worksRef.current.forEach((work) => {
            if (!work) return;
            const wImg   = work.querySelector('[data-work-image]');
            const wTitle = work.querySelector('[data-work-title]');
            const wDesc  = work.querySelector('[data-work-desc]');
            const wTl = gsap.timeline({ scrollTrigger: { trigger: work, start: 'top 80%', end: 'bottom 20%', scrub: 1.2 } });
            if (wTitle) wTl.fromTo(wTitle, { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
            if (wDesc)  wTl.fromTo(wDesc,  { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3');
            if (wImg)   wTl.fromTo(wImg,   { opacity: 0, scale: 0.98 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' }, '-=0.4');
          });
        }

        // PINNED NARRATIVE
        const pinnedSection = sectionsRef.current[5];
        const pinnedImage   = imagesRef.current[2];
        const pinnedTexts   = [textsRef.current[8], textsRef.current[9]];
        if (pinnedSection && pinnedImage) {
          const pTl = gsap.timeline({
            scrollTrigger: { trigger: pinnedSection, start: 'top top', end: '+=180%', scrub: 1.5, pin: true, anticipatePin: 1 },
          });
          pTl
            .fromTo(pinnedTexts.filter(Boolean), { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 })
            .to(pinnedTexts.filter(Boolean), { opacity: 1, duration: 0.3 })
            .to(pinnedTexts.filter(Boolean), { opacity: 0, y: -30, duration: 0.4 }, '+=0.2')
            .to(pinnedImage, { scale: 1.04, y: '-5%', duration: 0.5, ease: 'power1.out' }, '-=0.1');
        }

        // HORIZONTAL SCROLL
        const horizontalSection   = sectionsRef.current[6];
        const horizontalContainer = horizontalRef.current;
        if (horizontalSection && horizontalContainer) {
          const totalWidth = horizontalContainer.children.length * 70;
          const scrollX    = isRTL ? `${totalWidth - 100}%` : `-${totalWidth - 100}%`;
          gsap.to(horizontalContainer, {
            x: scrollX, ease: 'none',
            scrollTrigger: { trigger: horizontalSection, start: 'top top', end: '+=100%', scrub: 1, pin: true, anticipatePin: 1 },
          });
        }

        // TECH
        const clientsSection = sectionsRef.current[7];
        if (clientsSection && clientsRef.current.length > 0) {
          gsap.fromTo(
            clientsRef.current.filter(Boolean),
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 1.5, stagger: 0.15, ease: 'power2.out',
              scrollTrigger: { trigger: clientsSection, start: 'top 70%', toggleActions: 'play none none none' } }
          );
        }

        // SPLIT SCREEN
        const splitSection = sectionsRef.current[8];
        const splitLeft    = textsRef.current[10];
        const splitRight   = textsRef.current[11];
        if (splitSection) {
          const lX = isRTL ?  60 : -60;
          const rX = isRTL ? -60 :  60;
          const sTl = gsap.timeline({
            scrollTrigger: { trigger: splitSection, start: 'top top', end: '+=160%', scrub: 1.5, pin: true, anticipatePin: 1 },
          });
          sTl
            .fromTo(splitLeft,  { opacity: 0, x: lX }, { opacity: 1, x: 0, duration: 0.5 })
            .fromTo(splitRight, { opacity: 0, x: rX }, { opacity: 1, x: 0, duration: 0.5 }, '-=0.3')
            .to([splitLeft, splitRight], { opacity: 1, duration: 0.3 })
            .to([splitLeft, splitRight], { opacity: 0, y: -30, duration: 0.4 }, '+=0.2');
        }

        // SERVICES GRID
        const servicesSection = sectionsRef.current[9];
        if (servicesSection) {
          gsap.fromTo(
            Array.from({ length: 9 }, (_, i) => textsRef.current[12 + i]).filter(Boolean),
            { opacity: 0, y: 50 },
            { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power2.out',
              scrollTrigger: { trigger: servicesSection, start: 'top 70%', toggleActions: 'play none none none' } }
          );
        }

        ScrollTrigger.refresh();
      }, containerRef);
    }, 50);

    return () => {
      if (tid) clearTimeout(tid);
      if (ctx) ctx.revert();
    };
  }, [language, isRTL]);

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} key={`home-${language}`} className="bg-black text-white overflow-x-hidden" dir={dir}>
      <CursorGlow />
      <NoiseOverlay />
      <Header />

      {/* Floating CTA */}
      <div className={`fixed ${isRTL ? 'bottom-6 left-4 md:bottom-8 md:left-8' : 'bottom-6 right-4 md:bottom-8 md:right-8'} z-50`}>
        <button
          onClick={() => setIsFormOpen(true)}
          className={`group relative flex items-center gap-2 md:gap-3 px-4 py-3 md:px-6 md:py-4 bg-[#d4af37] text-black text-xs md:text-sm font-light tracking-widest uppercase transition-all duration-300 shadow-2xl hover:shadow-[#d4af37]/60 active:scale-95 overflow-hidden ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <span className="hidden sm:inline relative">{homeT('floatingCTA', 'Start Your Project')}</span>
          <span className="sm:hidden relative">Start</span>
          <svg className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:translate-x-1 relative ${isRTL ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>

      {/* ══ 01 HERO ══════════════════════════════════════════════════════════ */}
      <section id="hero" ref={(el) => (sectionsRef.current[0] = el)} className="relative min-h-screen h-screen overflow-hidden">
        <div className="absolute inset-0">
          <img
            ref={(el) => (imagesRef.current[0] = el)}
            src="assets/image/Herosection.png"
            alt={t('landing.hero.imageAlt', 'YANSY')}
            className="absolute inset-0 w-full h-full object-cover opacity-0"
            style={{ willChange: 'transform, opacity' }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/70" />
        {['top-8 left-8 border-t border-l', 'top-8 right-8 border-t border-r', 'bottom-8 left-8 border-b border-l', 'bottom-8 right-8 border-b border-r'].map((cls, i) => (
          <div key={i} className={`absolute ${cls} w-16 h-16 border-[#d4af37]/20 hidden md:block`} />
        ))}
        <div className="relative z-20 h-full flex items-center justify-center px-4 sm:px-6 md:px-8">
          <div className="text-center max-w-6xl mx-auto">
            <p ref={(el) => (textsRef.current[0.5] = el)} className="text-xs sm:text-sm font-light text-white/60 mb-4 sm:mb-8 tracking-widest uppercase opacity-0">
              {t('landing.hero.credentials', 'Trusted by growing companies • Since 2020')}
            </p>
            <h1
              ref={(el) => (textsRef.current[0] = el)}
              className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[13rem] font-light tracking-tight mb-4 sm:mb-6 opacity-0"
              style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: '-0.02em' }}
            >
              {t('landing.hero.title', 'YANSY')}
            </h1>
            <p ref={(el) => (textsRef.current[1] = el)} className="text-lg sm:text-xl md:text-2xl lg:text-4xl font-light text-white/70 mb-4 sm:mb-8 px-4 opacity-0">
              {t('landing.hero.subtitle', 'Full-stack product development for companies ready to scale')}
            </p>
            <p ref={(el) => (textsRef.current[1.5] = el)} className="text-sm sm:text-base md:text-lg font-light text-white/50 mb-8 sm:mb-12 max-w-3xl mx-auto px-4 opacity-0 leading-relaxed">
              {t('landing.hero.descriptionFull', 'We build digital products that drive measurable business growth.')}
            </p>
            <div ref={(el) => (textsRef.current[1.6] = el)} className={`flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center opacity-0 px-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
              <button
                onClick={() => setIsFormOpen(true)}
                className="group w-full sm:w-auto relative px-8 sm:px-12 py-3 sm:py-4 border-2 border-[#d4af37] text-[#d4af37] text-xs sm:text-sm font-light tracking-widest uppercase hover:bg-[#d4af37] hover:text-black transition-all duration-500 active:scale-95 overflow-hidden"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                {t('landing.hero.startProject', 'Start Your Project')}
              </button>
              <a href="#work" className="w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-4 border-2 border-white/20 text-white text-xs sm:text-sm font-light tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-500 active:scale-95">
                {t('landing.hero.viewWork', 'View Our Work')}
              </a>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
          <span className="text-[10px] tracking-widest uppercase text-white/30">{isRTL ? 'للأسفل' : 'scroll'}</span>
          <div className="w-px h-10 bg-gradient-to-b from-white/40 to-transparent animate-pulse" />
        </div>
      </section>

      {/* ══ 02 EDITORIAL / ABOUT ═════════════════════════════════════════════ */}
      <section id="about" ref={(el) => (sectionsRef.current[1] = el)} className="relative min-h-screen flex items-center px-4 sm:px-6 md:px-8 py-20 sm:py-40 bg-black">
        <div className="absolute inset-0 opacity-[0.018]" style={{ backgroundImage: 'linear-gradient(#d4af37 1px,transparent 1px),linear-gradient(90deg,#d4af37 1px,transparent 1px)', backgroundSize: '80px 80px' }} />
        <div className={`max-w-7xl mx-auto w-full relative z-10 ${isRTL ? 'text-right' : 'text-left'}`}>
          <div className={`mb-12 sm:mb-20 ${isRTL ? 'text-right' : 'text-left'}`}>
            <span className={`block w-16 sm:w-24 h-px ${isRTL ? 'bg-gradient-to-l ml-auto' : 'bg-gradient-to-r mr-auto'} from-[#d4af37] to-transparent`} />
          </div>
          <div className="space-y-8 sm:space-y-16">
            <h2
              ref={(el) => (textsRef.current[2] = el)}
              className="text-4xl sm:text-6xl md:text-7xl xl:text-8xl 2xl:text-[9rem] font-light tracking-tight leading-[1.1] md:leading-[0.95] opacity-0"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {homeT('about.title', 'We deliver measurable')}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-white">
                {homeT('about.titleHighlight', 'business outcomes.')}
              </span>
            </h2>
            <p ref={(el) => (textsRef.current[3] = el)} className={`max-w-3xl text-base sm:text-xl lg:text-3xl font-light text-white/50 leading-relaxed opacity-0 ${isRTL ? 'ml-auto' : 'mr-auto'}`}>
              {homeT('about.description', 'Through strategic product development, enterprise-grade engineering, and user-centered design, we build digital products that drive growth.')}
            </p>
            <p ref={(el) => (textsRef.current[4] = el)} className="text-sm sm:text-lg font-light text-white/35 opacity-0">
              {homeT('about.services', 'Product Strategy | Enterprise Engineering | UX/UI Design | Growth Optimization')}
            </p>
            <div className={`grid grid-cols-3 gap-4 sm:gap-8 pt-8 border-t border-white/5 max-w-2xl ${isRTL ? 'ml-auto' : 'mr-auto'}`}>
              {[
                { num: '50+', lbl: isRTL ? 'مشروع منجز'  : 'Projects Delivered'   },
                { num: '4+',  lbl: isRTL ? 'سنوات خبرة'  : 'Years Experience'     },
                { num: '98%', lbl: isRTL ? 'رضا العملاء' : 'Client Satisfaction'  },
              ].map((s) => (
                <div key={s.num} className="group cursor-default">
                  <div className="text-2xl sm:text-4xl font-light text-[#d4af37] mb-1 transition-transform duration-300 group-hover:scale-110 origin-bottom">{s.num}</div>
                  <div className="text-xs text-white/30 tracking-wide">{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ 03 TEAM ══════════════════════════════════════════════════════════ */}
      <section ref={(el) => (sectionsRef.current[2] = el)} className="min-h-screen flex flex-col items-center px-4 sm:px-6 md:px-8 py-20 sm:py-32 bg-black relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #d4af37 0%, transparent 70%)' }} />
        <div className="max-w-6xl mx-auto w-full text-center relative z-10">
          <p className="text-xs tracking-widest text-[#d4af37]/60 uppercase mb-4">{isRTL ? 'فريق العمل' : 'The Team'}</p>
          <h2 className="text-3xl sm:text-5xl lg:text-7xl font-light mb-4 sm:mb-8 tracking-tight text-white/90" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {homeT('team.title', 'Built by specialists')}
          </h2>
          <p className="text-base sm:text-lg md:text-2xl font-light text-white/50 mb-12 sm:mb-20 max-w-3xl mx-auto px-4">
            {homeT('team.subtitle', 'Senior team with deep expertise across product strategy, design, and engineering.')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              { refIdx: 0, icon: <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>, nameKey: 'team.member1.name', nameDefault: 'Sara Ahmed',    roleKey: 'team.member1.role', roleDefault: 'Chief Creative Officer',    bioKey: 'team.member1.bio', bioDefault: '8+ years leading design systems for enterprise clients.' },
              { refIdx: 1, icon: <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>,                                                                                                                                                                                                                                                   nameKey: 'team.member2.name', nameDefault: 'Yousef Ahmed',  roleKey: 'team.member2.role', roleDefault: 'Lead Software Engineer',     bioKey: 'team.member2.bio', bioDefault: 'Full-stack architect specializing in scalable systems.' },
              { refIdx: 2, icon: <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,                                                                                  nameKey: 'team.member3.name', nameDefault: 'Mahmoud Ali',   roleKey: 'team.member3.role', roleDefault: 'Head of Product Strategy',  bioKey: 'team.member3.bio', bioDefault: 'Product strategist with proven track record.' },
            ].map((m, i) => (
              <div key={i} ref={(el) => (teamRef.current[m.refIdx] = el)} className={`opacity-0 group relative overflow-hidden ${i === 2 ? 'sm:col-span-2 lg:col-span-1' : ''}`}>
                <div className="relative p-8 sm:p-12 bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:border-[#d4af37]/50 transition-all duration-500 hover:-translate-y-1">
                  <span className="absolute top-0 left-0 w-0 group-hover:w-full h-px bg-gradient-to-r from-[#d4af37]/80 to-transparent transition-all duration-700" />
                  <div className="mb-6 sm:mb-8 flex justify-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-[#d4af37]/30 group-hover:border-[#d4af37]/70 flex items-center justify-center transition-all duration-500 group-hover:scale-110">{m.icon}</div>
                  </div>
                  <h3 className="text-xl sm:text-3xl font-light mb-2 text-white/90">{homeT(m.nameKey, m.nameDefault)}</h3>
                  <p className="text-xs sm:text-sm font-light text-[#d4af37] tracking-widest uppercase mb-4 sm:mb-6">{homeT(m.roleKey, m.roleDefault)}</p>
                  <p className="text-sm sm:text-base font-light text-white/50 leading-relaxed">{homeT(m.bioKey, m.bioDefault)}</p>
                  <span className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ★ PROCESS JOURNEY (NEW) ══════════════════════════════════════════ */}
      <section id="process" ref={(el) => (sectionsRef.current[10] = el)} className="relative py-24 sm:py-40 px-4 sm:px-6 md:px-8 bg-black overflow-hidden">
        <div className="absolute top-1/3 left-0 w-[40vw] h-[40vw] rounded-full opacity-[0.025] pointer-events-none" style={{ background: 'radial-gradient(circle, #d4af37 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-1/3 right-0 w-[30vw] h-[30vw] rounded-full opacity-[0.02] pointer-events-none"  style={{ background: 'radial-gradient(circle, #d4af37 0%, transparent 70%)', filter: 'blur(80px)' }} />

        <div className={`max-w-7xl mx-auto relative z-10 ${isRTL ? 'text-right' : 'text-left'}`}>
          <div className="mb-16 sm:mb-24">
            <p className="text-xs tracking-widest text-[#d4af37]/60 uppercase mb-4">{isRTL ? 'كيف نعمل' : 'How We Work'}</p>
            <h2 className="text-4xl sm:text-6xl lg:text-8xl font-light tracking-tight leading-tight mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {isRTL ? 'رحلة مشروعك ' : 'Your Project '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-white">
                {isRTL ? 'من الفكرة للواقع' : 'Journey'}
              </span>
            </h2>
            <p className="text-base sm:text-xl text-white/40 max-w-2xl">
              {isRTL
                ? 'عملية شفافة ومحكمة من أول لحظة حتى الإطلاق — تعرف بالضبط أين يقف مشروعك في كل وقت.'
                : 'A transparent, structured process from day one to launch — you always know exactly where your project stands.'}
            </p>
          </div>

          {/* Desktop snake grid */}
          <div className="hidden lg:block">
            <div className="relative grid grid-cols-4 gap-0">
              <div data-process-line className="absolute top-[52px] left-[12.5%] right-[12.5%] h-px origin-left"
                style={{ background: 'linear-gradient(90deg, #d4af37, #a07c18, #c9a227, #8a6810)' }} />
              {processSteps.slice(0, 4).map((step, i) => (
                <ProcessNode key={step.num} step={step} idx={i} activeProcess={activeProcess} setActiveProcess={setActiveProcess} refCallback={(el) => (processRef.current[i] = el)} />
              ))}
            </div>
            <div className="grid grid-cols-4">
              <div className="col-start-4 flex justify-center">
                <div className="w-px h-16" style={{ background: 'linear-gradient(to bottom, #8a6810, #d4af37)' }} />
              </div>
            </div>
            <div className="relative grid grid-cols-4 gap-0">
              <div className="absolute top-[52px] left-[12.5%] right-[12.5%] h-px"
                style={{ background: 'linear-gradient(270deg, #d4af37, #a07c18, #c9a227, #b8911f)' }} />
              {processSteps.slice(4, 8).reverse().map((step, i) => {
                const gi = 7 - i;
                return <ProcessNode key={step.num} step={step} idx={gi} activeProcess={activeProcess} setActiveProcess={setActiveProcess} refCallback={(el) => (processRef.current[gi] = el)} />;
              })}
            </div>
          </div>

          {/* Mobile vertical accordion */}
          <div className="lg:hidden space-y-0">
            {processSteps.map((step, i) => (
              <div key={step.num} className="relative flex gap-4 sm:gap-6">
                <div className="flex flex-col items-center">
                  <button
                    className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10"
                    style={{ borderColor: activeProcess === i ? step.color : 'rgba(255,255,255,0.15)', backgroundColor: activeProcess === i ? `${step.color}20` : 'rgba(0,0,0,0.9)', boxShadow: activeProcess === i ? `0 0 20px ${step.color}30` : 'none' }}
                    onClick={() => setActiveProcess(activeProcess === i ? null : i)}
                  >
                    <span className="text-xl">{step.icon}</span>
                  </button>
                  {i < processSteps.length - 1 && (
                    <div className="w-px flex-1 min-h-[2rem]" style={{ background: `linear-gradient(to bottom, ${step.color}40, transparent)` }} />
                  )}
                </div>
                <div className="flex-1 pb-8 sm:pb-10">
                  <div className="flex items-center gap-2 mb-1 cursor-pointer" onClick={() => setActiveProcess(activeProcess === i ? null : i)}>
                    <span className="text-xs px-2 py-0.5 rounded-full font-light" style={{ backgroundColor: `${step.color}20`, color: step.color }}>{step.num}</span>
                    <h3 className="text-base sm:text-lg font-light transition-colors duration-300" style={{ color: activeProcess === i ? step.color : 'rgba(255,255,255,0.85)' }}>{step.title}</h3>
                    <span className="ml-auto text-white/30 text-xs transition-transform duration-300" style={{ transform: activeProcess === i ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▼</span>
                  </div>
                  <p className="text-xs text-white/30 mb-1 tracking-wide">{step.sub}</p>
                  <div className="overflow-hidden transition-all duration-500" style={{ maxHeight: activeProcess === i ? '200px' : '0', opacity: activeProcess === i ? 1 : 0 }}>
                    <p className="text-sm text-white/60 leading-relaxed mb-2 mt-2">{step.desc}</p>
                    <p className="text-xs text-white/30 leading-loose">{step.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 sm:mt-20 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => setIsFormOpen(true)}
              className="group relative px-10 py-4 border-2 border-[#d4af37] text-[#d4af37] text-xs font-light tracking-widest uppercase hover:bg-[#d4af37] hover:text-black transition-all duration-500 active:scale-95 overflow-hidden"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              {isRTL ? '← ابدأ مشروعك الآن' : 'Start Your Project Now →'}
            </button>
            <p className="text-xs text-white/30 text-center">
              {isRTL ? 'استشارة مجانية • بدون التزام • رد خلال 24 ساعة' : 'Free consultation • No obligation • Reply within 24h'}
            </p>
          </div>
        </div>
      </section>

      {/* ══ 04 SIDE-BY-SIDE (E-COMMERCE) ═════════════════════════════════════ */}
      <section ref={(el) => (sectionsRef.current[3] = el)} className="min-h-screen flex items-center px-4 sm:px-6 md:px-8 py-20 sm:py-32">
        <div className={`max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16 items-center w-full ${isRTL ? 'rtl' : ''}`}>
          <div className={isRTL ? 'lg:order-2' : ''}>
            <h2 ref={(el) => (textsRef.current[5] = el)} className="text-3xl sm:text-5xl lg:text-7xl font-light mb-4 sm:mb-8 tracking-tight opacity-0" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {homeT('ecommerce.title', 'E-commerce that converts')}
            </h2>
            <p ref={(el) => (textsRef.current[6] = el)} className="text-base sm:text-xl lg:text-2xl font-light text-white/60 mb-4 sm:mb-6 leading-relaxed opacity-0">
              {homeT('ecommerce.description', 'High-performance platforms built for scale. From product discovery to checkout, every touchpoint optimized for conversion.')}
            </p>
            <p ref={(el) => (textsRef.current[7] = el)} className="text-sm sm:text-lg font-light text-white/40 opacity-0">
              {homeT('ecommerce.features', 'Headless architecture. Seamless integrations. Lightning fast.')}
            </p>
            <div className="flex flex-wrap gap-2 mt-6">
              {(isRTL ? ['تجارة بدون رأس', 'تكامل ERP', 'تحسين التحويل', 'دفع آمن'] : ['Headless Commerce', 'ERP Integration', 'Conversion Optimized', 'Secure Checkout']).map((tag) => (
                <span key={tag} className="px-3 py-1 text-xs border border-[#d4af37]/20 text-[#d4af37]/60 tracking-wide hover:border-[#d4af37]/50 hover:text-[#d4af37] transition-all duration-300 cursor-default">{tag}</span>
              ))}
            </div>
          </div>
          <div className={`group overflow-hidden ${isRTL ? 'lg:order-1' : ''}`}>
            <img
              ref={(el) => (imagesRef.current[1] = el)}
              src="assets/image/pro/e-commerce.png"
              alt={homeT('ecommerce.imageAlt', 'E-commerce')}
              className="w-full h-auto md:h-[400px] lg:h-[500px] xl:h-[600px] object-cover rounded-lg opacity-0 transition-transform duration-700 group-hover:scale-[1.03]"
              style={{ willChange: 'transform, opacity' }}
            />
          </div>
        </div>
      </section>

      {/* ══ 05 WORKS / CASE STUDIES ══════════════════════════════════════════ */}
      <section id="work" ref={(el) => (sectionsRef.current[4] = el)} className="min-h-screen px-4 sm:px-6 md:px-8 py-20 sm:py-40 bg-black">
        <div className={`max-w-7xl mx-auto ${isRTL ? 'rtl' : ''}`}>
          <div className={`mb-20 sm:mb-40 ${isRTL ? 'text-right' : 'text-left'}`}>
            <p className="text-xs sm:text-sm tracking-widest text-white/40 uppercase mb-4 sm:mb-6">{homeT('works.title', 'Our work')}</p>
            <h2 className="text-4xl sm:text-6xl lg:text-8xl font-light tracking-tight leading-none" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {homeT('works.subtitle', 'Digital products')}<br />{homeT('works.subtitle2', 'built to scale')}
            </h2>
          </div>

          {[
            { ref: 0, imgSrc: '/assets/image/pro/e-commerce2.png', catKey: 'works.work1.category', catDef: 'E-commerce Infrastructure', titleKey: 'works.work1.title', titleDef: 'Nexus Commerce', descKey: 'works.work1.description', descDef: 'A growing e-commerce brand needed a platform...', imgLeft: false },
            { ref: 1, imgSrc: '/assets/image/pro/vault.png',        catKey: 'works.work2.category', catDef: 'SaaS & Analytics',          titleKey: 'works.work2.title', titleDef: 'Vault Analytics', descKey: 'works.work2.description', descDef: 'A B2B SaaS company required a data platform...', imgLeft: true  },
            { ref: 2, imgSrc: 'assets/image/pro/AirStudios.png',    catKey: 'works.work3.category', catDef: 'Digital Products',          titleKey: 'works.work3.title', titleDef: 'Aria Studio',     descKey: 'works.work3.description', descDef: 'A creative agency needed a digital workspace...', imgLeft: false },
          ].map((w, wi) => (
            <div key={wi} ref={(el) => (worksRef.current[w.ref] = el)} className={`${wi < 2 ? 'mb-24 sm:mb-48' : ''} group`}>
              <div className={`grid grid-cols-1 lg:grid-cols-5 gap-8 sm:gap-16 items-center ${isRTL ? 'rtl' : ''}`}>
                <div className={`lg:col-span-2 space-y-4 sm:space-y-6 ${w.imgLeft ? (isRTL ? 'order-1 lg:order-2' : 'order-1 lg:order-2') : (isRTL ? 'lg:order-2' : '')}`}>
                  <span className="text-xs sm:text-sm uppercase tracking-widest text-white/40">{homeT(w.catKey, w.catDef)}</span>
                  <h3 data-work-title className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight opacity-0" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{homeT(w.titleKey, w.titleDef)}</h3>
                  <p data-work-desc className="text-base sm:text-xl font-light text-white/50 leading-relaxed opacity-0">{homeT(w.descKey, w.descDef)}</p>
                </div>
                <div className={`lg:col-span-3 ${w.imgLeft ? (isRTL ? 'order-2 lg:order-1' : 'order-2 lg:order-1') : (isRTL ? 'lg:order-1' : '')}`}>
                  <div data-work-image className="relative aspect-[16/10] overflow-hidden rounded-xl sm:rounded-2xl bg-white/5 opacity-0 transition-transform duration-700 group-hover:scale-[1.02]">
                    <img src={w.imgSrc} alt={homeT(w.titleKey, w.titleDef)} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-black/30" />
                    <span className={`absolute bottom-4 sm:bottom-6 ${isRTL ? 'right-4 sm:right-6' : 'left-4 sm:left-6'} w-16 sm:w-24 h-px ${isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-[#d4af37]/80 to-transparent`} />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="text-center mt-16 sm:mt-32">
            <button
              onClick={() => setIsFormOpen(true)}
              className="group relative inline-block px-8 sm:px-12 py-4 sm:py-5 border-2 border-[#d4af37] text-[#d4af37] text-xs sm:text-sm font-light tracking-widest uppercase hover:bg-[#d4af37] hover:text-black transition-all duration-500 active:scale-95 overflow-hidden"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              {homeT('works.cta', 'Start Your Project →')}
            </button>
          </div>
        </div>
      </section>

      {/* ══ 06 PINNED NARRATIVE (SAAS) ═══════════════════════════════════════ */}
      <section ref={(el) => (sectionsRef.current[5] = el)} className="relative min-h-screen h-screen overflow-hidden">
        <div className="absolute inset-0">
          <img ref={(el) => (imagesRef.current[2] = el)} src="assets/image/pro/Saas.png" alt={homeT('saas.imageAlt', 'SaaS')} className="absolute inset-0 w-full h-full object-cover" style={{ willChange: 'transform' }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70" />
        <div className="relative z-20 h-full flex items-center justify-center px-4 sm:px-8">
          <div className="text-center max-w-5xl mx-auto">
            <h2 ref={(el) => (textsRef.current[8] = el)} className="text-5xl sm:text-7xl lg:text-9xl font-light mb-6 sm:mb-8 opacity-0" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {homeT('saas.title', 'SaaS platforms')}
            </h2>
            <p ref={(el) => (textsRef.current[9] = el)} className="text-xl sm:text-3xl font-light text-white/70 opacity-0 px-4">
              {homeT('saas.subtitle', 'Complex systems. Simple experiences.')}
            </p>
          </div>
        </div>
      </section>

      {/* ══ 07 HORIZONTAL SCROLL (SERVICES) ═════════════════════════════════ */}
      <section ref={(el) => (sectionsRef.current[6] = el)} className="relative min-h-screen h-screen overflow-hidden bg-black">
        <div className="h-full flex items-center">
          <div ref={horizontalRef} className="flex gap-0" style={{ width: '400%' }}>
            {[
              { bg: '/assets/image/Designer30.png', tKey: 'services.strategy',    tDef: 'Strategy',    dKey: 'services.strategyDesc',    dDef: 'Research. Discovery. Architecture.' },
              { bg: '/assets/image/Designer20.png', tKey: 'services.design',      tDef: 'Design',      dKey: 'services.designDesc',      dDef: 'User experience. Interface. Motion.' },
              { bg: '/assets/image/Designer25.png', tKey: 'services.engineering', tDef: 'Engineering', dKey: 'services.engineeringDesc', dDef: 'Development. Integration. Deployment.' },
              { bg: '/assets/image/Designer27.png', tKey: 'services.growth',      tDef: 'Growth',      dKey: 'services.growthDesc',      dDef: 'Optimization. Analytics. Scale.' },
            ].map((s) => (
              <div key={s.tDef} className="relative w-screen h-screen flex items-center justify-center text-white" style={{ backgroundImage: `url(${s.bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div className="absolute inset-0 bg-black/70" />
                <div className="relative z-10 max-w-2xl px-6 sm:px-8 text-center">
                  <h3 className="text-4xl sm:text-6xl lg:text-7xl font-light mb-3 sm:mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{homeT(s.tKey, s.tDef)}</h3>
                  <p className="text-lg sm:text-2xl font-light text-white/70">{homeT(s.dKey, s.dDef)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 08 TECHNOLOGIES ══════════════════════════════════════════════════ */}
      <section ref={(el) => (sectionsRef.current[7] = el)} className="min-h-screen flex items-center px-4 sm:px-6 md:px-8 py-20 sm:py-32 bg-black">
        <div className={`max-w-7xl mx-auto w-full ${isRTL ? 'text-right' : 'text-left'}`}>
          <h2 className="text-4xl sm:text-6xl lg:text-8xl font-light mb-16 sm:mb-32 tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {homeT('technologies.title', 'Built with')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 sm:gap-x-16 gap-y-12 sm:gap-y-20">
            {['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Docker', 'GraphQL', 'Next.js'].map((tech, i) => (
              <div key={tech} ref={(el) => (clientsRef.current[i] = el)} className="opacity-0 group cursor-default">
                <div className="text-2xl sm:text-4xl font-light text-white/30 group-hover:text-[#d4af37]/60 transition-colors duration-300">{tech}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 09 SPLIT SCREEN (FAST / SECURE) ══════════════════════════════════ */}
      <section ref={(el) => (sectionsRef.current[8] = el)} className="relative min-h-screen h-screen overflow-hidden">
        <div className={`h-full grid grid-cols-1 md:grid-cols-2 ${isRTL ? 'rtl' : ''}`}>
          <div ref={(el) => (textsRef.current[10] = el)} className={`flex items-center justify-center px-6 sm:px-8 bg-black text-white ${isRTL ? 'border-l' : 'border-r'} border-white/10 opacity-0`}>
            <div className="max-w-md text-center md:text-left">
              <h3 className="text-4xl sm:text-6xl font-light mb-4 sm:mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{homeT('split.fast.title', 'Fast')}</h3>
              <p className="text-base sm:text-xl font-light text-white/60 leading-relaxed">{homeT('split.fast.description', 'Performance is not optional. Every millisecond matters. We build systems that feel instant.')}</p>
            </div>
          </div>
          <div ref={(el) => (textsRef.current[11] = el)} className="flex items-center justify-center px-6 sm:px-8 bg-white text-black opacity-0">
            <div className="max-w-md text-center md:text-left">
              <h3 className="text-4xl sm:text-6xl font-light mb-4 sm:mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{homeT('split.secure.title', 'Secure')}</h3>
              <p className="text-base sm:text-xl font-light text-black/60 leading-relaxed">{homeT('split.secure.description', 'Security built into every layer. From infrastructure to code. No compromises.')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 10 SERVICES GRID ═════════════════════════════════════════════════ */}
      <section ref={(el) => (sectionsRef.current[9] = el)} className="min-h-screen flex items-center px-4 sm:px-6 md:px-8 py-20 sm:py-32 bg-black">
        <div className={`max-w-7xl mx-auto w-full ${isRTL ? 'rtl' : ''}`}>
          <div className={`mb-12 sm:mb-20 ${isRTL ? 'text-right' : 'text-left'}`}>
            <h2 className="text-4xl sm:text-6xl lg:text-8xl font-light mb-4 sm:mb-6 tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{homeT('whatWeBuild.title', 'Some of our services')}</h2>
            <p className="text-base sm:text-xl lg:text-2xl font-light text-white/50 max-w-4xl">{homeT('whatWeBuild.subtitle', "We build custom digital solutions tailored to your needs")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
            {[
              { key: 'websites',             title: 'Websites',                description: 'Brand experiences that leave lasting impressions.'                                      },
              { key: 'ecommerce',            title: 'E-commerce',              description: 'Platforms that scale with your business.'                                               },
              { key: 'saas',                 title: 'SaaS',                    description: 'Complex systems. Simple experiences.'                                                   },
              { key: 'educationalPlatforms', title: 'Educational Platforms',   description: 'Interactive learning systems with course, student, and certificate management.'         },
              { key: 'medicalWebsites',      title: 'Medical Websites',        description: 'Professional websites for clinics and hospitals.'                                       },
              { key: 'medicalBooking',       title: 'Medical Booking Systems', description: 'Smart booking platforms with advanced scheduling and auto-reminders.'                   },
              { key: 'dashboards',           title: 'Professional Dashboards', description: 'Comprehensive management systems for data, reports, and operations.'                    },
              { key: 'deliveryApps',         title: 'Delivery Apps',           description: 'Complete delivery platforms with real-time tracking and secure payments.'               },
            ].map((service, index) => (
              <div key={service.key} ref={(el) => (textsRef.current[12 + index] = el)} className="opacity-0 group cursor-default">
                <div className="p-1 border-b border-white/5 group-hover:border-[#d4af37]/20 transition-all duration-500">
                  <h3 className="text-2xl sm:text-4xl font-light mb-3 sm:mb-4 group-hover:text-[#d4af37]/80 transition-colors duration-300" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    {homeT(`whatWeBuild.${service.key}.title`, service.title)}
                  </h3>
                  <p className="text-sm sm:text-lg font-light text-white/50 leading-relaxed">{homeT(`whatWeBuild.${service.key}.description`, service.description)}</p>
                </div>
              </div>
            ))}
            <div ref={(el) => (textsRef.current[20] = el)} className="opacity-0 sm:col-span-2 lg:col-span-1">
              <div className="relative p-6 sm:p-8 border border-[#d4af37]/30 rounded-lg bg-gradient-to-br from-[#d4af37]/5 to-transparent hover:border-[#d4af37]/60 transition-all duration-500 group cursor-pointer overflow-hidden" onClick={() => setIsFormOpen(true)}>
                <h3 className="text-2xl sm:text-4xl font-light mb-3 sm:mb-4 text-[#d4af37]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{homeT('whatWeBuild.customSolutions.title', 'Custom Solutions')}</h3>
                <p className="text-sm sm:text-lg font-light text-white/70 leading-relaxed mb-4">{homeT('whatWeBuild.customSolutions.description', "Have a different idea? We turn any concept into a successful digital product.")}</p>
                <span className="text-xs text-[#d4af37]/60 tracking-widest uppercase group-hover:text-[#d4af37] transition-colors duration-300">{isRTL ? 'أخبرنا عن فكرتك ←' : '→ Tell us your idea'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 11 CONTACT ═══════════════════════════════════════════════════════ */}
      <section id="contact" className="min-h-screen flex items-center justify-center bg-black px-4 sm:px-8 py-20 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(212,175,55,0.04) 0%, transparent 70%)' }} />
        <div className={`text-center max-w-5xl mx-auto relative z-10 ${isRTL ? 'rtl' : ''}`}>
          <h2 className="text-5xl sm:text-8xl xl:text-[10rem] font-light mb-8 sm:mb-12 tracking-tight leading-none" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {homeT('contact.title', "Let's talk")}
          </h2>
          <p className="text-xl sm:text-3xl font-light text-white/60 mb-4 sm:mb-8 leading-relaxed px-4">{homeT('contact.subtitle', 'Ready to discuss your project?')}</p>
          <p className="text-base sm:text-xl font-light text-white/40 mb-10 sm:mb-16 px-4">{homeT('contact.description', 'Book a 30-minute discovery call. We respond within 24 hours.')}</p>

          <div className={`flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-stretch sm:items-center mb-8 sm:mb-12 px-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
            <button
              onClick={() => setIsFormOpen(true)}
              className="group w-full sm:w-auto relative inline-block px-8 sm:px-12 py-4 sm:py-5 border-2 border-[#d4af37] text-[#d4af37] text-xs sm:text-sm font-light tracking-widest uppercase hover:bg-[#d4af37] hover:text-black transition-all duration-500 active:scale-95 overflow-hidden"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              {homeT('contact.startProject', 'Start Your Project')}
            </button>
            <a href="https://wa.me/201090385390?text=Hello%20YANSY%2C%20I%20would%20like%20to%20schedule%20a%20free%20consultation." target="_blank" rel="noopener noreferrer"
              className={`group w-full sm:w-auto inline-flex justify-center items-center gap-2 sm:gap-3 px-8 sm:px-12 py-4 sm:py-5 border-2 border-white/20 text-white text-xs sm:text-sm font-light tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-500 active:scale-95 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
              <span className="hidden sm:inline">{homeT('contact.scheduleCall', 'Schedule a Call')}</span>
              <span className="sm:hidden">Call</span>
            </a>
            <a href="https://wa.me/201090385390?text=Hello%2C%20I%27d%20like%20to%20discuss%20a%20project%20with%20YANSY." target="_blank" rel="noopener noreferrer"
              className={`group w-full sm:w-auto inline-flex justify-center items-center gap-2 sm:gap-3 px-8 sm:px-12 py-4 sm:py-5 border-2 border-white/30 text-white text-xs sm:text-sm font-light tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-500 active:scale-95 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
              <span className="hidden sm:inline">{homeT('contact.whatsapp', 'Chat on WhatsApp')}</span>
              <span className="sm:hidden">Chat</span>
            </a>
          </div>

          <div className={`flex flex-wrap justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-white/40 px-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="hover:text-[#d4af37]/60 transition-colors duration-300">{homeT('contact.trust1', '✓ Free consultation')}</span>
            <span className="hover:text-[#d4af37]/60 transition-colors duration-300">{homeT('contact.trust2', '✓ No obligation')}</span>
            <span className="hover:text-[#d4af37]/60 transition-colors duration-300">{homeT('contact.trust3', '✓ Response within 24h')}</span>
          </div>
        </div>
      </section>

      {/* ══ 12 TESTIMONIALS + FOOTER ══════════════════════════════════════════ */}
      <Testimonials />
      <Footer />

      <ProjectRequestForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
};

export default Home;