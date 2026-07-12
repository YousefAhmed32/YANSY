import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowUpRight } from 'lucide-react';

const useCountUp = (end, duration = 1800, start = false) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    const raw = parseFloat(String(end).replace(/[^0-9.]/g, ''));
    if (isNaN(raw)) { setValue(end); return; }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setValue(raw); return; }
    let t0 = null;
    const frame = ts => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setValue(Math.round((1 - Math.pow(1 - p, 3)) * raw));
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [start, end, duration]);
  return value;
};

const METRICS = [
  {
    rawNum: 50, prefix: '', suffix: '+',
    labelEN: 'Projects\nDelivered',   labelAR: 'مشروع\nمُسلَّم',
    subEN:   'Across 6+ industries worldwide',
    subAR:   'في أكثر من 6 قطاعات حول العالم',
    noteEN:  'Since 2020',
    noteAR:  'منذ 2020',
  },
  {
    rawNum: 98, prefix: '', suffix: '%',
    labelEN: 'Client\nSatisfaction',  labelAR: 'رضا\nالعملاء',
    subEN:   'Clients who return for a second project',
    subAR:   'العملاء الذين يعودون لمشروع ثانٍ',
    noteEN:  'Retention rate',
    noteAR:  'معدل الاحتفاظ',
  },
  {
    rawNum: 40, prefix: '+', suffix: '%',
    labelEN: 'Conversion\nUplift',    labelAR: 'زيادة\nالتحويل',
    subEN:   'Measured 90 days post-launch',
    subAR:   'مقاساً خلال 90 يوماً بعد الإطلاق',
    noteEN:  'Average across clients',
    noteAR:  'متوسط عبر العملاء',
  },
  {
    rawNum: 30, prefix: '', suffix: 'd',
    labelEN: 'Average\nLaunch',       labelAR: 'متوسط\nالإطلاق',
    subEN:   'From agreement to live deployment',
    subAR:   'من الاتفاق حتى النشر على الإنتاج',
    noteEN:  'Most projects',
    noteAR:  'في معظم المشاريع',
  },
];

