import { useLanguage } from '../../contexts/LanguageContext';
import SectionHeader from '../SectionHeader';
import Reveal, { RevealItems } from '../Reveal';
import ArchitectureDiagram from './ArchitectureDiagram';

const ArchitectureSection = ({ cs }) => {
  const { isRTL } = useLanguage();
  const side = isRTL ? 'right' : 'left';

  return (
    <section className="section-shell section-shell--plain" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="section-inner">
        <SectionHeader
          align="stack"
          eyebrow={isRTL ? 'البنية التقنية والتكاملات' : 'Architecture & Integrations'}
          title={isRTL ? 'قرارات هندسية رئيسية' : 'Key Engineering Decisions'}
        />

        <Reveal className="cs-arch-diagram-wrap" distance={16}>
          <style>{`.cs-arch-diagram-wrap { margin-bottom: clamp(2.5rem, 5vw, 4rem); }`}</style>
          <ArchitectureDiagram stack={cs.stack} color={cs.color} hubLabel={cs.title} />
        </Reveal>

        <RevealItems className="cs-decisions" distance={16}>
          <style>{`
            .cs-decisions { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr)); gap: 1px; background: rgb(var(--border)); border: 1px solid rgb(var(--border)); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 2.5rem; }
            .cs-decision { background: rgb(var(--bg-elevated)); padding: clamp(1.5rem, 3vw, 2.25rem); text-align: ${side}; transition: background 0.25s ease; }
            .cs-decision:hover { background: rgb(var(--bg-surface)); }
            .cs-decision__bar { width: 32px; height: 3px; border-radius: 2px; background: rgb(var(--accent)); margin-bottom: 20px; }
            .cs-decision__title { font-size: var(--text-lg); font-weight: 700; color: rgb(var(--text-primary)); margin-bottom: 10px; line-height: 1.3; }
            .cs-decision__desc { font-size: var(--text-sm); line-height: 1.75; color: rgb(var(--text-secondary)); }
          `}</style>
          {cs.keyDecisions.map((d, i) => (
            <div key={i} className="cs-decision">
              <div className="cs-decision__bar" aria-hidden />
              <h3 className="cs-decision__title">{d.title[isRTL ? 'ar' : 'en']}</h3>
              <p className="cs-decision__desc">{d.desc[isRTL ? 'ar' : 'en']}</p>
            </div>
          ))}
        </RevealItems>

        <div className="cs-stack-row" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
          <span className="text-label" style={{ marginInlineEnd: 4 }}>{isRTL ? 'التقنيات' : 'Stack'}</span>
          {cs.stack.map((t, i) => (
            <span key={i} dir="ltr" style={{
              padding: '6px 14px', borderRadius: 100, border: '1px solid rgb(var(--border))',
              background: 'rgb(var(--bg-surface))', color: 'rgb(var(--text-secondary))',
              fontSize: 11.5, fontWeight: 600, letterSpacing: '0.02em',
            }}>{t}</span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ArchitectureSection;
