import { ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import Reveal from '../Reveal';

const CaseStudyCTA = ({ onStartProject }) => {
  const { isRTL } = useLanguage();
  return (
    <section className="section-shell section-shell--plain" dir={isRTL ? 'rtl' : 'ltr'} style={{ textAlign: 'center' }}>
      <div className="section-inner" style={{ maxWidth: 560 }}>
        <Reveal distance={16}>
          <span className="section-label" style={{ marginBottom: '1rem' }}>{isRTL ? 'دورك الآن' : 'Your Turn'}</span>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, color: 'rgb(var(--text-primary))', lineHeight: 1.1, letterSpacing: isRTL ? 0 : '-0.03em', margin: '1rem 0 2rem' }}>
            {isRTL ? 'ابنِ شيئًا مثل هذا' : 'Build Something Like This'}
          </h2>
          <button onClick={onStartProject} className="btn-accent" style={{ fontSize: 14, padding: '15px 36px' }}>
            {isRTL ? 'ابدأ مشروعك' : 'Start a Project'}
            <ArrowUpRight size={16} style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
          </button>
        </Reveal>
      </div>
    </section>
  );
};

export default CaseStudyCTA;
