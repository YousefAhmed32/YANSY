import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProjects } from '../store/projectSlice';
import { fetchMyRequests } from '../store/projectRequestSlice';
import { FolderKanban, ArrowRight, Clock, Sparkles, CalendarDays, UserCheck } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import ProjectRequestForm from '../components/ProjectRequestForm';
import { TK } from '../admin-ui';

const STATUS = {
  PLANNING:    { dot: '#94a3b8', en: 'Planning',     ar: 'التخطيط',      bg: 'rgba(148,163,184,0.12)' },
  DESIGN:      { dot: '#2563EB', en: 'Design',       ar: 'التصميم',      bg: 'rgba(37,99,235,0.08)'   },
  DEVELOPMENT: { dot: '#7c3aed', en: 'Development',  ar: 'التطوير',      bg: 'rgba(124,58,237,0.08)'  },
  REVIEW:      { dot: '#d97706', en: 'Review',       ar: 'المراجعة',     bg: 'rgba(217,119,6,0.08)'   },
  COMPLETED:   { dot: '#16a34a', en: 'Delivered',    ar: 'تم التسليم',   bg: 'rgba(22,163,74,0.08)'   },
  PAUSED:      { dot: '#94a3b8', en: 'Paused',       ar: 'متوقف مؤقتاً', bg: 'rgba(148,163,184,0.12)' },
  CANCELLED:   { dot: '#dc2626', en: 'Cancelled',    ar: 'ملغي',         bg: 'rgba(220,38,38,0.08)'   },
};

const REQUEST_STATUS = {
  'new':         { dot: '#2563EB', en: 'Under review',          ar: 'قيد المراجعة',      bg: 'rgba(37,99,235,0.08)' },
  'in-progress': { dot: '#d97706', en: 'Being worked on',       ar: 'قيد المتابعة',      bg: 'rgba(217,119,6,0.08)' },
  'completed':   { dot: '#16a34a', en: 'Converted to a project',ar: 'تم التحويل لمشروع', bg: 'rgba(22,163,74,0.08)' },
};

const StatusBadge = ({ info, label }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '3px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 500,
    background: info.bg, color: info.dot,
  }}>
    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: info.dot, display: 'inline-block' }} />
    {label}
  </span>
);

