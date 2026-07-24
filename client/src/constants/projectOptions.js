// Shared option lists for the Start Project flow (full form + WhatsApp quick-brief).
export const PROJECT_TYPES = [
  { value: 'restaurant', icon: '🍽️', key: 'restaurant' },
  { value: 'clinic',     icon: '🏥', key: 'clinic'     },
  { value: 'pharmacy',   icon: '💊', key: 'pharmacy'   },
  { value: 'ecommerce',  icon: '🛒', key: 'ecommerce'  },
  { value: 'saas',       icon: '⚡', key: 'saas'       },
  { value: 'realestate', icon: '🏢', key: 'realestate' },
  { value: 'education',  icon: '🎓', key: 'education'  },
  { value: 'delivery',   icon: '🚀', key: 'delivery'   },
  { value: 'other',      icon: '💡', key: 'other'      },
];

export const FEATURE_TAGS = [
  { categoryKey: 'auth',         icon: '🔐', tags: ['authBasic','authGoogle','authSocial','authOTP','authRoles','authTwoFactor'] },
  { categoryKey: 'dashboard',    icon: '📊', tags: ['adminPanel','analytics','charts','reports','multiTenant','notifications'] },
  { categoryKey: 'ecommerce',    icon: '🛒', tags: ['productCatalog','cart','payments','invoices','inventory','discounts'] },
  { categoryKey: 'content',      icon: '📝', tags: ['blog','cms','seo','multiLang','fileUpload','mediaGallery'] },
  { categoryKey: 'communication',icon: '💬', tags: ['liveChat','emailNotif','smsNotif','pushNotif','whatsappInteg','videoCall'] },
  { categoryKey: 'advanced',     icon: '⚙️', tags: ['api','mobileApp','aiFeatures','maps','booking','subscription'] },
];

export const BUDGET_OPTIONS = [
  { value: 'less-than-500', icon: '💡', key: 'lessThan500' },
  { value: '500-1000',      icon: '🚀', key: '500to1000'   },
  { value: '1000-3000',     icon: '⭐', key: '1000to3000'  },
  { value: '3000-10000',    icon: '💎', key: '3000to10000' },
  { value: '10000-plus',    icon: '👑', key: '10000plus'   },
];

export const TIMELINE_OPTIONS = [
  { value: 'asap',      icon: '⚡', key: 'asap'        },
  { value: '1month',    icon: '📅', key: '1month'      },
  { value: '2-3months', icon: '🗓️', key: '2to3months'  },
  { value: 'flexible',  icon: '🌊', key: 'flexible'    },
];

export const COMPANY_SIZE_OPTIONS = [
  { value: 'less-than-10', icon: '👥', key: 'lessThan10' },
  { value: '10-50',        icon: '🏬', key: '10to50'     },
  { value: '50-plus',      icon: '🏢', key: '50plus'     },
];
