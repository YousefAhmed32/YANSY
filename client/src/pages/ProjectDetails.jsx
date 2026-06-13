import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Send, FileText, CheckCircle2, Clock,
  Loader2, Plus, X, ChevronDown, AlertCircle, MessageSquare
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProjectById, updateProjectProgress, addProjectUpdate } from '../store/projectSlice';
import { fetchThreadByProject, sendMessage, addMessage, createThreadAndMessage } from '../store/messageSlice';
import { io } from 'socket.io-client';
import FileUpload from '../components/FileUpload';

// ─── tiny helpers ────────────────────────────────────────────────────────────

const PROGRESS_STEPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

const getProgressColor = (p, status) => {
  if (status === 'cancelled')               return 'text-red-400 bg-red-500/20 border-red-500/30';
  if (status === 'delivered' || p === 100)  return 'text-[#d4af37] bg-[#d4af37]/20 border-[#d4af37]/30';
  if (p >= 80)                              return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
  if (p > 0)                                return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
  return 'text-white/60 bg-white/10 border-white/20';
};

const getBarColor = (p) => {
  if (p === 100) return 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f]';
  if (p >= 80)   return 'bg-gradient-to-r from-yellow-500 to-yellow-400';
  return         'bg-gradient-to-r from-blue-500 to-blue-400';
};

const getStatusText = (p, status) => {
  if (status === 'cancelled')              return 'Cancelled';
  if (status === 'delivered' || p === 100) return 'Delivered ✓';
  if (p >= 80)                             return 'Near Completion';
  if (p > 0)                               return 'In Progress';
  return 'Pending';
};

// ─── MessageBubble ───────────────────────────────────────────────────────────

