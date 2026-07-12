import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGoogleLogin } from '@react-oauth/google';
import { useLanguage } from '../contexts/LanguageContext';
import { register, googleLogin, clearError } from '../store/authSlice';
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react';

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
    border: '1.5px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff',
    animation: 'spin .65s linear infinite', display: 'inline-block', flexShrink: 0,
  }} />
);

const strengthScore = (pw) => {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 6)  s += 25;
  if (pw.length >= 10) s += 25;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s += 25;
  if (/[0-9]/.test(pw))         s += 15;
  if (/[^A-Za-z0-9]/.test(pw)) s += 10;
  return Math.min(s, 100);
};
const strengthMeta = (score) => {
  if (score < 30) return { label: 'Weak',   color: '#EF4444' };
  if (score < 65) return { label: 'Medium', color: '#F59E0B' };
  return              { label: 'Strong',  color: '#10B981' };
};

const BrandPanel = ({ isRTL }) => (
  <div style={{
    display: 'none', flexDirection: 'column', justifyContent: 'space-between',
    padding: '48px', background: '#F6F7F9', borderRight: '1px solid #E8EBF0',
    position: 'relative', overflow: 'hidden',
  }} className="auth-brand-panel">
    <div>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.08em', color: '#0D1117' }}>YANSY</span>
        <span style={{ display: 'block', fontSize: '10px', letterSpacing: '0.2em', color: '#6B7280', textTransform: 'uppercase', marginTop: '2px' }}>TECH</span>
      </Link>
    </div>

    <div>
      <h2 style={{
        fontSize: 'clamp(22px,2.5vw,28px)', fontWeight: 700,
        letterSpacing: '-0.025em', color: '#0D1117', margin: '0 0 14px', lineHeight: 1.15,
      }}>
        {isRTL
          ? <><span style={{ color: '#2563EB' }}>ابدأ رحلتك</span><br />الرقمية اليوم</>
          : <>Start building<br /><span style={{ color: '#2563EB' }}>your digital future.</span></>
        }
      </h2>
      <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.7, margin: '0 0 28px', maxWidth: '300px' }}>
        {isRTL
          ? 'انضم للعملاء الذين وثقوا بـ YANSY لبناء منصاتهم الرقمية.'
          : 'Join clients who trusted YANSY to build their digital platforms.'}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {[
          isRTL ? 'متابعة مشاريعك في الوقت الفعلي' : 'Real-time project tracking',
          isRTL ? 'تواصل مباشر مع الفريق'           : 'Direct team communication',
          isRTL ? 'ملفات وتقارير مشاريعك'            : 'Project files & reports',
          isRTL ? 'دعم متواصل 24/7'                   : '24/7 priority support',
        ].map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
              background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Check size={9} style={{ color: '#2563EB' }} strokeWidth={3} />
            </span>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>{f}</span>
          </div>
        ))}
      </div>
    </div>

    <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>
      {isRTL ? 'موثوق به من 50+ شركة ورائد أعمال.' : 'Trusted by 50+ businesses and founders.'}
    </p>
  </div>
);

