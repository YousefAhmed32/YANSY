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
import PortfolioSection from '../components/PortfolioSection';
import FloatingActionMenu from '../components/FloatingActionMenu';
import MobileStickyBar from '../components/MobileStickyBar';

import MetricsSection  from '../sections/MetricsSection';
import CustomSoftwareSection from '../sections/CustomSoftwareSection';

// Below-the-fold and non-critical — kept out of the eager Home bundle so
// visitors to every OTHER route (not just "/") don't pay for them too. Home
// used to import all of this eagerly, making it (plus the ~1600-line
// AIChatWidget) the single largest chunk in the whole app, unconditionally
// preloaded on every page load regardless of route.
const TrustedByLogos         = lazy(() => import('../components/TrustedByLogos'));
// Written testimonials + raw WhatsApp/voice evidence, merged into one proof
// section — they used to be two separate homepage sections back to back
// ("Real clients. Proven results." then "Real clients. Raw reactions."),
// which read as the same claim twice rather than reinforcement.
const ClientProof            = lazy(() => import('../components/reviews/ClientProof'));
const HomepageVideoShowcase = lazy(() => import('../components/HomepageVideoShowcase'));
const WhyYANSY              = lazy(() => import('../components/WhyYANSY'));
const IndustriesPreview     = lazy(() => import('../components/IndustriesPreview'));
const FAQ                   = lazy(() => import('../components/FAQ'));
const AIChatWidget          = lazy(() => import('../components/AIChatWidget'));
const ProcessSection        = lazy(() => import('../sections/ProcessSection'));
const TechSection           = lazy(() => import('../sections/TechSection'));
const ContactSection        = lazy(() => import('../sections/ContactSection'));
const ProjectEstimator      = lazy(() => import('../components/ProjectEstimator'));

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

      {/*
        Narrative order. The page previously ran hero → brand film → stat strip →
        industries → work, which spent its first three screens before showing a
        single thing YANSY had built, and put an 8-tile grid of links *out* to
        /industries at position 4 — an exit ramp before the visitor had any
        reason to stay. The order below states the promise, then proves it
        without interruption, then explains — with the interactive scope
        estimator inside the explanation block, not the proof block, since it's
        a lead-gen tool the visitor uses, not evidence of past work — then
        handles objections, then asks.
      */}

      {/* 01 — Promise. Hero carries the proof-stat rail (was a standalone strip). */}
      <HeroSection onStartProject={open} isRTL={isRTL} t={t} />

      {/* 01.6 — Why custom software, not a template. Answers the objection
              before the proof sections below ask the visitor to already
              believe a bespoke build was the right call. */}
      <CustomSoftwareSection isRTL={isRTL} />

      {/* 01.5 — Immediate credibility: brand logo wall, admin-managed, hidden
              entirely when empty/disabled. Renders nothing until fetched, so
              it never reserves layout space or shifts the fold beneath it. */}
      <Suspense fallback={null}>
        <TrustedByLogos />
      </Suspense>

      {/* ── Proof block: work → outcomes → voices, uninterrupted ── */}

      {/* 02 — The work itself. Nothing earns attention faster than shipped product. */}
      <PortfolioSection />

      {/* 03 — What that work did for the business. */}
      <MetricsSection isRTL={isRTL} onStartProject={open} />

      {/* 04 — Written reviews, then the unscripted version of the same claim:
              real WhatsApp screenshots and voice notes, sent unprompted after
              delivery. One section, not two competing "real clients" pitches. */}
      <Suspense fallback={null}>
        <ClientProof isRTL={isRTL} onStartProject={open} />
      </Suspense>

      {/* 05 — Brand film. A breather after the proof block, and deferred far
              enough down that it no longer competes with LCP. */}
      <Suspense fallback={null}>
        <HomepageVideoShowcase />
      </Suspense>

      {/* ── Explanation block: why us, how we work, what with ── */}
      <Suspense fallback={null}>
        {/* 06 — Why YANSY: vs Freelancers vs Agencies */}
        <WhyYANSY onStartProject={open} />

        {/* 07 — Process: how we work */}
        <ProcessSection isRTL={isRTL} onStartProject={open} />

        {/* 07.5 — Now that the visitor knows how an engagement runs, let them
                shape their own scope — a natural "try it yourself" moment,
                not proof, so it sits here rather than mid-proof-block. */}
        <ProjectEstimator />

        {/* 08 — Technology: what we build with. Sits with Process — both answer
                "how", and splitting them put a cold spec list between the
                proof block and the FAQ. */}
        <TechSection isRTL={isRTL} onStartProject={open} />

        {/* 09 — Industries: who we build for. The gateway into /industries earns
                its place here, once the visitor is convinced, rather than at #4. */}
        <IndustriesPreview />

        {/* 10 — FAQ: objection handling */}
        <FAQ onStartProject={open} />

        {/* 11 — Contact: final CTA */}
        <ContactSection isRTL={isRTL} />
      </Suspense>

      <Footer />

      <Suspense fallback={null}>
        <AIChatWidget ref={aiWidgetRef} isRTL={isRTL} user={user} token={authToken} onOpenChange={setAiChatOpen} />
      </Suspense>
      <FloatingActionMenu isRTL={isRTL} onOpenAI={openAIChat} hidden={aiChatOpen} />
      <MobileStickyBar onStartProject={open} isRTL={isRTL} hidden={aiChatOpen || isFormOpen} />

      <ProjectRequestForm isOpen={isFormOpen} onClose={close} />
    </div>
  );
};

export default Home;
