import { useEffect, useId, useRef } from 'react';
import { gsap } from 'gsap';
import { ArrowUpRight, Cloud, Mail, MessageCircle } from 'lucide-react';
import {
  siReact, siNextdotjs, siTypescript, siTailwindcss,
  siNodedotjs, siPostgresql, siMongodb, siRedis,
  siDocker, siGithub, siVercel,
  siStripe, siFirebase,
} from 'simple-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useReveal } from '../hooks/useReveal';
import PremiumSectionHeader from '../components/PremiumSectionHeader';

const FONT_EN = "'Inter',system-ui,sans-serif";
const FONT_AR = "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif";

/**
 * AWS, Twilio and SendGrid aren't in simple-icons — their marks were pulled
 * from the dataset over licensing requests. Rather than fake a wordmark, these
 * three use a fitting outlined lucide icon tinted in the brand's real hex, so
 * the tile system (color chip + name + value line) still reads as one
 * consistent language instead of three sudden outliers.
 */
const FALLBACK_HEX = { aws: 'FF9900', twilio: 'F22F46', sendgrid: '1A82E2' };

const LAYERS = [
  {
    key: 'client',
    labelEN: 'Client Layer', labelAR: 'طبقة العميل',
    roleEN: 'What your users touch', roleAR: 'ما يتفاعل معه المستخدم',
    whyEN: 'Sub-second loads and SEO-ready pages — slow sites lose customers before they ever see what you built.',
    whyAR: 'تحميل بأجزاء من الثانية وصفحات جاهزة لمحركات البحث — المواقع البطيئة تخسر العملاء قبل أن يروا ما بنيته.',
    techs: [
      { name: 'React', icon: siReact, valueEN: 'Fast, reliable interfaces', valueAR: 'واجهات سريعة وموثوقة' },
      { name: 'Next.js', icon: siNextdotjs, valueEN: 'SEO-ready, instant loads', valueAR: 'جاهز لمحركات البحث، تحميل فوري' },
      { name: 'TypeScript', icon: siTypescript, valueEN: 'Fewer bugs in production', valueAR: 'أخطاء أقل في الإنتاج' },
      { name: 'Tailwind CSS', icon: siTailwindcss, valueEN: 'Consistent design, shipped faster', valueAR: 'تصميم متسق، تسليم أسرع' },
    ],
  },
  {
    key: 'application',
    labelEN: 'Application Layer', labelAR: 'طبقة التطبيق',
    roleEN: 'Where your business logic runs', roleAR: 'حيث يعمل منطق أعمالك',
    whyEN: 'The right database for the right job — relational for data that must never be wrong, in-memory for instant response.',
    whyAR: 'قاعدة البيانات المناسبة للمهمة المناسبة — علائقية للبيانات التي يجب ألا تُخطئ، وذاكرة مؤقتة لاستجابة فورية.',
    techs: [
      { name: 'Node.js', icon: siNodedotjs, valueEN: 'One language, full stack', valueAR: 'لغة واحدة، حزمة كاملة' },
      { name: 'PostgreSQL', icon: siPostgresql, valueEN: 'Data integrity you can trust', valueAR: 'سلامة بيانات يمكن الوثوق بها' },
      { name: 'MongoDB', icon: siMongodb, valueEN: 'Flexible as your product grows', valueAR: 'مرونة تنمو مع منتجك' },
      { name: 'Redis', icon: siRedis, valueEN: 'Sub-millisecond response times', valueAR: 'استجابة بأجزاء من الثانية' },
    ],
  },
  {
    key: 'infrastructure',
    labelEN: 'Infrastructure Layer', labelAR: 'طبقة البنية التحتية',
    roleEN: 'Where it runs, and how it stays up', roleAR: 'أين يعمل، وكيف يبقى متاحاً',
    whyEN: 'Containerized, version-controlled, auto-deployed — enterprise infrastructure discipline, sized for your project.',
    whyAR: 'بحاويات، وتحكم بالإصدارات، ونشر تلقائي — انضباط بنية تحتية على مستوى المؤسسات، بحجم يناسب مشروعك.',
    techs: [
      { name: 'AWS', fallback: Cloud, hex: FALLBACK_HEX.aws, valueEN: 'Enterprise-grade cloud reliability', valueAR: 'موثوقية سحابية على مستوى المؤسسات' },
      { name: 'Docker', icon: siDocker, valueEN: 'Consistent everywhere it runs', valueAR: 'أداء متسق أينما عمل' },
      { name: 'GitHub CI', icon: siGithub, valueEN: 'Every change tested automatically', valueAR: 'كل تغيير يُختبر تلقائياً' },
      { name: 'Vercel', icon: siVercel, valueEN: 'Global speed, zero downtime', valueAR: 'سرعة عالمية، صفر توقف' },
    ],
  },
  {
    key: 'integrations',
    labelEN: 'Integrations Layer', labelAR: 'طبقة التكاملات',
    roleEN: 'Connected to the tools you already run on', roleAR: 'متصلة بالأدوات التي تعتمد عليها بالفعل',
    whyEN: 'Payments, auth, and messaging that just work — battle-tested services instead of custom code that becomes a liability.',
    whyAR: 'مدفوعات ومصادقة ورسائل تعمل ببساطة — خدمات مجرّبة بدلاً من كود مخصص يتحول لعبء صيانة.',
    techs: [
      { name: 'Stripe', icon: siStripe, valueEN: 'Secure payments, PCI compliant', valueAR: 'مدفوعات آمنة ومتوافقة مع PCI' },
      { name: 'Firebase', icon: siFirebase, valueEN: 'Auth & real-time, battle-tested', valueAR: 'مصادقة وبيانات فورية مجرّبة' },
      { name: 'Twilio', fallback: MessageCircle, hex: FALLBACK_HEX.twilio, valueEN: 'SMS & voice that scales', valueAR: 'رسائل ومكالمات تنمو مع أعمالك' },
      { name: 'SendGrid', fallback: Mail, hex: FALLBACK_HEX.sendgrid, valueEN: 'Email that reaches the inbox', valueAR: 'بريد إلكتروني يصل فعلاً' },
    ],
  },
];

