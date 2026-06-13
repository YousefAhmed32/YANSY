import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ArrowUpRight, Clock } from 'lucide-react';
import { BLOG_POSTS, CATEGORIES, getFeaturedBlogPosts, getBlogPostsByCategory } from '../data/blogPosts';
import { useSEO } from '../hooks/useSEO';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProjectRequestForm from '../components/ProjectRequestForm';

const Blog = () => {
  const { isRTL } = useLanguage();
  const [active, setActive]   = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const heroRef = useRef(null);
  const gridRef = useRef(null);

  const posts = active === 'all' ? BLOG_POSTS : getBlogPostsByCategory(active);

  useSEO({
    title      : 'Blog | YANSY TECH',
    description: 'Insights on web development, SaaS, product design, e-commerce, and digital business growth from the YANSY TECH team. 30+ expert articles.',
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

  const categoryColor = (slug) => CATEGORIES.find(c => c.slug === slug)?.color || '#d4af37';

  return (
    <>
      <Header onStartProject={() => setIsFormOpen(true)} />

      <main className="bg-black text-white overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>

        {/* ── HERO ──────────────────────────────────────────────── */}
        <section ref={heroRef} style={{ paddingTop: '128px', paddingBottom: '5rem' }}>
          <div aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.25), transparent)' }} />
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
            <div data-hero-anim className="opacity-0 flex items-center gap-3 mb-6">
              <span aria-hidden style={{ width: 32, height: 1, background: 'linear-gradient(to right, #d4af37, transparent)', display: 'inline-block' }} />
              <span className="eyebrow">Insights & Guides</span>
            </div>
            <h1 data-hero-anim className="opacity-0" style={{
              fontFamily: "'Inter',system-ui,sans-serif",
              fontSize: 'clamp(2.8rem, 7vw, 6.5rem)',
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: '-0.03em',
              color: '#fff',
              maxWidth: '16ch',
              marginBottom: '1.5rem',
            }}>
              The{' '}
              <span style={{
                backgroundImage: 'linear-gradient(135deg, #d4af37 0%, rgba(255,255,255,0.85) 55%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                YANSY TECH
              </span>{' '}
              Blog
            </h1>
            <p data-hero-anim className="opacity-0" style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 'clamp(0.95rem,2vw,1.1rem)',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.8,
              maxWidth: '52ch',
              marginBottom: '3rem',
            }}>
              Practical guides on web development, SaaS, product design, e-commerce, and building digital businesses that scale. Written by the team that builds them.
            </p>

            {/* Category filter */}
            <div data-hero-anim className="opacity-0 flex flex-wrap gap-2">
              <button
                onClick={() => setActive('all')}
                style={{
                  padding: '7px 18px',
                  border: `1px solid ${active === 'all' ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  background: active === 'all' ? 'rgba(212,175,55,0.08)' : 'transparent',
                  color: active === 'all' ? '#d4af37' : 'rgba(255,255,255,0.45)',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 11, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase',
                  cursor: 'pointer', transition: 'all 0.25s',
                }}
              >
                All Topics
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.slug}
                  onClick={() => setActive(cat.slug)}
                  style={{
                    padding: '7px 18px',
                    border: `1px solid ${active === cat.slug ? `${cat.color}50` : 'rgba(255,255,255,0.1)'}`,
                    background: active === cat.slug ? `${cat.color}10` : 'transparent',
                    color: active === cat.slug ? cat.color : 'rgba(255,255,255,0.45)',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 11, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase',
                    cursor: 'pointer', transition: 'all 0.25s',
                  }}
                >
                  {cat.label}
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
                style={{ textDecoration: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', transition: 'border-color 0.35s, background 0.35s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)'; e.currentTarget.style.background = 'rgba(212,175,55,0.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
              >
                <div style={{ position: 'relative', paddingTop: '56.25%', overflow: 'hidden', background: '#0a0a0a', minWidth: 0 }}>
                  <img src={posts[0].image} alt={posts[0].title} loading="lazy"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55, transition: 'transform 0.5s, opacity 0.4s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.opacity = '0.65'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.opacity = '0.55'; }}
                  />
                  <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.2) 0%, transparent 100%)' }} />
                </div>
                <div style={{ padding: 'clamp(2rem,5vw,3.5rem)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
                    <span style={{ padding: '4px 12px', border: `1px solid ${categoryColor(posts[0].category)}30`, background: `${categoryColor(posts[0].category)}10`, color: categoryColor(posts[0].category), fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 400, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                      {CATEGORIES.find(c => c.slug === posts[0].category)?.label || posts[0].category}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Inter', sans-serif", fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
                      <Clock size={11} aria-hidden /> {posts[0].readTime} min read
                    </span>
                  </div>
                  <h2 style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(1.375rem,2.5vw,2rem)', fontWeight: 600, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
                    {posts[0].title}
                  </h2>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', fontWeight: 400, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                    {posts[0].excerpt}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#d4af37', fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 400, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    Read Article <ArrowUpRight size={13} aria-hidden />
                  </div>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* ── GRID ──────────────────────────────────────────────── */}
        <section ref={gridRef} style={{ paddingBottom: 'clamp(5rem,10vw,8rem)' }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: 'rgba(255,255,255,0.04)' }}>
              {posts.slice(1).map(post => (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  data-card
                  style={{ background: '#000', textDecoration: 'none', display: 'flex', flexDirection: 'column', transition: 'background 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#060504'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#000'; }}
                >
                  <div style={{ position: 'relative', paddingTop: '52%', overflow: 'hidden', background: '#0a0a0a' }}>
                    <img src={post.image} alt={post.title} loading="lazy"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5, transition: 'transform 0.5s, opacity 0.3s' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.opacity = '0.6'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.opacity = '0.5'; }}
                    />
                    <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }} />
                  </div>
                  <div style={{ padding: 'clamp(1.25rem,3vw,1.75rem)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
                      <span style={{ padding: '3px 10px', border: `1px solid ${categoryColor(post.category)}25`, background: `${categoryColor(post.category)}08`, color: categoryColor(post.category), fontFamily: "'Inter', sans-serif", fontSize: 9, fontWeight: 400, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                        {CATEGORIES.find(c => c.slug === post.category)?.label}
                      </span>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={9} aria-hidden /> {post.readTime}m
                      </span>
                    </div>
                    <h3 style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(1.1rem,2vw,1.35rem)', fontWeight: 400, color: '#fff', lineHeight: 1.25, marginBottom: '0.75rem', flex: 1 }}>
                      {post.title}
                    </h3>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8rem', fontWeight: 400, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: '1.25rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {post.excerpt}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(212,175,55,0.7)', fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      Read <ArrowUpRight size={11} aria-hidden />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

      </main>

      <Footer />
      <ProjectRequestForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </>
  );
};

export default Blog;
