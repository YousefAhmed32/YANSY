import { Quote } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import Reveal from '../Reveal';

/* Immersive full-bleed pull-quote — deliberately the most dramatic
   visual beat on the page (dark band, oversized quote glyph, large
   italic type), distinct from StrategySection's quieter left-accent
   treatment so the two "big text" moments don't read as the same
   component reused twice. */
const ImpactQuote = ({ cs }) => {
  const { isRTL } = useLanguage();
  const side = isRTL ? 'right' : 'left';

  return (
    <section className="cs-impact" dir={isRTL ? 'rtl' : 'ltr'} aria-label={isRTL ? 'أثر العميل' : 'Client Impact'}>
      <style>{`
        .cs-impact { position: relative; background: rgb(var(--bg-contrast)); color: rgb(var(--on-contrast)); overflow: hidden; padding: clamp(4rem, 9vw, 7rem) 0; }
        .cs-impact__glow { position: absolute; inset: 0; background: radial-gradient(circle at ${isRTL ? '85%' : '15%'} 20%, ${cs.color}25 0%, transparent 55%); pointer-events: none; }
        .cs-impact__inner { position: relative; max-width: 860px; margin: 0 auto; padding: 0 clamp(1.25rem, 5vw, 3rem); text-align: ${side}; }
        .cs-impact__eyebrow { display: block; margin-bottom: 1.25rem; font-size: 11px; font-weight: 700; letter-spacing: ${isRTL ? 0 : '0.1em'}; text-transform: ${isRTL ? 'none' : 'uppercase'}; color: ${cs.color}; }
        .cs-impact__quote-icon { color: ${cs.color}; opacity: 0.55; margin-bottom: 1.5rem; width: 40px; height: 40px; }
        [dir="rtl"] .cs-impact__quote-icon { transform: scaleX(-1); }
        .cs-impact__outcome { font-size: clamp(1.15rem, 2.2vw, 1.5rem); line-height: 1.7; color: rgba(255,255,255,0.68); margin-bottom: 2.5rem; }
        .cs-impact__pull { font-size: clamp(1.6rem, 3.5vw, 2.5rem); font-weight: 600; line-height: 1.4; letter-spacing: -0.01em; color: #fff; margin-bottom: 2rem; }
        [dir="ltr"] .cs-impact__pull { font-style: italic; }
        .cs-impact__footer { display: flex; align-items: center; gap: 14px; flex-direction: ${isRTL ? 'row-reverse' : 'row'}; justify-content: ${isRTL ? 'flex-end' : 'flex-start'}; }
        .cs-impact__avatar { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #fff; flex-shrink: 0; }
        .cs-impact__name { font-weight: 700; color: #fff; font-size: var(--text-sm); }
        .cs-impact__role { font-size: 12.5px; color: rgba(255,255,255,0.65); }
      `}</style>
      <div className="cs-impact__glow" aria-hidden />
      <div className="cs-impact__inner">
        <Reveal distance={16}>
          <span className="cs-impact__eyebrow">{isRTL ? 'أثر العميل' : 'Client Impact'}</span>
          <Quote className="cs-impact__quote-icon" aria-hidden />
          <p className="cs-impact__outcome">{cs.outcome[isRTL ? 'ar' : 'en']}</p>
          <blockquote className="cs-impact__pull" style={{ margin: 0 }}>"{cs.testimonial.quote[isRTL ? 'ar' : 'en']}"</blockquote>
          <footer className="cs-impact__footer">
            <div className="cs-impact__avatar" style={{ background: cs.color }} aria-hidden>{cs.testimonial.name.charAt(0)}</div>
            <div>
              <div className="cs-impact__name">{cs.testimonial.name}</div>
              <div className="cs-impact__role">{cs.testimonial.role[isRTL ? 'ar' : 'en']}</div>
            </div>
          </footer>
        </Reveal>
      </div>
    </section>
  );
};

export default ImpactQuote;
