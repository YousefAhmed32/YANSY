/* ═══════════════════════════════════════════════════════════════
   YANSY TECH — Case Studies Data (bilingual EN/AR)
   Every localized text field is `{ en, ar }`. Non-text fields (slug,
   service, year, color, stack, relatedServices/Studies) are
   language-neutral. `industryKey` is a stable filter id — `industry`
   is the display label.

   No image URLs here on purpose — visuals are rendered by
   <CaseStudyVisual slug={..} industryKey={..} color={..} /> (see
   client/src/components/CaseStudyVisual.jsx), which picks up real
   photography from /public/placeholders/ automatically the moment it's
   added, and shows a generated on-brand placeholder until then.
   ═══════════════════════════════════════════════════════════════ */

export const CASE_STUDIES = [
  /* ──────────────────────────────────────────────────────────────
     1. NexusRealty — Real Estate Platform
  ────────────────────────────────────────────────────────────── */
  {
    slug: 'nexusrealty',
    title: 'NexusRealty',
    category: { en: 'Real Estate · Web Development', ar: 'العقارات · تطوير مواقع' },
    tagline: { en: 'From paper listings to a full digital platform generating 3x more leads', ar: 'من قوائم ورقية إلى منصة رقمية متكاملة تُضاعف العملاء المحتملين 3 مرات' },
    industryKey: 'real-estate',
    industry: { en: 'Real Estate', ar: 'العقارات' },
    service: 'web-development',
    duration: { en: '10 weeks', ar: '10 أسابيع' },
    year: '2024',
    color: '#2563EB',
    results: [
      { metric: '3x', label: { en: 'Lead Generation', ar: 'توليد العملاء المحتملين' } },
      { metric: '60%', label: { en: 'Admin Time Reduced', ar: 'خفض الوقت الإداري' } },
      { metric: '2.1s', label: { en: 'Page Load Time', ar: 'زمن تحميل الصفحة' } },
      { metric: '4.8★', label: { en: 'Agent Satisfaction', ar: 'رضا الوكلاء' } },
    ],
    excerpt: {
      en: 'NexusRealty was managing 200+ property listings through spreadsheets and manual WhatsApp communication. We built a full digital platform that transformed their operations and tripled their qualified leads in 6 months.',
      ar: 'كانت نكسس ريالتي تدير أكثر من 200 قائمة عقارية عبر جداول بيانات وتواصل يدوي على واتساب. بنينا منصة رقمية متكاملة غيّرت طريقة عملهم وضاعفت عملاءهم المحتملين المؤهّلين 3 مرات خلال 6 أشهر.',
    },
    challenge: {
      title: { en: 'Manual Processes Limiting Growth', ar: 'عمليات يدوية تُعيق النمو' },
      body: {
        en: 'NexusRealty had 8 agents managing 200+ active property listings through a combination of spreadsheets, WhatsApp groups, and a basic WordPress site that hadn\'t been updated since 2019. Leads came through a contact form that sent emails — which were frequently lost. There was no way to know which listings were generating interest, which agents were performing, or how leads were converting.',
        ar: 'كان لدى نكسس ريالتي 8 وكلاء يديرون أكثر من 200 قائمة عقارية نشطة عبر مزيج من جداول البيانات ومجموعات واتساب وموقع ووردبريس بسيط لم يُحدَّث منذ 2019. كانت العملاء المحتملون يصلون عبر نموذج تواصل يرسل رسائل بريد إلكتروني كثيرًا ما كانت تضيع. لم تكن هناك أي طريقة لمعرفة القوائم التي تُثير الاهتمام، أو الوكلاء الأفضل أداءً، أو كيفية تحوّل العملاء المحتملين إلى صفقات.',
      },
      points: [
        { en: 'Property listings scattered across spreadsheets, WhatsApp, and an outdated website', ar: 'قوائم عقارية مبعثرة بين جداول البيانات وواتساب وموقع قديم' },
        { en: 'No lead tracking — high-value inquiries fell through the cracks', ar: 'لا يوجد تتبع للعملاء المحتملين — استفسارات ذات قيمة عالية كانت تضيع بلا متابعة' },
        { en: 'Agents spending 40% of their time on manual administrative tasks', ar: 'الوكلاء يقضون 40٪ من وقتهم في مهام إدارية يدوية' },
        { en: 'No mobile capability — agents couldn\'t access the system in the field', ar: 'لا توجد إمكانية استخدام عبر الجوال — لا يستطيع الوكلاء الوصول للنظام أثناء تواجدهم بالميدان' },
        { en: 'Zero data on which listings, neighborhoods, or price points performed best', ar: 'لا توجد أي بيانات عن أفضل القوائم أو الأحياء أو نطاقات الأسعار أداءً' },
      ],
    },
    strategy: {
      title: { en: 'A Unified Digital Platform', ar: 'منصة رقمية موحّدة' },
      body: {
        en: 'We proposed a complete digital transformation: a customer-facing property portal with advanced search and virtual tours, combined with an internal agent CRM for lead management, listing administration, and performance analytics. The entire system designed for mobile-first use.',
        ar: 'اقترحنا تحوّلًا رقميًا كاملاً: بوابة عقارية للعملاء بها بحث متقدم وجولات افتراضية، مقترنة بنظام CRM داخلي للوكلاء لإدارة العملاء المحتملين والقوائم وتحليلات الأداء. صُمم النظام بالكامل ليعمل أولاً على الجوال.',
      },
    },
    uxProcess: {
      title: { en: 'Research-Led Design', ar: 'تصميم مبني على البحث' },
      body: {
        en: 'We interviewed 6 agents and 10 recent property buyers to understand their actual workflows and frustrations. The agents needed a system they could use one-handed while showing a property. The buyers needed better filtering and instant contact options. Both groups became our primary design drivers.',
        ar: 'أجرينا مقابلات مع 6 وكلاء و10 مشترين حديثين لفهم آلية عملهم الفعلية ونقاط إحباطهم. احتاج الوكلاء نظامًا يمكن استخدامه بيد واحدة أثناء عرض عقار. احتاج المشترون فلترة أفضل وخيارات تواصل فورية. أصبحت احتياجات المجموعتين المحرك الأساسي للتصميم.',
      },
    },
    stack: ['Next.js', 'Node.js', 'PostgreSQL', 'Google Maps API', 'Cloudinary', 'Stripe', 'SendGrid'],
    keyDecisions: [
      { title: { en: 'Server-Side Rendering for SEO', ar: 'العرض من جهة الخادم لتحسين محركات البحث' }, desc: { en: 'Property listings are rendered server-side for maximum Google indexing. Each property has its own SEO-optimized URL, structured data, and OpenGraph image.', ar: 'تُعرض قوائم العقارات من جهة الخادم لأقصى فهرسة على جوجل. لكل عقار رابط مُحسَّن لمحركات البحث وبيانات منظَّمة وصورة OpenGraph خاصة به.' } },
      { title: { en: 'Real-Time Lead Distribution', ar: 'توزيع فوري للعملاء المحتملين' }, desc: { en: 'WebSocket-based lead routing automatically assigns new inquiries to agents based on their listed properties and current load. No email, no delays.', ar: 'توجيه تلقائي للعملاء المحتملين عبر WebSocket يُسند الاستفسارات الجديدة للوكلاء بناءً على عقاراتهم المُدرجة وحِمل عملهم الحالي — بدون بريد إلكتروني وبدون تأخير.' } },
      { title: { en: 'Progressive Image Loading', ar: 'تحميل تدريجي للصور' }, desc: { en: 'Property photos use progressive loading with blur placeholders. Average page weight reduced from 3.8MB to 0.9MB without visible quality reduction.', ar: 'تستخدم صور العقارات تحميلًا تدريجيًا مع عناصر نائبة ضبابية. انخفض متوسط حجم الصفحة من 3.8 ميجابايت إلى 0.9 ميجابايت دون أي انخفاض ملحوظ في الجودة.' } },
    ],
    outcome: {
      en: 'Within 6 months of launch, NexusRealty had tripled their qualified lead volume. Agent administrative time dropped 60% — from 16 hours per week to 6 hours. The platform indexed over 300 property pages on Google, bringing organic traffic for the first time. The team expanded from 8 to 14 agents to handle the increased volume.',
      ar: 'خلال 6 أشهر من الإطلاق، ضاعفت نكسس ريالتي حجم عملائها المحتملين المؤهّلين 3 مرات. انخفض الوقت الإداري للوكلاء بنسبة 60٪ — من 16 ساعة أسبوعيًا إلى 6 ساعات. فهرست جوجل أكثر من 300 صفحة عقار على المنصة، ما جلب حركة زيارات عضوية لأول مرة. توسّع الفريق من 8 إلى 14 وكيلاً لمواكبة الزيادة.',
    },
    testimonial: {
      quote: {
        en: 'We went from managing everything in WhatsApp groups to having a real business system. Our leads tripled and our team actually has time to sell now.',
        ar: 'انتقلنا من إدارة كل شيء عبر مجموعات واتساب إلى امتلاك نظام عمل حقيقي. تضاعف عدد عملائنا المحتملين 3 مرات، وأصبح لدى فريقنا فعليًا وقت للبيع الآن.',
      },
      name: 'Ahmed Khalil',
      role: { en: 'Managing Director, NexusRealty', ar: 'المدير العام، نكسس ريالتي' },
    },
    relatedServices: ['web-development', 'enterprise-software'],
    relatedStudies: ['opsflow', 'sprintstore'],
  },

  /* ──────────────────────────────────────────────────────────────
     2. VaultAnalytics — SaaS Dashboard
  ────────────────────────────────────────────────────────────── */
  {
    slug: 'vaultanalytics',
    title: 'VaultAnalytics',
    category: { en: 'FinTech · SaaS Development', ar: 'التقنية المالية · تطوير SaaS' },
    tagline: { en: 'A financial data SaaS that reached 10,000 users in 90 days', ar: 'منصة SaaS لبيانات مالية وصلت إلى 10,000 مستخدم خلال 90 يومًا' },
    industryKey: 'fintech-saas',
    industry: { en: 'FinTech / SaaS', ar: 'تقنية مالية / SaaS' },
    service: 'saas-development',
    duration: { en: '14 weeks', ar: '14 أسبوعًا' },
    year: '2024',
    color: '#6366f1',
    results: [
      { metric: '10K', label: { en: 'Users in 90 Days', ar: 'مستخدم خلال 90 يومًا' } },
      { metric: '4.9★', label: { en: 'App Store Rating', ar: 'تقييم متجر التطبيقات' } },
      { metric: '$42K', label: { en: 'MRR at Month 3', ar: 'الإيراد الشهري بالشهر 3' } },
      { metric: '12%', label: { en: 'Monthly Churn', ar: 'معدل التسرب الشهري' } },
    ],
    excerpt: {
      en: 'VaultAnalytics needed a SaaS platform that could handle complex financial data visualization for individual investors — powerful enough for professionals, simple enough for beginners. We built it in 14 weeks.',
      ar: 'احتاجت فولت أناليتكس منصة SaaS قادرة على تصور بيانات مالية معقّدة للمستثمرين الأفراد — قوية بما يكفي للمحترفين، وبسيطة بما يكفي للمبتدئين. بنيناها خلال 14 أسبوعًا.',
    },
    challenge: {
      title: { en: 'Complex Data, Simple Experience', ar: 'بيانات معقّدة، تجربة بسيطة' },
      body: {
        en: 'The founders had validated their concept with a spreadsheet-based prototype that 500 beta users were actively using. The challenge was turning that into a production SaaS — with real-time market data integration, subscription billing, a portfolio tracking engine, and an interface that didn\'t require an MBA to understand.',
        ar: 'أثبت المؤسسون فكرتهم بنموذج أولي قائم على جداول بيانات كان يستخدمه فعليًا 500 مستخدم تجريبي. كان التحدي هو تحويل ذلك إلى منتج SaaS إنتاجي — بربط بيانات سوق فورية، وفوترة اشتراكات، ومحرك لتتبع المحافظ الاستثمارية، وواجهة لا تتطلب شهادة إدارة أعمال لفهمها.',
      },
      points: [
        { en: 'Existing solution was a complex Excel template — zero scalability', ar: 'الحل الحالي كان قالب إكسل معقّدًا — بلا أي قابلية للتوسّع' },
        { en: 'Real-time market data API integration was technically complex', ar: 'ربط واجهة بيانات السوق الفورية كان معقّدًا تقنيًا' },
        { en: 'Subscription pricing model needed trials, upgrades, and annual billing', ar: 'نموذج التسعير بالاشتراك احتاج فترات تجريبية وترقيات وفوترة سنوية' },
        { en: 'Users ranged from complete beginners to professional traders — one UI had to serve both', ar: 'تراوح المستخدمون بين مبتدئين تمامًا ومتداولين محترفين — وكان على واجهة واحدة أن تخدم الفئتين' },
        { en: 'Regulatory considerations for financial data display in MENA markets', ar: 'اعتبارات تنظيمية لعرض البيانات المالية في أسواق الشرق الأوسط وشمال أفريقيا' },
      ],
    },
    strategy: {
      title: { en: 'Progressive Complexity Architecture', ar: 'بنية تعقيد تدريجي' },
      body: {
        en: 'We designed a progressive disclosure UX — simple portfolio overview for beginners with deeper analytical tools discoverable as users grow. The subscription model was designed for expansion revenue: starter tier with core tracking, professional tier with real-time alerts and advanced charting, enterprise tier with API access.',
        ar: 'صمّمنا تجربة كشف تدريجي — نظرة عامة بسيطة على المحفظة للمبتدئين مع أدوات تحليلية أعمق تظهر تدريجيًا مع نمو المستخدم. صُمم نموذج الاشتراك لتنمية الإيرادات: باقة أساسية بتتبع جوهري، باقة احترافية بتنبيهات فورية ورسوم بيانية متقدمة، وباقة مؤسسية بوصول لواجهة برمجية.',
      },
    },
    uxProcess: {
      title: { en: 'User Segmentation-Led Design', ar: 'تصميم مبني على تقسيم المستخدمين' },
      body: {
        en: 'We identified two primary user segments: the casual investor tracking a few stocks, and the active trader monitoring real-time positions. We designed separate dashboard views optimized for each use case, with a smart default that adapts based on portfolio complexity.',
        ar: 'حدّدنا فئتين رئيسيتين من المستخدمين: المستثمر العادي الذي يتابع بضعة أسهم، والمتداول النشط الذي يراقب مراكز فورية. صمّمنا لوحات تحكم منفصلة محسّنة لكل حالة استخدام، مع إعداد افتراضي ذكي يتكيّف حسب تعقيد المحفظة.',
      },
    },
    stack: ['React', 'D3.js', 'Node.js', 'PostgreSQL', 'Redis', 'WebSockets', 'Stripe', 'Alpha Vantage API'],
    keyDecisions: [
      { title: { en: 'WebSocket for Real-Time Data', ar: 'WebSocket للبيانات الفورية' }, desc: { en: 'Market data pushed via WebSocket connection — users see live price changes without polling. Redis pub/sub handles data distribution to all active sessions.', ar: 'تُدفع بيانات السوق عبر اتصال WebSocket — يرى المستخدمون تغيّرات الأسعار مباشرة بدون استعلام متكرر. يتولى نظام Redis pub/sub توزيع البيانات على كل الجلسات النشطة.' } },
      { title: { en: 'Row-Level Security in PostgreSQL', ar: 'أمان على مستوى الصف في PostgreSQL' }, desc: { en: 'Every query is filtered by user ID at the database level — impossible to accidentally expose one user\'s financial data to another.', ar: 'كل استعلام يُصفّى حسب معرّف المستخدم على مستوى قاعدة البيانات — يستحيل تسريب بيانات مستخدم مالية لمستخدم آخر عن طريق الخطأ.' } },
      { title: { en: 'Feature Flags for Tier Management', ar: 'أعلام ميزات لإدارة الباقات' }, desc: { en: 'A feature flag system controls feature access by subscription tier — makes it trivial to adjust what each plan includes without code changes.', ar: 'يتحكم نظام أعلام الميزات في الوصول حسب باقة الاشتراك — ما يجعل تعديل محتوى كل باقة أمرًا بسيطًا بدون تغيير الكود.' } },
    ],
    outcome: {
      en: 'VaultAnalytics launched on Product Hunt and ranked #2 Product of the Day. 10,000 users registered within 90 days. By month 3, MRR reached $42,000 with a conversion rate from free to paid of 8.4%. The platform has since expanded to support institutional clients with a dedicated enterprise tier.',
      ar: 'أُطلقت فولت أناليتكس على Product Hunt وحصلت على المركز الثاني كمنتج اليوم. سجّل 10,000 مستخدم خلال 90 يومًا. بحلول الشهر الثالث، بلغ الإيراد الشهري المتكرر 42,000 دولار بمعدل تحويل من مجاني إلى مدفوع بلغ 8.4٪. توسّعت المنصة منذ ذلك الحين لخدمة عملاء مؤسسيين عبر باقة مؤسسية مخصصة.',
    },
    testimonial: {
      quote: {
        en: 'YANSY TECH didn\'t just build our product — they helped us think through the architecture decisions that made it scalable from day one. We couldn\'t have launched as fast or as cleanly without them.',
        ar: 'يانسي تك لم تكتفِ ببناء منتجنا — بل ساعدتنا على التفكير في قرارات البنية التقنية التي جعلته قابلاً للتوسع منذ اليوم الأول. لم يكن بإمكاننا الإطلاق بهذه السرعة والدقة بدونهم.',
      },
      name: 'Omar Elsayed',
      role: { en: 'Co-Founder & CEO, VaultAnalytics', ar: 'المؤسس المشارك والرئيس التنفيذي، فولت أناليتكس' },
    },
    relatedServices: ['saas-development', 'ui-ux-design'],
    relatedStudies: ['opsflow', 'bookease'],
  },

  /* ──────────────────────────────────────────────────────────────
     3. SprintStore — E-Commerce Platform
  ────────────────────────────────────────────────────────────── */
  {
    slug: 'sprintstore',
    title: 'SprintStore',
    category: { en: 'E-Commerce · Next.js', ar: 'تجارة إلكترونية · Next.js' },
    tagline: { en: 'A custom e-commerce platform that achieved 40% higher conversion than Shopify', ar: 'منصة تجارة إلكترونية مخصصة حقّقت معدل تحويل أعلى بـ40٪ من Shopify' },
    industryKey: 'ecommerce',
    industry: { en: 'E-Commerce', ar: 'التجارة الإلكترونية' },
    service: 'ecommerce-development',
    duration: { en: '8 weeks', ar: '8 أسابيع' },
    year: '2024',
    color: '#10b981',
    results: [
      { metric: '+40%', label: { en: 'Conversion Rate', ar: 'معدل التحويل' } },
      { metric: '2x', label: { en: 'Revenue in 90 Days', ar: 'الإيراد خلال 90 يومًا' } },
      { metric: '1.8s', label: { en: 'Load Time (from 5.2s)', ar: 'زمن التحميل (من 5.2 ثانية)' } },
      { metric: '-62%', label: { en: 'Cart Abandonment', ar: 'التخلي عن السلة' } },
    ],
    excerpt: {
      en: 'SprintStore was losing customers to a 5-second Shopify store and a checkout that required account creation. We rebuilt on Next.js with a guest checkout flow and cut load time by 65% — resulting in 40% higher conversion.',
      ar: 'كانت سبرينت ستور تخسر عملاء بسبب متجر Shopify يستغرق تحميله 5 ثوانٍ وصفحة دفع تفرض إنشاء حساب. أعدنا البناء على Next.js بتدفّق دفع كضيف وخفّضنا زمن التحميل بنسبة 65٪ — ما رفع معدل التحويل 40٪.',
    },
    challenge: {
      title: { en: 'Shopify Throttling Growth', ar: 'Shopify يُقيّد النمو' },
      body: {
        en: 'SprintStore had been on Shopify for 2 years. As their product catalog grew to 800+ SKUs, the theme became progressively slower. Their flagship theme — with its heavy JavaScript and third-party app integrations — was loading in 5.2 seconds on mobile. Combined with a forced account-creation checkout flow, cart abandonment had climbed to 78%.',
        ar: 'كانت سبرينت ستور على Shopify منذ سنتين. مع نمو كتالوج المنتجات إلى أكثر من 800 صنف، أصبح القالب أبطأ تدريجيًا. كان القالب الرئيسي — بجافاسكريبت ثقيل وتكاملات تطبيقات خارجية — يستغرق تحميله 5.2 ثانية على الجوال. مع تدفّق دفع يفرض إنشاء حساب، ارتفع معدل التخلي عن السلة إلى 78٪.',
      },
      points: [
        { en: 'Page load time of 5.2 seconds on mobile — losing customers before they see products', ar: 'زمن تحميل الصفحة 5.2 ثانية على الجوال — خسارة عملاء قبل أن يروا المنتجات' },
        { en: 'Forced account creation in checkout — 40% of users abandoned at this step alone', ar: 'إنشاء حساب إجباري عند الدفع — 40٪ من المستخدمين تخلّوا عند هذه الخطوة وحدها' },
        { en: 'No control over checkout flow design — Shopify\'s locked checkout layout', ar: 'لا سيطرة على تصميم تدفّق الدفع — تخطيط دفع مُقفل من Shopify' },
        { en: 'Monthly Shopify Plus fees increasing without commensurate value', ar: 'رسوم Shopify Plus الشهرية تتزايد بلا قيمة مكافئة' },
        { en: 'Product variant complexity (size, color, bundle) difficult to manage in Shopify admin', ar: 'تعقيد متغيرات المنتج (المقاس، اللون، الحزمة) صعب الإدارة في لوحة Shopify' },
      ],
    },
    strategy: {
      title: { en: 'Custom Performance-First E-Commerce', ar: 'تجارة إلكترونية مخصصة بأولوية الأداء' },
      body: {
        en: 'We migrated SprintStore to a custom Next.js frontend with a Node.js backend and PostgreSQL database. The checkout was custom-built with guest checkout as the primary flow, requiring only email for order tracking. All 800+ SKUs migrated without data loss.',
        ar: 'نقلنا سبرينت ستور إلى واجهة أمامية مخصصة بـNext.js مع خادم Node.js وقاعدة بيانات PostgreSQL. بُنيت صفحة الدفع خصيصًا بجعل الدفع كضيف هو التدفّق الأساسي، ولا يتطلب سوى بريد إلكتروني لتتبع الطلب. تم نقل أكثر من 800 صنف بدون فقدان أي بيانات.',
      },
    },
    uxProcess: {
      title: { en: 'Checkout Flow Optimization', ar: 'تحسين تدفّق الدفع' },
      body: {
        en: 'We audited session recordings from the Shopify store to identify every drop-off point. The checkout redesign was based on 8 specific friction points identified in the data. The new flow goes from cart to order confirmation in 4 steps with no account requirement.',
        ar: 'دقّقنا تسجيلات الجلسات من متجر Shopify لتحديد كل نقطة تسرّب. استند إعادة تصميم الدفع إلى 8 نقاط احتكاك محددة اكتُشفت في البيانات. يمر التدفّق الجديد من السلة إلى تأكيد الطلب في 4 خطوات بدون الحاجة لحساب.',
      },
    },
    stack: ['Next.js', 'React', 'Node.js', 'PostgreSQL', 'Stripe', 'Cloudflare', 'Algolia', 'Redis'],
    keyDecisions: [
      { title: { en: 'Static Generation for Product Pages', ar: 'توليد ثابت لصفحات المنتجات' }, desc: { en: 'Every product page is statically generated at build time — loads instantly from Cloudflare\'s edge network. No server render time for the critical product experience.', ar: 'تُولَّد كل صفحة منتج بشكل ثابت وقت البناء — تُحمَّل فوريًا من شبكة Cloudflare الطرفية. بلا وقت عرض من الخادم لتجربة المنتج الحرجة.' } },
      { title: { en: 'Guest Checkout as Default', ar: 'الدفع كضيف كخيار افتراضي' }, desc: { en: 'Account creation removed from the checkout critical path. Email collected for order updates. Accounts offered post-purchase as a convenience, not a gate.', ar: 'أُزيل إنشاء الحساب من المسار الحرج للدفع. يُجمع البريد الإلكتروني لتحديثات الطلب. يُعرض إنشاء الحساب بعد الشراء كخيار مريح لا كحاجز.' } },
      { title: { en: 'Algolia for Search', ar: 'Algolia للبحث' }, desc: { en: 'Site search powered by Algolia for instant, typo-tolerant product discovery. Search-to-purchase conversion 3x higher than category browsing.', ar: 'بحث الموقع مدعوم بـAlgolia لاكتشاف منتجات فوري ومتسامح مع الأخطاء الإملائية. معدل التحويل من البحث إلى الشراء أعلى 3 مرات من تصفّح الفئات.' } },
    ],
    outcome: {
      en: 'Six weeks after launch, SprintStore\'s conversion rate had increased 40% — from 1.8% to 2.52%. Mobile conversion specifically jumped 61%. Cart abandonment dropped from 78% to 29%. Revenue doubled within 90 days. The reduced infrastructure cost also eliminated $2,400/month in Shopify Plus and app fees.',
      ar: 'بعد ستة أسابيع من الإطلاق، ارتفع معدل التحويل لدى سبرينت ستور 40٪ — من 1.8٪ إلى 2.52٪. قفز التحويل على الجوال تحديدًا 61٪. انخفض التخلي عن السلة من 78٪ إلى 29٪. تضاعف الإيراد خلال 90 يومًا. كما ألغت تكلفة البنية التحتية المخفّضة 2,400 دولار شهريًا من رسوم Shopify Plus والتطبيقات.',
    },
    testimonial: {
      quote: {
        en: 'The load time improvement alone would have been worth it. The conversion rate increase was beyond what we expected. We effectively doubled our business without increasing traffic.',
        ar: 'تحسين زمن التحميل وحده كان يستحق العناء. زيادة معدل التحويل تجاوزت توقعاتنا. ضاعفنا عمليًا حجم أعمالنا بدون زيادة الزيارات.',
      },
      name: 'Karim Ibrahim',
      role: { en: 'Founder, SprintStore', ar: 'المؤسس، سبرينت ستور' },
    },
    relatedServices: ['ecommerce-development', 'web-development'],
    relatedStudies: ['nexusrealty', 'bookease'],
  },

  /* ──────────────────────────────────────────────────────────────
     4. BookEase — Booking System
  ────────────────────────────────────────────────────────────── */
  {
    slug: 'bookease',
    title: 'BookEase',
    category: { en: 'Healthcare · Booking System', ar: 'الرعاية الصحية · نظام حجز' },
    tagline: { en: 'A medical clinic booking system that eliminated 80% of no-shows', ar: 'نظام حجز لعيادة طبية ألغى 80٪ من حالات عدم الحضور' },
    industryKey: 'healthcare',
    industry: { en: 'Healthcare', ar: 'الرعاية الصحية' },
    service: 'enterprise-software',
    duration: { en: '7 weeks', ar: '7 أسابيع' },
    year: '2023',
    color: '#f59e0b',
    results: [
      { metric: '-80%', label: { en: 'No-Show Rate', ar: 'معدل عدم الحضور' } },
      { metric: '5x', label: { en: 'Online Bookings', ar: 'الحجوزات الإلكترونية' } },
      { metric: '3h', label: { en: 'Admin Time Saved/Day', ar: 'وقت إداري موفَّر يوميًا' } },
      { metric: '4.9★', label: { en: 'Patient Satisfaction', ar: 'رضا المرضى' } },
    ],
    excerpt: {
      en: 'A medical clinic was losing 35% of appointments to no-shows managed through phone calls and a paper diary. We built a booking system with automated reminders that reduced no-shows by 80% and freed the reception team from hours of manual follow-up.',
      ar: 'كانت عيادة طبية تخسر 35٪ من مواعيدها بسبب عدم الحضور، وتُدار عبر مكالمات هاتفية ودفتر ورقي. بنينا نظام حجز بتذكيرات تلقائية خفّض عدم الحضور بنسبة 80٪ وحرّر فريق الاستقبال من ساعات متابعة يدوية.',
    },
    challenge: {
      title: { en: 'Paper Diaries and Missed Appointments', ar: 'دفاتر ورقية ومواعيد ضائعة' },
      body: {
        en: 'A specialized medical clinic with 4 doctors was managing all appointments via phone calls and a paper diary. The reception team spent 3 hours per day manually calling to confirm appointments and following up on cancellations. No-show rate was 35% — empty appointment slots that generated no revenue.',
        ar: 'كانت عيادة طبية متخصصة بها 4 أطباء تدير كل مواعيدها عبر مكالمات هاتفية ودفتر ورقي. كان فريق الاستقبال يقضي 3 ساعات يوميًا في مكالمات يدوية لتأكيد المواعيد ومتابعة الإلغاءات. بلغ معدل عدم الحضور 35٪ — مواعيد فارغة لا تُولّد أي إيراد.',
      },
      points: [
        { en: '35% no-show rate costing $4,000+ per month in lost revenue', ar: 'معدل عدم حضور 35٪ يكلّف أكثر من 4,000 دولار شهريًا كإيراد ضائع' },
        { en: 'Reception team spending 3 hours/day on manual appointment calls', ar: 'فريق الاستقبال يقضي 3 ساعات يوميًا في مكالمات مواعيد يدوية' },
        { en: 'No online booking — all scheduling required a phone call during business hours', ar: 'لا يوجد حجز إلكتروني — كل جدولة تتطلب مكالمة هاتفية خلال ساعات العمل' },
        { en: 'No visibility into appointment utilization — which doctors had gaps, when', ar: 'لا رؤية على استغلال المواعيد — أي الأطباء لديه فراغات ومتى' },
        { en: 'Patient records kept in physical files — no searchable history', ar: 'سجلات المرضى محفوظة في ملفات ورقية — بلا سجل قابل للبحث' },
      ],
    },
    strategy: {
      title: { en: 'Automated Intelligent Booking', ar: 'حجز ذكي وآلي' },
      body: {
        en: 'We built a multi-channel booking system: a patient-facing web app for self-booking, an SMS/WhatsApp reminder system with intelligent scheduling, and an admin dashboard for the reception team to manage appointments, patients, and doctors\' calendars.',
        ar: 'بنينا نظام حجز متعدد القنوات: تطبيق ويب للمرضى للحجز الذاتي، ونظام تذكير عبر SMS/واتساب بجدولة ذكية، ولوحة تحكم إدارية لفريق الاستقبال لإدارة المواعيد والمرضى وجداول الأطباء.',
      },
    },
    uxProcess: {
      title: { en: 'Patient-Centered Design', ar: 'تصميم يتمحور حول المريض' },
      body: {
        en: 'We recruited 8 clinic patients for user testing of the booking flow prototype. The target demographic skewed 45+, which informed our typography choices (larger text, higher contrast), the simple 3-step booking flow, and the decision to support WhatsApp reminders as a primary channel over email.',
        ar: 'استقطبنا 8 مرضى من العيادة لاختبار النموذج الأولي لتدفّق الحجز. مالت الفئة المستهدفة نحو سن 45+، ما أثّر على اختيارات الخطوط (نص أكبر وتباين أعلى)، وتدفّق الحجز البسيط بـ3 خطوات، وقرار دعم تذكيرات واتساب كقناة أساسية بدلاً من البريد الإلكتروني.',
      },
    },
    stack: ['React', 'Node.js', 'PostgreSQL', 'Twilio (SMS)', 'WhatsApp Business API', 'Google Calendar API'],
    keyDecisions: [
      { title: { en: 'WhatsApp as Primary Reminder Channel', ar: 'واتساب كقناة تذكير أساسية' }, desc: { en: 'WhatsApp has near-100% open rates in MENA vs. ~20% for email. We integrated WhatsApp Business API for appointment confirmations, 24h reminders, and 2h reminders.', ar: 'معدل فتح واتساب يقترب من 100٪ في منطقة الشرق الأوسط وشمال أفريقيا مقابل نحو 20٪ للبريد الإلكتروني. دمجنا واجهة WhatsApp Business API لتأكيد المواعيد وتذكيرات قبل 24 ساعة وقبل ساعتين.' } },
      { title: { en: 'Intelligent Slot Presentation', ar: 'عرض ذكي للمواعيد المتاحة' }, desc: { en: 'The booking interface shows patients only the next available slots, organized by doctor preference. Complex calendar logic is hidden behind a simple 3-tap booking experience.', ar: 'تعرض واجهة الحجز للمرضى فقط أقرب المواعيد المتاحة، مرتبة حسب تفضيل الطبيب. تختفي منطق الجدولة المعقّد خلف تجربة حجز بسيطة بثلاث نقرات.' } },
      { title: { en: 'Two-Way Confirmation', ar: 'تأكيد ثنائي الاتجاه' }, desc: { en: 'Reminders require patient confirmation via WhatsApp reply. Unconfirmed appointments at T-4h are automatically moved to a "at-risk" queue for reception to contact.', ar: 'تتطلب التذكيرات تأكيدًا من المريض عبر رد على واتساب. تُنقل المواعيد غير المؤكَّدة قبل 4 ساعات تلقائيًا إلى قائمة "معرّضة للخطر" ليتواصل معها فريق الاستقبال.' } },
    ],
    outcome: {
      en: 'No-show rate dropped from 35% to 7% within the first month — an immediate $3,200/month revenue recovery. Online self-bookings grew to represent 70% of all appointments, reducing reception call volume by 85%. The 3 hours per day of manual calling was eliminated. Patient satisfaction scores improved as wait times decreased from better schedule utilization.',
      ar: 'انخفض معدل عدم الحضور من 35٪ إلى 7٪ خلال الشهر الأول — استرداد فوري لإيراد بقيمة 3,200 دولار شهريًا. نما الحجز الذاتي الإلكتروني ليمثّل 70٪ من كل المواعيد، ما خفّض حجم مكالمات الاستقبال 85٪. أُلغيت الساعات الثلاث اليومية من المكالمات اليدوية. تحسّنت درجات رضا المرضى مع انخفاض أوقات الانتظار نتيجة استغلال أفضل للجدول.',
    },
    testimonial: {
      quote: {
        en: 'We couldn\'t believe how much time we were wasting on phone calls. Now the system handles everything automatically. Our doctors are fully booked and our no-shows are almost gone.',
        ar: 'لم نصدّق كمّ الوقت الذي كنا نضيّعه في المكالمات الهاتفية. الآن يتولى النظام كل شيء تلقائيًا. أطباؤنا محجوزون بالكامل وحالات عدم الحضور تكاد تختفي.',
      },
      name: 'Dr. Nour Hassan',
      role: { en: 'Clinic Director, BookEase', ar: 'مدير العيادة، بوك إيز' },
    },
    relatedServices: ['enterprise-software', 'web-development'],
    relatedStudies: ['nexusrealty', 'opsflow'],
  },

  /* ──────────────────────────────────────────────────────────────
     5. OpsFlow — ERP Platform
  ────────────────────────────────────────────────────────────── */
  {
    slug: 'opsflow',
    title: 'OpsFlow',
    category: { en: 'Manufacturing · Enterprise Software', ar: 'التصنيع · برمجيات المؤسسات' },
    tagline: { en: 'A custom ERP that improved operational efficiency by 35% in 6 months', ar: 'نظام ERP مخصص رفع الكفاءة التشغيلية 35٪ خلال 6 أشهر' },
    industryKey: 'manufacturing',
    industry: { en: 'Manufacturing & Distribution', ar: 'التصنيع والتوزيع' },
    service: 'enterprise-software',
    duration: { en: '20 weeks', ar: '20 أسبوعًا' },
    year: '2024',
    color: '#8b5cf6',
    results: [
      { metric: '35%', label: { en: 'Operational Efficiency', ar: 'الكفاءة التشغيلية' } },
      { metric: '90%', label: { en: 'Manual Entry Eliminated', ar: 'إدخال يدوي مُلغى' } },
      { metric: '6 wk', label: { en: 'Inventory Visibility', ar: 'رؤية المخزون' } },
      { metric: '€180K', label: { en: 'Year 1 Cost Savings', ar: 'توفير التكلفة بالسنة الأولى' } },
    ],
    excerpt: {
      en: 'A manufacturing company was running operations across 5 disconnected systems. We built a unified ERP that eliminated manual data entry between systems, provided real-time inventory visibility, and saved €180,000 in operational costs in the first year.',
      ar: 'كانت شركة تصنيع تُدير عملياتها عبر 5 أنظمة منفصلة. بنينا نظام ERP موحّدًا ألغى إعادة إدخال البيانات يدويًا بين الأنظمة، ووفّر رؤية فورية للمخزون، ووفّر 180,000 يورو من التكاليف التشغيلية في السنة الأولى.',
    },
    challenge: {
      title: { en: 'Five Disconnected Systems', ar: 'خمسة أنظمة منفصلة' },
      body: {
        en: 'OpsFlow (name changed for confidentiality) was a mid-sized manufacturing company running production planning in Excel, inventory in a legacy system from 2011, order management in QuickBooks, logistics coordination over WhatsApp, and customer management in an outdated CRM. Every data point existed in multiple systems, manually entered multiple times, always slightly inconsistent.',
        ar: 'كانت أوبس فلو (الاسم مُغيَّر لأسباب سرية) شركة تصنيع متوسطة الحجم تُدير تخطيط الإنتاج على إكسل، والمخزون على نظام قديم من عام 2011، وإدارة الطلبات على QuickBooks، وتنسيق اللوجستيات عبر واتساب، وإدارة العملاء على نظام CRM قديم. كانت كل نقطة بيانات موجودة في أنظمة متعددة، تُدخَل يدويًا عدة مرات، وغالبًا غير متطابقة تمامًا.',
      },
      points: [
        { en: '5 disconnected systems — production, inventory, orders, logistics, CRM', ar: '5 أنظمة منفصلة — الإنتاج والمخزون والطلبات واللوجستيات وCRM' },
        { en: '40% of staff time spent on data entry and reconciliation between systems', ar: '40٪ من وقت الموظفين يُصرف في إدخال البيانات والتوفيق بين الأنظمة' },
        { en: 'Inventory data always out of date — stock outs discovered after orders committed', ar: 'بيانات المخزون دائمًا قديمة — يُكتشف نفاد المخزون بعد تأكيد الطلبات' },
        { en: 'Production planning done in Excel — no real-time capacity visibility', ar: 'تخطيط الإنتاج على إكسل — بلا رؤية فورية للطاقة الإنتاجية' },
        { en: 'WhatsApp-based logistics coordination — no audit trail, no accountability', ar: 'تنسيق لوجستي عبر واتساب — بلا سجل تدقيق أو مساءلة' },
      ],
    },
    strategy: {
      title: { en: 'Unified Operations Platform', ar: 'منصة عمليات موحّدة' },
      body: {
        en: 'We designed a centralized ERP system built around the company\'s specific manufacturing and distribution workflow. The key architectural decision was to identify the system of record for each data domain and build automated synchronization, eliminating manual re-entry.',
        ar: 'صمّمنا نظام ERP مركزيًا مبنيًا حول سير العمل الخاص بالشركة في التصنيع والتوزيع. كان القرار المعماري الأساسي هو تحديد النظام المرجعي لكل مجال بيانات وبناء مزامنة تلقائية، ما ألغى إعادة الإدخال اليدوي.',
      },
    },
    uxProcess: {
      title: { en: 'Role-Based Interface Design', ar: 'تصميم واجهة حسب الدور' },
      body: {
        en: 'We mapped 7 user roles — warehouse manager, production planner, sales rep, logistics coordinator, finance team, management, and admin. Each role received a purpose-built dashboard showing only what they need to execute their daily tasks. Information overload was the enemy we fought hardest.',
        ar: 'حدّدنا 7 أدوار للمستخدمين — مدير المستودع، مخطط الإنتاج، مندوب المبيعات، منسّق اللوجستيات، فريق المالية، الإدارة، والمشرف. حصل كل دور على لوحة تحكم مصمَّمة خصيصًا تعرض فقط ما يحتاجه لتنفيذ مهامه اليومية. كان فرط المعلومات هو العدو الذي حاربناه بأشد قوة.',
      },
    },
    stack: ['React', 'Node.js', 'PostgreSQL', 'Redis', 'WebSockets', 'Docker', 'QuickBooks API', 'TypeScript'],
    keyDecisions: [
      { title: { en: 'Real-Time Inventory Engine', ar: 'محرك مخزون فوري' }, desc: { en: 'Inventory levels update in real-time via WebSocket events triggered by production completions, shipment receipts, and sales orders. Stock-outs now predicted 6 weeks in advance via demand forecasting.', ar: 'تتحدّث مستويات المخزون فوريًا عبر أحداث WebSocket تُطلقها اكتمالات الإنتاج واستلام الشحنات وأوامر البيع. يُتنبأ الآن بنفاد المخزون قبل 6 أسابيع عبر توقّع الطلب.' } },
      { title: { en: 'QuickBooks Bidirectional Sync', ar: 'مزامنة ثنائية الاتجاه مع QuickBooks' }, desc: { en: 'Rather than replacing the existing accounting setup, we built a bidirectional sync with QuickBooks — orders flow in, invoices flow out, reconciliation automated. Zero manual accounting data entry.', ar: 'بدلاً من استبدال نظام المحاسبة الحالي، بنينا مزامنة ثنائية الاتجاه مع QuickBooks — الطلبات تدخل، والفواتير تخرج، والتسوية آلية. بلا أي إدخال محاسبي يدوي.' } },
      { title: { en: 'Phased Migration', ar: 'ترحيل على مراحل' }, desc: { en: 'We migrated one business function at a time over 5 months, running the old and new systems in parallel for each function before switching. Zero business disruption during the transition.', ar: 'رحّلنا وظيفة عمل واحدة في كل مرة على مدى 5 أشهر، مع تشغيل النظامين القديم والجديد بالتوازي لكل وظيفة قبل التبديل. بلا أي تعطّل للأعمال أثناء الانتقال.' } },
    ],
    outcome: {
      en: 'Operational efficiency improved 35% within 6 months — measured by output per employee hour. Manual data entry was reduced by 90%. Inventory visibility window extended from "current day" to 6-week forecasting. Total cost savings in year 1, including reduced labor and eliminated software licensing, calculated at €180,000.',
      ar: 'تحسّنت الكفاءة التشغيلية 35٪ خلال 6 أشهر — مقاسة بالمخرجات لكل ساعة عمل موظف. انخفض الإدخال اليدوي للبيانات 90٪. امتدت نافذة رؤية المخزون من "اليوم الحالي" إلى توقّع 6 أسابيع مسبقًا. بلغ إجمالي توفير التكلفة في السنة الأولى، شاملاً تقليل العمالة وإلغاء تراخيص برمجيات، 180,000 يورو.',
    },
    testimonial: {
      quote: {
        en: 'We didn\'t realize how much time we were losing until we saw how the new system worked. The ROI was clear within the first 3 months.',
        ar: 'لم ندرك حجم الوقت الذي كنا نخسره إلا بعد أن رأينا كيف يعمل النظام الجديد. كان العائد على الاستثمار واضحًا خلال أول 3 أشهر.',
      },
      name: 'Hani Mansour',
      role: { en: 'COO, OpsFlow', ar: 'الرئيس التنفيذي للعمليات، أوبس فلو' },
    },
    relatedServices: ['enterprise-software', 'saas-development'],
    relatedStudies: ['vaultanalytics', 'nexusrealty'],
  },

  /* ──────────────────────────────────────────────────────────────
     6. MoveIt — Mobile Application
  ────────────────────────────────────────────────────────────── */
  {
    slug: 'moveit',
    title: 'MoveIt',
    category: { en: 'Logistics · Mobile App', ar: 'اللوجستيات · تطبيق جوال' },
    tagline: { en: 'A last-mile delivery app that reached 50,000 downloads in 6 months', ar: 'تطبيق توصيل الميل الأخير وصل إلى 50,000 تحميل خلال 6 أشهر' },
    industryKey: 'logistics',
    industry: { en: 'Logistics & Delivery', ar: 'اللوجستيات والتوصيل' },
    service: 'mobile-app-development',
    duration: { en: '16 weeks', ar: '16 أسبوعًا' },
    year: '2024',
    color: '#ec4899',
    results: [
      { metric: '50K', label: { en: 'Downloads in 6 Months', ar: 'تحميل خلال 6 أشهر' } },
      { metric: '4.7★', label: { en: 'App Store Rating', ar: 'تقييم متجر التطبيقات' } },
      { metric: '8min', label: { en: 'Average Pickup Time', ar: 'متوسط وقت الاستلام' } },
      { metric: '+320%', label: { en: 'Driver Revenue', ar: 'إيراد السائقين' } },
    ],
    excerpt: {
      en: 'MoveIt is a last-mile delivery platform connecting senders with nearby drivers. We built the iOS and Android apps, the driver app, the dispatcher dashboard, and the backend — all in 16 weeks.',
      ar: 'موف إت منصة توصيل للميل الأخير تربط المُرسلين بسائقين قريبين. بنينا تطبيقي iOS وAndroid، وتطبيق السائق، ولوحة تحكم المرسِل، والخادم الخلفي — كل ذلك خلال 16 أسبوعًا.',
    },
    challenge: {
      title: { en: 'Building a Two-Sided Marketplace App', ar: 'بناء تطبيق سوق ثنائي الأطراف' },
      body: {
        en: 'MoveIt\'s founders had a clear concept — an Uber for last-mile delivery — and 3 months of runway to prove the model. The technical challenge was significant: two separate mobile apps (sender and driver), real-time location tracking, dynamic pricing, payment processing, and a dispatcher dashboard for managing the operation. Everything had to work first-time on launch day.',
        ar: 'كان لدى مؤسسي موف إت فكرة واضحة — أوبر لتوصيل الميل الأخير — و3 أشهر من التمويل لإثبات النموذج. كان التحدي التقني كبيرًا: تطبيقان منفصلان (للمُرسل والسائق)، وتتبّع موقع فوري، وتسعير ديناميكي، ومعالجة مدفوعات، ولوحة تحكم لإدارة العملية. كان على كل شيء أن يعمل من أول مرة يوم الإطلاق.',
      },
      points: [
        { en: 'Two distinct user types — senders and drivers — requiring separate app experiences', ar: 'نوعان مختلفان من المستخدمين — مُرسلون وسائقون — يتطلبان تجارب تطبيق منفصلة' },
        { en: 'Real-time location tracking with sub-5-second update frequency', ar: 'تتبّع موقع فوري بتحديث كل أقل من 5 ثوانٍ' },
        { en: 'Dynamic pricing based on distance, demand, and time of day', ar: 'تسعير ديناميكي حسب المسافة والطلب ووقت اليوم' },
        { en: 'In-app payment processing with escrow and driver payout logic', ar: 'معالجة دفع داخل التطبيق مع منطق ضمان ودفع للسائقين' },
        { en: '3-month runway — scope discipline was existential', ar: '3 أشهر من التمويل — الانضباط في نطاق العمل كان مسألة وجود' },
      ],
    },
    strategy: {
      title: { en: 'MVP-Focused Two-App Architecture', ar: 'بنية تطبيقين مُركّزة على أدنى منتج قابل للتطبيق' },
      body: {
        en: 'We scoped aggressively — two focused apps (sender and driver) sharing a single React Native codebase where possible. The core loop: request → match → track → pay. Everything else was deferred to v2. We delivered a working beta in 8 weeks and the full launch in 16.',
        ar: 'حدّدنا النطاق بصرامة — تطبيقان مُركّزان (للمُرسل والسائق) يتشاركان قاعدة كود واحدة بـReact Native حيثما أمكن. الحلقة الأساسية: طلب ← مطابقة ← تتبّع ← دفع. كل ما عدا ذلك أُجّل للإصدار الثاني. سلّمنا نسخة تجريبية عاملة خلال 8 أسابيع والإطلاق الكامل خلال 16.',
      },
    },
    uxProcess: {
      title: { en: 'Context-Appropriate Design', ar: 'تصميم يراعي سياق الاستخدام' },
      body: {
        en: 'Drivers use the app while driving or handling packages — one-handed, in sunlight, time-pressured. Every driver screen was tested for legibility in direct sunlight and operated with one thumb. The sender experience prioritized clear delivery confirmation and tracking over feature density.',
        ar: 'يستخدم السائقون التطبيق أثناء القيادة أو التعامل مع الطرود — بيد واحدة، تحت ضوء الشمس، وتحت ضغط الوقت. اختُبرت كل شاشة سائق لوضوحها تحت ضوء الشمس المباشر وتشغيلها بإبهام واحد. ركّزت تجربة المُرسل على وضوح تأكيد التوصيل والتتبّع بدلاً من كثافة الميزات.',
      },
    },
    stack: ['React Native', 'TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'Google Maps API', 'Stripe Connect', 'Firebase'],
    keyDecisions: [
      { title: { en: 'Shared Codebase, Separate Experiences', ar: 'قاعدة كود مشتركة، تجارب منفصلة' }, desc: { en: 'One React Native codebase powers both apps with role-based routing. Business logic, API clients, and state management are shared. UI components are role-specific. Maintenance cost halved.', ar: 'قاعدة كود واحدة بـReact Native تُشغّل التطبيقين بتوجيه حسب الدور. منطق العمل وعملاء الواجهة البرمجية وإدارة الحالة مشتركة. مكوّنات الواجهة خاصة بكل دور. انخفضت تكلفة الصيانة إلى النصف.' } },
      { title: { en: 'WebSocket for Real-Time Tracking', ar: 'WebSocket للتتبّع الفوري' }, desc: { en: 'Driver location updates pushed via WebSocket at 3-second intervals. Location data processed in a separate service to isolate the real-time load from the main API.', ar: 'تُدفع تحديثات موقع السائق عبر WebSocket كل 3 ثوانٍ. تُعالج بيانات الموقع في خدمة منفصلة لعزل الحمل الفوري عن الواجهة البرمجية الرئيسية.' } },
      { title: { en: 'Stripe Connect for Driver Payouts', ar: 'Stripe Connect لمدفوعات السائقين' }, desc: { en: 'Stripe Connect handles the escrow model — customer charged at order creation, funds held, released to driver on delivery confirmation. Driver KYC handled by Stripe.', ar: 'يتولى Stripe Connect نموذج الضمان — يُحصَّل العميل عند إنشاء الطلب، تُحتجز الأموال، وتُحرَّر للسائق عند تأكيد التسليم. تتولى Stripe التحقق من هوية السائق.' } },
    ],
    outcome: {
      en: 'MoveIt launched in Cairo with 200 beta drivers and 500 users on day 1. Within 6 months, 50,000 users had downloaded the app and the driver fleet had grown to 1,200. The 4.7-star rating on both stores indicated strong product-market fit. Driver income increased an average of 320% compared to their previous logistics employment.',
      ar: 'أُطلقت موف إت في القاهرة بـ200 سائق تجريبي و500 مستخدم في اليوم الأول. خلال 6 أشهر، حمّل 50,000 مستخدم التطبيق ونما أسطول السائقين إلى 1,200. أشار تقييم 4.7 نجوم على المتجرين إلى ملاءمة قوية بين المنتج والسوق. ارتفع دخل السائقين بمعدل 320٪ مقارنة بعملهم اللوجستي السابق.',
    },
    testimonial: {
      quote: {
        en: 'YANSY TECH built what we needed and cut the features we didn\'t. We launched on time, on budget, and the product actually worked. That\'s rarer than it should be.',
        ar: 'يانسي تك بنت ما احتجناه فعلاً وحذفت الميزات التي لم نحتجها. أطلقنا في الموعد وضمن الميزانية، والمنتج عمل فعليًا. هذا أندر مما ينبغي أن يكون.',
      },
      name: 'Yasmin Farouk',
      role: { en: 'Co-Founder, MoveIt', ar: 'المؤسس المشارك، موف إت' },
    },
    relatedServices: ['mobile-app-development', 'saas-development'],
    relatedStudies: ['bookease', 'vaultanalytics'],
  },

  /* ──────────────────────────────────────────────────────────────
     7. Platterly — Restaurant POS & Online Ordering
  ────────────────────────────────────────────────────────────── */
  {
    slug: 'platterly',
    title: 'Platterly',
    category: { en: 'Restaurants · POS & Ordering', ar: 'المطاعم · كاشير وطلبات' },
    tagline: { en: 'A multi-branch restaurant group that cut order errors by 90% and launched online ordering in 6 weeks', ar: 'مجموعة مطاعم متعددة الفروع خفّضت أخطاء الطلبات 90٪ وأطلقت الطلب الإلكتروني خلال 6 أسابيع' },
    industryKey: 'restaurants',
    industry: { en: 'Restaurants & Food Service', ar: 'المطاعم وخدمات الطعام' },
    service: 'enterprise-software',
    duration: { en: '6 weeks', ar: '6 أسابيع' },
    year: '2025',
    color: '#EA580C',
    results: [
      { metric: '-90%', label: { en: 'Order Errors', ar: 'أخطاء الطلبات' } },
      { metric: '3x', label: { en: 'Online Orders/Week', ar: 'طلبات إلكترونية أسبوعيًا' } },
      { metric: '4 min', label: { en: 'Avg Kitchen Ticket Time', ar: 'متوسط وقت تذكرة المطبخ' } },
      { metric: '5', label: { en: 'Branches Unified', ar: 'فروع مُوحَّدة' } },
    ],
    excerpt: {
      en: 'Platterly ran 5 branches on handwritten order slips and 3 different delivery-app tablets. We built a unified POS, kitchen display, and branded online ordering system that eliminated order mistakes and brought delivery commissions in-house.',
      ar: 'كانت بلاترلي تُدير 5 فروع بتذاكر طلبات مكتوبة يدويًا و3 أجهزة لوحية مختلفة لتطبيقات التوصيل. بنينا نظام كاشير موحّدًا وشاشة عرض للمطبخ ونظام طلب إلكتروني بهويتهم الخاصة ألغى أخطاء الطلبات وأعاد عمولات التوصيل للداخل.',
    },
    challenge: {
      title: { en: 'Five Branches, Zero Systems', ar: 'خمسة فروع، بلا أنظمة' },
      body: {
        en: 'Platterly (name changed for confidentiality) operated 5 restaurant branches, each taking orders on paper slips passed to the kitchen and juggling 3 separate delivery-app tablets that constantly buzzed with conflicting orders. There was no shared menu, no combined sales view, and every delivery-app order cost 25-30% in commission with zero customer data returned to the business.',
        ar: 'شغّلت بلاترلي (الاسم مُغيَّر لأسباب سرية) 5 فروع مطاعم، كل فرع يأخذ الطلبات على تذاكر ورقية تُمرَّر للمطبخ ويوازن بين 3 أجهزة لوحية منفصلة لتطبيقات التوصيل تُصدر تنبيهات متضاربة باستمرار. لم تكن هناك قائمة طعام مشتركة، ولا رؤية مبيعات موحَّدة، وكل طلب من تطبيق توصيل يكلّف عمولة 25-30٪ بدون أي بيانات عملاء تعود للمنشأة.',
      },
      points: [
        { en: 'Paper order slips caused frequent kitchen mistakes and missed items', ar: 'تذاكر الطلبات الورقية تسبّبت في أخطاء متكررة بالمطبخ وأصناف مفقودة' },
        { en: '3 separate delivery-app tablets per branch — no unified order queue', ar: '3 أجهزة لوحية منفصلة لكل فرع — بلا قائمة طلبات موحَّدة' },
        { en: '25-30% commission paid on every delivery order, no owned customer data', ar: 'عمولة 25-30٪ على كل طلب توصيل، بلا بيانات عملاء مملوكة' },
        { en: 'No real-time visibility into which branch, dish, or time slot performed best', ar: 'لا رؤية فورية لأفضل الفروع أو الأطباق أو الأوقات أداءً' },
        { en: 'Menu updates required visiting every branch and every delivery app manually', ar: 'تحديث القائمة يتطلب زيارة كل فرع وكل تطبيق توصيل يدويًا' },
      ],
    },
    strategy: {
      title: { en: 'One POS, One Kitchen Display, One Ordering Brand', ar: 'كاشير واحد، شاشة مطبخ واحدة، علامة طلب واحدة' },
      body: {
        en: 'We built a branch-aware POS with a shared menu engine, a kitchen display system (KDS) replacing paper tickets, and a branded web ordering page so customers could order directly — cutting commission-based orders and capturing customer data for the first time.',
        ar: 'بنينا نظام كاشير واعيًا بالفروع مع محرك قائمة طعام مشترك، ونظام عرض للمطبخ (KDS) يحلّ محل التذاكر الورقية، وصفحة طلب إلكترونية بهويتهم الخاصة ليطلب العملاء مباشرة — ما قلّل الطلبات القائمة على عمولة والتقط بيانات العملاء لأول مرة.',
      },
    },
    uxProcess: {
      title: { en: 'Kitchen-Floor Testing', ar: 'اختبار في أرضية المطبخ' },
      body: {
        en: 'We spent two full dinner services inside the busiest branch, timing how staff actually moved between till and pass. The KDS screen layout, ticket color-coding for delayed items, and one-tap "86" (sold out) flow all came directly from what we observed under real rush conditions, not a whiteboard session.',
        ar: 'قضينا خدمتَي عشاء كاملتين داخل الفرع الأكثر ازدحامًا، نرصد كيف يتحرك الموظفون فعليًا بين الكاشير والتسليم. جاء تخطيط شاشة KDS، وترميز التذاكر بالألوان للأصناف المتأخرة، وتدفّق "نفدت الكمية" بنقرة واحدة، كلها مباشرة مما لاحظناه في ظروف الذروة الحقيقية، لا من جلسة سبورة بيضاء.',
      },
    },
    stack: ['React', 'Node.js', 'PostgreSQL', 'WebSockets', 'Stripe', 'Twilio (SMS)', 'Cloudflare'],
    keyDecisions: [
      { title: { en: 'Shared Menu Engine Across Branches', ar: 'محرك قائمة طعام مشترك بين الفروع' }, desc: { en: 'One menu data model drives the POS, the KDS, and the public ordering page — a price or item change syncs everywhere in seconds instead of five manual updates.', ar: 'نموذج بيانات قائمة واحد يُشغّل الكاشير وشاشة المطبخ وصفحة الطلب العامة — أي تغيير في السعر أو الصنف يُزامَن في كل مكان خلال ثوانٍ بدلاً من خمس تحديثات يدوية.' } },
      { title: { en: 'Kitchen Display Over Paper', ar: 'شاشة مطبخ بدلاً من الورق' }, desc: { en: 'Orders route straight to a branch-specific KDS with color-coded aging tickets. Kitchen staff tap to bump items complete — no slips, no handwriting to misread.', ar: 'تُوجَّه الطلبات مباشرة إلى شاشة KDS خاصة بكل فرع مع تذاكر مرمّزة بالألوان حسب وقت الانتظار. ينقر موظفو المطبخ لتمييز الأصناف كمكتملة — بلا تذاكر ورقية أو خط يد يُساء قراءته.' } },
      { title: { en: 'Direct Online Ordering', ar: 'طلب إلكتروني مباشر' }, desc: { en: 'A branded ordering page accepts card payment via Stripe with zero commission, positioned alongside (not replacing) existing delivery-app listings.', ar: 'تقبل صفحة الطلب بالهوية الخاصة الدفع بالبطاقة عبر Stripe بدون أي عمولة، وتُعرض جنبًا إلى جنب مع قوائم تطبيقات التوصيل الحالية دون استبدالها.' } },
    ],
    outcome: {
      en: 'Order errors traced to miscommunication dropped 90% within the first month of KDS rollout. Direct online orders reached 3x the branches\' prior delivery-app volume within 8 weeks as customers were nudged toward the commission-free option. Owners could, for the first time, see live sales across all 5 branches from one dashboard.',
      ar: 'انخفضت أخطاء الطلبات الناتجة عن سوء التواصل 90٪ خلال الشهر الأول من تطبيق شاشة المطبخ. بلغت الطلبات الإلكترونية المباشرة 3 أضعاف حجم طلبات التوصيل السابق للفروع خلال 8 أسابيع مع توجيه العملاء نحو الخيار الخالي من العمولة. استطاع الملّاك، لأول مرة، رؤية المبيعات المباشرة عبر الفروع الخمسة من لوحة تحكم واحدة.',
    },
    testimonial: {
      quote: {
        en: 'We didn\'t realize how much money the delivery apps were quietly taking until we saw orders move to our own page. The kitchen screen alone paid for itself in the first two weeks — no more shouting over lost tickets.',
        ar: 'لم ندرك كم المال الذي كانت تطبيقات التوصيل تأخذه بهدوء إلا بعد أن رأينا الطلبات تنتقل لصفحتنا الخاصة. شاشة المطبخ وحدها غطّت تكلفتها خلال أول أسبوعين — لا مزيد من الصراخ بسبب تذاكر ضائعة.',
      },
      name: 'Mostafa Adel',
      role: { en: 'Operations Director, Platterly', ar: 'مدير العمليات، بلاترلي' },
    },
    relatedServices: ['enterprise-software', 'web-development'],
    relatedStudies: ['bookease', 'opsflow'],
  },

  /* ──────────────────────────────────────────────────────────────
     8. LearnSphere — Academy LMS Platform
  ────────────────────────────────────────────────────────────── */
  {
    slug: 'learnsphere',
    title: 'LearnSphere',
    category: { en: 'Education · LMS Platform', ar: 'التعليم · منصة إدارة تعلّم' },
    tagline: { en: 'An academy that digitized 40 courses and grew enrollment 65% with its own branded learning platform', ar: 'أكاديمية حوّلت 40 دورة رقميًا وزادت التسجيل 65٪ عبر منصة تعليمية بهويتها الخاصة' },
    industryKey: 'education',
    industry: { en: 'Education & Academies', ar: 'التعليم والأكاديميات' },
    service: 'saas-development',
    duration: { en: '12 weeks', ar: '12 أسبوعًا' },
    year: '2025',
    color: '#7C3AED',
    results: [
      { metric: '+65%', label: { en: 'Enrollment Growth', ar: 'نمو التسجيل' } },
      { metric: '40', label: { en: 'Courses Migrated', ar: 'دورة مُرحَّلة' } },
      { metric: '92%', label: { en: 'Course Completion Rate', ar: 'معدل إتمام الدورات' } },
      { metric: '6 wk', label: { en: 'Time to First Cohort Live', ar: 'الوقت حتى انطلاق أول دفعة' } },
    ],
    excerpt: {
      en: 'A private academy was running courses through a mix of Zoom links, WhatsApp groups, and PDF handouts. We built a branded learning platform with structured courses, progress tracking, and certificates — enrollment grew 65% in the first semester.',
      ar: 'كانت أكاديمية خاصة تُدير دوراتها عبر مزيج من روابط Zoom ومجموعات واتساب وملفات PDF. بنينا منصة تعليمية بهويتها الخاصة بدورات منظّمة وتتبّع تقدّم وشهادات — نما التسجيل 65٪ في الفصل الدراسي الأول.',
    },
    challenge: {
      title: { en: 'Courses Without a Classroom', ar: 'دورات بلا فصل دراسي' },
      body: {
        en: 'The academy taught 40 courses across professional certifications and skills training, coordinated entirely through Zoom invite links, WhatsApp broadcast groups, and PDF handouts emailed manually. Students had no way to track their own progress, instructors had no visibility into who was actually engaging, and there was no certificate or credential issued at completion.',
        ar: 'درّست الأكاديمية 40 دورة بين شهادات مهنية وتدريب مهارات، مُنسَّقة بالكامل عبر روابط دعوة Zoom ومجموعات بث واتساب وملفات PDF تُرسل يدويًا بالبريد. لم يكن لدى الطلاب أي طريقة لتتبّع تقدّمهم، ولا رؤية للمدرّسين على من يتفاعل فعليًا، ولا شهادة أو اعتماد يُصدر عند الإتمام.',
      },
      points: [
        { en: 'No central place for students to access course content or track progress', ar: 'لا مكان مركزي للطلاب للوصول لمحتوى الدورة أو تتبّع التقدّم' },
        { en: 'Manual Zoom link and PDF distribution via WhatsApp broadcast groups', ar: 'توزيع يدوي لروابط Zoom وملفات PDF عبر مجموعات بث واتساب' },
        { en: 'Zero visibility into student engagement or drop-off points per lesson', ar: 'لا رؤية لتفاعل الطلاب أو نقاط الانقطاع في كل درس' },
        { en: 'No completion certificates — a key selling point competitors offered', ar: 'لا شهادات إتمام — نقطة بيع رئيسية يقدّمها المنافسون' },
        { en: 'Instructors spent hours weekly on manual enrollment and reminder admin', ar: 'المدرّسون يقضون ساعات أسبوعيًا في إدارة تسجيل وتذكيرات يدوية' },
      ],
    },
    strategy: {
      title: { en: 'A Branded Learning Platform, Not a Generic LMS', ar: 'منصة تعليمية بهوية خاصة، لا نظام LMS عام' },
      body: {
        en: 'Rather than a white-labeled off-the-shelf LMS, we built a custom platform matching the academy\'s brand — structured courses with video lessons, quizzes, downloadable resources, progress bars, and auto-issued certificates on completion, plus an instructor dashboard showing per-student engagement.',
        ar: 'بدلاً من نظام LMS جاهز بعلامة بيضاء، بنينا منصة مخصصة تتوافق مع هوية الأكاديمية — دورات منظّمة بدروس فيديو واختبارات وموارد قابلة للتحميل وأشرطة تقدّم وشهادات تُصدر تلقائيًا عند الإتمام، بالإضافة إلى لوحة تحكم للمدرّس تعرض تفاعل كل طالب.',
      },
    },
    uxProcess: {
      title: { en: 'Student-First Course Navigation', ar: 'تصفّح دورات يضع الطالب أولاً' },
      body: {
        en: 'We tested the course player with 12 existing students across age groups from 19 to 45. The biggest friction point was "where do I pick up where I left off" — we designed a persistent progress rail and auto-resume that solved this directly, plus mobile-first video playback since 70% of test users watched lessons on their phones.',
        ar: 'اختبرنا مشغّل الدورات مع 12 طالبًا حاليًا عبر فئات عمرية من 19 إلى 45. كانت أكبر نقطة احتكاك هي "من أين أكمل ما توقفت عنده" — صمّمنا شريط تقدّم دائمًا واستئنافًا تلقائيًا حلّ ذلك مباشرة، بالإضافة إلى تشغيل فيديو بأولوية الجوال لأن 70٪ من مستخدمي الاختبار شاهدوا الدروس على هواتفهم.',
      },
    },
    stack: ['Next.js', 'Node.js', 'PostgreSQL', 'AWS S3 & CloudFront', 'Stripe', 'SendGrid'],
    keyDecisions: [
      { title: { en: 'Video Delivery via CDN', ar: 'توصيل الفيديو عبر CDN' }, desc: { en: 'Lesson videos are transcoded and served through CloudFront with adaptive bitrate streaming — smooth playback even on slower mobile connections, the majority use case observed in testing.', ar: 'تُعاد ترميز فيديوهات الدروس وتُقدَّم عبر CloudFront ببث معدل بت تكيّفي — تشغيل سلس حتى على اتصالات جوال أبطأ، وهو حالة الاستخدام الأغلب التي لوحظت أثناء الاختبار.' } },
      { title: { en: 'Auto-Issued Certificates', ar: 'شهادات تُصدر تلقائيًا' }, desc: { en: 'On reaching 100% course completion and passing the final quiz threshold, a branded PDF certificate generates automatically with a verifiable ID — no manual instructor action required.', ar: 'عند بلوغ إتمام الدورة 100٪ وتجاوز حد الاختبار النهائي، تُولَّد شهادة PDF بالهوية الخاصة تلقائيًا مع معرّف قابل للتحقق — بلا أي إجراء يدوي من المدرّس.' } },
      { title: { en: 'Engagement Analytics Dashboard', ar: 'لوحة تحليلات التفاعل' }, desc: { en: 'Instructors see per-lesson drop-off, average watch time, and quiz scores — data that previously didn\'t exist at all, now used to revise weak lessons each term.', ar: 'يرى المدرّسون معدل الانقطاع في كل درس، ومتوسط وقت المشاهدة، ودرجات الاختبارات — بيانات لم تكن موجودة إطلاقًا من قبل، تُستخدم الآن لمراجعة الدروس الضعيفة كل فصل.' } },
    ],
    outcome: {
      en: 'Enrollment grew 65% in the first semester on the new platform, driven partly by the credibility of offering real certificates. Course completion rate reached 92%, far above the estimated sub-40% completion the academy believed it had under the old Zoom/WhatsApp model (which was never actually measurable before). Instructor admin time dropped by an estimated 5+ hours per week.',
      ar: 'نما التسجيل 65٪ في الفصل الدراسي الأول على المنصة الجديدة، مدفوعًا جزئيًا بمصداقية تقديم شهادات حقيقية. بلغ معدل إتمام الدورات 92٪، أعلى بكثير من التقدير الذي كانت الأكاديمية تعتقده أقل من 40٪ في ظل نموذج Zoom/واتساب القديم (والذي لم يكن قابلاً للقياس فعليًا من قبل). انخفض الوقت الإداري للمدرّسين بما يُقدَّر بأكثر من 5 ساعات أسبوعيًا.',
    },
    testimonial: {
      quote: {
        en: 'We used to just hope students showed up to the Zoom link. Now we can see exactly who\'s engaged, who\'s falling behind, and issue real certificates that students are proud to share on LinkedIn.',
        ar: 'كنا فقط نأمل أن يحضر الطلاب لرابط Zoom. الآن يمكننا أن نرى بالضبط من يتفاعل، ومن يتأخر، ونُصدر شهادات حقيقية يفخر الطلاب بمشاركتها على LinkedIn.',
      },
      name: 'Rana Mahmoud',
      role: { en: 'Academic Director, LearnSphere', ar: 'المدير الأكاديمي، ليرن سفير' },
    },
    relatedServices: ['saas-development', 'ui-ux-design'],
    relatedStudies: ['vaultanalytics', 'bookease'],
  },

  /* ──────────────────────────────────────────────────────────────
     9. StayLuxe — Hotel Booking & Property Management
  ────────────────────────────────────────────────────────────── */
  {
    slug: 'stayluxe',
    title: 'StayLuxe',
    category: { en: 'Hospitality · Booking & PMS', ar: 'الضيافة · حجز ونظام إدارة فندقية' },
    tagline: { en: 'A boutique hotel group that cut OTA commission dependence in half with direct booking + a unified front desk', ar: 'مجموعة فنادق بوتيك خفّضت الاعتماد على عمولات منصات الحجز للنصف بحجز مباشر واستقبال موحّد' },
    industryKey: 'hospitality',
    industry: { en: 'Hotels & Hospitality', ar: 'الفنادق والضيافة' },
    service: 'enterprise-software',
    duration: { en: '10 weeks', ar: '10 أسابيع' },
    year: '2025',
    color: '#0E7490',
    results: [
      { metric: '-45%', label: { en: 'OTA Commission Spend', ar: 'إنفاق عمولة منصات الحجز' } },
      { metric: '2.4x', label: { en: 'Direct Bookings', ar: 'الحجوزات المباشرة' } },
      { metric: '15 min', label: { en: 'Front Desk Check-in (from 40)', ar: 'تسجيل الوصول بالاستقبال (من 40)' } },
      { metric: '3', label: { en: 'Properties Unified', ar: 'عقارات مُوحَّدة' } },
    ],
    excerpt: {
      en: 'StayLuxe\'s 3 boutique properties relied on booking.com and Airbnb for 90% of reservations, paying up to 18% commission per stay. We built a direct booking engine and a unified property management system, cutting commission spend nearly in half.',
      ar: 'اعتمدت عقارات ستاي لوكس البوتيك الثلاثة على Booking.com وAirbnb لـ90٪ من حجوزاتها، بعمولة تصل إلى 18٪ لكل إقامة. بنينا محرك حجز مباشر ونظام إدارة عقارات موحّدًا، ما خفّض إنفاق العمولة إلى النصف تقريبًا.',
    },
    challenge: {
      title: { en: 'Fully Dependent on OTA Commissions', ar: 'اعتماد كامل على عمولات منصات الحجز' },
      body: {
        en: 'StayLuxe (name changed for confidentiality) ran 3 boutique properties with 90% of bookings arriving through OTAs like Booking.com and Airbnb, each taking 15-18% commission. Front desk staff manually cross-checked availability across a spreadsheet and 3 separate OTA extranets to avoid double-bookings — a process that took up to 40 minutes during peak check-in periods and occasionally still failed, causing overbooking incidents.',
        ar: 'شغّلت ستاي لوكس (الاسم مُغيَّر لأسباب سرية) 3 عقارات بوتيك بحيث تصل 90٪ من الحجوزات عبر منصات وسيطة مثل Booking.com وAirbnb، وكل منها تأخذ عمولة 15-18٪. كان موظفو الاستقبال يراجعون التوافر يدويًا عبر جدول بيانات و3 بوابات خارجية منفصلة لتجنّب الحجز المزدوج — عملية استغرقت حتى 40 دقيقة في أوقات ذروة تسجيل الوصول وأحيانًا كانت تفشل، مسبّبة حوادث حجز زائد.',
      },
      points: [
        { en: '90% of bookings via OTA commission channels, some as high as 18% per stay', ar: '90٪ من الحجوزات عبر قنوات عمولة وسيطة، بعضها يصل إلى 18٪ لكل إقامة' },
        { en: 'Manual availability cross-checks across 3 OTA extranets — occasional double-bookings', ar: 'مراجعة توافر يدوية عبر 3 بوابات خارجية — حجوزات مزدوجة أحيانًا' },
        { en: 'No direct booking website — zero ability to capture repeat guests without paying commission again', ar: 'لا يوجد موقع حجز مباشر — بلا أي قدرة على استقطاب ضيوف متكررين بدون دفع عمولة مجددًا' },
        { en: 'Front desk check-in averaged 40 minutes due to manual verification', ar: 'بلغ متوسط تسجيل الوصول بالاستقبال 40 دقيقة بسبب التحقق اليدوي' },
        { en: 'No unified view of occupancy or revenue across all 3 properties', ar: 'لا رؤية موحّدة للإشغال أو الإيراد عبر العقارات الثلاثة' },
      ],
    },
    strategy: {
      title: { en: 'Direct Booking Engine + Unified Channel Manager', ar: 'محرك حجز مباشر + مدير قنوات موحّد' },
      body: {
        en: 'We built a branded direct-booking website with real-time availability, connected through a channel manager that syncs inventory across OTAs automatically, plus a front-desk PMS giving staff one screen for check-in, room status, and guest history across all 3 properties.',
        ar: 'بنينا موقع حجز مباشر بالهوية الخاصة بتوافر فوري، متصلاً عبر مدير قنوات يُزامن المخزون عبر منصات الحجز تلقائيًا، بالإضافة إلى نظام إدارة استقبال يمنح الموظفين شاشة واحدة لتسجيل الوصول وحالة الغرف وسجل الضيوف عبر العقارات الثلاثة.',
      },
    },
    uxProcess: {
      title: { en: 'Guest Journey Mapping', ar: 'رسم رحلة الضيف' },
      body: {
        en: 'We mapped the guest journey from OTA discovery through to repeat direct booking, identifying that most guests never realized the hotel had its own site. The redesigned post-stay email and in-room signage nudging toward direct booking for the next stay was tested across 2 properties before full rollout.',
        ar: 'رسمنا رحلة الضيف من الاكتشاف عبر منصة وسيطة وصولاً إلى حجز مباشر متكرر، ووجدنا أن معظم الضيوف لم يكونوا يدركون أن للفندق موقعه الخاص. اختُبر بريد ما بعد الإقامة المُعاد تصميمه ولافتات داخل الغرف تُوجّه نحو الحجز المباشر للإقامة القادمة عبر عقارَين قبل الطرح الكامل.',
      },
    },
    stack: ['React', 'Node.js', 'PostgreSQL', 'Stripe', 'Channel Manager API integrations', 'Redis'],
    keyDecisions: [
      { title: { en: 'Real-Time Channel Sync', ar: 'مزامنة قنوات فورية' }, desc: { en: 'A single inventory source of truth pushes availability updates to all connected OTAs within seconds of a direct or OTA booking — eliminating the double-booking risk entirely.', ar: 'مصدر مخزون واحد موثوق يدفع تحديثات التوافر لكل منصات الحجز المتصلة خلال ثوانٍ من أي حجز مباشر أو عبر وسيط — ما يُلغي خطر الحجز المزدوج تمامًا.' } },
      { title: { en: 'Unified Front Desk Screen', ar: 'شاشة استقبال موحّدة' }, desc: { en: 'One PMS view replaces the spreadsheet-plus-3-extranets workflow — check-in dropped from 40 minutes to 15 during peak periods.', ar: 'شاشة إدارة استقبال واحدة تحل محل سير عمل جدول البيانات مع 3 بوابات خارجية — انخفض تسجيل الوصول من 40 دقيقة إلى 15 خلال أوقات الذروة.' } },
      { title: { en: 'Post-Stay Direct Booking Nudge', ar: 'تحفيز حجز مباشر بعد الإقامة' }, desc: { en: 'Automated post-checkout email with a direct discount code specifically for the next stay — the single highest-converting lever for shifting repeat guests away from OTA commission.', ar: 'بريد إلكتروني آلي بعد تسجيل المغادرة برمز خصم مباشر مخصص للإقامة القادمة — الرافعة الأعلى تحويلاً لتحويل الضيوف المتكررين بعيدًا عن عمولة المنصات الوسيطة.' } },
    ],
    outcome: {
      en: 'Direct bookings grew 2.4x within the first two quarters, reducing overall OTA commission spend by 45%. Front desk check-in time dropped from an average of 40 minutes to 15. Management gained a single live view of occupancy and revenue across all 3 properties for the first time, enabling same-day pricing decisions instead of end-of-month reporting.',
      ar: 'نمت الحجوزات المباشرة 2.4 مرة خلال أول ربعَين، ما خفّض إجمالي إنفاق عمولة المنصات الوسيطة 45٪. انخفض وقت تسجيل الوصول بالاستقبال من متوسط 40 دقيقة إلى 15. اكتسبت الإدارة رؤية حية موحّدة للإشغال والإيراد عبر العقارات الثلاثة لأول مرة، ما مكّن من قرارات تسعير في نفس اليوم بدلاً من تقارير نهاية الشهر.',
    },
    testimonial: {
      quote: {
        en: 'We always knew we were paying too much to the booking platforms, we just didn\'t have another option. Now our own site actually converts, and our front desk isn\'t drowning in spreadsheets during check-in rush.',
        ar: 'كنا نعلم دائمًا أننا ندفع الكثير لمنصات الحجز، لكن لم يكن لدينا خيار آخر. الآن موقعنا الخاص يُحوّل فعليًا، واستقبالنا لم يعد غارقًا في جداول البيانات أثناء ازدحام تسجيل الوصول.',
      },
      name: 'Laila Fahmy',
      role: { en: 'General Manager, StayLuxe', ar: 'المدير العام، ستاي لوكس' },
    },
    relatedServices: ['enterprise-software', 'web-development'],
    relatedStudies: ['nexusrealty', 'platterly'],
  },
];

export const getCaseStudyBySlug = (slug) => CASE_STUDIES.find(c => c.slug === slug) || null;
export const getAllCaseStudySlugs = () => CASE_STUDIES.map(c => c.slug);
export const getFeaturedCaseStudies = (n = 3) => CASE_STUDIES.slice(0, n);
