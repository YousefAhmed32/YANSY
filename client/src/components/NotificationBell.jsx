import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Check, CheckCheck, FolderKanban, MessageSquare, Star,
  AlertTriangle, Info, Shield, CreditCard, Zap, X, ExternalLink,
  Activity,
} from 'lucide-react';
import { fetchNotifications, markNotificationRead, markAllRead, pushNotification } from '../store/notificationSlice';
import { useTheme } from '../contexts/ThemeContext';
import { timeAgo } from '../utils/time';
import { io } from 'socket.io-client';

// ── Notification type → icon + color + priority color ────────────────────────
const TYPE_CONFIG = {
  project_update:      { icon: FolderKanban,   color: '#3b82f6' },
  project_completed:   { icon: FolderKanban,   color: '#10b981' },
  milestone:           { icon: Zap,             color: '#f59e0b' },
  message:             { icon: MessageSquare,   color: '#d4af37' },
  admin_reply:         { icon: MessageSquare,   color: '#d4af37' },
  customer_reply:      { icon: MessageSquare,   color: '#8b5cf6' },
  mention:             { icon: MessageSquare,   color: '#ec4899' },
  invoice_generated:   { icon: CreditCard,      color: '#f59e0b' },
  invoice_paid:        { icon: CreditCard,      color: '#10b981' },
  subscription_changed:{ icon: Activity,        color: '#8b5cf6' },
  security_alert:      { icon: Shield,          color: '#ef4444' },
  login_detected:      { icon: Shield,          color: '#f59e0b' },
  password_changed:    { icon: Shield,          color: '#10b981' },
  plan_updated:        { icon: Zap,             color: '#8b5cf6' },
  feedback:            { icon: Star,            color: '#f59e0b' },
  alert:               { icon: AlertTriangle,   color: '#ef4444' },
  info:                { icon: Info,            color: '#6b7280' },
  success:             { icon: Check,           color: '#10b981' },
  system:              { icon: Info,            color: '#6b7280' },
};

const PRIORITY_COLORS = {
  urgent: '#ef4444',
  high:   '#f59e0b',
  medium: null, // default — no ring
  low:    null,
};

const getTypeConfig = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.info;

// Group notifications by groupKey or by type+date
const groupNotifications = (items) => {
  const groups = [];
  const seen = new Set();

  for (const n of items) {
    const key = n.groupKey || n._id;
    if (n.groupKey && seen.has(n.groupKey)) {
      // Add to existing group
      const g = groups.find(g => g.key === n.groupKey);
      if (g) g.items.push(n);
    } else {
      seen.add(key);
      groups.push({ key, items: [n], primary: n });
    }
  }
  return groups;
};

// ── Socket listener for real-time pushes ─────────────────────────────────────
let globalSocketRef = null;

