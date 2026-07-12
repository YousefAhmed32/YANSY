import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CreditCard, Download, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const TK = {
  bg:        '#F6F7F9',
  surface:   '#FFFFFF',
  border:    '#E8EBF0',
  accent:    '#2563EB',
  accentBg:  'rgba(37,99,235,0.06)',
  text:      '#0D1117',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
};

const INV_STATUS = {
  PAID:    { en: 'Paid',    ar: 'مدفوعة', bg: 'rgba(22,163,74,0.08)',  color: '#16a34a', icon: CheckCircle2 },
  PENDING: { en: 'Pending', ar: 'معلقة',  bg: 'rgba(217,119,6,0.08)', color: '#d97706', icon: Clock },
  OVERDUE: { en: 'Overdue', ar: 'متأخرة', bg: 'rgba(220,38,38,0.08)', color: '#dc2626', icon: AlertCircle },
};

const Payments = () => {
  const { language, isRTL } = useLanguage();
  const { user } = useSelector(s => s.auth);

  const [invoices, setInvoices]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [activeTab, setActiveTab]     = useState('invoices');

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const token   = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${apiBase}/billing/invoices`,     { headers }).then(r => r.ok ? r.json() : { invoices: [] }).catch(() => ({ invoices: [] })),
      fetch(`${apiBase}/billing/subscription`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([invData, subData]) => {
      setInvoices(Array.isArray(invData) ? invData : (invData.invoices || invData.data || []));
      setSubscription(subData);
    }).finally(() => setLoading(false));
  }, []);

  const fmt = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
  };

  const fmtAmt = (amount, currency = 'USD') => {
    try {
      return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
        style: 'currency', currency: currency || 'USD', minimumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `$${amount}`;
    }
  };

  const TABS = [
    { id: 'invoices',      en: 'Invoices',     ar: 'الفواتير'    },
    { id: 'subscription',  en: 'Subscription', ar: 'الاشتراك'    },
  ];

  return (
    <div style={{
      minHeight: '100vh', background: TK.bg,
      padding: 'clamp(16px,3vw,32px)',
      fontFamily: isRTL ? 'IBM Plex Sans Arabic,system-ui,sans-serif' : 'Inter,system-ui,sans-serif',
      direction: isRTL ? 'rtl' : 'ltr', maxWidth: '900px', margin: '0 auto',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '9px', background: TK.accentBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <CreditCard style={{ width: '18px', height: '18px', color: TK.accent }} />
        </div>
        <div>
          <h1 style={{ fontSize: 'clamp(18px,3vw,22px)', fontWeight: 700, color: TK.text, margin: 0 }}>
            {language === 'ar' ? 'المدفوعات' : 'Payments'}
          </h1>
          <p style={{ fontSize: '12.5px', color: TK.textMuted, margin: '3px 0 0' }}>
            {language === 'ar' ? 'أدِر فواتيرك واشتراكاتك' : 'Manage your invoices and subscription'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', borderBottom: `2px solid ${TK.border}`, marginBottom: '24px',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '9px 18px', fontSize: '13px', fontWeight: isActive ? 500 : 400,
                color: isActive ? TK.accent : TK.textMuted, background: 'none', border: 'none',
                cursor: 'pointer', borderBottom: isActive ? `2px solid ${TK.accent}` : '2px solid transparent',
                marginBottom: '-2px', transition: 'color 0.14s', fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}
            >
              {language === 'ar' ? tab.ar : tab.en}
            </button>
          );
        })}
      </div>

      {/* ── Invoices Tab ── */}
      {activeTab === 'invoices' && (
        <div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: '68px', borderRadius: '12px', background: TK.surface, border: `1px solid ${TK.border}`, animation: 'shimmer 1.5s infinite' }} />
              ))}
              <style>{`@keyframes shimmer{0%{opacity:1}50%{opacity:0.4}100%{opacity:1}}`}</style>
            </div>
          ) : invoices.length === 0 ? (
            <div style={{
              background: TK.surface, borderRadius: '16px', border: `1px solid ${TK.border}`,
              padding: '56px', textAlign: 'center',
            }}>
              <CreditCard style={{ width: '36px', height: '36px', color: TK.textLight, margin: '0 auto 12px' }} />
              <p style={{ fontSize: '14px', fontWeight: 500, color: TK.text, margin: '0 0 6px' }}>
                {language === 'ar' ? 'لا فواتير بعد' : 'No invoices yet'}
              </p>
              <p style={{ fontSize: '12.5px', color: TK.textMuted, margin: 0, lineHeight: 1.5 }}>
                {language === 'ar'
                  ? 'ستظهر فواتيرك هنا بعد بدء مشروعك.'
                  : 'Your invoices will appear here once your project begins.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {invoices.map((inv, i) => {
                const statusKey = (inv.status || 'PENDING').toUpperCase();
                const info = INV_STATUS[statusKey] || INV_STATUS.PENDING;
                const StatusIcon = info.icon;
                return (
                  <div key={inv._id || i} style={{
                    background: TK.surface, borderRadius: '12px', border: `1px solid ${TK.border}`,
                    padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '12px', flexWrap: 'wrap', transition: 'border-color 0.14s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = TK.border; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '9px', flexShrink: 0,
                        background: info.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <StatusIcon style={{ width: '16px', height: '16px', color: info.color }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13.5px', fontWeight: 500, color: TK.text, marginBottom: '2px' }}>
                          {language === 'ar' ? 'فاتورة' : 'Invoice'} #{inv.number || String(i + 1).padStart(3, '0')}
                        </div>
                        {inv.description && (
                          <div style={{ fontSize: '11.5px', color: TK.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {inv.description}
                          </div>
                        )}
                        <div style={{ fontSize: '11px', color: TK.textLight, marginTop: '1px' }}>
                          {language === 'ar' ? 'الاستحقاق: ' : 'Due: '}{fmt(inv.dueDate || inv.due_date)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: TK.text }}>
                        {fmtAmt(inv.amount, inv.currency)}
                      </span>
                      <span style={{
                        padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 500,
                        background: info.bg, color: info.color,
                      }}>
                        {language === 'ar' ? info.ar : info.en}
                      </span>
                      {inv.status !== 'PAID' && (inv.payUrl || inv.pay_url || inv.stripeUrl) && (
                        <a href={inv.payUrl || inv.pay_url || inv.stripeUrl} target="_blank" rel="noopener noreferrer"
                          style={{
                            padding: '7px 14px', borderRadius: '8px', background: TK.accent, color: '#fff',
                            textDecoration: 'none', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap',
                          }}
                        >
                          {language === 'ar' ? 'ادفع الآن' : 'Pay Now'}
                        </a>
                      )}
                      {(inv.pdfUrl || inv.pdf_url) && (
                        <a href={inv.pdfUrl || inv.pdf_url} target="_blank" rel="noopener noreferrer"
                          aria-label={language === 'ar' ? 'تحميل' : 'Download'}
                          style={{ color: TK.textMuted, transition: 'color 0.14s' }}
                          onMouseEnter={e => { e.currentTarget.style.color = TK.accent; }}
                          onMouseLeave={e => { e.currentTarget.style.color = TK.textMuted; }}
                        >
                          <Download style={{ width: '15px', height: '15px' }} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Subscription Tab ── */}
      {activeTab === 'subscription' && (
        <div style={{ background: TK.surface, borderRadius: '16px', border: `1px solid ${TK.border}`, padding: '24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: TK.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 18px' }}>
            {language === 'ar' ? 'خطتك الحالية' : 'Current Plan'}
          </h2>

          {loading ? (
            <div style={{ height: '80px', borderRadius: '10px', background: TK.bg, animation: 'shimmer 1.5s infinite' }} />
          ) : subscription ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: TK.text, marginBottom: '4px' }}>
                    {subscription.planName || (language === 'ar' ? 'الخطة المجانية' : 'Free Plan')}
                  </div>
                  <div style={{ fontSize: '12.5px', color: TK.textMuted }}>
                    {subscription.billingCycle === 'annual'
                      ? (language === 'ar' ? 'سنوي' : 'Annual billing')
                      : (language === 'ar' ? 'شهري' : 'Monthly billing')}
                  </div>
                </div>
                {subscription.amount > 0 && (
                  <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: TK.accent }}>
                      {fmtAmt(subscription.amount, subscription.currency)}
                    </div>
                    <div style={{ fontSize: '11px', color: TK.textMuted }}>
                      / {subscription.billingCycle === 'annual' ? (language === 'ar' ? 'سنة' : 'year') : (language === 'ar' ? 'شهر' : 'month')}
                    </div>
                  </div>
                )}
              </div>

              {subscription.nextBilling && (
                <div style={{ padding: '12px 16px', borderRadius: '10px', background: TK.accentBg, border: '1px solid rgba(37,99,235,0.1)', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: TK.textMuted, marginBottom: '2px' }}>
                    {language === 'ar' ? 'الفاتورة القادمة' : 'Next billing'}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: TK.text }}>
                    {fmt(subscription.nextBilling)}
                  </div>
                </div>
              )}

              {subscription.manageUrl && (
                <a href={subscription.manageUrl} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '9px 20px', borderRadius: '9px',
                    background: TK.accent, color: '#fff', textDecoration: 'none', fontSize: '13px', fontWeight: 500,
                  }}
                >
                  {language === 'ar' ? 'إدارة الاشتراك' : 'Manage Subscription'}
                </a>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '28px' }}>
              <div style={{
                display: 'inline-flex', padding: '14px 24px', borderRadius: '12px',
                background: TK.accentBg, border: '1px solid rgba(37,99,235,0.15)',
                marginBottom: '14px',
              }}>
                <span style={{ fontSize: '18px', fontWeight: 700, color: TK.accent }}>
                  {language === 'ar' ? 'مجاني' : 'Free'}
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: TK.textMuted, margin: 0 }}>
                {language === 'ar' ? 'أنت على الخطة المجانية' : "You're on the free plan"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Payments;
