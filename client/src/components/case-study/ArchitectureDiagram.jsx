import { useMemo } from 'react';
import { Layers } from 'lucide-react';
import { getStackIcon } from './icons';

/* ═══════════════════════════════════════════════════════════════
   System architecture diagram — auto-generated from a case study's
   existing `stack` array, no new content-authoring required. Same
   hub-and-spoke technique as EcosystemHubGraphic.jsx (SVG connector
   paths + real DOM label chips, so labels stay crisp, translatable
   text rather than baked into a raster image). Node count is
   dynamic (5-8 items across the 9 case studies), so angles/radius
   are computed per-instance instead of hardcoded.
   ═══════════════════════════════════════════════════════════════ */

const VB_W = 480;
const VB_H = 420;
const CX = 240;
const CY = 214;

const ArchitectureDiagram = ({ stack = [], color = 'rgb(var(--accent))', hubLabel = '' }) => {
  const nodeR = stack.length > 6 ? 24 : 28;
  const rx = stack.length > 6 ? 196 : 176;
  const ry = stack.length > 6 ? 158 : 138;
  const hubR = 46;

  const nodes = useMemo(() => stack.map((name, i) => {
    const angle = -90 + i * (360 / stack.length);
    const rad = (angle * Math.PI) / 180;
    const x = CX + rx * Math.cos(rad);
    const y = CY + ry * Math.sin(rad);
    const dx = x - CX;
    const dy = y - CY;
    const dist = Math.hypot(dx, dy);
    const ux = dx / dist;
    const uy = dy / dist;
    const hubEdge = { x: CX + ux * hubR, y: CY + uy * hubR };
    const nodeEdge = { x: x - ux * nodeR, y: y - uy * nodeR };
    const mid = { x: (hubEdge.x + nodeEdge.x) / 2, y: (hubEdge.y + nodeEdge.y) / 2 };
    const bow = (i % 2 === 0 ? 1 : -1) * 14;
    const control = { x: mid.x - uy * bow, y: mid.y + ux * bow };
    const path = `M ${hubEdge.x.toFixed(1)} ${hubEdge.y.toFixed(1)} Q ${control.x.toFixed(1)} ${control.y.toFixed(1)} ${nodeEdge.x.toFixed(1)} ${nodeEdge.y.toFixed(1)}`;
    return { name, i, x, y, path, Icon: getStackIcon(name) };
  }), [stack, rx, ry, nodeR, hubR]);

  if (!stack.length) return null;

  return (
    <div className="arch-diagram" aria-hidden="true">
      <style>{`
        .arch-diagram { position: relative; width: 100%; max-width: 460px; margin: 0 auto; aspect-ratio: ${VB_W} / ${VB_H}; }
        .arch-diagram__lines { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
        .arch-diagram__flow { animation: arch-flow 3.2s linear infinite; }
        @keyframes arch-flow { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -200; } }
        .arch-diagram__hub {
          position: absolute; left: ${(CX / VB_W) * 100}%; top: ${(CY / VB_H) * 100}%;
          transform: translate(-50%, -50%);
          width: ${(hubR * 2 / VB_W) * 100}%; aspect-ratio: 1; border-radius: 26%;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
          background: linear-gradient(155deg, color-mix(in srgb, ${color} 90%, white) 0%, ${color} 100%);
          box-shadow: 0 12px 32px -10px color-mix(in srgb, ${color} 55%, transparent), inset 0 1px 0 rgba(255,255,255,0.25);
          color: #fff; padding: 8px;
        }
        .arch-diagram__hub svg { width: 30%; height: 30%; stroke-width: 1.75; flex-shrink: 0; }
        .arch-diagram__hub-label {
          font-size: 10px; font-weight: 700; text-align: center; line-height: 1.2;
          letter-spacing: 0.02em; color: rgba(255,255,255,0.92); white-space: nowrap;
        }
        .arch-diagram__node {
          position: absolute; transform: translate(-50%, -50%);
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          width: ${(nodeR * 2.15 / VB_W) * 100}%;
        }
        .arch-diagram__node-chip {
          width: 100%; aspect-ratio: 1; border-radius: 28%;
          display: flex; align-items: center; justify-content: center;
          color: ${color};
          background: linear-gradient(155deg, color-mix(in srgb, ${color} 14%, rgb(var(--bg-elevated))) 0%, color-mix(in srgb, ${color} 4%, rgb(var(--bg-elevated))) 100%);
          border: 1px solid color-mix(in srgb, ${color} 24%, rgb(var(--bg-elevated)));
          box-shadow: 0 1px 3px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.6);
        }
        .arch-diagram__node-chip svg { width: 42%; height: 42%; stroke-width: 1.9; }
        .arch-diagram__node-label {
          font-size: 9.5px; font-weight: 600; color: rgb(var(--text-secondary));
          text-align: center; line-height: 1.3; width: 100%;
          overflow-wrap: break-word; word-break: break-word;
        }
        @media (prefers-reduced-motion: reduce) { .arch-diagram__flow { animation: none !important; } }
      `}</style>

      <svg className="arch-diagram__lines" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet">
        {nodes.map(n => (
          <g key={n.i}>
            <path d={n.path} stroke={color} strokeOpacity="0.14" strokeWidth="1.5" fill="none" />
            <path
              d={n.path} stroke={color} strokeOpacity="0.8" strokeWidth="2" fill="none" strokeLinecap="round"
              strokeDasharray="7 200" className="arch-diagram__flow" style={{ animationDelay: `${n.i * -0.5}s` }}
            />
          </g>
        ))}
      </svg>

      <div className="arch-diagram__hub">
        <Layers />
        <span className="arch-diagram__hub-label">{hubLabel}</span>
      </div>

      {nodes.map(n => (
        <div key={n.i} className="arch-diagram__node" style={{ left: `${(n.x / VB_W) * 100}%`, top: `${(n.y / VB_H) * 100}%` }}>
          <div className="arch-diagram__node-chip"><n.Icon /></div>
          <span className="arch-diagram__node-label" dir="ltr">{n.name}</span>
        </div>
      ))}
    </div>
  );
};

export default ArchitectureDiagram;
