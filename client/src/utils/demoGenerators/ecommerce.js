export default {
  category: 'E-commerce',
  industry: 'E-Commerce — Direct-to-Consumer Retail',

  clients: [
    { name: 'Wildcraft Goods', nameAr: 'وايلدكرافت جودز', location: 'Austin, USA', locationAr: 'أوستن، الولايات المتحدة' },
    { name: 'Nakheel Market', nameAr: 'سوق نخيل', location: 'Cairo, Egypt', locationAr: 'القاهرة، مصر' },
  ],

  titleTemplate: '{client} — Headless D2C Storefront',
  titleTemplateAr: 'متجر إلكتروني مباشر بدون واجهة (Headless) لـ {clientAr}',
  tagline: 'A storefront fast enough that slow load times stopped being the reason carts got abandoned.',
  taglineAr: 'متجر سريع بما يكفي ليتوقف بطء التحميل عن كونه سبب التخلي عن سلة الشراء.',

  description: '{client} had outgrown its templated storefront — slow product pages, a clunky checkout, and no room to customize the shopping experience. We rebuilt it as a headless storefront with a custom product configurator, a streamlined one-page checkout, and real-time inventory sync across warehouses.',
  descriptionAr: 'تجاوزت {clientAr} حدود متجرها القائم على القوالب الجاهزة — صفحات منتجات بطيئة، دفع مرهق، ولا مساحة لتخصيص تجربة التسوق. أعدنا بناءه كمتجر بدون واجهة (headless) مع أداة تخصيص منتج مخصصة، دفع مبسّط في صفحة واحدة، ومزامنة مخزون لحظية عبر المستودعات.',

  myRole: 'Full-stack engineering, checkout UX redesign, and the product configurator build.',
  myRoleAr: 'الهندسة الكاملة، إعادة تصميم تجربة الدفع، وبناء أداة تخصيص المنتج.',

  goals: 'Cut checkout abandonment, get product page load times under two seconds, and let customers customize products without a page reload.',
  goalsAr: 'خفض معدل التخلي عن الدفع، وخفض زمن تحميل صفحات المنتجات إلى أقل من ثانيتين، وتمكين العملاء من تخصيص المنتجات دون إعادة تحميل الصفحة.',

  painPoints: 'Checkout took five steps across separate page loads, product images weren\'t optimized and dragged page load past six seconds on mobile, and inventory counts across two warehouses regularly went out of sync, causing overselling.',
  painPointsAr: 'كان الدفع يتطلب خمس خطوات عبر صفحات منفصلة، ولم تكن صور المنتجات محسّنة ما أطال زمن التحميل على الجوال لأكثر من ست ثوانٍ، وكان عدّاد المخزون بين مستودعين يخرج عن التزامن بانتظام، ما تسبب في بيع أكثر من المتوفر.',

  challenge: 'The rebuild had to preserve SEO rankings built over years on the old storefront while completely replacing its architecture — a migration that had to be invisible to Google and existing customers with saved carts and accounts.',
  challengeAr: 'كان على إعادة البناء الحفاظ على ترتيب محركات البحث الذي تراكم عبر سنوات على المتجر القديم مع استبدال بنيته بالكامل — عملية ترحيل كان يجب أن تكون غير ملحوظة لمحركات البحث والعملاء الحاليين الذين لديهم سلال ومحفوظات حسابات.',

  solution: 'We rebuilt the storefront headless on top of the existing product catalog, with server-rendered pages preserving every existing URL and metadata, a one-page checkout with saved payment methods, a real-time product configurator, and warehouse inventory sync running on a message queue instead of periodic polling.',
  solutionAr: 'أعدنا بناء المتجر بنمط headless فوق كتالوج المنتجات الحالي، مع صفحات مُصيَّرة من الخادم تحافظ على كل رابط وبيانات وصفية موجودة، ودفع في صفحة واحدة مع طرق دفع محفوظة، وأداة تخصيص منتج لحظية، ومزامنة مخزون المستودعات عبر طابور رسائل بدلاً من الفحص الدوري.',

  process: 'We mirrored the old and new storefronts side by side behind a feature flag, redirected a small percentage of traffic first to validate SEO and conversion metrics held steady, then cut over fully once both were confirmed stable.',
  processAr: 'شغّلنا المتجر القديم والجديد جنبًا إلى جنب خلف علم ميزة، ووجّهنا نسبة صغيرة من الزيارات أولاً للتحقق من ثبات مقاييس تحسين محركات البحث والتحويل، ثم انتقلنا بالكامل بعد تأكيد استقرار الاثنين.',

  results: 'Product page load time dropped from over six seconds to under 1.5 seconds on mobile, checkout abandonment fell significantly with the new one-page flow, and inventory overselling incidents dropped to effectively zero after the sync rebuild.',
  resultsAr: 'انخفض زمن تحميل صفحة المنتج من أكثر من ست ثوانٍ إلى أقل من 1.5 ثانية على الجوال، وانخفض معدل التخلي عن الدفع بشكل كبير مع مسار الدفع الجديد في صفحة واحدة، وانخفضت حالات بيع ما يفوق المخزون إلى ما يقارب الصفر بعد إعادة بناء المزامنة.',

  metrics: [
    { label: 'Checkout abandonment', labelAr: 'معدل التخلي عن الدفع', value: '-37%', trend: 'down' },
    { label: 'Mobile conversion rate', labelAr: 'معدل التحويل على الجوال', value: '+29%', trend: 'up' },
    { label: 'Overselling incidents', labelAr: 'حالات بيع أكثر من المتوفر', value: '~0', trend: 'down' },
    { label: 'Organic traffic retained', labelAr: 'الزيارات العضوية المحتفظ بها', value: '100%', trend: 'neutral' },
  ],

  performanceMetrics: [
    { label: 'Product page load (mobile)', labelAr: 'تحميل صفحة المنتج (جوال)', before: '6.2s', after: '1.4s' },
    { label: 'Lighthouse performance', labelAr: 'أداء Lighthouse', before: '41', after: '97' },
    { label: 'Checkout steps', labelAr: 'خطوات الدفع', before: '5 pages', after: '1 page' },
  ],

  faqs: [
    { question: 'Did the rebuild affect existing SEO rankings?', questionAr: 'هل أثرت إعادة البناء على ترتيب محركات البحث الحالي؟', answer: 'No — every URL, redirect, and metadata field was preserved exactly, and organic traffic held steady through the migration.', answerAr: 'لا — تم الحفاظ على كل رابط وإعادة توجيه وبيانات وصفية بدقة، وبقيت الزيارات العضوية ثابتة خلال عملية الترحيل.' },
    { question: 'How is inventory kept in sync across warehouses?', questionAr: 'كيف يبقى المخزون متزامنًا عبر المستودعات؟', answer: 'A message-queue-based sync pushes stock changes in real time instead of relying on periodic polling, which eliminated overselling.', answerAr: 'تدفع مزامنة قائمة على طابور رسائل تغييرات المخزون في الوقت الفعلي بدلاً من الاعتماد على الفحص الدوري، ما أزال حالات بيع ما يفوق المتوفر.' },
    { question: 'Can customers customize products before buying?', questionAr: 'هل يمكن للعملاء تخصيص المنتجات قبل الشراء؟', answer: 'Yes — a real-time configurator lets customers preview customizations (color, size, engraving) with no page reload.', answerAr: 'نعم — تتيح أداة تخصيص لحظية للعملاء معاينة التخصيصات (اللون، المقاس، النقش) دون إعادة تحميل الصفحة.' },
    { question: 'Why headless instead of another template-based platform?', questionAr: 'لماذا headless بدلاً من منصة أخرى قائمة على القوالب؟', answer: 'Headless separates the storefront from the commerce backend, giving full control over performance and UX without being boxed in by a template system again.', answerAr: 'يفصل نمط headless المتجر عن نظام التجارة الخلفي، ما يمنح تحكمًا كاملاً في الأداء وتجربة المستخدم دون التقيد بنظام قوالب مرة أخرى.' },
  ],

  team: [
    { name: 'Jordan Blake', role: 'Product Manager', roleAr: 'مدير منتج' },
    { name: 'Layla Mansour', role: 'Lead Full-Stack Engineer', roleAr: 'مهندسة برمجيات رئيسية' },
    { name: 'Theo Andersson', role: 'UI/UX Designer', roleAr: 'مصمم واجهات وتجربة مستخدم' },
    { name: 'Nadia Petrova', role: 'QA Engineer', roleAr: 'مهندسة ضمان الجودة' },
  ],

  testimonial: {
    quote: 'Our conversion rate on mobile — which is most of our traffic — jumped the week we launched and never went back. This paid for itself before the quarter was over.',
    quoteAr: 'قفز معدل التحويل لدينا على الجوال — الذي يمثل معظم زياراتنا — في الأسبوع الذي أطلقنا فيه ولم يعد للخلف. غطى المشروع تكلفته قبل نهاية الربع.',
    author: 'Head of E-Commerce', role: 'Head of E-Commerce', roleAr: 'رئيسة قسم التجارة الإلكترونية',
  },

  tags: ['Next.js', 'Node.js', 'MongoDB', 'Stripe', 'Redis', 'Cloudinary', 'Headless Commerce', 'D2C Storefront', 'Inventory Sync'],
  duration: '15 weeks',
  teamSize: '5 people',

  businessValue: 'Faster pages and a shorter checkout directly recovered revenue that used to leak out at the point of purchase, while preserved SEO meant {client} kept every dollar of organic traffic it had already earned.',
  businessValueAr: 'أدت الصفحات الأسرع والدفع الأقصر إلى استرداد إيرادات كانت تتسرب سابقًا عند نقطة الشراء مباشرة، بينما حافظ الحفاظ على تحسين محركات البحث على احتفاظ {clientAr} بكل دولار من الزيارات العضوية التي اكتسبتها بالفعل.',

  futureImprovements: 'Next: AI-powered product recommendations on the cart page, a subscribe-and-save flow for repeat-purchase items, and a loyalty points system tied to the existing checkout.',
  futureImprovementsAr: 'التالي: توصيات منتجات مدعومة بالذكاء الاصطناعي في صفحة السلة، مسار اشتراك وتوفير للمنتجات المتكررة الشراء، ونظام نقاط ولاء مرتبط بالدفع الحالي.',

  highlightStats: [
    { value: '-37%', label: 'Checkout abandonment', labelAr: 'التخلي عن الدفع' },
    { value: '1.4s', label: 'Mobile page load', labelAr: 'تحميل صفحة الجوال' },
    { value: '97', label: 'Lighthouse score', labelAr: 'نقاط Lighthouse' },
  ],

  gallerySuggestions: [
    { caption: 'Redesigned product page with real-time configurator', captionAr: 'صفحة منتج معاد تصميمها مع أداة تخصيص لحظية' },
    { caption: 'One-page checkout with saved payment methods', captionAr: 'دفع في صفحة واحدة مع طرق دفع محفوظة' },
    { caption: 'Mobile storefront homepage', captionAr: 'الصفحة الرئيسية للمتجر على الجوال' },
    { caption: 'Warehouse inventory sync dashboard', captionAr: 'لوحة تحكم مزامنة مخزون المستودعات' },
  ],

  metaTitle: '{client} E-Commerce Case Study — Headless Storefront Rebuild | YANSY Tech',
  metaDescription: 'How we rebuilt {client}\'s storefront headless, cutting mobile load time to 1.4s and checkout abandonment by 37%.',
};
