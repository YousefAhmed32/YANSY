import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowUpRight } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import ImagePlaceholder from '../components/ImagePlaceholder';

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
    rawNum: 3, prefix: '', suffix: 'x',
    labelEN: 'Lead\nGeneration',      labelAR: 'زيادة\nالعملاء المحتملين',
    subEN:   'NexusRealty — real estate platform',
    subAR:   'NexusRealty — منصة عقارية',
    noteEN:  'See the case study',
    noteAR:  'شاهد دراسة الحالة',
    caseStudySlug: 'nexusrealty',
  },
  {
    rawNum: 80, prefix: '-', suffix: '%',
    labelEN: 'No-Show\nRate',         labelAR: 'انخفاض\nالغيابات',
    subEN:   'BookEase — clinic booking system',
    subAR:   'BookEase — نظام حجز عيادات',
    noteEN:  'See the case study',
    noteAR:  'شاهد دراسة الحالة',
    caseStudySlug: 'bookease',
  },
  {
    rawNum: 40, prefix: '+', suffix: '%',
    labelEN: 'Conversion\nUplift',    labelAR: 'زيادة\nالتحويل',
    subEN:   'SprintStore — e-commerce rebuild',
    subAR:   'SprintStore — إعادة بناء متجر إلكتروني',
    noteEN:  'See the case study',
    noteAR:  'شاهد دراسة الحالة',
    caseStudySlug: 'sprintstore',
  },
  {
    rawNum: 35, prefix: '+', suffix: '%',
    labelEN: 'Operational\nEfficiency', labelAR: 'كفاءة\nتشغيلية',
    subEN:   'OpsFlow — manufacturing ERP',
    subAR:   'OpsFlow — نظام ERP للتصنيع',
    noteEN:  'See the case study',
    noteAR:  'شاهد دراسة الحالة',
    caseStudySlug: 'opsflow',
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
      <div className="metric-num" dir="ltr">
        {metric.prefix}{animate ? num : 0}{metric.suffix}
      </div>
      <div className="metric-label">
        {rtl ? metric.labelAR : metric.labelEN}
      </div>
      <div className="metric-sub">
        {rtl ? metric.subAR : metric.subEN}
      </div>
      {metric.caseStudySlug ? (
        <Link to={`/case-studies/${metric.caseStudySlug}`} className="metric-note" style={{ textDecoration: 'none' }}>
          <span className="metric-note-dot" aria-hidden />
          {rtl ? metric.noteAR : metric.noteEN}
        </Link>
      ) : (
        <div className="metric-note">
          <span className="metric-note-dot" aria-hidden />
          {rtl ? metric.noteAR : metric.noteEN}
        </div>
      )}
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
      className="section-shell section-shell--tint"
    >
      <style>{`
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          border-top: 1px solid rgb(var(--border));
          border-bottom: 1px solid rgb(var(--border));
          margin-bottom: clamp(3rem, 6vw, 4.5rem);
        }
        @media (max-width: 860px) {
          .metrics-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .metrics-grid { grid-template-columns: 1fr; }
        }
        .metric-cell {
          padding: clamp(2.5rem, 5vw, 4rem) clamp(1.5rem, 3vw, 2.5rem);
          border-inline-end: 1px solid rgb(var(--border));
          text-align: ${rtl ? 'right' : 'left'};
          transition: background 0.25s;
        }
        .metric-cell:last-child { border-inline-end: none; }
        @media (max-width: 860px) {
          .metric-cell:nth-child(2n) { border-inline-end: none; }
          .metric-cell:nth-child(-n+2) { border-bottom: 1px solid rgb(var(--border)); }
        }
        @media (max-width: 480px) {
          .metric-cell { border-inline-end: none; border-bottom: 1px solid rgb(var(--border)); }
          .metric-cell:last-child { border-bottom: none; }
        }
        .metric-cell:hover { background: rgb(var(--bg-elevated)); }
        .metric-cell:hover .metric-num { color: rgb(var(--accent)); }
        .metric-num {
          font-size: clamp(3.5rem, 6vw, 5.5rem);
          font-weight: 800;
          letter-spacing: -0.04em;
          color: rgb(var(--text-primary));
          line-height: 0.95;
          margin-bottom: clamp(16px, 2vw, 24px);
          font-variant-numeric: tabular-nums;
        }
        [dir="rtl"] .metric-num { letter-spacing: 0; }
        .metric-label {
          font-size: clamp(0.8125rem, 1vw, 0.9375rem);
          font-weight: 700;
          color: rgb(var(--text-primary));
          line-height: 1.3;
          letter-spacing: -0.01em;
          margin-bottom: 8px;
          white-space: pre-line;
        }
        [dir="rtl"] .metric-label { letter-spacing: 0; }
        .metric-sub {
          font-size: clamp(11px, 0.85vw, 12.5px);
          color: rgb(var(--text-tertiary));
          line-height: 1.5;
          margin-bottom: 10px;
        }
        .metric-note {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 10.5px;
          font-weight: 700;
          color: rgb(var(--text-secondary));
          text-transform: uppercase;
          letter-spacing: 0.07em;
          transition: color 0.18s;
        }
        a.metric-note:hover { color: rgb(var(--accent)); }
        [dir="rtl"] .metric-note { letter-spacing: 0; text-transform: none; }
        .metric-note-dot {
          width: 4px; height: 4px; border-radius: 50%;
          background: rgb(var(--accent)); flex-shrink: 0;
        }
      `}</style>

      <div className="section-inner">

        {/* Arabic used to get an entirely different header layout here (stacked
            column vs. the split row English got), which made the two languages
            read as two different designs. SectionHeader mirrors one layout. */}
        <SectionHeader
          eyebrow={rtl ? 'النتائج' : 'Results'}
          title={rtl ? 'نتائج نفتخر بها.' : "Results we're\nproud of."}
          lead={rtl
            ? 'كل رقم مبني على نتائج حقيقية من مشاريع حقيقية — لا تقديرات، لا مبالغة.'
            : 'Every number is built on real results from real projects — no estimates, no rounding up.'}
          maxLeadWidth={400}
action={
  <div
    style={{
      maxWidth: 420,
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <img
       src="/Arabic Analytics Dashboard Scene.png"
      alt={rtl ? "لوحة تحليلات" : "Analytics Illustration"}
      loading="lazy"
      style={{
        width: "100%",
        height: "auto",
        objectFit: "contain",
        userSelect: "none",
        pointerEvents: "none",
      }}
    />
  </div>
}
        />

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
              color: 'rgb(var(--text-primary))',
              margin: '0 0 6px',
              letterSpacing: rtl ? 0 : '-0.02em',
              fontFamily: rtl ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
            }}>
              {rtl ? 'جاهز لنتائج مشابهة؟' : 'Ready for results like these?'}
            </p>
            <p style={{
              fontSize: 13.5,
              color: 'rgb(var(--text-tertiary))',
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
