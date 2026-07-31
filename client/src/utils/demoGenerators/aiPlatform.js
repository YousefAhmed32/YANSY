export default {
  category: 'SaaS / Platforms',
  industry: 'Artificial Intelligence — AI Support & Knowledge Platform',

  clients: [
    { name: 'Clarity Insights AI', nameAr: 'كلاريتي إنسايتس للذكاء الاصطناعي', location: 'Seattle, USA', locationAr: 'سياتل، الولايات المتحدة' },
    { name: "Ru'ya AI Labs", nameAr: 'مختبرات رؤية للذكاء الاصطناعي', location: 'Abu Dhabi, UAE', locationAr: 'أبوظبي، الإمارات العربية المتحدة' },
  ],

  titleTemplate: '{client} — AI Support & Knowledge Assistant',
  titleTemplateAr: 'مساعد الدعم والمعرفة المدعوم بالذكاء الاصطناعي لـ {clientAr}',
  tagline: 'An AI layer that answers most support tickets before a human ever sees them.',
  taglineAr: 'طبقة ذكاء اصطناعي تجيب على معظم تذاكر الدعم قبل أن يراها أي إنسان أصلاً.',

  description: '{client} wanted to launch an AI product but needed the retrieval and safety infrastructure most teams underestimate. We built a retrieval-augmented AI assistant that answers support queries from the client\'s own documentation, escalates uncertain cases to a human, and logs every response for continuous quality review.',
  descriptionAr: 'أرادت {clientAr} إطلاق منتج ذكاء اصطناعي لكنها احتاجت بنية الاسترجاع والسلامة التي تستهين بها معظم الفرق. بنينا مساعد ذكاء اصطناعي قائم على الاسترجاع المعزز يجيب على استفسارات الدعم من وثائق العميل الخاصة، ويصعّد الحالات غير المؤكدة لموظف بشري، ويسجّل كل استجابة لمراجعة الجودة المستمرة.',

  myRole: 'AI system architecture, retrieval pipeline engineering, and the human-escalation and review dashboard.',
  myRoleAr: 'هندسة نظام الذكاء الاصطناعي، هندسة مسار الاسترجاع، ولوحة تحكم التصعيد البشري والمراجعة.',

  goals: 'Deflect a meaningful share of repetitive support tickets, keep answers grounded strictly in the client\'s own documentation, and give a human reviewer full visibility into what the AI says and gets wrong.',
  goalsAr: 'تحويل نسبة معتبرة من تذاكر الدعم المتكررة، وإبقاء الإجابات مستندة حصريًا إلى وثائق العميل الخاصة، ومنح المراجع البشري رؤية كاملة لما يقوله الذكاء الاصطناعي وما يخطئ فيه.',

  painPoints: 'Support agents answered the same handful of questions dozens of times a day, documentation existed but customers rarely found the right page, and there was no systematic way to know which answers the team gave were actually correct.',
  painPointsAr: 'كان وكلاء الدعم يجيبون على نفس مجموعة الأسئلة عشرات المرات يوميًا، وكانت الوثائق موجودة لكن العملاء نادرًا ما يجدون الصفحة الصحيحة، ولم تكن هناك طريقة منهجية لمعرفة أي الإجابات التي يقدمها الفريق صحيحة فعليًا.',

  challenge: 'An AI assistant that confidently gives a wrong answer is worse than no assistant at all — the system had to ground every response in retrieved source documents, cite them, and know when to say "I\'m not sure" instead of guessing.',
  challengeAr: 'إن مساعدًا بالذكاء الاصطناعي يقدّم إجابة خاطئة بثقة أسوأ من عدم وجود مساعد إطلاقًا — كان على النظام أن يؤسس كل إجابة على مستندات مصدر مسترجَعة، ويستشهد بها، ويعرف متى يقول "لست متأكدًا" بدلاً من التخمين.',

  solution: 'We built a retrieval-augmented pipeline that grounds every answer in the client\'s actual documentation with inline citations, a confidence-scoring layer that routes low-confidence or sensitive queries straight to a human agent, and a review dashboard where the support team rates AI answers to continuously improve retrieval quality.',
  solutionAr: 'بنينا مسار استرجاع معزز يؤسس كل إجابة على وثائق العميل الفعلية مع استشهادات مضمّنة، وطبقة تسجيل ثقة توجّه الاستفسارات منخفضة الثقة أو الحساسة مباشرة لوكيل بشري، ولوحة مراجعة يقيّم فيها فريق الدعم إجابات الذكاء الاصطناعي لتحسين جودة الاسترجاع باستمرار.',

  process: 'We started with a shadow mode where the AI answered internally without customers seeing it, tuned retrieval quality against a set of real historical tickets, then exposed it to customers gradually with a visible "still learning" indicator on lower-confidence answers.',
  processAr: 'بدأنا بوضع مراقبة يجيب فيه الذكاء الاصطناعي داخليًا دون أن يراه العملاء، وضبطنا جودة الاسترجاع مقابل مجموعة من التذاكر التاريخية الحقيقية، ثم عرضناه تدريجيًا للعملاء مع مؤشر مرئي "لا يزال يتعلم" على الإجابات الأقل ثقة.',

  results: 'The assistant now deflects a significant share of incoming tickets without human involvement, average first-response time dropped sharply for deflected queries, and the review dashboard gives the support team hard data on where documentation gaps actually are.',
  resultsAr: 'يحوّل المساعد الآن نسبة كبيرة من التذاكر الواردة دون تدخل بشري، وانخفض متوسط وقت الاستجابة الأولى بشكل حاد للاستفسارات المُحوَّلة، وتمنح لوحة المراجعة فريق الدعم بيانات دقيقة عن مواقع فجوات الوثائق فعليًا.',

  metrics: [
    { label: 'Tickets deflected by AI', labelAr: 'التذاكر المُحوَّلة بالذكاء الاصطناعي', value: '46%', trend: 'up' },
    { label: 'Avg. first-response time', labelAr: 'متوسط وقت الاستجابة الأولى', value: '-64%', trend: 'down' },
    { label: 'Answer accuracy (reviewed)', labelAr: 'دقة الإجابات (مُراجَعة)', value: '92%', trend: 'up' },
    { label: 'Escalation-to-human rate', labelAr: 'معدل التصعيد للبشر', value: '18%', trend: 'neutral' },
  ],

  performanceMetrics: [
    { label: 'Avg. response latency', labelAr: 'متوسط زمن الاستجابة', before: 'N/A', after: '1.8s' },
    { label: 'First-response time', labelAr: 'وقت الاستجابة الأولى', before: '~4 hrs', after: '< 5 min' },
    { label: 'Documentation gaps identified', labelAr: 'فجوات الوثائق المكتشفة', before: 'Unknown', after: '31 tracked' },
  ],

  faqs: [
    { question: 'Can the AI answer with information outside the client\'s documentation?', questionAr: 'هل يمكن للذكاء الاصطناعي الإجابة بمعلومات خارج وثائق العميل؟', answer: 'No — every answer is grounded strictly in retrieved source documents with citations, which prevents fabricated or off-brand responses.', answerAr: 'لا — تُؤسَّس كل إجابة حصريًا على مستندات مصدر مسترجَعة مع استشهادات، ما يمنع الإجابات الملفَّقة أو غير المتوافقة مع العلامة التجارية.' },
    { question: 'What happens when the AI isn\'t confident in an answer?', questionAr: 'ماذا يحدث عندما لا يكون الذكاء الاصطناعي واثقًا من الإجابة؟', answer: 'Low-confidence or sensitive queries are routed directly to a human agent instead of the AI guessing.', answerAr: 'تُوجَّه الاستفسارات منخفضة الثقة أو الحساسة مباشرة لوكيل بشري بدلاً من أن يخمّن الذكاء الاصطناعي.' },
    { question: 'How does the team improve the AI over time?', questionAr: 'كيف يحسّن الفريق أداء الذكاء الاصطناعي بمرور الوقت؟', answer: 'A review dashboard lets the support team rate AI answers, surfacing documentation gaps and retrieval issues to fix at the source.', answerAr: 'تتيح لوحة المراجعة لفريق الدعم تقييم إجابات الذكاء الاصطناعي، ما يُظهر فجوات الوثائق ومشاكل الاسترجاع لإصلاحها من المصدر.' },
    { question: 'Is customer data used to train a shared model?', questionAr: 'هل تُستخدم بيانات العملاء لتدريب نموذج مشترك؟', answer: 'No — retrieval runs against the client\'s own isolated document index, and no customer data is used to train a shared or third-party model.', answerAr: 'لا — يعمل الاسترجاع على فهرس وثائق العميل المعزول الخاص به، ولا تُستخدم أي بيانات عملاء لتدريب نموذج مشترك أو خارجي.' },
  ],

  team: [
    { name: 'Naomi Reyes', role: 'Product Manager', roleAr: 'مديرة منتج' },
    { name: 'Ali Sherzad', role: 'Lead AI Engineer', roleAr: 'مهندس ذكاء اصطناعي رئيسي' },
    { name: 'Wren Castillo', role: 'UI/UX Designer', roleAr: 'مصممة واجهات وتجربة مستخدم' },
    { name: 'Femi Adebayo', role: 'QA & Evaluation Engineer', roleAr: 'مهندس ضمان جودة وتقييم' },
  ],

  testimonial: {
    quote: 'What sold us wasn\'t the AI answering questions — it was seeing exactly which questions it got wrong and why. That visibility is what let us actually trust it in front of customers.',
    quoteAr: 'ما أقنعنا لم يكن إجابة الذكاء الاصطناعي على الأسئلة — بل رؤية بالضبط أي الأسئلة أخطأ فيها ولماذا. تلك الشفافية هي ما جعلنا نثق به فعليًا أمام العملاء.',
    author: 'Head of Customer Experience', role: 'Head of Customer Experience', roleAr: 'رئيسة تجربة العملاء',
  },

  tags: ['Python', 'FastAPI', 'React', 'pgvector', 'Retrieval-Augmented Generation', 'PostgreSQL', 'Redis', 'AI Platform', 'Support Automation'],
  duration: '12 weeks',
  teamSize: '4 people',

  businessValue: 'Deflecting nearly half of incoming tickets let {client} handle rising support volume without proportionally growing headcount, while the review dashboard turned every AI mistake into a concrete documentation fix instead of a repeated complaint.',
  businessValueAr: 'أدى تحويل ما يقارب نصف التذاكر الواردة إلى تمكين {clientAr} من التعامل مع حجم الدعم المتزايد دون زيادة عدد الموظفين بنفس النسبة، بينما حوّلت لوحة المراجعة كل خطأ للذكاء الاصطناعي إلى إصلاح ملموس في الوثائق بدلاً من شكوى متكررة.',

  futureImprovements: 'Next: proactive answer suggestions surfaced to agents mid-conversation, multilingual retrieval for non-English support tickets, and an automated weekly report of the top documentation gaps found.',
  futureImprovementsAr: 'التالي: اقتراحات إجابة استباقية تظهر للوكلاء أثناء المحادثة، استرجاع متعدد اللغات لتذاكر الدعم غير الإنجليزية، وتقرير أسبوعي آلي بأهم فجوات الوثائق المكتشفة.',

  highlightStats: [
    { value: '46%', label: 'Tickets deflected', labelAr: 'تذاكر مُحوَّلة' },
    { value: '92%', label: 'Answer accuracy', labelAr: 'دقة الإجابات' },
    { value: '1.8s', label: 'Avg. response time', labelAr: 'متوسط زمن الاستجابة' },
  ],

  gallerySuggestions: [
    { caption: 'AI assistant chat with inline source citations', captionAr: 'محادثة المساعد الذكي مع استشهادات مصدر مضمّنة' },
    { caption: 'Confidence-scoring escalation flow', captionAr: 'مسار التصعيد بتسجيل الثقة' },
    { caption: 'Support team answer-review dashboard', captionAr: 'لوحة تحكم مراجعة الإجابات لفريق الدعم' },
    { caption: 'Documentation gap analytics view', captionAr: 'عرض تحليلات فجوات الوثائق' },
  ],

  metaTitle: '{client} AI Platform Case Study — Retrieval-Augmented Support Assistant | YANSY Tech',
  metaDescription: 'How we built {client} an AI support assistant grounded in their own docs, deflecting 46% of incoming tickets.',
};
