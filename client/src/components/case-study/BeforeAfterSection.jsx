import { X, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import SectionHeader from '../SectionHeader';
import Reveal from '../Reveal';

const BeforeAfterSection = ({ cs }) => {
  const { isRTL } = useLanguage();
  const side = isRTL ? 'right' : 'left';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  if (!cs.afterPoints?.length) return null;

  return (
    <section className="section-shell section-shell--plain" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="section-inner">
        <SectionHeader
          align="stack"
          eyebrow={isRTL ? 'قبل وبعد' : 'Before / After'}
          title={isRTL ? 'ماذا تغيّر فعليًا.' : 'What actually changed.'}
        />

        <Reveal className="cs-ba" distance={16}>
          <style>{`
            .cs-ba { display: grid; grid-template-columns: 1fr auto 1fr; gap: clamp(1.5rem, 3vw, 2.5rem); align-items: center; }
            @media (max-width: 780px) { .cs-ba { grid-template-columns: 1fr; } .cs-ba__arrow { transform: rotate(90deg); margin: 0 auto; } }
            .cs-ba__col { border-radius: var(--radius-lg); padding: clamp(1.5rem, 3vw, 2.25rem); border: 1px solid rgb(var(--border)); }
            .cs-ba__col--before { background: rgb(var(--danger-light)); }
            .cs-ba__col--after { background: rgb(var(--success-light)); }
            .cs-ba__label { font-size: 11px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 1.25rem; display: block; }
            .cs-ba__col--before .cs-ba__label { color: rgb(var(--danger)); }
            .cs-ba__col--after .cs-ba__label { color: rgb(var(--success)); }
            .cs-ba__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
            .cs-ba__item { display: flex; align-items: flex-start; gap: 10px; font-size: var(--text-sm); line-height: 1.6; color: rgb(var(--text-secondary)); text-align: ${side}; flex-direction: ${isRTL ? 'row-reverse' : 'row'}; }
            .cs-ba__item svg { flex-shrink: 0; width: 16px; height: 16px; margin-top: 2px; }
            .cs-ba__col--before .cs-ba__item svg { color: rgb(var(--danger)); }
            .cs-ba__col--after .cs-ba__item svg { color: rgb(var(--success)); }
            .cs-ba__arrow { width: 40px; height: 40px; border-radius: 50%; background: rgb(var(--bg-elevated)); border: 1px solid rgb(var(--border)); display: flex; align-items: center; justify-content: center; color: rgb(var(--accent)); flex-shrink: 0; }
          `}</style>

          <div className="cs-ba__col cs-ba__col--before">
            <span className="cs-ba__label">{isRTL ? 'قبل' : 'Before'}</span>
            <ul className="cs-ba__list">
              {cs.challenge.points.slice(0, 4).map((p, i) => (
                <li key={i} className="cs-ba__item"><X aria-hidden /><span>{p[isRTL ? 'ar' : 'en']}</span></li>
              ))}
            </ul>
          </div>

          <div className="cs-ba__arrow" aria-hidden><ArrowIcon size={18} /></div>

          <div className="cs-ba__col cs-ba__col--after">
            <span className="cs-ba__label">{isRTL ? 'بعد' : 'After'}</span>
            <ul className="cs-ba__list">
              {cs.afterPoints.map((p, i) => (
                <li key={i} className="cs-ba__item"><Check aria-hidden /><span>{p[isRTL ? 'ar' : 'en']}</span></li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default BeforeAfterSection;
