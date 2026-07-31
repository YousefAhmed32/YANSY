export default {
  category: 'Other',
  industry: 'Creative Portfolio — Studio Showcase Site',

  clients: [
    { name: 'Mara Voss Studio', nameAr: 'استوديو مارا فوس', location: 'Amsterdam, Netherlands', locationAr: 'أمستردام، هولندا' },
    { name: 'Athar Creative Studio', nameAr: 'استوديو أثر الإبداعي', location: 'Beirut, Lebanon', locationAr: 'بيروت، لبنان' },
  ],

  titleTemplate: '{client} — Portfolio & Case Study Site',
  titleTemplateAr: 'موقع معرض الأعمال ودراسات الحالة لـ {clientAr}',
  tagline: 'A portfolio fast enough to load before a hiring client\'s attention span runs out.',
  taglineAr: 'معرض أعمال سريع بما يكفي ليُحمَّل قبل نفاد صبر العميل المحتمل.',

  description: '{client} needed a portfolio that did more than show pretty images — it had to tell the story behind each project convincingly enough to win the next client. We built a fast, image-forward portfolio site with a lightweight CMS the studio updates without touching code, case study pages, and a direct inquiry flow.',
  descriptionAr: 'احتاج {clientAr} إلى معرض أعمال يفعل أكثر من عرض صور جميلة — كان عليه أن يروي القصة خلف كل مشروع بشكل مقنع بما يكفي لكسب العميل التالي. بنينا موقع معرض أعمال سريعًا يركّز على الصور مع نظام إدارة محتوى خفيف يحدّثه الاستوديو دون لمس الكود، وصفحات دراسة حالة، ومسار استفسار مباشر.',

  myRole: 'Design and full-stack engineering for the portfolio site, case study templates, and lightweight content system.',
  myRoleAr: 'التصميم والهندسة الكاملة لموقع المعرض وقوالب دراسة الحالة ونظام المحتوى الخفيف.',

  goals: 'Make the work itself load fast and look sharp on any device, let the studio publish new projects without hiring a developer each time, and turn portfolio visitors into actual inquiries.',
  goalsAr: 'جعل الأعمال نفسها تُحمَّل بسرعة وتبدو حادة على أي جهاز، وتمكين الاستوديو من نشر مشاريع جديدة دون توظيف مطور في كل مرة، وتحويل زوار المعرض إلى استفسارات فعلية.',

  painPoints: 'The old site was a slow page-builder template with generic sections that didn\'t match the studio\'s visual identity, updating it required emailing a freelancer for every change, and there was no clear path from "browsing the portfolio" to "sending an inquiry."',
  painPointsAr: 'كان الموقع القديم قالب بناء صفحات بطيئًا بأقسام عامة لا تتطابق مع الهوية البصرية للاستوديو، وكان تحديثه يتطلب مراسلة مستقل مستقل عبر البريد الإلكتروني في كل مرة، ولم يكن هناك مسار واضح من "تصفح المعرض" إلى "إرسال استفسار."',

  challenge: 'The site had to load large, high-resolution imagery near-instantly without compromising visual quality, while still giving a non-technical studio owner full control to add, reorder, and retire projects without ever opening a code editor.',
  challengeAr: 'كان على الموقع تحميل صور عالية الدقة بشكل شبه فوري دون المساس بالجودة البصرية، مع منح مالك الاستوديو غير التقني تحكمًا كاملاً لإضافة المشاريع وإعادة ترتيبها وسحبها دون فتح محرر أكواد إطلاقًا.',

  solution: 'We built a statically-generated site with automatic image optimization and lazy-loading, a lightweight headless CMS for adding and reordering case studies from a simple form, editorial case study templates with room for process shots and client quotes, and a direct inquiry form routed straight to the studio\'s inbox.',
  solutionAr: 'بنينا موقعًا مُولَّدًا بشكل ثابت مع تحسين تلقائي للصور وتحميل كسول، ونظام إدارة محتوى خفيف بدون واجهة لإضافة وإعادة ترتيب دراسات الحالة من نموذج بسيط، وقوالب دراسة حالة تحريرية مع مساحة للقطات العملية واقتباسات العملاء، ونموذج استفسار مباشر يُوجَّه إلى صندوق وارد الاستوديو مباشرة.',

  process: 'We audited the existing project archive to pick the strongest work first, designed a flexible case study template around that work rather than a generic one, then built the CMS last once the visual language was locked so it matched exactly what the studio needed to control.',
  processAr: 'راجعنا أرشيف المشاريع الحالي لاختيار أقوى الأعمال أولاً، وصممنا قالب دراسة حالة مرن حول تلك الأعمال بدلاً من قالب عام، ثم بنينا نظام إدارة المحتوى أخيرًا بعد ثبات اللغة البصرية بحيث يطابق تمامًا ما يحتاج الاستوديو للتحكم فيه.',

  results: 'Page load time on the gallery-heavy homepage dropped from several seconds to near-instant, the studio has published new case studies independently every month since launch with zero developer involvement, and inbound inquiries through the new contact flow increased noticeably.',
  resultsAr: 'انخفض زمن تحميل الصفحة الرئيسية الغنية بالمعرض من عدة ثوانٍ إلى شبه فوري، ونشر الاستوديو دراسات حالة جديدة بشكل مستقل كل شهر منذ الإطلاق دون أي تدخل من مطور، وزادت الاستفسارات الواردة عبر مسار التواصل الجديد بشكل ملحوظ.',

  metrics: [
    { label: 'Homepage load time', labelAr: 'زمن تحميل الصفحة الرئيسية', value: '-81%', trend: 'down' },
    { label: 'Independent publishes/month', labelAr: 'نشر مستقل شهريًا', value: '3–4', trend: 'up' },
    { label: 'Inbound inquiries', labelAr: 'الاستفسارات الواردة', value: '+52%', trend: 'up' },
    { label: 'Avg. time on case study', labelAr: 'متوسط الوقت في دراسة الحالة', value: '2:40 min', trend: 'up' },
  ],

  performanceMetrics: [
    { label: 'Homepage load time', labelAr: 'زمن تحميل الصفحة الرئيسية', before: '5.4s', after: '1.0s' },
    { label: 'Lighthouse performance', labelAr: 'أداء Lighthouse', before: '46', after: '98' },
    { label: 'Image payload (homepage)', labelAr: 'حجم الصور (الصفحة الرئيسية)', before: '18.2 MB', after: '2.1 MB' },
  ],

  faqs: [
    { question: 'Can the studio add new projects without a developer?', questionAr: 'هل يمكن للاستوديو إضافة مشاريع جديدة دون مطور؟', answer: 'Yes — a lightweight CMS lets the studio upload images, write the case study copy, and publish directly from a simple form.', answerAr: 'نعم — يتيح نظام إدارة محتوى خفيف للاستوديو رفع الصور وكتابة نص دراسة الحالة والنشر مباشرة من نموذج بسيط.' },
    { question: 'How does the site stay fast with so much imagery?', questionAr: 'كيف يبقى الموقع سريعًا مع هذا الكم من الصور؟', answer: 'Every image is automatically optimized and lazy-loaded, so only what\'s visible on screen loads at full resolution.', answerAr: 'تُحسَّن كل صورة تلقائيًا وتُحمَّل بشكل كسول، بحيث لا يُحمَّل بالدقة الكاملة إلا ما هو ظاهر على الشاشة.' },
    { question: 'Is the site optimized for mobile visitors?', questionAr: 'هل الموقع محسّن لزوار الجوال؟', answer: 'Yes — the gallery, case study layouts, and inquiry form are all designed mobile-first, since most portfolio traffic arrives from a phone.', answerAr: 'نعم — صُمِّمت المعارض وتخطيطات دراسة الحالة ونموذج الاستفسار جميعها بأولوية للجوال، إذ تصل معظم زيارات المعرض من الهاتف.' },
    { question: 'What happens to an inquiry submitted through the site?', questionAr: 'ماذا يحدث للاستفسار المُقدَّم عبر الموقع؟', answer: 'It\'s routed directly to the studio\'s inbox with the visitor\'s project details, no third-party form tool in between.', answerAr: 'يُوجَّه مباشرة إلى صندوق وارد الاستوديو مع تفاصيل مشروع الزائر، دون أي أداة نماذج خارجية بينهما.' },
  ],

  team: [
    { name: 'Simone Okafor', role: 'Product Designer', roleAr: 'مصممة منتج' },
    { name: 'Jonas Weber', role: 'Lead Frontend Engineer', roleAr: 'مهندس فرونت إند رئيسي' },
    { name: 'Reem Qassem', role: 'Content Strategist', roleAr: 'استراتيجية محتوى' },
    { name: 'Alex Moreau', role: 'QA Engineer', roleAr: 'مهندس ضمان الجودة' },
  ],

  testimonial: {
    quote: 'I finally have a site that looks as considered as the work itself, and I can publish a new project the same day I finish it — no waiting on anyone.',
    quoteAr: 'أصبح لدي أخيرًا موقع يبدو مدروسًا بقدر العمل نفسه، ويمكنني نشر مشروع جديد في نفس اليوم الذي أنهيه فيه — دون انتظار أحد.',
    author: 'Founder & Creative Director', role: 'Founder & Creative Director', roleAr: 'المؤسسة والمديرة الإبداعية',
  },

  tags: ['Next.js', 'Framer Motion', 'Headless CMS', 'Cloudinary', 'Vercel', 'Portfolio Site', 'Case Study Design', 'Creative Studio'],
  duration: '6 weeks',
  teamSize: '3 people',

  businessValue: 'A faster, self-updatable portfolio meant {client} could publish new work the moment it was ready instead of waiting on a developer, keeping the site current enough to actually influence hiring decisions instead of showing stale work.',
  businessValueAr: 'عنى معرض أعمال أسرع وقابل للتحديث الذاتي أن بإمكان {clientAr} نشر عمل جديد لحظة جاهزيته بدلاً من انتظار مطور، ما أبقى الموقع محدثًا بما يكفي للتأثير فعليًا على قرارات التوظيف بدلاً من عرض أعمال قديمة.',

  futureImprovements: 'Next: a searchable, filterable archive as the project count grows, an embedded video reel on the homepage, and lightweight analytics so the studio can see which case studies actually drive inquiries.',
  futureImprovementsAr: 'التالي: أرشيف قابل للبحث والتصفية مع نمو عدد المشاريع، شريط فيديو مدمج في الصفحة الرئيسية، وتحليلات خفيفة تتيح للاستوديو معرفة أي دراسات الحالة تولّد الاستفسارات فعليًا.',

  highlightStats: [
    { value: '1.0s', label: 'Homepage load', labelAr: 'تحميل الصفحة الرئيسية' },
    { value: '+52%', label: 'Inbound inquiries', labelAr: 'الاستفسارات الواردة' },
    { value: '98', label: 'Lighthouse score', labelAr: 'نقاط Lighthouse' },
  ],

  gallerySuggestions: [
    { caption: 'Homepage gallery grid with lazy-loaded imagery', captionAr: 'شبكة معرض الصفحة الرئيسية بصور محمّلة بشكل كسول' },
    { caption: 'Case study page with process shots and client quote', captionAr: 'صفحة دراسة حالة مع لقطات عملية واقتباس عميل' },
    { caption: 'Lightweight CMS project-upload screen', captionAr: 'شاشة رفع المشروع في نظام إدارة المحتوى الخفيف' },
    { caption: 'Direct inquiry/contact form', captionAr: 'نموذج الاستفسار والتواصل المباشر' },
  ],

  metaTitle: '{client} Portfolio Site Case Study — Fast, Self-Updating Showcase | YANSY Tech',
  metaDescription: 'How we built {client} a fast, self-publishable portfolio site that grew inbound inquiries by 52%.',
};
