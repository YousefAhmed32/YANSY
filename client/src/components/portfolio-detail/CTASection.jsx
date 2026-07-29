import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, FileText, MessagesSquare, Rocket } from 'lucide-react';
import Reveal from '../Reveal';
import { trackWhatsAppClick } from '../../utils/ga4';

const WHATSAPP_ICON_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z';

const FONT_EN = "'Inter',system-ui,sans-serif";
const FONT_AR = "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif";

const GUARANTEES = {
  en: [
    'Free 30-minute consultation — no commitment',
    'A senior strategist replies within 2 hours',
    'Fixed-scope proposal within 48 hours',
    'You own 100% of the code, always',
  ],
  ar: [
    'استشارة مجانية 30 دقيقة — بدون أي التزام',
    'يرد عليك مستشار أول خلال ساعتين',
    'عرض واضح النطاق خلال 48 ساعة',
    'ملكية كاملة للكود، دائماً لك',
  ],
};

const PROCESS_STEPS = {
  en: [
    { Icon: MessagesSquare, title: 'Share your brief', desc: "Two minutes, one message — tell us what you're building and what success looks like." },
    { Icon: FileText, title: 'Get a fixed-scope proposal', desc: 'A senior strategist reviews it and sends a clear plan: timeline, deliverables, price. No surprises later.' },
    { Icon: Rocket, title: 'We start building', desc: 'Once you approve, your dedicated team kicks off — with weekly updates, not radio silence.' },
  ],
  ar: [
    { Icon: MessagesSquare, title: 'شاركنا تفاصيل مشروعك', desc: 'دقيقتان ورسالة واحدة — أخبرنا بما تريد بناءه وكيف يبدو النجاح بالنسبة لك.' },
    { Icon: FileText, title: 'استلم عرضاً واضح النطاق', desc: 'يراجع مستشار أول طلبك ويرسل خطة واضحة: الجدول الزمني، المخرجات، والسعر. بدون مفاجآت لاحقاً.' },
    { Icon: Rocket, title: 'نبدأ التنفيذ', desc: 'بمجرد موافقتك، يبدأ فريقك المخصص العمل — بتحديثات أسبوعية، بدون انقطاع في التواصل.' },
  ],
};

