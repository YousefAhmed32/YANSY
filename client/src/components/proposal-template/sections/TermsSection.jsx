import { useReveal } from '../../../hooks/useReveal';
import { reveal } from '../revealHelper';
import { t, pickLang } from '../copy';

const FIELDS = [
  'scopeLimitations', 'revisionPolicy', 'paymentTerms', 'supportPeriod',
  'hostingTerms', 'maintenanceTerms', 'ownership', 'cancellationPolicy', 'validityPeriod',
];

const TermsSection = ({ terms, isRTL, lang }) => {
  const { ref, revealed } = useReveal();
  const active = FIELDS.filter((f) => terms?.[f]);
  if (!active.length) return null;

  return (
    <section className="pt-section" ref={ref}>
      <div className="pt-container">
        <div className="pt-stack-md" {...reveal(revealed, '', { maxWidth: 680, marginBottom: 'clamp(2rem, 4vw, 2.75rem)' })}>
          <span className="pt-eyebrow">{pickLang(isRTL, 'ملاحظة', 'Note')}</span>
          <h2 className="pt-h1" style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)' }}>{t('termsTitle', lang)}</h2>
        </div>

        <div className="pt-bgrid pt-bgrid--2">
          {active.map((field) => (
            <div key={field} className="pt-tile pt-stack-sm">
              {/* Terms fields are single free-text strings, not bilingual
                  pairs (see server/models/proposals/schemas.js termsSchema)
                  — the admin writes them once, typically in the proposal's
                  primary language. */}
              <h3 className="pt-h3" style={{ fontSize: '1rem' }}>{t(field, lang)}</h3>
              <p className="pt-body-sm" style={{ whiteSpace: 'pre-line' }}>{terms[field]}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TermsSection;
