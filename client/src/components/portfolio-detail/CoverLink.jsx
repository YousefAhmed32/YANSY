import { ExternalLink } from 'lucide-react';

/**
 * Shared building blocks for the "clickable project cover" interaction used
 * by both the Quick Showcase and Full Case Study pages — a static cover
 * image becomes one semantic external link (click anywhere -> liveUrl) with
 * a restrained hover/focus scrim + pill; a cover video is never wrapped in
 * an anchor (that would swallow clicks meant for native play/seek/volume/
 * fullscreen controls) and instead gets this same pill rendered as its own
 * standalone, always-visible link, positioned clear of the control bar.
 *
 * Both PortfolioShowcaseView and Hero import this rather than hand-rolling
 * their own overlay/label/positioning so the two pages can't drift — only
 * the surrounding composition (what else sits on the cover) differs.
 */

const POSITION_STYLE = {
  'bottom-start': { bottom: 14, insetInlineStart: 14 },
  'top-end': { top: 14, insetInlineEnd: 14 },
};

// No explicit z-index on either layer below — both rely on DOM order
// instead (scrim rendered right after the media, pill rendered last), so
// they stack correctly *without* fighting the z-index:auto badge/metrics
// overlays each page renders in between. An explicit z-index here would
// jump the scrim above those siblings regardless of document order, since
// z-index:auto participates in the same paint pass as z-index:0 and any
// positive z-index always paints after it — see CoverLink usage sites for
// the required render order (media -> scrim -> other overlays -> pill).
const PILL_STYLE = {
  position: 'absolute',
  display: 'inline-flex', alignItems: 'center', gap: 7,
  padding: '10px 16px', borderRadius: 999,
  background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid rgba(255,255,255,0.3)', color: '#fff', textDecoration: 'none',
  fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', lineHeight: 1,
  minHeight: 44, boxSizing: 'border-box', // §2 touch-target-size: >=44px tap area
};

/**
 * The pill itself.
 * - `as="span"` (default) renders a decorative, non-focusable node meant to
 *   live inside a parent `.cover-link` anchor — its visibility is driven by
 *   that ancestor's :hover/:focus-visible via CSS, so it never becomes a
 *   second focus stop nested inside the first (no nested interactive
 *   elements).
 * - `as="a"` renders it as its own standalone link — used for cover videos,
 *   which are never wrapped, and is always visible since there's no
 *   whole-cover hover to reveal it in the first place.
 */
export const CoverActionCta = ({ as = 'span', label, isRTL, position = 'bottom-start', href, ariaLabel }) => {
  const style = { ...PILL_STYLE, ...POSITION_STYLE[position], flexDirection: isRTL ? 'row-reverse' : 'row' };
  const content = (
    <>
      <ExternalLink aria-hidden="true" style={{ width: 14, height: 14, flexShrink: 0 }} />
      <span>{label}</span>
    </>
  );

  if (as === 'a') {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel} className="cover-link-cta cover-link-cta--standalone" style={style}>
        {content}
      </a>
    );
  }
  return (
    <span aria-hidden className="cover-link-cta" style={style}>
      {content}
    </span>
  );
};

/**
 * Scrim fade-in + pill reveal on hover/focus, forced-visible on touch (no
 * `:hover` to rely on) and on narrow viewports, subtle image scale, and a
 * `prefers-reduced-motion` override. Scoped entirely by class name (no
 * CSS modules in this codebase) — safe to inject once per mounted cover.
 */
export const COVER_LINK_CSS = `
  .cover-link { position: relative; display: block; cursor: pointer; }
  .cover-link:focus-visible { outline: 3px solid rgb(var(--accent)); outline-offset: 3px; }
  .cover-link-scrim {
    position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(to top, rgba(13,17,23,0.5) 0%, rgba(13,17,23,0) 55%);
    opacity: 0; transition: opacity 0.25s ease;
  }
  .cover-link:hover .cover-link-scrim, .cover-link:focus-visible .cover-link-scrim { opacity: 1; }
  .cover-link .cover-link-cta { opacity: 0; transform: translateY(6px); transition: opacity 0.25s ease, transform 0.25s ease; }
  .cover-link:hover .cover-link-cta, .cover-link:focus-visible .cover-link-cta { opacity: 1; transform: translateY(0); }
  .cover-link-cta--standalone { opacity: 1; transform: none; }
  .cover-link-cta--standalone:focus-visible { outline: 3px solid rgb(var(--accent)); outline-offset: 3px; }
  .cover-link-img { transition: transform 0.35s ease; }
  .cover-link:hover .cover-link-img, .cover-link:focus-visible .cover-link-img { transform: scale(1.018); }
  @media (hover: none), (pointer: coarse), (max-width: 640px) {
    .cover-link .cover-link-cta { opacity: 1 !important; transform: none !important; }
    .cover-link .cover-link-scrim { opacity: 0.32 !important; }
  }
  @media (prefers-reduced-motion: reduce) {
    .cover-link-scrim, .cover-link-cta, .cover-link-img { transition: none !important; }
    .cover-link:hover .cover-link-img, .cover-link:focus-visible .cover-link-img { transform: none !important; }
  }
`;
