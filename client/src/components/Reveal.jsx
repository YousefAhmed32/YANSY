import { Children, cloneElement, isValidElement } from 'react';
import { useReveal, revealStyle } from '../hooks/useReveal';

/**
 * Scroll-reveal wrapper for homepage sections.
 *
 * Two modes:
 *
 *   <Reveal>…</Reveal>            reveals its children as one block
 *   <Reveal stagger>…</Reveal>    reveals each direct child in sequence
 *
 * In `stagger` mode each child is wrapped in its own element that carries the
 * transition, so the child keeps full control of its own hover/focus motion —
 * see the note on `revealStyle` for why sharing a node breaks hover timing.
 *
 * Fail-safe by construction: children render visible and are only hidden once
 * JS has mounted and confirmed it will animate them. See `useReveal`.
 */
const Reveal = ({
  children,
  stagger = false,
  className,
  style,
  distance = 20,
  duration = 0.6,
  step = 0.07,
  threshold,          // left undefined so useReveal's safer default applies
  itemClassName,
  ...rest
}) => {
  const { ref, revealed } = useReveal(threshold === undefined ? undefined : { threshold });
  const opts = { distance, duration, step };

  if (!stagger) {
    return (
      <div ref={ref} className={className} style={{ ...revealStyle(revealed, 0, opts), ...style }} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={className} style={style} {...rest}>
      {Children.toArray(children).map((child, i) =>
        isValidElement(child) ? (
          <div key={child.key ?? i} className={itemClassName} style={revealStyle(revealed, i, opts)}>
            {child}
          </div>
        ) : (
          child
        )
      )}
    </div>
  );
};

/**
 * Grid-safe variant. Wrapping each child would make the *wrapper* the grid item
 * and collapse the child's sizing, and `display: contents` drops the wrapper
 * from the transition as well as from layout. So this applies the stagger to
 * the children themselves via `cloneElement`.
 *
 * Because the reveal wins over the child's own `opacity`/`transform`/
 * `transition`, use this only for grid items that don't animate those
 * properties themselves — anything with a hover lift needs `<Reveal stagger>`
 * or its own wrapper instead.
 */
export const RevealItems = ({ children, className, style, distance = 20, duration = 0.6, step = 0.07, threshold, ...rest }) => {
  const { ref, revealed } = useReveal(threshold === undefined ? undefined : { threshold });
  return (
    <div ref={ref} className={className} style={style} {...rest}>
      {Children.toArray(children).map((child, i) =>
        isValidElement(child)
          ? cloneElement(child, {
              style: { ...(child.props.style || {}), ...revealStyle(revealed, i, { distance, duration, step }) },
            })
          : child
      )}
    </div>
  );
};

export default Reveal;
