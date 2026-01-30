import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Clock, CheckCircle2, AlertCircle, ArrowRight, Loader2, MessageSquare, FileText, Calendar } from 'lucide-react';
import api from '../utils/api';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProjects, updateProjectInList } from '../store/projectSlice';
import { gsap } from 'gsap';
import { io } from 'socket.io-client';

const Projects = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const { projects, loading, total } = useSelector((state) => state.projects);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const cardsRef = useRef(null);

  useEffect(() => {
    dispatch(fetchProjects());
    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user, dispatch]);

  const initializeSocket = () => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('Socket connected for projects');
      socket.emit('join', user._id);
    });

    socket.on('project-created', (data) => {
      dispatch(fetchProjects());
    });

    socket.on('project-updated', (data) => {
      dispatch(updateProjectInList(data.project));
    });

    socket.on('project-progress-updated', (data) => {
      dispatch(updateProjectInList(data.project));
    });

    socket.on('admin-project-update', (data) => {
      if (user?.role === 'ADMIN') {
        dispatch(updateProjectInList(data.project));
      }
    });

    socketRef.current = socket;
  };

  // GSAP entrance animations
  useEffect(() => {
    if (containerRef.current && titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.1 }
      );
      if (cardsRef.current) {
        gsap.fromTo(
          cardsRef.current.children,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.1, delay: 0.3 }
        );
      }
    }
  }, [projects]);

  const getStatusText = (progress, status) => {
    if (status === 'cancelled') return 'Cancelled';
    if (status === 'delivered' || progress === 100) return 'Delivered';
    if (progress >= 80) return 'Near Completion';
    if (progress > 0) return 'In Progress';
    return 'Pending';
  };

  const getStatusColor = (progress, status) => {
    if (status === 'cancelled') return 'text-red-400 bg-red-500/20 border-red-500/30';
    if (status === 'delivered' || progress === 100) return 'text-[#d4af37] bg-[#d4af37]/20 border-[#d4af37]/30';
    if (progress >= 80) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    if (progress > 0) return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    return 'text-white/60 bg-white/10 border-white/20';
  };

  const getPhaseColor = (phase) => {
    const colors = {
      planning: 'bg-white/20',
      design: 'bg-blue-500/30',
      development: 'bg-purple-500/30',
      testing: 'bg-yellow-500/30',
      launch: 'bg-green-500/30',
      completed: 'bg-[#d4af37]/30',
    };
    return colors[phase] || 'bg-white/20';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-[#d4af37]" />;
      case 'in-progress':
        return <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case 'pending':
      default:
        return <Clock className="h-5 w-5 text-white/60" />;
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-2 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-4 bg-white/5 border border-white/10 text-white/70">
        {error}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-8 md:space-y-12 px-4 md:px-6 lg:px-8 py-6 md:py-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex-1">
          <h1 
            ref={titleRef}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-2 md:mb-4 text-white/90"
          >
            {user?.role === 'ADMIN' ? t('projects.allProjects') : t('projects.myProjects')}
          </h1>
          <p className="text-sm md:text-lg font-light text-white/50">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </p>
        </div>
        <button
          onClick={() => navigate('/app/projects/new')}
          className="px-4 py-2 md:px-6 md:py-3 border border-[#d4af37] text-[#d4af37] text-xs md:text-sm font-light tracking-widest uppercase hover:bg-[#d4af37] hover:text-black transition-all duration-500 flex items-center gap-2"
        >
          <Plus className="h-4 w-4 md:h-5 md:w-5" />
          <span className="hidden sm:inline">{user?.role === 'ADMIN' ? t('projects.createProject') : 'Add New Project'}</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20">
          <FolderKanban className="mx-auto h-16 w-16 text-white/30 mb-6" />
          <h3 className="text-xl font-light text-white/60">
            {t('projects.noProjects')}
          </h3>
        </div>
      ) : (
        <div 
          ref={cardsRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
        >
          {projects.map((project) => (
            <Link
              key={project._id}
              to={`/app/projects/${project._id}`}
              className="group relative p-6 md:p-8 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#d4af37]/50 transition-all duration-500 rounded-lg"
              onMouseEnter={(e) => {
                gsap.to(e.currentTarget, { y: -4, duration: 0.3, ease: 'power2.out' });
              }}
              onMouseLeave={(e) => {
                gsap.to(e.currentTarget, { y: 0, duration: 0.3, ease: 'power2.out' });
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl md:text-2xl font-light text-white/90 group-hover:text-[#d4af37] transition-colors duration-300 flex-1 pr-4 line-clamp-2">
                  {project.title}
                </h3>
                <div className="flex-shrink-0 ml-2">
                  {getStatusIcon(project.status)}
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span className={`inline-block px-3 py-1 text-xs font-light tracking-wide uppercase border rounded ${getStatusColor(project.progress || 0, project.status)}`}>
                  {getStatusText(project.progress || 0, project.status)}
                </span>
              </div>

              <p className="text-xs md:text-sm font-light text-white/50 mb-4 md:mb-6 line-clamp-2">
                {project.description || 'No description'}
              </p>

              <div className="space-y-3 md:space-y-4">
                {/* Progress Bar - Always show if progress > 0 */}
                {(project.progress > 0 || project.status !== 'pending') && (
                  <div>
                    <div className="flex justify-between text-xs md:text-sm mb-2">
                      <span className="text-white/60 font-light">Progress</span>
                      <span className="text-white/90 font-light">
                        {project.progress || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 md:h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          project.progress === 100 
                            ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f]' 
                            : project.progress >= 80
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                            : 'bg-gradient-to-r from-blue-500 to-blue-400'
                        }`}
                        style={{ width: `${project.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Last Update Date */}
                {project.updatedAt && (
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <Calendar className="h-3 w-3" />
                    <span className="font-light">
                      Updated {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Updates Count */}
                {project.updates && project.updates.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <FileText className="h-3 w-3" />
                    <span className="font-light">
                      {project.updates.length} {project.updates.length === 1 ? 'update' : 'updates'}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-white/10 flex gap-2">
                <Link
                  to={`/app/projects/${project._id}`}
                  className="flex-1 px-4 py-2 text-xs font-light tracking-wide uppercase border border-white/20 text-white/70 hover:border-[#d4af37] hover:text-[#d4af37] transition-all duration-300 text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Details
                </Link>
                <Link
                  to={`/app/projects/${project._id}?tab=messages`}
                  className="px-4 py-2 text-xs font-light tracking-wide uppercase border border-white/20 text-white/70 hover:border-[#d4af37] hover:text-[#d4af37] transition-all duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    navigate(`/app/projects/${project._id}?tab=messages`);
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                </Link>
              </div>

              {/* Hover arrow */}
              <div className="absolute bottom-4 md:bottom-6 right-4 md:right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-[#d4af37]" />
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 w-0 h-px bg-[#d4af37] group-hover:w-full transition-all duration-500" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
