import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGoogleLogin } from '@react-oauth/google';
import { useLanguage } from '../contexts/LanguageContext';
import { register, googleLogin, clearError } from '../store/authSlice';
import { gsap } from 'gsap';

/* ─── Field ───────────────────────────────────────────────────────────────── */
const Field = ({
  id, label, type = 'text', value, onChange,
  onFocus, onBlur, focused, placeholder, disabled, required, suffix,
}) => {
  const isActive = focused === id;
  return (
    <div>
      <label
        htmlFor={id}
        className={[
          'block text-[10px] tracking-[0.2em] uppercase font-medium transition-colors duration-300',
          isActive ? 'text-[#d4af37]' : 'text-white/35',
        ].join(' ')}
      >
        {label}{required && ' *'}
      </label>
      <div className="relative">
        <input
          id={id} type={type} value={value} required={required}
          onChange={onChange}
          onFocus={() => onFocus(id)}
          onBlur={() => onBlur(id)}
          disabled={disabled}
          placeholder={placeholder}
          className={[
            'w-full bg-transparent border-0 border-b text-white font-light text-base py-3.5',
            'placeholder-white/20 focus:outline-none transition-colors duration-300',
            suffix ? 'pr-10' : '',
            isActive ? 'border-[#d4af37]' : 'border-white/10',
          ].join(' ')}
        />
        {suffix && (
          <div className="absolute right-0 bottom-3 text-white/25">{suffix}</div>
        )}
      </div>
    </div>
  );
};

/* ─── Password strength ───────────────────────────────────────────────────── */
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
  if (score < 30) return { label: 'Weak',   color: '#ef4444' };
  if (score < 65) return { label: 'Medium', color: '#f59e0b' };
  return              { label: 'Strong',  color: '#22c55e' };
};

/* ─── Icons ───────────────────────────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const Spinner = ({ size = 14, color = '#000' }) => (
  <span style={{
    width: size, height: size, borderRadius: '50%',
    border: `1.5px solid rgba(0,0,0,0.15)`,
    borderTopColor: color,
    animation: 'spin .65s linear infinite',
    display: 'inline-block', flexShrink: 0,
  }} />
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
    aria-label="Sign up with Google"
  >
    {loading
      ? <Spinner size={16} color="#d4af37" />
      : <GoogleIcon />
    }
    <span>{text}</span>
  </button>
);

/* ─── Divider ─────────────────────────────────────────────────────────────── */
const OrDivider = ({ label = 'or sign up with email' }) => (
  <div className="flex items-center gap-3">
    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
    <span className="text-[10px] tracking-[0.15em] uppercase font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>
      {label}
    </span>
    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
  </div>
);

