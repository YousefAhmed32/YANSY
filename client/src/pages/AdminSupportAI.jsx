/**
 * AdminSupportAI — AI Center
 * Conversations · Leads · Requests · Tickets · Escalations · Analytics
 */
import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useSelector } from 'react-redux';
import {
  Sparkles, RefreshCw, MessageSquare, Target, Zap, Ticket, AlertTriangle, TrendingUp,
  LayoutDashboard, Calendar, CalendarDays, Star, Percent, Inbox, User, Ghost,
  BarChart3, ChevronRight, X, Settings, Save, MessageCircle,
} from 'lucide-react';
import {
  TK, FONT, STATUS_TONE, PageHeader, StatCard, Badge, Card, SectionHead, Tabs, DataTable,
  Modal, Select, SearchInput, Button, IconButton, Spinner, TextInput, TextArea, Switch,
} from '../admin-ui';
import { useLanguage } from '../contexts/LanguageContext';

const API = () =>
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:5000/api';

const ah = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const fmt = (d) => new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

// ── Tone mapping (business status/priority/intent → admin-ui STATUS_TONE) ────
const priorityTone = (p) => ({ low: 'success', medium: 'warning', high: 'danger', critical: 'danger' }[p] || 'neutral');
const statusTone   = (s) => ({ new: 'info', contacted: 'purple', proposal_sent: 'info', won: 'success', lost: 'danger', open: 'info', pending: 'warning', in_progress: 'purple', resolved: 'success', closed: 'neutral' }[s] || 'neutral');
const intentTone   = (i) => ({ lead: 'success', support: 'info', inquiry: 'purple', complaint: 'danger', other: 'neutral' }[i] || 'neutral');

// Sentiment stays content-level (emoji + color), not a chrome badge.
const SENT_CLR = { positive: TK.green, neutral: TK.textMuted, frustrated: TK.amber, urgent: TK.red };
const SENT_ICO = { positive: '😊', neutral: '😐', frustrated: '😤', urgent: '🚨' };

const toOpts = (arr) => arr.map(([value, label]) => ({ value, label }));

// Cost Profile presets — a starting point admins can apply then fine-tune;
// the individually-toggled flags below always win, this just bulk-sets them.
const COST_PROFILE_PRESETS = {
  economy:  { visionEnabled: false, fileAnalysisEnabled: false, documentGenerationEnabled: false, streamingEnabled: false, memoryEnabled: true, longContextEnabled: false, deepReasoningEnabled: false, voiceEnabled: false, ragEnabled: true },
  balanced: { visionEnabled: true,  fileAnalysisEnabled: true,  documentGenerationEnabled: true,  streamingEnabled: true,  memoryEnabled: true, longContextEnabled: true,  deepReasoningEnabled: false, voiceEnabled: true,  ragEnabled: true },
  premium:  { visionEnabled: true,  fileAnalysisEnabled: true,  documentGenerationEnabled: true,  streamingEnabled: true,  memoryEnabled: true, longContextEnabled: true,  deepReasoningEnabled: true,  voiceEnabled: true,  ragEnabled: true },
};

// ── Bilingual label maps (EN/AR) for enum-like business values ───────────────
const STATUS_LABEL = {
  new:           { en: 'New',            ar: 'جديد' },
  contacted:     { en: 'Contacted',      ar: 'تم التواصل' },
  proposal_sent: { en: 'Proposal Sent',  ar: 'تم إرسال العرض' },
  won:           { en: 'Won',            ar: 'تم الفوز' },
  lost:          { en: 'Lost',           ar: 'خسر' },
  open:          { en: 'Open',           ar: 'مفتوحة' },
  pending:       { en: 'Pending',        ar: 'قيد الانتظار' },
  in_progress:   { en: 'In Progress',    ar: 'قيد التنفيذ' },
  resolved:      { en: 'Resolved',       ar: 'تم الحل' },
  closed:        { en: 'Closed',         ar: 'مغلقة' },
};
const PRIORITY_LABEL = {
  low:      { en: 'Low',      ar: 'منخفضة' },
  medium:   { en: 'Medium',   ar: 'متوسطة' },
  high:     { en: 'High',     ar: 'عالية' },
  critical: { en: 'Critical', ar: 'حرجة' },
};
const USERTYPE_LABEL = {
  registered: { en: 'Registered', ar: 'مسجل' },
  guest:      { en: 'Guest',      ar: 'زائر' },
};
const INTENT_LABEL = {
  lead:      { en: 'Lead',      ar: 'عميل محتمل' },
  support:   { en: 'Support',   ar: 'دعم' },
  inquiry:   { en: 'Inquiry',   ar: 'استفسار' },
  complaint: { en: 'Complaint', ar: 'شكوى' },
  other:     { en: 'Other',     ar: 'أخرى' },
};
const SENTIMENT_LABEL = {
  positive:   { en: 'Positive',   ar: 'إيجابي' },
  neutral:    { en: 'Neutral',    ar: 'محايد' },
  frustrated: { en: 'Frustrated', ar: 'محبَط' },
  urgent:     { en: 'Urgent',     ar: 'عاجل' },
};
const FIELD_LABEL = {
  name:        { en: 'Name',         ar: 'الاسم' },
  phone:       { en: 'Phone',        ar: 'الهاتف' },
  email:       { en: 'Email',        ar: 'البريد الإلكتروني' },
  company:     { en: 'Company',      ar: 'الشركة' },
  project:     { en: 'Project',      ar: 'المشروع' },
  projectType: { en: 'Project Type', ar: 'نوع المشروع' },
  timeline:    { en: 'Timeline',     ar: 'الجدول الزمني' },
  features:    { en: 'Features',     ar: 'المزايا' },
  business:    { en: 'Business',     ar: 'النشاط التجاري' },
};

// L(map, key, language, fallback) — looks up a bilingual label, falling back to the raw key/value.
const L = (map, key, language, fallback) => (map[key] ? (language === 'ar' ? map[key].ar : map[key].en) : (fallback ?? key));

const statusEntries = (kind, language) => {
  const keys = kind === 'ticket'
    ? ['open', 'pending', 'in_progress', 'resolved', 'closed']
    : ['new', 'contacted', 'proposal_sent', 'won', 'lost'];
  return keys.map(k => [k, L(STATUS_LABEL, k, language)]);
};
const priorityEntries = (language) => ['low', 'medium', 'high', 'critical'].map(k => [k, L(PRIORITY_LABEL, k, language)]);
const userTypeEntries = (language) => ['registered', 'guest'].map(k => [k, L(USERTYPE_LABEL, k, language)]);
const anonVisitor = (language) => (language === 'ar' ? 'زائر مجهول' : 'Anonymous Visitor');

// ── Shared small presentational pieces ────────────────────────────────────────
const ScoreBar = ({ score, size = 64 }) => {
  const color = score >= 70 ? TK.green : score >= 40 ? TK.accent : TK.textLight;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ width: size, height: '4px', background: TK.borderSoft, borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, transition: 'width .6s ease' }} />
      </div>
      <span style={{ fontSize: '10px', color, fontFamily: 'monospace', fontWeight: 700, minWidth: '22px' }}>{score}</span>
    </div>
  );
};

const FieldGrid = ({ fields, cols = 2 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '6px 16px' }}>
    {fields.filter(([, v]) => v).map(([label, val]) => (
      <div key={label}>
        <p style={{ margin: 0, fontSize: '9.5px', color: TK.textLight, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</p>
        <p style={{ margin: 0, fontSize: '12.5px', color: TK.text, wordBreak: 'break-word' }}>{val}</p>
      </div>
    ))}
  </div>
);

const inpSty = { background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '9px', color: TK.text, padding: '8px 12px', fontSize: '12.5px', outline: 'none', fontFamily: 'inherit' };

const Section = ({ label, children }) => (
  <div style={{ marginBottom: '18px' }}>
    <SectionHead title={label} />
    {children}
  </div>
);

const ModalHeader = ({ title, sub, onClose, children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '22px', gap: '12px' }}>
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px', flexWrap: 'wrap' }}>
        {children}
      </div>
      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: TK.text, lineHeight: 1.3 }}>{title}</h3>
      {sub && <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: TK.textLight, fontFamily: 'monospace' }}>{sub}</p>}
    </div>
    <IconButton icon={X} size={28} onClick={onClose} />
  </div>
);

