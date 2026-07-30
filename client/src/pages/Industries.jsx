import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSEO } from '../hooks/useSEO';
import { getCaseStudyBySlug } from '../data/caseStudies';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProjectRequestForm from '../components/ProjectRequestForm';
import SolutionsShowcase from '../components/SolutionsShowcase';

const FONT_EN = "'Inter',system-ui,sans-serif";
const FONT_AR = "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif";

const ICONS = {
  restaurant: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22" aria-hidden>
      <path d="M7 2v7a2 2 0 002 2v11M7 2a2 2 0 00-2 2v5a2 2 0 002 2M11 2v9M17 2c-1.5 0-3 1.5-3 4v3a2 2 0 002 2h1v10" />
    </svg>
  ),
  medical: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22" aria-hidden>
      <path d="M12 2a2 2 0 012 2v4h4a2 2 0 012 2v4a2 2 0 01-2 2h-4v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4H4a2 2 0 01-2-2v-4a2 2 0 012-2h4V4a2 2 0 012-2h4z" />
    </svg>
  ),
  academy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22" aria-hidden>
      <path d="M22 10L12 5 2 10l10 5 10-5z" /><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" />
    </svg>
  ),
  realestate: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22" aria-hidden>
      <path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" />
    </svg>
  ),
  hotel: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22" aria-hidden>
      <path d="M3 21V7a2 2 0 012-2h6v16M3 21h18M11 21V9h8a2 2 0 012 2v10M7 9h.01M7 13h.01" />
    </svg>
  ),
  factory: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22" aria-hidden>
      <path d="M2 21V11l6 4v-4l6 4V8l6 4v9H2z" />
    </svg>
  ),
  startup: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22" aria-hidden>
      <path d="M12 2a10 10 0 00-8 16l3-3M12 2a10 10 0 018 16l-3-3M9 15l-3 6 6-3M15 15l3 6-6-3" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  ecommerce: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22" aria-hidden>
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </svg>
  ),
};

