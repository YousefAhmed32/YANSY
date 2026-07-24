import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSEO } from '../hooks/useSEO';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProjectRequestForm from '../components/ProjectRequestForm';
import ImageRequiredCard from '../components/ImageRequiredCard';

const FONT_EN = "'Inter',system-ui,sans-serif";
const FONT_AR = "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif";

const VALUES = [
  {
    icon: '🎯',
    titleEN: 'Outcomes over output',
    titleAR: 'النتائج قبل الإنجاز الشكلي',
    descEN: 'We measure success by what changed for your business — more leads, faster operations, real revenue — not by lines of code shipped.',
    descAR: 'ننجح عندما يتغيّر شيء حقيقي في عملك — عملاء أكثر، عمليات أسرع، إيرادات فعلية — لا بعدد أسطر الكود.',
  },
  {
    icon: '🔍',
    titleEN: 'Radical transparency',
    titleAR: 'شفافية كاملة',
    descEN: 'Weekly updates, a staging link from day one, clear pricing. You never have to wonder what is happening with your project.',
    descAR: 'تحديثات أسبوعية، رابط تجربة من اليوم الأول، تسعير واضح. لن تتساءل أبداً عمّا يحدث في مشروعك.',
  },
  {
    icon: '🤝',
    titleEN: 'Your business, your code',
    titleAR: 'عملك، وكودك',
    descEN: 'Everything we build is yours after final delivery — no lock-in, no recurring platform tax, no dependency on us to keep running.',
    descAR: 'كل ما نبنيه يصبح ملكك بعد التسليم النهائي — لا قفل، لا رسوم منصة متكررة، لا اعتماد علينا للتشغيل.',
  },
];

const TEAM = [
  {
    roleEN: 'Founder & Creative Director',
    roleAR: 'المؤسس والمدير الإبداعي',
    filename: '/public/images/team/founder.webp',
    prompt: 'Professional headshot of a confident young Egyptian tech founder, studio lighting, plain light gray background, business casual, warm approachable smile, photorealistic',
  },
  {
    roleEN: 'Lead Engineer',
    roleAR: 'مهندس أول',
    filename: '/public/images/team/lead-engineer.webp',
    prompt: 'Professional headshot of a software engineer at a desk with dual monitors in the background blurred, studio lighting, plain light gray background, photorealistic',
  },
  {
    roleEN: 'Product Designer',
    roleAR: 'مصمم منتج',
    filename: '/public/images/team/product-designer.webp',
    prompt: 'Professional headshot of a UI/UX designer, studio lighting, plain light gray background, creative but professional style, photorealistic',
  },
  {
    roleEN: 'Project Manager',
    roleAR: 'مدير مشاريع',
    filename: '/public/images/team/project-manager.webp',
    prompt: 'Professional headshot of a project manager, studio lighting, plain light gray background, business casual, photorealistic',
  },
];

const STATS_EN = [
  { num: '50+', label: 'Projects Delivered' },
  { num: '4+',  label: 'Years of Experience' },
  { num: '98%', label: 'Client Satisfaction' },
  { num: '8',   label: 'Industries Served' },
];
const STATS_AR = [
  { num: '50+', label: 'مشروع مُسلَّم' },
  { num: '4+',  label: 'سنوات خبرة' },
  { num: '98%', label: 'رضا العملاء' },
  { num: '8',   label: 'قطاعات نخدمها' },
];

