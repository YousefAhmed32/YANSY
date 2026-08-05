import { useEffect, useId, useRef, useState } from 'react';
import { gsap } from 'gsap';
import {
  ArrowUpRight, Check, ShieldCheck,
  Compass, FileCheck2, PenTool, Hammer, FlaskConical, Rocket,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useReveal, revealStyle } from '../hooks/useReveal';
import SectionHeader from '../components/SectionHeader';

const FONT_EN = "'Inter',system-ui,sans-serif";
const FONT_AR = "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif";

/**
 * Six delivery milestones, each carrying four layers of copy instead of one:
 * what happens (desc), the risk it removes (risk) and what the client walks
 * away with (outcome) — on top of the title/tag pair the old cards had. The
 * icon vocabulary (Compass/PenTool/Hammer/FlaskConical/Rocket) intentionally
 * matches LaunchTimeline's case-study journey icons so "how we work" reads
 * as the same visual language site-wide, not a one-off glyph set.
 */
const STEPS = [
  {
    num: '01', Icon: Compass, color: 'rgb(var(--accent))',
    en: {
      title: 'Discovery Call', tag: 'Free · 30 minutes',
      desc: 'A free 30-minute consultation. We listen to your goals and understand your business before writing a single line of code.',
      risk: 'Removes the #1 cause of failed projects — building the wrong thing.',
      outcome: 'A clear, shared understanding of your goals',
    },
    ar: {
      title: 'مكالمة الاكتشاف', tag: 'مجاناً · 30 دقيقة',
      desc: 'استشارة مجانية 30 دقيقة. نستمع لأهدافك ونفهم عملك قبل كتابة أي سطر كود.',
      risk: 'يزيل السبب الأول لفشل المشاريع — بناء الشيء الخاطئ.',
      outcome: 'فهم واضح ومشترك لأهدافك',
    },
  },
  {
    num: '02', Icon: FileCheck2, color: '#7C3AED',
    en: {
      title: 'Proposal & Planning', tag: 'Within 48 hours',
      desc: 'A clear proposal within 48 hours — scope, timeline, milestones, pricing. No hidden fees, no vague estimates.',
      risk: 'No scope surprises later — price and timeline are locked in before work starts.',
      outcome: 'A fixed price & timeline, in writing',
    },
    ar: {
      title: 'العرض والتخطيط', tag: 'خلال 48 ساعة',
      desc: 'عرض واضح خلال 48 ساعة — النطاق والجدول والمراحل والتسعير. لا رسوم مخفية ولا تقديرات ضبابية.',
      risk: 'لا مفاجآت في النطاق لاحقاً — السعر والجدول الزمني محددان قبل بدء العمل.',
      outcome: 'سعر وجدول زمني ثابتان، مكتوبان',
    },
  },
  {
    num: '03', Icon: PenTool, color: '#0891B2',
    en: {
      title: 'Design & Prototype', tag: 'You see it before we code',
      desc: 'We build interactive prototypes first. You see and click through your product before we code it — revisions are cheap at this stage.',
      risk: "Design issues get caught while they're still cheap to fix — not after months of development.",
      outcome: 'A clickable prototype you can test',
    },
    ar: {
      title: 'التصميم والنموذج الأولي', tag: 'تراه قبل البرمجة',
      desc: 'نبني نماذج تفاعلية أولاً. ترى منتجك وتتفاعل معه قبل برمجته — التعديلات سهلة في هذه المرحلة.',
      risk: 'نكتشف مشاكل التصميم وهي لا تزال رخيصة الإصلاح — لا بعد أشهر من التطوير.',
      outcome: 'نموذج تفاعلي يمكنك تجربته',
    },
  },
  {
    num: '04', Icon: Hammer, color: '#059669',
    en: {
      title: 'Development', tag: 'Weekly updates',
      desc: 'A staging environment from day one and weekly progress updates. Every week you see exactly what was built — no silent weeks.',
      risk: 'No black-box months — you watch the product get built, on a live staging environment.',
      outcome: 'Weekly access to real progress',
    },
    ar: {
      title: 'التطوير', tag: 'تحديثات أسبوعية',
      desc: 'بيئة تجربة من اليوم الأول وتحديثات أسبوعية. كل أسبوع ترى ما تم بناؤه بالضبط — لا أسابيع صامتة.',
      risk: 'لا أشهر صامتة مبهمة — تشاهد المنتج وهو يُبنى، على بيئة تجربة حية.',
      outcome: 'وصول أسبوعي للتقدم الفعلي',
    },
  },
  {
    num: '05', Icon: FlaskConical, color: '#D97706',
    en: {
      title: 'Testing & QA', tag: 'All devices & browsers',
      desc: 'Every user flow tested across devices and browsers before delivery. You get a finished product, not a beta.',
      risk: 'You never receive an unfinished product disguised as "done" — every flow is verified first.',
      outcome: 'A tested, launch-ready product',
    },
    ar: {
      title: 'الاختبار وضمان الجودة', tag: 'كل الأجهزة والمتصفحات',
      desc: 'اختبار كل تدفق مستخدم على جميع الأجهزة والمتصفحات قبل التسليم. تحصل على منتج نهائي لا نسخة تجريبية.',
      risk: 'لن تستلم منتجاً غير مكتمل تحت مسمى "جاهز" — كل تدفق يُختبر أولاً.',
      outcome: 'منتج مُختبر وجاهز للإطلاق',
    },
  },
  {
    num: '06', Icon: Rocket, color: '#DC2626',
    en: {
      title: 'Launch & Support', tag: '30 days free support',
      desc: 'We handle deployment, then 30 days of free technical support — fixes, monitoring, and tweaks. You are never left alone after delivery.',
      risk: "You're not abandoned the moment the invoice clears — we stay through the first 30 days live.",
      outcome: 'A live product + 30 days of support',
    },
    ar: {
      title: 'الإطلاق والدعم', tag: '30 يوماً دعم مجاني',
      desc: 'نتولى النشر، ثم 30 يوماً من الدعم التقني المجاني — إصلاحات ومراقبة وتعديلات. لا تُترك وحيداً بعد التسليم.',
      risk: 'لن تُترك وحيداً فور دفع الفاتورة — نبقى معك خلال أول 30 يوماً من الإطلاق.',
      outcome: 'منتج مباشر + 30 يوماً من الدعم',
    },
  },
];

