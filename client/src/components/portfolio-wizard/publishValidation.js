/**
 * Single source of truth for "is this project ready to publish" — mirrors
 * `assertPublishable` in server/routes/portfolio.routes.js field-for-field
 * (same stable keys: title, category, projectType, description, coverImage)
 * so the client can give instant, specific feedback WITHOUT a round-trip,
 * and so a real backend rejection (network race, stale draft, direct API
 * use) maps onto the exact same field-level UI instead of a second,
 * possibly-contradictory set of rules. If you change what the server
 * requires, change it here too — see the comment on `assertPublishable`.
 *
 * Used by both PortfolioQuickShowcase.jsx (all 5 fields apply) and
 * PortfolioWizard.jsx (projectType is never required for a full case study
 * — see REQUIRED_FIELDS below, unchanged from the pre-existing behavior).
 *
 * Pure logic only (no JSX) — see PublishValidationUI.jsx for the
 * <ErrorSummary>/<PublishReadiness> components that consume this, kept in a
 * separate file so this one stays fast-refresh-friendly.
 */

// Field order matters — it's the order the Error Summary lists problems in
// and the order focus-management walks through on a failed publish attempt.
export const ALL_FIELDS = ['title', 'category', 'projectType', 'description', 'coverImage'];

// `projectType` is only a hard requirement for a Quick Showcase (no
// narrative fields to fall back on for context) — a full Case Study leaves
// it optional, exactly as it did before this field existed.
export const REQUIRED_FIELDS = {
  showcase:  ['title', 'category', 'projectType', 'description', 'coverImage'],
  caseStudy: ['title', 'category', 'description', 'coverImage'],
};

const FIELD_LABEL = {
  title:       { en: 'Title', ar: 'العنوان' },
  category:    { en: 'Category', ar: 'الفئة' },
  projectType: { en: 'Project Type', ar: 'نوع المشروع' },
  description: { en: 'Short Description', ar: 'وصف مختصر' },
  coverImage:  { en: 'Cover Image', ar: 'صورة الغلاف' },
};

const FIELD_MESSAGE = {
  title:       { en: 'Enter the project title.', ar: 'أدخل عنوان المشروع.' },
  category:    { en: 'Select a category.', ar: 'اختر فئة.' },
  projectType: { en: 'Select a project type.', ar: 'اختر نوع المشروع.' },
  description: { en: 'Add a short project description.', ar: 'أضف وصفًا مختصرًا للمشروع.' },
  coverImage:  { en: 'Upload a cover image.', ar: 'ارفع صورة غلاف.' },
};

export const fieldLabel = (field, isRTL) => (FIELD_LABEL[field] ? (isRTL ? FIELD_LABEL[field].ar : FIELD_LABEL[field].en) : field);
export const fieldMessage = (field, isRTL) => (FIELD_MESSAGE[field] ? (isRTL ? FIELD_MESSAGE[field].ar : FIELD_MESSAGE[field].en) : (isRTL ? 'هذا الحقل مطلوب.' : 'This field is required.'));

// Pure, side-effect-free — checks the CLIENT form state (not yet saved) so a
// user gets a specific answer before a network round-trip even happens.
// Field-for-field identical to the backend's `assertPublishable`.
export const computeMissingFields = (form) => {
  const required = REQUIRED_FIELDS[form.presentationMode === 'showcase' ? 'showcase' : 'caseStudy'];
  const missing = [];
  if (!form.title?.trim()) missing.push('title');
  if (!form.category) missing.push('category');
  if (required.includes('projectType') && !form.projectType) missing.push('projectType');
  if (!form.description?.trim()) missing.push('description');
  if (!form.coverImage?.url) missing.push('coverImage');
  // Keep summary order stable (ALL_FIELDS order) regardless of check order above.
  return ALL_FIELDS.filter((f) => missing.includes(f));
};
