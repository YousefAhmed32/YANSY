import Reveal from '../Reveal';
import ProgressiveImage from '../ProgressiveImage';

const FONT_EN = "'Inter',system-ui,sans-serif";
const FONT_AR = "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif";

/**
 * The payoff beat: Results copy flowing directly into the testimonial, no
 * section break between them — they're one persuasive idea ("here's what
 * happened" → "here's the client saying so"), not two disconnected page
 * regions like the previous Results-paragraph / far-away-Testimonial split.
 * Metrics themselves now live as glass chips in the Hero panel, so they
 * aren't repeated here.
 */
const ResultsAndTestimonial = ({ project, isRTL }) => {
  const font = isRTL ? FONT_AR : FONT_EN;
  const results = isRTL ? (project.resultsAr || project.results) : (project.results || project.resultsAr);
  const t = project.testimonial;
  const quote = t && (isRTL ? (t.quoteAr || t.quote) : (t.quote || t.quoteAr));
  const role  = t && (isRTL ? (t.roleAr || t.role) : t.role);

  if (!results && !quote) return null;

  return (
    <section className="section-shell section-shell--tint" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="section-inner" style={{ maxWidth: 780, textAlign: 'center' }}>
        {results && (
          <Reveal distance={16}>
            <span className="section-label" style={{ marginBottom: 20 }}>{isRTL ? 'النتائج' : 'The Results'}</span>
            <p style={{
              fontFamily: font, fontSize: 'clamp(1.375rem, 3vw, 2rem)', fontWeight: isRTL ? 500 : 400,
              color: 'var(--text-primary)', lineHeight: 1.5, letterSpacing: isRTL ? 0 : '-0.01em',
              whiteSpace: 'pre-line', margin: '0 auto',
            }}>
              {results}
            </p>
          </Reveal>
        )}

        {quote && (
          <Reveal distance={16} style={{ marginTop: results ? 'clamp(3rem, 6vw, 4.5rem)' : 0 }}>
            <div style={{ width: 40, height: 40, margin: '0 auto 24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-light)' }} aria-hidden>
              <span style={{ color: 'var(--accent)', fontSize: 24, lineHeight: 1, fontFamily: 'Georgia, serif' }}>&ldquo;</span>
            </div>
            <p style={{ fontFamily: font, fontWeight: 300, color: 'var(--text-primary)', fontSize: 'clamp(1.125rem, 2vw, 1.5rem)', lineHeight: 1.5, letterSpacing: isRTL ? 0 : '-0.01em' }}>
              {quote}
            </p>
            {(t.author || role) && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 24 }}>
                {t.avatar?.url && (
                  <ProgressiveImage asset={t.avatar} alt={t.author || ''} className="w-10 h-10 rounded-full flex-shrink-0" />
                )}
                <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                  {t.author && <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t.author}</p>}
                  {role && <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', margin: 0 }}>{role}</p>}
                </div>
              </div>
            )}
          </Reveal>
        )}
      </div>
    </section>
  );
};

export default ResultsAndTestimonial;
