import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import { trackWhatsAppClick } from '../utils/ga4';
import Footer from '../components/Footer';
import AIChatWidget from '../components/AIChatWidget';
import ProjectRequestForm from '../components/ProjectRequestForm';
import Testimonials from '../components/Testimonials';
import FAQ from '../components/FAQ';
import MetricsSection from '../sections/MetricsSection';
import ProcessSection from '../sections/ProcessSection';
import TechSection from '../sections/TechSection';
import ServicesEcosystem from '../components/ServicesEcosystem';
import { useSEO } from '../hooks/useSEO';

/* ─── Service SVG Icons ──────────────────────────────────────────────────── */
const ServiceIcon = ({ num, color, hovered }) => {
  const style = {
    color: hovered ? color : 'rgba(255,255,255,0.28)',
    transition: 'color 0.45s ease',
  };
  const icons = {
    '01': (
      <svg style={style} width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a14.5 14.5 0 010 18M12 3a14.5 14.5 0 000 18M3 12h18" />
      </svg>
    ),
    '02': (
      <svg style={style} width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
    '03': (
      <svg style={style} width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
        <path d="M9 8l-2 3 2 3M15 8l2 3-2 3" />
      </svg>
    ),
    '04': (
      <svg style={style} width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <circle cx="12" cy="17.5" r="0.7" fill="currentColor" strokeWidth="0" />
        <line x1="9" y1="6" x2="15" y2="6" />
      </svg>
    ),
    '05': (
      <svg style={style} width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <circle cx="8" cy="15" r="0.7" fill="currentColor" strokeWidth="0" />
        <circle cx="12" cy="15" r="0.7" fill="currentColor" strokeWidth="0" />
        <circle cx="16" cy="15" r="0.7" fill="currentColor" strokeWidth="0" />
      </svg>
    ),
    '06': (
      <svg style={style} width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
  };
  return icons[num] || null;
};

/* ─── Services data ──────────────────────────────────────────────────────── */
const SERVICES = [
  {
    num: '01', color: '#d4af37', popular: false,
    en: {
      title: 'Websites That Convert', tag: 'Revenue Generation',
      outcome: '+35% more inbound leads',
      desc: 'Your website is your best salesperson — or your worst. We build sites that rank on Google, build trust instantly, and turn visitors into paying clients within seconds.',
      features: [
        'Rank higher on Google and get found by buyers',
        'Load in under 1 second — speed drives conversions',
        'Mobile experience that earns trust on first tap',
        'Track exactly where your leads come from',
        'Update content yourself — no developer needed',
      ],
      cta: 'Get My Website Built',
    },
    ar: {
      title: 'مواقع تحوّل الزوار لعملاء', tag: 'توليد الإيرادات',
      outcome: '+35% طلبات تواصل',
      desc: 'موقعك هو أفضل مندوب مبيعات لديك — أو أسوأهم. نبني مواقع تُصنَّف في جوجل، تبني الثقة فوراً، وتحوّل الزوار لعملاء بعد ثوانٍ.',
      features: [
        'تُصنَّف في جوجل وتصلك الطلبات أوتوماتيكياً',
        'تُحمَّل في أقل من ثانية — السرعة تزيد التحويل',
        'تجربة موبايل تبني الثقة من أول لمسة',
        'تتبع مصادر العملاء الجدد بدقة',
        'تحديث المحتوى بنفسك دون مطور',
      ],
      cta: 'ابنِ موقعي الآن',
    },
  },
  {
    num: '02', color: '#60a5fa', popular: false,
    en: {
      title: 'Stores That Sell 24/7', tag: 'Automated Revenue',
      outcome: '+40% checkout conversion',
      desc: 'Stop leaving money at checkout. We engineer e-commerce experiences that remove friction, build buyer confidence, and make completing a purchase feel effortless — on any device.',
      features: [
        'Checkout flow engineered to reduce cart abandonment',
        'Payments in any currency, on any device',
        'Inventory that updates itself across all channels',
        'Know your best-selling products, not your best-guesses',
        'Scale from 10 to 10,000 orders without breaking',
      ],
      cta: 'Launch My Store',
    },
    ar: {
      title: 'متاجر تبيع على مدار الساعة', tag: 'إيرادات آلية',
      outcome: '+40% إتمام الطلبات',
      desc: 'لا تفقد المبيعات عند الدفع. نهندس تجارب تجارة إلكترونية تُزيل الاحتكاك، تبني ثقة المشتري، وتجعل الشراء فعلاً طبيعياً على أي جهاز.',
      features: [
        'تجربة دفع مُصمَّمة لتقليل التخلي عن السلة',
        'قبول الدفع بأي عملة على أي جهاز',
        'مخزون يتحدث تلقائياً عبر كل القنوات',
        'اعرف منتجاتك الأكثر مبيعاً — بدقة',
        'توسّع من 10 إلى 10,000 طلب دون أعطال',
      ],
      cta: 'أطلق متجري',
    },
  },
  {
    num: '03', color: '#a78bfa', popular: true,
    en: {
      title: 'Launch Your SaaS in Weeks', tag: 'Product Launch',
      outcome: 'MVP live in 6–10 weeks',
      desc: 'Stop waiting to hire a tech team. We become your product engineering partner — handling architecture, auth, billing, and infrastructure so you can focus on users and growth.',
      features: [
        'Working MVP in 6–10 weeks, not 6–10 months',
        'Subscription billing and payments ready from day one',
        'Built to handle 1 user or 100,000 users equally',
        'Your users onboard themselves — no hand-holding needed',
        'Admin control panel to manage everything without code',
      ],
      cta: 'Build My SaaS Product',
    },
    ar: {
      title: 'أطلق منصتك في أسابيع', tag: 'إطلاق المنتج',
      outcome: 'MVP في 6-10 أسابيع',
      desc: 'لا تنتظر لتبني فريق تقني. نصبح شريكك الهندسي — نتولى البنية والمصادقة والفوترة والبنية التحتية حتى تتفرغ للمستخدمين والنمو.',
      features: [
        'MVP يعمل في 6-10 أسابيع، لا 6-10 أشهر',
        'نظام اشتراكات ومدفوعات جاهز من اليوم الأول',
        'يتحمل مستخدماً واحداً أو 100,000 بنفس الكفاءة',
        'تهيئة تلقائية للمستخدمين دون تدخل منك',
        'لوحة تحكم إدارية كاملة بلا كود',
      ],
      cta: 'ابنِ منصتي الآن',
    },
  },
  {
    num: '04', color: '#34d399', popular: false,
    en: {
      title: 'Put Your Business in Every Pocket', tag: 'Mobile Presence',
      outcome: 'iOS + Android, one codebase',
      desc: 'Your customers live on their phones. A mobile app keeps your brand in front of them, drives repeat engagement, and opens revenue channels a website simply cannot.',
      features: [
        'iOS and Android from a single codebase — half the cost',
        'Push notifications that bring customers back',
        'Works offline — no internet, no problem',
        'Faster than a website, stickier than a browser tab',
        'Full submission support for the App Store & Google Play',
      ],
      cta: 'Build My Mobile App',
    },
    ar: {
      title: 'ضع عملك في كل جيب', tag: 'الحضور الموبايل',
      outcome: 'iOS + Android، قاعدة كود واحدة',
      desc: 'عملاؤك يعيشون على هواتفهم. التطبيق يُبقي علامتك أمامهم، يزيد التفاعل، ويفتح قنوات إيرادات لا يستطيع الموقع توفيرها.',
      features: [
        'iOS و Android من كود واحد — نصف التكلفة',
        'إشعارات تُعيد العملاء بشكل تلقائي',
        'يعمل بدون إنترنت — لا توقف أبداً',
        'أسرع وأكثر التصاقاً من أي موقع',
        'دعم كامل لنشر التطبيق على المتاجر',
      ],
      cta: 'ابنِ تطبيقي',
    },
  },
  {
    num: '05', color: '#fb923c', popular: false,
    en: {
      title: 'Stop Losing Bookings to No-Shows', tag: 'Revenue Recovery',
      outcome: 'Up to 80% fewer no-shows',
      desc: 'Every missed appointment is lost revenue. We automate your entire scheduling flow — from online booking to payment to reminders — so your calendar fills itself.',
      features: [
        'Clients book themselves online, 24/7 — no phone needed',
        'Automated reminders cut no-shows by up to 80%',
        'Collect deposits or full payment at booking',
        'Manage multiple staff and locations from one dashboard',
        'Sync with Google Calendar, Outlook, and your existing tools',
      ],
      cta: 'Automate My Bookings',
    },
    ar: {
      title: 'أوقف خسارة الحجوزات للغيابات', tag: 'استرداد الإيرادات',
      outcome: 'تقليل الغيابات 80%',
      desc: 'كل موعد فائت يعني إيراداً ضائعاً. نؤتمت جدولتك بالكامل — من الحجز الإلكتروني إلى الدفع إلى التذكيرات — حتى يمتلئ تقويمك تلقائياً.',
      features: [
        'العملاء يحجزون بأنفسهم أونلاين، 24/7',
        'تذكيرات تلقائية تقلل الغيابات 80%',
        'اجمع الدفعة المقدمة أو كامل المبلغ عند الحجز',
        'إدارة عدة موظفين وفروع من لوحة واحدة',
        'تزامن مع جوجل كالندر وأدواتك الحالية',
      ],
      cta: 'أتمت حجوزاتي',
    },
  },
  {
    num: '06', color: '#f472b6', popular: false,
    en: {
      title: 'Replace Manual Work. Scale Without Chaos.', tag: 'Operations',
      outcome: 'Up to 60% admin time saved',
      desc: 'Spreadsheets and disconnected tools are your biggest hidden cost. We build the custom system that automates your operations — CRM, ERP, internal tools — precisely shaped to how your business works.',
      features: [
        'Eliminate spreadsheets and manual data entry',
        'Every team on one system — no more information silos',
        'Automate approvals, reports, and repetitive workflows',
        'Hire for growth, not to manage more admin',
        'Full data ownership — no vendor lock-in, ever',
      ],
      cta: 'Streamline My Operations',
    },
    ar: {
      title: 'استبدل العمل اليدوي. وسّع دون فوضى.', tag: 'العمليات',
      outcome: 'توفير 60% من وقت الإدارة',
      desc: 'الجداول والأدوات المنفصلة هي أكبر تكلفة خفية لديك. نبني النظام المخصص الذي يؤتمت عملياتك — CRM وERP وأدوات داخلية — مُشكَّل بدقة لطريقة عمل شركتك.',
      features: [
        'تخلص من الجداول والإدخال اليدوي للبيانات',
        'كل الفريق على نظام واحد — لا صوامع معلومات',
        'أتمتة الموافقات والتقارير والمهام المتكررة',
        'وظِّف للنمو، لا لإدارة المزيد من الإدارة',
        'ملكية البيانات الكاملة — لا قيود تقنية أبداً',
      ],
      cta: 'طوِّر عملياتي',
    },
  },
];

/* ─── Trust stats strip ──────────────────────────────────────────────────── */
const TRUST_STATS = [
  { num: '50+', en: 'Products shipped',         ar: 'منتج مُسلَّم' },
  { num: '98%', en: 'Client retention rate',    ar: 'معدل احتفاظ العملاء' },
  { num: '30d', en: 'Average time to launch',   ar: 'متوسط وقت الإطلاق' },
  { num: '24h', en: 'Strategy call guaranteed', ar: 'ضمان رد الاستشارة' },
];

/* ─── Why YANSY data ─────────────────────────────────────────────────────── */
const WHY = [
  {
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.3" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    en: {
      title: 'You own everything.',
      desc: 'After delivery, all source code, IP, and infrastructure transfer to you. No vendor lock-in, no licensing fees, no dependency on us. It is yours.',
    },
    ar: {
      title: 'أنت تمتلك كل شيء.',
      desc: 'بعد التسليم، كل الكود والملكية الفكرية والبنية التحتية تنتقل إليك. لا قيود، لا رسوم ترخيص، لا اعتماد علينا. هو ملكك.',
    },
  },
  {
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.3" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    en: {
      title: 'Scope before you pay.',
      desc: 'We map out your full project — features, timeline, cost — before you commit a single dollar. You know exactly what you\'re getting, in writing.',
    },
    ar: {
      title: 'نحدد النطاق قبل أن تدفع.',
      desc: 'نرسم مشروعك كاملاً — الميزات والجدول الزمني والتكلفة — قبل أن تلتزم بدولار واحد. تعرف بالضبط ما ستحصل عليه، مكتوباً.',
    },
  },
  {
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.3" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    en: {
      title: 'Weekly progress — visible.',
      desc: 'Every week, you see what was built. Real-time access to your project. No "trust us" moments. No vanishing developers. No surprises at delivery.',
    },
    ar: {
      title: 'تقدم أسبوعي — مرئي.',
      desc: 'كل أسبوع، ترى ما بُني. وصول فوري لمشروعك. لا لحظات "ثق بنا". لا مطورون يختفون. لا مفاجآت عند التسليم.',
    },
  },
  {
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.3" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    en: {
      title: '30 days free after launch.',
      desc: 'We stay. Performance monitoring, bug fixes, and adjustments — included for 30 days post-launch. Because shipping is not the end, it\'s the beginning.',
    },
    ar: {
      title: '30 يوماً مجاناً بعد الإطلاق.',
      desc: 'نبقى معك. مراقبة الأداء وإصلاح الأخطاء والتعديلات — مشمولة 30 يوماً بعد الإطلاق. لأن الشحن ليس النهاية، بل البداية.',
    },
  },
];

