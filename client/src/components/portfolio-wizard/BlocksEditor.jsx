import { useRef, useState } from 'react';
import {
  Type, AlignLeft, ImageIcon, LayoutGrid, Quote, BarChart3, SplitSquareHorizontal,
  VideoIcon, Code2, Minus, Plus, Trash2, GripVertical, X, Upload,
} from 'lucide-react';
import { TK, RADIUS, TextInput, TextArea, Select, IconButton, Spinner } from '../../admin-ui';
import { mediaSrc } from '../../utils/media';

const BLOCK_DEFS = [
  { type: 'heading',     en: 'Heading',      ar: 'عنوان',        Icon: Type },
  { type: 'paragraph',   en: 'Paragraph',    ar: 'فقرة',         Icon: AlignLeft },
  { type: 'image',       en: 'Image',        ar: 'صورة',         Icon: ImageIcon },
  { type: 'gallery',     en: 'Gallery',      ar: 'معرض صور',      Icon: LayoutGrid },
  { type: 'quote',       en: 'Quote',        ar: 'اقتباس',        Icon: Quote },
  { type: 'statRow',     en: 'Stat row',     ar: 'صف إحصائيات',   Icon: BarChart3 },
  { type: 'beforeAfter', en: 'Before/After', ar: 'قبل/بعد',       Icon: SplitSquareHorizontal },
  { type: 'video',       en: 'Video',        ar: 'فيديو',         Icon: VideoIcon },
  { type: 'embed',       en: 'Embed',        ar: 'تضمين',         Icon: Code2 },
  { type: 'divider',     en: 'Divider',      ar: 'فاصل',          Icon: Minus },
];
const DEF_BY_TYPE = Object.fromEntries(BLOCK_DEFS.map((d) => [d.type, d]));

const NEW_BLOCK = (type) => ({
  type,
  ...(type === 'heading' ? { level: 2 } : {}),
  ...(type === 'gallery' ? { layout: 'grid', images: [] } : {}),
  ...(type === 'image' ? { frame: 'none' } : {}),
  ...(type === 'statRow' ? { stats: [] } : {}),
});