const TechLogo = ({ tech }) => {
  const hex = tech.icon ? tech.icon.hex : tech.hex;
  if (tech.icon) {
    return (
      <span className="tech-chip-logo" style={{ '--brand': `#${hex}` }} aria-hidden>
        <svg viewBox="0 0 24 24" fill="currentColor"><path d={tech.icon.path} /></svg>
      </span>
    );
  }
  const Fallback = tech.fallback;
  return (
    <span className="tech-chip-logo" style={{ '--brand': `#${hex}` }} aria-hidden>
      <Fallback size={16} strokeWidth={1.9} />
    </span>
  );
};

const LayerBand = ({ layer, index, isRTL, font }) => {
  const headingId = `tech-layer-${layer.key}`;
  return (
    <li className="tech-band-slot" data-band>
      <div className="tech-band" role="group" aria-labelledby={headingId}>
        <div className="tech-band-node" aria-hidden>
          <span className="tech-band-dot" />
        </div>
        <div className="tech-band-body">
          <div className="tech-band-head">
            <span className="tech-band-index" dir="ltr" aria-hidden>{String(index + 1).padStart(2, '0')}</span>
            <div>
              <h3 id={headingId} className="tech-band-label" style={{ fontFamily: font }}>
                {isRTL ? layer.labelAR : layer.labelEN}
              </h3>
              <p className="tech-band-role" style={{ fontFamily: font }}>
                {isRTL ? layer.roleAR : layer.roleEN}
              </p>
            </div>
          </div>

          <ul className="tech-chip-row">
            {layer.techs.map((tech) => (
              <li className="tech-chip" key={tech.name} data-tech-chip>
                <TechLogo tech={tech} />
                <span className="tech-chip-text">
                  <span className="tech-chip-name">{tech.name}</span>
                  <span className="tech-chip-value" style={{ fontFamily: font }}>
                    {isRTL ? tech.valueAR : tech.valueEN}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <p className="tech-band-why" style={{ fontFamily: font }}>
            <span className="tech-band-why-label">{isRTL ? 'لماذا يهم:' : 'Why it matters:'}</span>
            {' '}{isRTL ? layer.whyAR : layer.whyEN}
          </p>
        </div>
      </div>
    </li>
  );
};

const TechSection = ({ isRTL: isRTLProp, onStartProject }) => {
  const { isRTL: ctxRTL } = useLanguage();
  const isRTL = isRTLProp ?? ctxRTL;
  const font = isRTL ? FONT_AR : FONT_EN;
  const uid = useId();
  const { ref: sectionRef, revealed } = useReveal({ threshold: 0.06 });
  const blueprintRef = useRef(null);

  // Same rule as WhyYANSY: no ScrollTrigger here. This section is lazy-loaded
  // as one of many siblings on Home.jsx — ScrollTrigger caches each trigger's
  // page position at creation time, and by the time this chunk resolves,
  // later lazy siblings have already shifted the page's total height. That
  // exact bug was already hit and documented in this codebase (see
  // ImagePlaceholder.jsx's comment — the old placeholder inside this very
  // section got stuck at opacity:0 because of it). `useReveal`'s
  // IntersectionObserver re-checks continuously and can't go stale the same
  // way, so it's what gates `revealed`; GSAP only ever plays once that's
  // already true, and only ever animates dedicated wrapper elements so it can
  // never leave an inline transform that fights a CSS hover rule or media
  // query afterward.
  useEffect(() => {
    if (!revealed || !blueprintRef.current) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return undefined;

    const ctx = gsap.context(() => {
      const bands = blueprintRef.current.querySelectorAll('[data-band]');
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      if (bands.length) {
        tl.fromTo(bands, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.16, clearProps: 'opacity,transform' });
      }
      const chips = blueprintRef.current.querySelectorAll('[data-tech-chip]');
      if (chips.length) {
        tl.fromTo(chips, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.35, stagger: 0.02, ease: 'back.out(2)', clearProps: 'opacity,transform' }, '-=0.3');
      }
    }, blueprintRef);
    return () => ctx.revert();
  }, [revealed]);

  return (
    <section
      ref={sectionRef}
      id="tech"
      dir={isRTL ? 'rtl' : 'ltr'}
      className="section-shell section-shell--plain tech-section"
      aria-labelledby={`tech-title-${uid}`}
    >
      <style>{`
        .tech-section { position: relative; overflow: hidden; }

        /* ── Background: blueprint grid + grain + ambient blobs ── */
        .tech-bg-grid {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background-image:
            linear-gradient(rgb(var(--accent) / 0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgb(var(--accent) / 0.07) 1px, transparent 1px);
          background-size: 42px 42px;
          -webkit-mask-image: radial-gradient(ellipse 60% 70% at 50% 30%, black 0%, transparent 80%);
          mask-image: radial-gradient(ellipse 60% 70% at 50% 30%, black 0%, transparent 80%);
        }
        .tech-bg-grain {
          position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: 0.03; mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
        }
        .tech-blob { position: absolute; z-index: 0; pointer-events: none; border-radius: 50%; filter: blur(100px); animation: techDrift 18s ease-in-out infinite; }
        .tech-blob--a { width: 480px; height: 480px; top: -180px; ${isRTL ? 'right' : 'left'}: -180px; background: radial-gradient(circle, rgb(var(--accent) / 0.10), transparent 70%); }
        .tech-blob--b { width: 420px; height: 420px; bottom: -160px; ${isRTL ? 'left' : 'right'}: -160px; background: radial-gradient(circle, rgb(var(--gold) / 0.07), transparent 70%); animation-delay: -9s; }
        @keyframes techDrift { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(0, 24px); } }
        @media (prefers-reduced-motion: reduce) { .tech-blob { animation: none; } }

        .tech-inner { position: relative; z-index: 1; }

        /* ── Blueprint: a left-rail (RTL: right-rail) timeline. Each layer is
           a connector node + a full-width panel — the proven "changelog /
           roadmap timeline" composition, which is also what stays coherent
           at every breakpoint without a structural rewrite: the spine and
           node math is driven by one CSS variable, so mobile is the same
           diagram at a smaller scale, not a different layout. ── */
        .tech-blueprint-wrap { max-width: 900px; margin: 0 auto; }
        .tech-blueprint {
          --node-w: 44px;
          position: relative; list-style: none; margin: 0; padding: 0;
          display: flex; flex-direction: column; gap: clamp(20px, 3vw, 30px);
        }
        .tech-blueprint::before {
          content: ''; position: absolute; top: 6px; bottom: 6px;
          ${isRTL ? 'right' : 'left'}: calc(var(--node-w) / 2 - 1px); width: 2px;
          background: linear-gradient(180deg, rgb(var(--accent) / 0.35), rgb(var(--accent) / 0.08) 85%, transparent);
        }
        @media (max-width: 640px) { .tech-blueprint { --node-w: 32px; } }

        .tech-band-slot { min-width: 0; }
        .tech-band {
          display: flex; gap: clamp(10px, 2vw, 18px); align-items: flex-start;
          /* Deliberately no flex-direction override here: "row" already
             follows the inherited direction (main-start = inline-start,
             i.e. the right edge under RTL), so the node naturally lands
             flush against the spine on whichever side it belongs. Forcing
             row-reverse here would cancel that and pull the node to the
             wrong edge, away from the spine. */
        }

        .tech-band-node {
          position: relative; z-index: 1; flex-shrink: 0;
          width: var(--node-w); height: var(--node-w);
          display: flex; align-items: center; justify-content: center;
        }
        .tech-band-dot {
          width: 13px; height: 13px; border-radius: 50%;
          background: rgb(var(--bg-elevated)); border: 2.5px solid rgb(var(--accent));
          box-shadow: 0 0 0 5px rgb(var(--accent) / 0.12);
        }

        .tech-band-body {
          flex: 1; min-width: 0;
          background: rgb(var(--bg-elevated));
          border: 1px solid rgb(var(--border));
          border-radius: var(--radius-xl);
          padding: clamp(20px, 2.6vw, 28px);
          transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        .tech-band-body:hover { border-color: rgb(var(--accent) / 0.3); box-shadow: var(--shadow-card-hover); transform: translateY(-3px); }

        .tech-band-head { display: flex; align-items: baseline; gap: 14px; margin-bottom: 18px; }
        [dir="rtl"] .tech-band-head { text-align: right; }
        .tech-band-index {
          font-size: 13px; font-weight: 800; color: rgb(var(--accent) / 0.45);
          font-variant-numeric: tabular-nums; letter-spacing: 0.02em; flex-shrink: 0;
        }
        .tech-band-label { margin: 0 0 3px; font-size: 17px; font-weight: 800; letter-spacing: -0.02em; color: rgb(var(--text-primary)); }
        [dir="rtl"] .tech-band-label { letter-spacing: 0; }
        .tech-band-role { margin: 0; font-size: 12px; color: rgb(var(--text-tertiary)); font-weight: 500; }

        .tech-chip-row {
          list-style: none; margin: 0 0 16px; padding: 0;
          display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px;
        }
        .tech-chip {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 11px; border-radius: 12px;
          background: rgb(var(--bg-secondary)); border: 1px solid rgb(var(--border));
          transition: border-color 0.25s ease, background 0.25s ease, transform 0.25s cubic-bezier(0.16,1,0.3,1);
        }
        [dir="rtl"] .tech-chip { text-align: right; }
        .tech-chip:hover {
          border-color: var(--brand, rgb(var(--accent)));
          background: color-mix(in srgb, var(--brand, rgb(var(--accent))) 6%, rgb(var(--bg-secondary)));
          transform: translateY(-2px);
        }
        .tech-chip-logo {
          width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: color-mix(in srgb, var(--brand) 12%, transparent);
          color: var(--brand);
          transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        .tech-chip:hover .tech-chip-logo { transform: scale(1.12) rotate(-4deg); }
        .tech-chip-logo svg { width: 16px; height: 16px; }
        .tech-chip-text { display: flex; flex-direction: column; min-width: 0; gap: 1px; }
        .tech-chip-name { font-size: 12.5px; font-weight: 700; color: rgb(var(--text-primary)); }
        .tech-chip-value { font-size: 10.5px; color: rgb(var(--text-tertiary)); line-height: 1.4; }

        .tech-band-why {
          margin: 0; padding-top: 14px; border-top: 1px solid rgb(var(--border-light));
          font-size: 12.5px; line-height: 1.65; color: rgb(var(--text-secondary));
        }
        .tech-band-why-label { font-weight: 700; color: rgb(var(--accent)); }

        /* ── CTA — deliberately quieter than WhyYANSY's: this section's job
           is technical trust, not a hard conversion push (FAQ/Contact right
           after it own that). ── */
        .tech-cta { margin-top: clamp(3rem, 5vw, 4rem); text-align: center; }
        .tech-cta-text { margin: 0 0 14px; font-size: 13.5px; color: rgb(var(--text-tertiary)); }
        .tech-cta-btn svg { transition: transform 0.25s cubic-bezier(0.16,1,0.3,1); }
        .tech-cta-btn:hover svg { transform: ${isRTL ? 'translate(-3px,-3px) scaleX(-1)' : 'translate(3px,-3px)'}; }
      `}</style>

      <div className="tech-bg-grid" aria-hidden />
      <div className="tech-bg-grain" aria-hidden />
      <div className="tech-blob tech-blob--a" aria-hidden />
      <div className="tech-blob tech-blob--b" aria-hidden />

      <div className="section-inner tech-inner">

        <PremiumSectionHeader
          id={`tech-title-${uid}`}
          badge={isRTL ? 'التقنيات' : 'Technology'}
          title={isRTL ? 'مبنيّ مثل نظام،\nلا مجرد موقع.' : 'Built like a system,\nnot a website.'}
          accent={isRTL ? 'نظام' : 'system'}
          lead={isRTL
            ? 'نختار التقنية المناسبة لمشروعك — لا التقنية الرائجة. كل طبقة في هذه البنية موجودة لسبب تجاري واضح، لا لأنها عصرية.'
            : 'We choose the right technology for your project — not the trending one. Every layer of this architecture earns its place for a clear business reason, not because it\'s fashionable.'}
          font={font}
          isRTL={isRTL}
          revealed={revealed}
        />

        <div className="tech-blueprint-wrap">
          <ol ref={blueprintRef} className="tech-blueprint" aria-label={isRTL ? 'طبقات البنية التقنية' : 'System architecture layers'}>
            {LAYERS.map((layer, i) => (
              <LayerBand key={layer.key} layer={layer} index={i} isRTL={isRTL} font={font} />
            ))}
          </ol>

          {onStartProject && (
            <div className="tech-cta">
              <p className="tech-cta-text" style={{ fontFamily: font }}>
                {isRTL ? 'لديك متطلبات تقنية محددة؟' : 'Have a specific stack requirement?'}
              </p>
              <button onClick={onStartProject} className="btn-secondary tech-cta-btn">
                {isRTL ? 'لنتحدث عن البنية التقنية' : "Let's talk architecture"}
                <ArrowUpRight style={{ width: 15, height: 15, transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
              </button>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};

export default TechSection;
