import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, TrendingUp, DollarSign, Zap, BarChart3 } from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { TK, PageHeader, Card, Button, StatCard, DataTable, SectionHead } from '../admin-ui';

const PRIORITY_CFG = {
  high:   { color: TK.red,   bg: TK.redBg },
  medium: { color: TK.amber, bg: TK.amberBg },
  low:    { color: TK.green, bg: TK.greenBg },
};

const FEATURE_LABELS = {
  en: {
    insight:         'Dashboard Insight',
    brief:           'Brief Generator',
    estimator:       'Estimator',
    proposal:        'Proposal',
    project_summary: 'Project Summary',
    message_summary: 'Message Summary',
    onboarding:      'Onboarding',
    chat:            'Chat Widget',
    admin_insights:  'Admin Insights',
  },
  ar: {
    insight:         'رؤية اللوحة',
    brief:           'مولد الملخص',
    estimator:       'مقدّر التكلفة',
    proposal:        'العرض المقترح',
    project_summary: 'ملخص المشروع',
    message_summary: 'ملخص الرسائل',
    onboarding:      'التهيئة',
    chat:            'نافذة الدردشة',
    admin_insights:  'رؤى الإدارة',
  },
};

const AdminAI = () => {
  const { dir, isRTL, language } = useLanguage();

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

  const usageColumns = [
    {
      key: 'user', label: language === 'ar' ? 'المستخدم' : 'User', width: '26%',
      render: (rec) => (
        <div>
          <div style={{ fontSize: '12px', color: TK.text }}>{rec.user?.fullName || (language === 'ar' ? 'غير معروف' : 'Unknown')}</div>
          <div style={{ fontSize: '10px', color: TK.textLight }}>{rec.user?.email}</div>
        </div>
      ),
    },
    {
      key: 'feature', label: language === 'ar' ? 'الميزة' : 'Feature', width: '18%',
      render: (rec) => <span style={{ fontSize: '11px', color: TK.textMuted }}>{FEATURE_LABELS[language === 'ar' ? 'ar' : 'en'][rec.feature] || rec.feature}</span>,
    },
    {
      key: 'tokens', label: language === 'ar' ? 'الرموز' : 'Tokens', width: '14%',
      render: (rec) => <span style={{ fontSize: '11px', color: TK.textMuted }}>{((rec.inputTokens || 0) + (rec.outputTokens || 0)).toLocaleString()}</span>,
    },
    {
      key: 'cost', label: language === 'ar' ? 'التكلفة' : 'Cost', width: '14%',
      render: (rec) => <span style={{ fontSize: '11px', color: TK.textMuted }}>${(rec.estimatedCostUSD || 0).toFixed(5)}</span>,
    },
    {
      key: 'duration', label: language === 'ar' ? 'المدة' : 'Duration', width: '14%',
      render: (rec) => <span style={{ fontSize: '11px', color: TK.textMuted }}>{rec.durationMs ? `${(rec.durationMs / 1000).toFixed(1)}s` : '—'}</span>,
    },
    {
      key: 'status', label: language === 'ar' ? 'الحالة' : 'Status', width: '10%',
      render: (rec) => <span style={{ fontSize: '10px', fontWeight: 600, color: rec.success ? TK.green : TK.red }}>{rec.success ? (language === 'ar' ? 'ناجح' : 'OK') : (language === 'ar' ? 'خطأ' : 'ERR')}</span>,
    },
  ];

  return (
    <div dir={dir} style={{ minHeight: '100vh', background: TK.bg, padding: '32px 32px 60px' }}>

      <PageHeader
        icon={Sparkles}
        eyebrow={language === 'ar' ? 'مركز تحكم الذكاء الاصطناعي' : 'AI Control Center'}
        title={language === 'ar' ? 'لوحة الذكاء الاصطناعي' : 'AI Dashboard'}
        subtitle={language === 'ar' ? 'تحليلات الاستخدام والتكاليف ورؤى المنصة المولدة بالذكاء الاصطناعي.' : 'Usage analytics, costs, and AI-generated platform insights.'}
      />

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <StatCard icon={Zap} label={language === 'ar' ? 'إجمالي الطلبات' : 'Total Requests'} value={totalReqs.toLocaleString()} tone="purple" />
        <StatCard icon={TrendingUp} label={language === 'ar' ? 'معدل النجاح' : 'Success Rate'} value={totalReqs ? `${Math.round(successCount / totalReqs * 100)}%` : '—'} tone="success" />
        <StatCard icon={BarChart3} label={language === 'ar' ? 'إجمالي الرموز' : 'Total Tokens'} value={totalTokens > 1000 ? `${Math.round(totalTokens / 1000)}k` : totalTokens.toString()} tone="info" />
        <StatCard icon={DollarSign} label={language === 'ar' ? 'إجمالي التكلفة' : 'Total Cost'} value={`$${totalCost.toFixed(4)}`} tone="info" />
      </div>

      {/* AI Insights from Claude */}
      <Card padding="22px" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles style={{ width: '13px', height: '13px', color: TK.accent }} />
            <h2 style={{ fontSize: '10.5px', fontWeight: 600, color: TK.textMuted, letterSpacing: '0.09em', textTransform: 'uppercase', margin: 0 }}>
              {language === 'ar' ? 'رؤى المنصة — مدعومة بواسطة Claude' : 'Platform Insights — Powered by Claude'}
            </h2>
          </div>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchInsights} loading={insightLoading}>{language === 'ar' ? 'تحديث' : 'Refresh'}</Button>
        </div>

        {insightLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 0' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${TK.accentBg}`, borderTopColor: TK.accent, animation: 'au-spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '13px', color: TK.textMuted, fontStyle: 'italic' }}>{language === 'ar' ? 'جارٍ تحليل بيانات المنصة باستخدام Claude…' : 'Analyzing platform data with Claude…'}</span>
          </div>
        )}

        {!insightLoading && aiError === 'not_configured' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: TK.amberBg, border: `1px solid ${TK.amberBd}`, borderRadius: '8px' }}>
            <AlertTriangle style={{ width: '14px', height: '14px', color: TK.amber }} />
            <span style={{ fontSize: '12px', color: TK.amber }}>{language === 'ar' ? 'الذكاء الاصطناعي غير مُهيأ. أضف ANTHROPIC_API_KEY إلى ملف .env بالخادم لتفعيل الرؤى.' : 'AI not configured. Add ANTHROPIC_API_KEY to server .env to enable insights.'}</span>
          </div>
        )}

        {!insightLoading && aiError === 'failed' && (
          <p style={{ fontSize: '12px', color: TK.textMuted }}>{language === 'ar' ? 'فشل توليد الرؤى.' : 'Failed to generate insights.'} <button onClick={fetchInsights} style={{ background: 'none', border: 'none', color: TK.accent, cursor: 'pointer', fontSize: '12px' }}>{language === 'ar' ? 'إعادة المحاولة' : 'Retry'}</button></p>
        )}

        {!insightLoading && insights.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {insights.map((ins, i) => {
              const cfg = PRIORITY_CFG[ins.priority] || PRIORITY_CFG.medium;
              return (
                <div key={i} style={{ padding: '16px', background: TK.bgSubtle, border: `1px solid ${TK.border}`, borderRadius: '8px', borderLeft: `3px solid ${cfg.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: TK.text }}>{ins.title}</span>
                    <span style={{ padding: '1px 7px', borderRadius: '8px', fontSize: '9px', background: cfg.bg, color: cfg.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{ins.priority}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: TK.textMuted, margin: '0 0 8px', lineHeight: 1.6 }}>{ins.insight}</p>
                  {ins.action && (
                    <div style={{ fontSize: '11px', color: TK.accent }}>→ {ins.action}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Usage log */}
      <SectionHead icon={BarChart3} title={language === 'ar' ? `سجل الاستخدام (${usage.total?.toLocaleString() || 0} سجل)` : `Usage Log (${usage.total?.toLocaleString() || 0} records)`} />
      <DataTable
        columns={usageColumns}
        rows={usage.records}
        getRowId={(r) => r._id}
        loading={loading}
        emptyIcon={BarChart3}
        emptyTitle={language === 'ar' ? 'لا توجد سجلات استخدام' : 'No usage records'}
        isRTL={isRTL}
        page={page}
        totalPages={usage.totalPages || 1}
        onPageChange={(p) => fetchUsage(p)}
      />
    </div>
  );
};

export default AdminAI;
