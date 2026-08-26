import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Eye, ExternalLink, Upload, X, ImageIcon, VideoIcon, ChevronDown } from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { TK, RADIUS, PageSpinner, Badge, Button, TextInput, Switch, FilterPills, Spinner, Card, FieldError } from '../admin-ui';
import { mediaSrc } from '../utils/media';
import { Field, BilingualPair } from '../components/portfolio-wizard/shared';
import RelationPicker from '../components/portfolio-wizard/RelationPicker';
import { PROJECT_TYPE_CREATE_TITLE, PROJECT_TYPE_QUICK_CREATE_FIELDS } from '../components/portfolio-wizard/projectTypeQuickCreate';
import TeamSection from '../components/portfolio-wizard/TeamSection';
import BlocksEditor from '../components/portfolio-wizard/BlocksEditor';
import MediaSection from '../components/portfolio-wizard/MediaSection';
import ProjectOriginField from '../components/portfolio-wizard/ProjectOriginField';
import HighlightsEditor from '../components/portfolio-wizard/HighlightsEditor';
import PortfolioIOMenu from '../components/portfolio-wizard/PortfolioIOMenu';
import PortfolioImportModal from '../components/portfolio-wizard/PortfolioImportModal';
import ImportResultBanner from '../components/portfolio-wizard/ImportResultBanner';
import { downloadPortableJson, downloadPortableTemplate } from '../utils/portfolioPortable';
import { computeMissingFields, fieldMessage } from '../components/portfolio-wizard/publishValidation';
import { ErrorSummary, PublishReadiness } from '../components/portfolio-wizard/PublishValidationUI';

const EMPTY_FORM = {
  title: '', titleAr: '', category: null, industry: null,
  projectType: null, deliveryStatus: 'live', projectOrigin: undefined,
  description: '', descriptionAr: '', highlights: [],
  team: [], technologies: [], projectTags: [], services: [], blocks: [],
  // Project Screenshots — a separate ordered gallery from Cover Image (one
  // primary image, required to publish) and from Content Blocks (an
  // optional advanced feature for framed/captioned media). This field was
  // previously missing from the form entirely, silently forcing screenshots
  // through Content Blocks instead — see PublishValidation notes and the
  // "Project Screenshots" section below.
  gallery: [],
  liveUrl: '', figmaUrl: '', year: new Date().getFullYear(),
  coverImage: null, coverVideo: null,
  status: 'draft', featured: false, displayOrder: null,
  metaTitle: '', metaDescription: '',
  presentationMode: 'showcase',
};

const AUTOSAVE_DELAY = 1500;
const toId = (v) => v?._id || (typeof v === 'string' ? v : undefined);
const toIds = (arr) => (arr || []).map(toId).filter(Boolean);

/* ── Small local cover-media slot (image or video) ──────────────────────────
 * Deliberately doesn't route through <Field> (which clones `error`/`id`
 * onto a single child component that's expected to accept them) — this
 * slot's "field" is a whole upload tile built from a raw <div>/<label>, not
 * one of our controlled-input primitives, so it renders its own label +
 * border-state + FieldError line directly instead. */