const About = () => {
  const { isRTL } = useLanguage();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const stats = isRTL ? STATS_AR : STATS_EN;

  useSEO({
    title: 'About Us | YANSY TECH',
    description: 'YANSY TECH is a digital product studio founded in 2020. Learn our story, our values, and meet the team building websites, apps, and enterprise systems for growing businesses.',
    keywords: 'about YANSY TECH, digital agency Egypt, software studio team, YANSY founders',
    canonical: 'https://yansytech.com/about',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      url: 'https://yansytech.com/about',
      name: 'About Us | YANSY TECH',
      isPartOf: { '@id': 'https://yansytech.com/#website' },
    },
  });

  return (
    <>
      <Header onStartProject={() => setIsFormOpen(true)} />

      <main dir={isRTL ? 'rtl' : 'ltr'} style={{ background: '#FFFFFF', overflowX: 'hidden' }}>

        {/* ── HERO ──────────────────────────────────────────────── */}
        <section style={{
          paddingTop: 'clamp(7.5rem, 14vw, 10rem)',
          paddingBottom: 'clamp(3.5rem, 7vw, 5rem)',
          paddingLeft: 'clamp(1.25rem, 5vw, 3rem)',
          paddingRight: 'clamp(1.25rem, 5vw, 3rem)',
        }}>
          <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
            <span className="section-label" style={{ marginBottom: 20, display: 'inline-block' }}>
              {isRTL ? 'عن الشركة' : 'About Us'}
            </span>
            <h1 style={{
              fontSize: 'var(--text-5xl)', fontWeight: 800, lineHeight: 1.05,
              letterSpacing: isRTL ? 0 : '-0.035em', color: '#0D1117',
              margin: '0 0 clamp(1.25rem, 2.5vw, 1.75rem)', fontFamily: isRTL ? FONT_AR : FONT_EN,
            }}>
              {isRTL ? 'بدأنا لأننا رأينا أعمالاً جيدة تُبنى ببرمجيات سيئة.' : 'We started because good businesses kept getting bad software.'}
            </h1>
            <p style={{
              fontSize: 'clamp(0.9375rem, 1.1vw, 1.0625rem)', color: '#5C6370', lineHeight: 1.75,
              margin: '0 auto', maxWidth: '58ch', fontFamily: isRTL ? FONT_AR : FONT_EN,
            }}>
              {isRTL
                ? 'YANSY تأسست عام 2020 على فكرة بسيطة: أصحاب الأعمال يستحقون نفس جودة الهندسة والتصميم التي تحصل عليها الشركات الكبرى — بدون التعقيد أو التكلفة أو الغموض.'
                : "YANSY TECH was founded in 2020 on a simple idea: business owners deserve the same quality of engineering and design that big companies get — without the complexity, cost, or vagueness."}
            </p>
          </div>
        </section>

        {/* ── STATS BAR ─────────────────────────────────────────── */}
        <section style={{ background: '#FAFAFA', borderTop: '1px solid #E8EBF0', borderBottom: '1px solid #E8EBF0' }}>
          <div className="about-stats-grid" style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {stats.map((s, i) => (
              <div key={i} style={{
                padding: 'clamp(1.5rem, 3.5vw, 2.25rem) clamp(1.25rem, 3vw, 2rem)', textAlign: 'center',
                borderInlineEnd: i < stats.length - 1 ? '1px solid #E8EBF0' : 'none',
              }}>
                <div style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 800, color: '#0D1117', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 5, fontVariantNumeric: 'tabular-nums' }}>
                  {s.num}
                </div>
                <div style={{ fontSize: 'clamp(11px, 1vw, 12.5px)', fontWeight: 700, color: '#374151' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <style>{`@media (max-width: 640px) { .about-stats-grid { grid-template-columns: repeat(2, 1fr) !important; } }`}</style>
        </section>

        {/* ── STORY + OFFICE IMAGE ──────────────────────────────── */}
        <section style={{
          paddingTop: 'clamp(5rem, 10vw, 8rem)', paddingBottom: 'clamp(5rem, 10vw, 8rem)',
          paddingLeft: 'clamp(1.25rem, 5vw, 3rem)', paddingRight: 'clamp(1.25rem, 5vw, 3rem)',
        }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div className="about-story-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(2.5rem, 5vw, 5rem)', alignItems: 'center' }}>
              <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                <span className="section-label" style={{ marginBottom: 20, display: 'inline-block' }}>
                  {isRTL ? 'قصتنا' : 'Our Story'}
                </span>
                <h2 style={{
                  fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, lineHeight: 1.15,
                  letterSpacing: isRTL ? 0 : '-0.03em', color: '#0D1117', margin: '0 0 1.5rem',
                  fontFamily: isRTL ? FONT_AR : FONT_EN,
                }}>
                  {isRTL ? 'من مشروع واحد إلى استوديو كامل.' : 'From one project to a full studio.'}
                </h2>
                <p style={{ fontSize: 14.5, color: '#5C6370', lineHeight: 1.85, margin: '0 0 16px', fontFamily: isRTL ? FONT_AR : FONT_EN }}>
                  {isRTL
                    ? 'بدأنا بمشروع واحد لعميل واحد كان محبَطاً من فريلانسر اختفى في منتصف الطريق. سلّمنا في الموعد، وبجودة أعلى مما توقع — وبدأ الناس يسألون: "مين بنى ده؟"'
                    : "We started with one project for one client who had just been burned by a freelancer who disappeared mid-way. We delivered on time, at a quality bar higher than expected — and people started asking, \"who built this?\""}
                </p>
                <p style={{ fontSize: 14.5, color: '#5C6370', lineHeight: 1.85, margin: '0 0 16px', fontFamily: isRTL ? FONT_AR : FONT_EN }}>
                  {isRTL
                    ? 'أربع سنوات بعدها، أصبحنا استوديو منتجات رقمية متكامل: تصميم، هندسة، وإدارة مشاريع — سلّمنا أكثر من 50 مشروعاً في 8 قطاعات مختلفة. لسه بنعمل بنفس القاعدة: نطاق واضح، تحديثات صادقة، وملكية كاملة للعميل.'
                    : "Four years later, we're a full digital product studio — design, engineering, and project management — with 50+ projects delivered across 8 industries. We still operate on the same rule we started with: clear scope, honest updates, full client ownership."}
                </p>
                <Link
                  to="/why-yansy"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 600, color: '#2563EB', textDecoration: 'none' }}
                >
                  {isRTL ? 'لماذا يختار العملاء YANSY' : 'Why clients choose YANSY'}
                  <ArrowUpRight style={{ width: 14, height: 14, transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
                </Link>
              </div>

              <ImageRequiredCard
                filename="/public/images/about/office.webp"
                dimensions="1200x900"
                prompt="A small modern tech studio office, 3-4 people collaborating around a desk with laptops and a large monitor showing a UI design, bright natural light, plants, minimal white and blue interior, candid working photo, photorealistic"
                priority="MEDIUM"
                aspectRatio="4 / 3"
              />
            </div>
          </div>
          <style>{`
            @media (max-width: 860px) {
              .about-story-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </section>

        {/* ── VALUES ────────────────────────────────────────────── */}
        <section style={{
          background: '#FAFAFA', borderTop: '1px solid #E8EBF0', borderBottom: '1px solid #E8EBF0',
          paddingTop: 'clamp(5rem, 10vw, 8rem)', paddingBottom: 'clamp(5rem, 10vw, 8rem)',
          paddingLeft: 'clamp(1.25rem, 5vw, 3rem)', paddingRight: 'clamp(1.25rem, 5vw, 3rem)',
        }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 'clamp(3rem, 6vw, 4rem)' }}>
              <span className="section-label" style={{ marginBottom: 20, display: 'inline-block' }}>
                {isRTL ? 'قيمنا' : 'What We Believe'}
              </span>
              <h2 style={{
                fontSize: 'var(--text-5xl)', fontWeight: 800, lineHeight: 1.05,
                letterSpacing: isRTL ? 0 : '-0.035em', color: '#0D1117', margin: '0 auto', maxWidth: '20ch',
                fontFamily: isRTL ? FONT_AR : FONT_EN,
              }}>
                {isRTL ? 'ثلاث قواعد لا نتنازل عنها.' : 'Three rules we never bend.'}
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'clamp(12px, 1.5vw, 18px)' }}>
              {VALUES.map((v, i) => (
                <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E8EBF0', borderRadius: 16, padding: 'clamp(22px, 2.5vw, 28px)' }}>
                  <div style={{ fontSize: 26, marginBottom: 14 }} aria-hidden>{v.icon}</div>
                  <h3 style={{ margin: '0 0 8px', fontSize: 15.5, fontWeight: 700, color: '#0D1117', fontFamily: isRTL ? FONT_AR : FONT_EN, textAlign: isRTL ? 'right' : 'left' }}>
                    {isRTL ? v.titleAR : v.titleEN}
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: '#5C6370', lineHeight: 1.7, fontFamily: isRTL ? FONT_AR : FONT_EN, textAlign: isRTL ? 'right' : 'left' }}>
                    {isRTL ? v.descAR : v.descEN}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TEAM ──────────────────────────────────────────────── */}
        <section style={{
          paddingTop: 'clamp(5rem, 10vw, 8rem)', paddingBottom: 'clamp(5rem, 10vw, 8rem)',
          paddingLeft: 'clamp(1.25rem, 5vw, 3rem)', paddingRight: 'clamp(1.25rem, 5vw, 3rem)',
        }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 'clamp(3rem, 6vw, 4rem)' }}>
              <span className="section-label" style={{ marginBottom: 20, display: 'inline-block' }}>
                {isRTL ? 'الفريق' : 'The Team'}
              </span>
              <h2 style={{
                fontSize: 'var(--text-5xl)', fontWeight: 800, lineHeight: 1.05,
                letterSpacing: isRTL ? 0 : '-0.035em', color: '#0D1117', margin: '0 auto', maxWidth: '20ch',
                fontFamily: isRTL ? FONT_AR : FONT_EN,
              }}>
                {isRTL ? 'الأشخاص الذين يبنون مشروعك.' : 'The people who build your project.'}
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'clamp(16px, 2vw, 24px)' }}>
              {TEAM.map((member, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: 14 }}>
                    <ImageRequiredCard
                      filename={member.filename}
                      dimensions="600x600"
                      prompt={member.prompt}
                      priority="MEDIUM"
                      aspectRatio="1 / 1"
                      compact
                    />
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0D1117', margin: '0 0 3px', fontFamily: isRTL ? FONT_AR : FONT_EN }}>
                    {isRTL ? member.roleAR : member.roleEN}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────── */}
        <section style={{ padding: 'clamp(5rem,10vw,7rem) 0', textAlign: 'center', borderTop: '1px solid #E8EBF0' }}>
          <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 20px' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: '#0D1117',
              lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 1.5rem', fontFamily: isRTL ? FONT_AR : FONT_EN,
            }}>
              {isRTL ? 'لنبني شيئاً معاً.' : "Let's build something together."}
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#5C6370', lineHeight: 1.8, margin: '0 0 2.5rem', fontFamily: isRTL ? FONT_AR : FONT_EN }}>
              {isRTL ? 'استشارة مجانية 30 دقيقة — بدون التزام.' : 'Free 30-minute consultation — no obligation.'}
            </p>
            <button onClick={() => setIsFormOpen(true)} className="btn-primary" style={{ fontSize: '13.5px', padding: '14px 32px' }}>
              {isRTL ? 'ابدأ مشروعك' : 'Start Your Project'}
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

export default About;
