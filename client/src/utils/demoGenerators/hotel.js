export default {
  category: 'Hotels & Hospitality',
  industry: 'Hotel — Direct Booking & Guest Experience',

  clients: [
    { name: 'Marbell Bay Resort', nameAr: 'منتجع ماربل باي', location: 'Málaga, Spain', locationAr: 'ملقة، إسبانيا' },
    { name: 'Nour Al Bahr Hotel', nameAr: 'فندق نور البحر', location: 'Jeddah, Saudi Arabia', locationAr: 'جدة، المملكة العربية السعودية' },
  ],

  titleTemplate: '{client} — Direct Booking & Guest Experience Platform',
  titleTemplateAr: 'منصة الحجز المباشر وتجربة الضيوف لـ {clientAr}',
  tagline: 'A booking engine that finally makes booking direct cheaper-feeling than booking through an OTA.',
  taglineAr: 'محرك حجز يجعل الحجز المباشر أخيرًا يبدو أكثر جاذبية من الحجز عبر منصات الوساطة.',

  description: '{client} relied on OTAs for the majority of its bookings and paid heavy commissions for it. We built a direct booking engine with real-time room availability, a digital pre-arrival check-in flow, in-stay concierge requests, and a post-stay review funnel — all under the hotel\'s own brand.',
  descriptionAr: 'اعتمدت {clientAr} على منصات الوساطة (OTAs) في معظم حجوزاتها ودفعت عمولات باهظة مقابل ذلك. بنينا محرك حجز مباشر يشمل توفر الغرف لحظيًا، مسار تسجيل وصول رقمي قبل القدوم، طلبات كونسيرج أثناء الإقامة، وقمع تقييمات بعد المغادرة — كل ذلك تحت علامة الفندق الخاصة.',

  myRole: 'Full-stack engineering and UX design for the booking engine, guest app, and staff-facing request dashboard.',
  myRoleAr: 'الهندسة الكاملة وتصميم تجربة المستخدم لمحرك الحجز وتطبيق الضيوف ولوحة تحكم الطلبات الخاصة بالموظفين.',

  goals: 'Shift booking volume away from OTA commissions, offer a check-in experience that skips the front-desk line, and give guests a direct channel for requests instead of calling the front desk.',
  goalsAr: 'تحويل حجم الحجوزات بعيدًا عن عمولات منصات الوساطة، وتقديم تجربة تسجيل وصول تتجاوز طابور مكتب الاستقبال، ومنح الضيوف قناة مباشرة للطلبات بدلاً من الاتصال بالاستقبال.',

  painPoints: 'A large share of revenue went to OTA commissions on bookings guests would happily have made directly, check-in lines formed at peak arrival times, and guest requests (extra towels, late checkout) relied entirely on phone calls to the front desk.',
  painPointsAr: 'ذهبت حصة كبيرة من الإيرادات لعمولات منصات الوساطة على حجوزات كان الضيوف سيقومون بها مباشرة بكل سرور، وتشكّلت طوابير تسجيل الوصول في أوقات ذروة القدوم، واعتمدت طلبات الضيوف (مناشف إضافية، تسجيل خروج متأخر) كليًا على مكالمات هاتفية لمكتب الاستقبال.',

  challenge: 'Room availability and rates had to stay perfectly in sync between the hotel\'s property management system, the new direct booking engine, and the OTAs still in use — a double-booked room is one of the worst possible failures for a hospitality product.',
  challengeAr: 'كان على توفر الغرف والأسعار أن يبقى متزامنًا تمامًا بين نظام إدارة العقار في الفندق ومحرك الحجز المباشر الجديد ومنصات الوساطة لا تزال قيد الاستخدام — فحجز نفس الغرفة مرتين من أسوأ الإخفاقات الممكنة لمنتج ضيافة.',

  solution: 'We built a two-way sync with the property management system so availability updates everywhere the instant a room is booked anywhere, a mobile pre-arrival check-in flow with digital ID upload and room-key issuance, an in-app concierge request board routed to the right department, and an automated post-stay review request.',
  solutionAr: 'بنينا مزامنة ثنائية الاتجاه مع نظام إدارة العقار بحيث يتحدّث التوفر في كل مكان لحظة حجز أي غرفة من أي قناة، ومسار تسجيل وصول قبل القدوم عبر الجوال مع رفع الهوية الرقمية وإصدار مفتاح الغرفة، ولوحة طلبات كونسيرج داخل التطبيق توجَّه للقسم المناسب، وطلب تقييم آلي بعد المغادرة.',

  process: 'We integrated with the property management system first and validated zero double-bookings across a full month before opening the guest-facing app, then layered in check-in and concierge features one season at a time.',
  processAr: 'دمجنا أولاً مع نظام إدارة العقار وتحققنا من عدم وجود أي حجز مزدوج طوال شهر كامل قبل فتح تطبيق الضيوف، ثم أضفنا ميزات تسجيل الوصول والكونسيرج موسمًا تلو الآخر.',

  results: 'Direct bookings grew from roughly a quarter to over half of total reservations within one year, front-desk check-in lines at peak hours nearly disappeared, and guest satisfaction scores on post-stay reviews rose noticeably.',
  resultsAr: 'نمت الحجوزات المباشرة من نحو الربع إلى أكثر من نصف إجمالي الحجوزات خلال عام واحد، واختفت طوابير تسجيل الوصول في أوقات الذروة تقريبًا، وارتفعت درجات رضا الضيوف في تقييمات ما بعد المغادرة بشكل ملحوظ.',

  metrics: [
    { label: 'Direct booking share', labelAr: 'حصة الحجز المباشر', value: '54%', trend: 'up' },
    { label: 'OTA commission savings', labelAr: 'التوفير في عمولات الوساطة', value: '+18%', trend: 'up' },
    { label: 'Front-desk check-in time', labelAr: 'وقت تسجيل الوصول بالاستقبال', value: '-70%', trend: 'down' },
    { label: 'Post-stay review rate', labelAr: 'معدل التقييم بعد المغادرة', value: '+41%', trend: 'up' },
  ],

  performanceMetrics: [
    { label: 'Booking flow completion time', labelAr: 'وقت إتمام مسار الحجز', before: '5.2 min', after: '2.1 min' },
    { label: 'Check-in time (arrival to key)', labelAr: 'وقت تسجيل الوصول حتى استلام المفتاح', before: '12 min', after: '< 2 min' },
    { label: 'Lighthouse performance', labelAr: 'أداء Lighthouse', before: '52', after: '94' },
  ],

  faqs: [
    { question: 'How is double-booking prevented across booking channels?', questionAr: 'كيف يتم منع الحجز المزدوج عبر قنوات الحجز؟', answer: 'A two-way sync with the property management system updates availability the instant any channel — direct, OTA, or phone — books a room.', answerAr: 'تُحدّث مزامنة ثنائية الاتجاه مع نظام إدارة العقار التوفر لحظة حجز أي غرفة من أي قناة — مباشرة أو عبر وساطة أو هاتفيًا.' },
    { question: 'Can guests check in before arriving at the hotel?', questionAr: 'هل يمكن للضيوف تسجيل الوصول قبل الوصول للفندق؟', answer: 'Yes — a mobile pre-arrival flow handles ID verification and issues a digital room key, skipping the front-desk line entirely.', answerAr: 'نعم — يتولى مسار ما قبل الوصول عبر الجوال التحقق من الهوية ويصدر مفتاح غرفة رقمي، متجاوزًا طابور الاستقبال كليًا.' },
    { question: 'How do guests request things during their stay?', questionAr: 'كيف يطلب الضيوف الخدمات أثناء إقامتهم؟', answer: 'An in-app request board routes housekeeping, room service, and concierge requests directly to the right staff dashboard.', answerAr: 'توجّه لوحة طلبات داخل التطبيق طلبات التدبير المنزلي وخدمة الغرف والكونسيرج مباشرة إلى لوحة تحكم الموظف المناسب.' },
    { question: 'Does the platform still work with existing OTA listings?', questionAr: 'هل تعمل المنصة مع قوائم منصات الوساطة الحالية؟', answer: 'Yes — OTA channels stay connected through the same property management sync, so nothing about existing listings needs to change.', answerAr: 'نعم — تبقى قنوات الوساطة متصلة عبر نفس مزامنة نظام إدارة العقار، دون الحاجة لتغيير أي شيء في القوائم الحالية.' },
  ],

  team: [
    { name: 'Isabela Duarte', role: 'Product Manager', roleAr: 'مديرة منتج' },
    { name: 'Yusuf Demir', role: 'Lead Full-Stack Engineer', roleAr: 'مهندس برمجيات رئيسي' },
    { name: 'Clara Fontaine', role: 'UI/UX Designer', roleAr: 'مصممة واجهات وتجربة مستخدم' },
    { name: 'Ahmed Ben Salah', role: 'QA Engineer', roleAr: 'مهندس ضمان الجودة' },
  ],

  testimonial: {
    quote: 'Direct bookings crossing 50% was the number we\'d been chasing for years. Guests now check in before they even reach the lobby, and our front desk can actually focus on hospitality again.',
    quoteAr: 'كان تجاوز الحجوزات المباشرة لنسبة 50% الرقم الذي كنا نسعى إليه منذ سنوات. يسجّل الضيوف الآن وصولهم قبل وصولهم إلى البهو حتى، وأصبح فريق الاستقبال يركّز فعليًا على الضيافة مجددًا.',
    author: 'General Manager', role: 'General Manager', roleAr: 'المدير العام',
  },

  tags: ['Next.js', 'Node.js', 'PostgreSQL', 'Stripe', 'PMS Integration', 'Direct Booking Engine', 'Hospitality', 'Guest Experience'],
  duration: '16 weeks',
  teamSize: '4 people',

  businessValue: 'Every booking shifted from an OTA to the direct engine keeps commission that would otherwise leave {client}\'s margin entirely, and faster check-in freed front-desk staff to spend time on service instead of paperwork.',
  businessValueAr: 'كل حجز يُنقل من منصة وساطة إلى المحرك المباشر يحتفظ بعمولة كانت ستخرج بالكامل من هامش {clientAr}، وسمح تسجيل الوصول الأسرع لموظفي الاستقبال بقضاء وقتهم في الخدمة بدلاً من الأعمال الورقية.',

  futureImprovements: 'Planned next: dynamic rate recommendations based on local demand signals, a guest-facing loyalty tier system, and in-room tablet integration for the concierge request board.',
  futureImprovementsAr: 'المخطط له لاحقًا: توصيات أسعار ديناميكية بناءً على مؤشرات الطلب المحلي، نظام مستويات ولاء للضيوف، وتكامل لوحة الكونسيرج مع أجهزة لوحية داخل الغرف.',

  highlightStats: [
    { value: '54%', label: 'Direct bookings', labelAr: 'الحجوزات المباشرة' },
    { value: '<2 min', label: 'Check-in time', labelAr: 'وقت تسجيل الوصول' },
    { value: '94', label: 'Lighthouse score', labelAr: 'نقاط Lighthouse' },
  ],

  gallerySuggestions: [
    { caption: 'Direct booking engine with real-time room availability', captionAr: 'محرك الحجز المباشر مع توفر الغرف اللحظي' },
    { caption: 'Mobile pre-arrival check-in and digital key screen', captionAr: 'شاشة تسجيل الوصول والمفتاح الرقمي عبر الجوال' },
    { caption: 'In-app concierge request board', captionAr: 'لوحة طلبات الكونسيرج داخل التطبيق' },
    { caption: 'Post-stay review request flow', captionAr: 'مسار طلب التقييم بعد المغادرة' },
  ],

  metaTitle: '{client} Hotel Booking Case Study — Direct Booking & Guest App | YANSY Tech',
  metaDescription: 'How we built {client} a direct booking engine and guest app that grew direct bookings to 54% of total reservations.',
};
