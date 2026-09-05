import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjectById } from '../store/projectSlice';
import { fetchThreadByProject, sendMessage } from '../store/messageSlice';
import {
  ArrowLeft, Send, FileText, CheckCircle2,
  Clock, FolderKanban, MessageSquare, CreditCard, LifeBuoy,
  Download, AlertCircle, Activity, CheckCheck, Zap,
  ExternalLink, Layers, ShieldCheck, Plus, Check, X, Sparkles
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { TK, Composer, ComposerTextArea, Modal, Button, Badge } from '../admin-ui';
import api from '../utils/api';
import toast from 'react-hot-toast';

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
  { id: 'overview',        en: 'Overview',      ar: 'نظرة عامة',     icon: FolderKanban  },
  { id: 'messages',        en: 'Messages',      ar: 'الرسائل',       icon: MessageSquare },
  { id: 'milestones',      en: 'Deliverables',  ar: 'المراحل والتسليمات', icon: CheckCircle2 },
  { id: 'change-requests', en: 'Change Orders', ar: 'أوامر التعديل', icon: Layers },
  { id: 'activity',        en: 'Activity',      ar: 'النشاط',        icon: Activity      },
  { id: 'files',           en: 'Files',         ar: 'الملفات',       icon: FileText      },
  { id: 'invoices',        en: 'Invoices',      ar: 'الفواتير',      icon: CreditCard    },
];

const WaIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const buildActivity = (project, language) => {
  const events = [];
  if (project?.createdAt) {
    events.push({
      id: 'created',
      icon: Zap,
      color: '#2563EB',
      title: language === 'ar' ? 'تم إنشاء المشروع' : 'Project created',
      desc:  project.title || project.name,
      date:  project.createdAt,
    });
  }
  (project?.milestones || []).forEach(m => {
    if (m.clientReview?.status === 'approved' || m.status === 'approved') {
      events.push({
        id:    m._id || m.title,
        icon:  CheckCircle2,
        color: '#16a34a',
        title: language === 'ar' ? 'تم اعتماد مرحلة' : 'Milestone approved',
        desc:  m.title,
        date:  m.clientReview?.respondedAt || m.updatedAt || new Date(),
      });
    }
  });
  (project?.updates || []).forEach(u => {
    events.push({
      id:    u._id || u.createdAt,
      icon:  Zap,
      color: '#2563EB',
      title: u.title || (language === 'ar' ? 'تحديث من الفريق' : 'Team update'),
      desc:  u.content || u.message || '',
      date:  u.createdAt,
    });
  });
  return events.sort((a, b) => new Date(b.date) - new Date(a.date));
};

