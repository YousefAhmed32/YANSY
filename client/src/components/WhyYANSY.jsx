import { useId, useState } from 'react';
import {
  ArrowUpRight, Check, X, Minus, Sparkles,
  Target, RefreshCw, Milestone, KeyRound, LifeBuoy, Rocket,
  Zap, Building2,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useReveal, revealStyle } from '../hooks/useReveal';
import SectionHeader from './SectionHeader';

const FONT_EN = "'Inter',system-ui,sans-serif";
const FONT_AR = "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif";

/* The comparison mechanic: one shared criterion per row, one mark per
   column. This is deliberately the same mechanic pricing tables and
   decision matrices use — it's the only layout that lets a reader compare
   without reading, by pattern-matching a column of solid green against two
   columns of scattered red/amber. The YANSY column is highlighted in place,
   not pulled out into its own separate panel — pulling it out was tried and
   broke the actual comparison. */
const CRITERIA_ICONS = [Target, RefreshCw, Milestone, KeyRound, LifeBuoy, Rocket];
const CRITERIA_EN = [
  'Clear scope & timeline',
  'Weekly progress updates',
  'Fixed-price milestones',
  'Full code ownership',
  'Post-delivery support',
  'Fast, scope-based launch',
];
const CRITERIA_AR = [
  'نطاق وجدول زمني واضحان',
  'تحديثات أسبوعية',
  'مراحل بسعر ثابت',
  'ملكية كاملة للكود',
  'دعم ما بعد التسليم',
  'إطلاق سريع حسب النطاق',
];

const COLUMNS_EN = [
  {
    key: 'freelancer', label: 'Freelancer', sub: 'Unpredictable',
    values: ['x', 'x', 'neutral', 'check', 'x', 'x'],
    footer: 'Good for small tasks. Risky for real projects.',
  },
  {
    key: 'yansy', label: 'YANSY', sub: 'Recommended', hero: true,
    values: ['check', 'check', 'check', 'check', 'check', 'check'],
    footer: 'The complete package — every time.',
  },
  {
    key: 'agency', label: 'Generic Agency', sub: 'Slow & expensive',
    values: ['neutral', 'neutral', 'x', 'x', 'neutral', 'x'],
    footer: 'Reliable process. Slow and expensive.',
  },
];
const COLUMNS_AR = [
  {
    key: 'freelancer', label: 'فريلانسر', sub: 'غير متوقع',
    values: ['x', 'x', 'neutral', 'check', 'x', 'x'],
    footer: 'جيد للمهام الصغيرة. خطر للمشاريع الحقيقية.',
  },
  {
    key: 'yansy', label: 'YANSY', sub: 'موصى به', hero: true,
    values: ['check', 'check', 'check', 'check', 'check', 'check'],
    footer: 'الحزمة الكاملة — في كل مرة.',
  },
  {
    key: 'agency', label: 'وكالة عادية', sub: 'بطيئة ومكلفة',
    values: ['neutral', 'neutral', 'x', 'x', 'neutral', 'x'],
    footer: 'عملية موثوقة. بطيئة ومكلفة.',
  },
];

const FEATURES_EN = [
  { icon: Zap, title: 'Startup speed', body: 'As fast as your project scope allows — never at the expense of quality.' },
  { icon: Building2, title: 'Agency structure', body: 'Dedicated team, clear process, organized delivery milestones.' },
  { icon: KeyRound, title: 'Full ownership', body: 'The code is yours after delivery — no lock-in, no recurring fees.' },
];
const FEATURES_AR = [
  { icon: Zap, title: 'سرعة الشركة الناشئة', body: 'بأسرع وقت يسمح به نطاق مشروعك — دون التضحية بالجودة أبداً.' },
  { icon: Building2, title: 'هيكل الوكالة', body: 'فريق متخصص، عملية واضحة، مراحل تسليم منظمة.' },
  { icon: KeyRound, title: 'ملكية كاملة', body: 'الكود ملكك بعد التسليم — لا قفل، لا رسوم مستمرة.' },
];

const VALUE_LABELS = {
  check: { en: 'Yes', ar: 'نعم' },
  x: { en: 'No', ar: 'لا' },
  neutral: { en: 'Sometimes', ar: 'أحياناً' },
};

const ValueIcon = ({ v, hero }) => {
  const Icon = v === 'check' ? Check : v === 'x' ? X : Minus;
  const cls = v === 'check' ? (hero ? 'is-hero-check' : 'is-check') : v === 'x' ? 'is-x' : 'is-neutral';
  return (
    <span className={`why-value-icon ${cls}`} aria-hidden>
      <Icon size={13} strokeWidth={3} />
    </span>
  );
};