const NotificationBell = ({ collapsed = false }) => {
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const { isDark }  = useTheme();
  const { user }    = useSelector(s => s.auth);
  const { items: notifications, unreadCount, loading } = useSelector(s => s.notifications);

  const [open, setOpen] = useState(false);
  const panelRef   = useRef(null);
  const triggerRef = useRef(null);

  // Fetch on mount
  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  // Real-time socket subscription
  useEffect(() => {
    if (!user?._id) return;
    const token     = localStorage.getItem('token');
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    if (globalSocketRef) return; // already connected

    globalSocketRef = io(socketUrl, { auth: { token }, transports: ['websocket'] });
    globalSocketRef.on('connect', () => {
      globalSocketRef.emit('join', user._id);
    });
    globalSocketRef.on('notification', (n) => {
      dispatch(pushNotification(n));
    });

    return () => {
      // Don't disconnect — shared socket. Clean up only on logout.
    };
  }, [user?._id, dispatch]);

  // Outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkRead = (id, e) => {
    e.stopPropagation();
    dispatch(markNotificationRead(id));
  };

  const handleNotifClick = (notif) => {
    if (!notif.read && !notif.local) dispatch(markNotificationRead(notif._id));
    if (notif.link) {
      setOpen(false);
      // Internal links (start with /app) → navigate, else open new tab
      if (notif.link.startsWith('/')) navigate(notif.link);
      else window.open(notif.link, '_blank', 'noopener');
    }
  };

  // ── Theme ────────────────────────────────────────────────────────────────────
  const gold    = '#d4af37';
  const bg      = isDark ? '#0d0d0b' : '#ffffff';
  const border  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textMain = isDark ? '#f5f5f0' : '#0a0a0a';
  const textMuted = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const hoverBg  = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const shadow   = isDark
    ? '0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,175,55,0.08)'
    : '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)';

  const groups = groupNotifications(notifications);

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell */}
      <button
        ref={triggerRef}
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          width: '100%',
          padding: collapsed ? '10px 0' : '10px 20px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          background: open ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)') : 'transparent',
          border: 'none', cursor: 'pointer',
          color: open ? gold : textMuted, transition: 'all 0.2s',
          position: 'relative',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = textMain; }}
        onMouseLeave={e => { e.currentTarget.style.color = open ? gold : textMuted; }}
        title={collapsed ? 'Notifications' : undefined}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Bell style={{ width: '16px', height: '16px', opacity: open ? 1 : 0.6 }} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: '-5px', right: '-5px',
              minWidth: '14px', height: '14px', borderRadius: '7px',
              background: gold, color: '#000',
              fontSize: '8px', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 3px', lineHeight: 1,
              boxShadow: `0 0 0 2px ${isDark ? '#0d0d0b' : '#ffffff'}`,
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        {!collapsed && (
          <span style={{ fontSize: '12px', fontWeight: 300, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
            Notifications
          </span>
        )}
        {!collapsed && unreadCount > 0 && (
          <span style={{
            marginLeft: 'auto', minWidth: '18px', height: '18px', borderRadius: '9px',
            background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)',
            color: gold, fontSize: '9px', fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: collapsed ? '76px' : '12px',
            right: collapsed ? 'auto' : '12px',
            width: collapsed ? '340px' : 'auto',
            background: bg, border: `1px solid ${border}`,
            borderRadius: '14px', boxShadow: shadow,
            zIndex: 200, overflow: 'hidden',
            animation: 'notifSlideUp 0.2s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <style>{`
            @keyframes notifSlideUp {
              from { opacity:0; transform:translateY(8px) scale(0.98); }
              to   { opacity:1; transform:translateY(0) scale(1); }
            }
          `}</style>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px 12px', borderBottom: `1px solid ${border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 500, color: textMain, letterSpacing: '0.06em' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span style={{
                  padding: '2px 7px', borderRadius: '10px',
                  background: 'rgba(212,175,55,0.15)', color: gold,
                  fontSize: '9px', fontWeight: 500,
                }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {unreadCount > 0 && (
                <button
                  onClick={() => dispatch(markAllRead())}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '4px 8px', background: 'transparent',
                    border: `1px solid ${border}`, borderRadius: '6px',
                    color: textMuted, fontSize: '9px', fontWeight: 300,
                    letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(212,175,55,0.4)'; e.currentTarget.style.color=gold; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor=border; e.currentTarget.style.color=textMuted; }}
                >
                  <CheckCheck style={{ width: '10px', height: '10px' }} />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: '24px', height: '24px', borderRadius: '6px',
                  background: 'transparent', border: `1px solid ${border}`,
                  cursor: 'pointer', color: textMuted,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = textMain; }}
                onMouseLeave={e => { e.currentTarget.style.color = textMuted; }}
              >
                <X style={{ width: '11px', height: '11px' }} />
              </button>
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {groups.length === 0 ? (
              <div style={{ padding: '44px 24px', textAlign: 'center' }}>
                <Bell style={{ width: '30px', height: '30px', margin: '0 auto 12px', opacity: 0.2, color: textMuted }} />
                <p style={{ fontSize: '12px', fontWeight: 300, color: textMuted, letterSpacing: '0.08em', marginBottom: '6px' }}>
                  No notifications yet
                </p>
                <p style={{ fontSize: '10px', color: textMuted, opacity: 0.7, lineHeight: 1.5 }}>
                  Updates, messages, and important events<br />will appear here.
                </p>
              </div>
            ) : groups.map((group) => {
              const notif = group.primary;
              const { icon: Icon, color } = getTypeConfig(notif.type);
              const priorityRing = PRIORITY_COLORS[notif.priority];
              const isGrouped = group.items.length > 1;
              const isClickable = !!notif.link;

              return (
                <div
                  key={group.key}
                  onClick={() => isClickable && handleNotifClick(notif)}
                  style={{
                    display: 'flex', gap: '12px', padding: '12px 16px',
                    background: notif.read ? 'transparent' : (isDark ? 'rgba(212,175,55,0.03)' : 'rgba(212,175,55,0.03)'),
                    borderBottom: `1px solid ${border}`,
                    cursor: isClickable ? 'pointer' : 'default',
                    transition: 'background 0.15s', position: 'relative',
                    borderLeft: priorityRing ? `3px solid ${priorityRing}` : '3px solid transparent',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = hoverBg; }}
                  onMouseLeave={e => { e.currentTarget.style.background = notif.read ? 'transparent' : (isDark ? 'rgba(212,175,55,0.03)' : 'rgba(212,175,55,0.03)'); }}
                >
                  {/* Unread dot */}
                  {!notif.read && (
                    <div style={{
                      position: 'absolute', left: priorityRing ? '9px' : '6px', top: '50%',
                      transform: 'translateY(-50%)', width: '4px', height: '4px',
                      borderRadius: '50%', background: gold,
                    }} />
                  )}

                  {/* Icon */}
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '9px',
                    background: `${color}15`, border: `1px solid ${color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    position: 'relative',
                  }}>
                    <Icon style={{ width: '15px', height: '15px', color }} />
                    {isGrouped && (
                      <span style={{
                        position: 'absolute', top: '-4px', right: '-4px',
                        minWidth: '14px', height: '14px', borderRadius: '7px',
                        background: color, color: '#fff',
                        fontSize: '8px', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 2px',
                      }}>
                        {group.items.length}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '11px', fontWeight: notif.read ? 300 : 500,
                      color: notif.read ? textMuted : textMain,
                      marginBottom: '3px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {notif.title}
                      {isClickable && <ExternalLink style={{ width: '9px', height: '9px', opacity: 0.4, marginLeft: '4px', verticalAlign: 'middle' }} />}
                    </div>
                    <p style={{
                      fontSize: '10px', color: textMuted, fontWeight: 300, lineHeight: 1.5, margin: 0,
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>
                      {isGrouped
                        ? `${group.items.length} notifications — latest: ${notif.message}`
                        : notif.message}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '9px', color: textMuted, letterSpacing: '0.04em' }}>
                        {timeAgo(notif.createdAt)}
                      </span>
                      {notif.priority === 'urgent' && (
                        <span style={{ fontSize: '8px', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                          URGENT
                        </span>
                      )}
                      {notif.priority === 'high' && (
                        <span style={{ fontSize: '8px', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '1px 5px', borderRadius: '4px', fontWeight: 500 }}>
                          HIGH
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mark read */}
                  {!notif.read && !notif.local && (
                    <button
                      onClick={(e) => handleMarkRead(notif._id, e)}
                      style={{
                        width: '24px', height: '24px', borderRadius: '6px',
                        background: 'transparent', border: `1px solid ${border}`,
                        cursor: 'pointer', color: textMuted, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s', alignSelf: 'center',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color=gold; e.currentTarget.style.borderColor='rgba(212,175,55,0.4)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color=textMuted; e.currentTarget.style.borderColor=border; }}
                      title="Mark as read"
                    >
                      <Check style={{ width: '10px', height: '10px' }} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{ padding: '10px 16px', borderTop: `1px solid ${border}`, textAlign: 'center' }}>
              <span style={{ fontSize: '9px', color: textMuted, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                {notifications.length} total · {unreadCount} unread
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
