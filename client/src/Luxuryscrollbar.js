// ═══════════════════════════════════════════════════════════════
//  YANSY — Luxury Scrollbar Effect  "Magnetic Gold Thread"
//
//  Usage in App.jsx:
//    import { initLuxuryScrollbar } from './luxuryScrollbar';
//    useEffect(() => { const d = initLuxuryScrollbar(); return d; }, []);
// ═══════════════════════════════════════════════════════════════

export function initLuxuryScrollbar() {
    /* ── canvas ─────────────────────────────────────────────── */
    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, {
      position:      'fixed',
      top:           '0',
      right:         '0',
      width:         '3px',
      height:        '100vh',
      pointerEvents: 'none',
      zIndex:        '9999',
      overflow:      'visible',
    });
    document.body.appendChild(canvas);
  
    const dpr = window.devicePixelRatio || 1;
    const W   = 3;
    let   H   = window.innerHeight;
  
    const resize = () => {
      H = window.innerHeight;
      canvas.width  = W  * dpr;
      canvas.height = H  * dpr;
      canvas.style.height = H + 'px';
      ctx.scale(dpr, dpr);
    };
  
    const ctx = canvas.getContext('2d');
    resize();
  
    /* ── state ──────────────────────────────────────────────── */
    const GOLD  = '#d4af37';
    const GOLDL = '#f4d03f';
    const GOLDD = '#b8860b';
  
    let scrollRatio = 0;
    let targetRatio = 0;
    let velocity    = 0;
    let lastY       = 0;
    let isScrolling = false;
    let idleTimer   = null;
    let raf         = null;
  
    // trail: last N thumb positions
    const TRAIL_LEN = 28;
    const trail     = [];
  
    // floating orbs
    const orbs = Array.from({ length: 5 }, () => ({
      y:     Math.random() * H,
      vy:    (Math.random() - 0.5) * 0.18,
      alpha: Math.random() * 0.18 + 0.04,
      r:     Math.random() * 1.2 + 0.4,
    }));
  
    /* ── helpers ────────────────────────────────────────────── */
    const MARGIN   = 8;
    const thumbPx  = () => MARGIN + scrollRatio * (H - MARGIN * 2);
  
    function lerp(a, b, t) { return a + (b - a) * t; }
  
    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  
    /* ── render ─────────────────────────────────────────────── */
    function render() {
      ctx.clearRect(0, 0, W, H);
  
      const ty      = thumbPx();
      const spd     = Math.min(1, Math.abs(velocity) / 18); // 0→1
      const isDark  = document.documentElement.classList.contains('dark');
  
      /* ── 1. track line ─────────────────────────────────────── */
      const trackAlpha = isDark ? 0.07 : 0.12;
      ctx.save();
      ctx.strokeStyle = GOLD;
      ctx.globalAlpha = trackAlpha;
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2, MARGIN);
      ctx.lineTo(W / 2, H - MARGIN);
      ctx.stroke();
      ctx.restore();
  
      /* ── 2. filled track (progress above thumb) ────────────── */
      if (ty > MARGIN + 2) {
        const grad = ctx.createLinearGradient(0, MARGIN, 0, ty);
        grad.addColorStop(0,   `rgba(212,175,55,0)`);
        grad.addColorStop(0.6, `rgba(212,175,55,${isDark ? 0.22 : 0.18})`);
        grad.addColorStop(1,   `rgba(212,175,55,${0.5 + spd * 0.35})`);
        ctx.save();
        ctx.strokeStyle = grad;
        ctx.lineWidth   = 1.5;
        ctx.shadowColor = GOLD;
        ctx.shadowBlur  = 4 + spd * 8;
        ctx.beginPath();
        ctx.moveTo(W / 2, MARGIN);
        ctx.lineTo(W / 2, ty - 5);
        ctx.stroke();
        ctx.restore();
      }
  
      /* ── 3. ribbon trail ───────────────────────────────────── */
      if (trail.length > 2) {
        ctx.save();
        for (let i = 1; i < trail.length; i++) {
          const t     = i / trail.length;
          const alpha = easeOutCubic(t) * (0.18 + spd * 0.35);
          const w     = t * (1.2 + spd * 1.2);
  
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = t > 0.7 ? GOLDL : GOLD;
          ctx.lineWidth   = w;
          ctx.shadowColor = GOLD;
          ctx.shadowBlur  = w * 3;
          ctx.beginPath();
          ctx.moveTo(W / 2, trail[i - 1]);
          ctx.lineTo(W / 2, trail[i]);
          ctx.stroke();
        }
        ctx.restore();
      }
  
      /* ── 4. thumb  ─────────────────────────────────────────── */
      // outer soft halo
      const haloR = 6 + spd * 6;
      const halo  = ctx.createRadialGradient(W/2, ty, 0, W/2, ty, haloR);
      halo.addColorStop(0,   `rgba(212,175,55,${0.35 + spd * 0.3})`);
      halo.addColorStop(0.5, `rgba(212,175,55,${0.1  + spd * 0.1})`);
      halo.addColorStop(1,   'rgba(212,175,55,0)');
      ctx.save();
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(W / 2, ty, haloR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
  
      // core diamond
      const diamSize = 2.5 + spd * 1.2;
      ctx.save();
      ctx.shadowColor  = spd > 0.3 ? GOLDL : GOLD;
      ctx.shadowBlur   = 8 + spd * 14;
      ctx.fillStyle    = spd > 0.4 ? GOLDL : GOLD;
      ctx.globalAlpha  = 0.95;
      ctx.beginPath();
      ctx.moveTo(W / 2,              ty - diamSize);   // top
      ctx.lineTo(W / 2 + diamSize * 0.5, ty);          // right
      ctx.lineTo(W / 2,              ty + diamSize);   // bottom
      ctx.lineTo(W / 2 - diamSize * 0.5, ty);          // left
      ctx.closePath();
      ctx.fill();
      ctx.restore();
  
      // inner bright point
      ctx.save();
      ctx.fillStyle   = '#fffde7';
      ctx.globalAlpha = 0.7 + spd * 0.3;
      ctx.shadowColor = '#fff';
      ctx.shadowBlur  = 4;
      ctx.beginPath();
      ctx.arc(W / 2, ty, 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
  
      /* ── 5. floating micro-orbs (ambient) ──────────────────── */
      orbs.forEach(o => {
        o.y += o.vy;
        if (o.y < 0)  o.y = H;
        if (o.y > H)  o.y = 0;
  
        ctx.save();
        ctx.globalAlpha = o.alpha * (isDark ? 1 : 0.6);
        ctx.fillStyle   = GOLD;
        ctx.shadowColor = GOLD;
        ctx.shadowBlur  = 4;
        ctx.beginPath();
        ctx.arc(W / 2, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
  
      /* ── 6. scroll indicator ticks ─────────────────────────── */
      // subtle marks every 20% of the track
      [0.2, 0.4, 0.6, 0.8].forEach(pos => {
        const py = MARGIN + pos * (H - MARGIN * 2);
        ctx.save();
        ctx.globalAlpha = isDark ? 0.1 : 0.08;
        ctx.fillStyle   = GOLD;
        ctx.fillRect(0, py - 0.5, W, 1);
        ctx.restore();
      });
  
      raf = requestAnimationFrame(render);
    }
  
    /* ── scroll listener ────────────────────────────────────── */
    const onScroll = () => {
      const maxScroll  = document.body.scrollHeight - window.innerHeight;
      targetRatio      = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      velocity         = window.scrollY - lastY;
      lastY            = window.scrollY;
      isScrolling      = true;
  
      // smooth lerp to target
      const step = () => {
        scrollRatio = lerp(scrollRatio, targetRatio, 0.12);
        const ty    = thumbPx();
  
        // update trail
        if (trail.length === 0 || Math.abs(trail[trail.length - 1] - ty) > 0.5) {
          trail.push(ty);
          if (trail.length > TRAIL_LEN) trail.shift();
        }
      };
      step();
  
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        isScrolling = false;
        velocity    = 0;
        // fade trail out gradually
        const fade = setInterval(() => {
          if (trail.length > 0) trail.shift();
          else clearInterval(fade);
        }, 20);
      }, 120);
    };
  
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resize);
    render();
  
    /* ── cleanup ─────────────────────────────────────────────── */
    return function destroy() {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
      canvas.remove();
    };
  }