import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import { FolderKanban, MessageSquare, BarChart3, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import { gsap } from 'gsap';
import StartProject from './StartProject';

const Dashboard = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { isRTL, dir } = useLanguage();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({
    projects: 0,
    messages: 0,
    files: 0,
  });
  const [showStartProject, setShowStartProject] = useState(false);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef(null);
  const welcomeRef = useRef(null);
  const subtitleRef = useRef(null);
  const actionsRef = useRef(null);

  // Theme-aware classes
  const bgClass = isDark ? 'bg-black' : 'bg-white';
  const textClass = isDark ? 'text-white/90' : 'text-gray-900';
  const textMuted = isDark ? 'text-white/60' : 'text-gray-600';
  const textSecondary = isDark ? 'text-white/50' : 'text-gray-500';
  const surfaceClass = isDark ? 'bg-white/5' : 'bg-black/5';
  const borderClass = isDark ? 'border-white/10' : 'border-gray-200';
  const borderLight = isDark ? 'border-white/20' : 'border-gray-300';
  const hoverSurface = isDark ? 'hover:bg-white/10' : 'hover:bg-black/10';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [projectsRes, messagesRes] = await Promise.all([
          api.get('/projects?limit=1'),
          api.get('/messages/threads'),
        ]);
        const projectCount = projectsRes.data.total || 0;
        setStats({
          projects: projectCount,
          messages: messagesRes.data.threads?.length || 0,
        });
        
        // Show StartProject if user has no projects
        if (projectCount === 0) {
          setShowStartProject(true);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleProjectComplete = () => {
    setShowStartProject(false);
    // Refresh stats
    const fetchStats = async () => {
      try {
        const [projectsRes, messagesRes] = await Promise.all([
          api.get('/projects?limit=1'),
          api.get('/messages/threads'),
        ]);
        setStats({
          projects: projectsRes.data.total || 0,
          messages: messagesRes.data.threads?.length || 0,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    fetchStats();
  };

  // GSAP entrance animations
  useEffect(() => {
    if (containerRef.current && welcomeRef.current && subtitleRef.current && actionsRef.current) {
      gsap.fromTo(
        welcomeRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, ease: 'power2.out', delay: 0.2 }
      );
      gsap.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.4 }
      );
      gsap.fromTo(
        actionsRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.1, delay: 0.6 }
      );
    }
  }, []);

  const actions = [
    {
      title: t('projects.title', 'Projects'),
      description: t('dashboard.viewProjects', 'View and manage your projects'),
      icon: FolderKanban,
      to: '/app/projects',
    },
    {
      title: t('messages.title', 'Messages'),
      description: t('dashboard.communicate', 'Communicate with your team'),
      icon: MessageSquare,
      to: '/app/messages',
    },
    ...(user?.role === 'ADMIN' ? [{
      title: t('dashboard.analytics', 'Analytics'),
      description: t('dashboard.viewInsights', 'View platform insights'),
      icon: BarChart3,
      to: '/app/admin',
    }] : []),
  ];

  // Show StartProject for first-time users
  if (showStartProject && !loading) {
    return <StartProject onComplete={handleProjectComplete} />;
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${bgClass} ${textClass} flex items-center justify-center transition-colors duration-300`}>
        <div className={`${textSecondary} font-light`}>
          {t('dashboard.loading', 'Loading...')}
        </div>
      </div>
    );
  }

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : '';

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen ${bgClass} ${textClass} px-4 py-20 transition-colors duration-300`}
      dir={dir}
    >
      {/* Background subtle pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${isDark ? 'ffffff' : '000000'}' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-20 text-center">
          <div className="mb-8">
            <span className={`block w-24 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-8`} />
          </div>
          
          <h1 
            ref={welcomeRef}
            className={`text-6xl md:text-7xl lg:text-8xl font-light tracking-tight mb-6 ${textClass}`}
          >
            {firstName 
              ? t('dashboard.welcomeUser', { name: firstName })
              : t('dashboard.welcome', 'Welcome')}
          </h1>
          
          <p 
            ref={subtitleRef}
            className={`text-xl md:text-2xl font-light ${textSecondary} max-w-2xl mx-auto`}
          >
            {t('dashboard.subtitle', "You're now part of a premium digital studio. Let's build something exceptional together.")}
          </p>
        </div>

        {/* Action Cards */}
        <div 
          ref={actionsRef}
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto ${isRTL ? 'rtl' : ''}`}
        >
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.to}
                to={action.to}
                className={`group relative p-8 ${surfaceClass} border ${borderLight} ${hoverSurface} transition-all duration-500`}
                onMouseEnter={(e) => {
                  gsap.to(e.currentTarget, {
                    y: -4,
                    duration: 0.3,
                    ease: 'power2.out'
                  });
                }}
                onMouseLeave={(e) => {
                  gsap.to(e.currentTarget, {
                    y: 0,
                    duration: 0.3,
                    ease: 'power2.out'
                  });
                }}
              >
                <div className={`flex items-start justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`p-3 ${surfaceClass} border ${borderLight} group-hover:border-gold transition-colors duration-500`}>
                    <Icon className={`w-6 h-6 ${textMuted} group-hover:text-gold transition-colors duration-500`} />
                  </div>
                  <ArrowRight className={`w-5 h-5 ${textSecondary} group-hover:text-gold ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'} transition-all duration-500`} />
                </div>
                
                <h3 className={`text-2xl font-light mb-2 ${textClass} group-hover:text-gold transition-colors duration-500`}>
                  {action.title}
                </h3>
                
                <p className={`text-sm font-light ${textSecondary}`}>
                  {action.description}
                </p>

                {/* Hover accent line */}
                <div className={`absolute bottom-0 ${isRTL ? 'right-0' : 'left-0'} w-0 h-px bg-gold group-hover:w-full transition-all duration-500`} />
              </Link>
            );
          })}
        </div>

        {/* Additional CTA */}
        <div className="mt-20 text-center">
          <p className={`text-sm font-light ${textSecondary} mb-6`}>
            {t('dashboard.needHelp', 'Need help getting started?')}
          </p>
          <Link
            to="/app/projects"
            className={`inline-block px-8 py-4 border ${borderLight} ${textClass} text-sm font-light tracking-widest uppercase ${isDark ? 'hover:bg-white hover:text-black' : 'hover:bg-black hover:text-white'} transition-all duration-500`}
          >
            {t('dashboard.startFirstProject', 'Start Your First Project')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
