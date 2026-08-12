import { revealStyle } from '../../hooks/useReveal';

/**
 * Spreadable props combining the app's existing scroll-reveal inline-style
 * mechanism (`hooks/useReveal.js` — an idle/armed/shown state machine that
 * degrades safely if JS fails) with a stable `pt-reveal` marker class, which
 * `proposalTemplate.css`'s `@media print` block force-clears to fully
 * visible. That matters specifically for the PDF export path: puppeteer
 * renders the full page height without ever scrolling it, so anything still
 * waiting on an IntersectionObserver to fire would otherwise stay invisible
 * in the exported PDF forever.
 *
 * Always spread this LAST (or pass any extra style via `extraStyle` — never
 * add a sibling `style` prop on the same element) since a later `style` prop
 * in JSX replaces this one outright rather than merging with it.
 */
export const reveal = (revealed, extraClass = '', extraStyle = {}) => ({
  className: ['pt-reveal', extraClass].filter(Boolean).join(' '),
  style: { ...revealStyle(revealed), ...extraStyle },
});
