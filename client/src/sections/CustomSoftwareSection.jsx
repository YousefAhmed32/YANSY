import { useLanguage } from '../contexts/LanguageContext';
import SectionHeader from '../components/SectionHeader';
import ImagePlaceholder from '../components/ImagePlaceholder';
import { RevealItems } from '../components/Reveal';

const CARDS = [
  {
    accent: 'rgb(var(--accent))',
    titleEN: 'Understand Your Business',
    titleAR: 'فهم عملك بعمق',
    descEN: 'We start with your operations, not a feature checklist — mapping how work actually moves through your team.',
    descAR: 'نبدأ بفهم عملياتك الفعلية، لا بقائمة ميزات جاهزة — نرسم كيف تتحرك المهام داخل فريقك.',
  },
  {
    accent: '#7C3AED',
    titleEN: 'Brand-first Design',
    titleAR: 'تصميم يعكس هويتك',
    descEN: 'Every screen is designed around your identity, not a generic theme that looks like everyone else\'s.',
    descAR: 'كل شاشة مصممة حول هويتك البصرية، لا قالب عام يشبه مواقع الجميع.',
  },
  {
    accent: '#0891B2',
    titleEN: 'Workflow Automation',
    titleAR: 'أتمتة سير العمل',
    descEN: 'We remove the manual steps that eat your team\'s time — approvals, reports, handoffs — and automate them.',
    descAR: 'نزيل الخطوات اليدوية التي تستهلك وقت فريقك — الموافقات والتقارير والتسليمات — ونؤتمتها.',
  },
  {
    accent: '#059669',
    titleEN: 'Increase Sales',
    titleAR: 'زيادة المبيعات',
    descEN: 'Faster funnels, a clearer checkout, and data your sales team can actually act on.',
    descAR: 'قمع مبيعات أسرع، وتجربة شراء أوضح، وبيانات يمكن لفريق المبيعات استخدامها فعليًا.',
  },
  {
    accent: '#D97706',
    titleEN: 'Better Team Productivity',
    titleAR: 'إنتاجية أعلى لفريقك',
    descEN: 'Less time on repetitive tasks means more time on the work that actually grows the business.',
    descAR: 'وقت أقل في المهام المتكررة يعني وقتًا أكبر للعمل الذي ينمّي العمل فعليًا.',
  },
  {
    accent: '#DC2626',
    titleEN: 'Future Scalability',
    titleAR: 'قابلية التوسع مستقبلًا',
    descEN: 'Built on clean architecture from day one, so adding features later never means a rebuild.',
    descAR: 'مبني على بنية نظيفة منذ اليوم الأول، فإضافة ميزات لاحقًا لا تعني إعادة بناء.',
  },
];

/**
 * Sits directly after the Hero. Answers the "why not just use a template"
 * objection before the visitor sees any proof — Products/Results/Testimonials
 * below all implicitly assume the reader already accepts that custom-built
 * software is the right call, so that case has to land first, not after.
 *
 * Composition deliberately differs from ProcessSection's centered-header +
 * 3-up grid: the header here splits text-left / placeholder-right, so
 * consecutive sections don't read as the same template repeated.
 */
const CustomSoftwareSection = ({ isRTL }) => {
  const { isRTL: ctxRTL } = useLanguage();
  const rtl = isRTL ?? ctxRTL;

  return (
    <section
      id="why-custom"
      dir={rtl ? 'rtl' : 'ltr'}
      className="section-shell section-shell--tint"
    >
      <style>{`
        .custom-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(14px, 1.8vw, 22px);
          margin-top: clamp(2.5rem, 5vw, 3.5rem);
        }
        @media (max-width: 900px) { .custom-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .custom-grid { grid-template-columns: 1fr; } }

        .custom-card {
          background: rgb(var(--bg-elevated));
          border: 1px solid rgb(var(--border));
          border-radius: 16px;
          padding: clamp(20px, 2.2vw, 26px);
          height: 100%;
          box-sizing: border-box;
          text-align: ${rtl ? 'right' : 'left'};
          transition: border-color 0.25s ease, box-shadow 0.3s cubic-bezier(0.16,1,0.3,1), transform 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        .custom-card:hover {
          border-color: rgb(var(--border-strong));
          box-shadow: var(--shadow-card-hover);
          transform: translateY(-3px);
        }
        .custom-card-chip {
          width: 34px; height: 34px;
          border-radius: 10px;
          margin-bottom: 14px;
          background: color-mix(in srgb, var(--card-accent) 10%, rgb(var(--bg-elevated)));
          border: 1px solid color-mix(in srgb, var(--card-accent) 24%, rgb(var(--bg-elevated)));
        }
        .custom-card-title {
          font-size: clamp(0.9375rem, 1.15vw, 1.0625rem);
          font-weight: 700;
          color: rgb(var(--text-primary));
          margin: 0 0 8px;
          letter-spacing: -0.02em;
          line-height: 1.3;
        }
        [dir="rtl"] .custom-card-title { font-family: var(--font-arabic); letter-spacing: 0; line-height: 1.45; }
        .custom-card-desc {
          font-size: 13px;
          color: rgb(var(--text-secondary));
          line-height: 1.65;
          margin: 0;
        }
        [dir="rtl"] .custom-card-desc { font-family: var(--font-arabic); line-height: 1.85; }
      `}</style>

      <div className="section-inner">
        <SectionHeader
          eyebrow={rtl ? 'لماذا برمجيات مخصصة' : 'Why Custom Software'}
          title={rtl ? 'نطوّر نظامًا حول\nطريقة عملك —\nلا حول قالب جاهز.' : 'Built around\nyour business —\nnot a template.'}
          lead={rtl
            ? 'القوالب الجاهزة تجبر عملك على التكيّف مع طريقة عمل عامة. نحن نفعل العكس — ندرس عملياتك، نراجع تحدياتك، ونصمم حول هويتك، لنبني برمجيات قابلة للتوسع. بدون قوالب جاهزة.'
            : 'Templates force your business to adapt to a generic workflow. We do the opposite — we study your operations, examine your challenges, and design around your brand to build software that scales with you. Never off-the-shelf.'}
          action={


  <img
    src="/custom-software-5.png"
    alt={rtl ? "برمجيات مخصصة" : "Custom Software"}
    className="w-full max-w-[380px] h-auto object-contain"
    loading="lazy"
  />


            // <ImagePlaceholder
            //   minHeight={200}
            //   style={{ maxWidth: 380 }}
            //   prompt={rtl
            //     ? 'رسم توضيحي بمنظور آيزومتري يقارن بين قالب جاهز جامد من جهة، ووحدة برمجية مخصصة تندمج بسلاسة في سير عمل فريد لشركة من جهة أخرى. ألوان زرقاء وبيضاء، تصميم بسيط، زجاجية ناعمة (Glassmorphism)، خلفية شفافة PNG، دقة فائقة.'
            //     : 'Isometric illustration contrasting a rigid generic template grid with a custom software module snapping seamlessly into a unique business workflow. Blue and white palette, minimal, soft glassmorphism, transparent PNG, ultra HD.'}
            // />
          }

        />

        <RevealItems className="custom-grid" step={0.05}>
          {CARDS.map((c, i) => (
            <article key={i} className="custom-card" style={{ '--card-accent': c.accent }}>
              <div className="custom-card-chip" aria-hidden />
              <h3 className="custom-card-title">{rtl ? c.titleAR : c.titleEN}</h3>
              <p className="custom-card-desc">{rtl ? c.descAR : c.descEN}</p>
            </article>
          ))}
        </RevealItems>
      </div>
    </section>
  );
};

export default CustomSoftwareSection;
