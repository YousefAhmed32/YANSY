import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGoogleLogin } from '@react-oauth/google';
import { useLanguage } from '../contexts/LanguageContext';
import { useSEO } from '../hooks/useSEO';
import { login, googleLogin, clearError } from '../store/authSlice';
import { Eye, EyeOff, ArrowRight, Mail, Lock, Sparkles, ShieldCheck } from 'lucide-react';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
    padding: '44px 48px',
    background: '#070B14',
    position: 'relative',
    overflow: 'hidden',
  }} className="auth-brand-panel">
    {/* Full-bleed 3D Artwork Background */}
    <img
      src="/placeholders/auth-fullbleed-3d.jpg"
      alt="YANSY TECH 3D Security Portal"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: 0.65,
        filter: 'brightness(0.9) contrast(1.1)',
        transform: 'scale(1.03)',
      }}
    />
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, rgba(7,11,20,0.85) 0%, rgba(7,11,20,0.4) 40%, rgba(7,11,20,0.92) 100%)',
    }} />

    {/* Glow Ambient Orbs */}
    <div style={{ position: 'absolute', top: '20%', left: '10%', width: '350px', height: '350px', background: 'radial-gradient(circle, rgba(37,99,235,0.3) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', bottom: '15%', right: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

    {/* Header */}
    <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
        <span style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '0.08em', color: '#FFFFFF' }}>YANSY</span>
        <span style={{ display: 'block', fontSize: '10px', letterSpacing: '0.25em', color: '#60A5FA', textTransform: 'uppercase', marginTop: '1px', fontWeight: 800 }}>TECH</span>
      </Link>

      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        padding: '6px 14px', borderRadius: '100px',
        background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
      }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 12px #10B981' }} />
        <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#F1F5F9', letterSpacing: '0.02em' }}>
          {isRTL ? 'بوابة العملاء مشفّرة 100%' : '100% Encrypted Client Portal'}
        </span>
      </div>
    </div>

    {/* Center Interactive Glass Hero Card */}
    <div style={{ position: 'relative', zIndex: 10, margin: 'auto 0', paddingTop: '32px', paddingBottom: '32px' }}>
      <div style={{
        padding: '32px', borderRadius: '24px',
        background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 30px 60px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '5px 12px', borderRadius: '8px',
          background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(59,130,246,0.3)',
          color: '#93C5FD', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.08em', marginBottom: '18px',
        }}>
          <Sparkles size={13} />
          {isRTL ? 'منصة إدارة وتتبع المشاريع' : 'NEXT-GEN CLIENT PORTAL'}
        </div>

        <h2 style={{
          fontSize: 'clamp(24px,2.6vw,32px)', fontWeight: 800,
          letterSpacing: '-0.03em', color: '#FFFFFF', margin: '0 0 14px',
          lineHeight: 1.25,
        }}>
          {isRTL
            ? <><span style={{ background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>منصتك التفاعلية</span><br />لإدارة ومتابعة مشاريعك</>
            : <>Your portal to<br /><span style={{ background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>premium digital work.</span></>
          }
        </h2>
        <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.75, margin: '0 0 24px' }}>
          {isRTL
            ? 'تواصل مباشر مع فريق المهندسين، تابع تسليمات المراحل لحظياً، واطلع على الفواتير في بيئة آمنة تضمن أعلى معايير الجودة.'
            : 'Direct access to engineering teams, real-time milestone tracking, and secure invoice management.'}
        </p>

        {/* Live Grid Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {[
            { num: '50+', label: isRTL ? 'مشروع' : 'Projects' },
            { num: '98%', label: isRTL ? 'رضا العملاء' : 'Satisfaction' },
            { num: '4+',  label: isRTL ? 'سنوات' : 'Years' },
            { num: '<24h', label: isRTL ? 'استجابة' : 'SLA' },
          ].map((s) => (
            <div key={s.num} style={{
              padding: '12px 10px', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '18px', fontWeight: 800, color: '#60A5FA', margin: '0 0 2px', letterSpacing: '-0.02em' }}>{s.num}</p>
              <p style={{ fontSize: '10.5px', color: '#94A3B8', margin: 0, fontWeight: 600 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Bottom Testimonial Banner */}
    <div style={{
      position: 'relative', zIndex: 10,
      padding: '16px 20px', borderRadius: '18px',
      background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      display: 'flex', alignItems: 'center', gap: '14px',
    }}>
      <div style={{
        width: '42px', height: '42px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#FFF', fontWeight: 800, fontSize: '14px', flexShrink: 0,
        boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
      }}>
        AR
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <div style={{ display: 'flex', gap: '2px' }}>
            {[1,2,3,4,5].map(i => (
              <svg key={i} width="11" height="11" viewBox="0 0 20 20" fill="#F59E0B">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span style={{ fontSize: '11.5px', color: '#E2E8F0', fontWeight: 700 }}>Ahmed Al-Rashidi</span>
        </div>
        <p style={{ fontSize: '11.5px', color: '#94A3B8', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {isRTL ? '«YANSY بنوا متجرنا بالكامل وارتفعت المبيعات 40٪ في أول 90 يوماً.»' : '“YANSY delivered our platform in 3 weeks — sales jumped 40%.”'}
        </p>
      </div>
    </div>
  </div>
);

const Login = () => {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { t }      = useTranslation();
  const { isRTL, dir } = useLanguage();
  const { isAuthenticated, loading } = useSelector((s) => s.auth);

  useSEO({ title: `${t('auth.login', 'Log In')} | YANSY TECH`, noIndex: true });

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [localError, setLocalError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [focused, setFocused]       = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const formRef    = useRef(null);

  useEffect(() => { if (isAuthenticated) navigate('/app/dashboard'); }, [isAuthenticated, navigate]);
  useEffect(() => { dispatch(clearError()); }, [dispatch]);

  const shakeForm = useCallback(() => {
    if (!formRef.current) return;
    formRef.current.style.animation = 'none';
    requestAnimationFrame(() => {
      formRef.current.style.animation = 'shake 0.4s ease';
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || loading) return;
    setLocalError('');
    if (!email.trim()) { setLocalError(t('auth.emailRequired', 'Email address is required.')); return; }
    if (!password)     { setLocalError(t('auth.passwordRequired', 'Password is required.')); return; }

    setSubmitting(true);
    const result = await dispatch(login({ email: email.trim(), password }));
    setSubmitting(false);

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

  const isDisabled = loading || submitting || googleLoading;

  const inputStyle = (name) => ({
    width: '100%',
    padding: '12px 16px',
    background: '#FFFFFF',
    border: `1.5px solid ${focused === name ? '#2563EB' : '#E2E8F0'}`,
    boxShadow: focused === name ? '0 0 0 3.5px rgba(37,99,235,0.12)' : '0 1px 2px rgba(0,0,0,0.03)',
    borderRadius: '10px',
    color: '#0F172A',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    fontFamily: isRTL ? "'IBM Plex Sans Arabic', system-ui, sans-serif" : "'Inter', system-ui, sans-serif",
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
                  aria-label={showPass ? t('auth.hidePassword', 'Hide password') : t('auth.showPassword', 'Show password')}
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
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px white inset !important;
            -webkit-text-fill-color: #0F172A !important;
        }
        .auth-3d-banner img {
            transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .auth-3d-banner:hover img {
            transform: scale(1.06) !important;
        }
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
