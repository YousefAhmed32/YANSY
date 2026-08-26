import { useRef, useState, useEffect } from 'react';
import { Upload, X, ImageIcon, VideoIcon, Info, Shapes, ArrowUpRight } from 'lucide-react';
import { TK, RADIUS, TextInput, Switch, Spinner, FilterPills } from '../../admin-ui';
import { mediaSrc } from '../../utils/media';
import api from '../../utils/api';
import { Field, BilingualPair } from './shared';
import RelationPicker from './RelationPicker';
import ProjectOriginField from './ProjectOriginField';
import HighlightsEditor from './HighlightsEditor';

// Phase 1.1 — short, plain-language guidance shown under the Project Type
// field once a type is picked, keyed by the starter types' slugs (see
// server/scripts/migrate-portfolio-phase2.js). A type created later
// by an admin won't have an entry here — falls back to a generic sentence
// derived from `isConceptType` so the hint never just goes blank for a
// custom type. Deliberately client-side copy, not a new schema field (the
// brief for this pass explicitly rules out new fields) — ProjectType has no
// "description" of its own.
const TYPE_HELP_TEXT = {
  'web-project':       { en: 'Best for live, shipped websites — marketing sites, e-commerce, custom web apps.', ar: 'الأنسب للمواقع المباشرة المُطلَقة فعليًا — مواقع تسويقية، متاجر إلكترونية، تطبيقات ويب مخصصة.' },
  'mobile-app':        { en: 'Native or cross-platform mobile applications.', ar: 'تطبيقات جوال أصلية أو متعددة المنصات.' },
  'dashboard-saas':    { en: 'Admin panels and SaaS platforms.', ar: 'لوحات تحكم إدارية ومنصات SaaS.' },
  'landing-page':      { en: 'Single-page campaigns and product launches.', ar: 'صفحات هبوط لحملات تسويقية أو إطلاق منتج.' },
  'branding-identity': { en: 'Logo, visual identity, and brand guideline work.', ar: 'أعمال الشعار والهوية البصرية ودليل العلامة التجارية.' },
  'ui-ux-concept':     { en: 'Best for design-only, self-directed, or unshipped work.', ar: 'الأنسب للأعمال التصميمية الذاتية أو غير المُطلَقة تجاريًا.' },
};
const typeHelpText = (type, isRTL) => {
  const preset = type?.slug && TYPE_HELP_TEXT[type.slug];
  const fallback = type?.isConceptType
    ? { en: 'Concept type — hides Results, KPIs, Testimonials, and WhatsApp Proof (fabricated-claim risk only); everything else stays available, same as any project.', ar: 'نوع مفاهيمي — يُخفي النتائج والمؤشرات والشهادات وإثبات واتساب فقط (لتفادي ادعاءات غير حقيقية)؛ كل شيء آخر يبقى متاحًا كأي مشروع.' }
    : { en: 'Standard project type — every field in this wizard stays available.', ar: 'نوع مشروع قياسي — تبقى كل حقول هذا المعالج متاحة.' };
  return isRTL ? (preset || fallback).ar : (preset || fallback).en;
};