const Projects = () => {
  const { language, isRTL } = useLanguage();
  const dispatch = useDispatch();
  const { projects = [], loading } = useSelector(s => s.projects);
  const { requests = [], loading: requestsLoading, loaded: requestsLoaded } = useSelector(s => s.projectRequests);
  const [search, setSearch] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchMyRequests());
  }, [dispatch]);

  const filtered = useMemo(() => {
    if (!search.trim()) return projects;
    const q = search.toLowerCase();
    return projects.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  }, [projects, search]);

  // Pending requests (not yet converted into a project) — these are what
  // the customer is actually waiting on when they have no projects yet.
  const pendingRequests = useMemo(
    () => [...requests].filter(r => r.status !== 'completed').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [requests]
  );

  const fmt = (d) => {
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    } catch { return null; }
  };

  const showEmptyState = !loading && filtered.length === 0 && !search;
  const isReady = !loading && (!requestsLoading || requestsLoaded);

  return (
    <div className="yansy-client-page yansy-projects-page" style={{
      minHeight: '100vh', background: TK.bg,
      padding: 'clamp(16px,3vw,32px)',
      fontFamily: isRTL ? 'IBM Plex Sans Arabic,system-ui,sans-serif' : 'Inter,system-ui,sans-serif',
      direction: isRTL ? 'rtl' : 'ltr', maxWidth: '1200px', margin: '0 auto',
    }}>

      {/* Header */}
      <div className="yansy-client-page-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(18px,3vw,24px)', fontWeight: 700, color: TK.text, margin: 0 }}>
            {language === 'ar' ? 'مشاريعي' : 'My Projects'}
          </h1>
          <p style={{ fontSize: '13px', color: TK.textMuted, margin: '4px 0 0' }}>
            {projects.length > 0
              ? (language === 'ar' ? `${projects.length} مشروع` : `${projects.length} project${projects.length !== 1 ? 's' : ''}`)
              : (language === 'ar' ? 'لا مشاريع بعد' : 'No projects yet')}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Search */}
          {projects.length > 0 && (
            <div style={{ position: 'relative' }}>
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={language === 'ar' ? 'ابحث في المشاريع...' : 'Search projects...'}
                style={{
                  padding: '8px 14px 8px 34px',
                  borderRadius: '9px', border: `1px solid ${TK.border}`,
                  fontSize: '13px', color: TK.text,
                  background: TK.surface, outline: 'none', width: '220px',
                  fontFamily: 'inherit', transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = TK.accent; }}
                onBlur={e => { e.target.style.borderColor = TK.border; }}
              />
              <svg
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: TK.textLight, pointerEvents: 'none' }}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
          )}
          <button onClick={() => setShowRequestForm(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '9px 16px', borderRadius: '9px', border: 'none',
              background: TK.accent, color: '#fff', fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>
            <Sparkles style={{ width: 14, height: 14 }} />
            {language === 'ar' ? 'طلب جديد' : 'New request'}
          </button>
        </div>
      </div>

      {/* Pending requests — real status, not a project yet */}
      {isReady && pendingRequests.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 600, color: TK.textMuted, textTransform: 'uppercase', letterSpacing: '.04em', margin: '0 0 10px' }}>
            {language === 'ar' ? 'طلبات قيد المتابعة' : 'Pending requests'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingRequests.map(req => {
              const info = REQUEST_STATUS[req.status] || REQUEST_STATUS.new;
              return (
                <div key={req._id} style={{
                  background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '12px',
                  padding: '14px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
                }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <StatusBadge info={info} label={language === 'ar' ? info.ar : info.en} />
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: TK.textLight }}>
                        <CalendarDays style={{ width: 11, height: 11 }} /> {fmt(req.createdAt)}
                      </span>
                      {req.assignedTo?.fullName && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: TK.textLight }}>
                          <UserCheck style={{ width: 11, height: 11 }} /> {req.assignedTo.fullName}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '13px', color: TK.text, margin: 0, lineHeight: 1.5 }}>
                      {req.projectDescription?.slice(0, 140)}{req.projectDescription?.length > 140 ? '…' : ''}
                    </p>
                  </div>
                  <Link to="/app/messages" style={{
                    flexShrink: 0, fontSize: '12px', fontWeight: 500, color: TK.accent, textDecoration: 'none',
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}>
                    {language === 'ar' ? 'المحادثة' : 'Conversation'}
                    <ArrowRight style={{ width: 12, height: 12, transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,320px),1fr))', gap: '14px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              height: '180px', borderRadius: '14px', border: `1px solid ${TK.border}`,
              background: TK.surface, animation: 'shimmer 1.5s infinite',
            }} />
          ))}
          <style>{`@keyframes shimmer{0%{opacity:1}50%{opacity:0.4}100%{opacity:1}}`}</style>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '64px 24px', textAlign: 'center',
        }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '16px', background: TK.accentBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
          }}>
            <FolderKanban style={{ width: '28px', height: '28px', color: TK.accent }} />
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: TK.text, margin: '0 0 8px' }}>
            {search ? (language === 'ar' ? 'لا نتائج' : 'No results')
              : pendingRequests.length > 0 ? (language === 'ar' ? 'طلبك قيد المراجعة' : 'Your request is under review')
              : (language === 'ar' ? 'لا مشاريع بعد' : 'No projects yet')}
          </h2>
          <p style={{ fontSize: '13.5px', color: TK.textMuted, margin: '0 0 20px', lineHeight: 1.5, maxWidth: '340px' }}>
            {search
              ? (language === 'ar' ? 'جرّب كلمة بحث مختلفة' : 'Try a different search term')
              : pendingRequests.length > 0
                ? (language === 'ar' ? 'بمجرد أن يوافق فريقنا على طلبك، سيظهر هنا كمشروع نشط.' : "Once our team approves your request, it'll appear here as an active project.")
                : (language === 'ar'
                  ? 'ابدأ بإرسال طلب مشروع وسيظهر هنا فور موافقة فريقنا عليه.'
                  : "Submit a project request and it'll appear here once our team sets it up.")}
          </p>
          {!search && showEmptyState && pendingRequests.length === 0 && (
            <button onClick={() => setShowRequestForm(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '9px 20px', borderRadius: '9px', border: 'none',
                background: TK.accent, color: '#fff', textDecoration: 'none', fontSize: '13px', fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Sparkles style={{ width: 14, height: 14 }} />
              {language === 'ar' ? 'ابدأ مشروعك' : 'Start your project'}
            </button>
          )}
        </div>
      )}

      {/* Projects grid */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,320px),1fr))', gap: '14px' }}>
          {filtered.map(project => {
            const progress = project.progress ?? 0;
            const info = STATUS[project.status] || STATUS.PLANNING;
            return (
              <Link className="yansy-project-card" key={project._id} to={`/app/projects/${project._id}`}
                style={{
                  display: 'block', textDecoration: 'none',
                  background: TK.surface, borderRadius: '14px',
                  border: `1px solid ${TK.border}`, padding: '20px',
                  transition: 'box-shadow 0.18s, border-color 0.18s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
                  el.style.borderColor = 'rgba(37,99,235,0.22)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.boxShadow = 'none';
                  el.style.borderColor = TK.border;
                }}
              >
                {/* Card header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '8px' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '9px', flexShrink: 0,
                    background: TK.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FolderKanban style={{ width: '18px', height: '18px', color: TK.accent }} />
                  </div>
                  <StatusBadge info={info} label={language === 'ar' ? info.ar : info.en} />
                </div>

                {/* Title + desc */}
                <h3 style={{ fontSize: '14.5px', fontWeight: 600, color: TK.text, margin: '0 0 5px', lineHeight: 1.35 }}>
                  {project.name}
                </h3>
                {project.description && (
                  <p style={{ fontSize: '12px', color: TK.textMuted, margin: '0 0 14px', lineHeight: 1.5 }}>
                    {project.description.slice(0, 80)}{project.description.length > 80 ? '…' : ''}
                  </p>
                )}

                {/* Progress bar */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '10.5px', color: TK.textLight }}>
                      {language === 'ar' ? 'الإنجاز' : 'Progress'}
                    </span>
                    <span style={{ fontSize: '10.5px', fontWeight: 600, color: TK.accent }}>{progress}%</span>
                  </div>
                  <div style={{ height: '4px', background: TK.accentBg, borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '999px', width: `${progress}%`,
                      background: `linear-gradient(90deg, ${TK.accent}, #60a5fa)`,
                      transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock style={{ width: '11px', height: '11px', color: TK.textLight }} />
                    <span style={{ fontSize: '10.5px', color: TK.textLight }}>
                      {fmt(project.updatedAt || project.createdAt)}
                    </span>
                  </div>
                  <ArrowRight style={{ width: '13px', height: '13px', color: TK.accent, transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <ProjectRequestForm isOpen={showRequestForm} onClose={() => { setShowRequestForm(false); dispatch(fetchMyRequests()); }} />
    </div>
  );
};

export default Projects;
