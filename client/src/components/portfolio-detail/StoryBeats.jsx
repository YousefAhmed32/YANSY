import Reveal from '../Reveal';

const FONT_EN = "'Inter',system-ui,sans-serif";
const FONT_AR = "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif";

const BEATS = [
  ['goals', 'goalsAr', { en: 'The Goal', ar: 'الهدف' }],
  ['painPoints', 'painPointsAr', { en: 'The Pain Points', ar: 'نقاط الألم' }],
  ['challenge', 'challengeAr', { en: 'The Challenge', ar: 'التحدي' }],
  ['solution', 'solutionAr', { en: 'The Solution', ar: 'الحل' }],
];

/**
 * The story arc — goals/pain-points/challenge/solution, whichever are
 * present — as a vertical editorial sequence with alternating margins
 * instead of the equal-weight numbered-card grid this replaces. Each beat
 * pushes in from the opposite edge of the one before it, so scrolling down
 * reads like turning pages in a magazine feature rather than scanning a
 * uniform 2-up grid where every beat carried identical visual weight.
 * `flip` always keys off the beat's *authored* position (not a post-filter
 * index), so which side a beat lands on doesn't reshuffle when an earlier
 * field is empty on a given project.
 */
const StoryBeats = ({ project, isRTL }) => {
  const font = isRTL ? FONT_AR : FONT_EN;
  const beats = BEATS
    .map(([enKey, arKey, label], i) => ({
      key: enKey,
      flip: i % 2 === 1,
      label: isRTL ? label.ar : label.en,
      content: isRTL ? (project[arKey] || project[enKey]) : (project[enKey] || project[arKey]),
    }))
    .filter((b) => b.content);
  const tags = project.technologies?.filter(Boolean) || [];

  if (!beats.length && !tags.length) return null;

  return (
    <section className="section-shell section-shell--plain story-beats" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="section-inner" style={{ maxWidth: 1100 }}>
        {beats.length > 0 && (
          <span className="section-label" style={{ marginBottom: 'clamp(2rem, 4vw, 3rem)', display: 'inline-flex' }}>
            {isRTL ? 'قصة المشروع' : 'The Story'}
          </span>
        )}

        {beats.map((b, i) => (
          <Reveal key={b.key} distance={20}>
            <div className={`story-beat ${b.flip ? 'story-beat--flip' : ''}`} style={{ textAlign: isRTL ? 'right' : 'left' }}>
              <span aria-hidden className="story-beat__num" dir="ltr">{String(i + 1).padStart(2, '0')}</span>
              <div className="story-beat__body">
                <span className="section-label" style={{ marginBottom: 16, display: 'inline-flex' }}>{b.label}</span>
                <p style={{
                  fontFamily: font, fontSize: 'clamp(1.125rem, 2vw, 1.5rem)', fontWeight: isRTL ? 500 : 400,
                  color: 'rgb(var(--text-primary))', lineHeight: 1.7, whiteSpace: 'pre-line', letterSpacing: isRTL ? 0 : '-0.01em',
                }}>
                  {b.content}
                </p>
              </div>
            </div>
          </Reveal>
        ))}

        {tags.length > 0 && (
          <Reveal distance={16}>
            <div style={{
              marginTop: beats.length ? 'clamp(3rem, 6vw, 4.5rem)' : 0, paddingTop: beats.length ? 'clamp(1.75rem, 3vw, 2.5rem)' : 0,
              borderTop: beats.length ? '1px solid rgb(var(--border))' : 'none',
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10,
              flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: isRTL ? 'flex-end' : 'flex-start',
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgb(var(--text-tertiary))', marginInlineEnd: 4 }}>
                {isRTL ? 'التقنيات' : 'Built With'}
              </span>
              {tags.map((tag) => (
                <span key={tag._id} style={{
                  fontSize: 12, padding: '6px 14px', borderRadius: 999,
                  border: '1px solid rgb(var(--accent-muted))', background: 'rgb(var(--accent-light))',
                  color: '#1E40AF', fontWeight: 500, fontFamily: font,
                }}>
                  {tag.name}
                </span>
              ))}
            </div>
          </Reveal>
        )}
      </div>

      <style>{`
        .story-beat {
          position: relative;
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
          padding: clamp(2.25rem, 5vw, 3.25rem) 0;
          border-top: 1px solid rgb(var(--border));
        }
        .story-beat__num {
          font-family: 'Inter',system-ui,sans-serif;
          font-size: clamp(3.5rem, 8vw, 6.5rem);
          font-weight: 800;
          line-height: 0.8;
          color: rgb(var(--border-strong));
          opacity: 0.55;
          font-variant-numeric: tabular-nums;
        }
        .story-beat__body { max-width: 62ch; }
        @media (min-width: 860px) {
          .story-beat { grid-template-columns: 200px 1fr; align-items: start; gap: clamp(2rem, 4vw, 4rem); }
          .story-beat--flip { grid-template-columns: 1fr 200px; }
          .story-beat--flip .story-beat__num { order: 2; text-align: right; }
          [dir="rtl"] .story-beat--flip .story-beat__num { text-align: left; }
          .story-beat__body { justify-self: start; }
        }
      `}</style>
    </section>
  );
};

export default StoryBeats;
