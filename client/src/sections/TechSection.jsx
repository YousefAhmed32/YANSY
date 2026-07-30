import { useLanguage } from '../contexts/LanguageContext';
import { RevealItems } from '../components/Reveal';

const CATEGORIES = [
  {
    nameEN: 'Frontend',    nameAR: 'الواجهة الأمامية',
    tech: [
      { name: 'React',       desc: 'UI Library',    color: '#61DAFB' },
      { name: 'Next.js',     desc: 'SSR / SSG',     color: 'rgb(var(--text-primary))' },
      { name: 'TypeScript',  desc: 'Type Safety',   color: '#3178C6' },
      { name: 'Tailwind',    desc: 'Styling',       color: '#06B6D4' },
    ],
  },
  {
    nameEN: 'Backend',     nameAR: 'الخلفية',
    tech: [
      { name: 'Node.js',    desc: 'Runtime',       color: '#339933' },
      { name: 'PostgreSQL', desc: 'SQL Database',  color: '#4169E1' },
      { name: 'MongoDB',    desc: 'NoSQL',         color: '#47A248' },
      { name: 'Redis',      desc: 'Caching',       color: '#DC382D' },
    ],
  },
  {
    nameEN: 'Infrastructure', nameAR: 'البنية التحتية',
    tech: [
      { name: 'AWS',        desc: 'Cloud',         color: '#FF9900' },
      { name: 'Docker',     desc: 'Containers',    color: '#2496ED' },
      { name: 'GitHub CI',  desc: 'DevOps',        color: 'rgb(var(--text-primary))' },
      { name: 'Vercel',     desc: 'Deployment',    color: 'rgb(var(--text-primary))' },
    ],
  },
  {
    nameEN: 'Integrations', nameAR: 'التكاملات',
    tech: [
      { name: 'Stripe',     desc: 'Payments',      color: '#635BFF' },
      { name: 'Firebase',   desc: 'Auth / BaaS',   color: '#FFCA28' },
      { name: 'Twilio',     desc: 'SMS / Voice',   color: '#F22F46' },
      { name: 'SendGrid',   desc: 'Email',         color: '#1A82E2' },
    ],
  },
];

const TechSection = ({ sectionRef, isRTL }) => {
  const { isRTL: ctxRTL } = useLanguage();
  const rtl = isRTL ?? ctxRTL;

  return (
    <section
      ref={sectionRef}
      id="tech"
      dir={rtl ? 'rtl' : 'ltr'}
      className="section-shell section-shell--plain"
    >
      <style>{`
        .tech-main-grid {
          display: grid;
          grid-template-columns: 5fr 7fr;
          gap: clamp(3rem, 6vw, 7rem);
          align-items: start;
        }
        @media (max-width: 900px) {
          .tech-main-grid { grid-template-columns: 1fr; }
        }
        .tech-categories {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: clamp(1.5rem, 3vw, 2.5rem) clamp(2rem, 4vw, 3rem);
        }
        @media (max-width: 480px) {
          .tech-categories { grid-template-columns: 1fr; }
        }
        .tech-cat-name {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgb(var(--text-tertiary));
          margin-bottom: 14px;
        }
        [dir="rtl"] .tech-cat-name { letter-spacing: 0; text-transform: none; }
        .tech-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 0;
          border-bottom: 1px solid rgb(var(--border-light));
          cursor: default;
          transition: background 0.15s;
        }
        .tech-item:last-child { border-bottom: none; }
        .tech-item:hover { background: rgb(var(--bg-secondary)); border-radius: 6px; padding-inline: 6px; margin-inline: -6px; }
        .tech-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          transition: transform 0.2s;
        }
        .tech-item:hover .tech-dot { transform: scale(1.35); }
        .tech-name {
          font-size: 13.5px;
          font-weight: 600;
          color: rgb(var(--text-primary));
          flex: 1;
        }
        .tech-desc {
          font-size: 11.5px;
          font-weight: 500;
          color: rgb(var(--text-tertiary));
          white-space: nowrap;
        }
        .tech-philosophy-box {
          background: rgb(var(--bg-secondary));
          border: 1px solid rgb(var(--border));
          border-radius: 16px;
          padding: clamp(20px, 2.5vw, 28px);
          margin-top: clamp(1.5rem, 3vw, 2.5rem);
        }
        .tech-philosophy-icon {
          width: 38px; height: 38px;
          border-radius: 10px;
          background: rgb(var(--accent-light));
          border: 1px solid rgb(var(--accent-muted));
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px;
        }
      `}</style>

      <div className="section-inner">

        <div className="tech-main-grid">

          {/* Left: Description */}
          <div style={{ textAlign: rtl ? 'right' : 'left' }}>
            <span className="section-label" style={{ marginBottom: 20, display: 'inline-block' }}>
              {rtl ? 'التقنيات' : 'Technology'}
            </span>
            <h2 className="display-title" style={{ marginBottom: 'clamp(1.25rem, 2.5vw, 2rem)' }}>
              {rtl ? 'مبني على\nتقنيات المؤسسات\nالكبرى.' : 'Built on\nenterprise-grade\ntechnology.'}
            </h2>
            <p style={{
              fontSize: 'clamp(0.9375rem, 1.1vw, 1.0625rem)',
              color: 'rgb(var(--text-secondary))',
              lineHeight: 1.75,
              margin: 0,
              fontFamily: rtl ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
            }}>
              {rtl
                ? 'نختار التقنية المناسبة لمشروعك — لا التقنية الرائجة. كل قرار تقني له سبب واضح يخدم احتياجاتك.'
                : 'We choose the right technology for your project — not the trending one. Every technical decision has a clear reason that serves your specific needs.'}
            </p>

            <div className="tech-philosophy-box">
              <div className="tech-philosophy-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="rgb(var(--accent))" strokeWidth="1.5" width="18" height="18" aria-hidden>
                  <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                </svg>
              </div>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: 'rgb(var(--text-primary))', margin: '0 0 5px' }}>
                {rtl ? 'نختار الأدوات، لا نتبعها عمياً' : 'We choose tools — not follow trends'}
              </p>
              <p style={{ fontSize: 12.5, color: 'rgb(var(--text-secondary))', margin: 0, lineHeight: 1.6 }}>
                {rtl
                  ? 'كل تقنية في قائمتنا اخترناها لأنها تحل مشكلة حقيقية — الأداء، الأمان، قابلية التوسع.'
                  : 'Every technology we use was chosen because it solves a real problem — performance, security, or scalability.'}
              </p>
            </div>
          </div>

          {/* Right: Tech categories */}
          <RevealItems className="tech-categories" distance={16} step={0.06}>
            {CATEGORIES.map((cat, ci) => (
              <div key={ci}>
                <div className="tech-cat-name">
                  {rtl ? cat.nameAR : cat.nameEN}
                </div>
                {cat.tech.map((tech, ti) => (
                  <div key={ti} className="tech-item">
                    <span
                      className="tech-dot"
                      style={{ background: tech.color }}
                      aria-hidden
                    />
                    <span className="tech-name">{tech.name}</span>
                    <span className="tech-desc">{tech.desc}</span>
                  </div>
                ))}
              </div>
            ))}
          </RevealItems>

        </div>

      </div>
    </section>
  );
};

export default TechSection;
