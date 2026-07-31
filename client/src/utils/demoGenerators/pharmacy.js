export default {
  category: 'Medical',
  industry: 'Pharmacy — Online Ordering & Delivery',

  clients: [
    { name: 'GreenLeaf Pharmacy', nameAr: 'صيدلية جرين ليف', location: 'Chicago, USA', locationAr: 'شيكاغو، الولايات المتحدة' },
    { name: 'Al-Dawaa Plus Pharmacy', nameAr: 'صيدلية الدواء بلس', location: 'Riyadh, Saudi Arabia', locationAr: 'الرياض، المملكة العربية السعودية' },
  ],

  titleTemplate: '{client} — Prescription Ordering & Delivery App',
  titleTemplateAr: 'تطبيق طلب الوصفات والتوصيل لـ {clientAr}',
  tagline: 'Refilling a prescription now takes three taps instead of a phone call and a wait.',
  taglineAr: 'أصبح تجديد الوصفة الطبية يستغرق ثلاث نقرات بدلاً من مكالمة هاتفية وانتظار.',

  description: '{client} was losing repeat customers to delivery-first competitors because refilling a prescription meant calling the store and waiting on hold. We built a prescription ordering app with photo upload, refill reminders, real-time order tracking, and same-day delivery dispatch.',
  descriptionAr: 'كانت {clientAr} تفقد عملاء متكررين لصالح منافسين يعتمدون على التوصيل أولاً لأن تجديد الوصفة كان يعني الاتصال بالمتجر والانتظار على الخط. بنينا تطبيق طلب وصفات يشمل رفع صور الوصفة، تذكيرات التجديد، تتبع الطلب لحظيًا، وإرسال التوصيل في نفس اليوم.',

  myRole: 'End-to-end product design and full-stack engineering, including the pharmacist-facing verification dashboard.',
  myRoleAr: 'تصميم المنتج والهندسة الكاملة من البداية إلى النهاية، بما في ذلك لوحة تحكم التحقق الخاصة بالصيدلي.',

  goals: 'Let customers refill and reorder prescriptions from their phone, cut hold-time complaints, and offer delivery as a real alternative to the drive-up window.',
  goalsAr: 'تمكين العملاء من تجديد وإعادة طلب الوصفات من هواتفهم، وخفض شكاوى الانتظار على الخط، وتقديم التوصيل كبديل حقيقي لنافذة الاستلام بالسيارة.',

  painPoints: 'Refills required a phone call during business hours only, staff manually re-entered prescription details from memory or paper notes, and there was no way for a customer to know if their order was ready without calling again.',
  painPointsAr: 'كان تجديد الوصفة يتطلب مكالمة هاتفية خلال ساعات العمل فقط، وكان الموظفون يعيدون إدخال تفاصيل الوصفة يدويًا من الذاكرة أو الملاحظات الورقية، ولم تكن هناك طريقة ليعرف العميل جاهزية طلبه دون الاتصال مجددًا.',

  challenge: 'Every order still legally requires a licensed pharmacist to verify the prescription before it ships — the app had to feel instant to the customer while routing every single order through a mandatory human verification step without creating a bottleneck.',
  challengeAr: 'يتطلب كل طلب قانونيًا تحقق صيدلي مرخّص من الوصفة قبل شحنها — كان على التطبيق أن يشعر العميل بالسرعة الفورية مع توجيه كل طلب عبر خطوة تحقق بشرية إلزامية دون خلق عائق.',

  solution: 'We built a photo-upload refill flow with OCR-assisted prescription matching, a pharmacist verification queue that surfaces the highest-priority orders first, real-time order-status push notifications, and a delivery dispatch board synced with local couriers.',
  solutionAr: 'بنينا مسار تجديد بتصوير الوصفة مع مطابقة مدعومة بتقنية OCR، وقائمة انتظار للتحقق يستخدمها الصيدلي تُبرز الطلبات الأعلى أولوية أولاً، وإشعارات فورية بحالة الطلب، ولوحة إرسال توصيل متزامنة مع مندوبي التوصيل المحليين.',

  process: 'We ran the verification queue alongside the existing phone process for two weeks to build pharmacist trust in the new workflow, then switched refills to app-first once the team was comfortable with the tooling.',
  processAr: 'شغّلنا قائمة انتظار التحقق جنبًا إلى جنب مع العملية الهاتفية الحالية لمدة أسبوعين لبناء ثقة الصيادلة في سير العمل الجديد، ثم حوّلنا التجديد إلى التطبيق أولاً بعد ارتياح الفريق للأداة.',

  results: 'Phone hold complaints dropped by 60%, average refill turnaround fell from same-day-if-lucky to under two hours, and delivery orders now account for over a third of all prescription volume.',
  resultsAr: 'انخفضت شكاوى الانتظار الهاتفي بنسبة 60%، وانخفض متوسط وقت تجديد الوصفة من "نفس اليوم إن حالفك الحظ" إلى أقل من ساعتين، وأصبحت طلبات التوصيل تمثل أكثر من ثلث إجمالي حجم الوصفات.',

  metrics: [
    { label: 'Phone hold complaints', labelAr: 'شكاوى الانتظار الهاتفي', value: '-60%', trend: 'down' },
    { label: 'Avg. refill turnaround', labelAr: 'متوسط وقت التجديد', value: '< 2 hrs', trend: 'down' },
    { label: 'Orders via delivery', labelAr: 'الطلبات عبر التوصيل', value: '36%', trend: 'up' },
    { label: 'Repeat customer rate', labelAr: 'معدل العملاء المتكررين', value: '+22%', trend: 'up' },
  ],

  performanceMetrics: [
    { label: 'Refill submission time', labelAr: 'وقت تقديم طلب التجديد', before: '4–6 min (phone)', after: '45 sec (photo upload)' },
    { label: 'Pharmacist verification time', labelAr: 'وقت تحقق الصيدلي', before: '~6 min', after: '~90 sec' },
    { label: 'Lighthouse performance', labelAr: 'أداء Lighthouse', before: '61', after: '93' },
  ],

  faqs: [
    { question: 'Does a pharmacist still verify every order?', questionAr: 'هل يتحقق الصيدلي من كل طلب؟', answer: 'Yes — every order, including refills submitted by photo, is verified by a licensed pharmacist before it\'s prepared or shipped.', answerAr: 'نعم — يتحقق صيدلي مرخّص من كل طلب، بما في ذلك طلبات التجديد المُرسلة بالصورة، قبل تحضيره أو شحنه.' },
    { question: 'How do refill reminders work?', questionAr: 'كيف تعمل تذكيرات التجديد؟', answer: 'The app calculates the expected refill date from days-supply data and sends a reminder three days before the prescription runs out.', answerAr: 'يحسب التطبيق تاريخ التجديد المتوقع من بيانات مدة الجرعة ويرسل تذكيرًا قبل ثلاثة أيام من انتهاء الوصفة.' },
    { question: 'Can customers track their delivery in real time?', questionAr: 'هل يمكن للعملاء تتبع التوصيل لحظيًا؟', answer: 'Yes — a live map view shows the courier\'s location once the order leaves the pharmacy.', answerAr: 'نعم — تعرض خريطة لحظية موقع المندوب بمجرد مغادرة الطلب الصيدلية.' },
    { question: 'What if a photo of the prescription is unclear?', questionAr: 'ماذا لو كانت صورة الوصفة غير واضحة؟', answer: 'The pharmacist queue flags low-confidence uploads for a quick clarifying call instead of silently rejecting the order.', answerAr: 'تُعلّم قائمة انتظار الصيدلي الصور منخفضة الوضوح لإجراء مكالمة توضيح سريعة بدلاً من رفض الطلب دون تنبيه.' },
  ],

  team: [
    { name: 'Fatima Al-Zahrani', role: 'Product Manager', roleAr: 'مديرة منتج' },
    { name: 'Chris Bennington', role: 'Lead Full-Stack Engineer', roleAr: 'مهندس برمجيات رئيسي' },
    { name: 'Haruto Sato', role: 'UI/UX Designer', roleAr: 'مصمم واجهات وتجربة مستخدم' },
    { name: 'Grace Odhiambo', role: 'QA Engineer', roleAr: 'مهندسة ضمان الجودة' },
  ],

  testimonial: {
    quote: 'Our pharmacists were skeptical at first, but the verification queue is faster than the old phone process ever was. Customers love not having to call anymore.',
    quoteAr: 'كان الصيادلة لدينا متشككين في البداية، لكن قائمة انتظار التحقق أصبحت أسرع من العملية الهاتفية القديمة. يحب العملاء عدم الحاجة للاتصال بعد الآن.',
    author: 'Pharmacy Operations Manager', role: 'Pharmacy Operations Manager', roleAr: 'مدير عمليات الصيدلية',
  },

  tags: ['React Native', 'Node.js', 'PostgreSQL', 'OCR', 'Twilio', 'Stripe', 'Pharmacy App', 'Prescription Delivery', 'Healthcare'],
  duration: '10 weeks',
  teamSize: '4 people',

  businessValue: 'Faster refills and reliable delivery gave {client} a genuine retention lever against delivery-first competitors, turning a former weakness — no online ordering — into a reason customers stay.',
  businessValueAr: 'منحت عمليات التجديد الأسرع والتوصيل الموثوق {clientAr} رافعة استبقاء حقيقية أمام المنافسين المعتمدين على التوصيل أولاً، وحوّلت نقطة ضعف سابقة — عدم وجود طلب عبر الإنترنت — إلى سبب لبقاء العملاء.',

  futureImprovements: 'On the roadmap: insurance card scanning at checkout, a subscription plan for recurring medications, and SMS-based reordering for customers who prefer not to open the app.',
  futureImprovementsAr: 'في خارطة الطريق: مسح بطاقة التأمين عند الدفع، خطة اشتراك للأدوية المتكررة، وإعادة الطلب عبر الرسائل النصية للعملاء الذين يفضلون عدم فتح التطبيق.',

  highlightStats: [
    { value: '-60%', label: 'Hold complaints', labelAr: 'شكاوى الانتظار' },
    { value: '36%', label: 'Delivery share', labelAr: 'حصة التوصيل' },
    { value: '93', label: 'Lighthouse score', labelAr: 'نقاط Lighthouse' },
  ],

  gallerySuggestions: [
    { caption: 'Photo-upload prescription refill flow', captionAr: 'مسار تجديد الوصفة بتصوير الوصفة' },
    { caption: 'Pharmacist verification queue dashboard', captionAr: 'لوحة تحكم قائمة انتظار تحقق الصيدلي' },
    { caption: 'Live delivery tracking map', captionAr: 'خريطة تتبع التوصيل اللحظية' },
    { caption: 'Refill reminder push notification', captionAr: 'إشعار فوري لتذكير التجديد' },
  ],

  metaTitle: '{client} Pharmacy App Case Study — Prescription Delivery Platform | YANSY Tech',
  metaDescription: 'How we built {client} a prescription ordering and delivery app that cut refill turnaround to under two hours.',
};
