import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGoogleLogin } from '@react-oauth/google';
import { useLanguage } from '../contexts/LanguageContext';
import { useSEO } from '../hooks/useSEO';
import { login, googleLogin, clearError } from '../store/authSlice';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

const GoogleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const Spinner = ({ size = 14 }) => (
  <span style={{
    width: size, height: size, borderRadius: '50%',
    border: '1.5px solid rgba(255,255,255,0.3)',
    borderTopColor: '#ffffff',
    animation: 'spin .65s linear infinite',
    display: 'inline-block', flexShrink: 0,
  }} />
);

const BrandPanel = ({ isRTL }) => (
  <div style={{
    display: 'none',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '48px',
    background: '#F6F7F9',
    borderRight: '1px solid #E8EBF0',
    position: 'relative',
    overflow: 'hidden',
  }} className="auth-brand-panel">
    <div>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.08em', color: '#0D1117' }}>YANSY</span>
        <span style={{ display: 'block', fontSize: '10px', letterSpacing: '0.2em', color: '#6B7280', textTransform: 'uppercase', marginTop: '2px' }}>TECH</span>
      </Link>
    </div>

    <div>
      <h2 style={{
        fontSize: 'clamp(22px,2.5vw,30px)', fontWeight: 700,
        letterSpacing: '-0.025em', color: '#0D1117', margin: '0 0 16px',
        lineHeight: 1.15,
      }}>
        {isRTL
          ? <><span style={{ color: '#2563EB' }}>منصتك الرقمية</span><br />لإدارة مشاريعك</>
          : <>Your portal to<br /><span style={{ color: '#2563EB' }}>premium digital work.</span></>
        }
      </h2>
      <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.7, margin: '0 0 32px', maxWidth: '300px' }}>
        {isRTL
          ? 'تابع مشاريعك، تواصل مع فريقنا، وتحقق من تقدم عملك في مكان واحد.'
          : 'Track your projects, communicate with our team, and monitor progress — all in one place.'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {[
          { num: '50+', label: isRTL ? 'مشروع مُسلَّم' : 'Projects delivered' },
          { num: '98%', label: isRTL ? 'رضا العملاء'   : 'Client satisfaction' },
          { num: '4+',  label: isRTL ? 'سنوات خبرة'    : 'Years of expertise'  },
          { num: '24h', label: isRTL ? 'ضمان الرد'      : 'Response guarantee'  },
        ].map((s) => (
          <div key={s.num} style={{ padding: '16px', background: '#FFFFFF', border: '1px solid #E8EBF0', borderRadius: '10px' }}>
            <p style={{ fontSize: '22px', fontWeight: 700, color: '#2563EB', margin: '0 0 2px', letterSpacing: '-0.03em' }}>{s.num}</p>
            <p style={{ fontSize: '11px', color: '#6B7280', margin: 0, letterSpacing: '0.01em' }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>

    <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>
      {isRTL ? 'موثوق به من 50+ شركة ورائد أعمال.' : 'Trusted by 50+ businesses and founders.'}
    </p>
  </div>
);

const Login = () => {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { t }      = useTranslation();
  const { isRTL, dir } = useLanguage();
  const { isAuthenticated, loading, error } = useSelector((s) => s.auth);

  useSEO({ title: `${t('auth.login', 'Log In')} | YANSY TECH`, noIndex: true });

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [localError, setLocalError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [focused, setFocused]       = useState(null);

  const formRef    = useRef(null);
  const submitting = useRef(false);

  useEffect(() => { if (isAuthenticated) navigate('/app/dashboard'); }, [isAuthenticated, navigate]);
  useEffect(() => { dispatch(clearError()); }, [dispatch]);
  useEffect(() => { if (error) setLocalError(error); }, [error]);

  const shakeForm = useCallback(() => {
    if (!formRef.current) return;
    formRef.current.style.animation = 'none';
    requestAnimationFrame(() => {
      formRef.current.style.animation = 'shake 0.4s ease';
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting.current || loading) return;
    setLocalError('');
    if (!email.trim()) { setLocalError(t('auth.emailRequired', 'Email address is required.')); return; }
    if (!password)     { setLocalError(t('auth.passwordRequired', 'Password is required.')); return; }

    submitting.current = true;
    const result = await dispatch(login({ email: email.trim(), password }));
    submitting.current = false;

    if (login.rejected.match(result)) {
      setLocalError(result.payload || t('auth.loginFailed', 'Login failed. Please try again.'));
      shakeForm();
    }
  };

  const handleGoogleSuccess = useCallback(async (codeResponse) => {
    setLocalError('');
    setGoogleLoading(true);
    const result = await dispatch(googleLogin({ code: codeResponse.code }));
    setGoogleLoading(false);
    if (googleLogin.rejected.match(result)) {
      setLocalError(result.payload || t('auth.googleFailed', 'Google sign-in failed. Please try again.'));
      shakeForm();
    }
  }, [dispatch, t, shakeForm]);

  const handleGoogleError = useCallback(() => {
    setGoogleLoading(false);
    setLocalError(t('auth.googleCancelled', 'Google sign-in was cancelled or failed.'));
  }, [t]);

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError:   handleGoogleError,
    flow:      'auth-code',
  });

  const isDisabled = loading || submitting.current || googleLoading;

  const inputStyle = (name) => ({
    width: '100%',
    padding: '11px 14px',
    background: '#FFFFFF',
    border: `1px solid ${focused === name ? '#2563EB' : '#E8EBF0'}`,
    borderRadius: '8px',
    color: '#0D1117',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    fontFamily: "'Inter',system-ui,sans-serif",
  });

  return (
    <div className="auth-root" dir={dir} style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex' }}>
      <BrandPanel isRTL={isRTL} />

      {/* Form panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: 'clamp(32px,6vw,64px)',
        background: '#FFFFFF',
      }}>
        {/* Mobile brand */}
        <div className="auth-mobile-brand" style={{ display: 'none', marginBottom: '40px', textAlign: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.08em', color: '#0D1117' }}>YANSY</span>
            <span style={{ display: 'block', fontSize: '9px', letterSpacing: '0.2em', color: '#6B7280', textTransform: 'uppercase', marginTop: '2px' }}>TECH</span>
          </Link>
        </div>

        <div ref={formRef} style={{ width: '100%', maxWidth: '400px' }}>
          {/* Heading */}
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: 'clamp(22px,2.5vw,28px)', fontWeight: 700, color: '#0D1117', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
              {t('auth.welcomeBack', 'Welcome back')}
            </h1>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
              {t('auth.signInContinue', 'Sign in to your client portal')}
            </p>
          </div>

          {/* Error */}
          {localError && (
            <div role="alert" style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              padding: '12px 14px', marginBottom: '20px',
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: '8px',
            }}>
              <svg style={{ width: '15px', height: '15px', color: '#EF4444', flexShrink: 0, marginTop: '1px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p style={{ fontSize: '13px', color: '#B91C1C', margin: 0, lineHeight: 1.5 }}>{localError}</p>
            </div>
          )}

          {/* Google */}
          <button
            type="button"
            onClick={() => triggerGoogleLogin()}
            disabled={isDisabled}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              padding: '11px 20px', marginBottom: '20px',
              background: '#FFFFFF', border: '1px solid #E8EBF0', borderRadius: '8px',
              color: '#0D1117', fontSize: '14px', fontWeight: 500,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: isDisabled ? 0.55 : 1,
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onMouseEnter={e => { if (!isDisabled) { e.currentTarget.style.borderColor = '#C9CDD6'; e.currentTarget.style.background = '#F6F7F9'; }}}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8EBF0'; e.currentTarget.style.background = '#FFFFFF'; }}
            aria-label="Sign in with Google"
          >
            {googleLoading ? <Spinner size={17} /> : <GoogleIcon />}
            <span>{t('auth.continueWithGoogle', 'Continue with Google')}</span>
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: '#E8EBF0' }} />
            <span style={{ fontSize: '11px', color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
              {t('common.or', 'or')}
            </span>
            <div style={{ flex: 1, height: '1px', background: '#E8EBF0' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '6px', letterSpacing: '0.01em' }}>
                {t('auth.email', 'Email address')}
              </label>
              <input
                id="email" type="email" autoComplete="email" required
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                disabled={isDisabled}
                placeholder="you@example.com"
                style={inputStyle('email')}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                <label htmlFor="password" style={{ fontSize: '12px', fontWeight: 500, color: '#374151', letterSpacing: '0.01em' }}>
                  {t('auth.password', 'Password')}
                </label>
                <Link to="/forgot-password" style={{ fontSize: '12px', color: '#2563EB', textDecoration: 'none', fontWeight: 500 }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#1D4ED8'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#2563EB'; }}
                >
                  {t('auth.forgotPassword', 'Forgot password?')}
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="password" type={showPass ? 'text' : 'password'}
                  autoComplete="current-password" required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  disabled={isDisabled}
                  placeholder="••••••••"
                  style={{ ...inputStyle('password'), paddingRight: isRTL ? '14px' : '42px', paddingLeft: isRTL ? '42px' : '14px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  tabIndex={-1}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute', [isRTL ? 'left' : 'right']: '12px', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#9CA3AF', padding: 0, display: 'flex', transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#6B7280'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isDisabled}
              style={{
                width: '100%', padding: '12px 20px', marginTop: '4px',
                background: isDisabled ? '#9CA3AF' : '#0D1117',
                border: 'none', borderRadius: '8px',
                color: '#FFFFFF', fontSize: '14px', fontWeight: 600,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
              onMouseEnter={e => { if (!isDisabled) e.currentTarget.style.background = '#1a2230'; }}
              onMouseLeave={e => { if (!isDisabled) e.currentTarget.style.background = '#0D1117'; }}
              aria-busy={loading}
            >
              {loading && !googleLoading ? (
                <>
                  <Spinner size={14} />
                  {t('auth.signingIn', 'Signing in…')}
                </>
              ) : (
                <>
                  {t('auth.signIn', 'Sign in')}
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', flexWrap: 'wrap', gap: '8px' }}>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
              {t('auth.noAccount', 'No account?')}{' '}
              <Link to="/register" style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 500 }}
                onMouseEnter={e => { e.currentTarget.style.color = '#1D4ED8'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#2563EB'; }}
              >
                {t('auth.createAccount', 'Register')}
              </Link>
            </p>
            <Link to="/" style={{ fontSize: '12px', color: '#9CA3AF', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#6B7280'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; }}
            >
              ← {t('common.backHome', 'Home')}
            </Link>
          </div>

          {/* Trust */}
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #E8EBF0' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {[
                { icon: '🔒', text: isRTL ? 'اتصال آمن' : 'Secure connection' },
                { icon: '🛡️', text: isRTL ? 'بياناتك محمية' : 'Data protected' },
              ].map(item => (
                <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '11px' }}>{item.icon}</span>
                  <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
        @media (min-width: 900px) {
          .auth-brand-panel { display: flex !important; width: 45%; }
          .auth-mobile-brand { display: none !important; }
        }
        @media (max-width: 899px) {
          .auth-mobile-brand { display: block !important; }
        }
      `}</style>
    </div>
  );
};

export default Login;
