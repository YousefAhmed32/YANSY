export default {
  category: 'SaaS / Platforms',
  industry: 'Custom CRM — Sales & Field Team Operations',

  clients: [
    { name: 'Halcyon Field Services', nameAr: 'هالسيون للخدمات الميدانية', location: 'Manchester, UK', locationAr: 'مانشستر، المملكة المتحدة' },
    { name: 'Al-Rowad Trading Group', nameAr: 'مجموعة الرواد التجارية', location: 'Amman, Jordan', locationAr: 'عمّان، الأردن' },
  ],

  titleTemplate: '{client} — Custom Sales & Field CRM',
  titleTemplateAr: 'نظام إدارة علاقات عملاء مخصص للمبيعات والفرق الميدانية لـ {clientAr}',
  tagline: 'A CRM built around how the sales team actually works, not how off-the-shelf software assumes they do.',
  taglineAr: 'نظام CRM مصمم حول طريقة عمل فريق المبيعات الفعلية، لا حسب افتراضات برمجيات جاهزة.',

  description: '{client} had outgrown spreadsheets but found generic CRMs too rigid for its field-sales workflow. We built a custom CRM with pipeline tracking tailored to the actual sales stages, mobile check-ins for field reps, automated follow-up reminders, and a manager dashboard with real pipeline forecasting.',
  descriptionAr: 'تجاوزت {clientAr} حدود جداول البيانات لكنها وجدت أنظمة CRM الجاهزة جامدة للغاية بالنسبة لسير عمل مبيعاتها الميدانية. بنينا نظام CRM مخصصًا مع تتبع مسار مبيعات مصمم حسب مراحل البيع الفعلية، تسجيل دخول عبر الجوال للمندوبين الميدانيين، تذكيرات متابعة آلية، ولوحة تحكم للمدير مع توقعات مسار مبيعات حقيقية.',

  myRole: 'Full-stack engineering and workflow design for the pipeline, mobile check-in, and reporting systems.',
  myRoleAr: 'الهندسة الكاملة وتصميم سير العمل لأنظمة مسار المبيعات، تسجيل الدخول عبر الجوال، والتقارير.',

  goals: 'Replace spreadsheet-based pipeline tracking, give field reps a mobile-first way to log visits, and give sales managers accurate forecasting instead of gut-feel estimates.',
  goalsAr: 'استبدال تتبع مسار المبيعات القائم على جداول البيانات، ومنح المندوبين الميدانيين طريقة تُعطي الأولوية للجوال لتسجيل الزيارات، ومنح مديري المبيعات توقعات دقيقة بدلاً من تقديرات الحدس.',

  painPoints: 'Pipeline data lived in a shared spreadsheet that was frequently out of date, field reps logged visits after the fact from memory (or not at all), and forecasting meant a manager manually asking every rep for a status update each week.',
  painPointsAr: 'كانت بيانات مسار المبيعات موجودة في جدول بيانات مشترك غالبًا ما يكون قديمًا، وكان المندوبون الميدانيون يسجّلون الزيارات لاحقًا من الذاكرة (أو لا يسجّلونها إطلاقًا)، وكان التنبؤ يعني أن يسأل المدير كل مندوب يدويًا عن تحديث الحالة أسبوعيًا.',

  challenge: 'Field reps needed to log visits and update deal status from a job site with unreliable signal, while the pipeline data still had to stay accurate enough for management to forecast revenue with confidence.',
  challengeAr: 'احتاج المندوبون الميدانيون لتسجيل الزيارات وتحديث حالة الصفقة من موقع العمل بإشارة اتصال غير موثوقة، بينما كان على بيانات مسار المبيعات أن تبقى دقيقة بما يكفي لتمكين الإدارة من التنبؤ بالإيرادات بثقة.',

  solution: 'We built an offline-first mobile check-in flow that queues updates locally and syncs the moment signal returns, a pipeline model matched to the client\'s actual sales stages instead of a generic template, automated follow-up reminders based on deal stage and last-contact date, and a live forecasting dashboard for managers.',
  solutionAr: 'بنينا مسار تسجيل دخول عبر الجوال يعمل دون اتصال أولاً ويحفظ التحديثات محليًا ويزامنها لحظة عودة الإشارة، ونموذج مسار مبيعات مطابق لمراحل البيع الفعلية للعميل بدلاً من قالب عام، وتذكيرات متابعة آلية بناءً على مرحلة الصفقة وتاريخ آخر تواصل، ولوحة تحكم توقعات حية للمديرين.',

  process: 'We shadowed field reps for two weeks to map the real visit-to-close workflow, piloted the mobile check-in with one regional team, then rolled the full CRM out company-wide once offline sync proved reliable in the field.',
  processAr: 'راقبنا المندوبين الميدانيين لمدة أسبوعين لرسم سير العمل الفعلي من الزيارة إلى إغلاق الصفقة، وأطلقنا تجربة أولية لتسجيل الدخول عبر الجوال مع فريق إقليمي واحد، ثم عمّمنا نظام CRM الكامل على مستوى الشركة بعد إثبات موثوقية المزامنة دون اتصال في الميدان.',

  results: 'Pipeline data accuracy improved dramatically once it updated automatically from field visits, sales managers get real-time forecasting instead of a weekly manual roll-up, and average deal cycle time shortened thanks to automated follow-up reminders.',
  resultsAr: 'تحسّنت دقة بيانات مسار المبيعات بشكل كبير بعد أن أصبحت تتحدث تلقائيًا من الزيارات الميدانية، ويحصل مديرو المبيعات على توقعات لحظية بدلاً من تجميع يدوي أسبوعي، وتقلّص متوسط دورة الصفقة بفضل تذكيرات المتابعة الآلية.',

  metrics: [
    { label: 'Pipeline data accuracy', labelAr: 'دقة بيانات مسار المبيعات', value: '+58%', trend: 'up' },
    { label: 'Avg. deal cycle time', labelAr: 'متوسط دورة الصفقة', value: '-21%', trend: 'down' },
    { label: 'Field visits logged same-day', labelAr: 'الزيارات المسجّلة في نفس اليوم', value: '94%', trend: 'up' },
    { label: 'Forecast variance', labelAr: 'انحراف التوقعات', value: '-40%', trend: 'down' },
  ],

  performanceMetrics: [
    { label: 'Visit logging time', labelAr: 'وقت تسجيل الزيارة', before: '~5 min (end of day)', after: '< 1 min (on-site)' },
    { label: 'Manager forecast prep time', labelAr: 'وقت إعداد توقعات المدير', before: '~3 hrs/week', after: 'Real-time' },
    { label: 'Offline sync success rate', labelAr: 'معدل نجاح المزامنة دون اتصال', before: 'N/A', after: '99.6%' },
  ],

  faqs: [
    { question: 'Does the CRM work without a signal in the field?', questionAr: 'هل يعمل نظام CRM دون إشارة اتصال في الميدان؟', answer: 'Yes — check-ins and deal updates queue locally on the device and sync automatically the moment a connection is available.', answerAr: 'نعم — تُحفظ تسجيلات الدخول وتحديثات الصفقات محليًا على الجهاز وتُزامَن تلقائيًا لحظة توفر الاتصال.' },
    { question: 'Is the pipeline model customizable?', questionAr: 'هل نموذج مسار المبيعات قابل للتخصيص؟', answer: 'Yes — stages, required fields, and automation rules are all matched to the client\'s actual sales process, not a fixed template.', answerAr: 'نعم — تُطابق المراحل والحقول المطلوبة وقواعد الأتمتة عملية البيع الفعلية للعميل، وليست قالبًا ثابتًا.' },
    { question: 'How does forecasting stay accurate?', questionAr: 'كيف تبقى التوقعات دقيقة؟', answer: 'Forecasts pull directly from live pipeline data updated in the field, instead of a weekly manually-compiled summary.', answerAr: 'تُستخلص التوقعات مباشرة من بيانات مسار المبيعات الحية المحدَّثة ميدانيًا، بدلاً من ملخص يُجمَّع يدويًا أسبوعيًا.' },
    { question: 'Can it integrate with existing email and calendar tools?', questionAr: 'هل يمكنه التكامل مع أدوات البريد والتقويم الحالية؟', answer: 'Yes — two-way sync with common email and calendar providers keeps follow-up reminders and meeting logs in one place.', answerAr: 'نعم — تحافظ المزامنة ثنائية الاتجاه مع مزوّدي البريد والتقويم الشائعين على تذكيرات المتابعة وسجلات الاجتماعات في مكان واحد.' },
  ],

  team: [
    { name: 'Oliver Grant', role: 'Product Manager', roleAr: 'مدير منتج' },
    { name: 'Dina Kassem', role: 'Lead Full-Stack Engineer', roleAr: 'مهندسة برمجيات رئيسية' },
    { name: 'Freya Nilsen', role: 'UI/UX Designer', roleAr: 'مصممة واجهات وتجربة مستخدم' },
    { name: 'Tobias Reinholt', role: 'QA Engineer', roleAr: 'مهندس ضمان الجودة' },
  ],

  testimonial: {
    quote: 'Our managers used to spend Monday mornings chasing status updates. Now they open a dashboard. The offline sync alone was worth the entire project.',
    quoteAr: 'كان مديرونا يقضون صباح الاثنين في ملاحقة تحديثات الحالة. الآن يفتحون لوحة تحكم فقط. المزامنة دون اتصال وحدها كانت تستحق المشروع بأكمله.',
    author: 'VP of Sales Operations', role: 'VP of Sales Operations', roleAr: 'نائب رئيس عمليات المبيعات',
  },

  tags: ['React', 'React Native', 'Node.js', 'PostgreSQL', 'Redis', 'Offline-First Sync', 'Custom CRM', 'Sales Pipeline', 'Field Operations'],
  duration: '16 weeks',
  teamSize: '4 people',

  businessValue: 'Accurate, real-time pipeline data let {client} forecast revenue with confidence instead of guessing, and automated follow-ups shortened deal cycles enough to materially increase how many deals each rep closes per quarter.',
  businessValueAr: 'سمحت بيانات مسار المبيعات الدقيقة واللحظية لـ {clientAr} بالتنبؤ بالإيرادات بثقة بدلاً من التخمين، وقلّصت المتابعات الآلية دورات الصفقات بما يكفي لزيادة عدد الصفقات التي يغلقها كل مندوب في الربع بشكل ملموس.',

  futureImprovements: 'Planned next: AI-suggested next-best-action per deal, a commission calculator tied directly to closed deals, and a territory-mapping view for regional managers.',
  futureImprovementsAr: 'المخطط له لاحقًا: اقتراح الإجراء الأفضل التالي لكل صفقة بالذكاء الاصطناعي، حاسبة عمولات مرتبطة مباشرة بالصفقات المغلقة، وعرض خرائط مناطق للمديرين الإقليميين.',

  highlightStats: [
    { value: '+58%', label: 'Pipeline accuracy', labelAr: 'دقة مسار المبيعات' },
    { value: '94%', label: 'Same-day logging', labelAr: 'تسجيل بنفس اليوم' },
    { value: '99.6%', label: 'Offline sync success', labelAr: 'نجاح المزامنة دون اتصال' },
  ],

  gallerySuggestions: [
    { caption: 'Sales pipeline board matched to real deal stages', captionAr: 'لوحة مسار المبيعات مطابقة لمراحل الصفقة الفعلية' },
    { caption: 'Mobile field check-in screen (offline-capable)', captionAr: 'شاشة تسجيل الدخول الميداني عبر الجوال (تعمل دون اتصال)' },
    { caption: 'Manager forecasting dashboard', captionAr: 'لوحة تحكم توقعات المدير' },
    { caption: 'Automated follow-up reminder settings', captionAr: 'إعدادات تذكير المتابعة الآلي' },
  ],

  metaTitle: '{client} CRM Case Study — Custom Sales & Field Operations Platform | YANSY Tech',
  metaDescription: 'How we built {client} a custom CRM with offline mobile check-ins, improving pipeline accuracy by 58%.',
};