const FeatureCard = ({ feature, font, style }) => {
  const Icon = feature.icon;
  return (
    <div className="why-feature-card" style={style}>
      <div className="why-feature-icon"><Icon size={20} strokeWidth={1.75} aria-hidden /></div>
      <h3 className="why-feature-title" style={{ fontFamily: font }}>{feature.title}</h3>
      <p className="why-feature-body" style={{ fontFamily: font }}>{feature.body}</p>
    </div>
  );
};

const WhyYANSY = ({ onStartProject }) => {
  const { isRTL } = useLanguage();
  const font = isRTL ? FONT_AR : FONT_EN;
  const uid = useId();
  const { ref: sectionRef, revealed } = useReveal({ threshold: 0.08 });
  const [hoverRow, setHoverRow] = useState(null);

  const criteria = isRTL ? CRITERIA_AR : CRITERIA_EN;
  const columns = isRTL ? COLUMNS_AR : COLUMNS_EN;
  const features = isRTL ? FEATURES_AR : FEATURES_EN;

  return (
    <section
      ref={sectionRef}
      id="why-yansy"
      dir={isRTL ? 'rtl' : 'ltr'}
      className="section-shell section-shell--plain why-section"
      aria-labelledby={`why-title-${uid}`}
    >
      <style>{`
        .why-section { position: relative; overflow: hidden; }

        /* One quiet, static wash behind the table — depth without motion. */
        .why-bg-glow {
          position: absolute; z-index: 0; pointer-events: none; top: 4%; left: 50%;
          width: min(760px, 82vw); height: 460px; transform: translateX(-50%);
          background: radial-gradient(ellipse at center, rgb(var(--accent) / 0.07), transparent 72%);
        }
        .why-inner { position: relative; z-index: 1; }

        /* ── The comparison table itself ──────────────────────────────
           4 logical columns: row-label, Freelancer, YANSY, Generic Agency.
           Built with CSS grid (not a real <table>) so RTL mirrors for
           free, but exposed to assistive tech with real table roles.
           The YANSY column is tinted in place — same rows, same marks,
           just visually heavier — which is what actually lets a reader
           compare in one glance instead of reading three separate blocks. */
        .why-table-wrap { max-width: 900px; margin: 0 auto clamp(3rem, 5vw, 4.5rem); }
        .why-table {
          display: grid;
          grid-template-columns: minmax(108px, 1.35fr) repeat(3, minmax(62px, 1fr));
          border: 1px solid rgb(var(--border));
          border-radius: var(--radius-xl);
          background: rgb(var(--bg-elevated));
          overflow: hidden;
        }
        @media (max-width: 640px) {
          .why-table { grid-template-columns: minmax(88px, 1.25fr) repeat(3, minmax(50px, 1fr)); }
        }

        .why-cell { padding: 12px 10px; display: flex; align-items: center; }
        .why-cell--label { align-items: flex-start; gap: 8px; padding-inline: clamp(12px, 1.6vw, 18px) 8px; }
        .why-cell--head, .why-cell--value, .why-cell--foot { justify-content: center; text-align: center; flex-direction: column; }
        .why-cell--value { padding-block: 14px; }

        /* Column separators + row separators — real structure, drawn
           quietly (hairlines, not borders that shout "spreadsheet"). */
        .why-cell:not(.why-cell--label):not(.why-cell--corner) { border-inline-start: 1px solid rgb(var(--border-light)); }
        .why-cell:not(.why-cell--head) { border-top: 1px solid rgb(var(--border-light)); }
        .why-cell--corner { border-top: none; }

        /* Row-label column */
        .why-row-icon {
          width: 24px; height: 24px; border-radius: 7px; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          background: rgb(var(--bg-secondary)); border: 1px solid rgb(var(--border));
          color: rgb(var(--text-tertiary));
        }
        .why-cell--label { flex-direction: row; }
        .why-cell--label span:last-child { font-size: 12px; font-weight: 600; color: rgb(var(--text-secondary)); line-height: 1.35; }
        @media (max-width: 420px) { .why-row-icon { display: none; } }

        /* Header row */
        .why-cell--head { gap: 3px; padding-block: 16px 12px; }
        .why-col-name { font-size: 13px; font-weight: 700; color: rgb(var(--text-primary)); letter-spacing: -0.01em; }
        .why-col-sub { font-size: 10.5px; font-weight: 600; color: rgb(var(--text-tertiary)); }

        /* Value cells */
        .why-value-icon {
          width: 25px; height: 25px; border-radius: 50%; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
        .why-value-icon.is-check      { background: rgb(var(--success-light)); color: rgb(var(--success)); }
        .why-value-icon.is-x          { background: rgb(var(--danger-light));  color: rgb(var(--danger)); }
        .why-value-icon.is-neutral    { background: rgb(var(--warning-light)); color: rgb(var(--warning)); }
        .why-value-icon.is-hero-check { background: rgb(var(--accent)); color: #fff; }

        /* Footer row — one line of synthesis per column, not a paragraph */
        .why-cell--foot { font-size: 11px; line-height: 1.5; color: rgb(var(--text-tertiary)); padding-block: 14px; }

        /* The YANSY column — tinted straight through header/rows/footer,
           bolder marks, a small badge. Still the same grid, same rows. */
        .why-col-badge {
          display: inline-flex; align-items: center; gap: 4px; margin-bottom: 2px;
          background: rgb(var(--gold-light)); color: rgb(var(--gold));
          font-size: 9.5px; font-weight: 700; letter-spacing: 0.02em;
          padding: 3px 9px; border-radius: 999px;
        }
        .is-yansy { background: rgb(var(--accent-light)); }
        .is-yansy.why-cell--head .why-col-name { color: rgb(var(--accent)); font-size: 14px; }
        .is-yansy:not(.why-cell--head) { border-inline-start-color: rgb(var(--accent) / 0.18); }
        .is-yansy.why-cell--foot { color: rgb(var(--accent)); font-weight: 600; }

        /* Row hover — highlights the same row across all 4 cells, which is
           the actual "read across and compare" behavior this table exists
           to support. */
        .why-cell.is-active-row:not(.is-yansy) { background: rgb(var(--bg-surface)); }
        .why-cell.is-active-row.is-yansy { background: rgb(var(--accent) / 0.14); }
        .why-cell.is-active-row .why-value-icon { transform: scale(1.14); }
        .why-cell--label.is-active-row span:last-child { color: rgb(var(--text-primary)); font-weight: 700; }

        /* ── Key benefits — reinforcement after the comparison, not a
           repeat of it. ── */
        .why-features {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: clamp(14px, 2vw, 20px);
          max-width: 900px; margin: 0 auto clamp(3.5rem, 6vw, 5rem);
        }
        @media (max-width: 760px) { .why-features { grid-template-columns: 1fr; } }
        .why-feature-card {
          padding: clamp(20px, 2.4vw, 26px);
          background: rgb(var(--bg-elevated)); border: 1px solid rgb(var(--border)); border-radius: var(--radius-lg);
          text-align: ${isRTL ? 'right' : 'left'};
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .why-feature-card:hover { border-color: rgb(var(--accent) / 0.35); box-shadow: var(--shadow-sm); }
        .why-feature-icon {
          width: 40px; height: 40px; border-radius: 11px; margin-bottom: 14px;
          display: flex; align-items: center; justify-content: center;
          background: rgb(var(--accent-light)); color: rgb(var(--accent));
        }
        .why-feature-title { font-size: 14.5px; font-weight: 700; color: rgb(var(--text-primary)); margin: 0 0 6px; }
        .why-feature-body { font-size: 12.5px; color: rgb(var(--text-secondary)); line-height: 1.65; margin: 0; }

        /* ── CTA ── */
        .why-cta { text-align: center; }
        .why-cta-btn { font-size: 14px; padding: 16px 34px; transition: transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s ease; }
        .why-cta-btn:hover { transform: translateY(-2px); box-shadow: var(--shadow-card-hover); }
        .why-cta-btn svg { transition: transform 0.25s cubic-bezier(0.16,1,0.3,1); }
        .why-cta-btn:hover svg { transform: ${isRTL ? 'translate(-4px,-4px) scaleX(-1)' : 'translate(4px,-4px)'}; }
        .why-cta-trust { margin: 14px 0 0; font-size: 12.5px; color: rgb(var(--text-tertiary)); }
      `}</style>

      <div className="why-bg-glow" aria-hidden />

      <div className="section-inner why-inner">

        {/* Headline carries the narrative; the table below proves it. */}
        <SectionHeader
          id={`why-title-${uid}`}
          align="center"
          eyebrow={isRTL ? 'المقارنة' : 'The Comparison'}
          title={isRTL ? 'ليس كل خيار\nمتساوٍ.' : 'Not every option is\nequal.'}
          accent={isRTL ? 'متساوٍ' : 'equal'}
          lead={isRTL
            ? 'الفريلانسر قد يختفي. الوكالة العادية قد تبالغ في التكاليف وتأخذ الوقت. YANSY توفر هيكل الوكالة مع سرعة الشركة الناشئة — وملكية كاملة للكود دائماً.'
            : 'Freelancers disappear. Generic agencies overcharge and underdeliver. YANSY gives you agency structure with startup speed — and the code is always yours.'}
          revealed={revealed}
          style={revealStyle(revealed, 0)}
        />

        {/* The comparison — one shared table, YANSY highlighted in place */}
        <div className="why-table-wrap" style={revealStyle(revealed, 1)}>
          <div
            className="why-table"
            role="table"
            aria-label={isRTL ? 'مقارنة بين فريلانسر وYANSY ووكالة عادية' : 'Comparison of Freelancer, YANSY, and Generic Agency'}
          >
            {/* Header row */}
            <div role="row" style={{ display: 'contents' }}>
              <div role="columnheader" className="why-cell why-cell--head why-cell--corner">
                <span className="sr-only">{isRTL ? 'المعيار' : 'Criterion'}</span>
              </div>
              {columns.map((col) => (
                <div
                  key={col.key}
                  role="columnheader"
                  className={`why-cell why-cell--head${col.hero ? ' is-yansy' : ''}`}
                >
                  {col.hero && (
                    <span className="why-col-badge">
                      <Sparkles size={9} aria-hidden />
                      {isRTL ? 'الأكثر اختياراً' : 'Most chosen'}
                    </span>
                  )}
                  <span className="why-col-name" style={{ fontFamily: font }}>{col.label}</span>
                  <span className="why-col-sub" style={{ fontFamily: font }}>{col.sub}</span>
                </div>
              ))}
            </div>

            {/* Criteria rows */}
            {criteria.map((crit, ri) => {
              const CritIcon = CRITERIA_ICONS[ri];
              const active = hoverRow === ri;
              return (
                <div
                  key={ri}
                  role="row"
                  style={{ display: 'contents' }}
                  onMouseEnter={() => setHoverRow(ri)}
                  onMouseLeave={() => setHoverRow(null)}
                >
                  <div role="rowheader" className={`why-cell why-cell--label${active ? ' is-active-row' : ''}`}>
                    <span className="why-row-icon"><CritIcon size={12} strokeWidth={2} aria-hidden /></span>
                    <span style={{ fontFamily: font }}>{crit}</span>
                  </div>
                  {columns.map((col) => (
                    <div
                      key={col.key}
                      role="cell"
                      className={`why-cell why-cell--value${col.hero ? ' is-yansy' : ''}${active ? ' is-active-row' : ''}`}
                    >
                      <ValueIcon v={col.values[ri]} hero={col.hero} />
                      <span className="sr-only">{isRTL ? VALUE_LABELS[col.values[ri]].ar : VALUE_LABELS[col.values[ri]].en}</span>
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Footer row — the one-line payoff per column */}
            <div role="row" style={{ display: 'contents' }}>
              <div role="cell" className="why-cell why-cell--foot why-cell--corner" aria-hidden />
              {columns.map((col) => (
                <div
                  key={col.key}
                  role="cell"
                  className={`why-cell why-cell--foot${col.hero ? ' is-yansy' : ''}`}
                  style={{ fontFamily: font }}
                >
                  {col.footer}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Key benefits — reinforcement, after the proof */}
        <div className="why-features">
          {features.map((f, i) => (
            <FeatureCard key={i} feature={f} font={font} style={revealStyle(revealed, 2 + i)} />
          ))}
        </div>

        {/* CTA */}
        <div className="why-cta" style={revealStyle(revealed, 5)}>
          <button onClick={onStartProject} className="btn-primary why-cta-btn">
            {isRTL ? 'احجز استشارة مجانية' : 'Start With YANSY'}
            <ArrowUpRight style={{ width: 16, height: 16, transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
          </button>
          <p className="why-cta-trust" style={{ fontFamily: font }}>
            {isRTL ? 'استشارة مجانية — بدون التزام.' : 'Free consultation — no obligation.'}
          </p>
        </div>

      </div>
    </section>
  );
};

export default WhyYANSY;