const INDUSTRIES = [
  {
    key: 'restaurant',
    accent: '#EA580C',
    titleEN: 'Restaurants & Food Service',
    titleAR: 'المطاعم وخدمات الطعام',
    problemEN: 'Paper tickets, delivery-app commissions, and no idea which branch or dish actually performs.',
    problemAR: 'تذاكر ورقية وعمولات تطبيقات التوصيل — بدون رؤية واضحة لأداء الفروع أو الأطباق.',
    solutionsEN: ['Unified POS across branches', 'Kitchen display system', 'Branded online ordering', 'Delivery & inventory sync'],
    solutionsAR: ['نظام كاشير موحّد لكل الفروع', 'شاشة عرض للمطبخ', 'طلب أونلاين بهويتكم الخاصة', 'مزامنة التوصيل والمخزون'],
    caseStudySlug: 'platterly',
    serviceSlug: 'enterprise-software',
  },
  {
    key: 'medical',
    accent: '#0891B2',
    titleEN: 'Clinics & Medical Centers',
    titleAR: 'العيادات والمراكز الطبية',
    problemEN: 'Phone-call booking, no-shows eating revenue, and patient records scattered across paper files.',
    problemAR: 'حجز بالتليفون، غيابات تأكل الإيرادات، وملفات مرضى مبعثرة على الورق.',
    solutionsEN: ['Online patient booking', 'WhatsApp/SMS reminders', 'Doctor calendar management', 'Searchable patient records'],
    solutionsAR: ['حجز إلكتروني للمرضى', 'تذكيرات واتساب/SMS', 'إدارة جدول الأطباء', 'سجلات مرضى قابلة للبحث'],
    caseStudySlug: 'bookease',
    serviceSlug: 'enterprise-software',
  },
  {
    key: 'academy',
    accent: '#7C3AED',
    titleEN: 'Schools & Academies',
    titleAR: 'المدارس والأكاديميات',
    problemEN: 'Courses run over Zoom links and WhatsApp groups — zero tracking, zero certificates, zero credibility.',
    problemAR: 'الدورات تُدار عبر روابط Zoom وواتساب — بدون تتبع أو شهادات أو مصداقية.',
    solutionsEN: ['Branded learning platform', 'Progress tracking & quizzes', 'Auto-issued certificates', 'Instructor analytics dashboard'],
    solutionsAR: ['منصة تعليمية بهويتكم', 'تتبع تقدم واختبارات', 'شهادات تلقائية', 'لوحة تحليلات للمدرّسين'],
    caseStudySlug: 'learnsphere',
    serviceSlug: 'saas-development',
  },
  {
    key: 'realestate',
    accent: 'rgb(var(--accent))',
    titleEN: 'Real Estate',
    titleAR: 'العقارات',
    problemEN: 'Listings scattered across spreadsheets and WhatsApp, with high-value leads falling through the cracks.',
    problemAR: 'قوائم عقارية مبعثرة بين جداول بيانات وواتساب، وعملاء محتملون يضيعون.',
    solutionsEN: ['Searchable property portal', 'Agent CRM & lead routing', 'Virtual tours & galleries', 'SEO-optimized listing pages'],
    solutionsAR: ['بوابة عقارات قابلة للبحث', 'CRM للوكلاء وتوزيع العملاء', 'جولات افتراضية ومعارض صور', 'صفحات معلنة محسّنة لمحركات البحث'],
    caseStudySlug: 'nexusrealty',
    serviceSlug: 'web-development',
  },
  {
    key: 'hotel',
    accent: '#0E7490',
    titleEN: 'Hotels & Hospitality',
    titleAR: 'الفنادق والضيافة',
    problemEN: 'Paying 15-18% commission per booking to OTAs with no direct-booking channel of your own.',
    problemAR: 'دفع عمولة تصل لـ 18٪ لكل حجز عبر منصات الحجز الوسيطة بدون قناة حجز مباشرة خاصة بكم.',
    solutionsEN: ['Direct booking engine', 'Channel manager sync', 'Front-desk PMS', 'Guest CRM & repeat-stay offers'],
    solutionsAR: ['محرك حجز مباشر', 'مزامنة قنوات الحجز', 'نظام إدارة استقبال', 'CRM للضيوف وعروض التكرار'],
    caseStudySlug: 'stayluxe',
    serviceSlug: 'enterprise-software',
  },
  {
    key: 'factory',
    accent: '#D97706',
    titleEN: 'Factories & Manufacturing',
    titleAR: 'المصانع والتصنيع',
    problemEN: 'Production, inventory, and orders live in 5 disconnected systems with manual re-entry everywhere.',
    problemAR: 'الإنتاج والمخزون والطلبات في 5 أنظمة منفصلة مع إعادة إدخال يدوي في كل مكان.',
    solutionsEN: ['Unified ERP platform', 'Real-time inventory engine', 'Role-based dashboards', 'Accounting system sync'],
    solutionsAR: ['منصة ERP موحّدة', 'محرك مخزون فوري', 'لوحات تحكم حسب الدور', 'مزامنة مع النظام المحاسبي'],
    caseStudySlug: 'opsflow',
    serviceSlug: 'enterprise-software',
  },
  {
    key: 'startup',
    accent: '#059669',
    titleEN: 'Startups & SaaS',
    titleAR: 'الشركات الناشئة و SaaS',
    problemEN: 'A validated idea and a runway clock — but no production-grade platform to prove it at scale.',
    problemAR: 'فكرة مُثبتة ومهلة زمنية محدودة — بدون منصة إنتاجية تثبتها على نطاق واسع.',
    solutionsEN: ['MVP-to-production build', 'Subscription billing & tiers', 'Real-time data & analytics', 'Scalable cloud architecture'],
    solutionsAR: ['بناء من MVP إلى الإنتاج', 'فوترة اشتراكات ومستويات', 'بيانات وتحليلات فورية', 'بنية سحابية قابلة للتوسع'],
    caseStudySlug: 'vaultanalytics',
    serviceSlug: 'saas-development',
  },
  {
    key: 'ecommerce',
    accent: '#DC2626',
    titleEN: 'E-commerce & Retail',
    titleAR: 'التجارة الإلكترونية والتجزئة',
    problemEN: 'A slow templated storefront, forced-signup checkout, and rising commission fees eating margins.',
    problemAR: 'متجر بطيء مبني على قالب جاهز، تسجيل إجباري عند الدفع، ورسوم تلتهم الهامش.',
    solutionsEN: ['Custom high-speed storefront', 'Guest checkout flow', 'Inventory & order management', 'Search & analytics built in'],
    solutionsAR: ['واجهة متجر مخصصة وسريعة', 'دفع بدون تسجيل إجباري', 'إدارة مخزون وطلبات', 'بحث وتحليلات مدمجة'],
    caseStudySlug: 'sprintstore',
    serviceSlug: 'ecommerce-development',
  },
];

