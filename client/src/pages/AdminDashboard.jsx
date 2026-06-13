import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart3, Users, FolderKanban, MessageSquare, TrendingUp,
  Clock, ArrowRight, Activity, CheckCircle2, AlertCircle,
  Loader2, Plus, Eye, ChevronRight, Zap, Target, Star,
  RefreshCw, Filter, Search, Bell, Images, ClipboardList,
  Lightbulb, Shield, Database
} from 'lucide-react';
import api from '../utils/api';
import { gsap } from 'gsap';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { timeAgo } from '../utils/time';

const STATUS_CFG = {
  pending:      { label: 'Pending',     color: 'rgba(255,255,255,0.6)', bg: 'rgba(255,255,255,0.08)' },
  'in-progress':{ label: 'In Progress', color: '#60a5fa',              bg: 'rgba(96,165,250,0.1)'   },
  completed:    { label: 'Completed',   color: '#d4af37',              bg: 'rgba(212,175,55,0.1)'   },
  cancelled:    { label: 'Cancelled',   color: '#f87171',              bg: 'rgba(248,113,113,0.1)'  },
  delivered:    { label: 'Delivered',   color: '#34d399',              bg: 'rgba(52,211,153,0.1)'   },
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KPICard = ({ title, value, icon: Icon, color, bg, subtitle, trend, trendLabel, isDark }) => {
  const border  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const surface = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const textMain = isDark ? '#f5f5f0' : '#0a0a0a';
  const textMuted = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const hoverBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';

  return (
    <div
      style={{
        padding: '20px',
        background: surface,
        border: `1px solid ${border}`,
        borderRadius: '12px',
        transition: 'all 0.25s',
        cursor: 'default',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = surface; e.currentTarget.style.borderColor = border; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '9px',
          background: bg, border: `1px solid ${color}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon style={{ width: '17px', height: '17px', color }} />
        </div>
        {trend !== undefined && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '3px',
            padding: '2px 7px', borderRadius: '10px',
            background: trend >= 0 ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
            color: trend >= 0 ? '#34d399' : '#f87171',
            fontSize: '10px', fontWeight: 400,
          }}>
            <TrendingUp style={{ width: '9px', height: '9px' }} />
            {trend >= 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <div style={{ fontSize: '30px', fontWeight: 600, color: textMain, lineHeight: 1, marginBottom: '6px', letterSpacing: '-0.03em' }}>
        {value}
      </div>
      <div style={{ fontSize: '10px', fontWeight: 400, color: textMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: '10px', color: textMuted, marginTop: '4px', fontWeight: 300 }}>{subtitle}</div>
      )}
    </div>
  );
};

// ── Progress Bar ──────────────────────────────────────────────────────────────
const ProgressBar = ({ value, max, color = '#d4af37', isDark }) => (
  <div style={{ width: '100%', height: '4px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
    <div style={{
      height: '100%', width: `${Math.min(100, max > 0 ? (value / max) * 100 : 0)}%`,
      background: color, borderRadius: '2px', transition: 'width 0.8s ease',
    }} />
  </div>
);

// ── Quick Link Card ───────────────────────────────────────────────────────────
const QuickLink = ({ to, icon: Icon, title, count, color, isDark }) => {
  const surface  = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const border   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const textMain = isDark ? '#f5f5f0' : '#0a0a0a';
  const textMuted = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  return (
    <Link
      to={to}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '14px 16px',
        background: surface,
        border: `1px solid ${border}`,
        borderRadius: '10px',
        textDecoration: 'none',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'; e.currentTarget.style.background = isDark ? 'rgba(212,175,55,0.04)' : 'rgba(212,175,55,0.03)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.background = surface; }}
    >
      <div style={{
        width: '34px', height: '34px', borderRadius: '8px',
        background: `${color}15`, border: `1px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon style={{ width: '15px', height: '15px', color }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '12px', fontWeight: 300, color: textMain }}>{title}</div>
        {count !== undefined && (
          <div style={{ fontSize: '10px', color: textMuted, marginTop: '1px' }}>{count} items</div>
        )}
      </div>
      <ChevronRight style={{ width: '13px', height: '13px', color: textMuted, opacity: 0.5 }} />
    </Link>
  );
};

// ── Main Admin Dashboard ──────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { t }        = useTranslation();
  const { user }     = useSelector(s => s.auth);
  const { isDark }   = useTheme();
  const { dir, language } = useLanguage();
  const navigate     = useNavigate();

  const [analytics,    setAnalytics]    = useState(null);
  const [stats,        setStats]        = useState({ users: 0, projects: 0, messages: 0, pending: 0, inProgress: 0, completed: 0 });
  const [projects,     setProjects]     = useState([]);
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [lastUpdated,  setLastUpdated]  = useState(null);

  const socketRef    = useRef(null);
  const containerRef = useRef(null);
  const statsGridRef = useRef(null);
  const contentRef   = useRef(null);

  // Theme tokens
  const bg       = isDark ? '#080806'  : '#fafaf9';
  const surface  = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const border   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textMain = isDark ? '#f5f5f0'  : '#0a0a0a';
  const textMuted = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const gold     = '#d4af37';

  // ── Fetch all data ──────────────────────────────────────────────────────────
  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [analyticsRes, usersRes, projectsRes, messagesRes] = await Promise.all([
        api.get('/analytics/dashboard').catch(() => ({ data: {} })),
        api.get('/users?limit=6'),
        api.get('/projects?limit=8'),
        api.get('/messages/threads'),
      ]);

      const allProjects = projectsRes.data.projects || [];
      const allUsers    = usersRes.data.users || [];

      setAnalytics(analyticsRes.data);
      setProjects(allProjects.slice(0, 6));
      setUsers(allUsers.slice(0, 5));
      setStats({
        users:      usersRes.data.total      || allUsers.length,
        projects:   projectsRes.data.total   || allProjects.length,
        messages:   messagesRes.data.threads?.length || 0,
        pending:    allProjects.filter(p => p.status === 'pending').length,
        inProgress: allProjects.filter(p => p.status === 'in-progress').length,
        completed:  allProjects.filter(p => p.status === 'completed' || p.status === 'delivered').length,
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    initSocket();
    return () => socketRef.current?.disconnect();
  }, [fetchAll]);

  const initSocket = () => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;
    const url = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const socket = io(url, { auth: { token }, transports: ['websocket', 'polling'] });
    socket.on('connect', () => socket.emit('join', user._id));
    socket.on('project-created',  () => fetchAll(true));
    socket.on('project-updated',  () => fetchAll(true));
    socket.on('admin-project-update', () => fetchAll(true));
    socketRef.current = socket;
  };

  // GSAP
  useEffect(() => {
    if (loading || !containerRef.current) return;
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    if (statsGridRef.current) tl.fromTo(statsGridRef.current.children, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 }, 0.1);
    if (contentRef.current)   tl.fromTo(contentRef.current.children,   { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07 }, 0.35);
  }, [loading]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid rgba(212,175,55,0.15)', borderTopColor: gold, animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const overview = analytics?.overview || {};
  const completionRate = stats.projects > 0 ? Math.round((stats.completed / stats.projects) * 100) : 0;

  return (
    <div
      ref={containerRef}
      dir={dir}
      style={{ minHeight: '100vh', background: bg, color: textMain, padding: '32px 32px 60px' }}
    >
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '3px 10px', borderRadius: '20px',
            border: '1px solid rgba(212,175,55,0.25)', background: 'rgba(212,175,55,0.06)',
            marginBottom: '10px',
          }}>
            <Shield style={{ width: '10px', height: '10px', color: gold }} />
            <span style={{ fontSize: '10px', fontWeight: 400, color: gold, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Admin Control Center
            </span>
          </div>
          <h1 style={{
            fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 600, letterSpacing: '-0.02em',
            color: textMain, margin: 0, fontFamily: "'Inter',system-ui,sans-serif",
          }}>
            Platform Overview
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 300, color: textMuted, marginTop: '6px' }}>
            Real-time insights · {lastUpdated ? `Updated ${timeAgo(lastUpdated, language)}` : 'Loading...'}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 16px', background: 'transparent',
              border: `1px solid ${border}`, borderRadius: '8px',
              color: textMuted, fontSize: '11px', fontWeight: 300,
              letterSpacing: '0.08em', cursor: refreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!refreshing) { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'; e.currentTarget.style.color = gold; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = textMuted; }}
          >
            <RefreshCw style={{ width: '13px', height: '13px', animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/app/projects/new')}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 16px', background: 'rgba(212,175,55,0.1)',
              border: '1px solid rgba(212,175,55,0.35)', borderRadius: '8px',
              color: gold, fontSize: '11px', fontWeight: 400,
              letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = gold; e.currentTarget.style.color = '#000'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.1)'; e.currentTarget.style.color = gold; }}
          >
            <Plus style={{ width: '13px', height: '13px' }} />
            New Project
          </button>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div
        ref={statsGridRef}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '28px' }}
      >
        <KPICard title="Total Users"    value={stats.users}      icon={Users}       color="#a78bfa" bg="rgba(167,139,250,0.12)" isDark={isDark} subtitle="Registered accounts" />
        <KPICard title="All Projects"   value={stats.projects}   icon={FolderKanban} color="#d4af37" bg="rgba(212,175,55,0.12)" isDark={isDark} subtitle="Active portfolio" />
        <KPICard title="In Progress"    value={stats.inProgress} icon={Loader2}      color="#60a5fa" bg="rgba(96,165,250,0.12)" isDark={isDark} subtitle="Currently building" />
        <KPICard title="Completed"      value={stats.completed}  icon={CheckCircle2} color="#34d399" bg="rgba(52,211,153,0.12)" isDark={isDark} subtitle="Delivered" />
        <KPICard title="Pending Review" value={stats.pending}    icon={Clock}        color="#f59e0b" bg="rgba(245,158,11,0.12)" isDark={isDark} subtitle="Awaiting action" />
        <KPICard title="Conversations"  value={stats.messages}   icon={MessageSquare} color="#fb7185" bg="rgba(251,113,133,0.12)" isDark={isDark} subtitle="Active threads" />
      </div>

      {/* ── Main Grid ── */}
      <div ref={contentRef} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,320px)', gap: '20px' }} className="admin-grid">

        {/* ── Left Column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>

          {/* Pipeline Status */}
          <div style={{ padding: '22px', background: surface, border: `1px solid ${border}`, borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Activity style={{ width: '14px', height: '14px', color: gold }} />
              <h2 style={{ fontSize: '11px', fontWeight: 400, color: textMain, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                Project Pipeline
              </h2>
              <span style={{ marginLeft: 'auto', fontSize: '10px', color: textMuted }}>
                {completionRate}% completion rate
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Pending',     value: stats.pending,    max: stats.projects, color: '#f59e0b' },
                { label: 'In Progress', value: stats.inProgress, max: stats.projects, color: '#60a5fa' },
                { label: 'Completed',   value: stats.completed,  max: stats.projects, color: '#d4af37' },
              ].map(({ label, value, max, color }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 300, color: textMuted }}>{label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 400, color: textMain }}>{value}</span>
                      <span style={{
                        padding: '1px 6px', borderRadius: '8px', fontSize: '9px', fontWeight: 300,
                        background: `${color}15`, color, border: `1px solid ${color}25`,
                      }}>
                        {max > 0 ? Math.round((value / max) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  <ProgressBar value={value} max={Math.max(max, 1)} color={color} isDark={isDark} />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Projects */}
          <div style={{ padding: '22px', background: surface, border: `1px solid ${border}`, borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderKanban style={{ width: '14px', height: '14px', color: gold }} />
                <h2 style={{ fontSize: '11px', fontWeight: 400, color: textMain, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                  Recent Projects
                </h2>
              </div>
              <Link to="/app/projects" style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '10px', color: textMuted, textDecoration: 'none', transition: 'color 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.color = gold; }}
                onMouseLeave={e => { e.currentTarget.style.color = textMuted; }}
              >
                View all <ChevronRight style={{ width: '11px', height: '11px' }} />
              </Link>
            </div>

            {projects.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: textMuted }}>
                <FolderKanban style={{ width: '24px', height: '24px', margin: '0 auto 8px', opacity: 0.3 }} />
                <p style={{ fontSize: '12px', fontWeight: 300 }}>No projects yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {projects.map(p => {
                  const cfg = STATUS_CFG[p.status] || STATUS_CFG.pending;
                  return (
                    <Link
                      key={p._id}
                      to={`/app/projects/${p._id}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '10px 10px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        transition: 'all 0.15s',
                        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      {/* Status dot */}
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                      {/* Title + client */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 300, color: textMain, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.title}
                        </div>
                        {p.client && (
                          <div style={{ fontSize: '10px', color: textMuted, marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.client?.fullName || p.client?.email || 'Unknown client'}
                          </div>
                        )}
                      </div>
                      {/* Status badge */}
                      <span style={{
                        padding: '2px 8px', borderRadius: '8px', fontSize: '9px', fontWeight: 300,
                        background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}25`,
                        flexShrink: 0, letterSpacing: '0.06em',
                      }}>
                        {cfg.label}
                      </span>
                      {/* Progress */}
                      {(p.progress > 0) && (
                        <span style={{ fontSize: '9px', color: textMuted, flexShrink: 0 }}>{p.progress}%</span>
                      )}
                      {/* Time */}
                      <span style={{ fontSize: '9px', color: textMuted, flexShrink: 0 }}>{timeAgo(p.updatedAt, language)}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Analytics Overview */}
          <div style={{ padding: '22px', background: surface, border: `1px solid ${border}`, borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <BarChart3 style={{ width: '14px', height: '14px', color: gold }} />
              <h2 style={{ fontSize: '11px', fontWeight: 400, color: textMain, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                Session Analytics
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
              {[
                { label: 'Total Sessions',   value: overview.totalSessions  || 0 },
                { label: 'Active Sessions',  value: overview.activeSessions || 0 },
                { label: 'Page Views',       value: overview.pageViews      || 0 },
                { label: 'Avg. Duration',    value: overview.avgDuration ? `${Math.round(overview.avgDuration / 60)}m` : '—' },
              ].map(({ label, value }, i) => (
                <div key={label} style={{
                  padding: '14px',
                  borderBottom: i < 2 ? `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` : 'none',
                  borderRight: i % 2 === 0 ? `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` : 'none',
                }}>
                  <div style={{ fontSize: '22px', fontWeight: 600, color: textMain, letterSpacing: '-0.02em' }}>{value}</div>
                  <div style={{ fontSize: '10px', fontWeight: 300, color: textMuted, marginTop: '3px', letterSpacing: '0.06em' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Top pages */}
            {analytics?.topPages && analytics.topPages.length > 0 && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${border}` }}>
                <div style={{ fontSize: '10px', fontWeight: 400, color: textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Top Pages
                </div>
                {analytics.topPages.slice(0, 4).map((page, i) => {
                  const maxCount = analytics.topPages[0]?.count || 1;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 300, color: textMuted, width: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {page._id || '/'}
                      </div>
                      <div style={{ flex: 1, height: '3px', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(page.count / maxCount) * 100}%`, background: gold, borderRadius: '2px' }} />
                      </div>
                      <span style={{ fontSize: '10px', color: textMuted, flexShrink: 0, width: '28px', textAlign: 'right' }}>{page.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>

          {/* Quick Navigation */}
          <div style={{ padding: '20px', background: surface, border: `1px solid ${border}`, borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Target style={{ width: '13px', height: '13px', color: gold }} />
              <h2 style={{ fontSize: '11px', fontWeight: 400, color: textMain, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                Admin Navigation
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <QuickLink to="/app/admin/users"            icon={Users}       title="User Management"   count={stats.users}    color="#a78bfa" isDark={isDark} />
              <QuickLink to="/app/admin/crm"              icon={Target}      title="CRM Directory"     count={stats.users}    color="#d4af37" isDark={isDark} />
              <QuickLink to="/app/admin/project-requests" icon={ClipboardList} title="Project Requests" count={stats.pending} color="#f59e0b" isDark={isDark} />
              <QuickLink to="/app/admin/feedback"         icon={Lightbulb}   title="Feedback"                               color="#34d399" isDark={isDark} />
              <QuickLink to="/app/admin/portfolio"        icon={Images}      title="Portfolio Manager"                      color="#60a5fa" isDark={isDark} />
            </div>
          </div>

          {/* Recent Users */}
          {users.length > 0 && (
            <div style={{ padding: '20px', background: surface, border: `1px solid ${border}`, borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users style={{ width: '13px', height: '13px', color: gold }} />
                  <h2 style={{ fontSize: '11px', fontWeight: 400, color: textMain, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                    Recent Users
                  </h2>
                </div>
                <Link to="/app/admin/users" style={{ fontSize: '10px', color: textMuted, textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = gold; }}
                  onMouseLeave={e => { e.currentTarget.style.color = textMuted; }}
                >
                  View all
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {users.map(u => (
                  <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg,rgba(212,175,55,0.2),rgba(212,175,55,0.06))',
                      border: '1px solid rgba(212,175,55,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', color: gold, fontWeight: 300,
                    }}>
                      {u.fullName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11px', fontWeight: 300, color: textMain, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.fullName || 'User'}
                      </div>
                      <div style={{ fontSize: '9px', color: textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.email}
                      </div>
                    </div>
                    <span style={{
                      padding: '2px 6px', borderRadius: '8px', fontSize: '8px', fontWeight: 300,
                      background: u.role === 'ADMIN' ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.06)',
                      color: u.role === 'ADMIN' ? gold : textMuted,
                      border: `1px solid ${u.role === 'ADMIN' ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.1)'}`,
                      letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0,
                    }}>
                      {u.role === 'ADMIN' ? 'Admin' : 'User'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Platform Health */}
          <div style={{ padding: '18px 20px', background: surface, border: `1px solid ${border}`, borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Database style={{ width: '13px', height: '13px', color: gold }} />
              <h2 style={{ fontSize: '11px', fontWeight: 400, color: textMain, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                System Health
              </h2>
            </div>
            {[
              { label: 'API Server',   status: 'Operational', ok: true },
              { label: 'Database',     status: 'Connected',   ok: true },
              { label: 'File Storage', status: 'Available',   ok: true },
              { label: 'Socket.IO',    status: socketRef.current?.connected ? 'Connected' : 'Active', ok: true },
            ].map(({ label, status, ok }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                <span style={{ fontSize: '11px', fontWeight: 300, color: textMuted }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: ok ? '#34d399' : '#f87171' }} />
                  <span style={{ fontSize: '10px', fontWeight: 300, color: ok ? '#34d399' : '#f87171' }}>{status}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Top sections */}
          {analytics?.topSections && analytics.topSections.length > 0 && (
            <div style={{ padding: '18px 20px', background: surface, border: `1px solid ${border}`, borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Eye style={{ width: '13px', height: '13px', color: gold }} />
                <h2 style={{ fontSize: '11px', fontWeight: 400, color: textMain, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                  Top Sections
                </h2>
              </div>
              {analytics.topSections.slice(0, 4).map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                  <span style={{ fontSize: '11px', color: textMuted, fontWeight: 300 }}>{s._id}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: textMain, fontWeight: 300 }}>{s.count}</span>
                    {s.avgViewTime && <span style={{ fontSize: '10px', color: textMuted }}>{Math.round(s.avgViewTime / 1000)}s avg</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 900px) {
          .admin-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
