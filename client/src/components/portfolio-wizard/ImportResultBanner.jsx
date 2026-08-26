import { CheckCircle2, RotateCcw, X } from 'lucide-react';
import { TK, RADIUS, Button } from '../../admin-ui';

const ImportResultBanner = ({ result, isRTL, onUndo, onDismiss }) => {
  if (!result) return null;
  return (
    <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, padding: '11px 12px', borderRadius: RADIUS.md, background: TK.greenBg, border: `1px solid ${TK.greenBd}`, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
      <CheckCircle2 aria-hidden style={{ width: 16, height: 16, color: TK.green, flexShrink: 0 }} />
      <p style={{ flex: 1, margin: 0, fontSize: 12, color: TK.text, textAlign: isRTL ? 'right' : 'left' }}>
        {isRTL
          ? `تم استيراد ${result.counts.ready} حقلًا وتجاهل ${result.counts.skipped}. راجع البيانات قبل النشر.`
          : `${result.counts.ready} fields imported and ${result.counts.skipped} skipped. Review the data before publishing.`}
      </p>
      <Button variant="secondary" size="sm" icon={RotateCcw} onClick={onUndo}>{isRTL ? 'تراجع' : 'Undo'}</Button>
      <button type="button" onClick={onDismiss} aria-label={isRTL ? 'إخفاء الملخص' : 'Dismiss summary'} className="au-icon-btn" style={{ width: 30, height: 30, border: 'none', background: 'transparent', color: TK.textMuted, cursor: 'pointer' }}>
        <X aria-hidden style={{ width: 14, height: 14 }} />
      </button>
    </div>
  );
};

export default ImportResultBanner;
