import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import {
  fetchInbox, fetchThreadMessages, fetchOlderMessages, sendMessage,
  createThreadAndMessage, markThreadRead, markThreadReadLocal,
  pushIncomingMessage, setUserTyping, markMessagesReadByOthers,
  addOptimisticMessage, retryFailedMessage, uploadAttachment,
  setActiveThread, clearMessages, fetchArchivedInbox, setThreadArchived,
} from '../store/messageSlice';
import {
  MessageSquare, Send, Search, FolderKanban, Archive, ArchiveRestore,
  CheckCheck, Paperclip, X, ArrowRight, ArrowDown, MoreHorizontal,
  AlertCircle, RotateCw, Loader2, WifiOff, FileText, Download, Users,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSocket } from '../contexts/SocketContext';
import { TK, Composer, ComposerTextArea } from '../admin-ui';

const MAX_ATTACHMENT_MB = 10;
const WA_GREEN = '#25D366';

// ── Helpers ───────────────────────────────────────────────────────────────────

const genTempId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? `tmp_${crypto.randomUUID()}`
    : `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`;

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

// The server stamps a raw English default subject on threads it creates
// with no explicit subject (e.g. "Support Request" — see
// server/controllers/messageController.js createThread). That's a fine
// internal admin label, but rendered verbatim to a customer it's both
// unlocalized (breaks for Arabic) and needlessly clinical ("support
// ticket" framing the customer never asked to understand). Treat the
// known generic defaults as "no real subject" and show a warm, localized
// label instead — a project-linked thread still shows its real project name.
const GENERIC_SERVER_SUBJECTS = /^(Support Request|New \w+ conversation)$/i;
const friendlyThreadTitle = (thread, language) => {
  if (thread.projectName) return thread.projectName;
  if (thread.subject && !GENERIC_SERVER_SUBJECTS.test(thread.subject)) return thread.subject;
  return language === 'ar' ? 'فريق YANSY' : 'YANSY Team';
};

