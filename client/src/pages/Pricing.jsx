import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, X, Zap, Crown, Star, ArrowLeft } from 'lucide-react';
import { useSelector } from 'react-redux';
import api from '../utils/api';
import { useTheme } from '../contexts/ThemeContext';

const FEATURE_LABELS = {
  maxProjects:       'Projects',
  maxStorageGb:      'Storage',
  maxTeamMembers:    'Team members',
  aiFeatures:        'AI features',
  invoicing:         'Client invoicing',
  advancedAnalytics: 'Advanced analytics',
  prioritySupport:   'Priority support',
  apiAccess:         'API access',
  customBranding:    'Custom branding',
  whiteLabel:        'White-label',
  sso:               'Single Sign-On (SSO)',
};

const PLAN_ICONS = { FREE: Star, PROFESSIONAL: Zap, ENTERPRISE: Crown };

const formatValue = (key, value) => {
  if (key === 'maxProjects' || key === 'maxTeamMembers') {
    return value === -1 ? 'Unlimited' : String(value);
  }
  if (key === 'maxStorageGb') return value === -1 ? 'Unlimited' : `${value} GB`;
  return null; // boolean — shown as check/x
};

const Pricing = () => {
  const { isDark } = useTheme();
  const navigate   = useNavigate();
  const { isAuthenticated } = useSelector(s => s.auth);
  const [plans,     setPlans]     = useState([]);
  const [billing,   setBilling]   = useState('monthly'); // 'monthly' | 'annual'
  const [loading,   setLoading]   = useState(true);

  const gold      = '#d4af37';
  const bg        = isDark ? '#080806' : '#fafaf9';
  const surface   = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const border    = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textMain  = isDark ? '#f5f5f0' : '#0a0a0a';
  const textMuted = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

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
    <div style={{ minHeight: '100vh', background: bg, color: textMain, padding: '60px 24px 80px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Back link */}
        <Link
          to="/"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: textMuted, textDecoration: 'none', marginBottom: '40px' }}
          onMouseEnter={e => { e.currentTarget.style.color = gold; }}
          onMouseLeave={e => { e.currentTarget.style.color = textMuted; }}
        >
          <ArrowLeft style={{ width: '13px', height: '13px' }} />
          Back to home
        </Link>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '3px 12px', borderRadius: '20px',
            border: '1px solid rgba(212,175,55,0.25)', background: 'rgba(212,175,55,0.06)',
            marginBottom: '16px',
          }}>
            <Zap style={{ width: '10px', height: '10px', color: gold }} />
            <span style={{ fontSize: '10px', fontWeight: 400, color: gold, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Simple Pricing
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700,
            letterSpacing: '-0.03em', color: textMain, margin: '0 0 16px',
            fontFamily: "'Inter',system-ui,sans-serif",
          }}>
            Choose your plan
          </h1>
          <p style={{ fontSize: '15px', fontWeight: 300, color: textMuted, maxWidth: '480px', margin: '0 auto 32px', lineHeight: 1.6 }}>
            Start free. Scale when ready. New users get a 14-day Professional trial — no credit card required.
          </p>

          {/* Billing toggle */}
          <div style={{ display: 'inline-flex', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderRadius: '10px', padding: '4px', gap: '4px' }}>
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
                  letterSpacing: '0.06em', textTransform: 'capitalize',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {cycle === 'annual' ? 'Annual (save 20–33%)' : 'Monthly'}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid rgba(212,175,55,0.15)', borderTopColor: gold, animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '60px' }}>
            {plans.map((plan, idx) => {
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
                    background: isPro ? 'rgba(212,175,55,0.06)' : surface,
                    border: `1px solid ${isPro ? 'rgba(212,175,55,0.3)' : border}`,
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
                      fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}>
                      Most Popular
                    </div>
                  )}

                  {/* Plan icon + name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      background: isPro ? 'rgba(212,175,55,0.15)' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                      border: `1px solid ${isPro ? 'rgba(212,175,55,0.3)' : border}`,
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
                          / month
                        </span>
                      )}
                    </div>
                    {billing === 'annual' && saving > 0 && !isFree && (
                      <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px' }}>
                        Save {saving}% annually
                      </div>
                    )}
                    {plan.trialDays > 0 && (
                      <div style={{ fontSize: '11px', color: gold, marginTop: '4px' }}>
                        {plan.trialDays}-day free trial included
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
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      cursor: 'pointer', transition: 'all 0.2s',
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
                    {isFree ? 'Get Started Free' : isPro ? 'Start Free Trial' : 'Contact Sales'}
                  </button>

                  {/* Features */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {featureKeys.map(key => {
                      const val = plan.features?.[key];
                      const formatted = formatValue(key, val);
                      return (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {formatted !== null ? (
                            <span style={{ width: '16px', fontSize: '11px', color: gold, fontWeight: 500, flexShrink: 0 }}>
                              {formatted}
                            </span>
                          ) : val ? (
                            <Check style={{ width: '14px', height: '14px', color: '#34d399', flexShrink: 0 }} />
                          ) : (
                            <X style={{ width: '14px', height: '14px', color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', flexShrink: 0 }} />
                          )}
                          <span style={{ fontSize: '12px', fontWeight: 300, color: val !== false ? textMain : textMuted }}>
                            {FEATURE_LABELS[key]}
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
            Questions? We're here to help.
          </p>
          <Link to="/feedback" style={{ fontSize: '13px', color: gold, textDecoration: 'none' }}>
            Contact our team →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
