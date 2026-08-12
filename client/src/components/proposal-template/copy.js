/**
 * Static chrome copy for the proposal template — every string that isn't
 * admin-entered proposal content (which already carries its own /Ar field
 * pairs). Kept as one small dictionary instead of scattering ar/en ternaries
 * through every section component.
 */
const DICT = {
  preparedFor:      { ar: 'مُعدّ لـ', en: 'Prepared for' },
  preparedOn:       { ar: 'بتاريخ', en: 'on' },
  customExecution:  { ar: 'من الصفر', en: 'from scratch' },
  execution:        { ar: 'التنفيذ', en: 'EXECUTION' },
  timeline:         { ar: 'المدة', en: 'TIMELINE' },
  investment:       { ar: 'الاستثمار', en: 'INVESTMENT' },
  weeks:            { ar: 'أسابيع', en: 'weeks' },
  scopeIncluded:    { ar: 'يشمل نطاق العمل', en: 'SCOPE INCLUDED' },
  finalPriceDiscussed: { ar: 'يتم تحديد الاستثمار النهائي في اجتماع لاحق', en: 'Final investment discussed in a follow-up meeting' },
  termsTitle:       { ar: 'الشروط والأحكام', en: 'Terms & Conditions' },
  scopeLimitations: { ar: 'حدود النطاق', en: 'Scope Limitations' },
  revisionPolicy:   { ar: 'سياسة التعديلات', en: 'Revision Policy' },
  paymentTerms:     { ar: 'شروط الدفع', en: 'Payment Terms' },
  supportPeriod:    { ar: 'فترة الدعم', en: 'Support Period' },
  hostingTerms:     { ar: 'شروط الاستضافة', en: 'Hosting Terms' },
  maintenanceTerms: { ar: 'شروط الصيانة', en: 'Maintenance Terms' },
  ownership:        { ar: 'الملكية', en: 'Ownership' },
  cancellationPolicy: { ar: 'سياسة الإلغاء', en: 'Cancellation Policy' },
  validityPeriod:   { ar: 'فترة صلاحية العرض', en: 'Offer Validity' },
  readyToMoveForward: { ar: 'جاهزون للانطلاق؟', en: 'Ready to move forward?' },
  actionSubtext:    { ar: 'راجع العرض ثم اختر الخطوة التالية', en: 'Review the proposal, then choose your next step' },
  acceptProposal:   { ar: 'قبول العرض', en: 'Accept Proposal' },
  requestChanges:   { ar: 'طلب تعديلات', en: 'Request Changes' },
  contactUs:        { ar: 'تواصل معنا', en: 'Contact Us' },
  downloadPdf:      { ar: 'تحميل PDF', en: 'Download PDF' },
  yourName:         { ar: 'الاسم', en: 'Name' },
  yourEmail:        { ar: 'البريد الإلكتروني', en: 'Email' },
  messageOptional:  { ar: 'رسالة (اختياري)', en: 'Message (optional)' },
  messageRequired:  { ar: 'الرسالة', en: 'Message' },
  cancel:           { ar: 'إلغاء', en: 'Cancel' },
  submit:           { ar: 'إرسال', en: 'Submit' },
  submitting:       { ar: 'جارٍ الإرسال...', en: 'Submitting...' },
  acceptedTitle:    { ar: 'تم قبول العرض ✓', en: 'Proposal accepted ✓' },
  acceptedBody:     { ar: 'شكرًا لك — سيتواصل معك فريقنا قريبًا لبدء المشروع.', en: "Thank you — we'll be in touch shortly to kick things off." },
  changesTitle:     { ar: 'تم إرسال طلبك ✓', en: 'Your request has been sent ✓' },
  changesBody:      { ar: 'سنراجع ملاحظاتك ونعود إليك قريبًا.', en: "We'll review your notes and get back to you shortly." },
  expiredTitle:     { ar: 'انتهت صلاحية هذا العرض', en: 'This proposal has expired' },
  expiredBody:      { ar: 'يرجى التواصل مع YANSY Tech لتجديد العرض.', en: 'Please contact YANSY Tech to renew this proposal.' },
  notFoundTitle:    { ar: 'هذا العرض غير متاح', en: 'This proposal is unavailable' },
  notFoundBody:      { ar: 'تحقق من الرابط أو تواصل مع مُرسِل العرض.', en: 'Check the link or contact whoever sent it to you.' },
  loading:          { ar: 'جارٍ التحميل...', en: 'Loading...' },
  digitalProductStudio: { ar: 'استوديو المنتجات الرقمية', en: 'Digital Product Studio' },
};

export const t = (key, lang = 'ar') => DICT[key]?.[lang] ?? DICT[key]?.ar ?? key;

// Picks the language-appropriate value of a bilingual field pair, falling
// back to whichever half actually has content — admin content is rarely
// filled in both languages for every single field.
export const pickLang = (isRTL, ar, en) => (isRTL ? ar : en) || en || ar || '';

export default DICT;
