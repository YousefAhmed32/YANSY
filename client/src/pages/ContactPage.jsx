import { useState, useEffect, useRef } from 'react';
import {
  MessageCircle, Calendar, FileText, Mail, Clock, Sun, Rocket,
  Award, Layers, Cpu, LifeBuoy, Shield, Sparkles, Zap, ArrowUpRight, ArrowRight,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSEO } from '../hooks/useSEO';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProjectRequestForm from '../components/ProjectRequestForm';
import ProcessSection from '../sections/ProcessSection';
import FAQ from '../components/FAQ';
import { trackWhatsAppClick, trackCTAClick } from '../utils/ga4';

const FONT_EN = "'Inter',system-ui,sans-serif";
const FONT_AR = "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif";

const WHATSAPP_NUMBER = '201090385390';
const waLink = (msg) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

/* ═══════════════════════════════════════════════════════════════
   Data
═══════════════════════════════════════════════════════════════ */
const TRUST_INDICATORS = [
  { icon: Clock, valueEN: '< 2 hours', valueAR: 'أقل من ساعتين', labelEN: 'Response time', labelAR: 'وقت الرد' },
  { icon: Sun,   valueEN: 'Sun–Thu, 9am–8pm', valueAR: 'الأحد–الخميس، 9ص–8م', labelEN: 'Working hours (Cairo)', labelAR: 'ساعات العمل (القاهرة)' },
  { icon: Rocket, valueEN: '~14 days', valueAR: '~14 يوماً', labelEN: 'Average delivery', labelAR: 'متوسط التسليم' },
];

const CHANNELS = [
  {
    id: 'whatsapp',
    icon: MessageCircle,
    color: '#25D366', bg: '#ECFDF5',
    titleEN: 'WhatsApp', titleAR: 'واتساب',
    descEN: 'Quick questions, instant back-and-forth.', descAR: 'أسئلة سريعة، ورد فوري ومباشر.',
    badgeEN: 'Fastest reply', badgeAR: 'أسرع رد',
    action: 'link',
    href: waLink('Hi YANSY Tech! I have a question.'),
    external: true,
  },
  {
    id: 'call',
    icon: Calendar,
    color: '#7C3AED', bg: '#F5F3FF',
    titleEN: 'Schedule a Call', titleAR: 'حدد موعد مكالمة',
    descEN: 'Talk through scope live before committing to anything.', descAR: 'ناقش تفاصيل مشروعك مباشرة قبل أي التزام.',
    badgeEN: 'Free · 30 min', badgeAR: 'مجاناً · 30 دقيقة',
    action: 'link',
    href: waLink("Hi YANSY Tech! I'd like to schedule a call to discuss my project."),
    external: true,
  },
  {
    id: 'request',
    icon: FileText,
    color: '#2563EB', bg: '#EFF6FF',
    titleEN: 'Send Project Request', titleAR: 'أرسل طلب مشروع',
    descEN: 'Structured details, a clear proposal back — no back-and-forth.', descAR: 'تفاصيل منظمة، وعرض واضح بالرد — بدون رسائل متكررة.',
    badgeEN: 'Most thorough', badgeAR: 'الأكثر تفصيلاً',
    action: 'form',
  },
  {
    id: 'email',
    icon: Mail,
    color: '#D97706', bg: '#FFFBEB',
    titleEN: 'Email', titleAR: 'البريد الإلكتروني',
    descEN: 'Formal inquiries, documents, or NDAs.', descAR: 'استفسارات رسمية، مستندات، أو اتفاقيات سرية.',
    badgeEN: 'Reply within a day', badgeAR: 'رد خلال يوم',
    action: 'link',
    href: 'mailto:yansytech@gmail.com',
    external: false,
  },
];

const WHY_STATS = [
  { numEN: '4+', numAR: '4+', labelEN: 'Years of experience', labelAR: 'سنوات خبرة' },
  { numEN: '50+', numAR: '50+', labelEN: 'Projects delivered', labelAR: 'مشروع مُسلَّم' },
  { numEN: '14d', numAR: '14d', labelEN: 'Average delivery', labelAR: 'متوسط التسليم' },
  { numEN: '98%', numAR: '98%', labelEN: 'Client satisfaction', labelAR: 'رضا العملاء' },
];

