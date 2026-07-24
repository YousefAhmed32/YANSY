import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchInbox, fetchThreadMessages, sendMessage, markThreadRead, markThreadReadLocal,
} from '../store/messageSlice';
import {
  MessageSquare, Send, Clock, CheckCheck, User,
  FolderKanban, Filter, SortAsc, Inbox, ChevronDown,
  AlertCircle, X, Lock, Megaphone, MoreHorizontal,
  ArrowRight, RefreshCw, Pencil, Trash2,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../utils/api';
import { TK, FONT, Avatar, Badge, SearchInput, FilterPills, IconButton } from '../admin-ui';

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
  try { return new Date(d).toDateString(); } catch { return ''; }
};

const getReplyAge = (d, language) => {
  if (!d) return null;
  const diff = Math.floor((Date.now() - new Date(d)) / 60000);
  if (diff < 60)  return { text: language === 'ar' ? `منذ ${diff} د` : `${diff}m ago`, urgent: diff > 120 };
  if (diff < 1440) {
    const h = Math.floor(diff / 60);
    return { text: language === 'ar' ? `منذ ${h} س` : `${h}h ago`, urgent: h > 4 };
  }
  const d2 = Math.floor(diff / 1440);
  return { text: language === 'ar' ? `منذ ${d2} ي` : `${d2}d ago`, urgent: d2 > 2 };
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
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

// ── Main Component ────────────────────────────────────────────────────────────

const AdminMessages = () => {
  const { language, isRTL } = useLanguage();
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const {
    threads, inboxLoading, activeThreadId, messages, loading, sending,
  } = useSelector(s => s.messages);

  const [search,       setSearch]       = useState('');
  const [filter,       setFilter]       = useState('all'); // all | unread | urgent
  const [msgText,      setMsgText]      = useState('');
  const [noteText,     setNoteText]     = useState('');
  const [showNote,     setShowNote]     = useState(false);
  const [savingNote,   setSavingNote]   = useState(false);
  const [notes,        setNotes]        = useState({});  // threadId → [notes]
  const [clientInfo,   setClientInfo]   = useState(null);
  const [loadingClient, setLoadingClient] = useState(false);
  const [isMobile,     setIsMobile]     = useState(false);
  const [mobileView,   setMobileView]   = useState('list');

  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  const font = FONT(isRTL);

  // ── Responsive ────────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Load all threads (admin sees all) ─────────────────────────────────────
  useEffect(() => {
    dispatch(fetchInbox());
  }, [dispatch]);

  // ── Auto-select first ─────────────────────────────────────────────────────
  const sortedThreads = useMemo(() => {
    return [...threads].sort((a, b) => {
      // Unread first, then by date
      if ((b.unreadCount || 0) !== (a.unreadCount || 0))
        return (b.unreadCount || 0) - (a.unreadCount || 0);
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }, [threads]);

  useEffect(() => {
    if (!inboxLoading && sortedThreads.length > 0 && !activeThreadId) {
      handleSelectThread(sortedThreads[0]);
    }
  }, [inboxLoading, sortedThreads]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Textarea resize ───────────────────────────────────────────────────────
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [msgText]);

  const activeThread = useMemo(
    () => threads.find(t => t._id === activeThreadId),
    [threads, activeThreadId]
  );

  // ── Filter ────────────────────────────────────────────────────────────────
  const filteredThreads = useMemo(() => {
    let list = sortedThreads;
    if (filter === 'unread') list = list.filter(t => (t.unreadCount || 0) > 0);
    if (filter === 'urgent') list = list.filter(t => {
      const age = getReplyAge(t.updatedAt, language);
      return age?.urgent;
    });
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        (t.subject || t.projectName || t.clientName || '').toLowerCase().includes(q) ||
        (t.lastMessage || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [sortedThreads, filter, search, language]);

  const grouped = useMemo(() => groupMessagesByDate(messages), [messages]);

  const totalUnread = useMemo(
    () => threads.reduce((acc, t) => acc + (t.unreadCount || 0), 0),
    [threads]
  );

  // ── Select thread ─────────────────────────────────────────────────────────
  const handleSelectThread = useCallback(async (thread) => {
    dispatch(fetchThreadMessages(thread._id));
    dispatch(markThreadRead(thread._id));
    dispatch(markThreadReadLocal(thread._id));
    if (isMobile) setMobileView('chat');

    // Load client info
    if (thread.clientId || thread.userId) {
      const uid = thread.clientId || thread.userId;
      setLoadingClient(true);
      try {
        const res = await api.get(`/users/${uid}`);
        setClientInfo(res.data?.user || res.data || null);
      } catch {
        setClientInfo(null);
      } finally {
        setLoadingClient(false);
      }
    } else {
      setClientInfo(null);
    }

    // Load notes for this thread
    if (!notes[thread._id]) {
      try {
        const res = await api.get(`/messages/threads/${thread._id}/notes`);
        const threadNotes = Array.isArray(res.data) ? res.data : (res.data?.notes || []);
        setNotes(prev => ({ ...prev, [thread._id]: threadNotes }));
      } catch {
        setNotes(prev => ({ ...prev, [thread._id]: [] }));
      }
    }
  }, [dispatch, isMobile, notes]);

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

  // ── Save internal note ────────────────────────────────────────────────────
  const handleSaveNote = useCallback(async () => {
    if (!noteText.trim() || !activeThreadId) return;
    setSavingNote(true);
    const newNote = {
      _id: `local_${Date.now()}`,
      content: noteText.trim(),
      author: user?.fullName || 'Admin',
      createdAt: new Date().toISOString(),
      local: true,
    };
    try {
      await api.post(`/messages/threads/${activeThreadId}/notes`, { content: noteText.trim() });
    } catch {
      // Save locally even if API fails
    }
    setNotes(prev => ({
      ...prev,
      [activeThreadId]: [...(prev[activeThreadId] || []), newNote],
    }));
    setNoteText('');
    setSavingNote(false);
  }, [activeThreadId, noteText, user]);

  // ── Stats bar ─────────────────────────────────────────────────────────────
  const urgentCount = useMemo(
    () => threads.filter(t => getReplyAge(t.updatedAt, language)?.urgent).length,
    [threads, language]
  );

  // ── Message bubble ────────────────────────────────────────────────────────
  const renderMessage = (msg, idx, items) => {
    const isAdmin = msg.sender?.role === 'ADMIN' || msg.sender?.role === 'SUPER_ADMIN'
      || msg.sender?._id === user?._id || msg.sender === user?._id;
    const prev     = idx > 0 && items[idx - 1]?.type === 'message' ? items[idx - 1].data : null;
    const next     = idx < items.length - 1 && items[idx + 1]?.type === 'message' ? items[idx + 1].data : null;
    const prevRole = prev && (prev.sender?.role === 'ADMIN' || prev.sender?.role === 'SUPER_ADMIN' || prev.sender?._id === user?._id || prev.sender === user?._id);
    const nextRole = next && (next.sender?.role === 'ADMIN' || next.sender?.role === 'SUPER_ADMIN' || next.sender?._id === user?._id || next.sender === user?._id);
    const isFirst  = prevRole !== isAdmin;
    const isLast   = nextRole !== isAdmin;

    return (
      <div key={msg._id || idx} style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isAdmin ? (isRTL ? 'flex-start' : 'flex-end') : (isRTL ? 'flex-end' : 'flex-start'),
        marginBottom: isLast ? 4 : 1,
      }}>
        {!isAdmin && isFirst && (
          <div style={{ fontSize: 10.5, color: TK.textLight, marginBottom: 3, paddingLeft: isRTL ? 0 : 4, paddingRight: isRTL ? 4 : 0 }}>
            {msg.sender?.fullName || (language === 'ar' ? 'العميل' : 'Client')}
          </div>
        )}
        {isAdmin && isFirst && (
          <div style={{ fontSize: 10.5, color: TK.textLight, marginBottom: 3, paddingLeft: isRTL ? 4 : 0, paddingRight: isRTL ? 0 : 4 }}>
            {msg.sender?.fullName || (language === 'ar' ? 'فريق YANSY' : 'YANSY Team')}
          </div>
        )}

        <div style={{
          maxWidth: 'min(70%, 540px)',
          padding: '9px 13px',
          borderRadius: isAdmin ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          background: isAdmin ? TK.accentBg : TK.surface,
          border: `1px solid ${isAdmin ? TK.accentBd : TK.border}`,
          color: TK.text,
          fontSize: 13.5, lineHeight: 1.55, wordBreak: 'break-word',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          {msg.content || msg.text || msg.message || ''}
        </div>

        {isLast && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4, marginTop: 3,
            paddingLeft: isRTL ? 0 : 3, paddingRight: isRTL ? 3 : 0,
          }}>
            <span style={{ fontSize: 10, color: TK.textLight }}>
              {fmtMsgTime(msg.createdAt, language)}
            </span>
            {isAdmin && <CheckCheck style={{ width: 11, height: 11, color: TK.textLight }} />}
          </div>
        )}
      </div>
    );
  };

  // ── Sidebar ───────────────────────────────────────────────────────────────
  const renderSidebar = () => (
    <div style={{
      width: isMobile ? '100%' : 'clamp(260px, 30%, 320px)',
      display: isMobile && mobileView === 'chat' ? 'none' : 'flex',
      flexDirection: 'column',
      background: TK.surface,
      borderRight: isRTL ? 'none' : `1px solid ${TK.border}`,
      borderLeft: isRTL ? `1px solid ${TK.border}` : 'none',
      flexShrink: 0, height: '100%',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 14px 12px', borderBottom: `1px solid ${TK.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Inbox style={{ width: 15, height: 15, color: TK.accent }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: TK.text, fontFamily: font }}>
              {language === 'ar' ? 'صندوق الرسائل' : 'All Conversations'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {totalUnread > 0 && (
              <Badge tone="info">{totalUnread > 99 ? '99+' : totalUnread}</Badge>
            )}
            <IconButton
              icon={RefreshCw}
              size={24}
              onClick={() => dispatch(fetchInbox())}
              title={language === 'ar' ? 'تحديث' : 'Refresh'}
            />
          </div>
        </div>

        {/* Stats chips */}
        <div style={{ marginBottom: 10 }}>
          <FilterPills
            value={filter}
            onChange={setFilter}
            options={[
              {
                value: 'all',
                label: <>{language === 'ar' ? 'الكل' : 'All'}{threads.length > 0 && <span style={{ marginInlineStart: 4, opacity: 0.6 }}>{threads.length}</span>}</>,
              },
              {
                value: 'unread',
                label: <>{language === 'ar' ? 'غير مقروء' : 'Unread'}{totalUnread > 0 && <span style={{ marginInlineStart: 4, opacity: 0.6 }}>{totalUnread}</span>}</>,
              },
              {
                value: 'urgent',
                label: <>{language === 'ar' ? 'عاجل' : 'Urgent'}{urgentCount > 0 && <span style={{ marginInlineStart: 4, opacity: 0.6 }}>{urgentCount}</span>}</>,
              },
            ]}
          />
        </div>

        {/* Search */}
        <SearchInput
          value={search}
          onChange={e => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          placeholder={language === 'ar' ? 'بحث في المحادثات...' : 'Search conversations...'}
        />
      </div>

      {/* Thread list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        {inboxLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 4px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ height: 68, borderRadius: 10, background: TK.bg, animation: 'shimmer 1.4s ease-in-out infinite' }} />
            ))}
          </div>
        ) : filteredThreads.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <Inbox style={{ width: 28, height: 28, color: TK.textLight, margin: '0 auto 10px' }} />
            <p style={{ fontSize: 13, color: TK.textMuted, margin: 0, fontFamily: font }}>
              {language === 'ar' ? 'لا محادثات' : 'No conversations'}
            </p>
          </div>
        ) : filteredThreads.map(thread => {
          const isActive = activeThreadId === thread._id;
          const unread   = (thread.unreadCount || 0) > 0;
          const age      = getReplyAge(thread.updatedAt, language);
          const title    = thread.subject || thread.projectName || thread.clientName
            || (language === 'ar' ? 'محادثة' : 'Conversation');
          const preview  = thread.lastMessage || '';

          return (
            <button
              key={thread._id}
              onClick={() => handleSelectThread(thread)}
              className={isActive ? '' : 'au-row'}
              style={{
                display: 'flex', gap: 10, width: '100%',
                padding: '11px 12px', textAlign: isRTL ? 'right' : 'left',
                background: isActive ? TK.accentBg : 'transparent',
                border: `1px solid ${isActive ? TK.accentBd : 'transparent'}`,
                borderRadius: 10, margin: '1px 0',
                cursor: 'pointer', fontFamily: font,
              }}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Avatar name={thread.clientName || title} size={36} tone="info" />
                {unread && (
                  <span style={{
                    position: 'absolute', top: -3, right: isRTL ? 'auto' : -3, left: isRTL ? -3 : 'auto',
                    width: 10, height: 10, borderRadius: '50%',
                    background: TK.accent, border: '2px solid white',
                  }} />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4, marginBottom: 2 }}>
                  <span style={{
                    fontSize: 12.5, fontWeight: unread ? 600 : 500,
                    color: TK.text, flex: 1, minWidth: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {title}
                  </span>
                  {age && (
                    <span style={{
                      fontSize: 10, fontWeight: age.urgent ? 600 : 400,
                      color: age.urgent ? TK.red : TK.textLight, flexShrink: 0,
                    }}>
                      {age.text}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                  <span style={{
                    fontSize: 11.5, color: unread ? TK.text : TK.textMuted,
                    fontWeight: unread ? 500 : 400,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                  }}>
                    {String(preview).slice(0, 50)}{preview.length > 50 ? '…' : ''}
                  </span>
                  {unread && (
                    <Badge tone="info">{thread.unreadCount > 9 ? '9+' : thread.unreadCount}</Badge>
                  )}
                </div>

                {thread.projectId && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                    <FolderKanban style={{ width: 9, height: 9, color: TK.accent }} />
                    <span style={{ fontSize: 10, color: TK.accent, fontWeight: 500 }}>
                      {language === 'ar' ? 'مشروع' : 'Project'}
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── Chat area ─────────────────────────────────────────────────────────────
  const renderChat = () => {
    const title = activeThread?.subject || activeThread?.projectName
      || activeThread?.clientName || (language === 'ar' ? 'محادثة' : 'Conversation');

    return (
      <div style={{
        flex: 1, display: isMobile && mobileView === 'list' ? 'none' : 'flex',
        flexDirection: 'column', minWidth: 0, height: '100%',
      }}>
        {/* Chat header */}
        {activeThread ? (
          <div style={{
            padding: '10px 18px', background: TK.surface,
            borderBottom: `1px solid ${TK.border}`,
            display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
          }}>
            {isMobile && (
              <button
                onClick={() => setMobileView('list')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: TK.textMuted, padding: '4px 6px 4px 0', display: 'flex' }}
              >
                <ArrowRight style={{ width: 15, height: 15, transform: isRTL ? 'none' : 'rotate(180deg)' }} />
              </button>
            )}
            <Avatar name={title} size={32} tone="info" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: TK.text, fontFamily: font, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {title}
              </div>
              {clientInfo && (
                <div style={{ fontSize: 11, color: TK.textMuted, fontFamily: font }}>
                  {clientInfo.email || ''}{clientInfo.email && clientInfo.phone ? ' · ' : ''}{clientInfo.phone || ''}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
              {clientInfo?.phone && (
                <a
                  href={`https://wa.me/${clientInfo.phone.replace(/\D/g,'')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', borderRadius: 7,
                    background: '#25D366', color: 'white', textDecoration: 'none',
                    fontSize: 11.5, fontWeight: 500,
                  }}
                >
                  <WaIcon /> WhatsApp
                </a>
              )}
              {activeThread.projectId && (
                <Link
                  to={`/app/projects/${activeThread.projectId}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', borderRadius: 7,
                    background: TK.accentBg, border: `1px solid ${TK.accentBd}`,
                    color: TK.accent, textDecoration: 'none', fontSize: 11.5, fontWeight: 500,
                  }}
                >
                  <FolderKanban style={{ width: 11, height: 11 }} />
                  {language === 'ar' ? 'المشروع' : 'Project'}
                </Link>
              )}
              <button
                onClick={() => setShowNote(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 7,
                  background: showNote ? TK.bg : 'transparent',
                  border: `1px solid ${showNote ? TK.accent : TK.border}`,
                  color: showNote ? TK.accent : TK.textMuted,
                  cursor: 'pointer', fontSize: 11.5, fontWeight: 500, fontFamily: font,
                  transition: 'all 0.14s',
                }}
              >
                <Lock style={{ width: 11, height: 11 }} />
                {language === 'ar' ? 'ملاحظة داخلية' : 'Internal note'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '10px 18px', background: TK.surface, borderBottom: `1px solid ${TK.border}`, flexShrink: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: TK.text, fontFamily: font }}>
              {language === 'ar' ? 'اختر محادثة' : 'Select a conversation'}
            </div>
          </div>
        )}

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Messages column */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 18px 8px' }}>
              {!activeThreadId ? (
                <div style={{
                  height: '100%', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 10, textAlign: 'center',
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, background: TK.accentBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Inbox style={{ width: 24, height: 24, color: TK.accent }} />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: TK.text, margin: 0, fontFamily: font }}>
                    {language === 'ar' ? 'مرحباً في مركز الرسائل' : 'Welcome to the Communication Hub'}
                  </p>
                  <p style={{ fontSize: 12.5, color: TK.textMuted, margin: 0, lineHeight: 1.6, maxWidth: 280, fontFamily: font }}>
                    {language === 'ar'
                      ? 'كل محادثات العملاء في مكان واحد. اختر محادثة لبدء الرد.'
                      : 'All client conversations in one place. Select a conversation to start replying.'}
                  </p>
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 60, textAlign: 'center' }}>
                  <MessageSquare style={{ width: 28, height: 28, color: TK.textLight }} />
                  <p style={{ fontSize: 13, color: TK.textMuted, margin: 0, fontFamily: font }}>
                    {language === 'ar' ? 'لا رسائل بعد' : 'No messages yet'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {grouped.map((item, idx) =>
                    item.type === 'date' ? (
                      <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 8px' }}>
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

            {/* Internal note panel */}
            {showNote && activeThreadId && (
              <div style={{
                borderTop: `2px dashed ${TK.accentBd}`,
                background: TK.amberBg,
                padding: '12px 16px', flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Lock style={{ width: 11, height: 11, color: TK.amber }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: TK.amber, fontFamily: font, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {language === 'ar' ? 'ملاحظة داخلية — لا يراها العميل' : 'Internal note — Not visible to client'}
                  </span>
                </div>

                {/* Existing notes */}
                {(notes[activeThreadId] || []).length > 0 && (
                  <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(notes[activeThreadId] || []).map((note, i) => (
                      <div key={note._id || i} style={{
                        background: TK.amberBg, border: `1px solid ${TK.amberBd}`,
                        borderRadius: 8, padding: '8px 10px',
                      }}>
                        <div style={{ fontSize: 12.5, color: TK.text, fontFamily: font, lineHeight: 1.5 }}>
                          {note.content}
                        </div>
                        <div style={{ fontSize: 10, color: TK.amber, marginTop: 4, fontFamily: font }}>
                          {note.author} · {fmtTime(note.createdAt, language)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder={language === 'ar' ? 'أضف ملاحظة داخلية...' : 'Add an internal note...'}
                    rows={2}
                    style={{
                      flex: 1, padding: '8px 10px', borderRadius: 8,
                      border: `1px solid ${TK.amberBd}`, fontSize: 12.5,
                      fontFamily: font, color: TK.text, background: TK.surface,
                      outline: 'none', resize: 'none',
                    }}
                  />
                  <button
                    onClick={handleSaveNote}
                    disabled={!noteText.trim() || savingNote}
                    style={{
                      padding: '8px 14px', borderRadius: 8, border: 'none',
                      background: TK.amber, color: 'white',
                      cursor: noteText.trim() ? 'pointer' : 'default',
                      fontSize: 12, fontWeight: 500, fontFamily: font, flexShrink: 0,
                      opacity: (!noteText.trim() || savingNote) ? 0.5 : 1,
                    }}
                  >
                    {language === 'ar' ? 'حفظ' : 'Save'}
                  </button>
                </div>
              </div>
            )}

            {/* Reply input */}
            {activeThreadId && (
              <div style={{
                padding: '10px 14px 14px',
                borderTop: `1px solid ${TK.border}`,
                background: TK.surface, flexShrink: 0,
              }}>
                <div style={{
                  display: 'flex', alignItems: 'flex-end', gap: 8,
                  background: TK.bg, borderRadius: 12,
                  border: `1px solid ${TK.border}`, padding: '8px 10px',
                  transition: 'border-color 0.15s',
                }}
                  onFocusCapture={e => { e.currentTarget.style.borderColor = TK.accent; }}
                  onBlurCapture={e => { e.currentTarget.style.borderColor = TK.border; }}
                >
                  <textarea
                    ref={textareaRef}
                    value={msgText}
                    onChange={e => setMsgText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={language === 'ar' ? 'اكتب ردك للعميل...' : 'Write your reply to client...'}
                    rows={1}
                    style={{
                      flex: 1, border: 'none', background: 'transparent',
                      resize: 'none', outline: 'none', fontSize: 13.5,
                      fontFamily: font, color: TK.text, lineHeight: 1.55,
                      maxHeight: 120, overflowY: 'auto', padding: '2px 0',
                    }}
                  />
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
                      <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.75s linear infinite' }} />
                    ) : (
                      <Send style={{ width: 13, height: 13, color: msgText.trim() ? 'white' : TK.textLight, transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Client info panel (only on desktop) */}
          {!isMobile && activeThread && (
            <div style={{
              width: 240, flexShrink: 0, borderLeft: isRTL ? 'none' : `1px solid ${TK.border}`,
              borderRight: isRTL ? `1px solid ${TK.border}` : 'none',
              background: TK.surface, overflowY: 'auto', padding: '16px 14px',
            }}>
              {/* Client info */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: TK.textLight, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, fontFamily: font }}>
                  {language === 'ar' ? 'معلومات العميل' : 'Client'}
                </div>
                {loadingClient ? (
                  <div style={{ height: 60, borderRadius: 8, background: TK.bg, animation: 'shimmer 1.4s infinite' }} />
                ) : clientInfo ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <Avatar name={clientInfo.fullName || clientInfo.name} size={36} tone="info" />
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: TK.text, fontFamily: font }}>
                          {clientInfo.fullName || clientInfo.name || '—'}
                        </div>
                        <div style={{ fontSize: 10.5, color: TK.textMuted, fontFamily: font }}>
                          {language === 'ar' ? 'عميل' : 'Client'}
                        </div>
                      </div>
                    </div>
                    {clientInfo.email && (
                      <a href={`mailto:${clientInfo.email}`} style={{
                        display: 'flex', gap: 6, padding: '6px 0', textDecoration: 'none', borderBottom: `1px solid ${TK.border}`, marginBottom: 6,
                      }}>
                        <span style={{ fontSize: 10.5, color: TK.textMuted, fontFamily: font, flex: 1 }}>{clientInfo.email}</span>
                      </a>
                    )}
                    {clientInfo.phone && (
                      <a href={`https://wa.me/${clientInfo.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 10px', borderRadius: 7, marginBottom: 8,
                        background: 'rgba(37,211,102,0.07)', border: '1px solid rgba(37,211,102,0.18)',
                        textDecoration: 'none',
                      }}>
                        <WaIcon />
                        <span style={{ fontSize: 11, color: TK.text, fontFamily: font, fontWeight: 500 }}>{clientInfo.phone}</span>
                      </a>
                    )}
                    <Link
                      to={`/app/admin/users`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 10px', borderRadius: 7,
                        background: TK.accentBg, border: `1px solid ${TK.accentBd}`,
                        textDecoration: 'none', fontSize: 11.5, color: TK.accent, fontWeight: 500, fontFamily: font,
                      }}
                    >
                      <User style={{ width: 11, height: 11 }} />
                      {language === 'ar' ? 'عرض الملف' : 'View profile'}
                    </Link>
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: TK.textMuted, fontFamily: font }}>
                    {language === 'ar' ? 'لا بيانات' : 'No client data'}
                  </p>
                )}
              </div>

              {/* Thread info */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: TK.textLight, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, fontFamily: font }}>
                  {language === 'ar' ? 'تفاصيل المحادثة' : 'Thread'}
                </div>
                {[
                  {
                    label: language === 'ar' ? 'آخر رسالة' : 'Last message',
                    value: fmtTime(activeThread.updatedAt, language),
                  },
                  {
                    label: language === 'ar' ? 'عدد الرسائل' : 'Messages',
                    value: messages.length,
                  },
                  activeThread.projectId && {
                    label: language === 'ar' ? 'المشروع' : 'Project',
                    value: activeThread.projectName || (language === 'ar' ? 'مرتبط' : 'Linked'),
                    link: `/app/projects/${activeThread.projectId}`,
                  },
                ].filter(Boolean).map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${TK.border}` }}>
                    <span style={{ fontSize: 11, color: TK.textMuted, fontFamily: font }}>{row.label}</span>
                    {row.link ? (
                      <Link to={row.link} style={{ fontSize: 11, color: TK.accent, fontWeight: 500, fontFamily: font, textDecoration: 'none' }}>
                        {row.value}
                      </Link>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 500, color: TK.text, fontFamily: font }}>{row.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      height: 'calc(100vh - 0px)', minHeight: 'calc(100vh - 52px)',
      display: 'flex', flexDirection: 'column',
      background: TK.bg, fontFamily: font, direction: isRTL ? 'rtl' : 'ltr',
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
    </div>
  );
};

export default AdminMessages;
