// sections/MetricsSection.jsx
import { useEffect, useRef, useState } from 'react';

/* ── Animated counter hook ── */
const useCountUp = (end, duration = 1800, start = false) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    const raw = parseFloat(String(end).replace(/[^0-9.]/g, ''));
    if (isNaN(raw)) { setValue(end); return; }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setValue(raw); return; }
    let t0 = null;
    const frame = (ts) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setValue(Math.round((1 - Math.pow(1 - p, 3)) * raw));
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [start, end, duration]);
  return value;
};

/* ── Metric card ── */
const MetricCard = ({ metric, isRTL, index, animate }) => {
  const num = useCountUp(metric.rawNum, 1600 + index * 100, animate);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = ref.current;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        el.style.transition = `opacity .6s ${index * 0.08}s ease, transform .6s ${index * 0.08}s ease`;
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        io.disconnect();
      }
    }, { threshold: 0.1 });
    /* Apply hidden state only after IO is registered — safe, non-blocking */
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    io.observe(el);
    return () => io.disconnect();
  }, [index]);

  return (
    <div
      ref={ref}
      className="group relative flex flex-col p-6 sm:p-8 border border-white/[0.06] hover:border-[#d4af37]/25 transition-all duration-500 overflow-hidden cursor-default"
      style={{
        background: 'rgba(255,255,255,.018)',
        textAlign: isRTL ? 'right' : 'left',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,.022)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.018)'; }}
    >
      <div
        aria-hidden
        className="absolute top-0 inset-x-0 h-px transition-all duration-500 group-hover:opacity-100 opacity-0"
        style={{ background: 'linear-gradient(to right, transparent, rgba(212,175,55,.5), transparent)' }}
      />
      <p className="text-[9px] tracking-[.3em] uppercase mb-4 font-light" style={{ color: 'rgba(212,175,55,.55)' }}>
        {isRTL ? metric.categoryAR : metric.categoryEN}
      </p>
      <div
        className="mb-2 tabular-nums leading-none"
        style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(2rem, 4vw, 3.25rem)', fontWeight: 700, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}
      >
        <span style={{ color: '#d4af37' }}>
          {metric.prefix || ''}{animate ? num : metric.rawNum}{metric.suffix || ''}
        </span>
      </div>
      <h3 className="text-base sm:text-lg font-medium mb-2 leading-snug" style={{ color: 'rgba(255,255,255,.85)', letterSpacing: 0 }}>
        {isRTL ? metric.labelAR : metric.labelEN}
      </h3>
      <p
        className="text-sm font-normal leading-relaxed mt-auto pt-4"
        style={{ color: 'rgba(255,255,255,.45)', borderTop: '1px solid rgba(255,255,255,.05)' }}
      >
        {isRTL ? metric.descAR : metric.descEN}
      </p>
    </div>
  );
};

