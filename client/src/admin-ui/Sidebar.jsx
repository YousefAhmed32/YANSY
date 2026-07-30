import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, FolderKanban, MessageSquare, CreditCard, UserCircle, LifeBuoy,
  Calendar, Activity, Globe, LogOut, Menu, X, ChevronDown, Settings,
  BarChart3, Users, ClipboardList, Lightbulb, Image, Search, FileText, Shield,
  DollarSign, UserCheck, Bell, Target, LineChart, Bot, Brain, Layers, Video,
  Clapperboard, Star, Clock, PanelLeft, PanelLeftClose, GripVertical, Sparkles, Award,
} from 'lucide-react';
import { TK, RADIUS, SHADOW, MOTION } from './tokens';

// ── Nav data model — smart grouped IA ─────────────────────────────────────────
// Grouped by mental model, not by when the feature shipped: Workspace (personal
// view) → Overview (metrics) → Content → People → Communication → Finance → System.
const buildAdminNav = (t, language) => {
  const ar = language === 'ar';
  const g = {
    workspace: ar ? 'مساحة العمل' : 'Workspace',
    overview:  ar ? 'نظرة عامة'   : 'Overview',
    content:   ar ? 'المحتوى'     : 'Content',
    people:    ar ? 'الأشخاص'     : 'People',
    comms:     ar ? 'التواصل'     : 'Communication',
    finance:   ar ? 'المالية'     : 'Finance',
    system:    ar ? 'النظام'      : 'System',
  };
  return [
    { to: '/app/dashboard',              label: t('dashboard.title'),                             icon: LayoutDashboard, group: g.workspace },
    { to: '/app/projects',               label: t('projects.title'),                              icon: FolderKanban,    group: g.workspace },

    { to: '/app/admin',                  label: ar ? 'نظرة عامة'        : 'Overview',              icon: BarChart3,       group: g.overview },
    { to: '/app/admin/analytics',        label: ar ? 'التحليلات'        : 'Analytics',             icon: LineChart,       group: g.overview },
    { to: '/app/admin/ai',               label: ar ? 'رؤى الذكاء الاصطناعي' : 'AI Insights',        icon: Brain,           group: g.overview },
    { to: '/app/admin/reports',          label: ar ? 'التقارير'         : 'Reports',               icon: Layers,          group: g.overview },

    { to: '/app/admin/portfolio',        label: ar ? 'معرض الأعمال'     : 'Portfolio',             icon: Image,           group: g.content },
    { to: '/app/admin/intro',            label: ar ? 'المقدمة السينمائية' : 'Intro Video',          icon: Video,           group: g.content },
    { to: '/app/admin/homepage-video',   label: ar ? 'فيديو الصفحة الرئيسية' : 'Video Showcase',    icon: Clapperboard,    group: g.content },
    { to: '/app/admin/client-logos',     label: ar ? 'العملاء الموثوقون'  : 'Trusted By',           icon: Award,           group: g.content },
    { to: '/app/admin/start-project',    label: ar ? 'تدفق بدء المشروع' : 'Start Project Flow',   icon: Target,          group: g.content },

    { to: '/app/admin/users',            label: t('users.title'),                                  icon: Users,           group: g.people },
    { to: '/app/admin/crm',              label: 'CRM',                                             icon: Target,          group: g.people },
    { to: '/app/admin/project-requests', label: ar ? 'طلبات المشاريع'   : 'Project Requests',      icon: ClipboardList,   group: g.people },
    { to: '/app/admin/feedback',         label: ar ? 'التقييمات'        : 'Feedback',              icon: Lightbulb,       group: g.people },

    { to: '/app/admin/messages',         label: ar ? 'الرسائل'          : 'Messages',              icon: MessageSquare,   group: g.comms },
    { to: '/app/admin/support',          label: ar ? 'مركز دعم الذكاء الاصطناعي' : 'AI Support Center', icon: Bot,        group: g.comms },

    { to: '/app/admin/financial',        label: ar ? 'المالية'          : 'Financial',             icon: DollarSign,      group: g.finance },
    { to: '/app/invoices',               label: ar ? 'الفواتير'         : 'Invoices',              icon: FileText,        group: g.finance },
    { to: '/app/billing',                label: ar ? 'الفوترة'          : 'Billing',               icon: CreditCard,      group: g.finance },

    { to: '/app/admin/settings',         label: ar ? 'الإعدادات'        : 'Settings',              icon: Settings,        group: g.system },
    { to: '/app/admin/roles',            label: ar ? 'الأدوار'          : 'Roles',                 icon: UserCheck,       group: g.system },
    { to: '/app/admin/health',           label: ar ? 'صحة النظام'       : 'System Health',         icon: Activity,        group: g.system },
    { to: '/app/admin/notifications',    label: ar ? 'البث'             : 'Broadcasts',            icon: Bell,            group: g.system },
    { to: '/app/admin/audit',            label: ar ? 'سجل المراجعة'     : 'Audit Log',             icon: Shield,          group: g.system },
  ];
};