const MetricCell = ({ metric, rtl, animate, index, visible }) => {
  const num = useCountUp(metric.rawNum, 1600 + index * 100, animate);

  return (
    <div
      className="metric-cell"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.65s ${index * 0.1}s cubic-bezier(0.16,1,0.3,1), transform 0.65s ${index * 0.1}s cubic-bezier(0.16,1,0.3,1)`,
      }}
    >
      <div className="metric-num">
        {metric.prefix}{animate ? num : 0}{metric.suffix}
      </div>
      <div className="metric-label">
        {rtl ? metric.labelAR : metric.labelEN}
      </div>
      <div className="metric-sub">
        {rtl ? metric.subAR : metric.subEN}
      </div>
      <div className="metric-note">
        <span className="metric-note-dot" aria-hidden />
        {rtl ? metric.noteAR : metric.noteEN}
      </div>
    </div>
  );
};

const MetricsSection = ({ isRTL, onStartProject }) => {
  const { isRTL: ctxRTL } = useLanguage();
  const rtl = isRTL ?? ctxRTL;
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setAnimate(true); setVisible(true); io.disconnect(); }
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="results"
      dir={rtl ? 'rtl' : 'ltr'}
      style={{
        background: '#FAFAFA',
        paddingTop:    'clamp(5rem, 10vw, 8rem)',
        paddingBottom: 'clamp(5rem, 10vw, 8rem)',
        paddingLeft:   'clamp(1.25rem, 5vw, 3rem)',
        paddingRight:  'clamp(1.25rem, 5vw, 3rem)',
        borderTop: '1px solid #E8EBF0',
      }}
    >
      <style>{`
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          border-top: 1px solid #E8EBF0;
          border-bottom: 1px solid #E8EBF0;
          margin-bottom: clamp(4rem, 8vw, 6rem);
        }
        @media (max-width: 860px) {
          .metrics-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .metrics-grid { grid-template-columns: 1fr; }
        }
        .metric-cell {
          padding: clamp(2.5rem, 5vw, 4rem) clamp(1.5rem, 3vw, 2.5rem);
          border-inline-end: 1px solid #E8EBF0;
          text-align: ${rtl ? 'right' : 'left'};
          transition: background 0.25s;
        }
        .metric-cell:last-child { border-inline-end: none; }
        @media (max-width: 860px) {
          .metric-cell:nth-child(2n) { border-inline-end: none; }
          .metric-cell:nth-child(-n+2) { border-bottom: 1px solid #E8EBF0; }
        }
        @media (max-width: 480px) {
          .metric-cell { border-inline-end: none; border-bottom: 1px solid #E8EBF0; }
          .metric-cell:last-child { border-bottom: none; }
        }
        .metric-cell:hover { background: #FFFFFF; }
        .metric-cell:hover .metric-num { color: #2563EB; }
        .metric-num {
          font-size: clamp(3.5rem, 6vw, 5.5rem);
          font-weight: 800;
          letter-spacing: -0.04em;
          color: #0D1117;
          line-height: 0.95;
          margin-bottom: clamp(16px, 2vw, 24px);
          font-variant-numeric: tabular-nums;
        }
        [dir="rtl"] .metric-num { letter-spacing: 0; }
        .metric-label {
          font-size: clamp(0.8125rem, 1vw, 0.9375rem);
          font-weight: 700;
          color: #0D1117;
          line-height: 1.3;
          letter-spacing: -0.01em;
          margin-bottom: 8px;
          white-space: pre-line;
        }
        [dir="rtl"] .metric-label { letter-spacing: 0; }
        .metric-sub {
          font-size: clamp(11px, 0.85vw, 12.5px);
          color: #9BA3AE;
          line-height: 1.5;
          margin-bottom: 10px;
        }
        .metric-note {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 10.5px;
          font-weight: 700;
          color: #5C6370;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        [dir="rtl"] .metric-note { letter-spacing: 0; text-transform: none; }
        .metric-note-dot {
          width: 4px; height: 4px; border-radius: 50%;
          background: #2563EB; flex-shrink: 0;
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Section header */}
        <div style={{
          display: 'flex',
          flexDirection: rtl ? 'column' : 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 'clamp(1.5rem, 3vw, 2rem)',
          marginBottom: 'clamp(3rem, 6vw, 5rem)',
          flexWrap: 'wrap',
        }}>
          <div style={{ textAlign: rtl ? 'right' : 'left' }}>
            <span className="section-label" style={{ marginBottom: 20, display: 'inline-block' }}>
              {rtl ? 'النتائج' : 'Results'}
            </span>
            <h2 style={{
              fontSize: 'var(--text-5xl)',
              fontWeight: 800,
              lineHeight: 1.0,
              letterSpacing: rtl ? 0 : '-0.035em',
              color: '#0D1117',
              margin: 0,
              fontFamily: rtl ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
              whiteSpace: 'pre-line',
            }}>
              {rtl ? 'أرقام لا تكذب.' : 'Numbers that\ndon\'t lie.'}
            </h2>
          </div>
          <p style={{
            fontSize: 'clamp(0.9375rem, 1.1vw, 1.0625rem)',
            color: '#5C6370',
            lineHeight: 1.75,
            maxWidth: 400,
            margin: 0,
            textAlign: rtl ? 'right' : 'left',
            fontFamily: rtl ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
          }}>
            {rtl
              ? 'كل رقم مبني على نتائج حقيقية من مشاريع حقيقية — لا تقديرات، لا مبالغة.'
              : 'Every number is built on real results from real projects — no estimates, no rounding up.'}
          </p>
        </div>

        {/* Metrics grid */}
        <div className="metrics-grid">
          {METRICS.map((m, i) => (
            <MetricCell
              key={i}
              metric={m}
              rtl={rtl}
              animate={animate}
              index={i}
              visible={visible}
            />
          ))}
        </div>

        {/* CTA row */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'clamp(1.5rem, 3vw, 2rem)',
        }}>
          <div style={{ textAlign: rtl ? 'right' : 'left' }}>
            <p style={{
              fontSize: 'clamp(1.125rem, 1.5vw, 1.375rem)',
              fontWeight: 700,
              color: '#0D1117',
              margin: '0 0 6px',
              letterSpacing: rtl ? 0 : '-0.02em',
              fontFamily: rtl ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
            }}>
              {rtl ? 'جاهز لنتائج مشابهة؟' : 'Ready for results like these?'}
            </p>
            <p style={{
              fontSize: 13.5,
              color: '#9BA3AE',
              margin: 0,
              fontFamily: rtl ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
            }}>
              {rtl ? 'استشارة مجانية — لا بطاقة ائتمان.' : 'Free consultation — no credit card required.'}
            </p>
          </div>
          <button
            onClick={onStartProject}
            className="btn-primary"
            style={{ fontSize: '13.5px', padding: '13px 26px' }}
          >
            {rtl ? 'ابدأ مشروعك' : 'Start Your Project'}
            <ArrowUpRight style={{ width: 15, height: 15, transform: rtl ? 'scaleX(-1)' : 'none' }} aria-hidden />
          </button>
        </div>

      </div>
    </section>
  );
};

export default MetricsSection;
