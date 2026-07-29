import { useEffect, useRef } from 'react';

/**
 * Thin scroll-progress rail fixed under the header. Purely 1:1 with scroll
 * position (no eased/timed animation), so it stays honest under
 * prefers-reduced-motion without needing a media-query branch — there's no
 * animation to disable, just a transform driven directly by scrollY.
 */
const ScrollProgress = ({ isRTL }) => {
  const barRef = useRef(null);

  useEffect(() => {
    let raf = null;
    const update = () => {
      raf = null;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const ratio = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${ratio})`;
    };
    const onScroll = () => { if (raf === null) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed', top: 68, insetInlineStart: 0, insetInlineEnd: 0,
        height: 2, zIndex: 999, background: 'transparent', pointerEvents: 'none',
      }}
    >
      <div
        ref={barRef}
        style={{
          height: '100%', width: '100%',
          background: 'linear-gradient(90deg, var(--accent), #60A5FA)',
          boxShadow: '0 0 8px rgba(37,99,235,0.5)',
          transformOrigin: isRTL ? 'right' : 'left', transform: 'scaleX(0)',
        }}
      />
    </div>
  );
};

export default ScrollProgress;