const MediaSlot = ({ label, asset, kind = 'image', pending, onUpload, onRemove, accept, aspect = '16/9', isRTL }) => {
  const inputRef = useRef(null);
  return (
    <Field label={label} isRTL={isRTL}>
      <div style={{ position: 'relative', aspectRatio: aspect, borderRadius: RADIUS.lg, overflow: 'hidden', background: TK.bgSubtle, border: `1px solid ${TK.border}` }}>
        {asset?.url ? (
          <>
            {kind === 'video'
              ? <video src={mediaSrc(asset)} muted loop autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <img src={mediaSrc(asset)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
            <button
              onClick={onRemove}
              style={{ position: 'absolute', top: 8, insetInlineEnd: 8, width: 26, height: 26, borderRadius: '50%', background: 'rgba(13,17,23,0.6)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              aria-label={isRTL ? 'إزالة' : 'Remove'}
            >
              <X style={{ width: 13, height: 13, color: '#fff' }} />
            </button>
          </>
        ) : (
          <label className="au-upload-tile" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
            {kind === 'video' ? <VideoIcon style={{ width: 20, height: 20, color: TK.textLight }} /> : <ImageIcon style={{ width: 20, height: 20, color: TK.textLight }} />}
            <span style={{ fontSize: 11.5, color: TK.textMuted, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <Upload style={{ width: 13, height: 13 }} /> {isRTL ? 'رفع' : 'Upload'}
            </span>
            <input ref={inputRef} type="file" accept={accept} onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f) onUpload(f); }} style={{ display: 'none' }} />
          </label>
        )}
        {pending && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spinner />
          </div>
        )}
      </div>
    </Field>
  );
};

const SectionLabel = ({ children, isRTL }) => (
  <p style={{ fontSize: 12, fontWeight: 700, color: TK.textMuted, letterSpacing: isRTL ? 0 : '0.04em', marginBottom: 14, textAlign: isRTL ? 'right' : 'left' }}>
    {children}
  </p>
);

// Phase 1.1 — stands in for the Project Type picker when the library is
// genuinely empty (not "no search results," but zero types exist anywhere).
// Opens the library management screen in a new tab so the in-progress draft
// here is never lost — the same pattern already used by the wizard's own
// Preview/View Live links (see PortfolioWizard.jsx).
const EmptyProjectTypeState = ({ isRTL }) => (
  <a
    href="/app/admin/libraries/projectTypes"
    target="_blank"
    rel="noopener noreferrer"
    style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: RADIUS.md,
      border: `1px dashed ${TK.border}`, background: TK.bgSubtle, textDecoration: 'none',
      flexDirection: isRTL ? 'row-reverse' : 'row',
    }}
  >
    <Shapes style={{ width: 16, height: 16, color: TK.textLight, flexShrink: 0 }} />
    <span style={{ flex: 1, fontSize: 12, color: TK.textMuted, textAlign: isRTL ? 'right' : 'left' }}>
      {isRTL ? 'لا توجد أنواع مشاريع بعد.' : 'No project types yet.'}
    </span>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: TK.accent, flexShrink: 0, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
      {isRTL ? 'إنشاء أول نوع مشروع' : 'Create your first Project Type'}
      <ArrowUpRight style={{ width: 12, height: 12 }} />
    </span>
  </a>
);

