import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';
import { getMe } from '../store/authSlice';
import { useLanguage } from '../contexts/LanguageContext';
import { validatePhone } from '../utils/phone';

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

const GOALS = {
  en: ['Website', 'E-commerce Store', 'SaaS Platform', 'Mobile App', 'Admin Dashboard', 'Something Else'],
  ar: ['موقع إلكتروني', 'متجر إلكتروني', 'منصة SaaS', 'تطبيق موبايل', 'لوحة تحكم', 'شيء آخر'],
};

const STEPS_EN = ['Welcome', 'How to Reach You', 'Your Project', 'All Set!'];
const STEPS_AR = ['أهلاً', 'طريقة التواصل', 'مشروعك', 'تم التسجيل!'];

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

  const [step, setStep]         = useState(0);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  // Step 1 — contact preference
  const [contactMethod, setContactMethod] = useState('whatsapp');
  const [contactValue,  setContactValue]  = useState('');

  // Step 2 — project info
  const [selectedGoal, setSelectedGoal] = useState('');
  const [company,  setCompany]  = useState('');
  const [roleField, setRoleField] = useState('');

  const TOTAL = 4;
  const progress = ((step) / (TOTAL - 1)) * 100;
  const steps = language === 'ar' ? STEPS_AR : STEPS_EN;
  const goals = language === 'ar' ? GOALS.ar : GOALS.en;

  const firstName = user?.fullName?.split(' ')[0] || (language === 'ar' ? 'أهلاً' : 'there');

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        onboardingComplete: true,
        communicationPreference: contactMethod,
        contactValue: contactValue.trim(),
        projectGoal: selectedGoal,
        company: company.trim(),
        role: roleField.trim(),
      };
      if (contactMethod === 'phone' || contactMethod === 'whatsapp') {
        payload.phone = contactValue.trim();
      }
      await api.put('/users/profile', payload);
      await dispatch(getMe());
      setStep(3);
    } catch {
      setError(language === 'ar' ? 'حدث خطأ. يرجى المحاولة مجدداً.' : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [dispatch, contactMethod, contactValue, selectedGoal, company, roleField, language]);

  const handleNext = () => {
    if (step === 2) { handleSave(); return; }
    setStep(s => Math.min(s + 1, TOTAL - 1));
  };

  const canContinue = () => {
    if (step === 0) return true;
    if (step === 1) return contactValue.trim().length > 0;
    if (step === 2) return true;
    return true;
  };

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
        {step < 3 && (
          <div style={{ height: '3px', background: TK.bg }}>
            <div style={{
              height: '100%', background: `linear-gradient(90deg, ${TK.accent}, #60a5fa)`,
              width: `${progress}%`, transition: 'width 0.45s cubic-bezier(0.4,0,0.2,1)',
            }} />
          </div>
        )}

        {/* Header (top badge) */}
        {step < 3 && (
          <div style={{ padding: '20px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: '11px', fontWeight: 600, color: TK.accent,
              background: TK.accentBg, padding: '4px 10px', borderRadius: '999px',
              letterSpacing: '0.04em',
            }}>
              {language === 'ar' ? 'الإعداد — 4 خطوات' : 'Setup — Just 4 steps'}
            </span>
            <span style={{ fontSize: '11px', color: TK.textLight }}>
              {step + 1} / {TOTAL - 1}
            </span>
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '24px 28px 28px' }}>

          {/* ── Step 0: Welcome ── */}
          {step === 0 && (
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
              <p style={{ fontSize: '14px', color: TK.textMuted, margin: '0 0 22px', lineHeight: 1.6 }}>
                {language === 'ar'
                  ? 'يسعدنا التعاون معك. دعنا نُعدّ حسابك في دقائق قليلة.'
                  : "We're excited to work with you. Let's set up your account in just a few minutes."}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { icon: '👤', en: 'Dedicated account manager', ar: 'مدير حساب مخصص' },
                  { icon: '📊', en: 'Transparent progress tracking', ar: 'تتبع شفاف للتقدم' },
                  { icon: '⚡', en: 'Fast delivery cycles',          ar: 'دورات تسليم سريعة' },
                ].map(item => (
                  <div key={item.en} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', background: TK.bg, border: `1px solid ${TK.border}` }}>
                    <span style={{ fontSize: '17px' }}>{item.icon}</span>
                    <span style={{ fontSize: '13px', color: TK.text, fontWeight: 400 }}>
                      {language === 'ar' ? item.ar : item.en}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 1: Contact Method ── */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: TK.text, margin: '0 0 6px' }}>
                {language === 'ar' ? 'كيف نتواصل معك؟' : 'How should we reach you?'}
              </h2>
              <p style={{ fontSize: '13.5px', color: TK.textMuted, margin: '0 0 20px', lineHeight: 1.5 }}>
                {language === 'ar' ? 'اختر طريقة التواصل المفضلة لديك' : 'Choose your preferred communication method'}
              </p>

              {/* Method selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                {[
                  { id: 'whatsapp', label_en: 'WhatsApp', label_ar: 'واتساب',       desc_en: 'Fastest response — usually within minutes', desc_ar: 'أسرع استجابة — عادةً في دقائق', placeholder_en: '+201090385390', placeholder_ar: '+201090385390', icon: <WaIcon size={18} />, color: '#25D366' },
                  { id: 'phone',    label_en: 'Phone Call', label_ar: 'مكالمة هاتفية', desc_en: "We'll call you during business hours",       desc_ar: 'سنتصل بك في أوقات العمل',  placeholder_en: '+1 (555) 123-4567', placeholder_ar: '+966 50 123 4567', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.15 1.18 2 2 0 012.11 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/></svg>, color: TK.accent },
                  { id: 'email',    label_en: 'Email',      label_ar: 'بريد إلكتروني',  desc_en: "We'll reply within a few hours",            desc_ar: 'سنرد خلال ساعات قليلة',   placeholder_en: 'your@email.com', placeholder_ar: 'بريدك@مثال.com',  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, color: '#7c3aed' },
                ].map(method => {
                  const isSelected = contactMethod === method.id;
                  return (
                    <button key={method.id}
                      onClick={() => { setContactMethod(method.id); setContactValue(''); }}
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

              {/* Contact value input */}
              <div>
                <label style={{ fontSize: '12px', color: TK.textMuted, display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                  {contactMethod === 'whatsapp' ? (language === 'ar' ? 'رقم واتساب *' : 'WhatsApp Number *')
                   : contactMethod === 'phone' ? (language === 'ar' ? 'رقم الهاتف *' : 'Phone Number *')
                   : (language === 'ar' ? 'البريد الإلكتروني *' : 'Email Address *')}
                </label>
                <input
                  type={contactMethod === 'email' ? 'email' : 'tel'}
                  value={contactValue}
                  onChange={e => setContactValue(e.target.value)}
                  placeholder={contactMethod === 'whatsapp' ? (language === 'ar' ? '+20 109 038 5390' : '+20 109 038 5390')
                    : contactMethod === 'phone' ? (language === 'ar' ? '+966 50 123 4567' : '+1 (555) 123-4567')
                    : (language === 'ar' ? 'بريدك@مثال.com' : 'your@email.com')}
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: '10px',
                    border: `1.5px solid ${contactValue ? TK.accent : TK.border}`,
                    fontSize: '14px', color: TK.text, background: TK.surface,
                    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s',
                  }}
                  onFocus={e => { e.target.style.borderColor = TK.accent; }}
                  onBlur={e => { e.target.style.borderColor = contactValue ? TK.accent : TK.border; }}
                />
                <p style={{ fontSize: '11px', color: TK.textLight, margin: '6px 0 0' }}>
                  {language === 'ar' ? 'سيستخدم فريقنا هذا للتواصل معك' : 'Our team will use this to reach you'}
                </p>
                {(contactMethod === 'phone' || contactMethod === 'whatsapp') && contactValue.trim() && (() => {
                  const hint = validatePhone(contactValue);
                  const copy = PHONE_HINT_COPY[hint.reason];
                  if (!copy) return null;
                  const isWarningOnly = hint.valid; // low-confidence but not blocking
                  return (
                    <p style={{
                      fontSize: '11px', margin: '6px 0 0', lineHeight: 1.5,
                      color: isWarningOnly ? '#b45309' : '#b91c1c',
                    }}>
                      {language === 'ar' ? copy.ar : copy.en}
                    </p>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ── Step 2: Project Info ── */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: TK.text, margin: '0 0 6px' }}>
                {language === 'ar' ? 'أخبرنا عن مشروعك' : 'Tell us about your project'}
              </h2>
              <p style={{ fontSize: '13.5px', color: TK.textMuted, margin: '0 0 20px', lineHeight: 1.5 }}>
                {language === 'ar' ? 'ساعدنا في فهم ما تريد بناءه' : 'Help us understand what you want to build'}
              </p>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '12px', color: TK.textMuted, display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  {language === 'ar' ? 'ماذا تريد أن تبني؟' : 'What do you want to build?'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px' }}>
                  {goals.map((goal, i) => {
                    const isSelected = selectedGoal === goal;
                    return (
                      <button key={goal} onClick={() => setSelectedGoal(isSelected ? '' : goal)}
                        style={{
                          padding: '10px 12px', borderRadius: '9px', textAlign: 'center', fontFamily: 'inherit',
                          background: isSelected ? TK.accentBg : TK.bg,
                          border: `1.5px solid ${isSelected ? TK.accent : TK.border}`,
                          color: isSelected ? TK.accent : TK.textMuted, fontSize: '12.5px', fontWeight: isSelected ? 500 : 400,
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        {goal}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label_en: 'Company Name (optional)', label_ar: 'اسم الشركة (اختياري)', val: company, set: setCompany, placeholder_en: 'Your company name', placeholder_ar: 'اسم شركتك' },
                  { label_en: 'Your Role (optional)',    label_ar: 'مسماك الوظيفي (اختياري)', val: roleField, set: setRoleField, placeholder_en: 'CEO, Founder, Manager...', placeholder_ar: 'مدير تنفيذي، مؤسس...' },
                ].map(f => (
                  <div key={f.label_en}>
                    <label style={{ fontSize: '12px', color: TK.textMuted, display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                      {language === 'ar' ? f.label_ar : f.label_en}
                    </label>
                    <input value={f.val} onChange={e => f.set(e.target.value)}
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
                <div style={{ padding: '10px 14px', borderRadius: '9px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)', fontSize: '12.5px', color: '#dc2626', marginTop: '14px' }}>
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && (
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
              <p style={{ fontSize: '13.5px', color: TK.textMuted, margin: '0 0 22px', lineHeight: 1.6, maxWidth: '360px', marginLeft: 'auto', marginRight: 'auto' }}>
                {language === 'ar'
                  ? 'سيتواصل معك مدير حسابك المخصص خلال ساعتين عبر قناتك المفضلة.'
                  : 'Your dedicated account manager will contact you within 2 hours via your preferred channel.'}
              </p>

              {/* PM placeholder */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '12px',
                padding: '12px 18px', borderRadius: '14px',
                background: TK.accentBg, border: '1px solid rgba(37,99,235,0.14)',
                marginBottom: '24px',
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'rgba(37,99,235,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', fontWeight: 700, color: TK.accent,
                }}>Y</div>
                <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: TK.text }}>
                    {language === 'ar' ? 'فريق YANSY' : 'YANSY Team'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: TK.textMuted }}>
                    {language === 'ar' ? 'مدير حساب' : 'Account Manager'}
                  </div>
                </div>
              </div>

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
          {step < 3 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
              {step > 0 ? (
                <button onClick={() => setStep(s => s - 1)}
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
                  : step === 2
                    ? (language === 'ar' ? 'إكمال الإعداد' : 'Complete Setup')
                    : (language === 'ar' ? 'متابعة' : 'Continue')}
                {!saving && <ChevronRight style={{ width: '15px', height: '15px', transform: isRTL ? 'rotate(180deg)' : 'none' }} />}
              </button>
            </div>
          )}

          {/* Skip link (steps 1 & 2 only) */}
          {(step === 1 || step === 2) && (
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button onClick={() => step === 2 ? handleSave() : setStep(s => s + 1)}
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
