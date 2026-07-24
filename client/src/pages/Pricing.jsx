import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, X, Zap, Crown, Star, ArrowLeft } from 'lucide-react';
import { useSelector } from 'react-redux';
import api from '../utils/api';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const FONT_EN = "'Inter',system-ui,sans-serif";
const FONT_AR = "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif";

const FEATURE_LABELS = {
  maxProjects:       { en: 'Projects', ar: 'المشاريع' },
  maxStorageGb:      { en: 'Storage', ar: 'مساحة التخزين' },
  maxTeamMembers:    { en: 'Team members', ar: 'أعضاء الفريق' },
  aiFeatures:        { en: 'AI features', ar: 'ميزات الذكاء الاصطناعي' },
  invoicing:         { en: 'Client invoicing', ar: 'فوترة العملاء' },
  advancedAnalytics: { en: 'Advanced analytics', ar: 'تحليلات متقدمة' },
  prioritySupport:   { en: 'Priority support', ar: 'دعم ذو أولوية' },
  apiAccess:         { en: 'API access', ar: 'وصول للواجهة البرمجية' },
  customBranding:    { en: 'Custom branding', ar: 'هوية بصرية مخصصة' },
  whiteLabel:        { en: 'White-label', ar: 'علامة بيضاء' },
  sso:               { en: 'Single Sign-On (SSO)', ar: 'تسجيل دخول موحّد (SSO)' },
};

const PLAN_ICONS = { FREE: Star, PROFESSIONAL: Zap, ENTERPRISE: Crown };

const formatValue = (key, value, isRTL) => {
  if (key === 'maxProjects' || key === 'maxTeamMembers') {
    return value === -1 ? (isRTL ? 'غير محدود' : 'Unlimited') : String(value);
  }
  if (key === 'maxStorageGb') return value === -1 ? (isRTL ? 'غير محدود' : 'Unlimited') : (isRTL ? `${value} جيجابايت` : `${value} GB`);
  return null; // boolean — shown as check/x
};

