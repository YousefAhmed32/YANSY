import { useState } from 'react';
import { mediaSrc } from '../../utils/media';

/**
 * Renders an imported proposal's HTML document in an isolated, sandboxed
 * iframe — used identically by the public `/p/:slug` page and the admin
 * import flow's preview.
 *
 * `sandbox="allow-scripts"` deliberately omits `allow-same-origin`,
 * `allow-top-navigation`, `allow-popups`, and `allow-forms`. This is the
 * standard "host untrusted content safely" recipe (the same one CodePen /
 * JSFiddle / Notion embeds rely on): without `allow-same-origin`, the
 * iframe gets a fresh *opaque* origin on every load, so any script inside
 * it — even though it's allowed to run, so presentation animations still
 * work — has no origin to share cookies/localStorage with, cannot read or
 * call into `window.parent`/`window.top`/`window.opener` in any way that
 * matters, and cannot navigate the top-level page. Pairs with the
 * server-side sanitization pass in server/media/htmlSanitizer.js.
 */
const ImportedHTMLViewer = ({ htmlAssetUrl, title = 'Proposal', height = '100dvh', onLoad, className, style }) => {
  const [loaded, setLoaded] = useState(false);
  const src = mediaSrc({ url: htmlAssetUrl });
  if (!src) return null;

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height, background: '#fff', ...style }}>
      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', zIndex: 1 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #E7EAF0', borderTopColor: '#2563EB', animation: 'ihv-spin .75s linear infinite' }} />
          <style>{'@keyframes ihv-spin { to { transform: rotate(360deg) } }'}</style>
        </div>
      )}
      <iframe
        src={src}
        title={title}
        sandbox="allow-scripts"
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => { setLoaded(true); onLoad?.(); }}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      />
    </div>
  );
};

export default ImportedHTMLViewer;
