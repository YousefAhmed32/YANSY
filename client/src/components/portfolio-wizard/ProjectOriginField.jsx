import { FilterPills } from '../../admin-ui';
import { Field } from './shared';
import { PROJECT_ORIGIN_OPTIONS } from '../../utils/portfolioOrigin';

/**
 * Project Origin — where the project came from (client work / self-initiated
 * / internal product / experimental concept). Shared by both editors (Full
 * Case Study's OverviewSection and PortfolioQuickShowcase) so the field,
 * copy, and bilingual labels can never drift between the two forms — see
 * server/models/PortfolioProject.js's v3.4 doc comment for why this is a
 * deliberately independent axis from Delivery Status, and why it has no
 * default (unset = "not classified," never a guess). The value/label list
 * itself lives in utils/portfolioOrigin.js, shared with the public badge.
 *
 * Includes an explicit "Not set" pill — unlike Delivery Status (which always
 * has a real value, defaulting to Live), Origin is allowed to have NO
 * opinion, and the UI needs a way to represent and return to that state
 * rather than forcing a pick.
 */
const ProjectOriginField = ({ value, onChange, isRTL }) => {
  const L = {
    label: isRTL ? 'طبيعة المشروع' : 'Project Origin',
    notSet: isRTL ? 'غير محدد' : 'Not set',
    hint: isRTL
      ? 'من أين جاء المشروع — مستقل تمامًا عن "حالة التسليم" (مباشر/مفهوم/مؤرشف). مشروع ذاتي التوجيه قد يكون مباشرًا فعلًا، ومشروع عميل قد يبقى مفهومًا تصميميًا. اتركه "غير محدد" إن لم تكن متأكدًا.'
      : 'Where the project came from — independent of Delivery Status (live/concept/archived). A self-initiated project can still be Live; a client project can still be a Concept. Leave it "Not set" if you\'re unsure.',
  };

  const options = [
    { value: '', label: L.notSet },
    ...PROJECT_ORIGIN_OPTIONS.map((o) => ({ value: o.value, label: isRTL ? o.ar : o.en })),
  ];

  return (
    <Field label={L.label} hint={L.hint} isRTL={isRTL}>
      <FilterPills value={value || ''} onChange={(v) => onChange(v || undefined)} options={options} />
    </Field>
  );
};

export default ProjectOriginField;
