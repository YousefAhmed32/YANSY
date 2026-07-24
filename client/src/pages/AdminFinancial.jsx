import { useEffect, useState, useCallback } from 'react';
import { DollarSign, TrendingUp, Users, RefreshCw, BarChart3 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { TK, PageHeader, Card, Button, StatCard, PageSpinner } from '../admin-ui';

const AdminFinancial = () => {
  const { language } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const PLAN_COLORS = { FREE: TK.textMuted, STARTER: '#60a5fa', PRO: TK.accent, ENTERPRISE: '#a78bfa' };

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [statsRes] = await Promise.all([
        api.get('/billing/admin/financial-stats').catch(() => ({ data: null })),
      ]);
      setStats(statsRes.data);
    } catch (err) {
      toast.error(language === 'ar' ? 'فشل تحميل البيانات المالية' : 'Failed to load financial data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [language]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fmt = (n) => {
    if (!n && n !== 0) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: TK.bg }}>
        <PageSpinner />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: TK.bg, padding: '32px 32px 60px' }}>

      <PageHeader
        icon={DollarSign}
        eyebrow={language === 'ar' ? 'ذكاء الإيرادات' : 'Revenue Intelligence'}
        title={language === 'ar' ? 'لوحة البيانات المالية' : 'Financial Dashboard'}
        subtitle={language === 'ar' ? 'الإيراد الشهري · الإيراد السنوي · صحة الاشتراكات · الإيرادات' : 'MRR · ARR · Subscription Health · Revenue'}
        actions={<Button variant="secondary" icon={RefreshCw} onClick={() => fetchAll(true)} loading={refreshing}>{language === 'ar' ? 'تحديث' : 'Refresh'}</Button>}
      />

      {!stats ? (
        <Card style={{ padding: '48px', textAlign: 'center' }}>
          <BarChart3 style={{ width: '32px', height: '32px', color: TK.textMuted, margin: '0 auto 12px' }} />
          <p style={{ color: TK.textMuted, fontSize: '13px' }}>{language === 'ar' ? 'البيانات المالية غير متاحة. قم بإعداد Stripe لعرض مقاييس الإيرادات.' : 'Financial data unavailable. Configure Stripe to see revenue metrics.'}</p>
        </Card>
      ) : (
        <>
          {/* KPI Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <StatCard icon={TrendingUp} label={language === 'ar' ? 'الإيراد الشهري' : 'MRR'} value={fmt(stats.mrr)} sub={language === 'ar' ? 'الإيراد المتكرر الشهري' : 'Monthly Recurring Revenue'} trend={stats.revenueGrowth} tone="success" />
            <StatCard icon={BarChart3} label={language === 'ar' ? 'الإيراد السنوي' : 'ARR'} value={fmt(stats.arr)} sub={language === 'ar' ? 'معدل التشغيل السنوي' : 'Annual Run Rate'} tone="info" />
            <StatCard icon={Users} label={language === 'ar' ? 'الاشتراكات النشطة' : 'Active Subs'} value={stats.activeSubscriptions || 0} sub={language === 'ar' ? 'عملاء مدفوعون' : 'Paying customers'} tone="info" />
            <StatCard icon={DollarSign} label={language === 'ar' ? 'هذا الشهر' : 'This Month'} value={fmt(stats.thisMonthRevenue)} sub={language === 'ar' ? `مقابل ${fmt(stats.lastMonthRevenue)} الشهر الماضي` : `vs ${fmt(stats.lastMonthRevenue)} last month`} trend={stats.revenueGrowth} tone="purple" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            {/* Plan Breakdown */}
            <Card padding="22px">
              <h2 style={{ fontSize: '10.5px', fontWeight: 600, color: TK.textMuted, letterSpacing: '0.09em', textTransform: 'uppercase', margin: '0 0 18px' }}>
                {language === 'ar' ? 'توزيع الخطط' : 'Plan Distribution'}
              </h2>
              {stats.planBreakdown?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {stats.planBreakdown.map(p => {
                    const total = stats.planBreakdown.reduce((s, x) => s + x.count, 0);
                    const pct   = total > 0 ? Math.round((p.count / total) * 100) : 0;
                    const col   = PLAN_COLORS[p._id] || TK.accent;
                    return (
                      <div key={p._id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <span style={{ fontSize: '11.5px', fontWeight: 500, color: TK.text }}>{p.displayName || p._id}</span>
                          <span style={{ fontSize: '11.5px', color: TK.textMuted }}>{p.count} · {pct}%</span>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(0,0,0,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: '2px', transition: 'width 0.8s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: TK.textMuted }}>{language === 'ar' ? 'لا توجد بيانات اشتراك بعد.' : 'No subscription data yet.'}</p>
              )}
            </Card>

            {/* Subscription Status */}
            <Card padding="22px">
              <h2 style={{ fontSize: '10.5px', fontWeight: 600, color: TK.textMuted, letterSpacing: '0.09em', textTransform: 'uppercase', margin: '0 0 18px' }}>
                {language === 'ar' ? 'حالة الاشتراكات' : 'Subscription Status'}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {Object.entries(stats.subscriptionStatus || {}).map(([status, count]) => {
                  const colorMap = { active: TK.green, trialing: '#60a5fa', cancelled: TK.red, past_due: TK.amber, free: TK.textMuted };
                  const col = colorMap[status] || TK.textMuted;
                  return (
                    <div key={status} style={{ padding: '14px', background: `${col}10`, border: `1px solid ${col}25`, borderRadius: '9px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: col, letterSpacing: '-0.03em' }}>{count}</div>
                      <div style={{ fontSize: '10px', color: TK.textMuted, letterSpacing: '0.06em', textTransform: 'capitalize', marginTop: '3px' }}>{status.replace(/_/g, ' ')}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Invoice Summary */}
          {stats.invoiceStatus && Object.keys(stats.invoiceStatus).length > 0 && (
            <Card padding="22px" style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '10.5px', fontWeight: 600, color: TK.textMuted, letterSpacing: '0.09em', textTransform: 'uppercase', margin: '0 0 18px' }}>
                {language === 'ar' ? 'ملخص الفواتير' : 'Invoice Summary'}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                {Object.entries(stats.invoiceStatus).map(([status, data]) => {
                  const colorMap = { paid: TK.green, pending: TK.amber, overdue: TK.red, draft: TK.textMuted, cancelled: TK.red, sent: '#60a5fa' };
                  const col = colorMap[status] || TK.textMuted;
                  return (
                    <div key={status} style={{ padding: '16px', background: `${col}08`, border: `1px solid ${col}25`, borderRadius: '9px' }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: col, letterSpacing: '-0.02em' }}>{data.count}</div>
                      <div style={{ fontSize: '10px', color: TK.textMuted, letterSpacing: '0.06em', textTransform: 'capitalize', marginTop: '3px' }}>{status}</div>
                      {data.total > 0 && <div style={{ fontSize: '11px', color: TK.textMuted, marginTop: '4px' }}>{fmt(data.total)}</div>}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Recent Payments */}
          {stats.recentPayments?.length > 0 && (
            <Card padding="22px">
              <h2 style={{ fontSize: '10.5px', fontWeight: 600, color: TK.textMuted, letterSpacing: '0.09em', textTransform: 'uppercase', margin: '0 0 18px' }}>
                {language === 'ar' ? 'المدفوعات الأخيرة' : 'Recent Payments'}
              </h2>
              {stats.recentPayments.map(inv => (
                <div key={inv._id} className="au-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 4px', borderBottom: `1px solid ${TK.borderSoft}` }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: TK.text }}>{inv.client?.fullName || inv.client?.email || (language === 'ar' ? 'غير معروف' : 'Unknown')}</div>
                    <div style={{ fontSize: '10px', color: TK.textMuted }}>{inv.invoiceNumber} · {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : ''}</div>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: TK.green }}>{fmt(inv.total)}</span>
                </div>
              ))}
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default AdminFinancial;
