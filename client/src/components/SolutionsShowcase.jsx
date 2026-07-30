import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Globe, ShoppingBag, Layers, Smartphone, Network,
  CalendarClock, CreditCard, Sparkles, Workflow, LayoutDashboard, ArrowRight,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

gsap.registerPlugin(ScrollTrigger);

const FONT_EN = "'Inter',system-ui,sans-serif";
const FONT_AR = "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif";

/* Editorial capability list — the answer to "what do you actually build?"
   Deliberately NOT a repeat of the Industries page's per-industry cards above:
   those answer "who do you build for", this answers "what do you build". */
const SOLUTIONS = [
  {
    icon: Globe, accent: 'rgb(var(--accent))',
    titleEN: 'Websites & Landing Pages', titleAR: 'مواقع ويب وصفحات هبوط',
    tagEN: 'Convert visitors into customers', tagAR: 'حوّل الزوار إلى عملاء',
    descEN: 'High-converting websites built for speed, SEO, and lead generation.', descAR: 'مواقع عالية التحويل مبنية للسرعة وSEO وجذب العملاء.',
    featuresEN: ['SEO-optimized', 'Mobile-first', 'Lead capture'], featuresAR: ['محسّن لـ SEO', 'Mobile-first', 'جذب العملاء'],
  },
  {
    icon: ShoppingBag, accent: '#0891B2',
    titleEN: 'E-commerce Platforms', titleAR: 'منصات التجارة الإلكترونية',
    tagEN: 'Sell more, operate less', tagAR: 'بع أكثر، اعمل أقل',
    descEN: 'Custom stores built around your products and growth goals — not templates.', descAR: 'متاجر مخصصة حول منتجاتك وأهداف نموك — لا قوالب جاهزة.',
    featuresEN: ['Custom checkout', 'Inventory sync', 'Multi-currency'], featuresAR: ['دفع مخصص', 'مزامنة مخزون', 'عملات متعددة'],
  },
  {
    icon: Layers, accent: '#7C3AED',
    titleEN: 'SaaS & Web Applications', titleAR: 'SaaS وتطبيقات الويب',
    tagEN: 'Complex problems, elegant software', tagAR: 'مشاكل معقدة، برمجيات أنيقة',
    descEN: 'Full-featured products and dashboards — from idea to production-ready.', descAR: 'منتجات ولوحات تحكم متكاملة — من الفكرة للإنتاج.',
    featuresEN: ['Real-time data', 'Role-based access', 'Subscription billing'], featuresAR: ['بيانات فورية', 'صلاحيات حسب الدور', 'فوترة اشتراكات'],
  },
  {
    icon: Smartphone, accent: '#059669',
    titleEN: 'Mobile Applications', titleAR: 'تطبيقات الموبايل',
    tagEN: 'iOS & Android, built to perform', tagAR: 'iOS وAndroid مبنية للأداء',
    descEN: 'Cross-platform apps that feel native. One codebase, two stores.', descAR: 'تطبيقات تبدو أصلية. قاعدة كود واحدة، متجرين.',
    featuresEN: ['React Native', 'Offline support', 'Push notifications'], featuresAR: ['React Native', 'دعم بلا إنترنت', 'إشعارات فورية'],
  },
  {
    icon: Network, accent: '#D97706',
    titleEN: 'ERP & CRM Systems', titleAR: 'أنظمة ERP وCRM',
    tagEN: 'The operating system of your business', tagAR: 'نظام تشغيل عملك',
    descEN: 'Enterprise systems connecting finance, HR, inventory, and sales into one platform.', descAR: 'أنظمة تربط المالية والموارد البشرية والمخزون والمبيعات في منصة واحدة.',
    featuresEN: ['Finance & accounting', 'CRM pipeline', 'Custom reporting'], featuresAR: ['المالية والمحاسبة', 'خط مبيعات CRM', 'تقارير مخصصة'],
  },
  {
    icon: CalendarClock, accent: '#DC2626',
    titleEN: 'Booking & Scheduling', titleAR: 'أنظمة الحجز والجدولة',
    tagEN: 'Zero no-shows. Full calendars.', tagAR: 'صفر غيابات. تقويمات ممتلئة.',
    descEN: 'Smart booking systems that automate scheduling and cut no-shows by up to 80%.', descAR: 'أنظمة حجز ذكية تؤتمت الجدولة وتقلل الغيابات حتى 80٪.',
    featuresEN: ['Auto-scheduling', 'SMS/email reminders', 'Payment integration'], featuresAR: ['جدولة تلقائية', 'تذكيرات SMS/بريد', 'دمج المدفوعات'],
  },
  {
    icon: CreditCard, accent: '#EA580C',
    titleEN: 'POS & Point-of-Sale', titleAR: 'أنظمة نقاط البيع',
    tagEN: 'Every till, one system', tagAR: 'كل كاشير، نظام واحد',
    descEN: 'Point-of-sale software for restaurants and retail — orders, payments, and inventory in sync.', descAR: 'برمجيات كاشير للمطاعم والتجزئة — طلبات ومدفوعات ومخزون متزامنة.',
    featuresEN: ['Multi-branch sync', 'Offline checkout', 'Shift management'], featuresAR: ['مزامنة بين الفروع', 'دفع بلا إنترنت', 'إدارة الورديات'],
  },
  {
    icon: Sparkles, accent: '#DB2777',
    titleEN: 'AI-Powered Solutions', titleAR: 'حلول الذكاء الاصطناعي',
    tagEN: 'Intelligence built into your product', tagAR: 'ذكاء مدمج داخل منتجك',
    descEN: 'AI chatbots, intelligent search, and predictive tools — integrated into systems you already use.', descAR: 'روبوتات محادثة وبحث ذكي وأدوات تنبؤية — مدمجة في أنظمتك الحالية.',
    featuresEN: ['Custom AI chatbots', 'Document intelligence', 'Predictive analytics'], featuresAR: ['روبوتات محادثة مخصصة', 'ذكاء المستندات', 'تحليلات تنبؤية'],
  },
  {
    icon: Workflow, accent: '#0D9488',
    titleEN: 'Process Automation', titleAR: 'أتمتة العمليات',
    tagEN: 'Eliminate repetitive work', tagAR: 'أزل العمل المتكرر',
    descEN: 'Automation that connects your tools and removes manual data entry — without adding headcount.', descAR: 'أتمتة تربط أدواتك وتُلغي الإدخال اليدوي — بدون توظيف إضافي.',
    featuresEN: ['Workflow automation', 'API sync', 'Smart notifications'], featuresAR: ['أتمتة سير العمل', 'مزامنة API', 'إشعارات ذكية'],
  },
  {
    icon: LayoutDashboard, accent: '#4F46E5',
    titleEN: 'Dashboards & Portals', titleAR: 'لوحات تحكم وبوابات',
    tagEN: 'One login, full visibility', tagAR: 'دخول واحد، رؤية كاملة',
    descEN: 'Admin dashboards, client portals, and internal tools built around your actual workflow.', descAR: 'لوحات تحكم إدارية وبوابات عملاء وأدوات داخلية مبنية حول سير عملك الفعلي.',
    featuresEN: ['Role-based dashboards', 'Client portals', '3rd-party integrations'], featuresAR: ['لوحات حسب الدور', 'بوابات عملاء', 'تكاملات خارجية'],
  },
];

