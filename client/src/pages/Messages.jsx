import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Send, Plus, Search, X, ChevronLeft, ChevronRight,
  Archive, Check, CheckCheck,
  Headphones, TrendingUp, FolderKanban, CreditCard, Wrench,
  MessageCircle, Inbox, AlertCircle, Clock, CheckCircle2,
  Mail, Phone, Building2, User2, LayoutGrid,
  Flag,
} from 'lucide-react';
import api from '../utils/api';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { gsap } from 'gsap';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'support',   label: 'Technical Support', labelAr: 'الدعم التقني',     icon: Headphones,   color: '#3b82f6' },
  { value: 'sales',     label: 'Sales Inquiry',     labelAr: 'استفسار مبيعات',    icon: TrendingUp,   color: '#10b981' },
  { value: 'billing',   label: 'Billing Question',  labelAr: 'سؤال فواتير',      icon: CreditCard,   color: '#f59e0b' },
  { value: 'project',   label: 'Project Discussion',labelAr: 'نقاش مشروع',        icon: FolderKanban, color: '#d4af37' },
  { value: 'technical', label: 'Bug Report',        labelAr: 'تقرير خطأ',         icon: Wrench,       color: '#ef4444' },
  { value: 'general',   label: 'General',           labelAr: 'عام',               icon: MessageCircle,color: '#8b5cf6' },
];

const PRIORITIES = [
  { value: 'low',    label: 'Low',    labelAr: 'منخفض', color: '#6b7280' },
  { value: 'medium', label: 'Medium', labelAr: 'متوسط', color: '#3b82f6' },
  { value: 'high',   label: 'High',   labelAr: 'مرتفع', color: '#f59e0b' },
  { value: 'urgent', label: 'Urgent', labelAr: 'عاجل',  color: '#ef4444' },
];

