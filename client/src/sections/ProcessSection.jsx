import { useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowUpRight } from 'lucide-react';

const STEPS = [
  {
    num: '01',
    titleEN: 'Discovery Call',
    titleAR: 'مكالمة الاكتشاف',
    descEN: 'We start with a free 30-minute consultation. We listen to your goals, ask the right questions, and understand your business before writing a single line of code.',
    descAR: 'نبدأ باستشارة مجانية 30 دقيقة. نستمع لأهدافك ونطرح الأسئلة الصحيحة ونفهم عملك قبل كتابة أي سطر كود.',
    tagEN: 'Free · 30 minutes',
    tagAR: 'مجاناً · 30 دقيقة',
    accentColor: '#2563EB',
  },
  {
    num: '02',
    titleEN: 'Proposal & Planning',
    titleAR: 'العرض والتخطيط',
    descEN: 'You receive a clear proposal within 48 hours — scope, timeline, milestones, and pricing. No hidden fees. No vague estimates. You decide with full information.',
    descAR: 'تتلقى عرضاً واضحاً خلال 48 ساعة — النطاق والجدول والمراحل والتسعير. لا رسوم مخفية. لا تقديرات ضبابية.',
    tagEN: 'Within 48 hours',
    tagAR: 'خلال 48 ساعة',
    accentColor: '#7C3AED',
  },
  {
    num: '03',
    titleEN: 'Design & Prototype',
    titleAR: 'التصميم والنموذج الأولي',
    descEN: 'Before any development starts, we build interactive prototypes of your product. You see and interact with it before we code anything — revisions are easy at this stage.',
    descAR: 'قبل أي تطوير، نبني نماذج تفاعلية لمنتجك. تراه وتتفاعل معه قبل أن نبدأ البرمجة. التعديلات سهلة في هذه المرحلة.',
    tagEN: 'You see it before we code',
    tagAR: 'تراه قبل البرمجة',
    accentColor: '#0891B2',
  },
  {
    num: '04',
    titleEN: 'Development',
    titleAR: 'التطوير',
    descEN: 'Weekly progress updates. You have access to a staging environment from day one. Every week you can see exactly what\'s been built — no silent weeks.',
    descAR: 'تحديثات أسبوعية. لديك وصول لبيئة التجربة من اليوم الأول. كل أسبوع ترى بالضبط ما تم بناؤه — لا أسابيع صامتة.',
    tagEN: 'Weekly updates',
    tagAR: 'تحديثات أسبوعية',
    accentColor: '#059669',
  },
  {
    num: '05',
    titleEN: 'Testing & QA',
    titleAR: 'الاختبار وضمان الجودة',
    descEN: 'Rigorous testing across all devices and browsers. We test every user flow before delivery. You get a bug-free product — not a beta version.',
    descAR: 'اختبار شامل على جميع الأجهزة والمتصفحات. نختبر كل تدفق مستخدم قبل التسليم. تحصل على منتج خالٍ من الأخطاء.',
    tagEN: 'All devices & browsers',
    tagAR: 'كل الأجهزة والمتصفحات',
    accentColor: '#D97706',
  },
  {
    num: '06',
    titleEN: 'Launch & Support',
    titleAR: 'الإطلاق والدعم',
    descEN: 'We handle the deployment. Then 30 days of free technical support — bug fixes, performance monitoring, and tweaks. You are never left alone after delivery.',
    descAR: 'نتولى النشر. ثم 30 يوماً من الدعم التقني المجاني — إصلاح أخطاء ومراقبة أداء وتعديلات. لا تُترك وحيداً بعد التسليم.',
    tagEN: '30 days free support',
    tagAR: '30 يوماً دعم مجاني',
    accentColor: '#DC2626',
  },
];

