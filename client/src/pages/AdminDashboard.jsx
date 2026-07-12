import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart3, Users, FolderKanban, MessageSquare, TrendingUp,
  Clock, ArrowRight, Activity, CheckCircle2, AlertCircle,
  Plus, Eye, ChevronRight, Target, Star,
  RefreshCw, Images, ClipboardList, Lightbulb,
  Shield, Database, Zap, Inbox,
} from 'lucide-react';
import api from '../utils/api';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { useLanguage } from '../contexts/LanguageContext';
import { timeAgo } from '../utils/time';

// ── Design tokens (light-only, aligned with design system) ────────────────────
const TK = {
  bg:        '#F6F7F9',
  surface:   '#FFFFFF',
  border:    '#E8EBF0',
  accent:    '#2563EB',
  accentBg:  'rgba(37,99,235,0.07)',
  accentBd:  'rgba(37,99,235,0.2)',
  text:      '#0D1117',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  green:     '#16a34a',
  greenBg:   'rgba(22,163,74,0.08)',
  amber:     '#d97706',
  amberBg:   'rgba(217,119,6,0.08)',
  red:       '#dc2626',
  purple:    '#7c3aed',
};

// ── Status config (EN + AR) ───────────────────────────────────────────────────
const STATUS = {
  PLANNING:    { dot: '#94a3b8', en: 'Planning',    ar: 'التخطيط',       bg: 'rgba(148,163,184,0.12)' },
  DESIGN:      { dot: TK.accent, en: 'Design',      ar: 'التصميم',       bg: TK.accentBg              },
  DEVELOPMENT: { dot: TK.purple, en: 'Development', ar: 'التطوير',       bg: 'rgba(124,58,237,0.08)'  },
  REVIEW:      { dot: TK.amber,  en: 'Review',      ar: 'المراجعة',      bg: TK.amberBg               },
  COMPLETED:   { dot: TK.green,  en: 'Delivered',   ar: 'تم التسليم',    bg: TK.greenBg               },
  PAUSED:      { dot: '#94a3b8', en: 'Paused',      ar: 'متوقف مؤقتاً', bg: 'rgba(148,163,184,0.12)' },
  CANCELLED:   { dot: TK.red,    en: 'Cancelled',   ar: 'ملغي',          bg: 'rgba(220,38,38,0.08)'   },
  // lowercase variants from older API responses
  pending:     { dot: TK.amber,  en: 'Pending',     ar: 'قيد الانتظار',  bg: TK.amberBg               },
  'in-progress':{ dot: TK.accent, en: 'In Progress', ar: 'قيد التنفيذ',  bg: TK.accentBg              },
  completed:   { dot: TK.green,  en: 'Completed',   ar: 'مكتمل',         bg: TK.greenBg               },
  delivered:   { dot: TK.green,  en: 'Delivered',   ar: 'تم التسليم',    bg: TK.greenBg               },
  cancelled:   { dot: TK.red,    en: 'Cancelled',   ar: 'ملغي',          bg: 'rgba(220,38,38,0.08)'   },
};

const sLabel = (status, language) => {
  const cfg = STATUS[status] || STATUS.pending;
  return language === 'ar' ? cfg.ar : cfg.en;
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KPICard = ({ title, value, icon: Icon, color, bg, subtitle, trend }) => (
  <div style={{
    padding: '18px', background: TK.surface, border: `1px solid ${TK.border}`,
    borderRadius: '12px', transition: 'box-shadow 0.18s, border-color 0.18s',
  }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = TK.accentBd; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = TK.border; }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '9px',
        background: bg, border: `1px solid ${color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon style={{ width: '17px', height: '17px', color }} />
      </div>
      {trend !== undefined && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '3px',
          padding: '2px 7px', borderRadius: '10px',
          background: trend >= 0 ? TK.greenBg : 'rgba(220,38,38,0.08)',
          color: trend >= 0 ? TK.green : TK.red, fontSize: '10px', fontWeight: 500,
        }}>
          <TrendingUp style={{ width: '9px', height: '9px' }} />
          {trend >= 0 ? '+' : ''}{trend}%
        </div>
      )}
    </div>
    <div style={{ fontSize: '28px', fontWeight: 700, color: TK.text, lineHeight: 1, marginBottom: '4px', letterSpacing: '-0.03em' }}>
      {value}
    </div>
    <div style={{ fontSize: '10.5px', fontWeight: 500, color: TK.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      {title}
    </div>
    {subtitle && (
      <div style={{ fontSize: '10px', color: TK.textLight, marginTop: '3px' }}>{subtitle}</div>
    )}
  </div>
);

// ── Progress Bar ──────────────────────────────────────────────────────────────
const ProgressBar = ({ value, max, color = TK.accent }) => (
  <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
    <div style={{
      height: '100%', width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`,
      background: color, borderRadius: '2px', transition: 'width 0.8s ease',
    }} />
  </div>
);

