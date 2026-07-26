import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ArrowUpRight, Clock } from 'lucide-react';
import { BLOG_POSTS, CATEGORIES, getBlogPostsByCategory } from '../data/blogPosts';
import { useSEO } from '../hooks/useSEO';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProjectRequestForm from '../components/ProjectRequestForm';
import BlogVisual from '../components/BlogVisual';

const Blog = () => {
  const { isRTL } = useLanguage();
  const [active, setActive]   = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const heroRef = useRef(null);
  const gridRef = useRef(null);

  const posts = active === 'all' ? BLOG_POSTS : getBlogPostsByCategory(active);
  const categoryLabel = (cat) => {
    const c = CATEGORIES.find(c => c.slug === cat);
    if (!c) return cat;
    return isRTL ? c.labelAr : c.label;
  };

  useSEO({
    title      : isRTL ? 'المدونة | يانسي تك' : 'Blog | YANSY TECH',
    description: isRTL
      ? 'مقالات عملية عن تطوير الويب، SaaS، تصميم المنتج، التجارة الإلكترونية، ونمو الأعمال الرقمية من فريق يانسي تك.'
      : 'Insights on web development, SaaS, product design, e-commerce, and digital business growth from the YANSY TECH team. 30+ expert articles.',
    keywords   : 'web development blog, SaaS development insights, product design articles, e-commerce tips, startup growth, YANSY TECH blog',
    canonical  : 'https://yansytech.com/blog',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      'url': 'https://yansytech.com/blog',
      'name': 'YANSY TECH Blog',
      'description': 'Expert insights on web development, SaaS, product design, and digital business growth.',
      'publisher': { '@id': 'https://yansytech.com/#organization' },
      'isPartOf': { '@id': 'https://yansytech.com/#website' },
      'breadcrumb': {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://yansytech.com/' },
          { '@type': 'ListItem', 'position': 2, 'name': 'Blog', 'item': 'https://yansytech.com/blog' },
        ],
      },
    },
  });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-hero-anim]', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.65, stagger: 0.09, ease: 'power3.out', delay: 0.1 });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll('[data-card]');
    if (!cards?.length) return;
    const ctx = gsap.context(() => {
      gsap.from(cards, { opacity: 0, y: 16, duration: 0.5, stagger: 0.05, ease: 'power3.out' });
    }, gridRef);
    return () => ctx.revert();
  }, [active]);

  const categoryColor = (slug) => CATEGORIES.find(c => c.slug === slug)?.color || '#2563EB';

  return (
    <>
      <Header onStartProject={() => setIsFormOpen(true)} />

      <main className="bg-white text-[#0D1117] overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>

        {/* ── HERO ──────────────────────────────────────────────── */}
        <section ref={heroRef} style={{ paddingTop: '128px', paddingBottom: '5rem' }}>
          <div aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(to right, transparent, rgba(37,99,235,0.25), transparent)' }} />
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
            <div data-hero-anim className="opacity-0 flex items-center gap-3 mb-6">
              <span aria-hidden style={{ width: 32, height: 1, background: 'linear-gradient(to right, #2563EB, transparent)', display: 'inline-block' }} />
              <span className="eyebrow">{isRTL ? 'رؤى وأدلة' : 'Insights & Guides'}</span>
            </div>
            <h1  data-hero-anim className="opacity-0 " style={{
              fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
              fontSize: 'clamp(2.8rem, 7vw, 6.5rem)',
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: isRTL ? 0 : '-0.03em',
              color: '#0D1117',
              maxWidth: '16ch',
              marginBottom: '1.5rem',
            }}>
              {isRTL ? (
                <>
                  مدونة{' '}
                  <span  style={{
                    backgroundImage: 'linear-gradient(135deg, #2563EB 0%, rgba(0,0,0,0.8) 55%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', padding:' 0 0 10px 0px'
                  }}>
                    يانسي تك
                  </span>
                </>
              ) : (
                <>
                  The{' '}
                  <span style={{
                    backgroundImage: 'linear-gradient(135deg, #2563EB 0%, rgba(0,0,0,0.8) 55%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>
                    YANSY TECH
                  </span>{' '}
                  Blog
                </>
              )}
            </h1>
            <p data-hero-anim className="opacity-0" style={{
              fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter', system-ui, sans-serif",
              fontSize: 'clamp(0.95rem,2vw,1.1rem)',
              fontWeight: 400,
              color: 'rgba(0,0,0,0.6)',
              lineHeight: 1.8,
              maxWidth: '52ch',
              marginBottom: '3rem',
            }}>
              {isRTL
                ? 'أدلة عملية عن تطوير الويب، SaaS، تصميم المنتج، التجارة الإلكترونية، وبناء أعمال رقمية قابلة للتوسع — بقلم الفريق الذي يبنيها فعلياً.'
                : 'Practical guides on web development, SaaS, product design, e-commerce, and building digital businesses that scale. Written by the team that builds them.'}
            </p>

            {/* Category filter */}
            <div data-hero-anim className="opacity-0 flex flex-wrap gap-2">
              <button
                onClick={() => setActive('all')}
                style={{
                  padding: '7px 18px',
                  border: `1px solid ${active === 'all' ? 'rgba(37,99,235,0.5)' : 'rgba(0,0,0,0.08)'}`,
                  background: active === 'all' ? 'rgba(37,99,235,0.08)' : 'transparent',
                  color: active === 'all' ? '#2563EB' : '#5C6370',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 11, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase',
                  cursor: 'pointer', transition: 'all 0.25s',
                }}
              >
                {isRTL ? 'كل الموضوعات' : 'All Topics'}
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.slug}
                  onClick={() => setActive(cat.slug)}
                  style={{
                    padding: '7px 18px',
                    border: `1px solid ${active === cat.slug ? `${cat.color}50` : 'rgba(0,0,0,0.08)'}`,
                    background: active === cat.slug ? `${cat.color}10` : 'transparent',
                    color: active === cat.slug ? cat.color : '#5C6370',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 11, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase',
                    cursor: 'pointer', transition: 'all 0.25s',
                  }}
                >
                  {isRTL ? cat.labelAr : cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURED POST (first) ─────────────────────────────── */}
        {posts.length > 0 && (
          <section style={{ paddingBottom: '3rem' }}>
            <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
              <Link
                to={`/blog/${posts[0].slug}`}
                style={{ textDecoration: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', background: 'rgba(0,0,0,0.02)', border: '1px solid #E8EBF0', transition: 'border-color 0.35s, background 0.35s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.2)'; e.currentTarget.style.background = 'rgba(37,99,235,0.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.04)'; e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; }}
              >
                <div style={{ position: 'relative', paddingTop: '56.25%', overflow: 'hidden', background: '#F6F7F9', minWidth: 0 }}>
                  <BlogVisual icon={CATEGORIES.find(c => c.slug === posts[0].category)?.icon} label={categoryLabel(posts[0].category)} color={categoryColor(posts[0].category)} variant="card" isRTL={isRTL} />
                </div>
                <div style={{ padding: 'clamp(2rem,5vw,3.5rem)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
                    <span style={{ padding: '4px 12px', border: `1px solid ${categoryColor(posts[0].category)}30`, background: `${categoryColor(posts[0].category)}10`, color: categoryColor(posts[0].category), fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 400, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                      {categoryLabel(posts[0].category)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#5C6370', letterSpacing: '0.1em' }}>
                      <Clock size={11} aria-hidden /> {posts[0].readTime} {isRTL ? 'د قراءة' : 'min read'}
                    </span>
                  </div>
                  <h2 style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(1.375rem,2.5vw,2rem)', fontWeight: 600, color: '#0D1117', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
                    {posts[0].title}
                  </h2>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', fontWeight: 400, color: '#5C6370', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                    {posts[0].excerpt}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2563EB', fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 400, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    {isRTL ? 'اقرأ المقال' : 'Read Article'} <ArrowUpRight size={13} aria-hidden style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} />
                  </div>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* ── GRID ──────────────────────────────────────────────── */}
        <section ref={gridRef} style={{ paddingBottom: 'clamp(5rem,10vw,8rem)' }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: 'rgba(0,0,0,0.03)' }}>
              {posts.slice(1).map(post => (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  data-card
                  style={{ background: '#F6F7F9', textDecoration: 'none', display: 'flex', flexDirection: 'column', transition: 'background 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F0F2F5'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#F6F7F9'; }}
                >
                  <div style={{ position: 'relative', paddingTop: '52%', overflow: 'hidden', background: '#F6F7F9' }}>
                    <BlogVisual icon={CATEGORIES.find(c => c.slug === post.category)?.icon} label={categoryLabel(post.category)} color={categoryColor(post.category)} variant="card" isRTL={isRTL} />
                  </div>
                  <div style={{ padding: 'clamp(1.25rem,3vw,1.75rem)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
                      <span style={{ padding: '3px 10px', border: `1px solid ${categoryColor(post.category)}25`, background: `${categoryColor(post.category)}08`, color: categoryColor(post.category), fontFamily: "'Inter', sans-serif", fontSize: 9, fontWeight: 400, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                        {categoryLabel(post.category)}
                      </span>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, color: '#6B7280', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={9} aria-hidden /> {post.readTime}{isRTL ? 'د' : 'm'}
                      </span>
                    </div>
                    <h3 style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(1.1rem,2vw,1.35rem)', fontWeight: 400, color: '#0D1117', lineHeight: 1.25, marginBottom: '0.75rem', flex: 1 }}>
                      {post.title}
                    </h3>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8rem', fontWeight: 400, color: '#5C6370', lineHeight: 1.7, marginBottom: '1.25rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {post.excerpt}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2563EB', fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      {isRTL ? 'اقرأ' : 'Read'} <ArrowUpRight size={11} aria-hidden style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────── */}
        <section style={{ padding: 'clamp(5rem,10vw,8rem) 0', textAlign: 'center', borderTop: '1px solid #E8EBF0' }}>
          <div className="max-w-xl mx-auto px-5">
            <span className="eyebrow" style={{ display: 'block', marginBottom: '1rem' }}>
              {isRTL ? 'جاهز للبناء؟' : 'Ready to Build?'}
            </span>
            <h2 style={{ fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif", fontSize: 'clamp(1.75rem,4vw,2.75rem)', fontWeight: 700, color: '#0D1117', lineHeight: 1.15, letterSpacing: isRTL ? 0 : '-0.03em', marginBottom: '2rem' }}>
              {isRTL ? 'حوّل هذه المعرفة إلى منتج حقيقي.' : 'Turn This Knowledge Into a Product'}
            </h2>
            <button onClick={() => setIsFormOpen(true)} className="btn-primary" style={{ fontSize: '13.5px', padding: '14px 32px' }}>
              {isRTL ? 'ابدأ مشروعك' : 'Start a Project'}
              <ArrowUpRight style={{ width: 15, height: 15, transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
            </button>
          </div>
        </section>

      </main>

      <Footer />
      <ProjectRequestForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </>
  );
};

export default Blog;
