/**
 * Shared geometry for the bottom-corner floating layer (FloatingActionMenu and
 * the AI chat panel, which occupy the same corner and swap places).
 *
 * One edge constant drives both writing directions, so the RTL layout is a true
 * mirror of LTR — same gap, opposite side — rather than two independently tuned
 * offsets that quietly drift apart.
 */

/** Distance from the near viewport edge. Kept tight (12px) so the cluster hugs
 *  the edge, while still clearing the rounded corners of phone displays. */
export const FLOATING_EDGE_GAP = '12px';

/** Distance from the bottom edge, clearing the iOS home indicator. */
export const FLOATING_BOTTOM_GAP = 'max(1.5rem, calc(1rem + env(safe-area-inset-bottom)))';

/**
 * Physical cross-axis alignment for a bottom-corner column stack.
 *
 * Returned as a physical value on purpose: `flex-start`/`flex-end` are
 * writing-mode-relative, so under the page's ambient `dir="rtl"` they flip and
 * silently cancel out the `isRTL` branch. Callers pair this with
 * `direction: 'ltr'` (see `floatingCornerStyle`) to keep it physical.
 */
export const floatingAlign = (isRTL) => (isRTL ? 'flex-start' : 'flex-end');

/**
 * Base style for a bottom-corner floating stack. Spread this first, then add
 * per-widget concerns (`zIndex`, `gap`, …).
 *
 * The horizontal inset uses the safe-area inset on the *near* side only, so a
 * landscape notch never pushes the widget inward from the opposite edge.
 */
export const floatingCornerStyle = (isRTL) => ({
  position: 'fixed',
  bottom: FLOATING_BOTTOM_GAP,
  ...(isRTL
    ? { left: `max(${FLOATING_EDGE_GAP}, env(safe-area-inset-left))` }
    : { right: `max(${FLOATING_EDGE_GAP}, env(safe-area-inset-right))` }),
  display: 'flex',
  flexDirection: 'column',
  alignItems: floatingAlign(isRTL),
  // Pins the logical `flex-*` alignment above to physical left/right. Children
  // that need Arabic text order set their own `dir` attribute.
  direction: 'ltr',
});

/**
 * Width for a panel anchored in the floating corner: its natural size, capped
 * so it never outgrows the viewport.
 *
 * The cap subtracts the edge gap *twice* — once for the anchored side, once to
 * leave the same breathing room on the far side — so a panel that hits the cap
 * on a narrow phone still reads as centred rather than jammed against one edge.
 * Deriving it from `FLOATING_EDGE_GAP` keeps it in step if that gap ever moves.
 */
export const floatingPanelWidth = (naturalPx) =>
  `min(${naturalPx}px, calc(100vw - ${FLOATING_EDGE_GAP} * 2))`;
