/**
 * PageTransition — Framer Motion route-level transition wrapper
 *
 * Opacity-only transition. Y-axis animation and will-change:transform are
 * intentionally omitted: any CSS transform (including translateY) or
 * will-change:transform on a wrapper creates a new containing block for
 * position:fixed descendants (CSS Positioned Layout spec). The Header lives
 * inside this wrapper and relies on position:fixed being viewport-relative.
 *
 * Exit:  opacity 0 in 0.18s
 * Enter: opacity 1 in 0.28s with easeOut
 */
import { motion, useReducedMotion } from 'framer-motion';

/* Premium easing curve (matches Apple's standard motion) */
const EASE = [0.25, 0.1, 0.25, 1.0];

const PageTransition = ({ children }) => {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    // Respect the user's motion preference — no animation at all
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        opacity: { duration: 0.28, ease: EASE },
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
