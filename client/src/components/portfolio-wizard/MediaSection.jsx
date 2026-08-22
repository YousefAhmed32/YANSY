import { useRef, useState, useEffect, useCallback } from 'react';
import { Upload, X, GripVertical, Library, Check, Play, ChevronLeft, ChevronRight, AlertCircle, RotateCw } from 'lucide-react';
import api from '../../utils/api';
import { TK, RADIUS, SHADOW, Spinner, SearchInput } from '../../admin-ui';
import { mediaSrc, assetFromMediaLibraryItem } from '../../utils/media';

// Generous, explicit cap — not a low limit that fights a real project with
// 17+ screenshots (the concrete case this was built for). If a project ever
// needs more than this, that's a sign to reconsider the workflow, not to
// silently truncate a selection.
const MAX_FILES_PER_SELECTION = 60;

/**
 * Ordered image/video gallery — reused as-is by both the full Case Study
 * wizard's "Gallery" section and PortfolioQuickShowcase's "Project
 * Screenshots" section (same upload pipeline, same reorder/browse-library
 * UI, one shared primitive rather than two one-off galleries — see the
 * Portfolio redesign brief).
 *
 * Every image/video feeds the public page's uncapped filmstrip (see
 * Gallery.jsx on the public side). Reorder works two ways: drag-and-drop
 * AND explicit move-left/move-right buttons that appear on focus/hover —
 * drag-and-drop alone excludes keyboard users, so this isn't optional.
 *
 * Each in-flight upload is tracked locally (`queue`) so a failure surfaces
 * as a per-tile error with its own Retry button instead of a single global
 * toast that gives no way to recover a specific file.
 *
 * "Browse Library" reuses an already-uploaded asset from the Media Library
 * (server/models/Media.js) instead of re-uploading — see the CMS
 * normalization plan. Browses image+video together.
 */
