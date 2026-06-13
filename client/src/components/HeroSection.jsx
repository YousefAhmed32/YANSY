import { useState, useEffect, useRef, forwardRef, lazy, Suspense, Component } from "react";
import { trackWhatsAppClick, trackCTAClick } from '../utils/ga4';

const HeroDemo = lazy(() => import('./HeroDemo'));

class HeroDemoBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() {}
  render() { return this.state.hasError ? null : this.props.children; }
}

const HeroSection = forwardRef(function HeroSection({ onStartProject, isRTL }, ref) {
  const [loaded,         setLoaded]         = useState(false);
  const [scrolled,       setScrolled]       = useState(false);
  const [mousePos,       setMousePos]       = useState({ x: 0, y: 0 });
  const [isMobile,       setIsMobile]       = useState(false);
  const [imgError,       setImgError]       = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);

  const sectionRef    = useRef(null);
  const bgParallaxRef = useRef(null);

  const setRefs = (el) => {
    sectionRef.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  };

  useEffect(() => {
    const mq   = window.matchMedia('(max-width: 768px)');
    const rmMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsMobile(mq.matches);
    setPrefersReduced(rmMq.matches);
    const onMQ = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onMQ);
    return () => mq.removeEventListener('change', onMQ);
  }, []);

  /* ── Mouse parallax — ONLY on the section background, NOT capturing canvas events ── */
  useEffect(() => {
    if (isMobile || prefersReduced) return;
    // Listen on the section element only — NOT window
    // This prevents the section from swallowing mouse events before they reach the canvas
    const section = sectionRef.current;
    if (!section) return;
    const onMove = (e) => {
      // Only update parallax for background — canvas handles its own mouse internally
      setMousePos({
        x: (e.clientX / window.innerWidth  - 0.5) * 16,
        y: (e.clientY / window.innerHeight - 0.5) * 8,
      });
    };
    // passive:true = never blocks, never intercepts
    section.addEventListener('mousemove', onMove, { passive: true });
    return () => section.removeEventListener('mousemove', onMove);
  }, [isMobile, prefersReduced]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > 60) setScrolled(true);
      if (bgParallaxRef.current && !isMobile && !prefersReduced) {
        bgParallaxRef.current.style.transform = `translateY(${y * 0.28}px) scale(1.1)`;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isMobile, prefersReduced]);

  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setLoaded(true)));
    return () => cancelAnimationFrame(id);
  }, []);

