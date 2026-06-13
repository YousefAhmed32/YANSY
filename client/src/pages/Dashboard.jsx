import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban, MessageSquare, ArrowRight, Plus,
  TrendingUp, Clock, CheckCircle2, Loader2, AlertCircle,
  Zap, Star, Activity, ChevronRight, Sparkles, Target,
  RefreshCw, BarChart3, User, Bell, Shield, LogIn,
  Upload, CreditCard, Settings, CheckSquare, AlertTriangle,
} from 'lucide-react';
import api from '../utils/api';
import { gsap } from 'gsap';
import StartProject from './StartProject';
import { selectCanAccess } from '../store/billingSlice';
import { timeAgo } from '../utils/time';

// ── Activity type config ──────────────────────────────────────────────────────
const ACTIVITY_CFG = {
  account_created:    { icon: User,         color: '#10b981', label: 'Account created' },
  login:              { icon: LogIn,        color: '#6b7280', label: 'Logged in' },
  message_sent:       { icon: MessageSquare,color: '#d4af37', label: 'Message sent' },
  message_received:   { icon: MessageSquare,color: '#8b5cf6', label: 'Message received' },
  project_created:    { icon: FolderKanban, color: '#3b82f6', label: 'Project created' },
  project_updated:    { icon: FolderKanban, color: '#f59e0b', label: 'Project updated' },
  project_completed:  { icon: CheckCircle2, color: '#10b981', label: 'Project completed' },
  invoice_paid:       { icon: CreditCard,   color: '#10b981', label: 'Invoice paid' },
  file_uploaded:      { icon: Upload,       color: '#3b82f6', label: 'File uploaded' },
  profile_updated:    { icon: Settings,     color: '#6b7280', label: 'Profile updated' },
  onboarding_completed:{ icon: CheckSquare, color: '#10b981', label: 'Onboarding completed' },
  plan_changed:       { icon: Zap,          color: '#8b5cf6', label: 'Plan changed' },
};

