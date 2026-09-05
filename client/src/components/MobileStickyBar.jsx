import { useState, useEffect } from 'react';
import { Sparkles, MessageCircle } from 'lucide-react';
import { trackCTAClick, trackWhatsAppClick } from '../utils/ga4';

const WA_URL = 'https://wa.me/201090385390';

const MobileStickyBar = ({ onStartProject, isRTL, hidden = false }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // Show after scrolling past the hero action zone (~320px)
      setVisible(window.scrollY > 320);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (hidden || !visible) return null;

  const waText = isRTL
    ? 'مرحباً YANSY 👋 حابب أستفسر عن بدء مشروع جديد'
    : "Hi YANSY 👋 I'd like to ask about starting a new project.";

  return (
    <>
      <style>{`
        .ys-mobile-bar {
          display: none;
        }
        @media (max-width: 768px) {
          .ys-mobile-bar {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 850;
            align-items: center;
            gap: 10px;
            padding: 10px 14px max(10px, env(safe-area-inset-bottom));
            background: rgba(255, 255, 255, 0.92);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-top: 1px solid rgba(226, 232, 240, 0.8);
            box-shadow: 0 -4px 20px rgba(13, 17, 23, 0.08);
            animation: ys-slide-up 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
          }
          @keyframes ys-slide-up {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        }
      `}</style>
      <aside
        className="ys-mobile-bar"
        dir={isRTL ? 'rtl' : 'ltr'}
        aria-label={isRTL ? 'إجراءات سريعة للتواصل' : 'Quick Actions'}
      >
        {/* Direct WhatsApp button */}
        <a
          href={`${WA_URL}?text=${encodeURIComponent(waText)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackWhatsAppClick('mobile-sticky-bar')}
          style={{
            flex: '1',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            height: 44,
            padding: '0 12px',
            borderRadius: 12,
            background: '#25D366',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 2px 10px rgba(37,211,102,0.25)',
            fontFamily: isRTL ? "'IBM Plex Sans Arabic',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
            whiteSpace: 'nowrap',
          }}
        >
          <MessageCircle style={{ width: 17, height: 17 }} aria-hidden />
          <span>{isRTL ? 'واتساب فوري' : 'WhatsApp'}</span>
        </a>

        {/* Start project brief modal trigger */}
        <button
          type="button"
          onClick={() => {
            trackCTAClick('mobile-sticky-start-project');
            onStartProject?.();
          }}
          style={{
            flex: '1.2',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            height: 44,
            padding: '0 14px',
            borderRadius: 12,
            background: 'rgb(var(--accent))',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(37,99,235,0.28)',
            fontFamily: isRTL ? "'IBM Plex Sans Arabic',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
            whiteSpace: 'nowrap',
          }}
        >
          <Sparkles style={{ width: 15, height: 15 }} aria-hidden />
          <span>{isRTL ? 'طلب تسعير ومواصفات' : 'Start Project'}</span>
        </button>
      </aside>
    </>
  );
};

export default MobileStickyBar;
