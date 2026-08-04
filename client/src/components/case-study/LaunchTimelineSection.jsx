import { useLanguage } from '../../contexts/LanguageContext';
import SectionHeader from '../SectionHeader';
import LaunchTimeline from './LaunchTimeline';

const LaunchTimelineSection = ({ cs }) => {
  const { isRTL } = useLanguage();
  return (
    <section className="section-shell section-shell--tint" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="section-inner">
        <SectionHeader
          align="stack"
          eyebrow={isRTL ? 'البناء والإطلاق' : 'Build & Launch'}
          title={isRTL ? 'من الفكرة إلى الإنتاج.' : 'From concept to production.'}
        />
        <LaunchTimeline duration={cs.duration[isRTL ? 'ar' : 'en']} year={cs.year} color={cs.color} />
      </div>
    </section>
  );
};

export default LaunchTimelineSection;
