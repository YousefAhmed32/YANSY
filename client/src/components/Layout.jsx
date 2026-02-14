import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { logout } from '../store/authSlice';
import { Globe, LogOut, Menu, X, ChevronDown, User, Settings, Bell } from 'lucide-react';
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeHover, setActiveHover] = useState(null);

  const navRef = useRef(null);
  const logoRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Enhanced scroll effect with parallax
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      setIsScrolled(scrolled);
      
      if (navRef.current) {
        const bgColor = isDark 
          ? scrolled ? 'rgba(0, 0, 0, 0.95)' : 'rgba(0, 0, 0, 0)'
          : scrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0)';
        
        gsap.to(navRef.current, {
          backgroundColor: bgColor,
          backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'blur(0px)',
          boxShadow: scrolled 
            ? isDark 
              ? '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
              : '0 8px 32px 0 rgba(31, 38, 135, 0.07)'
            : 'none',
          duration: 0.4,
          ease: 'power3.out'
        });

        // Subtle logo animation on scroll
        if (logoRef.current) {
          gsap.to(logoRef.current, {
            scale: scrolled ? 0.95 : 1,
            duration: 0.4,
            ease: 'power3.out'
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDark]);

  // Premium entrance animation
  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.1 });
    
    if (logoRef.current) {
      tl.fromTo(
        logoRef.current,
        { opacity: 0, y: -20, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' }
      );
    }

    const navItems = navRef.current?.querySelectorAll('.nav-item');
    if (navItems) {
      tl.fromTo(
        navItems,
        { opacity: 0, y: -15 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.6, 
          stagger: 0.08, 
          ease: 'power3.out' 
        },
        '-=0.4'
      );
    }

    const actionItems = navRef.current?.querySelectorAll('.action-item');
    if (actionItems) {
      tl.fromTo(
        actionItems,
        { opacity: 0, scale: 0.8 },
        { 
          opacity: 1, 
          scale: 1, 
          duration: 0.5, 
          stagger: 0.1, 
          ease: 'back.out(1.7)' 
        },
        '-=0.3'
      );
    }
  }, []);

  const handleLogout = () => {
    // Smooth exit animation
    gsap.to(navRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        dispatch(logout());
        navigate('/login');
      }
    });
  };

  // Navigation links
  const navLinks = user?.role === 'ADMIN' 
    ? [
        { to: '/app/dashboard', label: t('dashboard.title'), icon: '◆' },
        { to: '/app/projects', label: t('projects.title'), icon: '◇' },
        { to: '/app/messages', label: t('messages.title'), icon: '◈' },
        { to: '/app/admin', label: t('dashboard.analytics'), icon: '◉' },
        { to: '/app/admin/users', label: t('users.title'), icon: '◎' },
        { to: '/app/admin/project-requests', label: t('common.projectRequests', 'Project Requests'), icon: '◐' },
        { to: '/app/admin/feedback', label: t('feedback.admin.title', 'Feedback Intelligence'), icon: '◑' }
      ]
    : [
        { to: '/app/dashboard', label: t('dashboard.title'), icon: '◆' },
        { to: '/app/projects', label: t('projects.title'), icon: '◇' },
        { to: '/app/messages', label: t('messages.title'), icon: '◈' },
        { to: '/feedback', label: t('feedback.title'), icon: '◉' }
      ];

  const isActive = (path) => location.pathname === path;

  // Premium theme colors
  const bgColor = isDark ? 'bg-gradient-to-b from-black via-black to-gray-900' : 'bg-gradient-to-b from-white via-white to-gray-50';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const textColorMuted = isDark ? 'text-white/50' : 'text-gray-500';
  const textColorHover = isDark ? 'text-white/90' : 'text-gray-900';
  const borderColor = isDark ? 'border-white/5' : 'border-gray-100';
  const glowColor = isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(212, 175, 55, 0.08)';

  return (
    <div className={`min-h-screen ${bgColor} ${textColor} transition-all duration-500`}>
      {/* Premium Navigation */}
      <nav 
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 ${borderColor} border-b transition-all duration-500`}
        style={{
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        <div className={`max-w-[1600px] mx-auto px-6 lg:px-12 ${isRTL ? 'rtl' : 'ltr'}`}>
          <div className={`flex items-center justify-between h-24 ${isRTL ? 'flex-row-reverse' : ''}`}>
            
            {/* Premium Logo with Animation */}
            <div className="flex-shrink-0">
              <Link 
                ref={logoRef}
                to="/app/dashboard" 
                className={`relative group flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gold/20 to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
                <span className={`relative text-2xl lg:text-3xl font-extralight tracking-[0.2em] ${textColor} transition-all duration-500 group-hover:tracking-[0.25em] group-hover:text-gold`}>
                  YANSY
                </span>
                <div className={`w-1 h-1 rounded-full bg-gold ${isRTL ? 'mr-1' : 'ml-1'} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              </Link>
            </div>

            {/* Desktop Navigation - Premium Design */}
            <div className={`hidden lg:flex flex-1 justify-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'} bg-gradient-to-r ${isDark ? 'from-white/5 to-white/0' : 'from-gray-100/50 to-gray-50/0'} rounded-full px-6 py-2`}>
                {navLinks.map((link, index) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`nav-item relative group px-4 py-2.5 text-xs font-light tracking-[0.15em] uppercase transition-all duration-500 whitespace-nowrap flex items-center ${isRTL ? 'flex-row-reverse' : ''} ${
                      isActive(link.to)
                        ? 'text-gold'
                        : `${textColorMuted} hover:text-gold`
                    }`}
                    onMouseEnter={(e) => {
                      setActiveHover(link.to);
                      gsap.to(e.currentTarget, {
                        y: -3,
                        duration: 0.4,
                        ease: 'power2.out'
                      });
                    }}
                    onMouseLeave={(e) => {
                      setActiveHover(null);
                      gsap.to(e.currentTarget, {
                        y: 0,
                        duration: 0.4,
                        ease: 'power2.out'
                      });
                    }}
                  >
                    {/* Icon with glow effect */}
                    <span className={`text-xs ${isRTL ? 'ml-2' : 'mr-2'} transition-all duration-500 ${isActive(link.to) ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`}>
                      {link.icon}
                    </span>
                    
                    {link.label}
                    
                    {/* Premium Active Indicator */}
                    {isActive(link.to) && (
                      <>
                        <span 
                          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-gold"
                          style={{
                            boxShadow: `0 0 10px ${glowColor}, 0 0 20px ${glowColor}`
                          }}
                        />
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-gold/10 via-gold/5 to-transparent rounded-lg opacity-50"
                        />
                      </>
                    )}
                    
                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-gold/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Premium Right Side Actions */}
            <div className={`hidden lg:flex items-center ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
              
              {/* Notifications Button */}
              <button
                className={`action-item relative p-2.5 ${textColorMuted} hover:text-gold transition-all duration-300 group`}
                aria-label="Notifications"
                onMouseEnter={(e) => {
                  gsap.to(e.currentTarget, { scale: 1.1, rotate: 10, duration: 0.3, ease: 'back.out(1.7)' });
                }}
                onMouseLeave={(e) => {
                  gsap.to(e.currentTarget, { scale: 1, rotate: 0, duration: 0.3, ease: 'power2.out' });
                }}
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-gold rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                  style={{ boxShadow: `0 0 8px ${glowColor}` }}
                />
              </button>

              {/* Language Toggle - Premium */}
              <button
                onClick={toggleLanguage}
                className={`action-item flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-2 px-4 py-2.5 ${textColorMuted} hover:text-gold transition-all duration-300 rounded-full ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100/50 hover:bg-gray-100'} group`}
                aria-label={t('common.toggleLanguage', 'Toggle language')}
                onMouseEnter={(e) => {
                  gsap.to(e.currentTarget, { scale: 1.05, duration: 0.3, ease: 'power2.out' });
                }}
                onMouseLeave={(e) => {
                  gsap.to(e.currentTarget, { scale: 1, duration: 0.3, ease: 'power2.out' });
                }}
              >
                <Globe className="h-4 w-4 group-hover:rotate-12 transition-transform duration-500" />
                <span className="text-xs font-light tracking-wider">{language === 'en' ? 'AR' : 'EN'}</span>
              </button>

              {/* Premium User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`action-item flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-3 px-4 py-2.5 rounded-full transition-all duration-300 ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100/50 hover:bg-gray-100'} ${userMenuOpen ? 'ring-2 ring-gold/30' : ''} group`}
                  onMouseEnter={(e) => {
                    gsap.to(e.currentTarget, { scale: 1.02, duration: 0.3, ease: 'power2.out' });
                  }}
                  onMouseLeave={(e) => {
                    gsap.to(e.currentTarget, { scale: 1, duration: 0.3, ease: 'power2.out' });
                  }}
                >
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center ${isDark ? 'ring-2 ring-white/10' : 'ring-2 ring-gray-200'} group-hover:ring-gold/50 transition-all duration-300`}>
                    <User className="h-4 w-4 text-gold" />
                  </div>
                  
                  {/* User Info */}
                  <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
                    <div className={`text-xs font-light ${textColor} max-w-[120px] truncate`}>
                      {user?.fullName || user?.email || t('common.user', 'User')}
                    </div>
                    <div className={`text-[10px] ${textColorMuted} tracking-wider uppercase`}>
                      {user?.role === 'ADMIN' ? 'Administrator' : 'Member'}
                    </div>
                  </div>
                  
                  <ChevronDown className={`h-4 w-4 ${textColorMuted} transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Premium Dropdown Menu */}
                {userMenuOpen && (
                  <div 
                    className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-3 w-64 ${isDark ? 'bg-black/95' : 'bg-white/95'} backdrop-blur-xl rounded-2xl shadow-2xl ${borderColor} border overflow-hidden`}
                    style={{
                      animation: 'slideDown 0.3s ease-out',
                      boxShadow: isDark 
                        ? '0 20px 60px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(212, 175, 55, 0.1)'
                        : '0 20px 60px -12px rgba(0, 0, 0, 0.15), 0 0 40px rgba(212, 175, 55, 0.05)'
                    }}
                  >
                    {/* User Info Header */}
                    <div className={`px-6 py-5 ${borderColor} border-b bg-gradient-to-br ${isDark ? 'from-white/5 to-transparent' : 'from-gray-50/50 to-transparent'}`}>
                      <div className={`text-sm font-light ${textColor} mb-1`}>
                        {user?.fullName || t('common.user', 'User')}
                      </div>
                      <div className={`text-xs ${textColorMuted} truncate`}>
                        {user?.email}
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          navigate('/app/profile');
                          setUserMenuOpen(false);
                        }}
                        className={`w-full flex items-center ${isRTL ? 'flex-row-reverse' : ''} px-6 py-3 text-sm font-light ${textColorMuted} hover:text-gold ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-all duration-300 group`}
                      >
                        <User className={`h-4 w-4 ${isRTL ? 'ml-3' : 'mr-3'} group-hover:scale-110 transition-transform duration-300`} />
                        {t('common.profile', 'Profile')}
                      </button>
                      
                      <button
                        onClick={() => {
                          navigate('/app/settings');
                          setUserMenuOpen(false);
                        }}
                        className={`w-full flex items-center ${isRTL ? 'flex-row-reverse' : ''} px-6 py-3 text-sm font-light ${textColorMuted} hover:text-gold ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-all duration-300 group`}
                      >
                        <Settings className={`h-4 w-4 ${isRTL ? 'ml-3' : 'mr-3'} group-hover:rotate-90 transition-transform duration-500`} />
                        {t('common.settings', 'Settings')}
                      </button>
                    </div>

                    {/* Logout */}
                    <div className={`px-6 py-4 ${borderColor} border-t`}>
                      <button
                        onClick={handleLogout}
                        className={`w-full flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-center px-4 py-2.5 text-sm font-light text-gold hover:text-white bg-gradient-to-r from-gold/10 to-gold/5 hover:from-gold hover:to-gold/80 rounded-lg transition-all duration-300 group`}
                      >
                        <LogOut className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} group-hover:translate-x-1 transition-transform duration-300`} />
                        {t('common.logout', 'Logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button - Premium */}
            <div className="lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-3 ${textColorMuted} hover:text-gold transition-all duration-300 rounded-full ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100/50 hover:bg-gray-100'}`}
                aria-label={t('common.toggleMenu', 'Toggle menu')}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Premium Mobile Menu */}
        {mobileMenuOpen && (
          <div 
            className={`lg:hidden ${borderColor} border-t ${isDark ? 'bg-black/98' : 'bg-white/98'} backdrop-blur-2xl`}
            style={{
              animation: 'slideDown 0.3s ease-out'
            }}
          >
            <div className={`px-6 py-6 max-h-[70vh] overflow-y-auto ${isRTL ? 'space-y-reverse space-y-2' : 'space-y-2'}`}>
              {/* User Info - Mobile */}
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} space-x-3 px-4 py-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'} mb-4`}>
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center ${isDark ? 'ring-2 ring-white/10' : 'ring-2 ring-gray-200'}`}>
                  <User className="h-5 w-5 text-gold" />
                </div>
                <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div className={`text-sm font-light ${textColor}`}>
                    {user?.fullName || user?.email || t('common.user', 'User')}
                  </div>
                  <div className={`text-xs ${textColorMuted}`}>
                    {user?.role === 'ADMIN' ? 'Administrator' : 'Member'}
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} px-5 py-4 text-sm font-light tracking-wide rounded-xl transition-all duration-300 ${
                    isActive(link.to)
                      ? `text-gold bg-gradient-to-r ${isDark ? 'from-gold/10 to-gold/5' : 'from-gold/10 to-gold/5'}`
                      : `${textColorMuted} hover:text-gold ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className={`text-base ${isRTL ? 'ml-3' : 'mr-3'}`}>{link.icon}</span>
                  {link.label}
                </Link>
              ))}

              {/* Actions - Mobile */}
              <div className={`pt-4 mt-4 ${borderColor} border-t space-y-2`}>
                <button
                  onClick={() => {
                    toggleLanguage();
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center ${isRTL ? 'flex-row-reverse' : ''} px-5 py-4 text-sm font-light ${textColorMuted} hover:text-gold ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} rounded-xl transition-all duration-300`}
                >
                  <Globe className={`h-5 w-5 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                  {t('common.toggleLanguage', 'Toggle Language')}
                </button>
                
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-center px-5 py-4 text-sm font-light text-gold bg-gradient-to-r from-gold/10 to-gold/5 hover:from-gold hover:to-gold/80 hover:text-white rounded-xl transition-all duration-300`}
                >
                  <LogOut className={`h-5 w-5 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                  {t('common.logout', 'Logout')}
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content with Premium Styling */}
      <main className="pt-24">
        <Outlet />
      </main>

      {/* Premium CSS Animations */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Layout;