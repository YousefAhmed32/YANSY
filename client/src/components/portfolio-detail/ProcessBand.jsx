import Reveal from '../Reveal';

const FONT_EN = "'Inter',system-ui,sans-serif";
const FONT_AR = "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif";

/**
 * `process` is a single free-text field, not a structured step list — so
 * rather than fabricating a numbered timeline the data doesn't support, this
 * gives it its own quiet interstitial: a short, tint-background "breather"
 * between the editorial story beats above and the denser build content
 * below. Deliberately the plainest-looking section on the page — after two
 * dense acts (the story, the build), a page needs a pause beat, not another
 * climax.
 */
const ProcessBand = ({ project, isRTL }) => {
  const font = isRTL ? FONT_AR : FONT_EN;
  const process = isRTL ? (project.processAr || project.process) : (project.process || project.processAr);
  if (!process) return null;

  return (
    <section className="section-shell section-shell--tint" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="section-inner" style={{ maxWidth: 760, textAlign: 'center' }}>
        <Reveal distance={14}>
          <span className="section-label" style={{ marginBottom: 24 }}>{isRTL ? 'كيف وصلنا لهذا' : 'How We Got There'}</span>
          <div aria-hidden style={{ width: 32, height: 2, background: 'rgb(var(--accent))', margin: '0 auto 28px', borderRadius: 2 }} />
          <p style={{
            fontFamily: font, fontSize: 'clamp(1.25rem, 2.4vw, 1.75rem)', fontWeight: 600,
            color: 'rgb(var(--text-primary))', lineHeight: 1.6, letterSpacing: isRTL ? 0 : '-0.015em', whiteSpace: 'pre-line',
          }}>
            {process}
          </p>
          <div aria-hidden style={{ width: 32, height: 2, background: 'rgb(var(--accent))', margin: '28px auto 0', borderRadius: 2 }} />
        </Reveal>
      </div>
    </section>
  );
};

export default ProcessBand;