// ── Activity Feed Item ────────────────────────────────────────────────────────
const ActivityItem = ({ log, tk, language }) => {
  const cfg  = ACTIVITY_CFG[log.type] || { icon: Activity, color: '#6b7280', label: log.type };
  const Icon = cfg.icon;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      padding: '9px 0',
      borderBottom: `1px solid ${tk.border}`,
    }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0,
        background: `${cfg.color}15`, border: `1px solid ${cfg.color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon style={{ width: '12px', height: '12px', color: cfg.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '11px', fontWeight: 400, color: tk.textMain, margin: '0 0 2px', lineHeight: 1.4 }}>
          {log.description || cfg.label}
        </p>
        <span style={{ fontSize: '9px', color: tk.textMuted, letterSpacing: '0.04em' }}>
          {timeAgo(log.createdAt, language)}
        </span>
      </div>
    </div>
  );
};

// ── Pending Action Item ───────────────────────────────────────────────────────
const PendingAction = ({ icon: Icon, color, title, description, action, tk }) => (
  <div
    onClick={action}
    style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '11px 14px', borderRadius: '8px',
      border: `1px solid ${tk.border}`,
      background: tk.surface,
      cursor: action ? 'pointer' : 'default',
      transition: 'all 0.15s',
    }}
    onMouseEnter={e => { if (action) { e.currentTarget.style.borderColor='rgba(212,175,55,0.3)'; e.currentTarget.style.background=tk.hoverBg; }}}
    onMouseLeave={e => { e.currentTarget.style.borderColor=tk.border; e.currentTarget.style.background=tk.surface; }}
  >
    <div style={{
      width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
      background: `${color}15`, border: `1px solid ${color}25`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon style={{ width: '13px', height: '13px', color }} />
    </div>
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: '11px', fontWeight: 500, color: tk.textMain, margin: '0 0 1px' }}>{title}</p>
      <p style={{ fontSize: '10px', color: tk.textMuted, margin: 0 }}>{description}</p>
    </div>
    {action && <ChevronRight style={{ width: '12px', height: '12px', color: tk.textMuted, opacity: 0.5, flexShrink: 0 }} />}
  </div>
);

// ── Customer Health Score ─────────────────────────────────────────────────────
const HealthScore = ({ stats, unreadMessages, hasProfile, tk }) => {
  // Compute score: 0–100 based on engagement signals
  let score = 20; // base
  if (hasProfile) score += 20;
  if (stats.projects > 0) score += 20;
  if (stats.inProgress > 0) score += 15;
  if (stats.completed > 0) score += 15;
  if (unreadMessages === 0 && stats.messages > 0) score += 10; // replied to all messages
  score = Math.min(100, score);

  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Building' : 'Getting Started';
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#d4af37' : score >= 40 ? '#f59e0b' : '#6b7280';
  const gold = '#d4af37';

  return (
    <div style={{ padding: '16px 18px', background: `${color}06`, border: `1px solid ${color}20`, borderRadius: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Activity style={{ width: '13px', height: '13px', color }} />
          <span style={{ fontSize: '10px', fontWeight: 500, color: tk.textMain, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Account Health
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
          <span style={{ fontSize: '24px', fontWeight: 700, color, letterSpacing: '-0.02em' }}>{score}</span>
          <span style={{ fontSize: '11px', color: tk.textMuted }}>/100</span>
        </div>
      </div>
      <div style={{ height: '4px', background: tk.border, borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: '2px', transition: 'width 1s ease' }} />
      </div>
      <p style={{ fontSize: '10px', color: tk.textMuted, margin: 0 }}>
        Status: <strong style={{ color }}>{label}</strong>
        {score < 80 && ' — complete your profile and engage to improve'}
      </p>
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const getGreetingKey = () => {
  const h = new Date().getHours();
  if (h < 12) return 'dashboard.greetingMorning';
  if (h < 17) return 'dashboard.greetingAfternoon';
  return 'dashboard.greetingEvening';
};

const STATUS_CONFIG = {
  pending:      { label: 'Pending',     color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', Icon: Clock       },
  'in-progress':{ label: 'In Progress', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  Icon: Loader2     },
  completed:    { label: 'Completed',   color: '#d4af37', bg: 'rgba(212,175,55,0.12)',  Icon: CheckCircle2},
  cancelled:    { label: 'Cancelled',   color: '#f87171', bg: 'rgba(248,113,113,0.12)', Icon: AlertCircle },
  delivered:    { label: 'Delivered',   color: '#34d399', bg: 'rgba(52,211,153,0.12)',  Icon: CheckCircle2},
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Skel = ({ h = 16, w, r = 8, sx = {}, isDark }) => (
  <div style={{
    height: h, width: w || '100%', borderRadius: r, flexShrink: 0,
    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    overflow: 'hidden', position: 'relative', ...sx,
  }}>
    <div className="skel-shimmer" />
  </div>
);

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, color, bg, subtitle, isDark, tk }) => (
  <div
    className="stat-card"
    style={{
      padding: '20px',
      background: tk.surface,
      border: `1px solid ${tk.border}`,
      borderRadius: '12px',
      transition: 'all 0.2s',
      cursor: 'default',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '9px',
        background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon style={{ width: '17px', height: '17px', color }} />
      </div>
    </div>
    <div style={{ fontSize: '26px', fontWeight: 600, color: tk.textMain, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '5px' }}>
      {value}
    </div>
    <div style={{ fontSize: '11px', fontWeight: 400, color: tk.textMuted, letterSpacing: '0.05em' }}>
      {title}
    </div>
    {subtitle && (
      <div style={{ fontSize: '10px', color: tk.textMuted, marginTop: '3px', opacity: 0.7 }}>
        {subtitle}
      </div>
    )}
  </div>
);

// ── Project Row ───────────────────────────────────────────────────────────────
const ProjectRow = ({ project, isDark, language, tk }) => {
  const cfg        = STATUS_CONFIG[project.status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.Icon;
  const progress   = project.progress || 0;

  return (
    <Link
      to={`/app/projects/${project._id}`}
      className="project-row"
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 10px',
        borderBottom: `1px solid ${tk.border}`,
        textDecoration: 'none',
        transition: 'background 0.15s',
        borderRadius: '8px',
        margin: '0 -6px',
      }}
    >
      <div style={{
        width: '32px', height: '32px', borderRadius: '8px',
        background: cfg.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <StatusIcon style={{
          width: '13px', height: '13px', color: cfg.color,
          animation: project.status === 'in-progress' ? 'spin 2s linear infinite' : 'none',
        }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '13px', fontWeight: 400, color: tk.textMain,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: progress > 0 ? '5px' : '0',
        }}>
          {project.title}
        </div>
        {progress > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{
              flex: 1, height: '2px',
              background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              borderRadius: '2px', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${progress}%`,
                background: progress === 100 ? '#d4af37' : progress >= 80 ? '#f59e0b' : '#3b82f6',
                borderRadius: '2px', transition: 'width 0.5s ease',
              }} />
            </div>
            <span style={{ fontSize: '9px', color: tk.textMuted, fontWeight: 400, letterSpacing: '0.02em', minWidth: '24px', textAlign: 'right' }}>
              {progress}%
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
        <span style={{ fontSize: '10px', color: tk.textMuted, whiteSpace: 'nowrap' }}>
          {timeAgo(project.updatedAt, language)}
        </span>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '2px',
          padding: '1px 6px', borderRadius: '4px',
          background: cfg.bg, fontSize: '8px', fontWeight: 500,
          color: cfg.color, letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          {cfg.label}
        </div>
      </div>
    </Link>
  );
};

