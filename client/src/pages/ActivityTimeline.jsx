import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLanguage } from '../contexts/LanguageContext';
import { Activity, FolderKanban, MessageSquare, CreditCard, CheckCircle2, Upload, RefreshCw, Loader2 } from 'lucide-react';
import api from '../utils/api';

const TK = {
  bg:        '#F6F7F9',
  surface:   '#FFFFFF',
  border:    '#E8EBF0',
  accent:    '#2563EB',
  text:      '#0D1117',
  textMuted: '#6B7280',
};

const TYPE_CONFIG = {
  project_created:   { icon: FolderKanban, color: '#2563EB',  label_en: 'Project Created',   label_ar: 'تم إنشاء المشروع' },
  project_updated:   { icon: FolderKanban, color: '#7c3aed',  label_en: 'Project Updated',   label_ar: 'تم تحديث المشروع' },
  milestone_done:    { icon: CheckCircle2, color: '#34d399',  label_en: 'Milestone Complete', label_ar: 'تم اكتمال المرحلة' },
  message_received:  { icon: MessageSquare,color: '#0891b2',  label_en: 'New Message',       label_ar: 'رسالة جديدة' },
  message_sent:      { icon: MessageSquare,color: '#6b7280',  label_en: 'Message Sent',      label_ar: 'تم إرسال الرسالة' },
  payment:           { icon: CreditCard,   color: '#34d399',  label_en: 'Payment',           label_ar: 'دفعة' },
  file_uploaded:     { icon: Upload,       color: '#f59e0b',  label_en: 'File Uploaded',     label_ar: 'تم رفع ملف' },
};

const timeAgo = (date, ar) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)    return ar ? 'الآن'          : 'Just now';
  if (mins < 60)   return ar ? `منذ ${mins} د` : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)    return ar ? `منذ ${hrs} س`  : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30)   return ar ? `منذ ${days} يوم` : `${days}d ago`;
  return new Date(date).toLocaleDateString(ar ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });
};

