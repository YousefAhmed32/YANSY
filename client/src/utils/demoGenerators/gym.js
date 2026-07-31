export default {
  category: 'Other',
  industry: 'Fitness & Wellness — Gym Membership & Class Booking',

  clients: [
    { name: 'Ironframe Fitness Club', nameAr: 'نادي أيرون فريم للياقة', location: 'Miami, USA', locationAr: 'ميامي، الولايات المتحدة' },
    { name: 'Al-Qimma Sports Club', nameAr: 'نادي القمة الرياضي', location: 'Kuwait City, Kuwait', locationAr: 'مدينة الكويت، الكويت' },
  ],

  titleTemplate: '{client} — Membership & Class Booking App',
  titleTemplateAr: 'تطبيق العضوية وحجز الحصص لـ {clientAr}',
  tagline: 'Booking a class now takes fewer taps than it takes to change into gym clothes.',
  taglineAr: 'أصبح حجز حصة يتطلب نقرات أقل من الوقت اللازم لارتداء ملابس التمرين.',

  description: '{client} ran class bookings through a shared spreadsheet and a front-desk sign-in sheet, which meant overbooked classes and no-shows nobody could track. We built a membership app with class booking, waitlists, a digital check-in, and usage analytics that helps the gym plan class schedules around real demand.',
  descriptionAr: 'كانت {clientAr} تدير حجوزات الحصص عبر جدول بيانات مشترك وورقة تسجيل حضور بالاستقبال، ما تسبب في حجز حصص أكثر من طاقتها وحالات تغيب لا يمكن تتبعها. بنينا تطبيق عضوية يشمل حجز الحصص، قوائم الانتظار، تسجيل حضور رقمي، وتحليلات استخدام تساعد النادي في تخطيط جداول الحصص حسب الطلب الفعلي.',

  myRole: 'Full-stack engineering and UX design for the booking, check-in, and member analytics systems.',
  myRoleAr: 'الهندسة الكاملة وتصميم تجربة المستخدم لأنظمة الحجز وتسجيل الحضور وتحليلات الأعضاء.',

  goals: 'Stop class overbooking and no-shows, give members a self-serve way to book and cancel classes, and give gym management real data on which classes and time slots are actually in demand.',
  goalsAr: 'إيقاف حجز الحصص أكثر من طاقتها وحالات التغيب، ومنح الأعضاء طريقة ذاتية الخدمة لحجز الحصص وإلغائها، ومنح إدارة النادي بيانات حقيقية حول أي الحصص والأوقات مطلوبة فعليًا.',

  painPoints: 'Popular classes were double-booked because the sign-up sheet lived at the front desk and a shared spreadsheet simultaneously, members had no way to know if a class was full before showing up, and there was zero data on attendance patterns to guide scheduling.',
  painPointsAr: 'كانت الحصص الشائعة تُحجز مرتين لأن ورقة التسجيل كانت موجودة في الاستقبال وجدول بيانات مشترك في آنٍ واحد، ولم يكن لدى الأعضاء طريقة لمعرفة امتلاء الحصة قبل الحضور، ولم تكن هناك أي بيانات عن أنماط الحضور لتوجيه الجدولة.',

  challenge: 'Class capacity had to be enforced in real time across every device members might book from, with a waitlist that automatically promotes the next member the instant a spot opens — all without the front desk needing to manually manage a single list.',
  challengeAr: 'كان يجب فرض سعة الحصة في الوقت الفعلي عبر كل جهاز قد يحجز منه الأعضاء، مع قائمة انتظار تُرقّي العضو التالي تلقائيًا لحظة فتح مكان — كل ذلك دون حاجة الاستقبال لإدارة قائمة واحدة يدويًا.',

  solution: 'We built real-time class booking with enforced capacity limits, an automatic waitlist that promotes and notifies the next member instantly, a QR-code digital check-in at the front desk, and an attendance analytics dashboard broken down by class, instructor, and time slot.',
  solutionAr: 'بنينا حجز حصص لحظيًا مع فرض حدود سعة، وقائمة انتظار آلية تُرقّي وتُخطر العضو التالي فورًا، وتسجيل دخول رقمي برمز QR في الاستقبال، ولوحة تحكم تحليلات حضور مقسّمة حسب الحصة والمدرب والفترة الزمنية.',

  process: 'We piloted booking and check-in for the gym\'s three most popular classes first to validate the capacity and waitlist logic under real demand, then extended it to the full class schedule once front-desk staff trusted the system over the paper sheet.',
  processAr: 'أطلقنا تجربة الحجز وتسجيل الحضور لأشهر ثلاث حصص في النادي أولاً للتحقق من منطق السعة وقائمة الانتظار تحت طلب حقيقي، ثم وسّعناه ليشمل جدول الحصص بالكامل بعد ثقة موظفي الاستقبال بالنظام بدلاً من الورقة.',

  results: 'Overbooking complaints dropped to essentially zero, class attendance rates improved once members could see real-time availability, and the gym used the new analytics to reschedule two underperforming classes into its two most in-demand time slots.',
  resultsAr: 'انخفضت شكاوى الحجز الزائد إلى ما يقارب الصفر، وتحسّنت معدلات حضور الحصص بعد أن أصبح بإمكان الأعضاء رؤية التوفر اللحظي، واستخدم النادي التحليلات الجديدة لإعادة جدولة حصتين ضعيفتي الأداء إلى أكثر فترتين مطلوبتين.',

  metrics: [
    { label: 'Overbooking incidents', labelAr: 'حالات الحجز الزائد', value: '~0', trend: 'down' },
    { label: 'Class attendance rate', labelAr: 'معدل حضور الحصص', value: '+24%', trend: 'up' },
    { label: 'App-based check-ins', labelAr: 'تسجيلات الحضور عبر التطبيق', value: '89%', trend: 'up' },
    { label: 'Front-desk booking calls', labelAr: 'مكالمات حجز الاستقبال', value: '-71%', trend: 'down' },
  ],

  performanceMetrics: [
    { label: 'Class booking time', labelAr: 'وقت حجز الحصة', before: '~3 min (phone/desk)', after: '< 15 sec (app)' },
    { label: 'Check-in time', labelAr: 'وقت تسجيل الحضور', before: '~45 sec (manual)', after: '< 3 sec (QR scan)' },
    { label: 'Lighthouse performance', labelAr: 'أداء Lighthouse', before: '60', after: '95' },
  ],

  faqs: [
    { question: 'How is class overbooking prevented?', questionAr: 'كيف يُمنع حجز الحصص أكثر من طاقتها؟', answer: 'Capacity limits are enforced in real time at the moment of booking, across every device, so a class can never accept more members than it has room for.', answerAr: 'تُفرض حدود السعة في الوقت الفعلي لحظة الحجز، عبر كل جهاز، بحيث لا يمكن لأي حصة قبول أعضاء أكثر من سعتها إطلاقًا.' },
    { question: 'What happens when a full class opens a spot?', questionAr: 'ماذا يحدث عندما يفتح مكان في حصة ممتلئة؟', answer: 'The next member on the waitlist is automatically promoted and notified instantly, with no front-desk involvement needed.', answerAr: 'تتم ترقية العضو التالي في قائمة الانتظار تلقائيًا وإخطاره فورًا، دون الحاجة لتدخل من الاستقبال.' },
    { question: 'How does check-in work at the gym?', questionAr: 'كيف يعمل تسجيل الحضور في النادي؟', answer: 'Members scan a QR code at the front desk kiosk, which confirms their booking and membership status in under three seconds.', answerAr: 'يمسح الأعضاء رمز QR على جهاز الاستقبال، الذي يؤكد حجزهم وحالة عضويتهم في أقل من ثلاث ثوانٍ.' },
    { question: 'Can the gym see which classes are underperforming?', questionAr: 'هل يمكن للنادي معرفة أي الحصص ضعيفة الأداء؟', answer: 'Yes — the analytics dashboard breaks attendance down by class, instructor, and time slot to guide scheduling decisions.', answerAr: 'نعم — تقسّم لوحة تحكم التحليلات الحضور حسب الحصة والمدرب والفترة الزمنية لتوجيه قرارات الجدولة.' },
  ],

  team: [
    { name: 'Marcus Diallo', role: 'Product Manager', roleAr: 'مدير منتج' },
    { name: 'Elif Yildiz', role: 'Lead Full-Stack Engineer', roleAr: 'مهندسة برمجيات رئيسية' },
    { name: 'Paolo Conti', role: 'UI/UX Designer', roleAr: 'مصمم واجهات وتجربة مستخدم' },
    { name: 'Tasneem Barakat', role: 'QA Engineer', roleAr: 'مهندسة ضمان الجودة' },
  ],

  testimonial: {
    quote: 'The waitlist alone fixed a problem we\'d been arguing about for years. Members book their own spot now, and our front desk isn\'t stuck refereeing who signed up first.',
    quoteAr: 'قائمة الانتظار وحدها حلّت مشكلة كنا نتجادل حولها منذ سنوات. يحجز الأعضاء مكانهم بأنفسهم الآن، ولم يعد الاستقبال عالقًا في تحكيم من سجّل أولاً.',
    author: 'Club General Manager', role: 'Club General Manager', roleAr: 'المدير العام للنادي',
  },

  tags: ['React Native', 'Node.js', 'MongoDB', 'Stripe', 'QR Check-In', 'Push Notifications', 'Gym Membership App', 'Class Booking', 'Fitness'],
  duration: '8 weeks',
  teamSize: '3 people',

  businessValue: 'Eliminating overbooking removed a constant source of member complaints, and real attendance data let {client} reschedule classes to match actual demand instead of guessing — filling time slots that used to sit half-empty.',
  businessValueAr: 'أزال القضاء على الحجز الزائد مصدرًا دائمًا لشكاوى الأعضاء، وسمحت بيانات الحضور الحقيقية لـ {clientAr} بإعادة جدولة الحصص لتطابق الطلب الفعلي بدلاً من التخمين — ما ملأ فترات كانت شبه فارغة سابقًا.',

  futureImprovements: 'Planned next: a personal workout log tied to check-in history, instructor-facing class rosters with member notes, and a referral program built into the membership app.',
  futureImprovementsAr: 'المخطط له لاحقًا: سجل تمارين شخصي مرتبط بتاريخ الحضور، قوائم حصص للمدربين مع ملاحظات عن الأعضاء، وبرنامج إحالة مدمج في تطبيق العضوية.',

  highlightStats: [
    { value: '~0', label: 'Overbooking incidents', labelAr: 'حالات الحجز الزائد' },
    { value: '89%', label: 'App check-ins', labelAr: 'تسجيلات حضور عبر التطبيق' },
    { value: '95', label: 'Lighthouse score', labelAr: 'نقاط Lighthouse' },
  ],

  gallerySuggestions: [
    { caption: 'Class schedule with real-time availability', captionAr: 'جدول الحصص مع التوفر اللحظي' },
    { caption: 'QR-code check-in kiosk screen', captionAr: 'شاشة تسجيل الحضور برمز QR' },
    { caption: 'Automatic waitlist promotion notification', captionAr: 'إشعار ترقية قائمة الانتظار الآلي' },
    { caption: 'Attendance analytics dashboard for gym staff', captionAr: 'لوحة تحكم تحليلات الحضور لموظفي النادي' },
  ],

  metaTitle: '{client} Gym App Case Study — Membership & Class Booking Platform | YANSY Tech',
  metaDescription: 'How we built {client} a class booking app with real-time waitlists that eliminated overbooking and raised attendance by 24%.',
};
