import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGoogleLogin } from '@react-oauth/google';
import { useLanguage } from '../contexts/LanguageContext';
import { login, googleLogin, clearError } from '../store/authSlice';
import { gsap } from 'gsap';

/* ─── Icons ───────────────────────────────────────────────────────────────── */
const EyeOpen = () => (
  <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const EyeOff = () => (
  <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const Spinner = ({ size = 14, color = 'currentColor' }) => (
  <span style={{
    width: size, height: size, borderRadius: '50%',
    border: `1.5px solid rgba(0,0,0,0.15)`,
    borderTopColor: color,
    animation: 'spin .65s linear infinite',
    display: 'inline-block', flexShrink: 0,
  }} />
);

/* ─── Brand panel ─────────────────────────────────────────────────────────── */
const BrandPanel = ({ isRTL }) => (
  <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 xl:p-16 overflow-hidden bg-black">
    {/* Ambient glows */}
    <div style={{ position:'absolute', top:'-20%', left:'-10%', width:'60%', height:'60%', borderRadius:'50%', background:'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)', filter:'blur(60px)', pointerEvents:'none' }} />
    <div style={{ position:'absolute', bottom:'10%', right:'-10%', width:'50%', height:'50%', borderRadius:'50%', background:'radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%)', filter:'blur(80px)', pointerEvents:'none' }} />
    {/* Grid texture */}
    <div style={{ position:'absolute', inset:0, opacity:0.018, backgroundImage:'linear-gradient(#d4af37 1px,transparent 1px),linear-gradient(90deg,#d4af37 1px,transparent 1px)', backgroundSize:'64px 64px', pointerEvents:'none' }} />

    <div className="relative z-10">
      <Link to="/" className="inline-block group">
        <span className="text-3xl xl:text-4xl font-bold text-white" style={{ letterSpacing: '-0.03em' }}>YANSY</span>
        <span className="block text-xs tracking-[0.3em] text-[#d4af37]/50 uppercase mt-1">TECH</span>
      </Link>
    </div>

    <div className="relative z-10 space-y-6">
      <h2 className="text-2xl xl:text-3xl font-semibold leading-[1.15] text-white" style={{ letterSpacing: '-0.02em' }}>
        {isRTL
          ? <> منصتك لإدارة<br /><span className="text-[#d4af37]">مشاريعك الرقمية</span></>
          : <>Your portal to<br /><span className="text-[#d4af37]">premium digital work.</span></>}
      </h2>
      <p className="text-sm font-light text-white/40 leading-relaxed max-w-xs">
        {isRTL
          ? 'تابع مشاريعك، تواصل مع فريقنا، وتحقق من تقدم عملك في مكان واحد.'
          : 'Track your projects, communicate with our team, and monitor progress — all in one place.'}
      </p>
    </div>

    <div className="relative z-10 grid grid-cols-2 gap-6">
      {[
        { num: '50+', label: isRTL ? 'مشروع مُسلَّم' : 'Projects delivered' },
        { num: '98%', label: isRTL ? 'رضا العملاء'   : 'Client satisfaction' },
        { num: '4+',  label: isRTL ? 'سنوات خبرة'    : 'Years of expertise'  },
        { num: '24h', label: isRTL ? 'دعم متواصل'     : 'Response guarantee'  },
      ].map((s) => (
        <div key={s.num}>
          <p className="text-xl font-bold text-[#d4af37]" style={{ letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>{s.num}</p>
          <p className="text-xs font-normal text-white/50 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>

    {/* Right border gradient */}
    <div style={{ position:'absolute', top:0, right:0, width:1, height:'100%', background:'linear-gradient(to bottom, transparent, rgba(212,175,55,0.15) 30%, rgba(212,175,55,0.15) 70%, transparent)' }} />
  </div>
);

/* ─── Divider ─────────────────────────────────────────────────────────────── */
const OrDivider = ({ label = 'or' }) => (
  <div className="flex items-center gap-3">
    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
    <span className="text-[10px] tracking-[0.2em] uppercase font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>
      {label}
    </span>
    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
  </div>
);

/* ─── Google button ───────────────────────────────────────────────────────── */
const GoogleButton = ({ onClick, loading, text, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled || loading}
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      padding: '13px 20px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      color: 'rgba(255,255,255,0.8)',
      fontSize: 13,
      fontWeight: 400,
      letterSpacing: '0.01em',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      opacity: disabled || loading ? 0.45 : 1,
      transition: 'background 0.2s, border-color 0.2s',
      outline: 'none',
    }}
    onMouseEnter={(e) => {
      if (!disabled && !loading) {
        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
      }
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
    }}
    aria-label="Sign in with Google"
  >
    {loading
      ? <Spinner size={16} color="#d4af37" />
      : <GoogleIcon />
    }
    <span>{text}</span>
  </button>
);

/* ─── Main component ──────────────────────────────────────────────────────── */
const Login = () => {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { t }      = useTranslation();
  const { isRTL, dir } = useLanguage();
  const { isAuthenticated, loading, error } = useSelector((s) => s.auth);

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

  /* Entrance animation */
  useEffect(() => {
    if (!formRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        formRef.current.children,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out', delay: 0.1 }
      );
    }, formRef);
    return () => ctx.revert();
  }, []);

  /* Shake form on error */
  const shakeForm = useCallback(() => {
    if (!formRef.current) return;
    gsap.to(formRef.current, {
      keyframes: { x: [-8, 8, -6, 6, -3, 3, 0] },
      duration: 0.45, ease: 'power2.out',
    });
  }, []);

  /* ── Email / password submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting.current || loading) return;

    setLocalError('');

    if (!email.trim()) {
      setLocalError(t('auth.emailRequired', 'Email address is required.'));
      return;
    }
    if (!password) {
      setLocalError(t('auth.passwordRequired', 'Password is required.'));
      return;
    }

    submitting.current = true;
    const result = await dispatch(login({ email: email.trim(), password }));
    submitting.current = false;

    if (login.rejected.match(result)) {
      const msg = result.payload || t('auth.loginFailed', 'Login failed. Please try again.');
      setLocalError(msg);
      shakeForm();
    }
  };

  /* ── Google login ── */
  const handleGoogleSuccess = useCallback(async (codeResponse) => {
    setLocalError('');
    setGoogleLoading(true);
    const result = await dispatch(googleLogin({ code: codeResponse.code }));
    setGoogleLoading(false);

    if (googleLogin.rejected.match(result)) {
      const msg = result.payload || t('auth.googleFailed', 'Google sign-in failed. Please try again.');
      setLocalError(msg);
      shakeForm();
    }
  }, [dispatch, t, shakeForm]);

  const handleGoogleError = useCallback(() => {
    setGoogleLoading(false);
    setLocalError(t('auth.googleCancelled', 'Google sign-in was cancelled or failed. Please try again.'));
  }, [t]);

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError:   handleGoogleError,
    flow:      'auth-code',
  });

  const isDisabled = loading || submitting.current || googleLoading;

  const fieldClass = (name) => [
    'w-full bg-transparent border-0 border-b text-white font-light text-base py-3.5',
    'placeholder-white/20 focus:outline-none transition-colors duration-300',
    focused === name ? 'border-[#d4af37]' : 'border-white/10',
  ].join(' ');

  const labelClass = (name) => [
    'block text-[10px] tracking-[0.2em] uppercase font-medium transition-colors duration-300',
    focused === name ? 'text-[#d4af37]' : 'text-white/35',
  ].join(' ');

  return (
    <div className="min-h-screen bg-[#050505] text-white flex" dir={dir}>
      <BrandPanel isRTL={isRTL} />

      {/* ── Right: form panel ─────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-16 relative">

        {/* Mobile-only brand */}
        <div className="lg:hidden mb-12">
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="text-xl font-bold text-white" style={{ letterSpacing: '-0.025em' }}>YANSY</span>
            <span className="text-[10px] tracking-[0.3em] text-[#d4af37]/60 uppercase">TECH</span>
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto lg:mx-0">
          {/* Heading */}
          <div className="mb-10">
            <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
              {t('auth.welcomeBack', 'Welcome back')}
            </h1>
            <p className="text-sm font-normal text-white/45">
              {t('auth.signInContinue', 'Sign in to your client portal')}
            </p>
          </div>

          <div ref={formRef} className="space-y-5">

            {/* ── Error banner ── */}
            {localError && (
              <div
                role="alert"
                className="flex items-start gap-3 px-4 py-3.5 rounded-sm"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-400/90 font-light leading-relaxed">{localError}</p>
              </div>
            )}

            {/* ── Google sign-in ── */}
            <GoogleButton
              onClick={() => triggerGoogleLogin()}
              loading={googleLoading}
              disabled={isDisabled && !googleLoading}
              text={t('auth.continueWithGoogle', 'Continue with Google')}
            />

            {/* ── Divider ── */}
            <OrDivider label={t('common.or', 'or')} />

            {/* ── Email/password form ── */}
            <form onSubmit={handleSubmit} noValidate className="space-y-7">
              {/* Email */}
              <div>
                <label htmlFor="email" className={labelClass('email')}>{t('auth.email', 'Email address')}</label>
                <input
                  id="email" type="email" autoComplete="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                  disabled={isDisabled}
                  placeholder="you@example.com"
                  className={fieldClass('email')}
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className={labelClass('password')}>{t('auth.password', 'Password')}</label>
                <div className="relative">
                  <input
                    id="password" type={showPass ? 'text' : 'password'}
                    autoComplete="current-password" required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                    disabled={isDisabled}
                    placeholder="••••••••"
                    className={`${fieldClass('password')} ${isRTL ? 'pl-10' : 'pr-10'}`}
                  />
                  <button
                    type="button" onClick={() => setShowPass(!showPass)}
                    className={`absolute ${isRTL ? 'left-0' : 'right-0'} bottom-3 text-white/25 hover:text-[#d4af37] transition-colors duration-200`}
                    tabIndex={-1}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
              </div>

              {/* Forgot password link */}
              <div className="flex justify-end -mt-3">
                <Link
                  to="/forgot-password"
                  className="text-xs transition-colors duration-200"
                  style={{ color: 'rgba(212,175,55,0.55)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#d4af37'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(212,175,55,0.55)'}
                >
                  {t('auth.forgotPassword', 'Forgot password?')}
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isDisabled}
                className="w-full py-4 bg-[#d4af37] text-black text-xs font-medium tracking-[0.15em] uppercase transition-all duration-300 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden"
                aria-busy={loading}
              >
                {loading && !googleLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner size={13} color="#000" />
                    {t('auth.signingIn', 'Signing in…')}
                  </span>
                ) : t('auth.signIn', 'Sign in')}
              </button>
            </form>

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-white/25">
                {t('auth.noAccount', 'No account?')}{' '}
                <Link to="/register" className="text-[#d4af37] hover:text-white transition-colors duration-200 underline underline-offset-4">
                  {t('auth.createAccount', 'Register')}
                </Link>
              </p>
              <Link to="/" className="text-xs text-white/20 hover:text-white/50 transition-colors duration-200">
                ← {t('common.backHome', 'Home')}
              </Link>
            </div>
          </div>

          {/* Trust signals */}
          <div className="mt-14 pt-7 border-t border-white/[0.05]">
            <div className="flex items-center gap-5">
              {[
                { icon: '🔒', text: isRTL ? 'اتصال آمن' : 'Secure connection' },
                { icon: '🛡️', text: isRTL ? 'بياناتك محمية' : 'Data protected' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-1.5">
                  <span style={{ fontSize: 11 }}>{item.icon}</span>
                  <span className="text-[10px] text-white/18 tracking-wide">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Login;
