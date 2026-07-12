import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { logout } from '../store/authSlice';
import {
  LayoutDashboard, FolderKanban, MessageSquare,
  CreditCard, UserCircle, LifeBuoy, Calendar, Activity,
  Globe, LogOut, Menu, X, ChevronDown, User, Settings,
  // Admin icons
  BarChart3, Users, ClipboardList, Lightbulb, Image,
  Search, FileText, Shield, DollarSign,
  UserCheck, Bell, Target, LineChart, Bot, Brain, Layers,
  ChevronRight, MessageCircle,
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import NotificationBell from './NotificationBell';
import GlobalSearch from './GlobalSearch';
import PlanBadge from './PlanBadge';
import EmailVerificationBanner from './EmailVerificationBanner';
import WhatsAppButton from './WhatsAppButton';
import { pushNotification } from '../store/notificationSlice';
import { fetchInbox } from '../store/messageSlice';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

// ── Design tokens ─────────────────────────────────────────────────────────────
const TK = {
  bg:        '#F6F7F9',
  sidebar:   '#FFFFFF',
  border:    '#E8EBF0',
  text:      '#0D1117',
  textMuted: '#6B7280',
  activeBg:  'rgba(37,99,235,0.06)',
  activeBar: '#2563EB',
  hoverBg:   'rgba(0,0,0,0.03)',
  accent:    '#2563EB',
};

// ── Admin icon map ────────────────────────────────────────────────────────────
const ADMIN_ICONS = {
  '/app/dashboard':                  LayoutDashboard,
  '/app/projects':                   FolderKanban,
  '/app/messages':                   MessageSquare,
  '/app/admin/messages':             MessageSquare,
  '/app/payments':                   CreditCard,
  '/app/account':                    UserCircle,
  '/app/support':                    LifeBuoy,
  '/app/meetings':                   Calendar,
  '/app/activity':                   Activity,
  '/app/invoices':                   FileText,
  '/app/billing':                    CreditCard,
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

const Layout = () => {
  const { t }          = useTranslation();
  const dispatch       = useDispatch();
  const navigate       = useNavigate();
  const location       = useLocation();
  const { user }       = useSelector((s) => s.auth);
  const { language, toggleLanguage, isRTL } = useLanguage();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const { totalUnread: msgUnread } = useSelector(s => s.messages);

  // Fetch inbox on mount so unread badge is always fresh
  useEffect(() => { dispatch(fetchInbox()); }, [dispatch]);

  const [collapsed,    setCollapsed]    = useState(() => {
    try { return localStorage.getItem('sidebar-collapsed') === 'true'; } catch { return false; }
  });
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [hoveredLink,  setHoveredLink]  = useState(null);

  const userMenuRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem('sidebar-collapsed', String(collapsed)); } catch {}
  }, [collapsed]);

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
      toast(notif.title || (language === 'ar' ? 'إشعار جديد' : 'New notification'), {
        icon: notif.type === 'success' ? '✓' : notif.type === 'project_update' ? '📁' : notif.type === 'message' ? '💬' : '🔔',
        duration: 4000,
        style: { fontSize: '13px', fontWeight: 400, fontFamily: isRTL ? 'IBM Plex Sans Arabic, system-ui' : 'Inter, system-ui' },
      });
    });
    return () => socket.disconnect();
  }, [user, dispatch]);

  // ── Client navigation (8 items, no groups) ────────────────────────────────
  const clientNav = useMemo(() => [
    { to: '/app/dashboard', label: language === 'ar' ? 'الرئيسية'   : 'Home',       icon: LayoutDashboard },
    { to: '/app/projects',  label: language === 'ar' ? 'مشاريعي'    : 'My Projects',icon: FolderKanban },
    { to: '/app/messages',  label: language === 'ar' ? 'الرسائل'    : 'Messages',   icon: MessageSquare },
    { to: '/app/meetings',  label: language === 'ar' ? 'الاجتماعات' : 'Meetings',   icon: Calendar },
    { to: '/app/activity',  label: language === 'ar' ? 'النشاط'     : 'Activity',   icon: Activity },
    { to: '/app/payments',  label: language === 'ar' ? 'المدفوعات'  : 'Payments',   icon: CreditCard },
    { to: '/app/account',   label: language === 'ar' ? 'حسابي'      : 'Account',    icon: UserCircle },
    { to: '/app/support',   label: language === 'ar' ? 'الدعم'      : 'Support',    icon: LifeBuoy },
  ], [language]);

  // ── Admin navigation (grouped) ────────────────────────────────────────────
  const adminNav = useMemo(() => [
    // Workspace group
    { to: '/app/dashboard',              label: t('dashboard.title'),  group: language === 'ar' ? 'مساحة العمل' : 'Workspace' },
    { to: '/app/projects',               label: t('projects.title'),   group: language === 'ar' ? 'مساحة العمل' : 'Workspace' },
    { to: '/app/admin/messages',         label: language === 'ar' ? 'الرسائل' : 'Messages', group: language === 'ar' ? 'مساحة العمل' : 'Workspace' },
    // Analytics group
    { to: '/app/admin/analytics',        label: language === 'ar' ? 'التحليلات'    : 'Analytics',      group: language === 'ar' ? 'التحليلات' : 'Analytics' },
    { to: '/app/admin/ai',               label: language === 'ar' ? 'الذكاء الاصطناعي' : 'AI Insights', group: language === 'ar' ? 'التحليلات' : 'Analytics' },
    { to: '/app/admin/reports',          label: language === 'ar' ? 'التقارير'     : 'Reports',        group: language === 'ar' ? 'التحليلات' : 'Analytics' },
    // Operations group
    { to: '/app/admin',                  label: language === 'ar' ? 'نظرة عامة'   : 'Overview',       group: language === 'ar' ? 'العمليات' : 'Operations' },
    { to: '/app/admin/users',            label: t('users.title'),      group: language === 'ar' ? 'العمليات' : 'Operations' },
    { to: '/app/admin/crm',              label: 'CRM',                 group: language === 'ar' ? 'العمليات' : 'Operations' },
    { to: '/app/admin/project-requests', label: language === 'ar' ? 'طلبات المشاريع' : 'Project Requests', group: language === 'ar' ? 'العمليات' : 'Operations' },
    { to: '/app/admin/feedback',         label: language === 'ar' ? 'التقييمات'   : 'Feedback',       group: language === 'ar' ? 'العمليات' : 'Operations' },
    { to: '/app/admin/portfolio',        label: language === 'ar' ? 'معرض الأعمال' : 'Portfolio',     group: language === 'ar' ? 'العمليات' : 'Operations' },
    { to: '/app/admin/support',          label: language === 'ar' ? 'مركز الذكاء' : 'AI Center',      group: language === 'ar' ? 'العمليات' : 'Operations' },
    // Finance group
    { to: '/app/admin/financial',        label: language === 'ar' ? 'المالية'     : 'Financial',      group: language === 'ar' ? 'المالية' : 'Finance' },
    { to: '/app/invoices',               label: language === 'ar' ? 'الفواتير'    : 'Invoices',       group: language === 'ar' ? 'المالية' : 'Finance' },
    { to: '/app/billing',                label: language === 'ar' ? 'الفوترة'     : 'Billing',        group: language === 'ar' ? 'المالية' : 'Finance' },
    // System group
    { to: '/app/admin/settings',         label: language === 'ar' ? 'الإعدادات'   : 'Settings',       group: language === 'ar' ? 'النظام' : 'System' },
    { to: '/app/admin/health',           label: language === 'ar' ? 'صحة النظام'  : 'System Health',  group: language === 'ar' ? 'النظام' : 'System' },
    { to: '/app/admin/roles',            label: language === 'ar' ? 'الأدوار'     : 'Roles',          group: language === 'ar' ? 'النظام' : 'System' },
    { to: '/app/admin/notifications',    label: language === 'ar' ? 'البث'        : 'Broadcasts',     group: language === 'ar' ? 'النظام' : 'System' },
    { to: '/app/admin/audit',            label: language === 'ar' ? 'سجل المراجعة' : 'Audit Log',    group: language === 'ar' ? 'النظام' : 'System' },
  ], [language, t]);

  const navLinks = isAdmin ? adminNav : clientNav;

  const isActive = useCallback((p) => location.pathname === p, [location.pathname]);
  const isActiveSection = useCallback((p) => {
    if (['/app/dashboard', '/app/admin', '/app/billing', '/app/invoices', '/app/payments', '/app/account', '/app/support', '/feedback'].includes(p)) return false;
    return location.pathname.startsWith(p);
  }, [location.pathname]);

  const sidebarW = collapsed ? '68px' : '240px';

  // Close user menu on outside click
  useEffect(() => {
    const h = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Close mobile nav on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Keyboard search shortcut
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  const handleLogout = useCallback(() => {
    dispatch(logout());
    navigate('/login');
  }, [dispatch, navigate]);

  // ── Sidebar renderer ──────────────────────────────────────────────────────
  const renderSidebar = (isMobileDrawer = false) => {
    const isCollapsed = collapsed && !isMobileDrawer;

    // Build group order for admin
    const groups = isAdmin ? [...new Set(adminNav.map(l => l.group))] : null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* ── Logo ── */}
        <div style={{
          padding: isCollapsed ? '0' : '0 16px',
          height: '56px',
          display: 'flex', alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          borderBottom: `1px solid ${TK.border}`,
          flexShrink: 0,
        }}>
          {!isCollapsed && (
            <Link to="/app/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '15px', fontWeight: 800,
                letterSpacing: '0.06em', color: TK.text,
                fontFamily: "'Inter',system-ui,sans-serif",
              }}>YANSY</span>
            </Link>
          )}
          {isCollapsed && (
            <Link to="/app/dashboard" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: TK.accent, letterSpacing: '0.04em' }}>Y</span>
            </Link>
          )}

          {!isMobileDrawer && (
            <button
              onClick={() => setCollapsed(v => !v)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '24px', height: '24px', borderRadius: '6px',
                background: 'transparent', border: `1px solid ${TK.border}`,
                cursor: 'pointer', color: TK.textMuted, transition: 'all 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = TK.accent; e.currentTarget.style.color = TK.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = TK.border; e.currentTarget.style.color = TK.textMuted; }}
            >
              <ChevronRight style={{
                width: '12px', height: '12px',
                transform: isRTL
                  ? (collapsed ? 'rotate(180deg)' : 'rotate(0deg)')
                  : (collapsed ? 'rotate(0deg)' : 'rotate(180deg)'),
                transition: 'transform 0.25s ease',
              }} />
            </button>
          )}

          {isMobileDrawer && (
            <button onClick={() => setMobileOpen(false)} aria-label="Close menu"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '30px', height: '30px', borderRadius: '7px',
                background: 'rgba(0,0,0,0.04)', border: 'none',
                cursor: 'pointer', color: TK.textMuted,
              }}
            >
              <X style={{ width: '15px', height: '15px' }} />
            </button>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav role="navigation" aria-label="Main navigation"
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}
        >
          {isAdmin && groups ? (
            // Admin: grouped navigation
            groups.map(group => {
              const links = adminNav.filter(l => l.group === group);
              return (
                <div key={group} style={{ marginBottom: '4px' }}>
                  {!isCollapsed && (
                    <div style={{ padding: '10px 16px 4px', display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9CA3AF', fontWeight: 600 }}>
                        {group}
                      </span>
                    </div>
                  )}
                  {isCollapsed && (
                    <div style={{ padding: '6px 0 2px', display: 'flex', justifyContent: 'center' }}>
                      <div style={{ width: '20px', height: '1px', background: TK.border }} />
                    </div>
                  )}
                  {links.map(link => renderNavLink(link, isCollapsed, isMobileDrawer))}
                </div>
              );
            })
          ) : (
            // Client: flat navigation, no groups
            <div style={{ padding: '4px 0' }}>
              {clientNav.map(link => renderNavLink(link, isCollapsed, isMobileDrawer))}
            </div>
          )}
        </nav>

        {/* ── Bottom ── */}
        <div style={{ borderTop: `1px solid ${TK.border}`, padding: '4px 0', flexShrink: 0 }}>
          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            style={{
              display: 'flex', alignItems: 'center', gap: '9px',
              width: '100%', padding: isCollapsed ? '10px 0' : '9px 16px',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: TK.textMuted, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = TK.text; e.currentTarget.style.background = TK.hoverBg; }}
            onMouseLeave={e => { e.currentTarget.style.color = TK.textMuted; e.currentTarget.style.background = 'transparent'; }}
          >
            <Search style={{ width: '14px', height: '14px', opacity: 0.6, flexShrink: 0 }} />
            {!isCollapsed && (
              <>
                <span style={{ flex: 1, fontSize: '12.5px', textAlign: isRTL ? 'right' : 'left' }}>
                  {language === 'ar' ? 'بحث' : 'Search'}
                </span>
                <kbd style={{ padding: '1px 5px', borderRadius: '4px', fontSize: '9px', background: 'rgba(0,0,0,0.04)', border: `1px solid ${TK.border}`, color: TK.textMuted, fontFamily: 'monospace' }}>⌘K</kbd>
              </>
            )}
          </button>

          <PlanBadge collapsed={isCollapsed} />
          <NotificationBell collapsed={isCollapsed} />

          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            aria-label={language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
            style={{
              display: 'flex', alignItems: 'center', gap: '9px',
              width: '100%', padding: isCollapsed ? '10px 0' : '9px 16px',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: TK.textMuted, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = TK.text; e.currentTarget.style.background = TK.hoverBg; }}
            onMouseLeave={e => { e.currentTarget.style.color = TK.textMuted; e.currentTarget.style.background = 'transparent'; }}
          >
            <Globe style={{ width: '14px', height: '14px', opacity: 0.6, flexShrink: 0 }} />
            {!isCollapsed && (
              <span style={{ fontSize: '12.5px' }}>
                {language === 'en' ? 'العربية' : 'English'}
              </span>
            )}
          </button>

          {/* User menu */}
          <div ref={userMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              style={{
                display: 'flex', alignItems: 'center', gap: '9px',
                width: '100%',
                padding: isCollapsed ? '10px 0' : '9px 12px',
                margin: isCollapsed ? '0' : '2px 4px 4px',
                width: isCollapsed ? '100%' : 'calc(100% - 8px)',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                background: userMenuOpen ? 'rgba(0,0,0,0.04)' : 'transparent',
                border: isCollapsed ? 'none' : `1px solid ${userMenuOpen ? TK.border : 'transparent'}`,
                borderRadius: isCollapsed ? 0 : '9px',
                cursor: 'pointer', color: TK.textMuted, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!userMenuOpen) { e.currentTarget.style.background = TK.hoverBg; if (!isCollapsed) e.currentTarget.style.borderColor = TK.border; e.currentTarget.style.color = TK.text; } }}
              onMouseLeave={e => { if (!userMenuOpen) { e.currentTarget.style.background = 'transparent'; if (!isCollapsed) e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = TK.textMuted; } }}
            >
              <div style={{
                width: '27px', height: '27px', borderRadius: '7px', flexShrink: 0,
                background: 'rgba(37,99,235,0.08)', border: `1px solid ${userMenuOpen ? 'rgba(37,99,235,0.3)' : 'rgba(37,99,235,0.15)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700, color: TK.accent,
              }}>
                {user?.fullName?.[0]?.toUpperCase() || '?'}
              </div>
              {!isCollapsed && (
                <>
                  <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left', overflow: 'hidden', minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: TK.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.3' }}>
                      {user?.fullName || user?.email || (language === 'ar' ? 'مستخدم' : 'User')}
                    </div>
                    <div style={{ fontSize: '9px', color: TK.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: '1.4' }}>
                      {isAdmin
                        ? (language === 'ar' ? 'مدير' : 'Admin')
                        : (language === 'ar' ? 'عضو' : 'Member')
                      }
                    </div>
                  </div>
                  <ChevronDown style={{
                    width: '12px', height: '12px', flexShrink: 0, color: TK.textMuted,
                    transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s',
                  }} />
                </>
              )}
            </button>

            {userMenuOpen && (
              <div role="menu" style={{
                position: 'absolute',
                bottom: 'calc(100% + 6px)',
                [isRTL ? 'right' : 'left']: isCollapsed ? (isRTL ? 'auto' : '80px') : '6px',
                [isRTL ? 'left' : 'right']: isCollapsed ? (isRTL ? '80px' : 'auto') : '6px',
                minWidth: '200px',
                background: '#FFFFFF',
                border: `1px solid ${TK.border}`,
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                overflow: 'hidden', zIndex: 100,
                animation: 'popUp 0.18s cubic-bezier(0.34,1.56,0.64,1)',
              }}>
                <div style={{ padding: '12px 14px 10px', borderBottom: `1px solid ${TK.border}` }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: TK.text, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.fullName || (language === 'ar' ? 'مستخدم' : 'User')}
                  </div>
                  <div style={{ fontSize: '11px', color: TK.textMuted, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.email}
                  </div>
                </div>
                <div style={{ padding: '4px' }}>
                  {[
                    { label: language === 'ar' ? 'حسابي' : 'My Account', icon: UserCircle, to: '/app/account' },
                  ].map(({ label, icon: Icon, to }) => (
                    <button key={to} role="menuitem"
                      onClick={() => { navigate(to); setUserMenuOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '9px',
                        width: '100%', padding: '8px 10px',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: TK.textMuted, fontSize: '12.5px',
                        textAlign: isRTL ? 'right' : 'left', transition: 'all 0.12s', borderRadius: '7px',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = TK.hoverBg; e.currentTarget.style.color = TK.text; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = TK.textMuted; }}
                    >
                      <Icon style={{ width: '14px', height: '14px', opacity: 0.6 }} />
                      {label}
                    </button>
                  ))}
                </div>
                <div style={{ padding: '4px 4px 6px', borderTop: `1px solid ${TK.border}` }}>
                  <button role="menuitem" onClick={handleLogout}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      width: '100%', padding: '8px 10px',
                      background: 'transparent', border: 'none', borderRadius: '7px',
                      cursor: 'pointer', color: '#ef4444', fontSize: '12.5px', transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <LogOut style={{ width: '14px', height: '14px' }} />
                    {language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderNavLink = (link, isCollapsed, isMobileDrawer) => {
    const Icon   = ADMIN_ICONS[link.to] || link.icon || LayoutDashboard;
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
          display: 'flex', alignItems: 'center', gap: '10px',
          margin: isCollapsed ? '1px 8px' : '1px 8px',
          padding: isCollapsed ? '10px 0' : '8px 10px',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          textDecoration: 'none',
          color: active ? TK.accent : (hov ? TK.text : TK.textMuted),
          background: active ? TK.activeBg : (hov ? TK.hoverBg : 'transparent'),
          borderRadius: '8px', transition: 'all 0.12s',
          position: 'relative', minHeight: '36px',
        }}
      >
        {active && !isCollapsed && (
          <span style={{
            position: 'absolute',
            [isRTL ? 'right' : 'left']: '-1px', top: '20%', bottom: '20%',
            width: '2.5px', borderRadius: isRTL ? '2px 0 0 2px' : '0 2px 2px 0',
            background: TK.accent,
          }} />
        )}
        <Icon style={{
          width: '16px', height: '16px', flexShrink: 0,
          opacity: active ? 1 : (hov ? 0.75 : 0.45),
        }} />
        {!isCollapsed && (
          <span style={{
            fontSize: '13px', fontWeight: active ? 500 : 400,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.4',
            fontFamily: isRTL ? 'IBM Plex Sans Arabic, system-ui' : 'Inter, system-ui',
            flex: 1,
          }}>
            {link.label}
          </span>
        )}
        {/* Unread badge for messages links */}
        {!isCollapsed && (link.to === '/app/messages' || link.to === '/app/admin/messages') && msgUnread > 0 && (
          <span style={{
            minWidth: 17, height: 17, borderRadius: 9, flexShrink: 0,
            background: '#2563EB', color: 'white',
            fontSize: 8.5, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
          }}>
            {msgUnread > 9 ? '9+' : msgUnread}
          </span>
        )}
        {isCollapsed && (link.to === '/app/messages' || link.to === '/app/admin/messages') && msgUnread > 0 && (
          <span style={{
            position: 'absolute', top: 4,
            [isRTL ? 'left' : 'right']: 4,
            width: 8, height: 8, borderRadius: '50%',
            background: '#2563EB', border: '1.5px solid white',
          }} />
        )}
        {isCollapsed && active && (
          <span style={{
            position: 'absolute', [isRTL ? 'left' : 'right']: '4px', top: '50%',
            transform: 'translateY(-50%)',
            width: '3px', height: '3px', borderRadius: '50%', background: TK.accent,
          }} />
        )}
      </Link>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: TK.bg, direction: isRTL ? 'rtl' : 'ltr' }}>

      {/* ── Desktop Sidebar ── */}
      <aside
        role="complementary"
        aria-label="Sidebar navigation"
        style={{
          position: 'fixed', top: 0, [isRTL ? 'right' : 'left']: 0, bottom: 0,
          width: sidebarW, background: TK.sidebar,
          borderRight: isRTL ? 'none' : `1px solid ${TK.border}`,
          borderLeft:  isRTL ? `1px solid ${TK.border}` : 'none',
          transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)', zIndex: 40, overflow: 'hidden',
        }}
        className="layout-sidebar"
      >
        {renderSidebar(false)}
      </aside>

      {/* ── Mobile Header ── */}
      <header
        role="banner"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: '52px',
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${TK.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', zIndex: 50,
        }}
        className="layout-mobile-header"
      >
        <button onClick={() => setMobileOpen(true)} aria-label="Open navigation"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', borderRadius: '9px',
            background: 'rgba(0,0,0,0.04)', border: 'none', cursor: 'pointer', color: TK.textMuted,
          }}
        >
          <Menu style={{ width: '18px', height: '18px' }} />
        </button>

        <Link to="/app/dashboard" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.06em', color: TK.text }}>YANSY</span>
        </Link>

        <button onClick={() => setMobileOpen(true)} aria-label="User menu"
          style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: TK.accent,
          }}
        >
          {user?.fullName?.[0]?.toUpperCase() || '?'}
        </button>
      </header>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60 }} role="dialog" aria-modal="true" aria-label="Navigation">
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.3)',
              backdropFilter: 'blur(3px)',
              animation: 'fadeIn 0.2s ease',
            }}
          />
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            [isRTL ? 'right' : 'left']: 0,
            width: 'min(256px, 85vw)',
            background: TK.sidebar,
            borderRight: isRTL ? 'none' : `1px solid ${TK.border}`,
            borderLeft:  isRTL ? `1px solid ${TK.border}` : 'none',
            animation: `slideIn${isRTL ? 'Right' : 'Left'} 0.24s cubic-bezier(0.4,0,0.2,1)`,
            overflow: 'hidden',
          }}>
            {renderSidebar(true)}
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <main
        role="main"
        style={{
          flex: 1,
          marginLeft: isRTL ? 0 : `var(--sidebar-w, ${sidebarW})`,
          marginRight: isRTL ? `var(--sidebar-w, ${sidebarW})` : 0,
          minHeight: '100vh',
          transition: 'margin 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}
        className="layout-main"
      >
        <style>{`
          :root { --sidebar-w: ${sidebarW}; }

          .layout-sidebar { display: none; }
          .layout-mobile-header { display: flex; }
          .layout-main { padding-top: 52px; margin-left: 0 !important; margin-right: 0 !important; }

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
          nav::-webkit-scrollbar-thumb { background: rgba(37,99,235,0.15); border-radius: 2px; }

          *:focus-visible {
            outline: 2px solid rgba(37,99,235,0.45);
            outline-offset: 2px;
            border-radius: 4px;
          }
        `}</style>
        <EmailVerificationBanner />
        <Outlet />
      </main>

      {/* ── WhatsApp Floating Button (client only) ── */}
      {!isAdmin && <WhatsAppButton />}

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

export default Layout;
