import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, FolderKanban, Clock, CheckCircle2, AlertCircle,
  ArrowRight, Loader2, MessageSquare, FileText, Calendar, Layers
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProjects, updateProjectInList } from '../store/projectSlice';
import { gsap } from 'gsap';
import { io } from 'socket.io-client';

// ── project type icon map (emoji fallback) ──────────────────────────────────
const PROJECT_TYPE_EMOJI = {
  restaurant: '🍽️', clinic: '🏥', pharmacy: '💊',
  ecommerce: '🛒', saas: '⚙️', realestate: '🏠',
  education: '📚', delivery: '🚚', other: '💡',
};

const Projects = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const { projects, loading } = useSelector((state) => state.projects);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  const containerRef = useRef(null);
  const titleRef     = useRef(null);
  const cardsRef     = useRef(null);

  useEffect(() => {
    dispatch(fetchProjects());
    initializeSocket();
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, [user, dispatch]);

  const initializeSocket = () => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_API_URL?.replace('/api', '') ||
      'http://localhost:5000';

    const socket = io(socketUrl, { auth: { token }, transports: ['websocket', 'polling'] });
    socket.on('connect', () => { socket.emit('join', user._id); });
    socket.on('project-created',          () => dispatch(fetchProjects()));
    socket.on('project-updated',          (d) => dispatch(updateProjectInList(d.project)));
    socket.on('project-progress-updated', (d) => dispatch(updateProjectInList(d.project)));
    socket.on('admin-project-update',     (d) => { if (user?.role === 'ADMIN') dispatch(updateProjectInList(d.project)); });
    socketRef.current = socket;
  };

  // GSAP entrance
  useEffect(() => {
    if (!containerRef.current || !titleRef.current) return;
    gsap.fromTo(titleRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.1 }
    );
    if (cardsRef.current) {
      gsap.fromTo(cardsRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.1, delay: 0.3 }
      );
    }
  }, [projects]);

  // ── helpers ──────────────────────────────────────────────────────────────────

  const getStatusText = (progress, status) => {
    if (status === 'cancelled')                    return t('projects.statusCancelled');
    if (status === 'delivered' || progress === 100) return t('projects.statusDelivered');
    if (progress >= 80)                            return t('projects.statusNearCompletion');
    if (progress > 0)                              return t('projects.statusInProgress');
    return t('projects.statusPending');
  };

  const getStatusColor = (progress, status) => {
    if (status === 'cancelled')                    return 'text-red-400 bg-red-500/20 border-red-500/30';
    if (status === 'delivered' || progress === 100) return 'text-[#d4af37] bg-[#d4af37]/20 border-[#d4af37]/30';
    if (progress >= 80)                            return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    if (progress > 0)                              return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    return 'text-white/60 bg-white/10 border-white/20';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':   return <CheckCircle2 className="h-5 w-5 text-[#d4af37]" />;
      case 'in-progress': return <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />;
      case 'cancelled':   return <AlertCircle className="h-5 w-5 text-red-400" />;
      default:            return <Clock className="h-5 w-5 text-white/60" />;
    }
  };

  const getProjectsCountLabel = (count) =>
    `${count} ${count === 1 ? t('projects.projectSingular') : t('projects.projectPlural')}`;

  const getUpdatesCountLabel = (count) =>
    `${count} ${count === 1 ? t('projects.updateSingular') : t('projects.updatePlural')}`;

  const getProjectTypeLabel = (type) => {
    const key = `projectForm.steps.projectType.options.${type}`;
    const label = t(key, '');
    return label || type;
  };

  // ── loading / error ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-2 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-4 bg-white/5 border border-white/10 text-white/70">{error}</div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────────

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
            {getProjectsCountLabel(projects.length)}
          </p>
        </div>
        <button
          onClick={() => navigate('/app/projects/new')}
          className="px-4 py-2 md:px-6 md:py-3 border border-[#d4af37] text-[#d4af37] text-xs md:text-sm font-light tracking-widest uppercase hover:bg-[#d4af37] hover:text-black transition-all duration-500 flex items-center gap-2"
        >
          <Plus className="h-4 w-4 md:h-5 md:w-5" />
          <span className="hidden sm:inline">
            {user?.role === 'ADMIN' ? t('projects.createProject') : t('projects.addNewProject')}
          </span>
          <span className="sm:hidden">{t('projects.addShort')}</span>
        </button>
      </div>

      {/* Empty */}
      {projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px 60px', maxWidth: '480px', margin: '0 auto' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px', margin: '0 auto 24px',
            background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FolderKanban style={{ width: '28px', height: '28px', color: '#d4af37', opacity: 0.7 }} />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 400, color: 'rgba(255,255,255,0.8)', marginBottom: '10px', letterSpacing: '-0.01em' }}>
            Your projects will appear here
          </h3>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, marginBottom: '28px', fontWeight: 300 }}>
            Projects are created by our team after your initial request. You can track progress, view deliverables, and communicate directly from the project page.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '32px' }}>
            {[
              { icon: MessageSquare, label: 'Send a message to start' },
              { icon: FileText,      label: 'Upload your requirements' },
              { icon: Calendar,      label: 'Track milestones' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '6px 12px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                fontSize: '11px', color: 'rgba(255,255,255,0.4)',
              }}>
                <Icon style={{ width: '11px', height: '11px' }} />
                {label}
              </div>
            ))}
          </div>
          <Link
            to="/app/messages"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              padding: '10px 22px', borderRadius: '10px',
              background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)',
              color: '#d4af37', fontSize: '12px', fontWeight: 400,
              letterSpacing: '0.08em', textDecoration: 'none', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background='#d4af37'; e.currentTarget.style.color='#000'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(212,175,55,0.1)'; e.currentTarget.style.color='#d4af37'; }}
          >
            <MessageSquare style={{ width: '13px', height: '13px' }} />
            Start a Conversation
          </Link>
        </div>
      ) : (
        <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {projects.map((project) => (
            <Link
              key={project._id}
              to={`/app/projects/${project._id}`}
              className="group relative p-6 md:p-8 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#d4af37]/50 transition-all duration-500 rounded-lg"
              onMouseEnter={e => gsap.to(e.currentTarget, { y: -4, duration: 0.3, ease: 'power2.out' })}
              onMouseLeave={e => gsap.to(e.currentTarget, { y: 0,  duration: 0.3, ease: 'power2.out' })}
            >
              {/* Title row */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl md:text-2xl font-light text-white/90 group-hover:text-[#d4af37] transition-colors duration-300 flex-1 pr-4 line-clamp-2">
                  {project.title}
                </h3>
                <div className="flex-shrink-0 ml-2">{getStatusIcon(project.status)}</div>
              </div>

              {/* Status badge + optional project type badge */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`inline-block px-3 py-1 text-xs font-light tracking-wide uppercase border rounded ${getStatusColor(project.progress || 0, project.status)}`}>
                  {getStatusText(project.progress || 0, project.status)}
                </span>
                {project.projectType && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-light tracking-wide border border-white/15 text-white/45 rounded-full">
                    <span>{PROJECT_TYPE_EMOJI[project.projectType] || '📁'}</span>
                    {getProjectTypeLabel(project.projectType)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs md:text-sm font-light text-white/50 mb-4 md:mb-5 line-clamp-2">
                {project.description || t('projects.noDescription')}
              </p>

              {/* Tags from request (if stored on project) */}
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {project.tags.slice(0, 4).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs font-light border border-white/10 text-white/40 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {project.tags.length > 4 && (
                    <span className="px-2 py-0.5 text-xs font-light border border-white/10 text-white/40 rounded-full">
                      +{project.tags.length - 4}
                    </span>
                  )}
                </div>
              )}

              {/* Progress + meta */}
              <div className="space-y-3">
                {(project.progress > 0 || project.status !== 'pending') && (
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-white/60 font-light">{t('projects.progress')}</span>
                      <span className="text-white/90 font-light">{project.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          project.progress === 100
                            ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f]'
                            : project.progress >= 80
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                            : 'bg-gradient-to-r from-blue-500 to-blue-400'
                        }`}
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {project.updatedAt && (
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <Calendar className="h-3 w-3" />
                    <span className="font-light">
                      {t('projects.updatedOn')} {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {project.updates && project.updates.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <FileText className="h-3 w-3" />
                    <span className="font-light">{getUpdatesCountLabel(project.updates.length)}</span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-5 pt-4 border-t border-white/10 flex gap-2">
                <Link
                  to={`/app/projects/${project._id}`}
                  className="flex-1 px-4 py-2 text-xs font-light tracking-wide uppercase border border-white/20 text-white/70 hover:border-[#d4af37] hover:text-[#d4af37] transition-all duration-300 text-center"
                  onClick={e => e.stopPropagation()}
                >
                  {t('projects.viewDetails')}
                </Link>
                <Link
                  to={`/app/projects/${project._id}?tab=messages`}
                  className="px-4 py-2 text-xs font-light tracking-wide uppercase border border-white/20 text-white/70 hover:border-[#d4af37] hover:text-[#d4af37] transition-all duration-300"
                  onClick={e => { e.stopPropagation(); e.preventDefault(); navigate(`/app/projects/${project._id}?tab=messages`); }}
                >
                  <MessageSquare className="h-4 w-4" />
                </Link>
              </div>

              {/* Hover arrow */}
              <div className="absolute bottom-4 md:bottom-6 right-4 md:right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-[#d4af37]" />
              </div>

              {/* Bottom accent */}
              <div className="absolute bottom-0 left-0 w-0 h-px bg-[#d4af37] group-hover:w-full transition-all duration-500" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;