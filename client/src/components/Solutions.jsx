import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';

/* ── Clean SVG icons for each solution (no emoji) ── */
const SolutionIcons = {
  erp: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  crm: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  ecommerce: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  saas: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  booking: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  medical: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  edu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  ),
};

// ── Solution Item ──────────────────────────────────────────────────────────────
const SolutionItem = ({ sol, isOpen, onToggle, isRTL, onStartProject }) => {
  const isActive = isOpen;

  return (
    <div
      className="border-t border-white/[0.06] last:border-b"
      style={{ borderColor: isActive ? `${sol.color}20` : undefined }}
    >
      {/* Row header — ✅ accessible button with aria */}
      <button
        className={`w-full flex items-center gap-6 py-7 sm:py-9 group transition-all duration-500 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
        onClick={onToggle}
        aria-expanded={isActive}
        aria-controls={`solution-panel-${sol.id}`}
        id={`solution-btn-${sol.id}`}
      >
        <span
          className="text-xs font-light tracking-widest transition-colors duration-300 flex-shrink-0 w-6"
          style={{ color: isActive ? sol.color : 'rgba(255,255,255,0.2)' }}
          aria-hidden="true"
        >
          {sol.num}
        </span>

        <span
          className="flex-shrink-0 transition-all duration-500"
          style={{
            color    : isActive ? sol.color : 'rgba(255,255,255,0.3)',
            transform: isActive ? 'scale(1.08)' : 'scale(1)',
          }}
          aria-hidden="true"
        >
          {SolutionIcons[sol.id] || (
            <span style={{ fontSize: 22 }}>{sol.icon}</span>
          )}
        </span>

        <div className={`flex-1 flex items-baseline gap-4 min-w-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h3
            className="transition-all duration-500 flex-shrink-0"
            style={{
              fontFamily   : isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
              fontWeight   : 600,
              fontSize     : 'clamp(1.25rem, 2.5vw, 2.5rem)',
              letterSpacing: isRTL ? '0' : '-0.025em',
              lineHeight   : isRTL ? 1.4 : 1.2,
              color: isActive ? sol.color : 'rgba(255,255,255,0.88)',
            }}
          >
            {isRTL ? sol.titleAR : sol.titleEN}
          </h3>
          <span
            className="text-xs tracking-widest uppercase hidden sm:inline transition-all duration-500"
            style={{ color: isActive ? `${sol.color}80` : 'rgba(255,255,255,0.2)' }}
          >
            {isRTL ? sol.tagAR : sol.tagEN}
          </span>
        </div>

        <p
          className="hidden lg:block text-sm font-light text-white/30 max-w-xs flex-shrink-0 transition-all duration-500"
          style={{ opacity: isActive ? 0 : 1 }}
          aria-hidden="true"
        >
          {isRTL ? sol.shortAR : sol.shortEN}
        </p>

        {/* Toggle icon */}
        <div
          className="flex-shrink-0 w-8 h-8 border flex items-center justify-center transition-all duration-500"
          style={{
            borderColor: isActive ? sol.color : 'rgba(255,255,255,0.1)',
            backgroundColor: isActive ? `${sol.color}10` : 'transparent',
            transform: isActive ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
          aria-hidden="true"
        >
          <svg className="w-3 h-3" fill="none" stroke={isActive ? sol.color : 'rgba(255,255,255,0.4)'} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </button>

      {/* ✅ Expanded content with correct aria attributes */}
      <div
        id={`solution-panel-${sol.id}`}
        role="region"
        aria-labelledby={`solution-btn-${sol.id}`}
        className="overflow-hidden transition-all duration-700 ease-in-out"
        style={{ maxHeight: isActive ? '600px' : '0px' }}
      >
        <div className={`pb-10 sm:pb-16 grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 ${isRTL ? 'rtl' : ''}`}>

          {/* ps-14 = padding-inline-start — logical property that auto-flips with dir */}
          <div className="ps-14 sm:ps-16">
            <div className="mb-8">
              <p className="text-[10px] tracking-[0.35em] uppercase mb-3" style={{ color: sol.color }}>
                {isRTL ? 'ما هو؟' : 'What is it?'}
              </p>
              <p className="text-base sm:text-lg font-light text-white/60 leading-relaxed">
                {isRTL ? sol.whatAR : sol.whatEN}
              </p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.35em] uppercase mb-3" style={{ color: sol.color }}>
                {isRTL ? 'لماذا تحتاجه؟' : 'Why do you need it?'}
              </p>
              <p className="text-base sm:text-lg font-light text-white/60 leading-relaxed">
                {isRTL ? sol.whyAR : sol.whyEN}
              </p>
            </div>
          </div>

          <div>
            <p className="text-[10px] tracking-[0.35em] uppercase mb-5" style={{ color: sol.color }}>
              {isRTL ? 'ما يشمله' : "What's included"}
            </p>
            <div className="space-y-3 mb-10">
              {(isRTL ? sol.featuresAR : sol.features).map((f, fi) => (
                <div
                  key={fi}
                  className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}
                  style={{
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? 'translateX(0)' : `translateX(${isRTL ? '20px' : '-20px'})`,
                    transition: `all 0.4s ${0.1 + fi * 0.07}s`,
                  }}
                >
                  <span
                    className="w-1 h-1 rounded-full flex-shrink-0"
                    style={{ backgroundColor: sol.color }}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-light text-white/55 tracking-wide">{f}</span>
                </div>
              ))}
            </div>

            <button
              onClick={onStartProject}
              className="group relative inline-flex items-center gap-3 px-7 py-3 border text-xs font-light tracking-widest uppercase transition-all duration-500"
              style={{ borderColor: `${sol.color}40`, color: sol.color }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${sol.color}15`; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <span>{isRTL ? 'ابدأ مشروعك' : 'Start This Project'}</span>
              <svg
                className={`w-3 h-3 transition-transform duration-300 ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────────────────────
const Solutions = ({ onStartProject }) => {
  const { t }       = useTranslation();
  const { isRTL }   = useLanguage();
  const [openSolution, setOpenSolution] = useState(null);

  const solutions = [
    {
      id: 'erp', num: '01', icon: '⚙️',
      titleEN: 'ERP Systems',           titleAR: 'أنظمة ERP',
      tagEN: 'Enterprise Resource Planning', tagAR: 'تخطيط موارد المؤسسات',
      shortEN: 'The operating system of your business.',
      shortAR: 'نظام التشغيل الأساسي لعملك.',
      whatEN: 'ERP connects all your business operations — finance, HR, inventory, procurement — into one intelligent platform.',
      whatAR: 'نظام ERP يربط جميع عمليات شركتك — المالية والموارد البشرية والمخزون والمشتريات — في منصة واحدة متكاملة.',
      whyEN: 'Without ERP, teams work in silos. Data gets duplicated, decisions are delayed, and scaling becomes chaotic.',
      whyAR: 'بدون ERP تعمل الفرق بشكل منفصل. تتكرر البيانات، وتتأخر القرارات، ويصبح النمو فوضوياً.',
      features:   ['Finance & Accounting', 'HR & Payroll', 'Inventory Management', 'Procurement', 'Real-time Reporting'],
      featuresAR: ['المالية والمحاسبة', 'الموارد البشرية والرواتب', 'إدارة المخزون', 'المشتريات', 'تقارير فورية'],
      color: '#d4af37',
    },
    {
      id: 'crm', num: '02', icon: '🤝',
      titleEN: 'CRM Systems',           titleAR: 'أنظمة CRM',
      tagEN: 'Customer Relationship Management', tagAR: 'إدارة علاقات العملاء',
      shortEN: 'Never lose a lead. Never forget a client.',
      shortAR: 'لا تخسر عميلاً محتملاً. لا تنسَ عميلاً حالياً.',
      whatEN: 'CRM tracks every interaction with your customers — from first contact to closed deal and beyond.',
      whatAR: 'نظام CRM يتتبع كل تفاعل مع عملائك — من أول تواصل حتى إغلاق الصفقة وما بعدها.',
      whyEN: 'Most businesses lose 20–30% of potential revenue from poor follow-up. CRM automates that so no opportunity falls through.',
      whyAR: 'معظم الشركات تخسر 20-30٪ من إيراداتها بسبب ضعف المتابعة. CRM يؤتمت ذلك فلا تضيع أي فرصة.',
      features:   ['Lead Pipeline', 'Client History', 'Automated Follow-ups', 'Sales Analytics', 'Team Collaboration'],
      featuresAR: ['خط أنابيب العملاء', 'سجل العميل', 'متابعة تلقائية', 'تحليلات المبيعات', 'تعاون الفريق'],
      color: '#c9a227',
    },
    {
      id: 'ecommerce', num: '03', icon: '🛒',
      titleEN: 'E-commerce Platforms',   titleAR: 'منصات التجارة الإلكترونية',
      tagEN: 'High-performance Online Stores', tagAR: 'متاجر إلكترونية عالية الأداء',
      shortEN: 'Sell more. Operate less.',
      shortAR: 'بع أكثر. اعمل أقل.',
      whatEN: 'A fully custom e-commerce platform built around your products, customers, and growth targets — not a generic template.',
      whatAR: 'منصة تجارة إلكترونية مخصصة بالكامل حول منتجاتك وعملائك وأهداف نموك — لا قوالب جاهزة.',
      whyEN: 'Generic platforms limit your growth. Custom platforms scale with you — handling thousands of orders and multi-market operations.',
      whyAR: 'المنصات الجاهزة تحد من نموك. المنصات المخصصة تنمو معك وتتعامل مع آلاف الطلبات والعمليات متعددة الأسواق.',
      features:   ['Custom Checkout', 'Inventory Sync', 'Multi-currency', 'Analytics Dashboard', 'Mobile-first'],
      featuresAR: ['دفع مخصص', 'مزامنة المخزون', 'عملات متعددة', 'لوحة تحليلات', 'Mobile-first'],
      color: '#b8911f',
    },
    {
      id: 'saas', num: '04', icon: '📊',
      titleEN: 'SaaS Dashboards',        titleAR: 'لوحات تحكم SaaS',
      tagEN: 'Software as a Service Platforms', tagAR: 'منصات البرمجيات كخدمة',
      shortEN: 'Complex data. Crystal clear decisions.',
      shortAR: 'بيانات معقدة. قرارات واضحة تماماً.',
      whatEN: 'SaaS dashboards transform raw business data into actionable intelligence — accessible from anywhere, for any team size.',
      whatAR: 'لوحات تحكم SaaS تحول بيانات عملك الخام إلى معلومات قابلة للتنفيذ — يمكن الوصول إليها من أي مكان.',
      whyEN: 'Businesses that operate on data-driven decisions grow 23x faster. A well-built dashboard is the difference between guessing and knowing.',
      whyAR: 'الشركات التي تعمل بقرارات مبنية على البيانات تنمو أسرع 23 مرة. لوحة التحكم الجيدة هي الفرق بين التخمين واليقين.',
      features:   ['Real-time Analytics', 'Role-based Access', 'Custom Reports', 'API Integrations', 'White-label Ready'],
      featuresAR: ['تحليلات فورية', 'صلاحيات حسب الدور', 'تقارير مخصصة', 'تكاملات API', 'White-label جاهز'],
      color: '#a07c18',
    },
    {
      id: 'booking', num: '05', icon: '📅',
      titleEN: 'Booking Systems',        titleAR: 'أنظمة الحجز',
      tagEN: 'Smart Scheduling & Reservations', tagAR: 'جدولة وحجوزات ذكية',
      shortEN: 'Zero no-shows. Full calendars.',
      shortAR: 'صفر غيابات. تقويمات ممتلئة.',
      whatEN: 'A custom booking system that automates scheduling, sends reminders, manages capacity, and integrates with your existing tools.',
      whatAR: 'نظام حجز مخصص يؤتمت الجدولة ويرسل تذكيرات ويدير الطاقة الاستيعابية ويتكامل مع أدواتك الحالية.',
      whyEN: 'Manual scheduling wastes 5–8 hours per staff member weekly. Automated booking frees that time and reduces no-shows by up to 80%.',
      whyAR: 'الجدولة اليدوية تضيع 5-8 ساعات أسبوعياً لكل موظف. الحجز التلقائي يحرر هذا الوقت ويقلل الغيابات 80٪.',
      features:   ['Auto-scheduling', 'Smart Reminders', 'Staff Management', 'Payments Integration', 'Multi-location'],
      featuresAR: ['جدولة تلقائية', 'تذكيرات ذكية', 'إدارة الموظفين', 'دمج المدفوعات', 'مواقع متعددة'],
      color: '#d4af37',
    },
    {
      id: 'medical', num: '06', icon: '🏥',
      titleEN: 'Medical Systems',        titleAR: 'الأنظمة الطبية',
      tagEN: 'Healthcare Management Platforms', tagAR: 'منصات إدارة الرعاية الصحية',
      shortEN: 'Healthcare, digitized with precision.',
      shortAR: 'رعاية صحية رقمية بدقة.',
      whatEN: 'Comprehensive systems covering patient records, appointments, doctor portals, billing, and clinical workflows — all in one secure platform.',
      whatAR: 'أنظمة شاملة تغطي سجلات المرضى والمواعيد وبوابات الأطباء والفواتير وسير العمل السريري — في منصة آمنة واحدة.',
      whyEN: 'Paper-based healthcare is slow, error-prone, and costly. Digital systems reduce admin time by 60% and eliminate critical data gaps.',
      whyAR: 'الرعاية الورقية بطيئة وعرضة للأخطاء ومكلفة. الأنظمة الرقمية تقلل وقت الإدارة 60٪ وتزيل الفجوات الحرجة.',
      features:   ['Patient Records (EMR)', 'Appointment System', 'Doctor Portal', 'Billing & Insurance', 'Lab Integration'],
      featuresAR: ['سجلات المرضى (EMR)', 'نظام المواعيد', 'بوابة الأطباء', 'الفواتير والتأمين', 'تكامل المختبر'],
      color: '#c9a227',
    },
    {
      id: 'edu', num: '07', icon: '🎓',
      titleEN: 'Educational Platforms',  titleAR: 'المنصات التعليمية',
      tagEN: 'Learning Management Systems', tagAR: 'أنظمة إدارة التعلم',
      shortEN: 'Knowledge delivered. Progress measured.',
      shortAR: 'معرفة تُوصَّل. تقدم يُقاس.',
      whatEN: 'Full-featured LMS with course creation, student management, assessments, certificates, live sessions, and analytics — built for scale.',
      whatAR: 'منصة LMS متكاملة مع إنشاء المحتوى وإدارة الطلاب والتقييمات والشهادات والجلسات المباشرة — مبنية للتوسع.',
      whyEN: 'The e-learning market grows at 21% annually. A custom platform gives you full ownership — no revenue sharing, no limitations.',
      whyAR: 'سوق التعلم الإلكتروني ينمو 21٪ سنوياً. المنصة المخصصة تمنحك الملكية الكاملة — لا مشاركة في الإيرادات، لا قيود.',
      features:   ['Course Builder', 'Student Tracking', 'Live Sessions', 'Auto Certificates', 'Revenue Analytics'],
      featuresAR: ['بناء الكورسات', 'تتبع الطلاب', 'جلسات مباشرة', 'شهادات تلقائية', 'تحليلات الإيرادات'],
      color: '#b8911f',
    },
  ];

  return (
    <section
      id="solutions"
      className="relative py-24 sm:py-40 px-4 sm:px-6 md:px-8 bg-black overflow-hidden"
      aria-label={isRTL ? 'الحلول' : 'Solutions'}
    >
      {/* Ambient glows — no horizontal translate; keeps filter rendering within section bounds */}
      <div
        className="absolute top-0 right-0 w-[45vw] h-[45vw] rounded-full opacity-[0.03] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #d4af37 0%, transparent 70%)', filter: 'blur(80px)', transform: 'translateY(-20%)' }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 w-[38vw] h-[38vw] rounded-full opacity-[0.02] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #d4af37 0%, transparent 70%)', filter: 'blur(100px)', transform: 'translateY(20%)' }}
        aria-hidden="true"
      />

      <div className={`max-w-7xl mx-auto relative z-10 ${isRTL ? 'text-right' : 'text-left'}`}>

        {/* Header */}
        <div className={`flex items-center gap-4 mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span className={`block w-12 h-px ${isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-[#d4af37] to-transparent`} aria-hidden="true" />
          <p className="text-xs tracking-[0.35em] text-[#d4af37]/60 uppercase">
            {isRTL ? 'ما نبنيه' : 'What We Build'}
          </p>
        </div>

        <h2
          className={`text-3xl sm:text-5xl lg:text-6xl font-semibold leading-[1.08] mb-6 ${isRTL ? '' : 'tracking-tight'}`}
          style={{ letterSpacing: isRTL ? '0' : '-0.025em' }}
        >
          {isRTL ? 'الأنظمة التي' : 'The systems that'}
          <br />
          <span className={`text-transparent bg-clip-text ${isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-[#d4af37] to-white/80`}>
            {isRTL ? 'تحل مشاكلك الحقيقية.' : 'solve your real problems.'}
          </span>
        </h2>

        <p className="text-base sm:text-lg text-white/65 max-w-2xl mb-20 sm:mb-32 leading-relaxed">
          {isRTL
            ? 'كل نظام نبنيه يحل مشكلة تجارية محددة — يوفر الوقت، يزيد الإيرادات، أو يُتيح التوسع بدون إضافة موظفين.'
            : 'Every system we build solves a specific business problem — saves time, increases revenue, or allows you to scale without adding headcount.'}
        </p>

        {/* Solutions list */}
        <div className="space-y-0" role="list">
          {solutions.map((sol) => (
            <div key={sol.id} role="listitem">
              <SolutionItem
                sol={sol}
                isOpen={openSolution === sol.id}
                onToggle={() => setOpenSolution(openSolution === sol.id ? null : sol.id)}
                isRTL={isRTL}
                onStartProject={onStartProject}
              />
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 sm:mt-32 pt-12 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-white/50 text-sm font-normal max-w-md text-center sm:text-start leading-relaxed">
            {isRTL
              ? 'لا ترى نظامك في القائمة؟ إذا كان يحل مشكلة تجارية حقيقية، نبنيه.'
              : "Don't see your system? If it solves a real business problem, we build it."}
          </p>
          <button
            onClick={onStartProject}
            className="group relative inline-flex items-center gap-3 px-10 py-4 border-2 border-[#d4af37] text-[#d4af37] text-xs font-semibold tracking-[0.08em] uppercase hover:bg-[#d4af37] hover:text-black transition-all duration-500 active:scale-95 overflow-hidden flex-shrink-0"
          >
            <span
              className={`absolute inset-0 transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent ${isRTL ? 'translate-x-full group-hover:-translate-x-full' : '-translate-x-full group-hover:translate-x-full'}`}
              aria-hidden="true"
            />
            <span className="relative">{isRTL ? 'احجز استشارة مجانية' : 'Book Free Strategy Call'}</span>
            <svg
              className={`relative w-3 h-3 transition-transform duration-300 ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>

      </div>
    </section>
  );
};

export default Solutions;