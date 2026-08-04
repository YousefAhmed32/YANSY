import { Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Reveal from './Reveal';

/**
 * The homepage's one section-header primitive: eyebrow → h2 → lead paragraph,
 * with an optional action on the far side.
 *
 * It exists because the sections had each re-declared this block inline with
 * drifting values — heading `line-height` ranged from 1.0 to 1.5 across
 * sections, `margin-bottom` from 12px to 5rem, and the Arabic/Latin font
 * switch was copy-pasted into roughly forty style objects. Display headings at
 * `line-height: 1.0` also clipped Arabic descenders, so the RTL rhythm is set
 * here once (see `--lh-display-*` in index.css) rather than per section.
 *
 * `align="center"` absorbed what used to be a second, parallel header
 * component (`PremiumSectionHeader`) that reimplemented this same eyebrow →
 * h2 → lead shape with its own hardcoded font-size clamp instead of the
 * shared `--text-5xl`/`--lh-display-ar` tokens above — the exact drift this
 * component exists to prevent. Its one genuinely different feature, the
 * accent-underline sweep on a highlighted word, is preserved via `accent`.
 *
 * Reveal has two modes: pass `revealed` (a boolean) when the parent section
 * already runs its own `useReveal`/GSAP timeline and wants this header timed
 * against it (see TechSection/WhyYANSY/ProcessSection) — the header then
 * renders un-wrapped and `style` is applied directly. Omit `revealed` for the
 * default self-contained mode, where the header owns its own
 * IntersectionObserver reveal via `<Reveal>` (every other consumer).
 */
const SectionHeader = ({
  eyebrow,
  icon: Icon,
  title,
  accent,
  lead,
  action,
  align = 'split',   // 'split' — title left / lead+action right · 'stack' — one column · 'center' — centered, optional accent-underline
  maxLeadWidth = 440,
  maxWidth,
  className = '',
  style,
  revealed,
  id,
}) => {
  const { isRTL } = useLanguage();
  const side = isRTL ? 'right' : 'left';
  const centered = align === 'center';
  // Every current align="center" section wants the same badge icon and never
  // customizes it — default it there only, so split/stack sections (which
  // never had an eyebrow icon) don't silently gain one.
  const EyebrowIcon = Icon ?? (centered ? Sparkles : null);

  let titleNode = title;
  if (centered && accent && typeof title === 'string' && title.includes(accent)) {
    const idx = title.indexOf(accent);
    titleNode = (
      <>
        {title.slice(0, idx)}
        <span className="section-header__accent">{accent}</span>
        {title.slice(idx + accent.length)}
      </>
    );
  }

  const content = (
    <>
      <div className="section-header__main" style={{ textAlign: centered ? 'center' : side }}>
        {eyebrow && (
          <span className="section-label section-header__eyebrow">
            {EyebrowIcon && <EyebrowIcon size={12} aria-hidden />}
            {eyebrow}
          </span>
        )}
        <h2 id={id} className={`section-header__title${revealed ? ' is-in' : ''}`}>{titleNode}</h2>
        {align !== 'split' && lead && (
          <p className="section-header__lead" style={{ maxWidth: maxLeadWidth, marginInline: centered ? 'auto' : undefined }}>{lead}</p>
        )}
      </div>

      {align === 'split' && (lead || action) && (
        <div className="section-header__aside" style={{ textAlign: side }}>
          {lead && <p className="section-header__lead" style={{ maxWidth: maxLeadWidth }}>{lead}</p>}
          {action}
        </div>
      )}
      {align !== 'split' && action && <div className="section-header__aside">{action}</div>}
    </>
  );

  const rootClassName = `section-header section-header--${align} ${className}`;
  const rootStyle = { maxWidth: maxWidth ?? (centered ? 640 : undefined), ...style };

  // Controlled mode — parent owns the reveal timing.
  if (revealed !== undefined) {
    return <div className={rootClassName} style={rootStyle}>{content}</div>;
  }

  // Self-contained mode — the header reveals itself on scroll.
  return (
    <Reveal className={rootClassName} style={rootStyle} distance={18}>
      {content}
    </Reveal>
  );
};

export default SectionHeader;