const STATS_EN = [
  { num: '50+', label: 'Projects Delivered' },
  { num: '8',   label: 'Industries Served' },
  { num: '98%', label: 'Client Satisfaction' },
  { num: '14d', label: 'Average Launch Time' },
];
const STATS_AR = [
  { num: '50+', label: 'مشروع مُسلَّم' },
  { num: '8',   label: 'قطاعات نخدمها' },
  { num: '98%', label: 'رضا العملاء' },
  { num: '14d', label: 'متوسط وقت الإطلاق' },
];

const IndustryCard = ({ industry, isRTL, onStartProject, visible, delay }) => {
  const cs = getCaseStudyBySlug(industry.caseStudySlug);
  return (
    <div
      style={{
        background: 'rgb(var(--bg-elevated))',
        border: '1px solid rgb(var(--border))',
        borderRadius: 16,
        padding: 'clamp(22px, 2.5vw, 32px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.55s ${delay}s cubic-bezier(0.16,1,0.3,1), transform 0.55s ${delay}s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s ease, border-color 0.25s ease`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = `0 12px 40px ${industry.accent}18, 0 2px 8px rgb(var(--hover-overlay) / 0.04)`;
        e.currentTarget.style.borderColor = `${industry.accent}40`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'rgb(var(--border))';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10, flexShrink: 0,
          background: `${industry.accent}0D`, border: `1px solid ${industry.accent}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: industry.accent,
        }}>
          {ICONS[industry.key]}
        </div>
        <h3 style={{
          margin: 0, fontSize: 'clamp(1rem, 1.3vw, 1.125rem)', fontWeight: 700, color: 'rgb(var(--text-primary))',
          letterSpacing: isRTL ? 0 : '-0.02em', lineHeight: 1.25,
          fontFamily: isRTL ? FONT_AR : FONT_EN, textAlign: isRTL ? 'right' : 'left',
        }}>
          {isRTL ? industry.titleAR : industry.titleEN}
        </h3>
      </div>

      <p style={{
        margin: 0, fontSize: 13, color: 'rgb(var(--text-secondary))', lineHeight: 1.7,
        textAlign: isRTL ? 'right' : 'left', fontFamily: isRTL ? FONT_AR : FONT_EN,
      }}>
        {isRTL ? industry.problemAR : industry.problemEN}
      </p>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {(isRTL ? industry.solutionsAR : industry.solutionsEN).map((f, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row', textAlign: isRTL ? 'right' : 'left' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: industry.accent, flexShrink: 0 }} aria-hidden />
            <span style={{ fontSize: 12.5, color: 'rgb(var(--text-secondary))', fontWeight: 500, fontFamily: isRTL ? FONT_AR : FONT_EN }}>{f}</span>
          </li>
        ))}
      </ul>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid rgb(var(--border-light))', paddingTop: 14, marginTop: 4 }}>
        {cs && (
          <Link
            to={`/case-studies/${cs.slug}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
              fontSize: 12.5, fontWeight: 600, color: industry.accent, textDecoration: 'none',
              flexDirection: isRTL ? 'row-reverse' : 'row',
            }}
          >
            <span>{isRTL ? `شاهد ${cs.title}` : `See how we helped ${cs.title}`}</span>
            <ArrowRight style={{ width: 13, height: 13, transform: isRTL ? 'scaleX(-1)' : 'none', flexShrink: 0 }} aria-hidden />
          </Link>
        )}
        <button
          onClick={onStartProject}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
            fontSize: 12.5, fontWeight: 600, color: 'rgb(var(--text-secondary))', background: 'transparent',
            border: 'none', cursor: 'pointer', padding: 0, fontFamily: isRTL ? FONT_AR : FONT_EN,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          }}
        >
          <span>{isRTL ? 'ابدأ مشروعك' : 'Start your project'}</span>
          <ArrowRight style={{ width: 13, height: 13, transform: isRTL ? 'scaleX(-1)' : 'none', flexShrink: 0 }} aria-hidden />
        </button>
      </div>
    </div>
  );
};