// ── Quick Action ──────────────────────────────────────────────────────────────
const QuickAction = ({ to, icon: Icon, title, description, tk, onClick }) => {
  const inner = (
    <div
      className="quick-action"
      style={{
        padding: '14px 16px',
        background: tk.surface,
        border: `1px solid ${tk.border}`,
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex', alignItems: 'center', gap: '12px',
        textDecoration: 'none', color: 'inherit',
      }}
    >
      <div style={{
        width: '34px', height: '34px', borderRadius: '8px',
        background: 'rgba(212,175,55,0.1)',
        border: '1px solid rgba(212,175,55,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon style={{ width: '15px', height: '15px', color: '#d4af37' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12.5px', fontWeight: 400, color: tk.textMain, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        <div style={{ fontSize: '10px', fontWeight: 350, color: tk.textMuted }}>{description}</div>
      </div>
      <ArrowRight style={{ width: '13px', height: '13px', color: tk.textMuted, opacity: 0.5, flexShrink: 0 }} />
    </div>
  );

  if (onClick) return <div onClick={onClick}>{inner}</div>;
  return <Link to={to} style={{ textDecoration: 'none' }}>{inner}</Link>;
};

// ── AI Insight Card ───────────────────────────────────────────────────────────
const AIInsightCard = ({ tk }) => {
  const gold = '#d4af37';
  const [insight,  setInsight]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [fetched,  setFetched]  = useState(false);
  const canAccess = useSelector(selectCanAccess('PROFESSIONAL'));

  const fetchInsight = useCallback(async () => {
    if (!canAccess) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/ai/insight');
      setInsight(res.data.insight);
      setFetched(true);
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === 'AI_NOT_CONFIGURED') setError('ai_not_configured');
      else if (err.response?.status === 402) setError('upgrade_required');
      else if (err.response?.status === 429) setError('rate_limited');
      else setError('failed');
    } finally {
      setLoading(false);
    }
  }, [canAccess]);

  useEffect(() => { fetchInsight(); }, [fetchInsight]);

  if (!canAccess) return (
    <div style={{
      padding: '16px 18px',
      background: tk.surface, border: `1px solid ${tk.border}`,
      borderRadius: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Sparkles style={{ width: '13px', height: '13px', color: tk.textMuted }} />
        <span style={{ fontSize: '10px', fontWeight: 500, color: tk.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>AI Insight</span>
      </div>
      <p style={{ fontSize: '12.5px', fontWeight: 350, color: tk.textMuted, lineHeight: 1.6, margin: '0 0 10px' }}>
        Get real-time AI analysis of your projects — available on the Professional plan.
      </p>
      <a href="/app/billing" style={{ fontSize: '11px', color: gold, textDecoration: 'none', fontWeight: 400 }}>Upgrade to unlock →</a>
    </div>
  );

  return (
    <div style={{
      padding: '16px 18px',
      background: 'rgba(212,175,55,0.04)',
      border: `1px solid rgba(212,175,55,0.15)`,
      borderRadius: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles style={{
            width: '13px', height: '13px', color: gold,
            animation: loading ? 'pulse 1.5s ease-in-out infinite' : 'none',
          }} />
          <span style={{ fontSize: '10px', fontWeight: 500, color: gold, letterSpacing: '0.1em', textTransform: 'uppercase' }}>AI Insight</span>
        </div>
        {fetched && !loading && (
          <button
            onClick={fetchInsight}
            title="Refresh"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: tk.textMuted, padding: '2px', display: 'flex', transition: 'color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = gold; }}
            onMouseLeave={e => { e.currentTarget.style.color = tk.textMuted; }}
          >
            <RefreshCw style={{ width: '11px', height: '11px' }} />
          </button>
        )}
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '1.5px solid rgba(212,175,55,0.2)', borderTopColor: gold, animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: tk.textMuted, fontStyle: 'italic' }}>Analyzing your workspace…</span>
        </div>
      )}
      {!loading && error === 'ai_not_configured' && <p style={{ fontSize: '12px', color: tk.textMuted, margin: 0 }}>AI features need configuration. Add ANTHROPIC_API_KEY to the server.</p>}
      {!loading && error === 'rate_limited'      && <p style={{ fontSize: '12px', color: tk.textMuted, margin: 0 }}>Daily AI limit reached. Resets at midnight UTC.</p>}
      {!loading && error === 'failed'            && <p style={{ fontSize: '12px', color: tk.textMuted, margin: 0 }}>Could not load insight. <button onClick={fetchInsight} style={{ background: 'none', border: 'none', color: gold, cursor: 'pointer', fontSize: '12px', padding: 0 }}>Retry</button></p>}
      {!loading && insight && <p style={{ fontSize: '12.5px', fontWeight: 350, color: tk.textMain, lineHeight: 1.65, margin: 0 }}>{insight}</p>}
    </div>
  );
};

// ── Loading Skeleton ──────────────────────────────────────────────────────────
const DashboardSkeleton = ({ isDark }) => (
  <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }} className="dash-pad">
    <style>{`
      @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
      .skel-shimmer {
        position: absolute; top: 0; bottom: 0; left: 0; width: 60%;
        background: ${isDark
          ? 'linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent)'
          : 'linear-gradient(90deg,transparent,rgba(255,255,255,0.7),transparent)'};
        animation: shimmer 1.6s ease-in-out infinite;
      }
    `}</style>
    {/* Header */}
    <div style={{ marginBottom: '32px' }}>
      <Skel isDark={isDark} h={20} w={72} r={10} sx={{ marginBottom: '14px' }} />
      <Skel isDark={isDark} h={38} w={260} r={8} sx={{ marginBottom: '8px' }} />
      <Skel isDark={isDark} h={14} w={200} r={6} />
    </div>
    {/* Stats */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '24px' }} className="skel-stats">
      {[...Array(4)].map((_, i) => <Skel key={i} isDark={isDark} h={100} r={12} />)}
    </div>
    {/* Content */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }} className="skel-content">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Skel isDark={isDark} h={72} r={12} />
        <Skel isDark={isDark} h={220} r={12} />
        <Skel isDark={isDark} h={150} r={12} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Skel isDark={isDark} h={170} r={12} />
        <Skel isDark={isDark} h={140} r={12} />
        <Skel isDark={isDark} h={100} r={12} />
      </div>
    </div>
    <style>{`
      @media (max-width: 900px) { .skel-content { grid-template-columns: 1fr !important; } }
      @media (max-width: 600px) { .skel-stats { grid-template-columns: repeat(2,1fr) !important; } }
    `}</style>
  </div>
);

