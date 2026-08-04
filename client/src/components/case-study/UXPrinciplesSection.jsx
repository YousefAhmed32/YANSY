import { useLanguage } from '../../contexts/LanguageContext';
import SectionHeader from '../SectionHeader';
import { RevealItems } from '../Reveal';

const UXPrinciplesSection = ({ cs }) => {
  const { isRTL } = useLanguage();
  const side = isRTL ? 'right' : 'left';

  return (
    <section className="section-shell section-shell--tint" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="section-inner">
        <SectionHeader
          eyebrow={isRTL ? 'تجربة المستخدم' : 'UX Thinking'}
          title={cs.uxProcess.title[isRTL ? 'ar' : 'en']}
          lead={cs.uxProcess.body[isRTL ? 'ar' : 'en']}
          maxLeadWidth={420}
        />

        {cs.designPrinciples?.length > 0 && (
          <RevealItems className="cs-principles" distance={16}>
            <style>{`
              .cs-principles { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr)); gap: 1.25rem; margin-bottom: clamp(2.5rem, 5vw, 3.5rem); }
              .cs-principle { padding: clamp(1.5rem, 3vw, 2rem); text-align: ${side}; }
              .cs-principle__index { font-size: 11px; font-weight: 800; color: rgb(var(--accent)); letter-spacing: 0.08em; margin-bottom: 12px; display: block; }
              .cs-principle__title { font-size: var(--text-lg); font-weight: 700; color: rgb(var(--text-primary)); margin-bottom: 8px; }
              .cs-principle__desc { font-size: var(--text-sm); line-height: 1.7; color: rgb(var(--text-secondary)); }
            `}</style>
            {cs.designPrinciples.map((p, i) => (
              <div key={i} className="card cs-principle">
                <span className="cs-principle__index" dir="ltr">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="cs-principle__title">{p.title[isRTL ? 'ar' : 'en']}</h3>
                <p className="cs-principle__desc">{p.desc[isRTL ? 'ar' : 'en']}</p>
              </div>
            ))}
          </RevealItems>
        )}

        <div className="cs-tokens" dir="ltr">
          <style>{`
            .cs-tokens { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; padding: 1.25rem 1.5rem; border-radius: var(--radius-lg); background: rgb(var(--bg-elevated)); border: 1px solid rgb(var(--border)); }
            .cs-tokens__swatch { width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0; box-shadow: var(--shadow-sm); }
            .cs-tokens__meta { font-size: 11px; color: rgb(var(--text-tertiary)); letter-spacing: 0.06em; text-transform: uppercase; }
            .cs-tokens__hex { font-size: 13px; font-weight: 700; color: rgb(var(--text-primary)); font-family: var(--font-mono); }
            .cs-tokens__sample { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em; color: rgb(var(--text-primary)); }
          `}</style>
          <div className="cs-tokens__swatch" style={{ background: cs.color }} aria-hidden />
          <div>
            <div className="cs-tokens__meta">{isRTL ? 'اللون الأساسي' : 'Primary Color'}</div>
            <div className="cs-tokens__hex">{cs.color}</div>
          </div>
          <div className="divider" style={{ width: 1, height: 32, background: 'rgb(var(--border))' }} aria-hidden />
          <div className="cs-tokens__sample">Aa</div>
          <div className="cs-tokens__meta">{isRTL ? 'نظام النوع' : 'Type System'}</div>
        </div>
      </div>
    </section>
  );
};

export default UXPrinciplesSection;