const copy = {
  badge : isRTL
    ? 'شريكك التقني للنمو · أكثر من 50 مشروع مُسلَّم'
    : 'Technology Partner for Growth · 50+ Projects Delivered',

  h1a   : isRTL
    ? 'نبني مواقع وأنظمة'
    : 'We build websites and systems',

  h1b   : isRTL
    ? 'تزيد مبيعاتك وتنمو مع أعمالك.'
    : 'that drive sales and scale your business.',

  sub   : isRTL
    ? 'من المواقع الاحترافية والمتاجر الإلكترونية إلى منصات SaaS والتطبيقات والأنظمة الداخلية — نصمم ونطور حلولاً رقمية تحقق نتائج حقيقية.'
    : 'From high-converting websites and e-commerce stores to SaaS platforms, mobile apps, and internal systems — we build digital products that deliver measurable results.',

  cta1  : isRTL
    ? 'احجز استشارة مجانية'
    : 'Get Free Strategy Call',

  cta2  : isRTL
    ? 'تحدث معنا مباشرة'
    : 'Talk to us on WhatsApp',

  pills : isRTL
    ? [
        'مواقع احترافية',
        'متاجر إلكترونية',
        'منصات SaaS',
        'تطبيقات موبايل',
        'أتمتة العمليات',
        'أنظمة إدارة وحجز'
      ]
    : [
        'Professional Websites',
        'E-commerce Stores',
        'SaaS Platforms',
        'Mobile Apps',
        'Process Automation',
        'Management Systems'
      ],

  stats : isRTL
    ? [
        { num: '50+', label: 'مشروع مُسلَّم', sub: 'لشركات في قطاعات متعددة' },
        { num: '4+', label: 'سنوات خبرة', sub: 'في بناء المنتجات الرقمية' },
        { num: '98%', label: 'معدل الاحتفاظ', sub: 'بعد أول مشروع' },
        { num: '30d', label: 'متوسط الإطلاق', sub: 'من الاتفاق للنشر' },
      ]
    : [
        { num: '50+', label: 'Projects Delivered', sub: 'Across multiple industries' },
        { num: '4+', label: 'Years of Experience', sub: 'Building digital products' },
        { num: '98%', label: 'Client Retention', sub: 'After the first project' },
        { num: '30d', label: 'Average Launch Time', sub: 'From agreement to deployment' },
      ],

  available: isRTL
    ? 'نقبل مشاريع جديدة — الشهر الحالي'
    : 'Accepting new projects this month',
};

  const fade = (delay = 0) => ({
    opacity   : loaded ? 1 : 0,
    transform : loaded ? 'translateY(0)' : 'translateY(22px)',
    transition: prefersReduced
      ? `opacity .1s ${delay}s`
      : `opacity .6s ${delay}s cubic-bezier(.25,.46,.45,.94), transform .6s ${delay}s cubic-bezier(.25,.46,.45,.94)`,
  });

  const bgParallax = (!isMobile && !prefersReduced)
    ? { transform: `translate(${mousePos.x * 0.3}px,${mousePos.y * 0.3}px) scale(1.07)`,
        transition: 'transform 1.6s cubic-bezier(.25,.46,.45,.94)' }
    : { transform: 'scale(1.03)' };

  return (
    <>
      <style>{`
        .ys-pills-wrap{display:flex;flex-wrap:wrap;gap:8px}
        @media(max-width:640px){
          .ys-pills-wrap{flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:4px}
          .ys-pills-wrap::-webkit-scrollbar{display:none}
        }
        .ys-pill{
          flex-shrink:0;padding:5px 14px;
          border:1px solid rgba(212,175,55,.2);border-radius:0;
          font-size:10px;font-weight:500;text-transform:uppercase;
          color:rgba(212,175,55,.65);white-space:nowrap;
          transition:border-color .3s,color .3s,background .3s;cursor:default;
        }
        [dir="rtl"] .ys-pill{letter-spacing:0}
        [dir="ltr"] .ys-pill{letter-spacing:.06em}
        .ys-pill:hover{border-color:rgba(212,175,55,.5);color:#d4af37;background:rgba(212,175,55,.04)}

        .ys-btn-gold{
          position:relative;overflow:hidden;display:inline-flex;align-items:center;gap:10px;
          padding:14px 36px;background:#d4af37;border:1.5px solid #d4af37;color:#000;
          font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;
          cursor:pointer;transition:background .3s,box-shadow .35s,transform .15s;
          -webkit-tap-highlight-color:transparent;white-space:nowrap;
        }
        .ys-btn-gold::before{
          content:'';position:absolute;inset:0;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent);
          transform:translateX(-100%);transition:transform .6s ease;
        }
        .ys-btn-gold:hover{background:#c9a22a;box-shadow:0 8px 40px rgba(212,175,55,.35)}
        .ys-btn-gold:hover::before{transform:translateX(100%)}
        .ys-btn-gold:active{transform:scale(.97)}

        .ys-btn-ghost{
          display:inline-flex;align-items:center;gap:10px;
          padding:14px 28px;border:1.5px solid rgba(255,255,255,.2);
          background:transparent;color:rgba(255,255,255,.75);
          font-size:11px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;
          text-decoration:none;cursor:pointer;white-space:nowrap;
          transition:border-color .3s,color .3s,background .3s,transform .15s;
          -webkit-tap-highlight-color:transparent;
        }
        .ys-btn-ghost:hover{border-color:rgba(255,255,255,.4);color:#fff;background:rgba(255,255,255,.05)}
        .ys-btn-ghost:active{transform:scale(.97)}

        .ys-ctas{display:flex;flex-wrap:wrap;gap:12px}
        @media(max-width:480px){
          .ys-ctas{flex-direction:column;width:100%}
          .ys-btn-gold,.ys-btn-ghost{width:100%;justify-content:center;padding:clamp(14px,4vw,17px) 20px;font-size:10px}
        }

        .ys-stats{
          display:grid;grid-template-columns:repeat(4,1fr);gap:0;
          border-top:1px solid rgba(255,255,255,.07);border-left:1px solid rgba(255,255,255,.07);
          min-width:0;width:100%;
        }
        @media(max-width:640px){.ys-stats{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:359px){.ys-stat-label{font-size:8px}.ys-stat-sub{display:none}}
        .ys-stat-cell{
          padding:clamp(12px,1.5vh,20px) clamp(10px,1.2vw,16px);
          border-right:1px solid rgba(255,255,255,.07);border-bottom:1px solid rgba(255,255,255,.07);
          transition:background .3s;
        }
        .ys-stat-cell:hover{background:rgba(212,175,55,.03)}
        .ys-stat-num{
          font-family:'Inter',system-ui,sans-serif;font-size:clamp(1.25rem,2.2vw,1.875rem);
          font-weight:700;line-height:1;letter-spacing:-0.03em;color:#d4af37;
          margin-bottom:3px;font-variant-numeric:tabular-nums;
        }
        [dir="rtl"] .ys-stat-num{font-family:'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif;font-weight:700;letter-spacing:0}
        .ys-stat-label{font-size:clamp(9px,1vw,11px);font-weight:500;color:rgba(255,255,255,.75);line-height:1.35}
        [dir="ltr"] .ys-stat-label{letter-spacing:.02em}
        .ys-stat-sub{font-size:clamp(8px,0.85vw,10px);color:rgba(255,255,255,.35);margin-top:2px}
        [dir="rtl"] .ys-stat-cell{text-align:right}

        .ys-available{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border:1px solid rgba(34,197,94,.25);background:rgba(34,197,94,.06)}
        @keyframes ys-pulse-dot{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}
        .ys-live-dot{width:6px;height:6px;border-radius:50%;background:#22c55e;animation:ys-pulse-dot 2.2s ease-in-out infinite}

        @keyframes ys-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .ys-orb-1{animation:ys-float 7s ease-in-out infinite}
        .ys-orb-2{animation:ys-float 9s ease-in-out 1.5s infinite}

        @keyframes ys-drip{0%{transform:translateY(-100%);opacity:0}30%{opacity:1}100%{transform:translateY(100%);opacity:0}}
        .ys-scroll-drip{width:1px;height:44px;overflow:hidden;position:relative;background:rgba(212,175,55,.12)}
        .ys-scroll-drip::after{
          content:'';position:absolute;top:0;left:0;width:100%;height:50%;
          background:linear-gradient(to bottom,transparent,#d4af37);
          animation:ys-drip 2s ease-in-out 1.8s infinite;
        }

        @media(prefers-reduced-motion:reduce){
          .ys-orb-1,.ys-orb-2,.ys-scroll-drip::after,.ys-live-dot{animation:none}
        }

        .yd-grid{display:grid;grid-template-columns:1fr;gap:clamp(20px,5vw,32px);align-items:center}
        @media(min-width:768px){
          .yd-grid{grid-template-columns:minmax(0,11fr) minmax(0,9fr);gap:clamp(28px,3vw,44px);align-items:center}
        }
        @media(min-width:1025px){
          .yd-grid{grid-template-columns:minmax(0,3fr) minmax(0,2fr);gap:clamp(48px,4.5vw,72px)}
        }
        @media(min-width:1440px){
          .yd-grid{grid-template-columns:minmax(0,3fr) minmax(0,2fr);gap:72px}
        }

        /* ── CRITICAL FIX: canvas wrapper must NEVER block pointer events ── */
        .yd-demo-wrapper {
          min-width: 0;
          /* pointer-events default = auto, canvas receives all mouse events */
        }
        .yd-demo-wrapper > * {
          pointer-events: auto !important;
        }
      `}</style>

      <section
        ref={setRefs}
        id="hero"
        dir={isRTL ? 'rtl' : 'ltr'}
        aria-label={isRTL ? 'الرئيسية' : 'Hero'}
        style={{
          position      : 'relative',
          minHeight     : 'clamp(640px,100svh,960px)',
          display       : 'flex',
          flexDirection : 'column',
          justifyContent: 'center',
          overflow      : 'hidden',
          isolation     : 'isolate',
          background    : '#000',
        }}
      >
        {/* Background */}
        <div
          ref={bgParallaxRef}
          aria-hidden
          style={{
            position:'absolute', inset:'-8%',
            backgroundImage: imgError
              ? 'radial-gradient(ellipse 80% 70% at 60% 40%,#1a1408 0%,#000 70%)'
              : "url('/assets/image/GoImage/saas3.png')",
            backgroundSize:'cover', backgroundPosition:'center',
            willChange:'transform',
            // pointer-events:none so BG never blocks canvas
            pointerEvents:'none',
            ...bgParallax,
          }}
        >
          {!imgError && (
            <img
              src="/assets/image/GoImage/saas1.png"
              alt="" aria-hidden
              onError={() => setImgError(true)}
              style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:0,pointerEvents:'none'}}
            />
          )}
        </div>

        {/* Overlays — all pointer-events:none so canvas receives mouse */}
        <div aria-hidden style={{
          position:'absolute',inset:0,pointerEvents:'none',
          background:'linear-gradient(to bottom,rgba(0,0,0,.82) 0%,rgba(0,0,0,.38) 30%,rgba(0,0,0,.45) 60%,rgba(0,0,0,.95) 100%)',
        }}/>
        <div aria-hidden style={{
          position:'absolute',inset:0,pointerEvents:'none',
          background:'linear-gradient(to right,rgba(0,0,0,.5) 0%,transparent 30%,transparent 70%,rgba(0,0,0,.5) 100%)',
        }}/>

        {/* Ambient orbs — pointer-events:none */}
        {!isMobile && (
          <>
            <div aria-hidden className="ys-orb-1" style={{
              position:'absolute',top:'20%',
              right:isRTL?'auto':'12%', left:isRTL?'12%':'auto',
              width:'clamp(180px,22vw,320px)',height:'clamp(180px,22vw,320px)',
              borderRadius:'50%',
              background:'radial-gradient(circle,rgba(212,175,55,.07) 0%,transparent 70%)',
              filter:'blur(40px)',pointerEvents:'none',
            }}/>
            <div aria-hidden className="ys-orb-2" style={{
              position:'absolute',bottom:'25%',
              left:isRTL?'auto':'8%', right:isRTL?'8%':'auto',
              width:'clamp(120px,16vw,220px)',height:'clamp(120px,16vw,220px)',
              borderRadius:'50%',
              background:'radial-gradient(circle,rgba(212,175,55,.04) 0%,transparent 70%)',
              filter:'blur(50px)',pointerEvents:'none',
            }}/>
          </>
        )}

        {/* Corner accents — pointer-events:none */}
        {[
          {top:28,left:28,borderTop:'1px solid rgba(212,175,55,.14)',borderLeft:'1px solid rgba(212,175,55,.14)'},
          {top:28,right:28,borderTop:'1px solid rgba(212,175,55,.14)',borderRight:'1px solid rgba(212,175,55,.14)'},
          {bottom:80,left:28,borderBottom:'1px solid rgba(212,175,55,.14)',borderLeft:'1px solid rgba(212,175,55,.14)'},
          {bottom:80,right:28,borderBottom:'1px solid rgba(212,175,55,.14)',borderRight:'1px solid rgba(212,175,55,.14)'},
        ].map((s, i) => (
          <div key={i} aria-hidden className="hidden md:block"
            style={{position:'absolute',width:48,height:48,pointerEvents:'none',...s}}/>
        ))}

        {/* Main content */}
        <div style={{
          position:'relative', zIndex:10,
          maxWidth:1280, margin:'0 auto', width:'100%',
          padding:'clamp(72px,7vh,88px) clamp(20px,5vw,56px) clamp(40px,5vh,64px)',
        }}>
          <div className="yd-grid">

            {/* Text column */}
            <div style={{textAlign:isRTL?'right':'left', minWidth:0}}>

              {/* Available badge */}
              <div style={{...fade(0), marginBottom:20, display:'flex', justifyContent:isRTL?'flex-end':'flex-start'}}>
                <div className="ys-available">
                  <span className="ys-live-dot" aria-hidden/>
                  <span style={{fontSize:10,fontWeight:500,letterSpacing:isRTL?'0':'.06em',textTransform:'uppercase',color:'rgba(34,197,94,.85)'}}>
                    {copy.available}
                  </span>
                </div>
              </div>

              {/* Badge */}
              <div style={{...fade(0.04), display:'flex', alignItems:'center', gap:12, marginBottom:22,
                flexDirection:isRTL?'row-reverse':'row', justifyContent:isRTL?'flex-end':'flex-start'}}>
                <span aria-hidden style={{display:'inline-block',width:32,height:1,flexShrink:0,
                  background:`linear-gradient(to ${isRTL?'left':'right'},#d4af37,transparent)`}}/>
                <span style={{fontSize:10,fontWeight:500,letterSpacing:isRTL?'0':'.1em',textTransform:'uppercase',color:'rgba(212,175,55,.7)'}}>
                  {copy.badge}
                </span>
              </div>

              {/* H1 */}
              <h1 style={{
                ...fade(0.08),
                fontFamily:isRTL?"'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif":"'Inter',system-ui,sans-serif",
                fontWeight:700, fontSize:'clamp(1.875rem,calc(2.5vw + 1rem),3.875rem)',
                lineHeight:isRTL?1.25:1.08, letterSpacing:isRTL?'0':'-0.03em',
                color:'#fff', margin:'0 0 clamp(12px,1.5vh,20px)', overflowWrap:'break-word',
              }}>
                {copy.h1a}<br/>
                <span style={{
                  backgroundImage:`linear-gradient(${isRTL?'45deg':'135deg'},#d4af37 0%,rgba(255,255,255,.88) 55%)`,
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
                }}>{copy.h1b}</span>
              </h1>

              {/* Sub */}
              <p style={{
                ...fade(0.16),
                fontFamily:isRTL?"'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif":"'Inter',system-ui,sans-serif",
                fontSize:'clamp(0.9375rem,1.2vw,1.0625rem)', fontWeight:400,
                color:'rgba(255,255,255,.65)', margin:'0 0 clamp(20px,2.5vh,32px)',
                lineHeight:isRTL?1.8:1.7, maxWidth:'min(540px,100%)',
              }}>{copy.sub}</p>

              {/* Pills */}
              <div style={{...fade(0.22), marginBottom:'clamp(20px,2.5vh,36px)'}}>
                <div className="ys-pills-wrap" style={{justifyContent:isRTL?'flex-end':'flex-start'}}>
                  {copy.pills.map(p => <span key={p} className="ys-pill">{p}</span>)}
                </div>
              </div>

              {/* CTAs */}
              <div className="ys-ctas" style={{...fade(0.30), marginBottom:'clamp(28px,3.5vh,48px)', justifyContent:isRTL?'flex-end':'flex-start'}}>
                <button onClick={onStartProject} className="ys-btn-gold" aria-label={copy.cta1}>
                  {copy.cta1}
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    aria-hidden style={{transform:isRTL?'rotate(180deg)':'none',flexShrink:0}}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                </button>
                <a href="https://wa.me/201090385390?text=Hello%2C%20I%27d%20like%20to%20discuss%20a%20project"
                  target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsAppClick('hero-section')} className="ys-btn-ghost" aria-label={copy.cta2}>
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" aria-hidden style={{flexShrink:0}}>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  {copy.cta2}
                </a>
              </div>

              {/* Stats */}
              <div style={fade(0.42)}>
                <div className="ys-stats" dir={isRTL?'rtl':'ltr'} style={{maxWidth:'min(520px,100%)'}}>
                  {copy.stats.map((s, i) => (
                    <div key={i} className="ys-stat-cell">
                      <div className="ys-stat-num">{s.num}</div>
                      <div className="ys-stat-label">{s.label}</div>
                      <div className="ys-stat-sub">{s.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Demo column — NO opacity/transform transition on wrapper ── */}
            {/* Removing the transition div that was blocking mouse events    */}
           <div
  className="yd-demo-wrapper"
  style={{
    paddingTop: isMobile ? '40px' : '0',
    paddingBottom: isMobile ? '40px' : '0',
  }}
>
              <HeroDemoBoundary>
                <Suspense fallback={
                  <div style={{width:'100%',aspectRatio:'4 / 3.5',minHeight:'clamp(180px,30vw,420px)'}} aria-hidden/>
                }>
                  {/*
                    CRITICAL: NO wrapping div with opacity/transform transition here.
                    That div was intercepting mouse events before they reached the canvas.
                    The canvas handles its own entrance animation internally.
                  */}
                  <HeroDemo />
                </Suspense>
              </HeroDemoBoundary>
            </div>

          </div>
        </div>

        {/* Scroll indicator */}
          <div aria-hidden style={{
            position:'absolute',bottom:32,left:'50%',transform:'translateX(-50%)',zIndex:10,
            display:'flex',flexDirection:'column',alignItems:'center',gap:8,
            opacity:(loaded && !scrolled)?1:0, transition:'opacity .6s ease',
            pointerEvents:'none',
          }}>
            <div className="ys-scroll-drip"/>
            <span style={{fontSize:8,letterSpacing:'.3em',textTransform:'uppercase',color:'rgba(255,255,255,.2)',fontWeight:300}}>
              {isRTL?'تمرير':'scroll'}
            </span>
          </div>

      </section>
    </>
  );
});

export default HeroSection;