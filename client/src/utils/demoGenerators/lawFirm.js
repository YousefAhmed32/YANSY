export default {
  category: 'Other',
  industry: 'Legal Services — Client Portal & Document Automation',

  clients: [
    { name: 'Whitfield & Cross Law', nameAr: 'ويتفيلد آند كروس للمحاماة', location: 'Boston, USA', locationAr: 'بوسطن، الولايات المتحدة' },
    { name: 'Al-Adala Law Office', nameAr: 'مكتب العدالة للمحاماة', location: 'Cairo, Egypt', locationAr: 'القاهرة، مصر' },
  ],

  titleTemplate: '{client} — Client Portal & Case Document Platform',
  titleTemplateAr: 'بوابة العملاء ومنصة مستندات القضايا لـ {clientAr}',
  tagline: 'Clients stopped calling to ask "where is my case at" once they could just check.',
  taglineAr: 'توقف العملاء عن الاتصال للسؤال "أين وصلت قضيتي" بعد أن أصبح بإمكانهم التحقق بأنفسهم.',

  description: '{client} spent a large share of paralegal time answering routine "what\'s the status" calls and chasing signatures by email. We built a secure client portal with case status tracking, e-signature-ready document sharing, secure messaging, and automated billing summaries.',
  descriptionAr: 'كانت {clientAr} تقضي جزءًا كبيرًا من وقت المساعدين القانونيين في الرد على مكالمات "ما هي حالة القضية" الروتينية وملاحقة التوقيعات عبر البريد الإلكتروني. بنينا بوابة عملاء آمنة تشمل تتبع حالة القضية، مشاركة مستندات جاهزة للتوقيع الإلكتروني، مراسلة آمنة، وملخصات فوترة آلية.',

  myRole: 'Full-stack engineering and information architecture for the client portal and document workflow.',
  myRoleAr: 'الهندسة الكاملة وهندسة المعلومات لبوابة العملاء وسير عمل المستندات.',

  goals: 'Cut routine status-check calls to paralegals, move document signing and sharing into one secure channel, and give clients transparent visibility into billing without a monthly PDF invoice being the first they hear of it.',
  goalsAr: 'خفض مكالمات الاستفسار الروتينية عن الحالة للمساعدين القانونيين، ونقل توقيع ومشاركة المستندات إلى قناة آمنة واحدة، ومنح العملاء رؤية شفافة للفوترة دون أن تكون الفاتورة الشهرية أول ما يسمعونه.',

  painPoints: 'Paralegals fielded frequent phone calls just to relay a case status that hadn\'t meaningfully changed, documents went back and forth over unencrypted email attachments, and clients only saw a bill at month-end with no visibility into accumulating hours before then.',
  painPointsAr: 'كان المساعدون القانونيون يردّون على مكالمات هاتفية متكررة فقط لنقل حالة قضية لم تتغير بشكل جوهري، وكانت المستندات تُتبادل عبر مرفقات بريد إلكتروني غير مشفّرة، ولم يكن العملاء يرون فاتورة إلا في نهاية الشهر دون رؤية للساعات المتراكمة قبل ذلك.',

  challenge: 'Legal correspondence and documents carry strict confidentiality obligations — the portal had to give clients real transparency into their case without exposing privileged internal notes, and had to be simple enough for clients with zero technical background to trust and use.',
  challengeAr: 'تحمل المراسلات والمستندات القانونية التزامات سرية صارمة — كان على البوابة منح العملاء شفافية حقيقية حول قضيتهم دون كشف الملاحظات الداخلية المشمولة بالامتياز، وأن تكون بسيطة بما يكفي ليثق بها ويستخدمها عملاء دون أي خلفية تقنية.',

  solution: 'We built a permissioned client portal that surfaces only client-safe case milestones and documents, secure e-signature-ready document sharing with full version history, encrypted messaging threads per case, and a running billing summary clients can check any time instead of waiting for month-end.',
  solutionAr: 'بنينا بوابة عملاء بصلاحيات محدَّدة تُظهر فقط معالم ومستندات القضية الآمنة للعميل، ومشاركة مستندات آمنة جاهزة للتوقيع الإلكتروني مع سجل إصدارات كامل، ومحادثات مشفّرة لكل قضية، وملخص فوترة جارٍ يمكن للعملاء التحقق منه في أي وقت بدلاً من انتظار نهاية الشهر.',

  process: 'We worked closely with the firm\'s partners to define exactly what case information was safe to expose to clients directly, piloted the portal with one practice group, then expanded firm-wide once confidentiality boundaries were confirmed to hold.',
  processAr: 'عملنا عن قرب مع شركاء المكتب لتحديد المعلومات التي يمكن كشفها للعملاء مباشرة، وأطلقنا تجربة أولية للبوابة مع مجموعة ممارسة واحدة، ثم وسّعناها على مستوى المكتب بعد التأكد من ثبات حدود السرية.',

  results: 'Routine status-check calls to paralegals dropped sharply, document turnaround time for signatures improved since clients could sign directly in the portal, and client satisfaction scores on billing transparency rose noticeably.',
  resultsAr: 'انخفضت مكالمات الاستفسار الروتينية عن الحالة للمساعدين القانونيين بشكل حاد، وتحسّن وقت إتمام توقيع المستندات بعد أن أصبح بإمكان العملاء التوقيع مباشرة في البوابة، وارتفعت درجات رضا العملاء عن شفافية الفوترة بشكل ملحوظ.',

  metrics: [
    { label: 'Status-check calls to paralegals', labelAr: 'مكالمات الاستفسار عن الحالة', value: '-64%', trend: 'down' },
    { label: 'Document signing turnaround', labelAr: 'وقت إتمام توقيع المستندات', value: '-58%', trend: 'down' },
    { label: 'Client portal adoption', labelAr: 'معدل تبني بوابة العملاء', value: '76%', trend: 'up' },
    { label: 'Billing dispute rate', labelAr: 'معدل نزاعات الفوترة', value: '-45%', trend: 'down' },
  ],

  performanceMetrics: [
    { label: 'Document signing time', labelAr: 'وقت توقيع المستند', before: '3–5 days (email)', after: '< 1 day (portal)' },
    { label: 'Case status inquiry response', labelAr: 'استجابة استفسار حالة القضية', before: '~1 day (phone/email)', after: 'Self-serve, instant' },
    { label: 'Lighthouse performance', labelAr: 'أداء Lighthouse', before: '57', after: '93' },
  ],

  faqs: [
    { question: 'Can clients see privileged internal case notes?', questionAr: 'هل يمكن للعملاء رؤية ملاحظات القضية الداخلية المشمولة بالامتياز؟', answer: 'No — the portal is permissioned to show only client-safe milestones and documents the firm explicitly shares.', answerAr: 'لا — تُمنح البوابة صلاحيات لعرض فقط المعالم والمستندات الآمنة للعميل التي يشاركها المكتب صراحة.' },
    { question: 'How are documents signed through the portal?', questionAr: 'كيف تُوقَّع المستندات عبر البوابة؟', answer: 'Documents support e-signature directly in the portal, with a full version history so every party can see exactly what was signed and when.', answerAr: 'تدعم المستندات التوقيع الإلكتروني مباشرة داخل البوابة، مع سجل إصدارات كامل بحيث يرى كل طرف بالضبط ما تم توقيعه ومتى.' },
    { question: 'Can clients track billing before the monthly invoice?', questionAr: 'هل يمكن للعملاء متابعة الفوترة قبل الفاتورة الشهرية؟', answer: 'Yes — a running summary of billed hours and expenses is visible in the portal at any time, not just at month-end.', answerAr: 'نعم — يظهر ملخص جارٍ للساعات المفوترة والمصاريف في البوابة في أي وقت، وليس فقط في نهاية الشهر.' },
    { question: 'Is messaging through the portal encrypted?', questionAr: 'هل المراسلة عبر البوابة مشفّرة؟', answer: 'Yes — each case has its own encrypted messaging thread between the client and assigned legal team.', answerAr: 'نعم — لكل قضية محادثة مشفّرة خاصة بها بين العميل وفريق المحاماة المُكلَّف.' },
  ],

  team: [
    { name: 'Beatrice Ngoma', role: 'Product Manager', roleAr: 'مديرة منتج' },
    { name: 'Samuel Roth', role: 'Lead Full-Stack Engineer', roleAr: 'مهندس برمجيات رئيسي' },
    { name: 'Lucia Farrow', role: 'UI/UX Designer', roleAr: 'مصممة واجهات وتجربة مستخدم' },
    { name: 'Youssef Hamdy', role: 'QA & Security Engineer', roleAr: 'مهندس ضمان جودة وأمان' },
  ],

  testimonial: {
    quote: 'Our paralegals got hours back every week, and clients tell us they finally feel like they know what\'s happening with their case instead of waiting for us to call.',
    quoteAr: 'استعاد مساعدونا القانونيون ساعات من وقتهم كل أسبوع، ويخبرنا العملاء أنهم أخيرًا يشعرون بمعرفة ما يجري في قضيتهم بدلاً من انتظار اتصالنا.',
    author: 'Managing Partner', role: 'Managing Partner', roleAr: 'الشريك المدير',
  },

  tags: ['Next.js', 'Node.js', 'PostgreSQL', 'DocuSign API', 'End-to-End Encryption', 'AWS S3', 'Client Portal', 'Legal Tech', 'Document Automation'],
  duration: '11 weeks',
  teamSize: '4 people',

  businessValue: 'Freeing paralegal time from routine status calls let {client} redirect billable hours toward actual case work, while transparent billing reduced disputes and the friction they created in the client relationship.',
  businessValueAr: 'أدى تحرير وقت المساعدين القانونيين من مكالمات الحالة الروتينية إلى إعادة توجيه الساعات القابلة للفوترة نحو العمل الفعلي على القضايا، بينما قلّلت الفوترة الشفافة من النزاعات والاحتكاك الذي كانت تسببه في علاقة العميل.',

  futureImprovements: 'On the roadmap: automated document generation for common filings, a client-facing calendar for upcoming deadlines and hearings, and integration with the firm\'s existing practice management software.',
  futureImprovementsAr: 'في خارطة الطريق: إنشاء مستندات آلي للإيداعات الشائعة، تقويم للعملاء بالمواعيد النهائية وجلسات الاستماع القادمة، وتكامل مع برنامج إدارة الممارسة الحالي للمكتب.',

  highlightStats: [
    { value: '-64%', label: 'Status-check calls', labelAr: 'مكالمات الاستفسار' },
    { value: '76%', label: 'Portal adoption', labelAr: 'تبني البوابة' },
    { value: '93', label: 'Lighthouse score', labelAr: 'نقاط Lighthouse' },
  ],

  gallerySuggestions: [
    { caption: 'Client-facing case status timeline', captionAr: 'الجدول الزمني لحالة القضية للعميل' },
    { caption: 'Secure e-signature document view', captionAr: 'عرض مستند التوقيع الإلكتروني الآمن' },
    { caption: 'Encrypted case messaging thread', captionAr: 'محادثة القضية المشفّرة' },
    { caption: 'Running billing summary screen', captionAr: 'شاشة ملخص الفوترة الجارية' },
  ],

  metaTitle: '{client} Legal Tech Case Study — Secure Client Portal Platform | YANSY Tech',
  metaDescription: 'How we built {client} a secure client portal that cut routine status-check calls by 64% and sped up document signing.',
};