const OverviewSection = ({ form, set, isRTL, uploadMedia, deleteMedia, pendingUploads }) => {
  const isPending = (key) => pendingUploads.some((u) => u.key === key);
  // Drives every conditional field below — see server/models/ProjectType.js.
  // Undefined/unset `projectType` (every project that existed before this
  // field shipped) resolves to `false` here, so old projects show exactly
  // the same fields they always have.
  const isConceptType = Boolean(form.projectType?.isConceptType);

  // Phase 1.1 — a one-time, lightweight existence check (not the full list;
  // just `total`) so an admin with zero Project Types ever created sees a
  // "go create one" prompt instead of an empty dropdown. `null` = still
  // checking, and deliberately renders the normal picker while unknown so
  // there's no flash of the empty state for the common case (types exist).
  const [hasProjectTypes, setHasProjectTypes] = useState(null);
  useEffect(() => {
    let cancelled = false;
    api.get('/project-types', { params: { limit: 1 } })
      .then(({ data }) => { if (!cancelled) setHasProjectTypes((data.total || 0) > 0); })
      .catch(() => { if (!cancelled) setHasProjectTypes(true); }); // fail open — never block the picker on a network hiccup
    return () => { cancelled = true; };
  }, []);

  const L = {
    coverImage: isRTL ? 'صورة الغلاف *' : 'Cover Image *',
    coverVideo: isRTL ? 'فيديو الغلاف (اختياري — يُشغَّل بدلًا من الصورة)' : 'Cover Video (optional — plays instead of the image)',
    title: isRTL ? 'العنوان' : 'Title',
    titlePh: isRTL ? 'اسم المشروع' : 'Project name',
    tagline: isRTL ? 'الشعار المختصر' : 'Tagline',
    taglinePh: isRTL ? 'جملة تعريفية قصيرة' : 'One-line elevator pitch',
    category: isRTL ? 'الفئة' : 'Category',
    industry: isRTL ? 'المجال' : 'Industry',
    industryPh: isRTL ? 'مثال: تقنية مالية، لوجستيات' : 'e.g. Fintech, Logistics',
    projectType: isRTL ? 'نوع المشروع' : 'Project Type',
    projectTypePh: isRTL ? 'اختيار نوع المشروع…' : 'Select project type…',
    deliveryStatus: isRTL ? 'حالة التسليم' : 'Delivery Status',
    deliveryLive: isRTL ? 'مباشر' : 'Live',
    deliveryConcept: isRTL ? 'مفهوم تصميم' : 'Concept',
    deliveryArchived: isRTL ? 'مؤرشف' : 'Archived',
    conceptHint: isRTL
      ? 'مشاريع "مفهوم تصميم" هي مشاريع محفظة كاملة مثل أي مشروع آخر — نفس الغلاف والمعرض والقصة والعملية والأدوات والجوائز. الفرق الوحيد هو الصدق: لا تظهر حقول النتائج التجارية والمؤشرات وشهادات العملاء وإثبات واتساب، لأنها تفترض تعاملًا حقيقيًا مع عميل. العميل والرابط المباشر يبقيان متاحين — استخدمهما إذا كانا حقيقيين، واتركهما فارغين إن لم يكونا كذلك.'
      : 'UI/UX Concept projects are full portfolio projects, just like any other — same cover, gallery, story, process, tools, and awards. The only difference is honesty: Results, KPIs, Client Testimonials, and WhatsApp Proof are hidden because they imply a real client engagement. Client and Live URL stay available — use them if real, leave them blank if not.',
    client: isRTL ? 'العميل' : 'CLIENT',
    clientHint: isRTL ? 'شعار العميل واسمه يُداران مركزيًا من مكتبة العملاء' : 'Client logo and name are managed centrally in the Clients library',
    location: isRTL ? 'الموقع' : 'Location',
    locationPh: isRTL ? 'المدينة، الدولة' : 'City, Country',
    confidential: isRTL ? 'سري (إخفاء اسم/شعار العميل علنًا)' : 'Confidential (hide client name/logo publicly)',
    private: isRTL ? 'خاص (إخفاء المشروع بالكامل علنًا)' : 'Private (hide the whole project publicly)',
    timelineRole: isRTL ? 'الجدول الزمني والدور' : 'TIMELINE & ROLE',
    services: isRTL ? 'الخدمات المقدَّمة' : 'SERVICES DELIVERED',
    year: isRTL ? 'السنة' : 'Year',
    duration: isRTL ? 'المدة' : 'Duration',
    durationPh: isRTL ? '8 أسابيع' : '8 weeks',
    teamSize: isRTL ? 'حجم الفريق' : 'Team size',
    teamSizePh: isRTL ? '4 أشخاص' : '4 people',
    launchDate: isRTL ? 'تاريخ الإطلاق' : 'Launch date',
    ourRole: isRTL ? 'دورنا' : 'Our role',
    ourRolePh: isRTL ? 'مثال: قيادة الهندسة وتجربة المستخدم' : 'e.g. Lead engineering + UX',
    links: isRTL ? 'الروابط' : 'LINKS',
    liveUrl: isRTL ? 'الرابط المباشر' : 'Live URL',
    figma: 'Figma',
    github: 'GitHub',
    displayOrder: isRTL ? 'ترتيب العرض' : 'Display Order',
    displayOrderHint: isRTL
      ? 'الأرقام الأقل تظهر أولًا في معرض الأعمال العام. اتركه فارغًا للترتيب التلقائي حسب تاريخ النشر. (مميز والحالة يُداران من تبويب SEO والنشر وشريط الأعلى)'
      : 'Lower numbers appear first on the public portfolio. Leave empty to sort automatically by publish date. (Featured and Status are set in the SEO & Publish tab / top bar)',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <MediaSlot
          label={L.coverImage}
          asset={form.coverImage}
          pending={isPending('coverImage')}
          accept="image/*"
          isRTL={isRTL}
          onUpload={async (file) => { const asset = await uploadMedia(file, 'coverImage'); set('coverImage', asset); }}
          onRemove={() => { deleteMedia(form.coverImage); set('coverImage', null); }}
        />
        <MediaSlot
          label={L.coverVideo}
          asset={form.coverVideo}
          kind="video"
          pending={isPending('coverVideo')}
          accept="video/*"
          isRTL={isRTL}
          onUpload={async (file) => { const asset = await uploadMedia(file, 'coverVideo'); set('coverVideo', asset); }}
          onRemove={() => { deleteMedia(form.coverVideo); set('coverVideo', null); }}
        />
      </div>

      <BilingualPair label={L.title} required isRTL={isRTL} enValue={form.title} arValue={form.titleAr} onEnChange={(v) => set('title', v)} onArChange={(v) => set('titleAr', v)} placeholder={L.titlePh} />
      <BilingualPair label={L.tagline} isRTL={isRTL} enValue={form.tagline} arValue={form.taglineAr} onEnChange={(v) => set('tagline', v)} onArChange={(v) => set('taglineAr', v)} placeholder={L.taglinePh} />

      <HighlightsEditor value={form.highlights} onChange={(v) => set('highlights', v)} isRTL={isRTL} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={L.category} required isRTL={isRTL}>
          <RelationPicker apiBase="/categories" value={form.category} onChange={(v) => set('category', v)} allowCreate={false} placeholder={isRTL ? 'اختيار فئة…' : 'Select category…'} />
        </Field>
        <Field label={L.industry} isRTL={isRTL}>
          <RelationPicker
            apiBase="/industries"
            value={form.industry}
            onChange={(v) => set('industry', v)}
            quickCreateFields={[{ key: 'name', label: 'Name', labelAr: 'الاسم', required: true }, { key: 'nameAr', label: 'Name (Arabic)', labelAr: 'الاسم (عربي)' }]}
            placeholder={L.industryPh}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label={L.projectType} isRTL={isRTL}>
          {hasProjectTypes === false ? (
            <EmptyProjectTypeState isRTL={isRTL} />
          ) : (
            <RelationPicker apiBase="/project-types" value={form.projectType} onChange={(v) => set('projectType', v)} allowCreate={false} placeholder={L.projectTypePh} />
          )}
          {hasProjectTypes !== false && form.projectType && (
            <p style={{ fontSize: 11, color: TK.textLight, margin: '6px 0 0', textAlign: isRTL ? 'right' : 'left' }}>
              {typeHelpText(form.projectType, isRTL)}
            </p>
          )}
        </Field>
        <Field label={L.deliveryStatus} isRTL={isRTL}>
          <FilterPills
            value={form.deliveryStatus || 'live'}
            onChange={(v) => set('deliveryStatus', v)}
            options={[
              { value: 'live', label: L.deliveryLive },
              { value: 'concept', label: L.deliveryConcept },
              { value: 'archived', label: L.deliveryArchived },
            ]}
          />
        </Field>
        <Field label={L.displayOrder} hint={L.displayOrderHint} isRTL={isRTL}>
          <TextInput
            type="number"
            step="1"
            value={form.displayOrder ?? ''}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === '') { set('displayOrder', null); return; }
              const n = Math.trunc(Number(raw));
              set('displayOrder', Number.isFinite(n) ? n : null);
            }}
            placeholder={isRTL ? 'تلقائي' : 'Auto'}
          />
        </Field>
      </div>

      <ProjectOriginField value={form.projectOrigin} onChange={(v) => set('projectOrigin', v)} isRTL={isRTL} />

      {isConceptType && (
        <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderRadius: RADIUS.md, background: TK.accentBg, border: `1px solid ${TK.accentBd}`, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <Info style={{ width: 14, height: 14, color: TK.accent, flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 11.5, color: TK.accent, margin: 0, lineHeight: 1.5, textAlign: isRTL ? 'right' : 'left' }}>{L.conceptHint}</p>
        </div>
      )}

      <div style={{ borderTop: `1px solid ${TK.border}`, paddingTop: 20 }}>
        <SectionLabel isRTL={isRTL}>{L.client}</SectionLabel>
        <Field label={L.client} isRTL={isRTL}>
          <RelationPicker
            apiBase="/clients"
            value={form.client}
            onChange={(v) => set('client', v)}
            hasAvatar
            createTitle={{ en: 'Create client', ar: 'إنشاء عميل' }}
            quickCreateFields={[
              { key: 'logo', type: 'image', label: 'Logo', labelAr: 'الشعار' },
              { key: 'name', label: 'Name (English)', labelAr: 'الاسم (إنجليزي)', required: true },
              { key: 'nameAr', label: 'Name (Arabic)', labelAr: 'الاسم (عربي)', dir: 'rtl' },
              { key: 'website', label: 'Website', labelAr: 'الموقع الإلكتروني', dir: 'ltr', optional: true },
              { key: 'description', label: 'Short description', labelAr: 'وصف مختصر', multiline: true, optional: true },
            ]}
            placeholder={isConceptType
              ? (isRTL ? 'اختياري — اتركه فارغًا لمشروع ذاتي التوجيه…' : 'Optional — leave blank for a self-directed project…')
              : (isRTL ? 'اختيار أو إنشاء عميل…' : 'Select or create a client…')}
          />
        </Field>
        {form.client?.logo?.url && (
          <div style={{ marginTop: 12, width: 56, height: 56, borderRadius: RADIUS.md, overflow: 'hidden', border: `1px solid ${TK.border}`, background: TK.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={mediaSrc(form.client.logo)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6, boxSizing: 'border-box' }} />
          </div>
        )}
        <p style={{ fontSize: 11, color: TK.textLight, margin: '8px 0 0' }}>{L.clientHint}</p>
        <div style={{ marginTop: 12 }}>
          <BilingualPair label={L.location} isRTL={isRTL} enValue={form.location} arValue={form.locationAr} onEnChange={(v) => set('location', v)} onArChange={(v) => set('locationAr', v)} placeholder={L.locationPh} />
        </div>
        <div className="flex flex-wrap items-center gap-8" style={{ marginTop: 16 }}>
          <Switch checked={form.confidential} onChange={(v) => set('confidential', v)} label={L.confidential} />
          <Switch checked={form.private} onChange={(v) => set('private', v)} label={L.private} />
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${TK.border}`, paddingTop: 20 }}>
        <SectionLabel isRTL={isRTL}>{L.timelineRole}</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <Field label={L.year} isRTL={isRTL}><TextInput type="number" value={form.year || ''} onChange={(e) => set('year', e.target.value)} /></Field>
          <Field label={L.duration} isRTL={isRTL}><TextInput value={form.duration} onChange={(e) => set('duration', e.target.value)} placeholder={L.durationPh} dir={isRTL ? 'rtl' : 'ltr'} style={{ textAlign: isRTL ? 'right' : 'left' }} /></Field>
          <Field label={L.teamSize} isRTL={isRTL}><TextInput value={form.teamSize} onChange={(e) => set('teamSize', e.target.value)} placeholder={L.teamSizePh} dir={isRTL ? 'rtl' : 'ltr'} style={{ textAlign: isRTL ? 'right' : 'left' }} /></Field>
          <Field label={L.launchDate} isRTL={isRTL}><TextInput type="date" value={form.launchDate ? form.launchDate.slice(0, 10) : ''} onChange={(e) => set('launchDate', e.target.value)} /></Field>
        </div>
        <BilingualPair label={L.ourRole} isRTL={isRTL} enValue={form.myRole} arValue={form.myRoleAr} onEnChange={(v) => set('myRole', v)} onArChange={(v) => set('myRoleAr', v)} multiline={false} placeholder={L.ourRolePh} />
      </div>

      <div style={{ borderTop: `1px solid ${TK.border}`, paddingTop: 20 }}>
        <SectionLabel isRTL={isRTL}>{L.services}</SectionLabel>
        <RelationPicker
          apiBase="/services"
          value={form.services}
          onChange={(v) => set('services', v)}
          multiple
          quickCreateFields={[{ key: 'name', label: 'Name', labelAr: 'الاسم', required: true }, { key: 'nameAr', label: 'Name (Arabic)', labelAr: 'الاسم (عربي)' }]}
          placeholder={isRTL ? 'اختيار أو إنشاء خدمات…' : 'Select or create services…'}
        />
      </div>

      <div style={{ borderTop: `1px solid ${TK.border}`, paddingTop: 20 }}>
        <SectionLabel isRTL={isRTL}>{L.links}</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label={L.liveUrl} isRTL={isRTL}><TextInput type="url" value={form.liveUrl} onChange={(e) => set('liveUrl', e.target.value)} placeholder={isConceptType ? (isRTL ? 'اختياري — إن كان موجودًا' : 'Optional — if it exists') : 'https://...'} dir="ltr" /></Field>
          <Field label={L.figma} isRTL={isRTL}><TextInput type="url" value={form.figmaUrl} onChange={(e) => set('figmaUrl', e.target.value)} placeholder="https://figma.com/..." dir="ltr" /></Field>
          <Field label={L.github} isRTL={isRTL}><TextInput type="url" value={form.githubUrl} onChange={(e) => set('githubUrl', e.target.value)} placeholder="https://github.com/..." dir="ltr" /></Field>
        </div>
      </div>
    </div>
  );
};

export default OverviewSection;
