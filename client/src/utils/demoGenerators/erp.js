export default {
  category: 'SaaS / Platforms',
  industry: 'Custom ERP — Inventory, Procurement & Finance',

  clients: [
    { name: 'Meridian Wholesale Distributors', nameAr: 'ميريديان للتوزيع بالجملة', location: 'Cleveland, USA', locationAr: 'كليفلاند، الولايات المتحدة' },
    { name: 'Alpha Supply Group', nameAr: 'مجموعة ألفا للتوريدات', location: 'Jeddah, Saudi Arabia', locationAr: 'جدة، المملكة العربية السعودية' },
  ],

  titleTemplate: '{client} — Multi-Branch ERP System',
  titleTemplateAr: 'نظام تخطيط موارد المؤسسة متعدد الفروع لـ {clientAr}',
  tagline: 'One system replacing six spreadsheets, three logins, and a monthly reconciliation nightmare.',
  taglineAr: 'نظام واحد يحل محل ستة جداول بيانات، وثلاثة حسابات دخول، وكابوس تسوية شهري.',

  description: '{client} ran inventory, procurement, and finance across separate spreadsheets and disconnected tools that had to be manually reconciled every month-end. We built a unified ERP covering multi-warehouse inventory, purchase order workflows, supplier management, and financial reporting in one system.',
  descriptionAr: 'كانت {clientAr} تدير المخزون والمشتريات والمالية عبر جداول بيانات منفصلة وأدوات غير مترابطة كان يجب تسويتها يدويًا في نهاية كل شهر. بنينا نظام ERP موحّدًا يغطي مخزون متعدد المستودعات، سير عمل أوامر الشراء، إدارة الموردين، والتقارير المالية في نظام واحد.',

  myRole: 'Systems architecture and full-stack engineering across the inventory, procurement, and finance modules.',
  myRoleAr: 'هندسة الأنظمة والهندسة الكاملة عبر وحدات المخزون والمشتريات والمالية.',

  goals: 'Unify inventory, purchasing, and finance into one source of truth, eliminate manual month-end reconciliation, and give leadership real-time visibility into stock and cash position across all branches.',
  goalsAr: 'توحيد المخزون والمشتريات والمالية في مصدر حقيقة واحد، وإلغاء التسوية اليدوية في نهاية الشهر، ومنح الإدارة رؤية لحظية للمخزون والوضع المالي عبر جميع الفروع.',

  painPoints: 'Inventory counts lived in per-warehouse spreadsheets that were rarely in sync, purchase orders were approved over email with no audit trail, and finance spent days each month manually reconciling numbers across systems that didn\'t talk to each other.',
  painPointsAr: 'كانت أعداد المخزون موجودة في جداول بيانات لكل مستودع نادرًا ما تكون متزامنة، وكانت أوامر الشراء تُعتمد عبر البريد الإلكتروني دون سجل تدقيق، وكان قسم المالية يقضي أيامًا كل شهر في تسوية الأرقام يدويًا بين أنظمة لا تتواصل مع بعضها.',

  challenge: 'Inventory, purchasing, and finance are deeply interdependent — a received shipment has to update stock, trigger a supplier invoice match, and post to the general ledger correctly, all without double-entry or a human re-keying numbers between systems.',
  challengeAr: 'يرتبط المخزون والمشتريات والمالية ببعضها بشكل عميق — فوصول شحنة يجب أن يحدّث المخزون، ويطابق فاتورة المورد، ويُقيَّد في دفتر الأستاذ العام بشكل صحيح، كل ذلك دون ازدواج إدخال أو إعادة كتابة الأرقام يدويًا بين الأنظمة.',

  solution: 'We built a single data model spanning inventory, purchase orders, supplier invoices, and the general ledger, so a received shipment automatically updates stock levels, matches against the purchase order, and posts the corresponding journal entry — with full audit trails on every step and role-based approval workflows.',
  solutionAr: 'بنينا نموذج بيانات واحد يشمل المخزون وأوامر الشراء وفواتير الموردين ودفتر الأستاذ العام، بحيث تُحدّث الشحنة المستلمة مستويات المخزون تلقائيًا، وتُطابق أمر الشراء، وتُقيَّد القيد المحاسبي المقابل — مع سجلات تدقيق كاملة لكل خطوة وسير عمل موافقات قائم على الأدوار.',

  process: 'We migrated inventory data first and ran it in parallel with the old spreadsheets for one full stock cycle to validate accuracy, then brought procurement and finance online branch by branch to limit disruption to daily operations.',
  processAr: 'رحّلنا بيانات المخزون أولاً وشغّلناها بالتوازي مع جداول البيانات القديمة لدورة مخزون كاملة للتحقق من الدقة، ثم أطلقنا المشتريات والمالية فرعًا تلو الآخر للحد من تعطيل العمليات اليومية.',

  results: 'Month-end financial close time dropped from days to hours, stock discrepancies across warehouses became rare and traceable instead of routine, and purchase order approval time fell sharply now that every request is visible and routed automatically.',
  resultsAr: 'انخفض وقت الإغلاق المالي في نهاية الشهر من أيام إلى ساعات، وأصبحت فروقات المخزون بين المستودعات نادرة وقابلة للتتبع بدلاً من كونها روتينية، وانخفض وقت اعتماد أوامر الشراء بشكل حاد الآن مع رؤية كل طلب وتوجيهه تلقائيًا.',

  metrics: [
    { label: 'Month-end close time', labelAr: 'وقت الإغلاق الشهري', value: '-78%', trend: 'down' },
    { label: 'Stock discrepancies', labelAr: 'فروقات المخزون', value: '-85%', trend: 'down' },
    { label: 'PO approval time', labelAr: 'وقت اعتماد أمر الشراء', value: '< 4 hrs', trend: 'down' },
    { label: 'Branches on one system', labelAr: 'الفروع على نظام واحد', value: '6', trend: 'up' },
  ],

  performanceMetrics: [
    { label: 'Inventory reconciliation', labelAr: 'تسوية المخزون', before: '~3 days/month', after: 'Continuous' },
    { label: 'Purchase order cycle time', labelAr: 'دورة أمر الشراء', before: '2–3 days', after: '< 4 hrs' },
    { label: 'Financial report generation', labelAr: 'إنشاء التقرير المالي', before: '~2 days (manual)', after: 'Instant' },
  ],

  faqs: [
    { question: 'Does the ERP support multiple branches and warehouses?', questionAr: 'هل يدعم النظام عدة فروع ومستودعات؟', answer: 'Yes — every branch operates on the same data model with branch-level permissions and consolidated reporting across all of them.', answerAr: 'نعم — يعمل كل فرع على نفس نموذج البيانات مع صلاحيات على مستوى الفرع وتقارير موحّدة عبر جميعها.' },
    { question: 'How are purchase orders and invoices matched?', questionAr: 'كيف تُطابق أوامر الشراء والفواتير؟', answer: 'Received shipments are automatically matched against the original purchase order, flagging any quantity or price discrepancy for review.', answerAr: 'تُطابَق الشحنات المستلمة تلقائيًا مع أمر الشراء الأصلي، مع تنبيه لأي فرق في الكمية أو السعر للمراجعة.' },
    { question: 'Is there an audit trail on financial entries?', questionAr: 'هل هناك سجل تدقيق للقيود المالية؟', answer: 'Every journal entry is traceable to the transaction that generated it — shipment, invoice, or manual adjustment — with a full change history.', answerAr: 'يمكن تتبع كل قيد محاسبي إلى المعاملة التي أنشأته — شحنة أو فاتورة أو تعديل يدوي — مع سجل تغييرات كامل.' },
    { question: 'Can approval workflows be customized per department?', questionAr: 'هل يمكن تخصيص سير عمل الموافقات لكل قسم؟', answer: 'Yes — approval thresholds and routing rules are configurable per department and purchase category.', answerAr: 'نعم — يمكن تهيئة حدود الموافقة وقواعد التوجيه حسب القسم وفئة الشراء.' },
  ],

  team: [
    { name: 'Grace Whitfield', role: 'Product Manager', roleAr: 'مديرة منتج' },
    { name: 'Karim El-Masry', role: 'Lead Backend Engineer', roleAr: 'مهندس باكند رئيسي' },
    { name: 'Sanna Kallio', role: 'UI/UX Designer', roleAr: 'مصممة واجهات وتجربة مستخدم' },
    { name: 'Diego Ramirez', role: 'QA & Data Migration Engineer', roleAr: 'مهندس ضمان جودة وترحيل بيانات' },
  ],

  testimonial: {
    quote: 'Our accountants used to dread month-end. Now the numbers are already reconciled by the time they sit down — the system does the matching we used to do by hand.',
    quoteAr: 'كان محاسبونا يخشون نهاية الشهر. الآن تكون الأرقام مسوّاة بالفعل بحلول وقت جلوسهم للعمل — يقوم النظام بالمطابقة التي كنا نقوم بها يدويًا.',
    author: 'Chief Financial Officer', role: 'Chief Financial Officer', roleAr: 'المدير المالي',
  },

  tags: ['React', 'Node.js', 'PostgreSQL', 'Redis', 'RabbitMQ', 'Docker', 'Kubernetes', 'Custom ERP', 'Inventory Management', 'Financial Reporting'],
  duration: '22 weeks',
  teamSize: '5 people',

  businessValue: 'Consolidating inventory, procurement, and finance into one system gave {client} leadership real-time visibility into cash and stock position for the first time, turning month-end from a multi-day scramble into a routine check.',
  businessValueAr: 'منح توحيد المخزون والمشتريات والمالية في نظام واحد إدارة {clientAr} رؤية لحظية للوضع النقدي والمخزون لأول مرة، وحوّل نهاية الشهر من سباق متعدد الأيام إلى فحص روتيني.',

  futureImprovements: 'On the roadmap: demand forecasting based on historical sales velocity per branch, a supplier scorecard for procurement decisions, and a mobile app for warehouse staff to process receiving without a desktop terminal.',
  futureImprovementsAr: 'في خارطة الطريق: توقع الطلب بناءً على سرعة المبيعات التاريخية لكل فرع، بطاقة تقييم للموردين لدعم قرارات المشتريات، وتطبيق جوال لموظفي المستودع لمعالجة الاستلام دون طرفية مكتبية.',

  highlightStats: [
    { value: '-78%', label: 'Close time', labelAr: 'وقت الإغلاق' },
    { value: '6', label: 'Branches unified', labelAr: 'فرع موحّد' },
    { value: '-85%', label: 'Stock discrepancies', labelAr: 'فروقات المخزون' },
  ],

  gallerySuggestions: [
    { caption: 'Multi-warehouse inventory overview dashboard', captionAr: 'لوحة تحكم نظرة عامة على مخزون متعدد المستودعات' },
    { caption: 'Purchase order approval workflow screen', captionAr: 'شاشة سير عمل اعتماد أمر الشراء' },
    { caption: 'Automated invoice-to-PO matching view', captionAr: 'عرض مطابقة الفاتورة بأمر الشراء الآلي' },
    { caption: 'Consolidated financial reporting dashboard', captionAr: 'لوحة تحكم التقارير المالية الموحّدة' },
  ],

  metaTitle: '{client} ERP Case Study — Multi-Branch Inventory & Finance Platform | YANSY Tech',
  metaDescription: 'How we built {client} a unified ERP system that cut month-end close time by 78% across six branches.',
};
