import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import {
  fetchInbox, fetchThreadMessages, fetchOlderMessages, sendMessage,
  markThreadRead, markThreadReadLocal, setUserTyping, markMessagesReadByOthers,
  addOptimisticMessage, retryFailedMessage, pushIncomingMessage, uploadAttachment,
} from '../store/messageSlice';
import {
  MessageSquare, Send, User,
  FolderKanban, Inbox,
  Lock, ArrowRight, RefreshCw,
  RotateCw, Loader2, WifiOff, FileText, Download, Paperclip, X,
  Pin, PinOff, Archive, ArchiveRestore, ArrowDown, AlertCircle,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../utils/api';
import { TK, FONT, Avatar, Badge, SearchInput, FilterPills, IconButton, Select, Composer, ComposerTextArea } from '../admin-ui';

const MAX_ATTACHMENT_MB = 10;

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

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

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

const WaIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const STATUS_OPTS = (language) => [
  { value: 'open',                 label: language === 'ar' ? 'مفتوحة' : 'Open' },
  { value: 'waiting_for_admin',    label: language === 'ar' ? 'بانتظار الفريق' : 'Waiting on us' },
  { value: 'waiting_for_customer', label: language === 'ar' ? 'بانتظار العميل' : 'Waiting on customer' },
  { value: 'resolved',             label: language === 'ar' ? 'تم الحل' : 'Resolved' },
  { value: 'closed',               label: language === 'ar' ? 'مغلقة' : 'Closed' },
];
const PRIORITY_OPTS = (language) => [
  { value: 'low',    label: language === 'ar' ? 'منخفضة' : 'Low' },
  { value: 'medium', label: language === 'ar' ? 'متوسطة' : 'Medium' },
  { value: 'high',   label: language === 'ar' ? 'عالية' : 'High' },
  { value: 'urgent', label: language === 'ar' ? 'عاجلة' : 'Urgent' },
];

// ── Main Component ────────────────────────────────────────────────────────────

const AdminMessages = () => {
  const { language, isRTL } = useLanguage();
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { socket, connected, joinThread, leaveThread } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    threads, inboxLoading, activeThreadId, messages, loading, loadingOlder,
    hasMoreOlder, sending, typingUsers,
  } = useSelector(s => s.messages);

  const [search,       setSearch]       = useState('');
  const [filter,       setFilter]       = useState('all'); // all | unread | urgent
  const [msgText,      setMsgText]      = useState('');
  const [noteText,     setNoteText]     = useState('');
  const [showNote,     setShowNote]     = useState(false);
  const [savingNote,   setSavingNote]   = useState(false);
  const [notes,        setNotes]        = useState({});  // threadId → [notes]
  const [isMobile,     setIsMobile]     = useState(false);
  const [mobileView,   setMobileView]   = useState('list');
  const [admins,       setAdmins]       = useState([]);
  const [pendingFile,  setPendingFile]  = useState(null);
  const [attachError,  setAttachError]  = useState('');
  const [nearBottom,   setNearBottom]   = useState(true);
  const [newMsgBanner, setNewMsgBanner] = useState(false);
  const [savingTriage, setSavingTriage] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollRef       = useRef(null);
  const textareaRef    = useRef(null);
  const fileInputRef   = useRef(null);
  const typingTimeoutRef = useRef(null);
  const deepLinkHandled = useRef(false);

  const font = FONT(isRTL);

  // ── Responsive ────────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Load all threads (admin sees all) + the admin roster for assignment ───
  useEffect(() => {
    dispatch(fetchInbox());
    api.get('/users', { params: { role: 'ADMIN,SUPER_ADMIN', limit: 100 } })
      .then(res => setAdmins(res.data?.users || []))
      .catch(() => setAdmins([]));
  }, [dispatch]);

  const sortedThreads = useMemo(() => {
    return [...threads].sort((a, b) => {
      if ((b.isPinned ? 1 : 0) !== (a.isPinned ? 1 : 0)) return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
      if ((b.unreadCount || 0) !== (a.unreadCount || 0))
        return (b.unreadCount || 0) - (a.unreadCount || 0);
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }, [threads]);

  const activeThread = useMemo(
    () => threads.find(t => t._id === activeThreadId),
    [threads, activeThreadId]
  );

  // `thread.participants` is already populated with everything the context
  // panel needs (fullName/email/phoneNumber/companyName/customerStatus/
  // leadScore — see server/controllers/messageController.js getThreads),
  // so the "client" is just whichever participant isn't an admin. This used
  // to fetch `/users/${thread.clientId || thread.userId}` — fields that
  // don't exist anywhere on the MessageThread schema (only `participants`
  // does), so that fetch never ran and the panel always showed "No client
  // data" regardless of how many real conversations existed.
  const clientInfo = useMemo(() => {
    if (!activeThread?.participants) return null;
    return activeThread.participants.find(p => p.role !== 'ADMIN' && p.role !== 'SUPER_ADMIN') || null;
  }, [activeThread]);

  const loadThreadExtras = useCallback(async (thread) => {
    try {
      const res = await api.get(`/messages/threads/${thread._id}/notes`);
      const threadNotes = res.data?.notes || [];
      setNotes(prev => ({ ...prev, [thread._id]: threadNotes }));
    } catch {
      setNotes(prev => ({ ...prev, [thread._id]: prev[thread._id] || [] }));
    }
  }, []);

  // ── Select thread ─────────────────────────────────────────────────────────
  const openThread = useCallback((threadId, { keepQueryParam = false } = {}) => {
    if (!threadId) return;
    dispatch(fetchThreadMessages(threadId));
    dispatch(markThreadRead(threadId));
    dispatch(markThreadReadLocal(threadId));
    if (isMobile) setMobileView('chat');
    if (!keepQueryParam) {
      setSearchParams(prev => { const n = new URLSearchParams(prev); n.set('thread', threadId); return n; }, { replace: true });
    }
    const thread = threads.find(t => t._id === threadId);
    if (thread) loadThreadExtras(thread);
  }, [dispatch, isMobile, setSearchParams, threads, loadThreadExtras]);

  const handleSelectThread = useCallback((thread) => openThread(thread._id), [openThread]);

  // ── Deep link (?thread=<id>) — notification links land here ──────────────
  useEffect(() => {
    if (inboxLoading || deepLinkHandled.current) return;
    const requested = searchParams.get('thread');
    if (requested && threads.some(t => t._id === requested)) {
      deepLinkHandled.current = true;
      openThread(requested, { keepQueryParam: true });
      return;
    }
    if (requested) {
      setSearchParams(prev => { const n = new URLSearchParams(prev); n.delete('thread'); return n; }, { replace: true });
    }
    if (sortedThreads.length > 0 && !activeThreadId) {
      openThread(sortedThreads[0]._id, { keepQueryParam: true });
    }
    deepLinkHandled.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inboxLoading, sortedThreads]);

  // ── Socket: thread room + live events ─────────────────────────────────────
  useEffect(() => {
    if (!socket || !activeThreadId) return;
    joinThread(activeThreadId);
    return () => leaveThread(activeThreadId);
  }, [socket, activeThreadId, joinThread, leaveThread]);

  useEffect(() => {
    if (!socket) return;
    const onMessage = (message) => {
      dispatch(pushIncomingMessage({ message, threadId: message.threadId }));
      if (message.threadId === activeThreadId && (message.sender?._id || message.sender) !== user?._id && !nearBottom) {
        setNewMsgBanner(true);
      }
    };
    const onTyping = ({ userId, threadId, typing }) => {
      if (threadId === activeThreadId && userId !== user?._id) dispatch(setUserTyping({ userId, typing }));
    };
    const onThreadRead = ({ threadId, readBy }) => {
      if (threadId === activeThreadId) dispatch(markMessagesReadByOthers({ threadId, readerId: readBy }));
    };
    const onCustomerMessage = () => dispatch(fetchInbox());
    const onNewThread       = () => dispatch(fetchInbox());
    const onReconnected     = () => {
      dispatch(fetchInbox());
      if (activeThreadId) dispatch(fetchThreadMessages(activeThreadId));
    };
    socket.on('message-received', onMessage);
    socket.on('user-typing', onTyping);
    socket.on('thread-read', onThreadRead);
    socket.on('customer-message', onCustomerMessage);
    socket.on('new-thread', onNewThread);
    socket.on('client-reconnected', onReconnected);
    return () => {
      socket.off('message-received', onMessage);
      socket.off('user-typing', onTyping);
      socket.off('thread-read', onThreadRead);
      socket.off('customer-message', onCustomerMessage);
      socket.off('new-thread', onNewThread);
      socket.off('client-reconnected', onReconnected);
    };
  }, [socket, activeThreadId, user?._id, nearBottom, dispatch]);

  // ── Scroll tracking + older-history pagination ────────────────────────────
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

  // ── Textarea resize ───────────────────────────────────────────────────────
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + 'px';
    }
  }, [msgText]);

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
  const someoneTyping = Object.keys(typingUsers).length > 0;

  const totalUnread = useMemo(
    () => threads.reduce((acc, t) => acc + (t.unreadCount || 0), 0),
    [threads]
  );
  const urgentCount = useMemo(
    () => threads.filter(t => getReplyAge(t.updatedAt, language)?.urgent).length,
    [threads, language]
  );

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
    setPendingFile({ file, name: file.name, size: file.size });
  };

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
    if ((!content && !pendingFile) || !activeThreadId || sending) return;

    const tempId = genTempId();
    setMsgText('');
    const filePayload = pendingFile;
    setPendingFile(null);

    dispatch(addOptimisticMessage({
      tempId, threadId: activeThreadId,
      message: { content, sender: user, createdAt: new Date().toISOString(), attachments: [] },
    }));

    let attachmentDocs = [];
    if (filePayload) {
      try {
        const uploaded = await dispatch(uploadAttachment({ file: filePayload.file })).unwrap();
        attachmentDocs = [uploaded];
      } catch { /* text portion still sends below */ }
    }

    await doSendToThread(activeThreadId, content, tempId, attachmentDocs);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [dispatch, msgText, pendingFile, activeThreadId, sending, user, doSendToThread]);

  const handleRetry = useCallback((message) => {
    dispatch(retryFailedMessage(message._id));
    doSendToThread(activeThreadId, message.content, message._id, message.attachments);
  }, [dispatch, activeThreadId, doSendToThread]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    else emitTyping();
  }, [handleSend, emitTyping]);

  // ── Save internal note (real backend now — see server/controllers/messageController.js) ─
  const handleSaveNote = useCallback(async () => {
    if (!noteText.trim() || !activeThreadId) return;
    setSavingNote(true);
    try {
      const res = await api.post(`/messages/threads/${activeThreadId}/notes`, { content: noteText.trim() });
      setNotes(prev => ({ ...prev, [activeThreadId]: res.data?.notes || prev[activeThreadId] }));
      setNoteText('');
    } catch {
      // Leave the text in the box and let the user retry — silently
      // discarding an admin-only note is worse than an extra click.
    } finally {
      setSavingNote(false);
    }
  }, [activeThreadId, noteText]);

  // ── Triage actions (status / priority / pin / archive / assign) ──────────
  const patchThread = useCallback(async (path, body) => {
    if (!activeThreadId) return;
    setSavingTriage(true);
    try {
      await api.patch(`/messages/threads/${activeThreadId}/${path}`, body);
      dispatch(fetchInbox());
    } catch { /* transient — inbox refresh on next load will reconcile */ }
    finally { setSavingTriage(false); }
  }, [activeThreadId, dispatch]);

  // ── Message bubble ────────────────────────────────────────────────────────
  const renderAttachment = (att, isAdmin) => {
    if (!att || typeof att !== 'object') return null;
    const isImage = att.mimeType?.startsWith('image/');
    return (
      <a
        key={att._id} href={att.url} target="_blank" rel="noopener noreferrer" download={att.originalName}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, marginTop: 6,
          padding: '8px 10px', borderRadius: 9, textDecoration: 'none', maxWidth: 260,
          background: isAdmin ? 'rgba(255,255,255,0.12)' : TK.bgSubtle,
          border: `1px solid ${isAdmin ? 'rgba(255,255,255,0.2)' : TK.border}`,
          color: isAdmin ? '#fff' : TK.text,
        }}
      >
        {isImage
          ? <img src={att.url} alt={att.originalName} style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
          : <FileText style={{ width: 18, height: 18, flexShrink: 0, opacity: 0.75 }} />}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 11.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.originalName}</div>
          <div style={{ fontSize: 10, opacity: 0.65 }}>{formatBytes(att.size)}</div>
        </div>
        <Download style={{ width: 13, height: 13, flexShrink: 0, opacity: 0.65 }} />
      </a>
    );
  };

  const renderMessage = (msg, idx, items) => {
    const isAdmin = msg.sender?.role === 'ADMIN' || msg.sender?.role === 'SUPER_ADMIN'
      || msg.sender?._id === user?._id || msg.sender === user?._id;
    const prev     = idx > 0 && items[idx - 1]?.type === 'message' ? items[idx - 1].data : null;
    const next     = idx < items.length - 1 && items[idx + 1]?.type === 'message' ? items[idx + 1].data : null;
    const prevRole = prev && (prev.sender?.role === 'ADMIN' || prev.sender?.role === 'SUPER_ADMIN' || prev.sender?._id === user?._id || prev.sender === user?._id);
    const nextRole = next && (next.sender?.role === 'ADMIN' || next.sender?.role === 'SUPER_ADMIN' || next.sender?._id === user?._id || next.sender === user?._id);
    const isFirst  = prevRole !== isAdmin;
    const isLast   = nextRole !== isAdmin;
    const isFailed = msg.status === 'failed';
    const isSending = msg.status === 'sending';

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
          // `%` max-width here would resolve against this bubble's shrink-to-fit
          // flex row (an indeterminate containing block), collapsing to ~0 in
          // Chromium and word-wrapping every couple of characters — see the
          // matching note in pages/Messages.jsx. `vw` sidesteps it.
          maxWidth: 'min(70vw, 540px)',
          padding: '9px 13px',
          borderRadius: isAdmin ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          background: isFailed ? 'rgba(220,38,38,0.06)' : (isAdmin ? TK.ink : TK.surface),
          border: isFailed ? '1px solid rgba(220,38,38,0.3)' : (isAdmin ? 'none' : `1px solid ${TK.border}`),
          color: isFailed ? TK.red : (isAdmin ? '#fff' : TK.text),
          fontSize: 13.5, lineHeight: 1.55, wordBreak: 'break-word',
          opacity: isSending ? 0.7 : 1,
        }}>
          {renderMessageText(msg.content)}
          {(msg.attachments || []).map(att => renderAttachment(att, isAdmin))}
        </div>

        {isFailed && (
          <button
            onClick={() => handleRetry(msg)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, background: 'none', border: 'none', cursor: 'pointer', color: TK.red, fontSize: 10.5, fontWeight: 600, padding: 0, fontFamily: font }}
          >
            <RotateCw style={{ width: 10, height: 10 }} />
            {language === 'ar' ? 'فشل الإرسال — إعادة المحاولة' : 'Failed to send — Retry'}
          </button>
        )}

        {isLast && !isFailed && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4, marginTop: 3,
            paddingLeft: isRTL ? 0 : 3, paddingRight: isRTL ? 3 : 0,
          }}>
            {isSending
              ? <Loader2 style={{ width: 10, height: 10, color: TK.textLight, animation: 'spin 0.9s linear infinite' }} />
              : <span style={{ fontSize: 10, color: TK.textLight }}>{fmtMsgTime(msg.createdAt, language)}</span>}
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
            {!connected && (
              <span title={language === 'ar' ? 'غير متصل — إعادة الاتصال...' : 'Offline — reconnecting…'} style={{ display: 'flex' }}>
                <WifiOff style={{ width: 13, height: 13, color: TK.textLight }} />
              </span>
            )}
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
              {search || filter !== 'all' ? (language === 'ar' ? 'لا نتائج' : 'No results') : (language === 'ar' ? 'لا محادثات' : 'No conversations')}
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
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 12.5, fontWeight: unread ? 600 : 500,
                    color: TK.text, flex: 1, minWidth: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {thread.isPinned && <Pin style={{ width: 10, height: 10, color: TK.accent, flexShrink: 0 }} />}
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
              <div style={{ fontSize: 11, color: TK.textMuted, fontFamily: font }}>
                {someoneTyping
                  ? <span style={{ color: TK.accent, fontWeight: 500 }}>{language === 'ar' ? 'يكتب الآن...' : 'Typing…'}</span>
                  : (clientInfo ? `${clientInfo.email || ''}${clientInfo.email && clientInfo.phoneNumber ? ' · ' : ''}${clientInfo.phoneNumber || ''}` : '')}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
              {clientInfo?.phoneNumber && (
                <a
                  href={`https://wa.me/${clientInfo.phoneNumber.replace(/\D/g,'')}`}
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
                onClick={() => patchThread('pin', { pinned: !activeThread.isPinned })}
                disabled={savingTriage}
                title={activeThread.isPinned ? (language === 'ar' ? 'إلغاء التثبيت' : 'Unpin') : (language === 'ar' ? 'تثبيت' : 'Pin')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 28, height: 28, borderRadius: 7,
                  background: activeThread.isPinned ? TK.accentBg : 'transparent',
                  border: `1px solid ${activeThread.isPinned ? TK.accent : TK.border}`,
                  color: activeThread.isPinned ? TK.accent : TK.textMuted, cursor: 'pointer',
                }}
              >
                {activeThread.isPinned ? <PinOff style={{ width: 12, height: 12 }} /> : <Pin style={{ width: 12, height: 12 }} />}
              </button>
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
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', position: 'relative' }}>
            <div ref={scrollRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', padding: '18px 18px 8px' }}>
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
                  {loadingOlder && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                      <Loader2 style={{ width: 16, height: 16, color: TK.textLight, animation: 'spin 0.8s linear infinite' }} />
                    </div>
                  )}
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

                {(notes[activeThreadId] || []).length > 0 && (
                  <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
                    {(notes[activeThreadId] || []).map((note, i) => (
                      <div key={note._id || i} style={{
                        background: TK.amberBg, border: `1px solid ${TK.amberBd}`,
                        borderRadius: 8, padding: '8px 10px',
                      }}>
                        <div style={{ fontSize: 12.5, color: TK.text, fontFamily: font, lineHeight: 1.5 }}>
                          {note.content}
                        </div>
                        <div style={{ fontSize: 10, color: TK.amber, marginTop: 4, fontFamily: font }}>
                          {(note.author?.fullName || note.author) || 'Admin'} · {fmtTime(note.createdAt, language)}
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
                {attachError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 11, color: TK.red, fontFamily: font }}>
                    <AlertCircle style={{ width: 12, height: 12 }} /> {attachError}
                  </div>
                )}
                {pendingFile && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '7px 10px', borderRadius: 9, background: TK.bgSubtle, border: `1px solid ${TK.border}` }}>
                    <FileText style={{ width: 15, height: 15, color: TK.text, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11.5, color: TK.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pendingFile.name}</div>
                      <div style={{ fontSize: 10, color: TK.textLight }}>{formatBytes(pendingFile.size)}</div>
                    </div>
                    <button onClick={() => setPendingFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TK.textLight, display: 'flex' }} aria-label={language === 'ar' ? 'إزالة الملف' : 'Remove file'}>
                      <X style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                )}
                {/* DOM order [input, send] with plain `row` (no manual reverse)
                    so the send button sits at the inline-end in both directions
                    via the page's inherited `direction` — same pattern as the
                    customer composer in pages/Messages.jsx. `Composer`/
                    `ComposerTextArea` (admin-ui) are the shared shell — see
                    their doc comment in Primitives.jsx for why a manual
                    per-page border/focus implementation here used to grow a
                    second frame around the textarea on focus. */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                  <Composer style={{ borderRadius: 12, padding: '9px 11px' }}>
                    <input ref={fileInputRef} type="file" onChange={handlePickFile} hidden accept="image/*,.pdf,.doc,.docx,.txt" />
                    <ComposerTextArea
                      ref={textareaRef}
                      value={msgText}
                      onChange={e => setMsgText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={language === 'ar' ? 'اكتب ردك للعميل...' : 'Write your reply to client...'}
                      style={{ fontFamily: font, color: TK.text, maxHeight: 140, overflowY: 'auto' }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      aria-label={language === 'ar' ? 'إرفاق ملف' : 'Attach file'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: pendingFile ? TK.text : TK.textLight, display: 'flex', padding: '4px 2px', flexShrink: 0 }}
                    >
                      <Paperclip style={{ width: 15, height: 15 }} />
                    </button>
                  </Composer>
                  <button
                    onClick={handleSend}
                    disabled={(!msgText.trim() && !pendingFile) || sending}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                      height: 40, padding: '0 14px', borderRadius: 10,
                      background: ((msgText.trim() || pendingFile) && !sending) ? TK.ink : TK.bgSubtle,
                      border: 'none', cursor: ((msgText.trim() || pendingFile) && !sending) ? 'pointer' : 'default',
                      color: ((msgText.trim() || pendingFile) && !sending) ? '#fff' : TK.textLight,
                      fontSize: 12.5, fontWeight: 600, fontFamily: font,
                      transition: 'background 0.15s',
                    }}
                  >
                    {sending ? (
                      <Loader2 style={{ width: 13, height: 13, animation: 'spin 0.75s linear infinite' }} />
                    ) : (
                      <Send style={{ width: 13, height: 13, transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                    )}
                    <span>{language === 'ar' ? 'إرسال' : 'Send'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Context panel — collapsible on desktop via width; a secondary
              triage toolset, not the primary chat focus. Hidden entirely on
              tablet/mobile (one focused screen at a time). */}
          {!isMobile && activeThread && (
            <div style={{
              width: 250, flexShrink: 0, borderLeft: isRTL ? 'none' : `1px solid ${TK.border}`,
              borderRight: isRTL ? `1px solid ${TK.border}` : 'none',
              background: TK.surface, overflowY: 'auto', padding: '16px 14px',
            }}>
              {/* Triage controls */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: TK.textLight, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, fontFamily: font }}>
                  {language === 'ar' ? 'الحالة والأولوية' : 'Status & Priority'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Select
                    value={activeThread.status}
                    onChange={e => patchThread('status', { status: e.target.value })}
                    disabled={savingTriage}
                    options={STATUS_OPTS(language)}
                  />
                  <Select
                    value={activeThread.priority}
                    onChange={e => patchThread('priority', { priority: e.target.value })}
                    disabled={savingTriage}
                    options={PRIORITY_OPTS(language)}
                  />
                  <Select
                    value={activeThread.assignedTo?._id || ''}
                    onChange={e => patchThread('assign', { assignedTo: e.target.value || null })}
                    disabled={savingTriage}
                    options={[
                      { value: '', label: language === 'ar' ? 'غير مسند' : 'Unassigned' },
                      ...admins.map(a => ({ value: a._id, label: a.fullName || a.email })),
                    ]}
                  />
                  <button
                    onClick={() => patchThread('archive', { archived: !activeThread.isArchived })}
                    disabled={savingTriage}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '8px 10px', borderRadius: 8, border: `1px solid ${TK.border}`,
                      background: 'transparent', color: TK.textMuted, cursor: 'pointer',
                      fontSize: 11.5, fontWeight: 500, fontFamily: font,
                    }}
                  >
                    {activeThread.isArchived
                      ? <><ArchiveRestore style={{ width: 12, height: 12 }} />{language === 'ar' ? 'إلغاء الأرشفة' : 'Unarchive'}</>
                      : <><Archive style={{ width: 12, height: 12 }} />{language === 'ar' ? 'أرشفة' : 'Archive'}</>}
                  </button>
                </div>
              </div>

              {/* Client info */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: TK.textLight, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, fontFamily: font }}>
                  {language === 'ar' ? 'معلومات العميل' : 'Client'}
                </div>
                {clientInfo ? (
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
                    {clientInfo.phoneNumber && (
                      <a href={`https://wa.me/${clientInfo.phoneNumber.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 10px', borderRadius: 7, marginBottom: 8,
                        background: 'rgba(37,211,102,0.07)', border: '1px solid rgba(37,211,102,0.18)',
                        textDecoration: 'none',
                      }}>
                        <WaIcon />
                        <span style={{ fontSize: 11, color: TK.text, fontFamily: font, fontWeight: 500 }}>{clientInfo.phoneNumber}</span>
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

export default AdminMessages;
