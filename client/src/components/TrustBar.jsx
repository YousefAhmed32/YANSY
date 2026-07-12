import { useLanguage } from '../contexts/LanguageContext';

const STATS_EN = [
  { num: '50+',  label: 'Projects Delivered',  sub: 'Across 6+ industries' },
  { num: '98%',  label: 'Client Satisfaction',  sub: 'Measured retention rate' },
  { num: '30d',  label: 'Average Launch Time',  sub: 'From contract to live' },
  { num: '4+',   label: 'Years of Experience',  sub: 'Since 2020' },
];

const STATS_AR = [
  { num: '50+',  label: 'مشروع مُسلَّم',        sub: 'في أكثر من 6 قطاعات' },
  { num: '98%',  label: 'رضا العملاء',           sub: 'معدل احتفاظ مقاس' },
  { num: '30d',  label: 'متوسط وقت الإطلاق',    sub: 'من العقد للنشر' },
  { num: '4+',   label: 'سنوات خبرة',            sub: 'منذ 2020' },
];

const INDUSTRIES_EN = ['E-commerce', 'Healthcare', 'SaaS & Tech', 'Enterprise', 'EdTech', 'Real Estate', 'Fintech', 'Hospitality'];
const INDUSTRIES_AR = ['التجارة الإلكترونية', 'الرعاية الصحية', 'SaaS والتقنية', 'المؤسسات', 'التعليم الإلكتروني', 'العقارات', 'التقنية المالية', 'الضيافة'];

const TrustBar = () => {
  const { isRTL } = useLanguage();
  const stats = isRTL ? STATS_AR : STATS_EN;
  const industries = isRTL ? INDUSTRIES_AR : INDUSTRIES_EN;

  return (
    <section
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-label={isRTL ? 'إثبات الجودة' : 'Social proof'}
      style={{
        background: '#FAFAFA',
        borderTop: '1px solid #E8EBF0',
        borderBottom: '1px solid #E8EBF0',
      }}
    >
      <style>{`
        .trustbar-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-bottom: 1px solid #E8EBF0;
        }
        @media (max-width: 640px) {
          .trustbar-stats { grid-template-columns: repeat(2, 1fr); }
        }
        .trustbar-stat {
          padding: clamp(1.5rem, 3.5vw, 2.25rem) clamp(1.25rem, 3vw, 2rem);
          border-inline-end: 1px solid #E8EBF0;
          text-align: center;
          transition: background 0.2s;
        }
        .trustbar-stat:last-child { border-inline-end: none; }
        @media (max-width: 640px) {
          .trustbar-stat:nth-child(2) { border-inline-end: none; }
          .trustbar-stat:nth-child(1),
          .trustbar-stat:nth-child(2) { border-bottom: 1px solid #E8EBF0; }
        }
        .trustbar-stat:hover { background: #FFFFFF; }
        .trustbar-num {
          font-size: clamp(1.75rem, 3vw, 2.5rem);
          font-weight: 800;
          color: #0D1117;
          letter-spacing: -0.04em;
          line-height: 1;
          margin-bottom: 5px;
          font-variant-numeric: tabular-nums;
        }
        [dir="rtl"] .trustbar-num { letter-spacing: 0; }
        .trustbar-stat-label {
          font-size: clamp(11px, 1vw, 12.5px);
          font-weight: 700;
          color: #374151;
          margin-bottom: 3px;
        }
        .trustbar-stat-sub {
          font-size: 10.5px;
          color: #9BA3AE;
          font-weight: 500;
        }
        .trustbar-industries {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: clamp(1rem, 2vw, 1.25rem) clamp(1.25rem, 5vw, 3rem);
        }
        .trustbar-industry-label {
          font-size: 10px;
          font-weight: 700;
          color: #9BA3AE;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-inline-end: 4px;
        }
        [dir="rtl"] .trustbar-industry-label {
          letter-spacing: 0;
          text-transform: none;
        }
        .trustbar-industry-pill {
          font-size: 11.5px;
          font-weight: 600;
          color: #5C6370;
          background: #FFFFFF;
          border: 1px solid #E8EBF0;
          padding: 4px 12px;
          border-radius: 100px;
          transition: border-color 0.18s, color 0.18s;
        }
        .trustbar-industry-pill:hover {
          border-color: #C9CDD6;
          color: #0D1117;
        }
      `}</style>

      {/* Stats row */}
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div className="trustbar-stats">
          {stats.map((s, i) => (
            <div key={i} className="trustbar-stat">
              <div className="trustbar-num">{s.num}</div>
              <div className="trustbar-stat-label">{s.label}</div>
              <div className="trustbar-stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Industries row */}
        <div className="trustbar-industries">
          <span className="trustbar-industry-label">
            {isRTL ? 'قطاعات:' : 'Industries:'}
          </span>
          {industries.map((ind, i) => (
            <span key={i} className="trustbar-industry-pill">{ind}</span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBar;
