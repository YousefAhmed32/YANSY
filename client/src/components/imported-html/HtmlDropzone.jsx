import { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileCode2, X, RefreshCw } from 'lucide-react';
import { TK, RADIUS } from '../../admin-ui';

const formatBytes = (bytes) => {
  if (!bytes) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
};

const iconBtnStyle = { width: 28, height: 28, borderRadius: RADIUS.sm, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };

/**
 * Premium drag-and-drop HTML uploader. Purely a file-picking + progress UI
 * — the actual upload request (and its progress reporting) is owned by the
 * caller via `onUpload(file, onProgress) => Promise`, so this same
 * component drives both the "Import HTML Proposal" flow and "Replace
 * HTML" on an existing one.
 */
const HtmlDropzone = ({ onUpload, isRTL, disabled }) => {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const T = {
    dropHere: isRTL ? 'اسحب ملف الـ HTML هنا' : 'Drop your HTML file here',
    orChoose: isRTL ? 'أو اختر ملفًا من جهازك' : 'or choose a file from your device',
    accept: isRTL ? 'يقبل ملفات .html أو .htm فقط' : 'Accepts .html or .htm files only',
    invalidType: isRTL ? 'يُسمح فقط بملفات .html أو .htm' : 'Only .html or .htm files are accepted',
    remove: isRTL ? 'إزالة' : 'Remove',
    replace: isRTL ? 'استبدال الملف' : 'Replace file',
    uploading: isRTL ? 'جارٍ الرفع...' : 'Uploading...',
  };

  const validateAndUpload = useCallback((f) => {
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['html', 'htm'].includes(ext)) {
      setError(T.invalidType);
      return;
    }
    setError('');
    setFile(f);
    setUploading(true);
    setProgress(0);
    onUpload(f, (pct) => setProgress(pct))
      .catch((err) => setError(err?.response?.data?.error || err.message))
      .finally(() => setUploading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onUpload]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    validateAndUpload(e.dataTransfer.files?.[0]);
  };

  const reset = () => { setFile(null); setProgress(0); setError(''); if (inputRef.current) inputRef.current.value = ''; };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) inputRef.current?.click(); }}
        aria-disabled={disabled}
        style={{
          border: `2px dashed ${dragOver ? TK.accent : TK.border}`,
          borderRadius: RADIUS.xl,
          background: dragOver ? TK.accentBg : TK.bgSubtle,
          padding: '48px 24px',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'border-color .18s ease, background .18s ease',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".html,.htm,text/html"
          hidden
          disabled={disabled}
          onChange={(e) => validateAndUpload(e.target.files?.[0])}
        />
        <div style={{
          width: 52, height: 52, borderRadius: '50%', margin: '0 auto 16px',
          background: TK.accentBg, border: `1px solid ${TK.accentBd}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <UploadCloud size={22} color={TK.accent} />
        </div>
        <p style={{ fontSize: 15, fontWeight: 700, color: TK.text, margin: 0 }}>{T.dropHere}</p>
        <p style={{ fontSize: 13, color: TK.accent, margin: '6px 0 0', fontWeight: 600 }}>{T.orChoose}</p>
        <p style={{ fontSize: 11, color: TK.textLight, marginTop: 10 }}>{T.accept}</p>
      </div>

      {error && <p style={{ color: '#DC2626', fontSize: 12.5, marginTop: 10 }}>{error}</p>}

      {file && (
        <div style={{ marginTop: 14, border: `1px solid ${TK.border}`, borderRadius: RADIUS.lg, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: RADIUS.md, background: TK.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileCode2 size={17} color={TK.accent} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: TK.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
            <p style={{ fontSize: 11, color: TK.textLight, margin: '2px 0 0' }}>
              {uploading ? `${T.uploading} ${progress}%` : formatBytes(file.size)}
            </p>
            {uploading && (
              <div style={{ height: 4, background: TK.border, borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: TK.accent, transition: 'width .2s' }} />
              </div>
            )}
          </div>
          {!uploading && (
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <button type="button" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }} title={T.replace} style={iconBtnStyle}>
                <RefreshCw size={14} color={TK.textMuted} />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); reset(); }} title={T.remove} style={iconBtnStyle}>
                <X size={14} color={TK.textMuted} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HtmlDropzone;
