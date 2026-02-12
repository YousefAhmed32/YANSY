import { useLayoutEffect, useRef, useState } from 'react';
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

const Home = () => {
  const { t, i18n } = useTranslation();
  const { isRTL, dir, language } = useLanguage();
  
  // Use keyPrefix for cleaner translation calls
  // All keys under landing.home.* can use this prefix
  const homeT = (key, fallback) => t(`landing.home.${key}`, fallback);
  const sectionsRef = useRef([]);
  const imagesRef = useRef([]);
  const textsRef = useRef([]);
  const horizontalRef = useRef(null);
  const teamRef = useRef([]);
  const worksRef = useRef([]);
  const clientsRef = useRef([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const containerRef = useRef(null);

  // Main animation setup with gsap.context for proper cleanup
  useLayoutEffect(() => {
    let ctx = null;
    let timeoutId = null;

    // Wait for DOM to fully update after language change
    // This ensures all text translations are rendered before initializing animations
    timeoutId = setTimeout(() => {
      if (!containerRef.current) return;

      // Create GSAP context for scoped animations and proper cleanup
      ctx = gsap.context(() => {
        // ========== HERO FOCUS SECTION ==========
        const heroSection = sectionsRef.current[0];
        const heroImage = imagesRef.current[0];
        const heroTitle = textsRef.current[0];
        const heroSubtitle = textsRef.current[1];

        if (heroSection && heroImage && heroTitle) {
          const heroTl = gsap.timeline({
            scrollTrigger: {
              trigger: heroSection,
              start: 'top top',
              end: '+=180%',
              scrub: 1.5,
              pin: true,
              anticipatePin: 1,
            },
          });

          const heroCredentials = textsRef.current[0.5];
          const heroValueProp = textsRef.current[1.5];
          const heroCTAs = textsRef.current[1.6];

          heroTl
            .fromTo(heroCredentials, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3 })
            .fromTo(heroTitle, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.4 }, '-=0.2')
            .fromTo(heroSubtitle, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3 }, '-=0.2')
            .fromTo(heroValueProp, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3 }, '-=0.2')
            .fromTo(heroCTAs, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3 }, '-=0.2')
            .to([heroCredentials, heroTitle, heroSubtitle, heroValueProp, heroCTAs], { opacity: 1, duration: 0.3 })
            .to([heroCredentials, heroTitle, heroSubtitle, heroValueProp, heroCTAs], { opacity: 0, y: -30, duration: 0.4 }, '+=0.2')
            .to(heroImage, { scale: 1.05, opacity: 1, duration: 0.6 }, '-=0.2');
        }

        // ========== EDITORIAL TEXT SECTION ==========
        const editorialSection = sectionsRef.current[1];
        const editorialTexts = [textsRef.current[2], textsRef.current[3], textsRef.current[4]];

        if (editorialSection) {
          gsap.fromTo(
            editorialTexts.filter(Boolean),
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 1,
              stagger: 0.15,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: editorialSection,
                start: 'top 75%',
                toggleActions: 'play none none none',
              },
            }
          );
        }

        // ========== TEAM SECTION ==========
        const teamSection = sectionsRef.current[2];
        if (teamSection && teamRef.current.length > 0) {
          gsap.fromTo(
            teamRef.current.filter(Boolean),
            { opacity: 0, y: 60 },
            {
              opacity: 1,
              y: 0,
              duration: 1.2,
              stagger: 0.2,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: teamSection,
                start: 'top 70%',
                toggleActions: 'play none none none',
              },
            }
          );
        }

        // ========== SIDE-BY-SIDE SECTION ==========
        const sideSection = sectionsRef.current[3];
        const sideImage = imagesRef.current[1];
        const sideTexts = [textsRef.current[5], textsRef.current[6], textsRef.current[7]];

        if (sideSection && sideImage) {
          // RTL-aware x transforms: flip direction for RTL
          const textXFrom = isRTL ? 60 : -60;
          const imageXFrom = isRTL ? -60 : 60;

          gsap.fromTo(
            sideTexts.filter(Boolean),
            { opacity: 0, x: textXFrom },
            {
              opacity: 1,
              x: 0,
              duration: 1,
              stagger: 0.1,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: sideSection,
                start: 'top 70%',
                toggleActions: 'play none none none',
              },
            }
          );

          gsap.fromTo(
            sideImage,
            { opacity: 0, x: imageXFrom, scale: 0.98 },
            {
              opacity: 1,
              x: 0,
              scale: 1,
              duration: 1.2,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: sideSection,
                start: 'top 70%',
                toggleActions: 'play none none none',
              },
            }
          );
        }

        // ========== LAST WORKS SECTION ==========
        const worksSection = sectionsRef.current[4];
        if (worksSection && worksRef.current.length > 0) {
          worksRef.current.forEach((work, index) => {
            if (work) {
              const workImage = work.querySelector('[data-work-image]');
              const workTitle = work.querySelector('[data-work-title]');
              const workDesc = work.querySelector('[data-work-desc]');

              const workTl = gsap.timeline({
                scrollTrigger: {
                  trigger: work,
                  start: 'top 80%',
                  end: 'bottom 20%',
                  scrub: 1.2,
                },
              });

              if (workTitle) {
                workTl.fromTo(workTitle, { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
              }
              if (workDesc) {
                workTl.fromTo(workDesc, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3');
              }
              if (workImage) {
                workTl.fromTo(workImage, { opacity: 0, scale: 0.98 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' }, '-=0.4');
              }
            }
          });
        }

        // ========== PINNED NARRATIVE SECTION ==========
        const pinnedSection = sectionsRef.current[5];
        const pinnedImage = imagesRef.current[2];
        const pinnedTexts = [textsRef.current[8], textsRef.current[9]];

        if (pinnedSection && pinnedImage) {
          const pinnedTl = gsap.timeline({
            scrollTrigger: {
              trigger: pinnedSection,
              start: 'top top',
              end: '+=180%',
              scrub: 1.5,
              pin: true,
              anticipatePin: 1,
            },
          });

          // Act 1: Text appears
          pinnedTl
            .fromTo(
              pinnedTexts.filter(Boolean),
              { opacity: 0, y: 50 },
              { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 }
            )
            .to(pinnedTexts.filter(Boolean), { opacity: 1, duration: 0.3 })
            // Act 2: Text fades
            .to(pinnedTexts.filter(Boolean), { opacity: 0, y: -30, duration: 0.4 }, '+=0.2')
            // Act 3: Image moves
            .to(pinnedImage, { scale: 1.04, y: '-5%', duration: 0.5, ease: 'power1.out' }, '-=0.1');
        }

        // ========== HORIZONTAL SCROLL SECTION ==========
        const horizontalSection = sectionsRef.current[6];
        const horizontalContainer = horizontalRef.current;

        if (horizontalSection && horizontalContainer) {
          const items = horizontalContainer.children;
          const totalWidth = items.length * 70;
          
          // RTL-aware horizontal scroll: flip direction for RTL
          const scrollX = isRTL 
            ? `${totalWidth - 100}%`  // Positive for RTL (scroll right)
            : `-${totalWidth - 100}%`; // Negative for LTR (scroll left)

          gsap.to(horizontalContainer, {
            x: scrollX,
            ease: 'none',
            scrollTrigger: {
              trigger: horizontalSection,
              start: 'top top',
              end: '+=100%',
              scrub: 1,
              pin: true,
              anticipatePin: 1,
            },
          });
        }

        // ========== OUR CLIENTS SECTION ==========
        const clientsSection = sectionsRef.current[7];
        if (clientsSection && clientsRef.current.length > 0) {
          gsap.fromTo(
            clientsRef.current.filter(Boolean),
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 1.5,
              stagger: 0.15,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: clientsSection,
                start: 'top 70%',
                toggleActions: 'play none none none',
              },
            }
          );
        }

        // ========== SPLIT SCREEN SECTION ==========
        const splitSection = sectionsRef.current[8];
        const splitLeft = textsRef.current[10];
        const splitRight = textsRef.current[11];

        if (splitSection) {
          // RTL-aware split screen: flip x directions
          const leftXFrom = isRTL ? 60 : -60;
          const rightXFrom = isRTL ? -60 : 60;

          const splitTl = gsap.timeline({
            scrollTrigger: {
              trigger: splitSection,
              start: 'top top',
              end: '+=160%',
              scrub: 1.5,
              pin: true,
              anticipatePin: 1,
            },
          });

          splitTl
            .fromTo(splitLeft, { opacity: 0, x: leftXFrom }, { opacity: 1, x: 0, duration: 0.5 })
            .fromTo(splitRight, { opacity: 0, x: rightXFrom }, { opacity: 1, x: 0, duration: 0.5 }, '-=0.3')
            .to([splitLeft, splitRight], { opacity: 1, duration: 0.3 })
            .to([splitLeft, splitRight], { opacity: 0, y: -30, duration: 0.4 }, '+=0.2');
        }

        // ========== SERVICES GRID (STATIC) ==========
        const servicesSection = sectionsRef.current[9];
        const serviceCards = Array.from({ length: 6 }, (_, i) => textsRef.current[12 + i]);

        if (servicesSection) {
          gsap.fromTo(
            serviceCards.filter(Boolean),
            { opacity: 0, y: 50 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              stagger: 0.1,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: servicesSection,
                start: 'top 70%',
                toggleActions: 'play none none none',
              },
            }
          );
        }

        // Force ScrollTrigger to recalculate layout after language change
        // This ensures pinned sections and off-screen elements get correct measurements
        ScrollTrigger.refresh();
      }, containerRef); // Scope all animations to containerRef
    }, 50); // Small delay to ensure DOM is fully updated after language change

    // Cleanup function: clear timeout and revert GSAP context
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (ctx) {
        // Cleanup: revert all GSAP animations and ScrollTriggers in this context
        // This prevents memory leaks and duplicated ScrollTriggers
        ctx.revert();
      }
    };
  }, [language, isRTL]); // Re-run animations when language or RTL direction changes

  return (
    <div ref={containerRef} key={`home-${language}`} className="bg-black text-white overflow-x-hidden" dir={dir}>
      <Header />
      
      {/* Floating CTA */}
      <div className={`fixed ${isRTL ? 'bottom-8 left-8' : 'bottom-8 right-8'} z-50 hidden md:block`}>
        <button
          onClick={() => setIsFormOpen(true)}
          className={`flex items-center gap-3 px-6 py-4 bg-[#d4af37] text-black text-sm font-light tracking-widest uppercase hover:bg-white transition-all duration-300 shadow-lg ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <span>{homeT('floatingCTA', 'Start Your Project')}</span>
          <svg className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>

      {/* ========== HERO FOCUS SECTION ========== */}
      <section
        id="hero"
        ref={(el) => (sectionsRef.current[0] = el)}
        className="relative h-screen overflow-hidden"
      >
        <div className="absolute inset-0">
            <img
              ref={(el) => (imagesRef.current[0] = el)}
              src="assets/image/Herosection.png"
              alt={t('landing.hero.imageAlt', 'YANSY - Full-stack product development')}
              className="absolute inset-0 w-full h-full object-cover opacity-0"
              style={{ willChange: 'transform, opacity' }}
            />
        </div>
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-20 h-full flex items-center justify-center px-4">
          <div className="text-center max-w-6xl mx-auto">
            <p
              ref={(el) => (textsRef.current[0.5] = el)}
              className="text-sm md:text-base font-light text-white/60 mb-8 tracking-widest uppercase opacity-0"
            >
              {t('landing.hero.credentials', 'Trusted by growing companies • Since 2020')}
            </p>
            <h1
              ref={(el) => (textsRef.current[0] = el)}
              className="text-8xl md:text-9xl lg:text-[13rem] font-light tracking-tight mb-6 opacity-0"
            >
              {t('landing.hero.title', 'YANSY')}
            </h1>
            <p
              ref={(el) => (textsRef.current[1] = el)}
              className="text-2xl md:text-3xl lg:text-4xl font-light text-white/70 mb-8 opacity-0"
            >
              {t('landing.hero.subtitle', 'Full-stack product development for companies ready to scale')}
            </p>
            <p
              ref={(el) => (textsRef.current[1.5] = el)}
              className="text-lg md:text-xl font-light text-white/50 mb-12 max-w-3xl mx-auto opacity-0"
            >
              {t('landing.hero.descriptionFull', 'We build digital products that drive measurable business growth through strategic development, enterprise-grade engineering, and user-centered design.')}
            </p>
            <div
              ref={(el) => (textsRef.current[1.6] = el)}
              className={`flex flex-col sm:flex-row gap-4 justify-center items-center opacity-0 ${isRTL ? 'sm:flex-row-reverse' : ''}`}
            >
              <button
                onClick={() => setIsFormOpen(true)}
                className="px-12 py-4 border border-[#d4af37] text-[#d4af37] text-sm font-light tracking-widest uppercase hover:bg-[#d4af37] hover:text-black transition-all duration-500"
              >
                {t('landing.hero.startProject', 'Start Your Project')}
              </button>
              <a
                href="#work"
                className="px-12 py-4 border border-white/20 text-white text-sm font-light tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-500"
              >
                {t('landing.hero.viewWork', 'View Our Work')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========== EDITORIAL TEXT SECTION ========== */}

      <section
        id="about"
        ref={(el) => (sectionsRef.current[1] = el)}
        className="relative min-h-screen flex items-center px-4 py-40 bg-black"
      >
        <div className={`max-w-7xl mx-auto w-full ${isRTL ? 'text-right' : 'text-left'}`}>

          {/* Gold Accent */}
          <div className={`mb-20 ${isRTL ? 'text-right' : 'text-left'}`}>
            <span className={`block w-24 h-px ${isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-[#d4af37] to-transparent ${isRTL ? 'ml-auto' : 'mr-auto'}`} />
          </div>

          {/* Statement */}
          <div className="space-y-16">

            <h2
              ref={(el) => (textsRef.current[2] = el)}
              className="text-7xl md:text-8xl lg:text-[9rem] font-light tracking-tight leading-[0.95] opacity-0"
            >
              {homeT('about.title', 'We deliver measurable')}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-white">
                {homeT('about.titleHighlight', 'business outcomes.')}
              </span>
            </h2>

            <p
              ref={(el) => (textsRef.current[3] = el)}
              className={`max-w-3xl text-2xl md:text-3xl font-light text-white/50 leading-relaxed opacity-0 ${isRTL ? 'ml-auto' : 'mr-auto'}`}
            >
              {homeT('about.description', 'Through strategic product development, enterprise-grade engineering, and user-centered design, we build digital products that drive growth, efficiency, and competitive advantage for medium and large enterprises.')}
            </p>

            <p
              ref={(el) => (textsRef.current[4] = el)}
              className="text-xl md:text-2xl font-light text-white/35 opacity-0"
            >
              {homeT('about.services', 'Product Strategy | Enterprise Engineering | UX/UI Design | Growth Optimization')}
            </p>

          </div>
        </div>
      </section>


{/* ========== TEAM SECTION - NO PHOTOS ========== */}
<section
  ref={(el) => (sectionsRef.current[2] = el)}
  className="min-h-screen flex flex-col items-center px-4 py-32 bg-black"
>
  <div className="max-w-6xl mx-auto w-full text-center">
    <h2 className="text-5xl md:text-6xl lg:text-7xl font-light mb-8 tracking-tight leading-tight text-white/90">
      {homeT('team.title', 'Built by specialists')}
    </h2>
    
    <p className="text-xl md:text-2xl font-light text-white/50 mb-24 max-w-3xl mx-auto">
      {homeT('team.subtitle', 'Senior team with deep expertise across product strategy, design, and engineering. We focus on quality over scale.')}
    </p>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Team Member 1 - Creative */}
      <div
        ref={(el) => (teamRef.current[0] = el)}
        className="opacity-0 group relative overflow-hidden"
      >
        <div className="relative p-12 bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:border-[#d4af37]/50 transition-all duration-500">
          {/* Icon/Symbol */}
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-full border-2 border-[#d4af37]/30 flex items-center justify-center">
              <svg className="w-10 h-10 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
          </div>

          <h3 className="text-2xl md:text-3xl font-light mb-2 text-white/90">
            {homeT('team.member1.name', 'Sara Ahmed')}
          </h3>
          <p className="text-sm font-light text-[#d4af37] tracking-widest uppercase mb-6">
            {homeT('team.member1.role', 'Chief Creative Officer')}
          </p>
          <p className="text-base font-light text-white/50 leading-relaxed">
            {homeT('team.member1.bio', '8+ years leading design systems for enterprise clients. Former design lead at major tech companies.')}
          </p>

          {/* Accent line */}
          <span className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </div>

      {/* Team Member 2 - Engineering */}
      <div
        ref={(el) => (teamRef.current[1] = el)}
        className="opacity-0 group relative overflow-hidden"
      >
        <div className="relative p-12 bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:border-[#d4af37]/50 transition-all duration-500">
          {/* Icon/Symbol */}
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-full border-2 border-[#d4af37]/30 flex items-center justify-center">
              <svg className="w-10 h-10 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
          </div>

          <h3 className="text-2xl md:text-3xl font-light mb-2 text-white/90">
            {homeT('team.member2.name', 'Yousef Ahmed')}
          </h3>
          <p className="text-sm font-light text-[#d4af37] tracking-widest uppercase mb-6">
            {homeT('team.member2.role', 'Lead Software Engineer')}
          </p>
          <p className="text-base font-light text-white/50 leading-relaxed">
            {homeT('team.member2.bio', 'Full-stack architect specializing in scalable systems. Built platforms serving millions of users.')}
          </p>

          <span className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </div>

      {/* Team Member 3 - Product */}
      <div
        ref={(el) => (teamRef.current[2] = el)}
        className="opacity-0 group relative overflow-hidden"
      >
        <div className="relative p-12 bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:border-[#d4af37]/50 transition-all duration-500">
          {/* Icon/Symbol */}
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-full border-2 border-[#d4af37]/30 flex items-center justify-center">
              <svg className="w-10 h-10 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>

          <h3 className="text-2xl md:text-3xl font-light mb-2 text-white/90">
            {homeT('team.member3.name', 'Mahmoud Ali')}
          </h3>
          <p className="text-sm font-light text-[#d4af37] tracking-widest uppercase mb-6">
            {homeT('team.member3.role', 'Head of Product Strategy')}
          </p>
          <p className="text-base font-light text-white/50 leading-relaxed">
            {homeT('team.member3.bio', 'Product strategist with proven track record launching B2B SaaS products. Data-driven decision maker.')}
          </p>

          <span className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </div>
    </div>
  </div>
</section>







      {/* ========== SIDE-BY-SIDE SECTION ========== */}
      <section
        ref={(el) => (sectionsRef.current[3] = el)}
        className="min-h-screen flex items-center px-4 py-32"
      >
        <div className={`max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${isRTL ? 'rtl' : ''}`}>
          <div className={isRTL ? 'lg:order-2' : ''}>
            <h2
              ref={(el) => (textsRef.current[5] = el)}
              className="text-5xl md:text-6xl lg:text-7xl font-light mb-8 tracking-tight opacity-0"
            >
              {homeT('ecommerce.title', 'E-commerce that converts')}
            </h2>
            <p
              ref={(el) => (textsRef.current[6] = el)}
              className="text-xl md:text-2xl font-light text-white/60 mb-6 leading-relaxed opacity-0"
            >
              {homeT('ecommerce.description', 'High-performance platforms built for scale. From product discovery to checkout, every touchpoint optimized for conversion.')}
            </p>
            <p
              ref={(el) => (textsRef.current[7] = el)}
              className="text-lg md:text-xl font-light text-white/40 opacity-0"
            >
              {homeT('ecommerce.features', 'Headless architecture. Seamless integrations. Lightning fast.')}
            </p>
          </div>
          <div className={isRTL ? 'lg:order-1' : ''}>
            <img
              ref={(el) => (imagesRef.current[1] = el)}
              src="assets/image/pro/e-commerce.png"
              alt={homeT('ecommerce.imageAlt', 'E-commerce platform development')}
              className="w-full h-[600px] object-cover opacity-0"
              style={{ willChange: 'transform, opacity' }}
            />
          </div>
        </div>
      </section>

  {/* ========== LAST WORKS / CASE STUDIES ========== */}
<section
  id="work"
  ref={(el) => (sectionsRef.current[4] = el)}
  className="min-h-screen px-4 py-40 bg-black"
>
  <div className={`max-w-7xl mx-auto ${isRTL ? 'rtl' : ''}`}>
    {/* Section Header */}
    <div className={`mb-40 ${isRTL ? 'text-right' : 'text-left'}`}>
      <p className="text-sm tracking-widest text-white/40 uppercase mb-6">
        {homeT('works.title', 'Our work')}
      </p>
      <h2 className="text-6xl md:text-7xl lg:text-8xl font-light tracking-tight leading-none">
        {homeT('works.subtitle', 'Digital products')}
        <br />
        {homeT('works.subtitle2', 'built to scale')}
      </h2>
    </div>

    {/* ================= WORK 1 ================= */}
    <div ref={(el) => (worksRef.current[0] = el)} className="mb-48 group">
      <div className={`grid grid-cols-1 lg:grid-cols-5 gap-16 items-center ${isRTL ? 'rtl' : ''}`}>
        <div className={`lg:col-span-2 space-y-6 ${isRTL ? 'lg:order-2' : ''}`}>
          <span className="text-xs uppercase tracking-widest text-white/40">
            {homeT('works.work1.category', 'E-commerce Infrastructure')}
          </span>
          <h3
            data-work-title
            className="text-5xl md:text-6xl font-light tracking-tight opacity-0"
          >
            {homeT('works.work1.title', 'Nexus Commerce')}
          </h3>
          <p
            data-work-desc
            className="text-xl font-light text-white/50 leading-relaxed opacity-0"
          >
            {homeT('works.work1.description', 'A growing e-commerce brand needed a platform that could handle rapid scale without performance degradation. We architected a headless commerce solution with microservices infrastructure, enabling seamless third-party integrations and real-time inventory management. The platform now supports high-traffic periods, maintains sub-second load times, and provides a foundation for long-term growth.')}
          </p>
        </div>

        <div className={`lg:col-span-3 ${isRTL ? 'lg:order-1' : ''}`}>
          <div
            data-work-image
            className="relative aspect-[16/10] overflow-hidden rounded-2xl 
            bg-white/5 opacity-0
            transition-transform duration-700 ease-out
            group-hover:scale-[1.02]"
          >
            <img
              src="/assets/image/pro/e-commerce2.png"
              alt={homeT('works.work1.title', 'Nexus Commerce Platform UI')}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />

            {/* Luxury overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-black/30" />

            {/* Gold accent */}
            <span className={`absolute bottom-6 ${isRTL ? 'right-6' : 'left-6'} w-24 h-px 
              ${isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-[#d4af37]/80 to-transparent`} />
          </div>
        </div>
      </div>
    </div>

    {/* ================= WORK 2 ================= */}
    <div ref={(el) => (worksRef.current[1] = el)} className="mb-48 group">
      <div className={`grid grid-cols-1 lg:grid-cols-5 gap-16 items-center ${isRTL ? 'rtl' : ''}`}>
        <div className={`lg:col-span-3 ${isRTL ? 'order-2 lg:order-2' : 'order-2 lg:order-1'}`}>
          <div
            data-work-image
            className="relative aspect-[16/10] overflow-hidden rounded-2xl 
            bg-white/5 opacity-0
            transition-transform duration-700 group-hover:scale-[1.02]"
          >
            <img
              src="/assets/image/pro/vault.png"
              alt={homeT('works.work2.title', 'Vault Analytics Dashboard')}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />

            <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-black/30" />

            <span className={`absolute bottom-6 ${isRTL ? 'left-6' : 'right-6'} w-24 h-px 
              ${isRTL ? 'bg-gradient-to-r' : 'bg-gradient-to-l'} from-[#d4af37]/80 to-transparent`} />
          </div>
        </div>

        <div className={`lg:col-span-2 ${isRTL ? 'order-1 lg:order-1' : 'order-1 lg:order-2'} space-y-6`}>
          <span className="text-xs uppercase tracking-widest text-white/40">
            {homeT('works.work2.category', 'SaaS & Analytics')}
          </span>
          <h3
            data-work-title
            className="text-5xl md:text-6xl font-light tracking-tight opacity-0"
          >
            {homeT('works.work2.title', 'Vault Analytics')}
          </h3>
          <p
            data-work-desc
            className="text-xl font-light text-white/50 leading-relaxed opacity-0"
          >
            {homeT('works.work2.description', 'A B2B SaaS company required a data platform that could process complex analytics while remaining intuitive for non-technical users. We built a scalable architecture with real-time data processing, custom visualization components, and role-based access controls. The platform enables teams to make data-driven decisions faster, with enterprise-grade security and compliance built-in from day one.')}
          </p>
        </div>
      </div>
    </div>

    {/* ================= WORK 3 ================= */}
    <div ref={(el) => (worksRef.current[2] = el)} className="group">
      <div className={`grid grid-cols-1 lg:grid-cols-5 gap-16 items-center ${isRTL ? 'rtl' : ''}`}>
        <div className={`lg:col-span-2 space-y-6 ${isRTL ? 'lg:order-2' : ''}`}>
          <span className="text-xs uppercase tracking-widest text-white/40">
            {homeT('works.work3.category', 'Digital Products')}
          </span>
          <h3
            data-work-title
            className="text-5xl md:text-6xl font-light tracking-tight opacity-0"
          >
            {homeT('works.work3.title', 'Aria Studio')}
          </h3>
          <p
            data-work-desc
            className="text-xl font-light text-white/50 leading-relaxed opacity-0"
          >
            {homeT('works.work3.description', 'A creative agency needed a digital workspace that streamlined collaboration across distributed teams while maintaining a premium user experience. We designed and developed a unified platform with real-time collaboration features, intuitive project management, and seamless file sharing. The platform reduces friction in creative workflows and enables teams to deliver higher-quality work more efficiently.')}
          </p>
        </div>

        <div className={`lg:col-span-3 ${isRTL ? 'lg:order-1' : ''}`}>
          <div
            data-work-image
            className="relative aspect-[16/10] overflow-hidden rounded-2xl 
            bg-white/5 opacity-0
            transition-transform duration-700 group-hover:scale-[1.02]"
          >
            <img
              src="assets/image/pro/AirStudios.png"
              alt={homeT('works.work3.title', 'Aria Studio Product UI')}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />

            <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-black/30" />

            <span className={`absolute bottom-6 ${isRTL ? 'right-6' : 'left-6'} w-24 h-px 
              ${isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-[#d4af37]/80 to-transparent`} />
          </div>
        </div>
      </div>
    </div>
    
    {/* CTA after case studies */}
    <div className="text-center mt-32">
      <button
        onClick={() => setIsFormOpen(true)}
        className={`inline-block px-12 py-5 border border-[#d4af37] text-[#d4af37] text-sm font-light tracking-widest uppercase hover:bg-[#d4af37] hover:text-black transition-all duration-500 ${isRTL ? 'flex items-center gap-2 mx-auto' : ''}`}
      >
        {homeT('works.cta', 'Start Your Project →')}
      </button>
    </div>
  </div>
</section>



      {/* ========== PINNED NARRATIVE SECTION ========== */}
      <section
        ref={(el) => (sectionsRef.current[5] = el)}
        className="relative h-screen overflow-hidden"
      >
        <div className="absolute inset-0">
          <img
            ref={(el) => (imagesRef.current[2] = el)}
            src="assets/image/pro/Saas.png"
            alt={homeT('saas.imageAlt', 'SaaS platforms development')}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ willChange: 'transform' }}
          />
        </div>
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-20 h-full flex items-center justify-center px-4">
          <div className="text-center max-w-5xl mx-auto">
            <h2
              ref={(el) => (textsRef.current[8] = el)}
              className="text-7xl md:text-8xl lg:text-9xl font-light mb-8 opacity-0"
            >
              {homeT('saas.title', 'SaaS platforms')}
            </h2>
            <p
              ref={(el) => (textsRef.current[9] = el)}
              className="text-2xl md:text-3xl font-light text-white/70 opacity-0"
            >
              {homeT('saas.subtitle', 'Complex systems. Simple experiences.')}
            </p>
          </div>
        </div>
      </section>

      {/* ========== HORIZONTAL SCROLL SECTION ========== */}
      <section
        ref={(el) => (sectionsRef.current[6] = el)}
        className="relative h-screen overflow-hidden bg-black"
      >
        <div className="h-full flex items-center">
          <div
            ref={horizontalRef}
            className="flex gap-0"
            style={{ width: '400%' }}
          >

            {/* ===== Strategy ===== */}
            <div
              className="relative w-screen h-screen flex items-center justify-center text-white w-"
              style={{
                backgroundImage:
                  'url(/assets/image/Designer30.png)',
                // 'url(/assets/image/YANSY3.png)', 
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-black/70" />
              <div className="relative z-10 max-w-2xl px-8 text-center">
                <h3 className="text-6xl md:text-7xl font-light mb-4">{homeT('services.strategy', 'Strategy')}</h3>
                <p className="text-xl md:text-2xl font-light text-white/70">
                  {homeT('services.strategyDesc', 'Research. Discovery. Architecture.')}
                </p>
              </div>
            </div>

            {/* ===== Design ===== */}
            <div
              className="relative w-screen h-screen flex items-center justify-center text-white"
              style={{
                backgroundImage:
                  'url(/assets/image/Designer20.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-black/70" />
              <div className="relative z-10 max-w-2xl px-8 text-center">
                <h3 className="text-6xl md:text-7xl font-light mb-4">{homeT('services.design', 'Design')}</h3>
                <p className="text-xl md:text-2xl font-light text-white/70">
                  {homeT('services.designDesc', 'User experience. Interface. Motion.')}
                </p>
              </div>
            </div>

            {/* ===== Engineering ===== */}
            <div
              className="relative w-screen h-screen flex items-center justify-center text-white"
              style={{
                backgroundImage:
                  'url(/assets/image/Designer25.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-black/70" />
              <div className="relative z-10 max-w-2xl px-8 text-center">
                <h3 className="text-6xl md:text-7xl font-light mb-4">{homeT('services.engineering', 'Engineering')}</h3>
                <p className="text-xl md:text-2xl font-light text-white/70">
                  {homeT('services.engineeringDesc', 'Development. Integration. Deployment.')}
                </p>
              </div>
            </div>

            {/* ===== Growth ===== */}
            <div
              className="relative w-screen h-screen flex items-center justify-center text-white"
              style={{
                backgroundImage:
                  'url(/assets/image/Designer27.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-black/70" />
              <div className="relative z-10 max-w-2xl px-8 text-center">
                <h3 className="text-6xl md:text-7xl font-light mb-4">{homeT('services.growth', 'Growth')}</h3>
                <p className="text-xl md:text-2xl font-light text-white/70">
                  {homeT('services.growthDesc', 'Optimization. Analytics. Scale.')}
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ========== TECHNOLOGIES WE USE ========== */}
      <section
        ref={(el) => (sectionsRef.current[7] = el)}
        className="min-h-screen flex items-center px-4 py-32 bg-black"
      >
        <div className={`max-w-7xl mx-auto w-full ${isRTL ? 'text-right' : 'text-left'}`}>
          <h2 className="text-6xl md:text-7xl lg:text-8xl font-light mb-32 tracking-tight">
            {homeT('technologies.title', 'Built with')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-16 gap-y-20">
            <div ref={(el) => (clientsRef.current[0] = el)} className="opacity-0">
              <div className="text-3xl md:text-4xl font-light text-white/30">React...........................</div>
              <div className="text-3xl md:text-4xl font-light text-white/30">React...........................</div>
              <div className="text-3xl md:text-4xl font-light text-white/30">React.dfadfasdfasdf.....................</div>
            </div>
            <div ref={(el) => (clientsRef.current[1] = el)} className="opacity-0">
              <div className="text-3xl md:text-4xl font-light text-white/30">Node.js</div>
            </div>
            <div ref={(el) => (clientsRef.current[2] = el)} className="opacity-0">
              <div className="text-3xl md:text-4xl font-light text-white/30">TypeScript</div>
            </div>
            <div ref={(el) => (clientsRef.current[3] = el)} className="opacity-0">
              <div className="text-3xl md:text-4xl font-light text-white/30">PostgreSQL</div>
            </div>
            <div ref={(el) => (clientsRef.current[4] = el)} className="opacity-0">
              <div className="text-3xl md:text-4xl font-light text-white/30">AWS</div>
            </div>
            <div ref={(el) => (clientsRef.current[5] = el)} className="opacity-0">
              <div className="text-3xl md:text-4xl font-light text-white/30">Docker</div>
            </div>
            <div ref={(el) => (clientsRef.current[6] = el)} className="opacity-0">
              <div className="text-3xl md:text-4xl font-light text-white/30">GraphQL</div>
            </div>
            <div ref={(el) => (clientsRef.current[7] = el)} className="opacity-0">
              <div className="text-3xl md:text-4xl font-light text-white/30">Next.js</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SPLIT SCREEN SECTION ========== */}
      <section
        ref={(el) => (sectionsRef.current[8] = el)}
        className="relative h-screen overflow-hidden"
      >
        <div className={`h-full grid grid-cols-1 md:grid-cols-2 ${isRTL ? 'rtl' : ''}`}>
          <div
            ref={(el) => (textsRef.current[10] = el)}
            className={`flex items-center justify-center px-8 bg-black text-white ${isRTL ? 'border-l' : 'border-r'} border-white/10 opacity-0`}
          >
            <div className="max-w-md">
              <h3 className="text-5xl md:text-6xl font-light mb-6">{homeT('split.fast.title', 'Fast')}</h3>
              <p className="text-lg md:text-xl font-light text-white/60 leading-relaxed">
                {homeT('split.fast.description', 'Performance is not optional. Every millisecond matters. We build systems that feel instant.')}
              </p>
            </div>
          </div>
          <div
            ref={(el) => (textsRef.current[11] = el)}
            className="flex items-center justify-center px-8 bg-white text-black opacity-0"
          >
            <div className="max-w-md">
              <h3 className="text-5xl md:text-6xl font-light mb-6">{homeT('split.secure.title', 'Secure')}</h3>
              <p className="text-lg md:text-xl font-light text-black/60 leading-relaxed">
                {homeT('split.secure.description', 'Security built into every layer. From infrastructure to code. No compromises.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SERVICES GRID (STATIC) ========== */}
   {/* ========== SERVICES GRID (STATIC) ========== */}
<section
  ref={(el) => (sectionsRef.current[9] = el)}
  className="min-h-screen flex items-center px-4 py-32 bg-black"
>
  <div className={`max-w-7xl mx-auto ${isRTL ? 'rtl' : ''}`}>
    {/* Header */}
    <div className={`mb-20 ${isRTL ? 'text-right' : 'text-left'}`}>
      <h2 className="text-6xl md:text-7xl lg:text-8xl font-light mb-6 tracking-tight">
        {homeT('whatWeBuild.title', 'Some of our services')}
      </h2>
      <p className="text-xl md:text-2xl font-light text-white/50 max-w-4xl">
        {homeT('whatWeBuild.subtitle', 'We build custom digital solutions tailored to your needs — even if they\'re not listed here')}
      </p>
    </div>

    {/* Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
      
      {/* Websites */}
      <div ref={(el) => (textsRef.current[12] = el)} className="opacity-0">
        <h3 className="text-3xl md:text-4xl font-light mb-4">
          {homeT('whatWeBuild.websites.title', 'Websites')}
        </h3>
        <p className="text-lg font-light text-white/50">
          {homeT('whatWeBuild.websites.description', 'Brand experiences that leave lasting impressions.')}
        </p>
      </div>
      
      {/* E-commerce */}
      <div ref={(el) => (textsRef.current[13] = el)} className="opacity-0">
        <h3 className="text-3xl md:text-4xl font-light mb-4">
          {homeT('whatWeBuild.ecommerce.title', 'E-commerce')}
        </h3>
        <p className="text-lg font-light text-white/50">
          {homeT('whatWeBuild.ecommerce.description', 'Platforms that scale with your business.')}
        </p>
      </div>
      
      {/* SaaS */}
      <div ref={(el) => (textsRef.current[14] = el)} className="opacity-0">
        <h3 className="text-3xl md:text-4xl font-light mb-4">
          {homeT('whatWeBuild.saas.title', 'SaaS')}
        </h3>
        <p className="text-lg font-light text-white/50">
          {homeT('whatWeBuild.saas.description', 'Complex systems. Simple experiences.')}
        </p>
      </div>
      
      {/* 🆕 Educational Platforms */}
      <div ref={(el) => (textsRef.current[15] = el)} className="opacity-0">
        <h3 className="text-3xl md:text-4xl font-light mb-4">
          {homeT('whatWeBuild.educationalPlatforms.title', 'Educational Platforms')}
        </h3>
        <p className="text-lg font-light text-white/50">
          {homeT('whatWeBuild.educationalPlatforms.description', 'Interactive learning systems with course, student, and certificate management.')}
        </p>
      </div>
      
      {/* Medical Websites */}
      <div ref={(el) => (textsRef.current[16] = el)} className="opacity-0">
        <h3 className="text-3xl md:text-4xl font-light mb-4">
          {homeT('whatWeBuild.medicalWebsites.title', 'Medical Websites')}
        </h3>
        <p className="text-lg font-light text-white/50">
          {homeT('whatWeBuild.medicalWebsites.description', 'Professional websites for clinics and hospitals showcasing services and doctors.')}
        </p>
      </div>
      
      {/* Medical Booking Systems */}
      <div ref={(el) => (textsRef.current[17] = el)} className="opacity-0">
        <h3 className="text-3xl md:text-4xl font-light mb-4">
          {homeT('whatWeBuild.medicalBooking.title', 'Medical Booking Systems')}
        </h3>
        <p className="text-lg font-light text-white/50">
          {homeT('whatWeBuild.medicalBooking.description', 'Smart booking platforms with advanced scheduling and auto-reminders.')}
        </p>
      </div>
      
      {/* Professional Dashboards */}
      <div ref={(el) => (textsRef.current[18] = el)} className="opacity-0">
        <h3 className="text-3xl md:text-4xl font-light mb-4">
          {homeT('whatWeBuild.dashboards.title', 'Professional Dashboards')}
        </h3>
        <p className="text-lg font-light text-white/50">
          {homeT('whatWeBuild.dashboards.description', 'Comprehensive management systems for data, reports, and operations.')}
        </p>
      </div>
      
      {/* Delivery Apps */}
      <div ref={(el) => (textsRef.current[19] = el)} className="opacity-0">
        <h3 className="text-3xl md:text-4xl font-light mb-4">
          {homeT('whatWeBuild.deliveryApps.title', 'Delivery Apps')}
        </h3>
        <p className="text-lg font-light text-white/50">
          {homeT('whatWeBuild.deliveryApps.description', 'Complete delivery platforms with real-time tracking and secure payments.')}
        </p>
      </div>
      
      {/* 🎯 Custom Solutions - الأهم! */}
      <div ref={(el) => (textsRef.current[20] = el)} className="opacity-0 md:col-span-2 lg:col-span-1">
        <div className="relative p-8 border border-[#d4af37]/30 rounded-lg bg-gradient-to-br from-[#d4af37]/5 to-transparent hover:border-[#d4af37]/60 transition-all duration-500">
          <h3 className="text-3xl md:text-4xl font-light mb-4 text-[#d4af37]">
            {homeT('whatWeBuild.customSolutions.title', 'Custom Solutions')}
          </h3>
          <p className="text-lg font-light text-white/70">
            {homeT('whatWeBuild.customSolutions.description', 'Have a different idea? We turn any concept into a successful digital product.')}
          </p>
        </div>
      </div>
      
    </div>
  </div>
</section>

      {/* ========== CONTACT / WHATSAPP CTA ========== */}
      <section id="contact" className="min-h-screen flex items-center justify-center bg-black px-4 py-32">
        <div className={`text-center max-w-5xl mx-auto ${isRTL ? 'rtl' : ''}`}>
          <h2 className="text-7xl md:text-8xl lg:text-[10rem] font-light mb-12 tracking-tight leading-none">
            {homeT('contact.title', "Let's talk")}
          </h2>
          
          <p className="text-2xl md:text-3xl font-light text-white/60 mb-8 leading-relaxed">
            {homeT('contact.subtitle', 'Ready to discuss your project?')}
          </p>
          <p className="text-lg md:text-xl font-light text-white/40 mb-16">
            {homeT('contact.description', 'Book a 30-minute discovery call to explore how we can help. We respond within 24 hours.')}
          </p>
          
          {/* Multiple contact options */}
          <div className={`flex flex-col sm:flex-row gap-6 justify-center items-center mb-12 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-block px-12 py-5 border border-[#d4af37] text-[#d4af37] text-sm font-light tracking-widest uppercase hover:bg-[#d4af37] hover:text-black transition-all duration-500"
            >
              {homeT('contact.startProject', 'Start Your Project')}
            </button>
            
            {/* زر احجز استشارة - معدّل لواتساب */}
            <a
              href="https://wa.me/201090385390?text=مرحباً%20YANSY%2C%20أود%20حجز%20استشارة%20مجانية%20لمناقشة%20مشروعي.%0A%0AHello%20YANSY%2C%20I%20would%20like%20to%20schedule%20a%20free%20consultation%20to%20discuss%20my%20project."
              target="_blank"
              rel="noopener noreferrer"
              className={`group inline-flex items-center gap-3 px-12 py-5 border border-white/20 text-white text-sm font-light tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-500 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              <span>{homeT('contact.scheduleCall', 'Schedule a Call')}</span>
            </a>
            
            {/* زر واتساب الإضافي */}
            <a
              href="https://wa.me/201090385390?text=Hello%2C%20I%27d%20like%20to%20discuss%20a%20project%20with%20YANSY."
              target="_blank"
              rel="noopener noreferrer"
              className={`group inline-flex items-center gap-3 px-12 py-5 border border-white/30 text-white text-sm font-light tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-500 relative overflow-hidden ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              <span>{homeT('contact.whatsapp', 'Chat on WhatsApp')}</span>
            </a>
          </div>
          
      
          
          {/* Trust signals */}
          <div className={`flex flex-wrap justify-center gap-8 text-sm text-white/40 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span>{homeT('contact.trust1', '✓ Free consultation')}</span>
            <span>{homeT('contact.trust2', '✓ No obligation')}</span>
            <span>{homeT('contact.trust3', '✓ Response within 24h')}</span>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <Testimonials />

      <Footer />

      {/* Project Request Form Modal */}
      <ProjectRequestForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
};

export default Home;