const WHY_PILLARS = [
  { icon: Cpu,      titleEN: 'Modern Technologies', titleAR: 'تقنيات حديثة', descEN: 'React, Next.js, Node.js, PostgreSQL — production-grade tools, not trends.', descAR: 'React وNext.js وNode.js وPostgreSQL — أدوات إنتاجية موثوقة، لا موضة عابرة.' },
  { icon: Layers,   titleEN: 'Scalable Architecture', titleAR: 'بنية قابلة للتوسع', descEN: 'Built to grow from 100 to 100,000 users without a rebuild.', descAR: 'مبنية لتنمو من 100 إلى 100,000 مستخدم بدون إعادة بناء.' },
  { icon: Sparkles, titleEN: 'Premium UI/UX', titleAR: 'تصميم واجهات فاخر', descEN: 'Apple- and Stripe-grade design on every screen, every breakpoint.', descAR: 'تصميم بمستوى Apple وStripe في كل شاشة وكل حجم عرض.' },
  { icon: LifeBuoy, titleEN: 'Real Ongoing Support', titleAR: 'دعم حقيقي مستمر', descEN: '30 days free post-launch support, then affordable plans — never mandatory.', descAR: '30 يوماً دعم مجاني بعد الإطلاق، ثم باقات اقتصادية — وليست إجبارية أبداً.' },
];

/* ═══════════════════════════════════════════════════════════════
   Small presentational pieces
═══════════════════════════════════════════════════════════════ */
const HeroBackground = () => (
  <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
    <style>{`
      @keyframes cp-drift-1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(3%,-4%) scale(1.06); } }
      @keyframes cp-drift-2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-4%,3%) scale(1.08); } }
      @keyframes cp-dot-fade { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
      .cp-blob { position: absolute; border-radius: 50%; filter: blur(70px); }
      @media (prefers-reduced-motion: reduce) {
        .cp-blob, .cp-dotgrid { animation: none !important; }
      }
    `}</style>
    <div className="cp-blob" style={{ width: 420, height: 420, top: '-8%', insetInlineEnd: '-6%', background: 'rgba(37,99,235,0.07)', animation: 'cp-drift-1 16s ease-in-out infinite' }} />
    <div className="cp-blob" style={{ width: 360, height: 360, bottom: '-12%', insetInlineStart: '-8%', background: 'rgba(124,58,237,0.05)', animation: 'cp-drift-2 20s ease-in-out infinite' }} />
    <div className="cp-dotgrid" style={{
      position: 'absolute', inset: 0,
      backgroundImage: 'radial-gradient(circle, rgba(13,17,23,0.06) 1px, transparent 1px)',
      backgroundSize: '28px 28px',
      maskImage: 'radial-gradient(ellipse 70% 55% at 50% 20%, black 40%, transparent 100%)',
      WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 20%, black 40%, transparent 100%)',
      animation: 'cp-dot-fade 6s ease-in-out infinite',
    }} />
  </div>
);