const Pricing = () => {
  const { isDark } = useTheme();
  const { isRTL }  = useLanguage();
  const font       = isRTL ? FONT_AR : FONT_EN;
  const navigate   = useNavigate();
  const { isAuthenticated } = useSelector(s => s.auth);
  const [plans,     setPlans]     = useState([]);
  const [billing,   setBilling]   = useState('monthly'); // 'monthly' | 'annual'
  const [loading,   setLoading]   = useState(true);

  const gold      = '#2563EB';
  const bg        = isDark ? '#F6F7F9' : '#fafaf9';
  const surface   = isDark ? 'rgba(0,0,0,0.03)' : '#ffffff';
  const border    = isDark ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.08)';
  const textMain  = isDark ? '#f5f5f0' : '#0D1117';
  const textMuted = isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.4)';

  useEffect(() => {
    api.get('/billing/plans')
      .then(r => setPlans(r.data.plans || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (plan) => {
    if (plan.price?.monthly === 0) {
      navigate(isAuthenticated ? '/app/dashboard' : '/register');
      return;
    }
    if (isAuthenticated) {
      navigate('/app/billing', { state: { selectPlan: plan._id, billingCycle: billing } });
    } else {
      navigate('/register');
    }
  };

  const annualSavingPct = (plan) => {
    if (!plan.price?.monthly || !plan.price?.annual) return 0;
    const annualMonthly = plan.price.annual / 12;
    return Math.round((1 - annualMonthly / plan.price.monthly) * 100);
  };

  const getPrice = (plan) => {
    if (!plan.price?.monthly && plan.price?.monthly !== 0) return '—';
    if (plan.price.monthly === 0) return '$0';
    const cents = billing === 'annual'
      ? Math.round(plan.price.annual / 12)
      : plan.price.monthly;
    return `$${Math.round(cents / 100)}`;
  };

  const featureKeys = Object.keys(FEATURE_LABELS);

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: bg, color: textMain, padding: '60px 24px 80px', fontFamily: font }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Back link */}
        <Link
          to="/"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: textMuted, textDecoration: 'none', marginBottom: '40px' }}
          onMouseEnter={e => { e.currentTarget.style.color = gold; }}
          onMouseLeave={e => { e.currentTarget.style.color = textMuted; }}
        >
          <ArrowLeft style={{ width: '13px', height: '13px', transform: isRTL ? 'scaleX(-1)' : 'none' }} />
          {isRTL ? 'العودة للرئيسية' : 'Back to home'}
        </Link>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '3px 12px', borderRadius: '20px',
            border: '1px solid rgba(37,99,235,0.25)', background: 'rgba(37,99,235,0.06)',
            marginBottom: '16px',
          }}>
            <Zap style={{ width: '10px', height: '10px', color: gold }} />
            <span style={{ fontSize: '10px', fontWeight: 400, color: gold, letterSpacing: isRTL ? 0 : '0.14em', textTransform: isRTL ? 'none' : 'uppercase' }}>
              {isRTL ? 'أسعار بسيطة' : 'Simple Pricing'}
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700,
            letterSpacing: isRTL ? 0 : '-0.03em', color: textMain, margin: '0 0 16px',
            fontFamily: font,
          }}>
            {isRTL ? 'اختر باقتك' : 'Choose your plan'}
          </h1>
          <p style={{ fontSize: '15px', fontWeight: 300, color: textMuted, maxWidth: '480px', margin: '0 auto 32px', lineHeight: 1.6 }}>
            {isRTL
              ? 'ابدأ مجانًا. توسّع عندما تكون جاهزًا. المستخدمون الجدد يحصلون على تجربة مجانية 14 يومًا للباقة الاحترافية — بلا بطاقة ائتمان.'
              : 'Start free. Scale when ready. New users get a 14-day Professional trial — no credit card required.'}
          </p>

          {/* Billing toggle */}
          <div style={{ display: 'inline-flex', background: isDark ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.04)', borderRadius: '10px', padding: '4px', gap: '4px' }}>
            {['monthly', 'annual'].map(cycle => (
              <button
                key={cycle}
                onClick={() => setBilling(cycle)}
                style={{
                  padding: '8px 20px',
                  background: billing === cycle ? gold : 'transparent',
                  border: 'none', borderRadius: '7px',
                  color: billing === cycle ? '#000' : textMuted,
                  fontSize: '12px', fontWeight: billing === cycle ? 600 : 300,
                  letterSpacing: isRTL ? 0 : '0.06em', textTransform: isRTL ? 'none' : 'capitalize',
                  cursor: 'pointer', transition: 'all 0.2s', fontFamily: font,
                }}
              >
                {cycle === 'annual' ? (isRTL ? 'سنوي (وفّر 20-33٪)' : 'Annual (save 20–33%)') : (isRTL ? 'شهري' : 'Monthly')}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid rgba(37,99,235,0.15)', borderTopColor: gold, animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '60px' }}>
            {plans.map((plan) => {
              const Icon        = PLAN_ICONS[plan.name] || Star;
              const isPro       = plan.name === 'PROFESSIONAL';
              const saving      = annualSavingPct(plan);
              const price       = getPrice(plan);
              const isFree      = plan.price?.monthly === 0;

              return (
                <div
                  key={plan._id}
                  style={{
                    padding: '32px',
                    background: isPro ? 'rgba(37,99,235,0.06)' : surface,
                    border: `1px solid ${isPro ? 'rgba(37,99,235,0.3)' : border}`,
                    borderRadius: '16px',
                    position: 'relative',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                >
                  {isPro && (
                    <div style={{
                      position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                      background: gold, color: '#000',
                      padding: '3px 14px', borderRadius: '20px',
                      fontSize: '9px', fontWeight: 700, letterSpacing: isRTL ? 0 : '0.14em', textTransform: isRTL ? 'none' : 'uppercase',
                      whiteSpace: 'nowrap',
                    }}>
                      {isRTL ? 'الأكثر شيوعًا' : 'Most Popular'}
                    </div>
                  )}

                  {/* Plan icon + name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      background: isPro ? 'rgba(37,99,235,0.15)' : isDark ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.05)',
                      border: `1px solid ${isPro ? 'rgba(37,99,235,0.3)' : border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon style={{ width: '18px', height: '18px', color: isPro ? gold : textMuted }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 300, color: textMain }}>{plan.displayName}</div>
                      <div style={{ fontSize: '10px', color: textMuted }}>{plan.description}</div>
                    </div>
                  </div>

                  {/* Price */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontSize: '40px', fontWeight: 200, color: textMain, letterSpacing: '-0.03em', fontFamily: "'Inter',system-ui,sans-serif" }}>
                        {price}
                      </span>
                      {!isFree && (
                        <span style={{ fontSize: '13px', color: textMuted, fontWeight: 300 }}>
                          {isRTL ? '/ شهر' : '/ month'}
                        </span>
                      )}
                    </div>
                    {billing === 'annual' && saving > 0 && !isFree && (
                      <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px' }}>
                        {isRTL ? `وفّر ${saving}٪ سنويًا` : `Save ${saving}% annually`}
                      </div>
                    )}
                    {plan.trialDays > 0 && (
                      <div style={{ fontSize: '11px', color: gold, marginTop: '4px' }}>
                        {isRTL ? `تجربة مجانية ${plan.trialDays} يومًا مُضمَّنة` : `${plan.trialDays}-day free trial included`}
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => handleSelect(plan)}
                    style={{
                      width: '100%', padding: '12px',
                      background: isPro ? gold : 'transparent',
                      border: `1px solid ${isPro ? gold : border}`,
                      borderRadius: '8px',
                      color: isPro ? '#000' : textMain,
                      fontSize: '12px', fontWeight: isPro ? 600 : 300,
                      letterSpacing: isRTL ? 0 : '0.1em', textTransform: isRTL ? 'none' : 'uppercase',
                      cursor: 'pointer', transition: 'all 0.2s', fontFamily: font,
                      marginBottom: '28px',
                    }}
                    onMouseEnter={e => {
                      if (!isPro) { e.currentTarget.style.borderColor = gold; e.currentTarget.style.color = gold; }
                      else { e.currentTarget.style.opacity = '0.85'; }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = isPro ? gold : border;
                      e.currentTarget.style.color = isPro ? '#000' : textMain;
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    {isFree ? (isRTL ? 'ابدأ مجانًا' : 'Get Started Free') : isPro ? (isRTL ? 'ابدأ التجربة المجانية' : 'Start Free Trial') : (isRTL ? 'تواصل مع المبيعات' : 'Contact Sales')}
                  </button>

                  {/* Features */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {featureKeys.map(key => {
                      const val = plan.features?.[key];
                      const formatted = formatValue(key, val, isRTL);
                      return (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
                          {formatted !== null ? (
                            <span style={{ width: '16px', fontSize: '11px', color: gold, fontWeight: 500, flexShrink: 0 }}>
                              {formatted}
                            </span>
                          ) : val ? (
                            <Check style={{ width: '14px', height: '14px', color: '#34d399', flexShrink: 0 }} />
                          ) : (
                            <X style={{ width: '14px', height: '14px', color: isDark ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.2)', flexShrink: 0 }} />
                          )}
                          <span style={{ fontSize: '12px', fontWeight: 300, color: val !== false ? textMain : textMuted }}>
                            {isRTL ? FEATURE_LABELS[key].ar : FEATURE_LABELS[key].en}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FAQ bottom */}
        <div style={{ textAlign: 'center', padding: '40px 0', borderTop: `1px solid ${border}` }}>
          <p style={{ fontSize: '14px', fontWeight: 300, color: textMuted, marginBottom: '8px' }}>
            {isRTL ? 'لديك أسئلة؟ نحن هنا للمساعدة.' : "Questions? We're here to help."}
          </p>
          <Link to="/feedback" style={{ fontSize: '13px', color: gold, textDecoration: 'none' }}>
            {isRTL ? '← تواصل مع فريقنا' : 'Contact our team →'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
