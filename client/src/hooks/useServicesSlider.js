
import { useEffect, useRef, useState } from 'react';

export const useServicesSlider = (sectionRef) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const slideContainerRef = useRef(null);
  const stateRef = useRef({
    current   : 0,
    isDragging: false,
    startX    : 0,
    dragDelta : 0,
    velX      : 0,
    lastX     : 0,
    lastT     : 0,
    locked    : false,
    paused    : false,
    timer     : null,
  });

  const TOTAL = 4;

  const goTo = (idx) => {
    const st   = stateRef.current;
    const next = Math.max(0, Math.min(TOTAL - 1, idx));
    st.current = next;
    setActiveSlide(next);
    if (slideContainerRef.current) {
      slideContainerRef.current.style.transition = 'transform 0.9s cubic-bezier(0.77,0,0.175,1)';
      slideContainerRef.current.style.transform  = `translateX(-${next * 25}%)`;
    }
  };

  const resetAutoPlay = () => {
    const st = stateRef.current;
    clearInterval(st.timer);
    st.timer = setInterval(() => {
      if (!st.paused) goTo(st.current >= TOTAL - 1 ? 0 : st.current + 1);
    }, 4500);
  };

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const st = stateRef.current;

    resetAutoPlay();

    /* ── Wheel ── */
    const onWheel = (e) => {
      const rect = section.getBoundingClientRect();
      if (rect.top > 2 || rect.bottom < window.innerHeight - 2) return;
      e.preventDefault();
      if (st.locked) return;
      st.locked = true;
      const d = e.deltaY || e.deltaX;
      if (Math.abs(d) > 15) { goTo(d > 0 ? st.current + 1 : st.current - 1); resetAutoPlay(); }
      setTimeout(() => { st.locked = false; }, 950);
    };

    /* ── Mouse Drag ── */
    const onMouseDown = (e) => {
      if (e.target.closest('button')) return;
      st.isDragging = true;
      st.startX = st.lastX = e.clientX;
      st.lastT  = Date.now();
      st.velX   = st.dragDelta = 0;
      st.paused = true;
      section.style.cursor = 'grabbing';
    };
    const onMouseMove = (e) => {
      if (!st.isDragging) return;
      const now = Date.now();
      st.velX      = (e.clientX - st.lastX) / Math.max(now - st.lastT, 1);
      st.lastX     = e.clientX;
      st.lastT     = now;
      st.dragDelta = e.clientX - st.startX;
      if (slideContainerRef.current) {
        const base  = -(st.current * 25);
        const nudge = st.dragDelta * 0.055;
        slideContainerRef.current.style.transition = 'none';
        slideContainerRef.current.style.transform  = `translateX(calc(${base}% + ${nudge}px))`;
      }
    };
    const onMouseUp = () => {
      if (!st.isDragging) return;
      st.isDragging = false;
      st.paused     = false;
      section.style.cursor = 'grab';
      const total = st.dragDelta + st.velX * 100;
      if      (total < -55 && st.current < TOTAL - 1) goTo(st.current + 1);
      else if (total >  55 && st.current > 0)          goTo(st.current - 1);
      else                                              goTo(st.current);
      resetAutoPlay();
    };

    /* ── Touch ── */
    let touchX = 0;
    const onTouchStart = (e) => { touchX = e.touches[0].clientX; st.paused = true; };
    const onTouchEnd   = (e) => {
      st.paused = false;
      const dx  = touchX - e.changedTouches[0].clientX;
      if (Math.abs(dx) > 44) goTo(dx > 0 ? st.current + 1 : st.current - 1);
      else goTo(st.current);
      resetAutoPlay();
    };

    section.style.cursor = 'grab';
    section.addEventListener('wheel',      onWheel,      { passive: false });
    section.addEventListener('mousedown',  onMouseDown);
    section.addEventListener('touchstart', onTouchStart, { passive: true });
    section.addEventListener('touchend',   onTouchEnd);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);

    return () => {
      clearInterval(st.timer);
      section.removeEventListener('wheel',      onWheel);
      section.removeEventListener('mousedown',  onMouseDown);
      section.removeEventListener('touchstart', onTouchStart);
      section.removeEventListener('touchend',   onTouchEnd);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    };
  }, []);

  return { activeSlide, setActiveSlide: goTo, slideContainerRef };
};