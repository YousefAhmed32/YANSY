import { Users, Building2, Cpu, Tag as TagIcon, Quote, Award as AwardIcon, LayoutGrid, Globe2, Wrench, Layers } from 'lucide-react';

/**
 * Declarative config per reusable content library — drives AdminLibrary.jsx
 * (a single generic CRUD page) instead of ~9 hand-built admin pages. Field
 * `key`s match the Mongoose model fields exactly (server/models/*.js) so the
 * form can be submitted to the library router factory's POST/PATCH as-is.
 *
 * Field shape: { key, labelEn, labelAr, required, type, dir, apiBase, options }
 *   type: 'text' (default) | 'textarea' | 'number' | 'select' | 'switch' | 'relation'
 *   apiBase: only for type:'relation' — the related library's API base path
 *   options: only for type:'select' — [{ value, labelEn, labelAr }]
 */
export const LIBRARY_CONFIGS = {
  team: {
    apiBase: '/team',
    icon: Users,
    labelEn: 'Team Members', labelAr: 'أعضاء الفريق',
    itemLabelEn: 'team member', itemLabelAr: 'عضو فريق',
    displayField: 'name',
    hasAvatar: true, avatarField: 'avatar',
    fields: [
      { key: 'name', labelEn: 'Name', labelAr: 'الاسم', required: true },
      { key: 'nameAr', labelEn: 'Name (Arabic)', labelAr: 'الاسم (عربي)', dir: 'rtl' },
      { key: 'position', labelEn: 'Position', labelAr: 'المنصب' },
      { key: 'positionAr', labelEn: 'Position (Arabic)', labelAr: 'المنصب (عربي)', dir: 'rtl' },
      { key: 'email', labelEn: 'Email', labelAr: 'البريد الإلكتروني' },
      { key: 'status', labelEn: 'Status', labelAr: 'الحالة', type: 'select', options: [
        { value: 'active', labelEn: 'Active', labelAr: 'نشط' },
        { value: 'inactive', labelEn: 'Inactive', labelAr: 'غير نشط' },
      ] },
    ],
    columns: ['name', 'position', 'status'],
  },

  clients: {
    apiBase: '/clients',
    icon: Building2,
    labelEn: 'Clients', labelAr: 'العملاء',
    itemLabelEn: 'client', itemLabelAr: 'عميل',
    displayField: 'name',
    // square + contain (not the circle + cover used for people photos below) —
    // brand logos are usually wordmarks or non-square marks that a circular
    // crop / cover-fit would mangle.
    hasAvatar: true, avatarField: 'logo', avatarShape: 'square', avatarFit: 'contain',
    fields: [
      { key: 'name', labelEn: 'Name', labelAr: 'الاسم', required: true },
      { key: 'nameAr', labelEn: 'Name (Arabic)', labelAr: 'الاسم (عربي)', dir: 'rtl' },
      { key: 'country', labelEn: 'Country', labelAr: 'الدولة' },
      { key: 'website', labelEn: 'Website', labelAr: 'الموقع الإلكتروني' },
      { key: 'industry', labelEn: 'Industry', labelAr: 'الصناعة', type: 'relation', apiBase: '/industries' },
      { key: 'description', labelEn: 'Description', labelAr: 'الوصف', type: 'textarea' },
      { key: 'descriptionAr', labelEn: 'Description (Arabic)', labelAr: 'الوصف (عربي)', type: 'textarea', dir: 'rtl' },
    ],
    columns: ['name', 'country', 'website'],
  },

  technologies: {
    apiBase: '/technologies',
    icon: Cpu,
    labelEn: 'Technologies', labelAr: 'التقنيات',
    itemLabelEn: 'technology', itemLabelAr: 'تقنية',
    displayField: 'name',
    fields: [
      { key: 'name', labelEn: 'Name', labelAr: 'الاسم', required: true },
      { key: 'category', labelEn: 'Category', labelAr: 'الفئة' },
      { key: 'color', labelEn: 'Accent color', labelAr: 'اللون' },
      { key: 'icon', labelEn: 'Icon', labelAr: 'الأيقونة' },
    ],
    columns: ['name', 'category', 'usageCount'],
  },

  tags: {
    apiBase: '/tags',
    icon: TagIcon,
    labelEn: 'Project Tags', labelAr: 'وسوم المشاريع',
    itemLabelEn: 'tag', itemLabelAr: 'وسم',
    displayField: 'name',
    fields: [
      { key: 'name', labelEn: 'Name', labelAr: 'الاسم', required: true },
      { key: 'nameAr', labelEn: 'Name (Arabic)', labelAr: 'الاسم (عربي)', dir: 'rtl' },
    ],
    columns: ['name', 'usageCount'],
  },

  testimonials: {
    apiBase: '/testimonials',
    icon: Quote,
    labelEn: 'Testimonials', labelAr: 'الشهادات',
    itemLabelEn: 'testimonial', itemLabelAr: 'شهادة',
    displayField: 'author',
    hasAvatar: true, avatarField: 'avatar',
    fields: [
      { key: 'author', labelEn: 'Author', labelAr: 'الكاتب', required: true },
      { key: 'authorAr', labelEn: 'Author (Arabic)', labelAr: 'الكاتب (عربي)', dir: 'rtl' },
      { key: 'role', labelEn: 'Role', labelAr: 'المنصب' },
      { key: 'roleAr', labelEn: 'Role (Arabic)', labelAr: 'المنصب (عربي)', dir: 'rtl' },
      { key: 'quote', labelEn: 'Quote', labelAr: 'الاقتباس', type: 'textarea', required: true },
      { key: 'quoteAr', labelEn: 'Quote (Arabic)', labelAr: 'الاقتباس (عربي)', type: 'textarea', dir: 'rtl' },
      { key: 'client', labelEn: 'Client', labelAr: 'العميل', type: 'relation', apiBase: '/clients' },
    ],
    columns: ['author', 'quote'],
  },

  awards: {
    apiBase: '/awards',
    icon: AwardIcon,
    labelEn: 'Awards & Certifications', labelAr: 'الجوائز والشهادات',
    itemLabelEn: 'award', itemLabelAr: 'جائزة',
    displayField: 'title',
    fields: [
      { key: 'title', labelEn: 'Title', labelAr: 'العنوان', required: true },
      { key: 'titleAr', labelEn: 'Title (Arabic)', labelAr: 'العنوان (عربي)', dir: 'rtl' },
      { key: 'org', labelEn: 'Issuing organization', labelAr: 'الجهة المانحة' },
      { key: 'orgAr', labelEn: 'Issuing organization (Arabic)', labelAr: 'الجهة المانحة (عربي)', dir: 'rtl' },
      { key: 'year', labelEn: 'Year', labelAr: 'السنة', type: 'number' },
      { key: 'url', labelEn: 'URL', labelAr: 'الرابط' },
      { key: 'type', labelEn: 'Type', labelAr: 'النوع', type: 'select', options: [
        { value: 'award', labelEn: 'Award', labelAr: 'جائزة' },
        { value: 'certification', labelEn: 'Certification', labelAr: 'شهادة' },
      ] },
    ],
    columns: ['title', 'org', 'year'],
  },

  categories: {
    apiBase: '/categories',
    icon: LayoutGrid,
    labelEn: 'Categories', labelAr: 'الفئات',
    itemLabelEn: 'category', itemLabelAr: 'فئة',
    displayField: 'name',
    fields: [
      { key: 'name', labelEn: 'Name', labelAr: 'الاسم', required: true },
      { key: 'nameAr', labelEn: 'Name (Arabic)', labelAr: 'الاسم (عربي)', dir: 'rtl' },
      { key: 'icon', labelEn: 'Icon', labelAr: 'الأيقونة' },
      { key: 'order', labelEn: 'Order', labelAr: 'الترتيب', type: 'number' },
      { key: 'isActive', labelEn: 'Active', labelAr: 'مفعّل', type: 'switch' },
    ],
    columns: ['name', 'order', 'isActive'],
  },

  industries: {
    apiBase: '/industries',
    icon: Globe2,
    labelEn: 'Industries', labelAr: 'الصناعات',
    itemLabelEn: 'industry', itemLabelAr: 'صناعة',
    displayField: 'name',
    fields: [
      { key: 'name', labelEn: 'Name', labelAr: 'الاسم', required: true },
      { key: 'nameAr', labelEn: 'Name (Arabic)', labelAr: 'الاسم (عربي)', dir: 'rtl' },
      { key: 'icon', labelEn: 'Icon', labelAr: 'الأيقونة' },
      { key: 'order', labelEn: 'Order', labelAr: 'الترتيب', type: 'number' },
      { key: 'isActive', labelEn: 'Active', labelAr: 'مفعّل', type: 'switch' },
    ],
    columns: ['name', 'order', 'isActive'],
  },

  services: {
    apiBase: '/services',
    icon: Wrench,
    labelEn: 'Services', labelAr: 'الخدمات',
    itemLabelEn: 'service', itemLabelAr: 'خدمة',
    displayField: 'name',
    fields: [
      { key: 'name', labelEn: 'Name', labelAr: 'الاسم', required: true },
      { key: 'nameAr', labelEn: 'Name (Arabic)', labelAr: 'الاسم (عربي)', dir: 'rtl' },
      { key: 'icon', labelEn: 'Icon', labelAr: 'الأيقونة' },
      { key: 'description', labelEn: 'Description', labelAr: 'الوصف', type: 'textarea' },
      { key: 'descriptionAr', labelEn: 'Description (Arabic)', labelAr: 'الوصف (عربي)', type: 'textarea', dir: 'rtl' },
      { key: 'order', labelEn: 'Order', labelAr: 'الترتيب', type: 'number' },
      { key: 'isActive', labelEn: 'Active', labelAr: 'مفعّل', type: 'switch' },
    ],
    columns: ['name', 'order', 'isActive'],
  },
  projectTypes: {
    apiBase: '/project-types',
    icon: Layers,
    labelEn: 'Project Types', labelAr: 'أنواع المشاريع',
    itemLabelEn: 'project type', itemLabelAr: 'نوع مشروع',
    displayField: 'name',
    fields: [
      { key: 'name', labelEn: 'Name', labelAr: 'الاسم', required: true },
      { key: 'nameAr', labelEn: 'Name (Arabic)', labelAr: 'الاسم (عربي)', dir: 'rtl' },
      { key: 'icon', labelEn: 'Icon', labelAr: 'الأيقونة' },
      { key: 'order', labelEn: 'Order', labelAr: 'الترتيب', type: 'number' },
      // Drives the wizard/public-page hiding of Client, Live URL, KPIs,
      // Testimonials, Awards, and Business Results for any project of this
      // type (see server/models/ProjectType.js) — an admin-editable switch
      // rather than a hardcoded slug, so a future type gets the same
      // behavior just by ticking it on.
      { key: 'isConceptType', labelEn: 'Concept type (no client/live product)', labelAr: 'نوع تصميم مفاهيمي (بدون عميل/منتج مباشر)', type: 'switch' },
      { key: 'isActive', labelEn: 'Active', labelAr: 'مفعّل', type: 'switch' },
    ],
    columns: ['name', 'order', 'isActive'],
  },
};

export const LIBRARY_ORDER = ['team', 'clients', 'technologies', 'tags', 'testimonials', 'awards', 'categories', 'industries', 'services', 'projectTypes'];
