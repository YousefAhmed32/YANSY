import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { logout } from '../store/authSlice';
import { Globe, LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { gsap } from 'gsap';

const Layout = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { isDark } = useTheme();
  const { language, toggleLanguage, isRTL } = useLanguage();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const navRef = useRef(null);
  const logoRef = useRef(null);
  const actionsRef = useRef(null);

  // Scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      setIsScrolled(scrolled);
      
      if (navRef.current) {
        const bgColor = isDark 
          ? scrolled ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0)'
          : scrolled ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0)';
        
        gsap.to(navRef.current, {
          backgroundColor: bgColor,
          backdropFilter: scrolled ? 'blur(10px)' : 'blur(0px)',
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDark]);

  // GSAP entrance animation
  useEffect(() => {
    if (logoRef.current && navRef.current) {
      gsap.fromTo(
        logoRef.current,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.1 }
      );
      gsap.fromTo(
        navRef.current.children,
        { opacity: 0, y: -10 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.6, 
          stagger: 0.05, 
          ease: 'power2.out', 
          delay: 0.2 
        }
      );
    }
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Navigation links - different for admin vs regular users
  const navLinks = user?.role === 'ADMIN' 
    ? [
        { to: '/app/dashboard', label: t('dashboard.title') },
        { to: '/app/projects', label: t('projects.title') },
        { to: '/app/messages', label: t('messages.title') },
        { to: '/app/admin', label: t('dashboard.analytics') },
        { to: '/app/admin/users', label: t('users.title') },
        { to: '/app/admin/project-requests', label: t('common.projectRequests', 'Project Requests') },
        { to: '/app/admin/feedback', label: t('feedback.admin.title', 'Feedback Intelligence') }
      ]
    : [
        { to: '/app/dashboard', label: t('dashboard.title') },
        { to: '/app/projects', label: t('projects.title') },
        { to: '/app/messages', label: t('messages.title') },
        { to: '/feedback', label: t('feedback.title') }
      ];

  const isActive = (path) => location.pathname === path;

  // Theme-aware classes
  const bgColor = isDark ? 'bg-black' : 'bg-white';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const textColorMuted = isDark ? 'text-white/60' : 'text-gray-600';
  const textColorHover = isDark ? 'text-white/90' : 'text-gray-900';
  const borderColor = isDark ? 'border-white/10' : 'border-gray-200';
  const borderColorHover = isDark ? 'border-white/40' : 'border-gray-400';

  return (
    <div className={`min-h-screen ${bgColor} ${textColor} transition-colors duration-300`}>
      {/* Navigation */}
      <nav 
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 ${borderColor} border-b transition-all duration-300`}
      >
        <div className={`max-w-7xl mx-auto px-6 lg:px-8 ${isRTL ? 'rtl' : 'ltr'}`}>
          <div className={`flex items-center h-20 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link 
                ref={logoRef}
                to="/app/dashboard" 
                className={`text-xl lg:text-2xl font-light tracking-tight ${textColorHover} hover:text-gold transition-colors duration-300`}
              >
                YANSY
              </Link>
            </div>

            {/* Desktop Navigation - Scrollable */}
            <div className={`hidden lg:flex lg:items-center flex-1 min-w-0 mx-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-1' : 'space-x-1'} overflow-x-auto scrollbar-hide w-full`}>
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`relative px-3 py-2 text-[10px] lg:text-xs font-light tracking-wide uppercase transition-colors duration-300 whitespace-nowrap flex-shrink-0 ${
                      isActive(link.to)
                        ? 'text-gold'
                        : `${textColorMuted} hover:${textColorHover}`
                    }`}
                    onMouseEnter={(e) => {
                      if (!isActive(link.to)) {
                        gsap.to(e.currentTarget, {
                          y: -2,
                          duration: 0.2,
                          ease: 'power2.out'
                        });
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive(link.to)) {
                        gsap.to(e.currentTarget, {
                          y: 0,
                          duration: 0.2,
                          ease: 'power2.out'
                        });
                      }
                    }}
                  >
                    {link.label}
                    {isActive(link.to) && (
                      <span className="absolute bottom-0 left-0 right-0 h-px bg-gold" />
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Side Actions */}
            <div className={`hidden lg:flex lg:items-center flex-shrink-0 ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className={`p-2 ${textColorMuted} hover:text-gold transition-colors duration-300`}
                aria-label={t('common.toggleLanguage', 'Toggle language')}
                onMouseEnter={(e) => {
                  gsap.to(e.currentTarget, { scale: 1.1, duration: 0.2, ease: 'power2.out' });
                }}
                onMouseLeave={(e) => {
                  gsap.to(e.currentTarget, { scale: 1, duration: 0.2, ease: 'power2.out' });
                }}
              >
                <Globe className="h-5 w-5" />
                <span className={`${isRTL ? 'mr-1' : 'ml-1'} text-xs`}>{language === 'en' ? 'AR' : 'EN'}</span>
              </button>

              {/* User Info & Logout */}
              <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'} ${isRTL ? 'pr-3 border-r' : 'pl-3 border-l'} ${borderColor}`}>
                <span 
                  className={`text-xs font-light ${textColor} max-w-[100px] lg:max-w-[140px] truncate block`} 
                  title={user?.fullName || user?.email || ''}
                  style={{ 
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {user?.fullName || user?.email || t('common.user', 'User')}
                </span>
                <button
                  onClick={handleLogout}
                  className={`p-2 ${textColorMuted} hover:text-gold transition-colors duration-300 flex-shrink-0`}
                  aria-label={t('common.logout', 'Logout')}
                  onMouseEnter={(e) => {
                    gsap.to(e.currentTarget, { scale: 1.1, duration: 0.2, ease: 'power2.out' });
                  }}
                  onMouseLeave={(e) => {
                    gsap.to(e.currentTarget, { scale: 1, duration: 0.2, ease: 'power2.out' });
                  }}
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 ${textColorMuted} hover:${textColorHover} transition-colors duration-300`}
                aria-label={t('common.toggleMenu', 'Toggle menu')}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden ${borderColor} border-t ${isDark ? 'bg-black/95' : 'bg-white/95'} backdrop-blur-md`}>
            <div className={`px-6 py-4 ${isRTL ? 'space-y-reverse space-y-1' : 'space-y-1'}`}>
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`block px-4 py-3 text-sm font-light tracking-wide uppercase transition-colors duration-300 ${
                    isActive(link.to)
                      ? `text-gold ${isRTL ? 'border-r-2' : 'border-l-2'} border-gold`
                      : `${textColorMuted} hover:${textColorHover}`
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className={`pt-4 mt-4 ${borderColor} border-t ${isRTL ? 'space-y-reverse space-y-2' : 'space-y-2'}`}>
                <button
                  onClick={toggleLanguage}
                  className={`w-full flex items-center px-4 py-3 text-sm font-light ${textColorMuted} hover:${textColorHover} transition-colors duration-300`}
                >
                  <Globe className={`h-5 w-5 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                  {t('common.toggleLanguage', 'Toggle Language')}
                </button>
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center px-4 py-3 text-sm font-light ${textColorMuted} hover:text-gold transition-colors duration-300`}
                >
                  <LogOut className={`h-5 w-5 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                  {t('common.logout', 'Logout')}
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-20">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
