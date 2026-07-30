import { useLanguage } from '../contexts/LanguageContext';
import { ArrowUpRight } from 'lucide-react';
import { useReveal } from '../hooks/useReveal';

const CheckIcon = ({ color = '#22c55e' }) => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden>
    <circle cx="8" cy="8" r="7" fill={color} fillOpacity="0.12" />
    <path d="M5 8l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden>
    <circle cx="8" cy="8" r="7" fill="#EF4444" fillOpacity="0.1" />
    <path d="M10 6L6 10M6 6l4 4" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const NeutralIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden>
    <circle cx="8" cy="8" r="7" fill="#F59E0B" fillOpacity="0.12" />
    <path d="M5.5 8h5" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CRITERIA_EN = [
  'Clear scope & timeline',
  'Weekly progress updates',
  'Fixed-price milestones',
  'Full code ownership',
  'Post-delivery support',
  '14-day average launch',
];

const CRITERIA_AR = [
  'نطاق وجدول زمني واضحان',
  'تحديثات أسبوعية',
  'مراحل بسعر ثابت',
  'ملكية كاملة للكود',
  'دعم ما بعد التسليم',
  'إطلاق متوسط 14 يوماً',
];

const COLUMNS_EN = [
  {
    label: 'Freelancer',
    sub: 'Unpredictable',
    highlight: false,
    values: ['x', 'x', 'neutral', 'check', 'x', 'x'],
    note: 'Good for small tasks. Risky for complex projects.',
  },
  {
    label: 'YANSY',
    sub: 'The structured studio',
    highlight: true,
    values: ['check', 'check', 'check', 'check', 'check', 'check'],
    note: 'Agency structure. Startup speed. Full code ownership.',
  },
  {
    label: 'Generic Agency',
    sub: 'Slow & expensive',
    highlight: false,
    values: ['neutral', 'neutral', 'x', 'x', 'neutral', 'x'],
    note: 'Process-heavy. Slow. Often locks you into their systems.',
  },
];

const COLUMNS_AR = [
  {
    label: 'فريلانسر',
    sub: 'غير متوقع',
    highlight: false,
    values: ['x', 'x', 'neutral', 'check', 'x', 'x'],
    note: 'جيد للمهام الصغيرة. خطر للمشاريع المعقدة.',
  },
  {
    label: 'YANSY',
    sub: 'الاستوديو المنظَّم',
    highlight: true,
    values: ['check', 'check', 'check', 'check', 'check', 'check'],
    note: 'هيكل وكالة. سرعة شركة ناشئة. ملكية كاملة للكود.',
  },
  {
    label: 'وكالة عادية',
    sub: 'بطيئة ومكلفة',
    highlight: false,
    values: ['neutral', 'neutral', 'x', 'x', 'neutral', 'x'],
    note: 'ثقيلة الإجراءات. بطيئة. غالباً تقيدك في أنظمتها.',
  },
];

const valueIcon = (v) => {
  if (v === 'check') return <CheckIcon />;
  if (v === 'x') return <XIcon />;
  return <NeutralIcon />;
};

