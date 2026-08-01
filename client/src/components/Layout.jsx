import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { Menu } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import GlobalSearch from './GlobalSearch';
import EmailVerificationBanner from './EmailVerificationBanner';
import WhatsAppButton from './WhatsAppButton';
import { pushNotification } from '../store/notificationSlice';
import { fetchInbox } from '../store/messageSlice';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { TK, Sidebar } from '../admin-ui';

const Layout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user }  = useSelector((s) => s.auth);
  const { language, toggleLanguage, isRTL } = useLanguage();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const { totalUnread: msgUnread } = useSelector(s => s.messages);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => { dispatch(fetchInbox()); }, [dispatch]);

  // Real-time notifications
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_API_URL?.replace('/api', '') ||
      (import.meta.env.DEV
        ? 'http://localhost:5000'
        : 'https://api.yansytech.com');
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
    socketRef.current = socket;
    return () => socket.disconnect();
  }, [user, dispatch]);

  // Close mobile nav on route change happens inside Sidebar via onCloseMobile from link clicks;
  // this also closes it if the browser back/forward button is used.
  useEffect(() => { setMobileOpen(false); }, []);

  // Keyboard search shortcut
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: TK.bg, direction: isRTL ? 'rtl' : 'ltr' }}>

      <Sidebar
        isAdmin={isAdmin}
        user={user}
        language={language}
        isRTL={isRTL}
        toggleLanguage={toggleLanguage}
        msgUnread={msgUnread}
        onLogout={handleLogout}
        onOpenSearch={() => setSearchOpen(true)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* ── Mobile Header ── */}
      <header
        role="banner"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: '52px',
          background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${TK.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', zIndex: 50,
        }}
        className="layout-mobile-header"
      >
        <button onClick={() => setMobileOpen(true)} aria-label={isRTL ? 'فتح التنقل' : 'Open navigation'}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '9px', background: 'rgba(0,0,0,0.04)', border: 'none', cursor: 'pointer', color: TK.textMuted }}
        >
          <Menu style={{ width: '18px', height: '18px' }} />
        </button>

        <Link to="/app/dashboard" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.06em', color: TK.text }}>YANSY</span>
        </Link>

        <button onClick={() => setMobileOpen(true)} aria-label={isRTL ? 'قائمة المستخدم' : 'User menu'}
          style={{ width: '34px', height: '34px', borderRadius: '50%', background: TK.accentBg, border: `1px solid ${TK.accentBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: TK.accent }}
        >
          {user?.fullName?.[0]?.toUpperCase() || '?'}
        </button>
      </header>

      {/* ── Main Content ── */}
      <main role="main" style={{ flex: 1, minHeight: '100vh' }} className="layout-main">
        <style>{`
          .layout-sidebar { display: none; }
          .layout-mobile-header { display: flex; }
          .layout-main { padding-top: 52px; margin-left: 0 !important; margin-right: 0 !important; transition: margin ${'0.28s cubic-bezier(0.4,0,0.2,1)'}; }

          @media (min-width: 1024px) {
            .layout-sidebar { display: block; }
            .layout-mobile-header { display: none !important; }
            .layout-main {
              padding-top: 0;
              margin-left: ${isRTL ? '0' : 'var(--sidebar-w, 248px)'} !important;
              margin-right: ${isRTL ? 'var(--sidebar-w, 248px)' : '0'} !important;
            }
          }

          *:focus-visible { outline: 2px solid rgba(37,99,235,0.45); outline-offset: 2px; border-radius: 4px; }
        `}</style>
        <EmailVerificationBanner />
        <Outlet />
      </main>

      {!isAdmin && <WhatsAppButton />}

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

export default Layout;