const buildClientNav = (language) => {
  const ar = language === 'ar';
  return [
    { to: '/app/dashboard', label: ar ? 'الرئيسية'   : 'Home',        icon: LayoutDashboard },
    { to: '/app/projects',  label: ar ? 'مشاريعي'    : 'My Projects', icon: FolderKanban },
    { to: '/app/messages',  label: ar ? 'الرسائل'    : 'Messages',    icon: MessageSquare },
    { to: '/app/meetings',  label: ar ? 'الاجتماعات' : 'Meetings',    icon: Calendar },
    { to: '/app/activity',  label: ar ? 'النشاط'     : 'Activity',    icon: Activity },
    { to: '/app/payments',  label: ar ? 'المدفوعات'  : 'Payments',    icon: CreditCard },
    { to: '/app/account',   label: ar ? 'حسابي'      : 'Account',     icon: UserCircle },
    { to: '/app/support',   label: ar ? 'الدعم'      : 'Support',     icon: LifeBuoy },
  ];
};

const NO_SECTION_HIGHLIGHT = new Set(['/app/dashboard', '/app/admin', '/app/billing', '/app/invoices', '/app/payments', '/app/account', '/app/support', '/feedback']);
const MIN_W = 208, MAX_W = 336, DEFAULT_W = 248;
const RECENT_CAP = 4;

const readLS = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; }
};
const writeLS = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

