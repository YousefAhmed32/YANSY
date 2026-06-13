import { useEffect, useState, useCallback } from 'react';
import { Activity, Database, Mail, Cloud, Cpu, Server, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Clock, Loader2, Wifi } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const SERVICE_ICONS = {
  'Database':                Database,
  'Stripe':                  Cpu,
  'Email (SMTP)':            Mail,
  'File Storage (Cloudinary)': Cloud,
  'File Storage':            Cloud,
  'AI (Claude)':             Cpu,
  'Server':                  Server,
};

const STATUS_CFG = {
  ok:      { color: '#34d399', bg: 'rgba(52,211,153,0.1)',   icon: CheckCircle2,   label: 'Operational' },
  warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   icon: AlertTriangle,  label: 'Warning'     },
  error:   { color: '#f87171', bg: 'rgba(248,113,113,0.1)',  icon: XCircle,        label: 'Error'       },
};

const HealthCard = ({ check, isDark }) => {
  const cfg = STATUS_CFG[check.status] || STATUS_CFG.warning;
  const Icon = SERVICE_ICONS[check.name] || Activity;
  const StatusIcon = cfg.icon;

  const surface = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const border  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textMain = isDark ? '#f5f5f0' : '#0a0a0a';
  const textMuted = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  return (
    <div style={{ padding: '20px', background: surface, border: `1px solid ${border}`, borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', background: cfg.color, borderRadius: '12px 0 0 12px' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', paddingLeft: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: cfg.bg, border: `1px solid ${cfg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={17} style={{ color: cfg.color }} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 300, color: textMain }}>{check.name}</div>
            <div style={{ fontSize: '10px', color: textMuted, marginTop: '2px' }}>{check.message}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
          <StatusIcon size={10} style={{ color: cfg.color }} />
          <span style={{ fontSize: '10px', color: cfg.color, fontWeight: 400 }}>{cfg.label}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', paddingLeft: '8px', flexWrap: 'wrap' }}>
        {check.latencyMs !== undefined && (
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: cfg.color, letterSpacing: '-0.02em' }}>{check.latencyMs}ms</div>
            <div style={{ fontSize: '9px', color: textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Latency</div>
          </div>
        )}
        {check.uptimeSeconds !== undefined && (
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: textMain, letterSpacing: '-0.02em' }}>{Math.floor(check.uptimeSeconds / 3600)}h {Math.floor((check.uptimeSeconds % 3600) / 60)}m</div>
            <div style={{ fontSize: '9px', color: textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Uptime</div>
          </div>
        )}
        {check.memoryMb !== undefined && (
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: textMain, letterSpacing: '-0.02em' }}>{check.memoryMb} MB</div>
            <div style={{ fontSize: '9px', color: textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Memory</div>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminHealth = () => {
  const { isDark } = useTheme();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const bg       = isDark ? '#080806' : '#fafaf9';
  const surface  = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const border   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textMain = isDark ? '#f5f5f0' : '#0a0a0a';
  const textMuted = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const gold = '#d4af37';

  const fetchHealth = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await api.get('/admin/settings/health');
      setHealth(res.data);
      setLastChecked(new Date());
    } catch (err) {
      toast.error('Failed to fetch health status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => fetchHealth(true), 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchHealth]);

  const overallCfg = health ? (STATUS_CFG[health.status] || STATUS_CFG.warning) : null;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ width: '28px', height: '28px', color: gold, animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textMain, padding: '32px 32px 60px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(212,175,55,0.25)', background: 'rgba(212,175,55,0.06)', marginBottom: '10px' }}>
            <Activity style={{ width: '10px', height: '10px', color: gold }} />
            <span style={{ fontSize: '10px', fontWeight: 400, color: gold, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Infrastructure</span>
          </div>
          <h1 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 600, letterSpacing: '-0.02em', color: textMain, margin: 0, fontFamily: "'Inter',system-ui,sans-serif" }}>
            System Health
          </h1>
          <p style={{ fontSize: '12px', color: textMuted, marginTop: '6px', fontWeight: 300 }}>
            {lastChecked ? `Last checked: ${lastChecked.toLocaleTimeString()}` : 'Checking...'}
            {health?.durationMs && ` · ${health.durationMs}ms`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setAutoRefresh(a => !a)}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', background: 'transparent', border: `1px solid ${autoRefresh ? 'rgba(52,211,153,0.4)' : border}`, borderRadius: '8px', color: autoRefresh ? '#34d399' : textMuted, fontSize: '11px', cursor: 'pointer' }}
          >
            <Wifi size={13} />
            {autoRefresh ? 'Auto (30s)' : 'Manual'}
          </button>
          <button
            onClick={() => fetchHealth(true)}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', background: 'transparent', border: `1px solid ${border}`, borderRadius: '8px', color: textMuted, fontSize: '11px', cursor: refreshing ? 'not-allowed' : 'pointer' }}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overall status banner */}
      {overallCfg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: overallCfg.bg, border: `1px solid ${overallCfg.color}30`, borderRadius: '10px', marginBottom: '28px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: overallCfg.color, animation: health?.status === 'ok' ? 'pulse 2s infinite' : 'none', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 300, color: overallCfg.color }}>
              {health.status === 'ok' ? 'All Systems Operational' : health.status === 'degraded' ? 'System Degraded' : 'Configuration Warnings'}
            </div>
            <div style={{ fontSize: '11px', color: textMuted, marginTop: '2px' }}>
              {health.checks?.filter(c => c.status === 'ok').length}/{health.checks?.length} services operational
            </div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '11px', color: textMuted }}>
            Checked: {new Date(health.checkedAt).toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Service cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {health?.checks?.map((check, i) => (
          <HealthCard key={i} check={check} isDark={isDark} />
        ))}
      </div>

      {/* Status summary table */}
      {health?.checks && (
        <div style={{ padding: '22px', background: surface, border: `1px solid ${border}`, borderRadius: '12px' }}>
          <h2 style={{ fontSize: '11px', fontWeight: 400, color: textMain, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 16px' }}>
            Service Summary
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {['ok', 'warning', 'error'].map(status => {
              const cfg = STATUS_CFG[status];
              const count = health.checks.filter(c => c.status === status).length;
              const Icon = cfg.icon;
              return (
                <div key={status} style={{ padding: '16px', background: cfg.bg, border: `1px solid ${cfg.color}25`, borderRadius: '9px', textAlign: 'center' }}>
                  <Icon size={22} style={{ color: cfg.color, margin: '0 auto 6px' }} />
                  <div style={{ fontSize: '28px', fontWeight: 600, color: cfg.color, letterSpacing: '-0.03em' }}>{count}</div>
                  <div style={{ fontSize: '10px', color: textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{cfg.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHealth;
