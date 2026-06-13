// ═══════════════════════════════════════════════════════════════
//  YANSY — Electric Scrollbar Effect
//  Paste this inside a useEffect(() => { ... }, []) in App.jsx
//  OR call initElectricScrollbar() once after DOM ready in main.jsx
// ═══════════════════════════════════════════════════════════════

export function initElectricScrollbar() {
    // ── Create canvas ──────────────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.id = 'yansy-electric-scrollbar';
    canvas.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 24px;
      height: 100vh;
      pointer-events: none;
      z-index: 9999;
      overflow: visible;
    `;
    document.body.appendChild(canvas);
  
    const ctx = canvas.getContext('2d');
    let W = 24;
    let H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
  
    // ── State ──────────────────────────────────────────────────
    const particles  = [];
    const sparks     = [];
    let   scrollRatio = 0;   // 0 → 1
    let   lastScroll  = 0;
    let   scrollSpeed = 0;
    let   raf         = null;
    let   active      = false;   // true while scrolling
    let   idleTimer   = null;
  
    // ── Colors ─────────────────────────────────────────────────
    const isDark = () => document.documentElement.classList.contains('dark');
  
    const GOLD   = '#d4af37';
    const GOLDLT = '#fff176';
    const BLUE   = '#00e5ff';
    const WHITE  = '#ffffff';
  
    // ── Helpers ────────────────────────────────────────────────
    function scrollInfo() {
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      return maxScroll > 0 ? window.scrollY / maxScroll : 0;
    }
  
    function thumbY() {
      // pixel position of thumb center on canvas
      const margin = 2;
      return margin + scrollRatio * (H - margin * 2);
    }
  
    // ── Lightning bolt path (jagged) ───────────────────────────
    function lightningPath(x, y1, y2, jag = 3) {
      const pts = [[x, y1]];
      const steps = Math.max(3, Math.round(Math.abs(y2 - y1) / 12));
      for (let i = 1; i < steps; i++) {
        const t  = i / steps;
        const py = y1 + (y2 - y1) * t;
        const px = x + (Math.random() - 0.5) * jag * 2;
        pts.push([px, py]);
      }
      pts.push([x, y2]);
      return pts;
    }
  
    function drawPath(pts, color, alpha, width) {
      if (pts.length < 2) return;
      ctx.save();
      ctx.globalAlpha  = alpha;
      ctx.strokeStyle  = color;
      ctx.lineWidth    = width;
      ctx.lineJoin     = 'round';
      ctx.lineCap      = 'round';
      ctx.shadowColor  = color;
      ctx.shadowBlur   = width * 4;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
      ctx.restore();
    }
  
    // ── Spark particle ─────────────────────────────────────────
    function spawnSpark(x, y, intensity) {
      const count = Math.floor(2 + intensity * 6);
      for (let i = 0; i < count; i++) {
        sparks.push({
          x, y,
          vx: (Math.random() - 0.5) * (2 + intensity * 4),
          vy: (Math.random() - 1.2) * (1 + intensity * 3),
          life: 1,
          decay: 0.04 + Math.random() * 0.06,
          size: 0.8 + Math.random() * 1.5,
          color: Math.random() > 0.4 ? GOLD : (Math.random() > 0.5 ? GOLDLT : WHITE),
        });
      }
    }
  
    // ── Floating energy particle along track ───────────────────
    function spawnTrackParticle() {
      if (!active) return;
      particles.push({
        x: W - 2,
        y: Math.random() * H,
        vy: (Math.random() - 0.5) * 0.6,
        life: 1,
        decay: 0.008 + Math.random() * 0.01,
        size: 0.5 + Math.random(),
        color: Math.random() > 0.5 ? GOLD : GOLDLT,
      });
    }
  
    // ── Draw thumb glow orb ────────────────────────────────────
    function drawThumb(ty, intensity) {
      const x = W - 2;
  
      // outer glow
      const g = ctx.createRadialGradient(x, ty, 0, x, ty, 10 + intensity * 8);
      g.addColorStop(0,   `rgba(212,175,55,${0.5 + intensity * 0.4})`);
      g.addColorStop(0.4, `rgba(212,175,55,${0.15 + intensity * 0.2})`);
      g.addColorStop(1,   'rgba(212,175,55,0)');
      ctx.save();
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, ty, 12 + intensity * 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
  
      // core dot
      ctx.save();
      ctx.shadowColor  = intensity > 0.3 ? GOLDLT : GOLD;
      ctx.shadowBlur   = 8 + intensity * 14;
      ctx.fillStyle    = intensity > 0.3 ? GOLDLT : GOLD;
      ctx.beginPath();
      ctx.arc(x, ty, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  
    // ── Draw track line ────────────────────────────────────────
    function drawTrack(ty, intensity) {
      const x = W - 2;
      // top segment
      if (ty > 4) {
        const tg = ctx.createLinearGradient(0, 0, 0, ty);
        tg.addColorStop(0,   'rgba(212,175,55,0)');
        tg.addColorStop(0.7, `rgba(212,175,55,${0.06 + intensity * 0.06})`);
        tg.addColorStop(1,   `rgba(212,175,55,${0.2 + intensity * 0.3})`);
        ctx.save();
        ctx.strokeStyle = tg;
        ctx.lineWidth   = 2;
        ctx.shadowColor = GOLD;
        ctx.shadowBlur  = intensity * 6;
        ctx.beginPath();
        ctx.moveTo(x, 2);
        ctx.lineTo(x, ty - 5);
        ctx.stroke();
        ctx.restore();
      }
      // bottom segment
      if (ty < H - 4) {
        const bg = ctx.createLinearGradient(0, ty, 0, H);
        bg.addColorStop(0,   `rgba(212,175,55,${0.12 + intensity * 0.15})`);
        bg.addColorStop(1,   'rgba(212,175,55,0)');
        ctx.save();
        ctx.strokeStyle = bg;
        ctx.lineWidth   = 2;
        ctx.shadowColor = GOLD;
        ctx.shadowBlur  = intensity * 4;
        ctx.beginPath();
        ctx.moveTo(x, ty + 5);
        ctx.lineTo(x, H - 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  
    // ── Main render loop ───────────────────────────────────────
    function render() {
      ctx.clearRect(0, 0, W, H);
  
      scrollRatio = scrollInfo();
      const ty    = thumbY();
      const spd   = Math.min(1, Math.abs(scrollSpeed) / 30);
  
      // track
      drawTrack(ty, spd);
  
      // ---- lightning bolts when scrolling fast ---------------
      if (spd > 0.15) {
        const bolts = Math.floor(1 + spd * 2);
        for (let b = 0; b < bolts; b++) {
          const flip  = Math.random() > 0.5;
          const y1    = flip ? ty : ty - 20 - Math.random() * 40;
          const y2    = flip ? ty + 20 + Math.random() * 40 : ty;
          const pts   = lightningPath(W - 2, y1, y2, 4);
          const alpha = 0.3 + spd * 0.6 + Math.random() * 0.2;
  
          // core bolt
          drawPath(pts, GOLDLT, alpha * 0.9, 0.7);
          // glow bolt
          drawPath(pts, GOLD,   alpha * 0.5, 2.5);
  
          // occasional blue arc
          if (Math.random() > 0.6 && spd > 0.4) {
            const pts2 = lightningPath(W - 2, ty, ty + (Math.random()-0.5)*60, 6);
            drawPath(pts2, BLUE, 0.3 + spd * 0.4, 0.5);
          }
  
          // sparks at bolt end
          if (Math.random() > 0.5) spawnSpark(W - 2, y2, spd);
        }
      }
  
      // ---- thumb orb ------------------------------------------
      drawThumb(ty, spd);
  
      // ---- sparks ---------------------------------------------
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x   += s.vx;
        s.y   += s.vy;
        s.vy  += 0.12;   // gravity
        s.life -= s.decay;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
  
        ctx.save();
        ctx.globalAlpha = s.life;
        ctx.shadowColor = s.color;
        ctx.shadowBlur  = 6;
        ctx.fillStyle   = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
  
      // ---- track particles ------------------------------------
      if (active && Math.random() > 0.7) spawnTrackParticle();
  
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.y    += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
  
        ctx.save();
        ctx.globalAlpha = p.life * 0.6;
        ctx.fillStyle   = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur  = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
  
      raf = requestAnimationFrame(render);
    }
  
    // ── Scroll listener ────────────────────────────────────────
    function onScroll() {
      const now  = window.scrollY;
      scrollSpeed = now - lastScroll;
      lastScroll  = now;
      active      = true;
  
      // burst sparks on fast scroll
      if (Math.abs(scrollSpeed) > 8) {
        spawnSpark(W - 2, thumbY(), Math.min(1, Math.abs(scrollSpeed) / 40));
      }
  
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        active      = false;
        scrollSpeed = 0;
      }, 150);
    }
  
    // ── Resize ─────────────────────────────────────────────────
    function onResize() {
      H = window.innerHeight;
      canvas.height = H;
    }
  
    // ── Boot ───────────────────────────────────────────────────
    window.addEventListener('scroll',  onScroll, { passive: true });
    window.addEventListener('resize',  onResize);
    render();
  
    // ── Cleanup (call if component unmounts) ───────────────────
    return function destroy() {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
      canvas.remove();
    };
  }