const Sidebar = ({
  isAdmin, user, language, isRTL, toggleLanguage, msgUnread,
  onLogout, onOpenSearch, mobileOpen, onCloseMobile,
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(() => readLS('sidebar-collapsed', false));
  const [floating,  setFloating]  = useState(() => readLS('sidebar-floating', false));
  const [width,     setWidth]     = useState(() => readLS('sidebar-width', DEFAULT_W));
  const [favorites, setFavorites] = useState(() => readLS('sidebar-favorites', []));
  const [recent,    setRecent]    = useState(() => readLS('sidebar-recent', []));
  const [filter,    setFilter]    = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [resizing, setResizing] = useState(false);

  const userMenuRef = useRef(null);
  const navRef = useRef(null);
  const linkRefs = useRef(new Map());

  useEffect(() => writeLS('sidebar-collapsed', collapsed), [collapsed]);
  useEffect(() => writeLS('sidebar-floating', floating), [floating]);
  useEffect(() => writeLS('sidebar-width', width), [width]);

  // Publish layout metrics as CSS custom properties so <Layout>'s content
  // area can react without the two components needing shared state.
  useEffect(() => {
    const w = collapsed ? 68 : width;
    const offset = floating ? w + 20 : w;
    document.documentElement.style.setProperty('--sidebar-w', `${offset}px`);
  }, [collapsed, width, floating]);
  useEffect(() => writeLS('sidebar-favorites', favorites), [favorites]);
  useEffect(() => writeLS('sidebar-recent', recent), [recent]);

  const adminNav  = useMemo(() => buildAdminNav(t, language), [t, language]);
  const clientNav = useMemo(() => buildClientNav(language), [language]);
  const navLinks  = isAdmin ? adminNav : clientNav;
  const byPath    = useMemo(() => new Map(navLinks.map(l => [l.to, l])), [navLinks]);

  // Track recently-visited nav pages (admin only — client nav is small enough not to need it)
  useEffect(() => {
    if (!isAdmin) return;
    const match = byPath.get(location.pathname);
    if (!match) return;
    setRecent(prev => {
      const next = [match.to, ...prev.filter(p => p !== match.to)].slice(0, RECENT_CAP);
      return next.length === prev.length && next.every((v, i) => v === prev[i]) ? prev : next;
    });
  }, [location.pathname, isAdmin, byPath]);

  const isActive = useCallback((p) => location.pathname === p, [location.pathname]);
  const isActiveSection = useCallback((p) => {
    if (NO_SECTION_HIGHLIGHT.has(p)) return false;
    return location.pathname.startsWith(p);
  }, [location.pathname]);

  // Close user menu on outside click
  useEffect(() => {
    const h = (e) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Resize handle drag
  useEffect(() => {
    if (!resizing) return;
    const onMove = (e) => {
      const x = e.clientX;
      const raw = isRTL ? window.innerWidth - x : x;
      setWidth(Math.min(MAX_W, Math.max(MIN_W, raw)));
    };
    const onUp = () => setResizing(false);
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [resizing, isRTL]);

  const toggleFavorite = useCallback((path) => {
    setFavorites(prev => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]);
  }, []);

  // Keyboard roving navigation within the link list
  const handleNavKeyDown = useCallback((e, visiblePaths) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const idx = visiblePaths.indexOf(document.activeElement?.dataset?.navpath);
    let nextIdx;
    if (e.key === 'ArrowDown') nextIdx = idx < 0 ? 0 : Math.min(visiblePaths.length - 1, idx + 1);
    else if (e.key === 'ArrowUp') nextIdx = idx < 0 ? 0 : Math.max(0, idx - 1);
    else if (e.key === 'Home') nextIdx = 0;
    else nextIdx = visiblePaths.length - 1;
    const el = linkRefs.current.get(visiblePaths[nextIdx]);
    el?.focus();
  }, []);

  const filterQ = filter.trim().toLowerCase();
  const isFiltering = filterQ.length > 0;
  const filteredNav = useMemo(() => {
    if (!isFiltering) return navLinks;
    return navLinks.filter(l => l.label.toLowerCase().includes(filterQ));
  }, [navLinks, filterQ, isFiltering]);

  const groups = isAdmin && !isFiltering ? [...new Set(adminNav.map(l => l.group))] : null;
  const favoriteLinks = isAdmin && !isFiltering ? favorites.map(p => byPath.get(p)).filter(Boolean) : [];
  const recentLinks   = isAdmin && !isFiltering ? recent.map(p => byPath.get(p)).filter(Boolean) : [];

  const visiblePaths = useMemo(() => {
    if (isFiltering) return filteredNav.map(l => l.to);
    const ids = [...favoriteLinks.map(l => l.to), ...recentLinks.map(l => l.to)];
    (groups || [null]).forEach(gr => {
      (gr ? adminNav.filter(l => l.group === gr) : navLinks).forEach(l => ids.push(l.to));
    });
    return ids;
  }, [isFiltering, filteredNav, favoriteLinks, recentLinks, groups, adminNav, navLinks]);

  const sidebarW = collapsed ? '68px' : `${width}px`;
  const showFavRecent = isAdmin && !isFiltering && !collapsed && (favoriteLinks.length > 0 || recentLinks.length > 0);

  // ── Nav row ──────────────────────────────────────────────────────────────
  const NavRow = ({ link, isMobileDrawer, dim }) => {
    const [hov, setHov] = useState(false);
    const Icon = link.icon || LayoutDashboard;
    const active = isActive(link.to) || isActiveSection(link.to);
    const pinned = favorites.includes(link.to);
    const showUnread = (link.to === '/app/messages' || link.to === '/app/admin/messages') && msgUnread > 0;

    return (
      <Link
        ref={el => { if (el) linkRefs.current.set(link.to, el); else linkRefs.current.delete(link.to); }}
        data-navpath={link.to}
        to={link.to}
        onClick={() => isMobileDrawer && onCloseMobile()}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onFocus={() => setHov(true)}
        onBlur={() => setHov(false)}
        title={collapsed ? link.label : undefined}
        aria-current={isActive(link.to) ? 'page' : undefined}
        className="au-sidebar-row"
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          margin: '1px 8px', padding: collapsed ? '9px 0' : '7px 8px 7px 10px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          textDecoration: 'none', minHeight: '34px',
          color: active ? TK.accent : (hov ? TK.text : TK.textMuted),
          background: active ? TK.activeBg : (hov ? TK.hoverBg : 'transparent'),
          borderRadius: RADIUS.md,
          transition: `background ${MOTION.fast} ${MOTION.ease}, color ${MOTION.fast} ${MOTION.ease}`,
          position: 'relative', opacity: dim ? 0.55 : 1,
        }}
      >
        {active && (
          <span aria-hidden style={{
            position: 'absolute', [isRTL ? 'right' : 'left']: collapsed ? 0 : '-1px', top: '22%', bottom: '22%',
            width: '2.5px', borderRadius: isRTL ? '2px 0 0 2px' : '0 2px 2px 0',
            background: TK.accent, transition: `all ${MOTION.base} ${MOTION.spring}`,
          }} />
        )}
        <Icon style={{ width: '15.5px', height: '15.5px', flexShrink: 0, opacity: active ? 1 : (hov ? 0.8 : 0.5) }} />
        {!collapsed && (
          <span style={{
            fontSize: '13px', fontWeight: active ? 600 : 400, flex: 1, minWidth: 0,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.4',
          }}>
            {link.label}
          </span>
        )}
        {!collapsed && showUnread && (
          <span style={{ minWidth: 16, height: 16, borderRadius: 8, flexShrink: 0, background: TK.accent, color: '#fff', fontSize: 8.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
            {msgUnread > 9 ? '9+' : msgUnread}
          </span>
        )}
        {!collapsed && isAdmin && (hov || pinned) && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(link.to); }}
            aria-label={pinned ? (isRTL ? 'إزالة من المفضلة' : 'Remove favorite') : (isRTL ? 'إضافة للمفضلة' : 'Add favorite')}
            className="au-icon-btn"
            style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 5, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: pinned ? '#f59e0b' : TK.textLight }}
          >
            <Star style={{ width: 12, height: 12, fill: pinned ? '#f59e0b' : 'none' }} />
          </button>
        )}
      </Link>
    );
  };

  // ── Full sidebar body (desktop + mobile drawer share this) ────────────────
  const renderBody = (isMobileDrawer) => {
    const isCollapsed = collapsed && !isMobileDrawer;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* ── Workspace header ── */}
        <div style={{ padding: isCollapsed ? '10px 0' : '12px 10px 10px', borderBottom: `1px solid ${TK.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
            <button
              onClick={() => navigate(isAdmin ? '/app/admin/settings' : '/app/account')}
              title={isRTL ? 'إعدادات المساحة' : 'Workspace settings'}
              style={{
                display: 'flex', alignItems: 'center', gap: '9px', flex: isCollapsed ? 'none' : 1, minWidth: 0,
                background: 'transparent', border: 'none', cursor: 'pointer', padding: isCollapsed ? 0 : '4px 6px 4px 4px',
                borderRadius: RADIUS.md, textAlign: isRTL ? 'right' : 'left',
              }}
              className="au-icon-btn"
            >
              <div style={{
                width: '30px', height: '30px', borderRadius: RADIUS.md, flexShrink: 0,
                background: TK.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em',
                boxShadow: `0 2px 8px ${TK.accentBd}`,
              }}>Y</div>
              {!isCollapsed && (
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: TK.text, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    YANSY Tech
                  </div>
                  <div style={{ fontSize: '10px', color: TK.textLight, whiteSpace: 'nowrap' }}>
                    {isAdmin ? (isRTL ? 'مساحة الإدارة' : 'Admin Workspace') : (isRTL ? 'مساحة العميل' : 'Client Workspace')}
                  </div>
                </div>
              )}
              {!isCollapsed && <ChevronDown style={{ width: 13, height: 13, color: TK.textLight, flexShrink: 0 }} />}
            </button>

            {!isMobileDrawer && !isCollapsed && (
              <button
                onClick={() => setFloating(v => !v)}
                aria-label={floating ? (isRTL ? 'تثبيت الشريط الجانبي' : 'Dock sidebar') : (isRTL ? 'تعويم الشريط الجانبي' : 'Float sidebar')}
                aria-pressed={floating}
                title={floating ? (isRTL ? 'تثبيت' : 'Dock') : (isRTL ? 'تعويم' : 'Float')}
                className="au-icon-btn"
                style={{ width: 26, height: 26, borderRadius: RADIUS.sm, background: floating ? TK.accentBg : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: floating ? TK.accent : TK.textLight, flexShrink: 0 }}
              >
                <Sparkles style={{ width: 13, height: 13 }} />
              </button>
            )}

            {!isMobileDrawer && (
              <button
                onClick={() => setCollapsed(v => !v)}
                aria-label={collapsed ? (isRTL ? 'توسيع الشريط الجانبي' : 'Expand sidebar') : (isRTL ? 'طي الشريط الجانبي' : 'Collapse sidebar')}
                className="au-icon-btn"
                style={{ width: 26, height: 26, borderRadius: RADIUS.sm, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TK.textLight, flexShrink: 0 }}
              >
                {collapsed ? <PanelLeft style={{ width: 14, height: 14 }} /> : <PanelLeftClose style={{ width: 14, height: 14, transform: isRTL ? 'scaleX(-1)' : 'none' }} />}
              </button>
            )}

            {isMobileDrawer && (
              <button onClick={onCloseMobile} aria-label={isRTL ? 'إغلاق القائمة' : 'Close menu'}
                className="au-icon-btn"
                style={{ width: 28, height: 28, borderRadius: RADIUS.sm, background: 'rgba(0,0,0,0.04)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TK.textMuted, flexShrink: 0 }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            )}
          </div>

          {/* ── In-sidebar search ── */}
          {!isCollapsed && (
            <div className="au-input" style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '7px', background: TK.bgSubtle, border: `1px solid ${TK.border}`, borderRadius: RADIUS.md, padding: '6px 9px' }}>
              <Search style={{ width: 12.5, height: 12.5, color: TK.textLight, flexShrink: 0 }} />
              <input
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder={isRTL ? 'تصفية التنقل…' : 'Filter navigation…'}
                aria-label={isRTL ? 'تصفية التنقل' : 'Filter navigation'}
                style={{ flex: 1, fontSize: '12px', color: TK.text, minWidth: 0, background: 'transparent' }}
              />
              {filter && (
                <button onClick={() => setFilter('')} aria-label={isRTL ? 'مسح' : 'Clear'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TK.textLight, padding: 0, display: 'flex' }}>
                  <X style={{ width: 11, height: 11 }} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav
          ref={navRef}
          role="navigation"
          aria-label={isRTL ? 'التنقل الرئيسي' : 'Main navigation'}
          onKeyDown={e => handleNavKeyDown(e, visiblePaths)}
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}
          className="au-scroll"
        >
          {isFiltering ? (
            <div style={{ padding: '2px 0' }}>
              {filteredNav.length === 0 ? (
                <div style={{ padding: '20px 16px', fontSize: '12px', color: TK.textLight, textAlign: 'center' }}>
                  {isRTL ? 'لا توجد نتائج' : 'No matches'}
                </div>
              ) : filteredNav.map(link => <NavRow key={link.to} link={link} isMobileDrawer={isMobileDrawer} />)}
            </div>
          ) : (
            <>
              {showFavRecent && favoriteLinks.length > 0 && (
                <div style={{ marginBottom: '4px' }}>
                  <div style={{ padding: '6px 16px 4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Star style={{ width: 10, height: 10, color: '#f59e0b' }} />
                    <span style={{ fontSize: '9px', letterSpacing: '0.13em', textTransform: 'uppercase', color: TK.textLight, fontWeight: 600 }}>
                      {isRTL ? 'المفضلة' : 'Favorites'}
                    </span>
                  </div>
                  {favoriteLinks.map(link => <NavRow key={link.to} link={link} isMobileDrawer={isMobileDrawer} />)}
                </div>
              )}
              {showFavRecent && recentLinks.length > 0 && (
                <div style={{ marginBottom: '4px' }}>
                  <div style={{ padding: '6px 16px 4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock style={{ width: 10, height: 10, color: TK.textLight }} />
                    <span style={{ fontSize: '9px', letterSpacing: '0.13em', textTransform: 'uppercase', color: TK.textLight, fontWeight: 600 }}>
                      {isRTL ? 'الأخيرة' : 'Recent'}
                    </span>
                  </div>
                  {recentLinks.map(link => <NavRow key={link.to} link={link} isMobileDrawer={isMobileDrawer} />)}
                </div>
              )}
              {(showFavRecent && (favoriteLinks.length > 0 || recentLinks.length > 0)) && (
                <div style={{ margin: '2px 16px 6px', borderTop: `1px solid ${TK.borderSoft}` }} />
              )}

              {isAdmin && groups ? (
                groups.map(group => {
                  const links = adminNav.filter(l => l.group === group);
                  return (
                    <div key={group} style={{ marginBottom: '4px' }}>
                      {!isCollapsed && (
                        <div style={{ padding: '9px 16px 3px' }}>
                          <span style={{ fontSize: '9px', letterSpacing: '0.13em', textTransform: 'uppercase', color: TK.textLight, fontWeight: 600 }}>{group}</span>
                        </div>
                      )}
                      {isCollapsed && <div style={{ padding: '6px 0 2px', display: 'flex', justifyContent: 'center' }}><div style={{ width: 20, height: 1, background: TK.border }} /></div>}
                      {links.map(link => <NavRow key={link.to} link={link} isMobileDrawer={isMobileDrawer} />)}
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '4px 0' }}>
                  {clientNav.map(link => <NavRow key={link.to} link={link} isMobileDrawer={isMobileDrawer} />)}
                </div>
              )}
            </>
          )}
        </nav>

        {/* ── Footer ── */}
        <div style={{ borderTop: `1px solid ${TK.border}`, padding: '4px 0', flexShrink: 0 }}>
          <button
            onClick={onOpenSearch}
            aria-label={isRTL ? 'بحث شامل' : 'Global search'}
            className="au-icon-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '9px', width: '100%', padding: isCollapsed ? '9px 0' : '8px 16px', justifyContent: isCollapsed ? 'center' : 'flex-start', background: 'transparent', border: 'none', cursor: 'pointer', color: TK.textMuted }}
          >
            <Search style={{ width: 13.5, height: 13.5, opacity: 0.6, flexShrink: 0 }} />
            {!isCollapsed && (
              <>
                <span style={{ flex: 1, fontSize: '12px', textAlign: isRTL ? 'right' : 'left' }}>{isRTL ? 'بحث شامل' : 'Search everywhere'}</span>
                <kbd style={{ padding: '1px 5px', borderRadius: '4px', fontSize: '9px', background: 'rgba(0,0,0,0.04)', border: `1px solid ${TK.border}`, color: TK.textMuted, fontFamily: 'monospace' }}>⌘K</kbd>
              </>
            )}
          </button>

          <button
            onClick={toggleLanguage}
            aria-label={language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
            className="au-icon-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '9px', width: '100%', padding: isCollapsed ? '9px 0' : '8px 16px', justifyContent: isCollapsed ? 'center' : 'flex-start', background: 'transparent', border: 'none', cursor: 'pointer', color: TK.textMuted }}
          >
            <Globe style={{ width: 13.5, height: 13.5, opacity: 0.6, flexShrink: 0 }} />
            {!isCollapsed && <span style={{ fontSize: '12px' }}>{language === 'en' ? 'العربية' : 'English'}</span>}
          </button>

          <div ref={userMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              style={{
                display: 'flex', alignItems: 'center', gap: '9px', padding: isCollapsed ? '9px 0' : '8px 10px',
                margin: isCollapsed ? 0 : '2px 4px 4px', width: isCollapsed ? '100%' : 'calc(100% - 8px)',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                background: userMenuOpen ? TK.hoverBg : 'transparent',
                border: isCollapsed ? 'none' : `1px solid ${userMenuOpen ? TK.border : 'transparent'}`,
                borderRadius: isCollapsed ? 0 : RADIUS.md, cursor: 'pointer', color: TK.textMuted,
                transition: `all ${MOTION.fast} ${MOTION.ease}`,
              }}
              className="au-icon-btn"
            >
              <div style={{ width: 26, height: 26, borderRadius: RADIUS.sm, flexShrink: 0, background: TK.accentBg, border: `1px solid ${userMenuOpen ? TK.accentBd : 'rgba(37,99,235,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: TK.accent }}>
                {user?.fullName?.[0]?.toUpperCase() || '?'}
              </div>
              {!isCollapsed && (
                <>
                  <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left', overflow: 'hidden', minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: TK.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user?.fullName || user?.email || (isRTL ? 'مستخدم' : 'User')}
                    </div>
                    <div style={{ fontSize: 9, color: TK.textLight, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {isAdmin ? (isRTL ? 'مدير' : 'Admin') : (isRTL ? 'عضو' : 'Member')}
                    </div>
                  </div>
                  <ChevronDown style={{ width: 12, height: 12, flexShrink: 0, color: TK.textLight, transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: `transform ${MOTION.base}` }} />
                </>
              )}
            </button>

            {userMenuOpen && (
              <div role="menu" style={{
                position: 'absolute', bottom: 'calc(100% + 6px)',
                [isRTL ? 'right' : 'left']: isCollapsed ? (isRTL ? 'auto' : '80px') : '6px',
                [isRTL ? 'left' : 'right']: isCollapsed ? (isRTL ? '80px' : 'auto') : '6px',
                minWidth: 200, background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: RADIUS.xl,
                boxShadow: SHADOW.lg, overflow: 'hidden', zIndex: 100, animation: `au-popIn 0.18s ${MOTION.spring}`,
              }}>
                <div style={{ padding: '12px 14px 10px', borderBottom: `1px solid ${TK.border}` }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: TK.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.fullName || (isRTL ? 'مستخدم' : 'User')}
                  </div>
                  <div style={{ fontSize: 11, color: TK.textMuted, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                </div>
                <div style={{ padding: 4 }}>
                  <button role="menuitem" onClick={() => { navigate('/app/account'); setUserMenuOpen(false); }}
                    className="au-row"
                    style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 10px', background: 'transparent', border: 'none', cursor: 'pointer', color: TK.textMuted, fontSize: 12.5, textAlign: isRTL ? 'right' : 'left', borderRadius: RADIUS.sm }}
                  >
                    <UserCircle style={{ width: 14, height: 14, opacity: 0.6 }} />
                    {isRTL ? 'حسابي' : 'My Account'}
                  </button>
                </div>
                <div style={{ padding: '4px 4px 6px', borderTop: `1px solid ${TK.border}` }}>
                  <button role="menuitem" onClick={onLogout}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', background: 'transparent', border: 'none', borderRadius: RADIUS.sm, cursor: 'pointer', color: TK.red, fontSize: 12.5 }}
                    onMouseEnter={e => { e.currentTarget.style.background = TK.redBg; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <LogOut style={{ width: 14, height: 14 }} />
                    {isRTL ? 'تسجيل الخروج' : 'Sign Out'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const dockedStyle = {
    position: 'fixed', top: 0, [isRTL ? 'right' : 'left']: 0, bottom: 0,
    borderRight: isRTL ? 'none' : `1px solid ${TK.border}`,
    borderLeft: isRTL ? `1px solid ${TK.border}` : 'none',
    borderRadius: 0, background: TK.surface, boxShadow: 'none',
  };
  const floatingStyle = {
    position: 'fixed', top: 10, bottom: 10, [isRTL ? 'right' : 'left']: 10,
    borderRadius: RADIUS.xl, border: `1px solid ${TK.border}`,
    background: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
    boxShadow: SHADOW.lg,
  };

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside
        role="complementary"
        aria-label={isRTL ? 'التنقل الجانبي' : 'Sidebar navigation'}
        style={{
          width: sidebarW, zIndex: 40, overflow: 'hidden',
          transition: resizing ? 'none' : `width ${MOTION.slow} ${MOTION.ease}, background ${MOTION.base}`,
          ...(floating ? floatingStyle : dockedStyle),
        }}
        className="layout-sidebar"
      >
        {renderBody(false)}
        {!collapsed && (
          <div
            onPointerDown={() => setResizing(true)}
            role="separator"
            aria-orientation="vertical"
            aria-label={isRTL ? 'تغيير حجم الشريط الجانبي' : 'Resize sidebar'}
            style={{
              position: 'absolute', top: 0, bottom: 0, [isRTL ? 'left' : 'right']: 0,
              width: '5px', cursor: 'col-resize', zIndex: 5,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            className="au-resize-handle"
          >
            <GripVertical style={{ width: 10, height: 10, color: TK.border, opacity: 0 }} />
          </div>
        )}
      </aside>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60 }} role="dialog" aria-modal="true" aria-label={isRTL ? 'التنقل' : 'Navigation'}>
          <div onClick={onCloseMobile} style={{ position: 'absolute', inset: 0, background: 'rgba(13,17,23,0.35)', backdropFilter: 'blur(3px)', animation: 'au-fadeIn 0.2s ease' }} />
          <div style={{
            position: 'absolute', top: 0, bottom: 0, [isRTL ? 'right' : 'left']: 0,
            width: 'min(272px, 85vw)', background: TK.surface,
            borderRight: isRTL ? 'none' : `1px solid ${TK.border}`,
            borderLeft: isRTL ? `1px solid ${TK.border}` : 'none',
            animation: `au-slideIn${isRTL ? 'Right' : 'Left'} 0.24s ${MOTION.ease}`,
            overflow: 'hidden',
          }}>
            {renderBody(true)}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
export { DEFAULT_W as SIDEBAR_DEFAULT_WIDTH };
