import { Sparkles } from 'lucide-react';

/**
 * Centered eyebrow → headline → lead used by the homepage's "story" sections
 * (WhyYANSY, TechSection, …). Pulled out after being hand-copied once — one
 * shared header keeps the reveal choreography, underline sweep and RTL
 * handling from drifting apart section to section.
 *
 * `accent` is a substring of `title` that gets the accent color + the
 * gradient underline that sweeps in once `revealed` is true. `title` uses
 * `\n` for authored line breaks.
 */
const PremiumSectionHeader = ({
  icon,
  badge,
  title,
  accent,
  lead,
  font,
  isRTL,
  revealed,
  id,
  maxWidth = 640,
  style,
}) => {
  const Icon = icon || Sparkles;
  let before = title;
  let after = '';
  if (accent && title.includes(accent)) {
    const idx = title.indexOf(accent);
    before = title.slice(0, idx);
    after = title.slice(idx + accent.length);
  }

  return (
    <div className="psh" style={{ maxWidth, ...style }}>
      <style>{`
        .psh { margin: 0 auto clamp(3.5rem, 7vw, 5.5rem); text-align: center; }
        .psh-title {
          font-size: clamp(2.25rem, 5.4vw, 3.75rem); font-weight: 800; letter-spacing: -0.04em;
          line-height: 1.08; color: rgb(var(--text-primary)); margin: 22px 0 20px; white-space: pre-line;
        }
        [dir="rtl"] .psh-title { font-family: var(--font-arabic); letter-spacing: 0; line-height: 1.5; }
        .psh-accent { color: rgb(var(--accent)); position: relative; display: inline-block; }
        .psh-accent::after {
          content: ''; position: absolute; left: 2px; right: 2px; bottom: 0.02em; height: 0.1em;
          background: linear-gradient(90deg, rgb(var(--accent) / 0.18), rgb(var(--accent) / 0.6));
          border-radius: 4px; transform-origin: ${isRTL ? 'right' : 'left'}; transform: scaleX(0);
          transition: transform 0.9s cubic-bezier(0.16,1,0.3,1) 0.5s;
        }
        .psh-title.is-in .psh-accent::after { transform: scaleX(1); }
        .psh-lead {
          font-size: clamp(0.9375rem, 1.15vw, 1.0625rem); color: rgb(var(--text-secondary));
          line-height: 1.75; margin: 0 auto; max-width: 540px;
        }
      `}</style>
      <span className="section-label">
        <Icon size={12} aria-hidden />
        {badge}
      </span>
      <h2
        id={id}
        className={`psh-title${revealed ? ' is-in' : ''}`}
        style={{ fontFamily: font }}
      >
        {before}
        {accent && <span className="psh-accent">{accent}</span>}
        {after}
      </h2>
      {lead && (
        <p className="psh-lead" style={{ fontFamily: font }}>{lead}</p>
      )}
    </div>
  );
};

export default PremiumSectionHeader;
