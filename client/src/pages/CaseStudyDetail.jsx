import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { getCaseStudyBySlug, CASE_STUDIES } from '../data/caseStudies';
import { useSEO } from '../hooks/useSEO';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProjectRequestForm from '../components/ProjectRequestForm';

const CaseStudyDetail = () => {
  const { slug }    = useParams();
  const navigate    = useNavigate();
  const { isRTL }   = useLanguage();
  const cs          = getCaseStudyBySlug(slug);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const heroRef     = useRef(null);
  const sectionsRef = useRef([]);

  useEffect(() => {
    if (!cs) navigate('/case-studies', { replace: true });
  }, [cs, navigate]);

  useSEO({
    title      : cs ? `${cs.title} Case Study | YANSY TECH` : 'Case Study',
    description: cs?.excerpt,
    keywords   : cs ? `${cs.title}, ${cs.industry}, ${cs.category}, YANSY TECH case study` : '',
    canonical  : `https://yansytech.com/case-studies/${slug}`,
    schema: cs ? {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': `${cs.title} Case Study — ${cs.tagline}`,
      'description': cs.excerpt,
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

  const sr = (i) => el => { sectionsRef.current[i] = el; };

  return (
    <>
      <Header onStartProject={() => setIsFormOpen(true)} />

      <main className="bg-black text-white overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>

        {/* ── HERO ──────────────────────────────────────────────── */}
        <section ref={heroRef} style={{ paddingTop: '100px', paddingBottom: '4rem', position: 'relative', overflow: 'hidden' }}>
          {/* BG image */}
          <div aria-hidden style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${cs.heroImage})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: 0.12, filter: 'blur(2px)',
          }} />
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, #000 100%)' }} />

          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12" style={{ position: 'relative', zIndex: 2 }}>
            {/* Breadcrumb */}
            <nav data-hero-anim className="opacity-0 flex items-center gap-2 mb-8">
              <Link to="/" style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: "'Inter', sans-serif" }}>Home</Link>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>›</span>
              <Link to="/case-studies" style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: "'Inter', sans-serif" }}>Case Studies</Link>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>›</span>
              <span style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#d4af37', fontFamily: "'Inter', sans-serif" }}>{cs.title}</span>
            </nav>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
              <span data-hero-anim className="opacity-0" style={{
                padding: '5px 14px',
                border: `1px solid ${cs.color}40`,
                background: `${cs.color}10`,
                color: cs.color,
                fontFamily: "'Inter', sans-serif",
                fontSize: 11, fontWeight: 400, letterSpacing: '0.18em', textTransform: 'uppercase',
              }}>
                {cs.industry}
              </span>
              <span data-hero-anim className="opacity-0" style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {cs.duration} · {cs.year}
              </span>
            </div>

            <h1 data-hero-anim className="opacity-0" style={{
              fontFamily: "'Inter',system-ui,sans-serif",
              fontSize: 'clamp(2.8rem, 7vw, 6rem)',
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: '-0.03em',
              color: '#fff',
              maxWidth: '20ch',
              marginBottom: '1rem',
            }}>
              {cs.title}
            </h1>
            <p data-hero-anim className="opacity-0" style={{
              fontFamily: "'Inter',system-ui,sans-serif",
              fontSize: 'clamp(1.1rem, 2.5vw, 1.6rem)',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.4,
              maxWidth: '52ch',
              marginBottom: '3rem',
              fontStyle: 'italic',
            }}>
              {cs.tagline}
            </p>

            {/* Results strip */}
            <div data-hero-anim className="opacity-0 grid grid-cols-2 sm:grid-cols-4 gap-0"
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)', borderLeft: '1px solid rgba(255,255,255,0.07)', maxWidth: 580 }}>
              {cs.results.map((r, i) => (
                <div key={i} style={{
                  padding: '18px 14px',
                  borderRight: '1px solid rgba(255,255,255,0.07)',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                }}>
                  <div style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 700, color: '#d4af37', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{r.metric}</div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.4)', marginTop: 4, letterSpacing: '0.08em' }}>{r.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CHALLENGE ─────────────────────────────────────────── */}
        <section style={{ padding: 'clamp(4rem,8vw,7rem) 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-16">
              <div>
                <span className="eyebrow" style={{ display: 'block', marginBottom: '1rem' }}>The Challenge</span>
                <h2 style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(1.5rem,3vw,2.25rem)', fontWeight: 600, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.025em', marginBottom: '1.5rem' }}>
                  {cs.challenge.title}
                </h2>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', fontWeight: 400, color: 'rgba(255,255,255,0.55)', lineHeight: 1.85 }}>
                  {cs.challenge.body}
                </p>
              </div>
              <div style={{ paddingTop: '3rem' }}>
                <ul className="space-y-3">
                  {cs.challenge.points.map((p, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(212,175,55,0.4)', marginTop: 8, flexShrink: 0 }} aria-hidden />
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', fontWeight: 400, color: 'rgba(255,255,255,0.55)', lineHeight: 1.75 }}>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── STRATEGY + UX ─────────────────────────────────────── */}
        <section style={{ padding: 'clamp(4rem,8vw,7rem) 0', background: 'linear-gradient(180deg, #000 0%, #060504 50%, #000 100%)' }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-10">
              <div className="card-premium" style={{ padding: 'clamp(1.5rem,4vw,2.5rem)' }}>
                <span className="eyebrow" style={{ display: 'block', marginBottom: '1rem' }}>Strategy</span>
                <h3 style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(1.3rem,2.5vw,1.8rem)', fontWeight: 400, color: '#fff', lineHeight: 1.2, marginBottom: '1rem' }}>{cs.strategy.title}</h3>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', fontWeight: 400, color: 'rgba(255,255,255,0.55)', lineHeight: 1.85 }}>{cs.strategy.body}</p>
              </div>
              <div className="card-premium" style={{ padding: 'clamp(1.5rem,4vw,2.5rem)' }}>
                <span className="eyebrow" style={{ display: 'block', marginBottom: '1rem' }}>UX Process</span>
                <h3 style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(1.3rem,2.5vw,1.8rem)', fontWeight: 400, color: '#fff', lineHeight: 1.2, marginBottom: '1rem' }}>{cs.uxProcess.title}</h3>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', fontWeight: 400, color: 'rgba(255,255,255,0.55)', lineHeight: 1.85 }}>{cs.uxProcess.body}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── KEY DECISIONS ─────────────────────────────────────── */}
        <section style={{ padding: 'clamp(4rem,8vw,7rem) 0' }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
            <div className="mb-12">
              <span className="eyebrow" style={{ display: 'block', marginBottom: '1rem' }}>Technical Architecture</span>
              <h2 style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(1.5rem,3vw,2.25rem)', fontWeight: 600, color: '#fff', lineHeight: 1.08, letterSpacing: '-0.025em' }}>
                Key Engineering Decisions
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-px" style={{ background: 'rgba(255,255,255,0.04)' }}>
              {cs.keyDecisions.map((d, i) => (
                <div key={i} style={{ background: '#000', padding: 'clamp(1.5rem,4vw,2.5rem)', transition: 'background 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#060504'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#000'; }}
                >
                  <div style={{ width: 32, height: 1, background: 'linear-gradient(to right, #d4af37, transparent)', marginBottom: 20 }} aria-hidden />
                  <h3 style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: '1.1rem', fontWeight: 500, color: '#fff', marginBottom: 10, lineHeight: 1.3 }}>{d.title}</h3>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', fontWeight: 400, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>{d.desc}</p>
                </div>
              ))}
            </div>

            {/* Stack */}
            <div style={{ marginTop: '3rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
              <span className="eyebrow" style={{ marginRight: 8 }}>Stack:</span>
              {cs.stack.map((t, i) => (
                <span key={i} style={{
                  padding: '5px 14px', border: '1px solid rgba(212,175,55,0.15)',
                  color: 'rgba(255,255,255,0.55)', fontFamily: "'Inter', sans-serif",
                  fontSize: 11, fontWeight: 400, letterSpacing: '0.1em',
                  background: 'rgba(212,175,55,0.03)',
                }}>{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── OUTCOME ───────────────────────────────────────────── */}
        <section style={{ padding: 'clamp(4rem,8vw,7rem) 0', background: 'linear-gradient(180deg, #000 0%, #060504 50%, #000 100%)' }}>
          <div className="max-w-3xl mx-auto px-5 sm:px-8">
            <span className="eyebrow" style={{ display: 'block', marginBottom: '1rem' }}>The Outcome</span>
            <p style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(1.2rem,2.5vw,1.8rem)', fontWeight: 400, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: '3rem', fontStyle: 'italic' }}>
              {cs.outcome}
            </p>
            {/* Testimonial */}
            <blockquote style={{
              borderLeft: '2px solid rgba(212,175,55,0.3)',
              paddingLeft: '1.5rem',
              marginTop: '2rem',
            }}>
              <p style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(1.1rem,2vw,1.4rem)', fontWeight: 400, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '1rem' }}>
                "{cs.testimonial.quote}"
              </p>
              <footer style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', fontWeight: 400 }}>
                <strong style={{ color: '#fff', fontWeight: 500 }}>{cs.testimonial.name}</strong>
                <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>— {cs.testimonial.role}</span>
              </footer>
            </blockquote>
          </div>
        </section>

        {/* ── RELATED CASE STUDIES ──────────────────────────────── */}
        {cs.relatedStudies?.length > 0 && (
          <section style={{ padding: 'clamp(4rem,8vw,6rem) 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
              <div className="mb-10">
                <span className="eyebrow" style={{ display: 'block', marginBottom: '0.75rem' }}>More Work</span>
                <h2 style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(1.25rem,2.5vw,1.75rem)', fontWeight: 600, color: '#fff', letterSpacing: '-0.02em' }}>Related Case Studies</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-px" style={{ background: 'rgba(255,255,255,0.04)' }}>
                {CASE_STUDIES.filter(c => cs.relatedStudies.includes(c.slug)).slice(0, 2).map(c => (
                  <Link key={c.slug} to={`/case-studies/${c.slug}`}
                    style={{ background: '#000', textDecoration: 'none', display: 'flex', gap: '1.5rem', padding: 'clamp(1.5rem,4vw,2.5rem)', alignItems: 'center', transition: 'background 0.3s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#060504'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#000'; }}
                  >
                    <img src={c.heroImage} alt={c.title} loading="lazy" style={{ width: 80, height: 60, objectFit: 'cover', flexShrink: 0, opacity: 0.7 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>{c.industry}</div>
                      <div style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: '1.1rem', fontWeight: 400, color: '#fff', lineHeight: 1.3 }}>{c.title}</div>
                    </div>
                    <ArrowUpRight size={16} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} aria-hidden />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── CTA ───────────────────────────────────────────────── */}
        <section style={{ padding: 'clamp(5rem,10vw,8rem) 0', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="max-w-xl mx-auto px-5">
            <span className="eyebrow" style={{ display: 'block', marginBottom: '1rem' }}>Your Turn</span>
            <h2 style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(1.75rem,4vw,2.75rem)', fontWeight: 700, color: '#fff', lineHeight: 1.06, letterSpacing: '-0.03em', marginBottom: '2rem' }}>
              Build Something Like This
            </h2>
            <button
              onClick={() => setIsFormOpen(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '16px 40px', background: '#d4af37', border: '2px solid #d4af37',
                color: '#000', fontFamily: "'Inter', sans-serif",
                fontSize: 10, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'background 0.3s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#c4a030'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#d4af37'; }}
            >
              Start a Project <ArrowUpRight size={14} aria-hidden />
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