/* ─── Brand panel ─────────────────────────────────────────────────────────── */
const BrandPanel = ({ isRTL }) => (
  <div className="hidden lg:flex lg:w-[42%] relative flex-col justify-between p-12 xl:p-16 overflow-hidden bg-black">
    <div style={{ position:'absolute', top:'-15%', right:'-5%', width:'55%', height:'55%', borderRadius:'50%', background:'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)', filter:'blur(60px)', pointerEvents:'none' }} />
    <div style={{ position:'absolute', bottom:'5%', left:'-10%', width:'50%', height:'40%', borderRadius:'50%', background:'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)', filter:'blur(80px)', pointerEvents:'none' }} />
    <div style={{ position:'absolute', inset:0, opacity:0.016, backgroundImage:'linear-gradient(#d4af37 1px,transparent 1px),linear-gradient(90deg,#d4af37 1px,transparent 1px)', backgroundSize:'64px 64px', pointerEvents:'none' }} />

    <div className="relative z-10">
      <Link to="/">
        <span className="text-3xl xl:text-4xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>YANSY</span>
        <span className="block text-xs tracking-[0.3em] text-[#d4af37]/50 uppercase mt-1">TECH</span>
      </Link>
    </div>

    <div className="relative z-10 space-y-5">
      <h2 className="text-2xl xl:text-3xl font-semibold leading-[1.15] text-white" style={{ letterSpacing: '-0.02em' }}>
        {isRTL
          ? <><span className="text-[#d4af37]">ابدأ رحلتك</span><br />الرقمية اليوم</>
          : <>Start building<br /><span className="text-[#d4af37]">your digital future.</span></>}
      </h2>
      <p className="text-sm font-normal text-white/55 leading-relaxed max-w-xs">
        {isRTL
          ? 'انضم للعملاء الذين وثقوا بـ YANSY لبناء منصاتهم الرقمية.'
          : 'Join clients who trusted YANSY to build their digital platforms and grow their business.'}
      </p>

      <div className="space-y-3 pt-2">
        {[
          isRTL ? 'متابعة مشاريعك في الوقت الفعلي' : 'Real-time project tracking',
          isRTL ? 'تواصل مباشر مع الفريق'           : 'Direct team communication',
          isRTL ? 'ملفات وتقارير مشاريعك'            : 'Project files & reports',
          isRTL ? 'دعم متواصل 24/7'                   : '24/7 priority support',
        ].map((f) => (
          <div key={f} className="flex items-center gap-3">
            <span style={{ width:16, height:16, borderRadius:'50%', background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="8" height="8" fill="none" viewBox="0 0 24 24" stroke="#d4af37" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </span>
            <span className="text-xs font-light text-white/45">{f}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="relative z-10">
      <p className="text-[11px] text-white/20 tracking-wide">
        {isRTL ? 'موثوق به من قِبل أكثر من 50 شركة ورائد أعمال.' : 'Trusted by 50+ businesses and founders.'}
      </p>
    </div>

    <div style={{ position:'absolute', top:0, right:0, width:1, height:'100%', background:'linear-gradient(to bottom, transparent, rgba(212,175,55,0.15) 30%, rgba(212,175,55,0.15) 70%, transparent)' }} />
  </div>
);

/* ─── Main component ──────────────────────────────────────────────────────── */
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

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  useEffect(() => { if (isAuthenticated) navigate('/app/dashboard'); }, [isAuthenticated, navigate]);
  useEffect(() => { dispatch(clearError()); }, [dispatch]);
  useEffect(() => { if (error) setLocalError(error); }, [error]);

  /* Entrance animation */
  useEffect(() => {
    if (!formRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        formRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out', delay: 0.1 }
      );
    }, formRef);
    return () => ctx.revert();
  }, []);

  const shakeForm = useCallback(() => {
    if (!formRef.current) return;
    gsap.to(formRef.current, {
      keyframes: { x: [-8, 8, -6, 6, 0] },
      duration: 0.4, ease: 'power2.out',
    });
  }, []);

  const score = strengthScore(form.password);
  const { label: strengthLabel, color: strengthColor } = strengthMeta(score);

  /* ── Email / password submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting.current || loading) return;
    setLocalError('');

    const { fullName, email, phoneNumber, password, brandName, companyName } = form;

    if (!fullName.trim()) {
      setLocalError(t('register.fullNameRequired', 'Full name is required.'));
      return;
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setLocalError(t('auth.invalidEmail', 'Please enter a valid email address.'));
      return;
    }
    if (!phoneNumber.trim()) {
      setLocalError(t('register.phoneRequired', 'Phone number is required.'));
      return;
    }
    if (!password) {
      setLocalError(t('auth.passwordRequired', 'Password is required.'));
      return;
    }
    if (password.length < 6) {
      setLocalError(t('register.passwordMinLength', 'Password must be at least 6 characters.'));
      return;
    }
    if (!brandName.trim() && !companyName.trim()) {
      setLocalError(t('register.brandOrCompanyRequired', 'Please enter a brand name or company name.'));
      return;
    }

    submitting.current = true;
    const result = await dispatch(register({
      email:       email.trim(),
      password,
      fullName:    fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      brandName:   brandName.trim()   || null,
      companyName: companyName.trim() || null,
    }));
    submitting.current = false;

    if (register.rejected.match(result)) {
      const msg = result.payload || t('register.registrationFailed', 'Registration failed. Please try again.');
      setLocalError(msg);
      shakeForm();
    }
  };

  /* ── Google sign-up ── */
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

  const fp = {
    focused,
    onFocus: setFocused,
    onBlur:  () => setFocused(null),
    disabled: isDisabled,
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex" dir={dir}>
      <BrandPanel isRTL={isRTL} />

      {/* ── Right: form panel ─────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-14 xl:px-20 py-12 overflow-y-auto">

        {/* Mobile brand */}
        <div className="lg:hidden mb-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="text-2xl font-light text-white" style={{ letterSpacing: '-0.02em' }}>YANSY</span>
            <span className="text-[10px] tracking-[0.3em] text-[#d4af37]/60 uppercase">TECH</span>
          </Link>
        </div>

        <div className="w-full max-w-lg mx-auto lg:mx-0">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-light text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
              {t('auth.registerTitle', 'Create your account')}
            </h1>
            <p className="text-sm font-light text-white/40">
              {t('register.subtitle', 'Join the client portal — free, no credit card required.')}
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

            {/* ── Google sign-up ── */}
            <GoogleButton
              onClick={() => triggerGoogleLogin()}
              loading={googleLoading}
              disabled={isDisabled && !googleLoading}
              text={t('auth.continueWithGoogle', 'Continue with Google')}
            />

            {/* ── Divider ── */}
            <OrDivider label={t('register.orSignUpWithEmail', 'or sign up with email')} />

            {/* ── Email / password form ── */}
            <form onSubmit={handleSubmit} noValidate className="space-y-6">

              {/* Personal info */}
              <div>
                <p className="text-[10px] tracking-[0.25em] uppercase text-white/25 mb-5">
                  {t('register.personalInfo', 'Personal information')}
                </p>
                <div className="space-y-6">
                  <Field id="fullName"    label={t('register.fullName',    'Full name')}        value={form.fullName}    onChange={set('fullName')}    placeholder="Your full name"     required {...fp} />
                  <Field id="email"       label={t('auth.email',           'Email address')}     type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required {...fp} />
                  <Field id="phoneNumber" label={t('register.phoneNumber', 'Phone / WhatsApp')} type="tel"  value={form.phoneNumber} onChange={set('phoneNumber')} placeholder="+20 123 456 7890" required {...fp} />

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className={[
                        'block text-[10px] tracking-[0.2em] uppercase font-medium transition-colors duration-300',
                        focused === 'password' ? 'text-[#d4af37]' : 'text-white/35',
                      ].join(' ')}
                    >
                      {t('auth.password', 'Password')} *
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPass ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={form.password}
                        onChange={set('password')}
                        onFocus={() => setFocused('password')}
                        onBlur={() => setFocused(null)}
                        disabled={isDisabled}
                        placeholder="Min. 6 characters"
                        className={[
                          'w-full bg-transparent border-0 border-b text-white font-light text-base py-3.5 pr-10',
                          'placeholder-white/20 focus:outline-none transition-colors duration-300',
                          focused === 'password' ? 'border-[#d4af37]' : 'border-white/10',
                        ].join(' ')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        tabIndex={-1}
                        aria-label={showPass ? 'Hide password' : 'Show password'}
                        className={`absolute ${isRTL ? 'left-0' : 'right-0'} bottom-3 text-white/25 hover:text-[#d4af37] transition-colors duration-200`}
                      >
                        {showPass
                          ? <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                          : <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        }
                      </button>
                    </div>

                    {/* Password strength */}
                    {form.password && (
                      <div className="mt-2.5 space-y-1.5">
                        <div className="flex gap-1">
                          {[25, 50, 75, 100].map((threshold) => (
                            <div key={threshold} className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/[0.08]">
                              <div
                                className="h-full transition-all duration-500"
                                style={{ width: score >= threshold ? '100%' : '0%', backgroundColor: strengthColor }}
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] tracking-wide" style={{ color: strengthColor }}>{strengthLabel}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <p className="text-[10px] tracking-[0.25em] uppercase text-white/20">
                  {t('register.businessInfo', 'Business info')}
                </p>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              {/* Business info */}
              <div className="space-y-6">
                <Field id="brandName"   label={t('register.brandName',   'Brand name')}   value={form.brandName}   onChange={set('brandName')}   placeholder="Your brand"            {...fp} />
                <Field id="companyName" label={t('register.companyName', 'Company name')} value={form.companyName} onChange={set('companyName')} placeholder="Your company (if any)" {...fp} />
                <p className="text-[10px] text-white/25 -mt-2">
                  {t('register.atLeastOne', 'At least one of brand name or company name is required.')}
                </p>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isDisabled}
                  className="w-full py-4 bg-[#d4af37] text-black text-xs font-medium tracking-[0.15em] uppercase transition-all duration-300 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-busy={loading}
                >
                  {loading && !googleLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner size={13} color="#000" />
                      {t('register.creatingAccount', 'Creating account…')}
                    </span>
                  ) : t('register.createAccount', 'Create account')}
                </button>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-[10px] tracking-wide">
                    {t('register.privacyNote', 'Your data is private & secure')}
                  </span>
                </div>
                <p className="text-xs text-white/25">
                  {t('auth.hasAccount', 'Have an account?')}{' '}
                  <Link to="/login" className="text-[#d4af37] hover:text-white transition-colors duration-200 underline underline-offset-4">
                    {t('auth.signIn', 'Sign in')}
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Register;
