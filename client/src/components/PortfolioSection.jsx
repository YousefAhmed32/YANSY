import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowUpRight } from 'lucide-react';
import api from '../utils/api';
import PortfolioCard from './PortfolioCard';
import SectionHeader from './SectionHeader';
import { categoryLabel } from '../utils/portfolioTaxonomy';

/**
 * Skeleton mirroring one real card, including the featured variant's
 * `sm:col-span-2 sm:row-span-2`. The previous skeleton spanned 2 columns but
 * not 2 rows and only rendered 3 tiles against a 6-card grid, so the loading
 * state resolved into a visibly different layout than the one it stood in for.
 */
const SkeletonCard = ({ featured = false }) => (
  <div
    className={`rounded-2xl overflow-hidden bg-surface-white border border-[rgb(var(--border))] ${featured ? 'sm:col-span-2 sm:row-span-2' : ''}`}
    aria-hidden
  >
    <div className={`skeleton ${featured ? 'aspect-[16/10]' : 'aspect-[4/3]'}`} />
    <div className={`p-5 ${featured ? 'sm:p-7' : ''}`}>
      <div className="skeleton" style={{ height: 8, width: '22%', borderRadius: 4, marginBottom: 12 }} />
      <div className="skeleton" style={{ height: featured ? 22 : 17, width: '58%', borderRadius: 6, marginBottom: 10 }} />
      <div className="skeleton" style={{ height: 12, width: '85%', borderRadius: 4, marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 12, width: '62%', borderRadius: 4, marginBottom: 16 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 22, width: 52, borderRadius: 100 }} />)}
      </div>
    </div>
  </div>
);

