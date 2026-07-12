import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Check, CheckCheck, FolderKanban, MessageSquare, Star,
  AlertTriangle, Info, Shield, CreditCard, Zap, X, Activity,
} from 'lucide-react';
import { fetchNotifications, markNotificationRead, markAllRead, pushNotification } from '../store/notificationSlice';
import { timeAgo } from '../utils/time';
import { io } from 'socket.io-client';
import { useLanguage } from '../contexts/LanguageContext';

const TYPE_CONFIG = {
  project_update:       { icon: FolderKanban,  color: '#3B82F6' },
  project_completed:    { icon: FolderKanban,  color: '#10B981' },
  milestone:            { icon: Zap,            color: '#F59E0B' },
  message:              { icon: MessageSquare,  color: '#2563EB' },
  admin_reply:          { icon: MessageSquare,  color: '#2563EB' },
  customer_reply:       { icon: MessageSquare,  color: '#8B5CF6' },
  mention:              { icon: MessageSquare,  color: '#EC4899' },
  invoice_generated:    { icon: CreditCard,     color: '#F59E0B' },
  invoice_paid:         { icon: CreditCard,     color: '#10B981' },
  subscription_changed: { icon: Activity,       color: '#8B5CF6' },
  security_alert:       { icon: Shield,         color: '#EF4444' },
  login_detected:       { icon: Shield,         color: '#F59E0B' },
  password_changed:     { icon: Shield,         color: '#10B981' },
  plan_updated:         { icon: Zap,            color: '#8B5CF6' },
  feedback:             { icon: Star,           color: '#F59E0B' },
  alert:                { icon: AlertTriangle,  color: '#EF4444' },
  info:                 { icon: Info,           color: '#6B7280' },
  success:              { icon: Check,          color: '#10B981' },
  system:               { icon: Info,           color: '#6B7280' },
};

const PRIORITY_COLORS = { urgent: '#EF4444', high: '#F59E0B', medium: null, low: null };
const getTypeConfig   = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.info;

const getTimeGroup = (dateStr, language) => {
  if (!dateStr) return language === 'ar' ? 'قبل ذلك' : 'Earlier';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (diff === 0) return language === 'ar' ? 'اليوم' : 'Today';
  if (diff === 1) return language === 'ar' ? 'أمس' : 'Yesterday';
  return language === 'ar' ? 'قبل ذلك' : 'Earlier';
};

const groupNotifications = (items, language) => {
  // First group by time period
  const byTime = {};
  const timeOrder = [];
  for (const n of items) {
    const grp = getTimeGroup(n.createdAt, language);
    if (!byTime[grp]) { byTime[grp] = []; timeOrder.push(grp); }
    byTime[grp].push(n);
  }
  return { byTime, timeOrder: [...new Set(timeOrder)] };
};

let globalSocketRef = null;