const GuaranteeRow = ({ text, isRTL, font }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row', textAlign: isRTL ? 'right' : 'left' }}>
    <div aria-hidden style={{
      width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
      background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.28)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.75" width="10" height="10"><polyline points="20 6 9 17 4 12" /></svg>
    </div>
    <span style={{ fontFamily: font, fontSize: 13.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.72)' }}>{text}</span>
  </div>
);

const ProcessStep = ({ n, Icon, title, desc, isLast, isRTL, font }) => (
  <div className="cta-process-step" style={{ flexDirection: isRTL ? 'row-reverse' : 'row', textAlign: isRTL ? 'right' : 'left', paddingBottom: isLast ? 0 : 26 }}>
    <div aria-hidden className="cta-process-num">
      <Icon style={{ width: 14, height: 14 }} />
    </div>
    <div style={{ paddingTop: 4 }}>
      <p style={{ fontFamily: font, fontSize: 10.5, fontWeight: 700, letterSpacing: isRTL ? 0 : '0.1em', textTransform: isRTL ? 'none' : 'uppercase', color: '#93C5FD', margin: '0 0 5px' }}>
        {isRTL ? `الخطوة ${n}` : `Step ${n}`}
      </p>
      <p style={{ fontFamily: font, fontSize: 14.5, fontWeight: 700, color: '#fff', margin: '0 0 5px', letterSpacing: isRTL ? 0 : '-0.01em' }}>{title}</p>
      <p style={{ fontFamily: font, fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{desc}</p>
    </div>
  </div>
);

/**
 * The case study's closing sales moment — a dark, contained "studio" panel
 * (same #0D1117 treatment ContactSection uses) rather than a light-on-light
 * button strip, so it reads as a deliberate final beat instead of the page
 * just running out of content. Left column carries the emotional pitch +
 * risk-reversal guarantees; right column previews exactly what happens after
 * the visitor reaches out, since uncertainty about "what happens next" is
 * what kills case-study conversions. Guarantee copy (30-min consult, 2-hour
 * reply, 48-hour proposal) is pulled verbatim from ContactSection so the
 * promise is consistent everywhere on the site — the previous version of
 * this section quoted "24 hours", which contradicted that page.
 */
const CTASection = ({ project, title, isRTL, onStartProject }) => {
  const font = isRTL ? FONT_AR : FONT_EN;
  const topMetric = project.metrics?.[0];
  const guarantees = isRTL ? GUARANTEES.ar : GUARANTEES.en;
  const steps = isRTL ? PROCESS_STEPS.ar : PROCESS_STEPS.en;

  const waMsg = encodeURIComponent(
    isRTL ? `مرحباً! شفت مشروع "${title}" وأريد شيء مشابه.` : `Hi! I saw the "${title}" project and I'd love to build something similar.`
  );

  const metricLabel = topMetric && (isRTL ? (topMetric.labelAr || topMetric.label) : topMetric.label)?.trim();
  const subcopy = topMetric
    ? (isRTL
        ? `مشروع "${title}" حقق ${topMetric.value} ${metricLabel}. مشروعك يبدأ بنفس الطريقة — رسالة مختصرة، مستشار أول، وخطة واضحة تفهمها من أول قراءة.`
        : `"${title}" delivered ${topMetric.value} ${metricLabel}. Yours starts the exact same way — a short brief, a senior strategist, and a plan you'll actually understand.`)
    : (isRTL
        ? `مشروع "${title}" بدأ من حيث أنت الآن تماماً. رسالة مختصرة، مستشار أول، وخطة واضحة تفهمها من أول قراءة.`
        : `"${title}" started exactly where you are right now. A short brief, a senior strategist, and a plan you'll actually understand.`);

  return (
    <section className="section-shell cta-close" style={{ background: '#0D1117', borderTop: 'none', position: 'relative', overflow: 'hidden' }} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Layered background: dot-grid texture + soft accent glow, matching ContactSection's dark-panel treatment */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', top: '-10%', insetInlineEnd: '-8%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.22) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', bottom: '-15%', insetInlineStart: '-6%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

      <div className="section-inner" style={{ position: 'relative', zIndex: 1 }}>
        <Reveal distance={12}>
          <Link to="/portfolio" className="cta-back-link" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <ArrowLeft style={{ width: 12, height: 12, transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
            {isRTL ? 'عودة للمحفظة' : 'Back to Portfolio'}
          </Link>
        </Reveal>

        <div className="cta-grid" style={{ marginTop: 'clamp(2rem, 4vw, 3rem)' }}>
          {/* Left: pitch */}
          <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
            <Reveal distance={16}>
              <span className="section-label" style={{ background: 'rgba(37,99,235,0.14)', border: '1px solid rgba(37,99,235,0.28)', color: '#93C5FD', boxShadow: 'none', marginBottom: 22 }}>
                {isRTL ? 'دورك الآن' : 'Your Turn'}
              </span>

              <h2 style={{
                fontFamily: font, fontSize: 'clamp(2rem, 4.2vw, 3.25rem)', fontWeight: 800,
                letterSpacing: isRTL ? 0 : '-0.03em', lineHeight: isRTL ? 1.35 : 1.1,
                color: '#fff', marginBottom: 18, maxWidth: '16ch',
              }}>
                {isRTL ? 'كل مشروع تراه هنا بدأ برسالة واحدة فقط.' : <>Every project here started<br />with <span style={{ color: '#60A5FA' }}>one message.</span></>}
              </h2>

              <p style={{ fontFamily: font, fontSize: 15.5, color: 'rgba(255,255,255,0.55)', maxWidth: 460, lineHeight: 1.7, marginBottom: 'clamp(2rem, 4vw, 2.75rem)' }}>
                {subcopy}
              </p>
            </Reveal>

            <Reveal stagger distance={12} step={0.06} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 'clamp(2rem, 4vw, 2.75rem)' }}>
              {guarantees.map((g, i) => <GuaranteeRow key={i} text={g} isRTL={isRTL} font={font} />)}
            </Reveal>

            <Reveal distance={12}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <button onClick={onStartProject} className="btn-accent" style={{ fontSize: 13.5, padding: '14px 30px' }}>
                  {isRTL ? 'ابدأ مشروعك' : 'Start Your Project'}
                  <ArrowRight style={{ width: 14, height: 14, transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
                </button>

                <a
                  href={`https://wa.me/201090385390?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
                  onClick={() => trackWhatsAppClick('portfolio-detail')}
                  className="cta-wa-btn"
                  style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
                >
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d={WHATSAPP_ICON_PATH} /></svg>
                  {isRTL ? 'تواصل عبر واتساب' : 'Chat on WhatsApp'}
                </a>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse-dot 2s ease-in-out infinite', flexShrink: 0 }} />
                <span style={{ fontFamily: font, fontSize: 12, fontWeight: 600, color: '#4ADE80' }}>{isRTL ? 'نقبل مشاريع جديدة' : 'Accepting new projects'}</span>
                <span aria-hidden style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
                <span style={{ fontFamily: font, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{isRTL ? 'نرد خلال ساعتين' : 'Reply within 2 hours'}</span>
              </div>
            </Reveal>
          </div>

          {/* Right: process preview card */}
          <Reveal distance={20} className="cta-card-wrap">
            <div className="cta-card">
              <p style={{ fontFamily: font, fontSize: 10.5, fontWeight: 700, letterSpacing: isRTL ? 0 : '0.12em', textTransform: isRTL ? 'none' : 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 22px', textAlign: isRTL ? 'right' : 'left' }}>
                {isRTL ? 'ماذا يحدث بعد ذلك' : 'What Happens Next'}
              </p>

              <div>
                {steps.map((s, i) => (
                  <ProcessStep key={i} n={i + 1} Icon={s.Icon} title={s.title} desc={s.desc} isLast={i === steps.length - 1} isRTL={isRTL} font={font} />
                ))}
              </div>

              <div style={{ marginTop: 24, paddingTop: 22, borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: isRTL ? 'right' : 'left' }}>
                <p style={{ fontFamily: font, fontSize: 12.5, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.6 }}>
                  {isRTL ? 'بدون مكالمات مبيعات. بدون ضغط. فقط خطة واضحة.' : 'No sales calls. No pressure. Just a clear plan.'}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      <style>{`
        .cta-close .cta-back-link {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.4);
          text-decoration: none; transition: color 0.2s ease;
        }
        .cta-close .cta-back-link:hover { color: rgba(255,255,255,0.75); }

        .cta-grid { display: grid; grid-template-columns: 1.15fr 1fr; gap: clamp(3rem, 6vw, 6rem); align-items: start; }
        @media (max-width: 880px) { .cta-grid { grid-template-columns: 1fr; } }

        .cta-wa-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13.5px 28px; border-radius: var(--radius-md);
          background: rgba(37,211,102,0.08); border: 1.5px solid rgba(37,211,102,0.25);
          color: #4ADE80; font-size: 13.5px; font-weight: 600;
          text-decoration: none; transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
          white-space: nowrap;
        }
        .cta-wa-btn:hover { background: rgba(37,211,102,0.15); border-color: rgba(37,211,102,0.4); transform: translateY(-2px); }
        .cta-wa-btn:active { transform: scale(0.975) translateY(0); }

        .cta-card-wrap { width: 100%; }
        .cta-card {
          position: relative; width: 100%; box-sizing: border-box;
          background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.09);
          border-radius: var(--radius-xl); padding: clamp(26px, 3.2vw, 36px);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 24px 64px rgba(0,0,0,0.35);
        }

        .cta-process-step { display: flex; gap: 14px; position: relative; }
        .cta-process-num {
          width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(37,99,235,0.16); border: 1px solid rgba(37,99,235,0.35);
          color: #93C5FD; position: relative; z-index: 1;
        }
        .cta-process-step:not(:last-child) .cta-process-num::after {
          content: ''; position: absolute; top: 30px; bottom: -26px; left: 50%;
          width: 1.5px; transform: translateX(-50%);
          background: linear-gradient(to bottom, rgba(37,99,235,0.35), rgba(255,255,255,0.06));
        }
      `}</style>
    </section>
  );
};

export default CTASection;
