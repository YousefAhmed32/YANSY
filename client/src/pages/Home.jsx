import { useState } from 'react';
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
import Solutions        from '../components/Solutions';
import PortfolioSection from '../components/PortfolioSection';
import WhyYANSY         from '../components/WhyYANSY';
import Testimonials     from '../components/Testimonials';
import AIChatWidget     from '../components/AIChatWidget';
import FAQ              from '../components/FAQ';

import MetricsSection  from '../sections/MetricsSection';
import ProcessSection  from '../sections/ProcessSection';
import TechSection     from '../sections/TechSection';
import ContactSection  from '../sections/ContactSection';

const Home = () => {
  const { t }               = useTranslation();
  const { isRTL, language } = useLanguage();
  const user                = useSelector(s => s.auth?.user);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const open  = () => setIsFormOpen(true);
  const close = () => setIsFormOpen(false);

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
      '@type': 'WebPage',
      '@id': 'https://yansytech.com/#webpage',
      url: 'https://yansytech.com/',
      name: 'YANSY Tech | Digital Product Studio',
      isPartOf: { '@id': 'https://yansytech.com/#website' },
      about: { '@id': 'https://yansytech.com/#organization' },
    },
  });

  return (
    <div key={`home-${language}`} style={{ background: '#FFFFFF' }}>

      <Header onStartProject={open} />

      {/* 01 — Hero: Who we are + What we build + Why trust us */}
      <HeroSection onStartProject={open} isRTL={isRTL} t={t} />

      {/* 02 — Social Proof Strip: Stats + Industries */}
      <TrustBar />

      {/* 03 — Services: What we specifically build */}
      <Solutions isRTL={isRTL} onStartProject={open} />

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

      <AIChatWidget isRTL={isRTL} onStartProject={open} user={user} />

      <ProjectRequestForm isOpen={isFormOpen} onClose={close} />
    </div>
  );
};

export default Home;
