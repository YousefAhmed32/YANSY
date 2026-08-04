import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getCaseStudyBySlug } from '../data/caseStudies';
import { useSEO } from '../hooks/useSEO';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProjectRequestForm from '../components/ProjectRequestForm';
import { trackViewContent } from '../utils/metaPixel';

import CaseStudyHero from '../components/case-study/CaseStudyHero';
import MetaStrip from '../components/case-study/MetaStrip';
import ProblemSection from '../components/case-study/ProblemSection';
import DiscoverySection from '../components/case-study/DiscoverySection';
import StrategySection from '../components/case-study/StrategySection';
import UXPrinciplesSection from '../components/case-study/UXPrinciplesSection';
import ArchitectureSection from '../components/case-study/ArchitectureSection';
import LaunchTimelineSection from '../components/case-study/LaunchTimelineSection';
import BeforeAfterSection from '../components/case-study/BeforeAfterSection';
import ResultsGrid from '../components/case-study/ResultsGrid';
import ImpactQuote from '../components/case-study/ImpactQuote';
import RoadmapSection from '../components/case-study/RoadmapSection';
import RelatedStudies from '../components/case-study/RelatedStudies';
import CaseStudyCTA from '../components/case-study/CaseStudyCTA';

/* The template is intentionally a thin composition — every section is a
   self-contained component under components/case-study/ driven entirely
   by the `cs` data object. All 9 case studies render through this one
   file; a change here or in data/caseStudies.js applies to every study
   at once. See the "Case Study System" plan for the full story spine. */
const CaseStudyDetail = () => {
  const { slug }  = useParams();
  const navigate  = useNavigate();
  const { isRTL } = useLanguage();
  const cs        = getCaseStudyBySlug(slug);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    if (!cs) navigate('/case-studies', { replace: true });
  }, [cs, navigate]);

  useEffect(() => {
    if (cs) trackViewContent({ content_name: cs.title, content_type: 'case_study', content_category: cs.industry?.en });
  }, [cs]);

  useSEO({
    title      : cs ? `${cs.title} Case Study | YANSY TECH` : 'Case Study',
    description: cs?.excerpt.en,
    keywords   : cs ? `${cs.title}, ${cs.industry.en}, ${cs.category.en}, YANSY TECH case study` : '',
    canonical  : `https://yansytech.com/case-studies/${slug}`,
    schema: cs ? {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': `${cs.title} Case Study — ${cs.tagline.en}`,
      'description': cs.excerpt.en,
      'author': { '@id': 'https://yansytech.com/#organization' },
      'publisher': { '@id': 'https://yansytech.com/#organization' },
      'url': `https://yansytech.com/case-studies/${slug}`,
      'breadcrumb': {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://yansytech.com/' },
          { '@type': 'ListItem', 'position': 2, 'name': 'Case Studies', 'item': 'https://yansytech.com/case-studies' },
          { '@type': 'ListItem', 'position': 3, 'name': cs.title, 'item': `https://yansytech.com/case-studies/${slug}` },
        ],
      },
    } : undefined,
  });

  if (!cs) return null;

  return (
    <>
      <Header onStartProject={() => setIsFormOpen(true)} />

      <main className="bg-surface-white text-[rgb(var(--text-primary))] overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
        <CaseStudyHero cs={cs} />
        <MetaStrip cs={cs} />
        <ProblemSection cs={cs} />
        <DiscoverySection cs={cs} />
        <StrategySection cs={cs} />
        <UXPrinciplesSection cs={cs} />
        <ArchitectureSection cs={cs} />
        <LaunchTimelineSection cs={cs} />
        <BeforeAfterSection cs={cs} />
        <ResultsGrid cs={cs} />
        <ImpactQuote cs={cs} />
        <RoadmapSection cs={cs} />
        <RelatedStudies cs={cs} />
        <CaseStudyCTA onStartProject={() => setIsFormOpen(true)} />
      </main>

      <Footer />
      <ProjectRequestForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </>
  );
};

export default CaseStudyDetail;
