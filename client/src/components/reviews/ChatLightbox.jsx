import { useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import s from './ClientVoices.module.css';

/**
 * Full-screen viewer for WhatsApp screenshots.
 *
 * Premium redesign:
 * - Frosted-glass backdrop (backdrop-filter: blur)
 * - Smooth scale-in animation on image
 * - Circular nav/close buttons with premium hover effects
 * - Focus trap + body scroll lock + restore focus on close
 * - Keyboard nav: Escape closes, Arrow keys navigate, Tab is trapped
 * - Adjacent image preloading for instant transitions
 */
const ChatLightbox = ({ images, active, onClose, onPrev, onNext, isRTL }) => {
  const closeBtnRef = useRef(null);
  const triggerElRef = useRef(null);

  // Focus management + body scroll lock
  useEffect(() => {
    triggerElRef.current = document.activeElement;
    // Deferred one frame to prevent the opening keyup from immediately firing
    // on the newly focused close button.
    const raf = requestAnimationFrame(() => closeBtnRef.current?.focus());
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      triggerElRef.current?.focus?.();
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') isRTL ? onNext() : onPrev();
      if (e.key === 'ArrowRight') isRTL ? onPrev() : onNext();
      if (e.key === 'Tab') {
        const nodes = Array.from(document.querySelectorAll('[data-chat-lightbox] button'));
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext, isRTL]);

  // Preload adjacent images for instant navigation
  useEffect(() => {
    [active - 1, active + 1].forEach((i) => {
      const src = images[(i + images.length) % images.length];
      if (src) {
        const img = new Image();
        img.src = src;
      }
    });
  }, [active, images]);

  return (
    <div
      data-chat-lightbox
      className={s.lightboxOverlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isRTL ? 'معاينة محادثة واتساب بملء الشاشة' : 'WhatsApp conversation preview'}
    >
      {/* Close button */}
      <button
        ref={closeBtnRef}
        onClick={onClose}
        className={s.lbClose}
        aria-label={isRTL ? 'إغلاق' : 'Close'}
      >
        <X style={{ width: 16, height: 16 }} />
      </button>

      {/* Counter */}
      <span dir="ltr" className={s.lbCounter}>
        {active + 1} / {images.length}
      </span>

      {/* Main image */}
      <img
        key={active}
        src={images[active]}
        alt={
          isRTL
            ? `لقطة شاشة لمحادثة واتساب ${active + 1} من ${images.length}`
            : `WhatsApp conversation screenshot ${active + 1} of ${images.length}`
        }
        className={s.lbImage}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Navigation */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              isRTL ? onNext() : onPrev();
            }}
            className={s.lbNavLeft}
            aria-label={isRTL ? 'المحادثة التالية' : 'Previous conversation'}
          >
            <ChevronLeft style={{ width: 20, height: 20 }} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              isRTL ? onPrev() : onNext();
            }}
            className={s.lbNavRight}
            aria-label={isRTL ? 'المحادثة السابقة' : 'Next conversation'}
          >
            <ChevronRight style={{ width: 20, height: 20 }} />
          </button>
        </>
      )}
    </div>
  );
};

export default ChatLightbox;
