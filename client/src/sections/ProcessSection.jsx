import { useLanguage } from '../contexts/LanguageContext';
import { ArrowUpRight } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import { RevealItems } from '../components/Reveal';
import ImagePlaceholder from '../components/ImagePlaceholder';

const STEPS = [
  {
    num: '01',
    titleEN: 'Discovery Call',
    titleAR: 'مكالمة الاكتشاف',
    descEN: 'A free 30-minute consultation. We listen to your goals and understand your business before writing a single line of code.',
    descAR: 'استشارة مجانية 30 دقيقة. نستمع لأهدافك ونفهم عملك قبل كتابة أي سطر كود.',
    tagEN: 'Free · 30 minutes',
    tagAR: 'مجاناً · 30 دقيقة',
    accentColor: 'rgb(var(--accent))',
  },
  {
    num: '02',
    titleEN: 'Proposal & Planning',
    titleAR: 'العرض والتخطيط',
    descEN: 'A clear proposal within 48 hours — scope, timeline, milestones, pricing. No hidden fees, no vague estimates.',
    descAR: 'عرض واضح خلال 48 ساعة — النطاق والجدول والمراحل والتسعير. لا رسوم مخفية ولا تقديرات ضبابية.',
    tagEN: 'Within 48 hours',
    tagAR: 'خلال 48 ساعة',
    accentColor: '#7C3AED',
  },
  {
    num: '03',
    titleEN: 'Design & Prototype',
    titleAR: 'التصميم والنموذج الأولي',
    descEN: 'We build interactive prototypes first. You see and click through your product before we code it — revisions are cheap at this stage.',
    descAR: 'نبني نماذج تفاعلية أولاً. ترى منتجك وتتفاعل معه قبل برمجته — التعديلات سهلة في هذه المرحلة.',
    tagEN: 'You see it before we code',
    tagAR: 'تراه قبل البرمجة',
    accentColor: '#0891B2',
  },
  {
    num: '04',
    titleEN: 'Development',
    titleAR: 'التطوير',
    descEN: 'A staging environment from day one and weekly progress updates. Every week you see exactly what was built — no silent weeks.',
    descAR: 'بيئة تجربة من اليوم الأول وتحديثات أسبوعية. كل أسبوع ترى ما تم بناؤه بالضبط — لا أسابيع صامتة.',
    tagEN: 'Weekly updates',
    tagAR: 'تحديثات أسبوعية',
    accentColor: '#059669',
  },
  {
    num: '05',
    titleEN: 'Testing & QA',
    titleAR: 'الاختبار وضمان الجودة',
    descEN: 'Every user flow tested across devices and browsers before delivery. You get a finished product, not a beta.',
    descAR: 'اختبار كل تدفق مستخدم على جميع الأجهزة والمتصفحات قبل التسليم. تحصل على منتج نهائي لا نسخة تجريبية.',
    tagEN: 'All devices & browsers',
    tagAR: 'كل الأجهزة والمتصفحات',
    accentColor: '#D97706',
  },
  {
    num: '06',
    titleEN: 'Launch & Support',
    titleAR: 'الإطلاق والدعم',
    descEN: 'We handle deployment, then 30 days of free technical support — fixes, monitoring, and tweaks. You are never left alone after delivery.',
    descAR: 'نتولى النشر، ثم 30 يوماً من الدعم التقني المجاني — إصلاحات ومراقبة وتعديلات. لا تُترك وحيداً بعد التسليم.',
    tagEN: '30 days free support',
    tagAR: '30 يوماً دعم مجاني',
    accentColor: '#DC2626',
  },
];

/**
 * The six delivery milestones.
 *
 * Previously a single-column vertical timeline where each step occupied a full
 * ~370px row — 2,236px for the section, the tallest on the page, for content
 * that is scanned rather than read. It is now a 3-up grid of compact cards
 * (single column only on phones, where vertical scrolling is the native
 * gesture anyway), which keeps the numbered sequence legible at a glance.
 */