/* ── Tiny single-asset upload chip, reused across block types ────────────── */
const ImageChip = ({ asset, pending, onUpload, onRemove, label, isRTL, accept = 'image/*', kind = 'image' }) => (
  <div>
    {label && <p style={{ fontSize: 10.5, color: TK.textLight, marginBottom: 6, textAlign: isRTL ? 'right' : 'left' }}>{label}</p>}
    <label className="au-upload-tile" style={{
      position: 'relative', display: 'block', aspectRatio: '4/3', borderRadius: RADIUS.md, overflow: 'hidden',
      background: TK.bgSubtle, border: `1px solid ${TK.border}`, cursor: 'pointer',
    }}>
      {asset?.url ? (
        <>
          {kind === 'video'
            ? <video src={mediaSrc(asset)} muted loop autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <img src={mediaSrc(asset)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          <button onClick={(e) => { e.preventDefault(); onRemove(); }} style={{ position: 'absolute', top: 5, insetInlineEnd: 5, width: 20, height: 20, borderRadius: '50%', background: 'rgba(13,17,23,0.6)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} aria-label={isRTL ? 'إزالة' : 'Remove'}>
            <X style={{ width: 11, height: 11, color: '#fff' }} />
          </button>
        </>
      ) : pending ? (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={16} /></div>
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Upload style={{ width: 16, height: 16, color: TK.textLight }} /></div>
      )}
      <input type="file" accept={accept} onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f) onUpload(f); }} style={{ display: 'none' }} />
    </label>
  </div>
);

/* ── Per-type editor body ─────────────────────────────────────────────────── */
const BlockBody = ({ block, patch, uploadKey, uploadMedia, deleteMedia, pendingUploads, isRTL }) => {
  const isPending = (k) => pendingUploads.some((u) => u.key === k);

  const L = {
    headingEn: isRTL ? 'العنوان (إنجليزي)' : 'Heading (EN)',
    headingAr: isRTL ? 'العنوان (عربي)' : 'العنوان (AR)',
    levelLarge: isRTL ? 'كبير (H2)' : 'Large (H2)',
    levelSmall: isRTL ? 'صغير (H3)' : 'Small (H3)',
    paragraphEn: isRTL ? 'الفقرة (إنجليزي)' : 'Paragraph (EN)',
    paragraphAr: isRTL ? 'الفقرة (عربي)' : 'الفقرة (AR)',
    frameNone: isRTL ? 'بدون إطار' : 'No frame',
    frameBrowser: isRTL ? 'إطار متصفح' : 'Browser frame',
    frameMobile: isRTL ? 'إطار موبايل' : 'Mobile frame',
    frameTablet: isRTL ? 'إطار تابلت' : 'Tablet frame',
    captionEn: isRTL ? 'التسمية (إنجليزي)' : 'Caption (EN)',
    captionAr: isRTL ? 'التسمية (عربي)' : 'التسمية (AR)',
    remove: isRTL ? 'إزالة' : 'Remove',
    layoutGrid: isRTL ? 'شبكة' : 'Grid',
    layoutCarousel: isRTL ? 'شريط قابل للتمرير' : 'Scrollable carousel',
    quoteEn: isRTL ? 'الاقتباس (إنجليزي)' : 'Quote (EN)',
    quoteAr: isRTL ? 'الاقتباس (عربي)' : 'الاقتباس (AR)',
    authorOptional: isRTL ? 'الكاتب (اختياري)' : 'Author (optional)',
    roleOptional: isRTL ? 'المنصب (اختياري)' : 'Role (optional)',
    labelEn: isRTL ? 'التسمية (إنجليزي)' : 'Label (EN)',
    labelAr: isRTL ? 'التسمية (عربي)' : 'التسمية (AR)',
    removeStat: isRTL ? 'إزالة الإحصائية' : 'Remove stat',
    addStat: isRTL ? '+ إضافة إحصائية' : '+ Add stat',
    before: isRTL ? 'قبل' : 'Before',
    after: isRTL ? 'بعد' : 'After',
    beforeLabel: isRTL ? 'تسمية "قبل"' : 'Before label',
    afterLabel: isRTL ? 'تسمية "بعد"' : 'After label',
    uploadVideo: isRTL ? 'رفع فيديو' : 'Upload a video',
    or: isRTL ? '— أو —' : '— or —',
    videoUrlPh: isRTL ? 'رابط YouTube / Vimeo / Loom' : 'YouTube / Vimeo / Loom URL',
    embedUrlPh: isRTL ? 'رابط التضمين (Figma، عرض تجريبي...)' : 'Embed URL (Figma, demo, ...)',
    embedTitlePh: isRTL ? 'العنوان (لإمكانية الوصول)' : 'Title (for accessibility)',
    dividerNote: isRTL ? 'يظهر كخط أفقي فاصل — بدون حقول.' : 'Renders as a plain horizontal rule — no fields.',
  };

  switch (block.type) {
    case 'heading': {
      const enField = <TextInput key="en" value={block.text || ''} onChange={(e) => patch({ text: e.target.value })} placeholder={L.headingEn} />;
      const arField = <TextInput key="ar" value={block.textAr || ''} onChange={(e) => patch({ textAr: e.target.value })} dir="rtl" placeholder={L.headingAr} />;
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {isRTL ? <>{arField}{enField}</> : <>{enField}{arField}</>}
          </div>
          <Select value={String(block.level || 2)} onChange={(e) => patch({ level: Number(e.target.value) })} options={[{ value: '2', label: L.levelLarge }, { value: '3', label: L.levelSmall }]} style={{ maxWidth: 160 }} />
        </div>
      );
    }

    case 'paragraph': {
      const enField = <TextArea key="en" rows={3} value={block.text || ''} onChange={(e) => patch({ text: e.target.value })} placeholder={L.paragraphEn} />;
      const arField = <TextArea key="ar" rows={3} value={block.textAr || ''} onChange={(e) => patch({ textAr: e.target.value })} dir="rtl" placeholder={L.paragraphAr} />;
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {isRTL ? <>{arField}{enField}</> : <>{enField}{arField}</>}
        </div>
      );
    }

    case 'image': {
      const captionEn = <TextInput key="en" value={block.caption || ''} onChange={(e) => patch({ caption: e.target.value })} placeholder={L.captionEn} />;
      const captionAr = <TextInput key="ar" value={block.captionAr || ''} onChange={(e) => patch({ captionAr: e.target.value })} dir="rtl" placeholder={L.captionAr} />;
      return (
        <div className="space-y-3">
          <div style={{ maxWidth: 220 }}>
            <ImageChip
              asset={block.asset} pending={isPending(uploadKey('asset'))} isRTL={isRTL}
              onUpload={async (file) => patch({ asset: await uploadMedia(file, uploadKey('asset')) })}
              onRemove={() => { deleteMedia(block.asset); patch({ asset: null }); }}
            />
          </div>
          <Select value={block.frame || 'none'} onChange={(e) => patch({ frame: e.target.value })} options={[{ value: 'none', label: L.frameNone }, { value: 'browser', label: L.frameBrowser }, { value: 'mobile', label: L.frameMobile }, { value: 'tablet', label: L.frameTablet }]} style={{ maxWidth: 200 }} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {isRTL ? <>{captionAr}{captionEn}</> : <>{captionEn}{captionAr}</>}
          </div>
        </div>
      );
    }

    case 'gallery': {
      const images = block.images || [];
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {images.map((img, i) => (
              <div key={i} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: RADIUS.sm, overflow: 'hidden', border: `1px solid ${TK.border}` }}>
                <img src={mediaSrc(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => { deleteMedia(img); patch({ images: images.filter((_, idx) => idx !== i) }); }} style={{ position: 'absolute', top: 3, insetInlineEnd: 3, width: 16, height: 16, borderRadius: '50%', background: 'rgba(13,17,23,0.6)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} aria-label={L.remove}>
                  <X style={{ width: 9, height: 9, color: '#fff' }} />
                </button>
              </div>
            ))}
            <label className="au-upload-tile" style={{ aspectRatio: '4/3', borderRadius: RADIUS.sm, border: `1.5px dashed ${TK.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Upload style={{ width: 14, height: 14, color: TK.textLight }} />
              <input type="file" accept="image/*" multiple onChange={async (e) => {
                const files = Array.from(e.target.files); e.target.value = '';
                for (const file of files) {
                  const asset = await uploadMedia(file, uploadKey(`images-${Date.now()}-${Math.random().toString(36).slice(2)}`)).catch(() => null);
                  if (asset) patch({ images: [...(block.images || []), asset] });
                }
              }} style={{ display: 'none' }} />
            </label>
          </div>
          <Select value={block.layout || 'grid'} onChange={(e) => patch({ layout: e.target.value })} options={[{ value: 'grid', label: L.layoutGrid }, { value: 'carousel', label: L.layoutCarousel }]} style={{ maxWidth: 200 }} />
        </div>
      );
    }

    case 'quote': {
      const quoteEnField = <TextArea key="en" rows={2} value={block.text || ''} onChange={(e) => patch({ text: e.target.value })} placeholder={L.quoteEn} />;
      const quoteArField = <TextArea key="ar" rows={2} value={block.textAr || ''} onChange={(e) => patch({ textAr: e.target.value })} dir="rtl" placeholder={L.quoteAr} />;
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {isRTL ? <>{quoteArField}{quoteEnField}</> : <>{quoteEnField}{quoteArField}</>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <TextInput value={block.author || ''} onChange={(e) => patch({ author: e.target.value })} placeholder={L.authorOptional} dir={isRTL ? 'rtl' : 'ltr'} />
            <TextInput value={block.role || ''} onChange={(e) => patch({ role: e.target.value })} placeholder={L.roleOptional} dir={isRTL ? 'rtl' : 'ltr'} />
          </div>
        </div>
      );
    }

    case 'statRow': {
      const stats = block.stats || [];
      const updateStat = (i, f) => patch({ stats: stats.map((s, idx) => (idx === i ? { ...s, ...f } : s)) });
      return (
        <div className="space-y-2">
          {stats.map((s, i) => {
            const labelEnField = <TextInput key="en" value={s.label || ''} onChange={(e) => updateStat(i, { label: e.target.value })} placeholder={L.labelEn} containerStyle={{ flex: 1 }} />;
            const labelArField = <TextInput key="ar" value={s.labelAr || ''} onChange={(e) => updateStat(i, { labelAr: e.target.value })} dir="rtl" placeholder={L.labelAr} containerStyle={{ flex: 1 }} />;
            return (
              <div key={i} style={{ display: 'flex', gap: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <TextInput value={s.value || ''} onChange={(e) => updateStat(i, { value: e.target.value })} placeholder="+118%" containerStyle={{ width: 100, flexShrink: 0 }} dir="ltr" />
                {isRTL ? <>{labelArField}{labelEnField}</> : <>{labelEnField}{labelArField}</>}
                <IconButton icon={Trash2} variant="outline" onClick={() => patch({ stats: stats.filter((_, idx) => idx !== i) })} aria-label={L.removeStat} />
              </div>
            );
          })}
          <button onClick={() => patch({ stats: [...stats, { value: '', label: '' }] })} style={{ fontSize: 11.5, color: TK.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>{L.addStat}</button>
        </div>
      );
    }

    case 'beforeAfter': {
      const beforeChip = <ImageChip key="before" label={L.before} asset={block.before} pending={isPending(uploadKey('before'))} isRTL={isRTL} onUpload={async (file) => patch({ before: await uploadMedia(file, uploadKey('before')) })} onRemove={() => { deleteMedia(block.before); patch({ before: null }); }} />;
      const afterChip = <ImageChip key="after" label={L.after} asset={block.after} pending={isPending(uploadKey('after'))} isRTL={isRTL} onUpload={async (file) => patch({ after: await uploadMedia(file, uploadKey('after')) })} onRemove={() => { deleteMedia(block.after); patch({ after: null }); }} />;
      const beforeLabelField = <TextInput key="beforeLabel" value={block.beforeLabel || ''} onChange={(e) => patch({ beforeLabel: e.target.value })} placeholder={L.beforeLabel} dir={isRTL ? 'rtl' : 'ltr'} />;
      const afterLabelField = <TextInput key="afterLabel" value={block.afterLabel || ''} onChange={(e) => patch({ afterLabel: e.target.value })} placeholder={L.afterLabel} dir={isRTL ? 'rtl' : 'ltr'} />;
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3" style={{ maxWidth: 380 }}>
            {beforeChip}{afterChip}
          </div>
          <div className="grid grid-cols-2 gap-2" style={{ maxWidth: 380 }}>
            {beforeLabelField}{afterLabelField}
          </div>
        </div>
      );
    }

    case 'video':
      return (
        <div className="space-y-3">
          <div style={{ maxWidth: 220 }}>
            <ImageChip
              label={L.uploadVideo} asset={block.asset} kind="video" accept="video/mp4,video/webm,video/quicktime"
              pending={isPending(uploadKey('asset'))} isRTL={isRTL}
              onUpload={async (file) => patch({ asset: await uploadMedia(file, uploadKey('asset')) })}
              onRemove={() => { deleteMedia(block.asset); patch({ asset: null }); }}
            />
          </div>
          <p style={{ fontSize: 10.5, color: TK.textLight, textAlign: isRTL ? 'right' : 'left' }}>{L.or}</p>
          <TextInput value={block.embedUrl || ''} onChange={(e) => patch({ embedUrl: e.target.value })} placeholder={L.videoUrlPh} dir="ltr" />
        </div>
      );

    case 'embed':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <TextInput value={block.url || ''} onChange={(e) => patch({ url: e.target.value })} placeholder={L.embedUrlPh} dir="ltr" />
          <TextInput value={block.title || ''} onChange={(e) => patch({ title: e.target.value })} placeholder={L.embedTitlePh} dir={isRTL ? 'rtl' : 'ltr'} />
        </div>
      );

    case 'divider':
      return <p style={{ fontSize: 11.5, color: TK.textLight, fontStyle: 'italic', textAlign: isRTL ? 'right' : 'left' }}>{L.dividerNote}</p>;

    default:
      return null;
  }
};

/**
 * The block list — add/reorder/edit/remove. This is the flexible half of a
 * project's content (wireframes, before/after, embeds, ...) that a rigid
 * field-per-concept schema can't cover; see the doc comment on `blockSchema`
 * in server/models/PortfolioProject.js for the full rationale.
 *
 * `allowedTypes` optionally restricts which block types the "Add block" menu
 * offers — used by PortfolioQuickShowcase.jsx to reuse this exact editor
 * (same upload pipeline, same reorder/frame/caption UI, same public
 * BlockRenderer) for its ordered image/video media step, without offering
 * case-study-only block types (heading/paragraph/quote/statRow/beforeAfter/
 * embed) a Quick Showcase has no use for. Defaults to every type — the full
 * Case Study wizard's usage is unaffected.
 */
const BlocksEditor = ({ blocks, setBlocks, isRTL, uploadMedia, deleteMedia, pendingUploads, allowedTypes, intro }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const dragIdx = useRef(null);
  const dragOverIdx = useRef(null);
  const blockDefs = allowedTypes ? BLOCK_DEFS.filter((d) => allowedTypes.includes(d.type)) : BLOCK_DEFS;

  const L = {
    intro: intro || (isRTL
      ? 'محتوى مرن للتعمق في عملية التصميم — إطارات أولية، مقارنات قبل/بعد، عروض تجريبية مضمّنة. اختياري بالكامل؛ تخطَّ هذا القسم إذا كان تبويب القصة يغطي كل شيء.'
      : 'Flexible content for design process deep-dives — wireframes, before/after comparisons, embedded demos. Entirely optional; skip this if the Story tab already tells the whole story.'),
    removeBlock: isRTL ? 'إزالة الكتلة' : 'Remove block',
    addBlock: isRTL ? 'إضافة كتلة' : 'Add block',
  };

  const addBlock = (type) => { setBlocks([...blocks, NEW_BLOCK(type)]); setMenuOpen(false); };
  const patchBlock = (i, patch) => setBlocks(blocks.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  const removeBlock = (i) => setBlocks(blocks.filter((_, idx) => idx !== i));
  const handleDrop = () => {
    if (dragIdx.current === null || dragOverIdx.current === null || dragIdx.current === dragOverIdx.current) return;
    const next = [...blocks];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(dragOverIdx.current, 0, moved);
    setBlocks(next);
    dragIdx.current = null;
    dragOverIdx.current = null;
  };

  return (
    <div>
      <p style={{ fontSize: 13, color: TK.textMuted, marginBottom: 16, lineHeight: 1.6, textAlign: isRTL ? 'right' : 'left' }}>
        {L.intro}
      </p>

      <div className="space-y-3">
        {blocks.map((block, i) => {
          const def = DEF_BY_TYPE[block.type];
          return (
            <div
              key={i}
              draggable
              onDragStart={() => { dragIdx.current = i; }}
              onDragEnter={() => { dragOverIdx.current = i; }}
              onDragEnd={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              style={{ borderRadius: RADIUS.lg, border: `1px solid ${TK.border}`, background: TK.surface, overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: TK.bgSubtle, borderBottom: `1px solid ${TK.border}`, cursor: 'grab', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <GripVertical style={{ width: 14, height: 14, color: TK.textLight, flexShrink: 0 }} />
                {def?.Icon && <def.Icon style={{ width: 13, height: 13, color: TK.accent, flexShrink: 0 }} />}
                <span style={{ fontSize: 11.5, fontWeight: 600, color: TK.textMuted, flex: 1, textAlign: isRTL ? 'right' : 'left' }}>{def ? (isRTL ? def.ar : def.en) : block.type}</span>
                <IconButton icon={Trash2} variant="ghost" size={26} onClick={() => removeBlock(i)} aria-label={L.removeBlock} />
              </div>
              <div style={{ padding: 14 }} dir={isRTL ? 'rtl' : 'ltr'}>
                <BlockBody
                  block={block}
                  patch={(p) => patchBlock(i, p)}
                  uploadKey={(field) => `block-${i}-${field}`}
                  uploadMedia={uploadMedia}
                  deleteMedia={deleteMedia}
                  pendingUploads={pendingUploads}
                  isRTL={isRTL}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ position: 'relative', marginTop: 14 }}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: TK.accent, background: TK.accentBg, border: 'none', borderRadius: RADIUS.md, padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit', flexDirection: isRTL ? 'row-reverse' : 'row' }}
        >
          <Plus style={{ width: 14, height: 14 }} /> {L.addBlock}
        </button>
        {menuOpen && (
          <div style={{ position: 'absolute', top: '110%', insetInlineStart: 0, zIndex: 20, background: '#fff', border: `1px solid ${TK.border}`, borderRadius: RADIUS.lg, boxShadow: '0 12px 32px rgba(0,0,0,0.12)', padding: 6, minWidth: 200 }}>
            {blockDefs.map((def) => {
              const DefIcon = def.Icon;
              return (
                <button
                  key={def.type} onClick={() => addBlock(def.type)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 10px', background: 'none', border: 'none', borderRadius: RADIUS.sm, cursor: 'pointer', fontSize: 12.5, color: TK.text, fontFamily: 'inherit', textAlign: isRTL ? 'right' : 'left', flexDirection: isRTL ? 'row-reverse' : 'row' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = TK.bgSubtle; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                >
                  <DefIcon style={{ width: 14, height: 14, color: TK.textMuted }} /> {isRTL ? def.ar : def.en}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlocksEditor;