const ChannelCard = ({ ch, isRTL, onOpenForm, idx }) => {
  const isForm = ch.action === 'form';
  const Comp = isForm ? 'button' : 'a';
  const extraProps = isForm
    ? { type: 'button', onClick: () => { trackCTAClick(`contact-channel-${ch.id}`, 'contact-page'); onOpenForm(); } }
    : {
        href: ch.href,
        target: ch.external ? '_blank' : undefined,
        rel: ch.external ? 'noopener noreferrer' : undefined,
        onClick: () => { if (ch.id === 'whatsapp' || ch.id === 'call') trackWhatsAppClick(`contact-page-${ch.id}`); trackCTAClick(`contact-channel-${ch.id}`, 'contact-page'); },
      };

  return (
    <Comp
      {...extraProps}
      className="cp-channel-card"
      style={{
        display: 'flex', flexDirection: 'column', textAlign: isRTL ? 'right' : 'left',
        padding: 'clamp(22px, 2.6vw, 30px)', borderRadius: 18,
        border: '1px solid #E8EBF0', background: '#FFFFFF',
        textDecoration: 'none', cursor: 'pointer', width: '100%',
        fontFamily: isRTL ? FONT_AR : FONT_EN,
        animationDelay: `${idx * 60}ms`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: ch.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ch.icon style={{ width: 21, height: 21, color: ch.color }} aria-hidden />
        </div>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: ch.color, background: ch.bg, padding: '4px 10px', borderRadius: 100, letterSpacing: isRTL ? 0 : '0.03em' }}>
          {isRTL ? ch.badgeAR : ch.badgeEN}
        </span>
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0D1117', margin: '0 0 6px', letterSpacing: isRTL ? 0 : '-0.015em' }}>
        {isRTL ? ch.titleAR : ch.titleEN}
      </h3>
      <p style={{ fontSize: 13, color: '#5C6370', lineHeight: 1.65, margin: '0 0 16px', flex: 1 }}>
        {isRTL ? ch.descAR : ch.descEN}
      </p>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: ch.color }}>
        {isRTL ? 'اختر هذه الطريقة' : 'Choose this'}
        <ArrowRight style={{ width: 13, height: 13, transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
      </span>
    </Comp>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Page
═══════════════════════════════════════════════════════════════ */
const ContactPage = () => {
  const { isRTL } = useLanguage();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const revealRef = useRef(null);

  useSEO({
    title: isRTL ? 'تواصل معنا | يانسي تك' : 'Contact Us | YANSY TECH',
    description: isRTL
      ? 'تواصل مع يانسي تك — استشارة مجانية 30 دقيقة، رد خلال ساعتين. واتساب، مكالمة، طلب مشروع، أو بريد إلكتروني.'
      : "Get in touch with YANSY TECH — free 30-minute consultation, reply within 2 hours. WhatsApp, a call, a project request, or email — whichever works for you.",
    keywords: 'contact YANSY TECH, software agency contact, get a quote, free consultation, تواصل يانسي تك',
    canonical: 'https://yansytech.com/contact',
    ogLocale: isRTL ? 'ar_SA' : 'en_US',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      '@id': 'https://yansytech.com/contact#webpage',
      url: 'https://yansytech.com/contact',
      name: isRTL ? 'تواصل معنا | يانسي تك' : 'Contact Us | YANSY TECH',
      isPartOf: { '@id': 'https://yansytech.com/#website' },
      about: { '@id': 'https://yansytech.com/#organization' },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://yansytech.com/' },
          { '@type': 'ListItem', position: 2, name: 'Contact', item: 'https://yansytech.com/contact' },
        ],
      },
    },
  });

  // Simple scroll-reveal for section wrappers marked with [data-reveal]
  useEffect(() => {
    const nodes = revealRef.current?.querySelectorAll('[data-reveal]');
    if (!nodes?.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nodes.forEach(n => { n.style.opacity = '1'; n.style.transform = 'none'; });
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.transition = 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)';
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'none';
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  const openForm = () => setIsFormOpen(true);

  return (
    <>
      <Header onStartProject={openForm} />

      <main ref={revealRef} dir={isRTL ? 'rtl' : 'ltr'} style={{ background: '#FFFFFF', overflowX: 'hidden' }}>

        <style>{`
          .cp-channel-card { transition: border-color 0.22s ease, box-shadow 0.22s ease, transform 0.18s ease; }
          .cp-channel-card:hover { border-color: #C9CDD6; box-shadow: 0 16px 40px rgba(13,17,23,0.08); transform: translateY(-3px); }
          .cp-channel-card:focus-visible { outline: 2px solid #2563EB; outline-offset: 3px; }
          .cp-trust-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: clamp(1.5rem, 4vw, 3rem); }
          @media (max-width: 640px) { .cp-trust-grid { grid-template-columns: 1fr; gap: 1.25rem; } }
          .cp-channels-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: clamp(14px, 2vw, 20px); }
          @media (max-width: 1024px) { .cp-channels-grid { grid-template-columns: repeat(2, 1fr); } }
          @media (max-width: 480px) { .cp-channels-grid { grid-template-columns: 1fr; } }
          .cp-why-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: clamp(12px, 1.5vw, 18px); }
          @media (max-width: 860px) { .cp-why-grid { grid-template-columns: repeat(2, 1fr); } }
          .cp-stats-row { display: grid; grid-template-columns: repeat(4, 1fr); }
          @media (max-width: 640px) { .cp-stats-row { grid-template-columns: repeat(2, 1fr); } }
          [data-reveal] { opacity: 0; transform: translateY(24px); }
          @media (prefers-reduced-motion: reduce) { [data-reveal] { opacity: 1; transform: none; } }
        `}</style>

        {/* ═══ HERO ══════════════════════════════════════════════ */}
        <section style={{
          position: 'relative', overflow: 'hidden',
          paddingTop: 'clamp(8rem, 15vw, 11rem)',
          paddingBottom: 'clamp(4rem, 8vw, 6rem)',
          paddingLeft: 'clamp(1.25rem, 5vw, 3rem)',
          paddingRight: 'clamp(1.25rem, 5vw, 3rem)',
        }}>
          <HeroBackground />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
            <span className="section-label" style={{ marginBottom: 22, display: 'inline-block' }}>
              {isRTL ? 'تواصل معنا' : 'Contact'}
            </span>
            <h1 style={{
              fontSize: 'var(--text-5xl)', fontWeight: 800, lineHeight: 1.05,
              letterSpacing: isRTL ? 0 : '-0.035em', color: '#0D1117',
              margin: '0 0 clamp(1.25rem, 2.5vw, 1.75rem)', fontFamily: isRTL ? FONT_AR : FONT_EN,
            }}>
              {isRTL ? 'لنحوّل فكرتك إلى منتج حقيقي.' : "Let's turn your idea into a live product."}
            </h1>
            <p style={{
              fontSize: 'clamp(0.9375rem, 1.15vw, 1.125rem)', color: '#5C6370', lineHeight: 1.75,
              margin: '0 auto clamp(2.5rem, 5vw, 3.5rem)', maxWidth: '56ch', fontFamily: isRTL ? FONT_AR : FONT_EN,
            }}>
              {isRTL
                ? 'أخبرنا عن مشروعك واحصل على خطة وجدول زمني وسعر واضح — عادة خلال ساعات، ودائماً خلال يوم عمل واحد.'
                : 'Tell us about your project and get a clear plan, timeline, and price — usually within hours, always within one business day.'}
            </p>

            <div className="cp-trust-grid" style={{ maxWidth: 640, margin: '0 auto', paddingTop: 'clamp(2rem, 4vw, 2.75rem)', borderTop: '1px solid #E8EBF0' }}>
              {TRUST_INDICATORS.map((t, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <t.icon style={{ width: 18, height: 18, color: '#2563EB' }} aria-hidden />
                  <div style={{ fontSize: 'clamp(1rem, 1.5vw, 1.25rem)', fontWeight: 800, color: '#0D1117', letterSpacing: '-0.02em' }}>
                    {isRTL ? t.valueAR : t.valueEN}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#5C6370', fontWeight: 600 }}>
                    {isRTL ? t.labelAR : t.labelEN}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ CHOOSE HOW TO CONTACT ═════════════════════════════ */}
        <section style={{
          paddingTop: 'clamp(3rem, 6vw, 4rem)', paddingBottom: 'clamp(5rem, 10vw, 7rem)',
          paddingLeft: 'clamp(1.25rem, 5vw, 3rem)', paddingRight: 'clamp(1.25rem, 5vw, 3rem)',
        }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }} data-reveal>
            <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem, 5vw, 3.5rem)' }}>
              <h2 style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, lineHeight: 1.1,
                letterSpacing: isRTL ? 0 : '-0.03em', color: '#0D1117', margin: '0 0 12px',
                fontFamily: isRTL ? FONT_AR : FONT_EN,
              }}>
                {isRTL ? 'اختر طريقة التواصل' : 'Choose how to reach us'}
              </h2>
              <p style={{ fontSize: 14, color: '#5C6370', margin: 0, fontFamily: isRTL ? FONT_AR : FONT_EN }}>
                {isRTL ? 'كل قناة موضّح متى تكون الأنسب لك.' : "Each option below explains exactly when it's the right fit."}
              </p>
            </div>

            <div className="cp-channels-grid">
              {CHANNELS.map((ch, i) => (
                <ChannelCard key={ch.id} ch={ch} isRTL={isRTL} onOpenForm={openForm} idx={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══ PROJECT REQUEST BANNER ═══════════════════════════ */}
        <section style={{
          paddingLeft: 'clamp(1.25rem, 5vw, 3rem)', paddingRight: 'clamp(1.25rem, 5vw, 3rem)',
          paddingBottom: 'clamp(5rem, 10vw, 7rem)',
        }}>
          <div
            data-reveal
            style={{
              maxWidth: 1280, margin: '0 auto', position: 'relative', overflow: 'hidden',
              borderRadius: 28, border: '1px solid #DBEAFE', background: 'linear-gradient(135deg, #EFF6FF 0%, #FAFAFA 100%)',
              padding: 'clamp(2.5rem, 6vw, 4.5rem)',
              display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 'clamp(2rem, 4vw, 3rem)', alignItems: 'center',
            }}
            className="cp-request-banner"
          >
            <style>{`@media (max-width: 860px) { .cp-request-banner { grid-template-columns: 1fr !important; text-align: center; } }`}</style>

            <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
              <span className="section-label" style={{ marginBottom: 18, display: 'inline-block' }}>
                <Sparkles style={{ width: 12, height: 12 }} aria-hidden />
                {isRTL ? 'طلب مشروع' : 'Project Request'}
              </span>
              <h2 style={{
                fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, lineHeight: 1.15,
                letterSpacing: isRTL ? 0 : '-0.03em', color: '#0D1117', margin: '0 0 16px',
                fontFamily: isRTL ? FONT_AR : FONT_EN,
              }}>
                {isRTL ? 'أخبرنا بالتفاصيل، واحصل على عرض واضح.' : 'Give us the details, get a clear proposal.'}
              </h2>
              <p style={{ fontSize: 14.5, color: '#5C6370', lineHeight: 1.75, margin: '0 0 22px', maxWidth: '48ch', fontFamily: isRTL ? FONT_AR : FONT_EN }}>
                {isRTL
                  ? 'تدفق سلس ومصمم بعناية — تختار بين واتساب أو نموذج الموقع، وفي الحالتين نفس التجربة الفاخرة.'
                  : 'A smooth, carefully designed flow — choose between WhatsApp or the website form, either way you get the same premium experience.'}
              </p>
              <button onClick={() => { trackCTAClick('contact-request-banner', 'contact-page'); openForm(); }} className="btn-accent" style={{ fontSize: 13.5, padding: '13px 28px' }}>
                {isRTL ? 'ابدأ طلب مشروعك' : 'Start Your Project Request'}
                <ArrowUpRight style={{ width: 15, height: 15, transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { icon: MessageCircle, textEN: 'WhatsApp — fastest, talk to a real person', textAR: 'واتساب — الأسرع، تتحدث مع شخص حقيقي' },
                { icon: FileText,      textEN: 'Website form — structured, nothing gets lost', textAR: 'نموذج الموقع — منظم، لا يضيع أي تفصيل' },
                { icon: Zap,           textEN: 'Reply within 2 hours, always', textAR: 'رد خلال ساعتين، دائماً' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#FFFFFF', border: '1px solid #E8EBF0', borderRadius: 14 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <row.icon style={{ width: 15, height: 15, color: '#2563EB' }} aria-hidden />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#0D1117', textAlign: isRTL ? 'right' : 'left', fontFamily: isRTL ? FONT_AR : FONT_EN }}>
                    {isRTL ? row.textAR : row.textEN}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ WHY WORK WITH YANSY ══════════════════════════════ */}
        <section style={{
          background: '#FAFAFA', borderTop: '1px solid #E8EBF0', borderBottom: '1px solid #E8EBF0',
          paddingTop: 'clamp(5rem, 10vw, 7rem)', paddingBottom: 'clamp(5rem, 10vw, 7rem)',
          paddingLeft: 'clamp(1.25rem, 5vw, 3rem)', paddingRight: 'clamp(1.25rem, 5vw, 3rem)',
        }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }} data-reveal>
            <div style={{ textAlign: 'center', marginBottom: 'clamp(3rem, 6vw, 4.5rem)' }}>
              <span className="section-label" style={{ marginBottom: 20, display: 'inline-block' }}>
                {isRTL ? 'لماذا يانسي' : 'Why YANSY'}
              </span>
              <h2 style={{
                fontSize: 'var(--text-5xl)', fontWeight: 800, lineHeight: 1.05,
                letterSpacing: isRTL ? 0 : '-0.035em', color: '#0D1117', margin: '0 auto', maxWidth: '20ch',
                fontFamily: isRTL ? FONT_AR : FONT_EN,
              }}>
                {isRTL ? 'الأرقام والمبادئ التي نبني عليها.' : 'The numbers and principles behind every build.'}
              </h2>
            </div>

            {/* Stats */}
            <div className="cp-stats-row" style={{ background: '#FFFFFF', border: '1px solid #E8EBF0', borderRadius: 20, overflow: 'hidden', marginBottom: 'clamp(1.5rem, 3vw, 2rem)' }}>
              {WHY_STATS.map((s, i) => (
                <div key={i} style={{
                  padding: 'clamp(1.75rem, 3.5vw, 2.25rem) 1rem', textAlign: 'center',
                  borderInlineEnd: (i + 1) % 4 !== 0 ? '1px solid #E8EBF0' : 'none',
                  borderTop: i >= 2 ? '1px solid #E8EBF0' : 'none',
                }}>
                  <div style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 800, color: '#2563EB', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 6, fontVariantNumeric: 'tabular-nums' }}>
                    {isRTL ? s.numAR : s.numEN}
                  </div>
                  <div style={{ fontSize: 'clamp(11px, 1vw, 12.5px)', fontWeight: 600, color: '#5C6370' }}>{isRTL ? s.labelAR : s.labelEN}</div>
                </div>
              ))}
            </div>

            {/* Pillars */}
            <div className="cp-why-grid">
              {WHY_PILLARS.map((p, i) => (
                <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E8EBF0', borderRadius: 16, padding: 'clamp(20px, 2.4vw, 26px)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <p.icon style={{ width: 18, height: 18, color: '#2563EB' }} aria-hidden />
                  </div>
                  <h3 style={{ fontSize: 14.5, fontWeight: 700, color: '#0D1117', margin: '0 0 6px', textAlign: isRTL ? 'right' : 'left', fontFamily: isRTL ? FONT_AR : FONT_EN }}>
                    {isRTL ? p.titleAR : p.titleEN}
                  </h3>
                  <p style={{ fontSize: 12.5, color: '#5C6370', lineHeight: 1.65, margin: 0, textAlign: isRTL ? 'right' : 'left', fontFamily: isRTL ? FONT_AR : FONT_EN }}>
                    {isRTL ? p.descAR : p.descEN}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ PROCESS TIMELINE (reused) ════════════════════════ */}
        <ProcessSection isRTL={isRTL} onStartProject={openForm} />

        {/* ═══ FAQ (reused) ══════════════════════════════════════ */}
        <FAQ onStartProject={openForm} />

        {/* ═══ FINAL CTA — dark accent, per design system ═══════ */}
        <section style={{
          position: 'relative', overflow: 'hidden', background: '#111827',
          paddingTop: 'clamp(5rem, 10vw, 7.5rem)', paddingBottom: 'clamp(5rem, 10vw, 7.5rem)',
          paddingLeft: 'clamp(1.25rem, 5vw, 3rem)', paddingRight: 'clamp(1.25rem, 5vw, 3rem)',
        }}>
          <div aria-hidden style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
            backgroundSize: '32px 32px', pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto', textAlign: 'center' }} data-reveal>
            <Award style={{ width: 28, height: 28, color: '#60A5FA', margin: '0 auto 20px' }} aria-hidden />
            <h2 style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: '#FFFFFF',
              lineHeight: 1.1, letterSpacing: isRTL ? 0 : '-0.03em', margin: '0 0 1.25rem',
              fontFamily: isRTL ? FONT_AR : FONT_EN,
            }}>
              {isRTL ? 'مستعد تبدأ؟' : 'Ready to start?'}
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, margin: '0 0 2.5rem', fontFamily: isRTL ? FONT_AR : FONT_EN }}>
              {isRTL
                ? 'استشارة مجانية 30 دقيقة، بدون التزام. أخبرنا عن فكرتك ودعنا نوضح لك الطريق.'
                : 'Free 30-minute consultation, no obligation. Tell us your idea and let us map out the path.'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
              <button
                onClick={() => { trackCTAClick('contact-final-cta', 'contact-page'); openForm(); }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '14px 32px', borderRadius: 10, background: '#FFFFFF', color: '#0D1117',
                  fontSize: 13.5, fontWeight: 700, border: 'none', cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.35)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {isRTL ? 'ابدأ مشروعك الآن' : 'Start Your Project'}
                <ArrowUpRight style={{ width: 15, height: 15, transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
              </button>
              <a
                href={waLink('Hi YANSY Tech! I would like to discuss my project.')}
                target="_blank" rel="noopener noreferrer"
                onClick={() => trackWhatsAppClick('contact-final-cta')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '14px 28px', borderRadius: 10, background: 'rgba(255,255,255,0.06)',
                  border: '1.5px solid rgba(255,255,255,0.16)', color: '#FFFFFF',
                  fontSize: 13.5, fontWeight: 600, textDecoration: 'none', transition: 'background 0.2s ease, border-color 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)'; }}
              >
                <MessageCircle style={{ width: 15, height: 15 }} aria-hidden />
                {isRTL ? 'تواصل عبر واتساب' : 'Chat on WhatsApp'}
              </a>
            </div>
          </div>
        </section>

      </main>

      <Footer />
      <ProjectRequestForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </>
  );
};

export default ContactPage;
