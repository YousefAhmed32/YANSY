import { useRef } from 'react';
import { Upload, X, GripVertical } from 'lucide-react';
import { TK, RADIUS, SHADOW, Spinner } from '../../admin-ui';
import { mediaSrc } from '../../utils/media';

/**
 * Gallery — every image feeds the public page's uncapped filmstrip (see
 * Gallery.jsx on the public side), so there's no upload limit here either.
 * Reorder is plain HTML5 drag-and-drop, matching the pattern already used
 * for project reordering in AdminPortfolio.jsx — no new DnD dependency.
 */
const MediaSection = ({ gallery, setGallery, isRTL, uploadMedia, deleteMedia, pendingUploads }) => {
  const inputRef = useRef(null);
  const dragIdx = useRef(null);
  const dragOverIdx = useRef(null);

  const L = {
    intro: isRTL ? 'اسحب البلاطات لإعادة الترتيب. كل صورة هنا تظهر في شريط الصور العام بهذا الترتيب.' : 'Drag tiles to reorder. Every image here appears in the public gallery filmstrip, in this order.',
    remove: isRTL ? 'إزالة' : 'Remove',
    addImages: isRTL ? 'إضافة صور' : 'Add images',
  };

  const handleSelect = async (e) => {
    const files = Array.from(e.target.files).slice(0, 40);
    e.target.value = '';
    await Promise.all(files.map(async (file) => {
      const key = `gallery-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const asset = await uploadMedia(file, key).catch(() => null);
      if (asset) setGallery((g) => [...g, asset]);
    }));
  };

  const removeImage = (idx) => {
    deleteMedia(gallery[idx]);
    setGallery((g) => g.filter((_, i) => i !== idx));
  };

  const handleDrop = () => {
    if (dragIdx.current === null || dragOverIdx.current === null || dragIdx.current === dragOverIdx.current) return;
    setGallery((g) => {
      const next = [...g];
      const [moved] = next.splice(dragIdx.current, 1);
      next.splice(dragOverIdx.current, 0, moved);
      return next;
    });
    dragIdx.current = null;
    dragOverIdx.current = null;
  };

  return (
    <div>
      <p style={{ fontSize: 13, color: TK.textMuted, marginBottom: 16, lineHeight: 1.6, textAlign: isRTL ? 'right' : 'left' }}>
        {L.intro}
      </p>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
        {gallery.map((img, i) => (
          <div
            key={img.publicId || i}
            draggable
            onDragStart={() => { dragIdx.current = i; }}
            onDragEnter={() => { dragOverIdx.current = i; }}
            onDragEnd={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="group relative"
            style={{ aspectRatio: '16/9', borderRadius: RADIUS.md, overflow: 'hidden', background: TK.bgSubtle, border: `1px solid ${TK.border}`, cursor: 'grab' }}
          >
            <img src={mediaSrc(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ position: 'absolute', top: 5, insetInlineStart: 5, width: 18, height: 18, borderRadius: RADIUS.sm, background: 'rgba(13,17,23,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GripVertical style={{ width: 12, height: 12, color: '#fff' }} />
            </div>
            <button
              onClick={() => removeImage(i)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ position: 'absolute', top: 5, insetInlineEnd: 5, width: 20, height: 20, borderRadius: RADIUS.pill, background: 'rgba(255,255,255,0.95)', border: `1px solid ${TK.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: SHADOW.xs, cursor: 'pointer' }}
              aria-label={L.remove}
            >
              <X style={{ width: 11, height: 11, color: TK.textMuted }} />
            </button>
          </div>
        ))}
        {pendingUploads.filter((u) => u.key.startsWith('gallery-')).map((u) => (
          <div key={u.key} style={{ aspectRatio: '16/9', borderRadius: RADIUS.md, background: TK.bgSubtle, border: `1px solid ${TK.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spinner size={18} />
          </div>
        ))}
      </div>

      <label className="au-upload-tile" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: RADIUS.md, border: `1.5px dashed ${TK.border}`, cursor: 'pointer', fontSize: 12, color: TK.textMuted, fontWeight: 500, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <Upload style={{ width: 14, height: 14 }} /> {L.addImages}
        <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleSelect} style={{ display: 'none' }} />
      </label>
    </div>
  );
};

export default MediaSection;
