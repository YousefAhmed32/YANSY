import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { MessageCircle, Menu, X, ChevronRight } from 'lucide-react';
import { gsap } from 'gsap';
import LanguageSelector from './LanguageSelector';

const Header = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { language } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const headerRef = useRef(null);
  const logoRef = useRef(null);
  const navItemsRef = useRef([]);
  const ctaRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // WhatsApp configuration
  const whatsappNumber = '201090385390';
  const whatsappMessage = encodeURIComponent(
    t('landing.whatsapp.message', 'Hello, I need help with YANSY')
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Scroll handling
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 50;
      setIsScrolled(scrolled);

      if (headerRef.current) {
        const bgColor = isDark 
          ? scrolled ? 'rgba(0, 0, 0, 0.95)' : 'rgba(0, 0, 0, 0)'
          : scrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0)';
        
        gsap.to(headerRef.current, {
          backgroundColor: bgColor,
          backdropFilter: scrolled ? 'blur(20px)' : 'blur(0px)',
          borderBottomColor: scrolled 
            ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
            : 'transparent',
          duration: 0.4,
          ease: 'power2.out'
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDark]);

  // Initial animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Logo animation
      if (logoRef.current) {
        gsap.fromTo(
          logoRef.current,
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.1 }
        );
      }

      // Nav items stagger
      if (navItemsRef.current.length > 0) {
        gsap.fromTo(
          navItemsRef.current,
          { opacity: 0, y: -15 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 0.6, 
            stagger: 0.08, 
            ease: 'power3.out', 
            delay: 0.3 
          }
        );
      }

      // CTA animation
      if (ctaRef.current) {
        gsap.fromTo(
          ctaRef.current,
          { opacity: 0, x: 20 },
          { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out', delay: 0.5 }
        );
      }
    }, headerRef);

    return () => ctx.revert();
  }, []);

  // Mobile menu animation
  useEffect(() => {
    if (mobileMenuOpen && mobileMenuRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          mobileMenuRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: 'power2.out' }
        );

        const menuItems = mobileMenuRef.current.querySelectorAll('.menu-item');
        gsap.fromTo(
          menuItems,
          { opacity: 0, y: 20 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 0.5, 
            stagger: 0.05, 
            ease: 'power3.out',
            delay: 0.1
          }
        );
      }, mobileMenuRef);

      return () => ctx.revert();
    }
  }, [mobileMenuOpen]);

  // Theme colors
  const colors = {
    text: isDark ? 'text-white' : 'text-gray-900',
    textMuted: isDark ? 'text-white/70' : 'text-gray-600',
    textHover: isDark ? 'text-white' : 'text-gray-900',
    border: isDark ? 'border-white/10' : 'border-gray-200',
    borderHover: isDark ? 'border-white/30' : 'border-gray-400',
    bg: isDark ? 'bg-black' : 'bg-white',
    bgHover: isDark ? 'bg-white/5' : 'bg-gray-50',
    mobileMenuBg: isDark ? 'bg-black/98' : 'bg-white/98',
    divider: isDark ? 'bg-white/5' : 'bg-gray-100',
  };

  // Navigation items
  const navItems = [
    { label: t('landing.nav.work', 'Work'), href: '#work' }
  ];

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-50 border-b border-transparent transition-all duration-300`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo */}
            <Link
              ref={logoRef}
              to="/"
              className="relative z-10 flex-shrink-0"
              onMouseEnter={(e) => {
                gsap.to(e.currentTarget.querySelector('img'), {
                  scale: 1.05,
                  duration: 0.3,
                  ease: 'power2.out'
                });
              }}
              onMouseLeave={(e) => {
                gsap.to(e.currentTarget.querySelector('img'), {
                  scale: 1,
                  duration: 0.3,
                  ease: 'power2.out'
                });
              }}
            >
              <img
                src="/assets/image/logo/logo.png"
                alt="YANSY"
                className="h-9 lg:h-10 w-auto object-contain"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-12">
              
              {/* Nav Links */}
              <nav className="flex items-center gap-8">
                {navItems.map((item, index) => (
                  <a
                    key={item.href}
                    href={item.href}
                    ref={(el) => navItemsRef.current[index] = el}
                    className={`text-xs font-light ${colors.textMuted} hover:${colors.textHover} tracking-wider uppercase transition-colors duration-300`}
                    onMouseEnter={(e) => {
                      gsap.to(e.currentTarget, {
                        y: -2,
                        duration: 0.2,
                        ease: 'power2.out'
                      });
                    }}
                    onMouseLeave={(e) => {
                      gsap.to(e.currentTarget, {
                        y: 0,
                        duration: 0.2,
                        ease: 'power2.out'
                      });
                    }}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              {/* Utility Section */}
              <div className="flex items-center gap-4">
                
                {/* Language Selector */}
                <div ref={(el) => navItemsRef.current[navItems.length] = el}>
                  <LanguageSelector />
                </div>

                {/* WhatsApp Support */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  ref={(el) => navItemsRef.current[navItems.length + 1] = el}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-light tracking-wider uppercase border ${colors.border} hover:${colors.borderHover} ${colors.textMuted} hover:${colors.textHover} hover:${colors.bgHover} rounded transition-all duration-300`}
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
                  <MessageCircle className="w-4 h-5" />
                  <span>{t('landing.nav.support', 'Support')}</span>
                </a>
              </div>

              {/* Auth/CTA Section */}
              <div ref={ctaRef} className="flex items-center gap-3">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/app/dashboard"
                      className={`text-xs font-light ${colors.textMuted} hover:${colors.textHover} px-4 py-2 tracking-wider uppercase transition-colors duration-300`}
                    >
                      {t('dashboard.title', 'Dashboard')}
                    </Link>
                    {user?.role === 'ADMIN' && (
                      <Link
                        to="/app/admin"
                        className={`text-xs font-light ${colors.textMuted} hover:${colors.textHover} px-4 py-2 tracking-wider uppercase transition-colors duration-300`}
                      >
                        {t('common.admin', 'Admin')}
                      </Link>
                    )}
                    <Link
                      to="/app/dashboard"
                      className={`px-6 py-2.5 text-xs font-light ${colors.text} border ${colors.border} hover:bg-[#d4af37] hover:text-black hover:border-[#d4af37] tracking-wider uppercase transition-all duration-300 rounded`}
                      onMouseEnter={(e) => {
                        gsap.to(e.currentTarget, {
                          y: -2,
                          duration: 0.2,
                          ease: 'power2.out'
                        });
                      }}
                      onMouseLeave={(e) => {
                        gsap.to(e.currentTarget, {
                          y: 0,
                          duration: 0.2,
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
                      className={`text-xs font-light ${colors.textMuted} hover:${colors.textHover} px-4 py-2 tracking-wider uppercase transition-colors duration-300`}
                    >
                      {t('common.login', 'Login')}
                    </Link>
                    <Link
                      to="/register"
                      className={`px-6 py-2.5 text-xs font-light ${colors.text} border ${colors.border} hover:bg-[#d4af37] hover:text-black hover:border-[#d4af37] tracking-wider uppercase transition-all duration-300 rounded`}
                      onMouseEnter={(e) => {
                        gsap.to(e.currentTarget, {
                          y: -2,
                          duration: 0.2,
                          ease: 'power2.out'
                        });
                      }}
                      onMouseLeave={(e) => {
                        gsap.to(e.currentTarget, {
                          y: 0,
                          duration: 0.2,
                          ease: 'power2.out'
                        });
                      }}
                    >
                      {t('landing.hero.cta', 'Get Started')}
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 ${colors.textMuted} hover:${colors.textHover} transition-colors duration-300 relative z-[70]`}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          className={`fixed inset-0 z-[60] lg:hidden ${colors.mobileMenuBg} backdrop-blur-xl`}
          onClick={handleMobileMenuClose}
        >
          {/* Mobile Menu Content */}
          <div 
            className="flex flex-col h-full pt-24 pb-8 px-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Mobile Nav Links */}
            <nav className="flex flex-col gap-1 mb-8">
              {navItems.map((item, index) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`menu-item flex items-center justify-between px-4 py-4 text-base font-light ${colors.text} hover:${colors.bgHover} tracking-wide uppercase transition-all duration-300 rounded-lg group`}
                  onClick={handleMobileMenuClose}
                >
                  <span>{item.label}</span>
                  <ChevronRight className={`w-5 h-5 ${colors.textMuted} group-hover:translate-x-1 transition-transform duration-300`} />
                </a>
              ))}
            </nav>

            {/* Divider */}
            <div className={`menu-item h-px ${colors.divider} mb-8`} />

            {/* Mobile Utility Section */}
            <div className="flex flex-col gap-3 mb-8">
              
              {/* Language Selector */}
              <div className="menu-item" onClick={(e) => e.stopPropagation()}>
                <div className={`px-4 py-3 ${colors.bgHover} rounded-lg `}>
                  <div className={`text-xs ${colors.textMuted} mb-2 uppercase tracking-wider`}>
                    {t('common.language', 'Language')}
                  </div>
                  <LanguageSelector />
                </div>
              </div>

              {/* WhatsApp Support */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`menu-item flex items-center justify-between px-4 py-4 text-sm font-light tracking-wide uppercase border ${colors.border} ${colors.text} hover:${colors.bgHover} rounded-lg transition-all duration-300 group`}
                onClick={handleMobileMenuClose}
              >
                <div className="flex items-center gap-3 ">
                  <MessageCircle className="w-5 h-5" />
                  <span>{t('landing.nav.support', 'Support')}</span>
                </div>
                <ChevronRight className={`w-5 h-5 ${colors.textMuted} group-hover:translate-x-1 transition-transform duration-300`} />
              </a>
            </div>

            {/* Divider */}
            <div className={`menu-item h-px ${colors.divider} mb-8`} />

            {/* Mobile Auth/CTA Section */}
            <div className="flex flex-col gap-3 mt-auto">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/app/dashboard"
                    className={`menu-item flex items-center justify-between px-6 py-4 text-sm font-light ${colors.text} hover:${colors.bgHover} tracking-wide uppercase transition-all duration-300 rounded-lg group`}
                    onClick={handleMobileMenuClose}
                  >
                    <span>{t('dashboard.title', 'Dashboard')}</span>
                    <ChevronRight className={`w-5 h-5 ${colors.textMuted} group-hover:translate-x-1 transition-transform duration-300`} />
                  </Link>
                  
                  {user?.role === 'ADMIN' && (
                    <Link
                      to="/app/admin"
                      className={`menu-item flex items-center justify-between px-6 py-4 text-sm font-light ${colors.text} hover:${colors.bgHover} tracking-wide uppercase transition-all duration-300 rounded-lg group`}
                      onClick={handleMobileMenuClose}
                    >
                      <span>{t('common.admin', 'Admin')}</span>
                      <ChevronRight className={`w-5 h-5 ${colors.textMuted} group-hover:translate-x-1 transition-transform duration-300`} />
                    </Link>
                  )}
                  
                  <Link
                    to="/app/dashboard"
                    className={`menu-item w-full text-center px-6 py-4 text-sm font-medium bg-[#d4af37] text-black border-2 border-[#d4af37] tracking-wide uppercase transition-all duration-300 rounded-lg hover:bg-[#c4a030] hover:border-[#c4a030] active:scale-95`}
                    onClick={handleMobileMenuClose}
                  >
                    {t('common.goToApp', 'Go to App')}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className={`menu-item w-full text-center px-6 py-4 text-sm font-light ${colors.text} border ${colors.border} hover:${colors.bgHover} tracking-wide uppercase transition-all duration-300 rounded-lg active:scale-95`}
                    onClick={handleMobileMenuClose}
                  >
                    {t('common.login', 'Login')}
                  </Link>
                  
                  <Link
                    to="/register"
                    className={`menu-item w-full text-center px-6 py-4 text-sm font-medium bg-[#d4af37] text-black border-2 border-[#d4af37] tracking-wide uppercase transition-all duration-300 rounded-lg hover:bg-[#c4a030] hover:border-[#c4a030] active:scale-95`}
                    onClick={handleMobileMenuClose}
                  >
                    {t('landing.hero.cta', 'Get Started')}
                  </Link>
                </>
              )}
            </div>

            {/* Version or Footer Info (Optional) */}
            <div className={`menu-item text-center mt-8 pt-6 border-t ${colors.border}`}>
              <p className={`text-xs ${colors.textMuted} tracking-wider`}>
                © 2024 YANSY. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;