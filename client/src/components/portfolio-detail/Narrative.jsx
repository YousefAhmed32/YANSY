import Reveal from '../Reveal';

const FONT_EN = "'Inter',system-ui,sans-serif";
const FONT_AR = "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif";

const Index = ({ n }) => (
  <span aria-hidden style={{
    display: 'block', fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
    fontWeight: 800, lineHeight: 1, color: 'var(--border-strong)', fontVariantNumeric: 'tabular-nums', marginBottom: 18,
  }} dir="ltr">
    {String(n).padStart(2, '0')}
  </span>
);

/**
 * The problem/answer pair, given equal weight side by side so the reader
 * holds both in view at once — rather than the flat Overview→Challenge→
 * Solution→Process→Results column the previous version used, where nothing
 * signaled which paragraph mattered most. "The Brief" (description) now
 * lives in the hero lead, so this starts directly at Challenge.
 */
const Narrative = ({ project, isRTL }) => {
  const font = isRTL ? FONT_AR : FONT_EN;
  const challenge = isRTL ? (project.challengeAr || project.challenge) : (project.challenge || project.challengeAr);
  const solution  = isRTL ? (project.solutionAr  || project.solution)  : (project.solution  || project.solutionAr);
  const process   = isRTL ? (project.processAr   || project.process)   : (project.process   || project.processAr);
  const tags = project.tags?.filter(Boolean) || [];

  if (!challenge && !solution && !process && !tags.length) return null;

  return (
    <section className="section-shell section-shell--plain" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="section-inner" style={{ maxWidth: 1040 }}>

        {(challenge || solution) && (
          <Reveal stagger className="narrative-pair" step={0.1} itemClassName="narrative-pair__item" distance={16}>
            {challenge && (
              <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                <Index n={1} />
                <span className="section-label" style={{ marginBottom: 16, display: 'inline-flex' }}>{isRTL ? 'التحدي' : 'The Challenge'}</span>
                <p style={{ fontFamily: font, fontSize: 'clamp(1rem, 1.4vw, 1.125rem)', fontWeight: 400, color: 'var(--text-secondary)', lineHeight: 1.85, whiteSpace: 'pre-line' }}>
                  {challenge}
                </p>
              </div>
            )}
            {solution && (
              <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                <Index n={2} />
                <span className="section-label" style={{ marginBottom: 16, display: 'inline-flex' }}>{isRTL ? 'الحل' : 'The Solution'}</span>
                <p style={{ fontFamily: font, fontSize: 'clamp(1rem, 1.4vw, 1.125rem)', fontWeight: 400, color: 'var(--text-secondary)', lineHeight: 1.85, whiteSpace: 'pre-line' }}>
                  {solution}
                </p>
              </div>
            )}
          </Reveal>
        )}

        {process && (
          <Reveal distance={16}>
            <div style={{
              marginTop: (challenge || solution) ? 'clamp(3rem, 6vw, 4.5rem)' : 0,
              borderInlineStart: '2px solid var(--accent-muted)', paddingInlineStart: 'clamp(1.25rem, 3vw, 2rem)',
              textAlign: isRTL ? 'right' : 'left',
            }}>
              <span className="section-label" style={{ marginBottom: 14, display: 'inline-flex' }}>{isRTL ? 'كيف عملنا' : 'Our Process'}</span>
              <p style={{ fontFamily: font, fontSize: 'clamp(0.9375rem, 1.2vw, 1.0625rem)', fontWeight: 400, color: 'var(--text-secondary)', lineHeight: 1.85, whiteSpace: 'pre-line', maxWidth: '72ch' }}>
                {process}
              </p>
            </div>
          </Reveal>
        )}

        {tags.length > 0 && (
          <Reveal distance={16}>
            <div style={{
              marginTop: 'clamp(3rem, 6vw, 4.5rem)', paddingTop: 'clamp(1.75rem, 3vw, 2.5rem)', borderTop: '1px solid var(--border)',
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10,
              flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: isRTL ? 'flex-end' : 'flex-start',
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginInlineEnd: 4 }}>
                {isRTL ? 'التقنيات' : 'Built With'}
              </span>
              {tags.map((tag) => (
                <span key={tag} style={{
                  fontSize: 12, padding: '6px 14px', borderRadius: 999,
                  border: '1px solid var(--accent-muted)', background: 'var(--accent-light)',
                  color: '#1E40AF', fontWeight: 500, fontFamily: font,
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </Reveal>
        )}
      </div>

      <style>{`
        .narrative-pair { display: grid; grid-template-columns: 1fr; gap: clamp(2.5rem, 5vw, 4rem); }
        @media (min-width: 800px) {
          .narrative-pair { grid-template-columns: repeat(2, 1fr); }
          /* Challenge or Solution alone (the other field empty) spans full width
             instead of leaving a blank second column. */
          .narrative-pair:has(> .narrative-pair__item:only-child) { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
};

export default Narrative;