const fmtMsgTime = (d, language) => {
  if (!d) return '';
  try { return new Date(d).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
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

export default function ProjectDetails() {
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

  // Review & Sign-off Modals
  const [approvingMilestone, setApprovingMilestone] = useState(null);
  const [revisingMilestone, setRevisingMilestone]   = useState(null);
  const [revisionNotes, setRevisionNotes]           = useState('');
  const [reviewLoading, setReviewLoading]           = useState(false);

  // Change Orders Modal
  const [showAddChangeOrder, setShowAddChangeOrder] = useState(false);
  const [changeOrderForm, setChangeOrderForm]       = useState({
    title: '',
    description: '',
    priceImpact: 0,
    timelineDaysImpact: 0,
    notes: '',
  });

  const font = isRTL
    ? 'IBM Plex Sans Arabic, system-ui, sans-serif'
    : 'Inter, system-ui, sans-serif';

  const reloadProject = useCallback(() => {
    if (id) dispatch(fetchProjectById(id));
  }, [dispatch, id]);

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

  const handleSend = useCallback(async () => {
    if (!msgText.trim() || !currentThread?._id) return;
    await dispatch(sendMessage({ threadId: currentThread._id, content: msgText.trim() }));
    setMsgText('');
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [dispatch, msgText, currentThread]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  // ── Milestone Actions ───────────────────────────────────────────────────
  const handleConfirmApprove = async () => {
    if (!approvingMilestone) return;
    try {
      setReviewLoading(true);
      await api.post(`/projects/${id}/milestones/${approvingMilestone._id}/approve`, {
        notes: isRTL ? 'تم الاعتماد الرقمي من العميل' : 'Digitally approved by client',
      });
      toast.success(isRTL ? 'تم اعتماد المرحلة بنجاح' : 'Milestone approved successfully');
      setApprovingMilestone(null);
      reloadProject();
    } catch (err) {
      toast.error(err.response?.data?.error || (isRTL ? 'فشل الاعتماد' : 'Approval failed'));
    } finally {
      setReviewLoading(false);
    }
  };

  const handleConfirmRevision = async () => {
    if (!revisingMilestone) return;
    if (!revisionNotes.trim() || revisionNotes.trim().length < 5) {
      toast.error(isRTL ? 'يرجى كتابة نقاط الملاحظات بالتفصيل' : 'Please provide detailed revision notes');
      return;
    }

    try {
      setReviewLoading(true);
      await api.post(`/projects/${id}/milestones/${revisingMilestone._id}/request-revision`, {
        notes: revisionNotes.trim(),
      });
      toast.success(isRTL ? 'تم إرسال طلب التعديل للفريق' : 'Revision request sent to team');
      setRevisingMilestone(null);
      setRevisionNotes('');
      reloadProject();
    } catch (err) {
      toast.error(err.response?.data?.error || (isRTL ? 'فشل إرسال الطلب' : 'Request failed'));
    } finally {
      setReviewLoading(false);
    }
  };

  // ── Change Order Actions ────────────────────────────────────────────────
  const handleSaveChangeOrder = async () => {
    if (!changeOrderForm.title || !changeOrderForm.description) {
      toast.error(isRTL ? 'يرجى إدخال عنوان ووصف التعديل' : 'Title and description are required');
      return;
    }
    try {
      setReviewLoading(true);
      await api.post(`/projects/${id}/change-requests`, changeOrderForm);
      toast.success(isRTL ? 'تم إنشاء أمر التعديل بنجاح' : 'Change order created');
      setShowAddChangeOrder(false);
      setChangeOrderForm({ title: '', description: '', priceImpact: 0, timelineDaysImpact: 0, notes: '' });
      reloadProject();
    } catch (err) {
      toast.error(err.response?.data?.error || (isRTL ? 'فشل الإنشاء' : 'Creation failed'));
    } finally {
      setReviewLoading(false);
    }
  };

  const handleRespondChangeOrder = async (crId, action) => {
    try {
      setReviewLoading(true);
      await api.post(`/projects/${id}/change-requests/${crId}/respond`, { action });
      toast.success(action === 'approved' ? (isRTL ? 'تم اعتماد أمر التعديل' : 'Change order approved') : (isRTL ? 'تم رفض أمر التعديل' : 'Change order declined'));
      reloadProject();
    } catch (err) {
      toast.error(err.response?.data?.error || (isRTL ? 'فشل الإجراء' : 'Action failed'));
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading && !project) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.1)', borderTopColor: TK.accent, animation: 'spin 0.75s linear infinite' }} />
      </div>
    );
  }

  const statusKey  = (project?.phase || project?.status || 'PLANNING').toUpperCase();
  const statusInfo = STATUS[statusKey] || STATUS.PLANNING;
  const progress   = project?.progress || 0;
  const milestones = project?.milestones || [];
  const changeRequests = project?.changeRequests || [];
  const activity   = buildActivity(project, language);
  const grouped    = groupMessagesByDate(reduxMessages);

  // Active bottleneck detection
  const reviewPendingMilestone = milestones.find(m => m.status === 'ready_for_review');
  const pendingChangeOrder = changeRequests.find(cr => cr.status === 'pending_client_approval');

  // Warranty calculation
  const hasWarranty = project?.warrantyEndDate && new Date() < new Date(project.warrantyEndDate);
  const warrantyDaysLeft = hasWarranty ? Math.ceil((new Date(project.warrantyEndDate) - new Date()) / 86400000) : 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: TK.bg,
      padding: '24px 28px 60px',
      direction: isRTL ? 'rtl' : 'ltr',
      fontFamily: font,
    }}>

      {/* ── Top Nav Back ── */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', color: TK.textMuted,
          fontSize: 12.5, cursor: 'pointer', fontFamily: font, marginBottom: 14,
        }}
      >
        <ArrowLeft style={{ width: 14, height: 14, transform: isRTL ? 'rotate(180deg)' : 'none' }} />
        {language === 'ar' ? 'العودة' : 'Back'}
      </button>

      {/* ── ACTION CENTER BANNER (Bottleneck highlight) ── */}
      {reviewPendingMilestone && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(217,119,6,0.12), rgba(245,158,11,0.06))',
          border: '1px solid rgba(217,119,6,0.3)',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: 'rgba(217,119,6,0.15)', color: '#D97706',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#B45309' }}>
                {isRTL ? 'مخرج جاهز للمراجعة والاعتماد' : 'Deliverable Ready for Your Review'}
              </div>
              <div style={{ fontSize: 12.5, color: '#92400E', marginTop: 2 }}>
                {isRTL
                  ? `قام الفريق برفع تسليم مرحلة "${reviewPendingMilestone.title}". يرجى المعاينة والاعتماد للمتابعة.`
                  : `Deliverables for "${reviewPendingMilestone.title}" are ready for sign-off.`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {reviewPendingMilestone.deliverables?.[0]?.url && (
              <a
                href={reviewPendingMilestone.deliverables[0].url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: TK.surface, border: '1px solid rgba(217,119,6,0.4)',
                  color: '#B45309', textDecoration: 'none',
                }}
              >
                <ExternalLink style={{ width: 12, height: 12 }} />
                {isRTL ? 'معاينة المخرج' : 'View Deliverable'}
              </a>
            )}
            <button
              onClick={() => setApprovingMilestone(reviewPendingMilestone)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: '#16A34A', border: 'none', color: '#FFFFFF', cursor: 'pointer', fontFamily: font,
              }}
            >
              <Check style={{ width: 13, height: 13 }} />
              {isRTL ? 'اعتماد المخرج' : 'Approve Milestone'}
            </button>
            <button
              onClick={() => setRevisingMilestone(reviewPendingMilestone)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: TK.surface, border: `1px solid ${TK.border}`,
                color: TK.text, cursor: 'pointer', fontFamily: font,
              }}
            >
              {isRTL ? 'طلب تعديل' : 'Request Revision'}
            </button>
          </div>
        </div>
      )}

      {/* ── 30-DAY WARRANTY BANNER (If active) ── */}
      {hasWarranty && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(22,163,74,0.1), rgba(16,185,129,0.04))',
          border: '1px solid rgba(22,163,74,0.25)',
          borderRadius: 12,
          padding: '14px 18px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck style={{ width: 22, height: 22, color: '#16A34A' }} />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#15803D' }}>
                {isRTL ? `فترة الضمان التقني المجاني نشطة (متبقي ${warrantyDaysLeft} يوماً)` : `30-Day Technical Warranty Active (${warrantyDaysLeft} days remaining)`}
              </div>
              <div style={{ fontSize: 12, color: '#166534', marginTop: 1 }}>
                {isRTL ? 'أي خطأ برمجي يتم إصلاحه مجاناً بأولوية قصوى خلال 24 ساعة.' : 'Any technical defect is resolved with priority under 24h SLA.'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('messages')}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: '#16A34A', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontFamily: font,
            }}
          >
            {isRTL ? 'إبلاغ عن عطل' : 'Report Warranty Issue'}
          </button>
        </div>
      )}

      {/* ── Project Header Card ── */}
      <div style={{
        background: TK.surface, borderRadius: 14,
        border: `1px solid ${TK.border}`, padding: '22px 24px', marginBottom: 22,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: TK.text, margin: 0 }}>
                {project?.title || project?.name}
              </h1>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                background: statusInfo.bg, color: statusInfo.dot,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusInfo.dot }} />
                {language === 'ar' ? statusInfo.ar : statusInfo.en}
              </span>
            </div>

            {project?.description && (
              <p style={{ fontSize: 13, color: TK.textMuted, margin: 0, lineHeight: 1.5, maxWidth: 650 }}>
                {project.description}
              </p>
            )}
          </div>

          {/* Quick Resource & Contact Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {project?.stagingUrl && (
              <a
                href={project.stagingUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600,
                  background: 'rgba(37,99,235,0.08)', color: TK.accent,
                  textDecoration: 'none', border: `1px solid ${TK.accentBd}`,
                }}
              >
                <ExternalLink style={{ width: 13, height: 13 }} />
                {isRTL ? 'معاينة تجريبية (Staging)' : 'Live Staging'}
              </a>
            )}

            {project?.figmaUrl && (
              <a
                href={project.figmaUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600,
                  background: 'rgba(124,58,237,0.08)', color: '#7c3aed',
                  textDecoration: 'none', border: '1px solid rgba(124,58,237,0.2)',
                }}
              >
                <ExternalLink style={{ width: 13, height: 13 }} />
                {isRTL ? 'تصاميم Figma' : 'Figma Workspace'}
              </a>
            )}

            <a
              href="https://wa.me/201090385390"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600,
                background: '#25D366', color: '#FFFFFF', textDecoration: 'none',
              }}
            >
              <WaIcon />
              {isRTL ? 'تواصل مع الفريق' : 'Contact Team'}
            </a>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: 18, maxWidth: 520 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11.5, color: TK.textMuted }}>
              {isRTL ? 'نسبة الإنجاز واعتماد المراحل' : 'Completion & Milestone Progress'}
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: TK.accent }}>{progress}%</span>
          </div>
          <div style={{ height: 6, background: TK.accentBg, borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99, width: `${progress}%`,
              background: `linear-gradient(90deg, ${TK.accent}, #60a5fa)`,
              transition: 'width 0.8s ease',
            }} />
          </div>
        </div>

        {/* Tabs Bar */}
        <div style={{
          display: 'flex', gap: 4, marginTop: 22,
          borderBottom: `1px solid ${TK.border}`,
          overflowX: 'auto',
        }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 16px', fontSize: 12.5, fontWeight: isActive ? 600 : 500,
                  color: isActive ? TK.accent : TK.textMuted,
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: isActive ? `2px solid ${TK.accent}` : '2px solid transparent',
                  marginBottom: -1, fontFamily: font, whiteSpace: 'nowrap',
                }}
              >
                <Icon style={{ width: 14, height: 14 }} />
                {isRTL ? tab.ar : tab.en}
                {tab.id === 'milestones' && reviewPendingMilestone && (
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#D97706' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TAB CONTENT: OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          <div style={{ background: TK.surface, borderRadius: 12, border: `1px solid ${TK.border}`, padding: '18px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TK.text, marginBottom: 12 }}>
              {isRTL ? 'تفاصيل الميزانية والتعاقد' : 'Contract & Scope Overview'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${TK.border}`, paddingBottom: 8 }}>
                <span style={{ color: TK.textMuted }}>{isRTL ? 'قيمة المشروع الأساسية' : 'Base Budget'}</span>
                <span style={{ fontWeight: 600, color: TK.text }}>{project?.budget || `${project?.budgetAmount || 0} ${project?.currency || 'USD'}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${TK.border}`, paddingBottom: 8 }}>
                <span style={{ color: TK.textMuted }}>{isRTL ? 'إجمالي المراحل' : 'Total Milestones'}</span>
                <span style={{ fontWeight: 600, color: TK.text }}>{milestones.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: TK.textMuted }}>{isRTL ? 'المراحل المعتمدة' : 'Approved Milestones'}</span>
                <span style={{ fontWeight: 600, color: '#16A34A' }}>
                  {milestones.filter(m => m.status === 'approved').length} / {milestones.length}
                </span>
              </div>
            </div>
          </div>

          <div style={{ background: TK.surface, borderRadius: 12, border: `1px solid ${TK.border}`, padding: '18px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TK.text, marginBottom: 12 }}>
              {isRTL ? 'فريق الدعم وإدارة المشروع' : 'Dedicated Project Team'}
            </div>
            <p style={{ fontSize: 12.5, color: TK.textMuted, lineHeight: 1.5, margin: '0 0 12px' }}>
              {isRTL
                ? 'فريق YANSY يتابع معك المراحل مباشرة. يمكنك إرسال استفسار عبر تبويب الرسائل أو عبر واتساب.'
                : 'YANSY engineering and product team handles execution directly. Chat via Messages or WhatsApp.'}
            </p>
            <button
              onClick={() => setActiveTab('messages')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: TK.accent, color: '#FFFFFF', border: 'none', cursor: 'pointer', fontFamily: font,
              }}
            >
              <MessageSquare style={{ width: 13, height: 13 }} />
              {isRTL ? 'فتح محادثة المشروع' : 'Open Project Chat'}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT: DELIVERABLES & MILESTONES ── */}
      {activeTab === 'milestones' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 780 }}>
          {milestones.length === 0 ? (
            <div style={{ background: TK.surface, borderRadius: 12, border: `1px solid ${TK.border}`, padding: 48, textAlign: 'center' }}>
              <CheckCircle2 style={{ width: 32, height: 32, color: TK.textLight, margin: '0 auto 10px' }} />
              <p style={{ fontSize: 13, color: TK.textMuted, margin: 0 }}>
                {isRTL ? 'لا توجد مراحل مسجلة بعد — سيتم جدولتها تلقائياً' : 'No milestones scheduled yet'}
              </p>
            </div>
          ) : (
            milestones.map((m, idx) => {
              const isApproved = m.status === 'approved';
              const isReview   = m.status === 'ready_for_review';
              const isRevision = m.status === 'revision_requested';
              const isInProg   = m.status === 'in_progress';

              return (
                <div
                  key={m._id || idx}
                  style={{
                    background: TK.surface,
                    borderRadius: 12,
                    border: `1px solid ${isApproved ? 'rgba(22,163,74,0.3)' : isReview ? 'rgba(217,119,6,0.4)' : TK.border}`,
                    padding: '18px 20px',
                    boxShadow: isReview ? '0 2px 10px rgba(217,119,6,0.06)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: TK.text }}>
                          {m.title}
                        </span>
                        {isApproved && (
                          <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10.5, fontWeight: 600, background: 'rgba(22,163,74,0.1)', color: '#16A34A' }}>
                            ✓ {isRTL ? 'معتمد' : 'Approved'}
                          </span>
                        )}
                        {isReview && (
                          <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10.5, fontWeight: 600, background: 'rgba(217,119,6,0.1)', color: '#D97706' }}>
                            ● {isRTL ? 'بانتظار اعتمادك' : 'Ready for Review'}
                          </span>
                        )}
                        {isRevision && (
                          <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10.5, fontWeight: 600, background: 'rgba(220,38,38,0.1)', color: '#DC2626' }}>
                            ⟳ {isRTL ? 'تعديلات قيد التنفيذ' : 'Revision in Progress'}
                          </span>
                        )}
                        {isInProg && (
                          <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10.5, fontWeight: 600, background: TK.accentBg, color: TK.accent }}>
                            ● {isRTL ? 'قيد التطوير' : 'In Progress'}
                          </span>
                        )}
                      </div>

                      {m.description && (
                        <p style={{ fontSize: 12.5, color: TK.textMuted, margin: '2px 0 8px', lineHeight: 1.5 }}>
                          {m.description}
                        </p>
                      )}
                    </div>

                    {/* Milestone Actions */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {isReview && (
                        <>
                          <button
                            onClick={() => setApprovingMilestone(m)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '6px 12px', borderRadius: 7, fontSize: 11.5, fontWeight: 600,
                              background: '#16A34A', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontFamily: font,
                            }}
                          >
                            <Check style={{ width: 12, height: 12 }} />
                            {isRTL ? 'اعتماد المخرج' : 'Approve'}
                          </button>
                          <button
                            onClick={() => setRevisingMilestone(m)}
                            style={{
                              padding: '6px 12px', borderRadius: 7, fontSize: 11.5, fontWeight: 500,
                              background: TK.surface, border: `1px solid ${TK.border}`,
                              color: TK.textMuted, cursor: 'pointer', fontFamily: font,
                            }}
                          >
                            {isRTL ? 'طلب مراجعة' : 'Request Revision'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Deliverables Attachments */}
                  {m.deliverables && m.deliverables.length > 0 && (
                    <div style={{
                      marginTop: 12, paddingTop: 10, borderTop: `1px solid ${TK.border}`,
                      display: 'flex', flexDirection: 'column', gap: 6,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: TK.textMuted }}>
                        {isRTL ? 'مخرجات وروابط هذه المرحلة:' : 'Milestone Deliverables & Links:'}
                      </div>
                      {m.deliverables.map((d, dIdx) => (
                        <div key={dIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                          <span>{d.name}</span>
                          <a
                            href={d.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              color: TK.accent, textDecoration: 'none', fontWeight: 600,
                            }}
                          >
                            <ExternalLink style={{ width: 11, height: 11 }} />
                            {isRTL ? 'فتح ومعاينة' : 'Open / Preview'}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Revision Count Indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: TK.textLight }}>
                    <span>
                      {isRTL
                        ? `جولات التعديل: ${m.revisionsUsed || 0} مستخدمة من أصل ${m.revisionsMax || 3}`
                        : `Revision Rounds: ${m.revisionsUsed || 0} of ${m.revisionsMax || 3} used`}
                    </span>
                    {m.dueDate && (
                      <span>{isRTL ? 'تاريخ الاستحقاق: ' : 'Due: '}{new Date(m.dueDate).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── TAB CONTENT: SCOPE CHANGE ORDERS ── */}
      {activeTab === 'change-requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 780 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: TK.text, margin: '0 0 2px' }}>
                {isRTL ? 'أوامر التعديل والإضافات الخارجة عن الاتفاق (Scope Changes)' : 'Scope Change Orders'}
              </h3>
              <p style={{ fontSize: 12, color: TK.textMuted, margin: 0 }}>
                {isRTL ? 'أي ميزات إضافية تضاف بشفافية مع أثر السعر والوقت لحماية الجدول الزمني' : 'Transparent quotes for extra features and timeline adjustments'}
              </p>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setShowAddChangeOrder(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Plus style={{ width: 13, height: 13 }} />
              {isRTL ? 'طلب إضافة / تعديل' : 'New Change Order'}
            </Button>
          </div>

          {changeRequests.length === 0 ? (
            <div style={{ background: TK.surface, borderRadius: 12, border: `1px solid ${TK.border}`, padding: 48, textAlign: 'center' }}>
              <Layers style={{ width: 32, height: 32, color: TK.textLight, margin: '0 auto 10px' }} />
              <p style={{ fontSize: 13, color: TK.textMuted, margin: 0 }}>
                {isRTL ? 'لا توجد أوامر تعديل حتى الآن — العمل يسير وفق النطاق المتفق عليه' : 'No change orders. Project running on original scope.'}
              </p>
            </div>
          ) : (
            changeRequests.map((cr, idx) => {
              const isPending = cr.status === 'pending_client_approval';
              const isApproved = cr.status === 'approved';
              return (
                <div
                  key={cr._id || idx}
                  style={{
                    background: TK.surface, borderRadius: 12,
                    border: `1px solid ${isApproved ? 'rgba(22,163,74,0.3)' : isPending ? 'rgba(217,119,6,0.3)' : TK.border}`,
                    padding: '16px 18px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: TK.text }}>{cr.title}</div>
                      <p style={{ fontSize: 12.5, color: TK.textMuted, margin: '4px 0 10px', lineHeight: 1.5 }}>{cr.description}</p>
                      <div style={{ display: 'flex', gap: 12, fontSize: 12, fontWeight: 600 }}>
                        <span style={{ color: TK.accent }}>
                          {isRTL ? `+ ${cr.priceImpact} ${project?.currency || 'USD'}` : `+${cr.priceImpact} ${project?.currency || 'USD'}`}
                        </span>
                        <span style={{ color: TK.textSecondary }}>
                          {isRTL ? `+ ${cr.timelineDaysImpact} أيام عمل` : `+${cr.timelineDaysImpact} Work Days`}
                        </span>
                      </div>
                    </div>

                    <div>
                      {isPending && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handleRespondChangeOrder(cr._id, 'approved')}
                            style={{
                              padding: '6px 12px', borderRadius: 7, fontSize: 11.5, fontWeight: 600,
                              background: '#16A34A', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontFamily: font,
                            }}
                          >
                            {isRTL ? 'موافقة واعتماد' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleRespondChangeOrder(cr._id, 'declined')}
                            style={{
                              padding: '6px 12px', borderRadius: 7, fontSize: 11.5, fontWeight: 500,
                              background: TK.surface, border: `1px solid ${TK.border}`,
                              color: TK.textMuted, cursor: 'pointer', fontFamily: font,
                            }}
                          >
                            {isRTL ? 'اعتذار' : 'Decline'}
                          </button>
                        </div>
                      )}
                      {isApproved && (
                        <Badge tone="success">{isRTL ? 'معتمد' : 'Approved'}</Badge>
                      )}
                      {cr.status === 'declined' && (
                        <Badge tone="danger">{isRTL ? 'مرفوض' : 'Declined'}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── TAB CONTENT: MESSAGES ── */}
      {activeTab === 'messages' && (
        <div style={{
          background: TK.surface, borderRadius: 14, border: `1px solid ${TK.border}`,
          display: 'flex', flexDirection: 'column', height: 'calc(100vh - 280px)', minHeight: 400,
        }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 18px 8px' }}>
            {reduxMessages.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <MessageSquare style={{ width: 28, height: 28, color: TK.textLight }} />
                <p style={{ fontSize: 13, color: TK.textMuted, margin: 0 }}>
                  {isRTL ? 'ابدأ المحادثة مع فريق YANSY' : 'Start the conversation'}
                </p>
              </div>
            ) : (
              grouped.map((item, idx) =>
                item.type === 'date' ? (
                  <div key={item.key} style={{ textAlign: 'center', margin: '12px 0', fontSize: 11, color: TK.textLight }}>
                    {item.date}
                  </div>
                ) : (
                  <div
                    key={item.data._id || idx}
                    style={{
                      display: 'flex',
                      justifyContent: item.data.sender?._id === user?._id ? 'flex-end' : 'flex-start',
                      marginBottom: 8,
                    }}
                  >
                    <div style={{
                      maxWidth: '70%', padding: '9px 14px', borderRadius: 12,
                      background: item.data.sender?._id === user?._id ? TK.accent : 'rgba(0,0,0,0.04)',
                      color: item.data.sender?._id === user?._id ? '#FFFFFF' : TK.text,
                      fontSize: 13, lineHeight: 1.4,
                    }}>
                      {item.data.content}
                    </div>
                  </div>
                )
              )
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: '10px 14px', borderTop: `1px solid ${TK.border}` }}>
            <Composer style={{ background: TK.bg, borderRadius: 12, padding: '8px 10px' }}>
              <ComposerTextArea
                ref={textareaRef}
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRTL ? 'اكتب رسالتك لفريق المشروع...' : 'Type your message...'}
                style={{ fontFamily: font, color: TK.text }}
              />
              <button
                onClick={handleSend}
                disabled={!msgText.trim() || sending || !currentThread}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none',
                  background: (msgText.trim() && currentThread) ? TK.accent : TK.accentBg,
                  color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Send style={{ width: 13, height: 13 }} />
              </button>
            </Composer>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT: ACTIVITY ── */}
      {activeTab === 'activity' && (
        <div style={{ maxWidth: 700, background: TK.surface, borderRadius: 12, border: `1px solid ${TK.border}`, padding: '18px 20px' }}>
          {activity.map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${TK.border}` }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: TK.text }}>{a.title}</div>
                <div style={{ fontSize: 11.5, color: TK.textMuted }}>{a.desc}</div>
              </div>
              <span style={{ fontSize: 11, color: TK.textLight }}>{new Date(a.date).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB CONTENT: FILES ── */}
      {activeTab === 'files' && (
        <div style={{ maxWidth: 700, background: TK.surface, borderRadius: 12, border: `1px solid ${TK.border}`, padding: 32, textAlign: 'center' }}>
          <FileText style={{ width: 32, height: 32, color: TK.textLight, margin: '0 auto 10px' }} />
          <p style={{ fontSize: 13, color: TK.textMuted, margin: 0 }}>
            {isRTL ? 'ملفات ومستندات المشروع تظهر هنا' : 'Project assets and files appear here'}
          </p>
        </div>
      )}

      {/* ── TAB CONTENT: INVOICES ── */}
      {activeTab === 'invoices' && (
        <div style={{ maxWidth: 700, background: TK.surface, borderRadius: 12, border: `1px solid ${TK.border}`, padding: 32, textAlign: 'center' }}>
          <CreditCard style={{ width: 32, height: 32, color: TK.textLight, margin: '0 auto 10px' }} />
          <p style={{ fontSize: 13, color: TK.textMuted, margin: 0 }}>
            {isRTL ? 'فواتير الدفعات مرتبطة تلقائياً بهذا المشروع' : 'Invoices linked to this project'}
          </p>
        </div>
      )}

      {/* ── APPROVE MODAL ── */}
      {approvingMilestone && (
        <Modal
          open={Boolean(approvingMilestone)}
          onClose={() => setApprovingMilestone(null)}
          title={isRTL ? 'اعتماد تسليم المرحلة رقمياً' : 'Approve Milestone Deliverables'}
          width={480}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 13, color: TK.textMuted, lineHeight: 1.6, margin: 0 }}>
              {isRTL
                ? `أنت على وشك اعتماد مخرجات مرحلة "${approvingMilestone.title}". سيتم تسجيل تاريخ الاعتماد وفتح المرحلة التالية مباشرة.`
                : `You are confirming approval for "${approvingMilestone.title}". This unlocks the next development phase.`}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="secondary" onClick={() => setApprovingMilestone(null)}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button variant="primary" onClick={handleConfirmApprove} disabled={reviewLoading}>
                {reviewLoading ? (isRTL ? 'جاري الاعتماد...' : 'Approving...') : (isRTL ? 'تأكيد الاعتماد' : 'Confirm Sign-off')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── REVISION MODAL ── */}
      {revisingMilestone && (
        <Modal
          open={Boolean(revisingMilestone)}
          onClose={() => setRevisingMilestone(null)}
          title={isRTL ? 'طلب مراجعة وتعديلات على المخرج' : 'Request Milestone Revision'}
          width={520}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 12.5, color: TK.textMuted, margin: 0 }}>
              {isRTL
                ? `يرجى تدوين الملاحظات المطلوب تعديلها على مرحلة "${revisingMilestone.title}". (متبقي ${(revisingMilestone.revisionsMax || 3) - (revisingMilestone.revisionsUsed || 0)} جولات مشمولة).`
                : `Specify points to revise for "${revisingMilestone.title}".`}
            </p>

            <textarea
              rows={4}
              value={revisionNotes}
              onChange={e => setRevisionNotes(e.target.value)}
              placeholder={isRTL ? 'اكتب ملاحظاتك بشكل محدد...' : 'Detail your feedback here...'}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: `1px solid ${TK.border}`, background: TK.surface,
                fontSize: 12.5, fontFamily: font, outline: 'none', resize: 'vertical',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="secondary" onClick={() => setRevisingMilestone(null)}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button variant="primary" onClick={handleConfirmRevision} disabled={reviewLoading}>
                {reviewLoading ? (isRTL ? 'جاري الإرسال...' : 'Sending...') : (isRTL ? 'إرسال الملاحظات' : 'Submit Feedback')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── ADD CHANGE ORDER MODAL ── */}
      {showAddChangeOrder && (
        <Modal
          open={showAddChangeOrder}
          onClose={() => setShowAddChangeOrder(false)}
          title={isRTL ? 'طلب ميزة / تعديل خارج النطاق' : 'New Scope Change Order'}
          width={520}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: TK.textMuted, marginBottom: 4 }}>
                {isRTL ? 'عنوان الميزة / التعديل المطلوب:' : 'Title:'}
              </label>
              <input
                type="text"
                value={changeOrderForm.title}
                onChange={e => setChangeOrderForm(p => ({ ...p, title: e.target.value }))}
                placeholder={isRTL ? 'مثال: إضافة بوابة دفع دولية ثانية...' : 'e.g. Add 2nd International Payment Gateway'}
                style={{
                  width: '100%', height: 36, padding: '0 10px', borderRadius: 8,
                  border: `1px solid ${TK.border}`, background: TK.surface,
                  fontSize: 12.5, fontFamily: font, outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: TK.textMuted, marginBottom: 4 }}>
                {isRTL ? 'تفاصيل النطاق والمواصفات:' : 'Description:'}
              </label>
              <textarea
                rows={3}
                value={changeOrderForm.description}
                onChange={e => setChangeOrderForm(p => ({ ...p, description: e.target.value }))}
                placeholder={isRTL ? 'وصف دقيق لما يشمله التعديل...' : 'Detailed requirements...'}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8,
                  border: `1px solid ${TK.border}`, background: TK.surface,
                  fontSize: 12.5, fontFamily: font, outline: 'none', resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: TK.textMuted, marginBottom: 4 }}>
                  {isRTL ? 'التكلفة الإضافية:' : 'Extra Price:'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={changeOrderForm.priceImpact}
                  onChange={e => setChangeOrderForm(p => ({ ...p, priceImpact: e.target.value }))}
                  style={{
                    width: '100%', height: 36, padding: '0 10px', borderRadius: 8,
                    border: `1px solid ${TK.border}`, background: TK.surface,
                    fontSize: 12.5, fontFamily: font, outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: TK.textMuted, marginBottom: 4 }}>
                  {isRTL ? 'أيام العمل الإضافية:' : 'Added Work Days:'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={changeOrderForm.timelineDaysImpact}
                  onChange={e => setChangeOrderForm(p => ({ ...p, timelineDaysImpact: e.target.value }))}
                  style={{
                    width: '100%', height: 36, padding: '0 10px', borderRadius: 8,
                    border: `1px solid ${TK.border}`, background: TK.surface,
                    fontSize: 12.5, fontFamily: font, outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="secondary" onClick={() => setShowAddChangeOrder(false)}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button variant="primary" onClick={handleSaveChangeOrder} disabled={reviewLoading}>
                {reviewLoading ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'إصدار أمر التعديل' : 'Issue Change Order')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
