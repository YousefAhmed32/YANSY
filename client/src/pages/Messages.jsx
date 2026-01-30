import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Plus, MessageSquare } from 'lucide-react';
import api from '../utils/api';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { gsap } from 'gsap';

const Messages = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewThread, setShowNewThread] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchThreads();
    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread._id);
      joinThread(selectedThread._id);
    }
  }, [selectedThread]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // GSAP entrance animation
  useEffect(() => {
    if (containerRef.current && threads.length > 0) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('[data-thread]'),
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out', stagger: 0.05, delay: 0.2 }
      );
    }
  }, [threads]);

  const initializeSocket = () => {
    const token = localStorage.getItem('token');
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    socketRef.current = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      if (user?._id) {
        socketRef.current.emit('join', user._id);
      }
    });

    socketRef.current.on('message-received', (data) => {
      if (selectedThread && selectedThread._id === data.threadId) {
        setMessages((prev) => [...prev, data]);
      }
      fetchThreads();
    });

    socketRef.current.on('notification', (data) => {
      console.log('Notification:', data);
    });
  };

  const joinThread = (threadId) => {
    if (socketRef.current) {
      socketRef.current.emit('join-thread', threadId);
    }
  };

  const fetchThreads = async () => {
    try {
      const response = await api.get('/messages/threads');
      setThreads(response.data.threads || []);
      if (response.data.threads?.length > 0 && !selectedThread) {
        setSelectedThread(response.data.threads[0]);
      }
    } catch (error) {
      console.error('Failed to fetch threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (threadId) => {
    try {
      const response = await api.get(`/messages/threads/${threadId}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread || sending) return;

    try {
      setSending(true);
      const response = await api.post(
        `/messages/threads/${selectedThread._id}/messages`,
        { content: newMessage.trim() }
      );

      setMessages((prev) => [...prev, response.data.message]);
      setNewMessage('');

      if (socketRef.current) {
        socketRef.current.emit('new-message', {
          threadId: selectedThread._id,
          recipientId: selectedThread.participants.find(
            (p) => p._id !== user._id
          )?._id,
          message: response.data.message,
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!recipientEmail.trim()) return;

    try {
      const response = await api.post('/messages/threads', {
        recipient: recipientEmail,
        subject: 'New Conversation',
        content: newMessage.trim() || 'Hello',
      });

      setThreads((prev) => [response.data.thread, ...prev]);
      setSelectedThread(response.data.thread);
      setShowNewThread(false);
      setRecipientEmail('');
    } catch (error) {
      console.error('Failed to create thread:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getOtherParticipant = (thread) => {
    return thread.participants?.find((p) => p._id !== user._id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-2 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex h-[calc(100vh-180px)] bg-white/5 border border-white/10">
      {/* Threads List */}
      <div className="w-1/3 border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-light tracking-wide uppercase text-white/90">
            {t('messages.inbox')}
          </h2>
          <button
            onClick={() => setShowNewThread(!showNewThread)}
            className="p-2 text-white/60 hover:text-[#d4af37] transition-colors duration-300"
            onMouseEnter={(e) => {
              gsap.to(e.currentTarget, { scale: 1.1, duration: 0.2, ease: 'power2.out' });
            }}
            onMouseLeave={(e) => {
              gsap.to(e.currentTarget, { scale: 1, duration: 0.2, ease: 'power2.out' });
            }}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {showNewThread && (
          <div className="p-4 border-b border-white/10 bg-white/5">
            <form onSubmit={handleCreateThread}>
              <input
                type="text"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder={t('common.email')}
                className="w-full px-4 py-3 bg-white/5 border-b border-white/20 text-white placeholder-white/30 font-light focus:outline-none focus:border-[#d4af37] transition-colors duration-500 mb-3"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 border border-[#d4af37] text-[#d4af37] text-sm font-light tracking-widest uppercase hover:bg-[#d4af37] hover:text-black transition-all duration-500"
              >
                {t('messages.createThread')}
              </button>
            </form>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="p-8 text-center text-white/50 font-light">
              {t('messages.noMessages')}
            </div>
          ) : (
            threads.map((thread) => {
              const other = getOtherParticipant(thread);
              const isSelected = selectedThread?._id === thread._id;
              return (
                <button
                  key={thread._id}
                  data-thread
                  onClick={() => setSelectedThread(thread)}
                  className={`w-full p-6 text-left border-b border-white/10 transition-all duration-300 ${
                    isSelected
                      ? 'bg-white/10 border-l-2 border-l-[#d4af37]'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center">
                    <MessageSquare className={`h-5 w-5 mr-3 ${isSelected ? 'text-[#d4af37]' : 'text-white/40'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-light truncate ${isSelected ? 'text-white/90' : 'text-white/70'}`}>
                        {other?.fullName || other?.email || 'Unknown'}
                      </p>
                      <p className="text-xs font-light text-white/40 truncate mt-1">
                        {thread.subject || 'No subject'}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedThread ? (
          <>
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-light text-white/90">
                {getOtherParticipant(selectedThread)?.fullName || getOtherParticipant(selectedThread)?.email || 'Unknown'}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((message) => {
                const isOwn = message.sender._id === user._id;
                return (
                  <div
                    key={message._id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-6 py-4 ${
                        isOwn
                          ? 'bg-[#d4af37] text-black'
                          : 'bg-white/10 text-white/90 border border-white/20'
                      }`}
                    >
                      <p className="font-light text-sm leading-relaxed">{message.content}</p>
                      <p className={`text-xs mt-2 font-light ${isOwn ? 'text-black/60' : 'text-white/40'}`}>
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-6 border-t border-white/10">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('messages.typeMessage')}
                  className="flex-1 px-4 py-4 bg-white/5 border-b border-white/20 text-white placeholder-white/30 font-light focus:outline-none focus:border-[#d4af37] transition-colors duration-500"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="px-6 py-4 border border-[#d4af37] text-[#d4af37] text-sm font-light tracking-widest uppercase hover:bg-[#d4af37] hover:text-black transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-white/50 font-light">
            {t('messages.selectThread')}
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
