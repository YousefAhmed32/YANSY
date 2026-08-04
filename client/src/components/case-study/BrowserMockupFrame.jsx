import { Lock } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   Elegant browser-chrome frame for wrapping a project visual when
   there's no real product screenshot to show — a glass panel with
   traffic-light dots and an address bar reads as an intentional
   "product showcase" instead of a flat image, per the brief's ask
   for device/browser mockups rather than raw screenshots.
   ═══════════════════════════════════════════════════════════════ */

const BrowserMockupFrame = ({ url, children, className = '', style }) => (
  <div className={`browser-mockup ${className}`} style={style}>
    <style>{`
      .browser-mockup {
        position: relative;
        border-radius: 20px;
        overflow: hidden;
        background: rgb(var(--bg-elevated));
        border: 1px solid rgb(var(--border));
        box-shadow: var(--shadow-hero);
      }
      .browser-mockup__chrome {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 16px;
        background: rgb(var(--bg-surface));
        border-bottom: 1px solid rgb(var(--border));
      }
      .browser-mockup__dots { display: flex; gap: 6px; flex-shrink: 0; }
      .browser-mockup__dots span { width: 9px; height: 9px; border-radius: 50%; display: block; }
      .browser-mockup__url {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 5px 14px;
        border-radius: 100px;
        background: rgb(var(--bg-elevated));
        border: 1px solid rgb(var(--border-light));
        font-size: 11.5px;
        color: rgb(var(--text-tertiary));
        font-family: var(--font-sans);
        max-width: 320px;
        margin: 0 auto;
      }
      .browser-mockup__url svg { width: 11px; height: 11px; flex-shrink: 0; opacity: 0.7; }
      .browser-mockup__body { position: relative; aspect-ratio: 16 / 9.5; overflow: hidden; }
    `}</style>

    <div className="browser-mockup__chrome" aria-hidden="true">
      <div className="browser-mockup__dots">
        <span style={{ background: '#FF5F57' }} />
        <span style={{ background: '#FEBC2E' }} />
        <span style={{ background: '#28C840' }} />
      </div>
      <div className="browser-mockup__url" dir="ltr">
        <Lock />
        <span>{url}</span>
      </div>
    </div>

    <div className="browser-mockup__body">{children}</div>
  </div>
);

export default BrowserMockupFrame;