const Register = () => {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { t }      = useTranslation();
  const { isRTL, dir } = useLanguage();
  const { isAuthenticated, loading, error } = useSelector((s) => s.auth);

  const [form, setForm] = useState({
    fullName: '', email: '', phoneNumber: '', password: '',
    brandName: '', companyName: '',
  });
  const [showPass, setShowPass]         = useState(false);
  const [localError, setLocalError]     = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [focused, setFocused]           = useState(null);

  const formRef    = useRef(null);
  const submitting = useRef(false);
  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  useEffect(() => { if (isAuthenticated) navigate('/app/dashboard'); }, [isAuthenticated, navigate]);
  useEffect(() => { dispatch(clearError()); }, [dispatch]);
  useEffect(() => { if (error) setLocalError(error); }, [error]);

  const shakeForm = useCallback(() => {
    if (!formRef.current) return;
    formRef.current.style.animation = 'none';
    requestAnimationFrame(() => { formRef.current.style.animation = 'shake 0.4s ease'; });
  }, []);

  const score = strengthScore(form.password);
  const { label: strengthLabel, color: strengthColor } = strengthMeta(score);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting.current || loading) return;
    setLocalError('');
    const { fullName, email, phoneNumber, password, brandName, companyName } = form;
    if (!fullName.trim())                              { setLocalError(t('register.fullNameRequired', 'Full name is required.')); return; }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) { setLocalError(t('auth.invalidEmail', 'Please enter a valid email address.')); return; }
    if (!phoneNumber.trim())                           { setLocalError(t('register.phoneRequired', 'Phone number is required.')); return; }
    if (!password)                                     { setLocalError(t('auth.passwordRequired', 'Password is required.')); return; }
    if (password.length < 6)                           { setLocalError(t('register.passwordMinLength', 'Password must be at least 6 characters.')); return; }
    if (!brandName.trim() && !companyName.trim())      { setLocalError(t('register.brandOrCompanyRequired', 'Please enter a brand name or company name.')); return; }

    submitting.current = true;
    const result = await dispatch(register({
      email: email.trim(), password,
      fullName: fullName.trim(), phoneNumber: phoneNumber.trim(),
      brandName: brandName.trim() || null, companyName: companyName.trim() || null,
    }));
    submitting.current = false;
    if (register.rejected.match(result)) {
      setLocalError(result.payload || t('register.registrationFailed', 'Registration failed. Please try again.'));
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

  const triggerGoogleLogin = useGoogleLogin({ onSuccess: handleGoogleSuccess, onError: handleGoogleError, flow: 'auth-code' });
  const isDisabled = loading || submitting.current || googleLoading;

  const inputStyle = (name) => ({
    width: '100%', padding: '11px 14px',
    background: '#FFFFFF', border: `1px solid ${focused === name ? '#2563EB' : '#E8EBF0'}`,
    borderRadius: '8px', color: '#0D1117', fontSize: '14px',
    outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
    fontFamily: "'Inter',system-ui,sans-serif",
  });

  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '6px', letterSpacing: '0.01em' };

  return (
    <div className="auth-root" dir={dir} style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex' }}>
      <BrandPanel isRTL={isRTL} />

      {/* Form panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: 'clamp(24px,5vw,48px)',
        background: '#FFFFFF',
        overflowY: 'auto',
      }}>
        {/* Mobile brand */}
        <div className="auth-mobile-brand" style={{ display: 'none', marginBottom: '32px', textAlign: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.08em', color: '#0D1117' }}>YANSY</span>
            <span style={{ display: 'block', fontSize: '9px', letterSpacing: '0.2em', color: '#6B7280', textTransform: 'uppercase', marginTop: '2px' }}>TECH</span>
          </Link>
        </div>

        <div ref={formRef} style={{ width: '100%', maxWidth: '440px', paddingBottom: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: 'clamp(22px,2.5vw,28px)', fontWeight: 700, color: '#0D1117', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
              {t('auth.registerTitle', 'Create your account')}
            </h1>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
              {t('register.subtitle', 'Join the client portal — free, no credit card required.')}
            </p>
          </div>

          {/* Error */}
          {localError && (
            <div role="alert" style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              padding: '12px 14px', marginBottom: '20px',
              background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px',
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
              cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.55 : 1, transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!isDisabled) { e.currentTarget.style.borderColor = '#C9CDD6'; e.currentTarget.style.background = '#F6F7F9'; }}}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8EBF0'; e.currentTarget.style.background = '#FFFFFF'; }}
            aria-label="Sign up with Google"
          >
            {googleLoading ? <Spinner size={17} /> : <GoogleIcon />}
            <span>{t('auth.continueWithGoogle', 'Continue with Google')}</span>
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: '#E8EBF0' }} />
            <span style={{ fontSize: '11px', color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
              {t('register.orSignUpWithEmail', 'or sign up with email')}
            </span>
            <div style={{ flex: 1, height: '1px', background: '#E8EBF0' }} />
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

            {/* Section: Personal info */}
            <p style={{ fontSize: '10px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 14px' }}>
              {t('register.personalInfo', 'Personal information')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label htmlFor="fullName" style={labelStyle}>{t('register.fullName', 'Full name')} *</label>
                <input id="fullName" type="text" value={form.fullName} onChange={set('fullName')} required disabled={isDisabled}
                  onFocus={() => setFocused('fullName')} onBlur={() => setFocused(null)}
                  placeholder="Your full name" style={inputStyle('fullName')} />
              </div>

              <div>
                <label htmlFor="email" style={labelStyle}>{t('auth.email', 'Email address')} *</label>
                <input id="email" type="email" value={form.email} onChange={set('email')} required disabled={isDisabled}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                  placeholder="you@example.com" style={inputStyle('email')} />
              </div>

              <div>
                <label htmlFor="phoneNumber" style={labelStyle}>{t('register.phoneNumber', 'Phone / WhatsApp')} *</label>
                <input id="phoneNumber" type="tel" value={form.phoneNumber} onChange={set('phoneNumber')} required disabled={isDisabled}
                  onFocus={() => setFocused('phoneNumber')} onBlur={() => setFocused(null)}
                  placeholder="+20 123 456 7890" style={inputStyle('phoneNumber')} />
              </div>

              <div>
                <label htmlFor="password" style={labelStyle}>{t('auth.password', 'Password')} *</label>
                <div style={{ position: 'relative' }}>
                  <input id="password" type={showPass ? 'text' : 'password'} autoComplete="new-password" required
                    value={form.password} onChange={set('password')} disabled={isDisabled}
                    onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                    placeholder="Min. 6 characters"
                    style={{ ...inputStyle('password'), paddingRight: isRTL ? '14px' : '42px', paddingLeft: isRTL ? '42px' : '14px' }} />
                  <button type="button" onClick={() => setShowPass(!showPass)} tabIndex={-1}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute', [isRTL ? 'left' : 'right']: '12px', top: '50%',
                      transform: 'translateY(-50%)', background: 'none', border: 'none',
                      cursor: 'pointer', color: '#9CA3AF', padding: 0, display: 'flex', transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#6B7280'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.password && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                      {[25, 50, 75, 100].map(t => (
                        <div key={t} style={{ flex: 1, height: '3px', borderRadius: '2px', background: score >= t ? strengthColor : '#E8EBF0', transition: 'background 0.3s' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '11px', color: strengthColor, fontWeight: 500 }}>{strengthLabel}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ flex: 1, height: '1px', background: '#E8EBF0' }} />
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                {t('register.businessInfo', 'Business info')}
              </span>
              <div style={{ flex: 1, height: '1px', background: '#E8EBF0' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div>
                <label htmlFor="brandName" style={labelStyle}>{t('register.brandName', 'Brand name')}</label>
                <input id="brandName" type="text" value={form.brandName} onChange={set('brandName')} disabled={isDisabled}
                  onFocus={() => setFocused('brandName')} onBlur={() => setFocused(null)}
                  placeholder="Your brand" style={inputStyle('brandName')} />
              </div>
              <div>
                <label htmlFor="companyName" style={labelStyle}>{t('register.companyName', 'Company name')}</label>
                <input id="companyName" type="text" value={form.companyName} onChange={set('companyName')} disabled={isDisabled}
                  onFocus={() => setFocused('companyName')} onBlur={() => setFocused(null)}
                  placeholder="Your company (if any)" style={inputStyle('companyName')} />
              </div>
              <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0, lineHeight: 1.5 }}>
                {t('register.atLeastOne', 'At least one of brand name or company name is required.')}
              </p>
            </div>

            <button
              type="submit"
              disabled={isDisabled}
              style={{
                width: '100%', padding: '12px 20px',
                background: isDisabled ? '#9CA3AF' : '#0D1117',
                border: 'none', borderRadius: '8px',
                color: '#FFFFFF', fontSize: '14px', fontWeight: 600,
                cursor: isDisabled ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
              onMouseEnter={e => { if (!isDisabled) e.currentTarget.style.background = '#1a2230'; }}
              onMouseLeave={e => { if (!isDisabled) e.currentTarget.style.background = '#0D1117'; }}
              aria-busy={loading}
            >
              {loading && !googleLoading ? (
                <><Spinner size={14} /> {t('register.creatingAccount', 'Creating account…')}</>
              ) : (
                <>{t('register.createAccount', 'Create account')} <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#9CA3AF' }}>
              <svg style={{ width: '13px', height: '13px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span style={{ fontSize: '11px' }}>{t('register.privacyNote', 'Your data is private & secure')}</span>
            </div>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
              {t('auth.hasAccount', 'Have an account?')}{' '}
              <Link to="/login" style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 500 }}
                onMouseEnter={e => { e.currentTarget.style.color = '#1D4ED8'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#2563EB'; }}
              >
                {t('auth.signIn', 'Sign in')}
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
        @media (min-width: 900px) {
          .auth-brand-panel { display: flex !important; width: 42%; }
          .auth-mobile-brand { display: none !important; }
        }
        @media (max-width: 899px) {
          .auth-mobile-brand { display: block !important; }
        }
      `}</style>
    </div>
  );
};

export default Register;
