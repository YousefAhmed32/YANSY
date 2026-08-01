import { useLanguage } from '../contexts/LanguageContext';
import { useReveal, revealStyle } from '../hooks/useReveal';

/**
 * Shared "future artwork" placeholder used across homepage sections until real
 * isometric/device-mockup art replaces it. One component so every placeholder
 * shares the same visual language (rounded, dashed, soft bg) and so swapping
 * in real images later means deleting this import in one place per section,
 * not hunting down N hand-rolled dashed boxes.
 *
 * Reveal uses the page's own `useReveal` (IntersectionObserver-based) rather
 * than GSAP ScrollTrigger. ScrollTrigger caches each trigger's page position at
 * creation time; several of these placeholders mount inside homepage sections
 * that are behind `React.lazy`/Suspense (see Home.jsx), so by the time their
 * chunk resolves other lazy siblings have already changed the page's total
 * height, and the cached trigger position goes stale — verified in testing:
 * the placeholder inside TechSection never left `opacity: 0`. `useReveal`
 * re-checks intersection continuously, so it can't go stale the same way.
 */
const ImagePlaceholder = ({ prompt, minHeight = 320, className = '', style }) => {
  const { isRTL } = useLanguage();
  const { ref, revealed } = useReveal();

  return (
    <div
      ref={ref}
      className={`img-placeholder ${className}`}
      style={{ minHeight, ...revealStyle(revealed, 0, { distance: 14, duration: 0.65 }), ...style }}
    >
      <style>{`
        .img-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          width: 100%;
          padding: clamp(1.5rem, 4vw, 2.5rem);
          border-radius: var(--radius-2xl);
          border: 1.5px dashed rgb(var(--border-strong));
          background: rgb(var(--bg-elevated));
          text-align: center;
        }
        .img-placeholder__badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 14px;
          border-radius: 100px;
          border: 1px solid rgb(var(--border));
          background: rgb(var(--bg-surface));
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgb(var(--text-tertiary));
        }
        [dir="rtl"] .img-placeholder__badge { letter-spacing: 0; text-transform: none; }
        .img-placeholder__badge::before {
          content: '';
          width: 6px; height: 6px; border-radius: 2px;
          background: rgb(var(--accent) / 0.5);
          flex-shrink: 0;
        }
        .img-placeholder__prompt {
          max-width: 440px;
          margin: 0;
          font-size: 12.5px;
          line-height: 1.7;
          color: rgb(var(--text-tertiary));
        }
        [dir="rtl"] .img-placeholder__prompt { font-family: var(--font-arabic); line-height: 1.85; }
        .img-placeholder__prompt-label {
          display: block;
          margin-bottom: 4px;
          font-weight: 700;
          color: rgb(var(--text-secondary));
        }
      `}</style>
      <span className="img-placeholder__badge">
        {isRTL ? 'صورة توضيحية قادمة' : 'IMAGE PLACEHOLDER'}
      </span>
      <p className="img-placeholder__prompt">
        <span className="img-placeholder__prompt-label">
          {isRTL ? 'وصف توليد الصورة:' : 'Prompt:'}
        </span>
        {prompt}
      </p>
    </div>
  );
};

export default ImagePlaceholder;
