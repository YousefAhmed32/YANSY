export default {
  category: 'Real Estate',
  industry: 'Real Estate — Listings & Virtual Tours',

  clients: [
    { name: 'Havenwood Realty', nameAr: 'هافنوود العقارية', location: 'Charlotte, USA', locationAr: 'شارلوت، الولايات المتحدة' },
    { name: 'Marasi Properties', nameAr: 'مراسي العقارية', location: 'Doha, Qatar', locationAr: 'الدوحة، قطر' },
  ],

  titleTemplate: '{client} — Listings & Virtual Tour Platform',
  titleTemplateAr: 'منصة القوائم العقارية والجولات الافتراضية لـ {clientAr}',
  tagline: 'A listings site that qualifies buyers before an agent ever picks up the phone.',
  taglineAr: 'موقع قوائم عقارية يؤهّل المشترين قبل أن يرفع الوكيل سماعة الهاتف أصلاً.',

  description: '{client} was relying entirely on third-party listing portals and losing lead ownership to them in the process. We built a branded property platform with map-based search, 3D virtual tours, a mortgage affordability calculator, and an agent-routed inquiry system that pre-qualifies leads before handoff.',
  descriptionAr: 'كانت {clientAr} تعتمد بالكامل على منصات قوائم عقارية خارجية وتفقد ملكية العملاء المحتملين لصالحها في هذه العملية. بنينا منصة عقارية بعلامة {clientAr} تشمل بحثًا بالخريطة، جولات افتراضية ثلاثية الأبعاد، حاسبة قدرة تمويل عقاري، ونظامًا لتوجيه الاستفسارات يؤهّل العملاء المحتملين قبل تسليمهم للوكيل.',

  myRole: 'Full-stack engineering and UX design for the listings search experience and agent lead-routing system.',
  myRoleAr: 'الهندسة الكاملة وتصميم تجربة المستخدم لبحث القوائم العقارية ونظام توجيه العملاء المحتملين للوكلاء.',

  goals: 'Own buyer leads directly instead of renting them from listing portals, let buyers tour a property remotely before requesting an in-person viewing, and route inquiries to the right agent automatically by territory and specialty.',
  goalsAr: 'امتلاك عملاء المشترين المحتملين مباشرة بدلاً من استئجارهم من منصات القوائم، وتمكين المشترين من جولة عقار عن بُعد قبل طلب معاينة حضورية، وتوجيه الاستفسارات تلقائيًا للوكيل المناسب حسب المنطقة والتخصص.',

  painPoints: 'Every serious lead first appeared on a third-party portal that charged per-lead fees, buyers requested in-person showings for properties that didn\'t match their budget or needs, and inquiry routing to agents was a manual, first-come email forward.',
  painPointsAr: 'كان كل عميل محتمل جاد يظهر أولاً على منصة خارجية تفرض رسومًا لكل عميل محتمل، وطلب المشترون معاينات حضورية لعقارات لا تناسب ميزانيتهم أو احتياجاتهم، وكان توجيه الاستفسارات للوكلاء عملية إعادة توجيه بريد إلكتروني يدوية على أساس السبق.',

  challenge: 'Virtual tours needed to feel genuinely useful — not a gimmick — so buyers could rule properties in or out remotely, while the underlying map search had to handle thousands of listings with filters specific enough to actually narrow results in a competitive market.',
  challengeAr: 'كان على الجولات الافتراضية أن تشعر بفائدة حقيقية — لا مجرد ميزة زائدة — بحيث يستطيع المشترون استبعاد أو ترشيح العقارات عن بُعد، بينما كان على بحث الخريطة الأساسي التعامل مع آلاف القوائم بفلاتر دقيقة كفاية لتضييق النتائج فعليًا في سوق تنافسي.',

  solution: 'We built a map-based search with granular filters (school zones, commute time, HOA fees), embedded 3D virtual tours on every listing, a mortgage affordability calculator tied directly to search filters, and an inquiry system that scores lead intent before routing to the matching agent by territory.',
  solutionAr: 'بنينا بحثًا قائمًا على الخريطة بفلاتر دقيقة (مناطق المدارس، وقت التنقل، رسوم الجمعية)، وجولات افتراضية ثلاثية الأبعاد مدمجة في كل قائمة، وحاسبة قدرة تمويل عقاري مرتبطة مباشرة بفلاتر البحث، ونظام استفسارات يقيّم جدية العميل المحتمل قبل توجيهه للوكيل المناسب حسب المنطقة.',

  process: 'We launched map search and virtual tours first since they required no change to the agents\' existing workflow, then introduced lead scoring and automated routing once agents trusted the quality of inbound inquiries.',
  processAr: 'أطلقنا بحث الخريطة والجولات الافتراضية أولاً لأنها لم تتطلب أي تغيير في سير عمل الوكلاء الحالي، ثم قدّمنا تقييم العملاء المحتملين والتوجيه الآلي بعد أن وثق الوكلاء بجودة الاستفسارات الواردة.',

  results: 'Lead-to-showing conversion improved noticeably once buyers could pre-qualify properties via virtual tour, cost-per-lead dropped since fewer leads were purchased from third-party portals, and average agent response time to a new inquiry fell from hours to minutes.',
  resultsAr: 'تحسّن معدل تحويل العميل المحتمل إلى معاينة بشكل ملحوظ بعد أن أصبح بإمكان المشترين تأهيل العقارات مسبقًا عبر الجولة الافتراضية، وانخفضت تكلفة العميل المحتمل بعد شراء عدد أقل من العملاء المحتملين من منصات خارجية، وانخفض متوسط وقت استجابة الوكيل للاستفسار الجديد من ساعات إلى دقائق.',

  metrics: [
    { label: 'Lead-to-showing conversion', labelAr: 'تحويل العميل المحتمل إلى معاينة', value: '+31%', trend: 'up' },
    { label: 'Cost per lead', labelAr: 'تكلفة العميل المحتمل', value: '-44%', trend: 'down' },
    { label: 'Agent response time', labelAr: 'وقت استجابة الوكيل', value: '< 8 min', trend: 'down' },
    { label: 'Virtual tour engagement', labelAr: 'تفاعل الجولة الافتراضية', value: '68%', trend: 'up' },
  ],

  performanceMetrics: [
    { label: 'Listing page load time', labelAr: 'زمن تحميل صفحة القائمة', before: '4.6s', after: '1.1s' },
    { label: 'Search results refresh', labelAr: 'تحديث نتائج البحث', before: '2.8s', after: '0.4s' },
    { label: 'Lighthouse performance', labelAr: 'أداء Lighthouse', before: '49', after: '92' },
  ],

  faqs: [
    { question: 'Are the virtual tours real 3D walkthroughs?', questionAr: 'هل الجولات الافتراضية جولات ثلاثية الأبعاد حقيقية؟', answer: 'Yes — each listing embeds a navigable 3D tour, not just static photos, so buyers can walk through the space remotely.', answerAr: 'نعم — تتضمن كل قائمة جولة ثلاثية الأبعاد قابلة للتصفح، وليست مجرد صور ثابتة، بحيث يمكن للمشترين التجول في المساحة عن بُعد.' },
    { question: 'How are inquiries routed to the right agent?', questionAr: 'كيف تُوجَّه الاستفسارات للوكيل المناسب؟', answer: 'Each inquiry is scored for buyer intent and routed automatically to the agent covering that property\'s territory and specialty.', answerAr: 'يُقيَّم كل استفسار لتحديد جدية المشتري ويُوجَّه تلقائيًا للوكيل المسؤول عن منطقة وتخصص ذلك العقار.' },
    { question: 'Does the search account for affordability?', questionAr: 'هل يأخذ البحث القدرة الشرائية بعين الاعتبار؟', answer: 'Yes — a built-in mortgage calculator lets buyers filter listings by realistic monthly payment, not just list price.', answerAr: 'نعم — تتيح حاسبة تمويل عقاري مدمجة للمشترين تصفية القوائم حسب القسط الشهري الواقعي، وليس سعر القائمة فقط.' },
    { question: 'Can the platform scale to thousands of listings?', questionAr: 'هل يمكن للمنصة التوسع لآلاف القوائم؟', answer: 'Yes — the map search is built on indexed geospatial queries that stay fast well beyond current listing volume.', answerAr: 'نعم — بُني بحث الخريطة على استعلامات جغرافية مفهرسة تبقى سريعة بما يتجاوز حجم القوائم الحالي بكثير.' },
  ],

  team: [
    { name: 'Camila Torres', role: 'Product Manager', roleAr: 'مديرة منتج' },
    { name: 'Hassan Fikry', role: 'Lead Full-Stack Engineer', roleAr: 'مهندس برمجيات رئيسي' },
    { name: 'Astrid Lindqvist', role: 'UI/UX Designer', roleAr: 'مصممة واجهات وتجربة مستخدم' },
    { name: 'Victor Adeyemi', role: 'QA Engineer', roleAr: 'مهندس ضمان الجودة' },
  ],

  testimonial: {
    quote: 'We stopped renting our own leads back from listing portals. Buyers arrive at a showing already knowing the property — our agents just close.',
    quoteAr: 'توقفنا عن استئجار عملائنا المحتملين الخاصين من منصات القوائم. يصل المشترون إلى المعاينة وهم يعرفون العقار مسبقًا — كل ما يفعله وكلاؤنا هو إتمام الصفقة.',
    author: 'Broker & Founder', role: 'Broker & Founder', roleAr: 'الوسيط والمؤسس',
  },

  tags: ['Next.js', 'Node.js', 'PostgreSQL', 'Mapbox', 'Matterport', 'Cloudinary', 'Real Estate Listings', 'Virtual Tours', 'Lead Routing'],
  duration: '13 weeks',
  teamSize: '4 people',

  businessValue: 'Owning the lead relationship directly instead of renting it from portals lowered {client}\'s cost per closed deal, and pre-qualified showings meant agents spent their time on buyers ready to move, not window-shoppers.',
  businessValueAr: 'أدى امتلاك علاقة العميل المحتمل مباشرة بدلاً من استئجارها من المنصات إلى خفض تكلفة كل صفقة مغلقة لـ {clientAr}، وعنت المعاينات المؤهّلة مسبقًا أن الوكلاء يقضون وقتهم مع مشترين جاهزين للانتقال، لا مجرد متصفحين.',

  futureImprovements: 'Next: AI-generated neighborhood summaries per listing, a saved-search alert system for buyers, and an agent CRM view showing full inquiry-to-close pipeline history.',
  futureImprovementsAr: 'التالي: ملخصات أحياء مولّدة بالذكاء الاصطناعي لكل قائمة، نظام تنبيهات بحث محفوظ للمشترين، وواجهة CRM للوكيل تعرض سجل مسار كامل من الاستفسار حتى إغلاق الصفقة.',

  highlightStats: [
    { value: '+31%', label: 'Showing conversion', labelAr: 'تحويل المعاينات' },
    { value: '-44%', label: 'Cost per lead', labelAr: 'تكلفة العميل المحتمل' },
    { value: '92', label: 'Lighthouse score', labelAr: 'نقاط Lighthouse' },
  ],

  gallerySuggestions: [
    { caption: 'Map-based listing search with granular filters', captionAr: 'بحث القوائم بالخريطة مع فلاتر دقيقة' },
    { caption: 'Embedded 3D virtual tour on a listing page', captionAr: 'جولة افتراضية ثلاثية الأبعاد مدمجة في صفحة القائمة' },
    { caption: 'Mortgage affordability calculator', captionAr: 'حاسبة القدرة على التمويل العقاري' },
    { caption: 'Agent inquiry routing dashboard', captionAr: 'لوحة تحكم توجيه استفسارات الوكيل' },
  ],

  metaTitle: '{client} Real Estate Platform Case Study — Listings & Virtual Tours | YANSY Tech',
  metaDescription: 'How we built {client} a listings and virtual tour platform that improved lead-to-showing conversion by 31%.',
};
