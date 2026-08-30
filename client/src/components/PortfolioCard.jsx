import { Link } from 'react-router-dom';
import { ArrowUpRight, Play, ShieldCheck } from 'lucide-react';
import ProgressiveImage from './ProgressiveImage';
import { categoryIcon } from '../utils/portfolioTaxonomy';
import { projectOriginLabel } from '../utils/portfolioOrigin';

/**
 * Premium portfolio card — refined uniform 16:10 contained media frame, ambient backdrop,
 * subtle brightness/elevation hover feedback (no foreground zooming), category & delivery badges,
 * headline-metric proof chip, and balanced typography.
 */
const PortfolioCard = ({ project, isRTL, featured = false, priority = false }) => {
  const title       = isRTL ? (project.titleAr || project.title) : (project.title || project.titleAr);
  const tagline     = isRTL ? (project.taglineAr || project.tagline) : (project.tagline || project.taglineAr);
  const description = isRTL ? (project.descriptionAr || project.description) : (project.description || project.descriptionAr);
  const clientName  = isRTL ? (project.client?.nameAr || project.client?.name) : (project.client?.name || project.client?.nameAr);
  const dek         = tagline || description;
  const topMetric   = project.metrics?.[0];
  const categoryName = project.category?.name || '';
  const categoryDisplay = isRTL ? (project.category?.nameAr || categoryName) : categoryName;
  const industryDisplay = isRTL ? (project.industry?.nameAr || project.industry?.name) : project.industry?.name;

  const deliveryStatus = project.deliveryStatus || 'live';
  const deliveryBadge = deliveryStatus === 'concept'
    ? { en: 'Concept', ar: 'مفهوم تصميم' }
    : deliveryStatus === 'archived'
      ? { en: 'Archived', ar: 'مؤرشف' }
      : null;

  const originLabel = projectOriginLabel(project.projectOrigin, isRTL);

  const displayAsset = project.coverImage?.url
    ? project.coverImage
    : (project.gallery || []).find((g) => g?.url) || null;

  const hasVideo = Boolean(project.coverVideo?.url) || (project.gallery || []).some((g) => g?.kind === 'video');

  return (
    <Link
      to={`/portfolio/${project.slug || project._id}`}
      data-card
      className="portfolio-card group relative isolate flex flex-col h-full self-stretch bg-surface-white border border-[rgb(var(--border))] rounded-[20px] overflow-hidden transition-[transform,box-shadow,border-color] duration-400 hover:border-[rgb(var(--border-strong))] hover:shadow-[0_16px_40px_rgba(13,17,23,0.08)] hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))] focus-visible:ring-offset-2"
    >
      {/* Media Frame — Uniform 16:10 ratio with object-contain & ambient blurred background */}
      <div className="relative isolate overflow-hidden bg-[rgb(var(--bg-surface))] aspect-[16/10] w-full">
        <ProgressiveImage
          asset={displayAsset}
          alt={title}
          priority={priority}
          fill
          fit="contain"
          ambient
          style={{ background: 'rgb(var(--bg-surface))' }}
          imgClassName="transition-[filter,opacity] duration-500 group-hover:brightness-[1.03]"
          fallbackIcon={categoryIcon(categoryName)}
          fallbackLabel={categoryDisplay}
          isRTL={isRTL}
          fallbackVariant="card"
        />

        {/* Cinematic gradient for badges and action controls */}
        <div
          className={`absolute inset-0 z-10 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none transition-opacity duration-300 ${topMetric ? 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        />

        {/* Badges row */}
        <div className={`absolute top-3 z-20 flex flex-wrap items-center gap-1.5 ${isRTL ? 'right-3' : 'left-3'}`}>
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-surface-white/95 backdrop-blur-sm border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] tracking-wide shadow-xs">
            {categoryDisplay}
          </span>
          {featured && (
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[rgb(var(--accent))] text-white border border-white/20 tracking-wide shadow-xs">
              {isRTL ? 'مميز' : 'Featured'}
            </span>
          )}
          {industryDisplay && (
            <span className="hidden sm:inline text-[10px] font-semibold px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-sm text-white tracking-wide">
              {industryDisplay}
            </span>
          )}
          {project.presentationMode === 'showcase' && (
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-sm text-white tracking-wide">
              {isRTL ? 'عرض سريع' : 'Quick Look'}
            </span>
          )}
          {deliveryBadge && (
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-600/90 backdrop-blur-sm text-white tracking-wide">
              {isRTL ? deliveryBadge.ar : deliveryBadge.en}
            </span>
          )}
          {originLabel && (
            <span className="hidden sm:inline text-[10px] font-semibold px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-sm text-white tracking-wide">
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
          <span className={`absolute top-3 z-20 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-sm text-white tracking-wide ${isRTL ? 'left-3' : 'right-3'}`}>
            {project.year}
          </span>
        )}

        {/* Headline metric proof chip */}
        {topMetric && (
          <div className={`absolute bottom-3 z-20 ${isRTL ? 'right-3' : 'left-3'}`}>
            <span
              dir="ltr"
              className="inline-flex items-baseline gap-1.5 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/15 shadow-sm"
            >
              <span className="text-xs font-bold text-white tabular-nums">{topMetric.value}</span>
              <span className="text-[9.5px] font-medium text-white/85">{isRTL && topMetric.labelAr ? topMetric.labelAr : topMetric.label}</span>
            </span>
          </div>
        )}

        {/* Corner arrow reveal */}
        <div
          className={`absolute bottom-3 z-20 w-8 h-8 rounded-full bg-[rgb(var(--text-primary))] flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 shadow-md ${isRTL ? 'left-3' : 'right-3'}`}
          aria-hidden="true"
        >
          <ArrowUpRight className={`w-3.5 h-3.5 text-white ${isRTL ? '-scale-x-100' : ''}`} />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col p-5">
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
          className="font-bold text-base sm:text-[17px] text-[rgb(var(--text-primary))] leading-snug mb-1.5 line-clamp-2"
          style={{ letterSpacing: '-0.015em' }}
        >
          {title}
        </h3>
        {dek && (
          <p className="text-xs sm:text-[13px] text-[rgb(var(--text-secondary))] font-normal leading-relaxed line-clamp-2 mb-3">
            {dek}
          </p>
        )}

        {project.technologies?.length > 0 && (
          <div className={`flex flex-wrap gap-1.5 mt-auto pt-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {project.technologies.slice(0, 3).map((tech) => (
              <span
                key={tech._id || tech.name}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))]"
              >
                {tech.name}
              </span>
            ))}
            {project.technologies.length > 3 && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-tertiary))]">
                +{project.technologies.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default PortfolioCard;