// ── Conversation Transcript Panel ─────────────────────────────────────────────
const ConvPanel = memo(({ conv, token, language, onClose, onUpdate }) => {
  const isRTL = language === 'ar';
  const [note,   setNote]   = useState(conv.adminNotes || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!conv.isRead) {
      fetch(`${API()}/support/admin/conversation/${conv._id}`, { method: 'PATCH', headers: ah(token), body: JSON.stringify({ isRead: true }) }).catch(() => {});
    }
  }, []); // eslint-disable-line

  const saveNote = async () => {
    setSaving(true);
    try {
      await fetch(`${API()}/support/admin/conversation/${conv._id}`, { method: 'PATCH', headers: ah(token), body: JSON.stringify({ adminNotes: note, isRead: true }) });
      onUpdate({ ...conv, adminNotes: note, isRead: true });
    } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} width="680px">
      <ModalHeader title={conv.lead?.name || anonVisitor(language)} sub={fmt(conv.createdAt)} onClose={onClose}>
        <Badge tone={intentTone(conv.primaryIntent)}>{L(INTENT_LABEL, conv.primaryIntent, language)}</Badge>
        {conv.leadScore > 0 && <Badge tone="info">{language === 'ar' ? 'النقاط' : 'Score'} {conv.leadScore}</Badge>}
        {conv.userType === 'registered' && <Badge tone="purple">{L(USERTYPE_LABEL, 'registered', language)}</Badge>}
      </ModalHeader>

      {conv.lead?.detected && (
        <Section label={language === 'ar' ? 'بيانات العميل المحتمل' : 'Lead Information'}>
          <div style={{ background: TK.greenBg, border: `1px solid ${TK.greenBd}`, borderRadius: '10px', padding: '12px 16px' }}>
            <FieldGrid fields={[
              [L(FIELD_LABEL, 'name', language),     conv.lead.name],
              [L(FIELD_LABEL, 'phone', language),    conv.lead.phone],
              [L(FIELD_LABEL, 'email', language),    conv.lead.email],
              [L(FIELD_LABEL, 'company', language),  conv.lead.business],
              [L(FIELD_LABEL, 'project', language),  conv.lead.projectType],
              [L(FIELD_LABEL, 'timeline', language), conv.lead.timeline],
              [L(FIELD_LABEL, 'features', language), Array.isArray(conv.lead.features) ? conv.lead.features.join(', ') : conv.lead.features],
            ]} />
          </div>
        </Section>
      )}

      {conv.conversationSummary && (
        <Section label={language === 'ar' ? 'ملخص الذكاء الاصطناعي' : 'AI Summary'}>
          <p style={{ margin: 0, fontSize: '13px', color: TK.textMuted, lineHeight: 1.6, background: TK.bgSubtle, padding: '10px 14px', borderRadius: '8px', border: `1px solid ${TK.borderSoft}` }}>{conv.conversationSummary}</p>
        </Section>
      )}

      <Section label={language === 'ar' ? `المحادثة الكاملة (${conv.messages?.length || 0} رسالة)` : `Full Conversation (${conv.messages?.length || 0} messages)`}>
        <div className="au-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '7px', maxHeight: '340px', overflowY: 'auto', paddingInlineEnd: '4px' }}>
          {(conv.messages || []).map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? (isRTL ? 'flex-start' : 'flex-end') : (isRTL ? 'flex-end' : 'flex-start') }}>
              <div style={{
                maxWidth: '82%', padding: '9px 12px', fontSize: '12.5px', lineHeight: 1.6,
                borderRadius: m.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                background: m.role === 'user' ? TK.accentBg : TK.bgSubtle,
                border: `1px solid ${m.role === 'user' ? TK.accentBd : TK.borderSoft}`,
                color: TK.text,
              }}>
                <span style={{ fontSize: '9.5px', color: m.role === 'user' ? TK.accent : TK.textLight, display: 'block', marginBottom: '3px' }}>{m.role === 'user' ? (language === 'ar' ? 'زائر' : 'Visitor') : 'YANSY AI'} · {m.timestamp ? fmt(m.timestamp) : ''}</span>
                {m.content}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section label={language === 'ar' ? 'ملاحظات الإدارة' : 'Admin Notes'}>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder={language === 'ar' ? 'أضف ملاحظات داخلية...' : 'Add internal notes...'} rows={3}
          style={{ ...inpSty, width: '100%', resize: 'vertical', marginBottom: '10px', boxSizing: 'border-box' }} />
        <Button variant="primary" style={{ width: '100%' }} loading={saving} onClick={saveNote}>{language === 'ar' ? 'حفظ' : 'Save'}</Button>
      </Section>
    </Modal>
  );
});
ConvPanel.displayName = 'ConvPanel';

// ── Request Detail Panel ──────────────────────────────────────────────────────
const RequestPanel = memo(({ req, conv, token, language, onClose, onUpdate }) => {
  const [status,   setStatus]   = useState(req.status);
  const [priority, setPriority] = useState(req.priority);
  const [note,     setNote]     = useState('');
  const [saving,   setSaving]   = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${API()}/support/admin/request/${req._id}`, { method: 'PATCH', headers: ah(token), body: JSON.stringify({ status, priority, note: note.trim() || undefined, isRead: true }) });
      const d = await r.json();
      if (d.request) { onUpdate(d.request); setNote(''); }
    } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} width="700px">
      <ModalHeader title={req.name} sub={`${req.requestCode} · ${fmtDate(req.createdAt)}`} onClose={onClose}>
        <Badge tone={statusTone(status)}>{L(STATUS_LABEL, status, language, status?.replace('_', ' '))}</Badge>
        <Badge tone={priorityTone(priority)}>{L(PRIORITY_LABEL, priority, language)}</Badge>
        {req.leadScore > 0 && <Badge tone="info">{language === 'ar' ? 'النقاط' : 'Score'} {req.leadScore}</Badge>}
      </ModalHeader>

      {/* Contact + Project */}
      <Section label={language === 'ar' ? 'بيانات العميل المحتمل' : 'Lead Information'}>
        <div style={{ background: TK.greenBg, border: `1px solid ${TK.greenBd}`, borderRadius: '10px', padding: '12px 16px' }}>
          <FieldGrid fields={[
            [L(FIELD_LABEL, 'name', language),        req.name],
            [L(FIELD_LABEL, 'phone', language),       req.phone],
            [L(FIELD_LABEL, 'email', language),       req.email],
            [L(FIELD_LABEL, 'company', language),     req.company],
            [L(FIELD_LABEL, 'projectType', language), req.projectType],
            [L(FIELD_LABEL, 'timeline', language),    req.timeline],
            [L(FIELD_LABEL, 'features', language),    req.features],
            [L(FIELD_LABEL, 'business', language),    req.business],
          ]} />
        </div>
      </Section>

      {req.requirementsSummary && (
        <Section label={language === 'ar' ? 'ملخص المتطلبات' : 'Requirements Summary'}>
          <p style={{ margin: 0, fontSize: '13px', color: TK.textMuted, lineHeight: 1.6, background: TK.bgSubtle, padding: '10px 14px', borderRadius: '8px', border: `1px solid ${TK.borderSoft}` }}>{req.requirementsSummary}</p>
        </Section>
      )}

      {req.aiRecommendation && (
        <Section label={language === 'ar' ? 'توصية الذكاء الاصطناعي' : 'AI Recommendation'}>
          <div style={{ background: TK.accentBg, border: `1px solid ${TK.accentBd}`, borderRadius: '10px', padding: '12px 16px', display: 'flex', gap: '10px' }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>🤖</span>
            <p style={{ margin: 0, fontSize: '13px', color: TK.text, lineHeight: 1.6 }}>{req.aiRecommendation}</p>
          </div>
        </Section>
      )}

      {conv && (
        <Section label={language === 'ar' ? 'المحادثة المرتبطة' : 'Linked Conversation'}>
          <div style={{ background: TK.bgSubtle, border: `1px solid ${TK.borderSoft}`, borderRadius: '10px', padding: '11px 15px' }}>
            {conv.conversationSummary && <p style={{ margin: '0 0 8px', fontSize: '12.5px', color: TK.textMuted, lineHeight: 1.6 }}>{conv.conversationSummary}</p>}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {conv.leadScore > 0 && <span style={{ fontSize: '11px', color: TK.accent }}>{language === 'ar' ? 'نقاط العميل' : 'Lead Score'}: <strong>{conv.leadScore}/100</strong></span>}
              {conv.sentiment   && <span style={{ fontSize: '11px', color: SENT_CLR[conv.sentiment] }}>{SENT_ICO[conv.sentiment]} {L(SENTIMENT_LABEL, conv.sentiment, language)}</span>}
            </div>
          </div>
        </Section>
      )}

      {/* Controls */}
      <Section label={language === 'ar' ? 'تحديث الحالة' : 'Update Status'}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label style={{ display: 'block', fontSize: '10.5px', color: TK.textMuted, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '.07em' }}>{language === 'ar' ? 'الحالة' : 'Status'}</label>
            <Select value={status} onChange={e => setStatus(e.target.value)} options={toOpts(statusEntries('request', language))} />
          </div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label style={{ display: 'block', fontSize: '10.5px', color: TK.textMuted, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '.07em' }}>{language === 'ar' ? 'الأولوية' : 'Priority'}</label>
            <Select value={priority} onChange={e => setPriority(e.target.value)} options={toOpts(priorityEntries(language))} />
          </div>
        </div>

        {/* Notes history */}
        {req.notes?.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            {req.notes.map((n, i) => (
              <div key={i} style={{ background: TK.bgSubtle, border: `1px solid ${TK.borderSoft}`, borderRadius: '8px', padding: '8px 12px', marginBottom: '6px' }}>
                <p style={{ margin: '0 0 3px', fontSize: '12px', color: TK.text }}>{n.content}</p>
                <p style={{ margin: 0, fontSize: '10px', color: TK.textLight }}>{n.addedBy?.fullName || (language === 'ar' ? 'المشرف' : 'Admin')} · {fmtDate(n.addedAt)}</p>
              </div>
            ))}
          </div>
        )}

        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder={language === 'ar' ? 'أضف ملاحظة (مثال: تم الاتصال بالعميل، تم إرسال العرض)...' : 'Add a note (e.g. Called customer, sent proposal)...'} rows={3}
          style={{ ...inpSty, width: '100%', resize: 'vertical', marginBottom: '10px', boxSizing: 'border-box' }} />
        <Button variant="primary" style={{ width: '100%' }} loading={saving} onClick={save}>{language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}</Button>
      </Section>
    </Modal>
  );
});
RequestPanel.displayName = 'RequestPanel';

// ── Ticket Panel ──────────────────────────────────────────────────────────────
const TicketPanel = memo(({ ticket, conv, token, language, onClose, onUpdate }) => {
  const isRTL = language === 'ar';
  const [note,     setNote]     = useState('');
  const [status,   setStatus]   = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [saving,   setSaving]   = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${API()}/support/admin/ticket/${ticket._id}`, { method: 'PATCH', headers: ah(token), body: JSON.stringify({ status, priority, note: note.trim() || undefined }) });
      const d = await r.json();
      if (d.ticket) { onUpdate(d.ticket); setNote(''); }
    } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} width="680px">
      <ModalHeader title={ticket.subject} sub={ticket.ticketId} onClose={onClose}>
        <Badge tone={statusTone(status)}>{L(STATUS_LABEL, status, language, status?.replace('_',' '))}</Badge>
        <Badge tone={priorityTone(priority)}>{L(PRIORITY_LABEL, priority, language)}</Badge>
      </ModalHeader>

      <Section label={language === 'ar' ? 'العميل' : 'Customer'}>
        <FieldGrid fields={[
          [L(FIELD_LABEL, 'name', language),  ticket.customer?.name],
          [L(FIELD_LABEL, 'email', language), ticket.customer?.email],
          [L(FIELD_LABEL, 'phone', language), ticket.customer?.phone],
        ]} />
      </Section>

      {conv?.conversationSummary && (
        <Section label={language === 'ar' ? 'رؤى الذكاء الاصطناعي' : 'AI Insights'}>
          <div style={{ background: TK.accentBg, border: `1px solid ${TK.accentBd}`, borderRadius: '10px', padding: '11px 15px' }}>
            <p style={{ margin: '0 0 6px', fontSize: '12.5px', color: TK.textMuted, lineHeight: 1.6 }}>{conv.conversationSummary}</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {conv.leadScore > 0 && <span style={{ fontSize: '11px', color: TK.accent }}>{language === 'ar' ? 'النقاط' : 'Score'}: <strong>{conv.leadScore}</strong></span>}
              {conv.sentiment  && <span style={{ fontSize: '11px', color: SENT_CLR[conv.sentiment] }}>{SENT_ICO[conv.sentiment]} {L(SENTIMENT_LABEL, conv.sentiment, language)}</span>}
            </div>
          </div>
        </Section>
      )}

      {ticket.conversationSnapshot?.length > 0 && (
        <Section label={language === 'ar' ? 'لقطة من المحادثة' : 'Conversation Snapshot'}>
          <div className="au-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '7px', maxHeight: '240px', overflowY: 'auto' }}>
            {ticket.conversationSnapshot.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? (isRTL ? 'flex-start' : 'flex-end') : (isRTL ? 'flex-end' : 'flex-start') }}>
                <div style={{ maxWidth: '80%', padding: '8px 12px', fontSize: '12px', borderRadius: m.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px', background: m.role === 'user' ? TK.accentBg : TK.bgSubtle, color: TK.text }}>{m.content}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section label={language === 'ar' ? 'تحديث' : 'Update'}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '10.5px', color: TK.textMuted, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '.07em' }}>{language === 'ar' ? 'الحالة' : 'Status'}</label>
            <Select value={status} onChange={e => setStatus(e.target.value)} options={toOpts(statusEntries('ticket', language))} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '10.5px', color: TK.textMuted, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '.07em' }}>{language === 'ar' ? 'الأولوية' : 'Priority'}</label>
            <Select value={priority} onChange={e => setPriority(e.target.value)} options={toOpts(priorityEntries(language))} />
          </div>
        </div>
        {ticket.notes?.length > 0 && (
          <div style={{ marginBottom: '10px' }}>
            {ticket.notes.map((n, i) => (
              <div key={i} style={{ background: TK.bgSubtle, border: `1px solid ${TK.borderSoft}`, borderRadius: '8px', padding: '8px 12px', marginBottom: '6px' }}>
                <p style={{ margin: '0 0 2px', fontSize: '12px', color: TK.text }}>{n.content}</p>
                <p style={{ margin: 0, fontSize: '10px', color: TK.textLight }}>{n.addedBy?.fullName || (language === 'ar' ? 'المشرف' : 'Admin')} · {fmtDate(n.addedAt)}</p>
              </div>
            ))}
          </div>
        )}
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder={language === 'ar' ? 'أضف ملاحظة...' : 'Add a note...'} rows={3}
          style={{ ...inpSty, width: '100%', resize: 'vertical', marginBottom: '10px', boxSizing: 'border-box' }} />
        <Button variant="primary" style={{ width: '100%' }} loading={saving} onClick={save}>{language === 'ar' ? 'حفظ' : 'Save'}</Button>
      </Section>
    </Modal>
  );
});
TicketPanel.displayName = 'TicketPanel';

