import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight } from 'lucide-react';
import { CASE_STUDIES } from '../data/caseStudies';
import { useSEO } from '../hooks/useSEO';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProjectRequestForm from '../components/ProjectRequestForm';
import CaseStudyVisual from '../components/CaseStudyVisual';

gsap.registerPlugin(ScrollTrigger);

const FONT_EN = "'Inter',system-ui,sans-serif";
const FONT_AR = "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif";

const INDUSTRY_FILTERS = [
  { key: 'all', en: 'All', ar: 'الكل' },
  { key: 'real-estate', en: 'Real Estate', ar: 'العقارات' },
  { key: 'fintech-saas', en: 'FinTech / SaaS', ar: 'تقنية مالية / SaaS' },
  { key: 'ecommerce', en: 'E-Commerce', ar: 'التجارة الإلكترونية' },
  { key: 'healthcare', en: 'Healthcare', ar: 'الرعاية الصحية' },
  { key: 'manufacturing', en: 'Manufacturing & Distribution', ar: 'التصنيع والتوزيع' },
  { key: 'logistics', en: 'Logistics & Delivery', ar: 'اللوجستيات والتوصيل' },
  { key: 'restaurants', en: 'Restaurants & Food Service', ar: 'المطاعم وخدمات الطعام' },
  { key: 'education', en: 'Education & Academies', ar: 'التعليم والأكاديميات' },
  { key: 'hospitality', en: 'Hotels & Hospitality', ar: 'الفنادق والضيافة' },
];

const CaseStudies = () => {
  const { isRTL }       = useLanguage();
  const font = isRTL ? FONT_AR : FONT_EN;
  const [active, setActive]     = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const heroRef = useRef(null);
  const gridRef = useRef(null);

  const filtered = active === 'all' ? CASE_STUDIES : CASE_STUDIES.filter(c => c.industryKey === active);

  useSEO({
    title      : isRTL ? 'أعمالنا | يانسي تك' : 'Case Studies | YANSY TECH',
    description: isRTL
      ? 'منتجات رقمية حقيقية بناها فريق يانسي تك — منصات تجارة إلكترونية، لوحات SaaS، أنظمة ERP، أنظمة حجز، وتطبيقات جوال. أكثر من 50 مشروعًا مُسلَّمًا.'
      : 'Real digital products built by YANSY TECH — e-commerce platforms, SaaS dashboards, enterprise ERPs, booking systems, and mobile apps. 50+ projects delivered.',
    keywords   : 'web development case studies, SaaS development portfolio, e-commerce case studies, digital product portfolio, YANSY TECH projects',
    canonical  : 'https://yansytech.com/case-studies',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      'url': 'https://yansytech.com/case-studies',
      'name': 'Case Studies | YANSY TECH',
      'isPartOf': { '@id': 'https://yansytech.com/#website' },
      'breadcrumb': {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://yansytech.com/' },
          { '@type': 'ListItem', 'position': 2, 'name': 'Case Studies', 'item': 'https://yansytech.com/case-studies' },
        ],
      },
    },
  });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-hero-anim]', { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out', delay: 0.15 });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll('[data-card]');
    if (!cards?.length) return;
    const ctx = gsap.context(() => {
      gsap.from(cards, { opacity: 0, y: 20, duration: 0.55, stagger: 0.07, ease: 'power3.out' });
    }, gridRef);
    return () => ctx.revert();
  }, [active]);

  return (
    <>
      <Header onStartProject={() => setIsFormOpen(true)} />

      <main className="bg-white text-[#0D1117] overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
        <style>{`.au-card-hover-zoom:hover .au-zoom-layer { transform: scale(1.06); }`}</style>

        {/* ── HERO ──────────────────────────────────────────────── */}
        <section ref={heroRef} style={{ paddingTop: '128px', paddingBottom: '5rem' }}>
          <div
            aria-hidden
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(to right, transparent, rgba(37,99,235,0.25), transparent)' }}
          />
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12" style={{ textAlign: isRTL ? 'right' : 'left' }}>
            <div data-hero-anim className="opacity-0 flex items-center gap-3 mb-6" style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
              <span aria-hidden style={{ width: 32, height: 1, background: 'linear-gradient(to right, #2563EB, transparent)', display: 'inline-block' }} />
              <span className="eyebrow">{isRTL ? 'أعمالنا' : 'Our Work'}</span>
            </div>
            <h1 data-hero-anim className="opacity-0" style={{
              fontFamily: font,
              fontSize: 'clamp(2.8rem, 7vw, 6.5rem)',
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: isRTL ? 0 : '-0.03em',
              color: '#0D1117',
              maxWidth: isRTL ? '14ch' : '16ch',
              marginBottom: '1.5rem',
              marginInlineStart: isRTL ? 'auto' : 0,
            }}>
              {isRTL ? 'منتجات ' : "Products We've "}
              <span style={{
                backgroundImage: 'linear-gradient(135deg, #2563EB 0%, rgba(0,0,0,0.8) 55%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {isRTL ? 'أنجزناها' : 'Shipped'}
              </span>
            </h1>
            <p data-hero-anim className="opacity-0" style={{
              fontFamily: font,
              fontSize: 'clamp(0.95rem,2vw,1.1rem)',
              fontWeight: 400,
              color: 'rgba(0,0,0,0.45)',
              lineHeight: 1.8,
              maxWidth: '56ch',
              marginBottom: '3rem',
              marginInlineStart: isRTL ? 'auto' : 0,
            }}>
              {isRTL
                ? 'مشاريع حقيقية. نتائج حقيقية. كل دراسة حالة تشمل التحدي، استراتيجيتنا، القرارات التقنية، والنتيجة القابلة للقياس.'
                : 'Real projects. Real results. Every case study includes the challenge, our strategy, the technical decisions, and the measurable outcome.'}
            </p>

            {/* Filter tabs */}
            <div data-hero-anim className="opacity-0 flex flex-wrap gap-2" style={{ justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
              {INDUSTRY_FILTERS.map(ind => (
                <button
                  key={ind.key}
                  onClick={() => setActive(ind.key)}
                  style={{
                    padding: '7px 18px',
                    border: `1px solid ${active === ind.key ? 'rgba(37,99,235,0.5)' : 'rgba(0,0,0,0.08)'}`,
                    background: active === ind.key ? 'rgba(37,99,235,0.08)' : 'transparent',
                    color: active === ind.key ? '#2563EB' : 'rgba(0,0,0,0.42)',
                    fontFamily: font,
                    fontSize: 11,
                    fontWeight: 400,
                    letterSpacing: isRTL ? 0 : '0.12em',
                    textTransform: isRTL ? 'none' : 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 0.25s',
                  }}
                >
                  {isRTL ? ind.ar : ind.en}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── GRID ──────────────────────────────────────────────── */}
        <section ref={gridRef} style={{ paddingBottom: 'clamp(5rem,10vw,8rem)' }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-px" style={{ background: 'rgba(0,0,0,0.03)' }}>
              {filtered.map((cs) => (
                <Link
                  key={cs.slug}
                  to={`/case-studies/${cs.slug}`}
                  data-card
                  style={{ background: '#F6F7F9', textDecoration: 'none', display: 'flex', flexDirection: 'column', transition: 'background 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F0F2F5'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#F6F7F9'; }}
                >
                  {/* Image */}
                  <div className="au-card-hover-zoom" style={{ position: 'relative', paddingTop: '56.25%', overflow: 'hidden', background: '#0A0D14' }}>
                    <div className="au-zoom-layer" style={{ position: 'absolute', inset: 0, transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1)' }}>
                      <CaseStudyVisual
                        slug={cs.slug}
                        industryKey={cs.industryKey}
                        color={cs.color}
                        variant="card"
                        isRTL={isRTL}
                        alt={`${cs.title} case study`}
                      />
                    </div>
                    <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)' }} />
                    {/* Category chip */}
                    <div style={{
                      position: 'absolute', top: 16, insetInlineStart: 16,
                      padding: '5px 12px',
                      border: `1px solid ${cs.color}30`,
                      background: `${cs.color}12`,
                      color: cs.color,
                      fontFamily: font,
                      fontSize: 10,
                      fontWeight: 400,
                      letterSpacing: isRTL ? 0 : '0.18em',
                      textTransform: isRTL ? 'none' : 'uppercase',
                    }}>
                      {isRTL ? cs.industry.ar : cs.industry.en}
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: 'clamp(1.25rem, 3vw, 2rem)', flex: 1, display: 'flex', flexDirection: 'column', textAlign: isRTL ? 'right' : 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <span style={{ fontFamily: font, fontSize: 10, fontWeight: 400, color: 'rgba(0,0,0,0.35)', letterSpacing: isRTL ? 0 : '0.15em', textTransform: isRTL ? 'none' : 'uppercase' }}>{isRTL ? cs.duration.ar : cs.duration.en} · {cs.year}</span>
                      <ArrowUpRight size={14} style={{ color: 'rgba(0,0,0,0.25)', transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
                    </div>
                    <h3 style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(1.3rem, 2.5vw, 1.7rem)', fontWeight: 500, color: '#0D1117', lineHeight: 1.2, marginBottom: '0.75rem' }}>
                      {cs.title}
                    </h3>
                    <p style={{ fontFamily: font, fontSize: '0.875rem', fontWeight: 400, color: 'rgba(0,0,0,0.42)', lineHeight: 1.75, marginBottom: '1.5rem', flex: 1 }}>
                      {isRTL ? cs.tagline.ar : cs.tagline.en}
                    </p>
                    {/* Result pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {cs.results.slice(0, 2).map((r, i) => (
                        <div key={i} style={{ padding: '5px 12px', border: '1px solid rgba(0,0,0,0.06)', background: 'rgba(0,0,0,0.02)' }}>
                          <span style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: '1rem', fontWeight: 700, color: '#2563EB', fontVariantNumeric: 'tabular-nums' }}>{r.metric}</span>
                          <span style={{ fontFamily: font, fontSize: 10, color: 'rgba(0,0,0,0.35)', marginInlineStart: 6, letterSpacing: isRTL ? 0 : '0.05em' }}>{isRTL ? r.label.ar : r.label.en}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── BOTTOM CTA ────────────────────────────────────────── */}
        <section style={{ padding: 'clamp(5rem,10vw,7rem) 0', borderTop: '1px solid #E8EBF0', textAlign: 'center' }}>
          <div className="max-w-xl mx-auto px-5">
            <span className="eyebrow" style={{ display: 'block', marginBottom: '1rem' }}>{isRTL ? 'مشروعك القادم' : 'Your Project Next'}</span>
            <h2 style={{ fontFamily: font, fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 700, color: '#0D1117', lineHeight: 1.1, letterSpacing: isRTL ? 0 : '-0.03em', marginBottom: '1.5rem' }}>
              {isRTL ? 'جاهز لتكون دراسة الحالة القادمة؟' : 'Ready to Become a Case Study?'}
            </h2>
            <p style={{ fontFamily: font, fontSize: '0.95rem', fontWeight: 400, color: 'rgba(0,0,0,0.45)', lineHeight: 1.8, marginBottom: '2.5rem' }}>
              {isRTL ? 'استشارة مجانية. نطاق عمل وجدول زمني صريحان. بلا التزام.' : 'Free consultation. Honest scope and timeline. No obligation.'}
            </p>
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

export default CaseStudies;
