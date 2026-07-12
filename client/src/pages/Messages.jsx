import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchInbox, fetchThreadMessages, sendMessage,
  createThreadAndMessage, markThreadRead, markThreadReadLocal,
  pushIncomingMessage,
} from '../store/messageSlice';
import {
  MessageSquare, Send, Plus, X, Search, FolderKanban,
  CheckCheck, Check, Paperclip, Smile, Clock, ArrowRight,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// ── Design tokens ─────────────────────────────────────────────────────────────
const TK = {
  bg:        '#F6F7F9',
  surface:   '#FFFFFF',
  border:    '#E7EAF0',
  accent:    '#2563EB',
  accentBg:  '#EFF6FF',
  accentBd:  '#DBEAFE',
  text:      '#111827',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  green:     '#25D366',
  unread:    '#2563EB',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtTime = (d, language) => {
  if (!d) return '';
  try {
    const dt   = new Date(d);
    const now  = new Date();
    const diff = Math.floor((now - dt) / 86400000);
    if (diff === 0) return dt.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    if (diff === 1) return language === 'ar' ? 'أمس' : 'Yesterday';
    if (diff < 7)  return dt.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' });
    return dt.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });
  } catch { return ''; }
};

const fmtMsgTime = (d, language) => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
};

const fmtDateHeader = (d, language) => {
  if (!d) return '';
  try {
    const dt   = new Date(d);
    const now  = new Date();
    const diff = Math.floor((now - dt) / 86400000);
    if (diff === 0) return language === 'ar' ? 'اليوم' : 'Today';
    if (diff === 1) return language === 'ar' ? 'أمس' : 'Yesterday';
    return dt.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  } catch { return ''; }
};

const getDateKey = (d) => {
  if (!d) return '';
  try { return new Date(d).toDateString(); } catch { return ''; }
};

const groupMessagesByDate = (messages) => {
  const groups = [];
  let lastKey  = null;
  for (const msg of messages) {
    const key = getDateKey(msg.createdAt);
    if (key !== lastKey) {
      groups.push({ type: 'date', key, date: msg.createdAt });
      lastKey = key;
    }
    groups.push({ type: 'message', data: msg });
  }
  return groups;
};

const WaIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

// ── Components ────────────────────────────────────────────────────────────────

