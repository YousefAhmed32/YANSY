import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSEO } from '../hooks/useSEO';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProjectRequestForm from '../components/ProjectRequestForm';
import WhyYANSY from '../components/WhyYANSY';

const FONT_EN = "'Inter',system-ui,sans-serif";
const FONT_AR = "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif";

const PILLARS = [
  {
    icon: '📋',
    titleEN: 'Transparent Process',
    titleAR: 'عملية شفافة',
    descEN: 'Every milestone, deadline, and deliverable is agreed in writing before we start. No surprise scope, no vague timelines — you always know what happens next.',
    descAR: 'كل مرحلة وموعد ومُخرج متفق عليه كتابياً قبل البدء. لا مفاجآت في النطاق، لا مواعيد غامضة — تعرف دائماً الخطوة التالية.',
  },
  {
    icon: '🔑',
    titleEN: 'Full Code Ownership',
    titleAR: 'ملكية كاملة للكود',
    descEN: 'After final delivery, every line of code, every asset, and every credential is yours. No recurring license fees, no vendor lock-in, no dependency on us to keep running.',
    descAR: 'بعد التسليم النهائي، كل سطر كود وكل ملف وكل بيانات دخول ملكك. لا رسوم ترخيص متكررة، لا ارتباط بمزود واحد، لا اعتماد علينا لتشغيل نظامك.',
  },
  {
    icon: '⚙️',
    titleEN: 'Modern Technology',
    titleAR: 'تقنيات حديثة',
    descEN: 'React, Next.js, Node.js, PostgreSQL — production-grade tools chosen for your specific project, not whatever is trendy. Built to be maintained by any competent developer after us.',
    descAR: 'React وNext.js وNode.js وPostgreSQL — أدوات إنتاجية تُختار حسب مشروعك تحديداً، لا حسب الموضة. مبنية ليصيانها أي مطوّر كفء بعدنا.',
  },
  {
    icon: '⚡',
    titleEN: 'Performance First',
    titleAR: 'الأداء أولاً',
    descEN: 'Sub-2-second load times, optimized images, and lean bundles by default — not an afterthought. Every project ships with Core Web Vitals in mind.',
    descAR: 'أوقات تحميل أقل من ثانيتين، صور محسّنة، وحزم خفيفة كأمر افتراضي — ليس فكرة لاحقة. كل مشروع يُبنى مع مراعاة معايير الأداء الأساسية.',
  },
  {
    icon: '🛡️',
    titleEN: 'Security by Default',
    titleAR: 'أمان افتراضي',
    descEN: 'Encrypted data, secure authentication, and OWASP-standard practices on every build — protecting your business and your customers from day one.',
    descAR: 'بيانات مشفّرة، مصادقة آمنة، ومعايير OWASP في كل بناء — حماية لعملك وعملائك من اليوم الأول.',
  },
  {
    icon: '🚀',
    titleEN: 'SEO & Scalability',
    titleAR: 'SEO وقابلية التوسع',
    descEN: 'Server-side rendering, structured data, and clean semantic markup so Google finds you — on an architecture that scales from 100 to 100,000 users without a rebuild.',
    descAR: 'عرض من جانب الخادم، بيانات منظّمة، وهيكل دلالي نظيف ليجدك Google — على بنية تتوسع من 100 إلى 100,000 مستخدم بدون إعادة بناء.',
  },
  {
    icon: '🤝',
    titleEN: 'Real Ongoing Support',
    titleAR: 'دعم حقيقي مستمر',
    descEN: '30 days of free post-launch support included in every project — bug fixes, monitoring, and minor tweaks. Affordable maintenance plans after that, never mandatory.',
    descAR: '30 يوماً دعم مجاني بعد الإطلاق مشمولة في كل مشروع — إصلاح أخطاء ومراقبة وتعديلات بسيطة. باقات صيانة اقتصادية بعدها، وليست إجبارية أبداً.',
  },
  {
    icon: '💬',
    titleEN: 'Direct Access to the Team',
    titleAR: 'تواصل مباشر مع الفريق',
    descEN: 'No account managers relaying messages. You talk directly to the people building your product, on WhatsApp, with replies typically within 2 hours.',
    descAR: 'بدون مدراء حسابات ينقلون الرسائل. تتحدث مباشرة مع من يبني منتجك، عبر واتساب، وعادة برد خلال ساعتين.',
  },
];

