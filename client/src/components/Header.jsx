import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowUpRight, Menu, X, MessageCircle } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

const Header = ({ onStartProject }) => {
  const { isAuthenticated, user } = useSelector(s => s.auth);
  const { t }    = useTranslation();
  const { isRTL } = useLanguage();
  const location = useLocation();

  const [scrolled,       setScrolled]       = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted,        setMounted]        = useState(false);
  const menuRef     = useRef(null);
  const firstFocRef = useRef(null);

  const whatsappUrl = `https://wa.me/201090385390?text=${encodeURIComponent(
    t('landing.whatsapp.message', 'Hello, I need help with YANSY')
  )}`;

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      const y = window.scrollY;
      Object.assign(document.body.style, { overflow: 'hidden', position: 'fixed', top: `-${y}px`, width: '100%' });
      setTimeout(() => firstFocRef.current?.focus(), 80);
    } else {
      const y = Math.abs(parseInt(document.body.style.top || '0', 10));
      Object.assign(document.body.style, { overflow: '', position: '', top: '', width: '' });
      if (y) window.scrollTo(0, y);
    }
    return () => Object.assign(document.body.style, { overflow: '', position: '', top: '', width: '' });
  }, [mobileMenuOpen]);

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') setMobileMenuOpen(false); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  const NAV = [
    { labelKey: 'landing.nav.portfolio',  def: isRTL ? 'أعمالنا' : 'Portfolio',   href: '/portfolio' },
    { labelKey: 'landing.nav.industries', def: isRTL ? 'القطاعات' : 'Industries', href: '/industries' },
    // { labelKey: 'landing.nav.about',      def: isRTL ? 'من نحن' : 'About',        href: '/about' },
    { labelKey: 'landing.nav.contact',    def: isRTL ? 'تواصل'   : 'Contact',     href: '/contact' },
  ];

  return (
    <>
      <style>{`
        .ynav-link {
          position: relative;
          font-size: 13px;
          font-weight: 500;
          color: #5C6370;
          text-decoration: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 5px 0;
          transition: color 0.18s ease;
          white-space: nowrap;
          letter-spacing: -0.005em;
        }
        .ynav-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          inset-inline-start: 0;
          inset-inline-end: 0;
          height: 1.5px;
          background: #0D1117;
          transform: scaleX(0);
          transform-origin: ${isRTL ? 'right' : 'left'};
          transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 1px;
        }
        .ynav-link:hover { color: #0D1117; }
        .ynav-link:hover::after, .ynav-link.active::after { transform: scaleX(1); }

        .desk-nav, .desk-right { display: none; }
        .mob-cluster { display: flex; }
        @media (min-width: 1024px) {
          .desk-nav   { display: flex; }
          .desk-right { display: flex; }
          .mob-cluster { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ynav-link::after { transition: none; }
        }
      `}</style>

      <header
        role="banner"
        style={{
          position:     'fixed',
          top:          0,
          left:         0,
          right:        0,
          zIndex:       1000,
          height:       '68px',
          background:   '#FFFFFF',
          borderBottom: scrolled ? '1px solid #E8EBF0' : '1px solid transparent',
          boxShadow:    scrolled ? '0 1px 16px rgba(0,0,0,0.05)' : 'none',
          transition:   'border-color 0.25s ease, box-shadow 0.25s ease, opacity 0.45s ease',
          opacity:      mounted ? 1 : 0,
        }}
      >
        <div style={{
          maxWidth:       '1280px',
          margin:         '0 auto',
          paddingInline:  'clamp(20px, 4vw, 48px)',
          height:         '100%',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          gap:            '16px',
        }}>

          {/* Logo */}
          <Link
            to="/"
            aria-label="YANSY — Home"
            style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0, zIndex: 10 }}
          >
            <img
              src="/assets/image/logo/logo-2.png"
              alt="YANSY"
              style={{ height: '60px', width: 'auto', objectFit: 'contain' }}
            />
          </Link>

          {/* Desktop nav */}
          <nav
            className="desk-nav"
            role="navigation"
            aria-label="Main navigation"
            style={{ alignItems: 'center', gap: '36px' }}
          >
            {NAV.map((item, i) =>
              item.href ? (
                <Link key={i} to={item.href} className="ynav-link">
                  {t(item.labelKey, item.def)}
                </Link>
              ) : (
                <button key={i} onClick={item.action} className="ynav-link">
                  {t(item.labelKey, item.def)}
                </button>
              )
            )}
          </nav>

          {/* Desktop right */}
          <div className="desk-right" style={{ alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <LanguageSelector />
            <div style={{ width: '1px', height: '16px', background: '#E8EBF0', margin: '0 4px' }} aria-hidden />

            {isAuthenticated ? (
              <>
                <Link
                  to="/app/dashboard"
                  style={{
                    fontSize: '13px', fontWeight: 500, color: '#5C6370',
                    textDecoration: 'none', padding: '4px 8px',
                    transition: 'color 0.18s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#0D1117'}
                  onMouseLeave={e => e.currentTarget.style.color = '#5C6370'}
                >
                  {t('dashboard.title', 'Dashboard')}
                </Link>
                <Link
                  to="/app/dashboard"
                  className="btn-primary"
                  style={{ fontSize: '12.5px', padding: '8px 18px', textDecoration: 'none' }}
                >
                  {t('common.goToApp', 'Go to App')}
                  <ArrowUpRight style={{ width: 13, height: 13 }} aria-hidden />
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{
                    fontSize: '13px', fontWeight: 500, color: '#5C6370',
                    textDecoration: 'none', padding: '4px 12px',
                    transition: 'color 0.18s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#0D1117'}
                  onMouseLeave={e => e.currentTarget.style.color = '#5C6370'}
                >
                  {t('common.login', 'Sign in')}
                </Link>
                <button
                  onClick={onStartProject}
                  className="btn-primary"
                  style={{ fontSize: '12.5px', padding: '9px 20px' }}
                >
                  {t('landing.hero.cta', 'Start a Project')}
                </button>
              </>
            )}
          </div>

          {/* Mobile cluster */}
          <div className="mob-cluster" style={{ alignItems: 'center', gap: '8px' }}>
            {!isAuthenticated ? (
              <button
                onClick={onStartProject}
                className="btn-primary"
                style={{ fontSize: '11.5px', padding: '7px 14px' }}
              >
                {t('landing.hero.cta', 'Start')}
              </button>
            ) : (
              <Link
                to="/app/dashboard"
                className="btn-primary"
                style={{ fontSize: '11.5px', padding: '7px 14px', textDecoration: 'none' }}
              >
                App
                <ArrowUpRight style={{ width: 12, height: 12 }} aria-hidden />
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(p => !p)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              style={{
                width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'none', border: '1px solid #E8EBF0', borderRadius: '8px',
                cursor: 'pointer', color: '#374151', flexShrink: 0,
                transition: 'background 0.18s, border-color 0.18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F6F7F9'; e.currentTarget.style.borderColor = '#C9CDD6'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = '#E8EBF0'; }}
            >
              {mobileMenuOpen
                ? <X style={{ width: 15, height: 15 }} aria-hidden />
                : <Menu style={{ width: 15, height: 15 }} aria-hidden />
              }
            </button>
          </div>

        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            background: '#FFFFFF',
            paddingTop: '68px',
            display: 'flex', flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          <div style={{ padding: '28px 24px 48px', display: 'flex', flexDirection: 'column', flex: 1 }}>

            {/* Nav items */}
            <nav aria-label="Mobile navigation" style={{ marginBottom: '36px' }}>
              {[
                ...NAV,
                { labelKey: 'landing.nav.pricing', def: isRTL ? 'الأسعار' : 'Pricing', href: '/pricing' },
                { labelKey: 'landing.nav.blog',    def: isRTL ? 'المدونة' : 'Blog',    href: '/blog' },
              ].map((item, i) => {
                const styles = {
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '18px 0', borderBottom: '1px solid #F0F2F5',
                  color: '#0D1117', textDecoration: 'none', background: 'none',
                  border: 'none', width: '100%', cursor: 'pointer',
                  fontSize: 'clamp(1.25rem, 5vw, 1.625rem)', fontWeight: 700,
                  letterSpacing: '-0.025em', textAlign: isRTL ? 'right' : 'left',
                };
                return item.href ? (
                  <Link
                    key={i}
                    ref={i === 0 ? firstFocRef : null}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ ...styles }}
                  >
                    <span>{t(item.labelKey, item.def)}</span>
                    <ArrowUpRight style={{ width: 18, height: 18, color: '#9BA3AE', flexShrink: 0 }} aria-hidden />
                  </Link>
                ) : (
                  <button
                    key={i}
                    ref={i === 0 ? firstFocRef : null}
                    onClick={item.action}
                    style={{ ...styles, paddingInline: 0 }}
                  >
                    <span>{t(item.labelKey, item.def)}</span>
                    <ArrowUpRight style={{ width: 18, height: 18, color: '#9BA3AE', flexShrink: 0 }} aria-hidden />
                  </button>
                );
              })}
            </nav>

            {/* Utilities */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', flex: 1, border: '1px solid #E8EBF0', borderRadius: '10px' }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#9BA3AE', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                  {isRTL ? 'اللغة' : 'Lang'}
                </span>
                <LanguageSelector />
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="WhatsApp"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '12px 16px', textDecoration: 'none', flexShrink: 0,
                  border: '1px solid rgba(34,197,94,0.25)', borderRadius: '10px',
                  background: 'rgba(34,197,94,0.05)', color: '#16a34a',
                }}
              >
                <MessageCircle style={{ width: 15, height: 15 }} aria-hidden />
                <span style={{ fontSize: 11, fontWeight: 700 }}>WA</span>
              </a>
            </div>

            {/* Auth CTAs */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {isAuthenticated ? (
                <>
                  {user?.role === 'ADMIN' && (
                    <Link
                      to="/app/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        display: 'block', textAlign: 'center', padding: '14px',
                        fontSize: '13px', fontWeight: 500, color: '#5C6370',
                        border: '1px solid #E8EBF0', borderRadius: '10px', textDecoration: 'none',
                      }}
                    >
                      {t('common.admin', 'Admin Panel')}
                    </Link>
                  )}
                  <Link
                    to="/app/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '16px', fontSize: '14px', fontWeight: 700,
                      color: '#FFFFFF', background: '#0D1117', borderRadius: '10px',
                      textDecoration: 'none',
                    }}
                  >
                    {t('common.goToApp', 'Go to App')}
                    <ArrowUpRight style={{ width: 15, height: 15 }} aria-hidden />
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'block', textAlign: 'center', padding: '14px',
                      fontSize: '14px', fontWeight: 500, color: '#374151',
                      border: '1px solid #E8EBF0', borderRadius: '10px', textDecoration: 'none',
                      transition: 'border-color 0.18s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#0D1117'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#E8EBF0'}
                  >
                    {t('common.login', 'Sign In')}
                  </Link>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onStartProject?.(); }}
                    style={{
                      width: '100%', padding: '16px',
                      fontSize: '14px', fontWeight: 700,
                      color: '#FFFFFF', background: '#0D1117',
                      border: 'none', borderRadius: '10px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}
                  >
                    {t('landing.hero.cta', 'Start a Project')}
                    <ArrowUpRight style={{ width: 15, height: 15 }} aria-hidden />
                  </button>
                </>
              )}
            </div>

            {/* Footer note */}
            <div style={{
              marginTop: '36px', paddingTop: '20px', borderTop: '1px solid #F0F2F5',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <p style={{ fontSize: '11.5px', color: '#9BA3AE', margin: 0 }}>© 2025 YANSY Tech</p>
              <div style={{ display: 'flex', gap: '4px' }} aria-hidden>
                {[1, 0.5, 0.25].map((o, i) => (
                  <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: '#2563EB', opacity: o }} />
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default Header;
