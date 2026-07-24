import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { TK, RADIUS, SHADOW } from './tokens';
import { Button } from './Primitives';
import { useLanguage } from '../contexts/LanguageContext';

const useEscClose = (open, onClose) => {
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);
};

export const Modal = ({ open, onClose, title, children, footer, width = '480px' }) => {
  useEscClose(open, onClose);
  const { isRTL } = useLanguage();
  if (!open) return null;
  return createPortal(
    <div
      role="dialog" aria-modal="true"
      style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
    >
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(13,17,23,0.4)', backdropFilter: 'blur(4px)', animation: 'au-fadeIn 0.15s ease' }} />
      <div
        onClick={e => e.stopPropagation()}
        dir={isRTL ? 'rtl' : 'ltr'}
        style={{
          position: 'relative', width, maxWidth: '100%', maxHeight: '86vh', overflowY: 'auto',
          background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: RADIUS.xl,
          boxShadow: SHADOW.lg, animation: 'au-popIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        className="au-scroll"
      >
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `1px solid ${TK.border}` }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: TK.text, margin: 0 }}>{title}</h3>
            <button onClick={onClose} aria-label={isRTL ? 'إغلاق' : 'Close'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TK.textMuted, display: 'flex' }}>
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}
        <div style={{ padding: '20px' }}>{children}</div>
        {footer && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '14px 20px', borderTop: `1px solid ${TK.border}` }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

/**
 * title/description/confirmLabel/cancelLabel should almost always be passed
 * explicitly (translated by the caller) — the defaults below are only a
 * bilingual safety net for the common "delete" case, never raw English.
 */
export const ConfirmDialog = ({ open, onClose, onConfirm, title, description, confirmLabel, cancelLabel, danger = true, loading = false }) => {
  const { isRTL } = useLanguage();
  const resolvedTitle   = title   ?? (isRTL ? 'هل أنت متأكد؟' : 'Are you sure?');
  const resolvedConfirm = confirmLabel ?? (isRTL ? 'حذف' : 'Delete');
  const resolvedCancel  = cancelLabel  ?? (isRTL ? 'إلغاء' : 'Cancel');
  return (
    <Modal open={open} onClose={onClose} width="380px">
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '46px', height: '46px', borderRadius: '50%', margin: '0 auto 16px',
          background: danger ? TK.redBg : TK.accentBg, border: `1px solid ${danger ? TK.redBd : TK.accentBd}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {danger ? <Trash2 style={{ width: '19px', height: '19px', color: TK.red }} /> : <AlertTriangle style={{ width: '19px', height: '19px', color: TK.accent }} />}
        </div>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: TK.text, margin: '0 0 8px' }}>{resolvedTitle}</h3>
        {description && <p style={{ fontSize: '12.5px', color: TK.textMuted, lineHeight: 1.6, margin: '0 0 20px' }}>{description}</p>}
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" style={{ flex: 1 }} onClick={onClose}>{resolvedCancel}</Button>
          <Button variant={danger ? 'danger' : 'primary'} style={{ flex: 1 }} onClick={onConfirm} loading={loading}>{resolvedConfirm}</Button>
        </div>
      </div>
    </Modal>
  );
};

export const Drawer = ({ open, onClose, title, children, width = '440px', side = 'right' }) => {
  useEscClose(open, onClose);
  const { isRTL } = useLanguage();
  if (!open) return null;
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} role="dialog" aria-modal="true">
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(13,17,23,0.35)', backdropFilter: 'blur(3px)', animation: 'au-fadeIn 0.18s ease' }} />
      <div
        onClick={e => e.stopPropagation()}
        dir={isRTL ? 'rtl' : 'ltr'}
        style={{
          position: 'absolute', top: 0, bottom: 0, [side]: 0, width, maxWidth: '92vw',
          background: TK.surface, borderLeft: side === 'right' ? `1px solid ${TK.border}` : 'none',
          borderRight: side === 'left' ? `1px solid ${TK.border}` : 'none',
          boxShadow: SHADOW.lg, display: 'flex', flexDirection: 'column',
          animation: `au-slideIn${side === 'right' ? 'Right' : 'Left'} 0.24s cubic-bezier(0.4,0,0.2,1)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `1px solid ${TK.border}`, flexShrink: 0 }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: TK.text, margin: 0 }}>{title}</h3>
          <button onClick={onClose} aria-label={isRTL ? 'إغلاق' : 'Close'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TK.textMuted, display: 'flex' }}>
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
        <div className="au-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>{children}</div>
      </div>
    </div>,
    document.body
  );
};
