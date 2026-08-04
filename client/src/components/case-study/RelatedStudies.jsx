import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { CASE_STUDIES } from '../../data/caseStudies';
import SectionHeader from '../SectionHeader';
import { RevealItems } from '../Reveal';
import CaseStudyVisual from '../CaseStudyVisual';

const RelatedStudies = ({ cs }) => {
  const { isRTL } = useLanguage();
  const related = CASE_STUDIES.filter(c => cs.relatedStudies?.includes(c.slug)).slice(0, 2);
  if (!related.length) return null;

  return (
    <section className="section-shell section-shell--plain" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="section-inner">
        <SectionHeader
          align="stack"
          eyebrow={isRTL ? 'المزيد من أعمالنا' : 'More Work'}
          title={isRTL ? 'دراسات حالة ذات صلة' : 'Related Case Studies'}
        />
        <RevealItems className="cs-related" distance={16}>
          <style>{`
            .cs-related { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 1.25rem; }
            .cs-related__card { display: flex; align-items: center; gap: 1.25rem; padding: 1.25rem; text-decoration: none; flex-direction: ${isRTL ? 'row-reverse' : 'row'}; }
            .cs-related__thumb { position: relative; width: 84px; height: 64px; border-radius: 10px; overflow: hidden; flex-shrink: 0; }
            .cs-related__meta { font-size: 10px; color: rgb(var(--text-tertiary)); letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 6px; }
            .cs-related__title { font-size: 1.1rem; font-weight: 700; color: rgb(var(--text-primary)); line-height: 1.3; }
            .cs-related__arrow { color: rgb(var(--text-tertiary)); flex-shrink: 0; }
          `}</style>
          {related.map(c => (
            <Link key={c.slug} to={`/case-studies/${c.slug}`} className="card cs-related__card">
              <div className="cs-related__thumb">
                <CaseStudyVisual slug={c.slug} industryKey={c.industryKey} color={c.color} variant="thumb" isRTL={isRTL} alt={c.title} />
              </div>
              <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                <div className="cs-related__meta">{isRTL ? c.industry.ar : c.industry.en}</div>
                <div className="cs-related__title">{c.title}</div>
              </div>
              <ArrowUpRight className="cs-related__arrow" size={16} style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
            </Link>
          ))}
        </RevealItems>
      </div>
    </section>
  );
};

export default RelatedStudies;
