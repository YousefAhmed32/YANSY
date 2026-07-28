import { useState } from 'react';
import { ZoomIn, MessageCircle } from 'lucide-react';

/**
 * WhatsApp screenshot thumbnail — cropped to the conversation (the phone
 * status bar / nav bar in the source screenshot is cropped out via
 * object-position, not removed from the file), click or Enter/Space to open
 * the full screenshot in <ChatLightbox>.
 */
const ChatProofCard = ({ src, index, label, tag, isRTL, onOpen }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="cp-card">
      <style>{`
        .cp-card {
          background: #FFFFFF;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: box-shadow 0.28s cubic-bezier(0.16,1,0.3,1),
                      border-color 0.22s ease,
                      transform 0.28s cubic-bezier(0.16,1,0.3,1);
        }
        .cp-card:hover {
          box-shadow: 0 12px 36px rgba(0,0,0,0.08);
          border-color: var(--border-strong);
          transform: translateY(-2px);
        }
        .cp-frame {
          position: relative;
          aspect-ratio: 9 / 13;
          overflow: hidden;
          background: #0B141A;
          cursor: pointer;
        }
        .cp-frame img {
          width: 100%; height: 100%;
          object-fit: cover;
          object-position: top center;
          display: block;
          transition: transform 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.5s ease;
          opacity: 0;
        }
        .cp-frame img.loaded { opacity: 1; }
        .cp-frame:hover img { transform: scale(1.045); }
        .cp-zoom {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(13,17,23,0);
          transition: background 0.3s ease;
          pointer-events: none;
        }
        .cp-frame:hover .cp-zoom, .cp-frame:focus-visible .cp-zoom {
          background: rgba(13,17,23,0.28);
        }
        .cp-zoom-icon {
          width: 38px; height: 38px; border-radius: 50%;
          background: rgba(255,255,255,0.92);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transform: scale(0.85);
          transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        .cp-frame:hover .cp-zoom-icon, .cp-frame:focus-visible .cp-zoom-icon {
          opacity: 1; transform: scale(1);
        }
        @media (prefers-reduced-motion: reduce) {
          .cp-card, .cp-frame img, .cp-zoom, .cp-zoom-icon { transition: none; }
        }
      `}</style>

      <div
        className="cp-frame"
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
        aria-label={isRTL ? `فتح لقطة شاشة محادثة واتساب ${index + 1}` : `Open WhatsApp conversation screenshot ${index + 1}`}
      >
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className={loaded ? 'loaded' : ''}
          onLoad={() => setLoaded(true)}
        />
        <div className="cp-zoom" aria-hidden>
          <div className="cp-zoom-icon">
            <ZoomIn style={{ width: 17, height: 17, color: '#0D1117' }} />
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px', flexDirection: isRTL ? 'row-reverse' : 'row',
      }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 10, fontWeight: 600, color: '#0EA85F',
          background: '#ECFDF5', border: '1px solid #D1FAE5',
          padding: '2px 7px', borderRadius: 100,
          flexDirection: isRTL ? 'row-reverse' : 'row',
        }}>
          <MessageCircle style={{ width: 9, height: 9 }} aria-hidden />
          {tag}
        </span>
      </div>
    </div>
  );
};

export default ChatProofCard;
