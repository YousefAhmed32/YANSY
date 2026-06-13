import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { logout } from '../store/authSlice';
import {
  Globe, LogOut, Menu, X, ChevronDown, User, Settings,
  LayoutDashboard, FolderKanban, Headphones,
  BarChart3, Users, ClipboardList, Lightbulb, Image,
  ChevronRight, MessageCircle, Sun, Moon, Search, FileText, Shield, CreditCard,
  Activity, DollarSign, UserCheck, Bell, Target, LineChart, Bot, Brain, Layers,
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import NotificationBell from './NotificationBell';
import GlobalSearch from './GlobalSearch';
import PlanBadge from './PlanBadge';
import EmailVerificationBanner from './EmailVerificationBanner';
import { pushNotification } from '../store/notificationSlice';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const ICONS = {
  '/app/dashboard':                  LayoutDashboard,
  '/app/projects':                   FolderKanban,
  '/app/messages':                   Headphones,
  '/app/invoices':                   FileText,
  '/app/billing':                    CreditCard,
  '/feedback':                       MessageCircle,
  '/app/admin':                      BarChart3,
  '/app/admin/analytics':            LineChart,
  '/app/admin/users':                Users,
  '/app/admin/project-requests':     ClipboardList,
  '/app/admin/feedback':             Lightbulb,
  '/app/admin/portfolio':            Image,
  '/app/admin/ai':                   Brain,
  '/app/admin/audit':                Shield,
  '/app/admin/settings':             Settings,
  '/app/admin/health':               Activity,
  '/app/admin/financial':            DollarSign,
  '/app/admin/roles':                UserCheck,
  '/app/admin/notifications':        Bell,
  '/app/admin/reports':              Layers,
  '/app/admin/crm':                  Target,
  '/app/admin/support':              Bot,
};

const GROUP_LABELS = {
  workspace:  'Workspace',
  analytics:  'Analytics',
  operations: 'Operations',
  finance:    'Finance',
  system:     'System',
};

const Layout = () => {
  const { t }        = useTranslation();
  const dispatch     = useDispatch();
  const navigate     = useNavigate();
  const location     = useLocation();
  const { user }     = useSelector((s) => s.auth);
  const { isDark, toggleTheme } = useTheme();
  const { language, toggleLanguage, isRTL } = useLanguage();

  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar-collapsed') === 'true'; } catch { return false; }
  });
  const [collapsedGroups, setCollapsedGroups] = useState(() => {
    try {
      const s = localStorage.getItem('sidebar-groups');
      return s ? JSON.parse(s) : {};
    } catch { return {}; }
  });
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [hoveredLink,  setHoveredLink]  = useState(null);
  const [searchOpen,   setSearchOpen]   = useState(false);

  const userMenuRef  = useRef(null);
  const overlayRef   = useRef(null);
  const socketRef    = useRef(null);

  useEffect(() => {
    try { localStorage.setItem('sidebar-collapsed', String(collapsed)); } catch {}
  }, [collapsed]);

  useEffect(() => {
    try { localStorage.setItem('sidebar-groups', JSON.stringify(collapsedGroups)); } catch {}
  }, [collapsedGroups]);

  const toggleGroup = useCallback((group) => {
    setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  }, []);

  // Real-time notifications
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const socket = io(socketUrl, { auth: { token }, transports: ['websocket', 'polling'] });
    socket.on('connect', () => { if (user._id) socket.emit('join', user._id); });
    socket.on('notification', (notif) => {
      dispatch(pushNotification(notif));
      toast(notif.title || 'New notification', {
        icon: notif.type === 'success' ? '✓' : notif.type === 'project_update' ? '📁' : notif.type === 'message' ? '💬' : '🔔',
        duration: 4000,
        style: { fontSize: '13px', fontWeight: 300 },
      });
    });
    socketRef.current = socket;
    return () => socket.disconnect();
  }, [user, dispatch]);

  const navLinks = useMemo(() => user?.role === 'ADMIN'
    ? [
        // ── Workspace ──────────────────────────────────────────────
        { to: '/app/dashboard',              label: t('dashboard.title'),           group: 'workspace'  },
        { to: '/app/projects',               label: t('projects.title'),            group: 'workspace'  },
        { to: '/app/messages',               label: t('messages.title'),            group: 'workspace'  },
        // ── Analytics ──────────────────────────────────────────────
        { to: '/app/admin/analytics',        label: 'Analytics',                    group: 'analytics'  },
        { to: '/app/admin/ai',               label: 'AI Insights',                  group: 'analytics'  },
        { to: '/app/admin/reports',          label: 'Reports',                      group: 'analytics'  },
        // ── Operations ─────────────────────────────────────────────
        { to: '/app/admin',                  label: 'Overview',                     group: 'operations' },
        { to: '/app/admin/users',            label: t('users.title'),               group: 'operations' },
        { to: '/app/admin/crm',              label: 'CRM',                          group: 'operations' },
        { to: '/app/admin/project-requests', label: 'Project Requests',             group: 'operations' },
        { to: '/app/admin/feedback',         label: 'Feedback',                     group: 'operations' },
        { to: '/app/admin/portfolio',        label: 'Portfolio',                    group: 'operations' },
        { to: '/app/admin/support',          label: 'AI Center',                    group: 'operations' },
        // ── Finance ────────────────────────────────────────────────
        { to: '/app/admin/financial',        label: 'Financial',                    group: 'finance'    },
        { to: '/app/invoices',               label: 'Invoices',                     group: 'finance'    },
        { to: '/app/billing',                label: 'Billing',                      group: 'finance'    },
        // ── System ─────────────────────────────────────────────────
        { to: '/app/admin/settings',         label: 'Settings',                     group: 'system'     },
        { to: '/app/admin/health',           label: 'System Health',                group: 'system'     },
        { to: '/app/admin/roles',            label: 'Roles',                        group: 'system'     },
        { to: '/app/admin/notifications',    label: 'Broadcasts',                   group: 'system'     },
        { to: '/app/admin/audit',            label: 'Audit Log',                    group: 'system'     },
      ]
    : [
        { to: '/app/dashboard', label: t('dashboard.title'), group: 'workspace' },
        { to: '/app/projects',  label: t('projects.title'),  group: 'workspace' },
        { to: '/app/messages',  label: t('messages.title'),  group: 'workspace' },
        { to: '/app/invoices',  label: 'Invoices',           group: 'workspace' },
        { to: '/app/billing',   label: 'Billing',            group: 'workspace' },
        { to: '/feedback',      label: t('feedback.title'),  group: 'workspace' },
      ], [user?.role, t]);

  const isActive = useCallback((p) => location.pathname === p, [location.pathname]);
  const isActiveSection = useCallback((p) => {
    if (['/app/dashboard', '/app/admin', '/app/billing', '/app/invoices', '/feedback'].includes(p)) return false;
    return location.pathname.startsWith(p);
  }, [location.pathname]);

  const tk = useMemo(() => ({
    bg:            isDark ? '#080806'                : '#f4f4f2',
    sidebar:       isDark ? '#0c0c0a'               : '#ffffff',
    sidebarBorder: isDark ? 'rgba(255,255,255,0.07)': 'rgba(0,0,0,0.08)',
    text:          isDark ? '#f0f0eb'               : '#0a0a0a',
    textMuted:     isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
    textHover:     isDark ? '#ffffff'               : '#0a0a0a',
    activeBg:      isDark ? 'rgba(212,175,55,0.1)'  : 'rgba(212,175,55,0.08)',
    hoverBg:       isDark ? 'rgba(255,255,255,0.05)': 'rgba(0,0,0,0.04)',
    border:        isDark ? 'rgba(255,255,255,0.07)': 'rgba(0,0,0,0.07)',
    groupLabel:    isDark ? 'rgba(255,255,255,0.25)': 'rgba(0,0,0,0.3)',
    gold:          '#d4af37',
    shadow:        isDark
      ? '0 0 0 1px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.6)'
      : '0 0 0 1px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.1)',
  }), [isDark]);

  const sidebarW = collapsed ? '72px' : '280px';

  // Outside click → close user menu
  useEffect(() => {
    const h = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Keyboard: Ctrl+K opens search
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  const toggleCollapse = useCallback(() => setCollapsed(v => !v), []);
  const handleLogout = useCallback(() => { dispatch(logout()); navigate('/login'); }, [dispatch, navigate]);

  const groups = useMemo(() => [...new Set(navLinks.map(l => l.group))], [navLinks]);

  // ── Render sidebar nav (function, not component — avoids remount antipattern)
  const renderSidebarNav = (isMobileDrawer = false) => {
    const isCollapsed = collapsed && !isMobileDrawer;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* Logo */}
        <div style={{
          padding: isCollapsed ? '20px 0' : '20px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          borderBottom: `1px solid ${tk.sidebarBorder}`,
          minHeight: '64px',
          flexShrink: 0,
        }}>
          {!isCollapsed && (
            <Link to="/app/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '1.15rem',
                fontWeight: 200,
                letterSpacing: '0.3em',
                color: tk.text,
                fontFamily: "'Inter',system-ui,sans-serif",
              }}>YANSY</span>
            </Link>
          )}
          {isCollapsed && (
            <Link to="/app/dashboard" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 300, color: tk.gold, letterSpacing: '0.1em' }}>Y</span>
            </Link>
          )}

          {/* Desktop collapse toggle */}
          {!isMobileDrawer && (
            <button
              onClick={toggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '28px', height: '28px', borderRadius: '6px',
                background: 'transparent',
                border: `1px solid ${tk.border}`,
                cursor: 'pointer',
                color: tk.textMuted,
                flexShrink: 0,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = tk.gold; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'; e.currentTarget.style.background = tk.activeBg; }}
              onMouseLeave={e => { e.currentTarget.style.color = tk.textMuted; e.currentTarget.style.borderColor = tk.border; e.currentTarget.style.background = 'transparent'; }}
            >
              <ChevronRight style={{
                width: '14px', height: '14px',
                transform: isRTL
                  ? (collapsed ? 'rotate(180deg)' : 'rotate(0deg)')
                  : (collapsed ? 'rotate(0deg)' : 'rotate(180deg)'),
                transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </button>
          )}

          {/* Mobile close */}
          {isMobileDrawer && (
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '32px', height: '32px', borderRadius: '8px',
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                border: 'none', cursor: 'pointer',
                color: tk.textMuted,
              }}
            >
              <X style={{ width: '15px', height: '15px' }} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav
          role="navigation"
          aria-label="Main navigation"
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}
        >
          {groups.map((group) => {
            const links = navLinks.filter(l => l.group === group);
            const groupOpen = !collapsedGroups[group];
            const hasActive = links.some(l => isActive(l.to) || isActiveSection(l.to));

            return (
              <div key={group} style={{ marginBottom: '2px' }}>
                {/* Group header */}
                {!isCollapsed ? (
                  <button
                    onClick={() => toggleGroup(group)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '14px 14px 5px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {hasActive && collapsedGroups[group] && (
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: tk.gold, flexShrink: 0 }} />
                      )}
                      <span style={{
                        fontSize: '9px',
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: tk.groupLabel,
                        fontWeight: 500,
                      }}>
                        {GROUP_LABELS[group] || group}
                      </span>
                    </div>
                    <ChevronDown style={{
                      width: '10px', height: '10px',
                      color: tk.groupLabel,
                      transform: groupOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                      transition: 'transform 0.2s ease',
                      flexShrink: 0,
                    }} />
                  </button>
                ) : (
                  <div style={{ padding: '10px 0 3px', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '16px', height: '1px', background: tk.sidebarBorder, opacity: 0.6 }} />
                  </div>
                )}

                {/* Group links — hidden when section collapsed (except icon mode) */}
                {(isCollapsed || groupOpen) && links.map((link) => {
                  const Icon   = ICONS[link.to] || LayoutDashboard;
                  const active = isActive(link.to) || isActiveSection(link.to);
                  const hov    = hoveredLink === link.to;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => isMobileDrawer && setMobileOpen(false)}
                      onMouseEnter={() => setHoveredLink(link.to)}
                      onMouseLeave={() => setHoveredLink(null)}
                      title={isCollapsed ? link.label : undefined}
                      aria-current={isActive(link.to) ? 'page' : undefined}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        margin: isCollapsed ? '1px 6px' : '1px 8px',
                        padding: isCollapsed ? '10px 0' : '8px 10px',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        textDecoration: 'none',
                        color: active ? tk.gold : (hov ? tk.textHover : tk.textMuted),
                        background: active ? tk.activeBg : (hov ? tk.hoverBg : 'transparent'),
                        borderRadius: '7px',
                        transition: 'all 0.12s',
                        position: 'relative',
                        minHeight: '34px',
                      }}
                    >
                      {/* Active left indicator */}
                      {active && !isCollapsed && (
                        <span style={{
                          position: 'absolute',
                          [isRTL ? 'right' : 'left']: '-1px', top: '22%', bottom: '22%',
                          width: '2px',
                          borderRadius: isRTL ? '2px 0 0 2px' : '0 2px 2px 0',
                          background: tk.gold,
                        }} />
                      )}
                      <Icon style={{
                        width: '15px', height: '15px', flexShrink: 0,
                        opacity: active ? 1 : (hov ? 0.8 : 0.48),
                        transition: 'opacity 0.12s',
                      }} />
                      {!isCollapsed && (
                        <span style={{
                          fontSize: '13px',
                          fontWeight: active ? 450 : 350,
                          letterSpacing: '0.01em',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: '1.4',
                        }}>
                          {link.label}
                        </span>
                      )}
                      {/* Collapsed active dot */}
                      {isCollapsed && active && (
                        <span style={{
                          position: 'absolute',
                          [isRTL ? 'left' : 'right']: '5px', top: '50%',
                          transform: 'translateY(-50%)',
                          width: '3px', height: '3px',
                          borderRadius: '50%', background: tk.gold,
                        }} />
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div style={{ borderTop: `1px solid ${tk.sidebarBorder}`, padding: '8px 0', flexShrink: 0 }}>

          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            title={isCollapsed ? 'Search (⌘K)' : undefined}
            aria-label="Search"
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              width: '100%',
              margin: '0',
              padding: isCollapsed ? '10px 0' : '9px 16px',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: tk.textMuted, transition: 'color 0.15s',
              borderRadius: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = tk.text; e.currentTarget.style.background = tk.hoverBg; }}
            onMouseLeave={e => { e.currentTarget.style.color = tk.textMuted; e.currentTarget.style.background = 'transparent'; }}
          >
            <Search style={{ width: '15px', height: '15px', opacity: 0.55, flexShrink: 0 }} />
            {!isCollapsed && (
              <>
                <span style={{ flex: 1, fontSize: '12.5px', fontWeight: 350, textAlign: 'left' }}>Search</span>
                <kbd style={{
                  padding: '2px 6px', borderRadius: '5px', fontSize: '9px',
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  border: `1px solid ${tk.border}`,
                  color: tk.textMuted, fontFamily: 'monospace',
                }}>⌘K</kbd>
              </>
            )}
          </button>

          {/* Plan badge */}
          <PlanBadge collapsed={isCollapsed} />

          {/* Notifications bell */}
          <NotificationBell collapsed={isCollapsed} />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={isCollapsed ? (isDark ? 'Light mode' : 'Dark mode') : undefined}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              width: '100%',
              padding: isCollapsed ? '10px 0' : '9px 16px',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: tk.textMuted, transition: 'color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = tk.text; e.currentTarget.style.background = tk.hoverBg; }}
            onMouseLeave={e => { e.currentTarget.style.color = tk.textMuted; e.currentTarget.style.background = 'transparent'; }}
          >
            {isDark
              ? <Sun  style={{ width: '15px', height: '15px', opacity: 0.55, flexShrink: 0 }} />
              : <Moon style={{ width: '15px', height: '15px', opacity: 0.55, flexShrink: 0 }} />
            }
            {!isCollapsed && (
              <span style={{ fontSize: '12.5px', fontWeight: 350 }}>
                {isDark ? 'Light mode' : 'Dark mode'}
              </span>
            )}
          </button>

          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            title={isCollapsed ? (language === 'en' ? 'العربية' : 'English') : undefined}
            aria-label="Toggle language"
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              width: '100%',
              padding: isCollapsed ? '10px 0' : '9px 16px',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: tk.textMuted, transition: 'color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = tk.text; e.currentTarget.style.background = tk.hoverBg; }}
            onMouseLeave={e => { e.currentTarget.style.color = tk.textMuted; e.currentTarget.style.background = 'transparent'; }}
          >
            <Globe style={{ width: '15px', height: '15px', opacity: 0.55, flexShrink: 0 }} />
            {!isCollapsed && (
              <span style={{ fontSize: '12.5px', fontWeight: 350 }}>
                {language === 'en' ? 'العربية' : 'English'}
              </span>
            )}
          </button>

          {/* User menu */}
          <div ref={isMobileDrawer ? null : userMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%',
                padding: isCollapsed ? '10px 0' : '10px 12px',
                margin: isCollapsed ? '0' : '4px 4px 0',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                background: userMenuOpen
                  ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)')
                  : 'transparent',
                border: isCollapsed ? 'none' : `1px solid ${userMenuOpen ? tk.border : 'transparent'}`,
                borderRadius: isCollapsed ? 0 : '10px',
                cursor: 'pointer',
                color: userMenuOpen ? tk.text : tk.textMuted,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                if (!userMenuOpen) {
                  e.currentTarget.style.color = tk.text;
                  e.currentTarget.style.background = tk.hoverBg;
                  if (!isCollapsed) e.currentTarget.style.borderColor = tk.border;
                }
              }}
              onMouseLeave={e => {
                if (!userMenuOpen) {
                  e.currentTarget.style.color = tk.textMuted;
                  e.currentTarget.style.background = 'transparent';
                  if (!isCollapsed) e.currentTarget.style.borderColor = 'transparent';
                }
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.08))',
                border: `1px solid ${userMenuOpen ? 'rgba(212,175,55,0.45)' : 'rgba(212,175,55,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 500, color: tk.gold,
                transition: 'border-color 0.2s',
              }}>
                {user?.fullName?.[0]?.toUpperCase() || '?'}
              </div>
              {!isCollapsed && (
                <>
                  <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left', overflow: 'hidden', minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 400, color: tk.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.3' }}>
                      {user?.fullName || user?.email || 'User'}
                    </div>
                    <div style={{ fontSize: '9px', color: tk.textMuted, letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: '1.4' }}>
                      {user?.role === 'ADMIN' ? 'Admin' : 'Member'}
                    </div>
                  </div>
                  <ChevronDown style={{
                    width: '12px', height: '12px', flexShrink: 0, color: tk.textMuted,
                    transform: userMenuOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                  }} />
                </>
              )}
            </button>

            {/* User dropdown */}
            {userMenuOpen && (
              <div
                role="menu"
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 8px)',
                  left: isRTL ? (isCollapsed ? 'auto' : '8px') : (isCollapsed ? '80px' : '8px'),
                  right: isRTL ? (isCollapsed ? '80px' : '8px') : (isCollapsed ? 'auto' : '8px'),
                  minWidth: '200px',
                  background: tk.sidebar,
                  border: `1px solid ${tk.sidebarBorder}`,
                  borderRadius: '12px',
                  boxShadow: tk.shadow,
                  overflow: 'hidden',
                  zIndex: 100,
                  animation: 'popUp 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                }}>
                <div style={{ padding: '14px 16px 12px', borderBottom: `1px solid ${tk.border}` }}>
                  <div style={{ fontSize: '13px', fontWeight: 400, color: tk.text, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.fullName || 'User'}</div>
                  <div style={{ fontSize: '11px', color: tk.textMuted, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                </div>
                <div style={{ padding: '4px' }}>
                  {[
                    { label: t('common.profile', 'Profile'), icon: User, to: '/app/profile' },
                    { label: t('common.settings', 'Settings'), icon: Settings, to: '/app/settings' },
                  ].map(({ label, icon: Icon, to }) => (
                    <button
                      key={to}
                      role="menuitem"
                      onClick={() => { navigate(to); setUserMenuOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        width: '100%', padding: '9px 12px',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: tk.textMuted, fontSize: '12.5px', fontWeight: 350,
                        textAlign: isRTL ? 'right' : 'left', transition: 'all 0.15s',
                        borderRadius: '8px',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = tk.hoverBg; e.currentTarget.style.color = tk.text; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = tk.textMuted; }}
                    >
                      <Icon style={{ width: '14px', height: '14px', opacity: 0.7 }} />
                      {label}
                    </button>
                  ))}
                </div>
                <div style={{ padding: '4px 4px 8px', borderTop: `1px solid ${tk.border}` }}>
                  <button
                    role="menuitem"
                    onClick={handleLogout}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      width: '100%', padding: '9px 12px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '8px', cursor: 'pointer',
                      color: '#f87171', fontSize: '12.5px', fontWeight: 350,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <LogOut style={{ width: '14px', height: '14px' }} />
                    {t('common.logout', 'Sign out')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: tk.bg, direction: isRTL ? 'rtl' : 'ltr' }}>

      {/* Desktop Sidebar */}
      <aside
        role="complementary"
        aria-label="Sidebar navigation"
        style={{
          position: 'fixed',
          top: 0,
          [isRTL ? 'right' : 'left']: 0,
          bottom: 0,
          width: sidebarW,
          background: tk.sidebar,
          borderRight: isRTL ? 'none' : `1px solid ${tk.sidebarBorder}`,
          borderLeft:  isRTL ? `1px solid ${tk.sidebarBorder}` : 'none',
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
          zIndex: 40,
          overflow: 'hidden',
        }}
        className="layout-sidebar"
      >
        {renderSidebarNav(false)}
      </aside>

      {/* Mobile top bar */}
      <header
        role="banner"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: '56px',
          background: isDark ? 'rgba(12,12,10,0.97)' : 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${tk.sidebarBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 50,
        }}
        className="layout-mobile-header"
      >
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', borderRadius: '9px',
            background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
            border: 'none', cursor: 'pointer',
            color: tk.textMuted,
          }}
        >
          <Menu style={{ width: '18px', height: '18px' }} />
        </button>

        <Link to="/app/dashboard" style={{ textDecoration: 'none' }}>
          <span style={{
            fontSize: '1.05rem', fontWeight: 200,
            letterSpacing: '0.3em', color: tk.text,
            fontFamily: "'Inter',system-ui,sans-serif",
          }}>YANSY</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              border: 'none', cursor: 'pointer',
              color: tk.textMuted,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {isDark
              ? <Sun  style={{ width: '15px', height: '15px' }} />
              : <Moon style={{ width: '15px', height: '15px' }} />
            }
          </button>
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'linear-gradient(135deg,rgba(212,175,55,0.2),rgba(212,175,55,0.06))',
              border: `1px solid rgba(212,175,55,0.25)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '13px', fontWeight: 500, color: tk.gold,
              fontFamily: "'Inter',system-ui,sans-serif",
            }}
          >
            {user?.fullName?.[0]?.toUpperCase() || '?'}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60 }} role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div
            ref={overlayRef}
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(3px)',
              animation: 'fadeIn 0.2s ease',
            }}
          />
          <div style={{
            position: 'absolute',
            top: 0, bottom: 0,
            [isRTL ? 'right' : 'left']: 0,
            width: 'min(280px, 85vw)',
            background: tk.sidebar,
            borderRight: isRTL ? 'none' : `1px solid ${tk.sidebarBorder}`,
            borderLeft:  isRTL ? `1px solid ${tk.sidebarBorder}` : 'none',
            animation: `slideIn${isRTL ? 'Right' : 'Left'} 0.28s cubic-bezier(0.4,0,0.2,1)`,
            overflow: 'hidden',
          }}>
            {renderSidebarNav(true)}
          </div>
        </div>
      )}

      {/* Main content */}
      <main
        role="main"
        style={{
          flex: 1,
          marginLeft: isRTL ? 0 : `var(--sidebar-w, ${sidebarW})`,
          marginRight: isRTL ? `var(--sidebar-w, ${sidebarW})` : 0,
          minHeight: '100vh',
          transition: 'margin 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
        className="layout-main"
      >
        <style>{`
          :root { --sidebar-w: ${sidebarW}; }

          .layout-sidebar { display: none; }
          .layout-mobile-header { display: flex; }
          .layout-main { padding-top: 56px; margin-left: 0 !important; margin-right: 0 !important; }

          @media (min-width: 1024px) {
            .layout-sidebar { display: block; }
            .layout-mobile-header { display: none !important; }
            .layout-main {
              padding-top: 0;
              margin-left: ${isRTL ? '0' : sidebarW} !important;
              margin-right: ${isRTL ? sidebarW : '0'} !important;
            }
          }

          @keyframes slideInLeft  { from { transform: translateX(-100%); } to { transform: translateX(0); } }
          @keyframes slideInRight { from { transform: translateX(100%);  } to { transform: translateX(0); } }
          @keyframes fadeIn       { from { opacity: 0; } to { opacity: 1; } }
          @keyframes popUp        { from { opacity: 0; transform: translateY(6px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }

          nav::-webkit-scrollbar       { width: 3px; }
          nav::-webkit-scrollbar-track { background: transparent; }
          nav::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.15); border-radius: 2px; }

          *:focus-visible {
            outline: 2px solid rgba(212,175,55,0.6);
            outline-offset: 2px;
            border-radius: 4px;
          }
        `}</style>
        <EmailVerificationBanner />
        <Outlet />
      </main>

      {/* Global Search */}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

export default Layout;