const MessageBubble = ({ message, currentUserId }) => {
  const isOwn = message.sender?._id === currentUserId || message.sender === currentUserId;
  const time  = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const name  = message.sender?.fullName || 'Unknown';
  const role  = message.sender?.role;

  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-light ${
        isOwn ? 'bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30' : 'bg-white/10 text-white/60 border border-white/10'
      }`}>
        {name.charAt(0).toUpperCase()}
      </div>

      <div className={`flex flex-col gap-1 max-w-[72%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Meta */}
        <div className={`flex items-center gap-2 text-xs text-white/40 font-light ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span>{name}</span>
          {role === 'ADMIN' && (
            <span className="px-1.5 py-0.5 border border-[#d4af37]/40 text-[#d4af37] rounded-sm text-[10px] tracking-widest uppercase">
              Admin
            </span>
          )}
          <span>{time}</span>
        </div>

        {/* Bubble */}
        <div className={`px-4 py-3 text-sm font-light leading-relaxed whitespace-pre-wrap ${
          isOwn
            ? 'bg-[#d4af37]/15 border border-[#d4af37]/25 text-white/90'
            : 'bg-white/5 border border-white/10 text-white/80'
        }`}>
          {message.content}

          {/* Attachments */}
          {message.attachments?.length > 0 && (
            <div className="mt-2 space-y-1 pt-2 border-t border-white/10">
              {message.attachments.map((f) => (
                <a
                  key={f._id}
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[10px] text-[#d4af37] hover:underline"
                >
                  <FileText className="w-3 h-3" />
                  {f.originalName}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── DateDivider ─────────────────────────────────────────────────────────────

const DateDivider = ({ date }) => (
  <div className="flex items-center gap-3 my-4">
    <div className="flex-1 h-px bg-white/10" />
    <span className="text-xs text-white/30 font-light tracking-wide">
      {new Date(date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
    </span>
    <div className="flex-1 h-px bg-white/10" />
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const ProjectDetails = () => {
  const { id }            = useParams();
  const [searchParams]    = useSearchParams();
  const activeTab         = searchParams.get('tab') || 'overview';
  const { t }             = useTranslation();
  const navigate          = useNavigate();
  const { user }          = useSelector((s) => s.auth);
  const { currentProject, loading } = useSelector((s) => s.projects);
  const { currentThread, messages, loading: messagesLoading } = useSelector((s) => s.messages);
  const dispatch          = useDispatch();

  const [updateTitle,    setUpdateTitle]    = useState('');
  const [updateContent,  setUpdateContent]  = useState('');
  const [uploadedFiles,  setUploadedFiles]  = useState([]);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [sending,        setSending]        = useState(false);
  const [socketReady,    setSocketReady]    = useState(false);

  const socketRef      = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  // ── init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    dispatch(fetchProjectById(id));
    dispatch(fetchThreadByProject(id)).catch(() => {});
  }, [id, dispatch]);

  // auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // socket
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    const url = import.meta.env.VITE_SOCKET_URL ||
                import.meta.env.VITE_API_URL?.replace('/api', '') ||
                'http://localhost:5000';

    const socket = io(url, { auth: { token }, transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      socket.emit('join', user._id);
      if (id) socket.emit('join-project', id);
      setSocketReady(true);
    });

    socket.on('disconnect', () => setSocketReady(false));

    socket.on('project-updated',          (d) => { if (d.project?._id === id) dispatch(fetchProjectById(id)); });
    socket.on('project-progress-updated', (d) => { if (d.project?._id === id) dispatch(fetchProjectById(id)); });
    socket.on('project-update-added',     (d) => { if (d.project?._id === id) dispatch(fetchProjectById(id)); });

    socket.on('message-received', (d) => {
      if (d.message && currentThread?._id === d.message.threadId) {
        dispatch(addMessage(d.message));
      }
    });
    socket.on('project-message', (d) => {
      if (d.message && currentThread?._id === d.message.threadId) {
        dispatch(addMessage(d.message));
      }
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); setSocketReady(false); };
  }, [id, user, dispatch]);

  // join thread room when thread loads
  useEffect(() => {
    if (socketRef.current?.connected && currentThread?._id) {
      socketRef.current.emit('join-thread', currentThread._id);
    }
  }, [currentThread]);

  // focus input when switching to messages tab
  useEffect(() => {
    if (activeTab === 'messages') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeTab]);

  // ── actions ───────────────────────────────────────────────────────────────

  const handleProgressUpdate = async (step) => {
    if (user?.role !== 'ADMIN') return;
    try {
      setSubmitting(true);
      await dispatch(updateProjectProgress({ projectId: id, progress: step })).unwrap();
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddUpdate = async () => {
    if (!updateContent.trim()) return;
    try {
      setSubmitting(true);
      await dispatch(addProjectUpdate({
        projectId:   id,
        title:       updateTitle || 'Project Update',
        content:     updateContent,
        attachments: uploadedFiles.map((f) => f._id),
      })).unwrap();
      setUpdateTitle(''); setUpdateContent(''); setUploadedFiles([]); setShowUpdateForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = useCallback(async () => {
    const text = messageContent.trim();
    if (!text || sending) return;

    try {
      setSending(true);
      setMessageContent('');

      if (!currentThread) {
        // determine the other party
        const recipientId =
          currentProject?.client?._id === user._id
            ? (currentProject?.assignedBy?._id || currentProject?.assignedTo?._id)
            : currentProject?.client?._id;

        if (!recipientId) {
          // If recipient can't be determined, let the backend handle it via project
          await dispatch(createThreadAndMessage({ recipient: null, project: id, content: text, attachments: [] })).unwrap();
          return;
        }

        await dispatch(createThreadAndMessage({ recipient: recipientId, project: id, content: text, attachments: [] })).unwrap();
        return;
      }

      await dispatch(sendMessage({ threadId: currentThread._id, content: text, attachments: [] })).unwrap();
    } catch (err) {
      console.error('Send message failed:', err);
      setMessageContent(text); // restore on failure
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [messageContent, sending, currentThread, currentProject, user, id, dispatch]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  // ── group messages by date ────────────────────────────────────────────────

  const groupedMessages = (() => {
    if (!messages?.length) return [];
    const groups = [];
    let lastDate = null;
    messages.forEach((msg) => {
      const d = new Date(msg.createdAt).toDateString();
      if (d !== lastDate) { groups.push({ type: 'date', date: msg.createdAt }); lastDate = d; }
      groups.push({ type: 'message', message: msg });
    });
    return groups;
  })();

  // ── loading / not found ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="w-10 h-10 border-2 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-black text-white px-6 py-8">
        <button onClick={() => navigate('/app/projects')} className="mb-6 inline-flex items-center text-white/60 hover:text-[#d4af37] transition-colors gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </button>
        <div className="bg-white/5 border border-white/10 text-white/70 px-6 py-4 text-sm font-light">Project not found</div>
      </div>
    );
  }

  const progress = currentProject.progress || 0;

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">

        {/* ── Back + Title ── */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/app/projects')}
            className="mb-5 inline-flex items-center gap-2 text-white/50 hover:text-[#d4af37] transition-colors duration-300 text-sm font-light"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common.back', 'Back to Projects')}
          </button>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-2 text-white/90 leading-tight">
                {currentProject.title}
              </h1>
              {currentProject.description && (
                <p className="text-base font-light text-white/50 leading-relaxed">
                  {currentProject.description}
                </p>
              )}
            </div>
            {/* Socket indicator */}
            <div className={`flex-shrink-0 flex items-center gap-2 text-xs font-light ${socketReady ? 'text-green-400/60' : 'text-white/30'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${socketReady ? 'bg-green-400/60' : 'bg-white/20'}`} />
              {socketReady ? 'Live' : 'Offline'}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-8 border-b border-white/10">
          {['overview', 'messages'].map((tab) => (
            <button
              key={tab}
              onClick={() => navigate(`/app/projects/${id}?tab=${tab}`)}
              className={`relative px-6 py-3 text-xs font-light tracking-widest uppercase transition-colors duration-300 ${
                activeTab === tab ? 'text-[#d4af37]' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {tab === 'messages' && (
                <span className="mr-2">
                  <MessageSquare className="inline w-3.5 h-3.5 mb-0.5" />
                </span>
              )}
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-[#d4af37]" />
              )}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════ OVERVIEW TAB ══════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">

            {/* Progress card */}
            <div className="bg-white/5 border border-white/10 p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-light tracking-wide text-white/80">
                  {t('projects.progress', 'Progress')}
                </h2>
                <span className={`inline-block px-3 py-1.5 text-xs font-light tracking-widest uppercase border ${getProgressColor(progress, currentProject.status)}`}>
                  {getStatusText(progress, currentProject.status)}
                </span>
              </div>

              {/* Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/50 font-light">Completion</span>
                  <span className="text-white/90 font-light tabular-nums">{progress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${getBarColor(progress)}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Admin controls */}
              {user?.role === 'ADMIN' && (
                <div>
                  <p className="text-xs text-white/40 font-light tracking-widest uppercase mb-3">Set Progress</p>
                  <div className="flex flex-wrap gap-2">
                    {PROGRESS_STEPS.map((step) => (
                      <button
                        key={step}
                        onClick={() => handleProgressUpdate(step)}
                        disabled={submitting}
                        className={`px-3 py-1.5 text-xs font-light tracking-wide uppercase border transition-all duration-300 ${
                          progress === step
                            ? 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/10'
                            : 'border-white/15 text-white/50 hover:border-[#d4af37]/60 hover:text-[#d4af37]/60'
                        } disabled:opacity-40`}
                      >
                        {step}%
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Updates */}
            <div className="bg-white/5 border border-white/10 p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-light tracking-wide text-white/80">
                  {t('projects.updates', 'Updates')}
                </h2>
                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => setShowUpdateForm(!showUpdateForm)}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-[#d4af37] text-[#d4af37] text-xs font-light tracking-widest uppercase hover:bg-[#d4af37] hover:text-black transition-all duration-500"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Update
                  </button>
                )}
              </div>

              {/* Update form */}
              {showUpdateForm && user?.role === 'ADMIN' && (
                <div className="mb-6 p-5 bg-black/40 border border-white/10 space-y-4">
                  <input
                    type="text"
                    placeholder="Update title (optional)"
                    value={updateTitle}
                    onChange={(e) => setUpdateTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border-b border-white/15 text-white text-sm placeholder-white/25 focus:outline-none focus:border-[#d4af37] transition-colors font-light"
                  />
                  <textarea
                    placeholder="What happened? Describe the progress made..."
                    value={updateContent}
                    onChange={(e) => setUpdateContent(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 border-b border-white/15 text-white text-sm placeholder-white/25 focus:outline-none focus:border-[#d4af37] transition-colors font-light resize-none"
                  />
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <FileUpload
                      projectId={id}
                      onFilesUploaded={(files) => setUploadedFiles((prev) => [...prev, ...files])}
                      multiple
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowUpdateForm(false); setUpdateTitle(''); setUpdateContent(''); setUploadedFiles([]); }}
                        className="px-4 py-2 border border-white/15 text-white/50 hover:border-white/30 transition-colors text-xs font-light"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddUpdate}
                        disabled={submitting || !updateContent.trim()}
                        className="px-5 py-2 bg-[#d4af37] text-black hover:bg-[#f4d03f] transition-colors text-xs font-light tracking-widest uppercase disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Posting...' : 'Post Update'}
                      </button>
                    </div>
                  </div>

                  {/* Uploaded files preview */}
                  {uploadedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {uploadedFiles.map((f) => (
                        <div key={f._id} className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 text-xs text-white/50">
                          <FileText className="w-3 h-3" />
                          {f.originalName}
                          <button onClick={() => setUploadedFiles((p) => p.filter((u) => u._id !== f._id))}>
                            <X className="w-3 h-3 hover:text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Updates list */}
              {currentProject.updates?.length > 0 ? (
                <div className="space-y-4">
                  {[...currentProject.updates].reverse().map((update, i) => (
                    <div key={i} className="p-5 bg-black/30 border border-white/10">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-base font-light text-white/90 mb-1">
                            {update.title || 'Project Update'}
                          </h3>
                          <p className="text-xs text-white/40 font-light">
                            {update.postedBy?.fullName || 'Admin'} · {new Date(update.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-white/70 font-light whitespace-pre-wrap leading-relaxed mb-3">
                        {update.content}
                      </p>
                      {update.attachments?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/10">
                          {update.attachments.map((file) => (
                            <a
                              key={file._id}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 hover:border-[#d4af37] transition-colors text-xs text-white/60 hover:text-[#d4af37]"
                            >
                              <FileText className="h-3 w-3" />
                              {file.originalName}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/30 font-light">{t('projects.noUpdates', 'No updates yet.')}</p>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════ MESSAGES TAB ══════════════════════════ */}
        {activeTab === 'messages' && (
          <div
            className="bg-white/5 border border-white/10 flex flex-col"
            style={{ height: 'calc(100vh - 280px)', minHeight: '480px' }}
          >
            {/* Chat header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-white/40" />
                <h2 className="text-sm font-light tracking-widest uppercase text-white/60">
                  {t('messages.title', 'Messages')}
                </h2>
                {currentThread && (
                  <span className="text-xs text-white/30 font-light">
                    · {messages.length} message{messages.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className={`flex items-center gap-1.5 text-xs font-light ${socketReady ? 'text-green-400/50' : 'text-white/25'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${socketReady ? 'bg-green-400/50 animate-pulse' : 'bg-white/20'}`} />
                {socketReady ? 'Connected' : 'Reconnecting...'}
              </div>
            </div>

            {/* Messages area */}
            {messagesLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3" id="messages-scroll">
                {groupedMessages.length === 0 ? (
                  /* ── Empty state: show prompt to start chat ── */
                  <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                      <MessageSquare className="w-6 h-6 text-white/25" />
                    </div>
                    <p className="text-sm font-light text-white/40 mb-1">
                      {user?.role === 'ADMIN'
                        ? 'Send the client their first project update'
                        : 'Ask a question or share feedback about your project'}
                    </p>
                    <p className="text-xs font-light text-white/25">
                      Messages are private and only visible to you and the team
                    </p>
                  </div>
                ) : (
                  groupedMessages.map((item, idx) =>
                    item.type === 'date'
                      ? <DateDivider key={`date-${idx}`} date={item.date} />
                      : <MessageBubble key={item.message._id} message={item.message} currentUserId={user._id} />
                  )
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Input bar */}
            <div className="flex-shrink-0 border-t border-white/10 p-4">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      user?.role === 'ADMIN'
                        ? 'Message the client...'
                        : 'Message the team...'
                    }
                    rows={1}
                    style={{ resize: 'none', maxHeight: '120px', overflowY: 'auto' }}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 text-white text-sm placeholder-white/25 focus:outline-none focus:border-[#d4af37]/50 transition-colors duration-300 font-light leading-relaxed"
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                  />
                  <p className="absolute bottom-2 right-3 text-[10px] text-white/20 font-light select-none pointer-events-none">
                    ↵ send · ⇧↵ newline
                  </p>
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageContent.trim() || sending}
                  className="flex-shrink-0 w-11 h-11 flex items-center justify-center bg-[#d4af37] text-black hover:bg-[#f4d03f] transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  {sending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProjectDetails;