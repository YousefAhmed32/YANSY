import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, CheckCircle2, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { getServiceBySlug, SERVICES } from '../data/services';
import { getCaseStudyBySlug } from '../data/caseStudies';
import { useSEO } from '../hooks/useSEO';
import { useLanguage } from '../contexts/LanguageContext';
import { trackWhatsAppClick } from '../utils/ga4';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProjectRequestForm from '../components/ProjectRequestForm';

gsap.registerPlugin(ScrollTrigger);

/* ── FAQ Item ─────────────────────────────────────────────────────── */
const FAQItem = ({ q, a, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border-b"
      style={{ borderColor: 'rgba(0,0,0,0.04)' }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <span style={{
          fontFamily: "'Inter',system-ui,sans-serif",
          fontSize: 'clamp(1rem, 2vw, 1.2rem)',
          fontWeight: 400,
          color: open ? '#2563EB' : 'rgba(255,255,255,0.88)',
          lineHeight: 1.4,
          transition: 'color 0.25s',
        }}>
          {q}
        </span>
        <ChevronDown
          size={18}
          style={{
            flexShrink: 0,
            marginTop: 4,
            color: open ? '#2563EB' : 'rgba(0,0,0,0.4)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.3s ease, color 0.25s',
          }}
        />
      </button>
      <div style={{
        maxHeight: open ? '400px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <p style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: '0.9rem',
          fontWeight: 400,
          color: 'rgba(0,0,0,0.55)',
          lineHeight: 1.8,
          paddingBottom: '1.25rem',
        }}>
          {a}
        </p>
      </div>
    </div>
  );
};

/* ── Main Page ────────────────────────────────────────────────────── */
const ServiceDetail = () => {
  const { slug } = useParams();
  const navigate  = useNavigate();
  const { isRTL } = useLanguage();
  const service   = getServiceBySlug(slug);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const heroRef     = useRef(null);
  const sectionsRef = useRef([]);

  useEffect(() => {
    if (!service) { navigate('/services', { replace: true }); }
  }, [service, navigate]);

  useSEO({
    title      : service?.metaTitle || `${service?.title} | YANSY TECH`,
    description: service?.metaDescription,
    keywords   : service?.keywords,
    canonical  : `https://yansytech.com/services/${slug}`,
    schema: service ? {
      '@context': 'https://schema.org',
      '@type': ['WebPage', 'Service'],
      '@id': `https://yansytech.com/services/${slug}#webpage`,
      'url': `https://yansytech.com/services/${slug}`,
      'name': service.metaTitle,
      'description': service.metaDescription,
      'provider': { '@id': 'https://yansytech.com/#organization' },
      'isPartOf': { '@id': 'https://yansytech.com/#website' },
      'breadcrumb': {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://yansytech.com/' },
          { '@type': 'ListItem', 'position': 2, 'name': 'Services', 'item': 'https://yansytech.com/services' },
          { '@type': 'ListItem', 'position': 3, 'name': service.title, 'item': `https://yansytech.com/services/${slug}` },
        ],
      },
      'mainEntity': {
        '@type': 'FAQPage',
        'mainEntity': service.faq.map(f => ({
          '@type': 'Question',
          'name': f.q,
          'acceptedAnswer': { '@type': 'Answer', 'text': f.a },
        })),
      },
    } : undefined,
  });

  useEffect(() => {
    if (!service) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-hero-anim]', { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out', delay: 0.1,
      });
      sectionsRef.current.filter(Boolean).forEach(el => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: 'top 80%' },
          opacity: 0, y: 24, duration: 0.65, ease: 'power3.out',
        });
      });
    });
    return () => ctx.revert();
  }, [service]);

  if (!service) return null;

  const sr = (i) => el => { sectionsRef.current[i] = el; };
  const whatsappUrl = `https://wa.me/201090385390?text=${encodeURIComponent(`Hello, I'm interested in your ${service.title} service.`)}`;

  return (
    <>
      <Header onStartProject={() => setIsFormOpen(true)} />

      <main className="bg-white text-[#0D1117] overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>

        {/* ── HERO ──────────────────────────────────────────────── */}
        <section
          ref={heroRef}
          className="relative min-h-[80vh] flex items-center overflow-hidden"
          style={{ paddingTop: '96px' }}
        >
          {/* Background gradient */}
          <div aria-hidden style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(37,99,235,0.06) 0%, transparent 70%)',
          }} />
          {/* Gold line top */}
          <div aria-hidden style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            background: 'linear-gradient(to right, transparent, rgba(37,99,235,0.3), transparent)',
          }} />

          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 w-full py-24">
            {/* Breadcrumb */}
            <nav data-hero-anim className="flex items-center gap-2 mb-8 opacity-0" aria-label="Breadcrumb">
              <Link to="/" style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: "'Inter', sans-serif" }}>Home</Link>
              <span style={{ color: 'rgba(0,0,0,0.18)' }}>›</span>
              <Link to="/services" style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: "'Inter', sans-serif" }}>Services</Link>
              <span style={{ color: 'rgba(0,0,0,0.18)' }}>›</span>
              <span style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563EB', fontFamily: "'Inter', sans-serif" }}>{service.title}</span>
            </nav>

            <div className="max-w-4xl">
              {/* Eyebrow */}
              <div data-hero-anim className="flex items-center gap-3 mb-6 opacity-0">
                <span aria-hidden style={{ display: 'inline-block', width: 32, height: 1, background: `linear-gradient(to right, ${service.color}, transparent)` }} />
                <span className="eyebrow" style={{ color: service.color }}>{service.hero.badge}</span>
              </div>

              {/* H1 */}
              <h1 data-hero-anim className="opacity-0" style={{
                fontFamily: "'Inter',system-ui,sans-serif",
                fontSize: 'clamp(2.8rem, 7vw, 7rem)',
                fontWeight: 700,
                lineHeight: 1.04,
                letterSpacing: '-0.03em',
                color: '#0D1117',
                marginBottom: '0.5rem',
              }}>
                {service.hero.h1}
                <br />
                <span style={{
                  backgroundImage: `linear-gradient(135deg, ${service.color} 0%, rgba(0,0,0,0.8) 55%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  {service.hero.h1Gradient}
                </span>
              </h1>

              {/* Subtitle */}
              <p data-hero-anim className="opacity-0" style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(1rem, 2vw, 1.15rem)',
                fontWeight: 400,
                color: 'rgba(0,0,0,0.52)',
                lineHeight: 1.75,
                maxWidth: '620px',
                marginTop: '1.5rem',
                marginBottom: '2.5rem',
              }}>
                {service.hero.sub}
              </p>

              {/* CTAs */}
              <div data-hero-anim className="flex flex-wrap gap-3 mb-12 opacity-0">
                <button
                  onClick={() => setIsFormOpen(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    padding: '14px 36px', background: '#2563EB', border: '2px solid #2563EB',
                    color: '#000', fontFamily: "'Inter', sans-serif",
                    fontSize: 10, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'background 0.3s, box-shadow 0.3s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#c4a030'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(37,99,235,0.35)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#2563EB'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  Start a Project <ArrowUpRight size={14} aria-hidden />
                </button>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackWhatsAppClick('service-detail')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    padding: '14px 28px', border: '2px solid rgba(0,0,0,0.1)',
                    color: 'rgba(0,0,0,0.65)', fontFamily: "'Inter', sans-serif",
                    fontSize: 10, fontWeight: 400, letterSpacing: '0.22em', textTransform: 'uppercase',
                    textDecoration: 'none',
                    transition: 'border-color 0.3s, color 0.3s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.4)'; e.currentTarget.style.color = '#0D1117'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; e.currentTarget.style.color = 'rgba(0,0,0,0.65)'; }}
                >
                  WhatsApp Us <ArrowUpRight size={14} aria-hidden />
                </a>
              </div>

              {/* Stats strip */}
              <div data-hero-anim className="grid grid-cols-2 sm:grid-cols-4 gap-0 opacity-0"
                style={{ borderTop: '1px solid rgba(0,0,0,0.06)', borderLeft: '1px solid rgba(0,0,0,0.06)', maxWidth: 560 }}>
                {service.hero.stats.map((s, i) => (
                  <div key={i} style={{
                    padding: '16px 14px',
                    borderRight: '1px solid rgba(0,0,0,0.06)',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                  }}>
                    <div style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 400, color: '#2563EB', lineHeight: 1 }}>{s.num}</div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 400, color: 'rgba(0,0,0,0.45)', marginTop: 4, letterSpacing: '0.08em' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── PROBLEM ───────────────────────────────────────────── */}
        <section ref={sr(0)} style={{ padding: 'clamp(5rem,10vw,8rem) 0', borderTop: '1px solid #E8EBF0' }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <div>
                <span className="eyebrow" style={{ display: 'block', marginBottom: '1rem' }}>The Problem</span>
                <h2 data-speakable style={{
                  fontFamily: "'Inter',system-ui,sans-serif",
                  fontSize: 'clamp(2rem, 4vw, 3.2rem)',
                  fontWeight: 400,
                  lineHeight: 1.15,
                  letterSpacing: '-0.015em',
                  color: '#0D1117',
                  marginBottom: '1.5rem',
                }}>
                  {service.problem.title}
                </h2>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.95rem', fontWeight: 400, color: 'rgba(0,0,0,0.52)', lineHeight: 1.85, marginBottom: '2rem' }}>
                  {service.problem.body}
                </p>
              </div>
              <div style={{ paddingTop: '3rem' }}>
                <ul className="space-y-3">
                  {service.problem.points.map((p, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(37,99,235,0.5)', marginTop: 8, flexShrink: 0 }} aria-hidden />
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', fontWeight: 400, color: 'rgba(0,0,0,0.55)', lineHeight: 1.7 }}>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── SOLUTION ──────────────────────────────────────────── */}
        <section ref={sr(1)} style={{ padding: 'clamp(5rem,10vw,8rem) 0', background: 'linear-gradient(180deg, #000 0%, #060504 50%, #000 100%)' }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <div style={{ paddingTop: '3rem', order: 2 }}>
                <ul className="space-y-3">
                  {service.solution.points.map((p, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <CheckCircle2 size={16} style={{ color: '#2563EB', marginTop: 4, flexShrink: 0 }} aria-hidden />
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', fontWeight: 400, color: 'rgba(0,0,0,0.65)', lineHeight: 1.7 }}>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ order: 1 }}>
                <span className="eyebrow" style={{ display: 'block', marginBottom: '1rem' }}>Our Solution</span>
                <h2 style={{
                  fontFamily: "'Inter',system-ui,sans-serif",
                  fontSize: 'clamp(2rem, 4vw, 3.2rem)',
                  fontWeight: 400,
                  lineHeight: 1.15,
                  letterSpacing: '-0.015em',
                  color: '#0D1117',
                  marginBottom: '1.5rem',
                }}>
                  {service.solution.title}
                </h2>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.95rem', fontWeight: 400, color: 'rgba(0,0,0,0.52)', lineHeight: 1.85 }}>
                  {service.solution.body}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── PROCESS ───────────────────────────────────────────── */}
        <section ref={sr(2)} style={{ padding: 'clamp(5rem,10vw,8rem) 0' }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
            <div className="text-center mb-16">
              <span className="eyebrow" style={{ display: 'block', marginBottom: '1rem' }}>How We Work</span>
              <h2 style={{
                fontFamily: "'Inter',system-ui,sans-serif",
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 400,
                lineHeight: 1.1,
                letterSpacing: '-0.015em',
                color: '#0D1117',
              }}>
                Our Process
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: 'rgba(0,0,0,0.03)' }}>
              {service.process.map((step, i) => (
                <div key={i} style={{
                  background: '#F6F7F9',
                  padding: 'clamp(1.5rem, 4vw, 2.5rem)',
                  transition: 'background 0.3s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#050504'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#000'; }}
                >
                  <div style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 48, fontWeight: 400, color: 'rgba(37,99,235,0.12)', lineHeight: 1, marginBottom: 16 }}>
                    {String(step.step).padStart(2, '0')}
                  </div>
                  <h3 style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: '1.2rem', fontWeight: 400, color: '#0D1117', marginBottom: 10, lineHeight: 1.3 }}>
                    {step.title}
                  </h3>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', fontWeight: 400, color: 'rgba(0,0,0,0.45)', lineHeight: 1.8 }}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── BENEFITS ──────────────────────────────────────────── */}
        <section ref={sr(3)} style={{ padding: 'clamp(5rem,10vw,8rem) 0', background: 'linear-gradient(180deg, #000 0%, #060504 50%, #000 100%)' }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
            <div className="text-center mb-16">
              <span className="eyebrow" style={{ display: 'block', marginBottom: '1rem' }}>What You Get</span>
              <h2 style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, color: '#0D1117', lineHeight: 1.1, letterSpacing: '-0.015em' }}>
                Built Into Every Project
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {service.benefits.map((b, i) => (
                <div key={i} className="card-premium" style={{ padding: 'clamp(1.5rem,4vw,2rem)' }}>
                  <div style={{ fontSize: 28, marginBottom: 16 }} aria-hidden>{b.icon}</div>
                  <h3 style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: '1.1rem', fontWeight: 500, color: '#0D1117', marginBottom: 8 }}>{b.title}</h3>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', fontWeight: 400, color: 'rgba(0,0,0,0.45)', lineHeight: 1.75 }}>{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TECH STACK ────────────────────────────────────────── */}
        <section ref={sr(4)} style={{ padding: 'clamp(3rem,6vw,5rem) 0', borderTop: '1px solid #E8EBF0' }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
            <div className="flex flex-wrap items-center gap-4">
              <span className="eyebrow" style={{ marginRight: 12 }}>Technology Stack:</span>
              {service.stack.map((tech, i) => (
                <span key={i} style={{
                  padding: '6px 16px',
                  border: '1px solid rgba(37,99,235,0.15)',
                  color: 'rgba(0,0,0,0.55)',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 11,
                  fontWeight: 400,
                  letterSpacing: '0.1em',
                  background: 'rgba(37,99,235,0.03)',
                }}>
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────── */}
        <section ref={sr(5)} style={{ padding: 'clamp(5rem,10vw,8rem) 0' }}>
          <div className="max-w-3xl mx-auto px-5 sm:px-8">
            <div className="text-center mb-12">
              <span className="eyebrow" style={{ display: 'block', marginBottom: '1rem' }}>FAQ</span>
              <h2 style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, color: '#0D1117', lineHeight: 1.1, letterSpacing: '-0.015em' }}>
                Common Questions
              </h2>
            </div>
            <div>
              {service.faq.map((item, i) => (
                <FAQItem key={i} q={item.q} a={item.a} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ── RELATED SERVICES ──────────────────────────────────── */}
        <section ref={sr(6)} style={{ padding: 'clamp(4rem,8vw,6rem) 0', borderTop: '1px solid #E8EBF0' }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
            <div className="mb-10">
              <span className="eyebrow" style={{ display: 'block', marginBottom: '0.75rem' }}>Also From YANSY TECH</span>
              <h2 style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 400, color: '#0D1117', letterSpacing: '-0.01em' }}>
                Related Services
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: 'rgba(0,0,0,0.03)' }}>
              {SERVICES.filter(s => s.slug !== slug).slice(0, 3).map(s => (
                <Link
                  key={s.slug}
                  to={`/services/${s.slug}`}
                  style={{ background: '#F6F7F9', padding: '2rem', display: 'block', transition: 'background 0.3s', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#070605'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#000'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(37,99,235,0.6)', fontFamily: "'Inter', sans-serif" }}>{s.tagline}</span>
                    <ArrowUpRight size={14} style={{ color: 'rgba(0,0,0,0.3)' }} aria-hidden />
                  </div>
                  <h3 style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: '1.3rem', fontWeight: 400, color: '#0D1117', lineHeight: 1.3 }}>{s.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── BOTTOM CTA ────────────────────────────────────────── */}
        <section ref={sr(7)} style={{
          padding: 'clamp(5rem,10vw,8rem) 0',
          background: 'linear-gradient(180deg, #000 0%, #060504 50%, #000 100%)',
          textAlign: 'center',
          borderTop: '1px solid #E8EBF0',
        }}>
          <div className="max-w-2xl mx-auto px-5 sm:px-8">
            <span className="eyebrow" style={{ display: 'block', marginBottom: '1rem' }}>Ready to Build?</span>
            <h2 style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 400, color: '#0D1117', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '1.5rem' }}>
              Let's Talk About Your {service.title} Project
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.95rem', fontWeight: 400, color: 'rgba(0,0,0,0.45)', lineHeight: 1.85, marginBottom: '2.5rem' }}>
              Free consultation. No obligation. We'll review your requirements and give you an honest scope, timeline, and budget estimate within 24 hours.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setIsFormOpen(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '16px 40px', background: '#2563EB', border: '2px solid #2563EB',
                  color: '#000', fontFamily: "'Inter', sans-serif",
                  fontSize: 10, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase',
                  cursor: 'pointer', transition: 'background 0.3s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#c4a030'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#2563EB'; }}
              >
                Get a Free Consultation <ArrowUpRight size={14} aria-hidden />
              </button>
            </div>
          </div>
        </section>

      </main>

      <Footer />

      <ProjectRequestForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </>
  );
};

export default ServiceDetail;
