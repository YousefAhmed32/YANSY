import { useRef, useState } from 'react';
import { Upload, X, ImageIcon, AlertCircle, RefreshCw } from 'lucide-react';
import { TK, RADIUS, MOTION } from './tokens';
import { Spinner } from './Primitives';
import api from '../utils/api';
import { assetFromMediaLibraryItem, mediaSrc } from '../utils/media';

const DEFAULT_ACCEPT = 'image/png,image/jpeg,image/jpg,image/webp,image/svg+xml';
const DEFAULT_MAX_MB = 8;

/**
 * Single reusable upload widget for every avatar/logo field in the admin
 * (Client logo, TeamMember/Testimonial avatar, and RelationPicker's
 * quick-create — see its 'image' quickCreateFields type). Wraps the same
 * catalog-backed endpoint AdminLibrary.jsx already used for avatars
 * (POST /media-library/upload — sha256-deduped, reused across entries, and
 * reference-counted server-side by mediaCatalog.service.js so replacing or
 * removing never orphans a blob) instead of a bespoke upload per call site.
 *
 * `shape`/`fit` default to what a face photo needs (circle + cover); pass
 * shape="square" fit="contain" for brand logos, which are usually wordmarks
 * or non-square marks that circular-cropping/cover-fitting would mangle.
 */
export const MediaUploadField = ({
  value,
  onChange,
  isRTL = false,
  size = 88,
  shape = 'circle',        // 'circle' | 'square'
  fit = 'cover',            // 'cover' | 'contain'
  accept = DEFAULT_ACCEPT,
  maxSizeMB = DEFAULT_MAX_MB,
  disabled = false,
  hint,
  onUploadingChange,        // (bool) => void — lets a parent modal block closing mid-upload
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const T = {
    // Generic wording — the field's own <label> above this component (e.g.
    // "Logo" or "Photo") already says what's being uploaded, so this button
    // doesn't need to repeat it and stays correct for every caller (Client
    // logo, TeamMember/Testimonial photo, ...).
    upload: isRTL ? 'رفع صورة' : 'Upload image',
    replace: isRTL ? 'استبدال' : 'Replace',
    remove: isRTL ? 'إزالة' : 'Remove',
    dropHint: isRTL ? 'اسحب وأفلت أو انقر للرفع' : 'Drag & drop or click to upload',
    formats: isRTL ? `PNG، JPG، WEBP، أو SVG — حتى ${maxSizeMB}MB` : `PNG, JPG, WEBP, or SVG — up to ${maxSizeMB}MB`,
    invalidType: isRTL ? 'نوع الملف غير مدعوم. استخدم PNG أو JPG أو WEBP أو SVG.' : 'Unsupported file type. Use PNG, JPG, WEBP, or SVG.',
    tooLarge: isRTL ? `الحد الأقصى لحجم الملف ${maxSizeMB}MB` : `File must be under ${maxSizeMB}MB`,
    uploadFailed: isRTL ? 'فشل الرفع' : 'Upload failed',
  };

  const ACCEPT_RE = /^image\/(png|jpe?g|webp|svg\+xml)$/;

  const doUpload = async (file) => {
    if (!file || disabled) return;
    if (!ACCEPT_RE.test(file.type)) return setError(T.invalidType);
    if (file.size > maxSizeMB * 1024 * 1024) return setError(T.tooLarge);

    setError('');
    setUploading(true);
    onUploadingChange?.(true);
    setProgress(0);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const { data } = await api.post('/media-library/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(e.total ? Math.round((e.loaded / e.total) * 100) : 0),
      });
      onChange(assetFromMediaLibraryItem(data.item));
    } catch (err) {
      setError(err?.response?.data?.error || T.uploadFailed);
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  const pick = () => !disabled && !uploading && inputRef.current?.click();
  const onFileChange = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    doUpload(file);
  };
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    doUpload(e.dataTransfer.files?.[0]);
  };

  const radius = shape === 'circle' ? '50%' : RADIUS.lg;
  const src = mediaSrc(value);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={T.upload}
          onClick={pick}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pick())}
          onDragOver={(e) => { e.preventDefault(); if (!disabled && !uploading) setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          style={{
            width: `${size}px`, height: `${size}px`, borderRadius: radius, flexShrink: 0, position: 'relative', overflow: 'hidden',
            background: fit === 'contain' ? TK.surface : TK.bgSubtle,
            border: `1.5px ${src ? 'solid' : 'dashed'} ${dragOver ? TK.accent : TK.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer',
            transition: `border-color ${MOTION.fast} ${MOTION.ease}`,
            opacity: disabled ? 0.6 : 1,
          }}
        >
          {src ? (
            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: fit, padding: fit === 'contain' ? '10%' : 0, boxSizing: 'border-box' }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: dragOver ? TK.accent : TK.textLight }}>
              <ImageIcon style={{ width: Math.round(size * 0.26), height: Math.round(size * 0.26) }} />
            </div>
          )}

          {uploading && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.9)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}>
              <Spinner size={Math.round(size * 0.28)} />
              <span style={{ fontSize: '9.5px', fontWeight: 600, color: TK.accent }}>{progress}%</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={pick}
              disabled={disabled || uploading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '8px 14px',
                border: `1px solid ${TK.border}`, borderRadius: RADIUS.md, background: TK.surface,
                cursor: disabled || uploading ? 'default' : 'pointer', fontSize: '12px', fontWeight: 500, color: TK.text,
                opacity: disabled || uploading ? 0.6 : 1,
              }}
            >
              {src ? <RefreshCw style={{ width: 13, height: 13 }} /> : <Upload style={{ width: 13, height: 13 }} />}
              {src ? T.replace : T.upload}
            </button>
            {src && !disabled && (
              <button
                type="button"
                onClick={() => { setError(''); onChange(null); }}
                disabled={uploading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px',
                  border: `1px solid ${TK.redBd}`, borderRadius: RADIUS.md, background: TK.redBg,
                  cursor: uploading ? 'default' : 'pointer', fontSize: '12px', fontWeight: 500, color: TK.red,
                }}
              >
                <X style={{ width: 13, height: 13 }} />
                {T.remove}
              </button>
            )}
          </div>
          <p style={{ fontSize: '11px', color: TK.textLight, margin: 0, lineHeight: 1.5 }}>{hint || T.dropHint}</p>
          <p style={{ fontSize: '10.5px', color: TK.textLight, margin: 0 }}>{T.formats}</p>
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', color: TK.red, fontSize: '11.5px' }}>
          <AlertCircle style={{ width: 13, height: 13, flexShrink: 0 }} />
          {error}
        </div>
      )}

      <input ref={inputRef} type="file" accept={accept} onChange={onFileChange} style={{ display: 'none' }} disabled={disabled} />
    </div>
  );
};

export default MediaUploadField;
