import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProjects } from '../store/projectSlice';
import { FolderKanban, ArrowRight, Clock, CheckCircle2, Circle, Pause } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const TK = {
  bg:        '#F6F7F9',
  surface:   '#FFFFFF',
  border:    '#E8EBF0',
  accent:    '#2563EB',
  accentBg:  'rgba(37,99,235,0.06)',
  text:      '#0D1117',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
};

const STATUS = {
  PLANNING:    { dot: '#94a3b8', en: 'Planning',     ar: 'التخطيط',      bg: 'rgba(148,163,184,0.12)' },
  DESIGN:      { dot: '#2563EB', en: 'Design',       ar: 'التصميم',      bg: 'rgba(37,99,235,0.08)'   },
  DEVELOPMENT: { dot: '#7c3aed', en: 'Development',  ar: 'التطوير',      bg: 'rgba(124,58,237,0.08)'  },
  REVIEW:      { dot: '#d97706', en: 'Review',       ar: 'المراجعة',     bg: 'rgba(217,119,6,0.08)'   },
  COMPLETED:   { dot: '#16a34a', en: 'Delivered',    ar: 'تم التسليم',   bg: 'rgba(22,163,74,0.08)'   },
  PAUSED:      { dot: '#94a3b8', en: 'Paused',       ar: 'متوقف مؤقتاً', bg: 'rgba(148,163,184,0.12)' },
  CANCELLED:   { dot: '#dc2626', en: 'Cancelled',    ar: 'ملغي',         bg: 'rgba(220,38,38,0.08)'   },
};

const StatusBadge = ({ status, language }) => {
  const info = STATUS[status] || STATUS.PLANNING;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 500,
      background: info.bg, color: info.dot,
    }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: info.dot, display: 'inline-block' }} />
      {language === 'ar' ? info.ar : info.en}
    </span>
  );
};

const Projects = () => {
  const { language, isRTL } = useLanguage();
  const dispatch = useDispatch();
  const { projects = [], loading } = useSelector(s => s.projects);
  const [search, setSearch] = useState('');

  useEffect(() => { dispatch(fetchProjects()); }, [dispatch]);

  const filtered = useMemo(() => {
    if (!search.trim()) return projects;
    const q = search.toLowerCase();
    return projects.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  }, [projects, search]);

  const fmt = (d) => {
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    } catch { return null; }
  };

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
      </div>

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
            {search ? (language === 'ar' ? 'لا نتائج' : 'No results') : (language === 'ar' ? 'لا مشاريع بعد' : 'No projects yet')}
          </h2>
          <p style={{ fontSize: '13.5px', color: TK.textMuted, margin: '0 0 20px', lineHeight: 1.5, maxWidth: '340px' }}>
            {search
              ? (language === 'ar' ? 'جرّب كلمة بحث مختلفة' : 'Try a different search term')
              : (language === 'ar'
                ? 'ستظهر مشاريعك هنا بعد إعدادها من قِبل فريقنا عقب طلبك.'
                : 'Your projects will appear here once our team sets them up after your request.')}
          </p>
          {!search && (
            <a href="https://wa.me/201090385390" target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '9px 20px', borderRadius: '9px',
                background: '#25D366', color: '#fff', textDecoration: 'none', fontSize: '13px', fontWeight: 500,
              }}
            >
              {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
            </a>
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
                  <StatusBadge status={project.status} language={language} />
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
    </div>
  );
};

export default Projects;
