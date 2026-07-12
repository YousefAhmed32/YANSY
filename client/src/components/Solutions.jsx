import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRight } from 'lucide-react';

const SERVICES = [
  {
    num: '01',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
    titleEN: 'Websites & Landing Pages',
    titleAR: 'مواقع ويب وصفحات هبوط',
    tagEN: 'Convert visitors into customers',
    tagAR: 'حوّل الزوار إلى عملاء',
    descEN: 'High-converting websites built for speed, SEO, and lead generation — designed to rank on Google and drive customers 24/7.',
    descAR: 'مواقع عالية التحويل مبنية للسرعة وSEO وجذب العملاء — تظهر في Google وتجلب عملاء على مدار الساعة.',
    featuresEN: ['SEO-optimized structure', 'Mobile-first & fast', 'Lead capture forms', 'Analytics integration'],
    featuresAR: ['هيكل محسّن لـ SEO', 'Mobile-first وسريع', 'نماذج جذب العملاء', 'تكامل التحليلات'],
    accent: '#2563EB',
  },
  {
    num: '02',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20" aria-hidden>
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
      </svg>
    ),
    titleEN: 'E-commerce Platforms',
    titleAR: 'منصات التجارة الإلكترونية',
    tagEN: 'Sell more, operate less',
    tagAR: 'بع أكثر، اعمل أقل',
    descEN: 'Custom e-commerce stores built around your products and growth goals — not templates, not limitations.',
    descAR: 'متاجر إلكترونية مخصصة حول منتجاتك وأهداف نموك — لا قوالب، لا قيود.',
    featuresEN: ['Custom checkout flow', 'Inventory management', 'Multi-currency support', 'Analytics dashboard'],
    featuresAR: ['تدفق دفع مخصص', 'إدارة المخزون', 'دعم عملات متعددة', 'لوحة تحليلات'],
    accent: '#0891B2',
  },
  {
    num: '03',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20" aria-hidden>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    titleEN: 'SaaS & Web Applications',
    titleAR: 'SaaS وتطبيقات الويب',
    tagEN: 'Complex problems, elegant software',
    tagAR: 'مشاكل معقدة، برمجيات أنيقة',
    descEN: 'Full-featured SaaS products and dashboards — from idea to production-ready. Role-based access, real-time data, subscription billing.',
    descAR: 'منتجات SaaS متكاملة ولوحات تحكم — من الفكرة للإنتاج. صلاحيات وبيانات فورية وفوترة اشتراكات.',
    featuresEN: ['Real-time analytics', 'Role-based access', 'API integrations', 'Subscription billing'],
    featuresAR: ['تحليلات فورية', 'صلاحيات حسب الدور', 'تكاملات API', 'فوترة الاشتراكات'],
    accent: '#7C3AED',
  },
  {
    num: '04',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20" aria-hidden>
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M12 18h.01" />
      </svg>
    ),
    titleEN: 'Mobile Applications',
    titleAR: 'تطبيقات الموبايل',
    tagEN: 'iOS & Android, built to perform',
    tagAR: 'iOS وAndroid مبنية للأداء',
    descEN: 'Cross-platform mobile apps that feel native. One codebase, two stores, zero compromise on performance.',
    descAR: 'تطبيقات موبايل تبدو أصلية. قاعدة كود واحدة، متجرين، لا تنازل على الأداء.',
    featuresEN: ['React Native / Flutter', 'Offline support', 'Push notifications', 'App Store publishing'],
    featuresAR: ['React Native / Flutter', 'دعم بدون إنترنت', 'إشعارات فورية', 'نشر على المتاجر'],
    accent: '#059669',
  },
  {
    num: '05',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20" aria-hidden>
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    titleEN: 'ERP & CRM Systems',
    titleAR: 'أنظمة ERP وCRM',
    tagEN: 'The operating system of your business',
    tagAR: 'نظام تشغيل عملك',
    descEN: 'Enterprise systems that connect your entire operation — finance, HR, inventory, sales — into one intelligent platform.',
    descAR: 'أنظمة مؤسسية تربط كل عمليات شركتك — المالية والموارد البشرية والمخزون والمبيعات — في منصة واحدة.',
    featuresEN: ['Finance & accounting', 'HR & payroll', 'CRM pipeline', 'Custom reporting'],
    featuresAR: ['المالية والمحاسبة', 'الموارد البشرية والرواتب', 'خط مبيعات CRM', 'تقارير مخصصة'],
    accent: '#D97706',
  },
  {
    num: '06',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20" aria-hidden>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
    titleEN: 'Booking & Scheduling Systems',
    titleAR: 'أنظمة الحجز والجدولة',
    tagEN: 'Zero no-shows. Full calendars.',
    tagAR: 'صفر غيابات. تقويمات ممتلئة.',
    descEN: 'Smart booking systems that automate scheduling, send reminders, and reduce no-shows by up to 80%.',
    descAR: 'أنظمة حجز ذكية تؤتمت الجدولة وترسل تذكيرات وتقلل الغيابات حتى 80٪.',
    featuresEN: ['Auto-scheduling engine', 'SMS/email reminders', 'Staff management', 'Payment integration'],
    featuresAR: ['محرك جدولة تلقائي', 'تذكيرات SMS/بريد', 'إدارة الموظفين', 'دمج المدفوعات'],
    accent: '#DC2626',
  },
  {
    num: '07',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20" aria-hidden>
        <path d="M12 2a10 10 0 1010 10" /><path d="M12 6v6l4 2" />
      </svg>
    ),
    titleEN: 'Process Automation',
    titleAR: 'أتمتة العمليات',
    tagEN: 'Eliminate repetitive work',
    tagAR: 'أزل العمل المتكرر',
    descEN: 'Custom automation that saves hours daily, eliminates human error, and scales your business without adding headcount.',
    descAR: 'أتمتة مخصصة تحفظ ساعات يومياً وتزيل أخطاء بشرية وتوسع عملك بدون إضافة موظفين.',
    featuresEN: ['Workflow automation', 'API connections', 'Report automation', 'Notification systems'],
    featuresAR: ['أتمتة سير العمل', 'ربط الـ API', 'أتمتة التقارير', 'أنظمة الإشعارات'],
    accent: '#0D9488',
  },
];

