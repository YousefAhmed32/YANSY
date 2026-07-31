export default {
  category: 'Medical',
  industry: 'Medical Clinic — Patient Portal & Telehealth',

  clients: [
    { name: 'Riverside Family Clinic', nameAr: 'عيادة ريفرسايد العائلية', location: 'Denver, USA', locationAr: 'دنفر، الولايات المتحدة' },
    { name: 'Al-Shifa Medical Center', nameAr: 'مركز الشفاء الطبي', location: 'Dubai, UAE', locationAr: 'دبي، الإمارات العربية المتحدة' },
  ],

  titleTemplate: '{client} — Patient Portal & Telehealth Platform',
  titleTemplateAr: 'بوابة المرضى ومنصة الاستشارات عن بُعد لـ {clientAr}',
  tagline: 'A patient portal that cut no-shows in half and moved routine follow-ups online.',
  taglineAr: 'بوابة مرضى خفّضت حالات التغيب إلى النصف ونقلت المتابعات الروتينية إلى الإنترنت.',

  description: '{client} was booking appointments entirely by phone and running follow-up consultations in person even when a five-minute video call would do. We built a HIPAA-conscious patient portal with online booking, secure messaging, e-prescription requests, and video consultations — all in one app patients actually use.',
  descriptionAr: 'كانت {clientAr} تحجز المواعيد بالكامل عبر الهاتف وتُجري استشارات المتابعة حضوريًا حتى عندما تكفي مكالمة فيديو من خمس دقائق. بنينا بوابة مرضى تراعي معايير HIPAA تشمل الحجز عبر الإنترنت، المراسلة الآمنة، طلب الوصفات الإلكترونية، والاستشارات بالفيديو — كل ذلك في تطبيق واحد يستخدمه المرضى فعليًا.',

  myRole: 'Full-stack engineering and compliance-aware architecture for patient data handling, plus the booking and telehealth UX.',
  myRoleAr: 'الهندسة الكاملة والبنية المراعية لمتطلبات الامتثال في التعامل مع بيانات المرضى، بالإضافة إلى تجربة الحجز والاستشارات عن بُعد.',

  goals: 'Reduce phone-booking load on front-desk staff, cut appointment no-shows with automated reminders, and offer video consultations for follow-ups that don\'t need an in-person visit.',
  goalsAr: 'تقليل عبء الحجز الهاتفي على موظفي الاستقبال، وخفض حالات التغيب عن المواعيد بواسطة تذكيرات آلية، وتوفير استشارات فيديو للمتابعات التي لا تتطلب زيارة حضورية.',

  painPoints: 'Front-desk staff spent hours a day on the phone booking and rescheduling; there was no reminder system, so no-shows regularly left appointment slots empty and unbillable.',
  painPointsAr: 'كان موظفو الاستقبال يقضون ساعات يوميًا على الهاتف لحجز المواعيد وإعادة جدولتها؛ ولم يكن هناك نظام تذكير، ما جعل حالات التغيب تترك مواعيد فارغة وغير قابلة للفوترة بانتظام.',

  challenge: 'Any system touching patient health information had to meet strict privacy and security requirements from day one — encryption at rest and in transit, audit logging, and role-based access — while still feeling as simple as booking a restaurant table for a non-technical patient base.',
  challengeAr: 'كان على أي نظام يتعامل مع المعلومات الصحية للمرضى أن يستوفي متطلبات خصوصية وأمان صارمة منذ اليوم الأول — التشفير أثناء التخزين والنقل، وتسجيل التدقيق، والوصول القائم على الأدوار — مع الحفاظ على بساطة تشبه حجز طاولة في مطعم لقاعدة مرضى غير تقنية.',

  solution: 'We built an encrypted patient portal with online booking synced to the clinic\'s calendar, automated SMS/email reminders 48 and 2 hours before each visit, secure in-app messaging with the care team, and browser-based video consultations with no app download required.',
  solutionAr: 'بنينا بوابة مرضى مشفّرة مع حجز عبر الإنترنت متزامن مع تقويم العيادة، وتذكيرات آلية عبر الرسائل النصية والبريد الإلكتروني قبل 48 و2 ساعة من كل زيارة، ومراسلة آمنة داخل التطبيق مع فريق الرعاية، واستشارات فيديو عبر المتصفح دون الحاجة لتنزيل تطبيق.',

  process: 'We shadowed front-desk staff for a week to map every booking edge case (insurance holds, walk-ins, recurring visits), piloted the portal with one physician\'s patient list, then rolled out clinic-wide once no-show rates visibly dropped.',
  processAr: 'راقبنا موظفي الاستقبال لمدة أسبوع لرسم كل حالة استثنائية في الحجز (تعليق التأمين، الحضور دون موعد، الزيارات المتكررة)، وأطلقنا تجربة أولية للبوابة مع قائمة مرضى طبيب واحد، ثم عمّمناها على مستوى العيادة بعد الانخفاض الملحوظ في معدلات التغيب.',

  results: 'No-show rates dropped by 52%, front-desk phone volume fell by roughly a third, and 30% of follow-up visits now happen over video instead of requiring an in-person slot.',
  resultsAr: 'انخفضت معدلات التغيب بنسبة 52%، وانخفض حجم المكالمات الهاتفية للاستقبال بنحو الثلث، وأصبحت 30% من زيارات المتابعة تتم عبر الفيديو بدلاً من حجز موعد حضوري.',

  metrics: [
    { label: 'No-show rate', labelAr: 'معدل التغيب', value: '-52%', trend: 'down' },
    { label: 'Front-desk call volume', labelAr: 'حجم مكالمات الاستقبال', value: '-33%', trend: 'down' },
    { label: 'Follow-ups via video', labelAr: 'المتابعات عبر الفيديو', value: '30%', trend: 'up' },
    { label: 'Patient portal adoption', labelAr: 'معدل تبني بوابة المرضى', value: '81%', trend: 'up' },
  ],

  performanceMetrics: [
    { label: 'Avg. booking time', labelAr: 'متوسط وقت الحجز', before: '6.5 min (phone)', after: '90 sec (self-serve)' },
    { label: 'Video call connect time', labelAr: 'زمن الاتصال بمكالمة الفيديو', before: 'N/A', after: '< 3s' },
    { label: 'Lighthouse performance', labelAr: 'أداء Lighthouse', before: '—', after: '94' },
  ],

  faqs: [
    { question: 'Is patient data encrypted?', questionAr: 'هل بيانات المرضى مشفّرة؟', answer: 'Yes — all patient data is encrypted at rest and in transit, with full audit logging on every access.', answerAr: 'نعم — جميع بيانات المرضى مشفّرة أثناء التخزين والنقل، مع تسجيل تدقيق كامل لكل عملية وصول.' },
    { question: 'Do patients need to download an app for video visits?', questionAr: 'هل يحتاج المرضى لتنزيل تطبيق لزيارات الفيديو؟', answer: 'No — video consultations run directly in the browser from a secure link sent before the appointment.', answerAr: 'لا — تعمل استشارات الفيديو مباشرة عبر المتصفح من رابط آمن يُرسل قبل الموعد.' },
    { question: 'How does the reminder system reduce no-shows?', questionAr: 'كيف يقلل نظام التذكير من حالات التغيب؟', answer: 'Automated SMS and email reminders go out 48 hours and 2 hours before each visit, with a one-tap reschedule link.', answerAr: 'تُرسل تذكيرات آلية عبر الرسائل النصية والبريد الإلكتروني قبل 48 و2 ساعة من كل زيارة، مع رابط لإعادة الجدولة بضغطة واحدة.' },
    { question: 'Can patients message their care team directly?', questionAr: 'هل يمكن للمرضى مراسلة فريق الرعاية مباشرة؟', answer: 'Yes — secure in-app messaging routes non-urgent questions to the right staff member without a phone call.', answerAr: 'نعم — توجّه المراسلة الآمنة داخل التطبيق الأسئلة غير العاجلة إلى الموظف المناسب دون الحاجة لمكالمة هاتفية.' },
  ],

  team: [
    { name: 'Rania Haddad', role: 'Product Manager', roleAr: 'مديرة منتج' },
    { name: 'Kevin O\'Sullivan', role: 'Lead Full-Stack Engineer', roleAr: 'مهندس برمجيات رئيسي' },
    { name: 'Mei Lin Tan', role: 'UI/UX Designer', roleAr: 'مصممة واجهات وتجربة مستخدم' },
    { name: 'Adaeze Nwosu', role: 'QA & Compliance Engineer', roleAr: 'مهندسة ضمان جودة وامتثال' },
  ],

  testimonial: {
    quote: 'Our front desk got their afternoons back, and patients keep telling us how easy it is to book a visit now. The video consultations alone paid for the project in the first quarter.',
    quoteAr: 'استعاد فريق الاستقبال لدينا وقته بعد الظهر، ويخبرنا المرضى باستمرار كم أصبح حجز الزيارة سهلاً الآن. استشارات الفيديو وحدها غطت تكلفة المشروع في الربع الأول.',
    author: 'Clinic Operations Director', role: 'Clinic Operations Director', roleAr: 'مديرة عمليات العيادة',
  },

  tags: ['React', 'Node.js', 'PostgreSQL', 'Twilio', 'WebRTC', 'Stripe', 'Patient Portal', 'Telehealth', 'HIPAA-Conscious'],
  duration: '12 weeks',
  teamSize: '4 people',

  businessValue: 'Fewer empty appointment slots and a third less phone volume freed front-desk staff for higher-value work, while video follow-ups let physicians see more patients per week without adding clinic hours.',
  businessValueAr: 'أدت قلة المواعيد الفارغة وانخفاض حجم المكالمات الهاتفية بمقدار الثلث إلى تفريغ وقت موظفي الاستقبال لأعمال أعلى قيمة، بينما سمحت متابعات الفيديو للأطباء برؤية عدد أكبر من المرضى أسبوعيًا دون زيادة ساعات عمل العيادة.',

  futureImprovements: 'Next up: an insurance eligibility check at booking time, integration with the clinic\'s existing EHR system, and a symptom-triage chatbot to route patients to the right appointment type automatically.',
  futureImprovementsAr: 'التالي: التحقق من أهلية التأمين وقت الحجز، والتكامل مع نظام السجلات الصحية الإلكترونية الحالي للعيادة، وروبوت محادثة لفرز الأعراض يوجّه المرضى تلقائيًا إلى نوع الموعد المناسب.',

  highlightStats: [
    { value: '-52%', label: 'No-show rate', labelAr: 'معدل التغيب' },
    { value: '81%', label: 'Portal adoption', labelAr: 'تبني البوابة' },
    { value: '94', label: 'Lighthouse score', labelAr: 'نقاط Lighthouse' },
  ],

  gallerySuggestions: [
    { caption: 'Online booking flow with real-time calendar availability', captionAr: 'مسار الحجز عبر الإنترنت مع توفر التقويم الفوري' },
    { caption: 'In-browser video consultation screen', captionAr: 'شاشة الاستشارة بالفيديو داخل المتصفح' },
    { caption: 'Secure patient-to-care-team messaging thread', captionAr: 'محادثة آمنة بين المريض وفريق الرعاية' },
    { caption: 'Appointment reminder SMS/email preview', captionAr: 'معاينة رسالة تذكير الموعد عبر SMS والبريد الإلكتروني' },
  ],

  metaTitle: '{client} Patient Portal Case Study — Telehealth Platform | YANSY Tech',
  metaDescription: 'How we built {client} a patient portal with online booking and video consultations, cutting no-shows by 52%.',
};