const MediaSection = ({ gallery, setGallery, isRTL, uploadMedia, deleteMedia, pendingUploads }) => {
  const inputRef = useRef(null);
  const dragIdx = useRef(null);
  const dragOverIdx = useRef(null);
  const [mode, setMode] = useState('upload');
  const [libraryItems, setLibraryItems] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');
  const [queue, setQueue] = useState([]); // [{ key, file, name, error }] — local retry/error tracking
  const [dropActive, setDropActive] = useState(false);

  const L = {
    intro: isRTL ? 'اسحب البلاطات أو استخدم أزرار النقل لإعادة الترتيب. كل صورة أو فيديو هنا يظهر في شريط المعرض العام بهذا الترتيب.' : 'Drag tiles or use the move buttons to reorder. Every image or video here appears in the public gallery filmstrip, in this order.',
    remove: isRTL ? 'إزالة' : 'Remove',
    addImages: isRTL ? 'إضافة صور أو فيديو' : 'Add images or video',
    dropHint: isRTL ? 'أو اسحب الملفات وأفلتها هنا' : 'or drag and drop files here',
    upload: isRTL ? 'رفع جديد' : 'Upload New',
    browse: isRTL ? 'تصفح المكتبة' : 'Browse Library',
    empty: isRTL ? 'لا توجد عناصر في المكتبة بعد' : 'No items in the library yet',
    added: isRTL ? 'مضافة' : 'Added',
    retry: isRTL ? 'إعادة المحاولة' : 'Retry',
    uploadFailed: isRTL ? 'فشل الرفع' : 'Upload failed',
    moveEarlier: isRTL ? 'نقل للخلف' : 'Move earlier',
    moveLater: isRTL ? 'نقل للأمام' : 'Move later',
    count: (n) => isRTL ? `${n} ${n === 1 ? 'صورة' : 'صور'}` : `${n} image${n === 1 ? '' : 's'}`,
  };

  const galleryIds = new Set(gallery.map((g) => g.publicId).filter(Boolean));

  const fetchLibrary = useCallback(async () => {
    setLibraryLoading(true);
    try {
      const { data } = await api.get('/media-library', { params: { type: 'image,video', q: librarySearch.trim() || undefined, limit: 100 } });
      setLibraryItems(data.items || []);
    } catch {
      // non-critical — browse tab just shows empty
    } finally {
      setLibraryLoading(false);
    }
  }, [librarySearch]);
  useEffect(() => { if (mode === 'browse') fetchLibrary(); }, [mode, fetchLibrary]);

  const startUpload = useCallback((file) => {
    const key = `gallery-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setQueue((q) => [...q, { key, file, name: file.name, error: false }]);
    uploadMedia(file, key).then((asset) => {
      if (asset) {
        setGallery((g) => [...g, asset]);
        setQueue((q) => q.filter((it) => it.key !== key));
      } else {
        setQueue((q) => q.map((it) => (it.key === key ? { ...it, error: true } : it)));
      }
    });
  }, [uploadMedia, setGallery]);

  const handleFiles = useCallback((fileList) => {
    const files = Array.from(fileList).slice(0, Math.max(0, MAX_FILES_PER_SELECTION - gallery.length - queue.length));
    files.forEach(startUpload);
  }, [gallery.length, queue.length, startUpload]);

  const handleSelect = (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const retryUpload = (item) => {
    setQueue((q) => q.filter((it) => it.key !== item.key));
    startUpload(item.file);
  };
  const dismissFailed = (item) => setQueue((q) => q.filter((it) => it.key !== item.key));

  const addFromLibrary = (item) => setGallery((g) => [...g, assetFromMediaLibraryItem(item)]);

  const removeImage = (idx) => {
    deleteMedia(gallery[idx]);
    setGallery((g) => g.filter((_, i) => i !== idx));
  };

  const moveTo = (from, to) => {
    if (to < 0 || to >= gallery.length || from === to) return;
    setGallery((g) => {
      const next = [...g];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const handleDrop = () => {
    if (dragIdx.current === null || dragOverIdx.current === null || dragIdx.current === dragOverIdx.current) return;
    moveTo(dragIdx.current, dragOverIdx.current);
    dragIdx.current = null;
    dragOverIdx.current = null;
  };

  const onDropFiles = (e) => {
    e.preventDefault();
    setDropActive(false);
    if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDropActive(true); }}
      onDragLeave={() => setDropActive(false)}
      onDrop={onDropFiles}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <p style={{ fontSize: 13, color: TK.textMuted, lineHeight: 1.6, margin: 0, textAlign: isRTL ? 'right' : 'left' }}>
          {L.intro}
        </p>
        {gallery.length > 0 && (
          <span style={{ fontSize: 11, fontWeight: 600, color: TK.textLight, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {L.count(gallery.length)}
          </span>
        )}
      </div>

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
            role="group"
            aria-label={isRTL ? `عنصر ${i + 1} من ${gallery.length}` : `Item ${i + 1} of ${gallery.length}`}
            style={{ aspectRatio: '16/9', borderRadius: RADIUS.md, overflow: 'hidden', background: TK.bgSubtle, border: `1px solid ${TK.border}`, cursor: 'grab' }}
          >
            {img.kind === 'video' ? (
              <video src={mediaSrc(img)} muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onMouseEnter={(e) => e.currentTarget.play().catch(() => {})} onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }} />
            ) : (
              <img src={mediaSrc(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            )}
            {img.kind === 'video' && (
              <div aria-hidden style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(13,17,23,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Play style={{ width: 12, height: 12, color: '#fff', marginInlineStart: 1 }} fill="#fff" />
                </span>
              </div>
            )}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ position: 'absolute', top: 5, insetInlineStart: 5, width: 18, height: 18, borderRadius: RADIUS.sm, background: 'rgba(13,17,23,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <GripVertical style={{ width: 12, height: 12, color: '#fff' }} />
            </div>
            <button
              onClick={() => removeImage(i)}
              className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity au-focus-ring"
              style={{ position: 'absolute', top: 5, insetInlineEnd: 5, width: 20, height: 20, borderRadius: RADIUS.pill, background: 'rgba(255,255,255,0.95)', border: `1px solid ${TK.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: SHADOW.xs, cursor: 'pointer' }}
              aria-label={`${L.remove} — ${i + 1}`}
            >
              <X style={{ width: 11, height: 11, color: TK.textMuted }} />
            </button>

            {/* Keyboard-accessible reorder — a drag handle alone excludes
                keyboard users, so every tile also gets explicit move
                controls that appear on hover/focus. */}
            <div
              className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
              style={{ position: 'absolute', bottom: 5, insetInlineStart: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 3 }}
            >
              <button
                onClick={() => moveTo(i, i - 1)}
                disabled={i === 0}
                className="au-focus-ring"
                style={{ width: 20, height: 20, borderRadius: RADIUS.pill, background: 'rgba(13,17,23,0.6)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.35 : 1 }}
                aria-label={L.moveEarlier}
              >
                {isRTL ? <ChevronRight style={{ width: 11, height: 11, color: '#fff' }} /> : <ChevronLeft style={{ width: 11, height: 11, color: '#fff' }} />}
              </button>
              <button
                onClick={() => moveTo(i, i + 1)}
                disabled={i === gallery.length - 1}
                className="au-focus-ring"
                style={{ width: 20, height: 20, borderRadius: RADIUS.pill, background: 'rgba(13,17,23,0.6)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: i === gallery.length - 1 ? 'default' : 'pointer', opacity: i === gallery.length - 1 ? 0.35 : 1 }}
                aria-label={L.moveLater}
              >
                {isRTL ? <ChevronLeft style={{ width: 11, height: 11, color: '#fff' }} /> : <ChevronRight style={{ width: 11, height: 11, color: '#fff' }} />}
              </button>
            </div>
          </div>
        ))}

        {queue.map((item) => {
          const upload = pendingUploads.find((u) => u.key === item.key);
          return (
            <div key={item.key} style={{ position: 'relative', aspectRatio: '16/9', borderRadius: RADIUS.md, overflow: 'hidden', background: TK.bgSubtle, border: `1px solid ${item.error ? TK.redBd : TK.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8 }}>
              {item.error ? (
                <>
                  <AlertCircle style={{ width: 16, height: 16, color: TK.red }} />
                  <span style={{ fontSize: 9.5, color: TK.red, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{L.uploadFailed}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => retryUpload(item)} className="au-focus-ring" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9.5, fontWeight: 600, color: TK.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                      <RotateCw style={{ width: 9, height: 9 }} /> {L.retry}
                    </button>
                    <button onClick={() => dismissFailed(item)} aria-label={L.remove} className="au-focus-ring" style={{ fontSize: 9.5, color: TK.textLight, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                      <X style={{ width: 10, height: 10 }} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Spinner size={18} />
                  {upload?.progress > 0 && (
                    <div style={{ width: '80%', height: 3, borderRadius: 2, background: TK.border, overflow: 'hidden' }}>
                      <div style={{ width: `${upload.progress}%`, height: '100%', background: TK.accent, transition: 'width 0.2s' }} />
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <button
          type="button"
          onClick={() => setMode('upload')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: RADIUS.pill, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', background: mode === 'upload' ? TK.accentBg : 'transparent', border: `1px solid ${mode === 'upload' ? TK.accentBd : TK.border}`, color: mode === 'upload' ? TK.accent : TK.textMuted }}
        >
          <Upload style={{ width: 12, height: 12 }} /> {L.upload}
        </button>
        <button
          type="button"
          onClick={() => setMode('browse')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: RADIUS.pill, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', background: mode === 'browse' ? TK.accentBg : 'transparent', border: `1px solid ${mode === 'browse' ? TK.accentBd : TK.border}`, color: mode === 'browse' ? TK.accent : TK.textMuted }}
        >
          <Library style={{ width: 12, height: 12 }} /> {L.browse}
        </button>
      </div>

      {mode === 'upload' ? (
        <label
          className="au-upload-tile"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            padding: '18px 16px', borderRadius: RADIUS.md, border: `1.5px dashed ${dropActive ? TK.accent : TK.border}`,
            background: dropActive ? TK.accentBg : 'transparent', cursor: 'pointer', textAlign: 'center',
          }}
        >
          <Upload style={{ width: 16, height: 16, color: dropActive ? TK.accent : TK.textLight }} />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: TK.textMuted }}>{L.addImages}</span>
          <span style={{ fontSize: 11, color: TK.textLight }}>{L.dropHint}</span>
          <input ref={inputRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple onChange={handleSelect} style={{ display: 'none' }} />
        </label>
      ) : (
        <div>
          <SearchInput value={librarySearch} onChange={(e) => setLibrarySearch(e.target.value)} onClear={() => setLibrarySearch('')} style={{ marginBottom: 10, maxWidth: 320 }} />
          {libraryLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner size={20} /></div>
          ) : libraryItems.length === 0 ? (
            <p style={{ fontSize: 12, color: TK.textLight, padding: '12px 0' }}>{L.empty}</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {libraryItems.map((item) => {
                const added = galleryIds.has(item.publicId);
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => !added && addFromLibrary(item)}
                    disabled={added}
                    style={{ position: 'relative', aspectRatio: '1', borderRadius: RADIUS.md, overflow: 'hidden', border: `1px solid ${TK.border}`, cursor: added ? 'default' : 'pointer', padding: 0, background: TK.bgSubtle }}
                  >
                    {item.type === 'video' ? (
                      <video src={item.url} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <img src={item.url} alt={item.alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                    {item.type === 'video' && !added && (
                      <div aria-hidden style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                        <Play style={{ width: 14, height: 14, color: '#fff' }} fill="#fff" />
                      </div>
                    )}
                    {added && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(37,99,235,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check style={{ width: 18, height: 18, color: '#fff' }} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaSection;