const STATUSES = {
  open:                 { label: 'Open',              labelAr: 'مفتوح',             color: '#10b981', bg: 'rgba(16,185,129,0.1)',  icon: CheckCircle2 },
  waiting_for_admin:    { label: 'Waiting for Us',    labelAr: 'ننتظر ردنا',        color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',  icon: Clock },
  waiting_for_customer: { label: 'Awaiting Reply',    labelAr: 'ينتظر ردك',         color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: Clock },
  resolved:             { label: 'Resolved',          labelAr: 'محلول',             color: '#d4af37', bg: 'rgba(212,175,55,0.1)',  icon: CheckCircle2 },
  closed:               { label: 'Closed',            labelAr: 'مغلق',             color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: X },
  pending:              { label: 'Pending',           labelAr: 'معلق',             color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: Clock },
  in_progress:          { label: 'In Progress',       labelAr: 'قيد التنفيذ',       color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  icon: CheckCircle2 },
};

const ADMIN_TABS = [
  { id: 'all',      label: 'All',      labelAr: 'الكل',     icon: LayoutGrid },
  { id: 'unread',   label: 'Unread',   labelAr: 'غير مقروء', icon: Inbox },
  { id: 'urgent',   label: 'Urgent',   labelAr: 'عاجل',      icon: AlertCircle },
  { id: 'assigned', label: 'Assigned', labelAr: 'معيّن لي',  icon: User2 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (date, lang = 'en') => {
  const d = new Date(date);
  const now = new Date();
  const diffMins = Math.floor((now - d) / 60000);
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffMins < 1)  return lang === 'ar' ? 'الآن' : 'now';
  if (diffMins < 60) return lang === 'ar' ? `${diffMins}د` : `${diffMins}m`;
  if (diffDays === 0) return d.toLocaleTimeString(lang === 'ar' ? 'ar' : 'en', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return lang === 'ar' ? 'أمس' : 'Yesterday';
  if (diffDays < 7)  return d.toLocaleDateString(lang === 'ar' ? 'ar' : 'en', { weekday: 'short' });
  return d.toLocaleDateString(lang === 'ar' ? 'ar' : 'en', { month: 'short', day: 'numeric' });
};

const getInitials = (name = '') =>
  name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

const getCategoryInfo = (val) => CATEGORIES.find(c => c.value === val) || CATEGORIES[5];
const getPriorityInfo = (val) => PRIORITIES.find(p => p.value === val) || PRIORITIES[1];

// Get the customer (non-admin) participant from a thread
const getCustomer = (thread) =>
  thread.participants?.find(p => p.role !== 'ADMIN' && p.role !== 'SUPER_ADMIN') ||
  thread.participants?.[0];

// Get the other participant (from current user's perspective)
const getOther = (thread, userId) =>
  thread.participants?.find(p => (p._id || p).toString() !== userId?.toString()) ||
  thread.participants?.[0];

// ── Sub-components ────────────────────────────────────────────────────────────

const Avatar = ({ name = '', size = 36, active = false, src = null, role }) => {
  const isTeam = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const color  = active ? '#d4af37' : isTeam ? '#d4af37' : 'rgba(255,255,255,0.5)';
  const bg     = isTeam
    ? 'linear-gradient(135deg,rgba(212,175,55,0.3),rgba(212,175,55,0.08))'
    : active
    ? 'linear-gradient(135deg,rgba(212,175,55,0.2),rgba(212,175,55,0.05))'
    : 'linear-gradient(135deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))';

  if (src) return (
    <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  );
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: bg,
      border: `1px solid ${active || isTeam ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.1)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.37, fontWeight: 500, color,
      letterSpacing: '0.03em', userSelect: 'none',
    }}>
      {isTeam && !active ? '✦' : getInitials(name)}
    </div>
  );
};

const PriorityDot = ({ priority }) => {
  const p = getPriorityInfo(priority);
  return (
    <span style={{
      display: 'inline-block', width: '6px', height: '6px',
      borderRadius: '50%', background: p.color, flexShrink: 0,
    }} title={p.label} />
  );
};

const CategoryBadge = ({ type, lang }) => {
  const cat  = getCategoryInfo(type);
  const Icon = cat.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      padding: '2px 6px', borderRadius: '6px',
      background: `${cat.color}14`, border: `1px solid ${cat.color}28`,
      color: cat.color, fontSize: '9px', fontWeight: 500, letterSpacing: '0.04em',
      textTransform: 'uppercase', flexShrink: 0,
    }}>
      <Icon style={{ width: '8px', height: '8px' }} />
      {lang === 'ar' ? cat.labelAr : cat.label}
    </span>
  );
};

const StatusBadge = ({ status, lang }) => {
  const s = STATUSES[status] || STATUSES.open;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      padding: '2px 6px', borderRadius: '6px',
      background: s.bg, color: s.color,
      fontSize: '9px', fontWeight: 500, letterSpacing: '0.04em',
      flexShrink: 0,
    }}>
      {lang === 'ar' ? s.labelAr : s.label}
    </span>
  );
};

// ── New Conversation Modal ────────────────────────────────────────────────────

const NewConversationModal = ({ onClose, onCreated, isAdmin, adminUsers, isDark, isRTL, language, tk }) => {
  const [subject,     setSubject]     = useState('');
  const [category,    setCategory]    = useState('support');
  const [priority,    setPriority]    = useState('medium');
  const [message,     setMessage]     = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');
  const { t } = useTranslation();
  const { gold, border, textMain, textMuted, inputBg, surface } = tk;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) { setError(language === 'ar' ? 'الرسالة مطلوبة' : 'Message is required'); return; }
    if (isAdmin && !recipientId) { setError(language === 'ar' ? 'اختر العميل' : 'Select a customer'); return; }
    setSubmitting(true);
    setError('');
    try {
      const payload = { subject, content: message, type: category, priority };
      if (isAdmin && recipientId) payload.recipient = recipientId;
      const res = await api.post('/messages/threads', payload);
      onCreated(res.data.thread, res.data.message);
      onClose();
    } catch (e) {
      setError(e?.response?.data?.error || (language === 'ar' ? 'حدث خطأ' : 'Something went wrong'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '16px', direction: isRTL ? 'rtl' : 'ltr',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: '100%', maxWidth: '480px', background: isDark ? '#0f0f0c' : '#ffffff',
        border: `1px solid ${border}`, borderRadius: '16px',
        padding: '28px', animation: 'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 500, color: textMain, margin: '0 0 4px' }}>
              {isAdmin
                ? (language === 'ar' ? 'محادثة جديدة' : 'New Conversation')
                : (language === 'ar' ? 'تواصل مع الدعم' : 'Contact Support')
              }
            </h2>
            {!isAdmin && (
              <p style={{ fontSize: '12px', color: textMuted, fontWeight: 300, margin: 0 }}>
                {language === 'ar' ? 'فريقنا يرد خلال ساعتين' : 'Our team typically responds within 2 hours'}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: '4px' }}>
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Admin: recipient */}
          {isAdmin && (
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 500, color: textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
                {language === 'ar' ? 'العميل' : 'Customer'}
              </label>
              <select value={recipientId} onChange={e => setRecipientId(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: inputBg, border: `1px solid ${border}`, borderRadius: '8px', color: recipientId ? textMain : textMuted, fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              >
                <option value="">{language === 'ar' ? 'اختر العميل…' : 'Select customer…'}</option>
                {adminUsers.map(u => <option key={u._id} value={u._id}>{u.fullName || u.email}</option>)}
              </select>
            </div>
          )}

          {/* Subject */}
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 500, color: textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
              {language === 'ar' ? 'الموضوع' : 'Subject'}
            </label>
            <input value={subject} onChange={e => setSubject(e.target.value)}
              placeholder={language === 'ar' ? 'وصف مختصر للمشكلة…' : 'Brief description of your issue…'}
              style={{ width: '100%', padding: '10px 12px', background: inputBg, border: `1px solid ${border}`, borderRadius: '8px', color: textMain, fontSize: '13px', fontFamily: 'inherit', fontWeight: 300, outline: 'none', boxSizing: 'border-box', direction: isRTL ? 'rtl' : 'ltr' }}
              onFocus={e => e.target.style.borderColor = 'rgba(212,175,55,0.5)'}
              onBlur={e => e.target.style.borderColor = border}
            />
          </div>

          {/* Category */}
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 500, color: textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
              {language === 'ar' ? 'التصنيف' : 'Category'}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const active = category === cat.value;
                return (
                  <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s',
                      border: `1px solid ${active ? cat.color : border}`,
                      background: active ? `${cat.color}15` : 'transparent',
                      color: active ? cat.color : textMuted, fontSize: '11px', fontWeight: active ? 500 : 300,
                    }}
                  >
                    <Icon style={{ width: '11px', height: '11px' }} />
                    {language === 'ar' ? cat.labelAr : cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 500, color: textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
              {language === 'ar' ? 'الأولوية' : 'Priority'}
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {PRIORITIES.map(p => {
                const active = priority === p.value;
                return (
                  <button key={p.value} type="button" onClick={() => setPriority(p.value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s',
                      border: `1px solid ${active ? p.color : border}`,
                      background: active ? `${p.color}15` : 'transparent',
                      color: active ? p.color : textMuted, fontSize: '11px', fontWeight: active ? 500 : 300,
                      flex: 1, justifyContent: 'center',
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                    {language === 'ar' ? p.labelAr : p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message */}
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 500, color: textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
              {language === 'ar' ? 'الرسالة' : 'Message'} <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} required
              placeholder={language === 'ar' ? 'صف مشكلتك بالتفصيل…' : 'Describe your issue in detail…'}
              style={{ width: '100%', padding: '10px 12px', background: inputBg, border: `1px solid ${border}`, borderRadius: '8px', color: textMain, fontSize: '13px', fontFamily: 'inherit', fontWeight: 300, resize: 'vertical', outline: 'none', boxSizing: 'border-box', direction: isRTL ? 'rtl' : 'ltr' }}
              onFocus={e => e.target.style.borderColor = 'rgba(212,175,55,0.5)'}
              onBlur={e => e.target.style.borderColor = border}
            />
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '12px', margin: 0 }}>{error}</p>}

          <button type="submit" disabled={submitting}
            style={{
              padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: submitting ? 'rgba(212,175,55,0.3)' : '#d4af37',
              color: '#000', fontSize: '12px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase',
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {submitting
              ? <><div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', animation: 'spin 0.7s linear infinite' }} />{language === 'ar' ? 'جارٍ الإرسال…' : 'Sending…'}</>
              : <><Send style={{ width: '13px', height: '13px' }} />{language === 'ar' ? 'إرسال' : 'Send Message'}</>
            }
          </button>
        </form>
      </div>
      <style>{`
        @keyframes modalIn { from{opacity:0;transform:scale(0.93) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
};

// ── Thread Row ────────────────────────────────────────────────────────────────

const ThreadRow = ({ thread, isSelected, isAdmin, currentUserId, onClick, lang, tk, isRTL }) => {
  const { border, textMain, textMuted, activeBg, hoverBg } = tk;
  const customer  = getCustomer(thread);
  const other     = isAdmin ? customer : getOther(thread, currentUserId);
  const name      = isAdmin ? (customer?.fullName || customer?.email || '—') : 'YANSY Team';
  const company   = isAdmin ? customer?.companyName : null;
  const priority  = getPriorityInfo(thread.priority);
  const unread    = thread.unreadCount > 0;

  return (
    <div
      onClick={() => onClick(thread)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        padding: '12px 16px', cursor: 'pointer', transition: 'background 0.12s',
        background: isSelected ? activeBg : 'transparent',
        borderBottom: `1px solid ${border}`,
        borderInlineStart: `3px solid ${isSelected ? tk.gold : thread.priority === 'urgent' ? '#ef4444' : thread.priority === 'high' ? '#f59e0b' : 'transparent'}`,
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = hoverBg; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Avatar */}
      <Avatar name={name} size={36} active={isSelected} src={!isAdmin ? null : other?.avatar} role={!isAdmin ? 'ADMIN' : other?.role} />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span style={{
            fontSize: '12px', fontWeight: unread ? 500 : 300,
            color: unread ? textMain : 'rgba(200,200,190,0.8)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: '140px',
          }}>
            {name}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
            {unread && (
              <span style={{
                minWidth: '16px', height: '16px', borderRadius: '8px', padding: '0 4px',
                background: tk.gold, color: '#000', fontSize: '8px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 6px rgba(212,175,55,0.4)',
              }}>{thread.unreadCount}</span>
            )}
            <span style={{ fontSize: '9px', color: textMuted }}>
              {fmt(thread.lastActivity, lang)}
            </span>
          </div>
        </div>

        {/* Company (admin view) */}
        {isAdmin && company && (
          <p style={{ fontSize: '10px', color: textMuted, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 300 }}>
            {company}
          </p>
        )}

        {/* Subject */}
        <p style={{ fontSize: '11px', color: textMuted, margin: '0 0 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 300 }}>
          {thread.subject || (lang === 'ar' ? 'بدون موضوع' : 'No subject')}
        </p>

        {/* Badges */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
          <CategoryBadge type={thread.type} lang={lang} />
          <StatusBadge status={thread.status} lang={lang} />
          {thread.priority !== 'medium' && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              padding: '2px 6px', borderRadius: '6px', fontSize: '9px', fontWeight: 500,
              background: `${priority.color}12`, color: priority.color, letterSpacing: '0.04em',
            }}>
              <Flag style={{ width: '8px', height: '8px' }} />
              {lang === 'ar' ? priority.labelAr : priority.label}
            </span>
          )}
          {thread.isPinned && (
            <span style={{ fontSize: '8px', color: 'rgba(212,175,55,0.7)', padding: '2px 5px', borderRadius: '5px', border: '1px solid rgba(212,175,55,0.2)' }}>
              {lang === 'ar' ? 'مثبّت' : 'Pinned'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Customer Info Panel (admin right side) ────────────────────────────────────

const CustomerInfoPanel = ({ thread, isDark, lang, isRTL, tk }) => {
  const customer = getCustomer(thread);
  if (!customer) return null;
  const { border, textMain, textMuted, surface, gold } = tk;

  const INFO_ROWS = [
    { icon: Mail,      val: customer.email,       href: `mailto:${customer.email}` },
    { icon: Phone,     val: customer.phoneNumber,  href: `tel:${customer.phoneNumber}` },
    { icon: Building2, val: customer.companyName,  href: null },
  ].filter(r => r.val);

  const STATUS_CFG_CUST = {
    lead:     { label: 'Lead',     labelAr: 'عميل محتمل', color: '#6b7280' },
    prospect: { label: 'Prospect', labelAr: 'مرشح',      color: '#8b5cf6' },
    active:   { label: 'Active',   labelAr: 'نشط',        color: '#10b981' },
    vip:      { label: 'VIP',      labelAr: 'VIP',        color: '#d4af37' },
    churned:  { label: 'Churned',  labelAr: 'مغادر',     color: '#ef4444' },
    inactive: { label: 'Inactive', labelAr: 'غير نشط',   color: '#6b7280' },
  };
  const cst = STATUS_CFG_CUST[customer.customerStatus] || STATUS_CFG_CUST.lead;
  const priorityInfo = getPriorityInfo(thread.priority);
  const categoryInfo = getCategoryInfo(thread.type);

  return (
    <div style={{
      width: '260px', flexShrink: 0, borderInlineStart: `1px solid ${border}`,
      background: isDark ? '#0c0c09' : '#fafaf8',
      display: 'flex', flexDirection: 'column', overflow: 'auto',
    }}>
      {/* Customer card */}
      <div style={{ padding: '20px 16px', borderBottom: `1px solid ${border}` }}>
        <p style={{ fontSize: '9px', fontWeight: 500, color: textMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
          {lang === 'ar' ? 'العميل' : 'Customer'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Avatar name={customer.fullName || customer.email} size={40} src={customer.avatar} role={customer.role} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 400, color: textMain, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {customer.fullName || customer.email}
            </p>
            <span style={{
              fontSize: '9px', fontWeight: 500, padding: '2px 7px', borderRadius: '8px',
              background: `${cst.color}15`, color: cst.color,
            }}>
              {lang === 'ar' ? cst.labelAr : cst.label}
            </span>
          </div>
        </div>

        {/* Contact info */}
        {INFO_ROWS.map(({ icon: Icon, val, href }) => (
          <div key={val} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
            <Icon style={{ width: '11px', height: '11px', color: textMuted, flexShrink: 0 }} />
            {href
              ? <a href={href} style={{ fontSize: '11px', color: gold, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</a>
              : <span style={{ fontSize: '11px', color: textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
            }
          </div>
        ))}

        {/* Lead score */}
        {customer.leadScore > 0 && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '9px', color: textMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {lang === 'ar' ? 'نقاط العميل' : 'Lead Score'}
              </span>
              <span style={{ fontSize: '9px', color: gold }}>{customer.leadScore}/100</span>
            </div>
            <div style={{ height: '3px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${customer.leadScore}%`, background: gold, borderRadius: '2px' }} />
            </div>
          </div>
        )}
      </div>

      {/* Conversation details */}
      <div style={{ padding: '16px', borderBottom: `1px solid ${border}` }}>
        <p style={{ fontSize: '9px', fontWeight: 500, color: textMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
          {lang === 'ar' ? 'تفاصيل المحادثة' : 'Conversation'}
        </p>
        {[
          { label: lang === 'ar' ? 'الموضوع' : 'Subject',  val: thread.subject || '—' },
          { label: lang === 'ar' ? 'التصنيف' : 'Category', val: lang === 'ar' ? categoryInfo.labelAr : categoryInfo.label },
          { label: lang === 'ar' ? 'الأولوية' : 'Priority', val: lang === 'ar' ? priorityInfo.labelAr : priorityInfo.label, color: priorityInfo.color },
          { label: lang === 'ar' ? 'تاريخ الإنشاء' : 'Created', val: new Date(thread.createdAt).toLocaleDateString(lang === 'ar' ? 'ar' : 'en', { month: 'short', day: 'numeric', year: 'numeric' }) },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: textMuted, flexShrink: 0 }}>{label}</span>
            <span style={{ fontSize: '10px', color: color || textMain, fontWeight: 400, textAlign: isRTL ? 'left' : 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Assignment */}
      <div style={{ padding: '16px' }}>
        <p style={{ fontSize: '9px', fontWeight: 500, color: textMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
          {lang === 'ar' ? 'معيّن إلى' : 'Assigned To'}
        </p>
        <p style={{ fontSize: '11px', color: thread.assignedTo ? textMain : textMuted, fontWeight: 300 }}>
          {thread.assignedTo?.fullName || (lang === 'ar' ? 'غير معيّن' : 'Unassigned')}
        </p>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const Messages = () => {
  const { t }                      = useTranslation();
  const { user }                   = useSelector(s => s.auth);
  const { isDark }                 = useTheme();
  const { isRTL, language }        = useLanguage();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const [threads,        setThreads]        = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages,       setMessages]       = useState([]);
  const [newMessage,     setNewMessage]     = useState('');
  const [loading,        setLoading]        = useState(true);
  const [sending,        setSending]        = useState(false);
  const [showNewModal,   setShowNewModal]   = useState(false);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [activeTab,      setActiveTab]      = useState('all'); // admin tabs
  const [mobileView,     setMobileView]     = useState('list');
  const [typingUser,     setTypingUser]     = useState(null);
  const [adminUsers,     setAdminUsers]     = useState([]);
  const [showCustomerPanel, setShowCustomerPanel] = useState(true);

  const socketRef      = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const threadListRef  = useRef(null);
  const typingTimerRef = useRef(null);

  // ── Theme tokens ─────────────────────────────────────────────────────────────
  const gold      = '#d4af37';
  const bg        = isDark ? '#090907' : '#f9f9f7';
  const panelBg   = isDark ? '#0e0e0b' : '#ffffff';
  const chatBg    = isDark ? '#0b0b08' : '#f3f3ef';
  const border    = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const textMain  = isDark ? '#f5f5f0' : '#0a0a0a';
  const textMuted = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.4)';
  const inputBg   = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const hoverBg   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const activeBg  = isDark ? 'rgba(212,175,55,0.07)' : 'rgba(212,175,55,0.07)';
  const surface   = isDark ? 'rgba(255,255,255,0.03)' : '#ffffff';
  const tk = { gold, bg, panelBg, chatBg, border, textMain, textMuted, inputBg, hoverBg, activeBg, surface };

  // ── Socket ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchThreads();
    const token = localStorage.getItem('token');
    const url   = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    socketRef.current = io(url, { auth: { token }, transports: ['websocket'] });

    socketRef.current.on('connect', () => {
      if (user?._id) {
        socketRef.current.emit('join', user._id);
      }
    });

    socketRef.current.on('message-received', (data) => {
      setMessages(prev => {
        if (prev.find(m => m._id === data._id)) return prev;
        return [...prev, data];
      });
      setThreads(prev => prev.map(t =>
        t._id === data.threadId
          ? { ...t, lastMessage: data, lastActivity: new Date().toISOString() }
          : t
      ));
    });

    socketRef.current.on('new-thread', () => { fetchThreads(); });
    socketRef.current.on('customer-message', () => { fetchThreads(); });

    socketRef.current.on('thread-updated', ({ threadId, status }) => {
      setThreads(prev => prev.map(t => t._id === threadId ? { ...t, status } : t));
      setSelectedThread(prev => prev?._id === threadId ? { ...prev, status } : prev);
    });

    socketRef.current.on('user-typing', ({ userId, typing }) => {
      if (userId !== user?._id) {
        setTypingUser(typing ? userId : null);
        if (typing) {
          clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => setTypingUser(null), 3000);
        }
      }
    });

    return () => {
      socketRef.current?.disconnect();
      clearTimeout(typingTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread._id);
      socketRef.current?.emit('join-thread', selectedThread._id);
    }
  }, [selectedThread?._id]);

  useEffect(() => {
    if (!loading && threadListRef.current) {
      const items = threadListRef.current.querySelectorAll('[data-row]');
      gsap.fromTo(items,
        { opacity: 0, x: isRTL ? 10 : -10 },
        { opacity: 1, x: 0, duration: 0.35, stagger: 0.04, ease: 'power3.out' }
      );
    }
  }, [loading, threads.length, activeTab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isAdmin) {
      api.get('/users?role=USER&limit=100').then(r => setAdminUsers(r.data.users || [])).catch(() => {});
    }
  }, [isAdmin]);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchThreads = useCallback(async () => {
    try {
      const res = await api.get('/messages/threads?limit=50');
      const list = res.data.threads || [];
      setThreads(list);
      if (list.length > 0 && !selectedThread) {
        setSelectedThread(list[0]);
      }
    } catch (e) { console.error(e); }
    finally     { setLoading(false); }
  }, []);

  const fetchMessages = async (threadId) => {
    try {
      const res = await api.get(`/messages/threads/${threadId}`);
      setMessages(res.data.messages || []);
      // Update unread count in list
      setThreads(prev => prev.map(t => t._id === threadId ? { ...t, unreadCount: 0 } : t));
    } catch (e) { console.error(e); }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread || sending) return;
    socketRef.current?.emit('typing-stop', { threadId: selectedThread._id });
    clearTimeout(typingTimerRef.current);
    setSending(true);
    const optimisticId = `opt_${Date.now()}`;
    const optimistic = {
      _id: optimisticId, content: newMessage.trim(),
      sender: { _id: user._id, fullName: user.fullName, role: user.role, avatar: user.avatar },
      createdAt: new Date().toISOString(), isOptimistic: true,
    };
    setMessages(prev => [...prev, optimistic]);
    const sentContent = newMessage.trim();
    setNewMessage('');
    try {
      const res = await api.post(`/messages/threads/${selectedThread._id}/messages`, { content: sentContent });
      setMessages(prev => prev.map(m => m._id === optimisticId ? res.data.message : m));
      fetchThreads();
    } catch (e) {
      console.error(e);
      setMessages(prev => prev.filter(m => m._id !== optimisticId));
      setNewMessage(sentContent);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleTyping = (v) => {
    setNewMessage(v);
    if (!selectedThread || !socketRef.current) return;
    socketRef.current.emit('typing-start', { threadId: selectedThread._id, userId: user?._id });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit('typing-stop', { threadId: selectedThread._id });
    }, 1500);
  };

  const handleStatusChange = async (threadId, status) => {
    try {
      await api.patch(`/messages/threads/${threadId}/status`, { status });
      setThreads(prev => prev.map(t => t._id === threadId ? { ...t, status } : t));
      setSelectedThread(prev => prev?._id === threadId ? { ...prev, status } : prev);
    } catch (e) { console.error(e); }
  };

  const handlePriorityChange = async (threadId, priority) => {
    try {
      await api.patch(`/messages/threads/${threadId}/priority`, { priority });
      setThreads(prev => prev.map(t => t._id === threadId ? { ...t, priority } : t));
      setSelectedThread(prev => prev?._id === threadId ? { ...prev, priority } : prev);
    } catch (e) { console.error(e); }
  };

  const handleArchive = async (threadId) => {
    try {
      await api.patch(`/messages/threads/${threadId}/archive`, { archived: true });
      setThreads(prev => prev.filter(t => t._id !== threadId));
      if (selectedThread?._id === threadId) setSelectedThread(threads.find(t => t._id !== threadId) || null);
    } catch (e) { console.error(e); }
  };


  const handleNewThread = (thread, msg) => {
    setThreads(prev => [thread, ...prev.filter(t => t._id !== thread._id)]);
    setSelectedThread(thread);
    setMessages([msg]);
    setMobileView('chat');
  };

  const selectThread = (thread) => {
    setSelectedThread(thread);
    setMobileView('chat');
  };

  // ── Filtering ─────────────────────────────────────────────────────────────────
  const filteredThreads = useMemo(() => {
    let list = threads;
    // Tab filter (admin only)
    if (isAdmin) {
      if (activeTab === 'unread')   list = list.filter(t => t.unreadCount > 0);
      if (activeTab === 'urgent')   list = list.filter(t => t.priority === 'urgent' || t.priority === 'high');
      if (activeTab === 'assigned') list = list.filter(t => t.assignedTo?._id === user?._id || t.assignedTo === user?._id);
    }
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => {
        const customer = getCustomer(t);
        const name = customer?.fullName || customer?.email || '';
        return name.toLowerCase().includes(q) || (t.subject || '').toLowerCase().includes(q);
      });
    }
    return list;
  }, [threads, activeTab, searchQuery, isAdmin, user?._id]);

  // Tab counts
  const tabCounts = useMemo(() => ({
    all:      threads.length,
    unread:   threads.filter(t => t.unreadCount > 0).length,
    urgent:   threads.filter(t => t.priority === 'urgent' || t.priority === 'high').length,
    assigned: threads.filter(t => t.assignedTo?._id === user?._id || t.assignedTo === user?._id).length,
  }), [threads, user?._id]);

  const isClosedOrResolved = selectedThread?.status === 'resolved' || selectedThread?.status === 'closed';

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: `2px solid ${border}`, borderTopColor: gold, animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        .sc-input::placeholder        { color: ${textMuted}; }
        .sc-input:focus               { outline: none; }
        .sc-textarea::placeholder     { color: ${textMuted}; }
        .sc-textarea:focus            { outline: none; }
        ::-webkit-scrollbar           { width: 4px; }
        ::-webkit-scrollbar-track     { background: transparent; }
        ::-webkit-scrollbar-thumb     { background: rgba(212,175,55,0.12); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover{ background: rgba(212,175,55,0.28); }
        @keyframes spin               { to{transform:rotate(360deg)} }
        @keyframes blink              { 0%,80%,100%{opacity:0} 40%{opacity:1} }
        .dot1{animation:blink 1.4s infinite 0.0s}
        .dot2{animation:blink 1.4s infinite 0.2s}
        .dot3{animation:blink 1.4s infinite 0.4s}
        @keyframes msgIn              { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{
        display: 'flex', height: '100vh',
        background: bg, overflow: 'hidden',
        fontFamily: "'Inter','IBM Plex Sans Arabic',system-ui,sans-serif",
        direction: isRTL ? 'rtl' : 'ltr',
      }}>

        {/* ══════════════════════════════════════════════════════════════════
            INBOX PANEL
        ══════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            width: '300px', flexShrink: 0,
            background: panelBg,
            borderInlineEnd: `1px solid ${border}`,
            display: 'flex', flexDirection: 'column',
            // Mobile: hide when chat is selected
            ...(mobileView === 'chat' ? { display: 'none' } : {}),
          }}
          className="md:flex flex-col"
        >
          {/* Inbox header */}
          <div style={{ padding: '18px 16px 0', borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: textMain, margin: '0 0 2px' }}>
                  {isAdmin
                    ? (language === 'ar' ? 'صندوق الوارد' : 'Support Inbox')
                    : (language === 'ar' ? 'محادثاتي' : 'My Conversations')
                  }
                </h2>
                <p style={{ fontSize: '10px', color: textMuted, margin: 0 }}>
                  {filteredThreads.length} {language === 'ar' ? 'محادثة' : 'conversations'}
                </p>
              </div>
              <button
                onClick={() => setShowNewModal(true)}
                style={{
                  width: '30px', height: '30px', borderRadius: '8px',
                  border: `1px solid ${border}`, background: 'transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: textMuted, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = gold; e.currentTarget.style.color = gold; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = textMuted; }}
                title={language === 'ar' ? 'محادثة جديدة' : 'New conversation'}
              >
                <Plus style={{ width: '13px', height: '13px' }} />
              </button>
            </div>

            {/* Admin tabs */}
            {isAdmin && (
              <div style={{ display: 'flex', gap: '0', marginBottom: '0', borderBottom: `1px solid ${border}` }}>
                {ADMIN_TABS.map(tab => {
                  const active  = activeTab === tab.id;
                  const count   = tabCounts[tab.id];
                  const Icon    = tab.icon;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      style={{
                        flex: 1, padding: '8px 4px', border: 'none', background: 'transparent',
                        cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                        borderBottom: `2px solid ${active ? gold : 'transparent'}`,
                        color: active ? gold : textMuted, transition: 'all 0.15s',
                      }}
                    >
                      <Icon style={{ width: '12px', height: '12px' }} />
                      <span style={{ fontSize: '9px', fontWeight: active ? 500 : 300 }}>
                        {language === 'ar' ? tab.labelAr : tab.label}
                        {count > 0 && <span style={{ marginInlineStart: '3px', fontSize: '8px', color: active ? gold : textMuted }}>({count})</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 0' }}>
              <Search style={{ width: '12px', height: '12px', color: textMuted, flexShrink: 0 }} />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder={language === 'ar' ? 'بحث في المحادثات…' : 'Search conversations…'}
                className="sc-input"
                style={{ flex: 1, background: 'transparent', border: 'none', color: textMain, fontSize: '12px', fontFamily: 'inherit', fontWeight: 300, direction: isRTL ? 'rtl' : 'ltr' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: 0 }}>
                  <X style={{ width: '11px', height: '11px' }} />
                </button>
              )}
            </div>
          </div>

          {/* Thread list */}
          <div ref={threadListRef} style={{ flex: 1, overflowY: 'auto' }}>
            {filteredThreads.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', margin: '0 auto 16px', background: 'rgba(212,175,55,0.06)', border: `1px solid rgba(212,175,55,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Inbox style={{ width: '22px', height: '22px', color: gold, opacity: 0.5 }} />
                </div>
                <p style={{ color: textMain, fontSize: '13px', fontWeight: 400, marginBottom: '8px' }}>
                  {searchQuery
                    ? (language === 'ar' ? 'لا نتائج' : 'No results')
                    : isAdmin
                    ? (language === 'ar' ? 'لا محادثات بعد' : 'No conversations yet')
                    : (language === 'ar' ? 'مرحباً بك في مركز الدعم' : 'Welcome to Support')
                  }
                </p>
                {!searchQuery && !isAdmin && (
                  <>
                    <p style={{ color: textMuted, fontSize: '11px', lineHeight: 1.6, marginBottom: '18px', fontWeight: 300 }}>
                      {language === 'ar'
                        ? 'هل تحتاج مساعدة؟ فريقنا هنا لك. ابدأ محادثة وسنرد في أقرب وقت.'
                        : 'Need help? Our team is here for you. Start a conversation and we\'ll respond as soon as possible.'
                      }
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginBottom: '16px' }}>
                      {CATEGORIES.slice(0, 4).map(cat => {
                        const Icon = cat.icon;
                        return (
                          <button key={cat.value} onClick={() => setShowNewModal(true)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '5px',
                              padding: '5px 10px', borderRadius: '8px', cursor: 'pointer',
                              border: `1px solid ${cat.color}30`, background: `${cat.color}10`,
                              color: cat.color, fontSize: '10px', fontWeight: 400,
                              transition: 'all 0.15s',
                            }}
                          >
                            <Icon style={{ width: '10px', height: '10px' }} />
                            {language === 'ar' ? cat.labelAr : cat.label}
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={() => setShowNewModal(true)}
                      style={{
                        padding: '10px 20px', borderRadius: '10px',
                        background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)',
                        color: gold, fontSize: '11px', fontWeight: 400,
                        letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = gold; e.currentTarget.style.color = '#000'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.1)'; e.currentTarget.style.color = gold; }}
                    >
                      {language === 'ar' ? '+ تواصل مع الدعم' : '+ Contact Support'}
                    </button>
                  </>
                )}
              </div>
            ) : filteredThreads.map(thread => (
              <div key={thread._id} data-row>
                <ThreadRow
                  thread={thread}
                  isSelected={selectedThread?._id === thread._id}
                  isAdmin={isAdmin}
                  currentUserId={user?._id}
                  onClick={selectThread}
                  lang={language}
                  tk={tk}
                  isRTL={isRTL}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            CHAT AREA
        ══════════════════════════════════════════════════════════════════ */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          background: chatBg, minWidth: 0,
          ...(mobileView === 'list' ? { display: 'none' } : {}),
        }} className="md:flex">
          {!selectedThread ? (
            /* Empty chat state */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '32px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageCircle style={{ width: '28px', height: '28px', color: gold, opacity: 0.5 }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '16px', fontWeight: 400, color: textMain, marginBottom: '6px' }}>
                  {language === 'ar' ? 'اختر محادثة' : 'Select a conversation'}
                </p>
                <p style={{ fontSize: '12px', color: textMuted, fontWeight: 300 }}>
                  {language === 'ar' ? 'أو ابدأ محادثة جديدة' : 'or start a new one'}
                </p>
              </div>
              <button onClick={() => setShowNewModal(true)}
                style={{
                  padding: '10px 22px', borderRadius: '10px',
                  background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)',
                  color: gold, fontSize: '11px', fontWeight: 400, letterSpacing: '0.1em',
                  textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = gold; e.currentTarget.style.color = '#000'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.1)'; e.currentTarget.style.color = gold; }}
              >
                {language === 'ar' ? '+ جديد' : '+ New Conversation'}
              </button>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={{
                padding: '12px 18px', background: panelBg,
                borderBottom: `1px solid ${border}`,
                display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0,
                flexWrap: 'wrap', rowGap: '8px',
              }}>
                {/* Mobile back */}
                <button
                  onClick={() => setMobileView('list')}
                  className="md:hidden"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: '2px', display: 'flex', alignItems: 'center' }}
                >
                  {isRTL ? <ChevronRight style={{ width: '18px', height: '18px' }} /> : <ChevronLeft style={{ width: '18px', height: '18px' }} />}
                </button>

                {/* Avatar */}
                <Avatar
                  name={isAdmin ? (getCustomer(selectedThread)?.fullName || getCustomer(selectedThread)?.email || '?') : 'YANSY Team'}
                  size={34}
                  active
                  src={isAdmin ? getCustomer(selectedThread)?.avatar : null}
                  role={isAdmin ? getCustomer(selectedThread)?.role : 'ADMIN'}
                />

                {/* Title area */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 500, color: textMain, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {isAdmin
                      ? (getCustomer(selectedThread)?.fullName || getCustomer(selectedThread)?.email || language === 'ar' ? 'عميل' : 'Customer')
                      : (language === 'ar' ? 'فريق YANSY' : 'YANSY Team')
                    }
                    {isAdmin && getCustomer(selectedThread)?.companyName && (
                      <span style={{ fontSize: '11px', color: textMuted, fontWeight: 300, marginInlineStart: '6px' }}>
                        · {getCustomer(selectedThread)?.companyName}
                      </span>
                    )}
                  </h3>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <CategoryBadge type={selectedThread.type} lang={language} />
                    <StatusBadge status={selectedThread.status} lang={language} />
                    {selectedThread.subject && (
                      <span style={{ fontSize: '10px', color: textMuted, fontStyle: 'normal', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                        {selectedThread.subject}
                      </span>
                    )}
                  </div>
                </div>

                {/* Admin controls */}
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                    {/* Priority */}
                    <select value={selectedThread.priority || 'medium'} onChange={e => handlePriorityChange(selectedThread._id, e.target.value)}
                      style={{ padding: '5px 8px', borderRadius: '6px', border: `1px solid ${border}`, background: inputBg, color: textMain, fontSize: '10px', fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}
                    >
                      {PRIORITIES.map(p => <option key={p.value} value={p.value}>{language === 'ar' ? p.labelAr : p.label}</option>)}
                    </select>
                    {/* Status */}
                    <select value={selectedThread.status} onChange={e => handleStatusChange(selectedThread._id, e.target.value)}
                      style={{ padding: '5px 8px', borderRadius: '6px', border: `1px solid ${border}`, background: inputBg, color: textMain, fontSize: '10px', fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}
                    >
                      {Object.entries(STATUSES).filter(([k]) => !['pending','in_progress'].includes(k)).map(([k, v]) => (
                        <option key={k} value={k}>{language === 'ar' ? v.labelAr : v.label}</option>
                      ))}
                    </select>
                    {/* Archive */}
                    <button onClick={() => handleArchive(selectedThread._id)} title={language === 'ar' ? 'أرشفة' : 'Archive'}
                      style={{ padding: '5px 8px', borderRadius: '6px', border: `1px solid ${border}`, background: 'transparent', color: textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = textMuted; }}
                    >
                      <Archive style={{ width: '12px', height: '12px' }} />
                    </button>
                    {/* Toggle customer panel */}
                    <button onClick={() => setShowCustomerPanel(v => !v)} title={language === 'ar' ? 'معلومات العميل' : 'Customer Info'}
                      style={{
                        padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                        border: `1px solid ${showCustomerPanel ? gold : border}`,
                        background: showCustomerPanel ? 'rgba(212,175,55,0.08)' : 'transparent',
                        color: showCustomerPanel ? gold : textMuted, transition: 'all 0.15s',
                      }}
                    >
                      <User2 style={{ width: '12px', height: '12px' }} />
                    </button>
                  </div>
                )}
                {/* Customer: quick actions */}
                {!isAdmin && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {isClosedOrResolved ? (
                      <button onClick={() => handleStatusChange(selectedThread._id, 'open')}
                        style={{
                          padding: '6px 12px', borderRadius: '8px', fontSize: '10px',
                          border: `1px solid ${gold}`, background: 'rgba(212,175,55,0.1)',
                          color: gold, cursor: 'pointer', letterSpacing: '0.08em',
                        }}
                      >
                        {language === 'ar' ? 'إعادة فتح' : 'Reopen'}
                      </button>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Messages scroll area — direction:ltr to keep bubbles positionally consistent */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '2px', direction: 'ltr' }}>
                {messages.length === 0 && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: 0.4 }}>
                    <MessageCircle style={{ width: '32px', height: '32px', color: textMuted }} />
                    <p style={{ fontSize: '12px', color: textMuted, fontWeight: 300 }}>
                      {language === 'ar' ? 'ابدأ المحادثة' : 'Start the conversation'}
                    </p>
                  </div>
                )}

                {messages.map((msg, idx) => {
                  const senderId  = msg.sender?._id || msg.sender;
                  const isOwn     = senderId?.toString() === user?._id?.toString();
                  const prevMsg   = messages[idx - 1];
                  const nextMsg   = messages[idx + 1];
                  const prevSame  = prevMsg && (prevMsg.sender?._id || prevMsg.sender)?.toString() === senderId?.toString();
                  const nextSame  = nextMsg && (nextMsg.sender?._id || nextMsg.sender)?.toString() === senderId?.toString();
                  const isTeamMsg = msg.sender?.role === 'ADMIN' || msg.sender?.role === 'SUPER_ADMIN';

                  return (
                    <div
                      key={msg._id}
                      style={{
                        display: 'flex',
                        justifyContent: isOwn ? 'flex-end' : 'flex-start',
                        marginBottom: nextSame ? '2px' : '12px',
                        alignItems: 'flex-end', gap: '8px',
                        animation: msg.isOptimistic ? 'none' : 'msgIn 0.22s ease-out',
                        opacity: msg.isOptimistic ? 0.7 : 1,
                      }}
                    >
                      {/* Other side avatar */}
                      {!isOwn && (
                        <div style={{ width: '28px', flexShrink: 0 }}>
                          {!nextSame && (
                            <Avatar name={msg.sender?.fullName || '?'} size={28} src={msg.sender?.avatar} role={msg.sender?.role} />
                          )}
                        </div>
                      )}

                      {/* Bubble group */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', maxWidth: '65%' }}>
                        {/* Sender label */}
                        {!prevSame && (
                          <span style={{
                            fontSize: '9px', color: textMuted, fontWeight: 500, letterSpacing: '0.08em',
                            textTransform: 'uppercase', marginBottom: '4px',
                            paddingInlineStart: isOwn ? '0' : '4px',
                          }}>
                            {isOwn
                              ? (language === 'ar' ? 'أنت' : 'You')
                              : isTeamMsg
                              ? (language === 'ar' ? 'فريق YANSY' : 'YANSY Team')
                              : (msg.sender?.fullName || (language === 'ar' ? 'عميل' : 'Customer'))
                            }
                          </span>
                        )}

                        {/* Bubble */}
                        <div style={{
                          padding: '10px 14px',
                          background: isOwn
                            ? gold
                            : isDark ? 'rgba(255,255,255,0.08)' : '#ffffff',
                          color: isOwn ? '#000' : textMain,
                          fontSize: '13px', fontWeight: 300, lineHeight: 1.6,
                          border: isOwn ? 'none' : `1px solid ${border}`,
                          borderRadius: isOwn
                            ? (prevSame ? '18px 4px 4px 18px' : nextSame ? '18px 18px 4px 18px' : '18px 4px 18px 18px')
                            : (prevSame ? '4px 18px 18px 4px' : nextSame ? '4px 18px 18px 4px' : '4px 18px 18px 18px'),
                          boxShadow: isOwn
                            ? '0 2px 10px rgba(212,175,55,0.2)'
                            : isDark ? '0 2px 6px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.05)',
                          wordBreak: 'break-word',
                          // Arabic text inside bubble goes RTL
                          direction: isRTL ? 'rtl' : 'ltr',
                          textAlign: isRTL ? 'right' : 'left',
                        }}>
                          {msg.content}
                        </div>

                        {/* Timestamp + receipt */}
                        {!nextSame && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px', paddingInlineStart: '3px' }}>
                            <span style={{ fontSize: '9px', color: textMuted }}>{fmt(msg.createdAt, language)}</span>
                            {isOwn && (
                              msg.isOptimistic
                                ? <Clock style={{ width: '10px', height: '10px', color: textMuted, opacity: 0.4 }} />
                                : msg.isRead
                                ? <CheckCheck style={{ width: '10px', height: '10px', color: gold }} />
                                : <Check style={{ width: '10px', height: '10px', color: textMuted, opacity: 0.5 }} />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {typingUser && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '8px' }}>
                    <Avatar name="?" size={28} role={isAdmin ? 'USER' : 'ADMIN'} />
                    <div style={{ padding: '12px 16px', background: isDark ? 'rgba(255,255,255,0.07)' : '#ffffff', border: `1px solid ${border}`, borderRadius: '4px 18px 18px 18px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {[1,2,3].map(i => <span key={i} className={`dot${i}`} style={{ width: '5px', height: '5px', borderRadius: '50%', background: textMuted, display: 'inline-block' }} />)}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <div style={{ padding: '12px 16px', background: panelBg, borderTop: `1px solid ${border}`, flexShrink: 0 }}>
                {/* Resolved/closed notice for customers */}
                {isClosedOrResolved && !isAdmin ? (
                  <div style={{ textAlign: 'center', padding: '10px', color: textMuted, fontSize: '12px' }}>
                    {language === 'ar'
                      ? `هذه المحادثة ${STATUSES[selectedThread.status]?.labelAr || ''}. `
                      : `This conversation is ${STATUSES[selectedThread.status]?.label || 'closed'}. `
                    }
                    <button onClick={() => handleStatusChange(selectedThread._id, 'open')}
                      style={{ background: 'none', border: 'none', color: gold, cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}
                    >
                      {language === 'ar' ? 'أعد فتحها' : 'Reopen it'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                    <div style={{
                      flex: 1, display: 'flex', alignItems: 'center',
                      background: inputBg, border: `1px solid ${border}`,
                      borderRadius: '22px', padding: '10px 16px', gap: '8px', transition: 'border-color 0.2s',
                    }}
                      onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'}
                      onBlurCapture={e  => e.currentTarget.style.borderColor = border}
                    >
                      <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={e => handleTyping(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e); }}
                        placeholder={language === 'ar' ? 'اكتب رسالتك…' : 'Type your message…'}
                        className="sc-input"
                        style={{
                          flex: 1, background: 'transparent', border: 'none',
                          color: textMain, fontSize: '13px', fontFamily: 'inherit', fontWeight: 300,
                          direction: isRTL ? 'rtl' : 'ltr',
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      style={{
                        width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
                        background: (sending || !newMessage.trim()) ? inputBg : gold,
                        border: `1px solid ${(sending || !newMessage.trim()) ? border : gold}`,
                        color: (sending || !newMessage.trim()) ? textMuted : '#000',
                        cursor: (sending || !newMessage.trim()) ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s', transform: 'scale(1)',
                      }}
                      onMouseEnter={e => { if (!sending && newMessage.trim()) e.currentTarget.style.transform = 'scale(1.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      {sending
                        ? <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: textMuted, animation: 'spin 0.7s linear infinite' }} />
                        : <Send style={{ width: '15px', height: '15px', transform: isRTL ? 'scaleX(-1)' : 'none' }} />
                      }
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            CUSTOMER INFO PANEL (admin only)
        ══════════════════════════════════════════════════════════════════ */}
        {isAdmin && selectedThread && showCustomerPanel && (
          <CustomerInfoPanel
            thread={selectedThread}
            isDark={isDark}
            lang={language}
            isRTL={isRTL}
            tk={tk}
          />
        )}
      </div>

      {/* New conversation modal */}
      {showNewModal && (
        <NewConversationModal
          onClose={() => setShowNewModal(false)}
          onCreated={handleNewThread}
          isAdmin={isAdmin}
          adminUsers={adminUsers}
          isDark={isDark}
          isRTL={isRTL}
          language={language}
          tk={tk}
        />
      )}
    </>
  );
};

export default Messages;
