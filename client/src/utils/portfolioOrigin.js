/**
 * Shared "Project Origin" taxonomy — one source of truth for the admin field
 * (components/portfolio-wizard/ProjectOriginField.jsx) and every public
 * renderer that shows the origin badge (PortfolioCard, Hero, and
 * PortfolioShowcaseView), so the four values/labels can never drift between
 * where they're set and where they're displayed. See the v3.4 doc comment
 * in server/models/PortfolioProject.js for the field's full rationale.
 */
export const PROJECT_ORIGIN_OPTIONS = [
  { value: 'clientWork', en: 'Client Work', ar: 'مشروع عميل' },
  { value: 'selfInitiated', en: 'Self-Initiated', ar: 'مشروع ذاتي' },
  { value: 'internalProduct', en: 'Internal Product', ar: 'منتج داخلي' },
  { value: 'experimental', en: 'Experimental Concept', ar: 'تجربة تصورية' },
];

export const projectOriginLabel = (value, isRTL) => {
  const opt = PROJECT_ORIGIN_OPTIONS.find((o) => o.value === value);
  return opt ? (isRTL ? opt.ar : opt.en) : null;
};
