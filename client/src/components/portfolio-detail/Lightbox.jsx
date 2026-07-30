import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { mediaSrc } from '../../utils/media';

/**
 * Full-screen image viewer. Focus-trap / restore-focus / scroll-lock pattern
 * matches the site's other lightboxes (portfolio gallery, chat screenshots).
 */
const Lightbox = ({ images, active, onClose, onPrev, onNext, isRTL, title }) => {
  const closeBtnRef = useRef(null);
  const triggerElRef = useRef(null);

  useEffect(() => {
    triggerElRef.current = document.activeElement;
    // Deferred one frame on purpose: opening this via a keyboard Enter/Space
    // on the trigger element means the browser still has a pending keyup for
    // that same physical keypress. Focusing the close <button> synchronously
    // puts it under document.activeElement before that keyup lands — Enter's
    // native button-activation behavior then fires on the close button and
    // the lightbox closes itself in the same gesture that opened it. One
    // rAF is enough for the keyup to resolve against the old (non-activating)
    // trigger element first.
    const raf = requestAnimationFrame(() => closeBtnRef.current?.focus());
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      triggerElRef.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft')  isRTL ? onNext() : onPrev();
      if (e.key === 'ArrowRight') isRTL ? onPrev() : onNext();
      if (e.key === 'Tab') {
        const nodes = Array.from(document.querySelectorAll('[data-portfolio-lightbox] button'));
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext, isRTL]);

  useEffect(() => {
    [active - 1, active + 1].forEach((i) => {
      const asset = images[(i + images.length) % images.length];
      const src = mediaSrc(asset);
      if (src) { const img = new Image(); img.src = src; }
    });
  }, [active, images]);

  return (
    <div
      data-portfolio-lightbox
      className="fixed inset-0 z-[200] flex items-center justify-center bg-surface-white/95"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isRTL ? 'معرض الصور بملء الشاشة' : 'Image lightbox'}
    >
      <button
        ref={closeBtnRef}
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center border border-border bg-surface-white text-content-secondary hover:text-content-primary hover:border-border-strong transition-all z-10 rounded-full"
        aria-label={isRTL ? 'إغلاق' : 'Close'}
      >
        <X className="w-4 h-4" />
      </button>

      <span dir="ltr" className="absolute top-5 left-5 text-[10px] tracking-widest uppercase text-content-secondary z-10">
        {active + 1} / {images.length}
      </span>

      <img
        src={mediaSrc(images[active])}
        alt={title ? `${title} — ${active + 1}/${images.length}` : ''}
        className="max-w-[92vw] max-h-[88vh] object-contain rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <>
          {/* Physically-left control: in LTR this steps backward (prev); in RTL,
              reading moves right-to-left, so the same physical position steps
              forward (next) — matching the ArrowLeft/ArrowRight keyboard
              handler above, which already makes this swap. */}
          <button
            onClick={(e) => { e.stopPropagation(); isRTL ? onNext() : onPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center border border-border bg-surface-white text-content-secondary hover:text-content-primary hover:border-border-strong transition-all rounded-full"
            aria-label={isRTL ? 'الصورة التالية' : 'Previous image'}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); isRTL ? onPrev() : onNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center border border-border bg-surface-white text-content-secondary hover:text-content-primary hover:border-border-strong transition-all rounded-full"
            aria-label={isRTL ? 'الصورة السابقة' : 'Next image'}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
};

export default Lightbox;
