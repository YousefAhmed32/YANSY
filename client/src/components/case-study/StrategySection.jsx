import { useLanguage } from '../../contexts/LanguageContext';
import Reveal from '../Reveal';

/* Strategy & Planning — deliberately a single immersive column instead of
   matching Problem/Discovery's grid, so the story's rhythm breaks instead
   of repeating the same layout a third time in a row. */
const StrategySection = ({ cs }) => {
  const { isRTL } = useLanguage();
  const side = isRTL ? 'right' : 'left';

  return (
    <section className="section-shell section-shell--plain" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="section-inner">
        <Reveal className="cs-strategy" distance={20}>
          <style>{`
            .cs-strategy { max-width: 780px; margin-inline-${isRTL ? 'end' : 'start'}: 0; }
            .cs-strategy__eyebrow { display: block; margin-bottom: 1.25rem; text-align: ${side}; }
            .cs-strategy__title {
              font-size: clamp(1.75rem, 4vw, 2.75rem); font-weight: 700; line-height: 1.2; letter-spacing: -0.02em;
              color: rgb(var(--text-primary)); margin-bottom: 1.75rem; text-align: ${side};
              padding-inline-start: 1.5rem; border-inline-start: 3px solid rgb(var(--accent));
            }
            [dir="rtl"] .cs-strategy__title { letter-spacing: 0; }
            .cs-strategy__body { font-size: var(--text-lg); line-height: 1.85; color: rgb(var(--text-secondary)); text-align: ${side}; padding-inline-start: 1.5rem; }
          `}</style>
          <span className="section-label cs-strategy__eyebrow">{isRTL ? 'الاستراتيجية والتخطيط' : 'Strategy & Planning'}</span>
          <h2 className="cs-strategy__title">{cs.strategy.title[isRTL ? 'ar' : 'en']}</h2>
          <p className="cs-strategy__body">{cs.strategy.body[isRTL ? 'ar' : 'en']}</p>
        </Reveal>
      </div>
    </section>
  );
};

export default StrategySection;
