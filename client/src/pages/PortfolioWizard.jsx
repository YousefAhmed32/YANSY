import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Copy, Eye, ExternalLink, Sparkles } from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { TK, PageSpinner, Badge, Button, ConfirmDialog } from '../admin-ui';
import SectionNav from '../components/portfolio-wizard/SectionNav';
import OverviewSection from '../components/portfolio-wizard/OverviewSection';
import StorySection from '../components/portfolio-wizard/StorySection';
import TeamSection from '../components/portfolio-wizard/TeamSection';
import MediaSection from '../components/portfolio-wizard/MediaSection';
import BlocksEditor from '../components/portfolio-wizard/BlocksEditor';
import ProofResultsSection from '../components/portfolio-wizard/ProofResultsSection';
import SeoPublishSection from '../components/portfolio-wizard/SeoPublishSection';
import GenerateDemoModal from '../components/portfolio-wizard/GenerateDemoModal';
import { generateDemoProject } from '../utils/demoGenerators';

const EMPTY_FORM = {
  title: '', titleAr: '', tagline: '', taglineAr: '', category: 'Other', industry: '',
  clientName: '', clientNameAr: '', clientLogo: null, location: '', locationAr: '', confidential: false, private: false,
  description: '', descriptionAr: '',
  myRole: '', myRoleAr: '', goals: '', goalsAr: '', painPoints: '', painPointsAr: '',
  challenge: '', challengeAr: '', solution: '', solutionAr: '', process: '', processAr: '', results: '', resultsAr: '',
  metrics: [], performanceMetrics: [], testimonial: {}, proofScreenshots: [], faqs: [], awards: [], team: [], blocks: [],
  liveUrl: '', figmaUrl: '', githubUrl: '', tags: [], duration: '', teamSize: '', startDate: '', launchDate: '', year: new Date().getFullYear(),
  relatedProjectsOverride: [],
  coverImage: null, coverVideo: null, gallery: [],
  status: 'draft', featured: false,
  metaTitle: '', metaDescription: '',
};

const SECTION_DEFS = [
  { key: 'overview', en: 'Overview',        ar: 'نظرة عامة' },
  { key: 'story',    en: 'Story',           ar: 'القصة' },
  { key: 'team',     en: 'Team & Credits',  ar: 'الفريق والاعتمادات' },
  { key: 'media',    en: 'Media & Blocks',  ar: 'الوسائط والمحتوى' },
  { key: 'proof',    en: 'Proof & Results', ar: 'الإثبات والنتائج' },
  { key: 'seo',      en: 'SEO & Publish',   ar: 'SEO والنشر' },
];

// Smooth 0–100 completion score across the fields that matter for a good
// case study, rather than a per-section boolean — gives the admin real
// signal on how "finished" a draft is instead of a jumpy 1-of-6 counter.
const SCORE_FIELDS = [
  (f) => Boolean(f.title), (f) => Boolean(f.tagline), (f) => Boolean(f.coverImage?.url),
  (f) => Boolean(f.description), (f) => Boolean(f.challenge), (f) => Boolean(f.solution),
  (f) => Boolean(f.process), (f) => Boolean(f.results), (f) => (f.metrics || []).length > 0,
  (f) => Boolean(f.testimonial?.quote), (f) => (f.gallery || []).length > 0, (f) => (f.tags || []).length > 0,
  (f) => Boolean(f.metaTitle || f.metaDescription), (f) => Boolean(f.liveUrl), (f) => (f.team || []).length > 0,
];
const calcCompletion = (f) => Math.round((100 * SCORE_FIELDS.filter((fn) => fn(f)).length) / SCORE_FIELDS.length);

const STATUS_TONE = { draft: 'neutral', published: 'success', archived: 'warning' };
const STATUS_LABEL = {
  draft:     { en: 'draft',     ar: 'مسودة' },
  published: { en: 'published', ar: 'منشور' },
  archived:  { en: 'archived',  ar: 'مؤرشف' },
};
const AUTOSAVE_DELAY = 1500;

