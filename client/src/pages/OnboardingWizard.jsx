import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, CheckCircle2, BadgeCheck } from 'lucide-react';
import api from '../utils/api';
import { getMe } from '../store/authSlice';
import { useLanguage } from '../contexts/LanguageContext';
import { validatePhone } from '../utils/phone';

/* ═══════════════════════════════════════════════════════════════
   Activation flow — replaces the old 4-step "ceremonial" wizard.

   Design rules:
   - Never ask for something we already know (email is shown as
     verified, not requested; phone/company/role are prefilled and
     the step is skipped entirely if nothing is missing).
   - Stable enum keys are persisted, never translated display labels.
   - Step count is derived once and reused everywhere (badge, dots,
     "n / total") so it can never drift out of sync.
   - Resumable: current step + in-progress answers survive a refresh
     via sessionStorage, keyed to the signed-in user.
   - No fabricated promises (named account manager, "within 2 hours",
     progress tracking) — only what the system actually does.
   ═══════════════════════════════════════════════════════════════ */

const PHONE_HINT_COPY = {
  invalid_chars: { en: "That doesn't look like a phone number — keep only digits, spaces, dashes, or a leading +.", ar: 'هذا لا يبدو رقم هاتف صحيح — استخدم الأرقام والمسافات والشرطات وعلامة + فقط.' },
  too_short:     { en: 'That looks a little short — double-check the digits.', ar: 'يبدو الرقم قصيراً بعض الشيء — تأكد من الأرقام.' },
  too_long:      { en: 'That looks a little long — check for extra digits.', ar: 'يبدو الرقم طويلاً بعض الشيء — تحقق من وجود أرقام زائدة.' },
  maybe_missing_country_code: { en: "Looks like a local number — you can add a country code (e.g. +20) so we're sure to reach you, or continue as-is.", ar: 'يبدو رقماً محلياً — يمكنك إضافة رمز الدولة (مثل +20) لضمان التواصل، أو المتابعة كما هو.' },
};

const TK = {
  bg:      '#F6F7F9',
  surface: '#FFFFFF',
  border:  '#E8EBF0',
  accent:  '#2563EB',
  accentBg:'rgba(37,99,235,0.06)',
  text:    '#0D1117',
  textMuted:'#6B7280',
  textLight:'#9CA3AF',
};

// Stable enum keys — mirror server/models/User.js `primaryGoal` enum.
// Never store the localized label; only ever store `.value`.
const GOALS = [
  { value: 'website',    icon: '🌐', en: 'Website',         ar: 'موقع إلكتروني' },
  { value: 'ecommerce',  icon: '🛒', en: 'Online Store',    ar: 'متجر إلكتروني' },
  { value: 'saas',       icon: '⚡', en: 'SaaS Platform',   ar: 'منصة SaaS' },
  { value: 'app',        icon: '📱', en: 'Mobile App',      ar: 'تطبيق موبايل' },
  { value: 'branding',   icon: '🎨', en: 'Branding',        ar: 'هوية بصرية' },
  { value: 'other',      icon: '✦',  en: 'Something Else',  ar: 'شيء آخر' },
];

const SESSION_KEY = 'yansy_onboarding_state';

const WaIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const OnboardingWizard = () => {
  const { language, isRTL } = useLanguage();
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { user }  = useSelector(s => s.auth);

  // ── What's actually missing? Drives which steps exist at all. ──────────
  const missingPhone = !user?.phoneNumber;

  // Screens: 'welcome' -> 'contact' (only if phone missing) -> 'profile' -> 'done'
  const SCREENS = useMemo(
    () => ['welcome', ...(missingPhone ? ['contact'] : []), 'profile', 'done'],
    [missingPhone]
  );
  const TOTAL_STEPS = SCREENS.length - 1; // 'done' isn't a counted step

  const restored = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.userId === user?._id ? parsed : null;
    } catch { return null; }
  }, [user?._id]);

  const [screenIdx, setScreenIdx] = useState(() => {
    const idx = restored?.screenIdx;
    return Number.isInteger(idx) && idx < SCREENS.length - 1 ? idx : 0;
  });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  // Contact preference — only meaningful when phone is missing.
  const [contactMethod, setContactMethod] = useState(restored?.contactMethod || 'whatsapp');
  const [contactValue,  setContactValue]  = useState(restored?.contactValue || '');

  // Profile extras — all optional, prefilled from known data.
  const [selectedGoal, setSelectedGoal] = useState(restored?.selectedGoal ?? user?.primaryGoal ?? '');
  const [company,  setCompany]  = useState(restored?.company ?? user?.companyName ?? '');
  const [jobRole,  setJobRole]  = useState(restored?.jobRole ?? user?.jobRole ?? '');

  const screen = SCREENS[screenIdx];
  const stepNumber = screenIdx + 1; // 1-indexed, only meaningful while screen !== 'done'
  const progress = (screenIdx / Math.max(TOTAL_STEPS - 1, 1)) * 100;

  const firstName = user?.fullName?.trim().split(' ')[0] || (language === 'ar' ? 'صديقنا' : 'there');

  // ── Persist progress so a refresh resumes instead of restarting ────────
  useEffect(() => {
    if (screen === 'done' || !user?._id) return;
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        userId: user._id, screenIdx, contactMethod, contactValue, selectedGoal, company, jobRole,
      }));
    } catch { /* storage unavailable — resuming just won't work, non-fatal */ }
  }, [screen, user?._id, screenIdx, contactMethod, contactValue, selectedGoal, company, jobRole]);

  // ── Already complete? (stale bookmark / back button) — bounce out. ─────
  // Either signal is sufficient: a phone on file, OR a completed activation
  // (which covers email-only customers who deliberately have no phone —
  // requiring *both* used to trap them back into onboarding forever).
  //
  // This must only ever fire for a genuinely stale visit (a bookmark, the
  // back button) — never react to `user` changing later. A naive
  // `useEffect(() => {...}, [user])` also fires the instant handleSave's
  // own getMe() flips isProfileComplete to true: react-redux flushes that
  // external-store update synchronously (ahead of the `await` in
  // handleSave even continuing to its own setScreenIdx('done') call), so
  // the effect would see `screen` still 'profile' and navigate away before
  // the "You're all set!" confirmation ever rendered. A one-time mount
  // snapshot sidesteps the ordering race entirely.
  const wasAlreadyComplete = useState(
    () => !!(user && (user.phoneNumber || user.isProfileComplete))
  )[0];
  useEffect(() => {
    if (wasAlreadyComplete) navigate('/app/dashboard', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError('');
    try {
      const payload = { primaryGoal: selectedGoal || undefined };
      if (missingPhone) {
        // "Email only" deliberately has no phone — never invent one. The
        // server already has the verified account email; nothing to send.
        if (contactMethod !== 'email') {
          payload.phoneNumber = contactValue.trim();
        }
        payload.communicationPreference = contactMethod;
      }
      if (company.trim()) payload.companyName = company.trim();
      if (jobRole.trim()) payload.jobRole = jobRole.trim();

      await api.post('/users/onboarding', payload);
      await dispatch(getMe());
      try { sessionStorage.removeItem(SESSION_KEY); } catch { /* non-fatal */ }
      setScreenIdx(SCREENS.length - 1); // -> 'done'
    } catch (err) {
      setError(err?.response?.data?.error || (language === 'ar' ? 'حدث خطأ. يرجى المحاولة مجدداً.' : 'Something went wrong. Please try again.'));
    } finally {
      setSaving(false);
    }
  }, [dispatch, missingPhone, contactMethod, contactValue, selectedGoal, company, jobRole, language, SCREENS.length]);

  const handleNext = () => {
    if (screen === 'profile') { handleSave(); return; }
    setScreenIdx(i => Math.min(i + 1, SCREENS.length - 2));
  };

  const canContinue = () => {
    if (screen === 'welcome') return true;
    if (screen === 'contact') {
      // "Email only" needs no input — the verified account email already
      // covers it. WhatsApp/phone genuinely need a valid number; a garbage
      // string like "aaaaa" must never pass just because it's non-empty.
      if (contactMethod === 'email') return true;
      return validatePhone(contactValue).valid;
    }
    return true;
  };

  const phoneCheck = contactValue.trim() ? validatePhone(contactValue) : null;
  const phoneHintCopy = phoneCheck && !phoneCheck.valid ? PHONE_HINT_COPY[phoneCheck.reason] : (phoneCheck?.confidence === 'low' ? PHONE_HINT_COPY.maybe_missing_country_code : null);

  return (
    <div style={{
      minHeight: '100vh', background: TK.bg, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 'clamp(16px,4vw,40px)',
      fontFamily: isRTL ? 'IBM Plex Sans Arabic,system-ui,sans-serif' : 'Inter,system-ui,sans-serif',
      direction: isRTL ? 'rtl' : 'ltr',
    }}>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '520px',
        background: TK.surface, borderRadius: '20px', border: `1px solid ${TK.border}`,
        boxShadow: '0 8px 40px rgba(0,0,0,0.06)', overflow: 'hidden',
      }}>

        {/* Progress bar */}
        {screen !== 'done' && (
          <div style={{ height: '3px', background: TK.bg }}>
            <div style={{
              height: '100%', background: `linear-gradient(90deg, ${TK.accent}, #60a5fa)`,
              width: `${progress}%`, transition: 'width 0.45s cubic-bezier(0.4,0,0.2,1)',
            }} />
          </div>
        )}

        {/* Header (top badge) */}
        {screen !== 'done' && (
          <div style={{ padding: '20px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: '11px', fontWeight: 600, color: TK.accent,
              background: TK.accentBg, padding: '4px 10px', borderRadius: '999px',
              letterSpacing: '0.04em',
            }}>
              {language === 'ar'
                ? `الإعداد — ${TOTAL_STEPS} ${TOTAL_STEPS === 1 ? 'خطوة' : 'خطوات'}`
                : `Setup — ${TOTAL_STEPS} step${TOTAL_STEPS === 1 ? '' : 's'}`}
            </span>
            {/* <bdi> isolates this numeric pair from the surrounding RTL
                paragraph direction — without it, Arabic mode renders
                "2 / 3" as the bidi-reordered "3 / 2". */}
            <span style={{ fontSize: '11px', color: TK.textLight }}>
              <bdi>{stepNumber} / {TOTAL_STEPS}</bdi>
            </span>
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '24px 28px 28px' }}>

          {/* ── Welcome ── */}
          {screen === 'welcome' && (
            <div>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: TK.accentBg, border: '1px solid rgba(37,99,235,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px',
                fontSize: '24px',
              }}>
                👋
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: TK.text, margin: '0 0 8px', lineHeight: 1.3 }}>
                {language === 'ar' ? `أهلاً بك في YANSY، ${firstName}!` : `Welcome to YANSY, ${firstName}!`}
              </h1>
              <p style={{ fontSize: '14px', color: TK.textMuted, margin: '0 0 18px', lineHeight: 1.6 }}>
                {language === 'ar'
                  ? 'خطوة أو خطوتان بسرعة، وبعدها حسابك جاهز بالكامل.'
                  : "One or two quick things, then your account is fully ready."}
              </p>
              {/* Verified account info — email is shown, never re-requested */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', borderRadius: '10px', background: TK.bg, border: `1px solid ${TK.border}` }}>
                <BadgeCheck style={{ width: 17, height: 17, color: '#16a34a', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '12.5px', color: TK.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.email}
                  </div>
                  <div style={{ fontSize: '10.5px', color: TK.textLight }}>
                    {language === 'ar' ? 'بريد إلكتروني موثّق' : 'Verified email address'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Contact (only shown when phone is genuinely missing) ── */}
          {screen === 'contact' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: TK.text, margin: '0 0 6px' }}>
                {language === 'ar' ? 'كيف نتواصل معك؟' : 'How should we reach you?'}
              </h2>
              <p style={{ fontSize: '13.5px', color: TK.textMuted, margin: '0 0 20px', lineHeight: 1.5 }}>
                {language === 'ar' ? 'لا رقم هاتف مسجّل بعد — اختر طريقة التواصل المفضلة' : "We don't have a phone number for you yet — choose your preferred way to connect"}
              </p>

              {/* Method selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                {[
                  { id: 'whatsapp', label_en: 'WhatsApp', label_ar: 'واتساب',       desc_en: 'Fastest way to reach our team', desc_ar: 'أسرع طريقة للتواصل مع الفريق', icon: <WaIcon size={18} />, color: '#25D366' },
                  { id: 'phone',    label_en: 'Phone Call', label_ar: 'مكالمة هاتفية', desc_en: "We'll call during business hours",       desc_ar: 'سنتصل بك في أوقات العمل',  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.15 1.18 2 2 0 012.11 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/></svg>, color: TK.accent },
                  { id: 'email',    label_en: 'Email Only', label_ar: 'البريد الإلكتروني فقط',  desc_en: 'No phone — reach me by email',            desc_ar: 'بدون هاتف — تواصل معي بالبريد',   icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, color: '#7c3aed' },
                ].map(method => {
                  const isSelected = contactMethod === method.id;
                  return (
                    <button key={method.id} type="button"
                      onClick={() => { setContactMethod(method.id); }}
                      aria-pressed={isSelected}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px',
                        borderRadius: '12px', background: isSelected ? TK.accentBg : TK.bg,
                        border: `1.5px solid ${isSelected ? TK.accent : TK.border}`,
                        cursor: 'pointer', textAlign: isRTL ? 'right' : 'left', transition: 'all 0.15s',
                        fontFamily: 'inherit', width: '100%',
                      }}
                    >
                      <span style={{ color: isSelected ? method.color : TK.textMuted, flexShrink: 0 }}>{method.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13.5px', fontWeight: 500, color: isSelected ? TK.text : TK.textMuted, marginBottom: '2px' }}>
                          {language === 'ar' ? method.label_ar : method.label_en}
                        </div>
                        <div style={{ fontSize: '11.5px', color: TK.textLight, lineHeight: 1.3 }}>
                          {language === 'ar' ? method.desc_ar : method.desc_en}
                        </div>
                      </div>
                      {isSelected && (
                        <div style={{
                          width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                          background: TK.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Contact value input — always a phone number; "email only" still
                  lets them skip via the skip link below rather than faking a
                  phone value. */}
              {contactMethod !== 'email' && (
                <div>
                  <label htmlFor="ob-contact-value" style={{ fontSize: '12px', color: TK.textMuted, display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                    {contactMethod === 'whatsapp' ? (language === 'ar' ? 'رقم واتساب *' : 'WhatsApp Number *')
                     : (language === 'ar' ? 'رقم الهاتف *' : 'Phone Number *')}
                  </label>
                  <input
                    id="ob-contact-value"
                    type="tel"
                    dir="ltr"
                    value={contactValue}
                    onChange={e => setContactValue(e.target.value)}
                    placeholder={language === 'ar' ? '+20 109 038 5390' : '+20 109 038 5390'}
                    aria-invalid={!!(phoneCheck && !phoneCheck.valid)}
                    aria-describedby={phoneHintCopy ? 'ob-phone-hint' : undefined}
                    style={{
                      width: '100%', padding: '11px 14px', borderRadius: '10px',
                      textAlign: isRTL ? 'right' : 'left',
                      border: `1.5px solid ${phoneCheck && !phoneCheck.valid ? '#dc2626' : (contactValue ? TK.accent : TK.border)}`,
                      fontSize: '14px', color: TK.text, background: TK.surface,
                      outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s',
                    }}
                  />
                  <p style={{ fontSize: '11px', color: TK.textLight, margin: '6px 0 0' }}>
                    {language === 'ar' ? 'سيستخدم فريقنا هذا للتواصل معك' : 'Our team will use this to reach you'}
                  </p>
                  {phoneHintCopy && (
                    <p id="ob-phone-hint" style={{
                      fontSize: '11px', margin: '6px 0 0', lineHeight: 1.5,
                      color: phoneCheck?.valid ? '#b45309' : '#b91c1c',
                    }}>
                      {language === 'ar' ? phoneHintCopy.ar : phoneHintCopy.en}
                    </p>
                  )}
                </div>
              )}

              {/* Email-only: confirm which address we'll use — never re-ask for it */}
              {contactMethod === 'email' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', borderRadius: '10px', background: TK.bg, border: `1px solid ${TK.border}` }}>
                  <BadgeCheck style={{ width: 17, height: 17, color: '#16a34a', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '12.5px', color: TK.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.email}
                    </div>
                    <div style={{ fontSize: '10.5px', color: TK.textLight }}>
                      {language === 'ar' ? 'سنستخدم هذا البريد للتواصل معك' : "We'll reach you at this address"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Profile extras (all optional) ── */}
          {screen === 'profile' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: TK.text, margin: '0 0 6px' }}>
                {language === 'ar' ? 'لمسة أخيرة (اختياري)' : 'One last touch (optional)'}
              </h2>
              <p style={{ fontSize: '13.5px', color: TK.textMuted, margin: '0 0 20px', lineHeight: 1.5 }}>
                {language === 'ar' ? 'يساعدنا هذا على تخصيص تجربتك — يمكنك تخطيه في أي وقت' : 'Helps us tailor your experience — feel free to skip'}
              </p>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '12px', color: TK.textMuted, display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  {language === 'ar' ? 'ما الذي يهمّك أكثر الآن؟' : "What's most on your mind right now?"}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px' }} role="radiogroup" aria-label={language === 'ar' ? 'الاهتمام الأساسي' : 'Primary interest'}>
                  {GOALS.map((goal) => {
                    const isSelected = selectedGoal === goal.value;
                    return (
                      <button key={goal.value} type="button" role="radio" aria-checked={isSelected}
                        onClick={() => setSelectedGoal(isSelected ? '' : goal.value)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '10px 12px', borderRadius: '9px', textAlign: isRTL ? 'right' : 'left', fontFamily: 'inherit',
                          background: isSelected ? TK.accentBg : TK.bg,
                          border: `1.5px solid ${isSelected ? TK.accent : TK.border}`,
                          color: isSelected ? TK.accent : TK.textMuted, fontSize: '12.5px', fontWeight: isSelected ? 500 : 400,
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        <span aria-hidden="true">{goal.icon}</span>
                        {language === 'ar' ? goal.ar : goal.en}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { key: 'company', label_en: 'Company Name', label_ar: 'اسم الشركة', val: company, set: setCompany, placeholder_en: 'Your company name', placeholder_ar: 'اسم شركتك' },
                  { key: 'jobRole', label_en: 'Your Role',    label_ar: 'مسماك الوظيفي', val: jobRole, set: setJobRole, placeholder_en: 'CEO, Founder, Manager...', placeholder_ar: 'مدير تنفيذي، مؤسس...' },
                ].map(f => (
                  <div key={f.key}>
                    <label htmlFor={`ob-${f.key}`} style={{ fontSize: '12px', color: TK.textMuted, display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                      {language === 'ar' ? f.label_ar : f.label_en}
                    </label>
                    <input id={`ob-${f.key}`} value={f.val} onChange={e => f.set(e.target.value)}
                      placeholder={language === 'ar' ? f.placeholder_ar : f.placeholder_en}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '10px',
                        border: `1px solid ${TK.border}`, fontSize: '13px', color: TK.text,
                        background: TK.bg, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s',
                      }}
                      onFocus={e => { e.target.style.borderColor = TK.accent; e.target.style.background = TK.surface; }}
                      onBlur={e => { e.target.style.borderColor = TK.border; e.target.style.background = TK.bg; }}
                    />
                  </div>
                ))}
              </div>

              {error && (
                <div role="alert" style={{ padding: '10px 14px', borderRadius: '9px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)', fontSize: '12.5px', color: '#dc2626', marginTop: '14px' }}>
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ── Done ── */}
          {screen === 'done' && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 18px',
                background: 'rgba(22,163,74,0.08)', border: '2px solid rgba(22,163,74,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)',
              }}>
                <style>{`@keyframes popIn{from{transform:scale(0.4);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
                <CheckCircle2 style={{ width: '30px', height: '30px', color: '#16a34a' }} />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: TK.text, margin: '0 0 10px' }}>
                {language === 'ar' ? 'أنت جاهز تماماً!' : "You're all set!"}
              </h2>
              <p style={{ fontSize: '13.5px', color: TK.textMuted, margin: '0 0 26px', lineHeight: 1.6, maxWidth: '360px', marginLeft: 'auto', marginRight: 'auto' }}>
                {language === 'ar'
                  ? 'حسابك جاهز الآن. متى ما أردت، يمكنك بدء طلب مشروع أو التواصل مع فريقنا مباشرة من لوحتك.'
                  : "Your account is ready. Whenever you're ready, you can start a project request or message our team directly from your dashboard."}
              </p>

              <button onClick={() => navigate('/app/dashboard')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px', margin: '0 auto',
                  padding: '12px 28px', borderRadius: '10px', background: TK.accent, color: '#fff',
                  border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500, fontFamily: 'inherit',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                {language === 'ar' ? 'الذهاب إلى لوحتي' : 'Go to My Dashboard'}
                <ChevronRight style={{ width: '15px', height: '15px', transform: isRTL ? 'rotate(180deg)' : 'none' }} />
              </button>
            </div>
          )}

          {/* Navigation buttons */}
          {screen !== 'done' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
              {screenIdx > 0 ? (
                <button onClick={() => setScreenIdx(i => i - 1)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '9px 18px', borderRadius: '9px',
                    border: `1px solid ${TK.border}`, background: TK.surface, color: TK.textMuted,
                    cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = TK.accent; e.currentTarget.style.color = TK.accent; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = TK.border; e.currentTarget.style.color = TK.textMuted; }}
                >
                  <ChevronLeft style={{ width: '14px', height: '14px', transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                  {language === 'ar' ? 'رجوع' : 'Back'}
                </button>
              ) : (
                <div />
              )}
              <button onClick={handleNext} disabled={!canContinue() || saving}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '11px 24px', borderRadius: '10px',
                  background: canContinue() ? TK.accent : TK.accentBg,
                  color: canContinue() ? '#fff' : TK.textLight,
                  border: 'none', cursor: canContinue() ? 'pointer' : 'default',
                  fontSize: '14px', fontWeight: 500, fontFamily: 'inherit', transition: 'all 0.15s',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving
                  ? (language === 'ar' ? 'جارٍ الحفظ...' : 'Saving...')
                  : screen === 'profile'
                    ? (language === 'ar' ? 'إكمال الإعداد' : 'Complete Setup')
                    : (language === 'ar' ? 'متابعة' : 'Continue')}
                {!saving && <ChevronRight style={{ width: '15px', height: '15px', transform: isRTL ? 'rotate(180deg)' : 'none' }} />}
              </button>
            </div>
          )}

          {/* Skip link (profile step only — contact step collects the one
              thing we genuinely need, so it isn't skippable; "email only"
              already covers "I don't want to give a phone") */}
          {screen === 'profile' && (
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button onClick={handleSave} disabled={saving}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '11.5px',
                  color: TK.textLight, fontFamily: 'inherit', transition: 'color 0.14s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = TK.textMuted; }}
                onMouseLeave={e => { e.currentTarget.style.color = TK.textLight; }}
              >
                {language === 'ar' ? 'تخطي هذه الخطوة' : 'Skip this step'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Branding */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <span style={{ fontSize: '12px', color: TK.textLight }}>
          {language === 'ar' ? 'مدعوم من ' : 'Powered by '}
          <strong style={{ color: TK.textMuted }}>YANSY</strong>
        </span>
      </div>
    </div>
  );
};

export default OnboardingWizard;
