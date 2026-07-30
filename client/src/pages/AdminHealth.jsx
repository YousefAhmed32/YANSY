import { useEffect, useState, useCallback } from 'react';
import { Activity, Database, Mail, Cloud, Cpu, Server, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Wifi } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { TK, RADIUS, PageHeader, Card, Button, PageSpinner, StatCard } from '../admin-ui';

const SERVICE_ICONS = {
  'Database':                Database,
  'Stripe':                  Cpu,
  'Email (SMTP)':            Mail,
  'File Storage (GridFS)':   Cloud,
  'File Storage':            Cloud,
  'AI (Claude)':             Cpu,
  'Server':                  Server,
};

const statusCfg = (language) => ({
  ok:      { color: TK.green, bg: TK.greenBg, icon: CheckCircle2,  label: language === 'ar' ? 'يعمل' : 'Operational', tone: 'success' },
  warning: { color: TK.amber, bg: TK.amberBg, icon: AlertTriangle, label: language === 'ar' ? 'تحذير' : 'Warning',     tone: 'warning' },
  error:   { color: TK.red,   bg: TK.redBg,   icon: XCircle,       label: language === 'ar' ? 'خطأ' : 'Error',       tone: 'danger'  },
});

const HealthCard = ({ check, language }) => {
  const STATUS_CFG = statusCfg(language);
  const cfg = STATUS_CFG[check.status] || STATUS_CFG.warning;
  const Icon = SERVICE_ICONS[check.name] || Activity;
  const StatusIcon = cfg.icon;

  return (
    <Card hover style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', background: cfg.color, borderRadius: `${RADIUS.xl} 0 0 ${RADIUS.xl}` }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', paddingLeft: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: RADIUS.md, background: cfg.bg, border: `1px solid ${cfg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={17} style={{ color: cfg.color }} />
          </div>
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 500, color: TK.text }}>{check.name}</div>
            <div style={{ fontSize: '10.5px', color: TK.textMuted, marginTop: '2px' }}>{check.message}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: RADIUS.pill, background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
          <StatusIcon size={10} style={{ color: cfg.color }} />
          <span style={{ fontSize: '10px', color: cfg.color, fontWeight: 500 }}>{cfg.label}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', paddingLeft: '8px', flexWrap: 'wrap' }}>
        {check.latencyMs !== undefined && (
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: cfg.color, letterSpacing: '-0.02em' }}>{check.latencyMs}ms</div>
            <div style={{ fontSize: '9px', color: TK.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{language === 'ar' ? 'زمن الاستجابة' : 'Latency'}</div>
          </div>
        )}
        {check.uptimeSeconds !== undefined && (
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: TK.text, letterSpacing: '-0.02em' }}>{Math.floor(check.uptimeSeconds / 3600)}h {Math.floor((check.uptimeSeconds % 3600) / 60)}m</div>
            <div style={{ fontSize: '9px', color: TK.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{language === 'ar' ? 'وقت التشغيل' : 'Uptime'}</div>
          </div>
        )}
        {check.memoryMb !== undefined && (
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: TK.text, letterSpacing: '-0.02em' }}>{check.memoryMb} MB</div>
            <div style={{ fontSize: '9px', color: TK.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{language === 'ar' ? 'الذاكرة' : 'Memory'}</div>
          </div>
        )}
      </div>
    </Card>
  );
};

const AdminHealth = () => {
  const { language } = useLanguage();
  const STATUS_CFG = statusCfg(language);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealth = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await api.get('/admin/settings/health');
      setHealth(res.data);
      setLastChecked(new Date());
    } catch (err) {
      toast.error(language === 'ar' ? 'فشل جلب حالة النظام' : 'Failed to fetch health status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [language]);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => fetchHealth(true), 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchHealth]);

  const overallCfg = health ? (STATUS_CFG[health.status] || STATUS_CFG.warning) : null;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: TK.bg }}>
        <PageSpinner />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: TK.bg, padding: '32px 32px 60px' }}>
      <style>{`@keyframes au-pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      <PageHeader
        icon={Activity}
        eyebrow={language === 'ar' ? 'البنية التحتية' : 'Infrastructure'}
        title={language === 'ar' ? 'حالة النظام' : 'System Health'}
        subtitle={`${lastChecked ? `${language === 'ar' ? 'آخر فحص:' : 'Last checked:'} ${lastChecked.toLocaleTimeString()}` : (language === 'ar' ? 'جارٍ الفحص...' : 'Checking...')}${health?.durationMs ? ` · ${health.durationMs}ms` : ''}`}
        actions={<>
          <Button
            variant="secondary"
            icon={Wifi}
            onClick={() => setAutoRefresh(a => !a)}
            style={autoRefresh ? { borderColor: TK.greenBd, color: TK.green } : undefined}
          >
            {autoRefresh ? (language === 'ar' ? 'تلقائي (30 ث)' : 'Auto (30s)') : (language === 'ar' ? 'يدوي' : 'Manual')}
          </Button>
          <Button variant="secondary" icon={RefreshCw} onClick={() => fetchHealth(true)} loading={refreshing}>{language === 'ar' ? 'تحديث' : 'Refresh'}</Button>
        </>}
      />

      {/* Overall status banner */}
      {overallCfg && (
        <Card style={{ display: 'flex', alignItems: 'center', gap: '12px', background: overallCfg.bg, borderColor: `${overallCfg.color}30`, marginBottom: '28px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: overallCfg.color, animation: health?.status === 'ok' ? 'au-pulse 2s infinite' : 'none', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: overallCfg.color }}>
              {language === 'ar'
                ? (health.status === 'ok' ? 'جميع الأنظمة تعمل بشكل طبيعي' : health.status === 'degraded' ? 'النظام يعمل بأداء منخفض' : 'تحذيرات إعداد')
                : (health.status === 'ok' ? 'All Systems Operational' : health.status === 'degraded' ? 'System Degraded' : 'Configuration Warnings')}
            </div>
            <div style={{ fontSize: '11px', color: TK.textMuted, marginTop: '2px' }}>
              {language === 'ar'
                ? `${health.checks?.filter(c => c.status === 'ok').length}/${health.checks?.length} خدمة تعمل بشكل طبيعي`
                : `${health.checks?.filter(c => c.status === 'ok').length}/${health.checks?.length} services operational`}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '11px', color: TK.textMuted }}>
            {language === 'ar' ? 'تم الفحص:' : 'Checked:'} {new Date(health.checkedAt).toLocaleTimeString()}
          </div>
        </Card>
      )}

      {/* Service cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {health?.checks?.map((check, i) => (
          <HealthCard key={i} check={check} language={language} />
        ))}
      </div>

      {/* Status summary */}
      {health?.checks && (
        <Card padding="22px">
          <h2 style={{ fontSize: '10.5px', fontWeight: 600, color: TK.textMuted, letterSpacing: '0.09em', textTransform: 'uppercase', margin: '0 0 16px' }}>
            {language === 'ar' ? 'ملخص الخدمات' : 'Service Summary'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {['ok', 'warning', 'error'].map(status => {
              const cfg = STATUS_CFG[status];
              const count = health.checks.filter(c => c.status === status).length;
              return (
                <StatCard key={status} icon={cfg.icon} label={cfg.label} value={count} tone={cfg.tone} />
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminHealth;
