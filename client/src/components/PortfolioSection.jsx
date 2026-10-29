import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowUpRight } from 'lucide-react';
import PortfolioCard from './PortfolioCard';
import SectionHeader from './SectionHeader';
import { categoryLabel } from '../utils/portfolioTaxonomy';

/**
 * Loading skeleton mirroring the uniform 16:10 card layout exactly.
 */
const SkeletonCard = () => (
  <div
    className="portfolio-card flex flex-col h-full self-stretch rounded-[20px] overflow-hidden bg-surface-white border border-[rgb(var(--border))]"
    aria-hidden
  >
    <div className="skeleton aspect-[16/10] w-full" />
    <div className="p-5 flex flex-col flex-1">
      <div className="skeleton" style={{ height: 8, width: '25%', borderRadius: 4, marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 18, width: '65%', borderRadius: 6, marginBottom: 10 }} />
      <div className="skeleton" style={{ height: 12, width: '90%', borderRadius: 4, marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 12, width: '60%', borderRadius: 4, marginBottom: 16 }} />
      <div className="mt-auto pt-2" style={{ display: 'flex', gap: 8 }}>
        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 22, width: 52, borderRadius: 100 }} />)}
      </div>
    </div>
  </div>
);

const PortfolioSection = ({ projects = [], loading = false, failed = false, onRetry }) => {
  const { isRTL, dir } = useLanguage();
  const [filter, setFilter] = useState('All');
  const activeProjects = projects;

  const categories = useMemo(
    () => ['All', ...new Set(activeProjects.map(p => p.category?.name).filter(Boolean))],
    [activeProjects]
  );
  const displayed = filter === 'All' ? activeProjects : activeProjects.filter(p => p.category?.name === filter);

  return (
    <section id="portfolio" dir={dir} className="section-shell section-shell--plain">
      <style>{`
        .portfolio-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: clamp(16px, 2.2vw, 24px);
          align-items: stretch;
        }
        @media (max-width: 900px) {
          .portfolio-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: clamp(16px, 2vw, 20px);
          }
        }
        @media (max-width: 560px) {
          .portfolio-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
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
        .portfolio-viewall-wrap {
          display: flex;
          justify-content: center;
          margin-top: clamp(1.75rem, 3.5vw, 2.5rem);
        }
      `}</style>

      <div className="section-inner">
        <SectionHeader
          eyebrow={isRTL ? 'أعمالنا' : 'Featured Work'}
          title={isRTL ? 'منتجات أطلقناها\nفعلاً.' : 'Products we\nactually shipped.'}
          lead={isRTL
            ? 'لا ماكيتات، لا عروض تجريبية. منتجات حقيقية تعمل في الإنتاج وتخدم مستخدمين حقيقيين.'
            : 'No mockups, no demos. Real products running in production, serving real users.'}
        />

        {/* Filters */}
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
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
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
              {failed && onRetry && <button type="button" onClick={onRetry} className="portfolio-viewall" style={{ marginInlineEnd: 10 }}>{isRTL ? 'إعادة المحاولة' : 'Try again'}</button>}
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
                  priority={i < 3}
                  featured={i === 0}
                />
              ))}
            </div>
          )}
        </div>

        {!loading && displayed.length > 0 && (
          <div className="portfolio-viewall-wrap">
            <Link to="/portfolio" className="portfolio-viewall">
              {isRTL ? 'عرض جميع الأعمال' : 'View all work'}
              <ArrowUpRight style={{ width: 14, height: 14, transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default PortfolioSection;