const formatDate = (date, ar) =>
  new Date(date).toLocaleDateString(ar ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const groupByDate = (items) => {
  const groups = {};
  items.forEach(item => {
    const day = new Date(item.createdAt).toDateString();
    if (!groups[day]) groups[day] = [];
    groups[day].push(item);
  });
  return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
};

export default function ActivityTimeline() {
  const { language, isRTL } = useLanguage();
  const { user } = useSelector(s => s.auth);
  const ar = language === 'ar';

  const [activities, setActivities] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [filter, setFilter]         = useState('all');

  const fetchActivity = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectsRes, messagesRes, invoicesRes] = await Promise.allSettled([
        api.get('/projects?limit=20'),
        api.get('/messages/inbox?limit=20'),
        api.get('/billing/invoices?limit=10'),
      ]);

      const items = [];

      if (projectsRes.status === 'fulfilled') {
        const projects = projectsRes.value.data.projects || projectsRes.value.data || [];
        projects.forEach(p => {
          items.push({ id: `proj-${p._id}`, type: 'project_updated', title: p.title, subtitle: `Status: ${p.status}`, createdAt: p.updatedAt || p.createdAt, link: `/app/projects/${p._id}` });
          if (p.createdAt && p.createdAt === p.updatedAt) {
            items[items.length - 1].type = 'project_created';
          }
        });
      }

      if (messagesRes.status === 'fulfilled') {
        const threads = messagesRes.value.data.threads || messagesRes.value.data || [];
        threads.forEach(t => {
          const lastMsg = t.lastMessage;
          if (!lastMsg) return;
          const isMine = lastMsg.sender?._id === user?._id;
          items.push({
            id: `msg-${t._id}`,
            type: isMine ? 'message_sent' : 'message_received',
            title: lastMsg.content?.slice(0, 60) + (lastMsg.content?.length > 60 ? '…' : ''),
            subtitle: t.project?.title || t.subject || '',
            createdAt: lastMsg.createdAt || t.updatedAt,
          });
        });
      }

      if (invoicesRes.status === 'fulfilled') {
        const invoices = invoicesRes.value.data.invoices || invoicesRes.value.data || [];
        invoices.forEach(inv => {
          if (inv.status === 'paid') {
            items.push({
              id: `inv-${inv._id}`,
              type: 'payment',
              title: `Invoice ${inv.invoiceNumber || '#'}`,
              subtitle: inv.total ? `$${inv.total.toLocaleString()}` : '',
              createdAt: inv.paidAt || inv.updatedAt,
            });
          }
        });
      }

      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setActivities(items);
    } catch (err) {
      setError(ar ? 'تعذّر تحميل النشاط' : 'Could not load activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchActivity(); }, []);

  const filtered = filter === 'all' ? activities : activities.filter(a => {
    if (filter === 'projects')  return a.type.startsWith('project') || a.type === 'milestone_done';
    if (filter === 'messages')  return a.type.startsWith('message');
    if (filter === 'payments')  return a.type === 'payment';
    return true;
  });

  const grouped = groupByDate(filtered);

  const FILTERS = [
    { key: 'all',      label_en: 'All',      label_ar: 'الكل' },
    { key: 'projects', label_en: 'Projects', label_ar: 'المشاريع' },
    { key: 'messages', label_en: 'Messages', label_ar: 'الرسائل' },
    { key: 'payments', label_en: 'Payments', label_ar: 'المدفوعات' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: TK.bg, padding: '32px 32px 60px', direction: isRTL ? 'rtl' : 'ltr', fontFamily: "'Inter',system-ui,sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(37,99,235,0.25)', background: 'rgba(37,99,235,0.06)', marginBottom: '10px' }}>
            <Activity style={{ width: '10px', height: '10px', color: TK.accent }} />
            <span style={{ fontSize: '10px', fontWeight: 500, color: TK.accent, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              {ar ? 'النشاط' : 'Activity'}
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(22px,4vw,36px)', fontWeight: 600, color: TK.text, margin: 0, letterSpacing: '-0.02em' }}>
            {ar ? 'سجل النشاط' : 'Activity Timeline'}
          </h1>
          <p style={{ fontSize: '12px', color: TK.textMuted, margin: '6px 0 0', fontWeight: 300 }}>
            {ar ? 'جميع تحديثات مشاريعك ورسائلك ومدفوعاتك' : 'All your project updates, messages, and payments'}
          </p>
        </div>
        <button
          onClick={fetchActivity}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', background: 'transparent', border: `1px solid ${TK.border}`, borderRadius: '8px', color: TK.textMuted, fontSize: '11px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.4)'; e.currentTarget.style.color = TK.accent; } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = TK.border; e.currentTarget.style.color = TK.textMuted; }}
        >
          <RefreshCw style={{ width: '12px', height: '12px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {ar ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '7px 16px', borderRadius: '20px',
              background: filter === f.key ? TK.accent : TK.surface,
              border: `1px solid ${filter === f.key ? TK.accent : TK.border}`,
              color: filter === f.key ? '#fff' : TK.textMuted,
              fontSize: '11px', fontWeight: filter === f.key ? 500 : 300,
              cursor: 'pointer', transition: 'all 0.18s', fontFamily: 'inherit',
            }}
          >
            {ar ? f.label_ar : f.label_en}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
          <Loader2 style={{ width: '28px', height: '28px', color: TK.accent, animation: 'spin 1s linear infinite' }} />
        </div>
      ) : error ? (
        <div style={{ padding: '32px', textAlign: 'center', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '12px' }}>
          <p style={{ color: TK.textMuted, fontSize: '13px' }}>{error}</p>
        </div>
      ) : grouped.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '12px' }}>
          <Activity style={{ width: '32px', height: '32px', color: TK.textMuted, margin: '0 auto 14px', opacity: 0.4 }} />
          <p style={{ fontSize: '14px', color: TK.text, marginBottom: '6px', fontWeight: 400 }}>
            {ar ? 'لا يوجد نشاط بعد' : 'No activity yet'}
          </p>
          <p style={{ fontSize: '12px', color: TK.textMuted, fontWeight: 300 }}>
            {ar ? 'ستظهر تحديثات مشاريعك ورسائلك هنا' : 'Your project updates and messages will appear here'}
          </p>
        </div>
      ) : (
        <div style={{ maxWidth: '680px' }}>
          {grouped.map(([day, items]) => (
            <div key={day} style={{ marginBottom: '32px' }}>
              {/* Day header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', fontWeight: 500, color: TK.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  {formatDate(day, ar)}
                </span>
                <div style={{ flex: 1, height: '1px', background: TK.border }} />
              </div>

              {/* Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {items.map((item, idx) => {
                  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG['project_updated'];
                  const Icon = cfg.icon;
                  const isLast = idx === items.length - 1;
                  return (
                    <div key={item.id} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                      {/* Timeline line */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: `${cfg.color}12`, border: `1px solid ${cfg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon style={{ width: '14px', height: '14px', color: cfg.color }} />
                        </div>
                        {!isLast && <div style={{ width: '1px', flex: 1, background: TK.border, minHeight: '24px' }} />}
                      </div>

                      {/* Content */}
                      <div
                        style={{ flex: 1, padding: '6px 0 20px', cursor: item.link ? 'pointer' : 'default' }}
                        onClick={() => item.link && (window.location.href = item.link)}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                          <div>
                            <span style={{ fontSize: '10px', fontWeight: 400, color: cfg.color, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                              {ar ? cfg.label_ar : cfg.label_en}
                            </span>
                            <p style={{ fontSize: '13px', color: TK.text, margin: '0 0 2px', fontWeight: 300, lineHeight: 1.4 }}>
                              {item.title}
                            </p>
                            {item.subtitle && (
                              <p style={{ fontSize: '11px', color: TK.textMuted, margin: 0, fontWeight: 300 }}>
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                          <span style={{ fontSize: '10px', color: TK.textMuted, whiteSpace: 'nowrap', flexShrink: 0, marginTop: '3px' }}>
                            {timeAgo(item.createdAt, ar)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
