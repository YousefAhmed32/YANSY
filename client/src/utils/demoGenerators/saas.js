export default {
  category: 'SaaS / Platforms',
  industry: 'B2B SaaS — Analytics Platform',

  clients: [
    { name: 'Ledgerly Analytics', nameAr: 'ليدجرلي للتحليلات', location: 'San Francisco, USA', locationAr: 'سان فرانسيسكو، الولايات المتحدة' },
    { name: 'Northwind Metrics', nameAr: 'نورثويند للمقاييس', location: 'Berlin, Germany', locationAr: 'برلين، ألمانيا' },
  ],

  titleTemplate: '{client} — Multi-Tenant Analytics SaaS',
  titleTemplateAr: 'منصة تحليلات SaaS متعددة المستأجرين لـ {clientAr}',
  tagline: 'A B2B analytics platform built to onboard a new customer in minutes, not weeks.',
  taglineAr: 'منصة تحليلات B2B مصممة لإعداد عميل جديد خلال دقائق لا أسابيع.',

  description: '{client} was rebuilding its internal reporting tool into a sellable product. We designed and built the multi-tenant SaaS from the ground up — workspace isolation, role-based permissions, a self-serve billing flow, and a dashboard builder customers configure themselves without ever opening a support ticket.',
  descriptionAr: 'كانت {clientAr} بصدد تحويل أداة التقارير الداخلية إلى منتج قابل للبيع. صممنا وبنينا منصة SaaS متعددة المستأجرين من الصفر — عزل مساحات العمل، صلاحيات قائمة على الأدوار، مسار فوترة ذاتي الخدمة، وأداة بناء لوحات تحكم يهيّئها العملاء بأنفسهم دون فتح تذكرة دعم واحدة.',

  myRole: 'Platform architecture, multi-tenant data isolation, and the billing/subscription system end to end.',
  myRoleAr: 'هندسة المنصة، عزل البيانات متعدد المستأجرين، ونظام الفوترة والاشتراكات بالكامل.',

  goals: 'Turn an internal tool into a self-serve product customers can sign up for, configure, and pay for without a sales call, while keeping each customer\'s data provably isolated.',
  goalsAr: 'تحويل أداة داخلية إلى منتج ذاتي الخدمة يمكن للعملاء التسجيل فيه وتهيئته والدفع مقابله دون مكالمة مبيعات، مع ضمان عزل بيانات كل عميل بشكل قابل للإثبات.',

  painPoints: 'The original tool was single-tenant, hardcoded to one company\'s data schema, with no billing, no permission model, and every new "customer" meaning a manual server deployment.',
  painPointsAr: 'كانت الأداة الأصلية أحادية المستأجر ومبنية على مخطط بيانات شركة واحدة بشكل ثابت، دون نظام فوترة أو نموذج صلاحيات، وكان كل "عميل" جديد يعني نشرًا يدويًا على خادم منفصل.',

  challenge: 'Every customer needed strict data isolation and custom dashboards, but the engineering team couldn\'t maintain a forked codebase per client — the platform had to be genuinely multi-tenant while still feeling tailor-made to each workspace.',
  challengeAr: 'احتاج كل عميل إلى عزل بيانات صارم ولوحات تحكم مخصصة، لكن فريق الهندسة لم يستطع صيانة نسخة منفصلة من الكود لكل عميل — كان على المنصة أن تكون متعددة المستأجرين فعليًا مع الحفاظ على إحساس مخصص لكل مساحة عمل.',

  solution: 'We built row-level tenant isolation at the database layer, a drag-and-drop dashboard builder backed by a shared widget library, granular role-based access control, and a self-serve Stripe billing flow with usage-based tiers — all from one shared codebase.',
  solutionAr: 'بنينا عزل مستأجرين على مستوى الصفوف في طبقة قاعدة البيانات، وأداة بناء لوحات تحكم بالسحب والإفلات مدعومة بمكتبة عناصر مشتركة، وتحكمًا دقيقًا بالوصول قائمًا على الأدوار، ومسار فوترة ذاتي الخدمة عبر Stripe بمستويات قائمة على الاستخدام — كل ذلك من قاعدة كود واحدة مشتركة.',

  process: 'We migrated the first three pilot customers manually to validate the isolation model, then opened self-serve signup, instrumenting every onboarding step to find and fix drop-off points before the public launch.',
  processAr: 'رحّلنا أول ثلاثة عملاء تجريبيين يدويًا للتحقق من نموذج العزل، ثم فتحنا التسجيل الذاتي، مع قياس كل خطوة من خطوات الإعداد لاكتشاف نقاط التسرب وإصلاحها قبل الإطلاق العام.',

  results: 'The platform now runs 40+ customer workspaces from one codebase, self-serve signup-to-first-dashboard time dropped to under 10 minutes, and monthly recurring revenue grew steadily as the sales team stopped being a bottleneck for onboarding.',
  resultsAr: 'تدير المنصة الآن أكثر من 40 مساحة عمل لعملاء من قاعدة كود واحدة، وانخفض الوقت من التسجيل الذاتي إلى أول لوحة تحكم إلى أقل من 10 دقائق، ونما الإيراد الشهري المتكرر باطراد بعد أن توقف فريق المبيعات عن كونه عائقًا أمام الإعداد.',

  metrics: [
    { label: 'Time to first dashboard', labelAr: 'الوقت حتى أول لوحة تحكم', value: '< 10 min', trend: 'down' },
    { label: 'Active workspaces', labelAr: 'مساحات العمل النشطة', value: '40+', trend: 'up' },
    { label: 'Monthly recurring revenue', labelAr: 'الإيراد الشهري المتكرر', value: '+65%', trend: 'up' },
    { label: 'Support tickets / customer', labelAr: 'تذاكر الدعم لكل عميل', value: '-70%', trend: 'down' },
  ],

  performanceMetrics: [
    { label: 'Dashboard load time', labelAr: 'زمن تحميل لوحة التحكم', before: '3.8s', after: '0.6s' },
    { label: 'API p95 latency', labelAr: 'زمن استجابة API (p95)', before: '920ms', after: '140ms' },
    { label: 'Onboarding steps', labelAr: 'خطوات الإعداد', before: '18 (manual)', after: '5 (self-serve)' },
  ],

  faqs: [
    { question: 'How is customer data isolated in a shared database?', questionAr: 'كيف يتم عزل بيانات العملاء في قاعدة بيانات مشتركة؟', answer: 'Every query is scoped by a tenant ID enforced at the database and application layer, with automated tests that verify no query can ever cross tenant boundaries.', answerAr: 'يتم تحديد نطاق كل استعلام بمعرّف مستأجر يُفرض على مستوى قاعدة البيانات والتطبيق، مع اختبارات آلية تتحقق من عدم إمكانية تجاوز أي استعلام لحدود المستأجرين.' },
    { question: 'Can customers build their own dashboards?', questionAr: 'هل يمكن للعملاء بناء لوحات تحكم خاصة بهم؟', answer: 'Yes — a drag-and-drop builder lets each workspace compose dashboards from a shared widget library without engineering involvement.', answerAr: 'نعم — تتيح أداة السحب والإفلات لكل مساحة عمل تركيب لوحات تحكم من مكتبة عناصر مشتركة دون تدخل هندسي.' },
    { question: 'How does billing work?', questionAr: 'كيف يعمل نظام الفوترة؟', answer: 'Self-serve subscription tiers via Stripe, with usage-based add-ons metered automatically each billing cycle.', answerAr: 'اشتراكات ذاتية الخدمة عبر Stripe، مع إضافات قائمة على الاستخدام تُحتسب تلقائيًا في كل دورة فوترة.' },
    { question: 'What happens when a customer needs a custom integration?', questionAr: 'ماذا يحدث عندما يحتاج عميل إلى تكامل مخصص؟', answer: 'A webhook and public API layer covers most custom integration needs without touching the core codebase.', answerAr: 'تغطي طبقة الـ webhooks وواجهة API العامة معظم احتياجات التكامل المخصصة دون المساس بقاعدة الكود الأساسية.' },
  ],

  team: [
    { name: 'Priya Nair', role: 'Product Manager', roleAr: 'مديرة منتج' },
    { name: 'Daniel Cho', role: 'Lead Backend Engineer', roleAr: 'مهندس باكند رئيسي' },
    { name: 'Sofia Renna', role: 'Product Designer', roleAr: 'مصممة منتج' },
    { name: 'Ben Okafor', role: 'DevOps Engineer', roleAr: 'مهندس DevOps' },
  ],

  testimonial: {
    quote: 'This is the first time our onboarding hasn\'t required an engineer in the room. Customers sign up, configure their own dashboards, and start paying — that\'s the product we always wanted.',
    quoteAr: 'هذه أول مرة لا يتطلب فيها إعداد العملاء وجود مهندس في الغرفة. يسجّل العملاء بأنفسهم، ويهيئون لوحات تحكمهم، ويبدؤون الدفع — هذا هو المنتج الذي أردناه دائمًا.',
    author: 'VP of Product', role: 'VP of Product', roleAr: 'نائب رئيس المنتج',
  },

  tags: ['React', 'Node.js', 'PostgreSQL', 'Redis', 'Stripe', 'Docker', 'Multi-Tenant SaaS', 'B2B Platform', 'Analytics'],
  duration: '18 weeks',
  teamSize: '4 people',

  businessValue: '{client} converted a cost-center internal tool into a revenue-generating product line, with a self-serve funnel that lets the small sales team focus on enterprise deals instead of manual onboarding.',
  businessValueAr: 'حوّلت {clientAr} أداة داخلية تُعد مركز تكلفة إلى خط منتج مُدرّ للإيرادات، مع قمع مبيعات ذاتي الخدمة يتيح لفريق المبيعات الصغير التركيز على صفقات المؤسسات بدلاً من الإعداد اليدوي.',

  futureImprovements: 'Planned next: SSO/SAML for enterprise customers, a public API rate-limiting dashboard, and white-label branding so agencies can resell the platform under their own name.',
  futureImprovementsAr: 'المخطط له لاحقًا: تسجيل دخول موحد SSO/SAML للعملاء المؤسسيين، لوحة تحكم لتحديد معدل استخدام API العامة، وعلامة تجارية بيضاء تتيح للوكالات إعادة بيع المنصة باسمها الخاص.',

  highlightStats: [
    { value: '40+', label: 'Active workspaces', labelAr: 'مساحة عمل نشطة' },
    { value: '<10 min', label: 'Time to value', labelAr: 'الوقت حتى القيمة' },
    { value: '140ms', label: 'API p95 latency', labelAr: 'زمن استجابة API' },
  ],

  gallerySuggestions: [
    { caption: 'Multi-tenant workspace switcher', captionAr: 'محوّل مساحات العمل متعددة المستأجرين' },
    { caption: 'Drag-and-drop dashboard builder', captionAr: 'أداة بناء لوحات التحكم بالسحب والإفلات' },
    { caption: 'Self-serve billing and plan management screen', captionAr: 'شاشة الفوترة الذاتية وإدارة الخطط' },
    { caption: 'Role-based permissions settings panel', captionAr: 'لوحة إعدادات الصلاحيات القائمة على الأدوار' },
  ],

  metaTitle: '{client} SaaS Case Study — Multi-Tenant Analytics Platform | YANSY Tech',
  metaDescription: 'How we turned {client}\'s internal tool into a self-serve, multi-tenant B2B SaaS platform with under-10-minute onboarding.',
};