const ServiceCard = ({ service, isRTL, onStartProject, visible, delay }) => (
  <div
    style={{
      background: '#FFFFFF',
      border: '1px solid #E8EBF0',
      borderRadius: 16,
      padding: 'clamp(22px, 2.5vw, 32px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity 0.55s ${delay}s cubic-bezier(0.16,1,0.3,1), transform 0.55s ${delay}s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s ease, border-color 0.25s ease, transform 0.22s ease`,
    }}
    onMouseEnter={e => {
      e.currentTarget.style.boxShadow = `0 12px 40px ${service.accent}18, 0 2px 8px rgba(0,0,0,0.04)`;
      e.currentTarget.style.borderColor = `${service.accent}40`;
      e.currentTarget.style.transform = 'translateY(-3px)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.borderColor = '#E8EBF0';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
  >
    {/* Header */}
    <div style={{
      display: 'flex', alignItems: 'flex-start',
      justifyContent: isRTL ? 'flex-end' : 'flex-start',
      gap: 12,
      flexDirection: isRTL ? 'row-reverse' : 'row',
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 10, flexShrink: 0,
        background: `${service.accent}0D`,
        border: `1px solid ${service.accent}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: service.accent,
        transition: 'background 0.22s ease, transform 0.22s ease',
      }}>
        {service.icon}
      </div>
      <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: isRTL ? 'flex-end' : 'flex-start', marginBottom: 4, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#C9CDD6', letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums' }}>
            {service.num}
          </span>
        </div>
        <h3 style={{
          margin: 0,
          fontSize: 'clamp(1rem, 1.3vw, 1.125rem)',
          fontWeight: 700,
          color: '#0D1117',
          letterSpacing: isRTL ? 0 : '-0.02em',
          lineHeight: 1.2,
          fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
        }}>
          {isRTL ? service.titleAR : service.titleEN}
        </h3>
      </div>
    </div>

    {/* Tag */}
    <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
      <span style={{
        fontSize: 11, fontWeight: 600,
        color: service.accent,
        background: `${service.accent}0D`,
        border: `1px solid ${service.accent}22`,
        padding: '3px 10px', borderRadius: '100px',
      }}>
        {isRTL ? service.tagAR : service.tagEN}
      </span>
    </div>

    {/* Description */}
    <p style={{
      margin: 0,
      fontSize: 13.5,
      color: '#5C6370',
      lineHeight: 1.7,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
      flex: 1,
    }}>
      {isRTL ? service.descAR : service.descEN}
    </p>

    {/* Features */}
    <ul style={{
      listStyle: 'none', padding: 0, margin: 0,
      display: 'flex', flexDirection: 'column', gap: 7,
    }}>
      {(isRTL ? service.featuresAR : service.featuresEN).map((f, i) => (
        <li key={i} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          flexDirection: isRTL ? 'row-reverse' : 'row',
          textAlign: isRTL ? 'right' : 'left',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: service.accent, flexShrink: 0 }} aria-hidden />
          <span style={{
            fontSize: 12.5, color: '#374151', fontWeight: 500,
            fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
          }}>
            {f}
          </span>
        </li>
      ))}
    </ul>

    {/* CTA */}
    <button
      onClick={onStartProject}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '10px 0', fontSize: '12.5px', fontWeight: 600,
        color: service.accent, background: 'transparent',
        border: 'none', cursor: 'pointer',
        textDecoration: 'none',
        flexDirection: isRTL ? 'row-reverse' : 'row',
        transition: 'gap 0.18s ease, opacity 0.15s',
        alignSelf: isRTL ? 'flex-end' : 'flex-start',
        borderTop: '1px solid #F0F2F5',
        width: '100%',
        justifyContent: isRTL ? 'flex-end' : 'flex-start',
        paddingTop: 14,
        marginTop: 4,
      }}
      onMouseEnter={e => { e.currentTarget.style.gap = '10px'; e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={e => { e.currentTarget.style.gap = '6px'; e.currentTarget.style.opacity = '1'; }}
    >
      {isRTL ? 'ابدأ هذا المشروع' : 'Start this project'}
      <ArrowRight style={{ width: 13, height: 13, transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
    </button>
  </div>
);

const Solutions = ({ onStartProject }) => {
  const { isRTL } = useLanguage();
  const gridRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); io.disconnect(); }
    }, { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      id="solutions"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        background: '#FAFAFA',
        paddingTop:    'clamp(5rem, 10vw, 8rem)',
        paddingBottom: 'clamp(5rem, 10vw, 8rem)',
        paddingLeft:   'clamp(1.25rem, 5vw, 3rem)',
        paddingRight:  'clamp(1.25rem, 5vw, 3rem)',
        borderTop: '1px solid #E8EBF0',
      }}
      aria-label={isRTL ? 'خدماتنا' : 'Our Services'}
    >
      <style>{`
        .solutions-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(12px, 1.5vw, 18px);
        }
        @media (max-width: 1024px) {
          .solutions-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .solutions-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Section header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'clamp(1.5rem, 4vw, 4rem)',
          alignItems: 'end',
          marginBottom: 'clamp(3rem, 6vw, 5rem)',
        }}>
          <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
            <span className="section-label" style={{ marginBottom: 20, display: 'inline-block' }}>
              {isRTL ? 'ما نبنيه' : 'What We Build'}
            </span>
            <h2 style={{
              fontSize: 'var(--text-5xl)',
              fontWeight: 800,
              lineHeight: 1.0,
              letterSpacing: isRTL ? 0 : '-0.035em',
              color: '#0D1117',
              margin: 0,
              fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
            }}>
              {isRTL ? 'حلول رقمية\nلكل تحدٍّ تجاري.' : 'Digital solutions\nfor every\nbusiness challenge.'}
            </h2>
          </div>
          <div>
            <p style={{
              fontSize: 'clamp(0.9375rem, 1.1vw, 1.0625rem)',
              color: '#5C6370',
              lineHeight: 1.75,
              margin: '0 0 clamp(1rem, 2vw, 1.5rem)',
              textAlign: isRTL ? 'right' : 'left',
              fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
            }}>
              {isRTL
                ? 'كل خدمة نقدمها مبنية لتحل مشكلة تجارية حقيقية — توفير الوقت، زيادة الإيرادات، أو تمكين التوسع.'
                : 'Every service we offer is built to solve a real business problem — save time, increase revenue, or enable scale.'}
            </p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 13px', borderRadius: '100px',
              background: '#EFF6FF', border: '1px solid #DBEAFE',
              flexDirection: isRTL ? 'row-reverse' : 'row',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2563EB' }} aria-hidden />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: '#2563EB' }}>
                {isRTL ? 'لا تجد ما تحتاجه؟ تواصل معنا — نبنيه.' : "Don't see what you need? Contact us — we'll build it."}
              </span>
            </div>
          </div>
        </div>

        {/* Services grid */}
        <div className="solutions-grid" ref={gridRef}>
          {SERVICES.map((service, i) => (
            <ServiceCard
              key={service.num}
              service={service}
              isRTL={isRTL}
              onStartProject={onStartProject}
              visible={visible}
              delay={Math.min(i * 0.08, 0.4)}
            />
          ))}
        </div>

        {/* Footer CTA */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          paddingTop: 'clamp(2.5rem, 5vw, 4rem)',
          marginTop: 'clamp(2.5rem, 5vw, 4rem)',
          borderTop: '1px solid #E8EBF0',
        }}>
          <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
            <p style={{
              fontSize: 'clamp(1rem, 1.3vw, 1.125rem)',
              fontWeight: 700, color: '#0D1117',
              margin: '0 0 5px',
              letterSpacing: isRTL ? 0 : '-0.02em',
              fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
            }}>
              {isRTL ? 'ليس متأكداً من الخدمة المناسبة؟' : 'Not sure which service fits?'}
            </p>
            <p style={{ fontSize: 13.5, color: '#9BA3AE', margin: 0 }}>
              {isRTL ? 'استشارة مجانية 30 دقيقة — نساعدك تحدد المناسب.' : 'Book a free 30-min call — we\'ll help you figure it out.'}
            </p>
          </div>
          <button
            onClick={onStartProject}
            className="btn-primary"
            style={{ fontSize: '13.5px', padding: '13px 26px' }}
          >
            {isRTL ? 'احجز استشارة مجانية' : 'Book Free Consultation'}
            <ArrowRight style={{ width: 15, height: 15, transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
          </button>
        </div>

      </div>
    </section>
  );
};

export default Solutions;