const CoverSlot = ({ label, asset, kind, accept, pending, onUpload, onRemove, isRTL, error, id, fieldRef }) => {
  const errorId = id ? `${id}-error` : undefined;
  return (
    <div ref={fieldRef} tabIndex={-1} style={{ outline: 'none' }}>
      <label htmlFor={id} style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TK.textMuted, marginBottom: 7, textAlign: isRTL ? 'right' : 'left' }}>
        {label}
      </label>
      <div
        className={error ? 'au-input--error' : undefined}
        style={{ position: 'relative', aspectRatio: '16/9', borderRadius: RADIUS.lg, overflow: 'hidden', background: TK.bgSubtle, border: `1px solid ${error ? TK.red : TK.border}` }}
      >
        {asset?.url ? (
          <>
            {kind === 'video'
              ? <video src={mediaSrc(asset)} muted loop autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <img src={mediaSrc(asset)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
            <button onClick={onRemove} style={{ position: 'absolute', top: 8, insetInlineEnd: 8, width: 26, height: 26, borderRadius: '50%', background: 'rgba(13,17,23,0.6)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} aria-label={isRTL ? 'إزالة' : 'Remove'}>
              <X style={{ width: 13, height: 13, color: '#fff' }} />
            </button>
          </>
        ) : (
          // `tabIndex={0}` on the label (not just the hidden file input) —
          // a `display:none` input can never receive DOM focus, so without
          // this a keyboard user jumping here from the Error Summary would
          // land nowhere visible despite the red border being correct.
          <label
            className="au-upload-tile au-focus-ring" tabIndex={0} role="button"
            aria-label={isRTL ? 'رفع صورة الغلاف' : 'Upload cover image'}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.querySelector('input')?.click(); } }}
            style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}
          >
            {kind === 'video' ? <VideoIcon style={{ width: 20, height: 20, color: TK.textLight }} /> : <ImageIcon style={{ width: 20, height: 20, color: TK.textLight }} />}
            <span style={{ fontSize: 11.5, color: TK.textMuted, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <Upload style={{ width: 13, height: 13 }} /> {isRTL ? 'رفع' : 'Upload'}
            </span>
            <input id={id} type="file" accept={accept} aria-invalid={error ? true : undefined} aria-describedby={errorId} onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f) onUpload(f); }} style={{ display: 'none' }} />
          </label>
        )}
        {pending && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spinner />
          </div>
        )}
      </div>
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
};

/* ── Section wrapper — gives Basic Info / Media / Credits real visual
   separation instead of a continuous unstyled scroll (see redesign brief
   §8: "Visual hierarchy between Basic Info, Media, and Credits"). */
const Section = ({ title, subtitle, children, isRTL }) => (
  <Card padding="26px" style={{ marginBottom: 20 }}>
    <div style={{ marginBottom: 22, textAlign: isRTL ? 'right' : 'left' }}>
      <h2 style={{ fontSize: 14.5, fontWeight: 700, color: TK.text, margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 12, color: TK.textLight, margin: '4px 0 0', lineHeight: 1.5 }}>{subtitle}</p>}
    </div>
    {children}
  </Card>
);

/**
 * Quick Showcase — the fast path for screenshots/video/UI-UX concepts/
 * internal demos that don't warrant a written case study. Deliberately a
 * SEPARATE, purpose-built page (single scroll, grouped cards, no sidebar
 * section-nav, no completion-score gamification) rather than a
 * visually-shrunk copy of PortfolioWizard.jsx — see the Portfolio redesign
 * brief. Writes the exact same PortfolioProject document (via the exact
 * same /api/portfolio/admin endpoints) with `presentationMode: 'showcase'`
 * — no parallel API, model, or storage.
 *
 * Field selection is deliberately narrow: every field a full case study has
 * that a showcase doesn't need (Story/Process/Impact/Proof/FAQ/Client/
 * Location/confidential/private/timeline/services/awards/testimonials/
 * related-override) is simply absent from this form, not hidden behind a
 * toggle — see PortfolioShowcaseView.jsx for why that's safe (those
 * sections render only when the underlying data exists, and this form never
 * writes it).
 *
 * ── Publish validation ───────────────────────────────────────────────────
 * `missingFields` is DERIVED live from `form` on every render via
 * `computeMissingFields` (client/src/components/portfolio-wizard/
 * publishValidation.jsx) rather than kept as separate `useState` error
 * state that has to be manually synced — a field's error disappears the
 * instant its value becomes valid, with no risk of stale/duplicated error
 * state, and the exact same function is what the backend's
 * `assertPublishable` mirrors field-for-field. `attemptedPublish` is the
 * only thing that gates whether those (derived) errors are actually shown —
 * so a brand-new blank form never opens already covered in red.
 *
 * ── Save/publish race ────────────────────────────────────────────────────
 * `save()` queues behind any in-flight save via `savingPromiseRef` (instead
 * of silently no-op'ing while one is running) so a caller — critically, the
 * Publish button — always gets a real result for the save IT asked for, not
 * a stale no-op. `projectIdRef` is updated synchronously the instant a
 * create-on-first-save resolves (before the `setProjectId` state commit),
 * so the very next save/publish call can never read a stale/missing id.
 */