const WhyYANSY = ({ onStartProject }) => {
  const { isRTL } = useLanguage();
  const { ref: sectionRef, revealed: visible } = useReveal({ threshold: 0.1 });

  const criteria = isRTL ? CRITERIA_AR : CRITERIA_EN;
  const columns  = isRTL ? COLUMNS_AR : COLUMNS_EN;

  return (
    <section
      ref={sectionRef}
      id="why-yansy"
      dir={isRTL ? 'rtl' : 'ltr'}
      className="section-shell section-shell--plain"
    >
      <style>{`
        .why-grid {
          display: grid;
          grid-template-columns: 5fr 7fr;
          gap: clamp(3rem, 7vw, 7rem);
          align-items: start;
        }
        @media (max-width: 860px) {
          .why-grid { grid-template-columns: 1fr; }
        }
        .comparison-table-scroll {
          width: 100%;
        }
        @media (max-width: 560px) {
          .comparison-table-scroll {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            border-radius: 16px;
          }
        }
        .comparison-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid rgb(var(--border));
          border-radius: 16px;
          overflow: hidden;
        }
        @media (max-width: 560px) {
          /* Below 560px, 4 columns can't compress to legible widths — scroll
             the table within its own container instead of squishing text or
             forcing the whole page to scroll horizontally. */
          .comparison-table { min-width: 480px; }
        }
        .comparison-table th {
          padding: clamp(14px, 2vw, 20px) clamp(12px, 1.5vw, 18px);
          border-bottom: 1px solid rgb(var(--border));
          border-inline-end: 1px solid rgb(var(--border));
          font-size: 12px;
          font-weight: 700;
          color: rgb(var(--text-secondary));
          text-align: center;
          background: rgb(var(--bg-secondary));
        }
        .comparison-table th:last-child { border-inline-end: none; }
        .comparison-table th.yansy-col {
          background: rgb(var(--accent-light));
          color: rgb(var(--accent));
          border-color: rgb(var(--accent-muted));
        }
        .comparison-table td {
          padding: clamp(10px, 1.5vw, 14px) clamp(12px, 1.5vw, 18px);
          border-bottom: 1px solid rgb(var(--border-light));
          border-inline-end: 1px solid rgb(var(--border-light));
          text-align: center;
          font-size: 12.5px;
          color: rgb(var(--text-secondary));
          font-weight: 500;
        }
        .comparison-table td:last-child { border-inline-end: none; }
        .comparison-table td.criteria-col {
          text-align: ${isRTL ? 'right' : 'left'};
          color: rgb(var(--text-secondary));
          background: rgb(var(--bg-secondary));
          font-weight: 600;
          font-size: 12px;
        }
        .comparison-table td.yansy-cell {
          background: rgb(var(--accent-light));
          border-inline-end: 1px solid rgb(var(--accent-muted));
        }
        .comparison-table tr:last-child td { border-bottom: none; }
        .why-statement {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(12px, 2vw, 20px);
          margin-top: clamp(2rem, 4vw, 3rem);
        }
        @media (max-width: 560px) {
          .why-statement { grid-template-columns: 1fr; }
        }
        .why-statement-card {
          background: rgb(var(--bg-secondary));
          border: 1px solid rgb(var(--border));
          border-radius: 12px;
          padding: clamp(14px, 2vw, 20px);
          text-align: ${isRTL ? 'right' : 'left'};
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1), border-color 0.2s, background 0.2s;
        }
        .why-statement-card.visible { opacity: 1; transform: translateY(0); }
        .why-statement-card:hover { background: rgb(var(--bg-elevated)); border-color: rgb(var(--border-strong)); }
        .why-note-row {
          display: flex;
          gap: 0;
          border-top: 1px solid rgb(var(--border));
        }
        @media (max-width: 560px) {
          .why-note-row { min-width: 480px; }
        }
        .why-note-cell {
          flex: 1;
          padding: clamp(10px, 1.5vw, 14px) clamp(12px, 1.5vw, 18px);
          border-inline-end: 1px solid rgb(var(--border-light));
          font-size: 11px;
          color: rgb(var(--text-tertiary));
          line-height: 1.4;
          text-align: center;
        }
        .why-note-cell:last-child { border-inline-end: none; }
        .why-note-cell.yansy-note {
          color: rgb(var(--accent));
          background: rgb(var(--accent-light));
          font-weight: 600;
        }
      `}</style>

      <div className="section-inner">
        <div className="why-grid">

          {/* Left: Header */}
          <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
            <span className="section-label" style={{ marginBottom: 20, display: 'inline-block' }}>
              {isRTL ? 'لماذا YANSY' : 'Why YANSY'}
            </span>
            <h2 className="display-title" style={{ marginBottom: 'clamp(1.25rem, 2.5vw, 2rem)' }}>
              {isRTL ? 'ليس كل\nخيار متساوٍ.' : 'Not every\noption is\nequal.'}
            </h2>
            <p style={{
              fontSize: 'clamp(0.9375rem, 1.1vw, 1.0625rem)',
              color: 'rgb(var(--text-secondary))',
              lineHeight: 1.75,
              margin: '0 0 clamp(1.5rem, 3vw, 2.5rem)',
              fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
            }}>
              {isRTL
                ? 'الفريلانسر قد يختفي. الوكالة العادية قد تبالغ في التكاليف وتأخذ الوقت. YANSY توفر هيكل الوكالة مع سرعة الشركة الناشئة — وملكية كاملة للكود دائماً.'
                : 'Freelancers disappear. Generic agencies overcharge and underdeliver. YANSY gives you agency structure with startup speed — and the code is always yours.'}
            </p>

            {/* 3 statement cards */}
            <div className="why-statement">
              {(isRTL ? [
                { icon: '⚡', title: 'سرعة الشركة الناشئة', body: 'نتيجة في 14 يوماً في المتوسط — بدون التضحية بالجودة، وقد ننجز أسرع حسب نطاق مشروعك' },
                { icon: '🏗', title: 'هيكل الوكالة', body: 'فريق متخصص، عملية واضحة، مراحل تسليم منظمة' },
                { icon: '🔑', title: 'ملكية كاملة', body: 'الكود ملكك بعد التسليم — لا قفل، لا رسوم مستمرة' },
              ] : [
                { icon: '⚡', title: 'Startup speed', body: '14 days on average — never at the expense of quality, and often faster depending on scope' },
                { icon: '🏗', title: 'Agency structure', body: 'Dedicated team, clear process, organized delivery milestones' },
                { icon: '🔑', title: 'Full ownership', body: 'The code is yours after delivery — no lock-in, no recurring fees' },
              ]).map((card, i) => (
                <div
                  key={i}
                  className={`why-statement-card${visible ? ' visible' : ''}`}
                  style={{ transitionDelay: `${0.1 + i * 0.1}s` }}
                >
                  <div style={{ fontSize: 20, marginBottom: 10 }} aria-hidden>{card.icon}</div>
                  <div style={{
                    fontSize: 12.5, fontWeight: 700, color: 'rgb(var(--text-primary))',
                    marginBottom: 5,
                    fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
                  }}>
                    {card.title}
                  </div>
                  <div style={{
                    fontSize: 12, color: 'rgb(var(--text-secondary))', lineHeight: 1.6,
                    fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
                  }}>
                    {card.body}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onStartProject}
              className="btn-primary"
              style={{ marginTop: 'clamp(1.5rem, 3vw, 2rem)', fontSize: '13.5px', padding: '13px 26px' }}
            >
              {isRTL ? 'احجز استشارة مجانية' : 'Start With YANSY'}
              <ArrowUpRight style={{ width: 15, height: 15, transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
            </button>
          </div>

          {/* Right: Comparison table */}
          {/* minWidth: 0 overrides the grid item's default min-width:auto — without
              it, the table's min-width (needed for the mobile scroll wrapper below)
              blows out the whole grid track and forces page-level horizontal scroll
              instead of scrolling within .comparison-table-scroll. */}
          <div style={{
            minWidth: 0,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.7s 0.15s cubic-bezier(0.16,1,0.3,1), transform 0.7s 0.15s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <div className="comparison-table-scroll">
              <table className="comparison-table" role="table">
                <thead>
                  <tr>
                    <th style={{ textAlign: isRTL ? 'right' : 'left', width: '36%' }}>
                      {isRTL ? 'المعيار' : 'Criteria'}
                    </th>
                    {columns.map((col, ci) => (
                      <th key={ci} className={col.highlight ? 'yansy-col' : ''}>
                        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 2 }}>{col.label}</div>
                        <div style={{ fontSize: 10, fontWeight: 500, opacity: 0.7 }}>{col.sub}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {criteria.map((crit, ri) => (
                    <tr key={ri}>
                      <td className="criteria-col"
                        style={{
                          fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
                        }}
                      >
                        {crit}
                      </td>
                      {columns.map((col, ci) => (
                        <td key={ci} className={col.highlight ? 'yansy-cell' : ''}>
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            {valueIcon(col.values[ri])}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Notes row — scrolls in sync with the table above (same wrapper) */}
              <div className="why-note-row">
                <div style={{ width: '36%', padding: 'clamp(10px, 1.5vw, 14px) clamp(12px, 1.5vw, 18px)' }} />
                {columns.map((col, ci) => (
                  <div key={ci} className={`why-note-cell${col.highlight ? ' yansy-note' : ''}`}>
                    {col.note}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default WhyYANSY;