const AUTOPLAY_MS = 6000;

/**
 * "How we work", reframed as a guided tour instead of a card grid.
 *
 * A single ARIA-tabs widget: a step rail (vertical list + progress spine on
 * desktop, a horizontal numbered stepper on mobile — two different
 * interactions, not one grid reflowing) drives one shared detail panel. The
 * panel always states what happens, the risk it removes, and what the
 * client walks away with, so the section argues "this reduces your risk"
 * instead of just listing activities.
 *
 * No ScrollTrigger: this section is one of many lazy-loaded Home siblings,
 * and ScrollTrigger caches trigger position at creation time — by the time
 * this chunk resolves, later siblings have already shifted page height (the
 * same bug documented in TechSection.jsx). Entrance is gated by useReveal's
 * IntersectionObserver instead, which can't go stale that way; autoplay is
 * gated by its own lightweight observer so it never ticks while off-screen.
 */
const ProcessSection = ({ isRTL, onStartProject }) => {
  const { isRTL: ctxRTL } = useLanguage();
  const rtl = isRTL ?? ctxRTL;
  const font = rtl ? FONT_AR : FONT_EN;
  const uid = useId();

  const { ref: sectionRef, revealed } = useReveal({ threshold: 0.08 });
  const [activeIndex, setActiveIndex] = useState(0);
  const [inView, setInView] = useState(false);

  const panelRef = useRef(null);
  const tabRefs = useRef([]);
  const userInteractedRef = useRef(false);
  const pausedRef = useRef(false);
  const mountedRef = useRef(false);
  const railMountedRef = useRef(false);

  const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // Dedicated visibility gate for autoplay — separate from useReveal, which
  // latches "shown" forever the first time it fires and would otherwise let
  // the interval keep ticking long after the visitor scrolled away.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [sectionRef]);

  useEffect(() => {
    if (!inView || prefersReducedMotion() || userInteractedRef.current) return undefined;
    const id = setInterval(() => {
      if (pausedRef.current || userInteractedRef.current) return;
      setActiveIndex((i) => (i + 1) % STEPS.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [inView, activeIndex]);

  const pauseAutoplay = () => { pausedRef.current = true; };
  const resumeAutoplay = () => { pausedRef.current = false; };

  // Crossfade the panel's new content in. Content itself swaps instantly via
  // React re-render (so it's never wrong even if this effect can't run) —
  // this just plays a settle animation on top, and never on first mount.
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    if (!panelRef.current || prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(panelRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
    }, panelRef);
    return () => ctx.revert();
  }, [activeIndex]);

  // Keeps the active tab visible inside the (mobile) horizontally-scrolling
  // rail as activeIndex advances. Skipped on first mount: `block: 'nearest'`
  // walks up to the nearest scrollable ancestor for the vertical axis too,
  // and on desktop that ancestor is the *window* (the rail itself only
  // scrolls horizontally) — since this section sits well below the fold,
  // firing on mount silently scrolled the whole page down to Process on
  // every load. Real user/autoplay-driven changes still scroll the rail
  // normally; only the initial synthetic "activeIndex became 0" run is gated.
  useEffect(() => {
    if (!railMountedRef.current) { railMountedRef.current = true; return; }
    const el = tabRefs.current[activeIndex];
    if (!el) return;
    el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
  }, [activeIndex]);

  const selectStep = (index) => {
    userInteractedRef.current = true;
    setActiveIndex(index);
  };

  const onTabKeyDown = (e, index) => {
    const dirSign = rtl ? -1 : 1;
    let next = null;
    if (e.key === 'ArrowDown') next = (index + 1) % STEPS.length;
    else if (e.key === 'ArrowUp') next = (index - 1 + STEPS.length) % STEPS.length;
    else if (e.key === 'ArrowRight') next = (index + dirSign + STEPS.length) % STEPS.length;
    else if (e.key === 'ArrowLeft') next = (index - dirSign + STEPS.length) % STEPS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = STEPS.length - 1;
    if (next === null) return;
    e.preventDefault();
    userInteractedRef.current = true;
    setActiveIndex(next);
    tabRefs.current[next]?.focus();
  };

  const active = STEPS[activeIndex];
  const progress = activeIndex / (STEPS.length - 1);
  const panelId = `process-panel-${uid}`;

  return (
    <section
      id="process"
      ref={sectionRef}
      dir={rtl ? 'rtl' : 'ltr'}
      className="section-shell section-shell--tint"
      aria-labelledby={`process-title-${uid}`}
    >
      <style>{`
        .process-inner { position: relative; }

        /* ── Explorer shell: vertical rail + panel on desktop ── */
        .process-explorer {
          display: grid;
          grid-template-columns: minmax(260px, 320px) 1fr;
          gap: clamp(20px, 3vw, 44px);
          align-items: start;
        }
        @media (max-width: 860px) { .process-explorer { grid-template-columns: 1fr; } }

        /* ── Rail: desktop vertical list with a progress spine.
           The spine's position is derived from the same --process-num-size /
           --process-tab-pad-* values the num chip and tab padding use below,
           so it always lands through the chips' actual center regardless of
           later size tweaks — no hand-computed pixel guess to keep in sync. */
        .process-rail {
          --process-num-size: 44px;
          --process-tab-pad-y: 10px;
          --process-tab-pad-x: 12px;
          position: relative;
          list-style: none; margin: 0; padding: 0;
          display: flex; flex-direction: column; gap: 4px;
        }
        .process-rail::before,
        .process-rail::after {
          content: '';
          position: absolute;
          top: calc(var(--process-tab-pad-y) + var(--process-num-size) / 2);
          bottom: calc(var(--process-tab-pad-y) + var(--process-num-size) / 2);
          ${rtl ? 'right' : 'left'}: calc(var(--process-tab-pad-x) + var(--process-num-size) / 2 - 1px);
          width: 2px;
          border-radius: 2px;
        }
        .process-rail::before { background: rgb(var(--border)); }
        .process-rail::after {
          background: var(--step-accent, rgb(var(--accent)));
          transform-origin: top;
          transform: scaleY(${progress});
          transition: transform 0.5s cubic-bezier(0.16,1,0.3,1), background 0.4s ease;
        }

        .process-tab {
          position: relative; z-index: 1;
          display: flex; align-items: center; gap: 14px;
          width: 100%; border: none; background: transparent; cursor: pointer;
          padding: var(--process-tab-pad-y) var(--process-tab-pad-x); border-radius: var(--radius-lg);
          text-align: ${rtl ? 'right' : 'left'};
          transition: background 0.25s ease;
        }
        [dir="rtl"] .process-tab { flex-direction: row-reverse; }
        .process-tab:hover { background: rgb(var(--bg-elevated)); }
        .process-tab:focus-visible { outline: 2px solid rgb(var(--accent)); outline-offset: 2px; }
        .process-tab[aria-selected="true"] { background: rgb(var(--bg-elevated)); box-shadow: var(--shadow-sm); }

        .process-tab-num {
          flex-shrink: 0; width: var(--process-num-size); height: var(--process-num-size); border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
          background: rgb(var(--bg-elevated)); border: 1.5px solid rgb(var(--border));
          color: rgb(var(--text-tertiary));
          font-size: 13px; font-weight: 800; font-variant-numeric: tabular-nums;
          transition: background 0.3s ease, border-color 0.3s ease, color 0.3s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        .process-tab-num svg { width: 18px; height: 18px; stroke-width: 1.9; }
        .process-tab[aria-selected="true"] .process-tab-num {
          background: var(--step-accent); border-color: var(--step-accent); color: #fff;
          transform: scale(1.06);
        }
        .process-tab-text { min-width: 0; }
        .process-tab-title {
          display: block; font-size: 13.5px; font-weight: 700;
          color: rgb(var(--text-primary)); margin-bottom: 2px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        [dir="rtl"] .process-tab-title { white-space: normal; }
        .process-tab-tag {
          display: block; font-size: 11px; font-weight: 600;
          color: rgb(var(--text-tertiary));
        }
        .process-tab[aria-selected="true"] .process-tab-title { color: var(--step-accent); }

        /* ── Mobile: horizontal numeric stepper, titles hidden, scroll-snap ── */
        @media (max-width: 860px) {
          .process-rail {
            flex-direction: row; gap: 8px;
            overflow-x: auto; scroll-snap-type: x proximity;
            padding: 4px 2px 10px;
            -ms-overflow-style: none; scrollbar-width: none;
          }
          .process-rail::-webkit-scrollbar { display: none; }
          .process-rail::before, .process-rail::after { display: none; }
          .process-tab { flex-direction: column; width: auto; flex-shrink: 0; gap: 6px; padding: 6px; scroll-snap-align: center; }
          .process-tab-text { display: none; }
        }

        /* ── Panel ── */
        .process-panel {
          background: rgb(var(--bg-elevated));
          border: 1px solid rgb(var(--border));
          border-radius: var(--radius-xl);
          padding: clamp(24px, 3.2vw, 36px);
          box-shadow: var(--shadow-sm);
        }
        .process-panel-eyebrow {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          margin-bottom: 18px;
        }
        .process-panel-step-of {
          font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--step-accent); font-variant-numeric: tabular-nums;
        }
        [dir="rtl"] .process-panel-step-of { letter-spacing: 0; text-transform: none; }
        .process-panel-tag {
          font-size: 11.5px; font-weight: 600; color: rgb(var(--text-tertiary));
          background: rgb(var(--bg-secondary)); border: 1px solid rgb(var(--border));
          padding: 4px 10px; border-radius: 999px;
        }
        .process-panel-head { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
        [dir="rtl"] .process-panel-head { flex-direction: row-reverse; text-align: right; }
        .process-panel-icon {
          flex-shrink: 0; width: 56px; height: 56px; border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          background: color-mix(in srgb, var(--step-accent) 12%, transparent);
          color: var(--step-accent);
        }
        .process-panel-icon svg { width: 26px; height: 26px; stroke-width: 1.75; }
        .process-panel-title {
          margin: 0; font-size: clamp(1.25rem, 2.2vw, 1.625rem); font-weight: 800;
          letter-spacing: -0.02em; color: rgb(var(--text-primary));
        }
        [dir="rtl"] .process-panel-title { font-family: var(--font-arabic); letter-spacing: 0; }
        .process-panel-desc {
          font-size: 14.5px; line-height: 1.75; color: rgb(var(--text-secondary)); margin: 0 0 20px;
        }
        [dir="rtl"] .process-panel-desc { font-family: var(--font-arabic); line-height: 1.9; }

        .process-panel-risk {
          display: flex; gap: 10px; align-items: flex-start;
          padding: 14px 16px; border-radius: var(--radius-md);
          background: color-mix(in srgb, var(--step-accent) 6%, rgb(var(--bg-secondary)));
          border: 1px solid color-mix(in srgb, var(--step-accent) 18%, rgb(var(--border)));
          margin-bottom: 18px;
        }
        [dir="rtl"] .process-panel-risk { flex-direction: row-reverse; text-align: right; }
        .process-panel-risk svg { flex-shrink: 0; width: 17px; height: 17px; margin-top: 1px; color: var(--step-accent); }
        .process-panel-risk-label {
          font-size: 10.5px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;
          color: var(--step-accent); display: block; margin-bottom: 3px;
        }
        [dir="rtl"] .process-panel-risk-label { letter-spacing: 0; text-transform: none; }
        .process-panel-risk-text { font-size: 12.5px; line-height: 1.6; color: rgb(var(--text-secondary)); margin: 0; }
        [dir="rtl"] .process-panel-risk-text { font-family: var(--font-arabic); line-height: 1.8; }

        .process-panel-outcome {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 12.5px; font-weight: 700; color: rgb(var(--text-primary));
        }
        [dir="rtl"] .process-panel-outcome { flex-direction: row-reverse; font-family: var(--font-arabic); }
        .process-panel-outcome-check {
          flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--step-accent); color: #fff;
        }

        /* ── CTA ── */
        .process-cta {
          display: flex; flex-direction: column; align-items: center; gap: 14px;
          margin-top: clamp(3rem, 6vw, 4.5rem);
          padding-top: clamp(2.5rem, 5vw, 3.5rem);
          border-top: 1px solid rgb(var(--border));
        }
      `}</style>

      <div className="section-inner process-inner">
        <SectionHeader
          id={`process-title-${uid}`}
          align="center"
          eyebrow={rtl ? 'كيف نعمل' : 'Our Process'}
          title={rtl ? 'من اليوم الأول\nتعرف ما يحدث.' : "From day one,\nyou know exactly\nwhat's happening."}
          accent={rtl ? 'يحدث' : "happening"}
          lead={rtl
            ? 'لا أسابيع صامتة، لا مفاجآت في التسليم. ست مراحل، كل واحدة منها تزيل خطراً محدداً عن مشروعك.'
            : 'No silent weeks, no delivery surprises. Six milestones, each one removing a specific risk from your project.'}
          revealed={revealed}
          style={revealStyle(revealed, 0)}
        />

        <div
          className="process-explorer"
          style={revealStyle(revealed, 1)}
          onMouseEnter={pauseAutoplay}
          onMouseLeave={resumeAutoplay}
          onFocus={pauseAutoplay}
          onBlur={resumeAutoplay}
        >
          <div
            role="tablist"
            aria-orientation="vertical"
            aria-label={rtl ? 'مراحل التسليم' : 'Delivery milestones'}
            className="process-rail"
          >
            {STEPS.map((step, i) => {
              const copy = rtl ? step.ar : step.en;
              const isActive = i === activeIndex;
              return (
                <button
                  key={step.num}
                  ref={(el) => { tabRefs.current[i] = el; }}
                  type="button"
                  role="tab"
                  id={`process-tab-${uid}-${i}`}
                  aria-selected={isActive}
                  aria-controls={panelId}
                  aria-label={copy.title}
                  tabIndex={isActive ? 0 : -1}
                  className="process-tab"
                  style={{ '--step-accent': step.color }}
                  onClick={() => selectStep(i)}
                  onKeyDown={(e) => onTabKeyDown(e, i)}
                >
                  <span className="process-tab-num" aria-hidden>
                    {isActive ? <step.Icon /> : step.num}
                  </span>
                  <span className="process-tab-text">
                    <span className="process-tab-title" style={{ fontFamily: font }}>{copy.title}</span>
                    <span className="process-tab-tag" style={{ fontFamily: font }}>{copy.tag}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div
            ref={panelRef}
            id={panelId}
            role="tabpanel"
            tabIndex={0}
            aria-labelledby={`process-tab-${uid}-${activeIndex}`}
            className="process-panel"
            style={{ '--step-accent': active.color }}
          >
            <div className="process-panel-eyebrow">
              <span className="process-panel-step-of" dir="ltr">
                {rtl ? `خطوة ${activeIndex + 1} من ${STEPS.length}` : `Step ${activeIndex + 1} of ${STEPS.length}`}
              </span>
              <span className="process-panel-tag" style={{ fontFamily: font }}>{(rtl ? active.ar : active.en).tag}</span>
            </div>

            <div className="process-panel-head">
              <span className="process-panel-icon" aria-hidden><active.Icon /></span>
              <h3 className="process-panel-title" style={{ fontFamily: font }}>
                {(rtl ? active.ar : active.en).title}
              </h3>
            </div>

            <p className="process-panel-desc" style={{ fontFamily: font }}>
              {(rtl ? active.ar : active.en).desc}
            </p>

            <div className="process-panel-risk">
              <ShieldCheck aria-hidden />
              <div>
                <span className="process-panel-risk-label">{rtl ? 'لماذا يقلل المخاطر' : 'Why this reduces risk'}</span>
                <p className="process-panel-risk-text" style={{ fontFamily: font }}>{(rtl ? active.ar : active.en).risk}</p>
              </div>
            </div>

            <span className="process-panel-outcome">
              <span className="process-panel-outcome-check" aria-hidden><Check size={13} strokeWidth={3} /></span>
              <span style={{ fontFamily: font }}>{(rtl ? active.ar : active.en).outcome}</span>
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="process-cta" style={revealStyle(revealed, 2)}>
          <button
            onClick={onStartProject}
            className="btn-primary"
            style={{ fontSize: '14px', padding: '14px 32px' }}
          >
            {rtl ? 'ابدأ عملية المشروع' : 'Start the Project Process'}
            <ArrowUpRight style={{ width: 15, height: 15, transform: rtl ? 'scaleX(-1)' : 'none' }} aria-hidden />
          </button>
          <p style={{ fontSize: 12.5, color: 'rgb(var(--text-tertiary))', margin: 0, textAlign: 'center' }}>
            {rtl ? 'استشارة مجانية · لا التزام · رد خلال ساعتين' : 'Free consultation · No commitment · Reply within 2 hours'}
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
