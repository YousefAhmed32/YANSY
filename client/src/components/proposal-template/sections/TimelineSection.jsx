import { useReveal } from '../../../hooks/useReveal';
import { reveal } from '../revealHelper';
import { t, pickLang } from '../copy';

const TimelineSection = ({ timeline, isRTL, lang }) => {
  const { ref, revealed } = useReveal();
  const phases = [...(timeline?.phases || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  if (!phases.length) return null;

  return (
    <section className="pt-section pt-tint" ref={ref}>
      <div className="pt-container">
        <div {...reveal(revealed, '', { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, marginBottom: 'clamp(2.5rem, 5vw, 3.75rem)' })}>
          <div className="pt-stack-sm">
            <span className="pt-eyebrow">{t('timeline', lang)}</span>
            <h2 className="pt-h1">{pickLang(isRTL, 'الجدول الزمني للتنفيذ', 'Implementation Timeline')}</h2>
          </div>
          {timeline.totalDuration && (
            <p className="pt-num-lg" style={{ color: 'rgb(var(--accent-ink-rgb))' }}>
              {pickLang(isRTL, timeline.totalDurationAr, timeline.totalDuration)}
            </p>
          )}
        </div>

        <div className="pt-phase-track" {...reveal(revealed)}>
          {phases.map((phase, i) => (
            <div key={phase._id || i} className="pt-phase">
              <div className="pt-phase-head">
                <span className="pt-phase-num">{String(i + 1).padStart(2, '0')}</span>
                {phase.duration && <span className="pt-phase-duration">{phase.duration}</span>}
              </div>
              <p className="pt-h3" style={{ fontSize: '1rem' }}>{pickLang(isRTL, phase.titleAr, phase.title)}</p>
              {phase.description && (
                <p className="pt-body-sm" style={{ marginTop: 6 }}>{pickLang(isRTL, phase.descriptionAr, phase.description)}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TimelineSection;
