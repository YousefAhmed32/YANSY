import { ShoppingBag, HeartPulse, Building2, UtensilsCrossed, TrendingUp, GraduationCap, BedDouble, Sparkles } from 'lucide-react';

export const CATEGORIES = ['E-commerce', 'Medical', 'Real Estate', 'Restaurants & Food', 'SaaS / Platforms', 'Educational', 'Hotels & Hospitality', 'Other'];

const CATEGORY_LABEL_AR = {
  'E-commerce': 'التجارة الإلكترونية',
  'Medical': 'طبي',
  'Real Estate': 'العقارات',
  'Restaurants & Food': 'المطاعم والأغذية',
  'SaaS / Platforms': 'برمجيات / منصات',
  'Educational': 'تعليمي',
  'Hotels & Hospitality': 'الفنادق والضيافة',
  'Other': 'أخرى',
};

// Icon shown by the branded placeholder when a project has no usable image at all.
const CATEGORY_ICON = {
  'E-commerce': ShoppingBag,
  'Medical': HeartPulse,
  'Real Estate': Building2,
  'Restaurants & Food': UtensilsCrossed,
  'SaaS / Platforms': TrendingUp,
  'Educational': GraduationCap,
  'Hotels & Hospitality': BedDouble,
  'Other': Sparkles,
};

export const categoryLabel = (cat, language) => (language === 'ar' ? (CATEGORY_LABEL_AR[cat] || cat) : cat);
export const categoryIcon  = (cat) => CATEGORY_ICON[cat] || Sparkles;
