import { useLanguage } from '../../contexts/LanguageContext';
import { useReveal, revealStyle } from '../../hooks/useReveal';
import { useCountUp } from '../../hooks/useCountUp';
import SectionHeader from '../SectionHeader';

const ResultCell = ({ result, isRTL, index, revealed, color }) => {
  const num = useCountUp(result.metric, 1600 + index * 120, revealed);
  const raw = parseFloat(String(result.metric).replace(/[^0-9.]/g, ''));
  const prefix = isNaN(raw) ? '' : String(result.metric).split(String(raw))[0];
  const suffix = isNaN(raw) ? '' : String(result.metric).split(String(raw))[1];

  return (
    <div className="cs-result" style={revealStyle(revealed, index, { distance: 18, duration: 0.6, step: 0.08 })}>
      <div className="cs-result__num" dir="ltr" style={{ color }}>
        {isNaN(raw) ? result.metric : `${prefix}${revealed ? num : 0}${suffix}`}
      </div>
      <div className="cs-result__label">{result.label[isRTL ? 'ar' : 'en']}</div>
    </div>
  );
};

const ResultsGrid = ({ cs }) => {
  const { isRTL } = useLanguage();
  const { ref, revealed } = useReveal();

  return (
    <section className="section-shell section-shell--tint" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="section-inner">
        <SectionHeader
          align="stack"
          eyebrow={isRTL ? 'النتائج' : 'Results'}
          title={isRTL ? 'أرقام حقيقية، لا تقديرات.' : 'Real numbers, not estimates.'}
        />
        <div ref={ref} className="cs-results-grid">
          <style>{`
            .cs-results-grid { display: grid; grid-template-columns: repeat(${cs.results.length}, 1fr); border-top: 1px solid rgb(var(--border)); border-bottom: 1px solid rgb(var(--border)); }
            @media (max-width: 780px) { .cs-results-grid { grid-template-columns: repeat(2, 1fr); } }
            .cs-result { padding: clamp(2rem, 4vw, 3rem) clamp(1rem, 2vw, 1.5rem); text-align: ${isRTL ? 'right' : 'left'}; border-inline-end: 1px solid rgb(var(--border)); }
            .cs-result:last-child { border-inline-end: none; }
            @media (max-width: 780px) {
              .cs-result:nth-child(2n) { border-inline-end: none; }
              .cs-result:nth-child(-n+2) { border-bottom: 1px solid rgb(var(--border)); }
            }
            .cs-result__num { font-size: clamp(2.25rem, 5vw, 3.5rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1; margin-bottom: 10px; font-variant-numeric: tabular-nums; }
            .cs-result__label { font-size: var(--text-sm); font-weight: 600; color: rgb(var(--text-secondary)); }
          `}</style>
          {cs.results.map((r, i) => (
            <ResultCell key={i} result={r} isRTL={isRTL} index={i} revealed={revealed} color={cs.color} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ResultsGrid;
