import { useState, useRef, useCallback, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useLanguage } from '../contexts/LanguageContext';
import { useSEO } from '../hooks/useSEO';

// Layout
import Header             from '../components/Header';
import Footer             from '../components/Footer';
import ProjectRequestForm from '../components/ProjectRequestForm';

// Sections
import HeroSection      from '../components/HeroSection';
import TrustBar         from '../components/TrustBar';
import IndustriesPreview from '../components/IndustriesPreview';
import PortfolioSection from '../components/PortfolioSection';
import WhyYANSY         from '../components/WhyYANSY';
import Testimonials     from '../components/Testimonials';
import AIChatWidget     from '../components/AIChatWidget';
import FloatingActionMenu from '../components/FloatingActionMenu';
import FAQ              from '../components/FAQ';

import MetricsSection  from '../sections/MetricsSection';
import ProcessSection  from '../sections/ProcessSection';
import TechSection     from '../sections/TechSection';
import ContactSection  from '../sections/ContactSection';

// Below-the-fold and non-critical — kept out of the eager Home bundle
const HomepageVideoShowcase = lazy(() => import('../components/HomepageVideoShowcase'));

const Home = () => {
  const { t }               = useTranslation();
  const { isRTL, language } = useLanguage();
  const user                = useSelector(s => s.auth?.user);
  const authToken            = useSelector(s => s.auth?.token);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const open  = () => setIsFormOpen(true);
  const close = () => setIsFormOpen(false);

  const aiWidgetRef = useRef(null);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const openAIChat = useCallback(() => aiWidgetRef.current?.open(), []);

  useSEO({
    title: isRTL
      ? 'يانسي تك | استوديو المنتجات الرقمية'
      : 'YANSY Tech | Digital Product Studio',
    description: isRTL
      ? 'YANSY Tech تبني مواقع ومتاجر ومنصات SaaS وأنظمة مؤسسية مخصصة. 50+ مشروع مسلَّم. استشارة مجانية خلال ساعتين.'
      : 'YANSY Tech builds websites, e-commerce platforms, SaaS products, mobile apps, and enterprise systems. 50+ projects delivered. Free consultation.',
    keywords: isRTL
      ? 'تطوير مواقع, تطوير تطبيقات, تطوير SaaS, متجر إلكتروني, تطوير برمجيات مخصصة'
      : 'web development, SaaS development, e-commerce development, mobile apps, enterprise software, React, Node.js',
    canonical: 'https://yansytech.com/',
    ogLocale: isRTL ? 'ar_SA' : 'en_US',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': 'https://yansytech.com/#webpage',
          url: 'https://yansytech.com/',
          name: 'YANSY Tech | Digital Product Studio',
          isPartOf: { '@id': 'https://yansytech.com/#website' },
          about: { '@id': 'https://yansytech.com/#organization' },
          speakable: {
            '@type': 'SpeakableSpecification',
            cssSelector: ['h1', 'h2', '[data-speakable]'],
          },
        },
        // Matches the on-page <FAQ> component content exactly (client/src/components/FAQ.jsx) —
        // was previously a static, page-agnostic block in index.html served on every route.
        {
          '@type': 'FAQPage',
          mainEntity: [
            { '@type': 'Question', name: 'How long does a project take?', acceptedAnswer: { '@type': 'Answer', text: 'It depends on scope. A standard website takes 2–3 weeks. E-commerce or SaaS platforms run 4–8 weeks. Enterprise systems (ERP, CRM) range from 8–16 weeks. We give you a precise timeline after the free consultation.' } },
            { '@type': 'Question', name: 'Do I pay the full amount upfront?', acceptedAnswer: { '@type': 'Answer', text: 'No. We split payments into milestones: 30% to start, 40% at mid-delivery, and 30% on final delivery. You only pay when you see real progress.' } },
            { '@type': 'Question', name: 'What makes you different from freelancers or other agencies?', acceptedAnswer: { '@type': 'Answer', text: 'Freelancers lack structure and disappear. Generic agencies are slow and overpriced. YANSY gives you a dedicated senior team, transparent process, fixed timelines, and full code ownership — at a competitive price.' } },
            { '@type': 'Question', name: 'Do I own the code after delivery?', acceptedAnswer: { '@type': 'Answer', text: '100% yes. After final payment, all source code, assets, and IP transfer to you. No recurring fees, no lock-in. You own everything.' } },
            { '@type': 'Question', name: 'What happens after the project is delivered?', acceptedAnswer: { '@type': 'Answer', text: 'We provide 30 days of free technical support post-launch — bug fixes, performance monitoring, and minor tweaks. After that, we offer affordable monthly maintenance or on-demand support.' } },
            { '@type': 'Question', name: 'Is the consultation really free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, completely. No credit card, no obligation. A 30-minute call where we understand your project, answer all your questions, and give you an honest scope and timeline estimate.' } },
            { '@type': 'Question', name: 'How many revisions do I get?', acceptedAnswer: { '@type': 'Answer', text: 'We include 3 revision rounds per milestone, covering design, content, and functionality. Major scope changes are discussed separately before any extra charge.' } },
            { '@type': 'Question', name: 'What technologies do you use?', acceptedAnswer: { '@type': 'Answer', text: 'Primarily React, Next.js, Node.js, and PostgreSQL/MongoDB. For enterprise systems we use microservices architecture. We choose the right stack for your specific project — not just the trendy one.' } },
            { '@type': 'Question', name: 'Will this actually bring me customers, or just look good?', acceptedAnswer: { '@type': 'Answer', text: 'Every site we ship includes server-side rendering, structured data, and clean semantic markup — the technical foundation Google actually indexes — plus fast load times, since speed is both a ranking factor and a conversion factor. We can\'t guarantee a keyword ranking, but we can guarantee nothing technical is holding your traffic or leads back.' } },
            { '@type': 'Question', name: 'Can I add more features later, or am I locked into v1?', acceptedAnswer: { '@type': 'Answer', text: 'You own the codebase, built on standard architecture from day one — no proprietary framework, no page-builder lock-in. Most clients come back to add features as they grow, scoped as separate, smaller engagements. Nothing about how we build forces a rebuild to add functionality later.' } },
          ],
        },
      ],
    },
  });

  return (
    <div key={`home-${language}`} style={{ background: '#FFFFFF' }}>

      <Header onStartProject={open} />

      {/* 01 — Hero: Who we are + What we build + Why trust us */}
      <HeroSection onStartProject={open} isRTL={isRTL} t={t} />

      {/* 01.5 — Premium Video Showcase: cinematic product/brand film */}
      <Suspense fallback={null}>
        <HomepageVideoShowcase />
      </Suspense>

      {/* 02 — Social Proof Strip: Stats + Industries */}
      <TrustBar />

      {/* 03 — Industries: Who we build for (gateway into /industries) */}
      <IndustriesPreview />

      {/* 04 — Portfolio: Real shipped work */}
      <PortfolioSection />

      {/* 05 — Results: Business outcomes */}
      <MetricsSection isRTL={isRTL} onStartProject={open} />

      {/* 06 — Why YANSY: vs Freelancers vs Agencies */}
      <WhyYANSY onStartProject={open} />

      {/* 07 — Process: How we work */}
      <ProcessSection isRTL={isRTL} onStartProject={open} />

      {/* 08 — Testimonials: Client stories */}
      <Testimonials isRTL={isRTL} />

      {/* 09 — Technology: What we build with */}
      <TechSection isRTL={isRTL} />

      {/* 10 — FAQ: Objection handling */}
      <FAQ onStartProject={open} />

      {/* 11 — Contact: Final CTA */}
      <ContactSection isRTL={isRTL} onStartProject={open} />

      <Footer />

      <AIChatWidget ref={aiWidgetRef} isRTL={isRTL} onStartProject={open} user={user} token={authToken} onOpenChange={setAiChatOpen} />
      <FloatingActionMenu isRTL={isRTL} onOpenAI={openAIChat} hidden={aiChatOpen} />

      <ProjectRequestForm isOpen={isFormOpen} onClose={close} />
    </div>
  );
};

export default Home;
