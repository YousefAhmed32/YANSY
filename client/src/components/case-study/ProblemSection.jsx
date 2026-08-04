import { useLanguage } from '../../contexts/LanguageContext';
import SectionHeader from '../SectionHeader';
import { RevealItems } from '../Reveal';

const ProblemSection = ({ cs }) => {
  const { isRTL } = useLanguage();
  const side = isRTL ? 'right' : 'left';

  return (
    <section className="section-shell section-shell--plain" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="section-inner">
        <SectionHeader
          align="stack"
          eyebrow={isRTL ? 'المشكلة' : 'The Problem'}
          title={cs.challenge.title[isRTL ? 'ar' : 'en']}
        />

        <div className="cs-problem-grid">
          <style>{`
            .cs-problem-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: clamp(2.5rem, 5vw, 5rem); align-items: start; }
            @media (max-width: 900px) { .cs-problem-grid { grid-template-columns: 1fr; } }
            .cs-problem-body { font-size: var(--text-lg); line-height: 1.85; color: rgb(var(--text-secondary)); text-align: ${side}; }
            .cs-problem-points { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
            .cs-problem-point {
              display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px;
              border-radius: var(--radius-md); background: rgb(var(--bg-surface)); border: 1px solid rgb(var(--border));
              flex-direction: ${isRTL ? 'row-reverse' : 'row'}; text-align: ${side};
            }
            .cs-problem-point-num {
              flex-shrink: 0; width: 22px; height: 22px; border-radius: 7px; display: flex; align-items: center; justify-content: center;
              background: rgb(var(--danger-light)); color: rgb(var(--danger)); font-size: 11px; font-weight: 800;
            }
            .cs-problem-point-text { font-size: var(--text-sm); line-height: 1.7; color: rgb(var(--text-secondary)); }
          `}</style>

          <p className="cs-problem-body">{cs.challenge.body[isRTL ? 'ar' : 'en']}</p>

          <RevealItems className="cs-problem-points" distance={14}>
            {cs.challenge.points.map((p, i) => (
              <div key={i} className="cs-problem-point">
                <span className="cs-problem-point-num" aria-hidden>{i + 1}</span>
                <span className="cs-problem-point-text">{p[isRTL ? 'ar' : 'en']}</span>
              </div>
            ))}
          </RevealItems>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
