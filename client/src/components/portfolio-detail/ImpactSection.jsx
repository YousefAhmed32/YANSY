import { ArrowRight } from 'lucide-react';
import Reveal from '../Reveal';
import ProgressiveImage from '../ProgressiveImage';

const FONT_EN = "'Inter',system-ui,sans-serif";
const FONT_AR = "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif";

const PerformanceRow = ({ metrics, isRTL, font }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '14px 40px' }}>
    {metrics.map((m, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', fontFamily: font }}>{isRTL && m.labelAr ? m.labelAr : m.label}</span>
        <span dir="ltr" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'line-through' }}>{m.before}</span>
          <ArrowRight style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.35)' }} aria-hidden />
          <span style={{ fontSize: 14.5, fontWeight: 700, color: '#60A5FA' }}>{m.after}</span>
        </span>
      </div>
    ))}
  </div>
);

/**
 * The page's mid-scroll climax — a dark, full-bleed "results reveal", the
 * first tonal break after four straight light sections (hero → story →
 * process → build). Replaces ResultsAndTestimonial, and also finally gives
 * `project.metrics[]` a real display: the hero panel only ever shows the
 * first 4 as small glass chips (a teaser), every metric beyond that had no
 * render path anywhere on the page. This is the "in full" payoff.
 */
const ImpactSection = ({ project, isRTL }) => {
  const font = isRTL ? FONT_AR : FONT_EN;
  const results = isRTL ? (project.resultsAr || project.results) : (project.results || project.resultsAr);
  const metrics = project.metrics || [];
  const perf = project.performanceMetrics?.filter((m) => m.before && m.after) || [];
  const t = project.testimonials?.[0];
  const quote = t && (isRTL ? (t.quoteAr || t.quote) : (t.quote || t.quoteAr));
  const role  = t && (isRTL ? (t.roleAr || t.role) : t.role);

  if (!results && !metrics.length && !perf.length && !quote) return null;

  return (
    <section className="section-shell impact-section" style={{ background: 'rgb(var(--bg-contrast))', borderTop: 'none', position: 'relative', overflow: 'hidden' }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', top: '20%', insetInlineStart: '50%', transform: 'translateX(-50%)', width: 620, height: 300, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(37,99,235,0.16) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />

      <div className="section-inner" style={{ maxWidth: 980, textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <Reveal distance={16}>
          <span className="section-label" style={{ background: 'rgba(37,99,235,0.14)', border: '1px solid rgba(37,99,235,0.28)', color: '#93C5FD', boxShadow: 'none', marginBottom: 24 }}>
            {isRTL ? 'الأثر' : 'The Impact'}
          </span>

          {results && (
            <p style={{
              fontFamily: font, fontSize: 'clamp(1.375rem, 3vw, 2.125rem)', fontWeight: isRTL ? 600 : 500,
              color: '#fff', lineHeight: 1.5, letterSpacing: isRTL ? 0 : '-0.015em',
              whiteSpace: 'pre-line', margin: '0 auto', maxWidth: 780,
            }}>
              {results}
            </p>
          )}
        </Reveal>

        {metrics.length > 0 && (
          <Reveal stagger distance={18} step={0.08} className="impact-metric-row" style={{ marginTop: results ? 'clamp(3rem, 6vw, 4.5rem)' : 0 }}>
            {metrics.map((m, i) => (
              <div key={i}>
                <div dir="ltr" style={{
                  fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(2.5rem, 6vw, 4.25rem)', fontWeight: 800,
                  lineHeight: 1, letterSpacing: '-0.02em', color: '#60A5FA', fontVariantNumeric: 'tabular-nums',
                }}>
                  {m.value}
                </div>
                <div style={{ fontFamily: font, fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 10 }}>
                  {isRTL ? (m.labelAr || m.label) : (m.labelEn || (m.label && !/[\u0600-\u06FF]/.test(m.label) ? m.label : m.labelEn || m.label))}
                </div>
              </div>
            ))}
          </Reveal>
        )}

        {perf.length > 0 && (
          <Reveal distance={16} style={{ marginTop: (results || metrics.length) ? 'clamp(2.5rem, 5vw, 3.5rem)' : 0, paddingTop: (results || metrics.length) ? 'clamp(2rem, 4vw, 3rem)' : 0, borderTop: (results || metrics.length) ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
            <PerformanceRow metrics={perf} isRTL={isRTL} font={font} />
          </Reveal>
        )}

        {quote && (
          <Reveal distance={16} style={{ marginTop: (results || metrics.length || perf.length) ? 'clamp(3.5rem, 7vw, 5rem)' : 0, paddingTop: (results || metrics.length || perf.length) ? 'clamp(2.5rem, 5vw, 3.5rem)' : 0, borderTop: (results || metrics.length || perf.length) ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
            <span aria-hidden style={{ display: 'block', color: '#3B82F6', fontSize: 40, lineHeight: 1, fontFamily: 'Georgia, serif', marginBottom: 8 }}>&ldquo;</span>
            <p style={{ fontFamily: font, fontWeight: 300, color: '#fff', fontSize: 'clamp(1.125rem, 2vw, 1.5rem)', lineHeight: 1.55, letterSpacing: isRTL ? 0 : '-0.01em', maxWidth: 700, margin: '0 auto' }}>
              {quote}
            </p>
            {(t.author || role) && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 22 }}>
                {t.avatar?.url && (
                  <ProgressiveImage asset={t.avatar} alt={t.author || ''} className="w-10 h-10 rounded-full flex-shrink-0" />
                )}
                <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                  {t.author && <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>{t.author}</p>}
                  {role && <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', margin: 0 }}>{role}</p>}
                </div>
              </div>
            )}
          </Reveal>
        )}
      </div>

      <style>{`
        .impact-metric-row {
          display: grid;
          grid-template-columns: repeat(${Math.min(2, metrics.length) || 1}, 1fr);
          gap: clamp(2rem, 5vw, 3.5rem) clamp(1.5rem, 4vw, 3rem);
          justify-items: center;
        }
        @media (min-width: 640px) {
          .impact-metric-row { grid-template-columns: repeat(${Math.min(4, metrics.length) || 1}, 1fr); }
        }
      `}</style>
    </section>
  );
};

export default ImpactSection;
