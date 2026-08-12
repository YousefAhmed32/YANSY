import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Monitor, Tablet, Smartphone, History, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { TK, RADIUS, FONT, PageSpinner, Button, IconButton, Stepper, Drawer, Badge } from '../admin-ui';
import ProposalRenderer from '../components/proposal-template/ProposalRenderer';
import StepClient from '../components/proposal-editor/StepClient';
import StepProject from '../components/proposal-editor/StepProject';
import StepScope from '../components/proposal-editor/StepScope';
import StepPricing from '../components/proposal-editor/StepPricing';
import StepTimeline from '../components/proposal-editor/StepTimeline';
import StepTerms from '../components/proposal-editor/StepTerms';
import StepBranding from '../components/proposal-editor/StepBranding';
import { YANSY_DEFAULT_BRANDING } from '../components/proposal-editor/brandingDefaults';
import StepPreviewPublish from '../components/proposal-editor/StepPreviewPublish';

const BLANK_PROPOSAL = {
  client: null,
  project: { title: '', titleAr: '', type: '', description: '', descriptionAr: '', objective: '', objectiveAr: '', startDate: '', estimatedDuration: '', priority: 'normal' },
  sections: [],
  pricing: { price: 0, currency: 'EGP', discount: 0, discountType: 'percentage', tax: 0, taxType: 'percentage', hidePriceFromClient: false, paymentScheduleType: 'full', milestones: [] },
  timeline: { totalDuration: '', totalDurationAr: '', phases: [] },
  terms: {},
  branding: { ...YANSY_DEFAULT_BRANDING },
};

const DEVICE_WIDTHS = { desktop: '100%', tablet: '768px', mobile: '390px' };

const cardBtnStyle = {
  display: 'block', width: '100%', textAlign: 'inherit', padding: 18,
  background: '#fff', border: `1px solid ${TK.border}`, borderRadius: RADIUS.xl, cursor: 'pointer', fontFamily: 'inherit',
};

/**
 * Two-panel proposal editor: LEFT is the step wizard (client → project →
 * scope → pricing → timeline → terms → branding → preview/publish), RIGHT
 * is a live ProposalRenderer preview that re-renders on every keystroke —
 * both panels read from the same `proposal` state, so there's no separate
 * "generate preview" step. New proposals open a template picker first
 * (spec §12 "Start from Template"); editing an existing one skips straight
 * to the wizard.
 */
const AdminProposalEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const font = FONT(isRTL);
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [proposal, setProposal] = useState(BLANK_PROPOSAL);
  const [step, setStep] = useState(0);
  const [device, setDevice] = useState('desktop');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versions, setVersions] = useState([]);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(!isEditing);
  const [templates, setTemplates] = useState([]);

  const T = {
    steps: [
      isRTL ? 'العميل' : 'Client',
      isRTL ? 'المشروع' : 'Project',
      isRTL ? 'النطاق' : 'Scope',
      isRTL ? 'السعر' : 'Pricing',
      isRTL ? 'الجدول الزمني' : 'Timeline',
      isRTL ? 'الشروط' : 'Terms',
      isRTL ? 'الهوية' : 'Branding',
      isRTL ? 'المعاينة والنشر' : 'Preview & Publish',
    ],
    newProposal: isRTL ? 'عرض جديد' : 'New Proposal',
    editProposal: isRTL ? 'تعديل العرض' : 'Edit Proposal',
    back: isRTL ? 'رجوع' : 'Back',
    next: isRTL ? 'التالي' : 'Next',
    saveDraft: isRTL ? 'حفظ كمسودة' : 'Save Draft',
    versions: isRTL ? 'النسخ' : 'Versions',
    saved: isRTL ? 'تم الحفظ ✓' : 'Saved ✓',
    published: isRTL ? 'تم النشر ✓' : 'Published ✓',
    saveFailed: isRTL ? 'فشل الحفظ' : 'Save failed',
    missingClientOrTitle: isRTL ? 'يرجى اختيار العميل وإدخال عنوان المشروع أولاً' : 'Please select a client and enter a project title first',
    startBlank: isRTL ? 'عرض فارغ' : 'Blank Proposal',
    startBlankSub: isRTL ? 'ابدأ من الصفر' : 'Start from a clean slate',
    chooseTemplate: isRTL ? 'ابدأ من قالب' : 'Start from a Template',
    chooseTemplateSub: isRTL ? 'اختر قالبًا جاهزًا لتسريع الإنشاء، أو ابدأ من عرض فارغ' : 'Pick a ready template to move faster, or start from scratch',
    close: isRTL ? 'إغلاق' : 'Close',
    noVersions: isRTL ? 'لا توجد نسخ محفوظة بعد' : 'No saved versions yet',
    restore: isRTL ? 'استعادة هذه النسخة' : 'Restore this version',
    restored: isRTL ? 'تمت الاستعادة ✓' : 'Restored ✓',
    restoreFailed: isRTL ? 'فشل الاستعادة' : 'Restore failed',
    versionsLoadFailed: isRTL ? 'فشل تحميل النسخ' : 'Failed to load versions',
    loadFailed: isRTL ? 'فشل تحميل العرض' : 'Failed to load proposal',
    by: isRTL ? 'بواسطة' : 'by',
  };

  // ── Load existing proposal ──────────────────────────────────────────
  useEffect(() => {
    if (!isEditing) return;
    setLoading(true);
    api.get(`/proposals/${id}`)
      .then(({ data }) => setProposal(data.item))
      .catch(() => toast.error(T.loadFailed))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditing]);

  // ── Template picker (new proposals only) ────────────────────────────
  useEffect(() => {
    if (!templatePickerOpen) return;
    api.get('/proposal-templates').then(({ data }) => setTemplates(data.items || [])).catch(() => {});
  }, [templatePickerOpen]);

  const startFromTemplate = (template) => {
    if (template) {
      setProposal((p) => ({
        ...p,
        sections: template.sections || [],
        pricing: { ...BLANK_PROPOSAL.pricing, ...template.defaultPricing },
        timeline: { ...BLANK_PROPOSAL.timeline, ...template.defaultTimeline },
        terms: { ...template.defaultTerms },
        branding: { ...YANSY_DEFAULT_BRANDING, ...template.branding },
        _templateId: template._id,
      }));
    }
    setTemplatePickerOpen(false);
  };

  // ── Save / Publish ───────────────────────────────────────────────────
  const buildPayload = () => ({
    client: proposal.client?._id || proposal.client,
    project: proposal.project,
    sections: proposal.sections,
    pricing: proposal.pricing,
    timeline: proposal.timeline,
    terms: proposal.terms,
    branding: proposal.branding,
  });

  const saveDraft = async () => {
    if (!proposal.client || !proposal.project?.title?.trim()) {
      toast.error(T.missingClientOrTitle);
      setStep(0);
      return null;
    }
    setSaving(true);
    try {
      let data;
      if (proposal._id) {
        ({ data } = await api.put(`/proposals/${proposal._id}`, buildPayload()));
      } else if (proposal._templateId) {
        ({ data } = await api.post(`/proposals/from-template/${proposal._templateId}`, buildPayload()));
      } else {
        ({ data } = await api.post('/proposals', buildPayload()));
      }
      setProposal((p) => ({ ...p, ...data.item }));
      toast.success(T.saved);
      return data.item;
    } catch (err) {
      toast.error(err?.response?.data?.error || T.saveFailed);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    setPublishing(true);
    try {
      const saved = await saveDraft();
      if (!saved) return;
      const { data } = await api.post(`/proposals/${saved._id}/publish`);
      setProposal((p) => ({ ...p, ...data.item }));
      toast.success(T.published);
    } catch (err) {
      toast.error(err?.response?.data?.error || T.saveFailed);
    } finally {
      setPublishing(false);
    }
  };

  const openVersions = async () => {
    if (!proposal._id) return;
    setVersionsOpen(true);
    try {
      const { data } = await api.get(`/proposals/${proposal._id}/versions`);
      setVersions(data.items || []);
    } catch {
      toast.error(T.versionsLoadFailed);
    }
  };

  const restoreVersion = async (versionId) => {
    try {
      const { data } = await api.post(`/proposals/${proposal._id}/restore/${versionId}`);
      setProposal((p) => ({ ...p, ...data.item }));
      toast.success(T.restored);
      setVersionsOpen(false);
    } catch {
      toast.error(T.restoreFailed);
    }
  };

  if (loading) return <PageSpinner />;

  if (templatePickerOpen) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: TK.bg, padding: '48px 32px', fontFamily: font }}>
        <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{T.chooseTemplate}</h1>
          <p style={{ fontSize: 13, color: TK.textMuted, marginBottom: 28 }}>{T.chooseTemplateSub}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, textAlign: isRTL ? 'right' : 'left' }}>
            <button type="button" onClick={() => startFromTemplate(null)} style={cardBtnStyle}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{T.startBlank}</span>
              <span style={{ fontSize: 12, color: TK.textMuted, marginTop: 4, display: 'block' }}>{T.startBlankSub}</span>
            </button>
            {templates.map((tpl) => (
              <button type="button" key={tpl._id} onClick={() => startFromTemplate(tpl)} style={cardBtnStyle}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{isRTL ? (tpl.nameAr || tpl.name) : tpl.name}</span>
                {tpl.category && <div style={{ marginTop: 6 }}><Badge tone="neutral">{tpl.category}</Badge></div>}
                {tpl.description && <span style={{ fontSize: 12, color: TK.textMuted, marginTop: 6, display: 'block' }}>{tpl.description}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const StepContent = () => {
    switch (step) {
      case 0: return <StepClient value={proposal.client} onChange={(v) => setProposal((p) => ({ ...p, client: v }))} isRTL={isRTL} />;
      case 1: return <StepProject value={proposal.project} onChange={(v) => setProposal((p) => ({ ...p, project: v }))} isRTL={isRTL} />;
      case 2: return <StepScope sections={proposal.sections} onChange={(v) => setProposal((p) => ({ ...p, sections: v }))} isRTL={isRTL} />;
      case 3: return <StepPricing pricing={proposal.pricing} onChange={(v) => setProposal((p) => ({ ...p, pricing: v }))} isRTL={isRTL} />;
      case 4: return <StepTimeline timeline={proposal.timeline} onChange={(v) => setProposal((p) => ({ ...p, timeline: v }))} isRTL={isRTL} />;
      case 5: return <StepTerms terms={proposal.terms} onChange={(v) => setProposal((p) => ({ ...p, terms: v }))} isRTL={isRTL} />;
      case 6: return <StepBranding branding={proposal.branding} onChange={(v) => setProposal((p) => ({ ...p, branding: v }))} isRTL={isRTL} />;
      case 7: return <StepPreviewPublish proposal={proposal} onSaveDraft={saveDraft} onPublish={publish} saving={saving} publishing={publishing} isRTL={isRTL} />;
      default: return null;
    }
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;
  const NextIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: TK.bg, fontFamily: font }}>
      <style>{`
        .pe-grid { display: grid; grid-template-columns: minmax(360px, 480px) 1fr; min-height: calc(100vh - 96px); }
        @media (max-width: 960px) { .pe-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: TK.surface, borderBottom: `1px solid ${TK.border}`, padding: '14px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{isEditing ? T.editProposal : T.newProposal}</h1>
            {proposal.proposalNumber && <span style={{ fontSize: 11, color: TK.textMuted, fontFamily: 'monospace' }}>{proposal.proposalNumber}</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {proposal._id && <IconButton icon={History} onClick={openVersions} title={T.versions} />}
            <Button variant="secondary" size="sm" onClick={saveDraft} loading={saving}>{T.saveDraft}</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/app/admin/proposals')}>{T.close}</Button>
          </div>
        </div>
        <div style={{ marginTop: 14, maxWidth: 900, overflowX: 'auto' }}>
          <Stepper steps={T.steps} current={step} onStepChange={setStep} />
        </div>
      </div>

      {/* Two-panel body */}
      <div className="pe-grid">
        <div style={{ padding: 24, borderInlineEnd: `1px solid ${TK.border}`, overflowY: 'auto', maxHeight: 'calc(100vh - 96px)' }}>
          <StepContent />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <Button variant="secondary" icon={BackIcon} onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>{T.back}</Button>
            {step < T.steps.length - 1 && (
              <Button variant="primary" icon={NextIcon} onClick={() => setStep((s) => Math.min(T.steps.length - 1, s + 1))}>{T.next}</Button>
            )}
          </div>
        </div>

        <div style={{ background: TK.bgSubtle, padding: 24, overflowY: 'auto', maxHeight: 'calc(100vh - 96px)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
            <IconButton icon={Monitor} variant={device === 'desktop' ? 'filled' : 'outline'} onClick={() => setDevice('desktop')} title="Desktop" />
            <IconButton icon={Tablet} variant={device === 'tablet' ? 'filled' : 'outline'} onClick={() => setDevice('tablet')} title="Tablet" />
            <IconButton icon={Smartphone} variant={device === 'mobile' ? 'filled' : 'outline'} onClick={() => setDevice('mobile')} title="Mobile" />
          </div>
          <div style={{
            maxWidth: DEVICE_WIDTHS[device], margin: '0 auto', background: '#fff',
            border: `1px solid ${TK.border}`, borderRadius: device === 'desktop' ? 12 : 20,
            overflow: 'hidden', boxShadow: '0 8px 30px rgba(16,24,40,0.08)', transition: 'max-width 0.25s ease',
          }}>
            <ProposalRenderer proposal={{ ...proposal, status: proposal.status || 'DRAFT' }} mode="preview" defaultLang={isRTL ? 'ar' : 'en'} />
          </div>
        </div>
      </div>

      <Drawer open={versionsOpen} onClose={() => setVersionsOpen(false)} title={T.versions}>
        {versions.length === 0 && <p style={{ fontSize: 13, color: TK.textMuted }}>{T.noVersions}</p>}
        {versions.map((v) => (
          <div key={v._id} style={{ border: `1px solid ${TK.border}`, borderRadius: RADIUS.md, padding: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>v{v.versionNumber}</span>
              <span style={{ fontSize: 11, color: TK.textLight }}>{new Date(v.createdAt).toLocaleString()}</span>
            </div>
            {v.changeSummary && <p style={{ fontSize: 12, color: TK.textMuted, marginTop: 4 }}>{v.changeSummary}</p>}
            <p style={{ fontSize: 11, color: TK.textLight, marginTop: 4 }}>{T.by} {v.createdBy?.fullName || v.createdBy?.email || '—'}</p>
            <Button size="sm" variant="secondary" style={{ marginTop: 8 }} onClick={() => restoreVersion(v._id)}>{T.restore}</Button>
          </div>
        ))}
      </Drawer>
    </div>
  );
};

export default AdminProposalEditor;
