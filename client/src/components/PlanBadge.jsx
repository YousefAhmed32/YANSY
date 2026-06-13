import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Zap, Crown, Star } from 'lucide-react';
import { selectCurrentPlan, selectIsTrialing, selectTrialDaysLeft } from '../store/billingSlice';

const PLAN_CONFIG = {
  FREE:         { label: 'Free',         icon: Star,  color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.06)',  border: 'rgba(255,255,255,0.1)' },
  PROFESSIONAL: { label: 'Professional', icon: Zap,   color: '#d4af37',              bg: 'rgba(212,175,55,0.1)',   border: 'rgba(212,175,55,0.25)' },
  ENTERPRISE:   { label: 'Enterprise',   icon: Crown, color: '#a78bfa',              bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)' },
};

const PlanBadge = ({ collapsed = false }) => {
  const plan        = useSelector(selectCurrentPlan);
  const isTrialing  = useSelector(selectIsTrialing);
  const daysLeft    = useSelector(selectTrialDaysLeft);
  const cfg         = PLAN_CONFIG[plan] || PLAN_CONFIG.FREE;
  const Icon        = cfg.icon;

  return (
    <Link
      to="/app/billing"
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: collapsed ? '8px 0' : '8px 20px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        textDecoration: 'none', transition: 'all 0.2s',
      }}
      title={collapsed ? `${cfg.label}${isTrialing ? ` — ${daysLeft}d trial` : ''}` : undefined}
    >
      {/* Icon badge */}
      <div style={{
        width: '22px', height: '22px', borderRadius: '6px',
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon style={{ width: '11px', height: '11px', color: cfg.color }} />
      </div>

      {!collapsed && (
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '10px', fontWeight: 400, color: cfg.color, letterSpacing: '0.08em' }}>
            {cfg.label}
            {isTrialing && (
              <span style={{ marginLeft: '4px', fontSize: '9px', opacity: 0.7 }}>
                · {daysLeft}d trial
              </span>
            )}
          </div>
          {plan === 'FREE' && (
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>
              Upgrade →
            </div>
          )}
        </div>
      )}
    </Link>
  );
};

export default PlanBadge;
