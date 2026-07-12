import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowUpRight } from 'lucide-react';
import api from '../utils/api';

const API_URL_IMAGE = import.meta.env.VITE_API_URL_IMAGE || '';
const getImageUrl = id => {
  if (!id) return '';
  if (typeof id === 'string' && (id.startsWith('http') || id.startsWith('data:'))) return id;
  return `${API_URL_IMAGE}/api/portfolio/image/${id}`;
};

const SkeletonCard = ({ wide }) => (
  <div style={{
    borderRadius: 16, overflow: 'hidden',
    background: '#FFFFFF', border: '1px solid #E8EBF0',
    gridColumn: wide ? 'span 2' : 'span 1',
  }}>
    <div style={{ aspectRatio: wide ? '16/9' : '4/3', background: '#F0F2F5' }} className="skeleton" />
    <div style={{ padding: 'clamp(18px, 2.5vw, 28px)' }}>
      <div style={{ height: 8, width: '22%', background: '#E8EBF0', borderRadius: 4, marginBottom: 12 }} />
      <div style={{ height: 18, width: '55%', background: '#E8EBF0', borderRadius: 6, marginBottom: 10 }} />
      <div style={{ height: 13, width: '80%', background: '#F0F2F5', borderRadius: 4, marginBottom: 16 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        {[1,2,3].map(i => <div key={i} style={{ height: 22, width: 52, background: '#F0F2F5', borderRadius: 100 }} />)}
      </div>
    </div>
  </div>
);

const ProjectCard = ({ project, isRTL, isFeatured }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const title       = isRTL ? (project.titleAr || project.title) : (project.title || project.titleAr);
  const description = isRTL ? (project.descriptionAr || project.description) : (project.description || project.descriptionAr);

  return (
    <Link
      to={`/portfolio/${project._id}`}
      style={{
        display: 'block',
        borderRadius: 16,
        overflow: 'hidden',
        background: '#FFFFFF',
        border: `1px solid ${hovered ? '#C9CDD6' : '#E8EBF0'}`,
        textDecoration: 'none',
        gridColumn: isFeatured ? 'span 2' : 'span 1',
        boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.09)' : '0 1px 3px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'box-shadow 0.25s ease, border-color 0.25s ease, transform 0.25s cubic-bezier(0.16,1,0.3,1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div style={{
        position: 'relative',
        aspectRatio: isFeatured ? '21/9' : '4/3',
        background: '#F6F7F9',
        overflow: 'hidden',
      }}>
        {!imgLoaded && (
          <div style={{ position: 'absolute', inset: 0, background: '#F0F2F5' }} className="skeleton" />
        )}
        <img
          src={getImageUrl(project.coverImage)}
          alt={title}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            opacity: imgLoaded ? 1 : 0,
            transform: hovered ? 'scale(1.04)' : 'scale(1)',
            transition: 'opacity 0.35s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)',
            display: 'block',
          }}
        />

        {/* Category badge */}
        {project.category && (
          <span style={{
            position: 'absolute', top: 14,
            [isRTL ? 'right' : 'left']: 14,
            fontSize: 10, fontWeight: 700, color: '#0D1117',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(0,0,0,0.08)',
            padding: '3px 10px', borderRadius: '100px',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>
            {project.category}
          </span>
        )}

        {/* View arrow on hover */}
        <div style={{
          position: 'absolute', top: 14,
          [isRTL ? 'left' : 'right']: 14,
          width: 32, height: 32,
          borderRadius: '50%',
          background: '#0D1117',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'scale(1)' : 'scale(0.8)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }} aria-hidden>
          <ArrowUpRight style={{ width: 14, height: 14, color: '#FFFFFF' }} />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 'clamp(18px, 2.5vw, 28px)' }}>
        <h3 style={{
          fontSize: isFeatured ? 'clamp(1.125rem, 1.5vw, 1.375rem)' : 'clamp(0.9375rem, 1.1vw, 1.0625rem)',
          fontWeight: 700,
          color: '#0D1117',
          margin: '0 0 6px',
          letterSpacing: '-0.02em',
          lineHeight: 1.3,
        }}>
          {title}
        </h3>

        {description && (
          <p style={{
            fontSize: 13,
            color: '#5C6370',
            lineHeight: 1.65,
            margin: '0 0 14px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {description}
          </p>
        )}

        {project.tags?.length > 0 && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 6,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          }}>
            {project.tags.slice(0, 3).map(tag => (
              <span key={tag} style={{
                fontSize: 10.5, padding: '3px 10px', borderRadius: '100px',
                background: '#F6F7F9', border: '1px solid #E8EBF0',
                color: '#5C6370', fontWeight: 600,
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

const PortfolioSection = () => {
  const { isRTL, dir } = useLanguage();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('All');
  const sectionRef = useRef(null);

  useEffect(() => {
    api.get('/portfolio?featured=true&limit=6')
      .then(({ data }) => setProjects(data.projects || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ['All', ...new Set(projects.map(p => p.category).filter(Boolean))];
  const displayed  = filter === 'All' ? projects : projects.filter(p => p.category === filter);

  return (
    <section
      ref={sectionRef}
      id="portfolio"
      dir={dir}
      style={{
        background: '#FFFFFF',
        paddingTop:    'clamp(5rem, 10vw, 8rem)',
        paddingBottom: 'clamp(5rem, 10vw, 8rem)',
        paddingLeft:   'clamp(1.25rem, 5vw, 3rem)',
        paddingRight:  'clamp(1.25rem, 5vw, 3rem)',
        borderTop: '1px solid #E8EBF0',
      }}
    >
      <style>{`
        .portfolio-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(14px, 2vw, 20px);
        }
        @media (max-width: 900px) {
          .portfolio-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .portfolio-grid > *:first-child {
            grid-column: span 2 !important;
          }
        }
        @media (max-width: 560px) {
          .portfolio-grid { grid-template-columns: 1fr; }
          .portfolio-grid > * { grid-column: span 1 !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .skeleton { animation: none; background: #F0F2F5; }
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 'clamp(1.5rem, 3vw, 2rem)',
          marginBottom: 'clamp(3rem, 6vw, 5rem)',
        }}>
          <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
            <span className="section-label" style={{ marginBottom: 20, display: 'inline-block' }}>
              {isRTL ? 'أعمالنا' : 'Featured Work'}
            </span>
            <h2 style={{
              fontSize: 'var(--text-5xl)',
              fontWeight: 800,
              lineHeight: 1.0,
              letterSpacing: isRTL ? 0 : '-0.035em',
              color: '#0D1117',
              margin: '0 0 12px',
              whiteSpace: 'pre-line',
              fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
            }}>
              {isRTL ? 'منتجات أطلقناها\nفعلاً.' : 'Products we\nactually shipped.'}
            </h2>
            <p style={{
              fontSize: 'clamp(0.9375rem, 1.1vw, 1.0625rem)',
              color: '#5C6370',
              lineHeight: 1.75,
              margin: 0,
              maxWidth: 480,
              fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
            }}>
              {isRTL
                ? 'لا ماكيتات، لا عروض تجريبية. منتجات حقيقية تعمل في الإنتاج.'
                : 'No mockups, no demos. Real products running in production, serving real users.'}
            </p>
          </div>

          <Link
            to="/portfolio"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 600, color: '#0D1117',
              textDecoration: 'none', flexShrink: 0,
              border: '1.5px solid #E8EBF0', borderRadius: '8px',
              padding: '9px 18px',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#0D1117'; e.currentTarget.style.background = '#0D1117'; e.currentTarget.style.color = '#FFFFFF'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8EBF0'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0D1117'; }}
          >
            {isRTL ? 'عرض كل الأعمال' : 'View all work'}
            <ArrowUpRight style={{ width: 14, height: 14, transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
          </Link>
        </div>

        {/* Filter pills */}
        {categories.length > 1 && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 8,
            marginBottom: 'clamp(1.5rem, 3vw, 2.5rem)',
            justifyContent: isRTL ? 'flex-end' : 'flex-start',
          }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                style={{
                  fontSize: 12, fontWeight: 600, padding: '6px 16px',
                  borderRadius: '100px', cursor: 'pointer',
                  border: `1.5px solid ${filter === cat ? '#0D1117' : '#E8EBF0'}`,
                  background: filter === cat ? '#0D1117' : '#FFFFFF',
                  color: filter === cat ? '#FFFFFF' : '#5C6370',
                  transition: 'all 0.15s',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Cards */}
        {loading ? (
          <div className="portfolio-grid">
            <SkeletonCard wide />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9BA3AE' }}>
            {isRTL ? 'لا توجد مشاريع بعد.' : 'No projects yet.'}
          </div>
        ) : (
          <div className="portfolio-grid">
            {displayed.map((project, i) => (
              <ProjectCard
                key={project._id}
                project={project}
                isRTL={isRTL}
                isFeatured={i === 0 && displayed.length > 1}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
};

export default PortfolioSection;
