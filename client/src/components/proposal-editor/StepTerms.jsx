import { TextArea } from '../../admin-ui';
import FormField from './FormField';

const FIELDS = (isRTL) => [
  { key: 'scopeLimitations', label: isRTL ? 'حدود النطاق' : 'Scope Limitations' },
  { key: 'revisionPolicy', label: isRTL ? 'سياسة التعديلات' : 'Revision Policy' },
  { key: 'paymentTerms', label: isRTL ? 'شروط الدفع' : 'Payment Terms' },
  { key: 'supportPeriod', label: isRTL ? 'فترة الدعم' : 'Support Period' },
  { key: 'hostingTerms', label: isRTL ? 'شروط الاستضافة' : 'Hosting Terms' },
  { key: 'maintenanceTerms', label: isRTL ? 'شروط الصيانة' : 'Maintenance Terms' },
  { key: 'ownership', label: isRTL ? 'الملكية' : 'Ownership' },
  { key: 'cancellationPolicy', label: isRTL ? 'سياسة الإلغاء' : 'Cancellation Policy' },
  { key: 'validityPeriod', label: isRTL ? 'فترة صلاحية العرض' : 'Offer Validity Period' },
];

/**
 * Step 6 — Terms. Every field is optional free text; ProposalRenderer's
 * TermsSection only shows fields that actually have content, and hides
 * itself entirely if none do — so leaving all nine blank is fine.
 */
const StepTerms = ({ terms, onChange, isRTL }) => {
  const set = (key, value) => onChange({ ...terms, [key]: value });
  return (
    <div>
      {FIELDS(isRTL).map((f) => (
        <FormField key={f.key} label={f.label}>
          <TextArea rows={2} value={terms[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} />
        </FormField>
      ))}
    </div>
  );
};

export default StepTerms;
