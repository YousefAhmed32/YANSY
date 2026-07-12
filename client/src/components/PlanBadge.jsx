import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Zap, Crown, Star } from 'lucide-react';
import { selectCurrentPlan, selectIsTrialing, selectTrialDaysLeft } from '../store/billingSlice';

const PLAN_CONFIG = {
  FREE:         { label: 'Free',         icon: Star,  color: '#9CA3AF',  bg: 'rgba(0,0,0,0.05)',          border: '#E8EBF0' },
  PROFESSIONAL: { label: 'Professional', icon: Zap,   color: '#2563EB',  bg: 'rgba(37,99,235,0.08)',      border: 'rgba(37,99,235,0.2)' },
  ENTERPRISE:   { label: 'Enterprise',   icon: Crown, color: '#7C3AED',  bg: 'rgba(124,58,237,0.08)',     border: 'rgba(124,58,237,0.2)' },
};

const PlanBadge = ({ collapsed = false }) => {
  const plan       = useSelector(selectCurrentPlan);
  const isTrialing = useSelector(selectIsTrialing);
  const daysLeft   = useSelector(selectTrialDaysLeft);
  const cfg        = PLAN_CONFIG[plan] || PLAN_CONFIG.FREE;
  const Icon       = cfg.icon;

  return (
    <Link
      to="/app/billing"
      style={{
        display: 'flex', alignItems: 'center', gap: '9px',
        padding: collapsed ? '9px 0' : '8px 14px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        textDecoration: 'none', transition: 'background 0.15s',
      }}
      title={collapsed ? `${cfg.label}${isTrialing ? ` — ${daysLeft}d trial` : ''}` : undefined}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{
        width: '22px', height: '22px', borderRadius: '6px',
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon style={{ width: '11px', height: '11px', color: cfg.color }} />
      </div>

      {!collapsed && (
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: 500, color: cfg.color, letterSpacing: '0.01em' }}>
            {cfg.label}
            {isTrialing && (
              <span style={{ marginLeft: '4px', fontSize: '10px', color: '#9CA3AF', fontWeight: 400 }}>
                · {daysLeft}d trial
              </span>
            )}
          </div>
          {plan === 'FREE' && (
            <div style={{ fontSize: '10px', color: '#9CA3AF', letterSpacing: '0.04em' }}>
              Upgrade →
            </div>
          )}
        </div>
      )}
    </Link>
  );
};

export default PlanBadge;