const SolutionRow = ({ solution, index, isRTL, onStartProject }) => {
  const [hovered, setHovered] = useState(false);
  const font = isRTL ? FONT_AR : FONT_EN;
  const Icon = solution.icon;

  return (
    <div
      data-solution-row
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onStartProject}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onStartProject(); }}
      style={{
        position: 'relative', cursor: 'pointer', overflow: 'hidden',
        borderBottom: index < SOLUTIONS.length - 1 ? '1px solid rgb(var(--border))' : 'none',
        padding: 'clamp(1.5rem, 3vw, 2.25rem) clamp(0.5rem, 1.5vw, 1rem)',
        background: hovered ? `${solution.accent}06` : 'transparent',
        transition: 'background 0.35s ease',
      }}
    >
      {/* Accent bar */}
      <div aria-hidden style={{
        position: 'absolute', top: 0, bottom: 0, [isRTL ? 'right' : 'left']: 0, width: 3,
        background: solution.accent, transform: hovered ? 'scaleY(1)' : 'scaleY(0)',
        transformOrigin: 'center', transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1)',
      }} />

      <div style={{
        display: 'flex', alignItems: 'flex-start',
        gap: 'clamp(1rem, 2.5vw, 1.5rem)',
        flexDirection: isRTL ? 'row-reverse' : 'row',
      }}
      >
        {/* Index + icon cluster (always stay together) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <span style={{
            fontSize: 'clamp(1.5rem, 2.6vw, 2.25rem)', fontWeight: 800, lineHeight: 1,
            color: hovered ? `${solution.accent}55` : 'rgb(var(--border))', fontVariantNumeric: 'tabular-nums',
            transition: 'color 0.3s ease', fontFamily: "'Inter',system-ui,sans-serif",
          }}>
            {String(index + 1).padStart(2, '0')}
          </span>

          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: hovered ? solution.accent : `${solution.accent}0D`,
            border: `1px solid ${hovered ? solution.accent : `${solution.accent}22`}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: hovered ? 'rgb(var(--bg-elevated))' : solution.accent,
            transform: hovered ? 'scale(1.06) rotate(-3deg)' : 'scale(1) rotate(0deg)',
            transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <Icon style={{ width: 22, height: 22 }} strokeWidth={1.6} />
          </div>
        </div>

        {/* Text block */}
        <div style={{ textAlign: isRTL ? 'right' : 'left', minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6, flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
            <h3 style={{
              margin: 0, fontSize: 'clamp(1.05rem, 1.6vw, 1.3rem)', fontWeight: 700, color: 'rgb(var(--text-primary))',
              letterSpacing: isRTL ? 0 : '-0.02em', fontFamily: font,
            }}>
              {isRTL ? solution.titleAR : solution.titleEN}
            </h3>
            <span style={{
              fontSize: 10.5, fontWeight: 600, color: solution.accent,
              background: `${solution.accent}0D`, border: `1px solid ${solution.accent}22`,
              padding: '2px 9px', borderRadius: 999, whiteSpace: 'nowrap',
            }}>
              {isRTL ? solution.tagAR : solution.tagEN}
            </span>
          </div>
          <p style={{
            margin: '0 0 10px', fontSize: 13, color: 'rgb(var(--text-secondary))', lineHeight: 1.65,
            fontFamily: font, maxWidth: '62ch',
          }}>
            {isRTL ? solution.descAR : solution.descEN}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
            {(isRTL ? solution.featuresAR : solution.featuresEN).map((f, i) => (
              <span key={i} style={{
                fontSize: 11, fontWeight: 500, color: 'rgb(var(--text-secondary))',
                background: 'rgb(var(--bg-surface))', padding: '3px 10px', borderRadius: 999, fontFamily: font,
              }}>
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Arrow — hidden on narrow screens, no room for it */}
        <ArrowRight
          aria-hidden
          className="solution-row-arrow"
          style={{
            width: 18, height: 18, color: solution.accent, flexShrink: 0, marginTop: 16,
            opacity: hovered ? 1 : 0,
            transform: `${isRTL ? 'scaleX(-1) ' : ''}translateX(${hovered ? 0 : (isRTL ? -6 : 6)}px)`,
            transition: 'opacity 0.25s ease, transform 0.3s cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      </div>
    </div>
  );
};

const SolutionsShowcase = ({ onStartProject }) => {
  const { isRTL } = useLanguage();
  const font = isRTL ? FONT_AR : FONT_EN;
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rows = listRef.current?.querySelectorAll('[data-solution-row]');
    if (prefersReduced) {
      gsap.set([headerRef.current, ...(rows || [])], { opacity: 1, y: 0 });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(headerRef.current, { opacity: 0, y: 24 }, {
        opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
      });
      if (rows?.length) {
        gsap.fromTo(rows, { opacity: 0, y: 20 }, {
          opacity: 1, y: 0, duration: 0.55, stagger: 0.05, ease: 'power3.out',
          scrollTrigger: { trigger: listRef.current, start: 'top 82%', once: true },
        });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        background: 'rgb(var(--bg-secondary))', borderTop: '1px solid rgb(var(--border))', borderBottom: '1px solid rgb(var(--border))',
        paddingTop: 'clamp(5rem, 10vw, 8rem)', paddingBottom: 'clamp(5rem, 10vw, 8rem)',
        paddingLeft: 'clamp(1.25rem, 5vw, 3rem)', paddingRight: 'clamp(1.25rem, 5vw, 3rem)',
      }}
      aria-label={isRTL ? 'ما نبنيه' : 'What we build'}
    >
      <style>{`
        @media (max-width: 560px) {
          .solution-row-arrow { display: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        {/* Header */}
        <div ref={headerRef} style={{ textAlign: isRTL ? 'right' : 'left', maxWidth: 700, marginBottom: 'clamp(2.5rem, 5vw, 4rem)', opacity: 0 }}>
          <span className="section-label" style={{ marginBottom: 18, display: 'inline-block' }}>
            {isRTL ? 'ما نبنيه' : 'What We Build'}
          </span>
          <h2 style={{
            fontSize: 'var(--text-5xl)', fontWeight: 800, lineHeight: 1.06,
            letterSpacing: isRTL ? 0 : '-0.035em', color: 'rgb(var(--text-primary))', margin: '0 0 16px', fontFamily: font,
          }}>
            {isRTL ? 'الحلول الرقمية وراء كل قطاع.' : 'The Digital Solutions Behind Every Industry.'}
          </h2>
          <p style={{ fontSize: 'clamp(0.9375rem, 1.1vw, 1.0625rem)', color: 'rgb(var(--text-secondary))', lineHeight: 1.75, margin: 0, fontFamily: font }}>
            {isRTL
              ? 'من المواقع إلى الذكاء الاصطناعي — هذه الأدوات التي نستخدمها لحل مشاكل القطاعات أعلاه، مهما كان تعقيد التحدي.'
              : "From websites to AI — this is the toolkit we draw from to solve the industry problems above, whatever the challenge looks like."}
          </p>
        </div>

        {/* List */}
        <div ref={listRef} style={{ borderTop: '1px solid rgb(var(--border))' }}>
          {SOLUTIONS.map((solution, i) => (
            <SolutionRow key={solution.titleEN} solution={solution} index={i} isRTL={isRTL} onStartProject={onStartProject} />
          ))}
        </div>

        {/* Footer note */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          marginTop: 'clamp(2rem, 4vw, 3rem)', paddingTop: 'clamp(1.5rem, 3vw, 2rem)', borderTop: '1px solid rgb(var(--border))',
        }}>
          <p style={{ margin: 0, fontSize: 13, color: 'rgb(var(--text-tertiary))', fontFamily: font, textAlign: isRTL ? 'right' : 'left' }}>
            {isRTL ? 'لا تجد ما تحتاجه؟ تواصل معنا — نبنيه.' : "Don't see what you need? Contact us — we'll build it."}
          </p>
          <button
            onClick={onStartProject}
            className="btn-primary"
            style={{ fontSize: '13.5px', padding: '13px 26px' }}
          >
            {isRTL ? 'ابدأ مشروعك' : 'Start Your Project'}
            <ArrowRight style={{ width: 15, height: 15, transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
};

export default SolutionsShowcase;
