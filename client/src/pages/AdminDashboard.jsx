import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BarChart3, Users, FolderKanban, MessageSquare, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import { gsap } from 'gsap';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    users: 0,
    projects: 0,
    messages: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });
  const socketRef = useRef(null);

  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    fetchAnalytics();
    fetchStats();
    fetchRecentProjects();
    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

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
    });

    socket.on('project-created', (data) => {
      setProjects(prev => [data.project, ...prev].slice(0, 5));
      fetchStats();
    });

    socket.on('project-updated', (data) => {
      setProjects(prev => 
        prev.map(p => p._id === data.project._id ? data.project : p)
      );
      fetchStats();
    });

    socket.on('admin-project-update', (data) => {
      setProjects(prev => 
        prev.map(p => p._id === data.project._id ? data.project : p)
      );
      fetchStats();
    });

    socketRef.current = socket;
  };

  const fetchRecentProjects = async () => {
    try {
      const response = await api.get('/projects?limit=5');
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Failed to fetch recent projects:', error);
    }
  };

  // GSAP entrance animations
  useEffect(() => {
    if (containerRef.current && titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.1 }
      );
      if (statsRef.current) {
        gsap.fromTo(
          statsRef.current.children,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.1, delay: 0.3 }
        );
      }
    }
  }, [stats, analytics]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/analytics/dashboard');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [usersRes, projectsRes, messagesRes] = await Promise.all([
        api.get('/users?limit=1'),
        api.get('/projects'),
        api.get('/messages/threads'),
      ]);
      
      const allProjects = projectsRes.data.projects || [];
      const pending = allProjects.filter(p => p.status === 'pending').length;
      const inProgress = allProjects.filter(p => p.status === 'in-progress').length;
      const completed = allProjects.filter(p => p.status === 'completed').length;

      setStats({
        users: usersRes.data.total || 0,
        projects: projectsRes.data.total || 0,
        messages: messagesRes.data.threads?.length || 0,
        pending,
        inProgress,
        completed,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-2 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin"></div>
      </div>
    );
  }

  const overview = analytics?.overview || {};

  return (
    <div ref={containerRef} className="space-y-12 px-4 py-8">
      {/* Header */}
      <div>
        <h1 
          ref={titleRef}
          className="text-5xl md:text-6xl font-light tracking-tight mb-4 text-white/90"
        >
          {t('analytics.title')}
        </h1>
        <p className="text-lg font-light text-white/50">
          {t('dashboard.overview')}
        </p>
      </div>

      {/* Stats Cards */}
      <div ref={statsRef} className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white/5 border border-white/10">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-white/10 border border-white/20">
              <Users className="h-6 w-6 text-white/70" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-light text-white/60 tracking-wide uppercase">
                  {t('users.title')}
                </dt>
                <dd className="text-2xl font-light text-white/90 mt-1">
                  {stats.users}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white/5 border border-white/10">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-white/10 border border-white/20">
              <FolderKanban className="h-6 w-6 text-white/70" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-light text-white/60 tracking-wide uppercase">
                  {t('projects.title')}
                </dt>
                <dd className="text-2xl font-light text-white/90 mt-1">
                  {stats.projects}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white/5 border border-white/10">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-white/10 border border-white/20">
              <MessageSquare className="h-6 w-6 text-white/70" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-light text-white/60 tracking-wide uppercase">
                  {t('messages.title')}
                </dt>
                <dd className="text-2xl font-light text-white/90 mt-1">
                  {stats.messages}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white/5 border border-white/10">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-[#d4af37]/20 border border-[#d4af37]/30">
              <BarChart3 className="h-6 w-6 text-[#d4af37]" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-light text-white/60 tracking-wide uppercase">
                  {t('analytics.totalSessions')}
                </dt>
                <dd className="text-2xl font-light text-white/90 mt-1">
                  {overview.totalSessions || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Project Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="p-6 bg-white/5 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-light text-white/60 tracking-wide uppercase mb-1">Pending</p>
              <p className="text-3xl font-light text-white/90">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-white/40" />
          </div>
        </div>
        <div className="p-6 bg-white/5 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-light text-white/60 tracking-wide uppercase mb-1">In Progress</p>
              <p className="text-3xl font-light text-white/90">{stats.inProgress}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-400/60" />
          </div>
        </div>
        <div className="p-6 bg-white/5 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-light text-white/60 tracking-wide uppercase mb-1">Completed</p>
              <p className="text-3xl font-light text-white/90">{stats.completed}</p>
            </div>
            <FolderKanban className="h-8 w-8 text-[#d4af37]/60" />
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white/5 border border-white/10 p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-light tracking-wide uppercase text-white/90">
            Recent Projects
          </h2>
          <Link
            to="/app/projects"
            className="text-sm font-light text-[#d4af37] hover:text-[#d4af37]/80 transition-colors flex items-center gap-2"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {projects.length > 0 ? (
          <div className="space-y-4">
            {projects.map((project) => (
              <Link
                key={project._id}
                to={`/app/projects/${project._id}`}
                className="block p-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#d4af37]/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-light text-white/90 mb-1">{project.title}</h3>
                    <p className="text-sm font-light text-white/50 line-clamp-1">
                      {project.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`text-xs font-light px-2 py-1 border rounded ${
                        project.status === 'pending' ? 'text-white/60 bg-white/10 border-white/20' :
                        project.status === 'in-progress' ? 'text-blue-400 bg-blue-500/20 border-blue-500/30' :
                        'text-[#d4af37] bg-[#d4af37]/20 border-[#d4af37]/30'
                      }`}>
                        {project.status === 'pending' ? 'Pending' :
                         project.status === 'in-progress' ? 'In Progress' :
                         'Completed'}
                      </span>
                      {project.status === 'in-progress' && (
                        <span className="text-xs font-light text-white/50">
                          {project.progress}% complete
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-white/50 font-light">No projects yet</p>
        )}
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/5 border border-white/10 p-8">
          <h2 className="text-xl font-light tracking-wide uppercase text-white/90 mb-6">
            {t('analytics.sessionMetrics')}
          </h2>
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <span className="text-white/60 font-light">
                {t('analytics.totalSessions')}
              </span>
              <span className="text-xl font-light text-white/90">
                {overview.totalSessions || 0}
              </span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <span className="text-white/60 font-light">
                {t('analytics.activeSessions')}
              </span>
              <span className="text-xl font-light text-white/90">
                {overview.activeSessions || 0}
              </span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <span className="text-white/60 font-light">
                {t('analytics.avgDuration')}
              </span>
              <span className="text-xl font-light text-white/90">
                {overview.avgDuration ? `${Math.round(overview.avgDuration / 60)} min` : '0 min'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60 font-light">
                {t('analytics.pageViews')}
              </span>
              <span className="text-xl font-light text-white/90">
                {overview.pageViews || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-8">
          <h2 className="text-xl font-light tracking-wide uppercase text-white/90 mb-6">
            {t('analytics.topPages')}
          </h2>
          {analytics?.topPages && analytics.topPages.length > 0 ? (
            <div className="space-y-4">
              {analytics.topPages.slice(0, 5).map((page, index) => (
                <div key={index} className="flex justify-between items-center pb-4 border-b border-white/10 last:border-0">
                  <span className="text-white/60 font-light truncate flex-1">
                    {page._id}
                  </span>
                  <span className="text-xl font-light text-white/90 ml-4">
                    {page.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/50 font-light">{t('analytics.noData')}</p>
          )}
        </div>
      </div>

      {/* Top Sections */}
      {analytics?.topSections && analytics.topSections.length > 0 && (
        <div className="bg-white/5 border border-white/10 p-8">
          <h2 className="text-xl font-light tracking-wide uppercase text-white/90 mb-6">
            {t('analytics.topSections')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analytics.topSections.map((section, index) => (
              <div
                key={index}
                className="p-6 bg-white/5 border border-white/10"
              >
                <p className="font-light text-white/90 mb-2">
                  {section._id}
                </p>
                <p className="text-sm font-light text-white/60">
                  {section.count} {t('analytics.views')}
                </p>
                {section.avgViewTime && (
                  <p className="text-xs font-light text-white/40 mt-2">
                    Avg: {Math.round(section.avgViewTime / 1000)}s
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