const ProcessSection = ({ sectionRef, isRTL, onStartProject }) => {
  const { isRTL: ctxRTL } = useLanguage();
  const rtl = isRTL ?? ctxRTL;

  return (
    <section
      id="process"
      ref={sectionRef}
      dir={rtl ? 'rtl' : 'ltr'}
      className="section-shell section-shell--tint"
    >
      <style>{`
        .process-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(14px, 1.8vw, 22px);
        }
        @media (max-width: 900px) { .process-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .process-grid { grid-template-columns: 1fr; } }

        .process-card {
          position: relative;
          background: rgb(var(--bg-elevated));
          border: 1px solid rgb(var(--border));
          border-radius: 16px;
          padding: clamp(20px, 2.2vw, 26px);
          height: 100%;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          text-align: ${rtl ? 'right' : 'left'};
          overflow: hidden;
          transition: border-color 0.25s ease, box-shadow 0.3s cubic-bezier(0.16,1,0.3,1),
                      transform 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        .process-card::before {
          content: '';
          position: absolute;
          inset-inline: 0;
          top: 0;
          height: 2px;
          background: var(--step-accent);
          transform: scaleX(0);
          transform-origin: ${rtl ? 'right' : 'left'};
          transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
        }
        .process-card:hover {
          border-color: rgb(var(--border-strong));
          box-shadow: var(--shadow-card-hover);
          transform: translateY(-3px);
        }
        .process-card:hover::before { transform: scaleX(1); }

        .process-card-top {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }
        .process-num-chip {
          width: 34px; height: 34px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800;
          font-variant-numeric: tabular-nums;
          flex-shrink: 0;
          background: color-mix(in srgb, var(--step-accent) 9%, rgb(var(--bg-elevated)));
          border: 1px solid color-mix(in srgb, var(--step-accent) 22%, rgb(var(--bg-elevated)));
          color: var(--step-accent);
          transition: background 0.3s ease, color 0.3s ease;
        }
        .process-card:hover .process-num-chip {
          background: var(--step-accent);
          color: rgb(var(--bg-elevated));
        }
        .process-tag {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 10.5px; font-weight: 700;
          color: rgb(var(--text-tertiary));
          text-transform: uppercase;
          letter-spacing: 0.07em;
          min-width: 0;
        }
        [dir="rtl"] .process-tag { letter-spacing: 0; text-transform: none; font-size: 11px; }
        .process-tag-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; background: var(--step-accent); }

        .process-title {
          font-size: clamp(0.9375rem, 1.15vw, 1.0625rem);
          font-weight: 700;
          color: rgb(var(--text-primary));
          margin: 0 0 8px;
          letter-spacing: -0.02em;
          line-height: 1.3;
        }
        [dir="rtl"] .process-title {
          font-family: var(--font-arabic);
          letter-spacing: 0;
          line-height: 1.45;
        }
        .process-desc {
          font-size: 13px;
          color: rgb(var(--text-secondary));
          line-height: 1.65;
          margin: 0;
        }
        [dir="rtl"] .process-desc { font-family: var(--font-arabic); line-height: 1.85; }

        .process-meta {
          display: flex; align-items: center; flex-wrap: wrap;
          gap: 8px clamp(14px, 2vw, 22px);
          justify-content: ${rtl ? 'flex-end' : 'flex-start'};
        }
        .process-meta-item { display: flex; align-items: center; gap: 6px; }
      `}</style>

      <div className="section-inner">
        <SectionHeader
          eyebrow={rtl ? 'كيف نعمل' : 'Our Process'}
          title={rtl ? 'من اليوم الأول\nتعرف ما يحدث.' : "From day one,\nyou know exactly\nwhat's happening."}
          lead={rtl
            ? 'لا أسابيع صامتة، لا مفاجآت في التسليم. نبني بشفافية كاملة — ترى التقدم كل أسبوع.'
            : 'No silent weeks, no delivery surprises. We build with full transparency — you see real progress every single week.'}
          action={
            <div className="process-meta">
              {(rtl
                ? ['6 مراحل', 'حسب نطاق مشروعك', 'تحديثات أسبوعية']
                : ['6 milestones', 'Scoped to your project', 'Weekly updates']
              ).map((item, i) => (
                <div key={i} className="process-meta-item">
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgb(var(--accent))', flexShrink: 0 }} aria-hidden />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'rgb(var(--text-secondary))' }}>{item}</span>
                </div>
              ))}
            </div>
          }
        />

 <img
  src="/Luminous Modular Architecture.png"
  alt={rtl ? "مراحل تنفيذ المشروع" : "Project Workflow"}
  loading="lazy"
  style={{
    width: "100%",
    marginBottom: "clamp(1.75rem, 3.5vw, 2.75rem)",
    height: "auto",
    objectFit: "contain",
    display: "block",
  }}
/>

        <RevealItems className="process-grid" step={0.06}>
          {STEPS.map((step) => (
            <article
              key={step.num}
              className="process-card"
              style={{ '--step-accent': step.accentColor }}
            >
              <div className="process-card-top">
                <span className="process-num-chip" aria-hidden>{step.num}</span>
                <span className="process-tag">
                  <span className="process-tag-dot" aria-hidden />
                  {rtl ? step.tagAR : step.tagEN}
                </span>
              </div>
              <h3 className="process-title">
                <span className="sr-only">{rtl ? `الخطوة ${step.num}: ` : `Step ${step.num}: `}</span>
                {rtl ? step.titleAR : step.titleEN}
              </h3>
              <p className="process-desc">{rtl ? step.descAR : step.descEN}</p>
            </article>
          ))}
        </RevealItems>

        {/* CTA */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          marginTop: 'clamp(3rem, 6vw, 4.5rem)',
          paddingTop: 'clamp(2.5rem, 5vw, 3.5rem)',
          borderTop: '1px solid rgb(var(--border))',
        }}>
          <button
            onClick={onStartProject}
            className="btn-primary"
            style={{ fontSize: '14px', padding: '14px 32px' }}
          >
            {rtl ? 'ابدأ عملية المشروع' : 'Start the Project Process'}
            <ArrowUpRight style={{ width: 15, height: 15, transform: rtl ? 'scaleX(-1)' : 'none' }} aria-hidden />
          </button>
          <p style={{ fontSize: 12.5, color: 'rgb(var(--text-tertiary))', margin: 0, textAlign: 'center' }}>
            {rtl ? 'استشارة مجانية · لا التزام · رد خلال ساعتين' : 'Free consultation · No commitment · Reply within 2 hours'}
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
