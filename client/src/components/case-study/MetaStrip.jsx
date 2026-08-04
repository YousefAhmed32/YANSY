import { useLanguage } from '../../contexts/LanguageContext';

const SERVICE_LABELS = {
  'web-development': { en: 'Web Development', ar: 'تطوير مواقع' },
  'saas-development': { en: 'SaaS Development', ar: 'تطوير SaaS' },
  'ecommerce-development': { en: 'E-Commerce Development', ar: 'تطوير تجارة إلكترونية' },
  'enterprise-software': { en: 'Enterprise Software', ar: 'برمجيات مؤسسية' },
  'mobile-app-development': { en: 'Mobile App Development', ar: 'تطوير تطبيقات جوال' },
  'ui-ux-design': { en: 'UI/UX Design', ar: 'تصميم واجهات وتجربة مستخدم' },
};

/* Slim "at a glance" credibility bar directly under the hero — the
   Stripe/Linear beat of stating the facts plainly before the story
   starts. Every value here already exists on `cs`; nothing new to
   author per case study. */
const MetaStrip = ({ cs }) => {
  const { isRTL } = useLanguage();
  const service = SERVICE_LABELS[cs.service];

  const items = [
    { label: isRTL ? 'الصناعة' : 'Industry', value: isRTL ? cs.industry.ar : cs.industry.en },
    { label: isRTL ? 'الخدمة' : 'Service', value: service ? (isRTL ? service.ar : service.en) : cs.service },
    { label: isRTL ? 'المدة' : 'Timeline', value: isRTL ? cs.duration.ar : cs.duration.en },
    { label: isRTL ? 'السنة' : 'Year', value: cs.year },
    { label: isRTL ? 'التقنيات' : 'Stack', value: `${cs.stack.length} ${isRTL ? 'تقنية' : 'technologies'}` },
  ];

  return (
    <section className="cs-meta" dir={isRTL ? 'rtl' : 'ltr'} aria-label={isRTL ? 'نظرة سريعة' : 'At a glance'}>
      <style>{`
        .cs-meta { border-top: 1px solid rgb(var(--border)); border-bottom: 1px solid rgb(var(--border)); background: rgb(var(--bg-secondary)); }
        .cs-meta__inner {
          max-width: 1280px; margin: 0 auto; padding: clamp(1.25rem, 3vw, 1.75rem) clamp(1.25rem, 5vw, 3rem);
          display: grid; grid-template-columns: repeat(5, 1fr); gap: clamp(1rem, 2vw, 1.5rem);
        }
        .cs-meta__item { text-align: ${isRTL ? 'right' : 'left'}; }
        .cs-meta__label { font-size: 10.5px; font-weight: 700; letter-spacing: ${isRTL ? 0 : '0.1em'}; text-transform: ${isRTL ? 'none' : 'uppercase'}; color: rgb(var(--text-tertiary)); margin-bottom: 6px; }
        .cs-meta__value { font-size: clamp(0.85rem, 1.3vw, 0.95rem); font-weight: 600; color: rgb(var(--text-primary)); }
        @media (max-width: 860px) { .cs-meta__inner { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 480px) { .cs-meta__inner { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
      <div className="cs-meta__inner">
        {items.map((it, i) => (
          <div key={i} className="cs-meta__item">
            <div className="cs-meta__label">{it.label}</div>
            <div className="cs-meta__value">{it.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MetaStrip;
