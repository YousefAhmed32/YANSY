import { useState, useMemo } from 'react';
import {
  Building2, TrendingUp, ShoppingBag, HeartPulse, Factory,
  Truck, UtensilsCrossed, GraduationCap, BedDouble, Sparkles,
} from 'lucide-react';
import GeneratedPlaceholder from './BrandedPlaceholder';

/* ═══════════════════════════════════════════════════════════════
   Premium placeholder / real-image system for case study visuals.

   Lookup order (see /public/placeholders/README.md):
     1. /placeholders/case-studies/{slug}.jpg   — per-project image
     2. /placeholders/industries/{industryKey}.jpg — shared industry image
     3. Generated on-brand placeholder (this component draws it)

   Drop a real file into either folder and it's picked up automatically —
   zero code changes required anywhere that renders <CaseStudyVisual>.
   ═══════════════════════════════════════════════════════════════ */

const INDUSTRY_META = {
  'real-estate':  { Icon: Building2,       en: 'Real Estate',        ar: 'العقارات' },
  'fintech-saas': { Icon: TrendingUp,       en: 'FinTech / SaaS',     ar: 'تقنية مالية / SaaS' },
  'ecommerce':    { Icon: ShoppingBag,      en: 'E-Commerce',         ar: 'التجارة الإلكترونية' },
  'healthcare':   { Icon: HeartPulse,       en: 'Healthcare',         ar: 'الرعاية الصحية' },
  'manufacturing':{ Icon: Factory,          en: 'Manufacturing',      ar: 'التصنيع' },
  'logistics':    { Icon: Truck,            en: 'Logistics',          ar: 'اللوجستيات' },
  'restaurants':  { Icon: UtensilsCrossed,  en: 'Restaurants',        ar: 'المطاعم' },
  'education':    { Icon: GraduationCap,    en: 'Education',          ar: 'التعليم' },
  'hospitality':  { Icon: BedDouble,        en: 'Hospitality',        ar: 'الضيافة' },
};

const CaseStudyVisual = ({ slug, industryKey, color = 'rgb(var(--accent))', variant = 'card', isRTL = false, alt = '', style }) => {
  const candidates = useMemo(() => [
    slug && `/placeholders/case-studies/${slug}.jpg`,
    industryKey && `/placeholders/industries/${industryKey}.jpg`,
  ].filter(Boolean), [slug, industryKey]);

  const [idx, setIdx] = useState(0);
  const showGenerated = idx >= candidates.length;

  if (showGenerated) {
    const meta = INDUSTRY_META[industryKey];
    return (
      <div style={{ position: 'absolute', inset: 0, ...style }}>
        <GeneratedPlaceholder icon={meta?.Icon || Sparkles} label={meta ? (isRTL ? meta.ar : meta.en) : ''} color={color} isRTL={isRTL} variant={variant} />
      </div>
    );
  }

  return (
    <img
      src={candidates[idx]}
      alt={alt}
      loading="lazy"
      onError={() => setIdx(i => i + 1)}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style }}
    />
  );
};

export default CaseStudyVisual;
