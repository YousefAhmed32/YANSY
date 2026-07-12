import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjectById } from '../store/projectSlice';
import { fetchThreadByProject, sendMessage } from '../store/messageSlice';
import {
  ArrowLeft, Send, FileText, CheckCircle2,
  Clock, FolderKanban, MessageSquare, CreditCard, LifeBuoy,
  Download, AlertCircle, Activity, CheckCheck, Zap,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const TK = {
  bg:        '#F6F7F9',
  surface:   '#FFFFFF',
  border:    '#E7EAF0',
  accent:    '#2563EB',
  accentBg:  '#EFF6FF',
  accentBd:  '#DBEAFE',
  text:      '#111827',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
};

const STATUS = {
  PLANNING:    { dot: '#94a3b8', en: 'Planning',     ar: 'التخطيط',       bg: 'rgba(148,163,184,0.12)' },
  DESIGN:      { dot: '#2563EB', en: 'Design',       ar: 'التصميم',       bg: 'rgba(37,99,235,0.08)'   },
  DEVELOPMENT: { dot: '#7c3aed', en: 'Development',  ar: 'التطوير',       bg: 'rgba(124,58,237,0.08)'  },
  REVIEW:      { dot: '#d97706', en: 'Review',       ar: 'المراجعة',      bg: 'rgba(217,119,6,0.08)'   },
  COMPLETED:   { dot: '#16a34a', en: 'Delivered',    ar: 'تم التسليم',    bg: 'rgba(22,163,74,0.08)'   },
  PAUSED:      { dot: '#94a3b8', en: 'Paused',       ar: 'متوقف مؤقتاً', bg: 'rgba(148,163,184,0.12)' },
  CANCELLED:   { dot: '#dc2626', en: 'Cancelled',    ar: 'ملغي',          bg: 'rgba(220,38,38,0.08)'   },
};

const TABS = [
  { id: 'overview',   en: 'Overview',  ar: 'نظرة عامة', icon: FolderKanban  },
  { id: 'messages',   en: 'Messages',  ar: 'الرسائل',   icon: MessageSquare },
  { id: 'milestones', en: 'Milestones',ar: 'المعالم',   icon: CheckCircle2  },
  { id: 'activity',   en: 'Activity',  ar: 'النشاط',    icon: Activity      },
  { id: 'files',      en: 'Files',     ar: 'الملفات',   icon: FileText      },
  { id: 'invoices',   en: 'Invoices',  ar: 'الفواتير',  icon: CreditCard    },
];

// ── Sample activity events (populated from project data) ──────────────────────
const buildActivity = (project, language) => {
  const events = [];
  if (project.createdAt) {
    events.push({
      id: 'created',
      icon: Zap,
      color: '#2563EB',
      title: language === 'ar' ? 'تم إنشاء المشروع' : 'Project created',
      desc:  project.name,
      date:  project.createdAt,
    });
  }
  (project.milestones || []).forEach(m => {
    if (m.completedAt || (m.status === 'COMPLETED' && m.updatedAt)) {
      events.push({
        id:    m._id || m.title,
        icon:  CheckCircle2,
        color: '#16a34a',
        title: language === 'ar' ? 'تم إنجاز مرحلة' : 'Milestone completed',
        desc:  m.title || m.name || '',
        date:  m.completedAt || m.updatedAt,
      });
    }
  });
  (project.updates || []).forEach(u => {
    events.push({
      id:    u._id || u.createdAt,
      icon:  Zap,
      color: '#2563EB',
      title: u.title || (language === 'ar' ? 'تحديث من الفريق' : 'Team update'),
      desc:  u.body || u.message || '',
      date:  u.createdAt,
    });
  });
  return events.sort((a, b) => new Date(b.date) - new Date(a.date));
};

const WaIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const fmtMsgTime = (d, language) => {
  if (!d) return '';
  try { return new Date(d).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
};

const fmtDateHeader = (d, language) => {
  if (!d) return '';
  try {
    const dt   = new Date(d);
    const now  = new Date();
    const diff = Math.floor((now - dt) / 86400000);
    if (diff === 0) return language === 'ar' ? 'اليوم' : 'Today';
    if (diff === 1) return language === 'ar' ? 'أمس' : 'Yesterday';
    return dt.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  } catch { return ''; }
};

const getDateKey = (d) => { try { return new Date(d).toDateString(); } catch { return ''; } };

const groupMessagesByDate = (messages) => {
  const groups = [];
  let lastKey  = null;
  for (const msg of messages) {
    const key = getDateKey(msg.createdAt);
    if (key !== lastKey) {
      groups.push({ type: 'date', key, date: msg.createdAt });
      lastKey = key;
    }
    groups.push({ type: 'message', data: msg });
  }
  return groups;
};

// ── Main Component ────────────────────────────────────────────────────────────

const ProjectDetails = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { language, isRTL } = useLanguage();
  const { currentProject: project, loading } = useSelector(s => s.projects);
  const { currentThread, messages: reduxMessages = [], sending = false } = useSelector(s => s.messages);
  const { user } = useSelector(s => s.auth);

  const [activeTab, setActiveTab] = useState('overview');
  const [msgText,   setMsgText]   = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  const font = isRTL
    ? 'IBM Plex Sans Arabic, system-ui, sans-serif'
    : 'Inter, system-ui, sans-serif';

  useEffect(() => {
    if (id) {
      dispatch(fetchProjectById(id));
      dispatch(fetchThreadByProject(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (activeTab === 'messages') {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [activeTab, reduxMessages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [msgText]);

  const handleSend = useCallback(async () => {
    if (!msgText.trim() || !currentThread?._id) return;
    await dispatch(sendMessage({ threadId: currentThread._id, content: msgText.trim() }));
    setMsgText('');
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [dispatch, msgText, currentThread]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const fmt = (d) => {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return null; }
  };

  // ── Loading / Error States ────────────────────────────────────────────────
  if (loading && !project) {
    return (
      <div style={{
        minHeight: '100vh', background: TK.bg, display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontFamily: font,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', margin: '0 auto 12px',
            border: `3px solid ${TK.accentBg}`, borderTopColor: TK.accent,
            animation: 'spin 0.7s linear infinite',
          }} />
          <p style={{ fontSize: 13, color: TK.textMuted }}>
            {language === 'ar' ? 'جارٍ التحميل...' : 'Loading...'}
          </p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  if (!loading && !project) {
    return (
      <div style={{
        minHeight: '100vh', background: TK.bg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontFamily: font,
      }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <AlertCircle style={{ width: 40, height: 40, color: TK.textLight, margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, fontWeight: 500, color: TK.text, marginBottom: 8 }}>
            {language === 'ar' ? 'المشروع غير موجود' : 'Project not found'}
          </p>
          <button
            onClick={() => navigate('/app/projects')}
            style={{
              padding: '8px 18px', borderRadius: 8, background: TK.accent, color: 'white',
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            }}
          >
            {language === 'ar' ? 'العودة لمشاريعي' : 'Back to Projects'}
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS[project?.status] || STATUS.PLANNING;
  const progress   = project?.progress ?? 0;
  const pm         = project?.projectManager || null;
  const milestones = project?.milestones || [];
  const files      = project?.files || [];
  const invoices   = project?.invoices || [];
  const activity   = buildActivity(project, language);
  const grouped    = groupMessagesByDate(reduxMessages);

  return (
    <div style={{
      minHeight: '100vh', background: TK.bg,
      fontFamily: font, direction: isRTL ? 'rtl' : 'ltr',
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Page Header ── */}
      <div style={{
        background: TK.surface, borderBottom: `1px solid ${TK.border}`,
        padding: 'clamp(14px,2vw,20px) clamp(16px,3vw,32px)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Back */}
          <button
            onClick={() => navigate('/app/projects')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'none', border: 'none', cursor: 'pointer',
              color: TK.textMuted, fontSize: 12.5, padding: '0 0 10px',
              transition: 'color 0.14s', fontFamily: font,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = TK.accent; }}
            onMouseLeave={e => { e.currentTarget.style.color = TK.textMuted; }}
          >
            <ArrowLeft style={{ width: 13, height: 13, transform: isRTL ? 'rotate(180deg)' : 'none' }} />
            {language === 'ar' ? 'العودة إلى مشاريعي' : 'Back to My Projects'}
          </button>

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 'clamp(16px,2.5vw,22px)', fontWeight: 700, color: TK.text, margin: 0 }}>
                  {project?.name}
                </h1>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 500,
                  background: statusInfo.bg, color: statusInfo.dot,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusInfo.dot, display: 'inline-block' }} />
                  {language === 'ar' ? statusInfo.ar : statusInfo.en}
                </span>
              </div>
              {project?.description && (
                <p style={{ fontSize: 12.5, color: TK.textMuted, margin: 0, lineHeight: 1.5, maxWidth: 600 }}>
                  {project.description}
                </p>
              )}
            </div>

            <a
              href="https://wa.me/201090385390"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 9,
                background: '#25D366', color: 'white',
                textDecoration: 'none', fontSize: 12.5, fontWeight: 500, flexShrink: 0,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              <WaIcon />
              {language === 'ar' ? 'تواصل مع الفريق' : 'Contact Team'}
            </a>
          </div>

          {/* Progress */}
          <div style={{ marginTop: 14, maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: TK.textMuted }}>{language === 'ar' ? 'نسبة الإنجاز' : 'Progress'}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: TK.accent }}>{progress}%</span>
            </div>
            <div style={{ height: 5, background: TK.accentBg, borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99, width: `${progress}%`,
                background: `linear-gradient(90deg,${TK.accent},#60a5fa)`,
                transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
            {project?.estimatedDelivery && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                <Clock style={{ width: 11, height: 11, color: TK.textLight }} />
                <span style={{ fontSize: 11, color: TK.textLight }}>
                  {language === 'ar' ? 'موعد التسليم المتوقع: ' : 'Est. delivery: '}
                  {fmt(project.estimatedDelivery)}
                </span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 0, marginTop: 20,
            borderBottom: `2px solid ${TK.border}`,
            overflowX: 'auto', scrollbarWidth: 'none',
          }}>
            {TABS.map(tab => {
              const Icon     = tab.icon;
              const isActive = activeTab === tab.id;
              const badge    = tab.id === 'messages' && reduxMessages.length > 0 ? reduxMessages.length : null;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '9px 16px', fontSize: 12.5, fontWeight: isActive ? 500 : 400,
                    color: isActive ? TK.accent : TK.textMuted,
                    background: 'none', border: 'none', cursor: 'pointer',
                    borderBottom: isActive ? `2px solid ${TK.accent}` : '2px solid transparent',
                    marginBottom: -2, transition: 'color 0.14s', whiteSpace: 'nowrap', fontFamily: font,
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = TK.text; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = TK.textMuted; }}
                >
                  <Icon style={{ width: 13, height: 13 }} />
                  {language === 'ar' ? tab.ar : tab.en}
                  {badge && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 16, height: 16, borderRadius: '50%',
                      background: TK.accentBg, color: TK.accent, fontSize: 9, fontWeight: 700,
                    }}>{badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(16px,2.5vw,28px) clamp(16px,3vw,32px)' }}>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,320px),1fr))', gap: 14 }}>

            {/* Details card */}
            <div style={{ background: TK.surface, borderRadius: 14, border: `1px solid ${TK.border}`, padding: 20 }}>
              <h3 style={{ fontSize: 11, fontWeight: 600, color: TK.textMuted, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {language === 'ar' ? 'تفاصيل المشروع' : 'Project Details'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: language === 'ar' ? 'الحالة' : 'Status', value: language === 'ar' ? statusInfo.ar : statusInfo.en },
                  { label: language === 'ar' ? 'آخر تحديث' : 'Last Updated', value: fmt(project.updatedAt) || '—' },
                  { label: language === 'ar' ? 'تاريخ البدء' : 'Start Date', value: fmt(project.createdAt) || '—' },
                  { label: language === 'ar' ? 'موعد التسليم' : 'Est. Delivery', value: fmt(project.estimatedDelivery) || (language === 'ar' ? 'سيتم تحديده' : 'To be confirmed') },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: TK.textMuted }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: TK.text, textAlign: isRTL ? 'left' : 'right' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* PM card */}
            <div style={{ background: TK.surface, borderRadius: 14, border: `1px solid ${TK.border}`, padding: 20 }}>
              <h3 style={{ fontSize: 11, fontWeight: 600, color: TK.textMuted, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {language === 'ar' ? 'مدير مشروعك' : 'Your Project Manager'}
              </h3>
              {pm ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 11, flexShrink: 0,
                      background: TK.accentBg, border: `1px solid ${TK.accentBd}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 17, fontWeight: 700, color: TK.accent,
                    }}>
                      {pm.name?.[0]?.toUpperCase() || 'Y'}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: TK.text }}>{pm.name || 'YANSY Team'}</div>
                      <div style={{ fontSize: 11.5, color: TK.textMuted }}>{language === 'ar' ? 'مدير المشروع' : 'Project Manager'}</div>
                      {pm.workingHours && (
                        <div style={{ fontSize: 10.5, color: TK.textLight, marginTop: 2 }}>
                          <Clock style={{ width: 9, height: 9, display: 'inline', marginRight: 3 }} />
                          {pm.workingHours}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <a
                      href="https://wa.me/201090385390"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: '9px 14px', borderRadius: 9,
                        background: '#25D366', color: 'white', textDecoration: 'none',
                        fontSize: 12.5, fontWeight: 500, transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                    >
                      <WaIcon />
                      WhatsApp
                    </a>
                    {pm.email && (
                      <a
                        href={`mailto:${pm.email}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 7,
                          padding: '9px 14px', borderRadius: 9,
                          background: TK.accentBg, border: `1px solid ${TK.accentBd}`,
                          color: TK.accent, textDecoration: 'none', fontSize: 12.5, fontWeight: 500,
                        }}
                      >
                        <MessageSquare style={{ width: 13, height: 13 }} />
                        {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                      </a>
                    )}
                    <button
                      onClick={() => setActiveTab('messages')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: '9px 14px', borderRadius: 9,
                        background: TK.bg, border: `1px solid ${TK.border}`,
                        color: TK.textMuted, cursor: 'pointer', fontSize: 12.5, fontFamily: font, fontWeight: 500,
                        transition: 'all 0.14s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = TK.accent; e.currentTarget.style.color = TK.accent; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = TK.border; e.currentTarget.style.color = TK.textMuted; }}
                    >
                      <MessageSquare style={{ width: 13, height: 13 }} />
                      {language === 'ar' ? 'إرسال رسالة' : 'Send message'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 12.5, color: TK.textMuted, lineHeight: 1.5, marginBottom: 12 }}>
                    {language === 'ar'
                      ? 'سيُعيَّن مدير مشروعك بعد انطلاق المشروع. سنتواصل معك خلال ٢ ساعة.'
                      : 'Your project manager will be assigned after project kickoff. We\'ll reach out within 2 hours.'}
                  </p>
                  <a
                    href="https://wa.me/201090385390"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '9px 14px', borderRadius: 9,
                      background: '#25D366', color: 'white', textDecoration: 'none',
                      fontSize: 12.5, fontWeight: 500,
                    }}
                  >
                    <WaIcon />
                    {language === 'ar' ? 'تواصل معنا الآن' : 'Reach Us Now'}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MESSAGES TAB ── */}
        {activeTab === 'messages' && (
          <div style={{
            background: TK.surface, borderRadius: 14, border: `1px solid ${TK.border}`,
            display: 'flex', flexDirection: 'column',
            height: 'calc(100vh - 280px)', minHeight: 400,
          }}>
            {/* Header */}
            <div style={{
              padding: '12px 18px', borderBottom: `1px solid ${TK.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
            }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: TK.text, fontFamily: font }}>
                  {language === 'ar' ? 'محادثة المشروع' : 'Project Conversation'}
                </div>
                <div style={{ fontSize: 11, color: TK.textMuted, marginTop: 1, fontFamily: font }}>
                  {language === 'ar' ? 'فريق YANSY · نرد خلال ساعتين' : 'YANSY Team · Replies within 2 hours'}
                </div>
              </div>
              <a
                href="https://wa.me/201090385390"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: 7,
                  background: '#25D366', color: 'white', textDecoration: 'none',
                  fontSize: 11.5, fontWeight: 500,
                }}
              >
                <WaIcon />
                WhatsApp
              </a>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 18px 8px' }}>
              {reduxMessages.length === 0 ? (
                <div style={{
                  height: '100%', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 10, textAlign: 'center',
                }}>
                  <MessageSquare style={{ width: 28, height: 28, color: TK.textLight }} />
                  <p style={{ fontSize: 13.5, fontWeight: 500, color: TK.text, margin: 0, fontFamily: font }}>
                    {language === 'ar' ? 'ابدأ المحادثة' : 'Start the conversation'}
                  </p>
                  <p style={{ fontSize: 12, color: TK.textMuted, margin: 0, fontFamily: font }}>
                    {language === 'ar' ? 'أرسل رسالة لفريق YANSY أدناه' : 'Send a message to the YANSY team below'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {grouped.map((item, idx) =>
                    item.type === 'date' ? (
                      <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 8px' }}>
                        <div style={{ flex: 1, height: 1, background: TK.border }} />
                        <span style={{
                          fontSize: 10.5, color: TK.textLight, fontWeight: 500, fontFamily: font,
                          padding: '2px 10px', borderRadius: 99,
                          background: TK.surface, border: `1px solid ${TK.border}`,
                        }}>
                          {fmtDateHeader(item.date, language)}
                        </span>
                        <div style={{ flex: 1, height: 1, background: TK.border }} />
                      </div>
                    ) : (
                      (() => {
                        const msg    = item.data;
                        const isMe   = msg.sender?._id === user?._id || msg.sender === user?._id;
                        const prevIt = idx > 0 && grouped[idx - 1]?.type === 'message' ? grouped[idx - 1].data : null;
                        const nextIt = idx < grouped.length - 1 && grouped[idx + 1]?.type === 'message' ? grouped[idx + 1].data : null;
                        const prevMe = prevIt && (prevIt.sender?._id === user?._id || prevIt.sender === user?._id);
                        const nextMe = nextIt && (nextIt.sender?._id === user?._id || nextIt.sender === user?._id);
                        const isLast = nextMe !== isMe || !nextIt;

                        return (
                          <div key={msg._id || idx} style={{
                            display: 'flex', flexDirection: 'column',
                            alignItems: isMe ? (isRTL ? 'flex-start' : 'flex-end') : (isRTL ? 'flex-end' : 'flex-start'),
                            marginBottom: isLast ? 3 : 1,
                          }}>
                            <div style={{
                              maxWidth: 'min(70%, 520px)',
                              padding: '9px 13px',
                              borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                              background: isMe ? TK.accent : TK.bg,
                              border: isMe ? 'none' : `1px solid ${TK.border}`,
                              color: isMe ? 'white' : TK.text,
                              fontSize: 13.5, lineHeight: 1.55, wordBreak: 'break-word',
                              boxShadow: isMe ? '0 2px 8px rgba(37,99,235,0.18)' : '0 1px 4px rgba(0,0,0,0.04)',
                            }}>
                              {msg.content || msg.text || msg.message || ''}
                            </div>
                            {isLast && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                                <span style={{ fontSize: 10, color: TK.textLight }}>
                                  {fmtMsgTime(msg.createdAt, language)}
                                </span>
                                {isMe && <CheckCheck style={{ width: 11, height: 11, color: TK.textLight }} />}
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{
              padding: '10px 14px 14px',
              borderTop: `1px solid ${TK.border}`,
              background: TK.surface, flexShrink: 0,
            }}>
              <div style={{
                display: 'flex', alignItems: 'flex-end', gap: 8,
                background: TK.bg, borderRadius: 12, border: `1px solid ${TK.border}`,
                padding: '8px 10px', transition: 'border-color 0.15s',
              }}
                onFocusCapture={e => { e.currentTarget.style.borderColor = TK.accent; }}
                onBlurCapture={e => { e.currentTarget.style.borderColor = TK.border; }}
              >
                <textarea
                  ref={textareaRef}
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={language === 'ar' ? 'اكتب رسالتك...' : 'Type your message...'}
                  rows={1}
                  style={{
                    flex: 1, border: 'none', background: 'transparent',
                    resize: 'none', outline: 'none', fontSize: 13.5,
                    fontFamily: font, color: TK.text, lineHeight: 1.55,
                    maxHeight: 120, overflowY: 'auto', padding: '2px 0',
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!msgText.trim() || sending || !currentThread}
                  aria-label={language === 'ar' ? 'إرسال' : 'Send'}
                  style={{
                    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                    background: (msgText.trim() && currentThread && !sending) ? TK.accent : TK.accentBg,
                    border: 'none',
                    cursor: (msgText.trim() && currentThread && !sending) ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  {sending ? (
                    <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.75s linear infinite' }} />
                  ) : (
                    <Send style={{
                      width: 13, height: 13,
                      color: (msgText.trim() && currentThread) ? 'white' : TK.textLight,
                      transform: isRTL ? 'rotate(180deg)' : 'none',
                    }} />
                  )}
                </button>
              </div>
              <p style={{ fontSize: 10.5, color: TK.textLight, margin: '5px 0 0 4px', fontFamily: font }}>
                {language === 'ar' ? 'Enter للإرسال · Shift+Enter لسطر جديد' : 'Enter to send · Shift+Enter for new line'}
              </p>
            </div>
          </div>
        )}

        {/* ── MILESTONES TAB ── */}
        {activeTab === 'milestones' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 700 }}>
            {milestones.length === 0 ? (
              <div style={{
                background: TK.surface, borderRadius: 14, border: `1px solid ${TK.border}`,
                padding: 48, textAlign: 'center',
              }}>
                <CheckCircle2 style={{ width: 32, height: 32, color: TK.textLight, margin: '0 auto 10px' }} />
                <p style={{ fontSize: 13.5, color: TK.textMuted, margin: 0, fontFamily: font }}>
                  {language === 'ar' ? 'لا معالم بعد — سيتم تحديثها قريباً' : 'No milestones yet — check back soon'}
                </p>
              </div>
            ) : milestones.map((m, i) => {
              const done    = m.status === 'COMPLETED' || m.completed;
              const current = m.status === 'IN_PROGRESS' || m.current;
              return (
                <div key={m._id || i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  background: TK.surface, borderRadius: 12,
                  border: `1px solid ${done ? 'rgba(22,163,74,0.2)' : current ? 'rgba(37,99,235,0.2)' : TK.border}`,
                  padding: '16px 18px',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done ? 'rgba(22,163,74,0.1)' : current ? TK.accentBg : 'rgba(0,0,0,0.03)',
                    border: `2px solid ${done ? '#16a34a' : current ? TK.accent : TK.border}`,
                    marginTop: 2,
                  }}>
                    {done
                      ? <CheckCircle2 style={{ width: 14, height: 14, color: '#16a34a' }} />
                      : current
                        ? <Clock style={{ width: 12, height: 12, color: TK.accent }} />
                        : <span style={{ width: 8, height: 8, borderRadius: '50%', background: TK.textLight, display: 'inline-block' }} />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 13.5, fontWeight: done || current ? 500 : 400,
                        color: done ? '#16a34a' : current ? TK.text : TK.textMuted,
                        fontFamily: font,
                      }}>
                        {m.title || m.name || `${language === 'ar' ? 'مرحلة' : 'Milestone'} ${i + 1}`}
                      </span>
                      {(m.dueDate || m.date) && (
                        <span style={{ fontSize: 11, color: TK.textLight, flexShrink: 0 }}>
                          {fmt(m.dueDate || m.date)}
                        </span>
                      )}
                    </div>
                    {m.description && (
                      <p style={{ fontSize: 12, color: TK.textMuted, margin: '3px 0 0', lineHeight: 1.5, fontFamily: font }}>
                        {m.description}
                      </p>
                    )}
                    {current && (
                      <span style={{
                        display: 'inline-block', marginTop: 6,
                        padding: '2px 8px', borderRadius: 99, fontSize: 10.5,
                        background: TK.accentBg, color: TK.accent, fontWeight: 500, fontFamily: font,
                      }}>
                        {language === 'ar' ? '● قيد التنفيذ' : '● In Progress'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── ACTIVITY TAB ── */}
        {activeTab === 'activity' && (
          <div style={{ maxWidth: 700 }}>
            {activity.length === 0 ? (
              <div style={{
                background: TK.surface, borderRadius: 14, border: `1px solid ${TK.border}`,
                padding: 48, textAlign: 'center',
              }}>
                <Activity style={{ width: 32, height: 32, color: TK.textLight, margin: '0 auto 10px' }} />
                <p style={{ fontSize: 13.5, color: TK.textMuted, margin: 0, fontFamily: font }}>
                  {language === 'ar' ? 'لا نشاط بعد' : 'No activity yet'}
                </p>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                {/* Timeline line */}
                <div style={{
                  position: 'absolute',
                  [isRTL ? 'right' : 'left']: 17,
                  top: 20, bottom: 20,
                  width: 1, background: TK.border,
                }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {activity.map((event, i) => {
                    const Icon = event.icon;
                    return (
                      <div key={event.id} style={{
                        display: 'flex', gap: 14, padding: '12px 0',
                        alignItems: 'flex-start',
                      }}>
                        {/* Icon */}
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                          background: TK.surface, border: `1px solid ${TK.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          position: 'relative', zIndex: 1,
                          boxShadow: '0 0 0 3px white',
                        }}>
                          <Icon style={{ width: 14, height: 14, color: event.color }} />
                        </div>
                        {/* Content */}
                        <div style={{
                          flex: 1, background: TK.surface, borderRadius: 10,
                          border: `1px solid ${TK.border}`, padding: '10px 14px',
                          marginTop: 4,
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: TK.text, fontFamily: font }}>
                              {event.title}
                            </span>
                            <span style={{ fontSize: 10.5, color: TK.textLight, flexShrink: 0, fontFamily: font }}>
                              {fmt(event.date)}
                            </span>
                          </div>
                          {event.desc && (
                            <p style={{ fontSize: 12, color: TK.textMuted, margin: '3px 0 0', lineHeight: 1.5, fontFamily: font }}>
                              {event.desc}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── FILES TAB ── */}
        {activeTab === 'files' && (
          <div>
            {files.length === 0 ? (
              <div style={{
                background: TK.surface, borderRadius: 14, border: `1px solid ${TK.border}`,
                padding: 48, textAlign: 'center',
              }}>
                <FileText style={{ width: 32, height: 32, color: TK.textLight, margin: '0 auto 10px' }} />
                <p style={{ fontSize: 13.5, color: TK.textMuted, margin: 0, fontFamily: font }}>
                  {language === 'ar' ? 'لا ملفات مرفوعة بعد' : 'No files uploaded yet'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
                {files.map((f, i) => (
                  <div key={f._id || i} style={{
                    background: TK.surface, borderRadius: 12, border: `1px solid ${TK.border}`,
                    padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      background: TK.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FileText style={{ width: 16, height: 16, color: TK.accent }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500, color: TK.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: font }}>
                        {f.name || f.filename || 'File'}
                      </div>
                      <div style={{ fontSize: 10.5, color: TK.textMuted, fontFamily: font }}>
                        {fmt(f.createdAt)} {f.size ? `· ${f.size}` : ''}
                      </div>
                    </div>
                    {f.url && (
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Download"
                        style={{ color: TK.textMuted, transition: 'color 0.14s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = TK.accent; }}
                        onMouseLeave={e => { e.currentTarget.style.color = TK.textMuted; }}
                      >
                        <Download style={{ width: 14, height: 14 }} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── INVOICES TAB ── */}
        {activeTab === 'invoices' && (
          <div>
            {invoices.length === 0 ? (
              <div style={{
                background: TK.surface, borderRadius: 14, border: `1px solid ${TK.border}`,
                padding: 48, textAlign: 'center',
              }}>
                <CreditCard style={{ width: 32, height: 32, color: TK.textLight, margin: '0 auto 10px' }} />
                <p style={{ fontSize: 13.5, color: TK.textMuted, margin: 0, fontFamily: font }}>
                  {language === 'ar' ? 'لا فواتير بعد' : 'No invoices yet'}
                </p>
                <p style={{ fontSize: 12, color: TK.textLight, margin: '6px 0 0', fontFamily: font }}>
                  {language === 'ar' ? 'ستظهر الفواتير هنا بعد بدء المشروع' : 'Invoices will appear here after the project begins'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 700 }}>
                {invoices.map((inv, i) => {
                  const isPaid    = inv.status === 'PAID';
                  const isOverdue = inv.status === 'OVERDUE';
                  return (
                    <div key={inv._id || i} style={{
                      background: TK.surface, borderRadius: 12, border: `1px solid ${TK.border}`,
                      padding: '14px 18px', display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: TK.text, marginBottom: 3, fontFamily: font }}>
                          {language === 'ar' ? 'فاتورة' : 'Invoice'} #{inv.number || (i + 1)}
                        </div>
                        <div style={{ fontSize: 11, color: TK.textMuted, fontFamily: font }}>{fmt(inv.dueDate)}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: TK.text, fontFamily: font }}>
                          {inv.currency || '$'}{inv.amount?.toLocaleString()}
                        </span>
                        <span style={{
                          padding: '3px 9px', borderRadius: 99, fontSize: 10.5, fontWeight: 500,
                          background: isPaid ? 'rgba(22,163,74,0.08)' : isOverdue ? 'rgba(220,38,38,0.08)' : 'rgba(217,119,6,0.08)',
                          color: isPaid ? '#16a34a' : isOverdue ? '#dc2626' : '#d97706',
                          fontFamily: font,
                        }}>
                          {language === 'ar'
                            ? (isPaid ? 'مدفوعة' : isOverdue ? 'متأخرة' : 'معلقة')
                            : (isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Pending')}
                        </span>
                        {!isPaid && inv.payUrl && (
                          <a
                            href={inv.payUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '6px 12px', borderRadius: 7,
                              background: TK.accent, color: 'white', textDecoration: 'none',
                              fontSize: 11.5, fontWeight: 500, fontFamily: font,
                            }}
                          >
                            {language === 'ar' ? 'ادفع الآن' : 'Pay Now'}
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
      </div>
    </div>
  );
};

export default ProjectDetails;
