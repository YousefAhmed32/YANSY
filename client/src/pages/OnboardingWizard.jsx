import { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Phone, Globe, Building2, Briefcase, Target, ChevronRight,
  ChevronLeft, Check, Sparkles, MapPin,
} from 'lucide-react';
import api from '../utils/api';
import { getMe } from '../store/authSlice';
import { useTheme } from '../contexts/ThemeContext';

// ─────────────────────────────────────────────────────────────────────────────
// CSS injected once — all theming via CSS custom properties
// ─────────────────────────────────────────────────────────────────────────────
const STYLES = `
  .ob-root {
    min-height: 100vh;
    background: var(--ob-bg);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    font-family: 'Inter', system-ui, sans-serif;
  }

  /* ── Progress ── */
  .ob-progress-wrap { width: 100%; max-width: 540px; margin-bottom: 24px; }
  .ob-progress-row  { display: flex; justify-content: space-between; margin-bottom: 8px; }
  .ob-progress-label { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ob-muted); }
  .ob-progress-pct   { font-size: 10px; letter-spacing: 0.06em; color: var(--ob-gold); }
  .ob-progress-track {
    height: 3px; background: var(--ob-track); border-radius: 2px; overflow: hidden;
  }
  .ob-progress-bar {
    height: 100%; background: var(--ob-gold); border-radius: 2px;
    transition: width 0.4s ease;
  }

  /* ── Card ── */
  .ob-card {
    width: 100%; max-width: 540px;
    background: var(--ob-card);
    border: 1px solid var(--ob-border);
    border-radius: 20px;
    padding: 40px 40px 32px;
    box-shadow: var(--ob-shadow);
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 0.35s cubic-bezier(.22,.68,0,1.2), transform 0.35s cubic-bezier(.22,.68,0,1.2);
  }
  .ob-card.ob-card--visible { opacity: 1; transform: translateY(0); }

  /* ── Header ── */
  .ob-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 3px 10px; border-radius: 20px;
    border: 1px solid rgba(212,175,55,0.25);
    background: rgba(212,175,55,0.08);
    margin-bottom: 14px;
  }
  .ob-badge-text {
    font-size: 9px; font-weight: 500; color: var(--ob-gold);
    letter-spacing: 0.14em; text-transform: uppercase;
  }
  .ob-title {
    font-size: 24px; font-weight: 600; color: var(--ob-text);
    margin: 0 0 6px; letter-spacing: -0.02em;
  }
  .ob-subtitle { font-size: 13px; color: var(--ob-muted); margin: 0; font-weight: 300; }

  /* ── Step content ── */
  .ob-content { margin-bottom: 28px; }

  /* Welcome */
  .ob-welcome { text-align: center; padding: 16px 0; }
  .ob-avatar {
    width: 72px; height: 72px; border-radius: 50%; margin: 0 auto 20px;
    background: linear-gradient(135deg, rgba(212,175,55,0.3), rgba(212,175,55,0.06));
    border: 2px solid rgba(212,175,55,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; font-weight: 700; color: var(--ob-gold);
  }
  .ob-welcome-title { font-size: 18px; font-weight: 500; color: var(--ob-text); margin: 0 0 10px; }
  .ob-welcome-body  { font-size: 13px; color: var(--ob-muted); line-height: 1.65; margin: 0; }
  .ob-welcome-body strong { color: var(--ob-text); }
  .ob-benefits {
    display: flex; gap: 12px; margin-top: 24px;
    padding: 16px; border-radius: 12px;
    background: var(--ob-benefit-bg);
    border: 1px solid rgba(212,175,55,0.15);
    text-align: center;
  }
  .ob-benefit {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; gap: 6px;
  }
  .ob-benefit-text { font-size: 10px; color: var(--ob-muted); line-height: 1.4; font-weight: 300; }

  /* Fields */
  .ob-fields   { display: flex; flex-direction: column; gap: 16px; }
  .ob-fields-lg { display: flex; flex-direction: column; gap: 18px; }
  .ob-grid-2   { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  .ob-label {
    font-size: 10px; font-weight: 500; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--ob-muted);
    display: block; margin-bottom: 8px;
  }
  .ob-label-required { color: var(--ob-gold); }

  .ob-input-wrap {
    display: flex; align-items: center; gap: 10px;
    background: var(--ob-input-bg);
    border: 1px solid var(--ob-input-border);
    border-radius: 10px; padding: 12px 16px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .ob-input-wrap:focus-within {
    border-color: rgba(212,175,55,0.6);
    box-shadow: 0 0 0 3px rgba(212,175,55,0.08);
  }
  .ob-input-wrap:focus-within .ob-input-icon { color: var(--ob-gold); }
  .ob-input-icon {
    width: 15px; height: 15px; flex-shrink: 0;
    color: var(--ob-muted); transition: color 0.2s;
  }
  .ob-input {
    flex: 1; background: transparent; border: none; outline: none;
    color: var(--ob-text); font-size: 14px; font-weight: 300;
    font-family: inherit;
  }
  .ob-input::placeholder { color: var(--ob-muted); }

  /* Chips */
  .ob-chips      { display: flex; flex-wrap: wrap; gap: 8px; }
  .ob-chip {
    padding: 8px 16px; border-radius: 20px;
    border: 1px solid var(--ob-chip-border);
    background: transparent; color: var(--ob-muted);
    font-size: 12px; font-weight: 300; cursor: pointer;
    transition: all 0.18s; letter-spacing: 0.04em;
    font-family: inherit;
  }
  .ob-chip:hover  { border-color: rgba(212,175,55,0.35); color: var(--ob-gold); }
  .ob-chip--active {
    border-color: var(--ob-gold);
    background: rgba(212,175,55,0.12);
    color: var(--ob-gold); font-weight: 500;
  }
  .ob-chips-hint { font-size: 12px; color: var(--ob-muted); margin-bottom: 14px; font-weight: 300; }

  /* Error */
  .ob-error {
    padding: 10px 14px; border-radius: 8px; margin-bottom: 16px;
    background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.2);
    color: #f87171; font-size: 12px;
  }

  /* Navigation */
  .ob-nav { display: flex; align-items: center; justify-content: space-between; }
  .ob-btn-back {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 18px; background: transparent;
    border: 1px solid var(--ob-border); border-radius: 10px;
    color: var(--ob-muted); font-size: 12px; font-weight: 400;
    cursor: pointer; transition: border-color 0.2s; font-family: inherit;
  }
  .ob-btn-back:hover { border-color: rgba(212,175,55,0.4); }
  .ob-btn-back:disabled { opacity: 0; pointer-events: none; }

  .ob-btn-next {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 28px; border: none; border-radius: 10px;
    font-size: 12px; font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase;
    cursor: pointer; transition: all 0.2s; font-family: inherit;
    background: var(--ob-gold); color: #000;
  }
  .ob-btn-next:disabled {
    background: rgba(212,175,55,0.15);
    color: rgba(212,175,55,0.4); cursor: not-allowed;
  }
  .ob-btn-next--saving { opacity: 0.7; }

  .ob-skip-wrap { text-align: center; margin-top: 14px; }
  .ob-btn-skip {
    background: none; border: none; cursor: pointer;
    color: var(--ob-muted); font-size: 11px; font-weight: 300;
    letter-spacing: 0.06em; text-decoration: underline;
    text-decoration-style: dotted; text-underline-offset: 3px;
    font-family: inherit;
  }

  /* RTL flip for nav icons */
  [dir="rtl"] .ob-icon-back  { transform: scaleX(-1); }
  [dir="rtl"] .ob-icon-next  { transform: scaleX(-1); }

  /* Responsive */
  @media (max-width: 600px) {
    .ob-card   { padding: 28px 20px 24px; }
    .ob-grid-2 { grid-template-columns: 1fr; }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const InputField = ({ label, icon: Icon, value, onChange, placeholder, type = 'text', required }) => (
  <div>
    <label className="ob-label">
      {label}
      {required && <span className="ob-label-required"> *</span>}
    </label>
    <div className="ob-input-wrap">
      {Icon && <Icon className="ob-input-icon" />}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="ob-input"
      />
    </div>
  </div>
);

const SelectChips = ({ options, value, onChange }) => (
  <div className="ob-chips">
    {options.map(opt => (
      <button
        key={opt.value}
        type="button"
        className={`ob-chip${value === opt.value ? ' ob-chip--active' : ''}`}
        onClick={() => onChange(value === opt.value ? '' : opt.value)}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const OnboardingWizard = () => {
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const { isDark }  = useTheme();
  const { user }    = useSelector(s => s.auth);
  const { t, i18n } = useTranslation();

  const isRTL = i18n.dir() === 'rtl';

  const [step, setStep]       = useState(0);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [visible, setVisible] = useState(false);

  const [form, setForm] = useState({
    phoneNumber:  '',
    country:      '',
    city:         '',
    companyName:  user?.companyName || '',
    brandName:    user?.brandName   || '',
    businessType: '',
    jobRole:      '',
    website:      '',
    howFound:     '',
    primaryGoal:  '',
  });

  const cardRef = useRef(null);

  // Pure CSS transition — no GSAP
  useEffect(() => {
    setVisible(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(id);
  }, [step]);

  // Inject styles once
  useEffect(() => {
    const id = 'ob-styles';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
    return () => {};
  }, []);

  const setField = useCallback((key) => (value) => setForm(f => ({ ...f, [key]: value })), []);

  const canProceed = () => step === 1 ? form.phoneNumber.trim().length >= 7 : true;

  const handleNext = () => {
    setError('');
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    if (!form.phoneNumber.trim()) {
      setError(t('onboarding.errors.phone'));
      setStep(1);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/users/onboarding', form);
      await dispatch(getMe()).unwrap();
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || t('onboarding.errors.generic'));
      setSaving(false);
    }
  };

  // ── Build option arrays from i18n ──────────────────────────────────────────
  const buildOptions = (ns) =>
    Object.entries(t(ns, { returnObjects: true })).map(([value, label]) => ({ value, label }));

  const STEPS = [
    { id: 'welcome',  ...t('onboarding.steps.welcome',  { returnObjects: true }) },
    { id: 'contact',  ...t('onboarding.steps.contact',  { returnObjects: true }) },
    { id: 'business', ...t('onboarding.steps.business', { returnObjects: true }) },
    { id: 'goals',    ...t('onboarding.steps.goals',    { returnObjects: true }) },
    { id: 'source',   ...t('onboarding.steps.source',   { returnObjects: true }) },
  ];

  const BUSINESS_TYPES = buildOptions('onboarding.businessTypes');
  const PRIMARY_GOALS  = buildOptions('onboarding.goals');
  const HOW_FOUND      = buildOptions('onboarding.howFound');

  const currentStep = STEPS[step];
  const isLastStep  = step === STEPS.length - 1;
  const firstName   = user?.fullName?.split(' ')[0] || (isRTL ? 'هناك' : 'there');

  // ── CSS variable tokens applied inline on root ─────────────────────────────
  const cssVars = {
    '--ob-gold':       '#d4af37',
    '--ob-bg':         isDark ? '#080806' : '#f6f6f4',
    '--ob-card':       isDark ? '#0e0e0b' : '#ffffff',
    '--ob-border':     isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    '--ob-text':       isDark ? '#f0f0eb' : '#0a0a0a',
    '--ob-muted':      isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
    '--ob-shadow':     isDark ? '0 24px 80px rgba(0,0,0,0.5)' : '0 24px 80px rgba(0,0,0,0.08)',
    '--ob-track':      isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
    '--ob-input-bg':   isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
    '--ob-input-border': isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
    '--ob-chip-border': isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    '--ob-benefit-bg': isDark ? 'rgba(212,175,55,0.04)' : 'rgba(212,175,55,0.06)',
  };

  return (
    <div className="ob-root" style={cssVars} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── Progress bar ── */}
      <div className="ob-progress-wrap">
        <div className="ob-progress-row">
          <span className="ob-progress-label">
            {t('onboarding.progress.step', { current: step + 1, total: STEPS.length })}
          </span>
          <span className="ob-progress-pct">
            {t('onboarding.progress.percent', { value: Math.round(((step + 1) / STEPS.length) * 100) })}
          </span>
        </div>
        <div className="ob-progress-track">
          <div
            className="ob-progress-bar"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Card ── */}
      <div
        ref={cardRef}
        className={`ob-card${visible ? ' ob-card--visible' : ''}`}
      >
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div className="ob-badge">
            <Sparkles style={{ width: '9px', height: '9px', color: 'var(--ob-gold)' }} />
            <span className="ob-badge-text">{t('onboarding.badge')}</span>
          </div>
          <h1 className="ob-title">{currentStep.title}</h1>
          <p className="ob-subtitle">{currentStep.subtitle}</p>
        </div>

        {/* ── Step content ── */}
        <div className="ob-content">

          {/* 0 — Welcome */}
          {step === 0 && (
            <div className="ob-welcome">
              <div className="ob-avatar">
                {user?.fullName?.[0]?.toUpperCase() || '?'}
              </div>
              <h2 className="ob-welcome-title">
                {t('onboarding.welcome.greeting', { name: firstName })}
              </h2>
              <p className="ob-welcome-body">
                {t('onboarding.welcome.body')}
                <strong>{t('onboarding.welcome.bodyAccent')}</strong>
                {t('onboarding.welcome.bodyEnd')}
              </p>
              <div className="ob-benefits">
                {[
                  { icon: Phone,    key: 'contact' },
                  { icon: Target,   key: 'goals'   },
                  { icon: Sparkles, key: 'speed'   },
                ].map(({ icon: Icon, key }) => (
                  <div key={key} className="ob-benefit">
                    <Icon style={{ width: '16px', height: '16px', color: 'var(--ob-gold)' }} />
                    <span className="ob-benefit-text">
                      {t(`onboarding.welcome.benefits.${key}`)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 1 — Contact */}
          {step === 1 && (
            <div className="ob-fields">
              <InputField
                label={t('onboarding.fields.phone')}
                icon={Phone}
                value={form.phoneNumber}
                onChange={setField('phoneNumber')}
                placeholder={t('onboarding.placeholders.phone')}
                required
              />
              <div className="ob-grid-2">
                <InputField
                  label={t('onboarding.fields.country')}
                  icon={Globe}
                  value={form.country}
                  onChange={setField('country')}
                  placeholder={t('onboarding.placeholders.country')}
                />
                <InputField
                  label={t('onboarding.fields.city')}
                  icon={MapPin}
                  value={form.city}
                  onChange={setField('city')}
                  placeholder={t('onboarding.placeholders.city')}
                />
              </div>
            </div>
          )}

          {/* 2 — Business */}
          {step === 2 && (
            <div className="ob-fields-lg">
              <div className="ob-grid-2">
                <InputField
                  label={t('onboarding.fields.company')}
                  icon={Building2}
                  value={form.companyName}
                  onChange={setField('companyName')}
                  placeholder={t('onboarding.placeholders.company')}
                />
                <InputField
                  label={t('onboarding.fields.role')}
                  icon={Briefcase}
                  value={form.jobRole}
                  onChange={setField('jobRole')}
                  placeholder={t('onboarding.placeholders.role')}
                />
              </div>
              <div>
                <label className="ob-label">{t('onboarding.fields.businessType')}</label>
                <SelectChips
                  options={BUSINESS_TYPES}
                  value={form.businessType}
                  onChange={setField('businessType')}
                />
              </div>
              <InputField
                label={t('onboarding.fields.website')}
                icon={Globe}
                value={form.website}
                onChange={setField('website')}
                placeholder={t('onboarding.placeholders.website')}
              />
            </div>
          )}

          {/* 3 — Goals */}
          {step === 3 && (
            <div>
              <p className="ob-chips-hint">{t('onboarding.fields.goal')}</p>
              <SelectChips
                options={PRIMARY_GOALS}
                value={form.primaryGoal}
                onChange={setField('primaryGoal')}
              />
            </div>
          )}

          {/* 4 — Source */}
          {step === 4 && (
            <div>
              <p className="ob-chips-hint">{t('onboarding.fields.source')}</p>
              <SelectChips
                options={HOW_FOUND}
                value={form.howFound}
                onChange={setField('howFound')}
              />
            </div>
          )}

        </div>

        {/* Error */}
        {error && <div className="ob-error">{error}</div>}

        {/* Navigation */}
        <div className="ob-nav">
          <button
            className="ob-btn-back"
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ChevronLeft className="ob-icon-back" style={{ width: '14px', height: '14px' }} />
            {t('onboarding.nav.back')}
          </button>

          <button
            className={`ob-btn-next${saving ? ' ob-btn-next--saving' : ''}`}
            onClick={handleNext}
            disabled={!canProceed() || saving}
          >
            {saving
              ? t('onboarding.nav.saving')
              : isLastStep
                ? t('onboarding.nav.complete')
                : t('onboarding.nav.continue')
            }
            {!saving && (
              isLastStep
                ? <Check style={{ width: '14px', height: '14px' }} />
                : <ChevronRight className="ob-icon-next" style={{ width: '14px', height: '14px' }} />
            )}
          </button>
        </div>

        {/* Skip */}
        {step > 0 && !isLastStep && (
          <div className="ob-skip-wrap">
            <button className="ob-btn-skip" onClick={handleNext}>
              {t('onboarding.nav.skip')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingWizard;