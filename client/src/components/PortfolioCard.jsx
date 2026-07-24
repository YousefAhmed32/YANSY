import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import ProgressiveImage from './ProgressiveImage';
import { categoryLabel, categoryIcon } from '../utils/portfolioTaxonomy';

/**
 * Premium portfolio card — cinematic hover, progressive blur-up image reveal,
 * category/industry badges. `size="featured"` renders the larger spotlight variant.
 *
 * Image fallback chain: cover image -> first gallery image -> generated on-brand
 * placeholder. A card never renders with a blank/empty image area.
 */
const PortfolioCard = ({ project, isRTL, size = 'default', priority = false }) => {
  const title       = isRTL ? (project.titleAr || project.title) : (project.title || project.titleAr);
  const description = isRTL ? (project.descriptionAr || project.description) : (project.description || project.descriptionAr);
  const featured    = size === 'featured';

  const displayAsset = project.coverImage?.url
    ? project.coverImage
    : (project.gallery || []).find((g) => g?.url) || null;

  return (
    <Link
      to={`/portfolio/${project.slug || project._id}`}
      data-card
      className={`group relative flex flex-col bg-white border border-[#E8EBF0] rounded-2xl overflow-hidden transition-all duration-500 hover:border-[#C9CDD6] hover:shadow-[0_20px_50px_rgba(13,17,23,0.08)] hover:-translate-y-1 ${featured ? 'sm:col-span-2 sm:row-span-2' : ''}`}
    >
      {/* Image */}
      <div className={`relative overflow-hidden ${featured ? 'aspect-[16/10]' : 'aspect-[4/3]'}`}>
        <ProgressiveImage
          asset={displayAsset}
          alt={title}
          priority={priority}
          fill
          imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          fallbackIcon={categoryIcon(project.category)}
          fallbackLabel={categoryLabel(project.category, isRTL ? 'ar' : 'en')}
          isRTL={isRTL}
          fallbackVariant={featured ? 'hero' : 'card'}
        />

        {/* Cinematic gradient on hover only — image stays clean by default */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Badges */}
        <div className={`absolute top-3 flex flex-wrap gap-1.5 ${isRTL ? 'right-3' : 'left-3'}`}>
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm border border-black/5 text-[#0D1117] tracking-wide">
            {project.category}
          </span>
          {project.industry && (
            <span className="hidden sm:inline text-[10px] font-semibold px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white tracking-wide">
              {project.industry}
            </span>
          )}
        </div>

        {/* Year */}
        {project.year && (
          <span className={`absolute top-3 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white tracking-wide ${isRTL ? 'left-3' : 'right-3'}`}>
            {project.year}
          </span>
        )}

        {/* Arrow reveal */}
        <div
          className={`absolute bottom-3 w-9 h-9 rounded-full bg-[#0D1117] flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 ${isRTL ? 'left-3' : 'right-3'}`}
          aria-hidden="true"
        >
          <ArrowUpRight className={`w-4 h-4 text-white ${isRTL ? '-scale-x-100' : ''}`} />
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 flex flex-col p-5 ${featured ? 'sm:p-7' : ''}`}>
        <h3
          className={`font-bold text-[#0D1117] leading-tight mb-1.5 ${featured ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'}`}
          style={{ letterSpacing: '-0.02em' }}
        >
          {title}
        </h3>
        {description && (
          <p className={`text-[#5C6370] font-normal leading-relaxed line-clamp-2 mb-3 ${featured ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'}`}>
            {description}
          </p>
        )}

        {project.tags?.length > 0 && (
          <div className={`flex flex-wrap gap-1.5 mt-auto pt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {project.tags.slice(0, featured ? 5 : 3).map((tag, i) => (
              <span
                key={`${tag}-${i}`}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F6F7F9] border border-[#E8EBF0] text-[#5C6370]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

export default PortfolioCard;
