import { Code2, Layers, PenTool, ShoppingCart, TrendingUp, Workflow } from 'lucide-react';
import GeneratedPlaceholder from './BrandedPlaceholder';

/* ═══════════════════════════════════════════════════════════════
   Generated on-brand placeholder for blog post cover art — mirrors
   <CaseStudyVisual>'s approach (no stock photography site-wide).
   Keyed off the post's category icon/color from data/blogPosts.js.
   ═══════════════════════════════════════════════════════════════ */

const ICON_MAP = {
  code: Code2,
  layers: Layers,
  design: PenTool,
  cart: ShoppingCart,
  growth: TrendingUp,
  automation: Workflow,
};

const BlogVisual = ({ icon, label, color = 'rgb(var(--accent))', variant = 'card', isRTL = false, style }) => (
  <div style={{ position: 'absolute', inset: 0, ...style }}>
    <GeneratedPlaceholder icon={ICON_MAP[icon] || Code2} label={label} color={color} isRTL={isRTL} variant={variant} />
  </div>
);

export default BlogVisual;
