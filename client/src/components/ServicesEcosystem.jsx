/**
 * ServicesEcosystem — Canvas 2D "Digital Ecosystem" visual.
 *
 * Architecture:
 *   – YANSY ENGINE core: glowing gold sphere, rotating dashed orbit rings,
 *     additive-blend halo.
 *   – 6 service nodes in a perfect hexagonal arrangement.
 *   – Bezier-curved connections (all CCW rotation for a swirling energy feel).
 *   – Bidirectional data streams: node-colour outward + gold inward return.
 *   – Entrance animation: nodes spring outward from core (easeOutBack, staggered).
 *   – Mouse parallax + per-node hover (scale boost + sublabel reveal).
 *   – Ambient background particles drifting upward.
 *   – prefers-reduced-motion: particles suppressed, static ecosystem visible.
 */
import { memo, useEffect, useRef } from 'react';
import { W0, H0, CORE, NODES, mkFlowParticles, mkBgParticles } from './ServicesEcosystemData.js';

// ── Easing ────────────────────────────────────────────────────────────────────

function easeOutBack(x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

// ── Quadratic bezier point ────────────────────────────────────────────────────

function bzAt(t, x0, y0, x1, y1, x2, y2) {
  const m = 1 - t;
  return [m * m * x0 + 2 * m * t * x1 + t * t * x2,
          m * m * y0 + 2 * m * t * y1 + t * t * y2];
}

// ── Component ─────────────────────────────────────────────────────────────────

const ServicesEcosystem = memo(function ServicesEcosystem() {
  const canvasRef = useRef(null);
  const wrapRef   = useRef(null);

  // All mutable canvas state lives here — zero React re-renders during animation.
  const S = useRef({
    mouseX:   W0 / 2,
    mouseY:   H0 / 2,
    hoveredId: null,
    hProg:    Object.fromEntries(NODES.map(n => [n.id, 0])),
    startTs:  null,
    W: 0,
    H: 0,
  }).current;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap   = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr     = Math.min(window.devicePixelRatio || 1, 2);

    // Pre-built particle arrays
    const flowP = NODES.map(() => mkFlowParticles());
    const bgP   = mkBgParticles();

    // ── Scale helpers (read S.W/H at call-time — updated on resize) ──────────
    const sx = v => (v / W0) * S.W;
    const sy = v => (v / H0) * S.H;

    // ── Resize ────────────────────────────────────────────────────────────────
    const resize = () => {
      const r  = wrap.getBoundingClientRect();
      S.W = r.width;
      S.H = r.height;
      canvas.width         = Math.round(S.W * dpr);
      canvas.height        = Math.round(S.H * dpr);
      canvas.style.width   = S.W + 'px';
      canvas.style.height  = S.H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // ── Mouse ─────────────────────────────────────────────────────────────────
    const onMove = e => {
      const r  = canvas.getBoundingClientRect();
      S.mouseX = ((e.clientX - r.left) / S.W) * W0;
      S.mouseY = ((e.clientY - r.top)  / S.H) * H0;
      let hit  = null;
      for (const n of NODES) {
        if (Math.hypot(S.mouseX - n.x, S.mouseY - n.y) < n.r * 4.2) { hit = n.id; break; }
      }
      S.hoveredId          = hit;
      canvas.style.cursor  = hit ? 'pointer' : 'default';
    };
    const onLeave = () => {
      S.hoveredId         = null;
      S.mouseX            = W0 / 2;
      S.mouseY            = H0 / 2;
      canvas.style.cursor = 'default';
    };
    canvas.addEventListener('mousemove', onMove,  { passive: true });
    canvas.addEventListener('mouseleave', onLeave);

    // ── Draw: ambient background particles ────────────────────────────────────
    const drawBg = dt => {
      if (reduced) return;
      for (const p of bgP) {
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;
        if (p.y < -4)     { p.y = H0 + 4; p.x = Math.random() * W0; }
        if (p.x < -4)       p.x = W0 + 4;
        if (p.x > W0 + 4)   p.x = -4;
        ctx.beginPath();
        ctx.arc(sx(p.x), sy(p.y), Math.max(0.4, sx(p.r)), 0, 6.283);
        ctx.fillStyle = p.gold
          ? `rgba(37,99,235,${p.a})`
          : `rgba(147,197,253,${p.a * 0.45})`;
        ctx.fill();
      }
    };

    // ── Draw: bezier connections + data streams ───────────────────────────────
    const drawConnections = (t, positions) => {
      const cxp = sx(CORE.x), cyp = sy(CORE.y);

      for (let i = 0; i < NODES.length; i++) {
        const nd  = NODES[i];
        const pos = positions[i];
        const nx  = sx(pos.x), ny = sy(pos.y);
        const [r, g, b] = nd.rgb;
        const hp  = S.hProg[nd.id] || 0;

        // Bezier control point: CCW perpendicular offset at midpoint.
        // Creates a unified swirling energy pattern across all connections.
        const dx  = nx - cxp, dy = ny - cyp;
        const len = Math.hypot(dx, dy) || 1;
        const mx  = (cxp + nx) / 2, my = (cyp + ny) / 2;
        const cpx = mx + (-dy / len) * sx(22);
        const cpy = my + ( dx / len) * sx(22);

        // Guide line
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.038 + hp * 0.092})`;
        ctx.lineWidth   = 0.42 + hp * 0.88;
        ctx.beginPath();
        ctx.moveTo(cxp, cyp);
        ctx.quadraticCurveTo(cpx, cpy, nx, ny);
        ctx.stroke();

        if (reduced) continue;

        // Data stream particles
        for (const p of flowP[i]) {
          const raw  = (t * p.speed + p.offset) % 1.0;
          const prog = p.dir === 1 ? raw : 1.0 - raw;
          const [px, py] = bzAt(prog, cxp, cyp, cpx, cpy, nx, ny);
          const bri   = Math.sin(prog * Math.PI);
          const alpha = bri * (p.dir === 1 ? 0.80 + hp * 0.15 : 0.28);
          const pr    = Math.max(0.4, sx(p.size * 0.88) + bri * sx(0.52));
          ctx.beginPath();
          ctx.arc(px, py, pr, 0, 6.283);
          ctx.fillStyle = p.dir === 1
            ? `rgba(${r},${g},${b},${alpha})`
            : `rgba(37,99,235,${alpha})`;
          ctx.fill();
        }
      }
    };

    // ── Draw: YANSY ENGINE core ───────────────────────────────────────────────
    const drawCore = t => {
      const cx    = sx(CORE.x), cy = sy(CORE.y);
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.62);

      // Additive outer halo
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const hR = sx(70) + pulse * sx(5.5);
      let g = ctx.createRadialGradient(cx, cy, 0, cx, cy, hR);
      g.addColorStop(0,    `rgba(37,99,235,${0.11 + pulse * 0.04})`);
      g.addColorStop(0.38, `rgba(37,99,235,${0.032 + pulse * 0.008})`);
      g.addColorStop(1,    'rgba(37,99,235,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, hR, 0, 6.283); ctx.fill();
      ctx.restore();

      // Three rotating dashed orbit rings
      const rings = [
        [sx(34), 0.20,  0.12],
        [sx(46), 0.13, -0.08],
        [sx(58), 0.07,  0.05],
      ];
      for (const [rr, a, speed] of rings) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * speed);
        ctx.setLineDash([sx(4.2), sx(5.4)]);
        ctx.strokeStyle = `rgba(37,99,235,${a * (0.78 + pulse * 0.22)})`;
        ctx.lineWidth   = 0.5;
        ctx.beginPath(); ctx.arc(0, 0, rr + pulse * sx(1.8), 0, 6.283); ctx.stroke();
        ctx.restore();
      }
      ctx.setLineDash([]);

      // Glass sphere body
      const bR = sx(20) + pulse * sx(1.1);
      const hx = cx - sx(4.8), hy = cy - sx(4.4);
      g = ctx.createRadialGradient(hx, hy, 0, cx, cy, bR);
      g.addColorStop(0,    'rgba(255,255,255,0.98)');
      g.addColorStop(0.12, 'rgba(255,240,175,0.93)');
      g.addColorStop(0.32, 'rgba(37,99,235,0.80)');
      g.addColorStop(0.62, 'rgba(160,122,30,0.50)');
      g.addColorStop(0.88, 'rgba(100,76,14,0.22)');
      g.addColorStop(1,    'rgba(80,60,10,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, bR, 0, 6.283); ctx.fill();

      // Fresnel rim
      g = ctx.createRadialGradient(cx, cy, bR * 0.60, cx, cy, bR * 1.09);
      g.addColorStop(0,    'rgba(37,99,235,0)');
      g.addColorStop(0.68, `rgba(37,99,235,${0.11 + pulse * 0.05})`);
      g.addColorStop(1,    `rgba(255,220,100,${0.24 + pulse * 0.07})`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, bR * 1.09, 0, 6.283); ctx.fill();

      // Hard specular
      ctx.fillStyle = `rgba(255,255,255,${0.84 + pulse * 0.12})`;
      ctx.beginPath(); ctx.arc(cx - sx(4.7), cy - sx(4.8), sx(2.1), 0, 6.283); ctx.fill();

      // "YANSY ENGINE" label below core
      ctx.textAlign   = 'center';
      ctx.textBaseline = 'top';
      const fs1 = Math.max(7, Math.round(sx(9.0)));
      const fs2 = Math.max(5, Math.round(sx(6.2)));
      ctx.font      = `700 ${fs1}px 'Inter',system-ui,sans-serif`;
      ctx.fillStyle = `rgba(37,99,235,${0.80 + pulse * 0.12})`;
      ctx.fillText('YANSY', cx, cy + bR + sx(6.5));
      ctx.font      = `400 ${fs2}px 'Inter',system-ui,sans-serif`;
      ctx.fillStyle = `rgba(37,99,235,${0.42 + pulse * 0.08})`;
      ctx.fillText('ENGINE', cx, cy + bR + fs1 + sx(7.5));
    };

    // ── Draw: service nodes ───────────────────────────────────────────────────
    const drawNodes = (t, positions) => {
      for (let i = 0; i < NODES.length; i++) {
        const nd    = NODES[i];
        const pos   = positions[i];
        const nx    = sx(pos.x), ny = sy(pos.y);
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.58 + nd.po);
        const [r, g, b] = nd.rgb;
        const hp   = S.hProg[nd.id] || 0;
        const sc   = 1 + hp * 0.45;

        // Outer glow
        const gR = (sx(nd.r * 2.7) + pulse * sx(nd.r * 0.36)) * sc;
        let grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, gR);
        grad.addColorStop(0,    `rgba(${r},${g},${b},${(0.19 + pulse * 0.05) * (1 + hp * 0.45)})`);
        grad.addColorStop(0.45, `rgba(${r},${g},${b},0.052)`);
        grad.addColorStop(1,    `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(nx, ny, gR, 0, 6.283); ctx.fill();

        // Orb body
        const oR = (sx(nd.r) + pulse * sx(0.75)) * sc;
        grad = ctx.createRadialGradient(nx - sx(1.9), ny - sx(1.7), 0, nx, ny, oR);
        grad.addColorStop(0,    'rgba(255,255,255,0.96)');
        grad.addColorStop(0.22, `rgba(${r},${g},${b},0.93)`);
        grad.addColorStop(0.65, `rgba(${r},${g},${b},0.62)`);
        grad.addColorStop(1,    `rgba(${r},${g},${b},0.16)`);
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(nx, ny, oR, 0, 6.283); ctx.fill();

        // Hover pulse ring
        if (hp > 0.05) {
          ctx.strokeStyle = `rgba(${r},${g},${b},${hp * 0.45})`;
          ctx.lineWidth   = 0.7;
          ctx.beginPath(); ctx.arc(nx, ny, oR * 1.55, 0, 6.283); ctx.stroke();
        }

        // Label
        const fs = Math.max(7, Math.round(sx(7.9)));
        ctx.font         = `500 ${fs}px 'Inter',system-ui,sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'top';
        const ly = ny + oR + sx(4.0);

        // Subtle shadow pass
        ctx.fillStyle = `rgba(${r},${g},${b},${0.25 + pulse * 0.06})`;
        ctx.fillText(nd.label, nx + 0.5, ly + 0.5);
        // Main label
        ctx.fillStyle = `rgba(241,245,249,${0.40 + pulse * 0.08 + hp * 0.30})`;
        ctx.fillText(nd.label, nx, ly);

        // Outcome sublabel revealed on hover
        if (hp > 0.08) {
          const sfs = Math.max(6, Math.round(sx(6.3)));
          ctx.font      = `400 ${sfs}px 'Inter',system-ui,sans-serif`;
          ctx.fillStyle = `rgba(${r},${g},${b},${hp * 0.70})`;
          ctx.fillText(nd.sublabel, nx, ly + fs + sx(1.5));
        }
      }
    };

    // ── Animation loop ────────────────────────────────────────────────────────
    let raf = null, prevTs = 0;

    const tick = ts => {
      if (!S.startTs) S.startTs = ts;
      const elapsed = (ts - S.startTs) / 1000;
      const dt      = Math.min((ts - prevTs) / 1000, 0.08);
      prevTs = ts;
      const t = ts / 1000;

      ctx.clearRect(0, 0, S.W, S.H);

      // Mouse parallax offset
      const px = (S.mouseX / W0 - 0.5) *  9;
      const py = (S.mouseY / H0 - 0.5) * 5.5;

      // Entrance + parallax node positions
      const positions = NODES.map((nd, i) => {
        const delay = i * 0.10;
        const prog  = Math.max(0, Math.min(1, (elapsed - delay) / 0.88));
        const ease  = easeOutBack(prog);
        return {
          x: CORE.x + (nd.x - CORE.x) * ease + px,
          y: CORE.y + (nd.y - CORE.y) * ease + py,
        };
      });

      // Smooth hover progress per node
      for (const nd of NODES) {
        const tgt         = S.hoveredId === nd.id ? 1 : 0;
        S.hProg[nd.id]    = (S.hProg[nd.id] || 0) + (tgt - (S.hProg[nd.id] || 0)) * dt * 9;
      }

      drawBg(dt);
      drawConnections(t, positions);
      drawCore(t);
      drawNodes(t, positions);

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    const ro = new ResizeObserver(() => { ctx.setTransform(1, 0, 0, 1, 0, 0); resize(); });
    ro.observe(wrap);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
    };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={wrapRef}
      role="img"
      aria-label="YANSY Digital Ecosystem — six connected service nodes (Websites, E-Commerce, SaaS Platforms, Mobile Apps, Booking Systems, CRM/ERP) powered by the YANSY ENGINE core"
      style={{
        position    : 'relative',
        width       : '100%',
        aspectRatio : `${W0} / ${H0}`,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset   : 0,
          display : 'block',
          width   : '100%',
          height  : '100%',
        }}
      />
    </div>
  );
});

ServicesEcosystem.displayName = 'ServicesEcosystem';
export default ServicesEcosystem;
