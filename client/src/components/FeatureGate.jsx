import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Lock, Zap } from 'lucide-react';
import { selectCanAccess, selectCurrentPlan } from '../store/billingSlice';

const PLAN_LABELS = { FREE: 'Starter', PROFESSIONAL: 'Professional', ENTERPRISE: 'Enterprise' };

const FeatureGate = ({ requires, feature, children, inline = false }) => {
  const canAccess   = useSelector(selectCanAccess(requires));
  const currentPlan = useSelector(selectCurrentPlan);

  if (canAccess) return children;

  if (inline) {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '4px 10px',
        background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.18)',
        borderRadius: '6px', fontSize: '11px', fontWeight: 500, color: '#6B7280', cursor: 'default',
      }}>
        <Lock style={{ width: '11px', height: '11px', color: '#2563EB' }} />
        {PLAN_LABELS[requires]} feature
      </div>
    );
  }

  return (
    <div style={{
      padding: '32px 24px',
      background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.15)',
      borderRadius: '12px', textAlign: 'center',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
      }}>
        <Lock style={{ width: '20px', height: '20px', color: '#2563EB' }} />
      </div>

      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0D1117', marginBottom: '8px' }}>
        {feature || `${PLAN_LABELS[requires]} Feature`}
      </h3>

      <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px', lineHeight: 1.6 }}>
        This feature is available on the <strong style={{ color: '#2563EB' }}>{PLAN_LABELS[requires]}</strong> plan.
        You're on <strong style={{ color: '#0D1117' }}>{PLAN_LABELS[currentPlan] || currentPlan}</strong>.
      </p>

      <Link
        to="/app/billing"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          padding: '10px 20px',
          background: '#2563EB', borderRadius: '8px',
          color: '#FFFFFF', fontSize: '12px', fontWeight: 600,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          textDecoration: 'none', transition: 'background 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#1D4ED8'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#2563EB'; }}
      >
        <Zap style={{ width: '12px', height: '12px' }} />
        Upgrade Now
      </Link>
    </div>
  );
};

export default FeatureGate;