// ── Main Dashboard ────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { t }          = useTranslation();
  const { isDark }     = useTheme();
  const { isRTL, dir, language } = useLanguage();
  const navigate       = useNavigate();
  const { user }       = useSelector((s) => s.auth);

  const [stats, setStats]                   = useState({ projects: 0, messages: 0, pending: 0, inProgress: 0, completed: 0, unreadMessages: 0 });
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [activityLog,    setActivityLog]    = useState([]);
  const [pendingActions, setPendingActions] = useState([]);
  const [showStartProject, setShowStartProject] = useState(false);
  const [loading, setLoading]               = useState(true);

  const containerRef = useRef(null);
  const headerRef    = useRef(null);
  const statsRef     = useRef(null);
  const contentRef   = useRef(null);

  // Memoised theme tokens — no re-creation on unrelated renders
  const tk = useMemo(() => ({
    bg:       isDark ? '#080806'                : '#f4f4f2',
    surface:  isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
    border:   isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    textMain: isDark ? '#f0f0eb'                : '#0a0a0a',
    textMuted:isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
    gold:     '#d4af37',
    hoverBg:  isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    shadow:   isDark
      ? 'none'
      : '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  }), [isDark]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [projectsRes, messagesRes, activityRes] = await Promise.all([
        api.get('/projects?limit=5'),
        api.get('/messages/threads?limit=10'),
        api.get('/activity?limit=10').catch(() => ({ data: { logs: [] } })),
      ]);
      const allProjects  = projectsRes.data.projects || [];
      const projectCount = projectsRes.data.total || allProjects.length || 0;
      const threads      = messagesRes.data.threads || [];
      const unreadMsgs   = threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0);
      const logs         = activityRes.data.logs || [];

      setStats({
        projects:       projectCount,
        messages:       threads.length,
        pending:        allProjects.filter(p => p.status === 'pending').length,
        inProgress:     allProjects.filter(p => p.status === 'in-progress' || p.status === 'near-completion').length,
        completed:      allProjects.filter(p => p.status === 'completed' || p.status === 'delivered').length,
        unreadMessages: unreadMsgs,
      });
      setRecentProjects(allProjects.slice(0, 5));
      setRecentMessages(threads.slice(0, 3));
      setActivityLog(logs.slice(0, 8));

      // Compute pending actions
      const actions = [];
      if (unreadMsgs > 0) actions.push({ id: 'unread', type: 'message', count: unreadMsgs });
      if (allProjects.filter(p => p.status === 'pending').length > 0)
        actions.push({ id: 'pending_proj', type: 'project' });
      setPendingActions(actions);

      if (projectCount === 0) setShowStartProject(true);
    } catch (err) {
      console.error('Dashboard fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // GSAP entrance
  useEffect(() => {
    if (loading || !containerRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      if (headerRef.current)  tl.fromTo(headerRef.current,  { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.55 }, 0.05);
      if (statsRef.current?.children?.length)
        tl.fromTo(statsRef.current.children, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07 }, 0.2);
      if (contentRef.current?.children?.length)
        tl.fromTo(contentRef.current.children, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.05 }, 0.38);
    }, containerRef);
    return () => ctx.revert();
  }, [loading]);

  const handleProjectComplete = useCallback(() => { setShowStartProject(false); fetchData(); }, [fetchData]);

  if (showStartProject && !loading) return <StartProject onComplete={handleProjectComplete} />;
  if (loading) return <DashboardSkeleton isDark={isDark} />;

  const firstName = user?.fullName?.split(' ')[0] || '';
  const isAdmin   = user?.role === 'ADMIN';

  return (
    <div
      ref={containerRef}
      dir={dir}
      style={{
        minHeight: '100vh',
        background: tk.bg,
        color: tk.textMain,
      }}
      className="dash-container"
    >
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.45; } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }

        .skel-shimmer {
          position: absolute; top: 0; bottom: 0; left: 0; width: 60%;
          background: ${isDark
            ? 'linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent)'
            : 'linear-gradient(90deg,transparent,rgba(255,255,255,0.7),transparent)'};
          animation: shimmer 1.6s ease-in-out infinite;
        }

        .dash-container { padding: 32px 32px 64px; }

        .stat-card:hover {
          background: ${tk.hoverBg} !important;
          border-color: rgba(212,175,55,0.22) !important;
          transform: translateY(-1px);
          box-shadow: ${isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.08)'};
        }
        .project-row:hover {
          background: ${tk.hoverBg} !important;
        }
        .quick-action:hover {
          background: rgba(212,175,55,0.06) !important;
          border-color: rgba(212,175,55,0.28) !important;
        }

        .dash-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .dash-grid {
          display: grid;
          grid-template-columns: minmax(0,1fr) minmax(0,320px);
          gap: 20px;
        }
        .dash-quick-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        @media (max-width: 1024px) {
          .dash-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 900px) {
          .dash-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .dash-container { padding: 20px 16px 48px !important; }
          .dash-stats { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .dash-quick-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 400px) {
          .dash-stats { grid-template-columns: 1fr; }
        }

        .section-card {
          padding: 20px;
          background: ${tk.surface};
          border: 1px solid ${tk.border};
          border-radius: 12px;
          box-shadow: ${tk.shadow};
        }
        .section-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .section-label {
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .section-label h2 {
          font-size: 11px;
          font-weight: 500;
          color: ${tk.textMain};
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin: 0;
        }
        .view-all-link {
          font-size: 11px;
          color: ${tk.textMuted};
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 3px;
          transition: color 0.15s;
        }
        .view-all-link:hover { color: ${tk.gold}; }
      `}</style>

      {/* ── Padded inner ───────────────────────────────────────────────────── */}
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div ref={headerRef} style={{ marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '3px 10px', borderRadius: '20px',
            border: '1px solid rgba(212,175,55,0.22)',
            background: 'rgba(212,175,55,0.06)',
            marginBottom: '12px',
          }}>
            <Zap style={{ width: '9px', height: '9px', color: tk.gold }} />
            <span style={{ fontSize: '9px', fontWeight: 500, color: tk.gold, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              {t(getGreetingKey())}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{
                fontSize: 'clamp(24px,3.5vw,38px)',
                fontWeight: 600,
                letterSpacing: '-0.025em',
                color: tk.textMain,
                margin: 0,
                lineHeight: 1.15,
                fontFamily: "'Inter',system-ui,sans-serif",
              }}>
                {firstName ? `${firstName}'s workspace` : 'Your workspace'}
              </h1>
              <p style={{ fontSize: '13.5px', fontWeight: 350, color: tk.textMuted, marginTop: '6px', lineHeight: 1.5 }}>
                Here's what's happening across your projects
              </p>
            </div>

            <button
              onClick={() => navigate('/app/projects/new')}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '9px 16px',
                background: 'rgba(212,175,55,0.1)',
                border: '1px solid rgba(212,175,55,0.3)',
                borderRadius: '8px',
                color: tk.gold,
                fontSize: '11px', fontWeight: 500,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = tk.gold; e.currentTarget.style.color = '#000'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.1)'; e.currentTarget.style.color = tk.gold; }}
            >
              <Plus style={{ width: '13px', height: '13px' }} />
              New Project
            </button>
          </div>
        </div>

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        <div ref={statsRef} className="dash-stats">
          <StatCard title="Total Projects" value={stats.projects}   icon={FolderKanban}  color="#d4af37" bg="rgba(212,175,55,0.12)"  subtitle="All time"    isDark={isDark} tk={tk} />
          <StatCard title="In Progress"    value={stats.inProgress} icon={TrendingUp}    color="#60a5fa" bg="rgba(96,165,250,0.12)"  subtitle="Active now"  isDark={isDark} tk={tk} />
          <StatCard title="Completed"      value={stats.completed}  icon={CheckCircle2} color="#34d399" bg="rgba(52,211,153,0.12)"  subtitle="Delivered"   isDark={isDark} tk={tk} />
          <StatCard title="Messages"       value={stats.messages}   icon={MessageSquare} color="#a78bfa" bg="rgba(167,139,250,0.12)" subtitle="Threads"     isDark={isDark} tk={tk} />
        </div>

        {/* ── Main Grid ───────────────────────────────────────────────────── */}
        <div ref={contentRef} className="dash-grid">

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>

            {/* AI Insight */}
            <AIInsightCard tk={tk} />

            {/* Recent Projects */}
            <div className="section-card">
              <div className="section-title">
                <div className="section-label">
                  <Activity style={{ width: '13px', height: '13px', color: tk.gold }} />
                  <h2>Recent Projects</h2>
                </div>
                <Link to="/app/projects" className="view-all-link">
                  View all <ChevronRight style={{ width: '11px', height: '11px' }} />
                </Link>
              </div>

              {recentProjects.length === 0 ? (
                <div style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  borderRadius: '8px',
                  border: `1px dashed ${tk.border}`,
                  background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                }}>
                  <FolderKanban style={{ width: '32px', height: '32px', color: tk.textMuted, margin: '0 auto 10px', opacity: 0.3 }} />
                  <p style={{ fontSize: '13px', color: tk.textMuted, fontWeight: 350, marginBottom: '14px', lineHeight: 1.5 }}>
                    No projects yet.<br />Start your first one to get going.
                  </p>
                  <button
                    onClick={() => navigate('/app/projects/new')}
                    style={{
                      padding: '8px 18px',
                      background: 'rgba(212,175,55,0.1)',
                      border: '1px solid rgba(212,175,55,0.28)',
                      borderRadius: '7px',
                      color: tk.gold, fontSize: '11px',
                      fontWeight: 500, letterSpacing: '0.08em',
                      textTransform: 'uppercase', cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = tk.gold; e.currentTarget.style.color = '#000'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.1)'; e.currentTarget.style.color = tk.gold; }}
                  >
                    Start Your First Project
                  </button>
                </div>
              ) : (
                <div>
                  {recentProjects.map((project) => (
                    <ProjectRow key={project._id} project={project} isDark={isDark} language={language} tk={tk} />
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="section-card">
              <div className="section-label" style={{ marginBottom: '14px' }}>
                <Target style={{ width: '13px', height: '13px', color: tk.gold }} />
                <h2>Quick Actions</h2>
              </div>
              <div className="dash-quick-grid">
                <QuickAction to="/app/projects/new" icon={Plus}          title="New Project"    description="Start a fresh request"   tk={tk} />
                <QuickAction to="/app/messages"      icon={MessageSquare} title="Messages"       description="View conversations"      tk={tk} />
                <QuickAction to="/app/projects"      icon={FolderKanban}  title="All Projects"   description="Track your work"         tk={tk} />
                <QuickAction to="/feedback"           icon={Star}          title="Leave Feedback" description="Share your experience"   tk={tk} />
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>

            {/* Pending Actions */}
            {pendingActions.length > 0 && (
              <div className="section-card" style={{ border: '1px solid rgba(245,158,11,0.25)', background: isDark ? 'rgba(245,158,11,0.03)' : 'rgba(245,158,11,0.03)' }}>
                <div className="section-label" style={{ marginBottom: '12px' }}>
                  <AlertTriangle style={{ width: '13px', height: '13px', color: '#f59e0b' }} />
                  <h2 style={{ color: tk.textMain }}>Pending Actions</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {pendingActions.map(a => {
                    if (a.type === 'message') return (
                      <PendingAction
                        key={a.id}
                        icon={MessageSquare}
                        color="#d4af37"
                        title={`${a.count} unread message${a.count > 1 ? 's' : ''}`}
                        description="Tap to view and reply"
                        action={() => navigate('/app/messages')}
                        tk={tk}
                      />
                    );
                    if (a.type === 'project') return (
                      <PendingAction
                        key={a.id}
                        icon={FolderKanban}
                        color="#3b82f6"
                        title="Project awaiting review"
                        description="Check project status"
                        action={() => navigate('/app/projects')}
                        tk={tk}
                      />
                    );
                    return null;
                  })}
                </div>
              </div>
            )}

            {/* Account Overview */}
            <div className="section-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingBottom: '16px', borderBottom: `1px solid ${tk.border}` }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '10px',
                  background: 'linear-gradient(135deg,rgba(212,175,55,0.25),rgba(212,175,55,0.06))',
                  border: '1px solid rgba(212,175,55,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '15px', fontWeight: 600, color: tk.gold,
                  flexShrink: 0,
                }}>
                  {user?.fullName?.[0]?.toUpperCase() || <User style={{ width: '16px', height: '16px' }} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 450, color: tk.textMain, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.fullName || 'User'}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 350, color: tk.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.email}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Plan',         value: isAdmin ? 'Admin' : 'Client' },
                  { label: 'Company',      value: user?.companyName || user?.brandName || '—' },
                  { label: 'Member Since', value: new Date(user?.createdAt || Date.now()).toLocaleDateString('en', { month: 'short', year: 'numeric' }) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${tk.border}` }}>
                    <span style={{ fontSize: '10px', fontWeight: 400, color: tk.textMuted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</span>
                    <span style={{ fontSize: '12px', fontWeight: 400, color: tk.textMain }}>{value}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/app/profile"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  marginTop: '14px', padding: '9px',
                  background: 'transparent',
                  border: `1px solid ${tk.border}`,
                  borderRadius: '8px',
                  color: tk.textMuted, fontSize: '11px',
                  fontWeight: 400, letterSpacing: '0.08em',
                  textTransform: 'uppercase', textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)'; e.currentTarget.style.color = tk.gold; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = tk.border; e.currentTarget.style.color = tk.textMuted; }}
              >
                Edit Profile
                <ArrowRight style={{ width: '11px', height: '11px' }} />
              </Link>
            </div>

            {/* Recent Messages */}
            {recentMessages.length > 0 && (
              <div className="section-card">
                <div className="section-title">
                  <div className="section-label">
                    <MessageSquare style={{ width: '13px', height: '13px', color: tk.gold }} />
                    <h2>Recent Messages</h2>
                  </div>
                  <Link to="/app/messages" className="view-all-link">View all</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recentMessages.map(thread => {
                    const other   = thread.participants?.find(p => p._id !== user?._id);
                    const name    = other?.fullName || other?.email || 'Team';
                    const initial = name[0]?.toUpperCase() || '?';
                    return (
                      <Link
                        key={thread._id}
                        to="/app/messages"
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '9px 10px',
                          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.018)',
                          border: `1px solid ${tk.border}`,
                          borderRadius: '8px',
                          textDecoration: 'none',
                          transition: 'border-color 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.22)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = tk.border; }}
                      >
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '8px',
                          background: 'linear-gradient(135deg,rgba(212,175,55,0.18),rgba(212,175,55,0.04))',
                          border: '1px solid rgba(212,175,55,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', color: tk.gold, fontWeight: 600,
                          flexShrink: 0,
                        }}>
                          {initial}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 400, color: tk.textMain, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {name}
                          </div>
                          <div style={{ fontSize: '10px', color: tk.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                            {thread.lastMessage?.content || 'No messages yet'}
                          </div>
                        </div>
                        {thread.unreadCount > 0 && (
                          <span style={{
                            minWidth: '18px', height: '18px', borderRadius: '9px',
                            background: tk.gold, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '9px', fontWeight: 600, color: '#000',
                            padding: '0 4px',
                          }}>
                            {thread.unreadCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Health Score */}
            <HealthScore
              stats={stats}
              unreadMessages={stats.unreadMessages}
              hasProfile={!!user?.phoneNumber}
              tk={tk}
            />

            {/* Activity Feed */}
            {activityLog.length > 0 && (
              <div className="section-card">
                <div className="section-label" style={{ marginBottom: '12px' }}>
                  <Activity style={{ width: '13px', height: '13px', color: tk.gold }} />
                  <h2>Recent Activity</h2>
                </div>
                <div>
                  {activityLog.map(log => (
                    <ActivityItem key={log._id} log={log} tk={tk} language={language} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
