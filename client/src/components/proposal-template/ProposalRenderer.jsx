import { useMemo, useState } from 'react';
import './proposalTemplate.css';
import { hexToRgbTriplet, darkenTriplet } from './colorUtils';
import Hero from './sections/Hero';
import ScopeSection from './sections/ScopeSection';
import TimelineSection from './sections/TimelineSection';
import InvestmentSection from './sections/InvestmentSection';
import TermsSection from './sections/TermsSection';
import ClientActionBar from './sections/ClientActionBar';
import ProposalFooter from './sections/ProposalFooter';

const hasSectionContent = (s) => !s.isHidden && (
  (s.description && s.description.trim())
  || (s.bullets && s.bullets.length > 0)
  || (s.items && s.items.length > 0)
);

/**
 * Data-driven proposal template — the single reusable renderer both the
 * public `/p/:slug` page and the admin editor's live-preview pane import.
 * Renders Hero → each `sections[]` entry (by type, hiding empty ones) →
 * Timeline → Investment → Terms → client actions → Footer.
 *
 * `mode="preview"` (used by the editor) suppresses the interactive client
 * action bar — an admin editing a draft shouldn't be able to "accept" it.
 */
const ProposalRenderer = ({ proposal, mode = 'public', onAccept, onRequestChanges, onDownloadPdf, defaultLang = 'ar' }) => {
  const [lang, setLang] = useState(defaultLang);
  const isRTL = lang === 'ar';

  const branding = proposal?.branding;
  const brandVars = useMemo(() => {
    const b = branding || {};
    return {
      '--accent-rgb': hexToRgbTriplet(b.primaryColor, '37 99 235'),
      '--accent-ink-rgb': darkenTriplet(b.primaryColor) || '29 78 216',
      '--gold-rgb': hexToRgbTriplet(b.accentColor, '169 138 82'),
    };
  }, [branding]);

  if (!proposal) return null;

  const visibleSections = (proposal.sections || [])
    .filter(hasSectionContent)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const hasTimeline = proposal.timeline?.phases?.length > 0;
  const hasPricing = proposal.pricing
    && (proposal.pricing.hidePriceFromClient || Number(proposal.pricing.finalPrice) > 0);
  const hasTerms = proposal.terms && Object.values(proposal.terms).some(Boolean);

  return (
    <div className="proposal-doc" dir={isRTL ? 'rtl' : 'ltr'} lang={lang} style={brandVars}>
      <Hero proposal={proposal} isRTL={isRTL} lang={lang} onToggleLang={() => setLang((l) => (l === 'ar' ? 'en' : 'ar'))} />

      <main>
        {visibleSections.map((section, i) => (
          <ScopeSection key={section._id || `${section.type}-${i}`} section={section} isRTL={isRTL} index={i} />
        ))}

        {hasTimeline && <TimelineSection timeline={proposal.timeline} isRTL={isRTL} lang={lang} />}
        {hasPricing && <InvestmentSection pricing={proposal.pricing} isRTL={isRTL} lang={lang} />}
        {hasTerms && <TermsSection terms={proposal.terms} isRTL={isRTL} lang={lang} />}

        {mode === 'public' && (
          <ClientActionBar
            proposal={proposal}
            isRTL={isRTL}
            lang={lang}
            onAccept={onAccept}
            onRequestChanges={onRequestChanges}
            onDownloadPdf={onDownloadPdf}
          />
        )}
      </main>

      <ProposalFooter branding={proposal.branding} />
    </div>
  );
};

export default ProposalRenderer;
