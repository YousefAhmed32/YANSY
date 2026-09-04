import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSocket } from '../contexts/SocketContext';
import GlobalSearch from './GlobalSearch';
import EmailVerificationBanner from './EmailVerificationBanner';
import WhatsAppButton from './WhatsAppButton';
import MobileLangToggle from './MobileLangToggle';
import { pushNotification } from '../store/notificationSlice';
import { fetchInbox, pushIncomingMessage } from '../store/messageSlice';
import toast from 'react-hot-toast';
import { TK, Sidebar } from '../admin-ui';

const Layout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user }  = useSelector((s) => s.auth);
  const { language, toggleLanguage, isRTL } = useLanguage();
  const { socket } = useSocket();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const { totalUnread: msgUnread } = useSelector(s => s.messages);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => { dispatch(fetchInbox()); }, [dispatch]);

  // Real-time notifications + inbox-level message events — shared socket
  // (see contexts/SocketContext.jsx). This is the one listener for events
  // that matter app-wide regardless of which page is open; the messaging
  // pages themselves add their own listeners for thread-scoped events
  // (message-received while a thread is open, typing, read receipts).
  useEffect(() => {
    if (!socket) return;

    const onNotification = (notif) => {
      dispatch(pushNotification(notif));
      toast(notif.title || (language === 'ar' ? 'إشعار جديد' : 'New notification'), {
        icon: notif.type === 'success' ? '✓' : notif.type === 'project_update' ? '📁' : notif.type === 'message' ? '💬' : '🔔',
        duration: 4000,
        style: { fontSize: '13px', fontWeight: 400, fontFamily: isRTL ? 'IBM Plex Sans Arabic, system-ui' : 'Inter, system-ui' },
      });
    };
    // Update inbox previews/unread badges immediately, even when the
    // messaging page isn't mounted (e.g. the sidebar unread counter).
    const onMessageReceived = (message) => dispatch(pushIncomingMessage({ message, threadId: message.threadId }));
    // 'customer-message'/'new-thread' (admin_room broadcasts) carry only an
    // id, not the full message — refetching the inbox is simplest and these
    // fire rarely enough (one per customer message) that it's not wasteful.
    const onCustomerMessage = () => dispatch(fetchInbox());
    const onNewThread       = () => dispatch(fetchInbox());
    const onReconnected     = () => dispatch(fetchInbox());

    socket.on('notification', onNotification);
    socket.on('message-received', onMessageReceived);
    socket.on('customer-message', onCustomerMessage);
    socket.on('new-thread', onNewThread);
    socket.on('client-reconnected', onReconnected);
    return () => {
      socket.off('notification', onNotification);
      socket.off('message-received', onMessageReceived);
      socket.off('customer-message', onCustomerMessage);
      socket.off('new-thread', onNewThread);
      socket.off('client-reconnected', onReconnected);
    };
  }, [socket, dispatch, language, isRTL]);

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
    <div className="yansy-app-shell" style={{ display: 'flex', minHeight: '100vh', background: TK.bg, direction: isRTL ? 'rtl' : 'ltr' }}>
      <a href="#yansy-main" className="yansy-skip-link">{isRTL ? 'تخطّي إلى المحتوى' : 'Skip to content'}</a>

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
        <button onClick={() => setMobileOpen(true)} aria-label={isRTL ? `فتح التنقل${msgUnread > 0 ? ' — رسائل غير مقروءة' : ''}` : `Open navigation${msgUnread > 0 ? ' — unread messages' : ''}`}
          style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '9px', background: 'rgba(0,0,0,0.04)', border: 'none', cursor: 'pointer', color: TK.textMuted, flexShrink: 0 }}
        >
          <Menu style={{ width: '18px', height: '18px' }} />
          {/* Unread-message indicator — messages live behind the nav drawer
              on mobile, so the badge lives on the button that opens it
              rather than adding a second competing icon to the header. */}
          {msgUnread > 0 && (
            <span aria-hidden style={{
              position: 'absolute', top: -2, [isRTL ? 'left' : 'right']: -2,
              width: 9, height: 9, borderRadius: '50%',
              background: TK.accent, border: '2px solid #fff',
            }} />
          )}
        </button>

        <Link to="/app/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <img src="/assets/image/logo/logo-2.png" alt="YANSY" style={{ width: 92, height: 30, objectFit: 'contain' }} />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <MobileLangToggle size="sm" />
          <button onClick={() => setMobileOpen(true)} aria-label={isRTL ? 'الحساب' : 'Account'}
            style={{ width: '34px', height: '34px', borderRadius: '50%', background: TK.accentBg, border: `1px solid ${TK.accentBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: TK.accent, flexShrink: 0 }}
          >
            {user?.fullName?.[0]?.toUpperCase() || '?'}
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main id="yansy-main" role="main" style={{ flex: 1, minHeight: '100vh' }} className="layout-main">
        <style>{`
          .layout-sidebar { display: none; }
          .layout-mobile-header { display: flex; }
          /* min-width: 0 overrides the flex-item default of min-width: auto —
             without it, any wide intrinsic content deep inside (an unwrapped
             table cell, a long URL) refuses to let this flex item shrink
             below that content's natural width, forcing the whole page wider
             than the viewport instead of scrolling within e.g. DataTable's
             own overflow-x:auto. */
          .layout-main { min-width: 0; padding-top: 52px; margin-left: 0 !important; margin-right: 0 !important; transition: margin ${'0.28s cubic-bezier(0.4,0,0.2,1)'}; }

          @media (min-width: 1024px) {
            .layout-sidebar { display: block; }
            .layout-mobile-header { display: none !important; }
            .layout-main {
              padding-top: 0;
              margin-left: ${isRTL ? '0' : 'var(--sidebar-w, 248px)'} !important;
              margin-right: ${isRTL ? 'var(--sidebar-w, 248px)' : '0'} !important;
            }
          }

          *:focus-visible { outline: 2px solid rgba(24,24,27,0.5); outline-offset: 2px; border-radius: 4px; }
        `}</style>
        <EmailVerificationBanner />
        <Outlet />
      </main>

      {/* The Messages page already carries its own contextual WhatsApp entry
          points (sidebar footer + chat header) — a second, floating one sits
          directly over the composer at the bottom of the screen and competes
          with the primary in-app reply action. Hide the global shortcut there. */}
      {!isAdmin && !location.pathname.startsWith('/app/messages') && <WhatsAppButton />}

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

export default Layout;