const PortfolioWizard = () => {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();

  const [projectId, setProjectId] = useState(routeId || null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(Boolean(routeId));
  const [activeSection, setActiveSection] = useState('overview');
  const [saveState, setSaveState] = useState('idle'); // idle | pending | saving | saved | error
  const [pendingUploads, setPendingUploads] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [confirmDemoKey, setConfirmDemoKey] = useState(null); // pending category — asks first if the draft already has content

  const savingRef = useRef(false);
  const skipNextAutosave = useRef(Boolean(routeId)); // don't autosave the instant we load an existing project

  const L = {
    portfolio: isRTL ? 'المحفظة' : 'Portfolio',
    untitled: isRTL ? 'مشروع بلا عنوان' : 'Untitled project',
    loadFailed: isRTL ? 'فشل تحميل المشروع' : 'Failed to load project',
    uploadFailed: (name) => isRTL ? `فشل رفع ${name}` : `Upload failed: ${name}`,
    autosaveFailed: isRTL ? 'فشل الحفظ التلقائي' : 'Autosave failed',
    publishMissing: isRTL ? 'أضف ملخصًا وصورة غلاف قبل النشر' : 'Add a summary and cover image before publishing',
    statusUpdateFailed: isRTL ? 'تعذر تحديث الحالة' : 'Could not update status',
    duplicated: isRTL ? 'تم الإنشاء — جارٍ فتح النسخة' : 'Duplicated — opening the copy',
    duplicateFailed: isRTL ? 'فشل النسخ' : 'Duplicate failed',
    duplicate: isRTL ? 'نسخ' : 'Duplicate',
    generateDemo: isRTL ? 'بيانات تجريبية' : 'Demo Data',
    demoGenerated: isRTL ? 'تم إنشاء بيانات المشروع التجريبي' : 'Demo project data generated',
    demoOverwriteTitle: isRTL ? 'استبدال محتوى المسودة الحالية؟' : 'Overwrite the current draft?',
    demoOverwriteDesc: isRTL ? 'يحتوي هذا المشروع بالفعل على محتوى. سيؤدي إنشاء بيانات تجريبية إلى استبدال كل الحقول بمحتوى تجريبي جديد.' : 'This project already has content. Generating demo data will overwrite every field with new sample content.',
    demoOverwriteConfirm: isRTL ? 'استبدال' : 'Overwrite',
    preview: isRTL ? 'معاينة' : 'Preview',
    viewLive: isRTL ? 'عرض مباشر' : 'View live',
    unpublish: isRTL ? 'إلغاء النشر' : 'Unpublish',
    publish: isRTL ? 'نشر' : 'Publish',
    savedLabel: { idle: '', pending: isRTL ? 'تغييرات غير محفوظة' : 'Unsaved changes', saving: isRTL ? 'جارٍ الحفظ…' : 'Saving…', saved: isRTL ? 'تم الحفظ' : 'Saved', error: isRTL ? 'فشل الحفظ' : 'Save failed' },
    statusToast: (status) => (
      status === 'published' ? (isRTL ? 'تم النشر' : 'Published')
      : status === 'archived' ? (isRTL ? 'تمت الأرشفة' : 'Archived')
      : (isRTL ? 'تم النقل إلى المسودات' : 'Moved to draft')
    ),
  };

  // ── Load (edit mode) — deliberately [] deps: acquiring an id later via
  // autosave-create must NOT re-trigger this and clobber in-progress edits.
  useEffect(() => {
    if (!routeId) return;
    api.get(`/portfolio/admin/${routeId}`)
      .then(({ data }) => setForm({ ...EMPTY_FORM, ...data.project, tags: data.project.tags || [] }))
      .catch(() => toast.error(L.loadFailed))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = useCallback((key, value) => setForm((f) => ({ ...f, [key]: value })), []);
  const setGallery = useCallback((updater) => setForm((f) => ({ ...f, gallery: typeof updater === 'function' ? updater(f.gallery) : updater })), []);
  const setBlocks = useCallback((blocks) => setForm((f) => ({ ...f, blocks })), []);

  // ── Media upload/delete — shared by every section ────────────────────────
  const uploadMedia = useCallback(async (file, key) => {
    const fd = new FormData();
    fd.append('file', file);
    setPendingUploads((u) => [...u, { key, name: file.name, progress: 0 }]);
    try {
      const { data } = await api.post('/portfolio/admin/media', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const progress = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
          setPendingUploads((u) => u.map((x) => (x.key === key ? { ...x, progress } : x)));
        },
      });
      return data.asset;
    } catch {
      toast.error(L.uploadFailed(file.name));
      return null;
    } finally {
      setPendingUploads((u) => u.filter((x) => x.key !== key));
    }
    // L is a pure derivation of isRTL — depending on isRTL alone is equivalent
    // and avoids recreating this callback on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRTL]);

  const deleteMedia = useCallback((asset) => {
    if (!asset?.publicId) return;
    api.delete('/portfolio/admin/media', { data: { publicId: asset.publicId, provider: asset.provider } }).catch(() => {});
  }, []);

  // ── Payload — strip client-only bookkeeping before it hits the API ───────
  const buildPayload = useCallback((f) => ({ ...f, year: f.year ? Number(f.year) : undefined }), []);

  // ── Save (create-on-first-viable-edit, then PUT thereafter) ──────────────
  const save = useCallback(async (currentForm) => {
    if (savingRef.current) return;
    if (!currentForm.title?.trim() || !currentForm.category) { setSaveState('idle'); return; }

    savingRef.current = true;
    setSaveState('saving');
    try {
      if (!projectId) {
        const { data } = await api.post('/portfolio/admin', buildPayload(currentForm));
        setProjectId(data.project._id);
        navigate(`/app/admin/portfolio/${data.project._id}/edit`, { replace: true });
      } else {
        await api.put(`/portfolio/admin/${projectId}`, buildPayload(currentForm));
      }
      setSaveState('saved');
    } catch (err) {
      setSaveState('error');
      toast.error(err?.response?.data?.error || L.autosaveFailed);
    } finally {
      savingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, navigate, buildPayload, isRTL]);

  // ── Debounced autosave on every form change ──────────────────────────────
  useEffect(() => {
    if (loading) return;
    if (skipNextAutosave.current) { skipNextAutosave.current = false; return; }
    setSaveState('pending');
    const t = setTimeout(() => save(form), AUTOSAVE_DELAY);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, loading]);

  // ── Publish / status ──────────────────────────────────────────────────────
  const changeStatus = async (status) => {
    if (status === 'published' && (!form.description?.trim() || !form.coverImage?.url)) {
      toast.error(L.publishMissing);
      setActiveSection(!form.coverImage?.url ? 'overview' : 'story');
      return;
    }
    setPublishing(true);
    try {
      // Flush any pending edits first so the publish reflects the latest text.
      await save(form);
      const { data } = await api.patch(`/portfolio/admin/${projectId}/status`, { status });
      setForm((f) => ({ ...f, status: data.project.status }));
      toast.success(L.statusToast(status));
    } catch (err) {
      toast.error(err?.response?.data?.error || L.statusUpdateFailed);
    } finally {
      setPublishing(false);
    }
  };

  const duplicate = async () => {
    if (!projectId) return;
    setDuplicating(true);
    try {
      const { data } = await api.post(`/portfolio/admin/${projectId}/duplicate`);
      toast.success(L.duplicated);
      navigate(`/app/admin/portfolio/${data.project._id}/edit`);
    } catch {
      toast.error(L.duplicateFailed);
    } finally {
      setDuplicating(false);
    }
  };

  // ── Generate Demo Data ────────────────────────────────────────────────────
  const applyDemoData = (categoryKey) => {
    const generated = generateDemoProject(categoryKey);
    setForm((f) => ({ ...EMPTY_FORM, ...generated, status: f.status === 'published' ? f.status : 'draft' }));
    setActiveSection('overview');
    setConfirmDemoKey(null);
    toast.success(L.demoGenerated);
  };

  const handleSelectDemoCategory = (categoryKey) => {
    setDemoModalOpen(false);
    if (form.title?.trim()) setConfirmDemoKey(categoryKey);
    else applyDemoData(categoryKey);
  };

  const percent = useMemo(() => calcCompletion(form), [form]);
  const sections = useMemo(() => SECTION_DEFS.map((s) => ({
    key: s.key,
    label: isRTL ? s.ar : s.en,
    complete: {
      overview: Boolean(form.title && form.category && form.coverImage?.url),
      story: Boolean(form.description),
      team: (form.team || []).length > 0,
      media: (form.gallery || []).length > 0 || (form.blocks || []).length > 0,
      proof: Boolean(form.results || (form.metrics || []).length || form.testimonial?.quote),
      seo: Boolean(form.metaTitle || form.metaDescription),
    }[s.key],
  })), [form, isRTL]);

  if (loading) return <div style={{ minHeight: '100vh', background: TK.bg }}><PageSpinner /></div>;

  const sharedUploadProps = { uploadMedia, deleteMedia, pendingUploads, isRTL };
  const BackChevron = isRTL ? ChevronRight : ChevronLeft;

  return (
    <div style={{ minHeight: '100vh', background: TK.bg }} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: `1px solid ${TK.border}` }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 16, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <Link to="/app/admin/portfolio" className="au-back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: TK.textMuted, textDecoration: 'none', flexShrink: 0, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <BackChevron style={{ width: 14, height: 14 }} /> {L.portfolio}
          </Link>

          <div style={{ flex: 1, minWidth: 0, textAlign: isRTL ? 'right' : 'left' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: TK.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {form.title || L.untitled}
            </p>
            <p style={{ fontSize: 11, color: saveState === 'error' ? TK.red : TK.textLight, margin: '2px 0 0' }}>{L.savedLabel[saveState]}</p>
          </div>

          <Badge tone={STATUS_TONE[form.status] || 'neutral'} dot>{isRTL ? STATUS_LABEL[form.status]?.ar : STATUS_LABEL[form.status]?.en}</Badge>

          <Button variant="secondary" size="sm" icon={Sparkles} onClick={() => setDemoModalOpen(true)}>{L.generateDemo}</Button>

          {projectId && (
            <>
              <Button variant="ghost" size="sm" icon={Copy} onClick={duplicate} loading={duplicating}>{L.duplicate}</Button>
              <a href={`/app/admin/portfolio/${projectId}/preview`} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm" icon={Eye}>{L.preview}</Button>
              </a>
            </>
          )}

          {form.status === 'published' ? (
            <>
              {form.liveUrl && (
                <a href={`https://yansytech.com/portfolio/${form.slug || projectId}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" icon={ExternalLink}>{L.viewLive}</Button>
                </a>
              )}
              <Button variant="secondary" size="sm" onClick={() => changeStatus('draft')} loading={publishing}>{L.unpublish}</Button>
            </>
          ) : (
            <Button variant="primary" size="sm" onClick={() => changeStatus('published')} loading={publishing}>{L.publish}</Button>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px', display: 'grid', gridTemplateColumns: '200px 1fr', gap: 40 }} className="pw-layout">
        <SectionNav sections={sections} active={activeSection} onSelect={setActiveSection} percent={percent} isRTL={isRTL} />

        <div style={{ minWidth: 0, maxWidth: 760 }}>
          {activeSection === 'overview' && <OverviewSection form={form} set={set} language={language} {...sharedUploadProps} />}
          {activeSection === 'story' && <StorySection form={form} set={set} isRTL={isRTL} />}
          {activeSection === 'team' && <TeamSection form={form} set={set} {...sharedUploadProps} />}
          {activeSection === 'media' && (
            <div className="space-y-10">
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: TK.textMuted, letterSpacing: '0.04em', marginBottom: 14 }}>{isRTL ? 'المعرض' : 'GALLERY'}</p>
                <MediaSection gallery={form.gallery} setGallery={setGallery} {...sharedUploadProps} />
              </div>
              <div style={{ borderTop: `1px solid ${TK.border}`, paddingTop: 24 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: TK.textMuted, letterSpacing: '0.04em', marginBottom: 4 }}>{isRTL ? 'كتل المحتوى' : 'CONTENT BLOCKS'}</p>
                <BlocksEditor blocks={form.blocks} setBlocks={setBlocks} {...sharedUploadProps} />
              </div>
            </div>
          )}
          {activeSection === 'proof' && <ProofResultsSection form={form} set={set} {...sharedUploadProps} />}
          {activeSection === 'seo' && <SeoPublishSection form={form} set={set} projectId={projectId} isRTL={isRTL} />}
        </div>
      </div>

      <GenerateDemoModal open={demoModalOpen} onClose={() => setDemoModalOpen(false)} onSelect={handleSelectDemoCategory} isRTL={isRTL} />
      <ConfirmDialog
        open={Boolean(confirmDemoKey)}
        onClose={() => setConfirmDemoKey(null)}
        onConfirm={() => applyDemoData(confirmDemoKey)}
        danger={false}
        title={L.demoOverwriteTitle}
        description={L.demoOverwriteDesc}
        confirmLabel={L.demoOverwriteConfirm}
      />

      <style>{`
        @media (max-width: 860px) {
          .pw-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default PortfolioWizard;
