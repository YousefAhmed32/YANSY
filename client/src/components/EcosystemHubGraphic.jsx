import { Cpu, Users, Globe, Boxes, Workflow, BarChart3, Smartphone } from 'lucide-react';

/**
 * Decorative companion graphic for CustomSoftwareSection's header action slot.
 * Replaces a raster illustration that had English labels baked into the
 * pixels (broke Arabic mode) and shipped at 6MB. This draws the same "your
 * systems, unified around one custom core" idea as SVG connector lines +
 * real DOM chips, so labels stay real text — translatable, crisp at any
 * density, no image request.
 */
const VB_W = 440;
const VB_H = 390;
const CX = 220;
const CY = 196;
const RX = 162;
const RY = 122;
const HUB_R = 42;
const NODE_R = 27;

const RAW_NODES = [
  { angle: -90, Icon: Users,       en: 'CRM',        ar: 'العملاء',      color: 'rgb(37 99 235)' },
  { angle: -30, Icon: Globe,       en: 'Website',     ar: 'الموقع',        color: '#7C3AED' },
  { angle: 30,  Icon: Boxes,       en: 'Inventory',   ar: 'المخزون',      color: '#0891B2' },
  { angle: 90,  Icon: Workflow,    en: 'Automation',  ar: 'الأتمتة',       color: '#059669' },
  { angle: 150, Icon: BarChart3,   en: 'Analytics',   ar: 'التحليلات',    color: '#D97706' },
  { angle: 210, Icon: Smartphone,  en: 'Mobile App',  ar: 'تطبيق الجوال', color: '#DC2626' },
];

const NODES = RAW_NODES.map((n, i) => {
  const rad = (n.angle * Math.PI) / 180;
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
  const bow = (i % 2 === 0 ? 1 : -1) * 16;
  const control = { x: mid.x - uy * bow, y: mid.y + ux * bow };
  const path = `M ${hubEdge.x.toFixed(1)} ${hubEdge.y.toFixed(1)} Q ${control.x.toFixed(1)} ${control.y.toFixed(1)} ${nodeEdge.x.toFixed(1)} ${nodeEdge.y.toFixed(1)}`;
  return { ...n, i, x, y, path };
});

const EcosystemHubGraphic = ({ isRTL = false }) => {
  return (
    <div className="eco-hub" aria-hidden="true">
      <style>{`
        .eco-hub {
          position: relative;
          width: 100%;
          max-width: 340px;
          aspect-ratio: ${VB_W} / ${VB_H};
        }
        .eco-hub__lines {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: visible;
        }
        .eco-hub__flow {
          animation: eco-flow 3.4s linear infinite;
        }
        @keyframes eco-flow {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -228; }
        }
        .eco-hub__hub {
          position: absolute;
          left: ${(CX / VB_W) * 100}%;
          top: ${(CY / VB_H) * 100}%;
          transform: translate(-50%, -50%);
          width: 19%;
          aspect-ratio: 1;
          border-radius: 26%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(155deg, color-mix(in srgb, rgb(var(--accent)) 88%, white) 0%, rgb(var(--accent)) 100%);
          box-shadow: 0 10px 28px -8px color-mix(in srgb, rgb(var(--accent)) 55%, transparent), inset 0 1px 0 rgba(255,255,255,0.25);
          color: #fff;
          animation: eco-hub-breathe 4.5s ease-in-out infinite;
        }
        .eco-hub__hub svg { width: 40%; height: 40%; stroke-width: 1.75; }
        @keyframes eco-hub-breathe {
          0%, 100% { box-shadow: 0 10px 28px -8px color-mix(in srgb, rgb(var(--accent)) 55%, transparent), inset 0 1px 0 rgba(255,255,255,0.25); }
          50%      { box-shadow: 0 14px 36px -6px color-mix(in srgb, rgb(var(--accent)) 68%, transparent), inset 0 1px 0 rgba(255,255,255,0.3); }
        }
        .eco-hub__node {
          position: absolute;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          width: 20%;
        }
        .eco-hub__node-chip {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 28%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--node-color);
          background: linear-gradient(155deg,
            color-mix(in srgb, var(--node-color) 16%, rgb(var(--bg-elevated))) 0%,
            color-mix(in srgb, var(--node-color) 5%, rgb(var(--bg-elevated))) 100%);
          border: 1px solid color-mix(in srgb, var(--node-color) 26%, rgb(var(--bg-elevated)));
          box-shadow: 0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6);
        }
        .eco-hub__node-chip svg { width: 42%; height: 42%; stroke-width: 1.9; }
        .eco-hub__node-label {
          font-size: 10.5px;
          font-weight: 600;
          color: rgb(var(--text-secondary));
          text-align: center;
          line-height: 1.25;
          white-space: nowrap;
        }
        [dir="rtl"] .eco-hub__node-label { font-family: var(--font-arabic); }

        @media (prefers-reduced-motion: reduce) {
          .eco-hub__flow, .eco-hub__hub { animation: none !important; }
        }
      `}</style>

      <svg className="eco-hub__lines" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet">
        {NODES.map((n) => (
          <g key={n.i}>
            <path d={n.path} stroke={n.color} strokeOpacity="0.16" strokeWidth="1.5" fill="none" />
            <path
              d={n.path}
              stroke={n.color}
              strokeOpacity="0.85"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="8 220"
              className="eco-hub__flow"
              style={{ animationDelay: `${n.i * -0.55}s` }}
            />
          </g>
        ))}
      </svg>

      <div className="eco-hub__hub">
        <Cpu />
      </div>

      {NODES.map((n) => {
        const Icon = n.Icon;
        return (
          <div
            key={n.i}
            className="eco-hub__node"
            style={{ left: `${(n.x / VB_W) * 100}%`, top: `${(n.y / VB_H) * 100}%`, '--node-color': n.color }}
          >
            <div className="eco-hub__node-chip">
              <Icon />
            </div>
            <span className="eco-hub__node-label">{isRTL ? n.ar : n.en}</span>
          </div>
        );
      })}
    </div>
  );
};

export default EcosystemHubGraphic;
