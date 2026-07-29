import ProgressiveImage from '../ProgressiveImage';
import { mediaSrc } from '../../utils/media';

const FONT_EN = "'Inter',system-ui,sans-serif";
const FONT_AR = "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif";

/**
 * Renders the flexible `blocks[]` content stream (see the doc comment on
 * `blockSchema` in server/models/PortfolioProject.js for the full block
 * vocabulary and why it exists instead of more rigid top-level fields).
 *
 * This is the ONE place block → markup logic lives — both the public
 * PortfolioDetail page and the admin wizard's live-preview pane import it,
 * so "what a block looks like" can never drift between editing and
 * publishing.
 */

const YOUTUBE_RE = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/;
const VIMEO_RE = /vimeo\.com\/(\d+)/;
const LOOM_RE = /loom\.com\/share\/([\w-]+)/;

const toEmbedUrl = (url) => {
  if (!url) return null;
  const yt = url.match(YOUTUBE_RE);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(VIMEO_RE);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  const loom = url.match(LOOM_RE);
  if (loom) return `https://www.loom.com/embed/${loom[1]}`;
  return url; // already a direct embed/iframe URL (e.g. Figma "embed" link)
};

const FRAME_STYLE = {
  none:    {},
  browser: { padding: '28px 12px 12px', background: '#F6F7F9', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' },
  mobile:  { padding: '32px 10px', background: '#0D1117', borderRadius: 32, maxWidth: 340, margin: '0 auto' },
  tablet:  { padding: '20px 16px', background: '#0D1117', borderRadius: 24, maxWidth: 620, margin: '0 auto' },
};

const FrameChrome = ({ frame }) => {
  if (frame === 'browser') {
    return (
      <div aria-hidden style={{ position: 'absolute', top: 10, insetInlineStart: 14, display: 'flex', gap: 6 }}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <span key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c, opacity: 0.85 }} />)}
      </div>
    );
  }
  if (frame === 'mobile') {
    return <div aria-hidden style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 56, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.25)' }} />;
  }
  return null;
};

const Caption = ({ text, textAr, isRTL, font }) => {
  const value = isRTL ? (textAr || text) : (text || textAr);
  if (!value) return null;
  return (
    <p style={{ fontFamily: font, fontSize: 12.5, color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 12 }}>{value}</p>
  );
};

const FramedMedia = ({ asset, frame, isRTL }) => (
  <div style={{ position: 'relative', ...FRAME_STYLE[frame || 'none'] }}>
    <FrameChrome frame={frame} />
    <div style={{ borderRadius: frame === 'none' ? 'var(--radius-lg)' : 12, overflow: 'hidden', border: frame === 'none' ? '1px solid var(--border)' : 'none' }}>
      <ProgressiveImage asset={asset} alt={isRTL ? asset?.altAr : asset?.alt} className="w-full" isRTL={isRTL} />
    </div>
  </div>
);