/* ─── Industries data ────────────────────────────────────────────────────── */
const INDUSTRIES = [
  {
    color: '#34d399',
    en: { label: 'Healthcare & Clinics',    desc: 'Stop losing 30% of bookings to no-shows. We build booking, EMR, and patient management systems that reduce admin by 60%.' },
    ar: { label: 'الرعاية الصحية',           desc: 'أوقف خسارة 30% من حجوزاتك للغيابات. نبني أنظمة حجز وسجلات طبية تقلل الإدارة 60%.' },
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    color: '#60a5fa',
    en: { label: 'E-commerce & Retail',     desc: 'Turn browsers into buyers. Our e-commerce builds average +40% conversion uplift within 90 days of launch.' },
    ar: { label: 'التجارة الإلكترونية',       desc: 'حوّل المتصفحين لمشترين. منصاتنا تحقق +40% زيادة في التحويل خلال 90 يوماً من الإطلاق.' },
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    color: '#a78bfa',
    en: { label: 'SaaS & Technology',       desc: 'Launch your SaaS idea without building an in-house team. We handle the full product — architecture, billing, scaling, and launch.' },
    ar: { label: 'التقنية والبرمجيات',        desc: 'أطلق فكرة SaaS دون بناء فريق داخلي. نتولى المنتج كاملاً — البنية والفوترة والتوسع والإطلاق.' },
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 8l-2 3 2 3M15 8l2 3-2 3" />
      </svg>
    ),
  },
  {
    color: '#fb923c',
    en: { label: 'Food & Hospitality',      desc: 'Fill every table and eliminate double-bookings. Smart reservation systems that manage capacity, reminders, and payments automatically.' },
    ar: { label: 'الأغذية والضيافة',          desc: 'امتلئ كل طاولة وأنهِ الحجوزات المزدوجة. أنظمة حجز ذكية تدير الطاقة والتذكيرات والمدفوعات تلقائياً.' },
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    color: '#d4af37',
    en: { label: 'Real Estate',             desc: 'Close deals faster. Property portals, agent CRMs, and listing platforms that give buyers the experience to decide without a showing.' },
    ar: { label: 'العقارات',                 desc: 'أغلق صفقات أسرع. بوابات عقارية وCRM للوكلاء تمنح المشترين التجربة للقرار دون زيارة.' },
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    color: '#f472b6',
    en: { label: 'Education & E-Learning',  desc: 'Own your platform. Launch an LMS or online academy without revenue sharing, usage limits, or dependency on anyone else\'s infrastructure.' },
    ar: { label: 'التعليم والتدريب',          desc: 'امتلك منصتك. أطلق LMS أو أكاديمية إلكترونية دون مشاركة إيرادات أو قيود أو اعتماد على بنية تحتية لأحد.' },
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
    ),
  },
];

