export default {
  category: 'Restaurants & Food',
  industry: 'Restaurant — Online Ordering & Table Reservations',

  clients: [
    { name: 'Basil & Vine', nameAr: 'باسل آند فاين', location: 'Portland, USA', locationAr: 'بورتلاند، الولايات المتحدة' },
    { name: 'Zeitoun Kitchen', nameAr: 'مطبخ زيتون', location: 'Amman, Jordan', locationAr: 'عمّان، الأردن' },
  ],

  titleTemplate: '{client} — Ordering, Reservations & Loyalty App',
  titleTemplateAr: 'تطبيق الطلب والحجز والولاء لـ {clientAr}',
  tagline: 'A direct ordering channel that pays {client} back the margin third-party apps were taking.',
  taglineAr: 'قناة طلب مباشرة تعيد لـ {clientAr} الهامش الذي كانت تطبيقات التوصيل الخارجية تأخذه.',

  description: '{client} was paying steep commissions to third-party delivery apps for orders that could just as easily come through their own site. We built a branded ordering and reservations app with live menu management, table booking, order tracking, and a points-based loyalty program.',
  descriptionAr: 'كانت {clientAr} تدفع عمولات مرتفعة لتطبيقات التوصيل الخارجية مقابل طلبات كان بالإمكان أن تأتي بسهولة عبر موقعها الخاص. بنينا تطبيق طلب وحجز بعلامة {clientAr} يشمل إدارة قائمة الطعام لحظيًا، حجز الطاولات، تتبع الطلب، وبرنامج ولاء قائم على النقاط.',

  myRole: 'Product design and full-stack engineering for the ordering, reservations, and loyalty systems.',
  myRoleAr: 'تصميم المنتج والهندسة الكاملة لأنظمة الطلب والحجز والولاء.',

  goals: 'Win back margin lost to third-party delivery commissions, make table reservations self-serve, and reward repeat customers without a punch-card.',
  goalsAr: 'استعادة الهامش المفقود لصالح عمولات التوصيل الخارجية، وجعل حجز الطاولات ذاتي الخدمة، ومكافأة العملاء المتكررين دون بطاقة ختم ورقية.',

  painPoints: 'Roughly a third of order revenue went to delivery-app commissions, reservations were phone-only during dinner rush when staff were busiest, and there was no way to identify or reward regulars.',
  painPointsAr: 'ذهب نحو ثلث إيرادات الطلبات لعمولات تطبيقات التوصيل، وكان الحجز هاتفيًا فقط خلال ذروة العشاء عندما يكون الموظفون في أشد الانشغال، ولم تكن هناك طريقة لتحديد أو مكافأة الزبائن الدائمين.',

  challenge: 'The app had to sync a live, constantly-changing menu (86\'d items, daily specials, price changes) with the kitchen\'s existing POS in real time, so a customer never orders something the kitchen can\'t actually make.',
  challengeAr: 'كان على التطبيق مزامنة قائمة طعام حية ومتغيرة باستمرار (أصناف نفدت، عروض يومية، تغييرات أسعار) مع نظام نقاط البيع الحالي في المطبخ في الوقت الفعلي، بحيث لا يطلب العميل أبدًا صنفًا لا يستطيع المطبخ تحضيره فعليًا.',

  solution: 'We built a two-way sync between the ordering app and the restaurant\'s POS so menu availability updates instantly, a self-serve table reservation calendar with automatic waitlist SMS, live order-status tracking from kitchen to pickup/delivery, and a points-per-dollar loyalty program with redeemable rewards.',
  solutionAr: 'بنينا مزامنة ثنائية الاتجاه بين تطبيق الطلب ونظام نقاط البيع في المطعم بحيث يتحدّث توفر القائمة فوريًا، وتقويم حجز طاولات ذاتي الخدمة مع رسائل انتظار نصية آلية، وتتبع حالة الطلب لحظيًا من المطبخ حتى الاستلام أو التوصيل، وبرنامج ولاء بنقاط لكل دولار مع مكافآت قابلة للاستبدال.',

  process: 'We piloted online ordering at one location for three weeks to stress-test the POS sync during a real dinner rush, then rolled out reservations and loyalty once the ordering flow was stable.',
  processAr: 'أطلقنا تجربة الطلب عبر الإنترنت في فرع واحد لمدة ثلاثة أسابيع لاختبار مزامنة نظام نقاط البيع تحت ضغط ذروة عشاء حقيقية، ثم أطلقنا الحجز والولاء بعد استقرار مسار الطلب.',

  results: 'Direct online orders now cover 45% of what used to go through delivery apps, saving significant commission fees, table no-shows dropped after the waitlist SMS launched, and the loyalty program has over 3,000 enrolled members within the first quarter.',
  resultsAr: 'تغطي الطلبات المباشرة عبر الإنترنت الآن 45% مما كان يمر سابقًا عبر تطبيقات التوصيل، ما وفّر رسوم عمولة كبيرة، وانخفضت حالات التغيب عن الطاولات بعد إطلاق رسائل الانتظار النصية، ويضم برنامج الولاء أكثر من 3,000 عضو مسجّل خلال الربع الأول.',

  metrics: [
    { label: 'Orders moved off delivery apps', labelAr: 'الطلبات المنقولة من تطبيقات التوصيل', value: '45%', trend: 'up' },
    { label: 'Commission savings', labelAr: 'التوفير في العمولات', value: '+$3,200/mo', trend: 'up' },
    { label: 'Loyalty members', labelAr: 'أعضاء الولاء', value: '3,000+', trend: 'up' },
    { label: 'Reservation no-shows', labelAr: 'حالات التغيب عن الحجز', value: '-38%', trend: 'down' },
  ],

  performanceMetrics: [
    { label: 'Menu sync delay', labelAr: 'تأخر مزامنة القائمة', before: 'Manual, hours', after: 'Real-time' },
    { label: 'Order-to-kitchen time', labelAr: 'الوقت من الطلب إلى المطبخ', before: '3–4 min', after: '< 20 sec' },
    { label: 'Lighthouse performance', labelAr: 'أداء Lighthouse', before: '55', after: '95' },
  ],

  faqs: [
    { question: 'How does the menu stay in sync with the kitchen?', questionAr: 'كيف تبقى القائمة متزامنة مع المطبخ؟', answer: 'A two-way integration with the restaurant\'s POS updates item availability the moment something sells out or a special is added.', answerAr: 'يقوم تكامل ثنائي الاتجاه مع نظام نقاط البيع بتحديث توفر الصنف لحظة نفاده أو إضافة عرض جديد.' },
    { question: 'Can customers join a waitlist during peak hours?', questionAr: 'هل يمكن للعملاء الانضمام لقائمة انتظار في أوقات الذروة؟', answer: 'Yes — the reservation calendar automatically offers a text-based waitlist once a time slot is full.', answerAr: 'نعم — يوفّر تقويم الحجز قائمة انتظار عبر الرسائل النصية تلقائيًا بمجرد امتلاء الفترة الزمنية.' },
    { question: 'How does the loyalty program work?', questionAr: 'كيف يعمل برنامج الولاء؟', answer: 'Customers earn points per dollar spent on any order channel, redeemable for menu items or discounts directly in the app.', answerAr: 'يكسب العملاء نقاطًا عن كل دولار يُنفق عبر أي قناة طلب، قابلة للاستبدال بأصناف من القائمة أو خصومات مباشرة داخل التطبيق.' },
    { question: 'Does the app support multiple locations?', questionAr: 'هل يدعم التطبيق عدة فروع؟', answer: 'Yes — each location manages its own menu, hours, and reservation calendar from one shared loyalty and account system.', answerAr: 'نعم — يدير كل فرع قائمته وساعاته وتقويم الحجز الخاص به من نظام حساب وولاء مشترك واحد.' },
  ],

  team: [
    { name: 'Lucas Ferreira', role: 'Product Manager', roleAr: 'مدير منتج' },
    { name: 'Noor Kanaan', role: 'Lead Full-Stack Engineer', roleAr: 'مهندسة برمجيات رئيسية' },
    { name: 'Ivy Chen', role: 'UI/UX Designer', roleAr: 'مصممة واجهات وتجربة مستخدم' },
    { name: 'Samir Belhadj', role: 'QA Engineer', roleAr: 'مهندس ضمان الجودة' },
  ],

  testimonial: {
    quote: 'We finally see the customers who order from us every week. The loyalty program alone changed how we think about marketing — we don\'t need to guess anymore.',
    quoteAr: 'أصبحنا أخيرًا نرى العملاء الذين يطلبون منا كل أسبوع. برنامج الولاء وحده غيّر طريقة تفكيرنا في التسويق — لم نعد بحاجة للتخمين بعد الآن.',
    author: 'Owner & General Manager', role: 'Owner & General Manager', roleAr: 'المالك والمدير العام',
  },

  tags: ['React Native', 'Node.js', 'MongoDB', 'Stripe', 'Twilio', 'POS Integration', 'Online Ordering', 'Restaurant Loyalty'],
  duration: '9 weeks',
  teamSize: '4 people',

  businessValue: 'Shifting order volume off commission-heavy delivery apps directly improved {client}\'s margin on every order, while the loyalty program turned occasional visitors into a measurable, marketable base of regulars.',
  businessValueAr: 'أدى تحويل حجم الطلبات بعيدًا عن تطبيقات التوصيل ذات العمولات المرتفعة إلى تحسين هامش {clientAr} على كل طلب مباشرة، بينما حوّل برنامج الولاء الزوار العرضيين إلى قاعدة زبائن دائمين قابلة للقياس والتسويق.',

  futureImprovements: 'Next: a kitchen-display-system integration for order timing, catering order support for large group orders, and a referral bonus inside the loyalty program.',
  futureImprovementsAr: 'التالي: تكامل مع نظام عرض المطبخ لتوقيت الطلبات، دعم طلبات التموين للمجموعات الكبيرة، ومكافأة إحالة داخل برنامج الولاء.',

  highlightStats: [
    { value: '45%', label: 'Orders moved direct', labelAr: 'طلبات منقولة مباشرة' },
    { value: '3,000+', label: 'Loyalty members', labelAr: 'عضو ولاء' },
    { value: '95', label: 'Lighthouse score', labelAr: 'نقاط Lighthouse' },
  ],

  gallerySuggestions: [
    { caption: 'Live menu with real-time item availability', captionAr: 'قائمة طعام حية مع توفر لحظي للأصناف' },
    { caption: 'Table reservation calendar with waitlist', captionAr: 'تقويم حجز الطاولات مع قائمة الانتظار' },
    { caption: 'Order tracking screen from kitchen to pickup', captionAr: 'شاشة تتبع الطلب من المطبخ حتى الاستلام' },
    { caption: 'Loyalty points and rewards screen', captionAr: 'شاشة نقاط ومكافآت الولاء' },
  ],

  metaTitle: '{client} Restaurant App Case Study — Ordering & Loyalty Platform | YANSY Tech',
  metaDescription: 'How we built {client} a direct ordering, reservations, and loyalty app that moved 45% of orders off commission-based delivery apps.',
};
