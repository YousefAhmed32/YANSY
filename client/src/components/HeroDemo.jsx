/**
 * HeroDemo — NEXUS  (Gen-12 · Cinematic Edition)
 *
 * INTERACTION MODEL:
 *   Desktop: pure hover — cursor enters → expand, over node → KPI, leave → collapse
 *   Mobile:  tap sphere → expand, tap node → KPI, tap outside → collapse
 *
 * Architecture: single rAF · zero React re-renders · all state in S ref
 * Audio:        cinematic sound design system — preloads on first user gesture,
 *               synchronized to hoverT / cycleT / activeNode animation signals
 */
import { memo, useEffect, useRef } from 'react';
import styles from './HeroDemo.module.css';

// ── Design space ──────────────────────────────────────────────────────────────
const W0 = 560, H0 = 460;
const CX = 280, CY = 220;
const SR = 88;

const ORX_BASE      = SR * 1.80;
const ORY_BASE      = SR * 0.22;
const OSPD          = 0.024;
const ORBIT_PHASES  = [0, 0.25, 0.50, 0.75];

const CYCLE_INTERVAL   = 5.0;
const CYCLE_TRANSITION = 1.0;

const SCALE_RESTING = 1.000;
const SCALE_HOVER   = 1.075;
const SCALE_ACTIVE  = 1.110;

const AMBIENT_COUNT = 52;
const FLOW_PER_LINE = 4;
const FLOW_SPEED    = 0.27;

const NODES = [
  { label:'Website',    stat:'+35%', statSub:'Lead Growth',       angle:-0.90, distMul:3.80, rgb:[110,175,255] },
  { label:'Mobile App', stat:'2×',   statSub:'Platform Coverage',  angle: 0.22, distMul:4.00, rgb:[160,145,235] },
  { label:'SaaS',       stat:'6wk',  statSub:'To Live MVP',        angle: 1.55, distMul:3.80, rgb:[ 70,200,150] },
  { label:'Automation', stat:'60%',  statSub:'Ops Time Saved',     angle: 2.65, distMul:3.90, rgb:[235,125,105] },
  { label:'Analytics',  stat:'∞',    statSub:'Real-time Data',     angle:-2.45, distMul:3.70, rgb:[220,180, 50] },
  { label:'AI Core',    stat:'24/7', statSub:'System Uptime',      angle:-0.06, distMul:4.20, rgb:[212,175, 55] },
];
const N = NODES.length;

// parse "+35%" → {prefix:"+", value:35, suffix:"%"}
const parseStat = s => {
  const m = s.match(/^([+]?)(\d+(?:\.\d+)?)(.*)$/);
  return m ? { prefix: m[1], value: parseFloat(m[2]), suffix: m[3] } : null;
};

// ── Easing + math ─────────────────────────────────────────────────────────────
const c01    = t => Math.min(1, Math.max(0, t));
const lerp   = (a, b, t) => a + (b - a) * t;
const clamp  = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const eoc    = t => 1 - Math.pow(1 - c01(t), 3);   // easeOutCubic
const eoq    = t => 1 - Math.pow(1 - c01(t), 5);   // easeOutQuint
const eiiq   = t => t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2;

const spring = (cur, tgt, vel, dt, k = 180, d = 22) => {
  const f  = -k * (cur - tgt) - d * vel;
  const nv = vel + f * dt;
  return { val: cur + nv * dt, vel: nv };
};