/* ── Main section ── */
const MetricsSection = ({ isRTL, onStartProject }) => {
  const gridRef  = useRef(null);
  const titleRef = useRef(null);
  const [fired, setFired] = useState(false);

  useEffect(() => {
    if (!gridRef.current) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setFired(true); io.disconnect(); }
    }, { threshold: 0.15 });
    io.observe(gridRef.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!titleRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = titleRef.current;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        el.style.transition = 'opacity .8s ease, transform .8s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        io.disconnect();
      }
    }, { threshold: 0.15 });
    /* Apply hidden state only after IO is set up */
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const metrics = [
    {
      rawNum: 40, suffix: '%',
      categoryEN: 'E-commerce',  categoryAR: 'التجارة الإلكترونية',
      labelEN: 'Average conversion uplift', labelAR: 'متوسط رفع معدل التحويل',
      descEN: 'Across our headless e-commerce builds, clients see a 40% average increase in checkout conversions within 90 days.',
      descAR: 'عبر منصاتنا headless، يشهد العملاء زيادة 40٪ في معدلات الإتمام خلال 90 يوماً.',
    },
    {
      rawNum: 60, suffix: '%',
      categoryEN: 'Operations',  categoryAR: 'العمليات',
      labelEN: 'Admin time reduction', labelAR: 'تقليل وقت الإدارة',
      descEN: 'Medical and enterprise clients report 60% less time on administrative work after deploying our management systems.',
      descAR: 'يُفيد عملاء الأنظمة الطبية والمؤسسية بتقليل 60٪ في وقت العمل الإداري.',
    },
    {
      rawNum: 3, suffix: 'x',
      categoryEN: 'SaaS Growth', categoryAR: 'نمو SaaS',
      labelEN: 'Faster user onboarding', labelAR: 'تسريع تجربة التهيئة',
      descEN: 'SaaS clients with our custom dashboards see user activation 3x faster compared to generic solutions.',
      descAR: 'يرى عملاء SaaS تفعيل المستخدمين أسرع 3 أضعاف مقارنة بالحلول الجاهزة.',
    },
    {
      rawNum: 30, suffix: 'd',
      categoryEN: 'Delivery',    categoryAR: 'التسليم',
      labelEN: 'Average project launch', labelAR: 'متوسط إطلاق المشروع',
      descEN: 'From signed contract to live deployment, our average turnaround is 30 days for standard platforms.',
      descAR: 'من توقيع العقد حتى الإطلاق الفعلي، متوسطنا 30 يوماً للمنصات القياسية.',
    },
  ];

  const textAlign   = isRTL ? 'right'       : 'left';
  const flexDir     = isRTL ? 'row-reverse' : 'row';
  const gradientCls = isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r';

  return (
    <section
      id="metrics"
      className="relative py-24 sm:py-40 px-4 sm:px-8 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #000 0%, #050402 50%, #000 100%)' }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className={`absolute top-0 w-[45vw] h-[45vw] rounded-full pointer-events-none ${isRTL ? 'left-0' : 'right-0'}`}
        style={{ background: 'radial-gradient(circle, #d4af37 0%, transparent 65%)', opacity: 0.018, filter: 'blur(100px)', transform: 'translateY(-30%)' }}
      />

      {/* ── Content wrapper ── */}
      <div
        className="max-w-7xl mx-auto relative z-10 w-full"
        style={{ textAlign: textAlign }}
      >

        {/* ── Header ── */}
        <div
          ref={titleRef}
          style={{ marginBottom: 'clamp(48px,8vw,80px)' }}
        >

          {/* ① السطر الذهبي + "النتائج تتحدث" — محاذي لنفس جهة العنوان */}
          <div
            className="flex items-center gap-4 mb-6 w-full"
            style={{ flexDirection: flexDir, justifyContent: isRTL ? 'flex-end' : 'flex-start' }}
          >
            <span
              className={`block w-10 h-px flex-shrink-0 ${gradientCls} from-[#d4af37] to-transparent`}
              aria-hidden
            />
            <p className="text-[10px] tracking-[.1em] text-[#d4af37]/65 uppercase font-medium">
              {isRTL ? 'أرقام من مشاريع حقيقية' : 'Numbers from real projects'}
            </p>
          </div>

          {/* ② العنوان الكبير — يملأ العرض ومحاذاته صح */}
          <h2
            className={`text-3xl sm:text-5xl lg:text-6xl font-semibold leading-[1.08] mb-6 ${isRTL ? '' : 'tracking-tight'}`}
            style={{ letterSpacing: isRTL ? '0' : '-0.025em', textAlign: textAlign }}
          >
            {isRTL ? 'هذا ما تحصل عليه.' : 'This is what you get.'}
            <br />
            <span className={`text-transparent bg-clip-text ${gradientCls} from-[#d4af37] to-white/70`}>
              {isRTL ? 'لا وعود — أرقام موثّقة.' : 'Not promises — documented results.'}
            </span>
          </h2>

          {/* ③ الوصف — تحت العنوان مباشرة، محاذاته صح */}
    <p
  className="text-base font-normal text-white/60 leading-relaxed"
  style={{ textAlign: textAlign, maxWidth: '32rem' }}
>
  {isRTL
    ? 'كل رقم مستخرج من مشروع حقيقي سلّمناه. اختر النتيجة التي تريدها ونتحدث عن كيفية الوصول إليها.'
    : "Every number comes from a real project we shipped. Pick the outcome you want and let's talk about how to get there."}
</p>

        </div>

        {/* ── Metrics grid ── */}
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {metrics.map((m, i) => (
            <MetricCard key={i} metric={m} isRTL={isRTL} index={i} animate={fired} />
          ))}
        </div>

        {/* ── CTA row ── */}
        <div
          className="mt-14 sm:mt-20 flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
          style={{ flexDirection: flexDir }}
        >
          <button
            onClick={onStartProject}
            className="group relative inline-flex items-center gap-3 px-10 py-4 bg-[#d4af37] text-black text-xs font-medium tracking-widest uppercase hover:bg-[#c9a22a] transition-all duration-400 active:scale-95 overflow-hidden flex-shrink-0"
          >
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <span className="relative">{isRTL ? 'احصل على هذه النتائج' : 'Get My Free Strategy Call'}</span>
            <svg
              className={`relative w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 ${isRTL ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>

          <p className="text-xs font-normal text-white/40" style={{ textAlign: textAlign }}>
            {isRTL
              ? '✓ 30 دقيقة تكشف ما يحتاجه مشروعك · ✓ بدون التزام · ✓ رد خلال 24 ساعة'
              : '✓ 30 minutes to clarify your project · ✓ No commitment · ✓ Reply within 24h'}
          </p>
        </div>

      </div>
    </section>
  );
};

export default MetricsSection;