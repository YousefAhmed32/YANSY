import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { TK, FONT, PageSpinner, Button, Stepper, TextInput, TextArea } from '../admin-ui';
import StepScope from '../components/proposal-editor/StepScope';
import StepPricing from '../components/proposal-editor/StepPricing';
import StepTimeline from '../components/proposal-editor/StepTimeline';
import StepTerms from '../components/proposal-editor/StepTerms';
import StepBranding from '../components/proposal-editor/StepBranding';
import { YANSY_DEFAULT_BRANDING } from '../components/proposal-editor/brandingDefaults';
import FormField from '../components/proposal-editor/FormField';

/**
 * Edits a template's content — sections, pricing, timeline, terms, branding
 * — reusing the exact same step components as the proposal wizard
 * (AdminProposalEditor.jsx), since a `ProposalTemplate` and a `Proposal`
 * share that shape 1:1 by design (server/models/proposals/schemas.js).
 * Metadata (name/category/description) lives on the templates list page;
 * this page only opens once a template row already exists.
 */
const AdminProposalTemplateEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const font = FONT(isRTL);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [tpl, setTpl] = useState(null);

  const T = {
    steps: [
      isRTL ? 'معلومات القالب' : 'Template Info',
      isRTL ? 'النطاق' : 'Scope',
      isRTL ? 'السعر الافتراضي' : 'Default Pricing',
      isRTL ? 'الجدول الزمني' : 'Timeline',
      isRTL ? 'الشروط' : 'Terms',
      isRTL ? 'الهوية' : 'Branding',
    ],
    back: isRTL ? 'رجوع' : 'Back',
    next: isRTL ? 'التالي' : 'Next',
    save: isRTL ? 'حفظ القالب' : 'Save Template',
    close: isRTL ? 'إغلاق' : 'Close',
    saved: isRTL ? 'تم الحفظ ✓' : 'Saved ✓',
    saveFailed: isRTL ? 'فشل الحفظ' : 'Save failed',
    loadFailed: isRTL ? 'فشل تحميل القالب' : 'Failed to load template',
    name: isRTL ? 'الاسم' : 'Name',
    nameAr: isRTL ? 'الاسم (عربي)' : 'Name (Arabic)',
    category: isRTL ? 'الفئة' : 'Category',
    description: isRTL ? 'الوصف' : 'Description',
  };

  useEffect(() => {
    setLoading(true);
    api.get(`/proposal-templates/${id}`)
      .then(({ data }) => setTpl({
        ...data.item,
        defaultPricing: data.item.defaultPricing || {},
        defaultTimeline: data.item.defaultTimeline || {},
        defaultTerms: data.item.defaultTerms || {},
        branding: { ...YANSY_DEFAULT_BRANDING, ...data.item.branding },
      }))
      .catch(() => toast.error(T.loadFailed))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/proposal-templates/${id}`, {
        name: tpl.name, nameAr: tpl.nameAr, category: tpl.category, description: tpl.description,
        sections: tpl.sections, defaultPricing: tpl.defaultPricing, defaultTimeline: tpl.defaultTimeline,
        defaultTerms: tpl.defaultTerms, branding: tpl.branding,
      });
      setTpl((t) => ({ ...t, ...data.item }));
      toast.success(T.saved);
    } catch (err) {
      toast.error(err?.response?.data?.error || T.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !tpl) return <PageSpinner />;

  // A plain function returning JSX (not a component defined inline) — see
  // the identical fix/comment in AdminProposalEditor.jsx's
  // renderStepContent: defining this as `const StepContent = () => {...}`
  // and rendering `<StepContent />` gave it a fresh function identity on
  // every keystroke (tpl state changes -> re-render -> new component type),
  // which remounted the whole step subtree and dropped input focus after
  // every character typed anywhere in this editor (Name, Category,
  // Description, and every field in Scope/Pricing/Timeline/Terms/Branding).
  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div>
            <FormField label={T.name} required>
              <TextInput value={tpl.name || ''} onChange={(e) => setTpl((t) => ({ ...t, name: e.target.value }))} />
            </FormField>
            <FormField label={T.nameAr}>
              <TextInput dir="rtl" value={tpl.nameAr || ''} onChange={(e) => setTpl((t) => ({ ...t, nameAr: e.target.value }))} />
            </FormField>
            <FormField label={T.category}>
              <TextInput value={tpl.category || ''} onChange={(e) => setTpl((t) => ({ ...t, category: e.target.value }))} />
            </FormField>
            <FormField label={T.description}>
              <TextArea rows={3} value={tpl.description || ''} onChange={(e) => setTpl((t) => ({ ...t, description: e.target.value }))} />
            </FormField>
          </div>
        );
      case 1: return <StepScope sections={tpl.sections || []} onChange={(v) => setTpl((t) => ({ ...t, sections: v }))} isRTL={isRTL} />;
      case 2: return <StepPricing pricing={tpl.defaultPricing || {}} onChange={(v) => setTpl((t) => ({ ...t, defaultPricing: v }))} isRTL={isRTL} />;
      case 3: return <StepTimeline timeline={tpl.defaultTimeline || {}} onChange={(v) => setTpl((t) => ({ ...t, defaultTimeline: v }))} isRTL={isRTL} />;
      case 4: return <StepTerms terms={tpl.defaultTerms || {}} onChange={(v) => setTpl((t) => ({ ...t, defaultTerms: v }))} isRTL={isRTL} />;
      case 5: return <StepBranding branding={tpl.branding || {}} onChange={(v) => setTpl((t) => ({ ...t, branding: v }))} isRTL={isRTL} />;
      default: return null;
    }
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;
  const NextIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: TK.bg, fontFamily: font }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: TK.surface, borderBottom: `1px solid ${TK.border}`, padding: '14px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{isRTL ? (tpl.nameAr || tpl.name) : tpl.name}</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="primary" size="sm" onClick={save} loading={saving}>{T.save}</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/app/admin/proposal-templates')}>{T.close}</Button>
          </div>
        </div>
        <div style={{ marginTop: 14, maxWidth: 760, overflowX: 'auto' }}>
          <Stepper steps={T.steps} current={step} onStepChange={setStep} />
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
        {renderStepContent()}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <Button variant="secondary" icon={BackIcon} onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>{T.back}</Button>
          {step < T.steps.length - 1 && (
            <Button variant="primary" icon={NextIcon} onClick={() => setStep((s) => Math.min(T.steps.length - 1, s + 1))}>{T.next}</Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProposalTemplateEditor;