const PortfolioSection = () => {
  const { isRTL, dir } = useLanguage();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [failed, setFailed]     = useState(false);
  const [filter, setFilter]     = useState('All');

  useEffect(() => {
    let alive = true;
    api.get('/portfolio?featured=true&limit=6')
      .then(({ data }) => { if (alive) setProjects(data.projects || []); })
      .catch(() => { if (alive) setFailed(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const categories = useMemo(
    () => ['All', ...new Set(projects.map(p => p.category).filter(Boolean))],
    [projects]
  );
  const displayed = filter === 'All' ? projects : projects.filter(p => p.category === filter);

  return (
    <section id="portfolio" dir={dir} className="section-shell section-shell--plain">
      <style>{`
        .portfolio-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(14px, 2vw, 20px);
          /* The featured card is 2 columns wide, so counts that don't divide
             into the remaining tracks would otherwise leave a hole. */
          grid-auto-flow: dense;
        }
        @media (max-width: 900px) { .portfolio-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) {
          .portfolio-grid { grid-template-columns: 1fr; }
          .portfolio-grid > * { grid-column: span 1 !important; }
        }
        .portfolio-filters {
          display: flex; flex-wrap: wrap; gap: 8px;
          margin-bottom: clamp(1.25rem, 2.5vw, 2rem);
        }
        .portfolio-filter {
          font-size: 12px; font-weight: 600;
          padding: 6px 16px; border-radius: 100px;
          cursor: pointer; background: rgb(var(--bg-elevated));
          border: 1.5px solid rgb(var(--border));
          color: rgb(var(--text-secondary));
          transition: border-color 0.18s, background 0.18s, color 0.18s;
        }
        .portfolio-filter:hover { border-color: rgb(var(--border-strong)); color: rgb(var(--text-primary)); }
        .portfolio-filter[aria-pressed="true"] {
          background: rgb(var(--text-primary));
          border-color: rgb(var(--text-primary));
          color: rgb(var(--bg-elevated));
        }
        .portfolio-viewall {
          display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0;
          font-size: 13px; font-weight: 600; text-decoration: none;
          color: rgb(var(--text-primary));
          border: 1.5px solid rgb(var(--border));
          border-radius: 8px; padding: 9px 18px;
          transition: border-color 0.2s, background 0.2s, color 0.2s;
        }
        .portfolio-viewall:hover {
          background: rgb(var(--text-primary));
          border-color: rgb(var(--text-primary));
          color: rgb(var(--bg-elevated));
        }
        .portfolio-viewall svg { transition: transform 0.25s cubic-bezier(0.16,1,0.3,1); }
        .portfolio-viewall:hover svg { transform: translate(2px, -2px); }
        [dir="rtl"] .portfolio-viewall:hover svg { transform: scaleX(-1) translate(2px, -2px); }
      `}</style>

      <div className="section-inner">
        <SectionHeader
          eyebrow={isRTL ? 'أعمالنا' : 'Featured Work'}
          title={isRTL ? 'منتجات أطلقناها\nفعلاً.' : 'Products we\nactually shipped.'}
          lead={isRTL
            ? 'لا ماكيتات، لا عروض تجريبية. منتجات حقيقية تعمل في الإنتاج وتخدم مستخدمين حقيقيين.'
            : 'No mockups, no demos. Real products running in production, serving real users.'}
          action={
            <Link to="/portfolio" className="portfolio-viewall">
              {isRTL ? 'عرض كل الأعمال' : 'View all work'}
              <ArrowUpRight style={{ width: 14, height: 14, transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
            </Link>
          }
        />

        {/* Filters. Rendered as inert placeholders while loading so the real
            pills don't shove the grid down when the request resolves. */}
        {loading ? (
          <div className="portfolio-filters" aria-hidden>
            {[54, 132, 104, 92].map((w, i) => (
              <div key={i} className="skeleton" style={{ height: 30, width: w, borderRadius: 100 }} />
            ))}
          </div>
        ) : categories.length > 1 ? (
          <div
            className="portfolio-filters"
            role="group"
            aria-label={isRTL ? 'تصفية حسب الفئة' : 'Filter by category'}
            style={{ justifyContent: isRTL ? 'flex-end' : 'flex-start' }}
          >
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                aria-pressed={filter === cat}
                className="portfolio-filter"
              >
                {cat === 'All' ? (isRTL ? 'الكل' : 'All') : categoryLabel(cat, isRTL ? 'ar' : 'en')}
              </button>
            ))}
          </div>
        ) : null}

        {/* Cards */}
        <div aria-busy={loading} aria-live="polite">
          {loading ? (
            <div className="portfolio-grid">
              <SkeletonCard featured />
              {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : displayed.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 'clamp(3rem, 7vw, 5rem) 1.5rem',
              border: '1px dashed rgb(var(--border))',
              borderRadius: 16,
              background: 'rgb(var(--bg-secondary))',
            }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'rgb(var(--text-primary))', margin: '0 0 6px' }}>
                {failed
                  ? (isRTL ? 'تعذر تحميل الأعمال' : "Couldn't load our work")
                  : (isRTL ? 'لا توجد مشاريع في هذه الفئة' : 'No projects in this category')}
              </p>
              <p style={{ fontSize: 13, color: 'rgb(var(--text-secondary))', margin: '0 0 18px' }}>
                {failed
                  ? (isRTL ? 'تصفح معرض الأعمال الكامل بدلاً من ذلك.' : 'Browse the full portfolio instead.')
                  : (isRTL ? 'جرّب فئة أخرى أو تصفح كل الأعمال.' : 'Try another category, or browse everything.')}
              </p>
              <Link to="/portfolio" className="portfolio-viewall">
                {isRTL ? 'عرض كل الأعمال' : 'View all work'}
                <ArrowUpRight style={{ width: 14, height: 14, transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
              </Link>
            </div>
          ) : (
            <div className="portfolio-grid">
              {displayed.map((project, i) => (
                <PortfolioCard
                  key={project._id}
                  project={project}
                  isRTL={isRTL}
                  priority={i === 0}
                  size={i === 0 && displayed.length > 1 ? 'featured' : 'default'}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PortfolioSection;
