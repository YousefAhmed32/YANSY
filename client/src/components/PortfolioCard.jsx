import { Link } from 'react-router-dom';
import { ArrowUpRight, Play, ShieldCheck } from 'lucide-react';
import ProgressiveImage from './ProgressiveImage';
import { categoryIcon } from '../utils/portfolioTaxonomy';
import { projectOriginLabel } from '../utils/portfolioOrigin';

/**
 * Premium portfolio card — cinematic hover, progressive blur-up image reveal,
 * category/industry badges, and (schema v3) a headline-metric proof badge +
 * client/tagline kicker so the card itself carries a little of the case
 * study's payoff, not just its category. `size="featured"` renders the
 * larger spotlight variant.
 *
 * Image fallback chain: cover image -> first gallery image -> generated on-brand
 * placeholder. A card never renders with a blank/empty image area.
 */
const PortfolioCard = ({ project, isRTL, size = 'default', priority = false }) => {
  const title       = isRTL ? (project.titleAr || project.title) : (project.title || project.titleAr);
  const tagline     = isRTL ? (project.taglineAr || project.tagline) : (project.tagline || project.taglineAr);
  const description = isRTL ? (project.descriptionAr || project.description) : (project.description || project.descriptionAr);
  const clientName  = isRTL ? (project.client?.nameAr || project.client?.name) : (project.client?.name || project.client?.nameAr);
  const dek = tagline || description;
  const featured    = size === 'featured';
  const topMetric   = project.metrics?.[0];
  const categoryName = project.category?.name || '';
  const categoryDisplay = isRTL ? (project.category?.nameAr || categoryName) : categoryName;
  const industryDisplay = isRTL ? (project.industry?.nameAr || project.industry?.name) : project.industry?.name;
  // Phase 1 — see PROJECT_REVIEW.md §4/§11. Missing on any project that
  // existed before this field shipped is impossible (schema default +
  // migration backfill both set it to 'live'), but falls back to 'live'
  // defensively either way. Only shown for the non-default states — every
  // pre-existing card already reads as "this is real, live work" without a
  // badge, so only surfacing CONCEPT/ARCHIVED (not LIVE on every card) keeps
  // that unchanged instead of adding a label to every single existing card.
  const deliveryStatus = project.deliveryStatus || 'live';
  const deliveryBadge = deliveryStatus === 'concept'
    ? { en: 'Concept', ar: 'مفهوم تصميم' }
    : deliveryStatus === 'archived'
      ? { en: 'Archived', ar: 'مؤرشف' }
      : null;
  // Independent of deliveryStatus — see server/models/PortfolioProject.js's
  // v3.4 doc comment. Only rendered when an admin has actually classified
  // the project (no default value to fall back to, unlike deliveryStatus).
  const originLabel = projectOriginLabel(project.projectOrigin, isRTL);

  const displayAsset = project.coverImage?.url
    ? project.coverImage
    : (project.gallery || []).find((g) => g?.url) || null;
  // A visitor shouldn't have to open the project to discover it's a video
  // walkthrough rather than screenshots — surface it on the card itself.
  const hasVideo = Boolean(project.coverVideo?.url) || (project.gallery || []).some((g) => g?.kind === 'video');

  return (
    <Link
      to={`/portfolio/${project.slug || project._id}`}
      data-card
      /* The featured card spans two columns but deliberately NOT two rows.
         Row-spanning stretched it to the height of two stacked cards while its
         content stayed short, so `mt-auto` on the tag row opened a dead gap of
         several hundred pixels mid-card — and any project count that didn't
         divide evenly left an empty cell in the grid. One row wide is the same
         spotlight emphasis without either artifact. */
      className={`group relative flex flex-col bg-surface-white border border-[rgb(var(--border))] rounded-2xl overflow-hidden transition-all duration-500 hover:border-[rgb(var(--border-strong))] hover:shadow-[0_20px_50px_rgba(13,17,23,0.08)] hover:-translate-y-1 ${featured ? 'sm:col-span-2' : ''}`}
    >
      {/* Image */}
      <div className={`relative overflow-hidden ${featured ? 'aspect-[16/10]' : 'aspect-[4/3]'}`}>
        <ProgressiveImage
          asset={displayAsset}
          alt={title}
          priority={priority}
          fill
          imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          fallbackIcon={categoryIcon(categoryName)}
          fallbackLabel={categoryDisplay}
          isRTL={isRTL}
          fallbackVariant={featured ? 'hero' : 'card'}
        />

        {/* Cinematic gradient — always on when there's a metric badge to
            ground (for legibility), hover-only otherwise so the image stays
            clean by default. */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent transition-opacity duration-500 ${topMetric ? 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />

        {/* Badges */}
        <div className={`absolute top-3 flex flex-wrap gap-1.5 ${isRTL ? 'right-3' : 'left-3'}`}>
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-surface-white/95 backdrop-blur-sm border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] tracking-wide">
            {categoryDisplay}
          </span>
          {industryDisplay && (
            <span className="hidden sm:inline text-[10px] font-semibold px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white tracking-wide">
              {industryDisplay}
            </span>
          )}
          {project.presentationMode === 'showcase' && (
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white tracking-wide">
              {isRTL ? 'عرض سريع' : 'Quick Look'}
            </span>
          )}
          {deliveryBadge && (
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[rgb(var(--accent))]/90 backdrop-blur-sm text-white tracking-wide">
              {isRTL ? deliveryBadge.ar : deliveryBadge.en}
            </span>
          )}
          {originLabel && (
            <span className="hidden sm:inline text-[10px] font-semibold px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white tracking-wide">
              {originLabel}
            </span>
          )}
          {hasVideo && (
            <span
              title={isRTL ? 'يحتوي على فيديو' : 'Includes video'}
              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-black/45 backdrop-blur-sm text-white"
            >
              <Play className="w-2.5 h-2.5" fill="currentColor" style={{ marginInlineStart: 1 }} />
            </span>
          )}
        </div>

        {/* Year */}
        {project.year && (
          <span className={`absolute top-3 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white tracking-wide ${isRTL ? 'left-3' : 'right-3'}`}>
            {project.year}
          </span>
        )}

        {/* Headline metric — the card's proof point, echoing the hero's
            glass chips so the payoff is visible before the visitor even clicks. */}
        {topMetric && (
          <div className={`absolute bottom-3 ${isRTL ? 'right-3' : 'left-3'}`}>
            <span
              dir="ltr"
              className="inline-flex items-baseline gap-1.5 px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-sm border border-white/10"
            >
              <span className="text-xs font-bold text-white tabular-nums">{topMetric.value}</span>
              <span className="text-[9.5px] font-medium text-white/70">{isRTL && topMetric.labelAr ? topMetric.labelAr : topMetric.label}</span>
            </span>
          </div>
        )}

        {/* Arrow reveal */}
        <div
          className={`absolute bottom-3 w-9 h-9 rounded-full bg-[rgb(var(--text-primary))] flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 ${isRTL ? 'left-3' : 'right-3'}`}
          aria-hidden="true"
        >
          <ArrowUpRight className={`w-4 h-4 text-white ${isRTL ? '-scale-x-100' : ''}`} />
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 flex flex-col p-5 ${featured ? 'sm:p-7' : ''}`}>
        {(clientName || project.confidential) && (
          <div className="flex items-center gap-1.5 mb-1.5">
            {clientName ? (
              <span className="text-[10.5px] font-semibold text-[rgb(var(--text-tertiary))] tracking-wide uppercase">{clientName}</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-[rgb(var(--text-tertiary))]">
                <ShieldCheck className="w-3 h-3" aria-hidden />
                {isRTL ? 'عميل سري' : 'Confidential client'}
              </span>
            )}
          </div>
        )}

        <h3
          className={`font-bold text-[rgb(var(--text-primary))] leading-tight mb-1.5 ${featured ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'}`}
          style={{ letterSpacing: '-0.02em' }}
        >
          {title}
        </h3>
        {dek && (
          <p className={`text-[rgb(var(--text-secondary))] font-normal leading-relaxed line-clamp-2 mb-3 ${featured ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'}`}>
            {dek}
          </p>
        )}

        {project.technologies?.length > 0 && (
          <div className={`flex flex-wrap gap-1.5 mt-auto pt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {project.technologies.slice(0, featured ? 5 : 3).map((tech) => (
              <span
                key={tech._id}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))]"
              >
                {tech.name}
              </span>
            ))}
            {project.technologies.length > (featured ? 5 : 3) && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-tertiary))]">
                +{project.technologies.length - (featured ? 5 : 3)}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default PortfolioCard;
