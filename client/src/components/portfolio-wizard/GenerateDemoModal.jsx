import { Modal, TK, RADIUS } from '../../admin-ui';
import { DEMO_CATEGORIES } from '../../utils/demoGenerators';

/**
 * Category picker for "Generate Demo Data" — a single click on a tile fully
 * populates the wizard's form with realistic, internally-consistent demo
 * content for that vertical (see utils/demoGenerators). Demo/testing use
 * only: content is clearly fictional and always saved as a draft.
 */
const GenerateDemoModal = ({ open, onClose, onSelect, isRTL }) => {
  const L = {
    title: isRTL ? '✨ إنشاء بيانات تجريبية' : '✨ Generate Demo Data',
    subtitle: isRTL
      ? 'اختر فئة لملء نموذج المشروع بالكامل ببيانات واقعية باللغتين — يمكنك تعديل أي حقل قبل الحفظ.'
      : 'Pick a category to fully populate the project form with realistic bilingual data — edit any field before saving.',
  };

  return (
    <Modal open={open} onClose={onClose} title={L.title} width="620px">
      <p style={{ fontSize: 12.5, color: TK.textMuted, lineHeight: 1.6, margin: '0 0 18px', textAlign: isRTL ? 'right' : 'left' }}>
        {L.subtitle}
      </p>
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}
      >
        {DEMO_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => onSelect(cat.key)}
              className="au-demo-tile"
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '16px 8px', borderRadius: RADIUS.lg, border: `1px solid ${TK.border}`,
                background: TK.surface, cursor: 'pointer', textAlign: 'center',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: RADIUS.md, background: TK.accentBg, border: `1px solid ${TK.accentBd}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon style={{ width: 17, height: 17, color: TK.accent }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: TK.text }}>{isRTL ? cat.ar : cat.en}</span>
            </button>
          );
        })}
      </div>
      <style>{`
        .au-demo-tile:hover { border-color: ${TK.accentBd}; background: ${TK.accentBg}; }
        .au-demo-tile:focus-visible { outline: 2px solid ${TK.accent}; outline-offset: 2px; }
      `}</style>
    </Modal>
  );
};

export default GenerateDemoModal;