/* ─── SectionEyebrow — reusable eyebrow row ─────────────────────────────── */
/* Always starts from the correct edge: right in RTL, left in LTR */
const SectionEyebrow = ({ label, isRTL }) => (
  <div className={`flex items-center gap-4 mb-5 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
    <span
      className={`block w-10 h-px flex-shrink-0 ${isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-[#d4af37] to-transparent`}
      aria-hidden="true"
    />
    <p className="text-[10px] tracking-[0.38em] text-[#d4af37]/55 uppercase font-light whitespace-nowrap">
      {label}
    </p>
  </div>
);

/* ─── ServiceCard ────────────────────────────────────────────────────────── */
const ServiceCard = ({ s, isRTL, onStartProject }) => {
  const [hovered, setHovered] = useState(false);
  const content = isRTL ? s.ar : s.en;

  return (
    <div
      className="relative flex flex-col transition-all duration-500 overflow-hidden group"
      style={{
        borderTop: `1.5px solid ${hovered ? s.color : 'rgba(255,255,255,0.07)'}`,
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: hovered ? `linear-gradient(145deg, ${s.color}06 0%, transparent 60%)` : 'transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Watermark number */}
      <div
        aria-hidden="true"
        className="absolute bottom-3 pointer-events-none select-none leading-none"
        style={{
          fontFamily: "'Inter',system-ui,sans-serif",
          fontSize: 'clamp(4rem, 8vw, 6rem)',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          color: s.color,
          opacity: hovered ? 0.08 : 0.035,
          transition: 'opacity 0.5s ease',
          /* In RTL the watermark goes to the left edge; in LTR to the right */
          right: isRTL ? 'auto' : '1rem',
          left: isRTL ? '1rem' : 'auto',
        }}
      >
        {s.num}
      </div>

      <div className="relative z-10 p-7 sm:p-9 flex flex-col flex-1">
        {/* Header row — icon always on the outer edge */}
        <div className={`flex items-start gap-4 mb-5 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex-1 min-w-0">
            {/* Tag + popular badge */}
            <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <p className="text-[9px] tracking-[0.3em] uppercase font-light" style={{ color: `${s.color}70` }}>
                {content.tag}
              </p>
              {s.popular && (
                <span
                  className="text-[8px] tracking-[0.2em] uppercase px-2 py-0.5 font-medium"
                  style={{
                    background: `${s.color}18`,
                    color: s.color,
                    border: `1px solid ${s.color}35`,
                  }}
                >
                  {isRTL ? 'الأكثر طلباً' : 'Most Requested'}
                </span>
              )}
            </div>
            {/* Title — always aligned to the reading start edge */}
            <h3
              className={`text-xl sm:text-[1.375rem] font-semibold leading-tight ${isRTL ? 'text-right' : 'text-left'}`}
              style={{
                letterSpacing: isRTL ? '0' : '-0.015em',
                color: hovered ? s.color : 'rgba(255,255,255,0.92)',
                transition: 'color 0.4s ease',
              }}
            >
              {content.title}
            </h3>
          </div>
          {/* Icon box */}
          <div
            className="flex-shrink-0 mt-1 w-10 h-10 flex items-center justify-center transition-all duration-500"
            style={{
              background: hovered ? `${s.color}12` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${hovered ? `${s.color}35` : 'rgba(255,255,255,0.07)'}`,
            }}
          >
            <ServiceIcon num={s.num} color={s.color} hovered={hovered} />
          </div>
        </div>

        {/* Outcome badge — anchored to reading-start edge */}
        {content.outcome && (
          <div
            className={`inline-flex items-center gap-2 mb-4 px-3 py-1.5 ${isRTL ? 'self-end flex-row-reverse' : 'self-start'}`}
            style={{ background: `${s.color}12`, border: `1px solid ${s.color}30` }}
          >
            <span
              style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, flexShrink: 0 }}
              aria-hidden
            />
            <span className="text-[10px] font-medium tracking-wide" style={{ color: s.color }}>
              {content.outcome}
            </span>
          </div>
        )}

        {/* Description */}
        <p
          className={`text-sm font-normal leading-relaxed mb-7 ${isRTL ? 'text-right' : 'text-left'}`}
          style={{ color: 'rgba(255,255,255,0.65)' }}
        >
          {content.desc}
        </p>

        {/* Divider */}
        <div
          className="mb-6 h-px"
          style={{
            background: hovered
              ? `linear-gradient(${isRTL ? 'to left' : 'to right'}, ${s.color}30, transparent)`
              : 'rgba(255,255,255,0.06)',
          }}
        />

        {/* Features list */}
        <ul className={`space-y-2.5 mb-8 flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
          {content.features.map((f, i) => (
            <li
              key={i}
              className={`flex items-start gap-3 text-xs font-normal ${isRTL ? 'flex-row-reverse' : ''}`}
              style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.55 }}
            >
              <svg
                className="flex-shrink-0 mt-0.5"
                width="12" height="12" viewBox="0 0 12 12" fill="none"
                aria-hidden
              >
                <circle cx="6" cy="6" r="5" stroke={s.color} strokeOpacity="0.4" />
                <path d="M3.5 6l1.75 1.75L8.5 4.25" stroke={s.color} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {f}
            </li>
          ))}
        </ul>

        {/* CTA button — anchored to reading-start edge */}
        <button
          onClick={onStartProject}
          className={`mt-auto group/btn relative overflow-hidden inline-flex items-center gap-2.5 px-5 py-3 text-xs font-light tracking-[0.12em] uppercase transition-all duration-400 ${isRTL ? 'flex-row-reverse self-end' : 'self-start'}`}
          style={{
            border: `1px solid ${hovered ? s.color : `${s.color}35`}`,
            color: s.color,
            background: hovered ? `${s.color}10` : 'transparent',
          }}
          aria-label={`${content.cta} - ${content.title}`}
        >
          <span
            className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${s.color}15, transparent)` }}
          />
          <span className="relative">{content.cta}</span>
          <svg
            className={`relative w-3.5 h-3.5 transition-transform duration-300 ${isRTL ? 'rotate-180 group-hover/btn:-translate-x-0.5' : 'group-hover/btn:translate-x-0.5'}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  );
};

/* ─── IndustryCard ───────────────────────────────────────────────────────── */
const IndustryCard = ({ ind, isRTL }) => {
  const [hovered, setHovered] = useState(false);
  const content = isRTL ? ind.ar : ind.en;
  return (
    <div
      className={`group relative flex items-start gap-4 p-5 sm:p-6 transition-all duration-400 cursor-default ${isRTL ? 'flex-row-reverse text-right' : ''}`}
      style={{
        border: `1px solid ${hovered ? `${ind.color}30` : 'rgba(255,255,255,0.06)'}`,
        background: hovered ? `${ind.color}05` : 'rgba(255,255,255,0.015)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="flex-shrink-0 w-9 h-9 flex items-center justify-center mt-0.5 transition-all duration-400"
        style={{
          background: hovered ? `${ind.color}15` : 'rgba(255,255,255,0.04)',
          border: `1px solid ${hovered ? `${ind.color}35` : 'rgba(255,255,255,0.08)'}`,
          color: hovered ? ind.color : 'rgba(255,255,255,0.3)',
        }}
      >
        {ind.icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3
          className="text-sm font-semibold mb-1.5 transition-colors duration-300"
          style={{ letterSpacing: '-0.01em', color: hovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.82)' }}
        >
          {content.label}
        </h3>
        <p className="text-xs font-normal leading-relaxed" style={{ color: 'rgba(255,255,255,0.48)' }}>
          {content.desc}
        </p>
      </div>
    </div>
  );
};

/* ─── Main page ──────────────────────────────────────────────────────────── */
const Services = () => {
  const { isRTL, dir } = useLanguage();
  const user           = useSelector(s => s.auth?.user);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const processSectionRef = useRef(null);
  const processRef        = useRef([]);
  const techSectionRef    = useRef(null);
  const techCardsRef      = useRef([]);

  useSEO({
    title      : isRTL ? 'خدماتنا | يانسي تك' : 'Services | YANSY TECH',
    description: isRTL
      ? 'نبني مواقع وتطبيقات ومنصات SaaS وأنظمة حجز وأنظمة مؤسسية احترافية. استشارة مجانية خلال 24 ساعة.'
      : 'Website development, e-commerce stores, SaaS platforms, mobile apps, booking systems, and enterprise software — built by YANSY TECH to world-class standards. Free consultation.',
    keywords   : isRTL
      ? 'خدمات تطوير مواقع, تطوير متاجر إلكترونية, تطوير SaaS, تطبيقات الجوال, أنظمة الحجز'
      : 'website development services, e-commerce development, SaaS platform development, mobile app development, booking system, enterprise software, web agency',
    canonical  : 'https://yansytech.com/services',
    ogLocale   : isRTL ? 'ar_SA' : 'en_US',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': 'https://yansytech.com/services#webpage',
      'url': 'https://yansytech.com/services',
      'name': 'Services | YANSY TECH',
      'description': 'Digital product development services by YANSY TECH.',
      'isPartOf': { '@id': 'https://yansytech.com/#website' },
      'about': { '@id': 'https://yansytech.com/#organization' },
      'breadcrumb': {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://yansytech.com/' },
          { '@type': 'ListItem', 'position': 2, 'name': 'Services', 'item': 'https://yansytech.com/services' },
        ],
      },
    },
  });

  const open  = () => setIsFormOpen(true);
  const close = () => setIsFormOpen(false);

  return (
    <div className="bg-black text-white min-h-screen overflow-x-hidden" dir={dir}>
      <Header onStartProject={open} />

      {/* ══════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════ */}
      <section
        className="relative pt-40 pb-28 px-4 sm:px-8 overflow-hidden"
        aria-label={isRTL ? 'خدماتنا' : 'Our services hero'}
      >
        {/* Grid texture */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, opacity: 0.016, pointerEvents: 'none',
            backgroundImage: 'linear-gradient(rgba(212,175,55,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(212,175,55,0.8) 1px,transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />
        {/* Primary ambient glow */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', top: '30%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 800, height: 500, borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(212,175,55,0.07) 0%, transparent 65%)',
            pointerEvents: 'none', filter: 'blur(40px)',
          }}
        />
        {/* Secondary accent glow */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', bottom: 0,
            right: isRTL ? 'auto' : 0,
            left: isRTL ? 0 : 'auto',
            width: 400, height: 400,
            background: 'radial-gradient(circle, rgba(167,139,250,0.04) 0%, transparent 70%)',
            pointerEvents: 'none', filter: 'blur(60px)',
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

            {/* ── Copy ── */}
            <div className={isRTL ? 'text-right' : ''}>
              {/* Eyebrow */}
              <div className={`flex items-center gap-4 mb-7 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                <span
                  className={`block w-10 h-px flex-shrink-0 ${isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-[#d4af37] to-transparent`}
                  aria-hidden="true"
                />
                <p className="text-[10px] tracking-[0.12em] text-[#d4af37]/65 uppercase font-medium">
                  {isRTL ? 'نتائج قابلة للقياس' : 'Measurable outcomes'}
                </p>
              </div>

              {/* Main heading */}
              <h1
                className={`font-bold mb-6 ${isRTL ? 'text-right' : 'text-left tracking-tight'}`}
                style={{
                  fontSize  : 'clamp(2.25rem, 5.5vw, 5.5rem)',
                  letterSpacing: isRTL ? '0' : '-0.03em',
                  lineHeight: isRTL ? 1.3 : 1.06,
                }}
              >
                {isRTL ? (
                  <>
                    توقف عن بناء التقنية.
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-l from-[#d4af37] to-white/80">
                      ابدأ ببناء الإيرادات.
                    </span>
                  </>
                ) : (
                  <>
                    Stop building technology.
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-white/80">
                      Start building revenue.
                    </span>
                  </>
                )}
              </h1>

              {/* Subheading */}
              <p
                className={`text-white/68 font-normal text-base sm:text-lg leading-relaxed mb-10 ${isRTL ? 'text-right' : 'text-left'}`}
              >
                {isRTL
                  ? 'كل منتج نبنيه مصمم لحل مشكلة تجارية حقيقية — زيادة الإيرادات، تقليل التكاليف، أو القضاء على العمل اليدوي.'
                  : "Every product we build is designed to solve a real business problem — more revenue, lower costs, or eliminating manual work that's holding you back."}
              </p>

              {/* CTA buttons */}
              <div className={`flex flex-wrap items-center gap-4 mb-12 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                <button
                  onClick={open}
                  className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[#d4af37] text-black text-xs font-semibold tracking-[0.08em] uppercase hover:bg-white transition-all duration-400 overflow-hidden active:scale-[0.98]"
                >
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                  <span className="relative">{isRTL ? 'احجز استشارة مجانية' : 'Get Free Strategy Call'}</span>
                  <svg
                    className={`relative w-4 h-4 transition-transform duration-300 ${isRTL ? 'rotate-180 group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <Link
                  to="/portfolio"
                  className={`group inline-flex items-center gap-3 px-8 py-4 border border-white/12 text-white/55 text-xs font-medium tracking-[0.08em] uppercase hover:border-[#d4af37]/40 hover:text-[#d4af37] transition-all duration-400 ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  {isRTL ? 'شاهد نتائجنا' : 'See proven results'}
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-300 ${isRTL ? 'rotate-180 group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>

              {/* Trust stats strip */}
              <div className={`flex flex-wrap items-center gap-x-7 gap-y-3 pt-8 border-t border-white/[0.06] ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                {TRUST_STATS.map((stat, i) => (
                  <div key={i} className={`flex items-center gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span
                      className="font-bold tabular-nums"
                      style={{ fontSize: 'clamp(1.125rem, 1.8vw, 1.375rem)', color: '#d4af37', letterSpacing: '-0.025em' }}
                    >
                      {stat.num}
                    </span>
                    <span className="text-xs font-normal text-white/50 leading-tight max-w-[100px]">
                      {isRTL ? stat.ar : stat.en}
                    </span>
                    {i < TRUST_STATS.length - 1 && (
                      <span aria-hidden="true" className="hidden sm:block w-px h-4 bg-white/10 ms-4" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Digital Ecosystem visual ── */}
            <div className="hidden lg:flex items-center justify-center">
              <ServicesEcosystem />
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SERVICES GRID
      ══════════════════════════════════════════════════════════════ */}
      <section
        className="relative px-4 sm:px-8 py-20 sm:py-28"
        aria-label={isRTL ? 'قائمة الخدمات' : 'Our services list'}
      >
        <div className={`max-w-7xl mx-auto mb-12 ${isRTL ? 'text-right' : ''}`}>
          {/* ── Eyebrow — always reading-edge aligned ── */}
          <SectionEyebrow label={isRTL ? 'خدماتنا' : 'Our Services'} isRTL={isRTL} />

          {/* ── Heading row ── */}
<div className={isRTL ? 'text-right ml-auto' : ''}>
            <h2
              className={`text-2xl sm:text-4xl font-semibold leading-[1.1] ${isRTL ? 'text-right' : 'text-left tracking-tight'}`}
              style={{ letterSpacing: isRTL ? '0' : '-0.02em' }}
            >
              {isRTL ? 'ستة حلول.' : 'Six solutions.'}
              <br />
              <span className={`text-transparent bg-clip-text ${isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-[#d4af37] to-white/70`}>
                {isRTL ? 'كل واحد يحل مشكلة حقيقية.' : 'Each one solves a real problem.'}
              </span>
            </h2>
            <p className={`text-sm font-normal text-white/60 max-w-xs leading-relaxed ${isRTL ? 'text-right sm:text-right' : 'text-left'}`}>
              {isRTL
                ? 'اختر ما تحتاج بناءه. نتولى كل شيء — الاستراتيجية والتصميم والهندسة والتسليم.'
                : 'Choose what you need built. We handle everything — strategy, design, engineering, and delivery.'}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-white/[0.045]">
            {SERVICES.map((s) => (
              <div key={s.num} className="bg-black">
                <ServiceCard s={s} isRTL={isRTL} onStartProject={open} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          RESULTS & METRICS
      ══════════════════════════════════════════════════════════════ */}
      <MetricsSection isRTL={isRTL} onStartProject={open} />

      {/* ══════════════════════════════════════════════════════════════
          PROCESS
      ══════════════════════════════════════════════════════════════ */}
      <ProcessSection
        sectionRef={processSectionRef}
        processRef={processRef}
        isRTL={isRTL}
        onStartProject={open}
      />

      {/* ══════════════════════════════════════════════════════════════
          WHY YANSY
      ══════════════════════════════════════════════════════════════ */}
      <section
        className="relative px-4 sm:px-8 py-20 sm:py-32 overflow-hidden"
        aria-label={isRTL ? 'لماذا تختارنا' : 'Why choose YANSY'}
        style={{ background: 'linear-gradient(180deg, #000 0%, #050402 50%, #000 100%)' }}
      >
        {/* Ambient grid */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage: 'linear-gradient(rgba(212,175,55,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(212,175,55,0.6) 1px,transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[40vw] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(212,175,55,0.04) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className={`mb-16 ${isRTL ? 'text-right' : ''}`}>
            <SectionEyebrow label={isRTL ? 'لماذا تختارنا' : 'Why clients choose us'} isRTL={isRTL} />
            <h2
              className={`text-2xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] ${isRTL ? 'text-right' : 'text-left tracking-tight'}`}
              style={{ letterSpacing: isRTL ? '0' : '-0.02em' }}
            >
              {isRTL ? 'الفرق الذي يهم.' : 'The difference that matters.'}
              <br />
              <span className={`text-transparent bg-clip-text ${isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-[#d4af37] to-white/70`}>
                {isRTL ? 'قبل أن تدفع أي شيء.' : 'Before you pay a dollar.'}
              </span>
            </h2>
            <p className={`text-sm font-normal text-white/55 max-w-xl leading-relaxed mt-5 ${isRTL ? 'text-right' : 'text-left'}`}>
              {isRTL
                ? 'معظم الشركات تخسر أموالها مع شركات تطوير بسبب نطاق غير محدد، وعدم شفافية، وتسليم متأخر. نبني بشكل مختلف.'
                : "Most businesses lose money with dev agencies due to undefined scope, zero visibility, and late delivery. We're built differently."}
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.04]">
            {WHY.map((w, i) => (
              <div key={i} className="bg-black group/why">
                <div
                  className={`relative p-7 sm:p-8 h-full flex flex-col transition-all duration-500 overflow-hidden ${isRTL ? 'text-right' : ''}`}
                  style={{ borderTop: '1.5px solid rgba(255,255,255,0.07)' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderTopColor = 'rgba(212,175,55,0.5)';
                    e.currentTarget.style.background = 'rgba(212,175,55,0.025)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderTopColor = 'rgba(255,255,255,0.07)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Icon */}
                  <div
                    className={`flex items-center justify-center w-9 h-9 mb-5 transition-all duration-400 ${isRTL ? 'self-end' : 'self-start'}`}
                    style={{
                      background: 'rgba(212,175,55,0.08)',
                      border: '1px solid rgba(212,175,55,0.18)',
                      color: 'rgba(212,175,55,0.7)',
                    }}
                  >
                    {w.icon}
                  </div>
                  <h3
                    className={`text-base font-semibold text-white mb-3 leading-snug ${isRTL ? 'text-right' : 'text-left'}`}
                    style={{ letterSpacing: '-0.01em' }}
                  >
                    {isRTL ? w.ar.title : w.en.title}
                  </h3>
                  <p
                    className={`text-sm font-normal leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}
                    style={{ color: 'rgba(255,255,255,0.55)' }}
                  >
                    {isRTL ? w.ar.desc : w.en.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          INDUSTRIES WE SERVE
      ══════════════════════════════════════════════════════════════ */}
      <section
        className="relative px-4 sm:px-8 py-20 sm:py-32 overflow-hidden bg-black"
        aria-label={isRTL ? 'القطاعات التي نخدمها' : 'Industries we serve'}
      >
        <div className="max-w-7xl mx-auto">
          {/* ── Section header — fully RTL-aware ── */}
          <div className={`mb-12 ${isRTL ? 'text-right' : ''}`}>
            <SectionEyebrow label={isRTL ? 'القطاعات' : 'Industries'} isRTL={isRTL} />

            <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-6 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
              <h2
                className={`text-2xl sm:text-4xl font-semibold leading-[1.1] ${isRTL ? 'text-right' : 'text-left tracking-tight'}`}
                style={{ letterSpacing: isRTL ? '0' : '-0.02em' }}
              >
                {isRTL ? 'نفهم مشاكل' : 'We know your'}
                <br />
                <span className={`text-transparent bg-clip-text ${isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-[#d4af37] to-white/70`}>
                  {isRTL ? 'قطاعك بدقة.' : "industry's problems."}
                </span>
              </h2>
              <p className={`text-sm font-normal text-white/60 max-w-xs leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}>
                {isRTL
                  ? 'لكل قطاع مشاكله الخاصة. نجيب عليها بحلول مبنية من التجربة الحقيقية — لا من القوالب.'
                  : 'Every industry has specific problems. We solve them with solutions built from real experience — not templates.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.04]">
            {INDUSTRIES.map((ind, i) => (
              <div key={i} className="bg-black">
                <IndustryCard ind={ind} isRTL={isRTL} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════════════ */}
      <Testimonials isRTL={isRTL} />

      {/* ══════════════════════════════════════════════════════════════
          TECH STACK
      ══════════════════════════════════════════════════════════════ */}
      <TechSection
        sectionRef={techSectionRef}
        techCardsRef={techCardsRef}
        isRTL={isRTL}
      />

      {/* ══════════════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════════════ */}
      <FAQ onStartProject={open} />

      {/* ══════════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════════ */}
      <section
        className="relative px-4 sm:px-8 py-24 sm:py-40 overflow-hidden"
        aria-label={isRTL ? 'ابدأ مشروعك' : 'Start your project'}
      >
        {/* Top divider */}
        <div aria-hidden="true" className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

        {/* Ambient glows */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 700, height: 300, borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(212,175,55,0.07) 0%, transparent 70%)',
            pointerEvents: 'none', filter: 'blur(60px)',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', bottom: 0, left: '20%',
            width: 300, height: 300,
            background: 'radial-gradient(circle, rgba(167,139,250,0.04) 0%, transparent 70%)',
            pointerEvents: 'none', filter: 'blur(80px)',
          }}
        />

        <div className={`max-w-4xl mx-auto relative z-10 ${isRTL ? 'text-right' : 'text-center'}`}>
          {/* Eyebrow */}
          <p className={`text-[10px] tracking-[0.12em] text-[#d4af37]/65 uppercase mb-7 font-medium ${isRTL ? 'text-right' : 'text-center'}`}>
            {isRTL ? 'الخطوة الأولى مجانية' : 'The first step costs nothing'}
          </p>

          {/* Heading */}
          <h2
            className={`font-bold mb-6 ${isRTL ? 'text-right' : 'text-center tracking-tight'}`}
            style={{
              fontSize     : 'clamp(2rem, 5vw, 4rem)',
              letterSpacing: isRTL ? '0' : '-0.03em',
              lineHeight   : isRTL ? 1.35 : 1.06,
            }}
          >
            {isRTL ? (
              <>جاهز لبناء شيء<br /><span className="text-[#d4af37]">يُحقق نتائج حقيقية؟</span></>
            ) : (
              <>Ready to build something<br /><span className="text-[#d4af37]">that actually works?</span></>
            )}
          </h2>

          {/* Subtext */}
          <p className={`text-white/60 font-normal text-base sm:text-lg mb-4 max-w-lg leading-relaxed ${isRTL ? 'text-right mr-0 ml-auto' : 'text-center mx-auto'}`}>
            {isRTL
              ? 'في 30 دقيقة، نحدد نطاق مشروعك ونعطيك جدولاً زمنياً واقعياً وعرض سعر صادق — بدون عروض تسويقية.'
              : "In 30 minutes, we'll scope your project, give you a realistic timeline, and an honest quote. No sales pitch."}
          </p>

          {/* Trust micro-copy */}
          <div className={`flex items-center flex-wrap gap-4 mb-12 ${isRTL ? 'justify-end flex-row-reverse' : 'justify-center'}`}>
            {[
              { en: 'Free 30-min strategy call',  ar: 'مكالمة استراتيجية مجانية 30 دقيقة' },
              { en: 'Scope document included',     ar: 'وثيقة النطاق مشمولة' },
              { en: 'Reply within 24 hours',       ar: 'رد خلال 24 ساعة' },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <circle cx="6" cy="6" r="5" stroke="rgba(212,175,55,0.4)" />
                  <path d="M3.5 6l1.75 1.75L8.5 4.25" stroke="#d4af37" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xs font-normal text-white/45">{isRTL ? item.ar : item.en}</span>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className={`flex flex-col sm:flex-row items-center gap-4 ${isRTL ? 'sm:flex-row-reverse justify-end' : 'justify-center'}`}>
            {/* Primary */}
            <button
              onClick={open}
              className="group relative inline-flex items-center gap-3 px-10 py-4 bg-[#d4af37] text-black text-xs font-semibold tracking-[0.08em] uppercase hover:bg-white transition-all duration-400 overflow-hidden active:scale-[0.98] w-full sm:w-auto justify-center"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <span className="relative">{isRTL ? 'احجز مكالمة الاستراتيجية' : 'Book Your Free Strategy Call'}</span>
            </button>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/201090385390?text=${encodeURIComponent(isRTL ? 'مرحباً! أريد الاستفسار عن خدماتكم.' : "Hi! I'd like to know more about your services.")}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackWhatsAppClick('services-page')}
              className={`group inline-flex items-center gap-3 px-8 py-4 border border-[#25d366]/28 text-[#25d366]/75 text-xs font-light tracking-[0.18em] uppercase hover:bg-[#25d366]/08 hover:border-[#25d366]/55 hover:text-[#25d366] transition-all duration-400 w-full sm:w-auto justify-center ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {isRTL ? 'واتساب' : 'WhatsApp'}
            </a>

            {/* Portfolio link */}
            <Link
              to="/portfolio"
              className={`group inline-flex items-center gap-2 px-6 py-4 text-white/30 text-xs font-light tracking-[0.18em] uppercase hover:text-white/60 transition-colors duration-400 w-full sm:w-auto justify-center ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {isRTL ? 'مشاهدة الأعمال' : 'View portfolio'}
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-300 ${isRTL ? 'rotate-180 group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <AIChatWidget isRTL={isRTL} onStartProject={open} user={user} />
      <ProjectRequestForm isOpen={isFormOpen} onClose={close} />
    </div>
  );
};

export default Services;