const Industries = () => {
  const { isRTL } = useLanguage();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const gridRef = useRef(null);

  useSEO({
    title: 'Industries We Serve | YANSY TECH',
    description: 'YANSY TECH builds digital products for restaurants, clinics, schools, real estate, hotels, factories, startups, and e-commerce brands — tailored to how each industry actually operates.',
    keywords: 'restaurant software, clinic booking system, school LMS, real estate platform, hotel booking system, ERP for factories, SaaS for startups, ecommerce development',
    canonical: 'https://yansytech.com/industries',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      url: 'https://yansytech.com/industries',
      name: 'Industries We Serve | YANSY TECH',
      isPartOf: { '@id': 'https://yansytech.com/#website' },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://yansytech.com/' },
          { '@type': 'ListItem', position: 2, name: 'Industries', item: 'https://yansytech.com/industries' },
        ],
      },
    },
  });

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); io.disconnect(); }
    }, { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const stats = isRTL ? STATS_AR : STATS_EN;

  return (
    <>
      <Header onStartProject={() => setIsFormOpen(true)} />

      <main dir={isRTL ? 'rtl' : 'ltr'} style={{ background: 'rgb(var(--bg-elevated))', overflowX: 'hidden' }}>

        {/* ── HERO ──────────────────────────────────────────────── */}
        <section style={{
          paddingTop: 'clamp(7.5rem, 14vw, 10rem)',
          paddingBottom: 'clamp(3.5rem, 7vw, 5rem)',
          paddingLeft: 'clamp(1.25rem, 5vw, 3rem)',
          paddingRight: 'clamp(1.25rem, 5vw, 3rem)',
        }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', textAlign: isRTL ? 'right' : 'left' }}>
            <span className="section-label" style={{ marginBottom: 20, display: 'inline-block' }}>
              {isRTL ? 'القطاعات' : 'Industries'}
            </span>
            <h1 style={{
              fontSize: 'var(--text-5xl)', fontWeight: 800, lineHeight: 1.05,
              letterSpacing: isRTL ? 0 : '-0.035em', color: 'rgb(var(--text-primary))',
              margin: '0 0 clamp(1.25rem, 2.5vw, 1.75rem)', maxWidth: '18ch',
              fontFamily: isRTL ? FONT_AR : FONT_EN,
            }}>
              {isRTL ? 'مبني لطريقة عملك الفعلية.' : 'Built for the business you actually run.'}
            </h1>
            <p style={{
              fontSize: 'clamp(0.9375rem, 1.1vw, 1.0625rem)', color: 'rgb(var(--text-secondary))', lineHeight: 1.75,
              margin: 0, maxWidth: '58ch', fontFamily: isRTL ? FONT_AR : FONT_EN,
            }}>
              {isRTL
                ? 'كل قطاع له مشاكله الخاصة. لا حلول عامة — نبني حول العملية الحقيقية لعملك.'
                : "Every industry has its own operational reality. We don't sell generic software — we build around how your business actually runs, day to day."}
            </p>
          </div>
        </section>

        {/* ── GRID ──────────────────────────────────────────────── */}
        <section style={{
          paddingBottom: 'clamp(5rem, 10vw, 7rem)',
          paddingLeft: 'clamp(1.25rem, 5vw, 3rem)',
          paddingRight: 'clamp(1.25rem, 5vw, 3rem)',
        }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div
              ref={gridRef}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 'clamp(12px, 1.5vw, 18px)',
              }}
            >
              {INDUSTRIES.map((industry, i) => (
                <IndustryCard
                  key={industry.key}
                  industry={industry}
                  isRTL={isRTL}
                  onStartProject={() => setIsFormOpen(true)}
                  visible={visible}
                  delay={Math.min(i * 0.06, 0.4)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── SOLUTIONS: what we build for the industries above ──── */}
        <SolutionsShowcase onStartProject={() => setIsFormOpen(true)} />

        {/* ── STATS BAR ─────────────────────────────────────────── */}
        <section style={{ background: 'rgb(var(--bg-secondary))', borderBottom: '1px solid rgb(var(--border))' }}>
          <div style={{
            maxWidth: 1280, margin: '0 auto',
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          }}
          className="industries-stats-grid"
          >
            {stats.map((s, i) => (
              <div key={i} style={{
                padding: 'clamp(1.5rem, 3.5vw, 2.25rem) clamp(1.25rem, 3vw, 2rem)',
                textAlign: 'center',
                borderInlineEnd: i < stats.length - 1 ? '1px solid rgb(var(--border))' : 'none',
              }}>
                <div style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 800, color: 'rgb(var(--text-primary))', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 5, fontVariantNumeric: 'tabular-nums' }}>
                  {s.num}
                </div>
                <div style={{ fontSize: 'clamp(11px, 1vw, 12.5px)', fontWeight: 700, color: 'rgb(var(--text-secondary))' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <style>{`
            @media (max-width: 640px) {
              .industries-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
            }
          `}</style>
        </section>

        {/* ── CTA ───────────────────────────────────────────────── */}
        <section style={{ padding: 'clamp(5rem,10vw,7rem) 0', textAlign: 'center' }}>
          <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 20px' }}>
            <span className="section-label" style={{ marginBottom: 16, display: 'inline-block' }}>
              {isRTL ? 'لا تجد قطاعك؟' : "Don't See Your Industry?"}
            </span>
            <h2 style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: 'rgb(var(--text-primary))',
              lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 1.5rem',
              fontFamily: isRTL ? FONT_AR : FONT_EN,
            }}>
              {isRTL ? 'إذا كان لديك عمل، يمكننا بناء نظامه.' : "If you run a business, we can build its system."}
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'rgb(var(--text-secondary))', lineHeight: 1.8, margin: '0 0 2.5rem', fontFamily: isRTL ? FONT_AR : FONT_EN }}>
              {isRTL ? 'استشارة مجانية 30 دقيقة — نساعدك تحدد الحل المناسب.' : "Free 30-minute consultation — we'll help you figure out the right solution."}
            </p>
            <button onClick={() => setIsFormOpen(true)} className="btn-primary" style={{ fontSize: '13.5px', padding: '14px 32px' }}>
              {isRTL ? 'ابدأ مشروعك' : 'Start Your Project'}
              <ArrowUpRight style={{ width: 15, height: 15, transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
            </button>
          </div>
        </section>

      </main>

      <Footer />
      <ProjectRequestForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </>
  );
};

export default Industries;
