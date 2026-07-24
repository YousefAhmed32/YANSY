import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   Generated on-brand placeholder — the last-resort visual for any
   card/hero that has no real image. Shared by CaseStudyVisual (curated
   case-study content) and the Portfolio image pipeline (user-uploaded
   projects), so both surfaces render the same premium fallback instead
   of an empty box when an asset is missing or still uploading.
   ═══════════════════════════════════════════════════════════════ */

const VARIANT = {
  hero:  { iconBox: 88, iconSize: 38, watermark: 'clamp(2.75rem, 7.5vw, 6rem)', showParticles: true,  gridSize: 56, brand: 30 },
  card:  { iconBox: 52, iconSize: 22, watermark: 'clamp(1.5rem, 5.5vw, 2.75rem)', showParticles: true,  gridSize: 40, brand: 20 },
  thumb: { iconBox: 30, iconSize: 14, watermark: null,                       showParticles: false, gridSize: 28, brand: 0  },
};

// Mix a hex color toward black by `amount` (0-1) — cheap, dependency-free.
const darken = (hex, amount) => {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.round(((n >> 16) & 255) * (1 - amount));
  const g = Math.round(((n >> 8) & 255) * (1 - amount));
  const b = Math.round((n & 255) * (1 - amount));
  return `rgb(${r},${g},${b})`;
};

const GeneratedPlaceholder = ({ icon: Icon = Sparkles, label = '', color = '#2563EB', isRTL = false, variant = 'card' }) => {
  const v = VARIANT[variant] || VARIANT.card;
  const particles = useMemo(() => (
    Array.from({ length: 4 }, (_, i) => ({
      top: `${15 + (i * 23) % 70}%`,
      left: `${10 + (i * 37) % 80}%`,
      size: 60 + (i % 3) * 40,
    }))
  ), []);

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute', inset: 0, overflow: 'hidden',
        background: `linear-gradient(135deg, ${color}2E 0%, ${darken(color, 0.88)} 45%, #05070C 100%)`,
      }}
    >
      {/* Radial accent glow */}
      <div style={{
        position: 'absolute', top: '-25%', [isRTL ? 'left' : 'right']: '-20%',
        width: '55%', height: '55%', borderRadius: '50%',
        background: `radial-gradient(circle, ${color}22 0%, transparent 72%)`,
        filter: 'blur(50px)',
      }} />

      {/* Soft grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.12,
        backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)`,
        backgroundSize: `${v.gridSize}px ${v.gridSize}px`,
      }} />

      {/* Subtle particles */}
      {v.showParticles && particles.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', top: p.top, left: p.left,
          width: p.size, height: p.size, borderRadius: '50%',
          background: `radial-gradient(circle, ${color}35 0%, transparent 75%)`,
          filter: 'blur(18px)', pointerEvents: 'none',
        }} />
      ))}

      {/* Large watermark typography — masked so long labels fade at the edges instead of clipping hard */}
      {v.watermark && label && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          maskImage: 'linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)',
        }}>
          <span style={{
            fontSize: v.watermark, fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.06)', whiteSpace: 'nowrap', lineHeight: 1,
            fontFamily: "'Inter',system-ui,sans-serif", userSelect: 'none',
          }}>
            {label}
          </span>
        </div>
      )}

      {/* Center glass icon badge */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: v.iconBox, height: v.iconBox, borderRadius: v.iconBox * 0.32,
          background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.16)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        }}>
          <Icon style={{ width: v.iconSize, height: v.iconSize, color: 'rgba(255,255,255,0.85)' }} strokeWidth={1.5} />
        </div>
      </div>

      {/* Brand mark corner */}
      {v.brand > 0 && (
        <div style={{
          position: 'absolute', bottom: variant === 'hero' ? 20 : 10, [isRTL ? 'right' : 'left']: variant === 'hero' ? 20 : 10,
          width: v.brand, height: v.brand, borderRadius: v.brand * 0.3,
          background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: v.brand * 0.5, fontWeight: 800, color: '#fff', opacity: 0.55,
          fontFamily: "'Inter',system-ui,sans-serif",
        }}>
          Y
        </div>
      )}
    </div>
  );
};

export default GeneratedPlaceholder;
