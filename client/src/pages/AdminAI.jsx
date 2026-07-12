import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, TrendingUp, DollarSign, Zap, BarChart3 } from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';

const TK = {
  bg:        '#F6F7F9',
  surface:   '#FFFFFF',
  border:    '#E8EBF0',
  accent:    '#2563EB',
  text:      '#0D1117',
  textMuted: '#6B7280',
};

const PRIORITY_CFG = {
  high:   { color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  low:    { color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
};

const FEATURE_LABELS = {
  insight:         'Dashboard Insight',
  brief:           'Brief Generator',
  estimator:       'Estimator',
  proposal:        'Proposal',
  project_summary: 'Project Summary',
  message_summary: 'Message Summary',
  onboarding:      'Onboarding',
  chat:            'Chat Widget',
  admin_insights:  'Admin Insights',
};

const AdminAI = () => {
  const { dir } = useLanguage();

  const [insights,  setInsights]  = useState([]);
  const [usage,     setUsage]     = useState({ records: [], aggregates: {}, total: 0 });
  const [loading,   setLoading]   = useState(true);
  const [insightLoading, setInsightLoading] = useState(false);
  const [aiError,   setAIError]   = useState(null);
  const [page,      setPage]      = useState(1);

  const fetchUsage = async (p = 1) => {
    try {
      setLoading(true);
      const res = await api.get('/ai/admin/usage', { params: { page: p, limit: 20 } });
      setUsage(res.data);
      setPage(p);
    } catch (err) {
      console.error('AI usage fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async () => {
    setInsightLoading(true);
    setAIError(null);
    try {
      const res = await api.post('/ai/admin/insights');
      setInsights(res.data.insights || []);
    } catch (err) {
      const code = err.response?.data?.code;
      setAIError(code === 'AI_NOT_CONFIGURED' ? 'not_configured' : 'failed');
    } finally {
      setInsightLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage(1);
    fetchInsights();
  }, []);

  const totalCost    = usage.aggregates?.totalCostUSD || 0;
  const totalReqs    = usage.aggregates?.totalRequests || 0;
  const successCount = usage.aggregates?.successCount  || 0;
  const totalTokens  = (usage.aggregates?.totalInputTokens || 0) + (usage.aggregates?.totalOutputTokens || 0);

  return (
    <div dir={dir} style={{ minHeight: '100vh', background: TK.bg, color: TK.text, padding: '32px 32px 60px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(37,99,235,0.25)', background: 'rgba(37,99,235,0.06)', marginBottom: '10px' }}>
          <Sparkles style={{ width: '10px', height: '10px', color: TK.accent }} />
          <span style={{ fontSize: '10px', fontWeight: 400, color: TK.accent, letterSpacing: '0.12em', textTransform: 'uppercase' }}>AI Control Center</span>
        </div>
        <h1 style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: 600, color: TK.text, margin: 0, fontFamily: "'Inter',system-ui,sans-serif" }}>
          AI Dashboard
        </h1>
        <p style={{ fontSize: '13px', color: TK.textMuted, marginTop: '6px' }}>Usage analytics, costs, and AI-generated platform insights.</p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total Requests', value: totalReqs.toLocaleString(), icon: Zap, color: '#a78bfa' },
          { label: 'Success Rate',   value: totalReqs ? `${Math.round(successCount / totalReqs * 100)}%` : '—', icon: TrendingUp, color: '#34d399' },
          { label: 'Total Tokens',   value: totalTokens > 1000 ? `${Math.round(totalTokens/1000)}k` : totalTokens.toString(), icon: BarChart3, color: '#60a5fa' },
          { label: 'Total Cost',     value: `$${totalCost.toFixed(4)}`, icon: DollarSign, color: TK.accent },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ padding: '18px', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '10px' }}>
            <Icon style={{ width: '16px', height: '16px', color, marginBottom: '10px' }} />
            <div style={{ fontSize: '24px', fontWeight: 600, color: TK.text, letterSpacing: '-0.02em' }}>{value}</div>
            <div style={{ fontSize: '10px', color: TK.textMuted, marginTop: '4px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* AI Insights from Claude */}
      <div style={{ padding: '22px', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles style={{ width: '14px', height: '14px', color: TK.accent }} />
            <h2 style={{ fontSize: '11px', fontWeight: 400, color: TK.text, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
              Platform Insights — Powered by Claude
            </h2>
          </div>
          <button
            onClick={fetchInsights}
            disabled={insightLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: 'transparent', border: `1px solid ${TK.border}`, borderRadius: '6px', color: TK.textMuted, fontSize: '10px', cursor: insightLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { if (!insightLoading) { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.4)'; e.currentTarget.style.color = TK.accent; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = TK.border; e.currentTarget.style.color = TK.textMuted; }}
          >
            <RefreshCw style={{ width: '11px', height: '11px', animation: insightLoading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {insightLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 0' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(37,99,235,0.15)', borderTopColor: TK.accent, animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '13px', color: TK.textMuted, fontStyle: 'italic' }}>Analyzing platform data with Claude…</span>
          </div>
        )}

        {!insightLoading && aiError === 'not_configured' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px' }}>
            <AlertTriangle style={{ width: '14px', height: '14px', color: '#f59e0b' }} />
            <span style={{ fontSize: '12px', color: '#f59e0b' }}>AI not configured. Add ANTHROPIC_API_KEY to server .env to enable insights.</span>
          </div>
        )}

        {!insightLoading && aiError === 'failed' && (
          <p style={{ fontSize: '12px', color: TK.textMuted }}>Failed to generate insights. <button onClick={fetchInsights} style={{ background: 'none', border: 'none', color: TK.accent, cursor: 'pointer', fontSize: '12px' }}>Retry</button></p>
        )}

        {!insightLoading && insights.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {insights.map((ins, i) => {
              const cfg = PRIORITY_CFG[ins.priority] || PRIORITY_CFG.medium;
              return (
                <div key={i} style={{ padding: '16px', background: 'rgba(0,0,0,0.02)', border: `1px solid ${TK.border}`, borderRadius: '8px', borderLeft: `3px solid ${cfg.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 400, color: TK.text }}>{ins.title}</span>
                    <span style={{ padding: '1px 7px', borderRadius: '8px', fontSize: '9px', background: cfg.bg, color: cfg.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{ins.priority}</span>
                  </div>
                  <p style={{ fontSize: '12px', fontWeight: 300, color: TK.textMuted, margin: '0 0 8px', lineHeight: 1.6 }}>{ins.insight}</p>
                  {ins.action && (
                    <div style={{ fontSize: '11px', color: TK.accent }}>→ {ins.action}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Usage log */}
      <div style={{ padding: '22px', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <BarChart3 style={{ width: '14px', height: '14px', color: TK.accent }} />
          <h2 style={{ fontSize: '11px', fontWeight: 400, color: TK.text, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
            Usage Log ({usage.total?.toLocaleString() || 0} records)
          </h2>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid rgba(37,99,235,0.15)', borderTopColor: TK.accent, animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.8fr 0.8fr 0.8fr 0.6fr', padding: '8px 12px', fontSize: '9px', fontWeight: 400, color: TK.textMuted, letterSpacing: '0.12em', textTransform: 'uppercase', borderBottom: `1px solid ${TK.border}` }}>
                <span>User</span><span>Feature</span><span>Tokens</span><span>Cost</span><span>Duration</span><span>Status</span>
              </div>
              {usage.records.map(rec => (
                <div key={rec._id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.8fr 0.8fr 0.8fr 0.6fr', padding: '9px 12px', alignItems: 'center', borderBottom: `1px solid rgba(0,0,0,0.03)` }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: TK.text }}>{rec.user?.fullName || 'Unknown'}</div>
                    <div style={{ fontSize: '9px', color: TK.textMuted }}>{rec.user?.email}</div>
                  </div>
                  <span style={{ fontSize: '10px', color: TK.textMuted }}>{FEATURE_LABELS[rec.feature] || rec.feature}</span>
                  <span style={{ fontSize: '10px', color: TK.textMuted }}>{((rec.inputTokens || 0) + (rec.outputTokens || 0)).toLocaleString()}</span>
                  <span style={{ fontSize: '10px', color: TK.textMuted }}>${(rec.estimatedCostUSD || 0).toFixed(5)}</span>
                  <span style={{ fontSize: '10px', color: TK.textMuted }}>{rec.durationMs ? `${(rec.durationMs / 1000).toFixed(1)}s` : '—'}</span>
                  <span style={{ fontSize: '9px', color: rec.success ? '#34d399' : '#f87171' }}>{rec.success ? 'OK' : 'ERR'}</span>
                </div>
              ))}
            </div>

            {usage.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                <button onClick={() => fetchUsage(page - 1)} disabled={page <= 1} style={{ padding: '5px 12px', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '6px', color: TK.textMuted, fontSize: '11px', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>Previous</button>
                <span style={{ padding: '5px 10px', fontSize: '11px', color: TK.textMuted }}>Page {page} of {usage.totalPages}</span>
                <button onClick={() => fetchUsage(page + 1)} disabled={page >= usage.totalPages} style={{ padding: '5px 12px', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '6px', color: TK.textMuted, fontSize: '11px', cursor: page >= usage.totalPages ? 'not-allowed' : 'pointer', opacity: page >= usage.totalPages ? 0.4 : 1 }}>Next</button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default AdminAI;
