// Process steps data — Premium edition
// Emoji replaced with clean step numbers, color system preserved

const COLORS = [
  '#2563EB', '#c9a227', '#b8911f', '#a07c18',
  '#8a6810', '#2563EB', '#c9a227', '#b8911f',
];

const BASE_STEPS = [
  {
    num  : '01', color: COLORS[0],
    en   : {
      title : 'Submit Your Request',
      sub   : 'Project inquiry',
      desc  : 'Send us your idea through the project form. We receive your request immediately and a confirmation is sent to you.',
      detail: 'Simple form · 2-hour response · Available 24/7',
    },
    ar   : {
      title : 'إرسال الطلب',
      sub   : 'استفسار المشروع',
      desc  : 'أرسل لنا فكرتك من خلال نموذج المشروع. سنستلم طلبك فوراً ويُرسَل إليك تأكيد.',
      detail: 'نموذج بسيط · استجابة خلال ساعتين · متاح دائماً',
    },
  },
  {
    num  : '02', color: COLORS[1],
    en   : {
      title : 'Request Confirmed',
      sub   : 'Team assignment',
      desc  : 'Our team assigns a dedicated project manager who contacts you within 24 hours to set up an initial call.',
      detail: 'Dedicated PM · Instant confirmation · Priority queue',
    },
    ar   : {
      title : 'استلام وتأكيد الطلب',
      sub   : 'تعيين الفريق',
      desc  : 'يعيّن فريقنا مدير مشروع مخصص يتواصل معك خلال 24 ساعة لترتيب مكالمة أولية.',
      detail: 'مدير مشروع مخصص · تأكيد فوري · قائمة الأولوية',
    },
  },
  {
    num  : '03', color: COLORS[2],
    en   : {
      title : 'Free Consultation',
      sub   : '30-min deep dive',
      desc  : 'A structured 30-minute session where we deeply understand your requirements, goals, and success criteria.',
      detail: 'Video or call · 30 minutes · Completely free',
    },
    ar   : {
      title : 'استشارة مجانية',
      sub   : 'جلسة عمق 30 دقيقة',
      desc  : 'جلسة منظمة 30 دقيقة نفهم فيها متطلباتك وأهدافك ومعايير النجاح بعمق.',
      detail: 'فيديو أو هاتف · 30 دقيقة · مجاناً تماماً',
    },
  },
  {
    num  : '04', color: COLORS[3],
    en   : {
      title : 'Strategic Planning',
      sub   : 'Roadmap creation',
      desc  : 'We prepare a detailed roadmap covering phases, timeline, technology choices, milestones, and measurable success metrics.',
      detail: 'Detailed roadmap · Clear milestones · Technology spec',
    },
    ar   : {
      title : 'التخطيط الاستراتيجي',
      sub   : 'إنشاء خارطة الطريق',
      desc  : 'نُعد خارطة طريق تفصيلية تغطي المراحل والجدول الزمني واختيارات التقنية والمعالم ومقاييس النجاح.',
      detail: 'خارطة طريق مفصلة · معالم واضحة · مواصفات تقنية',
    },
  },
  {
    num  : '05', color: COLORS[4],
    en   : {
      title : 'Agreement & Kickoff',
      sub   : 'Contract signing',
      desc  : 'We sign a clear, transparent contract covering scope, pricing, deadlines, and full IP ownership rights.',
      detail: 'Transparent contract · Legal protection · IP ownership',
    },
    ar   : {
      title : 'الاتفاقية والإطلاق',
      sub   : 'توقيع العقد',
      desc  : 'نوقّع عقد واضح وشفاف يحدد النطاق والأسعار والمواعيد وحقوق الملكية الفكرية الكاملة.',
      detail: 'عقد شفاف · حماية قانونية · ملكية كاملة',
    },
  },
  {
    num  : '06', color: COLORS[5],
    en   : {
      title : 'Active Development',
      sub   : 'Build & iterate',
      desc  : 'We begin actual development with weekly sprint reports and real-time progress tracking through your client dashboard.',
      detail: 'Weekly reports · Dashboard access · Regular demos',
    },
    ar   : {
      title : 'التطوير الفعلي',
      sub   : 'البناء والتكرار',
      desc  : 'نبدأ التطوير الفعلي مع تقارير sprint أسبوعية ومتابعة لحظية عبر لوحة التحكم الخاصة بك.',
      detail: 'تقارير أسبوعية · وصول للوحة التحكم · عروض دورية',
    },
  },
  {
    num  : '07', color: COLORS[6],
    en   : {
      title : 'Review & Refinement',
      sub   : 'QA + revisions',
      desc  : 'Comprehensive quality assurance, three revision rounds, and refinement until full satisfaction — before any final delivery.',
      detail: '3 revision rounds · QA testing · Performance audit',
    },
    ar   : {
      title : 'المراجعة والتحسين',
      sub   : 'ضمان الجودة + تعديلات',
      desc  : 'ضمان جودة شامل وثلاث جولات تعديل وتحسين حتى رضاك التام — قبل أي تسليم نهائي.',
      detail: '3 جولات تعديل · اختبار الجودة · تدقيق الأداء',
    },
  },
  {
    num  : '08', color: COLORS[7],
    en   : {
      title : 'Launch & Support',
      sub   : 'Go live + 30 days',
      desc  : 'We deploy your project to production and provide 30 days of free technical support with performance monitoring.',
      detail: '30-day support · Performance monitoring · Hand-off docs',
    },
    ar   : {
      title : 'الإطلاق والدعم',
      sub   : 'إطلاق + 30 يوم',
      desc  : 'نطلق مشروعك على الخادم ونقدم دعماً فنياً مجانياً لمدة 30 يوماً مع مراقبة الأداء.',
      detail: 'دعم 30 يوماً · مراقبة الأداء · وثائق التسليم',
    },
  },
];

export const getProcessSteps = (isRTL) =>
  BASE_STEPS.map((s) => ({
    num   : s.num,
    color : s.color,
    title : isRTL ? s.ar.title  : s.en.title,
    sub   : isRTL ? s.ar.sub    : s.en.sub,
    desc  : isRTL ? s.ar.desc   : s.en.desc,
    detail: isRTL ? s.ar.detail : s.en.detail,
  }));
