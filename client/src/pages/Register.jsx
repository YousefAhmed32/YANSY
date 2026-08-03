import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGoogleLogin } from '@react-oauth/google';
import { useLanguage } from '../contexts/LanguageContext';
import { useSEO } from '../hooks/useSEO';
import { register, googleLogin, clearError } from '../store/authSlice';
import { trackCompleteRegistration } from '../utils/metaPixel';
import { Eye, EyeOff, ArrowRight, Check, AlertCircle, MessageCircle, Sparkles } from 'lucide-react';
import { validatePhone } from '../utils/phone';

const WHATSAPP_NUMBER = '201090385390';

const PHONE_ERROR_COPY = {
  empty:         { key: 'register.phoneNumberErrorEmpty', fallback: 'Please enter a phone number so we can reach you.' },
  invalid_chars: { key: 'register.phoneNumberErrorChars',  fallback: 'That number has letters or symbols in it — keep only digits, spaces, dashes, or a leading +.' },
  too_short:     { key: 'register.phoneNumberErrorShort',  fallback: 'That number looks too short — double-check the digits.' },
  too_long:      { key: 'register.phoneNumberErrorLong',   fallback: 'That number looks too long — check for extra digits.' },
};

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
          {isRTL ? 'حساب عميل مؤمّن ومستقل' : 'Secure Dedicated Client Portal'}
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
          {isRTL ? 'إنشاء حساب جديد' : 'CREATE CLIENT ACCOUNT'}
        </div>

        <h2 style={{
          fontSize: 'clamp(24px,2.6vw,32px)', fontWeight: 800,
          letterSpacing: '-0.03em', color: '#FFFFFF', margin: '0 0 14px',
          lineHeight: 1.25,
        }}>
          {isRTL
            ? <><span style={{ background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ابدأ رحلتك الرقمية</span><br />اليوم مع فريق يانسي تك</>
            : <>Start building<br /><span style={{ background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>your digital future.</span></>
          }
        </h2>
        <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.75, margin: '0 0 24px' }}>
          {isRTL
            ? 'انضم لأكثر من 50+ شركة ورائد أعمال وثقوا بـ YANSY لتطوير منتجاتهم الرقمية وإدارتها باحترافية.'
            : 'Join 50+ founders and business leaders who trust YANSY TECH to engineer their digital products.'}
        </p>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            isRTL ? 'متابعة مشاريعك وتطور العمل لحظة بلحظة' : 'Real-time project tracking & milestones',
            isRTL ? 'تواصل مباشر ومشفّر مع مهندسي التطوير' : 'Direct communication with lead engineers',
            isRTL ? 'مساحة خاصة للمستندات والتقارير والفواتير' : 'Dedicated vault for project files & invoices',
            isRTL ? 'دعم فني استباقي وأولوية فائقة'           : '24/7 priority support & SLA guarantees',
          ].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                background: 'rgba(37,99,235,0.25)', border: '1px solid rgba(59,130,246,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Check size={10} style={{ color: '#60A5FA' }} strokeWidth={3} />
              </span>
              <span style={{ fontSize: '13px', color: '#CBD5E1', fontWeight: 500 }}>{f}</span>
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
        SM
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
          <span style={{ fontSize: '11.5px', color: '#E2E8F0', fontWeight: 700 }}>Sarah Mohamed</span>
        </div>
        <p style={{ fontSize: '11.5px', color: '#94A3B8', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {isRTL ? '«تسليم استثنائي في الموعد المظبوط وبأعلى جودة برمجية.»' : '“Outstanding delivery — clinic booking app launch was flawless.”'}
        </p>
      </div>
    </div>
  </div>
);

const Register = () => {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { t }      = useTranslation();
  const { isRTL, dir } = useLanguage();
  const { isAuthenticated, loading } = useSelector((s) => s.auth);

  useSEO({
    title: isRTL ? 'إنشاء حساب | يانسي تك' : 'Create Account | YANSY TECH',
    description: isRTL
      ? 'أنشئ حسابك في بوابة عملاء يانسي تك لمتابعة مشروعك، والفواتير، والتواصل مع فريقك مباشرة.'
      : 'Create your YANSY TECH client portal account to track your project, invoices, and message your team directly.',
    canonical: 'https://yansytech.com/register',
  });

  const [form, setForm] = useState({
    fullName: '', email: '', phoneNumber: '', password: '',
    brandName: '', companyName: '',
  });
  const [showPass, setShowPass]         = useState(false);
  const [localError, setLocalError]     = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [focused, setFocused]           = useState(null);
  const [fieldErrors, setFieldErrors]   = useState({});
  const [phoneAttempts, setPhoneAttempts] = useState(0);
  const [phoneBypass, setPhoneBypass]     = useState(false);

  const formRef    = useRef(null);
  const submitting = useRef(false);
  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));
  const setPhone = (e) => {
    setForm(p => ({ ...p, phoneNumber: e.target.value }));
    setFieldErrors(p => ({ ...p, phoneNumber: undefined }));
    setPhoneBypass(false);
  };

  const whatsappFallbackUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    isRTL ? 'مرحباً، أواجه مشكلة في إدخال رقم هاتفي أثناء التسجيل. هل يمكنكم مساعدتي؟'
          : "Hi, I'm having trouble entering my phone number while signing up. Can you help?"
  )}`;

  useEffect(() => { if (isAuthenticated) navigate('/app/dashboard'); }, [isAuthenticated, navigate]);
  useEffect(() => { dispatch(clearError()); }, [dispatch]);

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
    setFieldErrors(p => ({ ...p, phoneNumber: undefined }));
    const { fullName, email, phoneNumber, password, brandName, companyName } = form;
    if (!fullName.trim())                              { setLocalError(t('register.fullNameRequired', 'Full name is required.')); return; }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) { setLocalError(t('auth.invalidEmail', 'Please enter a valid email address.')); return; }

    if (!phoneBypass) {
      const phoneCheck = validatePhone(phoneNumber);
      if (!phoneCheck.valid) {
        const copy = PHONE_ERROR_COPY[phoneCheck.reason] || PHONE_ERROR_COPY.empty;
        setFieldErrors(p => ({ ...p, phoneNumber: t(copy.key, copy.fallback) }));
        setPhoneAttempts(a => a + 1);
        shakeForm();
        return;
      }
    }

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
    } else {
      trackCompleteRegistration({ method: 'email' });
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
  const isDisabled = loading || googleLoading;

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
                  placeholder={t('register.fullNamePlaceholder', 'Your full name')} style={inputStyle('fullName')} />
              </div>

              <div>
                <label htmlFor="email" style={labelStyle}>{t('auth.email', 'Email address')} *</label>
                <input id="email" type="email" value={form.email} onChange={set('email')} required disabled={isDisabled}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                  placeholder={t('auth.emailPlaceholder', 'you@example.com')} style={inputStyle('email')} />
              </div>

              <div>
                <label htmlFor="phoneNumber" style={labelStyle}>{t('register.phoneNumber', 'Phone / WhatsApp')} *</label>
                <input id="phoneNumber" type="tel" value={form.phoneNumber} onChange={setPhone} required disabled={isDisabled}
                  onFocus={() => setFocused('phoneNumber')} onBlur={() => setFocused(null)}
                  aria-invalid={!!fieldErrors.phoneNumber}
                  placeholder={t('register.phoneNumberPlaceholder', '+20 123 456 7890')}
                  style={{
                    ...inputStyle('phoneNumber'),
                    border: `1px solid ${fieldErrors.phoneNumber ? '#EF4444' : (focused === 'phoneNumber' ? '#2563EB' : '#E8EBF0')}`,
                  }} />
                {fieldErrors.phoneNumber && (
                  <p role="alert" style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: '#DC2626', margin: '6px 0 0', lineHeight: 1.5 }}>
                    <AlertCircle style={{ width: '13px', height: '13px', flexShrink: 0, marginTop: '1px' }} />
                    {fieldErrors.phoneNumber}
                  </p>
                )}
                {phoneAttempts >= 2 && !phoneBypass && (
                  <div style={{
                    marginTop: '10px', padding: '12px 14px', borderRadius: '10px',
                    background: '#F6F7F9', border: '1px solid #E8EBF0',
                  }}>
                    <p style={{ fontSize: '12px', color: '#374151', margin: '0 0 8px', fontWeight: 500 }}>
                      {isRTL ? 'ما زال الرقم مرفوضاً؟ يمكنك المتابعة بطريقة أخرى:' : "Still not working? Here's another way forward:"}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <button type="button"
                        onClick={() => { setPhoneBypass(true); setFieldErrors(p => ({ ...p, phoneNumber: undefined })); }}
                        style={{
                          padding: '7px 12px', borderRadius: '7px', border: '1px solid #C9CDD6',
                          background: '#FFFFFF', color: '#0D1117', fontSize: '12px', fontWeight: 500,
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}>
                        {isRTL ? 'المتابعة بهذا الرقم' : 'Continue with this number'}
                      </button>
                      <a href={whatsappFallbackUrl} target="_blank" rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '7px 12px', borderRadius: '7px', border: '1px solid rgba(37,211,102,0.3)',
                          background: 'rgba(37,211,102,0.06)', color: '#16a34a', fontSize: '12px', fontWeight: 500,
                          textDecoration: 'none',
                        }}>
                        <MessageCircle style={{ width: '13px', height: '13px' }} />
                        {isRTL ? 'راسلنا على واتساب' : 'Message us on WhatsApp'}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="password" style={labelStyle}>{t('auth.password', 'Password')} *</label>
                <div style={{ position: 'relative' }}>
                  <input id="password" type={showPass ? 'text' : 'password'} autoComplete="new-password" required
                    value={form.password} onChange={set('password')} disabled={isDisabled}
                    onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                    placeholder={t('register.passwordPlaceholder', 'Min. 6 characters')}
                    style={{ ...inputStyle('password'), paddingRight: isRTL ? '14px' : '42px', paddingLeft: isRTL ? '42px' : '14px' }} />
                  <button type="button" onClick={() => setShowPass(!showPass)} tabIndex={-1}
                    aria-label={showPass ? t('auth.hidePassword', 'Hide password') : t('auth.showPassword', 'Show password')}
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
                  placeholder={t('register.brandNamePlaceholder', 'Your brand')} style={inputStyle('brandName')} />
              </div>
              <div>
                <label htmlFor="companyName" style={labelStyle}>{t('register.companyName', 'Company name')}</label>
                <input id="companyName" type="text" value={form.companyName} onChange={set('companyName')} disabled={isDisabled}
                  onFocus={() => setFocused('companyName')} onBlur={() => setFocused(null)}
                  placeholder={t('register.companyNamePlaceholder', 'Your company (if any)')} style={inputStyle('companyName')} />
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

export default Register;
