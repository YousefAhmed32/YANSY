import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle2, AlertCircle, Plus, DollarSign } from 'lucide-react';
import api from '../utils/api';
import { useSelector } from 'react-redux';
import { useLanguage } from '../contexts/LanguageContext';
import { TK } from '../admin-ui';

const STATUS_CFG = (ar) => ({
  draft:          { label: ar ? 'مسودة' : 'Draft',              color: TK.textMuted, bg: 'rgba(107,114,128,0.08)', icon: FileText },
  sent:           { label: ar ? 'بانتظار الدفع' : 'Awaiting Payment', color: TK.amber, bg: TK.amberBg,           icon: Clock },
  paid:           { label: ar ? 'مدفوعة' : 'Paid',              color: TK.green,     bg: TK.greenBg,           icon: CheckCircle2 },
  overdue:        { label: ar ? 'متأخرة' : 'Overdue',           color: TK.red,       bg: TK.redBg,             icon: AlertCircle },
  cancelled:      { label: ar ? 'ملغاة' : 'Cancelled',          color: TK.textLight, bg: 'rgba(107,114,128,0.06)', icon: FileText },
  partially_paid: { label: ar ? 'مدفوعة جزئياً' : 'Partially Paid', color: TK.accent, bg: TK.accentBg,          icon: Clock },
});

const currencySymbol = { USD: '$', EUR: '€', SAR: '﷼', AED: 'د.إ', EGP: 'ج.م', GBP: '£', KWD: 'د.ك', QAR: '﷼' };

