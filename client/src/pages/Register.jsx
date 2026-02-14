import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { register, clearError } from '../store/authSlice';
import { gsap } from 'gsap';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { isRTL, dir } = useLanguage();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [brandName, setBrandName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [localError, setLocalError] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentSection, setCurrentSection] = useState('personal'); // 'personal' or 'business'

  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const formRef = useRef(null);
  const personalSectionRef = useRef(null);
  const businessSectionRef = useRef(null);
  const submittingRef = useRef(false);

  // Theme-aware classes
  const bgClass = isDark ? 'bg-[#0a0a0a]' : 'bg-[#fafaf9]';
  const textClass = isDark ? 'text-white/95' : 'text-gray-900';
  const textMuted = isDark ? 'text-white/65' : 'text-gray-600';
  const textSecondary = isDark ? 'text-white/45' : 'text-gray-500';
  const surfaceClass = isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]';
  const borderClass = isDark ? 'border-white/[0.08]' : 'border-gray-200/80';
  const borderLight = isDark ? 'border-white/[0.15]' : 'border-gray-300/60';
  const glowColor = isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(212, 175, 55, 0.08)';

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      setLocalError(error);
    }
  }, [error]);

  // Password strength calculator
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }
    
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;
    
    setPasswordStrength(Math.min(strength, 100));
  }, [password]);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Enhanced GSAP entrance animations
  useEffect(() => {
    if (containerRef.current && titleRef.current && subtitleRef.current) {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      
      tl.fromTo(
        titleRef.current,
        { opacity: 0, y: 40, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 1.2, delay: 0.1 }
      )
      .fromTo(
        subtitleRef.current,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.9 },
        '-=0.8'
      );

      if (personalSectionRef.current) {
        tl.fromTo(
          personalSectionRef.current.children,
          { opacity: 0, y: 30, filter: 'blur(10px)' },
          { 
            opacity: 1, 
            y: 0, 
            filter: 'blur(0px)',
            duration: 1,
            stagger: 0.06
          },
          '-=0.5'
        );
      }
      
      if (businessSectionRef.current) {
        tl.fromTo(
          businessSectionRef.current.children,
          { opacity: 0, y: 30, filter: 'blur(10px)' },
          { 
            opacity: 1, 
            y: 0, 
            filter: 'blur(0px)',
            duration: 1,
            stagger: 0.06
          },
          '-=0.7'
        );
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    setLocalError('');

    // Validation
    if (!email || !password || !fullName || !phoneNumber) {
      setLocalError(t('auth.fillAllFields'));
      return;
    }

    if (password.length < 6) {
      setLocalError(t('register.passwordMinLength'));
      return;
    }

    if (fullName.trim().length < 2) {
      setLocalError(t('register.nameMinLength'));
      return;
    }

    if (!brandName && !companyName) {
      setLocalError(t('register.brandOrCompanyRequired'));
      return;
    }

    // Button animation
    const button = e.target.querySelector('button[type="submit"]');
    gsap.to(button, {
      scale: 0.98,
      duration: 0.1,
      yoyo: true,
      repeat: 1
    });

    submittingRef.current = true;
    const result = await dispatch(register({
      email,
      password,
      fullName,
      phoneNumber,
      brandName: brandName || null,
      companyName: companyName || null
    }));
    submittingRef.current = false;

    if (register.rejected.match(result)) {
      setLocalError(result.payload || t('register.registrationFailed'));
      setTimeout(() => {
        const errorEl = formRef.current?.querySelector('[data-error]');
        if (errorEl) {
          gsap.fromTo(
            errorEl,
            { opacity: 0, x: -20 },
            { opacity: 1, x: 0, duration: 0.5, ease: 'back.out(1.7)' }
          );
          gsap.to(formRef.current, {
            x: [-10, 10, -8, 8, -5, 5, 0],
            duration: 0.6,
            ease: 'power2.out'
          });
        }
      }, 0);
    }
  };

  const handleFocus = (field) => {
    setFocusedField(field);
    const input = document.getElementById(field);
    if (input) {
      gsap.to(input.parentElement, {
        scale: 1.01,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  };

  const handleBlur = (field) => {
    setFocusedField(null);
    const input = document.getElementById(field);
    if (input) {
      gsap.to(input.parentElement, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 30) return isDark ? '#ef4444' : '#dc2626';
    if (passwordStrength < 60) return isDark ? '#f59e0b' : '#d97706';
    return isDark ? '#10b981' : '#059669';
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength < 30) return 'Weak';
    if (passwordStrength < 60) return 'Medium';
    return 'Strong';
  };

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen ${bgClass} ${textClass} px-4 py-20 transition-all duration-700 relative overflow-hidden`}
      dir={dir}
    >
      {/* Animated gradient mesh background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute -top-1/2 -left-1/2 w-full h-full opacity-30 blur-3xl"
          style={{
            background: `radial-gradient(circle at 30% 40%, ${isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(212, 175, 55, 0.08)'}, transparent 50%)`
          }}
        />
        <div 
          className="absolute -bottom-1/2 -right-1/2 w-full h-full opacity-20 blur-3xl"
          style={{
            background: `radial-gradient(circle at 70% 60%, ${isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)'}, transparent 50%)`
          }}
        />
      </div>

      {/* Cursor glow effect */}
      <div 
        className="fixed pointer-events-none transition-opacity duration-500 blur-2xl"
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
          width: '400px',
          height: '400px',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${glowColor}, transparent 70%)`,
          opacity: 0.6
        }}
      />

      {/* Subtle grid pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015]">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px),
              linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Brand */}
        <div className="mb-20 text-center">
          <Link 
            to="/" 
            className="inline-block relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gold/20 via-gold/30 to-gold/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <h1 className={`relative text-6xl md:text-7xl font-light tracking-[-0.02em] mb-6 ${textClass} transition-all duration-500 group-hover:tracking-[-0.01em]`}
              style={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
              YANSY
            </h1>
          </Link>
          <div className="relative h-px max-w-[120px] mx-auto overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold to-transparent opacity-40" />
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-gold to-transparent"
              style={{
                animation: 'shimmer 3s ease-in-out infinite'
              }}
            />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="mb-16 text-center space-y-3">
          <h1 
            ref={titleRef}
            className={`text-5xl md:text-6xl font-light tracking-[-0.02em] ${textClass}`}
            style={{ fontFamily: '"Cormorant Garamond", serif' }}
          >
            {t('auth.registerTitle')}
          </h1>
          <p 
            ref={subtitleRef}
            className={`text-lg md:text-xl font-light ${textSecondary} max-w-xl mx-auto tracking-wide`}
            style={{ fontFamily: '"Inter", sans-serif' }}
          >
            {t('register.subtitle')}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-12 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentSection('personal')}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-500
              ${currentSection === 'personal' 
                ? `${surfaceClass} ${textClass}` 
                : `${textSecondary} hover:${textMuted}`
              }
            `}
          >
            <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
              currentSection === 'personal' ? 'bg-gold' : 'bg-current opacity-30'
            }`} />
            <span className="text-xs tracking-wider uppercase">{t('register.personalInfo')}</span>
          </button>
          
          <div className={`h-px w-12 ${borderClass}`} />
          
          <button
            type="button"
            onClick={() => setCurrentSection('business')}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-500
              ${currentSection === 'business' 
                ? `${surfaceClass} ${textClass}` 
                : `${textSecondary} hover:${textMuted}`
              }
            `}
          >
            <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
              currentSection === 'business' ? 'bg-gold' : 'bg-current opacity-30'
            }`} />
            <span className="text-xs tracking-wider uppercase">{t('register.businessInfo')}</span>
          </button>
        </div>

        {/* Form */}
        <form 
          ref={formRef}
          className="space-y-14" 
          onSubmit={handleSubmit}
        >
          {/* Error Message */}
          {localError && (
            <div 
              data-error
              className={`px-7 py-5 ${surfaceClass} backdrop-blur-xl border ${borderLight} rounded-lg relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-red-500/10 to-red-500/5" />
              <div className="relative flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className={`text-sm font-light ${isDark ? 'text-red-400/90' : 'text-red-600'} leading-relaxed`}>
                  {localError}
                </p>
              </div>
            </div>
          )}

          {/* Personal Information Section */}
          <div ref={personalSectionRef} className="space-y-10">
            <div className="pb-5 border-b-2 border-gold/20 relative">
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
              <h2 className={`text-sm font-medium ${textMuted} tracking-[0.15em] uppercase`}>
                {t('register.personalInfo')}
              </h2>
            </div>

            <div className="space-y-10">
              {/* Full Name */}
              <div className="space-y-3 group">
                <label 
                  htmlFor="fullName" 
                  className={`block text-xs font-medium ${textMuted} tracking-[0.1em] uppercase transition-colors duration-300 ${focusedField === 'fullName' ? 'text-gold' : ''}`}
                >
                  {t('register.fullName')} *
                </label>
                <div className="relative">
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onFocus={() => handleFocus('fullName')}
                    onBlur={() => handleBlur('fullName')}
                    disabled={loading}
                    className={`
                      w-full px-0 py-5 bg-transparent border-0 border-b-2 
                      ${focusedField === 'fullName' ? 'border-gold' : borderLight}
                      ${textClass} 
                      ${isDark ? 'placeholder-white/25' : 'placeholder-gray-400/60'} 
                      font-light text-lg tracking-wide
                      focus:outline-none 
                      transition-all duration-500
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                    placeholder={t('register.fullNamePlaceholder')}
                    style={{ fontFamily: '"Inter", sans-serif' }}
                  />
                  {focusedField === 'fullName' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent opacity-60" />
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-3 group">
                <label 
                  htmlFor="email" 
                  className={`block text-xs font-medium ${textMuted} tracking-[0.1em] uppercase transition-colors duration-300 ${focusedField === 'email' ? 'text-gold' : ''}`}
                >
                  {t('auth.email')} *
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => handleFocus('email')}
                    onBlur={() => handleBlur('email')}
                    disabled={loading}
                    className={`
                      w-full px-0 py-5 bg-transparent border-0 border-b-2 
                      ${focusedField === 'email' ? 'border-gold' : borderLight}
                      ${textClass} 
                      ${isDark ? 'placeholder-white/25' : 'placeholder-gray-400/60'} 
                      font-light text-lg tracking-wide
                      focus:outline-none 
                      transition-all duration-500
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                    placeholder={t('auth.emailPlaceholder')}
                    style={{ fontFamily: '"Inter", sans-serif' }}
                  />
                  {focusedField === 'email' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent opacity-60" />
                  )}
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-3 group">
                <label 
                  htmlFor="phoneNumber" 
                  className={`block text-xs font-medium ${textMuted} tracking-[0.1em] uppercase transition-colors duration-300 ${focusedField === 'phoneNumber' ? 'text-gold' : ''}`}
                >
                  {t('register.phoneNumber')} *
                </label>
                <div className="relative">
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    onFocus={() => handleFocus('phoneNumber')}
                    onBlur={() => handleBlur('phoneNumber')}
                    disabled={loading}
                    className={`
                      w-full px-0 py-5 bg-transparent border-0 border-b-2 
                      ${focusedField === 'phoneNumber' ? 'border-gold' : borderLight}
                      ${textClass} 
                      ${isDark ? 'placeholder-white/25' : 'placeholder-gray-400/60'} 
                      font-light text-lg tracking-wide
                      focus:outline-none 
                      transition-all duration-500
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                    placeholder={t('register.phoneNumberPlaceholder')}
                    style={{ fontFamily: '"Inter", sans-serif' }}
                  />
                  {focusedField === 'phoneNumber' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent opacity-60" />
                  )}
                </div>
              </div>

              {/* Password with strength indicator */}
              <div className="space-y-3 group">
                <label 
                  htmlFor="password" 
                  className={`block text-xs font-medium ${textMuted} tracking-[0.1em] uppercase transition-colors duration-300 ${focusedField === 'password' ? 'text-gold' : ''}`}
                >
                  {t('auth.password')} *
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => handleFocus('password')}
                    onBlur={() => handleBlur('password')}
                    disabled={loading}
                    className={`
                      w-full px-0 py-5 pr-12 bg-transparent border-0 border-b-2 
                      ${focusedField === 'password' ? 'border-gold' : borderLight}
                      ${textClass} 
                      ${isDark ? 'placeholder-white/25' : 'placeholder-gray-400/60'} 
                      font-light text-lg tracking-wide
                      focus:outline-none 
                      transition-all duration-500
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                    placeholder={t('register.passwordPlaceholder')}
                    style={{ fontFamily: '"Inter", sans-serif' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-1/2 -translate-y-1/2 p-2 ${textMuted} hover:text-gold transition-colors duration-300`}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                  {focusedField === 'password' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent opacity-60" />
                  )}
                </div>
                {password && (
                  <div className="space-y-2 mt-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${textSecondary} tracking-wide`}>
                        Password Strength
                      </span>
                      <span 
                        className="text-xs font-medium tracking-wide"
                        style={{ color: getPasswordStrengthColor() }}
                      >
                        {getPasswordStrengthLabel()}
                      </span>
                    </div>
                    <div className={`h-1.5 ${surfaceClass} rounded-full overflow-hidden`}>
                      <div 
                        className="h-full transition-all duration-500 rounded-full"
                        style={{ 
                          width: `${passwordStrength}%`,
                          backgroundColor: getPasswordStrengthColor()
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Business Information Section */}
          <div ref={businessSectionRef} className="space-y-10">
            <div className="pb-5 border-b-2 border-gold/20 relative">
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
              <h2 className={`text-sm font-medium ${textMuted} tracking-[0.15em] uppercase`}>
                {t('register.businessInfo')}
              </h2>
              <p className={`mt-2 text-xs font-light ${textSecondary} tracking-wide`}>
                {t('register.brandOrCompanyHint')}
              </p>
            </div>

            <div className="space-y-10">
              {/* Brand Name */}
              <div className="space-y-3 group">
                <label 
                  htmlFor="brandName" 
                  className={`block text-xs font-medium ${textMuted} tracking-[0.1em] uppercase transition-colors duration-300 ${focusedField === 'brandName' ? 'text-gold' : ''}`}
                >
                  {t('register.brandName')}
                </label>
                <div className="relative">
                  <input
                    id="brandName"
                    name="brandName"
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    onFocus={() => handleFocus('brandName')}
                    onBlur={() => handleBlur('brandName')}
                    disabled={loading}
                    className={`
                      w-full px-0 py-5 bg-transparent border-0 border-b-2 
                      ${focusedField === 'brandName' ? 'border-gold' : borderLight}
                      ${textClass} 
                      ${isDark ? 'placeholder-white/25' : 'placeholder-gray-400/60'} 
                      font-light text-lg tracking-wide
                      focus:outline-none 
                      transition-all duration-500
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                    placeholder={t('register.brandNamePlaceholder')}
                    style={{ fontFamily: '"Inter", sans-serif' }}
                  />
                  {focusedField === 'brandName' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent opacity-60" />
                  )}
                </div>
              </div>

              {/* Company Name */}
              <div className="space-y-3 group">
                <label 
                  htmlFor="companyName" 
                  className={`block text-xs font-medium ${textMuted} tracking-[0.1em] uppercase transition-colors duration-300 ${focusedField === 'companyName' ? 'text-gold' : ''}`}
                >
                  {t('register.companyName')}
                </label>
                <div className="relative">
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    onFocus={() => handleFocus('companyName')}
                    onBlur={() => handleBlur('companyName')}
                    disabled={loading}
                    className={`
                      w-full px-0 py-5 bg-transparent border-0 border-b-2 
                      ${focusedField === 'companyName' ? 'border-gold' : borderLight}
                      ${textClass} 
                      ${isDark ? 'placeholder-white/25' : 'placeholder-gray-400/60'} 
                      font-light text-lg tracking-wide
                      focus:outline-none 
                      transition-all duration-500
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                    placeholder={t('register.companyNamePlaceholder')}
                    style={{ fontFamily: '"Inter", sans-serif' }}
                  />
                  {focusedField === 'companyName' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent opacity-60" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-8">
            <button
              type="submit"
              disabled={loading}
              className="
                group relative w-full px-8 py-5 
                border-2 border-gold 
                text-gold text-sm font-medium tracking-[0.15em] uppercase 
                overflow-hidden
                transition-all duration-700
                hover:tracking-[0.2em]
                disabled:opacity-50 disabled:cursor-not-allowed
                disabled:hover:tracking-[0.15em]
              "
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gold translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-out" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              {/* Button text */}
              <span className="relative z-10 group-hover:text-black transition-colors duration-700">
                {loading ? t('register.creatingAccount') : t('register.createAccount')}
              </span>
            </button>
          </div>

          {/* Privacy Note */}
          <div className="text-center pt-4">
            <div className={`flex items-center justify-center gap-2 ${textSecondary}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-xs font-light tracking-wide">
                {t('register.privacyNote')}
              </p>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center pt-6">
            <p className={`text-sm font-light ${textSecondary} tracking-wide`}>
              {t('auth.hasAccount')}{' '}
              <Link
                to="/login"
                className={`
                  ${textMuted} 
                  hover:text-gold 
                  transition-all duration-300 
                  underline underline-offset-4 
                  decoration-1
                  hover:decoration-2
                  hover:underline-offset-8
                `}
              >
                {t('auth.signIn')}
              </Link>
            </p>
          </div>
        </form>
      </div>

      {/* Styles */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Inter:wght@300;400;500&display=swap');
      `}</style>
    </div>
  );
};

export default Register;