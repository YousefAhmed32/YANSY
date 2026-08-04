import { useLanguage } from '../../contexts/LanguageContext';
import SectionHeader from '../SectionHeader';
import { RevealItems } from '../Reveal';

/* Discovery & Research beat — the numbers behind each study's `uxProcess`
   narrative (interview counts, tested-cohort sizes, etc.), pulled out as
   standalone stat chips so the full research story isn't printed twice
   (the qualitative narrative itself lives in UXPrinciplesSection). */
const DiscoverySection = ({ cs }) => {
  const { isRTL } = useLanguage();
  if (!cs.discoveryStats?.length) return null;

  return (
    <section className="section-shell section-shell--tint" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="section-inner">
        <SectionHeader
          align="stack"
          eyebrow={isRTL ? 'الاستكشاف والبحث' : 'Discovery & Research'}
          title={isRTL ? 'نبدأ بالناس، لا بالشاشات.' : "We start with people, not screens."}
        />
        <RevealItems className="cs-discovery-row" distance={16}>
          <style>{`
            .cs-discovery-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(180px, 100%), 1fr)); gap: 1px; background: rgb(var(--border)); border: 1px solid rgb(var(--border)); border-radius: var(--radius-lg); overflow: hidden; }
            .cs-discovery-stat { background: rgb(var(--bg-elevated)); padding: clamp(1.5rem, 3vw, 2rem); text-align: ${isRTL ? 'right' : 'left'}; }
            .cs-discovery-stat__value { font-size: clamp(1.75rem, 3.5vw, 2.5rem); font-weight: 800; color: rgb(var(--accent)); letter-spacing: -0.02em; line-height: 1; margin-bottom: 8px; font-variant-numeric: tabular-nums; }
            .cs-discovery-stat__label { font-size: var(--text-sm); color: rgb(var(--text-secondary)); line-height: 1.5; }
          `}</style>
          {cs.discoveryStats.map((s, i) => (
            <div key={i} className="cs-discovery-stat">
              <div className="cs-discovery-stat__value" dir="ltr">{s.value}</div>
              <div className="cs-discovery-stat__label">{s.label[isRTL ? 'ar' : 'en']}</div>
            </div>
          ))}
        </RevealItems>
      </div>
    </section>
  );
};

export default DiscoverySection;
