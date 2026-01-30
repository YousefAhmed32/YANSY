import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { MessageCircle } from 'lucide-react';
import { gsap } from 'gsap';
import LanguageSelector from './LanguageSelector';

const Header = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { t, i18n } = useTranslation();
  const { isDark } = useTheme();
  const { isRTL, dir, language } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  
  const headerRef = useRef(null);
  const logoRef = useRef(null);
  const brandZoneRef = useRef(null);
  const navZoneRef = useRef(null);
  const utilityZoneRef = useRef(null);
  const ctaZoneRef = useRef(null);
  const bgRef = useRef(null);

  // Cinematic sequential reveal on load
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Logo fade in
      if (logoRef.current) {
        gsap.fromTo(
          logoRef.current,
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 1, ease: 'power2.out', delay: 0.2 }
        );
      }

      // Nav items stagger in
      if (navZoneRef.current) {
        gsap.fromTo(
          navZoneRef.current.children,
          { opacity: 0, y: -20 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 0.8, 
            stagger: 0.08, 
            ease: 'power2.out', 
            delay: 0.4 
          }
        );
      }

      // Utility zone fade in
      if (utilityZoneRef.current) {
        gsap.fromTo(
          utilityZoneRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.6, ease: 'power2.out', delay: 0.6 }
        );
      }

      // CTA slide in from edge
      if (ctaZoneRef.current) {
        const slideDistance = isRTL ? -20 : 20;
        gsap.fromTo(
          ctaZoneRef.current,
          { opacity: 0, x: slideDistance },
          { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out', delay: 0.8 }
        );
      }
    }, headerRef);

    return () => ctx.revert();
  }, []);

  // Refined scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 100;
      setIsScrolled(scrolled);

      // Smooth background transition with GSAP
      if (bgRef.current) {
        const bgColor = isDark 
          ? scrolled ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0)'
          : scrolled ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0)';
        
        gsap.to(bgRef.current, {
          backgroundColor: bgColor,
          backdropFilter: scrolled ? 'blur(12px)' : 'blur(0px)',
          duration: 0.6,
          ease: 'power2.out',
        });
      }

      // Subtle scale on logo when scrolled
      if (logoRef.current) {
        gsap.to(logoRef.current, {
          scale: scrolled ? 0.96 : 1,
          duration: 0.5,
          ease: 'power2.out',
        });
      }

      // Subtle fade on nav items
      if (navZoneRef.current) {
        gsap.to(navZoneRef.current.children, {
          opacity: scrolled ? 0.9 : 1,
          duration: 0.5,
          ease: 'power2.out',
        });
      }

      // CTA maintains full opacity (always prominent)
      if (ctaZoneRef.current) {
        gsap.to(ctaZoneRef.current, {
          opacity: 1,
          duration: 0.3,
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDark]);

  // Force re-render on language change to update translations
  useEffect(() => {
    // This ensures the component re-renders when language changes
    // so translations update properly
  }, [language, i18n.language]);

  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const textColorMuted = isDark ? 'text-white/60' : 'text-gray-600';
  const textColorHover = isDark ? 'text-white' : 'text-gray-900';
  const bgColor = isDark ? 'bg-black' : 'bg-white';
  const borderColor = isDark ? 'border-white/20' : 'border-gray-200';
  const borderColorHover = isDark ? 'border-white/40' : 'border-gray-400';

  // WhatsApp support link
  const whatsappNumber = '201090385390';
  const whatsappMessage = encodeURIComponent(
    t('landing.whatsapp.message', 'Hello, I need help with YANSY')
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-50 ${bgColor} transition-colors duration-300`}
      dir="ltr"
    >
      {/* Background with smooth transition */}
      <div
        ref={bgRef}
        className={`absolute inset-0 ${isDark ? 'bg-black' : 'bg-white'} opacity-0 pointer-events-none`}
        style={{ backdropFilter: 'blur(12px)' }}
      />
      
      <nav className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div 
          className="flex items-center justify-between h-20"
          style={{ direction: 'ltr' }}
        >
          {/* PRIMARY ZONE: Brand Identity */}
          <div 
            ref={brandZoneRef}
            className="flex items-center"
          >
            <Link
              ref={logoRef}
              to="/"
              className="relative group flex items-center"
              onMouseEnter={(e) => {
                gsap.to(e.currentTarget, {
                  opacity: 0.7,
                  duration: 0.4,
                  ease: 'power2.out',
                });
              }}
              onMouseLeave={(e) => {
                gsap.to(e.currentTarget, {
                  opacity: 1,
                  duration: 0.4,
                  ease: 'power2.out',
                });
              }}
            >
              <img
                src="/assets/image/logo/logo.png"
                alt="YANSY"
                className="h-8 md:h-9 lg:h-10 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
              />
            </Link>
          </div>

          {/* CENTER SECTION: Nav + Utility */}
          <div className="flex items-center gap-8 md:gap-12">
            {/* SECONDARY ZONE: Navigation */}
            <div ref={navZoneRef} className="flex items-center">
              <a
                href="#work"
                className={`text-xs font-light ${textColorMuted} tracking-wide uppercase relative group transition-colors duration-300 hover:${textColorHover}`}
                onMouseEnter={(e) => {
                  gsap.to(e.currentTarget, {
                    opacity: 1,
                    duration: 0.3,
                    ease: 'power2.out',
                  });
                }}
                onMouseLeave={(e) => {
                  gsap.to(e.currentTarget, {
                    opacity: 0.6,
                    duration: 0.3,
                    ease: 'power2.out',
                  });
                }}
              >
                {t('landing.nav.work', 'Work')}
              </a>
            </div>

            {/* UTILITY ZONE: Language & Support */}
            <div 
              ref={utilityZoneRef}
              className="flex items-center gap-6"
            >
              {/* Language Selector */}
              <LanguageSelector />

              {/* Support Button - Secondary Action */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 px-4 py-2 text-xs font-light tracking-wide uppercase border ${borderColor} rounded-sm transition-all duration-300 group ${
                  isDark 
                    ? 'text-white/80 border-white/20 hover:border-white/40 hover:bg-white/5 hover:text-white' 
                    : 'text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onMouseEnter={(e) => {
                  gsap.to(e.currentTarget, {
                    scale: 1.02,
                    duration: 0.2,
                    ease: 'power2.out'
                  });
                }}
                onMouseLeave={(e) => {
                  gsap.to(e.currentTarget, {
                    scale: 1,
                    duration: 0.2,
                    ease: 'power2.out'
                  });
                }}
              >
                <MessageCircle className="w-4 h-4" />
                <span key={language}>{t('landing.nav.support', 'ايلبا')}</span>
              </a>
            </div>
          </div>

          {/* CTA ZONE: Primary Action */}
          <div 
            ref={ctaZoneRef}
            className="flex items-center gap-4"
          >
            {isAuthenticated ? (
              <>
                <Link
                  to="/app/dashboard"
                  className={`text-xs font-light ${textColorMuted} hover:${textColorHover} px-4 py-2 tracking-wide uppercase transition-colors duration-300`}
                >
                  {t('dashboard.title', 'Dashboard')}
                </Link>
                {user?.role === 'ADMIN' && (
                  <Link
                    to="/app/admin"
                    className={`text-xs font-light ${textColorMuted} hover:${textColorHover} px-4 py-2 tracking-wide uppercase transition-colors duration-300`}
                  >
                    {t('common.admin', 'Admin')}
                  </Link>
                )}
                <Link
                  to="/app/dashboard"
                  className={`text-xs font-light ${textColor} border ${borderColor} px-6 py-2 tracking-wide uppercase relative overflow-hidden group transition-all duration-300 hover:bg-[#d4af37] hover:text-black hover:border-[#d4af37]`}
                  onMouseEnter={(e) => {
                    gsap.to(e.currentTarget, {
                      y: -2,
                      duration: 0.3,
                      ease: 'power2.out'
                    });
                  }}
                  onMouseLeave={(e) => {
                    gsap.to(e.currentTarget, {
                      y: 0,
                      duration: 0.3,
                      ease: 'power2.out'
                    });
                  }}
                >
                  {t('common.goToApp', 'Go to App')}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`text-xs font-light ${textColorMuted} hover:${textColorHover} px-4 py-2 tracking-wide uppercase transition-colors duration-300`}
                >
                  {t('auth.loginTitle', 'Login')}
                </Link>
                <Link
                  to="/register"
                  className={`text-xs font-light ${textColor} border ${borderColor} px-6 py-2 tracking-wide uppercase relative overflow-hidden group transition-all duration-300 hover:bg-[#d4af37] hover:text-black hover:border-[#d4af37]`}
                  onMouseEnter={(e) => {
                    gsap.to(e.currentTarget, {
                      y: -2,
                      duration: 0.3,
                      ease: 'power2.out'
                    });
                  }}
                  onMouseLeave={(e) => {
                    gsap.to(e.currentTarget, {
                      y: 0,
                      duration: 0.3,
                      ease: 'power2.out'
                    });
                  }}
                >
                  {t('landing.hero.cta', 'Start Project')}
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