const PortfolioQuickShowcase = () => {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const { isRTL } = useLanguage();

  const [projectId, setProjectId] = useState(routeId || null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(Boolean(routeId));
  const [saveState, setSaveState] = useState('idle');
  const [pendingUploads, setPendingUploads] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const [waitingForUploads, setWaitingForUploads] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [blocksOpen, setBlocksOpen] = useState(false);
  const [attemptedPublish, setAttemptedPublish] = useState(false);
  const [readinessCollapsed, setReadinessCollapsed] = useState(true);
  const [focusToken, setFocusToken] = useState(0);

  const savingPromiseRef = useRef(null);
  const projectIdRef = useRef(routeId || null);
  const pendingUploadsRef = useRef([]);
  const autosaveTimeoutRef = useRef(null);
  const skipNextAutosave = useRef(Boolean(routeId));
  const fieldRefs = useRef({});

  useEffect(() => { pendingUploadsRef.current = pendingUploads; }, [pendingUploads]);
  useEffect(() => { projectIdRef.current = projectId; }, [projectId]);

  const L = {
    back: isRTL ? 'المحفظة' : 'Portfolio',
    untitled: isRTL ? 'عرض سريع بلا عنوان' : 'Untitled showcase',
    loadFailed: isRTL ? 'فشل تحميل المشروع' : 'Failed to load project',
    uploadFailed: (name) => isRTL ? `فشل رفع ${name}` : `Upload failed: ${name}`,
    autosaveFailed: isRTL ? 'فشل الحفظ التلقائي' : 'Autosave failed',
    statusUpdateFailed: isRTL ? 'تعذر تحديث الحالة' : 'Could not update status',
    duplicated: isRTL ? 'تم الإنشاء — جارٍ فتح النسخة' : 'Duplicated — opening the copy',
    duplicateFailed: isRTL ? 'فشل النسخ' : 'Duplicate failed',
    duplicate: isRTL ? 'نسخ' : 'Duplicate',
    exported: isRTL ? 'تم تصدير JSON — لا تتضمن الصور أو الفيديوهات' : 'Exported JSON — images and video are not included',
    preview: isRTL ? 'معاينة' : 'Preview',
    viewLive: isRTL ? 'عرض مباشر' : 'View live',
    unpublish: isRTL ? 'إلغاء النشر' : 'Unpublish',
    publish: isRTL ? 'نشر' : 'Publish',
    publishWaiting: isRTL ? 'بانتظار اكتمال الرفع…' : 'Waiting for uploads…',
    couldNotCreate: isRTL ? 'تعذر إنشاء المشروع — حاول مرة أخرى' : 'Could not create the project — try again',
    serverRejected: isRTL ? 'رفض الخادم النشر — راجع الحقول أدناه' : 'The server rejected publishing — check the fields below',
    savedLabel: { idle: '', pending: isRTL ? 'تغييرات غير محفوظة' : 'Unsaved changes', saving: isRTL ? 'جارٍ الحفظ…' : 'Saving…', saved: isRTL ? 'تم الحفظ' : 'Saved', error: isRTL ? 'فشل الحفظ' : 'Save failed' },
    statusToast: (status) => (status === 'published' ? (isRTL ? 'تم النشر' : 'Published') : (isRTL ? 'تم النقل إلى المسودات' : 'Moved to draft')),
    basicsTitle: isRTL ? 'المعلومات الأساسية' : 'Basic Info',
    basicsSubtitle: isRTL ? 'العنوان والتصنيف — ما يحتاجه الزائر ليعرف ما هذا المشروع' : 'Title and classification — what a visitor needs to know what this project is',
    mediaTitle: isRTL ? 'الصور والفيديو' : 'Photos & Video',
    mediaSubtitle: isRTL ? 'الغلاف يظهر في البطاقة والصفحة الرئيسية للمشروع' : 'The cover appears on the card and the project page hero',
    screenshotsTitle: isRTL ? 'لقطات من داخل المشروع' : 'Project Screenshots',
    screenshotsSubtitle: isRTL ? 'معرض منفصل عن صورة الغلاف — اختياري، لكنه يعطي فكرة أوضح' : 'A separate gallery from the Cover Image — optional, but gives a fuller picture',
    creditsTitle: isRTL ? 'الاعتمادات والنشر' : 'Credits & Publish',
    creditsSubtitle: isRTL ? 'الفريق والأدوات والروابط — كلها اختيارية' : 'Team, tools, and links — all optional',
    title: isRTL ? 'العنوان' : 'Title',
    titlePh: isRTL ? 'اسم المشروع' : 'Project name',
    shortDesc: isRTL ? 'وصف مختصر' : 'Short description',
    shortDescPh: isRTL ? 'سطران أو ثلاثة تشرح المشروع' : 'Two or three lines describing the project',
    category: isRTL ? 'الفئة' : 'Category',
    industry: isRTL ? 'المجال' : 'Industry',
    projectType: isRTL ? 'نوع المشروع' : 'Project Type',
    projectTypePh: isRTL ? 'اختيار نوع المشروع…' : 'Select project type…',
    deliveryStatus: isRTL ? 'حالة التسليم' : 'Delivery Status',
    deliveryLive: isRTL ? 'مباشر' : 'Live',
    deliveryConcept: isRTL ? 'مفهوم تصميم' : 'Concept',
    deliveryArchived: isRTL ? 'مؤرشف' : 'Archived',
    year: isRTL ? 'السنة' : 'Year',
    tags: isRTL ? 'وسوم' : 'Tags',
    tagsPh: isRTL ? 'اختيار أو إنشاء وسوم…' : 'Select or create tags…',
    coverImage: isRTL ? 'صورة الغلاف' : 'Cover Image',
    coverVideo: isRTL ? 'فيديو الغلاف (اختياري)' : 'Cover Video (optional)',
    blocksToggle: isRTL ? 'متقدم: كتل محتوى (اختياري)' : 'Advanced: Content Blocks (optional)',
    blocksIntro: isRTL
      ? 'ميزة متقدمة اختيارية — عناصر مفردة بإطار عرض (متصفح/موبايل/تابلت) وتسمية توضيحية، أو فيديو خارجي من YouTube/Vimeo/Loom. لا تحل محل معرض اللقطات أعلاه.'
      : 'An optional advanced feature — individual items with a presentation frame (browser/mobile/tablet) and a caption, or an external YouTube/Vimeo/Loom video. Does not replace the screenshot gallery above.',
    team: isRTL ? 'الفريق' : 'Team',
    services: isRTL ? 'الخدمات المقدمة' : 'Services Delivered',
    servicesHint: isRTL
      ? 'القدرات التي نفذتها يانسي تك في هذا المشروع (مثال: التوجيه الإبداعي، تصميم UI/UX، تطوير الواجهة الأمامية، تصميم الحركة والتفاعل، التصميم المتجاوب) — وليست أدوات أو تقنيات برمجية.'
      : 'The capabilities YANSY Tech delivered on this project (e.g. Creative Direction, UI/UX Design, Front-end Development, Motion & Interaction Design, Responsive Design) — not software tools.',
    servicesPh: isRTL ? 'اختيار أو إنشاء خدمات…' : 'Select or create services…',
    tools: isRTL ? 'الأدوات / التقنيات' : 'Tools / Technologies',
    toolsPh: isRTL ? 'اختيار أو إنشاء أدوات…' : 'Select or create tools…',
    links: isRTL ? 'الروابط' : 'LINKS',
    figma: 'Figma',
    demoUrl: isRTL ? 'رابط تجريبي / مباشر' : 'Demo / Live URL',
    featured: isRTL ? 'مميز (يظهر في الصفحة الرئيسية)' : 'Featured (show on Home)',
    displayOrder: isRTL ? 'ترتيب العرض' : 'Display Order',
    advanced: isRTL ? 'إعدادات متقدمة (SEO)' : 'Advanced Settings (SEO)',
    metaTitle: isRTL ? 'عنوان SEO' : 'Meta title',
    metaDescription: isRTL ? 'وصف SEO' : 'Meta description',
  };

  useEffect(() => {
    if (!routeId) return;
    api.get(`/portfolio/admin/${routeId}`)
      .then(({ data }) => setForm({ ...EMPTY_FORM, ...data.project }))
      .catch(() => toast.error(L.loadFailed))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = useCallback((key, value) => setForm((f) => ({ ...f, [key]: value })), []);
  const setBlocks = useCallback((blocks) => setForm((f) => ({ ...f, blocks })), []);
  const setGallery = useCallback((updater) => setForm((f) => ({ ...f, gallery: typeof updater === 'function' ? updater(f.gallery) : updater })), []);

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
    technologies: toIds(f.technologies),
    projectTags: toIds(f.projectTags),
    services: toIds(f.services),
    gallery: f.gallery || [],
    team: (f.team || []).map((t) => ({ member: toId(t.member), roleOverride: t.roleOverride, roleArOverride: t.roleArOverride })).filter((t) => t.member),
    presentationMode: 'showcase',
  }), []);

  // ── The actual network call. Always returns a result object — never
  // throws, never silently no-ops — so a caller (autosave OR the Publish
  // button) can rely on its outcome. ─────────────────────────────────────
  const doSave = useCallback(async (currentForm) => {
    setSaveState('saving');
    try {
      const payload = buildPayload(currentForm);
      if (!projectIdRef.current) {
        const { data } = await api.post('/portfolio/admin', payload);
        // Synchronous ref update BEFORE the state commit — the very next
        // queued save/publish call must never read a stale/missing id.
        projectIdRef.current = data.project._id;
        setProjectId(data.project._id);
        navigate(`/app/admin/portfolio/showcase/${data.project._id}/edit`, { replace: true });
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

  // ── save() — queues behind any in-flight save instead of no-op'ing, so
  // every caller gets a real, awaitable result for the form it passed. ────
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

  // ── Focus management ─────────────────────────────────────────────────────
  const scrollToField = (key) => fieldRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const jumpToField = (key) => {
    const node = fieldRefs.current[key];
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    node.querySelector('input, textarea, select, button, [tabindex]')?.focus();
  };

  const missingFields = computeMissingFields(form);
  const visibleErrors = attemptedPublish ? missingFields : [];
  const fieldErrorMsg = (key) => (visibleErrors.includes(key) ? fieldMessage(key, isRTL) : undefined);

  // ── Publish — validate -> wait for uploads -> flush latest save (create
  // the doc first if it doesn't exist yet) -> publish only against a
  // confirmed-fresh id -> map any backend rejection into the same
  // field-error system. ─────────────────────────────────────────────────
  const runPublish = async () => {
    const clientMissing = computeMissingFields(form);
    if (clientMissing.length) {
      setAttemptedPublish(true);
      setFocusToken((t) => t + 1);
      scrollToField(clientMissing[0]);
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
        scrollToField((data.missingFields || [])[0]);
        toast.error(L.serverRejected);
      } else {
        toast.error(data?.error || L.statusUpdateFailed);
      }
    } finally {
      setPublishing(false);
    }
  };

  const unpublish = async () => {
    setPublishing(true);
    try {
      await save(form);
      const { data } = await api.patch(`/portfolio/admin/${projectIdRef.current}/status`, { status: 'draft' });
      setForm((f) => ({ ...f, status: data.project.status }));
      toast.success(L.statusToast('draft'));
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
      navigate(`/app/admin/portfolio/showcase/${data.project._id}/edit`);
    } catch {
      toast.error(L.duplicateFailed);
    } finally {
      setDuplicating(false);
    }
  };

  // ── Export — pure client-side serialization of the CURRENT form state
  // (including unsaved edits), see utils/portfolioPortable.js. No network
  // call, no images/video, never disruptive (no confirmation needed). ──────
  const exportJson = () => {
    setExporting(true);
    try {
      downloadPortableJson(form);
      toast.success(L.exported);
    } catch {
      toast.error(isRTL ? 'تعذّر تصدير الملف' : 'Could not export the file');
    } finally {
      setExporting(false);
    }
  };

  // ── Import apply — one coherent state transition (single setForm call);
  // see PortfolioImportModal.jsx's doc comment. Never publishes, never
  // touches media, status stays whatever it already was. ──────────────────
  const applyImport = (nextForm, plan) => {
    setImportResult({ ...plan, previousForm: form });
    setForm(nextForm);
  };

  if (loading) return <div style={{ minHeight: '100vh', background: TK.bg }}><PageSpinner /></div>;

  const BackChevron = isRTL ? ChevronRight : ChevronLeft;
  const STATUS_TONE = { draft: 'neutral', published: 'success', archived: 'warning' };
  const STATUS_LABEL = { draft: isRTL ? 'مسودة' : 'draft', published: isRTL ? 'منشور' : 'published', archived: isRTL ? 'مؤرشف' : 'archived' };

  return (
    <div style={{ minHeight: '100vh', background: TK.bg }} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: `1px solid ${TK.border}` }}>
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 14, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <Link to="/app/admin/portfolio" className="au-back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: TK.textMuted, textDecoration: 'none', flexShrink: 0, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <BackChevron style={{ width: 14, height: 14 }} /> {L.back}
          </Link>
          <div style={{ flex: 1, minWidth: 0, textAlign: isRTL ? 'right' : 'left' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: TK.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.title || L.untitled}</p>
            <p style={{ fontSize: 11, color: saveState === 'error' ? TK.red : TK.textLight, margin: '2px 0 0' }}>{L.savedLabel[saveState]}</p>
          </div>
          <Badge tone={STATUS_TONE[form.status] || 'neutral'} dot>{STATUS_LABEL[form.status]}</Badge>
          {projectId && (
            <a href={`/app/admin/portfolio/${projectId}/preview`} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm" icon={Eye}>{L.preview}</Button>
            </a>
          )}
          <PortfolioIOMenu
            isRTL={isRTL}
            onImport={() => setImportOpen(true)}
            onExport={exportJson}
            onDownloadTemplate={() => downloadPortableTemplate('showcase')}
            exporting={exporting}
            onDuplicate={projectId ? duplicate : undefined}
            duplicating={duplicating}
            canDuplicate={Boolean(projectId)}
          />
          {form.status === 'published' ? (
            <>
              {form.liveUrl && (
                <a href={`https://yansytech.com/portfolio/${form.slug || projectId}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" icon={ExternalLink}>{L.viewLive}</Button>
                </a>
              )}
              <Button variant="secondary" size="sm" onClick={unpublish} loading={publishing}>{L.unpublish}</Button>
            </>
          ) : (
            <Button variant="primary" size="sm" onClick={runPublish} loading={publishing}>
              {publishing && waitingForUploads ? L.publishWaiting : L.publish}
            </Button>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '28px 32px 60px' }}>
        <ImportResultBanner
          result={importResult}
          isRTL={isRTL}
          onUndo={() => { if (importResult?.previousForm) setForm(importResult.previousForm); setImportResult(null); }}
          onDismiss={() => setImportResult(null)}
        />
        {attemptedPublish && missingFields.length > 0 ? (
          <ErrorSummary missing={missingFields} isRTL={isRTL} onJump={jumpToField} focusToken={focusToken} />
        ) : (
          <PublishReadiness form={form} isRTL={isRTL} onJump={jumpToField} collapsed={readinessCollapsed} onToggleCollapsed={() => setReadinessCollapsed((c) => !c)} />
        )}

        <Section title={L.basicsTitle} subtitle={L.basicsSubtitle} isRTL={isRTL}>
          <div className="space-y-5">
            <BilingualPair
              label={L.title} required isRTL={isRTL} id="field-title"
              ref={(el) => { fieldRefs.current.title = el; }}
              error={fieldErrorMsg('title')}
              enValue={form.title} arValue={form.titleAr}
              onEnChange={(v) => set('title', v)} onArChange={(v) => set('titleAr', v)}
              placeholder={L.titlePh}
            />
            <BilingualPair
              label={L.shortDesc} required isRTL={isRTL} multiline rows={2} id="field-description"
              ref={(el) => { fieldRefs.current.description = el; }}
              error={fieldErrorMsg('description')}
              enValue={form.description} arValue={form.descriptionAr}
              onEnChange={(v) => set('description', v)} onArChange={(v) => set('descriptionAr', v)}
              placeholder={L.shortDescPh}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={L.category} required isRTL={isRTL} id="field-category" ref={(el) => { fieldRefs.current.category = el; }} error={fieldErrorMsg('category')}>
                <RelationPicker apiBase="/categories" value={form.category} onChange={(v) => set('category', v)} allowCreate={false} placeholder={isRTL ? 'اختيار فئة…' : 'Select category…'} />
              </Field>
              <Field label={L.industry} isRTL={isRTL}>
                <RelationPicker apiBase="/industries" value={form.industry} onChange={(v) => set('industry', v)} quickCreateFields={[{ key: 'name', label: 'Name', labelAr: 'الاسم', required: true }, { key: 'nameAr', label: 'Name (Arabic)', labelAr: 'الاسم (عربي)' }]} placeholder={isRTL ? 'مثال: تقنية مالية' : 'e.g. Fintech'} />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label={L.projectType} required isRTL={isRTL} id="field-projectType" ref={(el) => { fieldRefs.current.projectType = el; }} error={fieldErrorMsg('projectType')}>
                <RelationPicker
                  apiBase="/project-types"
                  value={form.projectType}
                  onChange={(v) => set('projectType', v)}
                  quickCreateFields={PROJECT_TYPE_QUICK_CREATE_FIELDS}
                  createTitle={PROJECT_TYPE_CREATE_TITLE}
                  placeholder={L.projectTypePh}
                />
              </Field>
              <Field label={L.deliveryStatus} isRTL={isRTL} hint={isRTL ? 'الافتراضي: مباشر' : 'Defaults to Live'}>
                <FilterPills
                  value={form.deliveryStatus || 'live'}
                  onChange={(v) => set('deliveryStatus', v)}
                  options={[{ value: 'live', label: L.deliveryLive }, { value: 'concept', label: L.deliveryConcept }, { value: 'archived', label: L.deliveryArchived }]}
                />
              </Field>
              <Field label={L.year} isRTL={isRTL}><TextInput type="number" value={form.year || ''} onChange={(e) => set('year', e.target.value)} dir="ltr" /></Field>
            </div>
            <ProjectOriginField value={form.projectOrigin} onChange={(v) => set('projectOrigin', v)} isRTL={isRTL} />
            <Field label={L.tags} isRTL={isRTL}>
              <RelationPicker apiBase="/tags" value={form.projectTags} onChange={(v) => set('projectTags', v)} multiple quickCreateFields={[{ key: 'name', label: 'Name', labelAr: 'الاسم', required: true }, { key: 'nameAr', label: 'Name (Arabic)', labelAr: 'الاسم (عربي)' }]} placeholder={L.tagsPh} />
            </Field>
            <div style={{ borderTop: `1px solid ${TK.border}`, paddingTop: 20 }}>
              <HighlightsEditor value={form.highlights} onChange={(v) => set('highlights', v)} isRTL={isRTL} />
            </div>
          </div>
        </Section>

        <Section title={L.mediaTitle} subtitle={L.mediaSubtitle} isRTL={isRTL}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <CoverSlot
              label={`${L.coverImage} *`} asset={form.coverImage} accept="image/*" isRTL={isRTL}
              id="field-coverImage" fieldRef={(el) => { fieldRefs.current.coverImage = el; }} error={fieldErrorMsg('coverImage')}
              pending={pendingUploads.some((u) => u.key === 'coverImage')}
              onUpload={async (file) => set('coverImage', await uploadMedia(file, 'coverImage'))}
              onRemove={() => { deleteMedia(form.coverImage); set('coverImage', null); }}
            />
            <CoverSlot
              label={L.coverVideo} asset={form.coverVideo} kind="video" accept="video/mp4,video/webm,video/quicktime" isRTL={isRTL}
              pending={pendingUploads.some((u) => u.key === 'coverVideo')}
              onUpload={async (file) => set('coverVideo', await uploadMedia(file, 'coverVideo'))}
              onRemove={() => { deleteMedia(form.coverVideo); set('coverVideo', null); }}
            />
          </div>
        </Section>

        <Section title={L.screenshotsTitle} subtitle={L.screenshotsSubtitle} isRTL={isRTL}>
          <MediaSection gallery={form.gallery} setGallery={setGallery} isRTL={isRTL} uploadMedia={uploadMedia} deleteMedia={deleteMedia} pendingUploads={pendingUploads} />

          <div style={{ borderTop: `1px solid ${TK.border}`, paddingTop: 16, marginTop: 22 }}>
            <button
              onClick={() => setBlocksOpen((o) => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: TK.textMuted, padding: 0, fontFamily: 'inherit', flexDirection: isRTL ? 'row-reverse' : 'row' }}
            >
              <ChevronDown style={{ width: 14, height: 14, transform: blocksOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              {L.blocksToggle}
            </button>
            {blocksOpen && (
              <div style={{ marginTop: 16 }}>
                <BlocksEditor
                  blocks={form.blocks} setBlocks={setBlocks} isRTL={isRTL}
                  uploadMedia={uploadMedia} deleteMedia={deleteMedia} pendingUploads={pendingUploads}
                  allowedTypes={['image', 'gallery', 'video']} intro={L.blocksIntro}
                />
              </div>
            )}
          </div>
        </Section>

        <Section title={L.creditsTitle} subtitle={L.creditsSubtitle} isRTL={isRTL}>
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: TK.textMuted, marginBottom: 8, textAlign: isRTL ? 'right' : 'left' }}>{L.team}</p>
            <TeamSection form={form} set={set} isRTL={isRTL} />
          </div>

          <Field label={L.services} hint={L.servicesHint} isRTL={isRTL}>
            <RelationPicker apiBase="/services" value={form.services} onChange={(v) => set('services', v)} multiple quickCreateFields={[{ key: 'name', label: 'Name', labelAr: 'الاسم', required: true }, { key: 'nameAr', label: 'Name (Arabic)', labelAr: 'الاسم (عربي)' }]} placeholder={L.servicesPh} />
          </Field>

          <div style={{ marginTop: 20 }}>
            <Field label={L.tools} isRTL={isRTL}>
              <RelationPicker apiBase="/technologies" value={form.technologies} onChange={(v) => set('technologies', v)} multiple quickCreateFields={[{ key: 'name', label: 'Name', labelAr: 'الاسم', required: true }]} placeholder={L.toolsPh} />
            </Field>
          </div>

          <div style={{ borderTop: `1px solid ${TK.border}`, paddingTop: 20, marginTop: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: TK.textMuted, marginBottom: 12, textAlign: isRTL ? 'right' : 'left' }}>{L.links}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={L.demoUrl} isRTL={isRTL}><TextInput type="url" value={form.liveUrl} onChange={(e) => set('liveUrl', e.target.value)} placeholder="https://..." dir="ltr" /></Field>
              <Field label={L.figma} isRTL={isRTL}><TextInput type="url" value={form.figmaUrl} onChange={(e) => set('figmaUrl', e.target.value)} placeholder="https://figma.com/..." dir="ltr" /></Field>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${TK.border}`, paddingTop: 20, marginTop: 20, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px 32px' }}>
            <Switch checked={form.featured} onChange={(v) => set('featured', v)} label={L.featured} />
            <div style={{ maxWidth: 160 }}>
              <Field label={L.displayOrder} isRTL={isRTL}>
                <TextInput
                  type="number" step="1" value={form.displayOrder ?? ''} dir="ltr"
                  onChange={(e) => { const raw = e.target.value; if (raw === '') { set('displayOrder', null); return; } const n = Math.trunc(Number(raw)); set('displayOrder', Number.isFinite(n) ? n : null); }}
                  placeholder={isRTL ? 'تلقائي' : 'Auto'}
                />
              </Field>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${TK.border}`, paddingTop: 16, marginTop: 20 }}>
            <button
              onClick={() => setAdvancedOpen((o) => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: TK.textMuted, padding: 0, fontFamily: 'inherit', flexDirection: isRTL ? 'row-reverse' : 'row' }}
            >
              <ChevronDown style={{ width: 14, height: 14, transform: advancedOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              {L.advanced}
            </button>
            {advancedOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginTop: 16 }}>
                <Field label={L.metaTitle} isRTL={isRTL}><TextInput value={form.metaTitle} onChange={(e) => set('metaTitle', e.target.value)} placeholder={form.title} dir={isRTL ? 'rtl' : 'ltr'} /></Field>
                <Field label={L.metaDescription} isRTL={isRTL}><TextInput value={form.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} placeholder={form.description?.slice(0, 60)} dir={isRTL ? 'rtl' : 'ltr'} /></Field>
              </div>
            )}
          </div>
        </Section>
      </div>

      <PortfolioImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        isRTL={isRTL}
        existingForm={form}
        onApply={applyImport}
      />
    </div>
  );
};

export default PortfolioQuickShowcase;
