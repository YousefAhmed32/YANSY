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
 */
const SectionHeader = ({
  eyebrow,
  title,
  lead,
  action,
  align = 'split',   // 'split' — title left / lead+action right · 'stack' — one column
  maxLeadWidth = 440,
  className = '',
  style,
}) => {
  const { isRTL } = useLanguage();
  const side = isRTL ? 'right' : 'left';

  return (
    <Reveal
      className={`section-header section-header--${align} ${className}`}
      style={style}
      distance={18}
    >
      <div className="section-header__main" style={{ textAlign: side }}>
        {eyebrow && <span className="section-label section-header__eyebrow">{eyebrow}</span>}
        <h2 className="section-header__title">{title}</h2>
        {align === 'stack' && lead && (
          <p className="section-header__lead" style={{ maxWidth: maxLeadWidth }}>{lead}</p>
        )}
      </div>

      {(align === 'split' && (lead || action)) && (
        <div className="section-header__aside" style={{ textAlign: side }}>
          {lead && <p className="section-header__lead" style={{ maxWidth: maxLeadWidth }}>{lead}</p>}
          {action}
        </div>
      )}
      {align === 'stack' && action && <div className="section-header__aside">{action}</div>}
    </Reveal>
  );
};

export default SectionHeader;
