import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ArrowUpRight, Clock, ArrowLeft } from 'lucide-react';
import { getBlogPostBySlug, getRelatedBlogPosts, CATEGORIES } from '../data/blogPosts';
import { useSEO } from '../hooks/useSEO';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProjectRequestForm from '../components/ProjectRequestForm';

const BlogPost = () => {
  const { slug }  = useParams();
  const navigate  = useNavigate();
  const { isRTL } = useLanguage();
  const post      = getBlogPostBySlug(slug);
  const related   = getRelatedBlogPosts(slug, 3);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const heroRef   = useRef(null);

  useEffect(() => {
    if (!post) navigate('/blog', { replace: true });
  }, [post, navigate]);

  const categoryLabel = post ? (CATEGORIES.find(c => c.slug === post.category)?.label || post.category) : '';
  const categoryColor = post ? (CATEGORIES.find(c => c.slug === post.category)?.color || '#2563EB') : '#2563EB';

  useSEO({
    title      : post?.title || 'Blog Post',
    description: post?.excerpt,
    keywords   : post ? `${post.tags.join(', ')}, YANSY TECH` : '',
    canonical  : `https://yansytech.com/blog/${slug}`,
    schema: post ? {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': post.title,
      'description': post.excerpt,
      'image': post.image,
      'datePublished': post.publishDate,
      'author': {
        '@type': 'Organization',
        '@id': 'https://yansytech.com/#organization',
        'name': 'YANSY TECH',
      },
      'publisher': { '@id': 'https://yansytech.com/#organization' },
      'url': `https://yansytech.com/blog/${slug}`,
      'keywords': post.tags.join(', '),
      'articleSection': categoryLabel,
      'isPartOf': { '@id': 'https://yansytech.com/#website' },
      'breadcrumb': {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://yansytech.com/' },
          { '@type': 'ListItem', 'position': 2, 'name': 'Blog', 'item': 'https://yansytech.com/blog' },
          { '@type': 'ListItem', 'position': 3, 'name': post.title, 'item': `https://yansytech.com/blog/${slug}` },
        ],
      },
    } : undefined,
  });

  useEffect(() => {
    if (!post) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-hero-anim]', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.65, stagger: 0.1, ease: 'power3.out', delay: 0.1 });
    }, heroRef);
    return () => ctx.revert();
  }, [post]);

  if (!post) return null;

  return (
    <>
      <Header onStartProject={() => setIsFormOpen(true)} />

      <main className="bg-white text-[#0D1117] overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>

        {/* ── HERO ──────────────────────────────────────────────── */}
        <section ref={heroRef} style={{ paddingTop: '100px', paddingBottom: '4rem', position: 'relative', overflow: 'hidden' }}>
          {/* BG */}
          <div aria-hidden style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${post.image})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: 0.1, filter: 'blur(3px)',
          }} />
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, #000 85%)' }} />

          <div className="max-w-3xl mx-auto px-5 sm:px-8" style={{ position: 'relative', zIndex: 2 }}>
            {/* Back + breadcrumb */}
            <nav data-hero-anim className="opacity-0 flex items-center gap-2 mb-8">
              <Link to="/blog" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', fontFamily: "'Inter', sans-serif", textDecoration: 'none' }}>
                <ArrowLeft size={12} aria-hidden /> Blog
              </Link>
              <span style={{ color: 'rgba(0,0,0,0.18)' }}>›</span>
              <span style={{ fontSize: 11, letterSpacing: '0.12em', color: categoryColor, fontFamily: "'Inter', sans-serif" }}>{categoryLabel}</span>
            </nav>

            {/* Meta */}
            <div data-hero-anim className="opacity-0 flex flex-wrap items-center gap-3 mb-6">
              <span style={{
                padding: '4px 14px', border: `1px solid ${categoryColor}35`,
                background: `${categoryColor}0d`, color: categoryColor,
                fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 400, letterSpacing: '0.15em', textTransform: 'uppercase',
              }}>
                {categoryLabel}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Inter', sans-serif", fontSize: 10, color: 'rgba(0,0,0,0.3)', letterSpacing: '0.08em' }}>
                <Clock size={11} aria-hidden /> {post.readTime} min read
              </span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: 'rgba(0,0,0,0.25)' }}>
                {new Date(post.publishDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            {/* Title */}
            <h1 data-hero-anim className="opacity-0" style={{
              fontFamily: "'Inter',system-ui,sans-serif",
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#0D1117',
              marginBottom: '1.5rem',
            }}>
              {post.title}
            </h1>

            {/* Excerpt */}
            <p data-hero-anim className="opacity-0" style={{
              fontFamily: "'Inter',system-ui,sans-serif",
              fontSize: 'clamp(1.05rem, 2vw, 1.35rem)',
              fontWeight: 400,
              color: 'rgba(0,0,0,0.55)',
              lineHeight: 1.6,
              fontStyle: 'italic',
              marginBottom: '2.5rem',
            }}>
              {post.excerpt}
            </p>

            {/* Tags */}
            <div data-hero-anim className="opacity-0 flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <span key={tag} style={{
                  padding: '4px 12px', border: '1px solid rgba(0,0,0,0.06)',
                  color: 'rgba(0,0,0,0.35)',
                  fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 400, letterSpacing: '0.1em',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── HERO IMAGE ────────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto px-5 sm:px-8" style={{ marginBottom: '3rem' }}>
          <div style={{ position: 'relative', paddingTop: '52%', overflow: 'hidden', background: '#F6F7F9' }}>
            <img
              src={post.image}
              alt={post.title}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
            />
          </div>
        </div>

        {/* ── ARTICLE BODY ──────────────────────────────────────── */}
        <article className="max-w-3xl mx-auto px-5 sm:px-8" style={{ paddingBottom: 'clamp(4rem,8vw,7rem)' }}>
          <div style={{ borderTop: '1px solid #E8EBF0', paddingTop: '3rem' }}>
            {post.content.map((section, i) => (
              <section key={i} style={{ marginBottom: '3rem' }}>
                <h2 data-speakable style={{
                  fontFamily: "'Inter',system-ui,sans-serif",
                  fontSize: 'clamp(1.4rem, 2.5vw, 2rem)',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                  color: '#0D1117',
                  marginBottom: '1.25rem',
                }}>
                  {section.heading}
                </h2>
                <p style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 'clamp(0.9rem, 1.8vw, 1rem)',
                  fontWeight: 400,
                  color: 'rgba(255,255,255,0.62)',
                  lineHeight: 1.9,
                  letterSpacing: '0.01em',
                }}>
                  {section.body}
                </p>
              </section>
            ))}
          </div>

          {/* Author / attribution */}
          <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #E8EBF0', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 20, fontWeight: 400, color: '#2563EB' }}>Y</span>
            </div>
            <div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', fontWeight: 500, color: '#0D1117', marginBottom: 2 }}>YANSY TECH Team</div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8rem', fontWeight: 400, color: 'rgba(0,0,0,0.4)' }}>
                Premium Digital Product Studio · <Link to="/services" style={{ color: 'rgba(37,99,235,0.6)', textDecoration: 'none' }}>View Our Services</Link>
              </div>
            </div>
          </div>
        </article>

        {/* ── RELATED POSTS ─────────────────────────────────────── */}
        {related.length > 0 && (
          <section style={{ padding: 'clamp(4rem,8vw,6rem) 0', borderTop: '1px solid #E8EBF0' }}>
            <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
              <div className="mb-10">
                <span className="eyebrow" style={{ display: 'block', marginBottom: '0.75rem' }}>Continue Reading</span>
                <h2 style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(1.25rem,2.5vw,1.75rem)', fontWeight: 600, color: '#0D1117', letterSpacing: '-0.02em' }}>Related Articles</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: 'rgba(0,0,0,0.03)' }}>
                {related.map(p => {
                  const color = CATEGORIES.find(c => c.slug === p.category)?.color || '#2563EB';
                  return (
                    <Link key={p.slug} to={`/blog/${p.slug}`}
                      style={{ background: '#F6F7F9', textDecoration: 'none', display: 'flex', flexDirection: 'column', transition: 'background 0.3s', padding: 'clamp(1.25rem,3vw,2rem)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#F0F2F5'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#000'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <span style={{ padding: '3px 10px', border: `1px solid ${color}25`, background: `${color}08`, color, fontFamily: "'Inter', sans-serif", fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                          {CATEGORIES.find(c => c.slug === p.category)?.label}
                        </span>
                        <ArrowUpRight size={14} style={{ color: 'rgba(0,0,0,0.18)', flexShrink: 0 }} aria-hidden />
                      </div>
                      <h3 style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: '1.1rem', fontWeight: 500, color: '#0D1117', lineHeight: 1.3 }}>{p.title}</h3>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── CTA ───────────────────────────────────────────────── */}
        <section style={{ padding: 'clamp(5rem,10vw,8rem) 0', textAlign: 'center', borderTop: '1px solid #E8EBF0' }}>
          <div className="max-w-xl mx-auto px-5">
            <span className="eyebrow" style={{ display: 'block', marginBottom: '1rem' }}>Ready to Build?</span>
            <h2 style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(1.75rem,4vw,2.75rem)', fontWeight: 700, color: '#0D1117', lineHeight: 1.06, letterSpacing: '-0.03em', marginBottom: '2rem' }}>
              Turn This Knowledge Into a Product
            </h2>
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
                Start a Project <ArrowUpRight size={14} aria-hidden />
              </button>
              <Link
                to="/blog"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '16px 28px', border: '2px solid rgba(0,0,0,0.1)',
                  color: 'rgba(0,0,0,0.55)', fontFamily: "'Inter', sans-serif",
                  fontSize: 10, fontWeight: 400, letterSpacing: '0.22em', textTransform: 'uppercase',
                  textDecoration: 'none', transition: 'border-color 0.3s, color 0.3s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)'; e.currentTarget.style.color = '#0D1117'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; e.currentTarget.style.color = 'rgba(0,0,0,0.55)'; }}
              >
                More Articles
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
      <ProjectRequestForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </>
  );
};

export default BlogPost;