// ── Component ─────────────────────────────────────────────────────────────────
const HeroDemo = memo(function HeroDemo() {
  const canvasRef  = useRef(null);
  const wrapperRef = useRef(null);
  const audioRef   = useRef(null); // holds audioManager instance

  const S = useRef({
    mx: 0, my: 0, tX: 0, tY: 0,
    ts0: null, W: 0, H: 0,
    isMobile: false, isTablet: false, touchOnly: false,

    hovered: false,  hoverT: 0,    hoverVel: 0,
    activeNode: -1,  prevActiveNode: -1,

    scaleVal: SCALE_RESTING, scaleVel: 0,

    nodeHoverT:  Array.from({ length: N }, () => 0),
    nodeHoverV:  Array.from({ length: N }, () => 0),
    nodeMagX:    Array.from({ length: N }, () => 0),
    nodeMagY:    Array.from({ length: N }, () => 0),
    nodeMagVX:   Array.from({ length: N }, () => 0),
    nodeMagVY:   Array.from({ length: N }, () => 0),

    // flow phases [nodeIdx * FLOW_PER_LINE + particleIdx]
    flowPhases: Array.from({ length: N * FLOW_PER_LINE }, (_, i) => (i % FLOW_PER_LINE) / FLOW_PER_LINE),

    ambientParticles: [],
    particles: [],

    cycleNode: 0, cycleT: 0, cycleTimer: 0, cycleActive: false,

    coreContentT: 0, coreNode: -1,
    kpiScaleVal: 0.94, kpiScaleVel: 0,
    countProgress: Array.from({ length: N }, () => 0),

    tapOpen: false,

    // ── Audio tracking (frame-persistent, no React state) ──────────────────
    audioPrevHovered:    false,
    audioCoreExpFired:   false,
    audioExpCompFired:   false,
    audioNodeWasVisible: Array.from({ length: N }, () => false),
    audioRevealLastMs:   0,
    audioRevealPoolIdx:  0,
  }).current;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx    = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr     = Math.min(window.devicePixelRatio || 1, 2);
    const sx = v => (v / W0) * S.W;
    const sy = v => (v / H0) * S.H;

    const checkBP = () => {
      S.isMobile  = S.W < 480;
      S.isTablet  = S.W >= 480 && S.W < 900;
      S.touchOnly = window.matchMedia('(hover:none) and (pointer:coarse)').matches;
    };

    const nodeDist = n => {
      if (S.isMobile) return SR * n.distMul * 0.58;
      if (S.isTablet) return SR * n.distMul * 0.76;
      return SR * n.distMul;
    };

    const orxScale = () => S.isMobile ? 0.65 : S.isTablet ? 0.82 : 1.00;

    // ── Resize ────────────────────────────────────────────────────────────────
    const resize = () => {
      const p = canvas.parentElement; if (!p) return;
      const r = p.getBoundingClientRect();
      S.W = r.width; S.H = r.height;
      canvas.width        = Math.round(S.W * dpr);
      canvas.height       = Math.round(S.H * dpr);
      canvas.style.width  = `${S.W}px`;
      canvas.style.height = `${S.H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      checkBP();
    };
    resize();

    // ── Ambient particles (initialized once, live in pixel space) ─────────────
    if (S.ambientParticles.length === 0) {
      for (let i = 0; i < AMBIENT_COUNT; i++) {
        const warm = Math.random() < 0.3;
        S.ambientParticles.push({
          x: Math.random() * S.W,
          y: Math.random() * S.H,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.10 - 0.025,
          size:      0.5 + Math.random() * 1.0,
          baseAlpha: 0.035 + Math.random() * 0.07,
          phase:     Math.random() * Math.PI * 2,
          freq:      0.5 + Math.random() * 0.8,
          r: warm ? lerp(190, 212, Math.random()) : lerp(90, 150, Math.random()),
          g: warm ? lerp(155, 175, Math.random()) : lerp(130, 200, Math.random()),
          b: warm ? lerp(20,  55,  Math.random()) : lerp(200, 255, Math.random()),
        });
      }
    }

    // ── Node hit positions ────────────────────────────────────────────────────
    const getNodePos = () => NODES.map(n => ({
      x: sx(CX) + Math.cos(n.angle) * sx(nodeDist(n)),
      y: sy(CY) + Math.sin(n.angle) * sx(nodeDist(n)),
      r: sx(S.isMobile ? 36 : 42),
    }));

    // ── Spark particles on node change ────────────────────────────────────────
    const spawnParticles = (ni, cx, cy) => {
      const n = NODES[ni];
      const [r, g, b] = n.rgb;
      const nx = cx + Math.cos(n.angle) * sx(nodeDist(n));
      const ny = cy + Math.sin(n.angle) * sx(nodeDist(n));
      for (let i = 0; i < 7; i++) {
        S.particles.push({
          x: nx + (Math.random() - 0.5) * sx(8),
          y: ny + (Math.random() - 0.5) * sx(8),
          tx: cx + (Math.random() - 0.5) * sx(14),
          ty: cy + (Math.random() - 0.5) * sx(14),
          t: 0, dur: 0.38 + Math.random() * 0.28,
          r, g, b,
          size: sx(0.9 + Math.random() * 1.3),
        });
      }
      if (S.particles.length > 56) S.particles.splice(0, S.particles.length - 56);
    };

    // ── Audio Manager ─────────────────────────────────────────────────────────
    const makeAudio = (src, vol) => {
      const a = new Audio(src);
      a.preload = 'auto';
      a.volume  = Math.min(1, Math.max(0, vol));
      return a;
    };

    const AM = {
      interacted: false,
      sounds: {
        coreExpand: null,
        nodeReveal: [],   // pool of 3 for pitch variation without overlap
        nodeHover:  null,
        impact:     null,
      },

      preload() {
        this.sounds.coreExpand = makeAudio(
          '/assets/music/fxprosound-magic-charge-mana-2-186628.mp3', 0.30
        );
        // Pool of 3 identical sources at slightly different offsets for natural variation
        for (let i = 0; i < 3; i++) {
          this.sounds.nodeReveal.push(
            makeAudio('/assets/music/freesound_community-digital-91828.mp3', 0.17)
          );
        }
        this.sounds.nodeHover = makeAudio(
          '/assets/music/freesound_community-digital-91828.mp3', 0.13
        );
        this.sounds.impact = makeAudio(
          '/assets/music/coghezzi-sacred-rune-lock-holy-magic-seal-activation-533277.mp3', 0.35
        );
      },

      // AI core activation — once per expansion cycle
      playCoreExpand() {
        if (S.audioCoreExpFired) return;
        S.audioCoreExpFired = true;
        const s = this.sounds.coreExpand;
        if (!s) return;
        try { s.currentTime = 0; s.play().catch(() => {}); } catch (_) {}
      },

      // Digital network activation — throttled, with pitch variation
      playNodeReveal() {
        const now = Date.now();
        if (now - S.audioRevealLastMs < 400) return;
        S.audioRevealLastMs = now;
        const pool = this.sounds.nodeReveal;
        if (!pool.length) return;
        const s = pool[S.audioRevealPoolIdx % pool.length];
        S.audioRevealPoolIdx = (S.audioRevealPoolIdx + 1) % pool.length;
        try {
          s.currentTime  = 0;
          s.playbackRate = 0.88 + Math.random() * 0.24; // ±12% pitch drift
          s.play().catch(() => {});
        } catch (_) {}
      },

      // Subtle KPI selection feedback — only on activeNode change
      playNodeHover() {
        const s = this.sounds.nodeHover;
        if (!s) return;
        try {
          s.currentTime  = 0;
          s.playbackRate = 0.90 + Math.random() * 0.20;
          s.play().catch(() => {});
        } catch (_) {}
      },

      // Luxury completion — once per expansion cycle when hoverT ≈ 1
      playExpansionComplete() {
        if (S.audioExpCompFired) return;
        S.audioExpCompFired = true;
        const s = this.sounds.impact;
        if (!s) return;
        try { s.currentTime = 0; s.play().catch(() => {}); } catch (_) {}
      },

      cleanup() {
        const all = [
          this.sounds.coreExpand,
          ...this.sounds.nodeReveal,
          this.sounds.nodeHover,
          this.sounds.impact,
        ].filter(Boolean);
        for (const a of all) {
          try { a.pause(); a.src = ''; } catch (_) {}
        }
        this.sounds.coreExpand = null;
        this.sounds.nodeReveal = [];
        this.sounds.nodeHover  = null;
        this.sounds.impact     = null;
      },
    };

    audioRef.current = AM;

    // Preload on first user gesture (respects browser autoplay policy)
    const onFirstInteract = () => {
      if (AM.interacted) return;
      AM.interacted = true;
      AM.preload();
    };
    window.addEventListener('pointerdown', onFirstInteract, { once: true });
    window.addEventListener('keydown',     onFirstInteract, { once: true });

    // ── Interaction: desktop (pure hover) ────────────────────────────────────
    const onMouseMove = e => {
      if (S.touchOnly) return;
      const rc = canvas.getBoundingClientRect();
      const mx = e.clientX - rc.left, my = e.clientY - rc.top;
      S.mx = (mx / S.W) * 2 - 1;
      S.my = (my / S.H) * 2 - 1;
      if (S.hoverT > 0.10) {
        let hit = -1;
        getNodePos().forEach((np, i) => { if (Math.hypot(mx - np.x, my - np.y) < np.r) hit = i; });
        S.activeNode = hit;
        canvas.style.cursor = hit >= 0 ? 'pointer' : 'default';
      } else { S.activeNode = -1; canvas.style.cursor = 'default'; }
    };

    const onMouseEnter = () => { if (!S.touchOnly) S.hovered = true; };
    const onMouseLeave = () => {
      if (S.touchOnly) return;
      S.hovered = false; S.activeNode = -1; S.mx = 0; S.my = 0;
      canvas.style.cursor = 'default';
    };

    // ── Interaction: mobile (tap) ─────────────────────────────────────────────
    const onTouchStart = e => {
      if (!S.touchOnly) return;
      const rc = canvas.getBoundingClientRect();
      const tx = e.touches[0].clientX - rc.left, ty = e.touches[0].clientY - rc.top;
      if (!S.tapOpen) { S.tapOpen = true; S.hovered = true; return; }
      let hit = -1;
      getNodePos().forEach((np, i) => { if (Math.hypot(tx - np.x, ty - np.y) < np.r) hit = i; });
      if (hit >= 0) { S.activeNode = hit; }
      else { S.tapOpen = false; S.hovered = false; S.activeNode = -1; }
    };

    canvas.addEventListener('mousemove',  onMouseMove,  { passive: true });
    canvas.addEventListener('mouseenter', onMouseEnter);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });

    // ══════════════════════════════════════════════════════════════════════════
    // DRAW: Ambient particle field
    // ══════════════════════════════════════════════════════════════════════════
    const drawAmbientField = (t, hT) => {
      if (reduced) return;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const p of S.ambientParticles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = S.W + 20; else if (p.x > S.W + 20) p.x = -20;
        if (p.y < -20) p.y = S.H + 20; else if (p.y > S.H + 20) p.y = -20;
        const flicker = 0.5 + 0.5 * Math.sin(t * p.freq + p.phase);
        const a = p.baseAlpha * flicker * lerp(0.95, 0.50, hT);
        ctx.fillStyle = `rgba(${p.r|0},${p.g|0},${p.b|0},${a})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    };

    // ══════════════════════════════════════════════════════════════════════════
    // DRAW: Volumetric atmosphere
    // ══════════════════════════════════════════════════════════════════════════
    const drawAtmosphere = (pulse, cx, cy, hT, tintRgb) => {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      const [tr, tg, tb] = tintRgb
        ? [ lerp(212, tintRgb[0], hT * 0.28 + S.coreContentT * 0.22),
            lerp(175, tintRgb[1], hT * 0.28 + S.coreContentT * 0.22),
            lerp( 55, tintRgb[2], hT * 0.28 + S.coreContentT * 0.22) ]
        : [212, 175, 55];

      // Layer 1 — deep volumetric field
      const r1 = sx(SR * (3.3 + hT * 0.7));
      const a0 = 0.030 + pulse * 0.008 + hT * 0.010;
      let g = ctx.createRadialGradient(cx, cy, sx(SR * 0.5), cx, cy, r1);
      g.addColorStop(0,    `rgba(${tr},${tg},${tb},${a0})`);
      g.addColorStop(0.30, `rgba(${tr},${tg},${tb},${a0 * 0.22})`);
      g.addColorStop(0.70, `rgba(${tr},${tg},${tb},0.004)`);
      g.addColorStop(1,    `rgba(${tr},${tg},${tb},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r1, 0, Math.PI * 2); ctx.fill();

      // Layer 2 — tight bloom
      const r2 = sx(SR * 2.1);
      const a1 = 0.018 + hT * 0.020 + pulse * 0.007 + S.coreContentT * 0.012;
      g = ctx.createRadialGradient(cx, cy, sx(SR * 0.3), cx, cy, r2);
      g.addColorStop(0,   `rgba(${tr},${tg},${tb},${a1})`);
      g.addColorStop(0.5, `rgba(${tr},${tg},${tb},${a1 * 0.14})`);
      g.addColorStop(1,   `rgba(${tr},${tg},${tb},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r2, 0, Math.PI * 2); ctx.fill();

      // Layer 3 — cool nebula counterpoint
      const r3 = sx(SR * 2.8);
      g = ctx.createRadialGradient(cx + sx(18), cy - sx(12), 0, cx, cy, r3);
      g.addColorStop(0,   'rgba(55,75,165,0.011)');
      g.addColorStop(0.5, 'rgba(38,58,145,0.005)');
      g.addColorStop(1,   'rgba(38,58,145,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r3, 0, Math.PI * 2); ctx.fill();

      // Layer 4 — ground haze
      if (!S.isMobile) {
        const hazY = cy + sx(SR * 1.08);
        const hazH = S.H - hazY;
        if (hazH > 0) {
          g = ctx.createLinearGradient(cx, hazY, cx, hazY + hazH);
          g.addColorStop(0, `rgba(${tr},${tg},${tb},${0.007 + hT * 0.004})`);
          g.addColorStop(1, `rgba(${tr},${tg},${tb},0)`);
          ctx.fillStyle = g; ctx.fillRect(0, hazY, S.W, hazH);
        }
      }
      ctx.restore();
    };

    // ══════════════════════════════════════════════════════════════════════════
    // DRAW: Perspective grid plane
    // ══════════════════════════════════════════════════════════════════════════
    const drawGridPlane = (cx, cy, hT, t) => {
      if (S.isMobile) return;
      ctx.save();
      ctx.globalAlpha = (1 - hT * 0.80) * 0.80;
      const top  = cy + sx(SR * 1.06), bot = sy(H0 * 0.94);
      const hw   = sx(SR * 4.2), vpY = bot + sy(SR * 3.6);
      const conv = (bot - top) / (vpY - top);
      const COLS = 12, ROWS = 6;

      for (let i = 0; i <= COLS; i++) {
        const f  = i / COLS;
        const xT = lerp(cx - hw, cx + hw, f);
        const xB = lerp(xT, cx, conv);
        const a  = Math.max(0, 0.018 * (1 - Math.abs(f - 0.5) * 1.85));
        ctx.strokeStyle = `rgba(212,175,55,${a})`; ctx.lineWidth = 0.24;
        ctx.beginPath(); ctx.moveTo(xT, top); ctx.lineTo(xB, bot); ctx.stroke();
      }
      for (let i = 0; i <= ROWS; i++) {
        const f2   = (i + 1) / (ROWS + 2);
        const y    = lerp(top, bot, f2);
        const hw2  = hw * (1 - f2 * 0.67);
        const a    = 0.018 * (1 - f2 * 0.82);
        ctx.strokeStyle = `rgba(212,175,55,${a})`; ctx.lineWidth = 0.24;
        ctx.beginPath(); ctx.moveTo(cx - hw2, y); ctx.lineTo(cx + hw2, y); ctx.stroke();
      }

      // Scan sweep
      if (!reduced) {
        const scanPhase = (t * 0.07) % 1;
        const scanY     = lerp(top, bot, scanPhase);
        const scanW     = hw * (1 - scanPhase * 0.67);
        const scanG     = ctx.createLinearGradient(cx - scanW, scanY, cx + scanW, scanY);
        scanG.addColorStop(0,    'rgba(212,175,55,0)');
        scanG.addColorStop(0.35, 'rgba(212,175,55,0.007)');
        scanG.addColorStop(0.5,  'rgba(212,175,55,0.013)');
        scanG.addColorStop(0.65, 'rgba(212,175,55,0.007)');
        scanG.addColorStop(1,    'rgba(212,175,55,0)');
        ctx.fillStyle = scanG;
        ctx.fillRect(cx - scanW, scanY - 1.5, scanW * 2, 3);
      }
      ctx.restore();
    };

    // ══════════════════════════════════════════════════════════════════════════
    // DRAW: Orbit ring + pulse dots
    // ══════════════════════════════════════════════════════════════════════════
    const drawOrbit = (t, cx, cy, hT, sphereScale) => {
      const os  = orxScale();
      const rx  = sx(ORX_BASE * os) * sphereScale;
      const ry  = sx(ORY_BASE * os) * sphereScale * (1 + S.tX * 0.08);
      const spd = 1 + hT * 1.5;

      ctx.strokeStyle = `rgba(212,175,55,${lerp(0.10, 0.06, hT)})`; ctx.lineWidth = 0.36;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();

      const sEdge = sx(SR) * sphereScale * 0.92;
      for (const ph of ORBIT_PHASES) {
        const ang = (((t * OSPD * spd) + ph) % 1) * Math.PI * 2;
        const px  = cx + rx * Math.cos(ang), py = cy + ry * Math.sin(ang);
        if (Math.hypot(px - cx, py - cy) < sEdge && Math.sin(ang) < 0.10) continue;
        const ts2 = ang - 0.044 * Math.PI * 2;
        const gr  = ctx.createLinearGradient(cx + rx * Math.cos(ts2), cy + ry * Math.sin(ts2), px, py);
        gr.addColorStop(0, 'rgba(212,175,55,0)');
        gr.addColorStop(1, `rgba(212,175,55,${0.30 + hT * 0.10})`);
        ctx.strokeStyle = gr; ctx.lineWidth = 0.60 + hT * 0.18;
        ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, ts2, ang); ctx.stroke();
        const gR  = sx(5.0 + hT * 2.0);
        const pg  = ctx.createRadialGradient(px, py, 0, px, py, gR);
        pg.addColorStop(0,   `rgba(212,175,55,${0.52 + hT * 0.14})`);
        pg.addColorStop(0.5, 'rgba(212,175,55,0.06)');
        pg.addColorStop(1,   'rgba(212,175,55,0)');
        ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(px, py, gR, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath(); ctx.arc(px, py, sx(1.0), 0, Math.PI * 2); ctx.fill();
      }
    };

    // ══════════════════════════════════════════════════════════════════════════
    // DRAW: Crystal capsule (YANSY label backing)
    // ══════════════════════════════════════════════════════════════════════════
    const drawCapsule = (cx, cy, w, h) => {
      const x = cx - w / 2, y = cy - h / 2, rad = sx(9);
      ctx.fillStyle = 'rgba(2,1,6,0.93)';
      ctx.beginPath(); ctx.roundRect(x, y, w, h, rad); ctx.fill();
      const ig = ctx.createLinearGradient(cx, y, cx, y + h);
      ig.addColorStop(0,    'rgba(255,255,255,0.060)');
      ig.addColorStop(0.40, 'rgba(255,255,255,0.014)');
      ig.addColorStop(1,    'rgba(0,0,0,0.10)');
      ctx.fillStyle = ig; ctx.beginPath(); ctx.roundRect(x, y, w, h, rad); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.080)'; ctx.lineWidth = 0.75;
      ctx.beginPath(); ctx.roundRect(x, y, w, h, rad); ctx.stroke();
      const thg = ctx.createLinearGradient(x, y, x + w, y);
      thg.addColorStop(0,    'rgba(255,255,255,0)');
      thg.addColorStop(0.25, 'rgba(255,255,255,0.34)');
      thg.addColorStop(0.75, 'rgba(255,255,255,0.34)');
      thg.addColorStop(1,    'rgba(255,255,255,0)');
      ctx.fillStyle = thg; ctx.beginPath(); ctx.roundRect(x, y, w, sx(1.0), [rad, rad, 0, 0]); ctx.fill();
      ctx.strokeStyle = 'rgba(212,175,55,0.12)'; ctx.lineWidth = 0.45;
      ctx.beginPath(); ctx.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, rad); ctx.stroke();
    };

    // ══════════════════════════════════════════════════════════════════════════
    // DRAW: Sphere (the centrepiece)
    // ══════════════════════════════════════════════════════════════════════════
    const drawSphere = (t, pulse, cx, cy, hT, cct, cni, tintRgb, sScale, kpiScale) => {
      const r   = sx(SR) * sScale;
      const deg = Math.PI / 180;
      const hx  = cx - r * (0.24 + S.tX * 0.06);
      const hy  = cy - r * (0.26 + S.tY * 0.06);
      const mx2 = cx + Math.cos(t * 0.22) * r * 0.14;
      const my2 = cy - r * 0.32 + Math.sin(t * 0.15) * r * 0.08;

      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();

      // Body gradient
      const glow = hT * 9 + cct * 6;
      const [cr, cg2, cb] = tintRgb
        ? [lerp(212, tintRgb[0], cct * 0.50), lerp(175, tintRgb[1], cct * 0.50), lerp(55, tintRgb[2], cct * 0.50)]
        : [212, 175, 55];
      let g = ctx.createRadialGradient(hx, hy, 0, cx, cy, r * 1.05);
      g.addColorStop(0,    `rgba(${21+glow|0},${18+glow|0},${44+(glow*2)|0},1)`);
      g.addColorStop(0.40, 'rgba(9,8,19,1)');
      g.addColorStop(0.72, 'rgba(3,2,7,1)');
      g.addColorStop(1,    'rgba(0,0,0,1)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r * 1.05, 0, Math.PI * 2); ctx.fill();

      // Internal active-node color bleed
      if (cct > 0.01 && tintRgb) {
        const [ir, ig2, ib] = tintRgb;
        const inG = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.85);
        inG.addColorStop(0,   `rgba(${ir},${ig2},${ib},${0.044 + cct * 0.052})`);
        inG.addColorStop(0.5, `rgba(${ir},${ig2},${ib},${0.008 + cct * 0.018})`);
        inG.addColorStop(1,   `rgba(${ir},${ig2},${ib},0)`);
        ctx.fillStyle = inG; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      }

      // Latitude lines
      const ga = (0.046 + pulse * 0.012) * (1 + hT * 0.50 + cct * 0.30);
      for (const lat of [-62, -42, -20, 0, 20, 42, 62]) {
        const rL = r * Math.cos(lat * deg);
        const yL = cy - r * Math.sin(lat * deg) - S.tY * r * 0.040;
        if (rL < 2) continue;
        const falloff = 1 - Math.abs(lat) / 66;
        ctx.strokeStyle = `rgba(${cr|0},${cg2|0},${cb|0},${ga * falloff})`;
        ctx.lineWidth   = 0.28 + hT * 0.08;
        ctx.beginPath(); ctx.ellipse(cx, yL, rL, rL * 0.132, 0, 0, Math.PI * 2); ctx.stroke();
      }

      // Longitude lines (rotating)
      const lonOff = t * (2.5 + hT * 5.0) + S.tX * 12;
      for (const lon of [0, 36, 72, 108, 144]) {
        const cosL = Math.cos((lon + lonOff) * deg);
        const rxL  = r * Math.abs(cosL);
        if (rxL < 1.5) continue;
        ctx.strokeStyle = `rgba(${cr|0},${cg2|0},${cb|0},${ga * Math.abs(cosL) * 0.44})`;
        ctx.lineWidth   = 0.26;
        ctx.beginPath(); ctx.ellipse(cx, cy, rxL, r, 0, 0, Math.PI * 2); ctx.stroke();
      }

      // Primary specular
      g = ctx.createRadialGradient(hx, hy, 0, hx, hy, r * 0.50);
      g.addColorStop(0,    `rgba(255,255,255,${0.155 + pulse * 0.015 + hT * 0.042})`);
      g.addColorStop(0.42, 'rgba(220,230,255,0.024)');
      g.addColorStop(1,    'rgba(220,230,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

      // Secondary moving specular
      g = ctx.createRadialGradient(mx2, my2, 0, mx2, my2, r * 0.30);
      g.addColorStop(0,   `rgba(255,255,255,${0.034 + pulse * 0.010})`);
      g.addColorStop(0.6, 'rgba(255,255,255,0.005)');
      g.addColorStop(1,   'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

      // Tertiary opposite specular
      const s3x = cx + r * 0.28, s3y = cy + r * 0.22;
      g = ctx.createRadialGradient(s3x, s3y, 0, s3x, s3y, r * 0.22);
      g.addColorStop(0, 'rgba(255,255,255,0.013)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

      // Inner pulse ring
      g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.70);
      g.addColorStop(0,    `rgba(${cr|0},${cg2|0},${cb|0},${0.044 + pulse * 0.022 + hT * 0.050})`);
      g.addColorStop(0.55, `rgba(${cr|0},${cg2|0},${cb|0},0.006)`);
      g.addColorStop(1,    `rgba(${cr|0},${cg2|0},${cb|0},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

      // ── Core content ───────────────────────────────────────────────────────
      if (cni < 0) {
        // YANSY label
        const yA = eoc(1 - cct);
        if (yA > 0.01) {
          ctx.save(); ctx.globalAlpha = yA;
          const fs = sx(S.isMobile ? 19 : 21), spacing = sx(4.5);
          const cW = fs * 0.615, wordW = 4 * (cW + spacing) + cW;
          drawCapsule(cx, cy - sx(2), wordW + sx(36), sx(54));
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.font = `900 ${fs}px "Inter",system-ui,sans-serif`;
          ctx.lineJoin = 'round'; ctx.lineWidth = sx(2.2); ctx.strokeStyle = 'rgba(0,0,0,0.30)';
          let sX = cx - (wordW - cW) / 2;
          for (const ch of 'YANSY') { ctx.strokeText(ch, sX, cy - sx(5)); sX += cW + spacing; }
          ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(255,255,255,0.28)'; ctx.shadowBlur = sx(5);
          sX = cx - (wordW - cW) / 2;
          for (const ch of 'YANSY') { ctx.fillText(ch, sX, cy - sx(5)); sX += cW + spacing; }
          ctx.shadowBlur = 0;
          ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(cx - sx(28), cy + sx(7)); ctx.lineTo(cx + sx(28), cy + sx(7)); ctx.stroke();
          const tagFs = sx(S.isMobile ? 6.5 : 7.2);
          ctx.font = `400 ${tagFs}px "Inter",system-ui,sans-serif`;
          ctx.fillStyle = 'rgba(255,255,255,0.58)';
          const tag = 'INTELLIGENCE CORE', tSp = sx(1.6), tCW = tagFs * 0.52;
          let tX = cx - (tag.length - 1) * (tCW + tSp) / 2;
          for (const ch of tag) { ctx.fillText(ch, tX, cy + sx(18)); tX += tCW + tSp; }
          ctx.restore();
        }
      } else {
        // Node KPI
        const node = NODES[cni];
        const [nr, ng2, nb] = node.rgb;
        const nA = eoq(cct);
        if (nA > 0.01) {
          ctx.save();
          ctx.globalAlpha = nA;
          ctx.translate(cx, cy); ctx.scale(kpiScale, kpiScale); ctx.translate(-cx, -cy);
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

          // Label
          const lfs = sx(S.isMobile ? 8 : 9.5);
          ctx.font = `700 ${lfs}px "Inter",system-ui,sans-serif`;
          ctx.fillStyle = `rgb(${nr},${ng2},${nb})`;
          ctx.shadowColor = `rgba(${nr},${ng2},${nb},0.45)`; ctx.shadowBlur = sx(6);
          const lbl = node.label.toUpperCase();
          const lY  = cy - sx(S.isMobile ? 28 : 33);
          ctx.fillText(lbl, cx, lY);
          ctx.shadowBlur = 0;
          // Accent underline
          const lW = ctx.measureText(lbl).width;
          ctx.strokeStyle = `rgba(${nr},${ng2},${nb},0.38)`; ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(cx - lW * 0.44, lY + lfs * 0.68); ctx.lineTo(cx + lW * 0.44, lY + lfs * 0.68); ctx.stroke();

          // Animated stat
          const parsed = parseStat(node.stat);
          let dispStat = node.stat;
          if (parsed) {
            const cp  = S.countProgress[cni];
            const aV  = Math.round(parsed.value * eoq(c01(cp)));
            dispStat  = parsed.prefix + aV + parsed.suffix;
          }
          const sfs = sx(S.isMobile ? 32 : 42);
          ctx.font = `900 ${sfs}px "Inter",system-ui,sans-serif`;
          ctx.lineJoin = 'round'; ctx.lineWidth = sx(2.8); ctx.strokeStyle = 'rgba(0,0,0,0.30)';
          ctx.strokeText(dispStat, cx, cy + sx(S.isMobile ? 2 : 4));
          ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(255,255,255,0.24)'; ctx.shadowBlur = sx(8);
          ctx.fillText(dispStat, cx, cy + sx(S.isMobile ? 2 : 4));
          ctx.shadowBlur = 0;

          // Sub label
          const subfs = sx(S.isMobile ? 8 : 10);
          ctx.font = `400 ${subfs}px "Inter",system-ui,sans-serif`;
          ctx.fillStyle = 'rgba(255,255,255,0.62)';
          ctx.fillText(node.statSub, cx, cy + sx(S.isMobile ? 23 : 30));
          ctx.restore();
        }
      }

      ctx.restore(); // end clip

      // Fresnel rim
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const [fr, fgc, fb] = tintRgb
        ? [lerp(212, tintRgb[0], cct * 0.44), lerp(175, tintRgb[1], cct * 0.44), lerp(55, tintRgb[2], cct * 0.44)]
        : [212, 175, 55];
      g = ctx.createRadialGradient(cx, cy, r * 0.78, cx, cy, r * 1.042);
      g.addColorStop(0,    'rgba(212,175,55,0)');
      g.addColorStop(0.55, `rgba(${fr|0},${fgc|0},${fb|0},${0.056 + pulse * 0.020 + hT * 0.036})`);
      g.addColorStop(0.86, `rgba(${fr|0},${fgc|0},${fb|0},${0.105 + pulse * 0.034 + hT * 0.062})`);
      g.addColorStop(1,    `rgba(${fr|0},${fgc|0},${fb|0},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r * 1.042, 0, Math.PI * 2); ctx.fill();
      const ehg = ctx.createRadialGradient(cx - r * 0.52, cy - r * 0.52, 0, cx - r * 0.52, cy - r * 0.52, r * 0.60);
      ehg.addColorStop(0,   'rgba(255,255,255,0.052)');
      ehg.addColorStop(0.5, 'rgba(255,255,255,0.012)');
      ehg.addColorStop(1,   'rgba(255,255,255,0)');
      ctx.fillStyle = ehg; ctx.beginPath(); ctx.arc(cx, cy, r * 1.02, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    // ══════════════════════════════════════════════════════════════════════════
    // DRAW: Spark particles (node-change)
    // ══════════════════════════════════════════════════════════════════════════
    const drawParticles = () => {
      for (const p of S.particles) {
        const t = c01(p.t / p.dur), e = eoc(t);
        const x = lerp(p.x, p.tx, e), y = lerp(p.y, p.ty, e);
        const a = t < 0.3 ? t / 0.3 : 1 - (t - 0.3) / 0.7;
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${a * 0.78})`;
        ctx.beginPath(); ctx.arc(x, y, p.size * (1 - t * 0.5), 0, Math.PI * 2); ctx.fill();
      }
    };

    // ══════════════════════════════════════════════════════════════════════════
    // DRAW: Ecosystem nodes + energy lines + flow particles
    // ══════════════════════════════════════════════════════════════════════════
    const drawEcosystem = (cx, cy, hT, activeNode, cycleNode, cycleT, sScale) => {
      if (hT < 0.01 && cycleT < 0.01) return;
      const sphereR = sx(SR) * sScale * 0.98;

      NODES.forEach((node, i) => {
        // Node presence
        let nodePresence;
        if (S.hovered || S.tapOpen) {
          const stagger = (i / N) * 0.22;
          nodePresence  = eoc(c01((hT - stagger) / (1 - stagger)));
        } else {
          nodePresence = i === cycleNode ? eoc(cycleT) : 0;
        }
        if (nodePresence < 0.01) return;

        const nhT      = S.nodeHoverT[i];
        const isActive = activeNode === i;
        const isDimmed = activeNode >= 0 && !isActive;
        const dA       = nodePresence * (isDimmed ? 0.16 : 1.0);
        const [r, g, b] = node.rgb;

        const dist = sx(nodeDist(node));
        const nx   = cx + Math.cos(node.angle) * dist + S.nodeMagX[i];
        const ny   = cy + Math.sin(node.angle) * dist + S.nodeMagY[i];
        const ox   = cx + Math.cos(node.angle) * sphereR;
        const oy   = cy + Math.sin(node.angle) * sphereR;
        const px   = lerp(ox, nx, nodePresence);
        const py   = lerp(oy, ny, nodePresence);

        ctx.save(); ctx.globalAlpha = dA;

        // Connection line (base)
        const lA = lerp(0.42, 0.92, nhT) * nodePresence;
        const tGr = ctx.createLinearGradient(ox, oy, px, py);
        tGr.addColorStop(0,    `rgba(${r},${g},${b},${lA})`);
        tGr.addColorStop(0.58, `rgba(${r},${g},${b},${lA * 0.22})`);
        tGr.addColorStop(1,    `rgba(${r},${g},${b},0)`);
        ctx.strokeStyle = tGr;
        ctx.lineWidth   = isActive ? lerp(2.0, 3.6, nhT) : lerp(1.2, 2.0, nhT);
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(px, py); ctx.stroke();

        // Flow particles along line
        if (nodePresence > 0.28 && !reduced) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          const ldx = px - ox, ldy = py - oy;
          for (let j = 0; j < FLOW_PER_LINE; j++) {
            const phase = S.flowPhases[i * FLOW_PER_LINE + j];
            const fpx   = ox + ldx * phase;
            const fpy   = oy + ldy * phase;
            const fA    = Math.sin(phase * Math.PI) * 0.55 * nodePresence * (isActive ? 1.0 : 0.52);
            const fSz   = sx(1.4 + phase * 0.7) * (isActive ? 1.35 : 1.0);
            const fpg   = ctx.createRadialGradient(fpx, fpy, 0, fpx, fpy, fSz * 2.8);
            fpg.addColorStop(0,   `rgba(${r},${g},${b},${fA})`);
            fpg.addColorStop(0.5, `rgba(${r},${g},${b},${fA * 0.18})`);
            fpg.addColorStop(1,   `rgba(${r},${g},${b},0)`);
            ctx.fillStyle = fpg; ctx.beginPath(); ctx.arc(fpx, fpy, fSz * 2.8, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = `rgba(255,255,255,${fA * 0.82})`;
            ctx.beginPath(); ctx.arc(fpx, fpy, fSz * 0.45, 0, Math.PI * 2); ctx.fill();
          }
          ctx.restore();
        }

        // Glow halo
        const glowR = sx(lerp(isActive ? 46 : 38, isActive ? 70 : 58, nhT)) * nodePresence;
        const glowG = ctx.createRadialGradient(px, py, 0, px, py, glowR);
        glowG.addColorStop(0,    `rgba(${r},${g},${b},${lerp(isActive ? 0.24 : 0.14, isActive ? 0.44 : 0.30, nhT) * nodePresence})`);
        glowG.addColorStop(0.45, `rgba(${r},${g},${b},${lerp(0.04, 0.13, nhT) * nodePresence})`);
        glowG.addColorStop(1,    `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = glowG; ctx.beginPath(); ctx.arc(px, py, glowR, 0, Math.PI * 2); ctx.fill();

        // Additive inner orb
        const orbR = sx(isActive ? lerp(18, 27, nhT) : lerp(14, 21, nhT)) * nodePresence;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const oG = ctx.createRadialGradient(px, py, 0, px, py, orbR);
        oG.addColorStop(0,   `rgba(${r},${g},${b},${lerp(0.68, 0.92, nhT) * nodePresence})`);
        oG.addColorStop(0.5, `rgba(${r},${g},${b},${lerp(0.22, 0.44, nhT) * nodePresence})`);
        oG.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = oG; ctx.beginPath(); ctx.arc(px, py, orbR, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // Solid disk
        const solidR = sx(isActive ? lerp(6, 9.5, nhT) : lerp(4.5, 7.5, nhT)) * nodePresence;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath(); ctx.arc(px, py, solidR, 0, Math.PI * 2); ctx.fill();

        // White hot core
        ctx.fillStyle = 'rgba(255,255,255,0.96)';
        ctx.beginPath(); ctx.arc(px, py, sx(lerp(2.0, 3.4, nhT)) * nodePresence, 0, Math.PI * 2); ctx.fill();

        // Hover ring
        if (nhT > 0.05) {
          ctx.strokeStyle = `rgba(${r},${g},${b},${nhT * 0.44 * nodePresence})`;
          ctx.lineWidth   = 1.2 * nhT;
          ctx.beginPath(); ctx.arc(px, py, sx(lerp(22, 38, nhT)) * nodePresence, 0, Math.PI * 2); ctx.stroke();
        }

        // Active dual pulse rings
        if (isActive && nhT > 0.30) {
          const pp1 = 0.5 + 0.5 * Math.sin(Date.now() * 0.00285);
          ctx.strokeStyle = `rgba(${r},${g},${b},${nhT * 0.14 * nodePresence})`;
          ctx.lineWidth   = 0.65;
          ctx.beginPath(); ctx.arc(px, py, sx(lerp(28, 48, nhT) * (1 + pp1 * 0.08)) * nodePresence, 0, Math.PI * 2); ctx.stroke();
          const pp2 = 0.5 + 0.5 * Math.sin(Date.now() * 0.00190 + 1.4);
          ctx.strokeStyle = `rgba(${r},${g},${b},${nhT * 0.08 * nodePresence})`;
          ctx.lineWidth   = 0.48;
          ctx.beginPath(); ctx.arc(px, py, sx(lerp(36, 60, nhT) * (1 + pp2 * 0.06)) * nodePresence, 0, Math.PI * 2); ctx.stroke();
        }

        // Premium glass label
        if (nodePresence > 0.25) {
          const lA2  = c01((nodePresence - 0.25) / 0.75);
          const fs   = sx(S.isMobile ? 13 : 15.5);
          const padX = sx(9), padY = sx(5.5);
          ctx.font = `600 ${fs}px "Inter",system-ui,sans-serif`;
          ctx.textAlign = 'center';
          const labelDir = Math.sin(node.angle) >= 0 ? 1 : -1;
          const labelY   = py + labelDir * sx(S.isMobile ? 24 : 28);
          const tw       = ctx.measureText(node.label).width;
          ctx.globalAlpha = dA * lA2;

          // Pill background
          const pX = px - tw / 2 - padX, pY = labelY - fs / 2 - padY;
          const pW = tw + padX * 2, pH = fs + padY * 2, pR = sx(5);
          ctx.fillStyle = 'rgba(3,2,9,0.88)';
          ctx.beginPath(); ctx.roundRect(pX, pY, pW, pH, pR); ctx.fill();
          // Pill top sheen
          const shG = ctx.createLinearGradient(pX, pY, pX, pY + pH);
          shG.addColorStop(0,   'rgba(255,255,255,0.065)');
          shG.addColorStop(0.5, 'rgba(255,255,255,0.012)');
          shG.addColorStop(1,   'rgba(0,0,0,0.04)');
          ctx.fillStyle = shG; ctx.beginPath(); ctx.roundRect(pX, pY, pW, pH, pR); ctx.fill();
          // Pill border (node-colored)
          ctx.strokeStyle = `rgba(${r},${g},${b},${0.24 + nhT * 0.20})`; ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.roundRect(pX, pY, pW, pH, pR); ctx.stroke();
          // Accent dot
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.shadowColor = `rgba(${r},${g},${b},0.55)`; ctx.shadowBlur = sx(3);
          ctx.beginPath(); ctx.arc(pX + sx(5.5), labelY + fs * 0.06, sx(2.0), 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
          // Label text
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.shadowColor = `rgba(${r},${g},${b},0.30)`; ctx.shadowBlur = sx(3);
          ctx.fillText(node.label, px + sx(3), labelY + fs * 0.35);
          ctx.shadowBlur = 0;
        }

        ctx.restore();
      });
    };

    // ══════════════════════════════════════════════════════════════════════════
    // MAIN LOOP
    // ══════════════════════════════════════════════════════════════════════════
    let raf = null, prev = 0, dt = 0;

    const tick = ts => {
      if (!S.ts0) S.ts0 = ts;
      const elapsed = (ts - S.ts0) / 1000;
      dt = Math.min((ts - prev) / 1000, 0.050);
      prev = ts;
      const t = ts / 1000;

      if (elapsed > 2.0 && !S.cycleActive) S.cycleActive = true;

      // Hover spring
      const hSp = spring(S.hoverT, S.hovered ? 1 : 0, S.hoverVel, dt, 50, 70);
      S.hoverT = c01(hSp.val); S.hoverVel = hSp.vel;
      const hT = eiiq(S.hoverT);

      // Sphere scale + breathing
      const breathe   = reduced ? 0 : 0.010 * Math.sin(t * (Math.PI * 2 / 7.5));
      let scaleTarget = SCALE_RESTING + (S.hovered ? 0 : breathe);
      if (S.activeNode >= 0) scaleTarget = SCALE_ACTIVE;
      else if (S.hovered)    scaleTarget = SCALE_HOVER;
      const sSp = spring(S.scaleVal, scaleTarget, S.scaleVel, dt, 165, 25);
      S.scaleVal = clamp(sSp.val, SCALE_RESTING * 0.98, SCALE_ACTIVE * 1.02);
      S.scaleVel = sSp.vel;

      // Auto-cycle
      if (S.cycleActive && !S.hovered && !S.tapOpen) {
        S.cycleTimer += dt;
        const tLeft = CYCLE_INTERVAL - S.cycleTimer;
        if (S.cycleTimer < CYCLE_TRANSITION)  S.cycleT = c01(S.cycleTimer / CYCLE_TRANSITION);
        else if (tLeft < CYCLE_TRANSITION)     S.cycleT = c01(tLeft / CYCLE_TRANSITION);
        else                                   S.cycleT = 1;
        if (S.cycleTimer >= CYCLE_INTERVAL) { S.cycleTimer = 0; S.cycleNode = (S.cycleNode + 1) % N; }
      } else if (S.hovered || S.tapOpen) {
        S.cycleT = Math.max(0, S.cycleT - dt * 5);
      }

      // Core display node target
      let targetCore = -1;
      if (S.activeNode >= 0) targetCore = S.activeNode;
      else if (!S.hovered && !S.tapOpen && S.cycleActive && S.cycleT > 0.04) targetCore = S.cycleNode;

      // Two-phase ghost-free transition
      if (targetCore !== S.coreNode) {
        if (S.coreContentT > 0.005) {
          S.coreContentT = Math.max(0, S.coreContentT - dt * 20);
        } else {
          S.coreContentT = 0;
          S.coreNode     = targetCore;
          S.kpiScaleVal  = 0.93; S.kpiScaleVel = 0;
          if (targetCore >= 0) S.countProgress[targetCore] = 0;
        }
      } else {
        if (S.coreNode >= 0) {
          S.coreContentT += (1 - S.coreContentT) * dt * 4;
          S.countProgress[S.coreNode] = Math.min(1, S.countProgress[S.coreNode] + dt * 1.8);
        } else {
          S.coreContentT -= S.coreContentT * dt * 9;
          if (S.coreContentT < 0.004) S.coreContentT = 0;
        }
      }
      S.coreContentT = c01(S.coreContentT);

      // KPI scale spring
      if (S.coreNode >= 0 && S.coreContentT > 0.01) {
        const kSp = spring(S.kpiScaleVal, 1.0, S.kpiScaleVel, dt, 380, 34);
        S.kpiScaleVal = clamp(kSp.val, 0.91, 1.02); S.kpiScaleVel = kSp.vel;
      }

      // Tilt
      S.tX += (S.mx * 0.75 - S.tX) * dt * 5.0;
      S.tY += (S.my * 0.45 - S.tY) * dt * 5.0;
      const cx = sx(CX) + S.tX * sx(4);
      const cy = sy(CY) + S.tY * sy(2.5);

      // Per-node springs + magnetic
      for (let i = 0; i < N; i++) {
        // Hover spring
        const ns = spring(S.nodeHoverT[i], S.activeNode === i ? 1 : 0, S.nodeHoverV[i], dt, 320, 32);
        S.nodeHoverT[i] = c01(ns.val); S.nodeHoverV[i] = ns.vel;

        // Magnetic pull toward cursor
        if (!S.isMobile && S.hovered) {
          const dist2 = sx(nodeDist(NODES[i]));
          const basePx = cx + Math.cos(NODES[i].angle) * dist2;
          const basePy = cy + Math.sin(NODES[i].angle) * dist2;
          const curPx  = (S.mx * 0.5 + 0.5) * S.W;
          const curPy  = (S.my * 0.5 + 0.5) * S.H;
          const d      = Math.hypot(curPx - basePx, curPy - basePy);
          const inf    = Math.max(0, 1 - d / sx(82));
          const mf     = inf * sx(4.5);
          const mtX    = d > 0.5 ? (curPx - basePx) / d * mf : 0;
          const mtY    = d > 0.5 ? (curPy - basePy) / d * mf : 0;
          const mxSp   = spring(S.nodeMagX[i], mtX, S.nodeMagVX[i], dt, 120, 18);
          const mySp   = spring(S.nodeMagY[i], mtY, S.nodeMagVY[i], dt, 120, 18);
          S.nodeMagX[i] = mxSp.val; S.nodeMagVX[i] = mxSp.vel;
          S.nodeMagY[i] = mySp.val; S.nodeMagVY[i] = mySp.vel;
        } else {
          const mxSp = spring(S.nodeMagX[i], 0, S.nodeMagVX[i], dt, 120, 18);
          const mySp = spring(S.nodeMagY[i], 0, S.nodeMagVY[i], dt, 120, 18);
          S.nodeMagX[i] = mxSp.val; S.nodeMagVX[i] = mxSp.vel;
          S.nodeMagY[i] = mySp.val; S.nodeMagVY[i] = mySp.vel;
        }

        // Flow phase update
        const np  = (S.hovered || S.tapOpen) || (i === S.cycleNode && S.cycleT > 0);
        const fsp = S.activeNode === i ? 2.2 : (S.hovered ? 1.4 : 0.8);
        if (np) {
          for (let j = 0; j < FLOW_PER_LINE; j++) {
            const pi = i * FLOW_PER_LINE + j;
            S.flowPhases[pi] = (S.flowPhases[pi] + dt * FLOW_SPEED * fsp) % 1;
          }
        }
      }

      // Spark particles + node hover audio (triggered on activeNode change)
      if (S.activeNode >= 0 && S.activeNode !== S.prevActiveNode) {
        spawnParticles(S.activeNode, cx, cy);
        if (AM.interacted) AM.playNodeHover(); // KPI activation feedback
        S.prevActiveNode = S.activeNode;
      } else if (S.activeNode < 0) {
        S.prevActiveNode = -1;
      }
      S.particles = S.particles.filter(p => { p.t += dt; return p.t < p.dur; });

      // ── Audio sync — synchronized to animation signals ─────────────────────
      if (AM.interacted) {
        const isExpanded = S.hovered || S.tapOpen;

        // Expansion start edge (collapsed → expanded)
        if (isExpanded && !S.audioPrevHovered) {
          // Reset per-cycle flags so sounds play fresh each expansion
          S.audioCoreExpFired   = false;
          S.audioExpCompFired   = false;
          S.audioNodeWasVisible.fill(false);
          AM.playCoreExpand(); // AI core activation charge
        }
        // Collapse edge — reset flags for next expansion
        if (!isExpanded && S.audioPrevHovered) {
          S.audioCoreExpFired   = false;
          S.audioExpCompFired   = false;
          S.audioNodeWasVisible.fill(false);
        }
        S.audioPrevHovered = isExpanded;

        // Node reveal sounds — fire as each node crosses visibility threshold,
        // throttled to 400 ms to prevent spam during fast expansions
        if (isExpanded) {
          for (let i = 0; i < N; i++) {
            const stagger     = (i / N) * 0.22;
            const nodePresence = eoc(c01((hT - stagger) / (1 - stagger)));
            if (nodePresence > 0.06 && !S.audioNodeWasVisible[i]) {
              S.audioNodeWasVisible[i] = true;
              AM.playNodeReveal(); // digital network activation
            }
          }
        }

        // Expansion complete — luxury impact when ecosystem fully revealed
        if (isExpanded && hT > 0.94) {
          AM.playExpansionComplete();
        }
      }

      // ── Render ────────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, S.W, S.H);
      const fadeIn = reduced ? 1 : eoc(elapsed / 1.8);
      ctx.save(); ctx.globalAlpha = Math.min(1, fadeIn);

      const pulse   = 0.5 + 0.5 * Math.sin(t * 0.38);
      const tintRgb = S.coreNode >= 0 ? NODES[S.coreNode].rgb : null;

      drawAmbientField(t, hT);
      drawAtmosphere(pulse, cx, cy, hT, tintRgb);
      drawGridPlane(cx, cy, hT, t);
      drawOrbit(t, cx, cy, hT, S.scaleVal);
      drawParticles();
      drawSphere(t, pulse, cx, cy, hT, S.coreContentT, S.coreNode, tintRgb, S.scaleVal, S.kpiScaleVal);
      drawEcosystem(cx, cy, hT, S.activeNode, S.cycleNode, S.cycleT, S.scaleVal);

      ctx.restore();
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    const ro = new ResizeObserver(() => { ctx.setTransform(1, 0, 0, 1, 0, 0); resize(); });
    ro.observe(canvas.parentElement);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('mousemove',  onMouseMove);
      canvas.removeEventListener('mouseenter', onMouseEnter);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('touchstart', onTouchStart);
      AM.cleanup();
      window.removeEventListener('pointerdown', onFirstInteract);
      window.removeEventListener('keydown',     onFirstInteract);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={wrapperRef}
      className={styles.root}
      role="img"
      aria-label="YANSY intelligence core — interactive digital ecosystem"
    >
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
});

HeroDemo.displayName = 'HeroDemo';
export default HeroDemo;
