
import { useState } from 'react';
import { getProcessSteps } from '../data/processSteps';

const ProcessSection = ({ sectionRef, processRef, isRTL, onStartProject }) => {
  const [active, setActive] = useState(null);
  const steps = getProcessSteps(isRTL);

  return (
    <section
      id="process"
      ref={sectionRef}
      className="relative py-24 sm:py-40 px-4 sm:px-8 bg-black overflow-hidden"
    >
      {/* Ambient glows */}
      <div aria-hidden className="absolute top-1/3 left-0 w-[40vw] h-[40vw] rounded-full opacity-[0.025] pointer-events-none"
        style={{ background:'radial-gradient(circle,#d4af37 0%,transparent 70%)', filter:'blur(60px)' }} />
      <div aria-hidden className="absolute bottom-1/3 right-0 w-[30vw] h-[30vw] rounded-full opacity-[0.02] pointer-events-none"
        style={{ background:'radial-gradient(circle,#d4af37 0%,transparent 70%)', filter:'blur(80px)' }} />

      <div className={`max-w-6xl mx-auto relative z-10 ${isRTL ? 'text-right' : 'text-left'}`}>

        {/* Header */}
        <div className="mb-16 sm:mb-24">
          <p className="text-xs tracking-[.1em] text-[#d4af37]/65 uppercase mb-4 font-medium">
            {isRTL ? 'العملية — واضحة ومضمونة' : 'Process — transparent by design'}
          </p>
          <h2 className={`text-3xl sm:text-5xl lg:text-6xl font-semibold leading-[1.08] mb-6 ${isRTL ? '' : 'tracking-tight'}`}
            style={{ letterSpacing: isRTL ? '0' : '-0.025em' }}>
            {isRTL ? 'من اليوم الأول ' : 'From day one '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-white">
              {isRTL ? 'تعرف ما يحدث.' : 'you know what\'s happening.'}
            </span>
          </h2>
          <p className="text-base sm:text-lg text-white/62 max-w-2xl">
            {isRTL
              ? 'لا أسابيع صامتة، لا مفاجآت في التسليم، لا تجاوز في الميزانية. نبني بالشفافية الكاملة — ترى التقدم كل أسبوع.'
              : 'No silent weeks, no delivery surprises, no budget overruns. We build with full transparency — you see progress every week.'}
          </p>
        </div>

        {/* ── Desktop: 2-column grid (4+4) ── */}
        {/* UX Fix: بدل snake — grid بسيط مرقّم بوضوح */}
        <div className="hidden lg:grid grid-cols-2 gap-x-16 gap-y-0">
          {/* Column A: steps 1-4 */}
          <div className="space-y-0">
            {steps.slice(0,4).map((step, i) => (
              <DesktopStep key={step.num} step={step} idx={i}
                active={active} setActive={setActive}
                refCb={(el) => (processRef.current[i] = el)}
                isRTL={isRTL} isLast={i === 3} />
            ))}
          </div>
          {/* Column B: steps 5-8 */}
          <div className="space-y-0 mt-12">
            {steps.slice(4,8).map((step, i) => (
              <DesktopStep key={step.num} step={step} idx={i+4}
                active={active} setActive={setActive}
                refCb={(el) => (processRef.current[i+4] = el)}
                isRTL={isRTL} isLast={i === 3} />
            ))}
          </div>
        </div>

        {/* ── Mobile: vertical accordion ── */}
        <div className="lg:hidden">
          {steps.map((step, i) => (
            <MobileStep key={step.num} step={step} idx={i}
              active={active} setActive={setActive}
              isRTL={isRTL} isLast={i === steps.length - 1} />
          ))}
        </div>

        {/* CTA */}
        <div className={`mt-16 sm:mt-24 flex flex-col sm:flex-row gap-4 items-center justify-center ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
          <button onClick={onStartProject}
            className="group relative inline-flex items-center gap-3 px-10 py-4 border-2 border-[#d4af37] text-[#d4af37] text-xs font-light tracking-widest uppercase hover:bg-[#d4af37] hover:text-black transition-all duration-500 active:scale-95 overflow-hidden">
            {/* Shimmer sweeps in reading direction */}
            <span className={`absolute inset-0 transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent ${isRTL ? 'translate-x-full group-hover:-translate-x-full' : '-translate-x-full group-hover:translate-x-full'}`} />
            <span className="relative">{isRTL ? 'ابدأ مشروعك الآن' : 'Start Your Project Now'}</span>
            {/* Arrow flips in RTL and nudges toward start on hover */}
            <svg
              className={`relative w-4 h-4 flex-shrink-0 transition-transform duration-300 ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          <p className="text-xs text-white/30 text-center">
            {isRTL ? 'استشارة مجانية • بدون التزام • رد خلال 24 ساعة'
                    : 'Free consultation • No obligation • Reply within 24h'}
          </p>
        </div>
      </div>
    </section>
  );
};

/* ── Desktop Step Row ───────────────────────────────────────── */
const DesktopStep = ({ step, idx, active, setActive, refCb, isRTL, isLast }) => {
  const isActive = active === idx;
  return (
    <div ref={refCb}
      /* flex-row-reverse in RTL: timeline circle moves to the end (right) side */
      className={`group relative flex gap-5 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}
      style={{ paddingBottom: isLast ? 0 : '2rem' }}
      onMouseEnter={() => setActive(idx)}
      onMouseLeave={() => setActive(null)}
    >
      {/* Timeline column */}
      <div className="flex flex-col items-center flex-shrink-0 w-12">
        {/* Circle */}
        <div className="relative w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-400 flex-shrink-0 z-10"
          style={{
            borderColor    : isActive ? step.color : 'rgba(255,255,255,.12)',
            backgroundColor: isActive ? `${step.color}15` : 'rgba(0,0,0,.8)',
            boxShadow      : isActive ? `0 0 24px ${step.color}30` : 'none',
            transform      : isActive ? 'scale(1.1)' : 'scale(1)',
          }}>
          {/* Step number — clean, no emoji */}
          <span
            style={{
              fontFamily  : "'Inter',system-ui,sans-serif",
              fontSize    : 13,
              fontWeight  : 600,
              color       : isActive ? step.color : 'rgba(255,255,255,.45)',
              letterSpacing: '0',
              transition  : 'color .3s',
            }}
          >
            {step.num}
          </span>
        </div>
        {/* Connector line */}
        {!isLast && (
          <div className="w-px flex-1 mt-2 min-h-[2rem]"
            style={{ background:`linear-gradient(to bottom,${step.color}50,transparent)` }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pt-2 pb-4">
        <h3 className="font-semibold mb-0.5 transition-colors duration-300"
          style={{ fontSize:'clamp(0.9375rem,1.4vw,1.0625rem)', letterSpacing:'-0.01em', color: isActive ? step.color : 'rgba(255,255,255,.88)' }}>
          {step.title}
        </h3>
        <p className="text-[11px] text-white/30 mb-2 tracking-wide">{step.sub}</p>
        {/* Expandable detail */}
        <div className="overflow-hidden transition-all duration-400"
          style={{ maxHeight: isActive ? 160 : 0, opacity: isActive ? 1 : 0 }}>
          <p className="text-sm text-white/55 leading-relaxed mb-1">{step.desc}</p>
          <p className="text-[11px] text-white/30 leading-loose">{step.detail}</p>
        </div>
      </div>
    </div>
  );
};

/* ── Mobile Step Row ────────────────────────────────────────── */
const MobileStep = ({ step, idx, active, setActive, isRTL, isLast }) => {
  const isActive = active === idx;
  return (
    /* flex-row-reverse in RTL: timeline circle on end (right) side */
    <div className={`relative flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
      {/* Timeline */}
      <div className="flex flex-col items-center flex-shrink-0">
        <button
          className="relative w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10"
          style={{
            borderColor: isActive ? step.color : 'rgba(255,255,255,.15)',
            backgroundColor: isActive ? `${step.color}20` : 'rgba(0,0,0,.9)',
          }}
          onClick={() => setActive(isActive ? null : idx)}
          aria-expanded={isActive}>
          <span style={{
            fontFamily  : "'Inter',system-ui,sans-serif",
            fontSize    : 12,
            fontWeight  : 600,
            color       : isActive ? step.color : 'rgba(255,255,255,.5)',
            transition  : 'color .3s',
          }}>{step.num}</span>
        </button>
        {!isLast && (
          <div className="w-px flex-1 min-h-[2rem]"
            style={{ background:`linear-gradient(to bottom,${step.color}40,transparent)` }} />
        )}
      </div>
      {/* Content */}
      <div className="flex-1 pb-6">
        <button
          className="w-full flex items-center gap-2 mb-1"
          onClick={() => setActive(isActive ? null : idx)}
          aria-expanded={isActive}
          style={{ background:'none', border:'none', padding:0, cursor:'pointer',
            /* textAlign:start is a CSS logical property — right in RTL, left in LTR */
            textAlign: 'start' }}>
          <span className="text-xs px-2 py-0.5 rounded-full font-light"
            style={{ background:`${step.color}20`, color: step.color }}>
            {step.num}
          </span>
          <h3 className="font-semibold transition-colors duration-300"
            style={{ fontSize:'0.9375rem', letterSpacing:'-0.01em', color: isActive ? step.color : 'rgba(255,255,255,.88)' }}>
            {step.title}
          </h3>
          {/* ms-auto = margin-inline-start:auto — pushes chevron to the inline-end regardless of dir */}
          <span className="ms-auto text-white/30 text-xs"
            style={{ transform: isActive ? 'rotate(180deg)' : 'none', display:'inline-block', transition:'transform .3s' }}>
            ▼
          </span>
        </button>
        <p className="text-xs text-white/30 mb-1 tracking-wide">{step.sub}</p>
        <div className="overflow-hidden transition-all duration-500"
          style={{ maxHeight: isActive ? 200 : 0, opacity: isActive ? 1 : 0 }}>
          <p className="text-sm text-white/60 leading-relaxed mb-1 mt-1">{step.desc}</p>
          <p className="text-xs text-white/30 leading-loose">{step.detail}</p>
        </div>
      </div>
    </div>
  );
};

export default ProcessSection;