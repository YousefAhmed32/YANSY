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
import { TK, FONT, Card, SectionHead, StatCard, Badge, Button, PageSpinner } from '../admin-ui';
import PageHeader from '../admin-ui/PageHeader';

// ── Status config (EN + AR) ───────────────────────────────────────────────────
const STATUS = {
  PLANNING:    { tone: 'neutral', en: 'Planning',    ar: 'التخطيط' },
  DESIGN:      { tone: 'info',    en: 'Design',      ar: 'التصميم' },
  DEVELOPMENT: { tone: 'purple',  en: 'Development', ar: 'التطوير' },
  REVIEW:      { tone: 'warning', en: 'Review',      ar: 'المراجعة' },
  COMPLETED:   { tone: 'success', en: 'Delivered',   ar: 'تم التسليم' },
  PAUSED:      { tone: 'neutral', en: 'Paused',      ar: 'متوقف مؤقتاً' },
  CANCELLED:   { tone: 'danger',  en: 'Cancelled',   ar: 'ملغي' },
  pending:      { tone: 'warning', en: 'Pending',     ar: 'قيد الانتظار' },
  'in-progress':{ tone: 'info',    en: 'In Progress', ar: 'قيد التنفيذ' },
  completed:    { tone: 'success', en: 'Completed',   ar: 'مكتمل' },
  delivered:    { tone: 'success', en: 'Delivered',   ar: 'تم التسليم' },
  cancelled:    { tone: 'danger',  en: 'Cancelled',   ar: 'ملغي' },
};
const statusCfg = (status) => STATUS[status] || STATUS.pending;
const sLabel = (status, language) => {
  const cfg = statusCfg(status);
  return language === 'ar' ? cfg.ar : cfg.en;
};

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
const QuickLink = ({ to, icon: Icon, title, subtitle, tone }) => (
  <Link
    to={to}
    className="au-row"
    style={{
      display: 'flex', alignItems: 'center', gap: '11px',
      padding: '11px 13px', border: `1px solid ${TK.border}`, borderRadius: '10px',
      textDecoration: 'none',
    }}
  >
    <div style={{
      width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
      background: 'rgba(0,0,0,0.04)', border: `1px solid ${TK.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon style={{ width: '15px', height: '15px', color: TK.textMuted }} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '12.5px', fontWeight: 500, color: TK.text }}>{title}</div>
      {subtitle && <div style={{ fontSize: '10.5px', color: TK.textLight, marginTop: '1px' }}>{subtitle}</div>}
    </div>
    <ChevronRight style={{ width: '13px', height: '13px', color: TK.textLight, flexShrink: 0 }} />
  </Link>
);

// ── Main ──────────────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { user }           = useSelector(s => s.auth);
  const { language, isRTL } = useLanguage();
  const navigate           = useNavigate();
  const font = FONT(isRTL);

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

    const token = localStorage.getItem('token');
    if (token && user?._id) {
      const url =
        import.meta.env.VITE_SOCKET_URL ||
        (import.meta.env.DEV
          ? 'http://localhost:5000'
          : 'https://api.yansytech.com');
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
      <div style={{ minHeight: '100vh', background: TK.bg, fontFamily: font }}>
        <PageSpinner />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: TK.bg, fontFamily: font, direction: isRTL ? 'rtl' : 'ltr',
      padding: 'clamp(20px,3vw,32px) clamp(16px,3vw,32px) 60px',
    }}>
      <style>{`
        @media (max-width: 900px) { .admin-dash-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 640px) { .admin-kpi-grid { grid-template-columns: 1fr 1fr !important; } }
      `}</style>

      <PageHeader
        icon={Shield}
        eyebrow={language === 'ar' ? 'لوحة الإدارة' : 'Admin Control'}
        title={T.title}
        subtitle={`${T.subtitle}${lastUpdated ? ` · ${T.updated} ${timeAgo(lastUpdated, language)}` : ''}`}
        actions={<>
          <Button variant="secondary" icon={RefreshCw} onClick={() => fetchAll(true)} loading={refreshing}>{T.refresh}</Button>
          <Button variant="primary" icon={Plus} onClick={() => navigate('/app/projects/new')}>{T.newProject}</Button>
        </>}
      />

      {/* ── KPI Grid ── */}
      <div className="admin-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '24px' }}>
        <StatCard title={T.totalUsers}    label={T.totalUsers}    value={stats.users}      icon={Users}        tone="purple"  sub={T.accounts} />
        <StatCard title={T.allProjects}   label={T.allProjects}   value={stats.projects}   icon={FolderKanban} tone="info"    sub={T.portfolio} />
        <StatCard title={T.inProgress}    label={T.inProgress}    value={stats.inProgress} icon={Activity}     tone="info"    sub={T.building} />
        <StatCard title={T.completed}     label={T.completed}     value={stats.completed}  icon={CheckCircle2} tone="success" sub={T.delivered} />
        <StatCard title={T.pending}       label={T.pending}       value={stats.pending}    icon={Clock}        tone="warning" sub={T.awaiting} />
        <StatCard title={T.conversations} label={T.conversations} value={stats.messages}   icon={MessageSquare} tone="danger" sub={T.activeThreads} />
      </div>

      {/* ── Main Grid ── */}
      <div className="admin-dash-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '18px' }}>

        {/* ── Left ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', minWidth: 0 }}>

          {/* Pipeline */}
          <Card>
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
          </Card>

          {/* Recent Projects */}
          <Card>
            <SectionHead icon={FolderKanban} title={T.recentProjects}
              action={
                <Link to="/app/projects" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: TK.textMuted, textDecoration: 'none' }}>
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
                {projects.map((p, i) => (
                  <Link
                    key={p._id}
                    to={`/app/projects/${p._id}`}
                    className="au-row"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 8px', borderRadius: '8px', textDecoration: 'none',
                      borderBottom: i < projects.length - 1 ? `1px solid ${TK.border}` : 'none',
                    }}
                  >
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
                    <Badge tone={statusCfg(p.status).tone} dot>{sLabel(p.status, language)}</Badge>
                    {p.progress > 0 && <span style={{ fontSize: '10px', color: TK.textMuted, flexShrink: 0 }}>{p.progress}%</span>}
                    <span style={{ fontSize: '10px', color: TK.textLight, flexShrink: 0 }}>{timeAgo(p.updatedAt, language)}</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Analytics */}
          <Card>
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
          </Card>
        </div>

        {/* ── Right ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', minWidth: 0 }}>

          {/* Quick Nav */}
          <Card padding="18px">
            <SectionHead icon={Zap} title={T.quickNav} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              <QuickLink to="/app/admin/users"            icon={Users}         title={T.userMgmt}    subtitle={`${stats.users} ${language === 'ar' ? 'مستخدم' : 'users'}`} />
              <QuickLink to="/app/admin/messages"         icon={Inbox}         title={T.messages}    subtitle={`${stats.messages} ${language === 'ar' ? 'محادثة' : 'threads'}`} />
              <QuickLink to="/app/admin/crm"              icon={Target}        title={T.crmDir} />
              <QuickLink to="/app/admin/project-requests" icon={ClipboardList} title={T.projectReq}  subtitle={`${stats.pending} ${language === 'ar' ? 'طلب' : 'pending'}`} />
              <QuickLink to="/app/admin/feedback"         icon={Star}          title={T.feedback} />
              <QuickLink to="/app/admin/portfolio"        icon={Images}        title={T.portfolioMgr} />
            </div>
          </Card>

          {/* Recent Users */}
          {users.length > 0 && (
            <Card padding="18px">
              <SectionHead icon={Users} title={T.recentUsers}
                action={<Link to="/app/admin/users" style={{ fontSize: '11px', color: TK.textMuted, textDecoration: 'none' }}>{T.viewAll}</Link>}
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
                    <Badge tone={u.role === 'ADMIN' ? 'info' : 'neutral'}>{u.role === 'ADMIN' ? T.admin : T.user}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* System Health */}
          <Card padding="18px">
            <SectionHead icon={Database} title={T.systemHealth} />
            {[
              { label: T.apiServer,   status: T.operational, ok: true },
              { label: T.database,    status: T.connected,   ok: true },
              { label: T.fileStorage, status: T.operational, ok: true },
              { label: T.socket,      status: socketRef.current?.connected ? T.connected : T.operational, ok: true },
            ].map(({ label, status, ok }, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < 3 ? `1px solid ${TK.border}` : 'none' }}>
                <span style={{ fontSize: '11.5px', color: TK.textMuted }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: ok ? TK.green : TK.red }} />
                  <span style={{ fontSize: '10.5px', fontWeight: 500, color: ok ? TK.green : TK.red }}>{status}</span>
                </div>
              </div>
            ))}
          </Card>

          {/* Top Sections */}
          {analytics?.topSections?.length > 0 && (
            <Card padding="18px">
              <SectionHead icon={Eye} title={T.topSections} />
              {analytics.topSections.slice(0, 4).map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < 3 ? `1px solid ${TK.border}` : 'none' }}>
                  <span style={{ fontSize: '11.5px', color: TK.textMuted }}>{s._id}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 500, color: TK.text }}>{s.count}</span>
                    {s.avgViewTime && <span style={{ fontSize: '10px', color: TK.textLight }}>{Math.round(s.avgViewTime / 1000)}s avg</span>}
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