// Safe, minimal link-ification — plain text nodes + real <a> elements only,
// never dangerouslySetInnerHTML. Handles bare https:// URLs inside otherwise
// plain message text (Arabic/English mixed content included).
const URL_RE = /(https?:\/\/[^\s<]+[^\s<.,:;!?'")\]])/g;
const renderMessageText = (text) => {
  if (!text) return null;
  const parts = String(text).split(URL_RE);
  return parts.map((part, i) =>
    URL_RE.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', wordBreak: 'break-all' }}>{part}</a>
      : <span key={i}>{part}</span>
  );
};

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
      background: TK.bgSubtle, border: `1px solid ${TK.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, fontSize: size * 0.33, fontWeight: 700, color: TK.text,
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
  const { socket, connected, joinThread, leaveThread } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    threads, inboxLoading, archivedThreads, archivedLoading, archiveActionThreadId,
    activeThreadId, currentThread, messages, loading, loadingOlder, hasMoreOlder, sending,
    typingUsers,
  } = useSelector(s => s.messages);

  const [search,         setSearch]         = useState('');
  const [msgText,        setMsgText]        = useState('');
  const [tab,            setTab]            = useState('all'); // 'all' | 'unread' | 'archived'
  const [mobileView,     setMobileView]     = useState('list'); // 'list' | 'chat'
  const [isMobile,       setIsMobile]       = useState(false);
  const [composingNew,   setComposingNew]   = useState(false);
  const [pendingFile,    setPendingFile]    = useState(null); // { file, previewName, uploading, progress, error, fileDoc }
  const [nearBottom,     setNearBottom]     = useState(true);
  const [newMsgBanner,   setNewMsgBanner]   = useState(false);
  const [attachError,    setAttachError]    = useState('');
  const [rowMenuOpen,    setRowMenuOpen]    = useState(null); // threadId whose "…" menu is open

  const messagesEndRef  = useRef(null);
  const scrollRef       = useRef(null);
  const textareaRef     = useRef(null);
  const fileInputRef    = useRef(null);
  const typingTimeoutRef = useRef(null);
  const deepLinkHandled  = useRef(false);
  const didInitialFetch  = useRef(false);

  // ── Responsive detection ──────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Load inbox ────────────────────────────────────────────────────────────
  useEffect(() => { dispatch(fetchInbox()); }, [dispatch]);
  useEffect(() => () => dispatch(clearMessages()), [dispatch]);
  useEffect(() => { if (tab === 'archived') dispatch(fetchArchivedInbox()); }, [tab, dispatch]);

  // ── Thread selection (extracted so both auto-select and deep-link reuse it) ─
  const openThread = useCallback((threadId, { keepQueryParam = false } = {}) => {
    if (!threadId) return;
    setComposingNew(false);
    dispatch(fetchThreadMessages(threadId));
    dispatch(markThreadRead(threadId));
    dispatch(markThreadReadLocal(threadId));
    if (isMobile) setMobileView('chat');
    if (!keepQueryParam) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.set('thread', threadId);
        return next;
      }, { replace: true });
    }
  }, [dispatch, isMobile, setSearchParams]);

  // ── Deep link (?thread=<id>) — notification links land here. Runs once
  // the inbox has loaded; falls back to auto-select if the id isn't (or is
  // no longer) one of this customer's threads. ───────────────────────────
  useEffect(() => {
    if (inboxLoading || deepLinkHandled.current) return;
    const requested = searchParams.get('thread');
    if (requested && threads.some(t => t._id === requested)) {
      deepLinkHandled.current = true;
      openThread(requested, { keepQueryParam: true });
      return;
    }
    if (requested) {
      // Stale/foreign thread id — drop it rather than getting stuck.
      setSearchParams(prev => { const n = new URLSearchParams(prev); n.delete('thread'); return n; }, { replace: true });
    }
    if (!didInitialFetch.current && threads.length > 0 && !activeThreadId) {
      didInitialFetch.current = true;
      const sorted = [...threads].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      openThread(sorted[0]._id, { keepQueryParam: true });
    }
    deepLinkHandled.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inboxLoading, threads]);

  // ── Socket: join/leave the active thread room, receive live events ───────
  useEffect(() => {
    if (!socket || !activeThreadId) return;
    joinThread(activeThreadId);
    return () => leaveThread(activeThreadId);
  }, [socket, activeThreadId, joinThread, leaveThread]);

  useEffect(() => {
    if (!socket) return;
    const onMessage = (message) => {
      dispatch(pushIncomingMessage({ message, threadId: message.threadId }));
      if (message.threadId === activeThreadId && (message.sender?._id || message.sender) !== user?._id) {
        if (!nearBottom) setNewMsgBanner(true);
      }
    };
    const onTyping = ({ userId, threadId, typing }) => {
      if (threadId === activeThreadId && userId !== user?._id) dispatch(setUserTyping({ userId, typing }));
    };
    const onThreadRead = ({ threadId, readBy }) => {
      if (threadId === activeThreadId) dispatch(markMessagesReadByOthers({ threadId, readerId: readBy }));
    };
    const onReconnected = () => {
      dispatch(fetchInbox());
      if (activeThreadId) dispatch(fetchThreadMessages(activeThreadId));
    };
    socket.on('message-received', onMessage);
    socket.on('user-typing', onTyping);
    socket.on('thread-read', onThreadRead);
    socket.on('client-reconnected', onReconnected);
    return () => {
      socket.off('message-received', onMessage);
      socket.off('user-typing', onTyping);
      socket.off('thread-read', onThreadRead);
      socket.off('client-reconnected', onReconnected);
    };
  }, [socket, activeThreadId, user?._id, nearBottom, dispatch]);

  // ── Scroll tracking — auto-scroll only when already near the bottom;
  // otherwise surface a "jump to latest" banner instead of yanking the
  // viewport out from under someone reading older messages. ───────────────
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distanceFromBottom < 80;
    setNearBottom(atBottom);
    if (atBottom) setNewMsgBanner(false);
    if (el.scrollTop < 60 && hasMoreOlder && !loadingOlder && messages.length > 0) {
      const prevHeight = el.scrollHeight;
      dispatch(fetchOlderMessages({ threadId: activeThreadId, before: messages[0]?.createdAt })).then(() => {
        requestAnimationFrame(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevHeight;
        });
      });
    }
  }, [dispatch, hasMoreOlder, loadingOlder, messages, activeThreadId]);

  useEffect(() => {
    if (nearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setNewMsgBanner(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  const jumpToLatest = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewMsgBanner(false);
    setNearBottom(true);
  };

  // ── Textarea auto-resize ──────────────────────────────────────────────────
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + 'px';
    }
  }, [msgText]);

  const activeThread = useMemo(
    () => threads.find(t => t._id === activeThreadId) || archivedThreads.find(t => t._id === activeThreadId) || currentThread,
    [threads, archivedThreads, activeThreadId, currentThread]
  );

  const baseList = tab === 'archived' ? archivedThreads : threads;
  const filteredThreads = useMemo(() => {
    let sorted = [...baseList].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    if (tab === 'unread') sorted = sorted.filter(t => t.unreadCount > 0);
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter(t =>
      (t.subject || t.projectName || '').toLowerCase().includes(q) ||
      (t.lastMessage || '').toLowerCase().includes(q)
    );
  }, [baseList, tab, search]);

  const grouped = useMemo(() => groupMessagesByDate(messages), [messages]);
  const someoneTyping = Object.keys(typingUsers).length > 0;

  // ── Thread selection ──────────────────────────────────────────────────────
  const handleSelectThread = useCallback((thread) => openThread(thread._id), [openThread]);

  const startNewConversation = useCallback(() => {
    setComposingNew(true);
    dispatch(setActiveThread(null));
    setSearchParams(prev => { const n = new URLSearchParams(prev); n.delete('thread'); return n; }, { replace: true });
    if (isMobile) setMobileView('chat');
    setTimeout(() => textareaRef.current?.focus(), 60);
  }, [dispatch, isMobile, setSearchParams]);

  const handleToggleArchive = useCallback((thread, archived) => {
    setRowMenuOpen(null);
    dispatch(setThreadArchived({ threadId: thread._id, archived }));
  }, [dispatch]);

  // ── Attachment picking ────────────────────────────────────────────────────
  const handlePickFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAttachError('');
    if (file.size > MAX_ATTACHMENT_MB * 1024 * 1024) {
      setAttachError(language === 'ar' ? `الحد الأقصى للحجم ${MAX_ATTACHMENT_MB}MB` : `Max file size is ${MAX_ATTACHMENT_MB}MB`);
      return;
    }
    setPendingFile({ file, name: file.name, size: file.size, uploading: false, progress: 0, error: null, fileDoc: null });
  };

  const removePendingFile = () => setPendingFile(null);

  // ── Typing indicator emit ─────────────────────────────────────────────────
  const emitTyping = useCallback(() => {
    if (!socket || !activeThreadId) return;
    socket.emit('typing-start', { threadId: activeThreadId });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing-stop', { threadId: activeThreadId });
    }, 2000);
  }, [socket, activeThreadId]);

  useEffect(() => () => clearTimeout(typingTimeoutRef.current), []);

  // ── Send ─────────────────────────────────────────────────────────────────
  const doSendToThread = useCallback(async (threadId, content, tempId, attachmentDocs) => {
    const attachmentIds = (attachmentDocs || []).map(f => f._id);
    await dispatch(sendMessage({ threadId, content, attachments: attachmentIds, tempId }));
  }, [dispatch]);

  const handleSend = useCallback(async () => {
    const content = msgText.trim();
    if ((!content && !pendingFile) || sending) return;

    let attachmentDoc = pendingFile?.fileDoc || null;

    // Starting the very first conversation — no thread yet. The composer
    // itself is the "start a conversation" action; no separate modal.
    if (composingNew || !activeThreadId) {
      setMsgText('');
      const filePayload = pendingFile;
      setPendingFile(null);
      try {
        let attachments = [];
        if (filePayload && !attachmentDoc) {
          const uploaded = await dispatch(uploadAttachment({ file: filePayload.file })).unwrap();
          attachments = [uploaded._id];
        } else if (attachmentDoc) {
          attachments = [attachmentDoc._id];
        }
        await dispatch(createThreadAndMessage({ content: content || (language === 'ar' ? 'مرحباً' : 'Hello'), attachments })).unwrap();
        setComposingNew(false);
      } catch {
        // Surface failure by restoring the composer content rather than a
        // silent no-op — starting a brand-new thread has no message bubble
        // to attach a Retry affordance to yet.
        setMsgText(content);
        setPendingFile(filePayload);
      }
      return;
    }

    const tempId = genTempId();
    setMsgText('');
    setPendingFile(null);

    dispatch(addOptimisticMessage({
      tempId,
      threadId: activeThreadId,
      message: {
        content, sender: user, createdAt: new Date().toISOString(),
        attachments: attachmentDoc ? [attachmentDoc] : [],
      },
    }));

    let attachmentDocs = attachmentDoc ? [attachmentDoc] : [];
    if (pendingFile && !attachmentDoc) {
      try {
        const uploaded = await dispatch(uploadAttachment({ file: pendingFile.file })).unwrap();
        attachmentDocs = [uploaded];
      } catch {
        // Upload failed — still send the text portion (if any) rather than
        // losing the whole message; mark it failed only if there's nothing
        // to send at all.
      }
    }

    await doSendToThread(activeThreadId, content, tempId, attachmentDocs);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [dispatch, msgText, pendingFile, activeThreadId, sending, composingNew, user, language, doSendToThread]);

  const handleRetry = useCallback((message) => {
    dispatch(retryFailedMessage(message._id));
    doSendToThread(activeThreadId, message.content, message._id, message.attachments);
  }, [dispatch, activeThreadId, doSendToThread]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    else emitTyping();
  }, [handleSend, emitTyping]);

  const font = isRTL
    ? 'IBM Plex Sans Arabic, system-ui, sans-serif'
    : 'Inter, system-ui, sans-serif';

  // ── Thread List ───────────────────────────────────────────────────────────
  const renderThread = (thread) => {
    const isActive  = activeThreadId === thread._id && !composingNew;
    const unread    = thread.unreadCount > 0;
    const isArchivedTab = tab === 'archived';
    const title     = friendlyThreadTitle(thread, language);
    const preview   = thread.lastMessage || (language === 'ar' ? 'لا رسائل بعد' : 'No messages yet');
    const time      = fmtTime(thread.updatedAt, language);
    const busy      = archiveActionThreadId === thread._id;

    return (
      <div
        key={thread._id}
        role="button"
        tabIndex={0}
        onClick={() => handleSelectThread(thread)}
        onKeyDown={e => { if (e.key === 'Enter') handleSelectThread(thread); }}
        style={{
          position: 'relative', display: 'flex', gap: '10px', width: '100%',
          padding: '11px 12px', textAlign: isRTL ? 'right' : 'left',
          background: isActive ? TK.bgSubtle : (unread ? 'rgba(180,83,9,0.05)' : 'transparent'),
          borderInlineStart: unread ? `3px solid ${TK.accent}` : '3px solid transparent',
          borderRadius: '10px', margin: '1px 0',
          cursor: 'pointer', transition: 'background 0.12s', fontFamily: font,
          opacity: busy ? 0.5 : 1,
        }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = TK.hoverBg; }}
        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = unread ? 'rgba(180,83,9,0.05)' : 'transparent'; } }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Avatar name={thread.projectName || 'YANSY'} size={36} />
          {thread.projectId && (
            <span style={{
              position: 'absolute', bottom: -2, right: isRTL ? 'auto' : -2, left: isRTL ? -2 : 'auto',
              width: 12, height: 12, borderRadius: '50%',
              background: TK.ink, border: '2px solid white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FolderKanban style={{ width: 7, height: 7, color: 'white' }} />
            </span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 2 }}>
            <span style={{
              fontSize: 13, fontWeight: unread ? 700 : 500,
              color: TK.text, flex: 1, minWidth: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {title}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {unread && <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: TK.accent }} />}
              <span style={{ fontSize: 10.5, color: TK.textLight, marginTop: 1 }}>{time}</span>
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
            <span style={{
              fontSize: 12, color: unread ? TK.textMuted : TK.textLight,
              fontWeight: unread ? 500 : 400,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
            }}>
              {String(preview).slice(0, 55)}{preview.length > 55 ? '…' : ''}
            </span>
            {unread && !isArchivedTab && (
              <span style={{
                minWidth: 18, height: 18, borderRadius: 9,
                background: TK.accent, color: 'white',
                fontSize: 9.5, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', flexShrink: 0,
              }}>
                {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
              </span>
            )}
          </div>
        </div>

        {/* Row menu — archive / unarchive (real, working: PATCH .../archive) */}
        <div style={{ position: 'relative', flexShrink: 0, alignSelf: 'center' }}>
          <button
            onClick={e => { e.stopPropagation(); setRowMenuOpen(rowMenuOpen === thread._id ? null : thread._id); }}
            aria-label={isRTL ? 'مزيد من الخيارات' : 'More options'}
            aria-haspopup="menu"
            style={{
              width: 24, height: 24, borderRadius: 6, background: 'transparent', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TK.textLight,
            }}
          >
            <MoreHorizontal style={{ width: 14, height: 14 }} />
          </button>
          {rowMenuOpen === thread._id && (
            <div
              role="menu"
              onClick={e => e.stopPropagation()}
              style={{
                position: 'absolute', top: '100%', [isRTL ? 'left' : 'right']: 0, marginTop: 2,
                minWidth: 168, background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: 10,
                boxShadow: '0 8px 24px rgba(15,23,42,0.12)', overflow: 'hidden', zIndex: 20,
              }}
            >
              <button
                role="menuitem"
                onClick={() => handleToggleArchive(thread, !isArchivedTab)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px',
                  background: 'transparent', border: 'none', cursor: 'pointer', color: TK.text,
                  fontSize: 12.5, textAlign: isRTL ? 'right' : 'left', fontFamily: font,
                }}
              >
                {isArchivedTab
                  ? <ArchiveRestore style={{ width: 13, height: 13 }} />
                  : <Archive style={{ width: 13, height: 13 }} />}
                {isArchivedTab
                  ? (isRTL ? 'إلغاء الأرشفة' : 'Unarchive')
                  : (isRTL ? 'أرشفة المحادثة' : 'Archive conversation')}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Attachment chip (inside a message bubble) ─────────────────────────────
  const renderAttachment = (att, isMe) => {
    if (!att || typeof att !== 'object') return null;
    const isImage = att.mimeType?.startsWith('image/');
    return (
      <a
        key={att._id}
        href={att.url}
        target="_blank"
        rel="noopener noreferrer"
        download={att.originalName}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, marginTop: 6,
          padding: '8px 10px', borderRadius: 9, textDecoration: 'none',
          background: isMe ? 'rgba(255,255,255,0.12)' : TK.bgSubtle,
          border: `1px solid ${isMe ? 'rgba(255,255,255,0.2)' : TK.border}`,
          color: isMe ? '#fff' : TK.text, maxWidth: 260,
        }}
      >
        {isImage
          ? <img src={att.url} alt={att.originalName} style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
          : <FileText style={{ width: 18, height: 18, flexShrink: 0, opacity: 0.85 }} />}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 11.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.originalName}</div>
          <div style={{ fontSize: 10, opacity: 0.75 }}>{formatBytes(att.size)}</div>
        </div>
        <Download style={{ width: 13, height: 13, flexShrink: 0, opacity: 0.75 }} />
      </a>
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
    const isFailed = msg.status === 'failed';
    const isSending = msg.status === 'sending';

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
            // A `%` max-width here resolves against this bubble's own
            // shrink-to-fit flex row (it has no definite width of its own —
            // that's how a short message hugs one edge instead of stretching
            // full width), which is an indeterminate containing block. That
            // collapses the constraint to ~0 in Chromium, so `word-break`
            // then wraps every couple of characters ("HE/LL/O") instead of
            // the intended "up to ~72% of the chat pane". `vw` is resolved
            // against the viewport instead, sidestepping that circularity.
            maxWidth: 'min(72vw, 520px)',
            padding: '9px 13px',
            borderRadius: br,
            background: isFailed ? 'rgba(220,38,38,0.08)' : (isMe ? TK.ink : TK.surface),
            border: isFailed ? `1px solid rgba(220,38,38,0.3)` : (isMe ? 'none' : `1px solid ${TK.border}`),
            color: isFailed ? TK.red : (isMe ? '#fff' : TK.text),
            fontSize: 13.5, lineHeight: 1.55, wordBreak: 'break-word',
            opacity: isSending ? 0.7 : 1,
          }}>
            {renderMessageText(msg.content)}
            {(msg.attachments || []).map(att => renderAttachment(att, isMe && !isFailed))}
          </div>
        </div>

        {isFailed && (
          <button
            onClick={() => handleRetry(msg)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, marginTop: 4,
              background: 'none', border: 'none', cursor: 'pointer',
              color: TK.red, fontSize: 10.5, fontWeight: 600, padding: 0, fontFamily: font,
            }}
          >
            <RotateCw style={{ width: 10, height: 10 }} />
            {language === 'ar' ? 'فشل الإرسال — إعادة المحاولة' : 'Failed to send — Retry'}
          </button>
        )}

        {isLast && !isFailed && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            marginTop: 3, paddingLeft: isRTL ? 0 : 3, paddingRight: isRTL ? 3 : 0,
          }}>
            {isSending ? (
              <Loader2 style={{ width: 10, height: 10, color: TK.textLight, animation: 'spin 0.9s linear infinite' }} />
            ) : (
              <span style={{ fontSize: 10, color: TK.textLight }}>{fmtMsgTime(msg.createdAt, language)}</span>
            )}
            {isMe && !isSending && (
              msg.isRead
                ? <CheckCheck style={{ width: 11, height: 11, color: TK.text }} />
                : <CheckCheck style={{ width: 11, height: 11, color: TK.textLight }} />
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Sidebar (thread list) ─────────────────────────────────────────────────
  const listLoading = tab === 'archived' ? archivedLoading : inboxLoading;
  const TABS = [
    { id: 'all',      label: language === 'ar' ? 'الكل' : 'All' },
    { id: 'unread',   label: language === 'ar' ? 'غير مقروءة' : 'Unread' },
    { id: 'archived', label: language === 'ar' ? 'المؤرشفة' : 'Archived' },
  ];

  const renderSidebar = () => (
    <div style={{
      width: isMobile ? '100%' : 'clamp(260px, 30%, 320px)',
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
            <MessageSquare style={{ width: 15, height: 15, color: TK.text }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: TK.text, fontFamily: font }}>
              {language === 'ar' ? 'المحادثات' : 'Messages'}
            </span>
            {threads.length > 0 && (
              <span style={{
                padding: '1px 7px', borderRadius: 99, fontSize: 10, fontWeight: 600,
                background: TK.bgSubtle, color: TK.textMuted, border: `1px solid ${TK.border}`,
              }}>
                {threads.length}
              </span>
            )}
            {!connected && (
              <span title={language === 'ar' ? 'غير متصل — إعادة الاتصال...' : 'Offline — reconnecting…'} style={{ display: 'flex' }}>
                <WifiOff style={{ width: 13, height: 13, color: TK.textLight }} />
              </span>
            )}
          </div>
          <button
            onClick={startNewConversation}
            aria-label={language === 'ar' ? 'محادثة جديدة' : 'New conversation'}
            title={language === 'ar' ? 'محادثة جديدة' : 'New conversation'}
            style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: composingNew ? TK.ink : 'transparent',
              border: `1px solid ${composingNew ? TK.ink : TK.border}`,
              color: composingNew ? '#fff' : TK.textMuted,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <MessageSquare style={{ width: 13, height: 13 }} />
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <Search style={{
            position: 'absolute', top: '50%', transform: 'translateY(-50%)',
            [isRTL ? 'right' : 'left']: 10,
            width: 12, height: 12, color: TK.textLight, pointerEvents: 'none',
          }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={language === 'ar' ? 'ابحث في المحادثات...' : 'Search conversations...'}
            style={{
              width: '100%', padding: isRTL ? '7px 30px 7px 10px' : '7px 10px 7px 30px',
              borderRadius: 8, border: `1px solid ${TK.border}`,
              fontSize: 12.5, fontFamily: font, color: TK.text,
              background: TK.bgSubtle, outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.target.style.borderColor = TK.text; }}
            onBlur={e => { e.target.style.borderColor = TK.border; }}
          />
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6 }}>
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '6px 12px', borderRadius: 999,
                  background: active ? TK.ink : 'transparent',
                  border: `1px solid ${active ? TK.ink : TK.border}`,
                  color: active ? '#fff' : TK.textMuted,
                  fontSize: 11.5, fontWeight: 500, cursor: 'pointer', fontFamily: font,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Thread list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }} onClick={() => setRowMenuOpen(null)}>
        {listLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 4px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height: 62, borderRadius: 10, background: TK.bgSubtle,
                animation: 'shimmer 1.4s ease-in-out infinite',
              }} />
            ))}
          </div>
        ) : filteredThreads.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: TK.bgSubtle,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
            }}>
              {tab === 'archived'
                ? <Archive style={{ width: 20, height: 20, color: TK.textLight }} />
                : <MessageSquare style={{ width: 22, height: 22, color: TK.textLight }} />}
            </div>
            <p style={{ fontSize: 13.5, fontWeight: 500, color: TK.text, margin: '0 0 5px', fontFamily: font }}>
              {search
                ? (language === 'ar' ? 'لا نتائج' : 'No results')
                : tab === 'archived'
                  ? (language === 'ar' ? 'لا محادثات مؤرشفة' : 'No archived conversations')
                  : tab === 'unread'
                    ? (language === 'ar' ? 'لا رسائل غير مقروءة' : 'No unread messages')
                    : (language === 'ar' ? 'لا محادثات بعد' : 'No conversations yet')}
            </p>
            {!search && tab === 'all' && (
              <>
                <p style={{ fontSize: 12, color: TK.textMuted, margin: '0 0 14px', lineHeight: 1.5, fontFamily: font }}>
                  {language === 'ar' ? 'راسل فريق YANSY مباشرةً' : 'Message the YANSY team directly'}
                </p>
                <button
                  onClick={startNewConversation}
                  style={{
                    padding: '8px 18px', borderRadius: 8, background: TK.ink,
                    color: 'white', border: 'none', cursor: 'pointer',
                    fontSize: 12.5, fontWeight: 500, fontFamily: font,
                  }}
                >
                  {language === 'ar' ? 'راسل فريق YANSY' : 'Message YANSY Team'}
                </button>
              </>
            )}
          </div>
        ) : (
          filteredThreads.map(thread => renderThread(thread))
        )}
      </div>

      {/* WhatsApp — persistent, single, non-floating entry point */}
      <div style={{ padding: '10px 12px', borderTop: `1px solid ${TK.border}`, flexShrink: 0 }}>
        <a
          href="https://wa.me/201090385390"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 12px', borderRadius: 9,
            background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.18)',
            textDecoration: 'none', transition: 'background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,211,102,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(37,211,102,0.06)'; }}
        >
          <WaIcon />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: TK.text, fontFamily: font }}>
              {language === 'ar' ? 'واتساب — رد فوري' : 'WhatsApp — Instant reply'}
            </div>
            <div style={{ fontSize: 10.5, color: TK.textMuted, fontFamily: font }} dir="ltr">
              +201090385390
            </div>
          </div>
          <ArrowRight style={{ width: 11, height: 11, color: TK.textLight, transform: isRTL ? 'rotate(180deg)' : 'none' }} />
        </a>
      </div>
    </div>
  );

  // ── Composer (shared by an existing thread and the "new conversation" state) ─
  const renderComposer = () => (
    <div style={{
      padding: '12px 16px 14px',
      borderTop: `1px solid ${TK.border}`,
      background: TK.surface, flexShrink: 0,
    }}>
      {attachError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 11, color: TK.red, fontFamily: font }}>
          <AlertCircle style={{ width: 12, height: 12 }} /> {attachError}
        </div>
      )}
      {pendingFile && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
          padding: '7px 10px', borderRadius: 9, background: TK.bgSubtle, border: `1px solid ${TK.border}`,
        }}>
          <FileText style={{ width: 15, height: 15, color: TK.text, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, color: TK.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pendingFile.name}</div>
            <div style={{ fontSize: 10, color: TK.textLight }}>{formatBytes(pendingFile.size)}</div>
          </div>
          <button onClick={removePendingFile} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TK.textLight, display: 'flex' }} aria-label={language === 'ar' ? 'إزالة الملف' : 'Remove file'}>
            <X style={{ width: 13, height: 13 }} />
          </button>
        </div>
      )}
      {/* DOM order is [input, send] with plain `row` (no manual reverse) so
          the send button lands at the inline-END in both directions purely
          from the page's inherited `direction` — mirroring automatically
          instead of being pinned to one visual side regardless of language.
          `Composer`/`ComposerTextArea` (admin-ui) are the shared shell that
          keeps this one bordered pill as the ONLY frame — see their doc
          comment in Primitives.jsx for why a manual per-page border/focus
          implementation here used to grow a second frame around the
          textarea on focus. */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        <Composer style={{ borderRadius: 14 }}>
          <input ref={fileInputRef} type="file" onChange={handlePickFile} hidden accept="image/*,.pdf,.doc,.docx,.txt" />

          <ComposerTextArea
            ref={textareaRef}
            value={msgText}
            onChange={e => setMsgText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={language === 'ar' ? 'اكتب رسالتك...' : 'Type your message...'}
            style={{ fontFamily: font, color: TK.text, maxHeight: 140, overflowY: 'auto' }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            aria-label={language === 'ar' ? 'إرفاق ملف' : 'Attach file'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: pendingFile ? TK.text : TK.textLight, display: 'flex', padding: '4px 2px', flexShrink: 0,
            }}
          >
            <Paperclip style={{ width: 16, height: 16 }} />
          </button>
        </Composer>

        <button
          onClick={handleSend}
          disabled={(!msgText.trim() && !pendingFile) || sending}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0,
            height: 42, padding: '0 16px', borderRadius: 12,
            background: ((msgText.trim() || pendingFile) && !sending) ? TK.ink : TK.bgSubtle,
            border: 'none', cursor: ((msgText.trim() || pendingFile) && !sending) ? 'pointer' : 'default',
            color: ((msgText.trim() || pendingFile) && !sending) ? '#fff' : TK.textLight,
            fontSize: 13, fontWeight: 600, fontFamily: font,
            transition: 'background 0.15s',
          }}
        >
          {sending ? (
            <Loader2 style={{ width: 14, height: 14, animation: 'spin 0.75s linear infinite' }} />
          ) : (
            <Send style={{ width: 14, height: 14, transform: isRTL ? 'rotate(180deg)' : 'none' }} />
          )}
          <span>{language === 'ar' ? 'إرسال' : 'Send'}</span>
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
        <span style={{ fontSize: 10.5, color: TK.textLight, fontFamily: font }}>
          {language === 'ar' ? 'Enter للإرسال · Shift+Enter للسطر الجديد' : 'Enter to send · Shift+Enter for new line'}
        </span>
      </div>
    </div>
  );

  // ── Chat area ─────────────────────────────────────────────────────────────
  const renderChat = () => {
    const title = activeThread ? friendlyThreadTitle(activeThread, language) : '';
    const hasProject = !!activeThread?.projectId;
    const memberCount = Array.isArray(activeThread?.participants) ? activeThread.participants.length : 0;
    const showingConversation = composingNew || !!activeThreadId;

    return (
      <div style={{
        flex: 1, flexDirection: 'column',
        display: isMobile && mobileView === 'list' ? 'none' : 'flex',
        minWidth: 0, height: '100%', background: TK.bg, position: 'relative',
      }}>
        {/* Chat header */}
        {composingNew ? (
          <div style={{
            padding: '14px 18px', background: TK.surface,
            borderBottom: `1px solid ${TK.border}`,
            display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
          }}>
            {isMobile && (
              <button onClick={() => setMobileView('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TK.textMuted, padding: '4px 8px 4px 0', display: 'flex' }}>
                <ArrowRight style={{ width: 16, height: 16, transform: isRTL ? 'none' : 'rotate(180deg)' }} />
              </button>
            )}
            <Avatar name="YANSY" size={36} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: TK.text, fontFamily: font }}>
                {language === 'ar' ? 'فريق YANSY' : 'YANSY Team'}
              </div>
              <div style={{ fontSize: 11.5, color: TK.textMuted, fontFamily: font }}>
                {language === 'ar' ? 'محادثة جديدة' : 'New conversation'}
              </div>
            </div>
          </div>
        ) : activeThread ? (
          <>
            <div style={{
              padding: '14px 18px', background: TK.surface,
              borderBottom: `1px solid ${TK.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                {isMobile && (
                  <button
                    onClick={() => setMobileView('list')}
                    aria-label={language === 'ar' ? 'رجوع لقائمة المحادثات' : 'Back to conversations'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: TK.textMuted, padding: '4px 8px 4px 0', display: 'flex' }}
                  >
                    <ArrowRight style={{ width: 16, height: 16, transform: isRTL ? 'none' : 'rotate(180deg)' }} />
                  </button>
                )}
                <Avatar name={title} size={36} />
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 700, color: TK.text, fontFamily: font,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {title}
                  </div>
                  <div style={{ fontSize: 11.5, color: TK.textMuted, fontFamily: font, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {someoneTyping ? (
                      <span style={{ color: TK.accent, fontWeight: 500 }}>{language === 'ar' ? 'يكتب الآن...' : 'Typing…'}</span>
                    ) : memberCount > 0 ? (
                      <>
                        <Users style={{ width: 11, height: 11 }} />
                        {language === 'ar' ? `${memberCount} أعضاء` : `${memberCount} member${memberCount !== 1 ? 's' : ''}`}
                      </>
                    ) : (language === 'ar' ? 'فريق YANSY' : 'YANSY Team')}
                  </div>
                </div>
              </div>
            </div>

            {/* Project context bar — only rendered when the thread is genuinely
                linked to a real project (activeThread.projectId), never fabricated. */}
            {hasProject && (
              <div style={{
                padding: '9px 18px', background: TK.bgSubtle,
                borderBottom: `1px solid ${TK.border}`,
                display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
              }}>
                <Link
                  to={`/app/projects/${activeThread.projectId}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    color: TK.textMuted, textDecoration: 'none', fontSize: 12, fontWeight: 500,
                  }}
                >
                  <ArrowRight style={{ width: 12, height: 12, transform: isRTL ? 'none' : 'rotate(180deg)' }} />
                  {language === 'ar' ? 'عرض المشروع' : 'View project'}
                </Link>
                <span style={{ color: TK.border }}>·</span>
                <FolderKanban style={{ width: 12, height: 12, color: TK.textMuted }} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: TK.text }}>{activeThread.projectName}</span>
              </div>
            )}
          </>
        ) : (
          <div style={{
            padding: '14px 18px', background: TK.surface,
            borderBottom: `1px solid ${TK.border}`, flexShrink: 0,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TK.text, fontFamily: font }}>
              {language === 'ar' ? 'اختر محادثة' : 'Select a conversation'}
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px' }}>
          {!showingConversation ? (
            <div style={{
              height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14, background: TK.bgSubtle,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MessageSquare style={{ width: 26, height: 26, color: TK.textMuted }} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: TK.text, margin: 0, fontFamily: font }}>
                {language === 'ar' ? 'مرحباً بك في صندوق الرسائل' : 'Welcome to your inbox'}
              </p>
              <p style={{ fontSize: 12.5, color: TK.textMuted, margin: 0, lineHeight: 1.6, maxWidth: 280, fontFamily: font }}>
                {language === 'ar'
                  ? 'اختر محادثة من القائمة، أو راسل فريق YANSY مباشرةً.'
                  : 'Choose a conversation from the list, or message the YANSY team directly.'}
              </p>
              <button
                onClick={startNewConversation}
                style={{
                  padding: '9px 20px', borderRadius: 9, background: TK.ink,
                  color: 'white', border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 500, fontFamily: font,
                }}
              >
                {language === 'ar' ? 'راسل فريق YANSY' : 'Message YANSY Team'}
              </button>
            </div>
          ) : loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                border: `2px solid ${TK.bgSubtle}`, borderTopColor: TK.text,
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
                {language === 'ar' ? 'أرسل رسالتك أدناه' : 'Send your message below'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {loadingOlder && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                  <Loader2 style={{ width: 16, height: 16, color: TK.textLight, animation: 'spin 0.8s linear infinite' }} />
                </div>
              )}
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
              {someoneTyping && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0 2px', color: TK.textLight, fontSize: 11.5, fontFamily: font }}>
                  <span style={{ display: 'flex', gap: 2 }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: TK.textLight, animation: `typingDot 1.2s ${i * 0.15}s infinite ease-in-out` }} />
                    ))}
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Jump to latest */}
        {newMsgBanner && (
          <button
            onClick={jumpToLatest}
            style={{
              position: 'absolute', bottom: 78, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              borderRadius: 99, background: TK.ink, color: 'white', border: 'none',
              cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: font,
              boxShadow: '0 6px 20px rgba(15,23,42,0.25)', zIndex: 5,
            }}
          >
            {language === 'ar' ? 'رسائل جديدة' : 'New messages'}
            <ArrowDown style={{ width: 12, height: 12 }} />
          </button>
        )}

        {/* Input */}
        {showingConversation && renderComposer()}
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
        @keyframes typingDot { 0%,60%,100%{opacity:0.3;transform:translateY(0)} 30%{opacity:1;transform:translateY(-2px)} }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 2px; }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
        }
      `}</style>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {renderSidebar()}
        {renderChat()}
      </div>
    </div>
  );
};

export default Messages;