// ── Filter bar wrapper ─────────────────────────────────────────────────────────
const FilterBar = ({ children }) => (
  <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
    {children}
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const AdminSupportAI = () => {
  const token = useSelector(s => s.auth?.token);
  const { language, isRTL } = useLanguage();
  const font = FONT(isRTL);

  const [tab,           setTab]           = useState('overview');
  const [analytics,     setAnalytics]     = useState(null);
  const [anaLoading,    setAnaLoading]    = useState(true);
  const [costAnalytics, setCostAnalytics] = useState(null);
  const [costLoading,   setCostLoading]   = useState(false);
  const [loading,       setLoading]       = useState(false);

  // Data
  const [conversations, setConversations] = useState([]);
  const [leads,         setLeads]         = useState([]);
  const [requests,      setRequests]      = useState([]);
  const [tickets,       setTickets]       = useState([]);
  const [escalations,   setEscalations]   = useState([]);

  // Totals
  const [convTotal, setConvTotal]   = useState(0);
  const [leadTotal, setLeadTotal]   = useState(0);
  const [reqTotal,  setReqTotal]    = useState(0);
  const [tickTotal, setTickTotal]   = useState(0);
  const [escTotal,  setEscTotal]    = useState(0);

  // Pages
  const [convPage, setConvPage] = useState(1);
  const [leadPage, setLeadPage] = useState(1);
  const [reqPage,  setReqPage]  = useState(1);
  const [tickPage, setTickPage] = useState(1);
  const [escPage,  setEscPage]  = useState(1);

  // Filters
  const [convF, setConvF] = useState({ search: '', intent: '', sentiment: '', hasLead: '', userType: '' });
  const [leadF, setLeadF] = useState({ search: '', userType: '', minScore: '' });
  const [reqF,  setReqF]  = useState({ search: '', status: '', priority: '', userType: '' });
  const [tickF, setTickF] = useState({ search: '', status: '', priority: '', userType: '' });

  // Selected panels
  const [selConv,   setSelConv]   = useState(null);
  const [selReq,    setSelReq]    = useState(null);
  const [selReqConv,setSelReqConv]= useState(null);
  const [selTicket, setSelTicket] = useState(null);
  const [tickConv,  setTickConv]  = useState(null);

  // AI consultant configuration (SystemSettings, category 'ai_chat')
  const [chatSettings,        setChatSettings]        = useState(null);
  const [chatSettingsLoading, setChatSettingsLoading]  = useState(false);
  const [chatSettingsSaving,  setChatSettingsSaving]   = useState(false);
  const [chatSettingsSaved,   setChatSettingsSaved]    = useState(false);

  // RAG knowledge base
  const [knowledgeDocs,    setKnowledgeDocs]    = useState(null);
  const [knowledgeLoading, setKnowledgeLoading]  = useState(false);
  const [knowledgeSaving,  setKnowledgeSaving]   = useState(false);
  const [newDoc,           setNewDoc]           = useState({ title: '', content: '', category: 'faq' });

  const timer = useRef(null);
  const PER   = 15;

  // ── Fetchers ──────────────────────────────────────────────────────────────
  const fetchAnalytics = useCallback(async () => {
    setAnaLoading(true);
    try {
      const r = await fetch(`${API()}/support/admin/analytics`, { headers: ah(token) });
      setAnalytics(await r.json());
    } catch {} finally { setAnaLoading(false); }
  }, [token]);

  const fetchCostAnalytics = useCallback(async () => {
    setCostLoading(true);
    try {
      const r = await fetch(`${API()}/support/admin/cost-analytics`, { headers: ah(token) });
      setCostAnalytics(await r.json());
    } catch {} finally { setCostLoading(false); }
  }, [token]);

  const mkFetch = (url, setData, setTotal) => async (page = 1, f = {}) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit: PER, ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)) });
      const r = await fetch(`${API()}/support/${url}?${p}`, { headers: ah(token) });
      const d = await r.json();
      setData(d[Object.keys(d).find(k => Array.isArray(d[k]))] || []);
      setTotal(d.total || 0);
    } catch {} finally { setLoading(false); }
  };

  const fetchConversations = useCallback(mkFetch('admin/conversations', setConversations, setConvTotal), [token]); // eslint-disable-line
  const fetchLeads         = useCallback(mkFetch('admin/leads',         setLeads,         setLeadTotal), [token]); // eslint-disable-line
  const fetchRequests      = useCallback(mkFetch('admin/requests',      setRequests,      setReqTotal),  [token]); // eslint-disable-line
  const fetchTickets       = useCallback(mkFetch('admin/tickets',       setTickets,       setTickTotal), [token]); // eslint-disable-line
  const fetchEscalations   = useCallback(mkFetch('admin/escalations',   setEscalations,   setEscTotal),  [token]); // eslint-disable-line

  // ── AI consultant configuration ──────────────────────────────────────────
  const fetchChatSettings = useCallback(async () => {
    setChatSettingsLoading(true);
    try {
      const r = await fetch(`${API()}/admin/settings?category=ai_chat`, { headers: ah(token) });
      const d = await r.json();
      const flat = {};
      (d.settings || []).forEach(s => { flat[s.key] = s.value; });
      setChatSettings(flat);
    } catch {} finally { setChatSettingsLoading(false); }
  }, [token]);

  const saveChatSettings = useCallback(async () => {
    if (!chatSettings) return;
    setChatSettingsSaving(true);
    setChatSettingsSaved(false);
    try {
      const updates = Object.entries(chatSettings).map(([key, value]) => ({ key, value }));
      await fetch(`${API()}/admin/settings`, {
        method: 'PATCH', headers: ah(token), body: JSON.stringify({ updates }),
      });
      setChatSettingsSaved(true);
      setTimeout(() => setChatSettingsSaved(false), 2500);
    } catch {} finally { setChatSettingsSaving(false); }
  }, [chatSettings, token]);

  const setChatField = (key, value) => setChatSettings(prev => ({ ...prev, [key]: value }));

  const applyCostProfile = (profile) => {
    const preset = COST_PROFILE_PRESETS[profile];
    setChatSettings(prev => ({
      ...prev,
      'aiChat.costProfile': profile,
      ...Object.fromEntries(Object.entries(preset).map(([k, v]) => [`aiChat.${k}`, v])),
    }));
  };

  // ── RAG knowledge base ──────────────────────────────────────────────────────
  const fetchKnowledge = useCallback(async () => {
    setKnowledgeLoading(true);
    try {
      const r = await fetch(`${API()}/support/admin/knowledge`, { headers: ah(token) });
      const d = await r.json();
      setKnowledgeDocs(d.docs || []);
    } catch {} finally { setKnowledgeLoading(false); }
  }, [token]);

  const createKnowledgeDoc = useCallback(async () => {
    if (!newDoc.title.trim() || !newDoc.content.trim()) return;
    setKnowledgeSaving(true);
    try {
      const r = await fetch(`${API()}/support/admin/knowledge`, { method: 'POST', headers: ah(token), body: JSON.stringify(newDoc) });
      const d = await r.json();
      if (d.doc) { setKnowledgeDocs(prev => [d.doc, ...(prev || [])]); setNewDoc({ title: '', content: '', category: 'faq' }); }
    } catch {} finally { setKnowledgeSaving(false); }
  }, [newDoc, token]);

  const toggleKnowledgeDoc = useCallback(async (doc) => {
    setKnowledgeDocs(prev => prev.map(d => d._id === doc._id ? { ...d, isActive: !d.isActive } : d));
    try {
      await fetch(`${API()}/support/admin/knowledge/${doc._id}`, { method: 'PATCH', headers: ah(token), body: JSON.stringify({ isActive: !doc.isActive }) });
    } catch {}
  }, [token]);

  const deleteKnowledgeDoc = useCallback(async (id) => {
    setKnowledgeDocs(prev => prev.filter(d => d._id !== id));
    try {
      await fetch(`${API()}/support/admin/knowledge/${id}`, { method: 'DELETE', headers: ah(token) });
    } catch {}
  }, [token]);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);
  useEffect(() => { if (tab === 'config' && !chatSettings) fetchChatSettings(); }, [tab, chatSettings, fetchChatSettings]);
  useEffect(() => { if (tab === 'config' && knowledgeDocs === null) fetchKnowledge(); }, [tab, knowledgeDocs, fetchKnowledge]);
  useEffect(() => { if (tab === 'cost' && !costAnalytics) fetchCostAnalytics(); }, [tab, costAnalytics, fetchCostAnalytics]);

  useEffect(() => {
    if (tab === 'conversations') fetchConversations(convPage, convF);
    if (tab === 'leads')         fetchLeads(leadPage, leadF);
    if (tab === 'requests')      fetchRequests(reqPage, reqF);
    if (tab === 'tickets')       fetchTickets(tickPage, tickF);
    if (tab === 'escalations')   fetchEscalations(escPage);
  }, [tab]); // eslint-disable-line

  // ── Filter helpers ────────────────────────────────────────────────────────
  const mkFilter = (setF, setPage, fetcher) => (key, val) => {
    setF(prev => {
      const next = { ...prev, [key]: val };
      setPage(1);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fetcher(1, next), 380);
      return next;
    });
  };

  const cf = mkFilter(setConvF, setConvPage, fetchConversations);
  const lf = mkFilter(setLeadF, setLeadPage, fetchLeads);
  const rf = mkFilter(setReqF,  setReqPage,  fetchRequests);
  const tf = mkFilter(setTickF, setTickPage, fetchTickets);

  // ── Open detail panels ────────────────────────────────────────────────────
  const openConv = async (c) => {
    try {
      const r = await fetch(`${API()}/support/admin/conversation/${c._id}`, { headers: ah(token) });
      const d = await r.json();
      setSelConv(d.conversation || c);
    } catch { setSelConv(c); }
  };

  const openReq = async (r) => {
    setSelReq(r);
    try {
      const res = await fetch(`${API()}/support/admin/request/${r._id}`, { headers: ah(token) });
      const d   = await res.json();
      setSelReq(d.request || r);
      setSelReqConv(d.conversation || null);
    } catch { setSelReqConv(null); }
  };

  const openTicket = async (t) => {
    setSelTicket(t);
    try {
      const r = await fetch(`${API()}/support/admin/ticket/${t._id}`, { headers: ah(token) });
      const d = await r.json();
      setTickConv(d.conversation || null);
      if (d.ticket) setSelTicket(d.ticket);
    } catch { setTickConv(null); }
  };

  // ── Tab config ────────────────────────────────────────────────────────────
  const reqTabCount = reqTotal || analytics?.requestsTotal || 0;
  const tabItems = [
    { value: 'overview',      label: language === 'ar' ? 'نظرة عامة' : 'Overview',    icon: LayoutDashboard },
    { value: 'conversations', label: language === 'ar' ? 'المحادثات' : 'Chats',       icon: MessageSquare, count: analytics?.unreadCount > 0 ? analytics.unreadCount : undefined },
    { value: 'leads',         label: language === 'ar' ? 'العملاء المحتملون' : 'Leads', icon: Target,      count: analytics?.leadsTotal > 0 ? analytics.leadsTotal : undefined },
    { value: 'requests',      label: language === 'ar' ? 'الطلبات' : 'Requests',      icon: Zap,           count: reqTabCount > 0 ? reqTabCount : undefined },
    { value: 'tickets',       label: language === 'ar' ? 'التذاكر' : 'Tickets',       icon: Ticket,        count: analytics?.ticketsOpen > 0 ? analytics.ticketsOpen : undefined },
    { value: 'escalations',   label: language === 'ar' ? 'التصعيدات' : 'Escalations', icon: AlertTriangle, count: analytics?.escalationsTotal > 0 ? analytics.escalationsTotal : undefined },
    { value: 'analytics',     label: language === 'ar' ? 'التحليلات' : 'Analytics',   icon: TrendingUp },
    { value: 'cost',          label: language === 'ar' ? 'التكلفة' : 'Cost',          icon: Percent },
    { value: 'config',        label: language === 'ar' ? 'الإعدادات' : 'Configuration', icon: Settings },
  ];

  // ── DataTable column definitions ─────────────────────────────────────────
  const convColumns = [
    {
      key: 'visitor', label: language === 'ar' ? 'الزائر' : 'Visitor', width: '32%',
      render: (c) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0, background: c.isRead ? 'transparent' : TK.accent, border: c.isRead ? `1px solid ${TK.border}` : 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: TK.text }}>{c.lead?.name || anonVisitor(language)}</span>
            {c.userType === 'registered' && <Badge tone="purple">{language === 'ar' ? 'عميل مميز' : 'VIP'}</Badge>}
            <Badge tone={intentTone(c.primaryIntent)}>{L(INTENT_LABEL, c.primaryIntent, language)}</Badge>
          </div>
        </div>
      ),
    },
    {
      key: 'message', label: language === 'ar' ? 'آخر رسالة' : 'Last Message', width: '28%',
      render: (c) => (
        <span style={{ fontSize: '11.5px', color: TK.textMuted, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '260px' }}>
          {c.messages?.[c.messages.length - 1]?.content?.slice(0, 80) || (language === 'ar' ? 'لا توجد رسائل' : 'No messages')}
        </span>
      ),
    },
    { key: 'score',   label: language === 'ar' ? 'النقاط' : 'Score',   width: '15%', render: (c) => c.leadScore > 0 ? <ScoreBar score={c.leadScore} /> : <span style={{ fontSize: '11px', color: TK.textLight }}>—</span> },
    { key: 'updated', label: language === 'ar' ? 'آخر تحديث' : 'Updated', width: '15%', render: (c) => <span style={{ fontSize: '11px', color: TK.textLight }}>{fmt(c.updatedAt || c.createdAt)}</span> },
  ];

  const leadColumns = [
    {
      key: 'lead', label: language === 'ar' ? 'العميل المحتمل' : 'Lead', width: '28%',
      render: (l) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: TK.text }}>{l.lead?.name || (language === 'ar' ? 'غير معروف' : 'Unknown')}</span>
            {l.userType === 'registered' && <Badge tone="purple">{L(USERTYPE_LABEL, 'registered', language)}</Badge>}
            {l.requestId && <Badge tone="info">{language === 'ar' ? 'طلب' : 'Request'}</Badge>}
          </div>
          <div style={{ fontSize: '11px', color: TK.textMuted, marginTop: '2px' }}>{l.lead?.phone || l.lead?.email || (language === 'ar' ? 'لا توجد بيانات تواصل' : 'No contact info')}</div>
        </div>
      ),
    },
    {
      key: 'project', label: language === 'ar' ? 'المشروع' : 'Project', width: '22%',
      render: (l) => (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {l.lead?.projectType && <Badge tone="info">{l.lead.projectType}</Badge>}
          {l.lead?.timeline    && <Badge tone="neutral">{l.lead.timeline}</Badge>}
        </div>
      ),
    },
    {
      key: 'sentiment', label: language === 'ar' ? 'الحالة الشعورية' : 'Sentiment', width: '15%',
      render: (l) => l.sentiment ? <span style={{ fontSize: '11.5px', color: SENT_CLR[l.sentiment] }}>{SENT_ICO[l.sentiment]} {L(SENTIMENT_LABEL, l.sentiment, language)}</span> : <span style={{ fontSize: '11px', color: TK.textLight }}>—</span>,
    },
    { key: 'score',   label: language === 'ar' ? 'النقاط' : 'Score',   width: '15%', render: (l) => <ScoreBar score={l.leadScore || 0} /> },
    { key: 'created', label: language === 'ar' ? 'تاريخ الإنشاء' : 'Created', width: '20%', render: (l) => <span style={{ fontSize: '11px', color: TK.textLight }}>{fmtDate(l.createdAt)}</span> },
  ];

  const reqColumns = [
    {
      key: 'request', label: language === 'ar' ? 'الطلب' : 'Request', width: '34%',
      render: (r) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '3px' }}>
            <span style={{ fontSize: '10.5px', fontFamily: 'monospace', color: TK.accent, fontWeight: 600 }}>{r.requestCode}</span>
            <Badge tone={statusTone(r.status)}>{L(STATUS_LABEL, r.status, language, r.status?.replace('_', ' '))}</Badge>
            <Badge tone={priorityTone(r.priority)}>{L(PRIORITY_LABEL, r.priority, language)}</Badge>
            {!r.isRead && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: TK.accent, display: 'inline-block' }} />}
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: TK.text }}>{r.name}</span>
        </div>
      ),
    },
    {
      key: 'contact', label: language === 'ar' ? 'التواصل' : 'Contact', width: '19%',
      render: (r) => (
        <div style={{ fontSize: '11px', color: TK.textMuted, lineHeight: 1.6 }}>
          {r.phone && <div>{r.phone}</div>}
          {r.email && <div>{r.email}</div>}
        </div>
      ),
    },
    {
      key: 'project', label: language === 'ar' ? 'المشروع' : 'Project', width: '19%',
      render: (r) => (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {r.projectType && <Badge tone="info">{r.projectType}</Badge>}
          {r.timeline    && <Badge tone="neutral">{r.timeline}</Badge>}
        </div>
      ),
    },
    { key: 'score',   label: language === 'ar' ? 'النقاط' : 'Score',   width: '13%', render: (r) => <ScoreBar score={r.leadScore || 0} /> },
    { key: 'created', label: language === 'ar' ? 'تاريخ الإنشاء' : 'Created', width: '15%', render: (r) => <span style={{ fontSize: '11px', color: TK.textLight }}>{fmtDate(r.createdAt)}</span> },
  ];

  const tickColumns = [
    {
      key: 'ticket', label: language === 'ar' ? 'التذكرة' : 'Ticket', width: '45%',
      render: (t) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10.5px', fontFamily: 'monospace', color: TK.accent, fontWeight: 600 }}>{t.ticketId}</span>
            <Badge tone={statusTone(t.status)}>{L(STATUS_LABEL, t.status, language, t.status?.replace('_', ' '))}</Badge>
            <Badge tone={priorityTone(t.priority)}>{L(PRIORITY_LABEL, t.priority, language)}</Badge>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 500, color: TK.text }}>{t.subject}</span>
        </div>
      ),
    },
    { key: 'customer', label: language === 'ar' ? 'العميل' : 'Customer', width: '30%', render: (t) => <span style={{ fontSize: '11.5px', color: TK.textMuted }}>{t.customer?.name || (language === 'ar' ? 'مجهول' : 'Anonymous')}</span> },
    { key: 'created',  label: language === 'ar' ? 'تاريخ الإنشاء' : 'Created',  width: '25%', render: (t) => <span style={{ fontSize: '11px', color: TK.textLight }}>{fmtDate(t.createdAt)}</span> },
  ];

  const escColumns = [
    {
      key: 'visitor', label: language === 'ar' ? 'الزائر' : 'Visitor', width: '30%',
      render: (e) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle style={{ width: '14px', height: '14px', color: TK.red, flexShrink: 0 }} />
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: TK.text }}>{e.lead?.name || anonVisitor(language)}</span>
          <Badge tone="danger">{L(PRIORITY_LABEL, e.escalation?.priority || 'high', language)}</Badge>
        </div>
      ),
    },
    { key: 'reason',  label: language === 'ar' ? 'السبب' : 'Reason',  width: '45%', render: (e) => <span style={{ fontSize: '12px', color: TK.red }}>{e.escalation?.reason || (language === 'ar' ? 'محادثة مُصعَّدة' : 'Escalated conversation')}</span> },
    { key: 'flagged', label: language === 'ar' ? 'تاريخ التصعيد' : 'Flagged', width: '25%', render: (e) => <span style={{ fontSize: '11px', color: TK.textLight }}>{e.escalation?.flaggedAt ? fmt(e.escalation.flaggedAt) : (language === 'ar' ? 'غير معروف' : 'Unknown')}</span> },
  ];

  const analyticsTiles = [
    { label: language === 'ar' ? 'إجمالي المحادثات' : 'Total Conversations', value: analytics?.totalConversations ?? 0, icon: MessageSquare, tone: 'info' },
    { label: language === 'ar' ? 'محادثات اليوم' : 'Conversations Today', value: analytics?.convToday         ?? 0, icon: Calendar,       tone: 'purple' },
    { label: language === 'ar' ? 'هذا الأسبوع' : 'This Week',           value: analytics?.convWeek          ?? 0, icon: CalendarDays,   tone: 'info' },
    { label: language === 'ar' ? 'إجمالي العملاء المحتملين' : 'Total Leads', value: analytics?.leadsTotal   ?? 0, icon: Target,         tone: 'success' },
    { label: language === 'ar' ? 'عملاء هذا الشهر' : 'Leads This Month',    value: analytics?.leadsMonth    ?? 0, icon: BarChart3,      tone: 'success' },
    { label: language === 'ar' ? 'عملاء هذا الأسبوع' : 'Leads This Week',   value: analytics?.leadsWeek      ?? 0, icon: TrendingUp,     tone: 'success' },
    { label: language === 'ar' ? 'متوسط نقاط العملاء' : 'Avg Lead Score',   value: analytics?.avgLeadScore   ?? 0, icon: Star,           tone: 'info' },
    { label: language === 'ar' ? 'معدل التحويل' : 'Conversion Rate',    value: `${analytics?.conversionRate ?? 0}%`, icon: Percent,     tone: 'info' },
    { label: language === 'ar' ? 'التذاكر المفتوحة' : 'Open Tickets',   value: analytics?.ticketsOpen       ?? 0, icon: Ticket,         tone: 'info' },
    { label: language === 'ar' ? 'إجمالي التذاكر' : 'Total Tickets',    value: analytics?.ticketsTotal      ?? 0, icon: Ticket,         tone: 'info' },
    { label: language === 'ar' ? 'التصعيدات' : 'Escalations',          value: analytics?.escalationsTotal  ?? 0, icon: AlertTriangle,  tone: 'danger' },
    { label: language === 'ar' ? 'غير مقروء' : 'Unread',                value: analytics?.unreadCount       ?? 0, icon: Inbox,          tone: 'info' },
  ];

  const quickNav = [
    { label: language === 'ar' ? 'عرض جميع المحادثات' : 'View All Conversations', tab: 'conversations', icon: MessageSquare },
    { label: language === 'ar' ? 'العملاء المؤهلون' : 'Qualified Leads',        tab: 'leads',         icon: Target },
    { label: language === 'ar' ? 'طلبات الذكاء الاصطناعي' : 'AI Requests',      tab: 'requests',       icon: Zap },
    { label: language === 'ar' ? 'تذاكر الدعم' : 'Support Tickets',             tab: 'tickets',        icon: Ticket },
    { label: language === 'ar' ? 'التصعيدات' : 'Escalations',                   tab: 'escalations',    icon: AlertTriangle },
    { label: language === 'ar' ? 'التحليلات' : 'Analytics',                     tab: 'analytics',      icon: TrendingUp },
  ];

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ padding: '28px 24px 60px', maxWidth: '1400px', margin: '0 auto', fontFamily: font, background: TK.bg, minHeight: '100vh', direction: isRTL ? 'rtl' : 'ltr' }}>

      <PageHeader
        icon={Sparkles}
        eyebrow={language === 'ar' ? 'لوحة التحكم' : 'Admin Panel'}
        title={language === 'ar' ? 'مركز الذكاء الاصطناعي' : 'AI Center'}
        subtitle={language === 'ar' ? 'المحادثات · العملاء المحتملون · الطلبات · التذاكر · التحليلات' : 'Conversations · Leads · Requests · Tickets · Analytics'}
        actions={<Button variant="secondary" icon={RefreshCw} onClick={fetchAnalytics}>{language === 'ar' ? 'تحديث' : 'Refresh'}</Button>}
      />

      {/* Stats grid */}
      {!anaLoading && analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <StatCard icon={MessageSquare} label={language === 'ar' ? 'إجمالي المحادثات' : 'Total Chats'}     value={analytics.totalConversations} sub={language === 'ar' ? `${analytics.convToday ?? 0} اليوم · ${analytics.convWeek ?? 0} هذا الأسبوع` : `${analytics.convToday ?? 0} today · ${analytics.convWeek ?? 0} this week`} tone="info" />
          <div onClick={() => setTab('leads')} style={{ cursor: 'pointer' }}>
            <StatCard icon={Target} label={language === 'ar' ? 'العملاء المكتسبون' : 'Leads Captured'} value={analytics.leadsTotal} sub={language === 'ar' ? `${analytics.leadsWeek ?? 0} هذا الأسبوع · متوسط النقاط ${analytics.avgLeadScore ?? 0}` : `${analytics.leadsWeek ?? 0} this week · avg score ${analytics.avgLeadScore ?? 0}`} tone="success" />
          </div>
          <div onClick={() => setTab('requests')} style={{ cursor: 'pointer' }}>
            <StatCard icon={Zap} label={language === 'ar' ? 'طلبات الذكاء الاصطناعي' : 'AI Requests'} value={reqTotal || 0} sub={language === 'ar' ? 'مؤهل تلقائياً' : 'Auto-qualified'} tone="info" />
          </div>
          <div onClick={() => setTab('tickets')} style={{ cursor: 'pointer' }}>
            <StatCard icon={Ticket} label={language === 'ar' ? 'التذاكر المفتوحة' : 'Open Tickets'} value={analytics.ticketsOpen} sub={language === 'ar' ? `${analytics.ticketsTotal} إجمالي` : `${analytics.ticketsTotal} total`} tone="info" />
          </div>
          <StatCard icon={TrendingUp} label={language === 'ar' ? 'معدل التحويل' : 'Conversion Rate'} value={`${analytics.conversionRate ?? 0}%`} sub={language === 'ar' ? 'زوار ← عملاء محتملون' : 'Visitors → leads'} tone="purple" />
          {analytics.escalationsTotal > 0 && (
            <div onClick={() => setTab('escalations')} style={{ cursor: 'pointer' }}>
              <StatCard icon={AlertTriangle} label={language === 'ar' ? 'التصعيدات' : 'Escalations'} value={analytics.escalationsTotal} sub={language === 'ar' ? 'تحتاج إلى اهتمام' : 'Needs attention'} tone="danger" />
            </div>
          )}
          {analytics.unreadCount > 0 && (
            <div onClick={() => setTab('conversations')} style={{ cursor: 'pointer' }}>
              <StatCard icon={Inbox} label={language === 'ar' ? 'غير مقروء' : 'Unread'} value={analytics.unreadCount} sub={language === 'ar' ? 'محادثات' : 'Conversations'} tone="info" />
            </div>
          )}
        </div>
      )}

      {/* Registered / Guest split */}
      {analytics && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 160px' }}>
            <StatCard icon={User} label={L(USERTYPE_LABEL, 'registered', language)} value={analytics.registeredConvs ?? 0} tone="purple" />
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <StatCard icon={Ghost} label={language === 'ar' ? 'زوار' : 'Guests'} value={analytics.guestConvs ?? 0} tone="neutral" />
          </div>
          {analytics.sentiment && (
            <Card style={{ flex: '3 1 220px' }}>
              <SectionHead title={language === 'ar' ? 'توزيع الحالة الشعورية' : 'Sentiment Breakdown'} />
              <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
                {Object.entries(analytics.sentiment).filter(([, v]) => v > 0).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px' }}>{SENT_ICO[k]}</span>
                    <span style={{ fontSize: '13px', color: SENT_CLR[k] || TK.text, fontWeight: 600 }}>{v}</span>
                    <span style={{ fontSize: '10.5px', color: TK.textMuted }}>{L(SENTIMENT_LABEL, k, language)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={{ marginBottom: '22px' }}>
        <Tabs value={tab} onChange={setTab} items={tabItems} />
      </div>

      {/* ══════ OVERVIEW ══════ */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {/* Intent breakdown */}
          {analytics?.intent && (
            <Card>
              <SectionHead title={language === 'ar' ? 'توزيع الغرض' : 'Intent Breakdown'} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(analytics.intent).filter(([, v]) => v > 0).map(([k, v]) => {
                  const fg = STATUS_TONE[intentTone(k)]?.fg || TK.text;
                  return (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '11px', color: fg, minWidth: '60px' }}>{L(INTENT_LABEL, k, language)}</span>
                      <div style={{ flex: 1, height: '6px', background: TK.borderSoft, borderRadius: '3px' }}>
                        <div style={{ width: `${(v / analytics.totalConversations) * 100}%`, height: '100%', background: fg, borderRadius: '3px', transition: 'width .6s ease' }} />
                      </div>
                      <span style={{ fontSize: '11px', color: TK.textMuted, minWidth: '22px', textAlign: 'right' }}>{v}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Quick actions */}
          <Card>
            <SectionHead title={language === 'ar' ? 'التنقل السريع' : 'Quick Navigation'} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {quickNav.map(({ label, tab: tgt, icon: Icon }) => (
                <div
                  key={tgt}
                  onClick={() => setTab(tgt)}
                  className="au-row"
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', border: `1px solid ${TK.border}`, borderRadius: '9px', cursor: 'pointer' }}
                >
                  <Icon style={{ width: '14px', height: '14px', color: TK.textMuted, flexShrink: 0 }} />
                  <span style={{ fontSize: '12.5px', color: TK.text, flex: 1 }}>{label}</span>
                  <ChevronRight style={{ width: '13px', height: '13px', color: TK.textLight }} />
                </div>
              ))}
            </div>
          </Card>

          {/* Recent requests preview */}
          <Card style={{ background: TK.accentBg, borderColor: TK.accentBd }}>
            <SectionHead title={language === 'ar' ? 'مسار طلبات الذكاء الاصطناعي' : 'AI Request Pipeline'} />
            {analytics ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['new','contacted','proposal_sent','won','lost'].map((s) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: STATUS_TONE[statusTone(s)]?.fg || TK.textMuted }}>{L(STATUS_LABEL, s, language)}{s === 'won' ? ' ✓' : ''}</span>
                    <span style={{ fontSize: '11px', color: TK.textLight }}>—</span>
                  </div>
                ))}
                <Button variant="secondary" style={{ marginTop: '6px' }} onClick={() => { setTab('requests'); fetchRequests(1, {}); }}>
                  {language === 'ar' ? '← عرض جميع الطلبات' : 'View All Requests →'}
                </Button>
              </div>
            ) : <Spinner />}
          </Card>
        </div>
      )}

      {/* ══════ CONVERSATIONS ══════ */}
      {tab === 'conversations' && (
        <div>
          <FilterBar>
            <SearchInput value={convF.search} onChange={e => cf('search', e.target.value)} onClear={() => cf('search', '')} placeholder={language === 'ar' ? 'ابحث بالاسم، البريد، الهاتف…' : 'Search name, email, phone…'} />
            <Select value={convF.intent}    onChange={e => cf('intent', e.target.value)}    options={toOpts([['', language === 'ar' ? 'كل الأغراض' : 'All Intents'], ...['lead','support','inquiry','complaint'].map(k => [k, L(INTENT_LABEL, k, language)])])} style={{ minWidth: '140px' }} />
            <Select value={convF.sentiment} onChange={e => cf('sentiment', e.target.value)} options={toOpts([['', language === 'ar' ? 'كل الحالات الشعورية' : 'All Sentiments'], ...['positive','neutral','frustrated','urgent'].map(k => [k, L(SENTIMENT_LABEL, k, language)])])} style={{ minWidth: '150px' }} />
            <Select value={convF.hasLead}   onChange={e => cf('hasLead', e.target.value)}   options={toOpts([['', language === 'ar' ? 'الكل' : 'All'],['true', language === 'ar' ? 'لديه عميل محتمل' : 'Has Lead']])} style={{ minWidth: '110px' }} />
            <Select value={convF.userType}  onChange={e => cf('userType', e.target.value)}  options={toOpts([['', language === 'ar' ? 'كل المستخدمين' : 'All Users'], ...userTypeEntries(language)])} style={{ minWidth: '130px' }} />
          </FilterBar>
          <DataTable
            columns={convColumns}
            rows={conversations}
            loading={loading}
            getRowId={c => c._id}
            onRowClick={openConv}
            emptyIcon={MessageSquare}
            emptyTitle={language === 'ar' ? 'لا توجد محادثات' : 'No conversations found'}
            page={convPage}
            totalPages={Math.max(1, Math.ceil(convTotal / PER))}
            onPageChange={p => { setConvPage(p); fetchConversations(p, convF); }}
            footer={language === 'ar' ? `عرض ${conversations.length} من ${convTotal} محادثة` : `Showing ${conversations.length} of ${convTotal} conversations`}
          />
        </div>
      )}

      {/* ══════ LEADS ══════ */}
      {tab === 'leads' && (
        <div>
          <FilterBar>
            <SearchInput value={leadF.search} onChange={e => lf('search', e.target.value)} onClear={() => lf('search', '')} placeholder={language === 'ar' ? 'ابحث بالاسم، الهاتف، البريد…' : 'Search name, phone, email…'} />
            <Select value={leadF.userType} onChange={e => lf('userType', e.target.value)} options={toOpts([['', language === 'ar' ? 'كل المستخدمين' : 'All Users'], ...userTypeEntries(language)])} style={{ minWidth: '130px' }} />
            <Select value={leadF.minScore} onChange={e => lf('minScore', e.target.value)} options={toOpts([['', language === 'ar' ? 'أي نقاط' : 'Any Score'],['80', language === 'ar' ? 'نقاط 80+' : 'Score 80+'],['60', language === 'ar' ? 'نقاط 60+' : 'Score 60+'],['40', language === 'ar' ? 'نقاط 40+' : 'Score 40+']])} style={{ minWidth: '130px' }} />
          </FilterBar>
          <DataTable
            columns={leadColumns}
            rows={leads}
            loading={loading}
            getRowId={l => l._id}
            onRowClick={openConv}
            emptyIcon={Target}
            emptyTitle={language === 'ar' ? 'لا يوجد عملاء محتملون مؤهلون بعد' : 'No qualified leads yet'}
            emptySubtitle={language === 'ar' ? 'يتم إنشاء العملاء المحتملين عندما يكمل الزائر تأهيل الذكاء الاصطناعي.' : 'Leads are created when a visitor completes the AI qualification.'}
            page={leadPage}
            totalPages={Math.max(1, Math.ceil(leadTotal / PER))}
            onPageChange={p => { setLeadPage(p); fetchLeads(p, leadF); }}
            footer={language === 'ar' ? `عرض ${leads.length} من ${leadTotal} عميل محتمل` : `Showing ${leads.length} of ${leadTotal} leads`}
          />
        </div>
      )}

      {/* ══════ REQUESTS ══════ */}
      {tab === 'requests' && (
        <div>
          <div style={{ marginBottom: '16px', padding: '10px 14px', background: TK.accentBg, border: `1px solid ${TK.accentBd}`, borderRadius: '10px', fontSize: '12px', color: TK.accent, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap style={{ width: '13px', height: '13px', flexShrink: 0 }} />
            {language === 'ar'
              ? 'يتم إنشاء طلبات الذكاء الاصطناعي تلقائياً عندما يؤهل الذكاء الاصطناعي عميلاً محتملاً (بعد جمع الاسم وبيانات التواصل ونوع المشروع). انقر على أي طلب لإدارته.'
              : 'AI Requests are automatically created when the AI qualifies a lead (name + contact + project type collected). Click any request to manage it.'}
          </div>
          <FilterBar>
            <SearchInput value={reqF.search} onChange={e => rf('search', e.target.value)} onClear={() => rf('search', '')} placeholder={language === 'ar' ? 'ابحث بالاسم، البريد، الرمز…' : 'Search name, email, code…'} />
            <Select value={reqF.status}   onChange={e => rf('status', e.target.value)}   options={toOpts([['', language === 'ar' ? 'كل الحالات' : 'All Status'], ...statusEntries('request', language)])} style={{ minWidth: '140px' }} />
            <Select value={reqF.priority} onChange={e => rf('priority', e.target.value)} options={toOpts([['', language === 'ar' ? 'كل الأولويات' : 'All Priority'], ...priorityEntries(language)])} style={{ minWidth: '140px' }} />
            <Select value={reqF.userType} onChange={e => rf('userType', e.target.value)} options={toOpts([['', language === 'ar' ? 'كل المستخدمين' : 'All Users'], ...userTypeEntries(language)])} style={{ minWidth: '130px' }} />
          </FilterBar>
          <DataTable
            columns={reqColumns}
            rows={requests}
            loading={loading}
            getRowId={r => r._id}
            onRowClick={openReq}
            emptyIcon={Zap}
            emptyTitle={language === 'ar' ? 'لا توجد طلبات ذكاء اصطناعي بعد' : 'No AI requests yet'}
            emptySubtitle={language === 'ar' ? 'يتم إنشاء الطلبات تلقائياً عندما يكمل الزائر التأهيل (الاسم + الهاتف/البريد + نوع المشروع).' : 'Requests are auto-created when a visitor completes qualification (name + phone/email + project type).'}
            page={reqPage}
            totalPages={Math.max(1, Math.ceil(reqTotal / PER))}
            onPageChange={p => { setReqPage(p); fetchRequests(p, reqF); }}
            footer={language === 'ar' ? `عرض ${requests.length} من ${reqTotal} طلب` : `Showing ${requests.length} of ${reqTotal} requests`}
          />
        </div>
      )}

      {/* ══════ TICKETS ══════ */}
      {tab === 'tickets' && (
        <div>
          <FilterBar>
            <SearchInput value={tickF.search} onChange={e => tf('search', e.target.value)} onClear={() => tf('search', '')} placeholder={language === 'ar' ? 'ابحث بالتذكرة، الموضوع، الاسم…' : 'Search ticket, subject, name…'} />
            <Select value={tickF.status}   onChange={e => tf('status', e.target.value)}   options={toOpts([['', language === 'ar' ? 'كل الحالات' : 'All Status'], ...statusEntries('ticket', language)])} style={{ minWidth: '150px' }} />
            <Select value={tickF.priority} onChange={e => tf('priority', e.target.value)} options={toOpts([['', language === 'ar' ? 'كل الأولويات' : 'All Priority'], ...priorityEntries(language)])} style={{ minWidth: '140px' }} />
            <Select value={tickF.userType} onChange={e => tf('userType', e.target.value)} options={toOpts([['', language === 'ar' ? 'كل المستخدمين' : 'All Users'], ...userTypeEntries(language)])} style={{ minWidth: '130px' }} />
          </FilterBar>
          <DataTable
            columns={tickColumns}
            rows={tickets}
            loading={loading}
            getRowId={t => t._id}
            onRowClick={openTicket}
            emptyIcon={Ticket}
            emptyTitle={language === 'ar' ? 'لا توجد تذاكر' : 'No tickets found'}
            page={tickPage}
            totalPages={Math.max(1, Math.ceil(tickTotal / PER))}
            onPageChange={p => { setTickPage(p); fetchTickets(p, tickF); }}
            footer={language === 'ar' ? `عرض ${tickets.length} من ${tickTotal} تذكرة` : `Showing ${tickets.length} of ${tickTotal} tickets`}
          />
        </div>
      )}

      {/* ══════ ESCALATIONS ══════ */}
      {tab === 'escalations' && (
        <div>
          <DataTable
            columns={escColumns}
            rows={escalations}
            loading={loading}
            getRowId={e => e._id}
            onRowClick={openConv}
            emptyIcon={AlertTriangle}
            emptyTitle={language === 'ar' ? 'لا توجد تصعيدات' : 'No escalations'}
            page={escPage}
            totalPages={Math.max(1, Math.ceil(escTotal / PER))}
            onPageChange={p => { setEscPage(p); fetchEscalations(p); }}
            footer={language === 'ar' ? `عرض ${escalations.length} من ${escTotal} تصعيد` : `Showing ${escalations.length} of ${escTotal} escalations`}
          />
        </div>
      )}

      {/* ══════ ANALYTICS ══════ */}
      {tab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {analyticsTiles.map(({ label, value, icon, tone }) => (
            <StatCard key={label} icon={icon} label={label} value={value} tone={tone} />
          ))}
        </div>
      )}

      {/* ══════ CONFIGURATION ══════ */}
      {tab === 'config' && (
        chatSettingsLoading || !chatSettings ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '860px' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <p style={{ fontSize: '12.5px', color: TK.textMuted, margin: 0, maxWidth: '520px', lineHeight: 1.6 }}>
                {language === 'ar'
                  ? 'يتحكم هذا القسم في شخصية وسلوك مستشار YANSY AI على الموقع العام — بدون الحاجة لتعديل الكود. التغييرات تنعكس خلال دقيقة تقريباً.'
                  : "Controls YANSY AI's personality and behavior on the public site — no code changes needed. Edits take effect within about a minute."}
              </p>
              <Button variant="primary" icon={chatSettingsSaved ? undefined : Save} onClick={saveChatSettings} loading={chatSettingsSaving}>
                {chatSettingsSaved ? (language === 'ar' ? '✓ تم الحفظ' : '✓ Saved') : (language === 'ar' ? 'حفظ التغييرات' : 'Save changes')}
              </Button>
            </div>

            <Card>
              <SectionHead title={language === 'ar' ? 'رسالة الترحيب' : 'Welcome Message'} subtitle={language === 'ar' ? 'أول رسالة يراها الزائر عند فتح المحادثة' : 'The first message a visitor sees when opening the chat'} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: TK.textMuted, display: 'block', marginBottom: '6px' }}>English</label>
                  <TextArea rows={4} value={chatSettings['aiChat.welcomeMessageEn'] || ''} onChange={e => setChatField('aiChat.welcomeMessageEn', e.target.value)} dir="ltr" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: TK.textMuted, display: 'block', marginBottom: '6px' }}>العربية</label>
                  <TextArea rows={4} value={chatSettings['aiChat.welcomeMessageAr'] || ''} onChange={e => setChatField('aiChat.welcomeMessageAr', e.target.value)} dir="rtl" />
                </div>
              </div>
            </Card>

            <Card>
              <SectionHead title={language === 'ar' ? 'الشخصية والنبرة' : 'Personality & Tone'} subtitle={language === 'ar' ? 'كيف يتحدث المستشار — يُضاف إلى تعليمات النظام الأساسية' : "How the consultant speaks — appended to the base system instructions"} />
              <TextInput value={chatSettings['aiChat.tone'] || ''} onChange={e => setChatField('aiChat.tone', e.target.value)} placeholder="confident, warm, senior-consultant..." />
            </Card>

            <Card>
              <SectionHead title={language === 'ar' ? 'تعليمات إضافية' : 'Additional Instructions'} subtitle={language === 'ar' ? 'سياق مؤقت — عروض موسمية، تركيز حملة، إلخ' : 'Temporary context — seasonal offers, campaign focus, etc.'} />
              <TextArea rows={3} value={chatSettings['aiChat.systemPromptAddendum'] || ''} onChange={e => setChatField('aiChat.systemPromptAddendum', e.target.value)} placeholder={language === 'ar' ? 'اختياري' : 'Optional'} />
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <Card>
                <SectionHead title={language === 'ar' ? 'درجة الحرارة' : 'Temperature'} subtitle={language === 'ar' ? '0 = دقيق، 1 = إبداعي' : '0 = precise, 1 = creative'} />
                <TextInput type="number" min="0" max="1" step="0.05" value={chatSettings['aiChat.temperature'] ?? 0.75} onChange={e => setChatField('aiChat.temperature', parseFloat(e.target.value))} />
              </Card>
              <Card>
                <SectionHead title={language === 'ar' ? 'نموذج مخصص' : 'Model Override'} subtitle={language === 'ar' ? 'اتركه فارغاً لاستخدام الإعداد الافتراضي' : 'Leave blank to use the server default'} />
                <TextInput value={chatSettings['aiChat.model'] || ''} onChange={e => setChatField('aiChat.model', e.target.value)} placeholder="gpt-4o-mini" dir="ltr" />
              </Card>
            </div>

            <Card>
              <SectionHead icon={MessageCircle} title={language === 'ar' ? 'قالب تسليم واتساب' : 'WhatsApp Handoff Template'} subtitle={language === 'ar' ? 'استخدم {{brief}} كعنصر نائب لملخص المشروع المُولَّد تلقائياً' : 'Use {{brief}} as the placeholder for the auto-generated project brief'} />
              <TextArea rows={4} value={chatSettings['aiChat.whatsappTemplate'] || ''} onChange={e => setChatField('aiChat.whatsappTemplate', e.target.value)} dir="ltr" />
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <Card>
                <SectionHead title={language === 'ar' ? 'المحادثة الصوتية' : 'Voice Conversation'} subtitle={language === 'ar' ? 'السماح بالتحدث والاستماع في الودجت العام' : 'Allow speaking/listening in the public widget'} />
                <Switch checked={chatSettings['aiChat.voiceEnabled'] !== false} onChange={v => setChatField('aiChat.voiceEnabled', v)} label={language === 'ar' ? 'مفعّل' : 'Enabled'} />
                {chatSettings['aiChat.voiceEnabled'] !== false && (
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: TK.textMuted, display: 'block', marginBottom: '6px' }}>{language === 'ar' ? 'الصوت' : 'TTS Voice'}</label>
                    <Select value={chatSettings['aiChat.voice'] || 'alloy'} onChange={e => setChatField('aiChat.voice', e.target.value)}
                      options={toOpts([['alloy', 'Alloy'], ['verse', 'Verse'], ['echo', 'Echo'], ['ember', 'Ember'], ['sage', 'Sage']])} />
                  </div>
                )}
              </Card>
              <Card>
                <SectionHead title={language === 'ar' ? 'الاستناد لقاعدة المعرفة' : 'Knowledge Grounding (RAG)'} subtitle={language === 'ar' ? 'استخدام قاعدة المعرفة أدناه بدلاً من الافتراضات' : 'Ground answers in the knowledge base below instead of assumptions'} />
                <Switch checked={chatSettings['aiChat.ragEnabled'] !== false} onChange={v => setChatField('aiChat.ragEnabled', v)} label={language === 'ar' ? 'مفعّل' : 'Enabled'} />
              </Card>
            </div>

            <Card>
              <SectionHead title={language === 'ar' ? 'قاعدة المعرفة' : 'Knowledge Base'} subtitle={language === 'ar' ? 'حقائق حقيقية عن الشركة — الخدمات، الأسعار، الأسئلة الشائعة، السياسات — يستند إليها المستشار بدلاً من الاختلاق' : 'Real company facts — services, pricing, FAQs, policies — the consultant grounds answers in these instead of inventing them'} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '10px', marginBottom: '10px' }}>
                <TextInput value={newDoc.title} onChange={e => setNewDoc(d => ({ ...d, title: e.target.value }))} placeholder={language === 'ar' ? 'العنوان (مثال: سياسة الاسترجاع)' : 'Title (e.g. Refund Policy)'} />
                <Select value={newDoc.category} onChange={e => setNewDoc(d => ({ ...d, category: e.target.value }))}
                  options={toOpts([['services', language === 'ar' ? 'الخدمات' : 'Services'], ['pricing', language === 'ar' ? 'الأسعار' : 'Pricing'], ['faq', 'FAQ'], ['case-study', language === 'ar' ? 'دراسة حالة' : 'Case Study'], ['policy', language === 'ar' ? 'سياسة' : 'Policy'], ['brand', language === 'ar' ? 'الهوية' : 'Brand'], ['other', language === 'ar' ? 'أخرى' : 'Other']])} />
              </div>
              <TextArea rows={3} value={newDoc.content} onChange={e => setNewDoc(d => ({ ...d, content: e.target.value }))} placeholder={language === 'ar' ? 'المحتوى الفعلي — سيتم استخدامه كحقيقة موثوقة' : 'The actual fact — this gets used as ground truth'} style={{ marginBottom: '10px' }} />
              <Button variant="secondary" onClick={createKnowledgeDoc} loading={knowledgeSaving} disabled={!newDoc.title.trim() || !newDoc.content.trim()}>
                {language === 'ar' ? '+ إضافة' : '+ Add entry'}
              </Button>

              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {knowledgeLoading && <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}><Spinner /></div>}
                {!knowledgeLoading && knowledgeDocs?.length === 0 && (
                  <p style={{ fontSize: '12px', color: TK.textLight, textAlign: 'center', padding: '16px 0' }}>
                    {language === 'ar' ? 'لا توجد إدخالات بعد' : 'No knowledge entries yet'}
                  </p>
                )}
                {knowledgeDocs?.map(doc => (
                  <div key={doc._id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', border: `1px solid ${TK.border}`, borderRadius: '10px', opacity: doc.isActive ? 1 : 0.5 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <Badge tone="neutral">{doc.category}</Badge>
                        <p style={{ margin: 0, fontSize: '12.5px', fontWeight: 600, color: TK.text }}>{doc.title}</p>
                      </div>
                      <p style={{ margin: 0, fontSize: '11.5px', color: TK.textMuted, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{doc.content}</p>
                    </div>
                    <Switch checked={doc.isActive} onChange={() => toggleKnowledgeDoc(doc)} />
                    <IconButton icon={X} onClick={() => deleteKnowledgeDoc(doc._id)} title={language === 'ar' ? 'حذف' : 'Delete'} />
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionHead title={language === 'ar' ? 'ملف التكلفة' : 'Cost Profile'} subtitle={language === 'ar' ? 'إعداد سريع لكل القدرات المكلفة — يمكن تعديل كل واحدة يدوياً بعده' : 'Bulk-sets every expensive capability — each can still be fine-tuned individually below'} />
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {['economy', 'balanced', 'premium'].map(p => {
                  const active = (chatSettings['aiChat.costProfile'] || 'balanced') === p;
                  return (
                    <button key={p} onClick={() => applyCostProfile(p)} style={{
                      padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, textTransform: 'capitalize', cursor: 'pointer',
                      border: `1px solid ${active ? TK.accent : TK.border}`, background: active ? TK.accent : TK.surface, color: active ? '#FFFFFF' : TK.text,
                    }}>
                      {p === 'economy' ? (language === 'ar' ? 'اقتصادي' : 'Economy') : p === 'balanced' ? (language === 'ar' ? 'متوازن' : 'Balanced') : (language === 'ar' ? 'مميز' : 'Premium')}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px 20px' }}>
                <Switch checked={chatSettings['aiChat.visionEnabled'] !== false} onChange={v => setChatField('aiChat.visionEnabled', v)} label={language === 'ar' ? 'تحليل الصور (Vision)' : 'Vision (image analysis)'} />
                <Switch checked={chatSettings['aiChat.fileAnalysisEnabled'] !== false} onChange={v => setChatField('aiChat.fileAnalysisEnabled', v)} label={language === 'ar' ? 'تحليل الملفات (PDF/Word)' : 'File Analysis (PDF/Word)'} />
                <Switch checked={chatSettings['aiChat.documentGenerationEnabled'] !== false} onChange={v => setChatField('aiChat.documentGenerationEnabled', v)} label={language === 'ar' ? 'إنشاء وثيقة المشروع' : 'Document Generation'} />
                <Switch checked={chatSettings['aiChat.streamingEnabled'] !== false} onChange={v => setChatField('aiChat.streamingEnabled', v)} label={language === 'ar' ? 'الردود المتدفقة' : 'Streaming Replies'} />
                <Switch checked={chatSettings['aiChat.memoryEnabled'] !== false} onChange={v => setChatField('aiChat.memoryEnabled', v)} label={language === 'ar' ? 'الذاكرة / استئناف المستخدم' : 'Memory / Resume'} />
                <Switch checked={chatSettings['aiChat.longContextEnabled'] !== false} onChange={v => setChatField('aiChat.longContextEnabled', v)} label={language === 'ar' ? 'سياق طويل' : 'Long Context'} />
                <Switch checked={chatSettings['aiChat.deepReasoningEnabled'] !== false} onChange={v => setChatField('aiChat.deepReasoningEnabled', v)} label={language === 'ar' ? 'تفكير عميق' : 'Deep Reasoning'} />
              </div>
            </Card>

          </div>
        )
      )}

      {/* ══════ COST ANALYTICS ══════ */}
      {tab === 'cost' && (
        costLoading || !costAnalytics ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {!costAnalytics.pricingConfigured && (
              <div style={{ padding: '12px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', fontSize: '12px', color: '#92400E' }}>
                {language === 'ar'
                  ? 'لم يتم ضبط جدول الأسعار بعد — كل التكاليف أدناه تظهر $0. اضبط aiChat.pricingTable في الإعدادات بأسعار حقيقية من فاتورة OpenAI.'
                  : 'No pricing rates configured yet — all cost figures below show $0. Set aiChat.pricingTable in Configuration with real rates from your OpenAI billing dashboard.'}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <StatCard icon={TrendingUp} label={language === 'ar' ? 'إجمالي التكلفة' : 'Total Cost'} value={`$${costAnalytics.totalCostUSD.toFixed(2)}`} />
              <StatCard icon={Calendar} label={language === 'ar' ? 'اليوم' : 'Today'} value={`$${costAnalytics.today.costUSD.toFixed(2)}`} />
              <StatCard icon={CalendarDays} label={language === 'ar' ? 'هذا الشهر' : 'This Month'} value={`$${costAnalytics.thisMonth.costUSD.toFixed(2)}`} />
              <StatCard icon={Target} label={language === 'ar' ? 'تكلفة لكل عميل مؤهل' : 'Cost / Qualified Lead'} value={costAnalytics.costPerQualifiedLeadUSD != null ? `$${costAnalytics.costPerQualifiedLeadUSD.toFixed(4)}` : '—'} />
              <StatCard icon={Zap} label={language === 'ar' ? 'إجمالي الطلبات' : 'Total AI Calls'} value={costAnalytics.totalCalls} />
              <StatCard icon={BarChart3} label={language === 'ar' ? 'إجمالي التوكنز' : 'Total Tokens'} value={(costAnalytics.totalInputTokens + costAnalytics.totalOutputTokens).toLocaleString()} />
            </div>

            <Card>
              <SectionHead title={language === 'ar' ? 'التكلفة حسب الميزة' : 'Cost by Feature'} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {costAnalytics.byFeature.length === 0 && <p style={{ fontSize: '12px', color: TK.textLight }}>{language === 'ar' ? 'لا توجد بيانات بعد' : 'No data yet'}</p>}
                {costAnalytics.byFeature.map(f => (
                  <div key={f.feature} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', border: `1px solid ${TK.border}`, borderRadius: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: TK.text, textTransform: 'capitalize' }}>{f.feature.replace('_', ' ')}</span>
                    <span style={{ fontSize: '11px', color: TK.textMuted }}>{f.calls} calls · {f.tokens.toLocaleString()} tokens</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: TK.accent }}>${f.costUSD.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionHead title={language === 'ar' ? 'التكلفة حسب النموذج' : 'Cost by Model'} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {costAnalytics.byModel.length === 0 && <p style={{ fontSize: '12px', color: TK.textLight }}>{language === 'ar' ? 'لا توجد بيانات بعد' : 'No data yet'}</p>}
                {costAnalytics.byModel.map(m => (
                  <div key={m.model} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', border: `1px solid ${TK.border}`, borderRadius: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: TK.text, fontFamily: 'monospace' }}>{m.model}</span>
                    <span style={{ fontSize: '11px', color: TK.textMuted }}>{m.calls} calls · {m.tokens.toLocaleString()} tokens</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: TK.accent }}>${m.costUSD.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionHead title={language === 'ar' ? 'الاتجاه اليومي (14 يوم)' : 'Daily Trend (14 days)'} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {costAnalytics.dailyTrend.length === 0 && <p style={{ fontSize: '12px', color: TK.textLight }}>{language === 'ar' ? 'لا توجد بيانات بعد' : 'No data yet'}</p>}
                {costAnalytics.dailyTrend.map(d => (
                  <div key={d.date} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', padding: '4px 2px' }}>
                    <span style={{ color: TK.textMuted }}>{d.date}</span>
                    <span style={{ color: TK.textMuted }}>{d.calls} calls</span>
                    <span style={{ fontWeight: 600, color: TK.text }}>${d.costUSD.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </Card>

          </div>
        )
      )}

      {/* ══════ PANELS ══════ */}
      {selConv   && <ConvPanel    conv={selConv}   token={token} language={language} onClose={() => setSelConv(null)}   onUpdate={updated => setConversations(p => p.map(c => c._id === updated._id ? updated : c))} />}
      {selReq    && <RequestPanel req={selReq}     conv={selReqConv} token={token} language={language} onClose={() => { setSelReq(null); setSelReqConv(null); }} onUpdate={updated => setRequests(p => p.map(r => r._id === updated._id ? updated : r))} />}
      {selTicket && <TicketPanel  ticket={selTicket} conv={tickConv} token={token} language={language} onClose={() => { setSelTicket(null); setTickConv(null); }} onUpdate={updated => setTickets(p => p.map(t => t._id === updated._id ? updated : t))} />}
    </div>
  );
};

export default AdminSupportAI;
