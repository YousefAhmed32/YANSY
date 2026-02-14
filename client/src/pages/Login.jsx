import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { login, clearError } from '../store/authSlice';
import { gsap } from 'gsap';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { isRTL, dir } = useLanguage();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const formRef = useRef(null);
  const cursorGlowRef = useRef(null);
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

  // Mouse tracking for glow effect
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

  // GSAP entrance animations - enhanced
  useEffect(() => {
    if (containerRef.current && titleRef.current && subtitleRef.current && formRef.current) {
      // Create timeline for orchestrated entrance
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
      )
      .fromTo(
        formRef.current.children,
        { opacity: 0, y: 30, filter: 'blur(10px)' },
        { 
          opacity: 1, 
          y: 0, 
          filter: 'blur(0px)',
          duration: 1,
          stagger: 0.08
        },
        '-=0.5'
      );
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    setLocalError('');

    if (!email || !password) {
      setLocalError(t('auth.fillAllFields', 'Please fill in all fields'));
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
    const result = await dispatch(login({ email, password }));
    submittingRef.current = false;
    
    if (login.rejected.match(result)) {
      setLocalError(result.payload || t('auth.loginFailed', 'Login failed'));
      // Shake animation for error
      if (formRef.current) {
        const errorEl = formRef.current.querySelector('[data-error]');
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
      }
    }
  };

  const handleFocus = (field) => {
    setFocusedField(field);
    // Subtle scale animation on focus
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

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen ${bgClass} ${textClass} flex items-center justify-center px-4 py-20 transition-all duration-700 relative overflow-hidden`}
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
        ref={cursorGlowRef}
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

      <div className="relative z-10 w-full max-w-md">
        {/* Brand with enhanced styling */}
        <div className="mb-20 text-center">
          <Link 
            to="/" 
            className={`inline-block relative group`}
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

        {/* Title & Subtitle with refined typography */}
        <div className="mb-14 text-center space-y-3">
          <h1 
            ref={titleRef}
            className={`text-5xl md:text-6xl font-light tracking-[-0.02em] ${textClass}`}
            style={{ fontFamily: '"Cormorant Garamond", serif' }}
          >
            {t('auth.welcomeBack', 'Welcome back')}
          </h1>
          <p 
            ref={subtitleRef}
            className={`text-lg md:text-xl font-light ${textSecondary} tracking-wide`}
            style={{ fontFamily: '"Inter", sans-serif' }}
          >
            {t('auth.signInContinue', 'Sign in to continue')}
          </p>
        </div>

        {/* Form with enhanced interactions */}
        <form 
          ref={formRef}
          className="space-y-10" 
          onSubmit={handleSubmit}
        >
          {/* Error Message with improved styling */}
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

          {/* Email Input with premium styling */}
          <div className="space-y-3 group">
            <label 
              htmlFor="email" 
              className={`block text-xs font-medium ${textMuted} tracking-[0.1em] uppercase transition-colors duration-300 ${focusedField === 'email' ? 'text-gold' : ''}`}
            >
              {t('auth.email', 'Email')}
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
                placeholder={t('auth.emailPlaceholder', 'your.email@example.com')}
                style={{ fontFamily: '"Inter", sans-serif' }}
              />
              {focusedField === 'email' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent opacity-60" />
              )}
            </div>
          </div>

          {/* Password Input with show/hide functionality */}
          <div className="space-y-3 group">
            <label 
              htmlFor="password" 
              className={`block text-xs font-medium ${textMuted} tracking-[0.1em] uppercase transition-colors duration-300 ${focusedField === 'password' ? 'text-gold' : ''}`}
            >
              {t('auth.password', 'Password')}
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
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
                placeholder={t('auth.passwordPlaceholder', '••••••••')}
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
          </div>

          {/* Submit Button with premium styling */}
          <div className="pt-6">
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
              {/* Animated background on hover */}
              <div className="absolute inset-0 bg-gold translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-out" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              {/* Button text */}
              <span className="relative z-10 group-hover:text-black transition-colors duration-700">
                {loading ? t('auth.signingIn', 'Signing in...') : t('auth.signIn', 'Sign in')}
              </span>
            </button>
          </div>

          {/* Register Link with improved styling */}
          <div className="text-center pt-6">
            <p className={`text-sm font-light ${textSecondary} tracking-wide`}>
              {t('auth.noAccount', "Don't have an account?")}{' '}
              <Link
                to="/register"
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
                {t('auth.createAccount', 'Create one')}
              </Link>
            </p>
          </div>
        </form>
      </div>

      {/* Add keyframes for shimmer animation */}
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

export default Login;