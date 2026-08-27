import { useState } from 'react';
import { Code2, Layers, PenTool, ShoppingCart, TrendingUp, Workflow } from 'lucide-react';
import GeneratedPlaceholder from './BrandedPlaceholder';

// Keep editorial covers inside the Vite module graph. This makes production
// builds emit hashed URLs instead of relying on a host's public-root setup.
const coverModules = import.meta.glob('../assets/blog/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});

const COVER_ASSETS = Object.fromEntries(
  Object.entries(coverModules).map(([path, url]) => [path.split('/').pop(), url]),
);

const ICON_MAP = {
  code: Code2,
  layers: Layers,
  design: PenTool,
  cart: ShoppingCart,
  growth: TrendingUp,
  automation: Workflow,
};

const SLUG_IMAGE_MAP = {
  'how-we-build-high-performance-react-applications': 'blog-web-dev.webp',
  'nextjs-vs-react': 'blog-nextjs.webp',
  'web-performance-optimization': 'blog-performance.webp',
  'true-cost-of-a-website-2025': 'blog-pricing.webp',
  'how-to-choose-web-development-agency': 'blog-agency.webp',
  'progressive-web-apps-vs-native': 'blog-pwa.webp',
  'building-saas-mvp-guide-2025': 'blog-saas.webp',
  'saas-architecture-multi-tenancy': 'saas-security-cover.webp',
  'saas-pricing-guide': 'blog-pricing.webp',
  'authentication-systems-for-saas': 'saas-security-cover.webp',
  'saas-metrics-that-matter': 'blog-performance.webp',
  'from-idea-to-product-market-fit': 'startup-growth-cover.webp',
  'design-systems-why-every-product-needs-one': 'blog-product-design.webp',
  'ux-research-methods': 'ux-research-cover.webp',
  'mobile-first-design': 'blog-pwa.webp',
  'conversion-rate-optimization-ux': 'ux-research-cover.webp',
  'how-we-approach-design-at-yansy': 'blog-product-design.webp',
  'ecommerce-seo-technical-guide': 'blog-ecommerce.webp',
  'headless-commerce-vs-traditional': 'ecommerce-conversion-cover.webp',
  'cart-abandonment-strategies': 'ecommerce-conversion-cover.webp',
  'how-to-build-ecommerce-that-converts': 'blog-ecommerce.webp',
  'multi-currency-ecommerce': 'ecommerce-conversion-cover.webp',
  'digital-transformation-for-smes': 'blog-growth.webp',
  'how-to-build-tech-team': 'startup-growth-cover.webp',
  'hidden-costs-of-bad-software': 'blog-agency.webp',
  'agile-development-for-non-technical': 'startup-growth-cover.webp',
  'business-process-automation-framework': 'blog-automation.webp',
  'booking-systems-build-vs-buy': 'automation-integration-cover.webp',
  'crm-development-when-custom-makes-sense': 'automation-integration-cover.webp',
  'api-integration-guide': 'automation-integration-cover.webp',
};

const CATEGORY_IMAGE_MAP = {
  code: 'blog-web-dev.webp',
  layers: 'blog-saas.webp',
  design: 'blog-product-design.webp',
  cart: 'blog-ecommerce.webp',
  growth: 'blog-growth.webp',
  automation: 'blog-automation.webp',
};

const BlogVisual = ({ icon, label, title, color = 'rgb(var(--accent))', variant = 'card', isRTL = false, style, coverImage, slug, priority = false }) => {
  const [failedSrc, setFailedSrc] = useState(null);

  const suppliedCover = typeof coverImage === 'string'
    ? coverImage
    : coverImage?.srcMd || coverImage?.url;
  const coverName = (slug && SLUG_IMAGE_MAP[slug]) || CATEGORY_IMAGE_MAP[icon] || 'blog-web-dev.webp';
  const imageSrc = suppliedCover || COVER_ASSETS[coverName];

  const imgError = failedSrc === imageSrc;

  if (imgError || !imageSrc) {
    return (
      <div style={{ position: 'absolute', inset: 0, ...style }}>
        <GeneratedPlaceholder icon={ICON_MAP[icon] || Code2} label={label} color={color} isRTL={isRTL} variant={variant} />
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', ...style }}>
      <img
        src={imageSrc}
        alt={label || title || (isRTL ? 'صورة غلاف المقال' : 'Blog article cover')}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        onError={() => setFailedSrc(imageSrc)}
        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
    </div>
  );
};

export default BlogVisual;
