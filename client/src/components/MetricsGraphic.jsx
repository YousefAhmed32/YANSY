import { Target } from 'lucide-react';

/**
 * Companion graphic for MetricsSection's header action slot. Replaces
 * `Arabic Analytics Dashboard Scene.png` — a static illustration with Arabic
 * UI text baked into the pixels, shown to English visitors too since the
 * `<img>` was never language-conditioned, and a fabricated dashboard mockup
 * sitting one section below PortfolioSection's own "no mockups, no demos"
 * promise.
 *
 * Reuses EcosystemHubGraphic's radial hub-and-node technique (SVG connector
 * paths + real DOM text, no raster image) rather than a bar/line chart: the
 * four metrics below (3x, -80%, +40%, +35%) are different units entirely, so
 * plotting them on a shared visual axis (bar heights, a rising line) would
 * imply a comparability that isn't real. A radial layout makes no such claim
 * — it reads as "four outcomes, one delivery process," which is what's true.
 *
 * `points` is passed in by MetricsSection so the numbers shown here are the
 * exact same data as the cells below, in whichever language is active —
 * never a second, driftable copy.
 */
const VB_W = 440;
const VB_H = 390;
const CX = 220;
const CY = 196;
const RX = 150;
const RY = 130;
const HUB_R = 40;
const NODE_R = 30;

const ANGLES = [-45, 45, 135, 225];

const NODES = (points) => points.slice(0, 4).map((p, i) => {
  const angle = ANGLES[i];
  const rad = (angle * Math.PI) / 180;
  const x = CX + RX * Math.cos(rad);
  const y = CY + RY * Math.sin(rad);
  const dx = x - CX;
  const dy = y - CY;
  const dist = Math.hypot(dx, dy);
  const ux = dx / dist;
  const uy = dy / dist;
  const hubEdge = { x: CX + ux * HUB_R, y: CY + uy * HUB_R };
  const nodeEdge = { x: x - ux * NODE_R, y: y - uy * NODE_R };
  const mid = { x: (hubEdge.x + nodeEdge.x) / 2, y: (hubEdge.y + nodeEdge.y) / 2 };
  const bow = (i % 2 === 0 ? 1 : -1) * 14;
  const control = { x: mid.x - uy * bow, y: mid.y + ux * bow };
  const path = `M ${hubEdge.x.toFixed(1)} ${hubEdge.y.toFixed(1)} Q ${control.x.toFixed(1)} ${control.y.toFixed(1)} ${nodeEdge.x.toFixed(1)} ${nodeEdge.y.toFixed(1)}`;
  return { ...p, i, x, y, path };
});

const MetricsGraphic = ({ points }) => {
  const nodes = NODES(points);

  return (
    <div className="metrics-hub" aria-hidden="true">
      <style>{`
        .metrics-hub {
          position: relative;
          width: 100%;
          max-width: 340px;
          aspect-ratio: ${VB_W} / ${VB_H};
        }
        .metrics-hub__lines { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
        .metrics-hub__flow { animation: metrics-flow 3.2s linear infinite; }
        @keyframes metrics-flow { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -220; } }

        .metrics-hub__hub {
          position: absolute;
          left: ${(CX / VB_W) * 100}%;
          top: ${(CY / VB_H) * 100}%;
          transform: translate(-50%, -50%);
          width: 18%;
          aspect-ratio: 1;
          border-radius: 26%;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(155deg, color-mix(in srgb, rgb(var(--accent)) 88%, white) 0%, rgb(var(--accent)) 100%);
          box-shadow: 0 10px 28px -8px color-mix(in srgb, rgb(var(--accent)) 55%, transparent), inset 0 1px 0 rgba(255,255,255,0.25);
          color: #fff;
          animation: metrics-hub-breathe 4.5s ease-in-out infinite;
        }
        .metrics-hub__hub svg { width: 42%; height: 42%; stroke-width: 1.75; }
        @keyframes metrics-hub-breathe {
          0%, 100% { box-shadow: 0 10px 28px -8px color-mix(in srgb, rgb(var(--accent)) 55%, transparent), inset 0 1px 0 rgba(255,255,255,0.25); }
          50%      { box-shadow: 0 14px 36px -6px color-mix(in srgb, rgb(var(--accent)) 68%, transparent), inset 0 1px 0 rgba(255,255,255,0.3); }
        }

        .metrics-hub__node {
          position: absolute;
          transform: translate(-50%, -50%);
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          width: 25%;
        }
        .metrics-hub__node-chip {
          display: flex; align-items: center; justify-content: center;
          min-width: 100%; padding: 8px 4px;
          border-radius: 30%;
          font-size: 15px; font-weight: 800; letter-spacing: -0.02em;
          font-variant-numeric: tabular-nums;
          color: var(--node-color);
          background: linear-gradient(155deg,
            color-mix(in srgb, var(--node-color) 16%, rgb(var(--bg-elevated))) 0%,
            color-mix(in srgb, var(--node-color) 5%, rgb(var(--bg-elevated))) 100%);
          border: 1px solid color-mix(in srgb, var(--node-color) 26%, rgb(var(--bg-elevated)));
          box-shadow: 0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6);
        }
        .metrics-hub__node-label {
          font-size: 10px; font-weight: 600; color: rgb(var(--text-secondary));
          text-align: center; line-height: 1.25; white-space: nowrap;
        }
        [dir="rtl"] .metrics-hub__node-label { font-family: var(--font-arabic); }

        @media (prefers-reduced-motion: reduce) {
          .metrics-hub__flow, .metrics-hub__hub { animation: none !important; }
        }
      `}</style>

      <svg className="metrics-hub__lines" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet">
        {nodes.map((n) => (
          <g key={n.i}>
            <path d={n.path} stroke={n.color} strokeOpacity="0.16" strokeWidth="1.5" fill="none" />
            <path
              d={n.path}
              stroke={n.color}
              strokeOpacity="0.85"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="8 212"
              className="metrics-hub__flow"
              style={{ animationDelay: `${n.i * -0.5}s` }}
            />
          </g>
        ))}
      </svg>

      <div className="metrics-hub__hub">
        <Target />
      </div>

      {nodes.map((n) => (
        <div
          key={n.i}
          className="metrics-hub__node"
          style={{ left: `${(n.x / VB_W) * 100}%`, top: `${(n.y / VB_H) * 100}%`, '--node-color': n.color }}
        >
          <div className="metrics-hub__node-chip" dir="ltr">{n.value}</div>
          <span className="metrics-hub__node-label">{n.label}</span>
        </div>
      ))}
    </div>
  );
};

export default MetricsGraphic;