const ProcessSection = ({ sectionRef, isRTL, onStartProject }) => {
  const { isRTL: ctxRTL } = useLanguage();
  const rtl = isRTL ?? ctxRTL;
  const listRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = el.querySelectorAll('[data-step]');
    if (prefersReduced) {
      items.forEach(c => { c.style.opacity = '1'; c.style.transform = 'none'; });
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          items.forEach((c, i) => {
            setTimeout(() => {
              c.style.transition = `opacity 0.65s cubic-bezier(0.16,1,0.3,1), transform 0.65s cubic-bezier(0.16,1,0.3,1)`;
              c.style.opacity = '1';
              c.style.transform = 'translateY(0)';
            }, i * 90);
          });
          io.disconnect();
        }
      });
    }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      id="process"
      ref={sectionRef}
      dir={rtl ? 'rtl' : 'ltr'}
      style={{
        background: '#FAFAFA',
        paddingTop:    'clamp(5rem, 10vw, 8rem)',
        paddingBottom: 'clamp(5rem, 10vw, 8rem)',
        paddingLeft:   'clamp(1.25rem, 5vw, 3rem)',
        paddingRight:  'clamp(1.25rem, 5vw, 3rem)',
        borderTop: '1px solid #E8EBF0',
      }}
    >
      <style>{`
        .process-row {
          display: grid;
          grid-template-columns: clamp(56px, 8vw, 96px) 1fr;
          gap: 0 clamp(24px, 4vw, 48px);
          align-items: start;
          position: relative;
        }
        [dir="rtl"] .process-row {
          grid-template-columns: 1fr clamp(56px, 8vw, 96px);
        }
        .process-num-col {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        [dir="rtl"] .process-num-col {
          order: 2;
        }
        .process-content-col {
          padding-bottom: clamp(2.5rem, 5vw, 4rem);
        }
        [dir="rtl"] .process-content-col {
          order: 1;
          text-align: right;
        }
        .process-num-circle {
          width: clamp(48px, 7vw, 72px);
          height: clamp(48px, 7vw, 72px);
          border-radius: 50%;
          border: 1.5px solid #E8EBF0;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: clamp(12px, 1.2vw, 14px);
          font-weight: 800;
          color: #9BA3AE;
          letter-spacing: 0.04em;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
          transition: border-color 0.3s, color 0.3s, background 0.3s;
        }
        .process-row:hover .process-num-circle {
          border-color: currentColor;
        }
        .process-num-line {
          width: 1.5px;
          flex: 1;
          min-height: clamp(2rem, 4vw, 3rem);
          background: linear-gradient(to bottom, #E8EBF0, transparent);
          margin-top: 8px;
        }
        .process-title {
          font-size: clamp(1.25rem, 2vw, 1.625rem);
          font-weight: 700;
          color: #0D1117;
          margin: 0 0 10px;
          letter-spacing: -0.025em;
          line-height: 1.2;
        }
        [dir="rtl"] .process-title {
          font-family: 'IBM Plex Sans Arabic', 'Alexandria', system-ui, sans-serif;
          letter-spacing: 0;
          line-height: 1.35;
        }
        .process-desc {
          font-size: clamp(0.9375rem, 1vw, 1.0625rem);
          color: #5C6370;
          line-height: 1.75;
          margin: 0 0 14px;
          max-width: 640px;
        }
        [dir="rtl"] .process-desc {
          font-family: 'IBM Plex Sans Arabic', 'Alexandria', system-ui, sans-serif;
          line-height: 1.9;
        }
        .process-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 700;
          color: #9BA3AE;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        [dir="rtl"] .process-tag { letter-spacing: 0; text-transform: none; }
        .process-tag-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .process-step-num-top {
          font-size: clamp(0.6875rem, 1vw, 0.75rem);
          font-weight: 700;
          color: #9BA3AE;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 10px;
        }
        [dir="rtl"] .process-step-num-top { letter-spacing: 0; text-transform: none; }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
          gap: 'clamp(2rem, 4vw, 4rem)',
          alignItems: 'end',
          marginBottom: 'clamp(4rem, 8vw, 7rem)',
        }}>
          <div style={{ textAlign: rtl ? 'right' : 'left' }}>
            <span className="section-label" style={{ marginBottom: 20, display: 'inline-block' }}>
              {rtl ? 'كيف نعمل' : 'Our Process'}
            </span>
            <h2 style={{
              fontSize: 'var(--text-5xl)',
              fontWeight: 800,
              lineHeight: 1.0,
              letterSpacing: rtl ? 0 : '-0.035em',
              color: '#0D1117',
              margin: 0,
              fontFamily: rtl ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
            }}>
              {rtl ? 'من اليوم الأول\nتعرف ما يحدث.' : 'From day one,\nyou know exactly\nwhat\'s happening.'}
            </h2>
          </div>
          <div style={{ textAlign: rtl ? 'right' : 'left' }}>
            <p style={{
              fontSize: 'clamp(1rem, 1.2vw, 1.125rem)',
              color: '#5C6370',
              lineHeight: 1.75,
              margin: '0 0 clamp(1.5rem, 3vw, 2rem)',
              fontFamily: rtl ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
            }}>
              {rtl
                ? 'لا أسابيع صامتة، لا مفاجآت في التسليم. نبني بشفافية كاملة — ترى التقدم كل أسبوع.'
                : 'No silent weeks, no delivery surprises. We build with full transparency — you see real progress every single week.'}
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              justifyContent: rtl ? 'flex-end' : 'flex-start',
            }}>
              {(rtl
                ? ['6 مراحل', '14 يوم متوسط', 'تحديثات أسبوعية']
                : ['6 Milestones', '14d average', 'Weekly updates']
              ).map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#2563EB', flexShrink: 0 }} aria-hidden />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#5C6370' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Steps */}
        <div ref={listRef}>
          {STEPS.map((step, i) => (
            <div
              key={i}
              data-step
              className="process-row"
              style={{
                opacity: 0,
                transform: 'translateY(20px)',
              }}
            >
              {/* Number column */}
              <div className="process-num-col">
                <div
                  className="process-num-circle"
                  style={{ color: step.accentColor }}
                >
                  {step.num}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="process-num-line" />
                )}
              </div>

              {/* Content column */}
              <div className="process-content-col">
                <div className="process-step-num-top" aria-hidden>
                  {rtl ? `الخطوة ${step.num}` : `Step ${step.num}`}
                </div>
                <h3 className="process-title"
                  style={{
                    fontFamily: rtl ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
                  }}
                >
                  {rtl ? step.titleAR : step.titleEN}
                </h3>
                <p className="process-desc"
                  style={{
                    fontFamily: rtl ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
                  }}
                >
                  {rtl ? step.descAR : step.descEN}
                </p>
                <div className="process-tag">
                  <span className="process-tag-dot" style={{ background: step.accentColor }} aria-hidden />
                  {rtl ? step.tagAR : step.tagEN}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          marginTop: 'clamp(4rem, 8vw, 6rem)',
          paddingTop: 'clamp(3rem, 6vw, 5rem)',
          borderTop: '1px solid #E8EBF0',
        }}>
          <button
            onClick={onStartProject}
            className="btn-primary"
            style={{ fontSize: '14px', padding: '14px 32px' }}
          >
            {rtl ? 'ابدأ عملية المشروع' : 'Start the Project Process'}
            <ArrowUpRight style={{ width: 15, height: 15, transform: rtl ? 'scaleX(-1)' : 'none' }} aria-hidden />
          </button>
          <p style={{ fontSize: 12.5, color: '#9BA3AE', margin: 0, textAlign: 'center' }}>
            {rtl ? 'استشارة مجانية · لا التزام · رد خلال ساعتين' : 'Free consultation · No commitment · Reply within 2 hours'}
          </p>
        </div>

      </div>
    </section>
  );
};

export default ProcessSection;
