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

  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const formRef = useRef(null);

  // Theme-aware classes
  const bgClass = isDark ? 'bg-black' : 'bg-white';
  const textClass = isDark ? 'text-white/90' : 'text-gray-900';
  const textMuted = isDark ? 'text-white/60' : 'text-gray-600';
  const textSecondary = isDark ? 'text-white/50' : 'text-gray-500';
  const surfaceClass = isDark ? 'bg-white/5' : 'bg-black/5';
  const borderClass = isDark ? 'border-white/10' : 'border-gray-200';
  const borderLight = isDark ? 'border-white/20' : 'border-gray-300';

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

  // GSAP entrance animations
  useEffect(() => {
    if (containerRef.current && titleRef.current && subtitleRef.current && formRef.current) {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, ease: 'power2.out', delay: 0.2 }
      );
      gsap.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.4 }
      );
      gsap.fromTo(
        formRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.1, delay: 0.6 }
      );
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    if (!email || !password) {
      setLocalError(t('auth.fillAllFields', 'Please fill in all fields'));
      return;
    }

    const result = await dispatch(login({ email, password }));
    
    if (login.rejected.match(result)) {
      setLocalError(result.payload || t('auth.loginFailed', 'Login failed'));
      // Animate error appearance
      if (formRef.current) {
        gsap.fromTo(
          formRef.current.querySelector('[data-error]'),
          { opacity: 0, y: -10 },
          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
        );
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen ${bgClass} ${textClass} flex items-center justify-center px-4 py-20 transition-colors duration-300`}
      dir={dir}
    >
      {/* Background subtle pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${isDark ? 'ffffff' : '000000'}' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="mb-16 text-center">
          <Link 
            to="/" 
            className={`inline-block text-5xl md:text-6xl font-light tracking-tight mb-4 hover:text-gold transition-colors duration-300 ${textClass}`}
          >
            YANSY
          </Link>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto" />
        </div>

        {/* Title & Subtitle */}
        <div className="mb-12 text-center">
          <h1 
            ref={titleRef}
            className={`text-5xl md:text-6xl font-light tracking-tight mb-4 ${textClass}`}
          >
            {t('auth.welcomeBack', 'Welcome back')}
          </h1>
          <p 
            ref={subtitleRef}
            className={`text-lg md:text-xl font-light ${textSecondary}`}
          >
            {t('auth.signInContinue', 'Sign in to continue')}
          </p>
        </div>

        {/* Form */}
        <form 
          ref={formRef}
          className="space-y-8" 
          onSubmit={handleSubmit}
        >
          {/* Error Message */}
          {localError && (
            <div 
              data-error
              className={`px-6 py-4 ${surfaceClass} border ${borderLight} rounded-sm`}
            >
              <p className={`text-sm font-light ${isDark ? 'text-white/70' : 'text-red-600'}`}>
                {localError}
              </p>
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-2">
            <label 
              htmlFor="email" 
              className={`block text-sm font-light ${textMuted} tracking-wide uppercase`}
            >
              {t('auth.email', 'Email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              disabled={loading}
              className={`w-full px-0 py-4 bg-transparent border-0 border-b ${borderLight} ${textClass} ${isDark ? 'placeholder-white/30' : 'placeholder-gray-400'} font-light text-lg focus:outline-none focus:border-gold transition-colors duration-500 disabled:opacity-50 disabled:cursor-not-allowed`}
              placeholder={t('auth.emailPlaceholder', 'your.email@example.com')}
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label 
              htmlFor="password" 
              className={`block text-sm font-light ${textMuted} tracking-wide uppercase`}
            >
              {t('auth.password', 'Password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              disabled={loading}
              className={`w-full px-0 py-4 bg-transparent border-0 border-b ${borderLight} ${textClass} ${isDark ? 'placeholder-white/30' : 'placeholder-gray-400'} font-light text-lg focus:outline-none focus:border-gold transition-colors duration-500 disabled:opacity-50 disabled:cursor-not-allowed`}
              placeholder={t('auth.passwordPlaceholder', '••••••••')}
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-8 py-4 border border-gold text-gold text-sm font-light tracking-widest uppercase hover:bg-gold hover:text-black transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gold"
            >
              {loading ? t('auth.signingIn', 'Signing in...') : t('auth.signIn', 'Sign in')}
            </button>
          </div>

          {/* Register Link */}
          <div className="text-center pt-4">
            <p className={`text-sm font-light ${textSecondary}`}>
              {t('auth.noAccount', "Don't have an account?")}{' '}
              <Link
                to="/register"
                className={`${textMuted} hover:text-gold transition-colors duration-300 underline underline-offset-4`}
              >
                {t('auth.createAccount', 'Create one')}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
