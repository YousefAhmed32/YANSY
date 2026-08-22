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
import { computeMissingFields } from '../components/portfolio-wizard/publishValidation';
import { ErrorSummary } from '../components/portfolio-wizard/PublishValidationUI';

const EMPTY_FORM = {
  title: '', titleAr: '', tagline: '', taglineAr: '', category: null, industry: null,
  projectType: null, deliveryStatus: 'live',
  client: null, location: '', locationAr: '', confidential: false, private: false,
  description: '', descriptionAr: '',
  myRole: '', myRoleAr: '', goals: '', goalsAr: '', painPoints: '', painPointsAr: '',
  challenge: '', challengeAr: '', solution: '', solutionAr: '', process: '', processAr: '', results: '', resultsAr: '',
  metrics: [], performanceMetrics: [], testimonials: [], proofScreenshots: [], faqs: [], awards: [], team: [], services: [], blocks: [],
  liveUrl: '', figmaUrl: '', githubUrl: '', technologies: [], projectTags: [], duration: '', teamSize: '', startDate: '', launchDate: '', year: new Date().getFullYear(),
  relatedProjectsOverride: [],
  coverImage: null, coverVideo: null, gallery: [],
  status: 'draft', featured: false, displayOrder: null,
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

// Where each publish-validation field (see publishValidation.js — the same
// contract the backend's assertPublishable enforces) actually lives in this
// multi-section wizard, so a failed-publish Error Summary can jump the
// admin to the right tab instead of a single generic toast.
const FIELD_SECTION = { title: 'overview', category: 'overview', coverImage: 'overview', projectType: 'overview', description: 'story' };

// Smooth 0–100 completion score across the fields that matter for a good
// case study, rather than a per-section boolean — gives the admin real
// signal on how "finished" a draft is instead of a jumpy 1-of-6 counter.
//
// Split into two groups (Phase 1 — see PROJECT_REVIEW.md §9): CORE applies
// to every project; LIVE_ONLY covers fields that only make sense for a
// project with a real client engagement or a live, visitable product
// (results, headline metrics, testimonials, a live URL). A UI/UX Concept
// project isn't "less finished" for not having those — it never asks the
// admin to fill them in (see OverviewSection/ProofResultsSection) — so
// scoring it against them would cap every concept project below 100% for
// fields it's not even allowed to fill in. For every other project type
// this produces the exact same 15-field score as before, in the same order.
const CORE_SCORE_FIELDS = [
  (f) => Boolean(f.title), (f) => Boolean(f.tagline), (f) => Boolean(f.coverImage?.url),
  (f) => Boolean(f.description), (f) => Boolean(f.challenge), (f) => Boolean(f.solution),
  (f) => Boolean(f.process), (f) => (f.gallery || []).length > 0, (f) => (f.technologies || []).length > 0,
  (f) => Boolean(f.metaTitle || f.metaDescription), (f) => (f.team || []).length > 0,
];
const LIVE_ONLY_SCORE_FIELDS = [
  (f) => Boolean(f.results), (f) => (f.metrics || []).length > 0,
  (f) => (f.testimonials || []).length > 0, (f) => Boolean(f.liveUrl),
];
const calcCompletion = (f) => {
  const fields = f.projectType?.isConceptType ? CORE_SCORE_FIELDS : [...CORE_SCORE_FIELDS, ...LIVE_ONLY_SCORE_FIELDS];
  return Math.round((100 * fields.filter((fn) => fn(f)).length) / fields.length);
};

const STATUS_TONE = { draft: 'neutral', published: 'success', archived: 'warning' };
const STATUS_LABEL = {
  draft:     { en: 'draft',     ar: 'مسودة' },
  published: { en: 'published', ar: 'منشور' },
  archived:  { en: 'archived',  ar: 'مؤرشف' },
};
const AUTOSAVE_DELAY = 1500;

// Library-reference fields hold full populated objects in `form` so the UI
// can render names/avatars without a second fetch — reduce back to bare
// ObjectIds for the API, which is all pickWritable/Mongoose casting expects.
const toId = (v) => v?._id || (typeof v === 'string' ? v : undefined);
const toIds = (arr) => (arr || []).map(toId).filter(Boolean);

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
  const [attemptedPublish, setAttemptedPublish] = useState(false);
  const [waitingForUploads, setWaitingForUploads] = useState(false);
  const [focusToken, setFocusToken] = useState(0);

  const savingPromiseRef = useRef(null);
  const projectIdRef = useRef(routeId || null);
  const pendingUploadsRef = useRef([]);
  const autosaveTimeoutRef = useRef(null);
  const skipNextAutosave = useRef(Boolean(routeId)); // don't autosave the instant we load an existing project

  const L = {
    portfolio: isRTL ? 'المحفظة' : 'Portfolio',
    untitled: isRTL ? 'مشروع بلا عنوان' : 'Untitled project',
    loadFailed: isRTL ? 'فشل تحميل المشروع' : 'Failed to load project',
    uploadFailed: (name) => isRTL ? `فشل رفع ${name}` : `Upload failed: ${name}`,
    autosaveFailed: isRTL ? 'فشل الحفظ التلقائي' : 'Autosave failed',
    statusUpdateFailed: isRTL ? 'تعذر تحديث الحالة' : 'Could not update status',
    publishWaiting: isRTL ? 'بانتظار اكتمال الرفع…' : 'Waiting for uploads…',
    couldNotCreate: isRTL ? 'تعذر إنشاء المشروع — حاول مرة أخرى' : 'Could not create the project — try again',
    serverRejected: isRTL ? 'رفض الخادم النشر — راجع الحقول أدناه' : 'The server rejected publishing — check the fields below',
    duplicated: isRTL ? 'تم الإنشاء — جارٍ فتح النسخة' : 'Duplicated — opening the copy',
    duplicateFailed: isRTL ? 'فشل النسخ' : 'Duplicate failed',
    duplicate: isRTL ? 'نسخ' : 'Duplicate',
    generateDemo: isRTL ? 'بيانات تجريبية' : 'Demo Data',
    demoGenerated: isRTL ? 'تم إنشاء بيانات المشروع التجريبي' : 'Demo project data generated',
    demoGenerateFailed: isRTL ? 'فشل إنشاء البيانات التجريبية' : 'Failed to generate demo data',
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
      .then(({ data }) => setForm({ ...EMPTY_FORM, ...data.project }))
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
  const buildPayload = useCallback((f) => ({
    ...f,
    year: f.year ? Number(f.year) : undefined,
    category: toId(f.category),
    industry: toId(f.industry),
    projectType: toId(f.projectType),
    client: toId(f.client),
    technologies: toIds(f.technologies),
    projectTags: toIds(f.projectTags),
    testimonials: toIds(f.testimonials),
    awards: toIds(f.awards),
    services: toIds(f.services),
    team: (f.team || []).map((t) => ({ member: toId(t.member), roleOverride: t.roleOverride, roleArOverride: t.roleArOverride })).filter((t) => t.member),
  }), []);

  useEffect(() => { pendingUploadsRef.current = pendingUploads; }, [pendingUploads]);
  useEffect(() => { projectIdRef.current = projectId; }, [projectId]);

  // ── Save (create-on-first-viable-edit, then PUT thereafter) ───────────────
  // Always returns a result object — see PortfolioQuickShowcase.jsx's doc
  // comment on the same pattern for why (never throws, never silently
  // no-ops while another save is in flight, `projectIdRef` is updated
  // synchronously so the very next queued save/publish call can't read a
  // stale/missing id).
  const doSave = useCallback(async (currentForm) => {
    setSaveState('saving');
    try {
      const payload = buildPayload(currentForm);
      if (!projectIdRef.current) {
        const { data } = await api.post('/portfolio/admin', payload);
        projectIdRef.current = data.project._id;
        setProjectId(data.project._id);
        navigate(`/app/admin/portfolio/${data.project._id}/edit`, { replace: true });
        setSaveState('saved');
        return { ok: true, projectId: data.project._id, project: data.project };
      }
      const { data } = await api.put(`/portfolio/admin/${projectIdRef.current}`, payload);
      setSaveState('saved');
      return { ok: true, projectId: projectIdRef.current, project: data.project };
    } catch (err) {
      setSaveState('error');
      const resp = err?.response?.data;
      return { ok: false, error: resp?.error || L.autosaveFailed, code: resp?.code, missingFields: resp?.missingFields };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildPayload, navigate]);

  // save() queues behind any in-flight save instead of no-op'ing, so every
  // caller (autosave OR the Publish button) gets a real, awaitable result
  // for the form it passed — never a stale silent no-op.
  const save = useCallback(async (currentForm) => {
    if (!currentForm.title?.trim() || !currentForm.category) {
      setSaveState('idle');
      return { ok: false, skipped: true };
    }
    if (savingPromiseRef.current) await savingPromiseRef.current.catch(() => {});
    const p = doSave(currentForm);
    savingPromiseRef.current = p;
    const result = await p;
    if (savingPromiseRef.current === p) savingPromiseRef.current = null;
    return result;
  }, [doSave]);

  // ── Debounced autosave on every form change ──────────────────────────────
  useEffect(() => {
    if (loading) return;
    if (skipNextAutosave.current) { skipNextAutosave.current = false; return; }
    setSaveState('pending');
    autosaveTimeoutRef.current = setTimeout(() => save(form), AUTOSAVE_DELAY);
    return () => clearTimeout(autosaveTimeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, loading]);

  const waitForUploads = useCallback(() => new Promise((resolve) => {
    const check = () => {
      if (pendingUploadsRef.current.length === 0) resolve();
      else setTimeout(check, 150);
    };
    check();
  }), []);

  const missingFields = computeMissingFields(form);
  const jumpToMissingField = (field) => setActiveSection(FIELD_SECTION[field] || 'overview');

  // ── Publish — validate -> wait for uploads -> flush latest save (create
  // the doc first if it doesn't exist yet) -> publish only against a
  // confirmed-fresh id -> map any backend rejection onto the same
  // Error Summary. Mirrors PortfolioQuickShowcase.jsx's runPublish exactly
  // — see its doc comment for the full rationale on the save/publish race.
  const runPublish = async () => {
    const clientMissing = computeMissingFields(form);
    if (clientMissing.length) {
      setAttemptedPublish(true);
      setFocusToken((t) => t + 1);
      jumpToMissingField(clientMissing[0]);
      toast.error(isRTL
        ? `تعذّر النشر — أكمل ${clientMissing.length} ${clientMissing.length === 1 ? 'حقلاً مطلوبًا' : 'حقول مطلوبة'}.`
        : `Unable to publish — complete ${clientMissing.length} required ${clientMissing.length === 1 ? 'field' : 'fields'}.`);
      return;
    }

    setPublishing(true);
    try {
      if (pendingUploadsRef.current.length > 0) {
        setWaitingForUploads(true);
        await waitForUploads();
        setWaitingForUploads(false);
      }
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);

      const saveResult = await save(form);
      if (!saveResult.ok) {
        toast.error(saveResult.error || L.autosaveFailed);
        return;
      }
      const idToUse = saveResult.projectId || projectIdRef.current;
      if (!idToUse) {
        toast.error(L.couldNotCreate);
        return;
      }

      const { data, status } = await api.patch(`/portfolio/admin/${idToUse}/status`, { status: 'published' }, { validateStatus: () => true });
      if (status >= 200 && status < 300) {
        setForm((f) => ({ ...f, status: data.project.status }));
        setAttemptedPublish(false);
        toast.success(L.statusToast('published'));
      } else if (data?.code === 'PUBLISH_VALIDATION_FAILED') {
        setAttemptedPublish(true);
        setFocusToken((t) => t + 1);
        jumpToMissingField((data.missingFields || [])[0]);
        toast.error(L.serverRejected);
      } else {
        toast.error(data?.error || L.statusUpdateFailed);
      }
    } finally {
      setPublishing(false);
    }
  };

  const changeStatus = async (status) => {
    if (status === 'published') { await runPublish(); return; }
    setPublishing(true);
    try {
      await save(form);
      const { data } = await api.patch(`/portfolio/admin/${projectIdRef.current}/status`, { status });
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
  // generateDemoProject is async — it find-or-creates the demo's
  // category/industry/client/technologies/team/testimonial against the real
  // content libraries (see demoGenerators/shared.js), not just local strings.
  const [generatingDemo, setGeneratingDemo] = useState(false);
  const applyDemoData = async (categoryKey) => {
    setGeneratingDemo(true);
    try {
      const generated = await generateDemoProject(categoryKey);
      setForm((f) => ({ ...EMPTY_FORM, ...generated, status: f.status === 'published' ? f.status : 'draft' }));
      setActiveSection('overview');
      toast.success(L.demoGenerated);
    } catch {
      toast.error(L.demoGenerateFailed);
    } finally {
      setGeneratingDemo(false);
      setConfirmDemoKey(null);
    }
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
      // Chat Proof (proofScreenshots) is hidden in the wizard for concept
      // types (see ProofResultsSection.jsx) — scoring against it here would
      // check for data the admin was never shown a way to enter. FAQs stay
      // available for every type, so that's the only concept-type signal.
      proof: form.projectType?.isConceptType
        ? Boolean((form.faqs || []).length)
        : Boolean(form.results || (form.metrics || []).length || (form.testimonials || []).length),
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

          <Button variant="secondary" size="sm" icon={Sparkles} onClick={() => setDemoModalOpen(true)} loading={generatingDemo}>{L.generateDemo}</Button>

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
            <Button variant="primary" size="sm" onClick={runPublish} loading={publishing}>
              {publishing && waitingForUploads ? L.publishWaiting : L.publish}
            </Button>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 32px 0' }}>
        {attemptedPublish && missingFields.length > 0 && (
          <ErrorSummary missing={missingFields} isRTL={isRTL} onJump={jumpToMissingField} focusToken={focusToken} />
        )}
      </div>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px 32px', display: 'grid', gridTemplateColumns: '200px 1fr', gap: 40 }} className="pw-layout">
        <SectionNav sections={sections} active={activeSection} onSelect={setActiveSection} percent={percent} isRTL={isRTL} />

        <div style={{ minWidth: 0, maxWidth: 760 }}>
          {activeSection === 'overview' && <OverviewSection form={form} set={set} language={language} {...sharedUploadProps} />}
          {activeSection === 'story' && <StorySection form={form} set={set} isRTL={isRTL} projectId={projectId} />}
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
        loading={generatingDemo}
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
