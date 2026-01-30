import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Upload, Send, Image as ImageIcon, FileText, X, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProjectById, updateProjectProgress, addProjectUpdate } from '../store/projectSlice';
import { fetchThreadByProject, sendMessage, addMessage, createThreadAndMessage } from '../store/messageSlice';
import api from '../utils/api';
import { io } from 'socket.io-client';
import FileUpload from '../components/FileUpload';

const ProjectDetails = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { currentProject, loading } = useSelector((state) => state.projects);
  const { currentThread, messages, loading: messagesLoading } = useSelector((state) => state.messages);
  const dispatch = useDispatch();
  
  const [progressValue, setProgressValue] = useState(0);
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateContent, setUpdateContent] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (id) {
      dispatch(fetchProjectById(id));
      dispatch(fetchThreadByProject(id)).catch(() => {
        // Thread might not exist yet, that's okay
      });
    }
    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [id, dispatch]);

  useEffect(() => {
    if (currentProject) {
      setProgressValue(currentProject.progress || 0);
    }
  }, [currentProject]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeSocket = () => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      socket.emit('join', user._id);
      if (id) {
        socket.emit('join-project', id);
        if (currentThread?._id) {
          socket.emit('join-thread', currentThread._id);
        }
      }
    });

    socket.on('project-updated', (data) => {
      if (data.project._id === id) {
        dispatch(fetchProjectById(id));
      }
    });

    socket.on('project-progress-updated', (data) => {
      if (data.project._id === id) {
        dispatch(fetchProjectById(id));
      }
    });

    socket.on('project-update-added', (data) => {
      if (data.project._id === id) {
        dispatch(fetchProjectById(id));
      }
    });

    socket.on('message-received', (data) => {
      if (data.message && currentThread?._id === data.message.threadId) {
        dispatch(addMessage(data.message));
      }
    });

    socket.on('project-message', (data) => {
      if (data.message && currentThread?._id === data.message.threadId) {
        dispatch(addMessage(data.message));
      }
    });

    socketRef.current = socket;
  };

  const handleProgressUpdate = async (newProgress) => {
    if (user?.role !== 'ADMIN') return;
    
    try {
      setSubmitting(true);
      await dispatch(updateProjectProgress({ projectId: id, progress: newProgress })).unwrap();
    } catch (error) {
      console.error('Failed to update progress:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddUpdate = async () => {
    if (!updateContent.trim()) return;

    try {
      setSubmitting(true);
      await dispatch(addProjectUpdate({
        projectId: id,
        title: updateTitle || 'Project Update',
        content: updateContent,
        attachments: uploadedFiles.map(f => f._id)
      })).unwrap();
      
      setUpdateTitle('');
      setUpdateContent('');
      setUploadedFiles([]);
      setShowUpdateForm(false);
    } catch (error) {
      console.error('Failed to add update:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim()) return;

    try {
      // If no thread exists, create one
      if (!currentThread) {
        // Find admin or client (opposite of current user)
        const recipientId = currentProject?.client?._id === user._id 
          ? currentProject?.assignedBy?._id 
          : currentProject?.client?._id;
        
        if (!recipientId) {
          console.error('Cannot determine recipient');
          return;
        }

        const result = await dispatch(createThreadAndMessage({
          recipient: recipientId,
          project: id,
          content: messageContent,
          attachments: []
        })).unwrap();
        
        setMessageContent('');
        return;
      }

      await dispatch(sendMessage({
        threadId: currentThread._id,
        content: messageContent,
        attachments: []
      })).unwrap();
      
      setMessageContent('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const getStatusText = (progress, status) => {
    if (status === 'cancelled') return 'Cancelled';
    if (status === 'delivered' || progress === 100) return 'Delivered';
    if (progress >= 80) return 'Near Completion';
    if (progress > 0) return 'In Progress';
    return 'Pending';
  };

  const progressSteps = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-2 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="px-6 py-8">
        <button
          onClick={() => navigate('/app/projects')}
          className="mb-6 inline-flex items-center text-white/60 hover:text-[#d4af37] transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Projects
        </button>
        <div className="bg-white/5 border border-white/10 text-white/70 px-6 py-4">
          Project not found
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/app/projects')}
            className="mb-6 inline-flex items-center text-white/60 hover:text-[#d4af37] transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Projects
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-2 text-white/90">
                {currentProject.title}
              </h1>
              <p className="text-lg font-light text-white/50">
                {currentProject.description}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/app/projects/${id}?tab=${activeTab === 'overview' ? 'messages' : 'overview'}`)}
                className="px-6 py-3 border border-white/20 text-white/70 hover:border-[#d4af37] hover:text-[#d4af37] transition-all duration-300 text-sm font-light tracking-wide uppercase"
              >
                {activeTab === 'overview' ? 'Messages' : 'Overview'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-white/10">
          <button
            onClick={() => navigate(`/app/projects/${id}?tab=overview`)}
            className={`px-6 py-3 text-sm font-light tracking-wide uppercase border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-[#d4af37] text-[#d4af37]'
                : 'border-transparent text-white/50 hover:text-white/70'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => navigate(`/app/projects/${id}?tab=messages`)}
            className={`px-6 py-3 text-sm font-light tracking-wide uppercase border-b-2 transition-colors ${
              activeTab === 'messages'
                ? 'border-[#d4af37] text-[#d4af37]'
                : 'border-transparent text-white/50 hover:text-white/70'
            }`}
          >
            Messages
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Progress Section */}
            <div className="bg-white/5 border border-white/10 p-6 md:p-8">
              <h2 className="text-2xl font-light mb-6 text-white/90">Project Progress</h2>
              
              {/* Status Badge */}
              <div className="mb-6">
                <span className={`inline-block px-4 py-2 text-sm font-light tracking-wide uppercase border rounded ${
                  currentProject.status === 'cancelled' 
                    ? 'text-red-400 bg-red-500/20 border-red-500/30'
                    : currentProject.progress === 100
                    ? 'text-[#d4af37] bg-[#d4af37]/20 border-[#d4af37]/30'
                    : currentProject.progress >= 80
                    ? 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
                    : currentProject.progress > 0
                    ? 'text-blue-400 bg-blue-500/20 border-blue-500/30'
                    : 'text-white/60 bg-white/10 border-white/20'
                }`}>
                  {getStatusText(currentProject.progress || 0, currentProject.status)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-white/60 font-light">Progress</span>
                  <span className="text-white/90 font-light">{currentProject.progress || 0}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      currentProject.progress === 100
                        ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f]'
                        : currentProject.progress >= 80
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                        : 'bg-gradient-to-r from-blue-500 to-blue-400'
                    }`}
                    style={{ width: `${currentProject.progress || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Progress Controls (Admin Only) */}
              {user?.role === 'ADMIN' && (
                <div>
                  <p className="text-sm text-white/60 mb-4 font-light">Update Progress:</p>
                  <div className="flex flex-wrap gap-2">
                    {progressSteps.map((step) => (
                      <button
                        key={step}
                        onClick={() => handleProgressUpdate(step)}
                        disabled={submitting}
                        className={`px-4 py-2 text-xs font-light tracking-wide uppercase border transition-all ${
                          (currentProject.progress || 0) === step
                            ? 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/10'
                            : 'border-white/20 text-white/60 hover:border-[#d4af37] hover:text-[#d4af37]'
                        }`}
                      >
                        {step}%
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Updates Feed */}
            <div className="bg-white/5 border border-white/10 p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-light text-white/90">Project Updates</h2>
                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => setShowUpdateForm(!showUpdateForm)}
                    className="px-4 py-2 border border-[#d4af37] text-[#d4af37] text-xs font-light tracking-wide uppercase hover:bg-[#d4af37] hover:text-black transition-all duration-300"
                  >
                    Add Update
                  </button>
                )}
              </div>

              {/* Add Update Form (Admin) */}
              {showUpdateForm && user?.role === 'ADMIN' && (
                <div className="mb-8 p-6 bg-white/5 border border-white/10">
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Update title (optional)"
                      value={updateTitle}
                      onChange={(e) => setUpdateTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37] transition-colors"
                    />
                    <textarea
                      placeholder="Describe the update..."
                      value={updateContent}
                      onChange={(e) => setUpdateContent(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37] transition-colors resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <FileUpload
                        projectId={id}
                        onFilesUploaded={(files) => {
                          setUploadedFiles(prev => [...prev, ...files]);
                        }}
                        multiple
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowUpdateForm(false);
                            setUpdateTitle('');
                            setUpdateContent('');
                            setUploadedFiles([]);
                          }}
                          className="px-4 py-2 border border-white/20 text-white/70 hover:border-white/40 transition-colors text-xs font-light"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddUpdate}
                          disabled={submitting || !updateContent.trim()}
                          className="px-4 py-2 bg-[#d4af37] text-black hover:bg-[#f4d03f] transition-colors text-xs font-light tracking-wide uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Post Update
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Updates List */}
              {currentProject.updates && currentProject.updates.length > 0 ? (
                <div className="space-y-6">
                  {currentProject.updates
                    .slice()
                    .reverse()
                    .map((update, index) => (
                      <div key={index} className="p-6 bg-white/5 border border-white/10">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-light text-white/90 mb-2">
                              {update.title || 'Project Update'}
                            </h3>
                            <p className="text-sm text-white/50 font-light">
                              {update.postedBy?.fullName || 'Admin'} • {new Date(update.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-white/70 font-light mb-4 whitespace-pre-wrap">{update.content}</p>
                        {update.attachments && update.attachments.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                            {update.attachments.map((file) => (
                              <a
                                key={file._id}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 hover:border-[#d4af37] transition-colors"
                              >
                                <FileText className="h-4 w-4 text-white/60" />
                                <span className="text-xs text-white/70 truncate">{file.originalName}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-white/50 font-light">No updates yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="bg-white/5 border border-white/10 p-6 md:p-8 h-[calc(100vh-300px)] flex flex-col">
            <h2 className="text-2xl font-light mb-6 text-white/90">Project Messages</h2>
            
            {messagesLoading ? (
              <div className="flex items-center justify-center flex-1">
                <div className="w-12 h-12 border-2 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin"></div>
              </div>
            ) : messages.length > 0 ? (
              <>
                <div className="flex-1 overflow-y-auto space-y-4 mb-6">
                  {messages.map((message) => {
                    const isOwn = message.sender._id === user._id;
                    return (
                      <div
                        key={message._id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] p-4 ${
                          isOwn
                            ? 'bg-[#d4af37]/20 border border-[#d4af37]/30'
                            : 'bg-white/5 border border-white/10'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-light text-white/60">
                              {message.sender.fullName}
                            </span>
                            <span className="text-xs font-light text-white/40">
                              {message.sender.role === 'ADMIN' ? '(Admin)' : '(Client)'}
                            </span>
                            <span className="text-xs font-light text-white/40">
                              {new Date(message.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-white/90 font-light whitespace-pre-wrap">{message.content}</p>
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.attachments.map((file) => (
                                <a
                                  key={file._id}
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-xs text-[#d4af37] hover:underline"
                                >
                                  <FileText className="h-3 w-3" />
                                  {file.originalName}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37] transition-colors"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageContent.trim()}
                    className="px-6 py-3 bg-[#d4af37] text-black hover:bg-[#f4d03f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-white/50 font-light">No messages yet. Start the conversation!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;