const FAQS = [
  {
    id: 'leave',
    qEN: 'What if I want to stop mid-project?',
    qAR: 'ماذا لو أردت التوقف في منتصف المشروع؟',
    aEN: 'You keep everything built and paid for up to that milestone — full source code included. Payments are milestone-based specifically so you\'re never locked into paying for work you haven\'t seen.',
    aAR: 'تحتفظ بكل ما تم بناؤه ودفعه حتى تلك المرحلة — مع الكود المصدري كاملاً. الدفعات مقسّمة على مراحل حتى لا تُلزم بدفع مقابل عمل لم تره.',
  },
  {
    id: 'break',
    qEN: 'What if something breaks after launch?',
    qAR: 'ماذا لو حدث خطأ بعد الإطلاق؟',
    aEN: '30 days of free support are included with every project. After that, we offer affordable monthly maintenance — or you can hand it to any developer, since you own the code and it\'s built on standard, documented technology.',
    aAR: 'كل مشروع يشمل 30 يوماً دعم مجاني. بعدها نوفر باقات صيانة شهرية اقتصادية — أو يمكنك تسليمه لأي مطوّر آخر لأنك تملك الكود وهو مبني بتقنيات موثقة وقياسية.',
  },
  {
    id: 'compare',
    qEN: "How is this different from hiring on Fiverr or Upwork?",
    qAR: 'ما الفرق بين هذا وبين التوظيف عبر Fiverr أو Upwork؟',
    aEN: 'A freelancer is one person juggling multiple clients with no backup if they disappear. YANSY is a structured team — design, development, and QA — with a written process and accountability. You get agency reliability at freelancer-adjacent pricing.',
    aAR: 'الفريلانسر شخص واحد يوازن عملاء متعددين بدون بديل لو اختفى. YANSY فريق منظم — تصميم وتطوير وجودة — بعملية مكتوبة ومساءلة. تحصل على موثوقية الوكالة بسعر قريب من الفريلانسر.',
  },
  {
    id: 'guarantee',
    qEN: 'Do you guarantee results?',
    qAR: 'هل تضمنون النتائج؟',
    aEN: 'We guarantee the product we scope and agree on gets delivered on time, on spec, and fully functional — that\'s within our control. Business outcomes (sales, bookings) depend on your market too, which is why we always start with a free consultation to set honest expectations.',
    aAR: 'نضمن أن المنتج المتفق عليه يُسلَّم في الموعد وبالمواصفات ويعمل بالكامل — هذا ضمن سيطرتنا. النتائج التجارية (مبيعات، حجوزات) تعتمد على سوقك أيضاً، لذا نبدأ دائماً باستشارة مجانية لضبط توقعات صادقة.',
  },
];