const Avatar = ({ name, size = 36 }) => {
  const initials = name
    ? name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : 'Y';
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: TK.accentBg, border: `1px solid ${TK.accentBd}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, fontSize: size * 0.33, fontWeight: 700, color: TK.accent,
    }}>
      {initials}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const Messages = () => {
  const { language, isRTL } = useLanguage();
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const {
    threads, inboxLoading, activeThreadId,
    currentThread, messages, loading, sending,
  } = useSelector(s => s.messages);

  const [search,         setSearch]         = useState('');
  const [msgText,        setMsgText]        = useState('');
  const [showNewModal,   setShowNewModal]   = useState(false);
  const [newMsg,         setNewMsg]         = useState('');
  const [creating,       setCreating]       = useState(false);
  const [mobileView,     setMobileView]     = useState('list'); // 'list' | 'chat'
  const [isMobile,       setIsMobile]       = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  // ── Responsive detection ──────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Load inbox ────────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchInbox());
  }, [dispatch]);

  // ── Auto-select first thread ──────────────────────────────────────────────
  useEffect(() => {
    if (!inboxLoading && threads.length > 0 && !activeThreadId) {
      const sorted = [...threads].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      handleSelectThread(sorted[0]);
    }
  }, [inboxLoading, threads]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Textarea auto-resize ──────────────────────────────────────────────────
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [msgText]);

  const activeThread = useMemo(
    () => threads.find(t => t._id === activeThreadId) || currentThread,
    [threads, activeThreadId, currentThread]
  );

  const filteredThreads = useMemo(() => {
    const sorted = [...threads].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter(t =>
      (t.subject || t.projectName || '').toLowerCase().includes(q) ||
      (t.lastMessage || '').toLowerCase().includes(q)
    );
  }, [threads, search]);

  const grouped = useMemo(() => groupMessagesByDate(messages), [messages]);

  // ── Thread selection ──────────────────────────────────────────────────────
  const handleSelectThread = useCallback((thread) => {
    dispatch(fetchThreadMessages(thread._id));
    dispatch(markThreadRead(thread._id));
    dispatch(markThreadReadLocal(thread._id));
    if (isMobile) setMobileView('chat');
  }, [dispatch, isMobile]);

  // ── Send ─────────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!msgText.trim() || !activeThreadId || sending) return;
    const content = msgText.trim();
    setMsgText('');
    await dispatch(sendMessage({ threadId: activeThreadId, content }));
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [dispatch, msgText, activeThreadId, sending]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  // ── Create new conversation ───────────────────────────────────────────────
  const handleCreate = useCallback(async () => {
    if (!newMsg.trim() || creating) return;
    setCreating(true);
    try {
      await dispatch(createThreadAndMessage({ content: newMsg.trim() }));
      setShowNewModal(false);
      setNewMsg('');
      if (isMobile) setMobileView('chat');
    } catch {}
    finally { setCreating(false); }
  }, [dispatch, newMsg, creating, isMobile]);

  const font = isRTL
    ? 'IBM Plex Sans Arabic, system-ui, sans-serif'
    : 'Inter, system-ui, sans-serif';

  // ── Thread List ───────────────────────────────────────────────────────────
  const renderThread = (thread) => {
    const isActive  = activeThreadId === thread._id;
    const unread    = thread.unreadCount > 0;
    const title     = thread.subject || thread.projectName || (language === 'ar' ? 'محادثة' : 'Conversation');
    const preview   = thread.lastMessage || (language === 'ar' ? 'لا رسائل بعد' : 'No messages yet');
    const time      = fmtTime(thread.updatedAt, language);

    return (
      <button
        key={thread._id}
        onClick={() => handleSelectThread(thread)}
        style={{
          display: 'flex', gap: '10px', width: '100%',
          padding: '12px 14px', textAlign: isRTL ? 'right' : 'left',
          background: isActive ? TK.accentBg : 'transparent',
          border: `1px solid ${isActive ? TK.accentBd : 'transparent'}`,
          borderRadius: '10px', margin: '1px 0',
          cursor: 'pointer', transition: 'all 0.12s', fontFamily: font,
        }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = TK.bg; }}
        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.border = '1px solid transparent'; } }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Avatar name={thread.projectName || 'YANSY'} size={36} />
          {thread.projectId && (
            <span style={{
              position: 'absolute', bottom: -2, right: isRTL ? 'auto' : -2, left: isRTL ? -2 : 'auto',
              width: 12, height: 12, borderRadius: '50%',
              background: TK.accent, border: '2px solid white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FolderKanban style={{ width: 7, height: 7, color: 'white' }} />
            </span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 2 }}>
            <span style={{
              fontSize: 13, fontWeight: unread ? 600 : 500,
              color: TK.text, flex: 1, minWidth: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {title}
            </span>
            <span style={{ fontSize: 10.5, color: TK.textLight, flexShrink: 0, marginTop: 1 }}>{time}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
            <span style={{
              fontSize: 12, color: unread ? TK.text : TK.textMuted,
              fontWeight: unread ? 500 : 400,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
            }}>
              {String(preview).slice(0, 55)}{preview.length > 55 ? '…' : ''}
            </span>
            {unread && (
              <span style={{
                minWidth: 18, height: 18, borderRadius: 9,
                background: TK.unread, color: 'white',
                fontSize: 9.5, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', flexShrink: 0,
              }}>
                {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  // ── Message Bubble ────────────────────────────────────────────────────────
  const renderMessage = (msg, idx, items) => {
    const isMe   = msg.sender?._id === user?._id || msg.sender === user?._id;
    const prev   = idx > 0 && items[idx - 1]?.type === 'message' ? items[idx - 1].data : null;
    const next   = idx < items.length - 1 && items[idx + 1]?.type === 'message' ? items[idx + 1].data : null;
    const prevIsMe = prev && (prev.sender?._id === user?._id || prev.sender === user?._id);
    const nextIsMe = next && (next.sender?._id === user?._id || next.sender === user?._id);
    const sameAsPrev = prevIsMe === isMe;
    const sameAsNext = nextIsMe === isMe;

    const br = isMe
      ? (sameAsPrev ? '14px 14px 4px 14px' : '14px 14px 4px 14px')
      : (sameAsPrev ? '4px 14px 14px 14px' : '14px 14px 14px 4px');

    const isLast = !sameAsNext;
    const isFirst = !sameAsPrev;

    return (
      <div key={msg._id || idx} style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMe ? (isRTL ? 'flex-start' : 'flex-end') : (isRTL ? 'flex-end' : 'flex-start'),
        marginBottom: isLast ? 2 : 1,
      }}>
        {/* Sender name for non-me, first in group */}
        {!isMe && isFirst && (
          <div style={{
            fontSize: 10.5, color: TK.textLight, marginBottom: 3,
            paddingLeft: isRTL ? 0 : 4, paddingRight: isRTL ? 4 : 0,
          }}>
            {msg.sender?.fullName || (language === 'ar' ? 'فريق YANSY' : 'YANSY Team')}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <div style={{
            maxWidth: 'min(68%, 520px)',
            padding: '9px 13px',
            borderRadius: br,
            background: isMe ? TK.accent : TK.surface,
            border: isMe ? 'none' : `1px solid ${TK.border}`,
            color: isMe ? '#fff' : TK.text,
            fontSize: 13.5, lineHeight: 1.55, wordBreak: 'break-word',
            boxShadow: isMe ? '0 2px 8px rgba(37,99,235,0.2)' : '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            {msg.content || msg.text || msg.message || ''}
          </div>
        </div>

        {/* Timestamp + status — only for last in group */}
        {isLast && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            marginTop: 3, paddingLeft: isRTL ? 0 : 3, paddingRight: isRTL ? 3 : 0,
          }}>
            <span style={{ fontSize: 10, color: TK.textLight }}>
              {fmtMsgTime(msg.createdAt, language)}
            </span>
            {isMe && (
              <CheckCheck style={{ width: 11, height: 11, color: TK.textLight }} />
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Sidebar (thread list) ─────────────────────────────────────────────────
  const renderSidebar = () => (
    <div style={{
      width: isMobile ? '100%' : 'clamp(240px, 28%, 300px)',
      display: isMobile && mobileView === 'chat' ? 'none' : 'flex',
      flexDirection: 'column',
      background: TK.surface,
      borderRight: isRTL ? 'none' : `1px solid ${TK.border}`,
      borderLeft: isRTL ? `1px solid ${TK.border}` : 'none',
      flexShrink: 0,
      height: '100%',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 14px 12px', borderBottom: `1px solid ${TK.border}`, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <MessageSquare style={{ width: 15, height: 15, color: TK.accent }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: TK.text, fontFamily: font }}>
              {language === 'ar' ? 'المحادثات' : 'Messages'}
            </span>
            {threads.length > 0 && (
              <span style={{
                padding: '1px 7px', borderRadius: 99, fontSize: 10, fontWeight: 600,
                background: TK.accentBg, color: TK.accent, border: `1px solid ${TK.accentBd}`,
              }}>
                {threads.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 10px', borderRadius: 7,
              background: TK.accent, color: 'white',
              border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 500, fontFamily: font,
            }}
          >
            <Plus style={{ width: 13, height: 13 }} />
            {language === 'ar' ? 'جديد' : 'New'}
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search style={{
            position: 'absolute', top: '50%', transform: 'translateY(-50%)',
            [isRTL ? 'right' : 'left']: 10,
            width: 12, height: 12, color: TK.textLight, pointerEvents: 'none',
          }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
            style={{
              width: '100%', padding: isRTL ? '7px 30px 7px 10px' : '7px 10px 7px 30px',
              borderRadius: 8, border: `1px solid ${TK.border}`,
              fontSize: 12.5, fontFamily: font, color: TK.text,
              background: TK.bg, outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.target.style.borderColor = TK.accent; }}
            onBlur={e => { e.target.style.borderColor = TK.border; }}
          />
        </div>
      </div>

      {/* Thread list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        {inboxLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 4px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height: 62, borderRadius: 10, background: TK.bg,
                animation: 'shimmer 1.4s ease-in-out infinite',
              }} />
            ))}
          </div>
        ) : filteredThreads.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: TK.accentBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
            }}>
              <MessageSquare style={{ width: 22, height: 22, color: TK.accent }} />
            </div>
            <p style={{ fontSize: 13.5, fontWeight: 500, color: TK.text, margin: '0 0 5px', fontFamily: font }}>
              {search ? (language === 'ar' ? 'لا نتائج' : 'No results') : (language === 'ar' ? 'لا محادثات بعد' : 'No conversations')}
            </p>
            {!search && (
              <>
                <p style={{ fontSize: 12, color: TK.textMuted, margin: '0 0 14px', lineHeight: 1.5, fontFamily: font }}>
                  {language === 'ar' ? 'راسل فريق YANSY مباشرةً' : 'Message the YANSY team directly'}
                </p>
                <button
                  onClick={() => setShowNewModal(true)}
                  style={{
                    padding: '8px 18px', borderRadius: 8, background: TK.accent,
                    color: 'white', border: 'none', cursor: 'pointer',
                    fontSize: 12.5, fontWeight: 500, fontFamily: font,
                  }}
                >
                  {language === 'ar' ? 'ابدأ محادثة' : 'Start conversation'}
                </button>
              </>
            )}
          </div>
        ) : (
          filteredThreads.map(thread => renderThread(thread))
        )}
      </div>

      {/* WhatsApp CTA */}
      <div style={{ padding: '10px 12px', borderTop: `1px solid ${TK.border}`, flexShrink: 0 }}>
        <a
          href="https://wa.me/201090385390"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 12px', borderRadius: 9,
            background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.18)',
            textDecoration: 'none', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,211,102,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(37,211,102,0.06)'; }}
        >
          <WaIcon />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: TK.text, fontFamily: font }}>
              {language === 'ar' ? 'واتساب — رد فوري' : 'WhatsApp — Instant reply'}
            </div>
            <div style={{ fontSize: 10.5, color: TK.textMuted, fontFamily: font }}>
              {language === 'ar' ? '+201090385390' : '+201090385390'}
            </div>
          </div>
          <ArrowRight style={{ width: 11, height: 11, color: TK.textLight, transform: isRTL ? 'rotate(180deg)' : 'none' }} />
        </a>
      </div>
    </div>
  );

  // ── Chat area ─────────────────────────────────────────────────────────────
  const renderChat = () => {
    const title = activeThread?.subject || activeThread?.projectName
      || (language === 'ar' ? 'محادثة' : 'Conversation');
    const hasProject = !!activeThread?.projectId;

    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        display: isMobile && mobileView === 'list' ? 'none' : 'flex',
        minWidth: 0, height: '100%', background: TK.bg,
      }}>
        {/* Chat header */}
        {activeThread ? (
          <div style={{
            padding: '12px 18px', background: TK.surface,
            borderBottom: `1px solid ${TK.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              {isMobile && (
                <button
                  onClick={() => setMobileView('list')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: TK.textMuted, padding: '4px 8px 4px 0', display: 'flex' }}
                >
                  <ArrowRight style={{ width: 16, height: 16, transform: isRTL ? 'none' : 'rotate(180deg)' }} />
                </button>
              )}
              <Avatar name={title} size={34} />
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 13.5, fontWeight: 600, color: TK.text, fontFamily: font,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {title}
                </div>
                <div style={{ fontSize: 11, color: TK.textMuted, fontFamily: font }}>
                  {language === 'ar' ? 'فريق YANSY · نرد عادةً خلال ساعتين' : 'YANSY Team · Replies within 2 hours'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {hasProject && (
                <Link
                  to={`/app/projects/${activeThread.projectId}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 10px', borderRadius: 7,
                    background: TK.accentBg, border: `1px solid ${TK.accentBd}`,
                    color: TK.accent, textDecoration: 'none', fontSize: 11.5, fontWeight: 500,
                  }}
                >
                  <FolderKanban style={{ width: 12, height: 12 }} />
                  {language === 'ar' ? 'المشروع' : 'Project'}
                </Link>
              )}
              <a
                href="https://wa.me/201090385390"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 10px', borderRadius: 7,
                  background: TK.green, color: 'white',
                  textDecoration: 'none', fontSize: 11.5, fontWeight: 500,
                }}
              >
                <WaIcon />
                WhatsApp
              </a>
            </div>
          </div>
        ) : (
          <div style={{
            padding: '12px 18px', background: TK.surface,
            borderBottom: `1px solid ${TK.border}`, flexShrink: 0,
          }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: TK.text, fontFamily: font }}>
              {language === 'ar' ? 'اختر محادثة' : 'Select a conversation'}
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px' }}>
          {!activeThreadId ? (
            <div style={{
              height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14, background: TK.accentBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MessageSquare style={{ width: 26, height: 26, color: TK.accent }} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 500, color: TK.text, margin: 0, fontFamily: font }}>
                {language === 'ar' ? 'مرحباً بك في صندوق الرسائل' : 'Welcome to your inbox'}
              </p>
              <p style={{ fontSize: 12.5, color: TK.textMuted, margin: 0, lineHeight: 1.6, maxWidth: 280, fontFamily: font }}>
                {language === 'ar'
                  ? 'اختر محادثة من القائمة أو ابدأ محادثة جديدة مع فريق YANSY.'
                  : 'Choose a conversation from the list or start a new one with the YANSY team.'}
              </p>
              <button
                onClick={() => setShowNewModal(true)}
                style={{
                  padding: '9px 20px', borderRadius: 9, background: TK.accent,
                  color: 'white', border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 500, fontFamily: font,
                }}
              >
                {language === 'ar' ? 'ابدأ محادثة' : 'Start a conversation'}
              </button>
            </div>
          ) : loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                border: `2px solid ${TK.accentBg}`, borderTopColor: TK.accent,
                animation: 'spin 0.75s linear infinite',
              }} />
            </div>
          ) : messages.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 10, paddingTop: 60, textAlign: 'center',
            }}>
              <MessageSquare style={{ width: 28, height: 28, color: TK.textLight }} />
              <p style={{ fontSize: 13.5, fontWeight: 500, color: TK.text, margin: 0, fontFamily: font }}>
                {language === 'ar' ? 'ابدأ المحادثة' : 'Start the conversation'}
              </p>
              <p style={{ fontSize: 12, color: TK.textMuted, margin: 0, fontFamily: font }}>
                {language === 'ar' ? 'أرسل رسالتك الأولى أدناه' : 'Send your first message below'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {grouped.map((item, idx) =>
                item.type === 'date' ? (
                  <div key={item.key} style={{
                    display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 8px',
                  }}>
                    <div style={{ flex: 1, height: 1, background: TK.border }} />
                    <span style={{
                      fontSize: 10.5, color: TK.textLight, fontWeight: 500, fontFamily: font,
                      padding: '2px 10px', borderRadius: 99,
                      background: TK.surface, border: `1px solid ${TK.border}`,
                    }}>
                      {fmtDateHeader(item.date, language)}
                    </span>
                    <div style={{ flex: 1, height: 1, background: TK.border }} />
                  </div>
                ) : renderMessage(item.data, idx, grouped)
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        {activeThreadId && (
          <div style={{
            padding: '10px 14px 14px',
            borderTop: `1px solid ${TK.border}`,
            background: TK.surface, flexShrink: 0,
          }}>
            <div style={{
              display: 'flex', alignItems: 'flex-end', gap: 8,
              background: TK.bg, borderRadius: 12,
              border: `1px solid ${TK.border}`,
              padding: '8px 10px',
              transition: 'border-color 0.15s',
            }}
              onFocusCapture={e => { e.currentTarget.style.borderColor = TK.accent; }}
              onBlurCapture={e => { e.currentTarget.style.borderColor = TK.border; }}
            >
              <button style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: TK.textLight, display: 'flex', padding: '4px 2px', flexShrink: 0,
              }}>
                <Paperclip style={{ width: 15, height: 15 }} />
              </button>

              <textarea
                ref={textareaRef}
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={language === 'ar' ? 'اكتب رسالتك...' : 'Type your message...'}
                rows={1}
                style={{
                  flex: 1, border: 'none', background: 'transparent',
                  resize: 'none', outline: 'none', fontSize: 13.5,
                  fontFamily: font, color: TK.text, lineHeight: 1.55,
                  maxHeight: 120, overflowY: 'auto', padding: '2px 0',
                }}
              />

              <button style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: TK.textLight, display: 'flex', padding: '4px 2px', flexShrink: 0,
              }}>
                <Smile style={{ width: 15, height: 15 }} />
              </button>

              <button
                onClick={handleSend}
                disabled={!msgText.trim() || sending}
                style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                  background: (msgText.trim() && !sending) ? TK.accent : TK.accentBg,
                  border: 'none', cursor: (msgText.trim() && !sending) ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
              >
                {sending ? (
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white',
                    animation: 'spin 0.75s linear infinite',
                  }} />
                ) : (
                  <Send style={{
                    width: 13, height: 13,
                    color: msgText.trim() ? 'white' : TK.textLight,
                    transform: isRTL ? 'rotate(180deg)' : 'none',
                  }} />
                )}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingLeft: 4 }}>
              <span style={{ fontSize: 10.5, color: TK.textLight, fontFamily: font }}>
                {language === 'ar' ? 'Enter للإرسال · Shift+Enter للسطر الجديد' : 'Enter to send · Shift+Enter for new line'}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      height: 'calc(100vh - 0px)', minHeight: 'calc(100vh - 52px)',
      display: 'flex', flexDirection: 'column',
      background: TK.bg,
      fontFamily: font,
      direction: isRTL ? 'rtl' : 'ltr',
    }}>
      <style>{`
        @keyframes shimmer { 0%,100%{opacity:1}50%{opacity:0.45} }
        @keyframes spin { to{transform:rotate(360deg)} }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 2px; }
      `}</style>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {renderSidebar()}
        {renderChat()}
      </div>

      {/* New Conversation Modal */}
      {showNewModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', padding: 16,
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowNewModal(false); }}
        >
          <div style={{
            background: TK.surface, borderRadius: 18, border: `1px solid ${TK.border}`,
            padding: 24, width: '100%', maxWidth: 440,
            boxShadow: '0 24px 64px rgba(0,0,0,0.14)',
            animation: 'popModal 0.22s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <style>{`@keyframes popModal { from{opacity:0;transform:translateY(10px) scale(0.96)} to{opacity:1;transform:none} }`}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: TK.text, margin: 0, fontFamily: font }}>
                  {language === 'ar' ? 'رسالة جديدة' : 'New Message'}
                </h2>
                <p style={{ fontSize: 12, color: TK.textMuted, margin: '3px 0 0', fontFamily: font }}>
                  {language === 'ar' ? 'سيرد عليك فريق YANSY خلال ساعتين' : 'The YANSY team will reply within 2 hours'}
                </p>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: TK.textMuted, display: 'flex', padding: 4 }}
              >
                <X style={{ width: 17, height: 17 }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11.5, color: TK.textMuted, display: 'block', marginBottom: 5, fontWeight: 500, fontFamily: font }}>
                  {language === 'ar' ? 'رسالتك *' : 'Your message *'}
                </label>
                <textarea
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleCreate(); }}
                  placeholder={language === 'ar' ? 'كيف يمكننا مساعدتك؟' : 'How can we help you?'}
                  rows={4}
                  autoFocus
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: `1px solid ${TK.border}`, fontSize: 13.5,
                    color: TK.text, background: TK.bg, outline: 'none',
                    fontFamily: font, resize: 'vertical', boxSizing: 'border-box',
                    transition: 'border-color 0.15s', lineHeight: 1.55,
                  }}
                  onFocus={e => { e.target.style.borderColor = TK.accent; }}
                  onBlur={e => { e.target.style.borderColor = TK.border; }}
                />
              </div>

              {/* WhatsApp note */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 11px', borderRadius: 8,
                background: 'rgba(37,211,102,0.05)', border: '1px solid rgba(37,211,102,0.15)',
              }}>
                <WaIcon />
                <span style={{ fontSize: 11.5, color: TK.textMuted, fontFamily: font }}>
                  {language === 'ar'
                    ? 'للرد الفوري تواصل عبر '
                    : 'For instant reply, contact via '}
                  <a href="https://wa.me/201090385390" target="_blank" rel="noopener noreferrer"
                    style={{ color: TK.green, fontWeight: 600, textDecoration: 'none' }}>
                    WhatsApp
                  </a>
                </span>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowNewModal(false)}
                  style={{
                    padding: '9px 18px', borderRadius: 9,
                    border: `1px solid ${TK.border}`, background: TK.surface,
                    color: TK.textMuted, cursor: 'pointer', fontSize: 13, fontFamily: font,
                  }}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newMsg.trim() || creating}
                  style={{
                    padding: '9px 20px', borderRadius: 9,
                    background: (newMsg.trim() && !creating) ? TK.accent : TK.accentBg,
                    color: (newMsg.trim() && !creating) ? 'white' : TK.textLight,
                    border: 'none', cursor: (newMsg.trim() && !creating) ? 'pointer' : 'default',
                    fontSize: 13, fontWeight: 500, fontFamily: font,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {creating && (
                    <div style={{
                      width: 11, height: 11, borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white',
                      animation: 'spin 0.75s linear infinite',
                    }} />
                  )}
                  {creating
                    ? (language === 'ar' ? 'جارٍ الإرسال...' : 'Sending...')
                    : (language === 'ar' ? 'إرسال' : 'Send')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