const NotificationBell = ({ collapsed = false }) => {
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const { language, isRTL } = useLanguage();
  const { user }    = useSelector(s => s.auth);
  const { items: notifications, unreadCount } = useSelector(s => s.notifications);

  const [open, setOpen] = useState(false);
  const panelRef   = useRef(null);
  const triggerRef = useRef(null);

  const font = isRTL
    ? 'IBM Plex Sans Arabic, system-ui, sans-serif'
    : 'Inter, system-ui, sans-serif';

  // ── Fetch + real-time ─────────────────────────────────────────────────────
  useEffect(() => { dispatch(fetchNotifications()); }, [dispatch]);

  useEffect(() => {
    if (!user?._id) return;
    const token     = localStorage.getItem('token');
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    if (globalSocketRef) return;
    globalSocketRef = io(socketUrl, { auth: { token }, transports: ['websocket'] });
    globalSocketRef.on('connect', () => { globalSocketRef.emit('join', user._id); });
    globalSocketRef.on('notification', (n) => { dispatch(pushNotification(n)); });
  }, [user?._id, dispatch]);

  // ── Outside click ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (
        panelRef.current   && !panelRef.current.contains(e.target) &&
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
      if (notif.link.startsWith('/')) navigate(notif.link);
      else window.open(notif.link, '_blank', 'noopener');
    }
  };

  const { byTime, timeOrder } = groupNotifications(notifications, language);

  const labelMap = {
    bell:     language === 'ar' ? 'الإشعارات' : 'Notifications',
    markAll:  language === 'ar' ? 'تحديد الكل مقروء' : 'Mark all read',
    empty:    language === 'ar' ? 'لا إشعارات بعد' : 'No notifications yet',
    emptyDesc: language === 'ar' ? 'التحديثات والرسائل ستظهر هنا.' : 'Updates, messages, and important events will appear here.',
    new:      language === 'ar' ? 'جديد' : 'new',
    total:    language === 'ar' ? 'إجمالي' : 'total',
    unread:   language === 'ar' ? 'غير مقروء' : 'unread',
  };

  return (
    <div style={{ position: 'relative', direction: isRTL ? 'rtl' : 'ltr', fontFamily: font }}>
      <button
        ref={triggerRef}
        onClick={() => setOpen(v => !v)}
        aria-label={labelMap.bell}
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: 9,
          width: '100%', padding: collapsed ? '9px 0' : '8px 14px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          background: open ? 'rgba(0,0,0,0.04)' : 'transparent',
          border: 'none', cursor: 'pointer',
          color: open ? '#0D1117' : '#6B7280', transition: 'all 0.2s',
          position: 'relative', fontFamily: font,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#0D1117'; e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = open ? '#0D1117' : '#6B7280'; e.currentTarget.style.background = open ? 'rgba(0,0,0,0.04)' : 'transparent'; }}
        title={collapsed ? labelMap.bell : undefined}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Bell style={{ width: 14, height: 14, opacity: 0.6 }} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -5,
              [isRTL ? 'left' : 'right']: -5,
              minWidth: 14, height: 14, borderRadius: 7,
              background: '#2563EB', color: '#FFF',
              fontSize: 8, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 3px', lineHeight: 1,
              boxShadow: '0 0 0 2px #FFFFFF',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        {!collapsed && (
          <span style={{ fontSize: 12.5, fontWeight: 400, flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
            {labelMap.bell}
          </span>
        )}
        {!collapsed && unreadCount > 0 && (
          <span style={{
            minWidth: 18, height: 18, borderRadius: 9,
            background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)',
            color: '#2563EB', fontSize: 9, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            [isRTL ? (collapsed ? 'right' : 'right') : (collapsed ? 'left' : 'left')]: collapsed ? (isRTL ? 'auto' : '80px') : '8px',
            [isRTL ? 'left' : 'right']: isRTL && collapsed ? '80px' : isRTL ? '8px' : 'auto',
            width: collapsed ? 340 : 'auto',
            minWidth: 320,
            background: '#FFFFFF', border: '1px solid #E8EBF0',
            borderRadius: 14,
            boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
            zIndex: 200, overflow: 'hidden',
            animation: 'notifSlide 0.2s cubic-bezier(0.16,1,0.3,1)',
            direction: isRTL ? 'rtl' : 'ltr', fontFamily: font,
          }}
        >
          <style>{`@keyframes notifSlide { from { opacity:0; transform:translateY(8px) scale(0.98); } to { opacity:1; transform:none; } }`}</style>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px 12px', borderBottom: '1px solid #E8EBF0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#0D1117' }}>{labelMap.bell}</span>
              {unreadCount > 0 && (
                <span style={{
                  padding: '2px 7px', borderRadius: 10,
                  background: 'rgba(37,99,235,0.1)', color: '#2563EB',
                  fontSize: 9, fontWeight: 600,
                }}>
                  {unreadCount} {labelMap.new}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {unreadCount > 0 && (
                <button
                  onClick={() => dispatch(markAllRead())}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 8px', background: 'transparent',
                    border: '1px solid #E8EBF0', borderRadius: 6,
                    color: '#6B7280', fontSize: 9, fontWeight: 500,
                    cursor: 'pointer', transition: 'all 0.15s', fontFamily: font,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.color = '#2563EB'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8EBF0'; e.currentTarget.style.color = '#6B7280'; }}
                >
                  <CheckCheck style={{ width: 10, height: 10 }} />
                  {labelMap.markAll}
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: 'transparent', border: '1px solid #E8EBF0',
                  cursor: 'pointer', color: '#9CA3AF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#0D1117'; e.currentTarget.style.borderColor = '#C9CDD6'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = '#E8EBF0'; }}
                aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
              >
                <X style={{ width: 11, height: 11 }} />
              </button>
            </div>
          </div>

          {/* List grouped by time */}
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '44px 24px', textAlign: 'center' }}>
                <Bell style={{ width: 30, height: 30, margin: '0 auto 12px', opacity: 0.15, color: '#6B7280' }} />
                <p style={{ fontSize: 12, fontWeight: 500, color: '#6B7280', margin: '0 0 4px', fontFamily: font }}>
                  {labelMap.empty}
                </p>
                <p style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.5, margin: 0, fontFamily: font }}>
                  {labelMap.emptyDesc}
                </p>
              </div>
            ) : timeOrder.map(group => (
              <div key={group}>
                {/* Group header */}
                <div style={{
                  padding: '8px 16px 4px',
                  background: '#F8F9FA',
                  borderTop: '1px solid #F0F2F5',
                  borderBottom: '1px solid #F0F2F5',
                }}>
                  <span style={{
                    fontSize: 9.5, fontWeight: 600, color: '#9CA3AF',
                    textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: font,
                  }}>
                    {group}
                  </span>
                </div>

                {byTime[group].map(notif => {
                  const { icon: Icon, color } = getTypeConfig(notif.type);
                  const priorityRing = PRIORITY_COLORS[notif.priority];
                  const isClickable  = !!notif.link;

                  return (
                    <div
                      key={notif._id}
                      onClick={() => isClickable && handleNotifClick(notif)}
                      style={{
                        display: 'flex', gap: 12, padding: '12px 16px',
                        background: notif.read ? 'transparent' : '#F8FAFF',
                        borderBottom: '1px solid #F0F2F5',
                        cursor: isClickable ? 'pointer' : 'default',
                        transition: 'background 0.15s', position: 'relative',
                        borderLeft: !isRTL ? (priorityRing ? `3px solid ${priorityRing}` : '3px solid transparent') : 'none',
                        borderRight: isRTL ? (priorityRing ? `3px solid ${priorityRing}` : '3px solid transparent') : 'none',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#F6F7F9'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = notif.read ? 'transparent' : '#F8FAFF'; }}
                    >
                      {/* Unread dot */}
                      {!notif.read && (
                        <div style={{
                          position: 'absolute',
                          [isRTL ? 'right' : 'left']: priorityRing ? (isRTL ? 9 : 9) : 6,
                          top: '50%', transform: 'translateY(-50%)',
                          width: 4, height: 4, borderRadius: '50%', background: '#2563EB',
                        }} />
                      )}

                      <div style={{
                        width: 34, height: 34, borderRadius: 9,
                        background: `${color}15`, border: `1px solid ${color}25`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Icon style={{ width: 15, height: 15, color }} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12, fontWeight: notif.read ? 400 : 600,
                          color: notif.read ? '#6B7280' : '#0D1117',
                          marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          fontFamily: font,
                        }}>
                          {notif.title}
                        </div>
                        <p style={{
                          fontSize: 11, color: '#6B7280', fontWeight: 400, lineHeight: 1.5, margin: 0,
                          overflow: 'hidden', display: '-webkit-box',
                          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontFamily: font,
                        }}>
                          {notif.message}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <span style={{ fontSize: 10, color: '#9CA3AF', fontFamily: font }}>
                            {timeAgo(notif.createdAt)}
                          </span>
                          {notif.priority === 'urgent' && (
                            <span style={{ fontSize: 8, color: '#EF4444', background: 'rgba(239,68,68,0.08)', padding: '1px 5px', borderRadius: 4, fontWeight: 600, fontFamily: font }}>
                              {language === 'ar' ? 'عاجل' : 'URGENT'}
                            </span>
                          )}
                          {notif.priority === 'high' && (
                            <span style={{ fontSize: 8, color: '#F59E0B', background: 'rgba(245,158,11,0.08)', padding: '1px 5px', borderRadius: 4, fontWeight: 500, fontFamily: font }}>
                              {language === 'ar' ? 'مهم' : 'HIGH'}
                            </span>
                          )}
                        </div>
                      </div>

                      {!notif.read && !notif.local && (
                        <button
                          onClick={e => handleMarkRead(notif._id, e)}
                          style={{
                            width: 24, height: 24, borderRadius: 6,
                            background: 'transparent', border: '1px solid #E8EBF0',
                            cursor: 'pointer', color: '#9CA3AF', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s', alignSelf: 'center',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#2563EB'; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.35)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = '#E8EBF0'; }}
                          title={language === 'ar' ? 'تحديد كمقروء' : 'Mark as read'}
                        >
                          <Check style={{ width: 10, height: 10 }} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid #E8EBF0', textAlign: 'center' }}>
              <span style={{ fontSize: 10, color: '#9CA3AF', letterSpacing: '0.08em', fontFamily: font }}>
                {notifications.length} {labelMap.total} · {unreadCount} {labelMap.unread}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