const FAQItem = ({ faq, isOpen, onToggle, isRTL, idx }) => {
  const panelId = `wy-faq-panel-${faq.id}`;
  const buttonId = `wy-faq-button-${faq.id}`;
  return (
    <div style={{ borderBottom: '1px solid rgb(var(--border))' }}>
      <button
        id={buttonId}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        style={{
          width: '100%', display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center',
          gap: 'clamp(12px, 2vw, 20px)', padding: 'clamp(16px, 2.2vw, 22px) 0',
          background: 'none', border: 'none', cursor: 'pointer', direction: isRTL ? 'rtl' : 'ltr',
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 800, color: isOpen ? 'rgb(var(--accent))' : 'rgb(var(--border-strong))', minWidth: 24, textAlign: isRTL ? 'right' : 'left' }}>
          {String(idx + 1).padStart(2, '0')}
        </span>
        <h3 style={{
          margin: 0, fontSize: 'clamp(0.9375rem, 1.1vw, 1.0625rem)', fontWeight: 600,
          color: isOpen ? 'rgb(var(--text-primary))' : 'rgb(var(--text-secondary))', fontFamily: isRTL ? FONT_AR : FONT_EN,
          lineHeight: 1.4, textAlign: isRTL ? 'right' : 'left',
        }}>
          {isRTL ? faq.qAR : faq.qEN}
        </h3>
        <span aria-hidden style={{
          flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
          border: `1.5px solid ${isOpen ? 'rgb(var(--text-primary))' : 'rgb(var(--border))'}`, background: isOpen ? 'rgb(var(--text-primary))' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: isOpen ? 'rgb(var(--bg-elevated))' : 'rgb(var(--text-tertiary))', fontSize: 15,
        }}>
          {isOpen ? '−' : '+'}
        </span>
      </button>
      <div id={panelId} role="region" aria-labelledby={buttonId} style={{ overflow: 'hidden', maxHeight: isOpen ? '320px' : '0px', transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1)' }}>
        <p style={{
          margin: '0 0 clamp(16px, 2.2vw, 22px)', fontSize: 'clamp(0.875rem, 1vw, 1rem)', color: 'rgb(var(--text-secondary))',
          lineHeight: 1.8, fontFamily: isRTL ? FONT_AR : FONT_EN, paddingInlineStart: 'clamp(34px, 5vw, 44px)', textAlign: isRTL ? 'right' : 'left',
        }}>
          {isRTL ? faq.aAR : faq.aEN}
        </p>
      </div>
    </div>
  );
};

const WhyYansyPage = () => {
  const { isRTL } = useLanguage();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useSEO({
    title: 'Why YANSY | YANSY TECH',
    description: 'Why founders choose YANSY over freelancers and generic agencies — transparent process, full code ownership, modern technology, and real ongoing support.',
    keywords: 'why choose YANSY, digital agency vs freelancer, software agency ownership, YANSY tech reviews',
    canonical: 'https://yansytech.com/why-yansy',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          url: 'https://yansytech.com/why-yansy',
          name: 'Why YANSY | YANSY TECH',
          isPartOf: { '@id': 'https://yansytech.com/#website' },
          breadcrumb: {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://yansytech.com/' },
              { '@type': 'ListItem', position: 2, name: 'Why YANSY', item: 'https://yansytech.com/why-yansy' },
            ],
          },
        },
        {
          '@type': 'FAQPage',
          mainEntity: FAQS.map(f => ({
            '@type': 'Question',
            name: f.qEN,
            acceptedAnswer: { '@type': 'Answer', text: f.aEN },
          })),
        },
      ],
    },
  });

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
          <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
            <span className="section-label" style={{ marginBottom: 20, display: 'inline-block' }}>
              {isRTL ? 'لماذا YANSY' : 'Why YANSY'}
            </span>
            <h1 style={{
              fontSize: 'var(--text-5xl)', fontWeight: 800, lineHeight: 1.05,
              letterSpacing: isRTL ? 0 : '-0.035em', color: 'rgb(var(--text-primary))',
              margin: '0 0 clamp(1.25rem, 2.5vw, 1.75rem)',
              fontFamily: isRTL ? FONT_AR : FONT_EN,
            }}>
              {isRTL ? 'الثقة تُبنى بالشفافية،\nليس بالوعود.' : 'Trust is built on transparency, not promises.'}
            </h1>
            <p style={{
              fontSize: 'clamp(0.9375rem, 1.1vw, 1.0625rem)', color: 'rgb(var(--text-secondary))', lineHeight: 1.75,
              margin: '0 auto', maxWidth: '52ch', fontFamily: isRTL ? FONT_AR : FONT_EN,
            }}>
              {isRTL
                ? 'كل قرار اتخذناه في بناء YANSY كان لحل مشكلة حقيقية واجهها أصحاب الأعمال مع الفريلانسر والوكالات التقليدية.'
                : "Every decision behind how YANSY operates was made to solve a real problem business owners face with freelancers and traditional agencies."}
            </p>
          </div>
        </section>

        {/* ── PILLARS GRID ──────────────────────────────────────── */}
        <section style={{
          paddingTop: 'clamp(5rem, 10vw, 8rem)',
          paddingBottom: 'clamp(5rem, 10vw, 8rem)',
          paddingLeft: 'clamp(1.25rem, 5vw, 3rem)',
          paddingRight: 'clamp(1.25rem, 5vw, 3rem)',
        }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 'clamp(3rem, 6vw, 5rem)' }}>
              <span className="section-label" style={{ marginBottom: 20, display: 'inline-block' }}>
                {isRTL ? 'ما نلتزم به' : 'What We Commit To'}
              </span>
              <h2 style={{
                fontSize: 'var(--text-5xl)', fontWeight: 800, lineHeight: 1.05,
                letterSpacing: isRTL ? 0 : '-0.035em', color: 'rgb(var(--text-primary))', margin: '0 auto', maxWidth: '20ch',
                fontFamily: isRTL ? FONT_AR : FONT_EN,
              }}>
                {isRTL ? 'ثمانية التزامات في كل مشروع.' : 'Eight commitments on every project.'}
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'clamp(12px, 1.5vw, 18px)' }}>
              {PILLARS.map((p, i) => (
                <div key={i} style={{
                  background: 'rgb(var(--bg-elevated))', border: '1px solid rgb(var(--border))', borderRadius: 16,
                  padding: 'clamp(22px, 2.5vw, 28px)', transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
                }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(37,99,235,0.10)'; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgb(var(--border))'; }}
                >
                  <div style={{ fontSize: 26, marginBottom: 14 }} aria-hidden>{p.icon}</div>
                  <h3 style={{
                    margin: '0 0 8px', fontSize: 15.5, fontWeight: 700, color: 'rgb(var(--text-primary))',
                    fontFamily: isRTL ? FONT_AR : FONT_EN, textAlign: isRTL ? 'right' : 'left',
                  }}>
                    {isRTL ? p.titleAR : p.titleEN}
                  </h3>
                  <p style={{
                    margin: 0, fontSize: 13, color: 'rgb(var(--text-secondary))', lineHeight: 1.7,
                    fontFamily: isRTL ? FONT_AR : FONT_EN, textAlign: isRTL ? 'right' : 'left',
                  }}>
                    {isRTL ? p.descAR : p.descEN}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMPARISON TABLE (reused component) ──────────────── */}
        <WhyYANSY onStartProject={() => setIsFormOpen(true)} />

        {/* ── MINI FAQ ──────────────────────────────────────────── */}
        <section style={{
          background: 'rgb(var(--bg-secondary))', borderTop: '1px solid rgb(var(--border))',
          paddingTop: 'clamp(5rem, 10vw, 8rem)', paddingBottom: 'clamp(5rem, 10vw, 8rem)',
          paddingLeft: 'clamp(1.25rem, 5vw, 3rem)', paddingRight: 'clamp(1.25rem, 5vw, 3rem)',
        }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem, 5vw, 3.5rem)' }}>
              <span className="section-label" style={{ marginBottom: 20, display: 'inline-block' }}>
                {isRTL ? 'أسئلة صريحة' : 'Straight Answers'}
              </span>
              <h2 style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, lineHeight: 1.1,
                letterSpacing: isRTL ? 0 : '-0.03em', color: 'rgb(var(--text-primary))', margin: 0,
                fontFamily: isRTL ? FONT_AR : FONT_EN,
              }}>
                {isRTL ? 'الأسئلة التي يطرحها أصحاب الأعمال فعلاً' : 'What business owners actually ask us'}
              </h2>
            </div>
            {FAQS.map((faq, i) => (
              <FAQItem key={faq.id} faq={faq} idx={i} isOpen={openFaq === faq.id} onToggle={() => setOpenFaq(openFaq === faq.id ? null : faq.id)} isRTL={isRTL} />
            ))}
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────── */}
        <section style={{ padding: 'clamp(5rem,10vw,7rem) 0', textAlign: 'center' }}>
          <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 20px' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: 'rgb(var(--text-primary))',
              lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 1.5rem',
              fontFamily: isRTL ? FONT_AR : FONT_EN,
            }}>
              {isRTL ? 'اختبر الفرق بنفسك.' : 'See the difference for yourself.'}
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'rgb(var(--text-secondary))', lineHeight: 1.8, margin: '0 0 2.5rem', fontFamily: isRTL ? FONT_AR : FONT_EN }}>
              {isRTL ? 'استشارة مجانية 30 دقيقة — بدون التزام.' : 'Free 30-minute consultation — no obligation.'}
            </p>
            <button onClick={() => setIsFormOpen(true)} className="btn-primary" style={{ fontSize: '13.5px', padding: '14px 32px' }}>
              {isRTL ? 'ابدأ مع YANSY' : 'Start With YANSY'}
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

export default WhyYansyPage;
