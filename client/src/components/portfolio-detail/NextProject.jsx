import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import Reveal from '../Reveal';
import ProgressiveImage from '../ProgressiveImage';
import PortfolioCard from '../PortfolioCard';
import { categoryLabel, categoryIcon } from '../../utils/portfolioTaxonomy';

/**
 * A single large cinematic "next case study" panel rather than the flat
 * grid of cards this replaces — the genre convention for studio/portfolio
 * sites (Instrument, Basic, etc.) ends a case study with one immersive
 * next-project reveal, not a disconnected "more work" listing. Any further
 * related projects still get a supporting row underneath.
 */
const NextProject = ({ nextProject, moreProjects, isRTL }) => {
  if (!nextProject) return null;

  const title = isRTL ? (nextProject.titleAr || nextProject.title) : (nextProject.title || nextProject.titleAr);
  const asset = nextProject.coverImage?.url ? nextProject.coverImage : (nextProject.gallery || []).find((g) => g?.url) || null;

  return (
    <section className="section-shell section-shell--plain" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="section-inner">
        <Reveal distance={16}>
          <span className="section-label" style={{ marginBottom: 22, display: 'inline-flex' }}>
            {isRTL ? 'المشروع التالي' : 'Next Case Study'}
          </span>

          <Link
            to={`/portfolio/${nextProject.slug || nextProject._id}`}
            className="group next-project-panel"
            style={{
              position: 'relative', display: 'block', width: '100%', aspectRatio: '21 / 9',
              borderRadius: 'var(--radius-xl)', overflow: 'hidden', textDecoration: 'none',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, transition: 'transform 0.8s cubic-bezier(0.16,1,0.3,1)' }} className="next-project-image">
              <ProgressiveImage
                asset={asset}
                alt={title}
                fill
                fallbackIcon={categoryIcon(nextProject.category)}
                fallbackLabel={categoryLabel(nextProject.category, isRTL ? 'ar' : 'en')}
                isRTL={isRTL}
                fallbackVariant="hero"
              />
            </div>
            <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,17,23,0.82) 0%, rgba(13,17,23,0.15) 55%, transparent 75%)' }} />

            <div style={{
              position: 'absolute', bottom: 0, insetInlineStart: 0, insetInlineEnd: 0,
              padding: 'clamp(1.5rem, 4vw, 3rem)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16,
              flexDirection: isRTL ? 'row-reverse' : 'row',
            }}>
              <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                <p style={{ fontSize: 11, letterSpacing: isRTL ? 0 : '0.14em', textTransform: isRTL ? 'none' : 'uppercase', color: 'rgba(255,255,255,0.65)', marginBottom: 8, fontWeight: 500 }}>
                  {categoryLabel(nextProject.category, isRTL ? 'ar' : 'en')}
                </p>
                <h3 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.75rem)', fontWeight: 800, color: '#fff', lineHeight: 1.08, letterSpacing: isRTL ? 0 : '-0.03em', margin: 0, maxWidth: '18ch' }}>
                  {title}
                </h3>
              </div>
              <div
                aria-hidden
                className="next-project-arrow"
                style={{
                  width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), background 0.3s',
                }}
              >
                <ArrowUpRight style={{ width: 20, height: 20, color: '#fff', transform: isRTL ? 'scaleX(-1)' : 'none' }} />
              </div>
            </div>
          </Link>
        </Reveal>

        {moreProjects?.length > 0 && (
          <Reveal distance={16} style={{ marginTop: 'clamp(3rem, 6vw, 4.5rem)' }}>
            <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgb(var(--text-tertiary))', fontWeight: 700, marginBottom: 20, textAlign: isRTL ? 'right' : 'left' }}>
              {isRTL ? 'المزيد من أعمالنا' : 'More Work'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {moreProjects.slice(0, 3).map((p) => (
                <PortfolioCard key={p._id} project={p} isRTL={isRTL} />
              ))}
            </div>
          </Reveal>
        )}
      </div>

      <style>{`
        .next-project-panel:hover .next-project-image { transform: scale(1.045); }
        .next-project-panel:hover .next-project-arrow { transform: scale(1.08) ${isRTL ? 'rotate(45deg)' : 'rotate(-45deg)'}; background: rgb(var(--accent)); border-color: rgb(var(--accent)); }
        @media (max-width: 640px) { .next-project-panel { aspect-ratio: 4 / 5 !important; } }
        @media (prefers-reduced-motion: reduce) {
          .next-project-image, .next-project-arrow { transition: none !important; }
        }
      `}</style>
    </section>
  );
};

export default NextProject;
