import { useRef } from 'react';
import { Upload, X, ImageIcon, VideoIcon } from 'lucide-react';
import { TK, RADIUS, TextInput, Switch, Spinner } from '../../admin-ui';
import { mediaSrc } from '../../utils/media';
import { Field, BilingualPair } from './shared';
import RelationPicker from './RelationPicker';

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

const OverviewSection = ({ form, set, isRTL, uploadMedia, deleteMedia, pendingUploads }) => {
  const isPending = (key) => pendingUploads.some((u) => u.key === key);

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

      <div style={{ borderTop: `1px solid ${TK.border}`, paddingTop: 20 }}>
        <SectionLabel isRTL={isRTL}>{L.client}</SectionLabel>
        <Field label={L.client} isRTL={isRTL}>
          <RelationPicker
            apiBase="/clients"
            value={form.client}
            onChange={(v) => set('client', v)}
            quickCreateFields={[{ key: 'name', label: 'Name', labelAr: 'الاسم', required: true }, { key: 'nameAr', label: 'Name (Arabic)', labelAr: 'الاسم (عربي)' }]}
            placeholder={isRTL ? 'اختيار أو إنشاء عميل…' : 'Select or create a client…'}
          />
        </Field>
        {form.client?.logo?.url && (
          <div style={{ marginTop: 12, width: 56, height: 56, borderRadius: RADIUS.md, overflow: 'hidden', border: `1px solid ${TK.border}` }}>
            <img src={mediaSrc(form.client.logo)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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
          <Field label={L.liveUrl} isRTL={isRTL}><TextInput type="url" value={form.liveUrl} onChange={(e) => set('liveUrl', e.target.value)} placeholder="https://..." dir="ltr" /></Field>
          <Field label={L.figma} isRTL={isRTL}><TextInput type="url" value={form.figmaUrl} onChange={(e) => set('figmaUrl', e.target.value)} placeholder="https://figma.com/..." dir="ltr" /></Field>
          <Field label={L.github} isRTL={isRTL}><TextInput type="url" value={form.githubUrl} onChange={(e) => set('githubUrl', e.target.value)} placeholder="https://github.com/..." dir="ltr" /></Field>
        </div>
      </div>
    </div>
  );
};

export default OverviewSection;
