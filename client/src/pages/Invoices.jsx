import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle2, AlertCircle, Plus, ChevronRight, DollarSign } from 'lucide-react';
import api from '../utils/api';
import { useTheme } from '../contexts/ThemeContext';
import { useSelector } from 'react-redux';
import { useLanguage } from '../contexts/LanguageContext';

const STATUS_CFG = {
  draft:         { label: 'Draft',          color: 'rgba(255,255,255,0.4)',  bg: 'rgba(0,0,0,0.04)',  icon: FileText },
  sent:          { label: 'Awaiting Payment', color: '#f59e0b',              bg: 'rgba(245,158,11,0.1)',    icon: Clock },
  paid:          { label: 'Paid',            color: '#34d399',               bg: 'rgba(52,211,153,0.1)',    icon: CheckCircle2 },
  overdue:       { label: 'Overdue',         color: '#f87171',               bg: 'rgba(248,113,113,0.1)',   icon: AlertCircle },
  cancelled:     { label: 'Cancelled',       color: 'rgba(255,255,255,0.3)', bg: 'rgba(0,0,0,0.03)', icon: FileText },
  partially_paid:{ label: 'Partially Paid',  color: '#60a5fa',               bg: 'rgba(96,165,250,0.1)',   icon: Clock },
};

const currencySymbol = { USD: '$', EUR: '€', SAR: '﷼', AED: 'د.إ', EGP: 'ج.م', GBP: '£', KWD: 'د.ك', QAR: '﷼' };

const Invoices = () => {
  const { isDark }     = useTheme();
  const { dir }        = useLanguage();
  const { user }       = useSelector(s => s.auth);
  const isAdmin        = user?.role === 'ADMIN';

  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [stats,    setStats]    = useState(null);

  const gold      = '#2563EB';
  const bg        = isDark ? '#080806' : '#fafaf9';
  const surface   = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const border    = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textMain  = isDark ? '#f5f5f0' : '#0a0a0a';
  const textMuted = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

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
    `${currencySymbol[currency] || ''}${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div dir={dir} style={{ minHeight: '100vh', background: bg, color: textMain, padding: '32px 32px 60px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: 600, letterSpacing: '-0.02em', color: textMain, margin: 0, fontFamily: "'Inter',system-ui,sans-serif" }}>
            Invoices
          </h1>
          <p style={{ fontSize: '13px', color: textMuted, marginTop: '6px' }}>
            {isAdmin ? 'Manage and send client invoices' : 'View and pay your invoices'}
          </p>
        </div>
        {isAdmin && (
          <button style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '9px 16px', background: 'rgba(37,99,235,0.1)',
            border: '1px solid rgba(37,99,235,0.35)', borderRadius: '8px',
            color: gold, fontSize: '11px', fontWeight: 400,
            letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = gold; e.currentTarget.style.color = '#000'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.1)'; e.currentTarget.style.color = gold; }}
          >
            <Plus style={{ width: '13px', height: '13px' }} />
            New Invoice
          </button>
        )}
      </div>

      {/* Admin stats */}
      {isAdmin && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total Revenue', value: formatAmount(stats.totalRevenue, 'USD'), icon: DollarSign, color: '#2563EB' },
            { label: 'Total Invoices', value: stats.total,   icon: FileText, color: '#a78bfa' },
            { label: 'Paid',          value: stats.paid,    icon: CheckCircle2, color: '#34d399' },
            { label: 'Overdue',       value: stats.overdue, icon: AlertCircle, color: '#f87171' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} style={{ padding: '18px', background: surface, border: `1px solid ${border}`, borderRadius: '10px' }}>
              <Icon style={{ width: '16px', height: '16px', color, marginBottom: '10px' }} />
              <div style={{ fontSize: '24px', fontWeight: 600, color: textMain, letterSpacing: '-0.02em' }}>{value}</div>
              <div style={{ fontSize: '10px', color: textMuted, marginTop: '4px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid rgba(37,99,235,0.15)', borderTopColor: gold, animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : invoices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '70px 24px 60px', maxWidth: '440px', margin: '0 auto' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '14px', margin: '0 auto 22px',
            background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FileText style={{ width: '26px', height: '26px', color: '#34d399', opacity: 0.8 }} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 400, color: textMain, marginBottom: '10px', letterSpacing: '-0.01em' }}>
            No invoices yet
          </h3>
          <p style={{ fontSize: '13px', color: textMuted, lineHeight: 1.65, marginBottom: '24px', fontWeight: 300 }}>
            Invoices are issued by our team when a project milestone is reached or a plan is activated. You will receive a notification when a new invoice is ready for payment.
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Secure payment links', 'PDF receipts', 'Payment history'].map(label => (
              <span key={label} style={{
                padding: '5px 12px', borderRadius: '8px',
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                border: `1px solid ${border}`,
                fontSize: '11px', color: textMuted,
              }}>
                {label}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {invoices.map(inv => {
            const cfg = STATUS_CFG[inv.status] || STATUS_CFG.sent;
            const StatusIcon = cfg.icon;
            return (
              <div
                key={inv._id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '16px 20px',
                  background: surface, border: `1px solid ${border}`,
                  borderRadius: '10px', transition: 'all 0.15s',
                  cursor: 'default',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = border; }}
              >
                {/* Status icon */}
                <div style={{
                  width: '38px', height: '38px', borderRadius: '9px',
                  background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <StatusIcon style={{ width: '16px', height: '16px', color: cfg.color }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 300, color: textMain }}>
                      #{inv.invoiceNumber}
                    </span>
                    {inv.project?.title && (
                      <span style={{ fontSize: '10px', color: textMuted }}>— {inv.project.title}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '10px', color: textMuted }}>
                    {isAdmin && inv.client?.fullName ? `${inv.client.fullName} · ` : ''}
                    Due {new Date(inv.dueDate).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>

                {/* Amount + status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <span style={{ fontSize: '16px', fontWeight: 300, color: textMain, letterSpacing: '-0.01em' }}>
                    {formatAmount(inv.total, inv.currency)}
                  </span>
                  <span style={{
                    padding: '3px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: 300,
                    background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}25`,
                    letterSpacing: '0.06em',
                  }}>
                    {cfg.label}
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
