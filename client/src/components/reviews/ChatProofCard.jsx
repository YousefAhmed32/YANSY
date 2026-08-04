import { useState } from 'react';
import { ZoomIn, MessageCircle } from 'lucide-react';
import s from './ClientProof.module.css';

/**
 * WhatsApp screenshot thumbnail — masonry-ready with varying aspect ratios.
 *
 * Premium redesign:
 * - `variant` prop controls height ('tall' or 'short') for organic masonry feel
 * - Deeper shadows and blue-accent border glow on hover
 * - Frosted-glass zoom indicator
 * - Smooth scale transition on hover
 * - Click/Enter/Space opens the full screenshot in <ChatLightbox>
 */
const ChatProofCard = ({ src, index, label, tag, isRTL, onOpen, variant = 'tall' }) => {
  const [loaded, setLoaded] = useState(false);

  const frameClass = variant === 'short' ? s.cpFrameShort : s.cpFrameTall;

  return (
    <div className={s.cpCard}>
      <div
        className={frameClass}
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen();
          }
        }}
        aria-label={
          isRTL
            ? `فتح لقطة شاشة محادثة واتساب ${index + 1}`
            : `Open WhatsApp conversation screenshot ${index + 1}`
        }
      >
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className={loaded ? s.cpImgLoaded : s.cpImg}
          onLoad={() => setLoaded(true)}
        />
        <div className={s.cpZoom} aria-hidden>
          <div className={s.cpZoomIcon}>
            <ZoomIn style={{ width: 17, height: 17, color: 'rgb(var(--text-primary))' }} />
          </div>
        </div>
      </div>

      <div
        className={s.cpFooter}
        style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
      >
        <span className={s.cpLabel}>{label}</span>
        <span
          className={s.cpBadge}
          style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
        >
          <MessageCircle style={{ width: 9, height: 9 }} aria-hidden />
          {tag}
        </span>
      </div>
    </div>
  );
};

export default ChatProofCard;
