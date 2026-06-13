import { useEffect, useState, useCallback } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Users, CreditCard, RefreshCw, Loader2, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const MetricCard = ({ title, value, subtitle, trend, icon: Icon, color, bg, isDark }) => {
  const surface = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const border  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textMain = isDark ? '#f5f5f0' : '#0a0a0a';
  const textMuted = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  const isPositive = trend > 0;
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <div style={{ padding: '20px', background: surface, border: `1px solid ${border}`, borderRadius: '12px', transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = border; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: bg, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} style={{ color }} />
        </div>
        {trend !== null && trend !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 8px', borderRadius: '10px', background: isPositive ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', color: isPositive ? '#34d399' : '#f87171', fontSize: '10px', fontWeight: 400 }}>
            <TrendIcon size={10} />
            {isPositive ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 600, color: textMain, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '5px' }}>{value}</div>
      <div style={{ fontSize: '10px', fontWeight: 400, color: textMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{title}</div>
      {subtitle && <div style={{ fontSize: '10px', color: textMuted, marginTop: '3px', fontWeight: 300 }}>{subtitle}</div>}
    </div>
  );
};

const AdminFinancial = () => {
  const { isDark } = useTheme();
  const [stats, setStats] = useState(null);
  const [subscriptions, setSubscriptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const bg       = isDark ? '#080806' : '#fafaf9';
  const surface  = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const border   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textMain = isDark ? '#f5f5f0' : '#0a0a0a';
  const textMuted = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const gold = '#d4af37';

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [statsRes, subsRes] = await Promise.all([
        api.get('/billing/admin/financial-stats').catch(() => ({ data: null })),
        api.get('/billing/admin/subscriptions?limit=10').catch(() => ({ data: null })),
      ]);
      setStats(statsRes.data);
      setSubscriptions(subsRes.data);
    } catch (err) {
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fmt = (n) => {
    if (!n && n !== 0) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ width: '28px', height: '28px', color: gold, animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const PLAN_COLORS = { FREE: '#6b7280', STARTER: '#60a5fa', PRO: '#d4af37', ENTERPRISE: '#a78bfa' };

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textMain, padding: '32px 32px 60px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(212,175,55,0.25)', background: 'rgba(212,175,55,0.06)', marginBottom: '10px' }}>
            <DollarSign style={{ width: '10px', height: '10px', color: gold }} />
            <span style={{ fontSize: '10px', fontWeight: 400, color: gold, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Revenue Intelligence</span>
          </div>
          <h1 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 600, letterSpacing: '-0.02em', color: textMain, margin: 0, fontFamily: "'Inter',system-ui,sans-serif" }}>
            Financial Dashboard
          </h1>
          <p style={{ fontSize: '12px', color: textMuted, marginTop: '6px', fontWeight: 300 }}>
            MRR · ARR · Subscription Health · Revenue
          </p>
        </div>
        <button onClick={() => fetchAll(true)} disabled={refreshing} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', background: 'transparent', border: `1px solid ${border}`, borderRadius: '8px', color: textMuted, fontSize: '11px', cursor: refreshing ? 'not-allowed' : 'pointer' }}>
          <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {!stats ? (
        <div style={{ padding: '48px', textAlign: 'center', background: surface, border: `1px solid ${border}`, borderRadius: '12px' }}>
          <BarChart3 style={{ width: '32px', height: '32px', color: textMuted, margin: '0 auto 12px' }} />
          <p style={{ color: textMuted, fontSize: '13px', fontWeight: 300 }}>Financial data unavailable. Configure Stripe to see revenue metrics.</p>
        </div>
      ) : (
        <>
          {/* KPI Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '28px' }}>
            <MetricCard title="MRR" value={fmt(stats.mrr)} subtitle="Monthly Recurring Revenue" trend={stats.revenueGrowth} icon={TrendingUp} color="#34d399" bg="rgba(52,211,153,0.1)" isDark={isDark} />
            <MetricCard title="ARR" value={fmt(stats.arr)} subtitle="Annual Run Rate" trend={null} icon={BarChart3} color="#d4af37" bg="rgba(212,175,55,0.1)" isDark={isDark} />
            <MetricCard title="Active Subs" value={stats.activeSubscriptions || 0} subtitle="Paying customers" trend={null} icon={Users} color="#60a5fa" bg="rgba(96,165,250,0.1)" isDark={isDark} />
            <MetricCard title="This Month" value={fmt(stats.thisMonthRevenue)} subtitle={`vs ${fmt(stats.lastMonthRevenue)} last month`} trend={stats.revenueGrowth} icon={DollarSign} color="#a78bfa" bg="rgba(167,139,250,0.1)" isDark={isDark} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            {/* Plan Breakdown */}
            <div style={{ padding: '22px', background: surface, border: `1px solid ${border}`, borderRadius: '12px' }}>
              <h2 style={{ fontSize: '11px', fontWeight: 400, color: textMain, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 18px' }}>
                Plan Distribution
              </h2>
              {stats.planBreakdown?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {stats.planBreakdown.map(p => {
                    const total = stats.planBreakdown.reduce((s, x) => s + x.count, 0);
                    const pct   = total > 0 ? Math.round((p.count / total) * 100) : 0;
                    const col   = PLAN_COLORS[p._id] || gold;
                    return (
                      <div key={p._id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 300, color: textMain }}>{p.displayName || p._id}</span>
                          <span style={{ fontSize: '11px', color: textMuted }}>{p.count} · {pct}%</span>
                        </div>
                        <div style={{ height: '4px', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: '2px', transition: 'width 0.8s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: textMuted, fontWeight: 300 }}>No subscription data yet.</p>
              )}
            </div>

            {/* Subscription Status */}
            <div style={{ padding: '22px', background: surface, border: `1px solid ${border}`, borderRadius: '12px' }}>
              <h2 style={{ fontSize: '11px', fontWeight: 400, color: textMain, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 18px' }}>
                Subscription Status
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {Object.entries(stats.subscriptionStatus || {}).map(([status, count]) => {
                  const colorMap = { active: '#34d399', trialing: '#60a5fa', cancelled: '#f87171', past_due: '#f59e0b', free: '#6b7280' };
                  const col = colorMap[status] || textMuted;
                  return (
                    <div key={status} style={{ padding: '14px', background: `${col}10`, border: `1px solid ${col}25`, borderRadius: '9px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 600, color: col, letterSpacing: '-0.03em' }}>{count}</div>
                      <div style={{ fontSize: '10px', color: textMuted, letterSpacing: '0.06em', textTransform: 'capitalize', marginTop: '3px' }}>{status.replace(/_/g, ' ')}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Invoice Revenue */}
          {stats.invoiceStatus && Object.keys(stats.invoiceStatus).length > 0 && (
            <div style={{ padding: '22px', background: surface, border: `1px solid ${border}`, borderRadius: '12px', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '11px', fontWeight: 400, color: textMain, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 18px' }}>
                Invoice Summary
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                {Object.entries(stats.invoiceStatus).map(([status, data]) => {
                  const colorMap = { paid: '#34d399', pending: '#f59e0b', overdue: '#f87171', draft: '#6b7280', cancelled: '#f87171', sent: '#60a5fa' };
                  const col = colorMap[status] || textMuted;
                  return (
                    <div key={status} style={{ padding: '16px', background: `${col}08`, border: `1px solid ${col}25`, borderRadius: '9px' }}>
                      <div style={{ fontSize: '20px', fontWeight: 600, color: col, letterSpacing: '-0.02em' }}>{data.count}</div>
                      <div style={{ fontSize: '10px', color: textMuted, letterSpacing: '0.06em', textTransform: 'capitalize', marginTop: '3px' }}>{status}</div>
                      {data.total > 0 && <div style={{ fontSize: '11px', color: textMuted, marginTop: '4px' }}>{fmt(data.total)}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Payments */}
          {stats.recentPayments?.length > 0 && (
            <div style={{ padding: '22px', background: surface, border: `1px solid ${border}`, borderRadius: '12px' }}>
              <h2 style={{ fontSize: '11px', fontWeight: 400, color: textMain, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 18px' }}>
                Recent Payments
              </h2>
              {stats.recentPayments.map(inv => (
                <div key={inv._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 300, color: textMain }}>{inv.client?.fullName || inv.client?.email || 'Unknown'}</div>
                    <div style={{ fontSize: '10px', color: textMuted }}>{inv.invoiceNumber} · {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : ''}</div>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 300, color: '#34d399' }}>{fmt(inv.total)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminFinancial;
