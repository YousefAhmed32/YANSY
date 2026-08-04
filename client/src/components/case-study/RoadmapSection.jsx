import { Map } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import Reveal from '../Reveal';

/* Short, single-paragraph "what's next" — deliberately compact (no
   SectionHeader, no grid) so it doesn't get padded out to match the
   size of the sections around it. */
const RoadmapSection = ({ cs }) => {
  const { isRTL } = useLanguage();
  if (!cs.roadmap) return null;
  const side = isRTL ? 'right' : 'left';

  return (
    <section className="section-shell section-shell--plain" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="section-inner">
        <Reveal distance={14}>
          <div className="cs-roadmap" style={{ display: 'flex', gap: 20, alignItems: 'flex-start', maxWidth: 720, flexDirection: isRTL ? 'row-reverse' : 'row', textAlign: side }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: `${cs.color}12`, border: `1px solid ${cs.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Map size={19} style={{ color: cs.color }} aria-hidden />
            </div>
            <div>
              <span className="text-label" style={{ display: 'block', marginBottom: 8 }}>{isRTL ? 'ما القادم' : "What's Next"}</span>
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'rgb(var(--text-primary))', marginBottom: 8 }}>{cs.roadmap.title[isRTL ? 'ar' : 'en']}</h3>
              <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.75, color: 'rgb(var(--text-secondary))' }}>{cs.roadmap.body[isRTL ? 'ar' : 'en']}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default RoadmapSection;
