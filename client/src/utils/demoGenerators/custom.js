export default {
  category: 'Other',
  industry: 'Custom Software — Internal Workflow Automation',

  clients: [
    { name: 'Vantage Logistics Group', nameAr: 'فانتج للخدمات اللوجستية', location: 'Rotterdam, Netherlands', locationAr: 'روتردام، هولندا' },
    { name: 'Al-Ittihad Services Group', nameAr: 'مجموعة الاتحاد للخدمات', location: 'Dammam, Saudi Arabia', locationAr: 'الدمام، المملكة العربية السعودية' },
  ],

  titleTemplate: '{client} — Custom Workflow Automation Platform',
  titleTemplateAr: 'منصة أتمتة سير عمل مخصصة لـ {clientAr}',
  tagline: 'A bespoke platform built around a workflow no off-the-shelf tool was ever going to fit.',
  taglineAr: 'منصة مخصصة بُنيت حول سير عمل لم تكن أي أداة جاهزة لتناسبه يومًا.',

  description: '{client} ran a multi-step approval and dispatch process across departments using a mix of email chains, shared spreadsheets, and manual handoffs that no off-the-shelf software matched. We built a fully custom platform modeling their exact workflow, with role-based task routing, automated notifications, and an audit trail on every step.',
  descriptionAr: 'كانت {clientAr} تدير عملية موافقات وإرسال متعددة الخطوات عبر الأقسام باستخدام مزيج من سلاسل البريد الإلكتروني وجداول البيانات المشتركة والتسليم اليدوي الذي لم تطابقه أي برمجية جاهزة. بنينا منصة مخصصة بالكامل تُمثّل سير عملهم الفعلي، مع توجيه مهام قائم على الأدوار، إشعارات آلية، وسجل تدقيق لكل خطوة.',

  myRole: 'Requirements discovery, systems architecture, and full-stack engineering for the end-to-end platform.',
  myRoleAr: 'اكتشاف المتطلبات، هندسة الأنظمة، والهندسة الكاملة للمنصة من البداية إلى النهاية.',

  goals: 'Model the client\'s exact multi-department workflow instead of forcing it into a generic tool, eliminate manual handoffs and status-chasing between departments, and create a permanent audit trail for every approval and dispatch decision.',
  goalsAr: 'تمثيل سير عمل العميل الفعلي متعدد الأقسام بدلاً من إجباره على أداة عامة، وإلغاء التسليم اليدوي وملاحقة الحالة بين الأقسام، وإنشاء سجل تدقيق دائم لكل قرار موافقة وإرسال.',

  painPoints: 'Requests moved between departments via forwarded emails that regularly got lost or stalled with no owner, status updates required someone manually asking around, and there was no single record of who approved what and when.',
  painPointsAr: 'كانت الطلبات تنتقل بين الأقسام عبر رسائل بريد إلكتروني مُعاد توجيهها كانت تُفقَد أو تتوقف بانتظام دون مالك واضح، وتطلبت تحديثات الحالة سؤال الأشخاص يدويًا، ولم يكن هناك سجل واحد لمن وافق على ماذا ومتى.',

  challenge: 'No off-the-shelf workflow or approval tool matched the client\'s exact sequence of department handoffs, conditional approval branches, and exception cases — building a generic tool\'s worth of configuration screens would have taken longer than modeling the real workflow directly.',
  challengeAr: 'لم تطابق أي أداة سير عمل أو موافقات جاهزة تسلسل تسليم الأقسام الفعلي للعميل، وفروع الموافقة الشرطية، وحالات الاستثناء — وكان بناء شاشات تهيئة بقدر أداة عامة سيستغرق وقتًا أطول من تمثيل سير العمل الفعلي مباشرة.',

  solution: 'We modeled the exact department-to-department workflow as a state machine with conditional branches for exceptions, built role-based task queues so each department sees only what\'s theirs to act on, automated notifications at every handoff, and a permanent, timestamped audit trail on every approval and decision.',
  solutionAr: 'مثّلنا سير العمل الفعلي من قسم إلى قسم كآلة حالات مع فروع شرطية للاستثناءات، وبنينا قوائم مهام قائمة على الأدوار بحيث يرى كل قسم فقط ما يخصه للتصرف، وإشعارات آلية عند كل تسليم، وسجل تدقيق دائم موثّق زمنيًا لكل موافقة وقرار.',

  process: 'We spent the first two weeks purely mapping the existing workflow with every department involved, including every exception case they could remember, then built and validated the state machine against real historical requests before writing a single screen.',
  processAr: 'أمضينا الأسبوعين الأولين في رسم سير العمل الحالي بشكل خالص مع كل قسم معني، بما في ذلك كل حالة استثناء يتذكرونها، ثم بنينا آلة الحالات وتحققنا منها مقابل طلبات تاريخية حقيقية قبل كتابة أي شاشة واحدة.',

  results: 'Average request cycle time across departments dropped substantially once handoffs were automated instead of manual, lost or stalled requests became effectively impossible to lose track of, and management gained a full audit trail it never had before.',
  resultsAr: 'انخفض متوسط زمن دورة الطلب عبر الأقسام بشكل كبير بعد أتمتة التسليم بدلاً من كونه يدويًا، وأصبح من المستحيل عمليًا فقدان تتبع الطلبات المفقودة أو المتوقفة، وحصلت الإدارة على سجل تدقيق كامل لم يكن لديها من قبل.',

  metrics: [
    { label: 'Avg. request cycle time', labelAr: 'متوسط زمن دورة الطلب', value: '-49%', trend: 'down' },
    { label: 'Stalled/lost requests', labelAr: 'الطلبات المتوقفة/المفقودة', value: '~0', trend: 'down' },
    { label: 'Departments on platform', labelAr: 'الأقسام على المنصة', value: '5', trend: 'up' },
    { label: 'Manual status-check requests', labelAr: 'طلبات الاستفسار اليدوي عن الحالة', value: '-82%', trend: 'down' },
  ],

  performanceMetrics: [
    { label: 'Handoff time between departments', labelAr: 'وقت التسليم بين الأقسام', before: '~1–2 days (email)', after: '< 1 hour (automated)' },
    { label: 'Approval audit lookup time', labelAr: 'وقت البحث في سجل تدقيق الموافقات', before: 'Hours (manual search)', after: 'Instant' },
    { label: 'Lighthouse performance', labelAr: 'أداء Lighthouse', before: '—', after: '95' },
  ],

  faqs: [
    { question: 'Why build something custom instead of using an off-the-shelf workflow tool?', questionAr: 'لماذا بناء شيء مخصص بدلاً من استخدام أداة سير عمل جاهزة؟', answer: 'The client\'s approval sequence and exception cases were specific enough that configuring a generic tool to match would have taken as long as building the real workflow directly, with a worse fit at the end.', answerAr: 'كان تسلسل الموافقات وحالات الاستثناء لدى العميل محددًا بما يكفي بحيث كان تهيئة أداة عامة لمطابقته سيستغرق وقتًا مساويًا لبناء سير العمل الفعلي مباشرة، مع تطابق أسوأ في النهاية.' },
    { question: 'Does every department see the full workflow?', questionAr: 'هل يرى كل قسم سير العمل الكامل؟', answer: 'No — each department\'s task queue is scoped to only what\'s theirs to act on, keeping the interface simple even though the underlying workflow is complex.', answerAr: 'لا — تُحدَّد قائمة مهام كل قسم بما يخصه فقط للتصرف، ما يبقي الواجهة بسيطة رغم تعقيد سير العمل الأساسي.' },
    { question: 'Is there a full audit trail on approvals?', questionAr: 'هل هناك سجل تدقيق كامل للموافقات؟', answer: 'Yes — every approval, rejection, and handoff is timestamped and permanently logged, replacing what used to be scattered across email threads.', answerAr: 'نعم — تُوثَّق كل موافقة ورفض وتسليم زمنيًا وتُسجَّل بشكل دائم، لتحل محل ما كان مبعثرًا سابقًا عبر سلاسل البريد الإلكتروني.' },
    { question: 'Can the workflow be adjusted as the business changes?', questionAr: 'هل يمكن تعديل سير العمل مع تغيّر الأعمال؟', answer: 'Yes — the state machine model was built to accommodate new stages or approval branches without a full platform rebuild.', answerAr: 'نعم — بُني نموذج آلة الحالات لاستيعاب مراحل أو فروع موافقة جديدة دون إعادة بناء كاملة للمنصة.' },
  ],

  team: [
    { name: 'Renata Alves', role: 'Product Manager', roleAr: 'مديرة منتج' },
    { name: 'Mikael Bergström', role: 'Lead Full-Stack Engineer', roleAr: 'مهندس برمجيات رئيسي' },
    { name: 'Salma Idris', role: 'UI/UX Designer', roleAr: 'مصممة واجهات وتجربة مستخدم' },
    { name: 'Owen Fitzgerald', role: 'QA Engineer', roleAr: 'مهندس ضمان الجودة' },
  ],

  testimonial: {
    quote: 'Nothing on the market matched how we actually work, so we stopped looking for it. This platform fits our process instead of the other way around.',
    quoteAr: 'لم يطابق أي شيء في السوق طريقة عملنا الفعلية، فتوقفنا عن البحث عنه. هذه المنصة تناسب عمليتنا بدلاً من العكس.',
    author: 'Director of Operations', role: 'Director of Operations', roleAr: 'مديرة العمليات',
  },

  tags: ['React', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'AWS', 'Workflow Automation', 'Custom Software', 'Audit Trail'],
  duration: '19 weeks',
  teamSize: '4 people',

  businessValue: 'Automating handoffs that used to rely on someone remembering to forward an email cut cycle time nearly in half and gave {client} leadership a complete, searchable audit trail it never had — turning "who approved this and when" from a scramble into a lookup.',
  businessValueAr: 'أدت أتمتة عمليات التسليم التي كانت تعتمد سابقًا على تذكّر شخص ما لإعادة توجيه بريد إلكتروني إلى خفض زمن الدورة بمقدار النصف تقريبًا، ومنحت إدارة {clientAr} سجل تدقيق كاملاً وقابلاً للبحث لم يكن لديها من قبل — محوّلة سؤال "من وافق على هذا ومتى" من مطاردة إلى عملية بحث بسيطة.',

  futureImprovements: 'Next: a mobile app for on-the-go approvals, predictive SLA warnings when a request is trending toward a delay, and a self-service reporting builder for department heads.',
  futureImprovementsAr: 'التالي: تطبيق جوال للموافقات أثناء التنقل، تنبيهات تنبؤية لاتفاقية مستوى الخدمة عند اتجاه طلب نحو التأخر، وأداة تقارير ذاتية الخدمة لرؤساء الأقسام.',

  highlightStats: [
    { value: '-49%', label: 'Cycle time', labelAr: 'زمن الدورة' },
    { value: '5', label: 'Departments unified', labelAr: 'قسم موحّد' },
    { value: '95', label: 'Lighthouse score', labelAr: 'نقاط Lighthouse' },
  ],

  gallerySuggestions: [
    { caption: 'Department task queue view', captionAr: 'عرض قائمة مهام القسم' },
    { caption: 'Workflow state machine visualization for admins', captionAr: 'تصور آلة حالات سير العمل للمشرفين' },
    { caption: 'Approval screen with full audit history', captionAr: 'شاشة الموافقة مع سجل تدقيق كامل' },
    { caption: 'Automated handoff notification', captionAr: 'إشعار التسليم الآلي' },
  ],

  metaTitle: '{client} Custom Platform Case Study — Workflow Automation | YANSY Tech',
  metaDescription: 'How we built {client} a custom workflow automation platform that cut cross-department cycle time by 49%.',
};
