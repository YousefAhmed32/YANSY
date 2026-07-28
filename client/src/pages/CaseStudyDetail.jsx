import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ArrowUpRight } from 'lucide-react';
import { getCaseStudyBySlug, CASE_STUDIES } from '../data/caseStudies';
import { useSEO } from '../hooks/useSEO';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProjectRequestForm from '../components/ProjectRequestForm';
import CaseStudyVisual from '../components/CaseStudyVisual';
import { trackViewContent } from '../utils/metaPixel';

const FONT_EN = "'Inter',system-ui,sans-serif";
const FONT_AR = "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif";

const CaseStudyDetail = () => {
  const { slug }    = useParams();
  const navigate    = useNavigate();
  const { isRTL }   = useLanguage();
  const font        = isRTL ? FONT_AR : FONT_EN;
  const cs          = getCaseStudyBySlug(slug);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const heroRef     = useRef(null);

  useEffect(() => {
    if (!cs) navigate('/case-studies', { replace: true });
  }, [cs, navigate]);

  useEffect(() => {
    if (cs) trackViewContent({ content_name: cs.title, content_type: 'case_study', content_category: cs.industry?.en });
  }, [cs]);

  const excerptEn = cs?.excerpt.en;

  useSEO({
    title      : cs ? `${cs.title} Case Study | YANSY TECH` : 'Case Study',
    description: excerptEn,
    keywords   : cs ? `${cs.title}, ${cs.industry.en}, ${cs.category.en}, YANSY TECH case study` : '',
    canonical  : `https://yansytech.com/case-studies/${slug}`,
    schema: cs ? {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': `${cs.title} Case Study — ${cs.tagline.en}`,
      'description': excerptEn,
      'author': { '@id': 'https://yansytech.com/#organization' },
      'publisher': { '@id': 'https://yansytech.com/#organization' },
      'url': `https://yansytech.com/case-studies/${slug}`,
      'breadcrumb': {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://yansytech.com/' },
          { '@type': 'ListItem', 'position': 2, 'name': 'Case Studies', 'item': 'https://yansytech.com/case-studies' },
          { '@type': 'ListItem', 'position': 3, 'name': cs.title, 'item': `https://yansytech.com/case-studies/${slug}` },
        ],
      },
    } : undefined,
  });

  useEffect(() => {
    if (!cs) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-hero-anim]', { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out', delay: 0.1 });
    }, heroRef);
    return () => ctx.revert();
  }, [cs]);

  if (!cs) return null;

  return (
    <>
      <Header onStartProject={() => setIsFormOpen(true)} />

      <main className="bg-white text-[#0D1117] overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>

        {/* ── HERO ──────────────────────────────────────────────── */}
        <section ref={heroRef} style={{ paddingTop: '100px', paddingBottom: '4rem', position: 'relative', overflow: 'hidden' }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12" style={{ position: 'relative', zIndex: 2, textAlign: isRTL ? 'right' : 'left' }}>
            {/* Breadcrumb */}
            <nav data-hero-anim className="opacity-0 flex items-center gap-2 mb-8" style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
              <Link to="/" style={{ fontSize: 11, letterSpacing: isRTL ? 0 : '0.2em', textTransform: isRTL ? 'none' : 'uppercase', color: 'rgba(0,0,0,0.3)', fontFamily: font }}>{isRTL ? 'الرئيسية' : 'Home'}</Link>
              <span style={{ color: 'rgba(0,0,0,0.18)' }}>{isRTL ? '‹' : '›'}</span>
              <Link to="/case-studies" style={{ fontSize: 11, letterSpacing: isRTL ? 0 : '0.2em', textTransform: isRTL ? 'none' : 'uppercase', color: 'rgba(0,0,0,0.3)', fontFamily: font }}>{isRTL ? 'أعمالنا' : 'Case Studies'}</Link>
              <span style={{ color: 'rgba(0,0,0,0.18)' }}>{isRTL ? '‹' : '›'}</span>
              <span style={{ fontSize: 11, letterSpacing: isRTL ? 0 : '0.2em', textTransform: isRTL ? 'none' : 'uppercase', color: '#2563EB', fontFamily: font }}>{cs.title}</span>
            </nav>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem', flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
              <span data-hero-anim className="opacity-0" style={{
                padding: '5px 14px',
                border: `1px solid ${cs.color}40`,
                background: `${cs.color}10`,
                color: cs.color,
                fontFamily: font,
                fontSize: 11, fontWeight: 400, letterSpacing: isRTL ? 0 : '0.18em', textTransform: isRTL ? 'none' : 'uppercase',
              }}>
                {isRTL ? cs.industry.ar : cs.industry.en}
              </span>
              <span data-hero-anim className="opacity-0" style={{ fontFamily: font, fontSize: 11, color: 'rgba(0,0,0,0.3)', letterSpacing: isRTL ? 0 : '0.12em', textTransform: isRTL ? 'none' : 'uppercase' }}>
                {isRTL ? cs.duration.ar : cs.duration.en} · {cs.year}
              </span>
            </div>

            <h1 data-hero-anim className="opacity-0" style={{
              fontFamily: "'Inter',system-ui,sans-serif",
              fontSize: 'clamp(2.8rem, 7vw, 6rem)',
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: '-0.03em',
              color: '#0D1117',
              maxWidth: '20ch',
              marginBottom: '1rem',
              marginInlineStart: isRTL ? 'auto' : 0,
            }}>
              {cs.title}
            </h1>
            <p data-hero-anim className="opacity-0" style={{
              fontFamily: font,
              fontSize: 'clamp(1.1rem, 2.5vw, 1.6rem)',
              fontWeight: 400,
              color: 'rgba(0,0,0,0.55)',
              lineHeight: 1.4,
              maxWidth: '52ch',
              marginBottom: '3rem',
              marginInlineStart: isRTL ? 'auto' : 0,
              fontStyle: isRTL ? 'normal' : 'italic',
            }}>
              {isRTL ? cs.tagline.ar : cs.tagline.en}
            </p>

            {/* Large cinematic visual panel */}
            <div data-hero-anim className="opacity-0 hero-visual-panel" style={{
              position: 'relative', width: '100%', aspectRatio: '21 / 10', borderRadius: 20, overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(13,17,23,0.18)',
            }}>
              <CaseStudyVisual
                slug={cs.slug}
                industryKey={cs.industryKey}
                color={cs.color}
                variant="hero"
                isRTL={isRTL}
                alt={`${cs.title} — ${isRTL ? cs.tagline.ar : cs.tagline.en}`}
              />
              {/* Bottom gradient for stat-card legibility */}
              <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 42%)' }} />

              {/* Featured category glass badge */}
              <div style={{
                position: 'absolute', top: 18, [isRTL ? 'right' : 'left']: 18,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 999,
                background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.22)',
              }}>
                <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: cs.color }} />
                <span style={{ fontFamily: font, fontSize: 10.5, fontWeight: 500, color: '#fff', letterSpacing: isRTL ? 0 : '0.1em', textTransform: isRTL ? 'none' : 'uppercase' }}>
                  {isRTL ? cs.industry.ar : cs.industry.en}
                </span>
              </div>

              {/* Floating glass stat cards */}
              <div className="hero-stats-row" style={{
                position: 'absolute', bottom: 18, insetInlineStart: 18, insetInlineEnd: 18,
                display: 'grid', gridTemplateColumns: `repeat(${Math.min(cs.results.length, 4)}, 1fr)`, gap: 10,
              }}>
                {cs.results.map((r, i) => (
                  <div key={i} style={{
                    padding: '12px 14px', borderRadius: 14,
                    background: 'rgba(13,17,23,0.35)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.14)',
                  }}>
                    <div style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(1.1rem,2vw,1.5rem)', fontWeight: 700, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{r.metric}</div>
                    <div style={{ fontFamily: font, fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.65)', marginTop: 4, letterSpacing: isRTL ? 0 : '0.05em' }}>{isRTL ? r.label.ar : r.label.en}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <style>{`
            @media (max-width: 640px) {
              .hero-stats-row { grid-template-columns: repeat(2, 1fr) !important; }
              .hero-visual-panel { aspect-ratio: 4 / 5 !important; }
            }
          `}</style>
        </section>

        {/* ── CHALLENGE ─────────────────────────────────────────── */}
        <section style={{ padding: 'clamp(4rem,8vw,7rem) 0', borderTop: '1px solid #E8EBF0' }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12" style={{ textAlign: isRTL ? 'right' : 'left' }}>
            <div className="grid lg:grid-cols-2 gap-16">
              <div>
                <span className="eyebrow" style={{ display: 'block', marginBottom: '1rem' }}>{isRTL ? 'التحدي' : 'The Challenge'}</span>
                <h2 style={{ fontFamily: font, fontSize: 'clamp(1.5rem,3vw,2.25rem)', fontWeight: 600, color: '#0D1117', lineHeight: 1.1, letterSpacing: isRTL ? 0 : '-0.025em', marginBottom: '1.5rem' }}>
                  {isRTL ? cs.challenge.title.ar : cs.challenge.title.en}
                </h2>
                <p style={{ fontFamily: font, fontSize: '0.9rem', fontWeight: 400, color: 'rgba(0,0,0,0.52)', lineHeight: 1.85 }}>
                  {isRTL ? cs.challenge.body.ar : cs.challenge.body.en}
                </p>
              </div>
              <div style={{ paddingTop: '3rem' }}>
                <ul className="space-y-3">
                  {cs.challenge.points.map((p, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(37,99,235,0.4)', marginTop: 8, flexShrink: 0 }} aria-hidden />
                      <span style={{ fontFamily: font, fontSize: '0.875rem', fontWeight: 400, color: 'rgba(0,0,0,0.52)', lineHeight: 1.75 }}>{isRTL ? p.ar : p.en}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── STRATEGY + UX ─────────────────────────────────────── */}
        <section style={{ padding: 'clamp(4rem,8vw,7rem) 0', background: '#FAFAFA', borderTop: '1px solid #E8EBF0', borderBottom: '1px solid #E8EBF0' }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12" style={{ textAlign: isRTL ? 'right' : 'left' }}>
            <div className="grid lg:grid-cols-2 gap-10">
              <div className="card-premium" style={{ padding: 'clamp(1.5rem,4vw,2.5rem)' }}>
                <span className="eyebrow" style={{ display: 'block', marginBottom: '1rem' }}>{isRTL ? 'الاستراتيجية' : 'Strategy'}</span>
                <h3 style={{ fontFamily: font, fontSize: 'clamp(1.3rem,2.5vw,1.8rem)', fontWeight: 400, color: '#0D1117', lineHeight: 1.2, marginBottom: '1rem' }}>{isRTL ? cs.strategy.title.ar : cs.strategy.title.en}</h3>
                <p style={{ fontFamily: font, fontSize: '0.875rem', fontWeight: 400, color: 'rgba(0,0,0,0.52)', lineHeight: 1.85 }}>{isRTL ? cs.strategy.body.ar : cs.strategy.body.en}</p>
              </div>
              <div className="card-premium" style={{ padding: 'clamp(1.5rem,4vw,2.5rem)' }}>
                <span className="eyebrow" style={{ display: 'block', marginBottom: '1rem' }}>{isRTL ? 'تجربة المستخدم' : 'UX Process'}</span>
                <h3 style={{ fontFamily: font, fontSize: 'clamp(1.3rem,2.5vw,1.8rem)', fontWeight: 400, color: '#0D1117', lineHeight: 1.2, marginBottom: '1rem' }}>{isRTL ? cs.uxProcess.title.ar : cs.uxProcess.title.en}</h3>
                <p style={{ fontFamily: font, fontSize: '0.875rem', fontWeight: 400, color: 'rgba(0,0,0,0.52)', lineHeight: 1.85 }}>{isRTL ? cs.uxProcess.body.ar : cs.uxProcess.body.en}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── KEY DECISIONS ─────────────────────────────────────── */}
        <section style={{ padding: 'clamp(4rem,8vw,7rem) 0' }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12" style={{ textAlign: isRTL ? 'right' : 'left' }}>
            <div className="mb-12">
              <span className="eyebrow" style={{ display: 'block', marginBottom: '1rem' }}>{isRTL ? 'البنية التقنية' : 'Technical Architecture'}</span>
              <h2 style={{ fontFamily: font, fontSize: 'clamp(1.5rem,3vw,2.25rem)', fontWeight: 600, color: '#0D1117', lineHeight: 1.08, letterSpacing: isRTL ? 0 : '-0.025em' }}>
                {isRTL ? 'قرارات هندسية رئيسية' : 'Key Engineering Decisions'}
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-px" style={{ background: 'rgba(0,0,0,0.03)' }}>
              {cs.keyDecisions.map((d, i) => (
                <div key={i} style={{ background: '#F6F7F9', padding: 'clamp(1.5rem,4vw,2.5rem)', transition: 'background 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F0F2F5'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#F6F7F9'; }}
                >
                  <div style={{ width: 32, height: 1, background: 'linear-gradient(to right, #2563EB, transparent)', marginBottom: 20 }} aria-hidden />
                  <h3 style={{ fontFamily: font, fontSize: '1.1rem', fontWeight: 500, color: '#0D1117', marginBottom: 10, lineHeight: 1.3 }}>{isRTL ? d.title.ar : d.title.en}</h3>
                  <p style={{ fontFamily: font, fontSize: '0.875rem', fontWeight: 400, color: 'rgba(0,0,0,0.45)', lineHeight: 1.8 }}>{isRTL ? d.desc.ar : d.desc.en}</p>
                </div>
              ))}
            </div>

            {/* Stack */}
            <div style={{ marginTop: '3rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
              <span className="eyebrow" style={{ marginInlineEnd: 8 }}>{isRTL ? ':التقنيات' : 'Stack:'}</span>
              {cs.stack.map((t, i) => (
                <span key={i} style={{
                  padding: '5px 14px', border: '1px solid rgba(37,99,235,0.15)',
                  color: 'rgba(0,0,0,0.52)', fontFamily: "'Inter', sans-serif",
                  fontSize: 11, fontWeight: 400, letterSpacing: '0.1em',
                  background: 'rgba(37,99,235,0.03)',
                }}>{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── OUTCOME ───────────────────────────────────────────── */}
        <section style={{ padding: 'clamp(4rem,8vw,7rem) 0', background: '#FAFAFA', borderTop: '1px solid #E8EBF0', borderBottom: '1px solid #E8EBF0' }}>
          <div className="max-w-3xl mx-auto px-5 sm:px-8" style={{ textAlign: isRTL ? 'right' : 'left' }}>
            <span className="eyebrow" style={{ display: 'block', marginBottom: '1rem' }}>{isRTL ? 'النتيجة' : 'The Outcome'}</span>
            <p style={{ fontFamily: font, fontSize: 'clamp(1.2rem,2.5vw,1.8rem)', fontWeight: 400, color: 'rgba(13,17,23,0.8)', lineHeight: 1.6, marginBottom: '3rem', fontStyle: isRTL ? 'normal' : 'italic' }}>
              {isRTL ? cs.outcome.ar : cs.outcome.en}
            </p>
            {/* Testimonial */}
            <blockquote style={{
              borderInlineStart: '2px solid rgba(37,99,235,0.3)',
              paddingInlineStart: '1.5rem',
              marginTop: '2rem',
            }}>
              <p style={{ fontFamily: font, fontSize: 'clamp(1.1rem,2vw,1.4rem)', fontWeight: 400, color: 'rgba(13,17,23,0.65)', lineHeight: 1.6, fontStyle: isRTL ? 'normal' : 'italic', marginBottom: '1rem' }}>
                "{isRTL ? cs.testimonial.quote.ar : cs.testimonial.quote.en}"
              </p>
              <footer style={{ fontFamily: font, fontSize: '0.875rem', fontWeight: 400 }}>
                <strong style={{ color: '#0D1117', fontWeight: 500 }}>{cs.testimonial.name}</strong>
                <span style={{ color: 'rgba(13,17,23,0.4)', marginInlineStart: 8 }}>— {isRTL ? cs.testimonial.role.ar : cs.testimonial.role.en}</span>
              </footer>
            </blockquote>
          </div>
        </section>

        {/* ── RELATED CASE STUDIES ──────────────────────────────── */}
        {cs.relatedStudies?.length > 0 && (
          <section style={{ padding: 'clamp(4rem,8vw,6rem) 0', borderTop: '1px solid #E8EBF0' }}>
            <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12" style={{ textAlign: isRTL ? 'right' : 'left' }}>
              <div className="mb-10">
                <span className="eyebrow" style={{ display: 'block', marginBottom: '0.75rem' }}>{isRTL ? 'المزيد من أعمالنا' : 'More Work'}</span>
                <h2 style={{ fontFamily: font, fontSize: 'clamp(1.25rem,2.5vw,1.75rem)', fontWeight: 600, color: '#0D1117', letterSpacing: isRTL ? 0 : '-0.02em' }}>{isRTL ? 'دراسات حالة ذات صلة' : 'Related Case Studies'}</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-px" style={{ background: 'rgba(0,0,0,0.03)' }}>
                {CASE_STUDIES.filter(c => cs.relatedStudies.includes(c.slug)).slice(0, 2).map(c => (
                  <Link key={c.slug} to={`/case-studies/${c.slug}`}
                    style={{ background: '#F6F7F9', textDecoration: 'none', display: 'flex', gap: '1.5rem', padding: 'clamp(1.5rem,4vw,2.5rem)', alignItems: 'center', transition: 'background 0.3s', flexDirection: isRTL ? 'row-reverse' : 'row' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F0F2F5'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#F6F7F9'; }}
                  >
                    <div style={{ position: 'relative', width: 80, height: 60, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                      <CaseStudyVisual slug={c.slug} industryKey={c.industryKey} color={c.color} variant="thumb" isRTL={isRTL} alt={c.title} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: font, fontSize: 10, color: 'rgba(0,0,0,0.35)', letterSpacing: isRTL ? 0 : '0.15em', textTransform: isRTL ? 'none' : 'uppercase', marginBottom: 6 }}>{isRTL ? c.industry.ar : c.industry.en}</div>
                      <div style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: '1.1rem', fontWeight: 400, color: '#0D1117', lineHeight: 1.3 }}>{c.title}</div>
                    </div>
                    <ArrowUpRight size={16} style={{ color: 'rgba(0,0,0,0.25)', flexShrink: 0, transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── CTA ───────────────────────────────────────────────── */}
        <section style={{ padding: 'clamp(5rem,10vw,8rem) 0', textAlign: 'center', borderTop: '1px solid #E8EBF0' }}>
          <div className="max-w-xl mx-auto px-5">
            <span className="eyebrow" style={{ display: 'block', marginBottom: '1rem' }}>{isRTL ? 'دورك الآن' : 'Your Turn'}</span>
            <h2 style={{ fontFamily: font, fontSize: 'clamp(1.75rem,4vw,2.75rem)', fontWeight: 700, color: '#0D1117', lineHeight: 1.06, letterSpacing: isRTL ? 0 : '-0.03em', marginBottom: '2rem' }}>
              {isRTL ? 'ابنِ شيئًا مثل هذا' : 'Build Something Like This'}
            </h2>
            <button
              onClick={() => setIsFormOpen(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '16px 40px', background: '#2563EB', border: '2px solid #2563EB',
                color: '#FFFFFF', fontFamily: font,
                fontSize: 10, fontWeight: 500, letterSpacing: isRTL ? 0 : '0.22em', textTransform: isRTL ? 'none' : 'uppercase',
                cursor: 'pointer', transition: 'background 0.3s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1D4ED8'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#2563EB'; }}
            >
              {isRTL ? 'ابدأ مشروعك' : 'Start a Project'} <ArrowUpRight size={14} style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
            </button>
          </div>
        </section>

      </main>

      <Footer />
      <ProjectRequestForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </>
  );
};

export default CaseStudyDetail;
