import { useLanguage } from '../contexts/LanguageContext';
import { Search, Palette, Workflow, TrendingUp, Users, Layers } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import { RevealItems } from '../components/Reveal';
import EcosystemHubGraphic from '../components/EcosystemHubGraphic';

const CARDS = [
  {
    accent: 'rgb(var(--accent))',
    icon: Search,
    titleEN: 'Understand Your Business',
    titleAR: 'فهم عملك بعمق',
    descEN: 'We start with your operations, not a feature checklist — mapping how work actually moves through your team.',
    descAR: 'نبدأ بفهم عملياتك الفعلية، لا بقائمة ميزات جاهزة — نرسم كيف تتحرك المهام داخل فريقك.',
  },
  {
    accent: '#7C3AED',
    icon: Palette,
    titleEN: 'Brand-first Design',
    titleAR: 'تصميم يعكس هويتك',
    descEN: 'Every screen is designed around your identity, not a generic theme that looks like everyone else\'s.',
    descAR: 'كل شاشة مصممة حول هويتك البصرية، لا قالب عام يشبه مواقع الجميع.',
  },
  {
    accent: '#0891B2',
    icon: Workflow,
    titleEN: 'Workflow Automation',
    titleAR: 'أتمتة سير العمل',
    descEN: 'We remove the manual steps that eat your team\'s time — approvals, reports, handoffs — and automate them.',
    descAR: 'نزيل الخطوات اليدوية التي تستهلك وقت فريقك — الموافقات والتقارير والتسليمات — ونؤتمتها.',
  },
  {
    accent: '#059669',
    icon: TrendingUp,
    titleEN: 'Increase Sales',
    titleAR: 'زيادة المبيعات',
    descEN: 'Faster funnels, a clearer checkout, and data your sales team can actually act on.',
    descAR: 'قمع مبيعات أسرع، وتجربة شراء أوضح، وبيانات يمكن لفريق المبيعات استخدامها فعليًا.',
  },
  {
    accent: '#D97706',
    icon: Users,
    titleEN: 'Better Team Productivity',
    titleAR: 'إنتاجية أعلى لفريقك',
    descEN: 'Less time on repetitive tasks means more time on the work that actually grows the business.',
    descAR: 'وقت أقل في المهام المتكررة يعني وقتًا أكبر للعمل الذي ينمّي العمل فعليًا.',
  },
  {
    accent: '#DC2626',
    icon: Layers,
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
 * interactive step explorer: the header here splits text-left /
 * placeholder-right, so consecutive sections don't read as the same
 * template repeated.
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
          gap: clamp(16px, 1.8vw, 22px);
          margin-top: clamp(2.5rem, 5vw, 3.5rem);
        }
        @media (max-width: 900px) { .custom-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .custom-grid { grid-template-columns: 1fr; } }

        .custom-card {
          position: relative;
          background: rgb(var(--bg-elevated));
          border: 1px solid rgb(var(--border));
          border-radius: var(--radius-lg);
          padding: clamp(22px, 2.4vw, 28px);
          height: 100%;
          box-sizing: border-box;
          overflow: hidden;
          text-align: ${rtl ? 'right' : 'left'};
          transition: border-color 0.3s ease, box-shadow 0.4s cubic-bezier(0.16,1,0.3,1), transform 0.4s cubic-bezier(0.16,1,0.3,1);
        }
        .custom-card::before {
          content: '';
          position: absolute;
          inset-inline: 0;
          top: 0;
          height: 2px;
          background: var(--card-accent);
          transform: scaleX(0);
          transform-origin: ${rtl ? 'right' : 'left'};
          transition: transform 0.45s cubic-bezier(0.16,1,0.3,1);
        }
        .custom-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(180px 140px at ${rtl ? '88% -12%' : '12% -12%'}, color-mix(in srgb, var(--card-accent) 12%, transparent), transparent 70%);
          opacity: 0;
          transition: opacity 0.5s ease;
          pointer-events: none;
        }
        .custom-card:hover {
          border-color: rgb(var(--border-strong));
          box-shadow: var(--shadow-card-hover);
          transform: translateY(-4px);
        }
        .custom-card:hover::before { transform: scaleX(1); }
        .custom-card:hover::after { opacity: 1; }

        .custom-card-icon {
          position: relative;
          z-index: 1;
          width: 46px;
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          margin-bottom: 18px;
          flex-shrink: 0;
          color: var(--card-accent);
          background: linear-gradient(155deg,
            color-mix(in srgb, var(--card-accent) 16%, rgb(var(--bg-elevated))) 0%,
            color-mix(in srgb, var(--card-accent) 5%, rgb(var(--bg-elevated))) 100%);
          border: 1px solid color-mix(in srgb, var(--card-accent) 26%, rgb(var(--bg-elevated)));
          box-shadow: 0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6);
          transition: transform 0.45s cubic-bezier(0.16,1,0.3,1), box-shadow 0.45s cubic-bezier(0.16,1,0.3,1), background 0.45s ease;
        }
        .custom-card-icon svg { width: 21px; height: 21px; stroke-width: 1.9; }
        .custom-card:hover .custom-card-icon {
          transform: translateY(-2px) scale(1.07);
          background: linear-gradient(155deg,
            color-mix(in srgb, var(--card-accent) 24%, rgb(var(--bg-elevated))) 0%,
            color-mix(in srgb, var(--card-accent) 8%, rgb(var(--bg-elevated))) 100%);
          box-shadow: 0 10px 22px -8px color-mix(in srgb, var(--card-accent) 55%, transparent), inset 0 1px 0 rgba(255,255,255,0.7);
        }

        .custom-card-title {
          position: relative;
          z-index: 1;
          font-size: clamp(0.9375rem, 1.15vw, 1.0625rem);
          font-weight: 700;
          color: rgb(var(--text-primary));
          margin: 0 0 8px;
          letter-spacing: -0.02em;
          line-height: 1.3;
        }
        [dir="rtl"] .custom-card-title { font-family: var(--font-arabic); letter-spacing: 0; line-height: 1.45; }
        .custom-card-desc {
          position: relative;
          z-index: 1;
          font-size: 13px;
          color: rgb(var(--text-secondary));
          line-height: 1.65;
          margin: 0;
        }
        [dir="rtl"] .custom-card-desc { font-family: var(--font-arabic); line-height: 1.85; }

        @media (prefers-reduced-motion: reduce) {
          .custom-card, .custom-card::before, .custom-card::after, .custom-card-icon {
            transition: none !important;
          }
        }
      `}</style>

      <div className="section-inner">
        <SectionHeader
          eyebrow={rtl ? 'لماذا برمجيات مخصصة' : 'Why Custom Software'}
          title={rtl ? 'نطوّر نظامًا حول\nطريقة عملك —\nلا حول قالب جاهز.' : 'Built around\nyour business —\nnot a template.'}
          lead={rtl
            ? 'القوالب الجاهزة تجبر عملك على التكيّف مع طريقة عمل عامة. نحن نفعل العكس — ندرس عملياتك، نراجع تحدياتك، ونصمم حول هويتك، لنبني برمجيات قابلة للتوسع. بدون قوالب جاهزة.'
            : 'Templates force your business to adapt to a generic workflow. We do the opposite — we study your operations, examine your challenges, and design around your brand to build software that scales with you. Never off-the-shelf.'}
          action={<EcosystemHubGraphic isRTL={rtl} />}
        />

        <RevealItems className="custom-grid" step={0.05}>
          {CARDS.map((c, i) => {
            const Icon = c.icon;
            return (
              <article key={i} className="custom-card" style={{ '--card-accent': c.accent }}>
                <div className="custom-card-icon" aria-hidden>
                  <Icon />
                </div>
                <h3 className="custom-card-title">{rtl ? c.titleAR : c.titleEN}</h3>
                <p className="custom-card-desc">{rtl ? c.descAR : c.descEN}</p>
              </article>
            );
          })}
        </RevealItems>
      </div>
    </section>
  );
};

export default CustomSoftwareSection;