const BlockRenderer = ({ blocks, isRTL }) => {
  const font = isRTL ? FONT_AR : FONT_EN;
  if (!blocks?.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(2.5rem, 5vw, 4rem)' }}>
      {blocks.map((block, i) => {
        const key = block._id || i;
        switch (block.type) {
          case 'heading': {
            const Tag = block.level === 3 ? 'h3' : 'h2';
            const text = isRTL ? (block.textAr || block.text) : (block.text || block.textAr);
            if (!text) return null;
            return (
              <Tag key={key} style={{
                fontFamily: font, fontWeight: block.level === 3 ? 700 : 800,
                fontSize: block.level === 3 ? 'clamp(1.25rem,2.2vw,1.625rem)' : 'clamp(1.625rem,3vw,2.25rem)',
                color: 'var(--text-primary)', letterSpacing: isRTL ? 0 : '-0.02em', lineHeight: 1.2, margin: 0,
                textAlign: isRTL ? 'right' : 'left',
              }}>
                {text}
              </Tag>
            );
          }

          case 'paragraph': {
            const text = isRTL ? (block.textAr || block.text) : (block.text || block.textAr);
            if (!text) return null;
            return (
              <p key={key} style={{
                fontFamily: font, fontSize: 'clamp(1rem,1.4vw,1.125rem)', fontWeight: 400,
                color: 'var(--text-secondary)', lineHeight: 1.85, whiteSpace: 'pre-line',
                textAlign: isRTL ? 'right' : 'left', maxWidth: '72ch',
              }}>
                {text}
              </p>
            );
          }

          case 'image': {
            if (!block.asset?.url) return null;
            return (
              <figure key={key} style={{ margin: 0 }}>
                <FramedMedia asset={block.asset} frame={block.frame} isRTL={isRTL} />
                <Caption text={block.caption} textAr={block.captionAr} isRTL={isRTL} font={font} />
              </figure>
            );
          }

          case 'gallery': {
            if (!block.images?.length) return null;
            return (
              <figure key={key} style={{ margin: 0 }}>
                <div
                  className={block.layout === 'carousel' ? 'scrollbar-hide' : undefined}
                  style={block.layout === 'carousel'
                    ? { display: 'flex', gap: 12, overflowX: 'auto' }
                    : { display: 'grid', gridTemplateColumns: `repeat(${Math.min(block.images.length, 3)}, 1fr)`, gap: 12 }}
                >
                  {block.images.map((img, i) => (
                    <div key={i} style={{ flexShrink: 0, width: block.layout === 'carousel' ? 280 : undefined, aspectRatio: '4/3', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <ProgressiveImage asset={img} alt="" className="w-full h-full" fill isRTL={isRTL} />
                    </div>
                  ))}
                </div>
                <Caption text={block.caption} textAr={block.captionAr} isRTL={isRTL} font={font} />
              </figure>
            );
          }

          case 'quote': {
            const text = isRTL ? (block.textAr || block.text) : (block.text || block.textAr);
            if (!text) return null;
            return (
              <blockquote key={key} style={{
                margin: 0, borderInlineStart: '2px solid var(--accent-muted)', paddingInlineStart: 'clamp(1.25rem,3vw,2rem)',
                textAlign: isRTL ? 'right' : 'left',
              }}>
                <p style={{ fontFamily: font, fontSize: 'clamp(1.125rem,2vw,1.375rem)', fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
                  {text}
                </p>
                {(block.author || block.role) && (
                  <footer style={{ marginTop: 12, fontFamily: font, fontSize: 13 }}>
                    {block.author && <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{block.author}</strong>}
                    {block.role && <span style={{ color: 'var(--text-tertiary)', marginInlineStart: 8 }}>— {block.role}</span>}
                  </footer>
                )}
              </blockquote>
            );
          }

          case 'statRow': {
            if (!block.stats?.length) return null;
            return (
              <div key={key} style={{
                display: 'grid', gridTemplateColumns: `repeat(${Math.min(block.stats.length, 4)}, 1fr)`, gap: 1,
                background: 'var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)',
              }}>
                {block.stats.map((s, i) => (
                  <div key={i} style={{ background: 'var(--bg-surface)', padding: '20px 16px', textAlign: 'center' }}>
                    <div dir="ltr" style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(1.25rem,2.5vw,1.75rem)', fontWeight: 800, color: 'var(--accent)' }}>{s.value}</div>
                    <div style={{ fontFamily: font, fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, textTransform: isRTL ? 'none' : 'uppercase', letterSpacing: isRTL ? 0 : '0.06em' }}>
                      {isRTL && s.labelAr ? s.labelAr : s.label}
                    </div>
                  </div>
                ))}
              </div>
            );
          }

          case 'beforeAfter': {
            if (!block.before?.url || !block.after?.url) return null;
            return (
              <figure key={key} style={{ margin: 0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[{ asset: block.before, label: block.beforeLabel || (isRTL ? 'قبل' : 'Before') }, { asset: block.after, label: block.afterLabel || (isRTL ? 'بعد' : 'After') }].map((side, i) => (
                    <div key={i}>
                      <div style={{ aspectRatio: '4/3', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', position: 'relative' }}>
                        <ProgressiveImage asset={side.asset} alt="" fill isRTL={isRTL} />
                      </div>
                      <p style={{ fontFamily: font, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 8 }}>{side.label}</p>
                    </div>
                  ))}
                </div>
                <Caption text={block.caption} textAr={block.captionAr} isRTL={isRTL} font={font} />
              </figure>
            );
          }

          case 'video': {
            const embedUrl = block.embedUrl ? toEmbedUrl(block.embedUrl) : null;
            if (!block.asset?.url && !embedUrl) return null;
            return (
              <figure key={key} style={{ margin: 0 }}>
                <div style={{ aspectRatio: '16/9', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', background: '#000' }}>
                  {embedUrl
                    ? <iframe src={embedUrl} title={block.caption || 'Project video'} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen style={{ width: '100%', height: '100%', border: 'none' }} />
                    : <video src={mediaSrc(block.asset)} poster={mediaSrc(block.poster)} controls playsInline style={{ width: '100%', height: '100%' }} />}
                </div>
                <Caption text={block.caption} textAr={block.captionAr} isRTL={isRTL} font={font} />
              </figure>
            );
          }

          case 'embed': {
            if (!block.url) return null;
            return (
              <figure key={key} style={{ margin: 0 }}>
                <div style={{ aspectRatio: '16/10', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <iframe src={block.url} title={block.title || 'Embedded content'} loading="lazy" style={{ width: '100%', height: '100%', border: 'none' }} />
                </div>
                <Caption text={block.caption} textAr={block.captionAr} isRTL={isRTL} font={font} />
              </figure>
            );
          }

          case 'divider':
            return <hr key={key} aria-hidden style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />;

          default:
            return null;
        }
      })}
    </div>
  );
};

export default BlockRenderer;