// ── Quick Link ────────────────────────────────────────────────────────────────
const QuickLink = ({ to, icon: Icon, title, subtitle, color }) => (
  <Link
    to={to}
    style={{
      display: 'flex', alignItems: 'center', gap: '11px',
      padding: '11px 13px', background: 'transparent',
      border: `1px solid ${TK.border}`, borderRadius: '10px',
      textDecoration: 'none', transition: 'all 0.15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = TK.accentBd; e.currentTarget.style.background = TK.accentBg; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = TK.border; e.currentTarget.style.background = 'transparent'; }}
  >
    <div style={{
      width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
      background: `${color}15`, border: `1px solid ${color}25`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon style={{ width: '15px', height: '15px', color }} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '12.5px', fontWeight: 500, color: TK.text }}>{title}</div>
      {subtitle && <div style={{ fontSize: '10.5px', color: TK.textLight, marginTop: '1px' }}>{subtitle}</div>}
    </div>
    <ChevronRight style={{ width: '13px', height: '13px', color: TK.textLight, flexShrink: 0 }} />
  </Link>
);

// ── Section Header ────────────────────────────────────────────────────────────
const SectionHead = ({ icon: Icon, title, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
      <Icon style={{ width: '13px', height: '13px', color: TK.accent }} />
      <h2 style={{
        fontSize: '10.5px', fontWeight: 600, color: TK.textMuted,
        letterSpacing: '0.09em', textTransform: 'uppercase', margin: 0,
      }}>{title}</h2>
    </div>
    {action}
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { user }           = useSelector(s => s.auth);
  const { language, isRTL, dir } = useLanguage();
  const navigate           = useNavigate();

  const font = isRTL
    ? 'IBM Plex Sans Arabic, system-ui, sans-serif'
    : 'Inter, system-ui, sans-serif';

  const [projects,     setProjects]    = useState([]);
  const [users,        setUsers]       = useState([]);
  const [stats,        setStats]       = useState({ users: 0, projects: 0, messages: 0, pending: 0, inProgress: 0, completed: 0 });
  const [analytics,    setAnalytics]   = useState(null);
  const [loading,      setLoading]     = useState(true);
  const [refreshing,   setRefreshing]  = useState(false);
  const [lastUpdated,  setLastUpdated] = useState(null);
  const socketRef = useRef(null);

  const T = useMemo(() => ({
    title:         language === 'ar' ? 'لوحة التحكم' : 'Admin Dashboard',
    subtitle:      language === 'ar' ? 'نظرة عامة على المنصة' : 'Platform Overview',
    updated:       language === 'ar' ? 'آخر تحديث' : 'Updated',
    refresh:       language === 'ar' ? 'تحديث' : 'Refresh',
    newProject:    language === 'ar' ? 'مشروع جديد' : 'New Project',
    totalUsers:    language === 'ar' ? 'إجمالي المستخدمين' : 'Total Users',
    allProjects:   language === 'ar' ? 'جميع المشاريع' : 'All Projects',
    inProgress:    language === 'ar' ? 'قيد التنفيذ' : 'In Progress',
    completed:     language === 'ar' ? 'مكتملة' : 'Completed',
    pending:       language === 'ar' ? 'في الانتظار' : 'Pending',
    conversations: language === 'ar' ? 'المحادثات' : 'Conversations',
    pipeline:      language === 'ar' ? 'حالة المشاريع' : 'Project Pipeline',
    completion:    language === 'ar' ? 'معدل الإنجاز' : 'completion rate',
    recentProjects:language === 'ar' ? 'المشاريع الأخيرة' : 'Recent Projects',
    viewAll:       language === 'ar' ? 'عرض الكل' : 'View all',
    noProjects:    language === 'ar' ? 'لا مشاريع بعد' : 'No projects yet',
    sessionStats:  language === 'ar' ? 'إحصاءات الجلسات' : 'Session Analytics',
    totalSessions: language === 'ar' ? 'إجمالي الجلسات' : 'Total Sessions',
    activeSessions:language === 'ar' ? 'نشطة الآن' : 'Active Now',
    pageViews:     language === 'ar' ? 'مشاهدات' : 'Page Views',
    avgDuration:   language === 'ar' ? 'متوسط المدة' : 'Avg. Duration',
    topPages:      language === 'ar' ? 'أكثر الصفحات زيارة' : 'Top Pages',
    quickNav:      language === 'ar' ? 'التنقل السريع' : 'Quick Navigation',
    recentUsers:   language === 'ar' ? 'أحدث المستخدمين' : 'Recent Users',
    systemHealth:  language === 'ar' ? 'صحة النظام' : 'System Health',
    apiServer:     language === 'ar' ? 'خادم API' : 'API Server',
    database:      language === 'ar' ? 'قاعدة البيانات' : 'Database',
    fileStorage:   language === 'ar' ? 'تخزين الملفات' : 'File Storage',
    socket:        language === 'ar' ? 'Socket.IO' : 'Socket.IO',
    operational:   language === 'ar' ? 'يعمل' : 'Operational',
    connected:     language === 'ar' ? 'متصل' : 'Connected',
    topSections:   language === 'ar' ? 'أقسام الموقع' : 'Top Sections',
    admin:         language === 'ar' ? 'مدير' : 'Admin',
    user:          language === 'ar' ? 'مستخدم' : 'User',
    accounts:      language === 'ar' ? 'حساب مسجل' : 'Registered accounts',
    portfolio:     language === 'ar' ? 'محفظة المشاريع' : 'Active portfolio',
    building:      language === 'ar' ? 'قيد البناء' : 'Currently building',
    delivered:     language === 'ar' ? 'تم التسليم' : 'Delivered',
    awaiting:      language === 'ar' ? 'في انتظار الإجراء' : 'Awaiting action',
    activeThreads: language === 'ar' ? 'المحادثات النشطة' : 'Active threads',
    userMgmt:      language === 'ar' ? 'إدارة المستخدمين' : 'User Management',
    crmDir:        language === 'ar' ? 'دليل CRM' : 'CRM Directory',
    projectReq:    language === 'ar' ? 'طلبات المشاريع' : 'Project Requests',
    feedback:      language === 'ar' ? 'التقييمات' : 'Feedback',
    portfolioMgr:  language === 'ar' ? 'إدارة المحفظة' : 'Portfolio Manager',
    messages:      language === 'ar' ? 'الرسائل' : 'Messages',
  }), [language]);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [analyticsRes, usersRes, projectsRes, messagesRes] = await Promise.all([
        api.get('/analytics/dashboard').catch(() => ({ data: {} })),
        api.get('/users?limit=6').catch(() => ({ data: {} })),
        api.get('/projects?limit=8').catch(() => ({ data: {} })),
        api.get('/messages/threads').catch(() => ({ data: {} })),
      ]);

      const allProjects = projectsRes.data?.projects || [];
      const allUsers    = usersRes.data?.users || [];
      const threads     = messagesRes.data?.threads || messagesRes.data || [];

      setAnalytics(analyticsRes.data);
      setProjects(allProjects.slice(0, 6));
      setUsers(allUsers.slice(0, 5));
      setStats({
        users:      usersRes.data?.total      || allUsers.length,
        projects:   projectsRes.data?.total   || allProjects.length,
        messages:   Array.isArray(threads) ? threads.length : 0,
        pending:    allProjects.filter(p => p.status === 'pending' || p.status === 'PLANNING').length,
        inProgress: allProjects.filter(p => ['in-progress', 'DEVELOPMENT', 'DESIGN', 'REVIEW'].includes(p.status)).length,
        completed:  allProjects.filter(p => ['completed', 'delivered', 'COMPLETED'].includes(p.status)).length,
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error('AdminDashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();

    // Socket for real-time refresh
    const token = localStorage.getItem('token');
    if (token && user?._id) {
      const url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
      const socket = io(url, { auth: { token }, transports: ['websocket', 'polling'] });
      socket.on('connect', () => socket.emit('join', user._id));
      socket.on('project-created',  () => fetchAll(true));
      socket.on('project-updated',  () => fetchAll(true));
      socket.on('admin-project-update', () => fetchAll(true));
      socketRef.current = socket;
    }

    return () => socketRef.current?.disconnect();
  }, [fetchAll, user?._id]);

  const completionRate = useMemo(() =>
    stats.projects > 0 ? Math.round((stats.completed / stats.projects) * 100) : 0,
  [stats]);

  const overview = analytics?.overview || {};

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: TK.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: font,
      }}>
        <div>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            border: `2px solid ${TK.accentBg}`, borderTopColor: TK.accent,
            animation: 'spin 0.8s linear infinite', margin: '0 auto 10px',
          }} />
          <p style={{ fontSize: '12px', color: TK.textMuted, margin: 0, textAlign: 'center' }}>
            {language === 'ar' ? 'جارٍ التحميل...' : 'Loading...'}
          </p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: TK.bg, fontFamily: font, direction: isRTL ? 'rtl' : 'ltr',
      padding: 'clamp(20px,3vw,32px) clamp(16px,3vw,32px) 60px',
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) { .admin-dash-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 640px) { .admin-kpi-grid { grid-template-columns: 1fr 1fr !important; } }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '14px', marginBottom: '28px',
      }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '3px 10px', borderRadius: '20px', marginBottom: '8px',
            border: `1px solid ${TK.accentBd}`, background: TK.accentBg,
          }}>
            <Shield style={{ width: '10px', height: '10px', color: TK.accent }} />
            <span style={{ fontSize: '10px', fontWeight: 600, color: TK.accent, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {language === 'ar' ? 'لوحة الإدارة' : 'Admin Control'}
            </span>
          </div>
          <h1 style={{
            fontSize: 'clamp(22px,3vw,32px)', fontWeight: 700, letterSpacing: '-0.02em',
            color: TK.text, margin: 0,
          }}>
            {T.title}
          </h1>
          <p style={{ fontSize: '13px', color: TK.textMuted, marginTop: '5px' }}>
            {T.subtitle}
            {lastUpdated && ` · ${T.updated} ${timeAgo(lastUpdated, language)}`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 16px', background: TK.surface,
              border: `1px solid ${TK.border}`, borderRadius: '9px',
              color: TK.textMuted, fontSize: '12.5px', fontWeight: 500,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s', fontFamily: font,
            }}
            onMouseEnter={e => { if (!refreshing) { e.currentTarget.style.borderColor = TK.accentBd; e.currentTarget.style.color = TK.accent; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = TK.border; e.currentTarget.style.color = TK.textMuted; }}
          >
            <RefreshCw style={{ width: '13px', height: '13px', animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {T.refresh}
          </button>
          <button
            onClick={() => navigate('/app/projects/new')}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 16px', background: TK.accent,
              border: 'none', borderRadius: '9px',
              color: '#FFFFFF', fontSize: '12.5px', fontWeight: 500,
              cursor: 'pointer', transition: 'opacity 0.15s', fontFamily: font,
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            <Plus style={{ width: '13px', height: '13px' }} />
            {T.newProject}
          </button>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div
        className="admin-kpi-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '24px' }}
      >
        <KPICard title={T.totalUsers}    value={stats.users}      icon={Users}        color="#a78bfa" bg="rgba(167,139,250,0.12)" subtitle={T.accounts} />
        <KPICard title={T.allProjects}   value={stats.projects}   icon={FolderKanban} color={TK.accent} bg={TK.accentBg}         subtitle={T.portfolio} />
        <KPICard title={T.inProgress}    value={stats.inProgress} icon={Activity}     color="#60a5fa" bg="rgba(96,165,250,0.12)"  subtitle={T.building} />
        <KPICard title={T.completed}     value={stats.completed}  icon={CheckCircle2} color={TK.green} bg={TK.greenBg}           subtitle={T.delivered} />
        <KPICard title={T.pending}       value={stats.pending}    icon={Clock}        color={TK.amber} bg={TK.amberBg}           subtitle={T.awaiting} />
        <KPICard title={T.conversations} value={stats.messages}   icon={MessageSquare} color="#fb7185" bg="rgba(251,113,133,0.12)" subtitle={T.activeThreads} />
      </div>

      {/* ── Main Grid ── */}
      <div className="admin-dash-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '18px' }}>

        {/* ── Left ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', minWidth: 0 }}>

          {/* Pipeline */}
          <div style={{ padding: '20px', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '12px' }}>
            <SectionHead icon={Activity} title={T.pipeline}
              action={<span style={{ fontSize: '10px', color: TK.textMuted }}>{completionRate}% {T.completion}</span>}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: T.pending,    value: stats.pending,    max: stats.projects, color: TK.amber },
                { label: T.inProgress, value: stats.inProgress, max: stats.projects, color: TK.accent },
                { label: T.completed,  value: stats.completed,  max: stats.projects, color: TK.green },
              ].map(({ label, value, max, color }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: TK.textMuted }}>{label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: TK.text }}>{value}</span>
                      <span style={{
                        padding: '1px 6px', borderRadius: '8px', fontSize: '9.5px', fontWeight: 500,
                        background: `${color}15`, color, border: `1px solid ${color}25`,
                      }}>
                        {max > 0 ? Math.round((value / max) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  <ProgressBar value={value} max={Math.max(max, 1)} color={color} />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Projects */}
          <div style={{ padding: '20px', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '12px' }}>
            <SectionHead icon={FolderKanban} title={T.recentProjects}
              action={
                <Link to="/app/projects" style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  fontSize: '11px', color: TK.textMuted, textDecoration: 'none', transition: 'color 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = TK.accent; }}
                  onMouseLeave={e => { e.currentTarget.style.color = TK.textMuted; }}
                >
                  {T.viewAll} <ChevronRight style={{ width: '11px', height: '11px', transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                </Link>
              }
            />

            {projects.length === 0 ? (
              <div style={{ padding: '28px 0', textAlign: 'center', color: TK.textMuted }}>
                <FolderKanban style={{ width: '24px', height: '24px', margin: '0 auto 8px', opacity: 0.3 }} />
                <p style={{ fontSize: '12.5px', margin: 0 }}>{T.noProjects}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {projects.map((p, i) => {
                  const cfg = STATUS[p.status] || STATUS.pending;
                  return (
                    <Link
                      key={p._id}
                      to={`/app/projects/${p._id}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '10px 8px', borderRadius: '8px', textDecoration: 'none',
                        borderBottom: i < projects.length - 1 ? `1px solid ${TK.border}` : 'none',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = TK.bg; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 500, color: TK.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name || p.title || (language === 'ar' ? 'مشروع' : 'Project')}
                        </div>
                        {p.client && (
                          <div style={{ fontSize: '10.5px', color: TK.textMuted, marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.client?.fullName || p.client?.email || ''}
                          </div>
                        )}
                      </div>
                      <span style={{
                        padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 500,
                        background: cfg.bg, color: cfg.dot, flexShrink: 0,
                      }}>
                        {sLabel(p.status, language)}
                      </span>
                      {p.progress > 0 && (
                        <span style={{ fontSize: '10px', color: TK.textMuted, flexShrink: 0 }}>{p.progress}%</span>
                      )}
                      <span style={{ fontSize: '10px', color: TK.textLight, flexShrink: 0 }}>{timeAgo(p.updatedAt, language)}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Analytics */}
          <div style={{ padding: '20px', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '12px' }}>
            <SectionHead icon={BarChart3} title={T.sessionStats} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
              {[
                { label: T.totalSessions,  value: overview.totalSessions  || 0 },
                { label: T.activeSessions, value: overview.activeSessions || 0 },
                { label: T.pageViews,      value: overview.pageViews      || 0 },
                { label: T.avgDuration,    value: overview.avgDuration ? `${Math.round(overview.avgDuration / 60)}m` : '—' },
              ].map(({ label, value }, i) => (
                <div key={label} style={{
                  padding: '14px',
                  borderBottom: i < 2 ? `1px solid ${TK.border}` : 'none',
                  borderRight: !isRTL && i % 2 === 0 ? `1px solid ${TK.border}` : 'none',
                  borderLeft:  isRTL  && i % 2 === 0 ? `1px solid ${TK.border}` : 'none',
                }}>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: TK.text, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: '10.5px', color: TK.textMuted, marginTop: '4px' }}>{label}</div>
                </div>
              ))}
            </div>

            {analytics?.topPages?.length > 0 && (
              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: `1px solid ${TK.border}` }}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: TK.textMuted, letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  {T.topPages}
                </div>
                {analytics.topPages.slice(0, 4).map((page, i) => {
                  const maxCount = analytics.topPages[0]?.count || 1;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ fontSize: '10.5px', color: TK.textMuted, width: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {page._id || '/'}
                      </div>
                      <div style={{ flex: 1, height: '3px', background: 'rgba(0,0,0,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(page.count / maxCount) * 100}%`, background: TK.accent, borderRadius: '2px' }} />
                      </div>
                      <span style={{ fontSize: '10.5px', color: TK.textMuted, flexShrink: 0, minWidth: '28px', textAlign: isRTL ? 'left' : 'right' }}>{page.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', minWidth: 0 }}>

          {/* Quick Nav */}
          <div style={{ padding: '18px', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '12px' }}>
            <SectionHead icon={Zap} title={T.quickNav} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              <QuickLink to="/app/admin/users"            icon={Users}         title={T.userMgmt}    subtitle={`${stats.users} ${language === 'ar' ? 'مستخدم' : 'users'}`}    color="#a78bfa" />
              <QuickLink to="/app/admin/messages"         icon={Inbox}         title={T.messages}    subtitle={`${stats.messages} ${language === 'ar' ? 'محادثة' : 'threads'}`} color={TK.accent} />
              <QuickLink to="/app/admin/crm"              icon={Target}        title={T.crmDir}                                                                                 color="#2563EB" />
              <QuickLink to="/app/admin/project-requests" icon={ClipboardList} title={T.projectReq}  subtitle={`${stats.pending} ${language === 'ar' ? 'طلب' : 'pending'}`}     color={TK.amber} />
              <QuickLink to="/app/admin/feedback"         icon={Star}          title={T.feedback}                                                                               color="#34d399" />
              <QuickLink to="/app/admin/portfolio"        icon={Images}        title={T.portfolioMgr}                                                                           color="#60a5fa" />
            </div>
          </div>

          {/* Recent Users */}
          {users.length > 0 && (
            <div style={{ padding: '18px', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '12px' }}>
              <SectionHead icon={Users} title={T.recentUsers}
                action={
                  <Link to="/app/admin/users" style={{ fontSize: '11px', color: TK.textMuted, textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = TK.accent; }}
                    onMouseLeave={e => { e.currentTarget.style.color = TK.textMuted; }}
                  >
                    {T.viewAll}
                  </Link>
                }
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {users.map(u => (
                  <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                      background: TK.accentBg, border: `1px solid ${TK.accentBd}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', color: TK.accent, fontWeight: 600,
                    }}>
                      {u.fullName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: TK.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.fullName || 'User'}
                      </div>
                      <div style={{ fontSize: '10px', color: TK.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.email}
                      </div>
                    </div>
                    <span style={{
                      padding: '2px 6px', borderRadius: '6px', fontSize: '9.5px', fontWeight: 500, flexShrink: 0,
                      background: u.role === 'ADMIN' ? TK.accentBg : 'rgba(0,0,0,0.04)',
                      color: u.role === 'ADMIN' ? TK.accent : TK.textMuted,
                      border: `1px solid ${u.role === 'ADMIN' ? TK.accentBd : TK.border}`,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>
                      {u.role === 'ADMIN' ? T.admin : T.user}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Health */}
          <div style={{ padding: '18px', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '12px' }}>
            <SectionHead icon={Database} title={T.systemHealth} />
            {[
              { label: T.apiServer,   status: T.operational, ok: true },
              { label: T.database,    status: T.connected,   ok: true },
              { label: T.fileStorage, status: T.operational, ok: true },
              { label: T.socket,      status: socketRef.current?.connected ? T.connected : T.operational, ok: true },
            ].map(({ label, status, ok }, i) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '7px 0',
                borderBottom: i < 3 ? `1px solid ${TK.border}` : 'none',
              }}>
                <span style={{ fontSize: '11.5px', color: TK.textMuted }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: ok ? TK.green : TK.red }} />
                  <span style={{ fontSize: '10.5px', fontWeight: 500, color: ok ? TK.green : TK.red }}>{status}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Top Sections */}
          {analytics?.topSections?.length > 0 && (
            <div style={{ padding: '18px', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '12px' }}>
              <SectionHead icon={Eye} title={T.topSections} />
              {analytics.topSections.slice(0, 4).map((s, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '7px 0',
                  borderBottom: i < 3 ? `1px solid ${TK.border}` : 'none',
                }}>
                  <span style={{ fontSize: '11.5px', color: TK.textMuted }}>{s._id}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 500, color: TK.text }}>{s.count}</span>
                    {s.avgViewTime && <span style={{ fontSize: '10px', color: TK.textLight }}>{Math.round(s.avgViewTime / 1000)}s avg</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