const Invoices = () => {
  const { language, isRTL, dir } = useLanguage();
  const ar = language === 'ar';
  const { user }       = useSelector(s => s.auth);
  const isAdmin        = user?.role === 'ADMIN';

  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [stats,    setStats]    = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [inv, st] = await Promise.all([
          api.get('/invoices'),
          isAdmin ? api.get('/invoices/stats').catch(() => ({ data: null })) : Promise.resolve({ data: null }),
        ]);
        setInvoices(inv.data.invoices || []);
        setStats(st.data);
      } catch (err) {
        console.error('Invoices fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [isAdmin]);

  const formatAmount = (amount, currency) =>
    `${currencySymbol[currency] || ''}${(amount || 0).toLocaleString(ar ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const fmtDate = (d) => {
    try { return new Date(d).toLocaleDateString(ar ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
  };

  const font = isRTL ? "'IBM Plex Sans Arabic',system-ui,sans-serif" : "'Inter',system-ui,sans-serif";
  const cfg = STATUS_CFG(ar);

  return (
    <div dir={dir} style={{ minHeight: '100vh', background: TK.bg, color: TK.text, padding: 'clamp(16px,3vw,32px)', paddingBottom: 60, maxWidth: '1000px', margin: '0 auto', fontFamily: font }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 700, letterSpacing: '-0.02em', color: TK.text, margin: 0 }}>
            {ar ? 'الفواتير' : 'Invoices'}
          </h1>
          <p style={{ fontSize: '13px', color: TK.textMuted, marginTop: '5px' }}>
            {isAdmin
              ? (ar ? 'إدارة وإرسال فواتير العملاء' : 'Manage and send client invoices')
              : (ar ? 'اطّلع على فواتيرك وادفعها' : 'View and pay your invoices')}
          </p>
        </div>
        {isAdmin && (
          <button style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '9px 16px', background: TK.accentBg,
            border: `1px solid ${TK.accentBd}`, borderRadius: '9px',
            color: TK.accent, fontSize: '12.5px', fontWeight: 500,
            cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = TK.accent; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = TK.accentBg; e.currentTarget.style.color = TK.accent; }}
          >
            <Plus style={{ width: '14px', height: '14px' }} />
            {ar ? 'فاتورة جديدة' : 'New Invoice'}
          </button>
        )}
      </div>

      {/* Admin stats */}
      {isAdmin && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '22px' }}>
          {[
            { label: ar ? 'إجمالي الإيرادات' : 'Total Revenue', value: formatAmount(stats.totalRevenue, 'USD'), icon: DollarSign, color: TK.accent },
            { label: ar ? 'إجمالي الفواتير' : 'Total Invoices', value: stats.total,   icon: FileText, color: '#7c3aed' },
            { label: ar ? 'مدفوعة' : 'Paid',                    value: stats.paid,    icon: CheckCircle2, color: TK.green },
            { label: ar ? 'متأخرة' : 'Overdue',                 value: stats.overdue, icon: AlertCircle, color: TK.red },
          ].map((stat) => {
            const StatIcon = stat.icon;
            return (
              <div key={stat.label} style={{ padding: '16px', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '12px' }}>
                <StatIcon style={{ width: '16px', height: '16px', color: stat.color, marginBottom: '10px' }} />
                <div style={{ fontSize: '22px', fontWeight: 700, color: TK.text, letterSpacing: '-0.02em' }}>{stat.value}</div>
                <div style={{ fontSize: '10.5px', color: TK.textMuted, marginTop: '3px' }}>{stat.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invoice list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: '68px', borderRadius: '12px', background: TK.surface, border: `1px solid ${TK.border}`, animation: 'shimmer 1.5s infinite' }} />
          ))}
          <style>{`@keyframes shimmer{0%{opacity:1}50%{opacity:0.4}100%{opacity:1}}`}</style>
        </div>
      ) : invoices.length === 0 ? (
        <div style={{ background: TK.surface, borderRadius: '16px', border: `1px solid ${TK.border}`, textAlign: 'center', padding: '56px 24px', maxWidth: '460px', margin: '0 auto' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px', margin: '0 auto 18px',
            background: TK.accentBg, border: `1px solid ${TK.accentBd}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FileText style={{ width: '24px', height: '24px', color: TK.accent }} />
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: TK.text, marginBottom: '8px' }}>
            {ar ? 'لا فواتير بعد' : 'No invoices yet'}
          </h3>
          <p style={{ fontSize: '12.5px', color: TK.textMuted, lineHeight: 1.6, marginBottom: '20px' }}>
            {ar
              ? 'يصدر فريقنا الفواتير عند بلوغ مرحلة رئيسية في مشروعك أو عند تفعيل خطة. ستصلك إشعار عند جهوزية فاتورة جديدة للدفع.'
              : 'Invoices are issued by our team when a project milestone is reached or a plan is activated. You will receive a notification when a new invoice is ready for payment.'}
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[ar ? 'روابط دفع آمنة' : 'Secure payment links', ar ? 'إيصالات PDF' : 'PDF receipts', ar ? 'سجل المدفوعات' : 'Payment history'].map(label => (
              <span key={label} style={{
                padding: '5px 12px', borderRadius: '8px',
                background: TK.bg, border: `1px solid ${TK.border}`,
                fontSize: '11px', color: TK.textMuted,
              }}>
                {label}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {invoices.map(inv => {
            const info = cfg[inv.status] || cfg.sent;
            const StatusIcon = info.icon;
            return (
              <div
                key={inv._id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px 18px',
                  background: TK.surface, border: `1px solid ${TK.border}`,
                  borderRadius: '12px', transition: 'border-color 0.15s',
                  flexWrap: 'wrap',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = TK.accentBd; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = TK.border; }}
              >
                {/* Status icon */}
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: info.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <StatusIcon style={{ width: '16px', height: '16px', color: info.color }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: TK.text }} dir="ltr">
                      #{inv.invoiceNumber}
                    </span>
                    {inv.project?.title && (
                      <span style={{ fontSize: '11px', color: TK.textMuted }}>— {inv.project.title}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: TK.textLight }}>
                    {isAdmin && inv.client?.fullName ? `${inv.client.fullName} · ` : ''}
                    {ar ? 'الاستحقاق ' : 'Due '}{fmtDate(inv.dueDate)}
                  </div>
                </div>

                {/* Amount + status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: TK.text, letterSpacing: '-0.01em' }}>
                    {formatAmount(inv.total, inv.currency)}
                  </span>
                  <span style={{
                    padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 500,
                    background: info.bg, color: info.color,
                  }}>
                    {info.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Invoices;
