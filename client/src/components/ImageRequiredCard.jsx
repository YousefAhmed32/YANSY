import { ImageIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * Visible placeholder for a missing image asset — renders in place of the real
 * photo so the page never blocks on missing art, while making it obvious to
 * whoever is reviewing the live site exactly what to generate/shoot and where
 * to drop the final file. Swap out by replacing the <img> at `filename`.
 */
const ImageRequiredCard = ({
  filename,
  dimensions,
  prompt,
  priority = 'HIGH',
  aspectRatio = '4 / 3',
  compact = false,
}) => {
  const { isRTL } = useLanguage();

  const priorityColor = priority === 'HIGH' ? '#DC2626' : priority === 'MEDIUM' ? '#D97706' : '#6B7280';

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio,
        borderRadius: 16,
        border: '1.5px dashed #C9CDD6',
        background: 'repeating-linear-gradient(135deg, #FAFAFA 0px, #FAFAFA 10px, #F3F4F6 10px, #F3F4F6 20px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: compact ? 16 : 'clamp(16px, 3vw, 28px)',
        gap: compact ? 6 : 10,
        overflow: 'hidden',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: '#FFFFFF', border: '1px solid #E8EBF0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#9BA3AE', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <ImageIcon style={{ width: 17, height: 17 }} aria-hidden />
      </div>

      <span style={{
        fontSize: 10, fontWeight: 800, color: '#374151',
        letterSpacing: isRTL ? 0 : '0.12em', textTransform: isRTL ? 'none' : 'uppercase',
        background: '#FFFFFF', border: '1px solid #E8EBF0',
        padding: '3px 10px', borderRadius: '100px',
      }}>
        {isRTL ? 'صورة مطلوبة' : 'Image Required'}
      </span>

      {!compact && (
        <div style={{ maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <p style={{ fontSize: 11, color: '#6B7280', margin: 0, fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {filename}
          </p>
          {dimensions && (
            <p style={{ fontSize: 10.5, color: '#9BA3AE', margin: 0 }}>{dimensions}</p>
          )}
          {prompt && (
            <p style={{ fontSize: 10.5, color: '#9BA3AE', margin: '4px 0 0', lineHeight: 1.5, fontStyle: 'italic' }}>
              "{prompt}"
            </p>
          )}
        </div>
      )}

      <span style={{
        fontSize: 9.5, fontWeight: 800, color: priorityColor,
        letterSpacing: '0.06em', marginTop: compact ? 0 : 4,
      }}>
        {isRTL ? 'الأولوية: ' : 'PRIORITY: '}{priority}
      </span>
    </div>
  );
};

export default ImageRequiredCard;
