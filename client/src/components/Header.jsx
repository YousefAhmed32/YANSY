import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { MessageCircle, Menu, X, ChevronRight, ArrowUpRight } from 'lucide-react';
import { gsap } from 'gsap';
import LanguageSelector from './LanguageSelector';

const Header = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { language, isRTL } = useLanguage();
  const [isScrolled, setIsScrolled]     = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem]   = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const headerRef    = useRef(null);
  const logoRef      = useRef(null);
  const navItemsRef  = useRef([]);
  const ctaRef       = useRef(null);
  const mobileMenuRef = useRef(null);
  const goldLineRef  = useRef(null);
  const progressRef  = useRef(null);

  const whatsappNumber  = '201090385390';
  const whatsappMessage = encodeURIComponent(t('landing.whatsapp.message', 'Hello, I need help with YANSY'));
  const whatsappUrl     = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  // ── Prevent body scroll when mobile menu open ─────────────────────────────
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  // ── Scroll handler ────────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      const scrollY   = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress  = maxScroll > 0 ? (scrollY / maxScroll) * 100 : 0;

      setIsScrolled(scrollY > 60);
      setScrollProgress(progress);

      if (progressRef.current) {
        progressRef.current.style.width = `${progress}%`;
      }

      if (headerRef.current) {
        if (scrollY > 60) {
          gsap.to(headerRef.current, {
            backgroundColor: isDark ? 'rgba(4,3,2,0.96)' : 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(24px)',
            borderBottomColor: isDark ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.2)',
            duration: 0.5,
            ease: 'power2.out',
          });
        } else {
          gsap.to(headerRef.current, {
            backgroundColor: 'rgba(0,0,0,0)',
            backdropFilter: 'blur(0px)',
            borderBottomColor: 'rgba(0,0,0,0)',
            duration: 0.5,
            ease: 'power2.out',
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDark]);

  // ── Initial entrance animation ────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.1 });

      // Gold line first
      if (goldLineRef.current) {
        tl.fromTo(goldLineRef.current,
          { scaleX: 0, transformOrigin: isRTL ? 'right' : 'left' },
          { scaleX: 1, duration: 0.8, ease: 'power3.out' }
        );
      }

      // Logo
      if (logoRef.current) {
        tl.fromTo(logoRef.current,
          { opacity: 0, y: -16 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
          '-=0.5'
        );
      }

      // Nav items
      const validNavItems = navItemsRef.current.filter(Boolean);
      if (validNavItems.length > 0) {
        tl.fromTo(validNavItems,
          { opacity: 0, y: -12 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: 'power3.out' },
          '-=0.4'
        );
      }

      // CTA
      if (ctaRef.current) {
        tl.fromTo(ctaRef.current,
          { opacity: 0, x: isRTL ? -20 : 20 },
          { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' },
          '-=0.3'
        );
      }
    }, headerRef);

    return () => ctx.revert();
  }, [isRTL]);

  // ── Mobile menu animation ─────────────────────────────────────────────────
  useEffect(() => {
    if (mobileMenuOpen && mobileMenuRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(mobileMenuRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.25, ease: 'power2.out' }
        );
        const items = mobileMenuRef.current.querySelectorAll('.m-item');
        gsap.fromTo(items,
          { opacity: 0, y: 18, filter: 'blur(4px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.45, stagger: 0.04, ease: 'power3.out', delay: 0.1 }
        );
      }, mobileMenuRef);
      return () => ctx.revert();
    }
  }, [mobileMenuOpen]);

  const navItems = [
    { label: t('landing.nav.work', 'Work'), href: '#work' },
  ];

  const textColor    = isDark ? 'rgba(255,255,255,0.55)'  : 'rgba(0,0,0,0.55)';
  const textHover    = isDark ? '#ffffff'                  : '#000000';
  const mobileBg     = isDark ? 'rgba(4,3,2,0.98)'        : 'rgba(255,255,255,0.98)';
  const borderColor  = isDark ? 'rgba(255,255,255,0.08)'  : 'rgba(0,0,0,0.08)';
  const mainText     = isDark ? '#ffffff'                  : '#0a0a0a';

  return (
    <>
      <style>{`
        .nav-link-gold::after {
          content: '';
          position: absolute;
          bottom: -3px;
          left: 0; right: 0;
          height: 1px;
          background: #d4af37;
          transform: scaleX(0);
          transform-origin: ${isRTL ? 'right' : 'left'};
          transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
        }
        .nav-link-gold:hover::after { transform: scaleX(1); }

        .cta-shimmer::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }
        .cta-shimmer:hover::before { transform: translateX(100%); }

        .mobile-link-line::before {
          content: '';
          position: absolute;
          ${isRTL ? 'right' : 'left'}: 0;
          top: 50%; transform: translateY(-50%);
          width: 0; height: 1px;
          background: #d4af37;
          transition: width 0.3s ease;
        }
        .mobile-link-line:hover::before { width: 20px; }

        @keyframes hdr-pulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
      `}</style>

      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 border-b"
        style={{ borderBottomColor: 'transparent', willChange: 'background-color, backdrop-filter' }}
      >
        {/* ── Scroll progress line ── */}
        <div className="absolute top-0 left-0 right-0 h-px overflow-hidden" style={{ zIndex: 2 }}>
          <div
            ref={progressRef}
            className="h-full transition-none"
            style={{ background: 'linear-gradient(to right, #d4af37, #a07c18)', width: '0%' }}
          />
        </div>

        {/* ── Gold accent line (bottom of header) ── */}
        <div className="absolute bottom-0 left-0 right-0 h-px overflow-hidden">
          <div
            ref={goldLineRef}
            className="h-full"
            style={{
              background: isScrolled
                ? 'linear-gradient(to right, transparent, #d4af3730, transparent)'
                : 'transparent',
              transition: 'background 0.5s',
              transform: 'scaleX(1)',
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between" style={{ height: isScrolled ? '68px' : '80px', transition: 'height 0.4s ease' }}>

            {/* ── Logo ── */}
            <Link
              ref={logoRef}
              to="/"
              className="relative z-10 flex-shrink-0 flex items-center gap-3 group"
              style={{ opacity: 0 }}
            >
              <img
                src="/assets/image/logo/logo.png"
                alt="YANSY"
                className="w-auto object-contain transition-all duration-500 group-hover:brightness-110"
                style={{ height: isScrolled ? '34px' : '40px', transition: 'height 0.4s ease' }}
              />
              {/* Gold dot accent */}
              <span
                className="hidden sm:block w-1 h-1 rounded-full"
                style={{
                  background: '#d4af37',
                  opacity: 0.6,
                  animation: 'hdr-pulse 3s ease-in-out infinite',
                }}
              />
            </Link>

            {/* ── Desktop nav ── */}
            <div className="hidden lg:flex items-center gap-10">

              {/* Nav links */}
              <nav className="flex items-center gap-8">
                {navItems.map((item, index) => (
                  <a
                    key={item.href}
                    href={item.href}
                    ref={(el) => (navItemsRef.current[index] = el)}
                    className="nav-link-gold relative text-[11px] font-light tracking-[0.25em] uppercase transition-colors duration-300"
                    style={{
                      color: hoveredItem === index ? textHover : textColor,
                      opacity: 0,
                    }}
                    onMouseEnter={() => setHoveredItem(index)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              {/* Utilities */}
              <div className="flex items-center gap-3">

                {/* Language selector */}
                <div
                  ref={(el) => (navItemsRef.current[navItems.length] = el)}
                  className="flex items-center"
                  style={{ opacity: 0 }}
                >
                  <LanguageSelector />
                </div>

                {/* Thin divider */}
                <div className="w-px h-4" style={{ background: 'rgba(212,175,55,0.25)' }} />

                {/* WhatsApp */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  ref={(el) => (navItemsRef.current[navItems.length + 1] = el)}
                  className="flex items-center gap-2 px-4 py-2 text-[11px] font-light tracking-[0.2em] uppercase transition-all duration-300 border"
                  style={{
                    opacity: 0,
                    color: textColor,
                    borderColor: borderColor,
                    borderRadius: '1px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#d4af37';
                    e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)';
                    e.currentTarget.style.background = 'rgba(212,175,55,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = textColor;
                    e.currentTarget.style.borderColor = borderColor;
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{t('landing.nav.support', 'Support')}</span>
                </a>
              </div>

              {/* Auth / CTA */}
              <div ref={ctaRef} className="flex items-center gap-3" style={{ opacity: 0 }}>
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/app/dashboard"
                      className="text-[11px] font-light tracking-[0.2em] uppercase transition-colors duration-300"
                      style={{ color: textColor }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = textHover; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = textColor; }}
                    >
                      {t('dashboard.title', 'Dashboard')}
                    </Link>
                    {user?.role === 'ADMIN' && (
                      <Link
                        to="/app/admin"
                        className="text-[11px] font-light tracking-[0.2em] uppercase transition-colors duration-300"
                        style={{ color: textColor }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = textHover; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = textColor; }}
                      >
                        {t('common.admin', 'Admin')}
                      </Link>
                    )}
                    <Link
                      to="/app/dashboard"
                      className="cta-shimmer relative overflow-hidden flex items-center gap-2 px-6 py-2.5 text-[11px] font-light tracking-[0.2em] uppercase transition-all duration-400"
                      style={{
                        background: '#d4af37',
                        color: '#000',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#c4a030'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#d4af37'; }}
                    >
                      <span>{t('common.goToApp', 'Go to App')}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="text-[11px] font-light tracking-[0.2em] uppercase transition-colors duration-300 px-2"
                      style={{ color: textColor }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#d4af37'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = textColor; }}
                    >
                      {t('common.login', 'Login')}
                    </Link>

                    {/* Thin divider */}
                    <div className="w-px h-3.5" style={{ background: 'rgba(212,175,55,0.2)' }} />

                    <Link
                      to="/register"
                      className="cta-shimmer relative overflow-hidden flex items-center gap-2 px-6 py-2.5 text-[11px] font-light tracking-[0.2em] uppercase transition-all duration-300 border"
                      style={{
                        color: mainText,
                        borderColor: 'rgba(212,175,55,0.5)',
                        background: 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#d4af37';
                        e.currentTarget.style.borderColor = '#d4af37';
                        e.currentTarget.style.color = '#000';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)';
                        e.currentTarget.style.color = mainText;
                      }}
                    >
                      <span>{t('landing.hero.cta', 'Get Started')}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* ── Mobile hamburger ── */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden relative z-[70] flex flex-col items-center justify-center w-10 h-10 gap-[6px]"
              aria-label="Toggle menu"
            >
              <span
                className="block w-6 h-px transition-all duration-300"
                style={{
                  background: mobileMenuOpen ? '#d4af37' : (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'),
                  transform: mobileMenuOpen ? 'rotate(45deg) translateY(7px)' : 'none',
                }}
              />
              <span
                className="block h-px transition-all duration-300"
                style={{
                  background: mobileMenuOpen ? '#d4af37' : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'),
                  width: mobileMenuOpen ? '24px' : '18px',
                  opacity: mobileMenuOpen ? 0 : 1,
                }}
              />
              <span
                className="block w-6 h-px transition-all duration-300"
                style={{
                  background: mobileMenuOpen ? '#d4af37' : (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'),
                  transform: mobileMenuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none',
                }}
              />
            </button>
          </div>
        </div>
      </header>

      {/* ══ Mobile Menu ══════════════════════════════════════════════════════ */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="fixed inset-0 z-[60] lg:hidden flex flex-col"
          style={{ background: mobileBg, backdropFilter: 'blur(24px)', opacity: 0 }}
        >
          {/* Gold top border */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, #d4af37, transparent)' }} />

          <div className="flex flex-col h-full pt-24 pb-10 px-8 overflow-y-auto">

            {/* ── Nav links ── */}
            <nav className="flex flex-col gap-1 mb-10">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="m-item mobile-link-line relative flex items-center justify-between py-5 border-b"
                  style={{
                    color: mainText,
                    borderColor: borderColor,
                    paddingLeft: isRTL ? 0 : '8px',
                    paddingRight: isRTL ? '8px' : 0,
                  }}
                  onClick={() => setMobileMenuOpen(false)}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#d4af37'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = mainText; }}
                >
                  <span
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: '2rem',
                      fontWeight: 300,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {item.label}
                  </span>
                  <ArrowUpRight className="w-5 h-5 flex-shrink-0 opacity-40" />
                </a>
              ))}
            </nav>

            {/* ── Utilities ── */}
            <div className="m-item flex flex-col gap-4 mb-10">

              {/* Language */}
              <div
                className="flex items-center justify-between py-3 px-4 border"
                style={{ borderColor: borderColor, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <span
                  className="text-[10px] uppercase tracking-[0.25em]"
                  style={{ color: 'rgba(212,175,55,0.7)' }}
                >
                  {t('common.language', 'Language')}
                </span>
                <LanguageSelector />
              </div>

              {/* WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="m-item flex items-center justify-between py-4 px-4 border transition-all duration-300"
                style={{ borderColor: borderColor, color: mainText }}
                onClick={() => setMobileMenuOpen(false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)';
                  e.currentTarget.style.color = '#d4af37';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = borderColor;
                  e.currentTarget.style.color = mainText;
                }}
              >
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm font-light tracking-[0.15em] uppercase">
                    {t('landing.nav.support', 'Support')}
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 opacity-40" />
              </a>
            </div>

            {/* ── Auth ── */}
            <div className="m-item flex flex-col gap-3 mt-auto">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/app/dashboard"
                    className="w-full text-center py-4 text-sm font-light tracking-[0.2em] uppercase border transition-all duration-300"
                    style={{ color: mainText, borderColor: borderColor }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('dashboard.title', 'Dashboard')}
                  </Link>
                  {user?.role === 'ADMIN' && (
                    <Link
                      to="/app/admin"
                      className="w-full text-center py-4 text-sm font-light tracking-[0.2em] uppercase border transition-all duration-300"
                      style={{ color: mainText, borderColor: borderColor }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('common.admin', 'Admin')}
                    </Link>
                  )}
                  <Link
                    to="/app/dashboard"
                    className="cta-shimmer relative overflow-hidden w-full text-center py-4 text-sm font-light tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-2"
                    style={{ background: '#d4af37', color: '#000' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('common.goToApp', 'Go to App')}
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="w-full text-center py-4 text-sm font-light tracking-[0.2em] uppercase border transition-all duration-300"
                    style={{ color: mainText, borderColor: borderColor }}
                    onClick={() => setMobileMenuOpen(false)}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = borderColor; }}
                  >
                    {t('common.login', 'Login')}
                  </Link>
                  <Link
                    to="/register"
                    className="cta-shimmer relative overflow-hidden w-full text-center py-4 text-sm font-light tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-2"
                    style={{ background: '#d4af37', color: '#000' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('landing.hero.cta', 'Get Started')}
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="m-item mt-8 pt-6 border-t" style={{ borderColor: borderColor }}>
              <div className="flex items-center justify-between">
                <p className="text-xs tracking-[0.2em]" style={{ color: 'rgba(212,175,55,0.5)' }}>
                  © 2024 YANSY
                </p>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full" style={{ background: '#d4af37', opacity: 0.5 }} />
                  <div className="w-1 h-1 rounded-full" style={{ background: '#d4af37', opacity: 0.3 }} />
                  <div className="w-1 h-1 rounded-full" style={{ background: '#d4af37', opacity: 0.15 }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;