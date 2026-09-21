import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart3, Users, FolderKanban, MessageSquare, TrendingUp,
  Clock, ArrowRight, Activity, CheckCircle2, AlertCircle,
  Plus, Eye, ChevronRight, Target, Star,
  RefreshCw, Images, ClipboardList, Lightbulb,
  Shield, Database, Zap, Inbox, Filter,
  Calendar, Flame, Smartphone, Monitor, Tablet,
  ArrowUpRight, Check, MousePointer, ExternalLink,
  Radio, LogIn, LogOut, MessageCircle, Send, Globe
} from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useSocket } from '../contexts/SocketContext';
import { timeAgo } from '../utils/time';
import { TK, FONT, Card, SectionHead, StatCard, Badge, Button, PageSpinner, FilterPills } from '../admin-ui';
import PageHeader from '../admin-ui/PageHeader';

// ── Helpers ───────────────────────────────────────────────────────────────────
const toLocalISOString = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fmtDuration = (sec, language) => {
  const sLabel = language === 'ar' ? 'ث' : 's';
  const mLabel = language === 'ar' ? 'د' : 'm';
  const hLabel = language === 'ar' ? 'س' : 'h';
  if (!sec || sec <= 0) return `0${sLabel}`;
  if (sec < 60) return `${sec}${sLabel}`;
  if (sec < 3600) return `${Math.floor(sec / 60)}${mLabel} ${sec % 60}${sLabel}`;
  return `${Math.floor(sec / 3600)}${hLabel} ${Math.floor((sec % 3600) / 60)}${mLabel}`;
};

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
const ProgressBar = ({ value, max, color = TK.accent, height = '5px' }) => (
  <div style={{ width: '100%', height, background: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
    <div style={{
      height: '100%', width: `${max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0}%`,
      background: color, borderRadius: '3px', transition: 'width 0.8s ease',
    }} />
  </div>
);

// ── Quick Link ────────────────────────────────────────────────────────────────
const QuickLink = ({ to, icon: Icon, title, subtitle }) => (
  <Link
    to={to}
    className="au-row"
    style={{
      display: 'flex', alignItems: 'center', gap: '11px',
      padding: '11px 13px', border: `1px solid ${TK.border}`, borderRadius: '10px',
      textDecoration: 'none', background: TK.surface,
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

// ── Device Icon Helper ────────────────────────────────────────────────────────
const DeviceIcon = ({ device }) => {
  const d = String(device || '').toLowerCase();
  if (d.includes('mobile') || d.includes('phone') || d.includes('ios') || d.includes('android')) {
    return <Smartphone style={{ width: 12, height: 12, color: TK.purple }} />;
  }
  if (d.includes('tablet') || d.includes('ipad')) {
    return <Tablet style={{ width: 12, height: 12, color: TK.amber }} />;
  }
  return <Monitor style={{ width: 12, height: 12, color: TK.textMuted }} />;
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { language, isRTL } = useLanguage();
  const navigate           = useNavigate();
  const font = FONT(isRTL);

  // Operational State
  const [projects,     setProjects]    = useState([]);
  const [users,        setUsers]       = useState([]);
  const [stats,        setStats]       = useState({ users: 0, projects: 0, messages: 0, pending: 0, inProgress: 0, completed: 0 });
  const [analytics,    setAnalytics]   = useState(null);
  const [loading,      setLoading]     = useState(true);
  const [refreshing,   setRefreshing]  = useState(false);
  const [lastUpdated,  setLastUpdated] = useState(null);
  const { socket, connected: socketConnected } = useSocket();

  // Filter & Custom Range State
  const [range, setRange]                       = useState('today'); // Default: today
  const [visitorFilter, setVisitorFilter]       = useState('clients_only'); // Default: isolate real leads
  const [startDate, setStartDate]               = useState('');
  const [endDate, setEndDate]                   = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate]     = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Translations
  const T = useMemo(() => ({
    title:          language === 'ar' ? 'غرفة العمليات ولوحة التحكم' : 'Mission Control & Dashboard',
    subtitle:       language === 'ar' ? 'مراقبة حية لنشاط العملاء، تتبع النوايا، وإدارة مشاريع المنصة' : 'Real-time client telemetry, intent intelligence, and platform operations',
    updated:        language === 'ar' ? 'آخر تحديث' : 'Updated',
    refresh:        language === 'ar' ? 'تحديث' : 'Refresh',
    deepAnalytics:  language === 'ar' ? 'التحليلات الاستخباراتية 📊' : 'Deep Analytics Hub 📊',
    newProject:     language === 'ar' ? 'مشروع جديد' : 'New Project',
    totalUsers:     language === 'ar' ? 'إجمالي المستخدمين' : 'Total Users',
    allProjects:    language === 'ar' ? 'جميع المشاريع' : 'All Projects',
    inProgress:     language === 'ar' ? 'قيد التنفيذ' : 'In Progress',
    completed:      language === 'ar' ? 'مكتملة ومسلّمة' : 'Delivered',
    pending:        language === 'ar' ? 'في الانتظار' : 'Pending',
    conversations:  language === 'ar' ? 'المحادثات' : 'Conversations',
    pipeline:       language === 'ar' ? 'حالة خط المشاريع' : 'Project Pipeline',
    completion:     language === 'ar' ? 'معدل الإنجاز' : 'completion rate',
    recentProjects: language === 'ar' ? 'المشاريع الأخيرة' : 'Recent Projects',
    viewAll:        language === 'ar' ? 'عرض الكل' : 'View all',
    noProjects:     language === 'ar' ? 'لا مشاريع بعد' : 'No projects yet',
    quickNav:       language === 'ar' ? 'التنقل السريع' : 'Quick Navigation',
    recentUsers:    language === 'ar' ? 'أحدث المستخدمين المسجلين' : 'Recent Users',
    systemHealth:   language === 'ar' ? 'صحة النظام والخوادم' : 'System & Server Health',
    apiServer:      language === 'ar' ? 'خادم API والعمليات' : 'API Server',
    database:       language === 'ar' ? 'قاعدة بيانات MongoDB' : 'MongoDB Database',
    fileStorage:    language === 'ar' ? 'تخزين الملفات والوسائط' : 'File Storage',
    socket:         language === 'ar' ? 'Socket.IO المباشر' : 'Live Socket.IO',
    operational:    language === 'ar' ? 'يعمل بنجاح' : 'Operational',
    connected:      language === 'ar' ? 'متصل' : 'Connected',
    topSections:    language === 'ar' ? 'أقسام الموقع الأكثر تفاعلاً' : 'Top Active Sections',
    admin:          language === 'ar' ? 'مدير' : 'Admin',
    user:           language === 'ar' ? 'مستخدم' : 'User',
    accounts:       language === 'ar' ? 'حساب مسجل' : 'Registered accounts',
    portfolio:      language === 'ar' ? 'محفظة المشاريع' : 'Active portfolio',
    building:       language === 'ar' ? 'قيد التطوير' : 'Currently building',
    delivered:      language === 'ar' ? 'تم التسليم' : 'Delivered',
    awaiting:       language === 'ar' ? 'في انتظار البدء' : 'Awaiting start',
    activeThreads:  language === 'ar' ? 'المحادثات النشطة' : 'Active threads',
    userMgmt:       language === 'ar' ? 'إدارة المستخدمين' : 'User Management',
    crmDir:         language === 'ar' ? 'دليل العملاء CRM' : 'CRM Directory',
    projectReq:     language === 'ar' ? 'طلبات المشاريع الواردة' : 'Project Requests',
    feedback:       language === 'ar' ? 'التقييمات والآراء' : 'Feedback & Reviews',
    portfolioMgr:   language === 'ar' ? 'إدارة أعمال الاستوديو' : 'Portfolio Manager',
    messages:       language === 'ar' ? 'الرسائل والمحادثات' : 'Messages',
  }), [language]);

  // Fetch Dashboard Data
  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      let analyticsUrl = `/analytics/dashboard?range=${range}&visitorFilter=${visitorFilter}`;
      if (range === 'custom' && appliedStartDate && appliedEndDate) {
        analyticsUrl += `&startDate=${encodeURIComponent(appliedStartDate)}&endDate=${encodeURIComponent(appliedEndDate)}`;
      }

      const [analyticsRes, usersRes, projectsRes, messagesRes] = await Promise.all([
        api.get(analyticsUrl).catch(() => ({ data: {} })),
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
  }, [range, visitorFilter, appliedStartDate, appliedEndDate]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Periodic Auto-Refresh for Live Telemetry (every 25s when window is active)
  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) {
        fetchAll(true);
      }
    }, 25000);
    return () => clearInterval(timer);
  }, [fetchAll]);

  // Live Socket.IO Updates for project states
  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchAll(true);
    socket.on('project-created', refresh);
    socket.on('project-updated', refresh);
    socket.on('admin-project-update', refresh);
    return () => {
      socket.off('project-created', refresh);
      socket.off('project-updated', refresh);
      socket.off('admin-project-update', refresh);
    };
  }, [socket, fetchAll]);

  // Quick Presets Handler for Custom Minute Range
  const applyPreset = (presetKey) => {
    const now = new Date();
    let s, e = now;
    if (presetKey === 'last3h') {
      s = new Date(now.getTime() - 3 * 3600 * 1000);
    } else if (presetKey === 'todaySoFar') {
      s = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (presetKey === 'workHours') {
      s = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
      e = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0, 0);
    } else if (presetKey === 'yesterdayFull') {
      const y = new Date(now.getTime() - 86400000);
      s = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0);
      e = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59);
    }
    const sStr = toLocalISOString(s);
    const eStr = toLocalISOString(e);
    setStartDate(sStr);
    setEndDate(eStr);
    setAppliedStartDate(sStr);
    setAppliedEndDate(eStr);
    setRange('custom');
    setShowCustomPicker(true);
  };

  const handleApplyCustomDate = () => {
    if (startDate && endDate) {
      setAppliedStartDate(startDate);
      setAppliedEndDate(endDate);
      setRange('custom');
    }
  };

  const completionRate = useMemo(() =>
    stats.projects > 0 ? Math.round((stats.completed / stats.projects) * 100) : 0,
  [stats]);

  // Extracted Telemetry
  const activeNow          = analytics?.activeNow ?? 0;
  const todayVisitors      = analytics?.today?.visitors ?? 0;
  const todayPageViews     = analytics?.today?.pageViews ?? 0;
  const repeatRate         = analytics?.newVsReturning?.repeatRate ?? 0;
  const returningVisitors  = analytics?.newVsReturning?.returning ?? 0;
  const firstTimeVisitors  = analytics?.newVsReturning?.firstTime ?? 0;
  const avgDurationSec     = analytics?.period?.avgDurationSec ?? 0;

  const whatsappHovers     = analytics?.cta?.whatsappHovers ?? 0;
  const whatsappClicks     = analytics?.cta?.whatsappClicks ?? 0;
  const whatsappConversion = whatsappHovers > 0 ? Math.round((whatsappClicks / whatsappHovers) * 100) : (whatsappClicks > 0 ? 100 : 0);

  const startProjectClicks = analytics?.cta?.startProjectClicks ?? 0;
  const formSubmissions    = analytics?.cta?.formSubmissions ?? 0;
  const projectConversion  = startProjectClicks > 0 ? Math.round((formSubmissions / startProjectClicks) * 100) : (formSubmissions > 0 ? 100 : 0);

  const topPages           = analytics?.topPages || [];
  const activityFeed       = analytics?.activityFeed || [];

  if (loading && !analytics) {
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
        @keyframes au-live-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.35); opacity: 0.55; }
        }
        @media (max-width: 1024px) { .admin-dash-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 768px) {
          .admin-kpi-5grid { grid-template-columns: 1fr 1fr !important; }
          .admin-cta-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Page Header ── */}
      <PageHeader
        icon={Shield}
        eyebrow={language === 'ar' ? 'المركز القيادي للمنصة' : 'Command Center'}
        title={T.title}
        subtitle={`${T.subtitle}${lastUpdated ? ` · ${T.updated} ${timeAgo(lastUpdated, language)}` : ''}`}
        actions={<>
          <Button variant="secondary" icon={BarChart3} onClick={() => navigate('/app/admin/analytics')}>
            {T.deepAnalytics}
          </Button>
          <Button variant="secondary" icon={RefreshCw} onClick={() => fetchAll(true)} loading={refreshing}>
            {T.refresh}
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => navigate('/app/projects/new')}>
            {T.newProject}
          </Button>
        </>}
      />

      {/* ── Filter Bar & Custom Range Panel ── */}
      <div style={{
        background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '14px',
        padding: '16px 20px', marginBottom: '22px', display: 'flex', flexDirection: 'column', gap: '14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          {/* Visitor Segment Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: TK.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {language === 'ar' ? 'الشريحة المستهدفة:' : 'Audience:'}
            </span>
            <FilterPills
              value={visitorFilter}
              onChange={(val) => setVisitorFilter(val)}
              options={[
                { value: 'clients_only', label: language === 'ar' ? '⭐ العملاء والزوار الفعليين' : '⭐ Clients & Guests' },
                { value: 'all',          label: language === 'ar' ? '👥 كافة الزيارات (شامل الإدارة)' : '👥 All Traffic' },
              ]}
            />
          </div>

          {/* Time Horizon Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: TK.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {language === 'ar' ? 'الفترة الزمنية:' : 'Timeframe:'}
            </span>
            <FilterPills
              value={range}
              onChange={(val) => {
                setRange(val);
                if (val === 'custom') setShowCustomPicker(true);
              }}
              options={[
                { value: 'today',     label: language === 'ar' ? '⏱️ اليوم' : '⏱️ Today' },
                { value: 'yesterday', label: language === 'ar' ? 'أمس' : 'Yesterday' },
                { value: '7d',        label: language === 'ar' ? 'آخر 7 أيام' : '7 Days' },
                { value: '30d',       label: language === 'ar' ? 'آخر 30 يوم' : '30 Days' },
                { value: 'custom',    label: language === 'ar' ? '🎯 فترة مخصصة بالدقائق' : '🎯 Custom by Minute' },
              ]}
            />
          </div>
        </div>

        {/* Expandable Custom Range Selector */}
        {(range === 'custom' || showCustomPicker) && (
          <div style={{
            padding: '14px 16px', background: 'rgba(24,24,27,0.02)', borderRadius: '10px',
            border: `1px solid ${TK.border}`, display: 'flex', flexDirection: 'column', gap: '12px',
          }}>
            {/* Quick Preset Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: TK.textMuted, fontWeight: 500 }}>
                {language === 'ar' ? 'اختصارات سريعة:' : 'Quick Presets:'}
              </span>
              {[
                { key: 'last3h',        label: language === 'ar' ? '⚡ آخر 3 ساعات' : '⚡ Last 3 Hours' },
                { key: 'todaySoFar',    label: language === 'ar' ? '⏱️ اليوم حتى اللحظة' : '⏱️ Today so far' },
                { key: 'workHours',     label: language === 'ar' ? '💼 ساعات العمل (9ص - 5م)' : '💼 Work Hours (9-5)' },
                { key: 'yesterdayFull', label: language === 'ar' ? '📅 أمس كاملاً' : '📅 Yesterday Full' },
              ].map(p => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => applyPreset(p.key)}
                  style={{
                    padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 500,
                    background: TK.surface, border: `1px solid ${TK.border}`, cursor: 'pointer',
                    color: TK.text, fontFamily: 'inherit',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Datetime Inputs & Apply Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11.5px', color: TK.textMuted }}>{language === 'ar' ? 'من:' : 'From:'}</span>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    padding: '6px 10px', fontSize: '12px', borderRadius: '8px',
                    border: `1px solid ${TK.border}`, background: TK.surface, color: TK.text,
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11.5px', color: TK.textMuted }}>{language === 'ar' ? 'إلى:' : 'To:'}</span>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    padding: '6px 10px', fontSize: '12px', borderRadius: '8px',
                    border: `1px solid ${TK.border}`, background: TK.surface, color: TK.text,
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleApplyCustomDate}
                disabled={!startDate || !endDate}
              >
                {language === 'ar' ? 'تطبيق الفلتر' : 'Apply Filter'}
              </Button>

              {appliedStartDate && appliedEndDate && range === 'custom' && (
                <span style={{ fontSize: '11px', color: TK.green, fontWeight: 500 }}>
                  ✓ {language === 'ar' ? 'مطبّق حالياً بدقة الدقائق' : 'Active minute-level filter'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Top Hero 5-KPI Strip ── */}
      <div className="admin-kpi-5grid" style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '22px',
      }}>
        {/* Card 1: Active Now */}
        <Card hover padding="18px" style={{ background: 'rgba(22,163,74,0.03)', borderColor: 'rgba(22,163,74,0.22)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Radio style={{ width: '16px', height: '16px', color: '#16a34a' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a',
                boxShadow: '0 0 0 3px rgba(22,163,74,0.25)', animation: 'au-live-pulse 2s infinite',
              }} />
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#16a34a', textTransform: 'uppercase' }}>
                {language === 'ar' ? 'مباشر' : 'LIVE'}
              </span>
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: TK.text, lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
            {activeNow}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#15803d', marginTop: '6px' }}>
            {language === 'ar' ? '🟢 متصل الآن بالمنصة' : 'Active Clients Now'}
          </div>
          <div style={{ fontSize: '10px', color: TK.textMuted, marginTop: '3px' }}>
            {language === 'ar' ? 'عميل يتصفح المنصة خلال آخر 15 دقيقة' : 'Active sessions within last 15 mins'}
          </div>
        </Card>

        {/* Card 2: Today's Clients */}
        <StatCard
          label={language === 'ar' ? 'عملاء اليوم' : "Today's Clients"}
          value={todayVisitors.toLocaleString()}
          icon={Users}
          tone="purple"
          sub={language === 'ar' ? 'زائر فريد منذ منتصف الليل' : 'Unique visitors since midnight'}
        />

        {/* Card 3: Today's Page Views */}
        <StatCard
          label={language === 'ar' ? 'مشاهدات صفحات اليوم' : "Today's Page Views"}
          value={todayPageViews.toLocaleString()}
          icon={Eye}
          tone="info"
          sub={language === 'ar' ? 'مشاهدات نظيفة بدون طلبات API' : 'Clean views excluding API'}
        />

        {/* Card 4: Returning vs New Rate */}
        <StatCard
          label={language === 'ar' ? 'الزوار المتكررون 🔥' : 'Repeat Rate 🔥'}
          value={`${repeatRate}%`}
          icon={RefreshCw}
          tone="amber"
          sub={language === 'ar'
            ? `${returningVisitors} متكرر • ${firstTimeVisitors} جديد`
            : `${returningVisitors} returning • ${firstTimeVisitors} new`
          }
        />

        {/* Card 5: Average Duration */}
        <StatCard
          label={language === 'ar' ? 'متوسط بقاء العميل' : 'Avg Time on Site'}
          value={fmtDuration(avgDurationSec, language)}
          icon={Clock}
          tone="neutral"
          sub={language === 'ar' ? 'معدل التفاعل خلال الجلسة' : 'Average visitor session length'}
        />
      </div>

      {/* ── Two-Column CTA Intelligence Cards ── */}
      <div className="admin-cta-grid" style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px',
      }}>
        {/* WhatsApp Intent Card */}
        <Card padding="18px">
          <SectionHead
            icon={MessageCircle}
            title={language === 'ar' ? 'تفاعل زر الواتساب (التردد vs التواصل)' : 'WhatsApp CTA Engagement (Hesitation vs Contact)'}
            action={<Badge tone={whatsappConversion > 15 ? 'success' : 'neutral'}>{whatsappConversion}% {language === 'ar' ? 'معدل التحويل' : 'conversion'}</Badge>}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div style={{ padding: '12px', background: TK.bgSubtle, borderRadius: '8px', border: `1px solid ${TK.border}` }}>
              <div style={{ fontSize: '11px', color: TK.textMuted }}>
                {language === 'ar' ? 'وقف بالماوس (تفكير وتردد)' : 'Hover / Contemplation'}
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: TK.text, marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                {whatsappHovers.toLocaleString()}
              </div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(22,163,74,0.06)', borderRadius: '8px', border: '1px solid rgba(22,163,74,0.2)' }}>
              <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 500 }}>
                {language === 'ar' ? 'ضغط وتواصل فعلياً 🔥' : 'Direct WhatsApp Clicks 🔥'}
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#16a34a', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                {whatsappClicks.toLocaleString()}
              </div>
            </div>
          </div>
          <ProgressBar value={whatsappClicks} max={Math.max(whatsappHovers, whatsappClicks, 1)} color="#16a34a" height="6px" />
          <p style={{ fontSize: '11px', color: TK.textLight, margin: '8px 0 0' }}>
            {language === 'ar'
              ? 'يقيس بدقة عدد العملاء الذين حرّكوا المؤشر فوق زر الواتساب وترددوا مقابل من نقروا لبدء المحادثة مباشرة.'
              : 'Tracks visitors who hovered in contemplation vs those who engaged and initiated a real conversation.'}
          </p>
        </Card>

        {/* Start Project Intent Card */}
        <Card padding="18px">
          <SectionHead
            icon={Target}
            title={language === 'ar' ? 'نية بدء المشاريع (النقرات vs الاستمارات)' : 'Project Intent (Start CTA vs Brief Submissions)'}
            action={<Badge tone={projectConversion > 10 ? 'success' : 'neutral'}>{projectConversion}% {language === 'ar' ? 'إتمام الطلب' : 'completion'}</Badge>}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div style={{ padding: '12px', background: TK.bgSubtle, borderRadius: '8px', border: `1px solid ${TK.border}` }}>
              <div style={{ fontSize: '11px', color: TK.textMuted }}>
                {language === 'ar' ? 'نقر على زر بدء المشروع 🚀' : 'Clicked Start Project 🚀'}
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: TK.text, marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                {startProjectClicks.toLocaleString()}
              </div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(124,58,237,0.06)', borderRadius: '8px', border: '1px solid rgba(124,58,237,0.2)' }}>
              <div style={{ fontSize: '11px', color: TK.purple, fontWeight: 500 }}>
                {language === 'ar' ? 'استمارات مكتملة ومرسلة 🎯' : 'Form Inquiries Submitted 🎯'}
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: TK.purple, marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                {formSubmissions.toLocaleString()}
              </div>
            </div>
          </div>
          <ProgressBar value={formSubmissions} max={Math.max(startProjectClicks, formSubmissions, 1)} color={TK.purple} height="6px" />
          <p style={{ fontSize: '11px', color: TK.textLight, margin: '8px 0 0' }}>
            {language === 'ar'
              ? 'معدل تحويل العملاء من النقر على زر طلب المشروع إلى استكمال التفاصيل والنموذج الفعلي.'
              : 'Measures progression from clicking Start Project CTAs through to completed proposal submissions.'}
          </p>
        </Card>
      </div>

      {/* ── Main Operations Split Grid ── */}
      <div className="admin-dash-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '18px' }}>

        {/* ── Left Column (Telemetry & Project Ops) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', minWidth: 0 }}>

          {/* Granular Page Traffic Breakdown */}
          <Card>
            <SectionHead
              icon={BarChart3}
              title={language === 'ar' ? 'الصفحات الأكثر زيارة ومعدل البقاء' : 'Top Visited Pages & Engagement Time'}
              subtitle={language === 'ar' ? 'تفصيل حركة الزيارات على كل صفحة داخل المنصة ومتوسط وقت القراءة' : 'Granular traffic distribution and reading time by page URL'}
              action={
                <Link to="/app/admin/analytics" style={{ fontSize: '11px', color: TK.accent, textDecoration: 'none', fontWeight: 500 }}>
                  {language === 'ar' ? 'تحليل متقدم ↗' : 'Deep Report ↗'}
                </Link>
              }
            />

            {topPages.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: TK.textMuted }}>
                <p style={{ fontSize: '12px', margin: 0 }}>{language === 'ar' ? 'لا توجد بيانات تصفح مسجلة لهذه الفترة' : 'No page views recorded for this timeframe'}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {topPages.slice(0, 7).map((p, idx) => (
                  <div key={p._id || idx} style={{
                    padding: '10px 12px', borderRadius: '8px', border: `1px solid ${TK.border}`,
                    background: idx === 0 ? 'rgba(24,24,27,0.02)' : TK.surface,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <span style={{
                          width: '18px', height: '18px', borderRadius: '4px', background: TK.bgSubtle,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', fontWeight: 600, color: TK.textMuted, flexShrink: 0,
                        }}>
                          {idx + 1}
                        </span>
                        <span style={{ fontSize: '12.5px', fontWeight: 500, color: TK.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p._id || '/'}
                        </span>
                        {p.title && (
                          <span style={{ fontSize: '10.5px', color: TK.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            ({p.title})
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: TK.text, fontVariantNumeric: 'tabular-nums' }}>
                          {p.count} {language === 'ar' ? 'زيارة' : 'views'}
                        </span>
                        <span style={{ fontSize: '10px', color: TK.textMuted, background: TK.bgSubtle, padding: '2px 6px', borderRadius: '4px' }}>
                          ⏱️ {fmtDuration(p.avgViewTimeSec, language)}
                        </span>
                        <Badge tone="neutral">{p.pct}%</Badge>
                      </div>
                    </div>
                    <ProgressBar value={p.relativeToTopPct || p.pct} max={100} color={idx === 0 ? TK.ink : TK.textMuted} height="4px" />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Live In/Out Visitor Activity Stream */}
          <Card>
            <SectionHead
              icon={Activity}
              title={language === 'ar' ? 'سجل النشاط المباشر للزوار (دخول وخروج وتفاعل)' : 'Live In/Out Visitor Activity Stream'}
              subtitle={language === 'ar' ? 'مراقبة حية لمن دخل ولمن خرج ولأهم الإجراءات المتخذة' : 'Real-time feed showing who entered, exited, or took high-intent action'}
              action={
                <Badge tone="success" dot>
                  {language === 'ar' ? 'بث مباشر 20ث' : 'Live stream 20s'}
                </Badge>
              }
            />

            {activityFeed.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: TK.textMuted }}>
                <p style={{ fontSize: '12px', margin: 0 }}>{language === 'ar' ? 'لا يوجد نشاط مسجل في هذه اللحظة' : 'No real-time events recorded right now'}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {activityFeed.slice(0, 10).map((ev) => (
                  <div
                    key={ev.id}
                    className="au-row"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 10px', borderRadius: '8px', border: `1px solid ${TK.border}`,
                      background: TK.surface, gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                      <Badge tone={ev.tone || 'neutral'} dot>
                        {language === 'ar' ? ev.actionAr : ev.actionEn}
                      </Badge>
                      {ev.page && (
                        <span style={{ fontSize: '11px', color: TK.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ev.page}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      {(ev.city || ev.country) && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: TK.textMuted }}>
                          <Globe style={{ width: '10px', height: '10px' }} />
                          {[ev.city, ev.country].filter(Boolean).join(', ')}
                        </span>
                      )}
                      <DeviceIcon device={ev.device} />
                      <span style={{ fontSize: '10px', color: TK.textLight, minWidth: '45px', textAlign: isRTL ? 'left' : 'right' }}>
                        {timeAgo(ev.time, language)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Project Pipeline */}
          <Card>
            <SectionHead
              icon={FolderKanban}
              title={T.pipeline}
              action={<span style={{ fontSize: '11px', fontWeight: 600, color: TK.accent }}>{completionRate}% {T.completion}</span>}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: T.pending,    value: stats.pending,    max: stats.projects, color: TK.amber },
                { label: T.inProgress, value: stats.inProgress, max: stats.projects, color: TK.purple },
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
            <SectionHead
              icon={FolderKanban}
              title={T.recentProjects}
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
        </div>

        {/* ── Right Column (Quick Nav, Health, Users) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', minWidth: 0 }}>

          {/* Quick Nav */}
          <Card padding="18px">
            <SectionHead icon={Zap} title={T.quickNav} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              <QuickLink to="/app/admin/analytics"        icon={BarChart3}     title={language === 'ar' ? 'التحليلات الاستخباراتية' : 'Analytics Hub'} subtitle={language === 'ar' ? 'تقرير شامل بالساعة والرحلة' : 'Hourly journeys & funnels'} />
              <QuickLink to="/app/admin/users"            icon={Users}         title={T.userMgmt}    subtitle={`${stats.users} ${language === 'ar' ? 'مستخدم' : 'users'}`} />
              <QuickLink to="/app/admin/messages"         icon={Inbox}         title={T.messages}    subtitle={`${stats.messages} ${language === 'ar' ? 'محادثة' : 'threads'}`} />
              <QuickLink to="/app/admin/crm"              icon={Target}        title={T.crmDir} />
              <QuickLink to="/app/admin/project-requests" icon={ClipboardList} title={T.projectReq}  subtitle={`${stats.pending} ${language === 'ar' ? 'طلب' : 'pending'}`} />
              <QuickLink to="/app/admin/feedback"         icon={Star}          title={T.feedback} />
              <QuickLink to="/app/admin/portfolio"        icon={Images}        title={T.portfolioMgr} />
            </div>
          </Card>

          {/* System Health */}
          <Card padding="18px">
            <SectionHead icon={Database} title={T.systemHealth} />
            {[
              { label: T.apiServer,   status: T.operational, ok: true },
              { label: T.database,    status: T.connected,   ok: true },
              { label: T.fileStorage, status: T.operational, ok: true },
              { label: T.socket,      status: socketConnected ? T.connected : (language === 'ar' ? 'غير متصل' : 'Disconnected'), ok: socketConnected },
            ].map(({ label, status, ok }, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 3 ? `1px solid ${TK.border}` : 'none' }}>
                <span style={{ fontSize: '11.5px', color: TK.textMuted }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: ok ? TK.green : TK.red }} />
                  <span style={{ fontSize: '10.5px', fontWeight: 500, color: ok ? TK.green : TK.red }}>{status}</span>
                </div>
              </div>
            ))}
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

          {/* Top Sections */}
          {analytics?.topSections?.length > 0 && (
            <Card padding="18px">
              <SectionHead icon={Eye} title={T.topSections} />
              {analytics.topSections.slice(0, 4).map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 3 ? `1px solid ${TK.border}` : 'none' }}>
                  <span style={{ fontSize: '11.5px', color: TK.textMuted }}>{s._id}</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 500, color: TK.text }}>{s.count}</span>
                    {s.avgViewTime && <span style={{ fontSize: '10px', color: TK.textLight }}>{Math.round(s.avgViewTime / 1000)}s</span>}
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
