import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Lock, Zap } from 'lucide-react';
import { selectCanAccess, selectCurrentPlan } from '../store/billingSlice';
import { useTheme } from '../contexts/ThemeContext';

const PLAN_LABELS = { FREE: 'Starter', PROFESSIONAL: 'Professional', ENTERPRISE: 'Enterprise' };

/**
 * Renders children if the user's plan meets the requirement.
 * Shows an upgrade prompt otherwise.
 *
 * @param {string} requires - Plan name: 'PROFESSIONAL' | 'ENTERPRISE'
 * @param {string} feature  - Feature display name for the upgrade message
 * @param {boolean} inline  - Show compact inline lock instead of full overlay
 */
const FeatureGate = ({ requires, feature, children, inline = false }) => {
  const { isDark } = useTheme();
  const canAccess  = useSelector(selectCanAccess(requires));
  const currentPlan = useSelector(selectCurrentPlan);

  if (canAccess) return children;

  const gold      = '#d4af37';
  const bg        = isDark ? 'rgba(212,175,55,0.05)' : 'rgba(212,175,55,0.04)';
  const border    = isDark ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.2)';
  const textMain  = isDark ? '#f5f5f0' : '#0a0a0a';
  const textMuted = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  if (inline) {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '4px 10px',
        background: bg, border: `1px solid ${border}`,
        borderRadius: '6px',
        fontSize: '11px', fontWeight: 300, color: textMuted,
        cursor: 'default',
      }}>
        <Lock style={{ width: '11px', height: '11px', color: gold }} />
        {PLAN_LABELS[requires]} feature
      </div>
    );
  }

  return (
    <div style={{
      padding: '32px 24px',
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: '12px',
      textAlign: 'center',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        background: 'rgba(212,175,55,0.1)',
        border: '1px solid rgba(212,175,55,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        <Lock style={{ width: '20px', height: '20px', color: gold }} />
      </div>

      <h3 style={{
        fontSize: '16px', fontWeight: 300, color: textMain,
        marginBottom: '8px', fontFamily: "'Inter',system-ui,sans-serif",
      }}>
        {feature || `${PLAN_LABELS[requires]} Feature`}
      </h3>

      <p style={{ fontSize: '13px', fontWeight: 300, color: textMuted, marginBottom: '20px', lineHeight: 1.6 }}>
        This feature is available on the <strong style={{ color: gold }}>{PLAN_LABELS[requires]}</strong> plan and above.
        You are currently on <strong style={{ color: textMain }}>{PLAN_LABELS[currentPlan] || currentPlan}</strong>.
      </p>

      <Link
        to="/app/billing"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          padding: '10px 20px',
          background: gold, border: 'none', borderRadius: '8px',
          color: '#000', fontSize: '11px', fontWeight: 600,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          textDecoration: 'none', transition: 'opacity 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
      >
        <Zap style={{ width: '12px', height: '12px' }} />
        Upgrade Now
      </Link>
    </div>
  );
};

export default FeatureGate;
