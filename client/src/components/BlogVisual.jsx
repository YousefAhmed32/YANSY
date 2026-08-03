import { useState } from 'react';
import { Code2, Layers, PenTool, ShoppingCart, TrendingUp, Workflow } from 'lucide-react';
import GeneratedPlaceholder from './BrandedPlaceholder';

const ICON_MAP = {
  code: Code2,
  layers: Layers,
  design: PenTool,
  cart: ShoppingCart,
  growth: TrendingUp,
  automation: Workflow,
};

const SLUG_IMAGE_MAP = {
  'how-we-build-high-performance-react-applications': '/placeholders/blog-web-dev.jpg',
  'nextjs-vs-react': '/placeholders/blog-nextjs.jpg',
  'web-performance-optimization': '/placeholders/blog-performance.jpg',
  'true-cost-of-a-website-2025': '/placeholders/blog-pricing.jpg',
  'how-to-choose-web-development-agency': '/placeholders/blog-agency.jpg',
  'progressive-web-apps-vs-native': '/placeholders/blog-pwa.jpg',
  'building-saas-mvp-guide-2025': '/placeholders/blog-saas.jpg',
  'saas-architecture-multi-tenancy': '/placeholders/blog-saas.jpg',
  'saas-pricing-guide': '/placeholders/blog-saas.jpg',
  'authentication-systems-for-saas': '/placeholders/blog-saas.jpg',
  'design-systems-why-every-product-needs-one': '/placeholders/blog-product-design.jpg',
  'ecommerce-seo-technical-guide': '/placeholders/blog-ecommerce.jpg',
  'headless-commerce-vs-traditional': '/placeholders/blog-ecommerce.jpg',
  'business-process-automation-framework': '/placeholders/blog-automation.jpg',
  'digital-transformation-for-smes': '/placeholders/blog-growth.jpg',
};

const CATEGORY_IMAGE_MAP = {
  code: '/placeholders/blog-web-dev.jpg',
  layers: '/placeholders/blog-saas.jpg',
  design: '/placeholders/blog-product-design.jpg',
  cart: '/placeholders/blog-ecommerce.jpg',
  growth: '/placeholders/blog-growth.jpg',
  automation: '/placeholders/blog-automation.jpg',
};

const BlogVisual = ({ icon, label, color = 'rgb(var(--accent))', variant = 'card', isRTL = false, style, coverImage, slug }) => {
  const [imgError, setImgError] = useState(false);

  const imageSrc = coverImage || (slug && SLUG_IMAGE_MAP[slug]) || CATEGORY_IMAGE_MAP[icon] || '/placeholders/blog-web-dev.jpg';

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
        alt={label || 'Blog article cover visual'}
        loading="lazy"
        onError={() => setImgError(true)}
        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
    </div>
  );
};

export default BlogVisual;
