import { trackWhatsAppClick } from '../utils/ga4';
import { trackContact } from '../utils/metaPixel';
import { floatingCornerStyle } from '../constants/floatingUi';
import WhatsAppGlyph from './WhatsAppGlyph';

const WA_URL = 'https://wa.me/201090385390';

const CSS = `
  .fab-main {
    width: 56px; height: 56px; border-radius: 50%;
    background: rgb(var(--whatsapp)); border: 1px solid rgb(var(--whatsapp));
    color: rgb(var(--on-whatsapp)); display: flex; align-items: center; justify-content: center;
    padding: 0; text-decoration: none; flex-shrink: 0; position: relative;
    box-shadow: 0 4px 16px rgba(13,17,23,0.1);
    transition: transform .3s cubic-bezier(.34,1.56,.64,1), background .2s ease;
  }
  .fab-main:hover { transform: translateY(-2px); background: rgb(var(--whatsapp-hover)); }
  .fab-main:focus-visible { outline: 2px solid rgb(var(--accent)); outline-offset: 2px; }
  .fab-status {
    position: absolute; top: 2px; right: 2px; width: 12px; height: 12px;
    border-radius: 50%; background: #10B981; border: 2px solid #FFFFFF;
    box-shadow: 0 0 0 2px rgba(16,185,129,0.4);
  }
  @media (prefers-reduced-motion: reduce) { .fab-main { transition: none; } }
  @media (max-width: 768px) {
    .fab-container--desktop-only { display: none !important; }
    .fab-container { bottom: calc(68px + env(safe-area-inset-bottom, 0px)) !important; }
  }
  @media (max-width: 640px) { .fab-main { width: 52px; height: 52px; } }
`;

// One direct WhatsApp link, shared by the homepage and portfolio.
const FloatingActionMenu = ({ isRTL, hidden = false, desktopOnly = false }) => {
  if (hidden) return null;

  return (
    <>
      <style>{CSS}</style>
      <div
        className={`fab-container${desktopOnly ? ' fab-container--desktop-only' : ''}`}
        style={{ ...floatingCornerStyle(isRTL), zIndex: 998 }}
      >
        <a
          href={WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="fab-main"
          onClick={() => {
            trackWhatsAppClick('floating_main_wa');
            trackContact({ content_name: 'floating_main_wa' });
          }}
          aria-label={isRTL ? 'تواصل معنا على الواتساب' : 'Chat on WhatsApp'}
        >
          <span className="fab-status" aria-hidden="true" />
          <WhatsAppGlyph size={16} />
        </a>
      </div>
    </>
  );
};

export default FloatingActionMenu;
