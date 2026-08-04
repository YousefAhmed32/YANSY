import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Maximize2, Minimize2, Move, Copy, RefreshCw,
  Wand2, Check, ArrowRightLeft, FileText, ChevronDown
} from 'lucide-react';
import { TK, RADIUS, SHADOW, Modal, Button, TextArea } from '../../admin-ui';

export const StoryBlockEditor = ({
  id,
  title,
  titleAr,
  icon: IconComponent = FileText,
  hintEn,
  hintAr,
  recommendedMin = 50,
  recommendedMax = 300,
  enValue = '',
  arValue = '',
  onEnChange,
  onArChange,
  templates = [],
  isRTL = false,
  dragHandleProps = {},
}) => {
  const [focusModalOpen, setFocusModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('split'); // 'split' | 'en' | 'ar'
  const [aiLoading, setAiLoading] = useState(false);
  const [aiActionToast, setAiActionToast] = useState('');

  // Character & word counters
  const enLen = enValue ? enValue.length : 0;
  const arLen = arValue ? arValue.length : 0;
  const maxLen = Math.max(enLen, arLen);

  const lengthBadge = useMemo(() => {
    if (maxLen === 0) return { tone: TK.textLight, text: isRTL ? 'فارغ' : 'Empty' };
    if (maxLen < recommendedMin) return { tone: '#F59E0B', text: isRTL ? `${maxLen} / ${recommendedMin}+ حرف (قصير)` : `${maxLen} / ${recommendedMin}+ chars (short)` };
    if (maxLen <= recommendedMax) return { tone: '#10B981', text: isRTL ? `${maxLen} حرف (طول مثالي ✨)` : `${maxLen} chars (optimal ✨)` };
    return { tone: '#EF4444', text: isRTL ? `${maxLen} / ${recommendedMax} حرف (طويل)` : `${maxLen} / ${recommendedMax} chars (long)` };
  }, [maxLen, recommendedMin, recommendedMax, isRTL]);

  // AI Transformations simulation / enhancement
  const runAiAction = (actionType, lang = 'en') => {
    setAiLoading(true);
    setAiActionToast(actionType);
    setTimeout(() => {
      const currentText = lang === 'en' ? enValue : arValue;
      const setFn = lang === 'en' ? onEnChange : onArChange;

      if (!currentText.trim()) {
        if (templates.length > 0) {
          const t = templates[0];
          onEnChange(t.en);
          onArChange(t.ar);
        }
        setAiLoading(false);
        setAiActionToast('');
        return;
      }

      if (actionType === 'improve') {
        setFn(currentText.trim() + (lang === 'en' ? ' Crafted with state-of-the-art precision and zero performance compromise.' : ' صُمم بدقة فائقة وأداء عالي الجودة وبدون مساومة.'));
      } else if (actionType === 'shorten') {
        setFn(currentText.split('. ')[0] + '.');
      } else if (actionType === 'expand') {
        setFn(currentText.trim() + (lang === 'en' ? ' Furthermore, our team conducted extensive user testing to ensure seamless scalability and compliance.' : ' علاوة على ذلك، أجرى فريقنا اختبارات مكثفة لضمان القابلية للتوسع والسلاسة.'));
      } else if (actionType === 'professional') {
        setFn((lang === 'en' ? 'Engineered an enterprise-grade solution: ' : 'تمت هندسة حل بمواصفات المؤسسات: ') + currentText.trim());
      }
      setAiLoading(false);
      setAiActionToast('');
    }, 600);
  };

  // Bilingual sync actions
  const copyEnToAr = () => onArChange(enValue);
  const copyArToEn = () => onEnChange(arValue);
  const swapEnAr = () => {
    const temp = enValue;
    onEnChange(arValue);
    onArChange(temp);
  };

  const L = {
    aiMenu: isRTL ? '✨ مساعد الذكاء الاصطناعي' : '✨ AI Assistant',
    improve: isRTL ? 'تحسين النص' : 'Improve',
    shorten: isRTL ? 'اختصار' : 'Shorten',
    expand: isRTL ? 'التوسع وتفصيل' : 'Expand',
    professional: isRTL ? 'صياغة احترافية' : 'Make Professional',
    copyEnAr: isRTL ? 'نسخ الإنجليزي ← العربي' : 'Copy EN → AR',
    copyArEn: isRTL ? 'نسخ العربي ← الإنجليزي' : 'Copy AR → EN',
    swap: isRTL ? 'تبديل اللغتين' : 'Swap EN ↔ AR',
    focusMode: isRTL ? 'وضع التركيز' : 'Focus Mode',
    templateLabel: isRTL ? 'قوالب جاهزة للفقرة' : 'Block Templates',
  };

  return (
    <div
      style={{
        background: TK.surface,
        border: `1px solid ${TK.border}`,
        borderRadius: RADIUS.xl,
        padding: '20px',
        boxShadow: SHADOW.xs,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        position: 'relative',
      }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            {...dragHandleProps}
            style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: TK.textLight }}
            title="Drag to reorder section"
          >
            <Move style={{ width: 14, height: 14 }} />
          </div>
          <div style={{ width: 32, height: 32, borderRadius: RADIUS.md, background: TK.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TK.accent }}>
            <IconComponent style={{ width: 16, height: 16 }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h4 style={{ fontSize: 13.5, fontWeight: 700, color: TK.text, margin: 0 }}>
                {isRTL ? titleAr : title}
              </h4>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: RADIUS.pill,
                  background: 'rgba(107,114,128,0.08)',
                  color: lengthBadge.tone,
                }}
              >
                {lengthBadge.text}
              </span>
            </div>
            <p style={{ fontSize: 11, color: TK.textMuted, margin: '2px 0 0' }}>
              {isRTL ? hintAr : hintEn}
            </p>
          </div>
        </div>

        {/* Top Header Controls: Focus Mode & AI Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={Maximize2}
            onClick={() => setFocusModalOpen(true)}
            style={{ fontSize: 11 }}
          >
            {L.focusMode}
          </Button>
        </div>
      </div>

      {/* AI & Bilingual Sync Action Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          background: TK.bgSubtle,
          border: `1px solid ${TK.borderSoft}`,
          borderRadius: RADIUS.lg,
          padding: '6px 10px',
        }}
      >
        {/* AI Quick Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: TK.accent, letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Sparkles style={{ width: 11, height: 11 }} /> AI:
          </span>
          <button
            type="button"
            onClick={() => runAiAction('improve', isRTL ? 'ar' : 'en')}
            disabled={aiLoading}
            style={{ fontSize: 10.5, fontWeight: 600, padding: '3px 8px', borderRadius: RADIUS.sm, background: TK.surface, border: `1px solid ${TK.border}`, color: TK.text, cursor: 'pointer' }}
          >
            ✨ {L.improve}
          </button>
          <button
            type="button"
            onClick={() => runAiAction('professional', isRTL ? 'ar' : 'en')}
            disabled={aiLoading}
            style={{ fontSize: 10.5, fontWeight: 600, padding: '3px 8px', borderRadius: RADIUS.sm, background: TK.surface, border: `1px solid ${TK.border}`, color: TK.text, cursor: 'pointer' }}
          >
            ✨ {L.professional}
          </button>
          <button
            type="button"
            onClick={() => runAiAction('shorten', isRTL ? 'ar' : 'en')}
            disabled={aiLoading}
            style={{ fontSize: 10.5, fontWeight: 600, padding: '3px 8px', borderRadius: RADIUS.sm, background: TK.surface, border: `1px solid ${TK.border}`, color: TK.text, cursor: 'pointer' }}
          >
            {L.shorten}
          </button>
          <button
            type="button"
            onClick={() => runAiAction('expand', isRTL ? 'ar' : 'en')}
            disabled={aiLoading}
            style={{ fontSize: 10.5, fontWeight: 600, padding: '3px 8px', borderRadius: RADIUS.sm, background: TK.surface, border: `1px solid ${TK.border}`, color: TK.text, cursor: 'pointer' }}
          >
            {L.expand}
          </button>
        </div>

        {/* Bilingual Sync Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            type="button"
            onClick={copyEnToAr}
            title={L.copyEnAr}
            style={{ fontSize: 10, fontWeight: 600, padding: '3px 6px', borderRadius: RADIUS.sm, background: TK.surface, border: `1px solid ${TK.border}`, color: TK.textMuted, cursor: 'pointer' }}
          >
            EN → AR
          </button>
          <button
            type="button"
            onClick={copyArToEn}
            title={L.copyArEn}
            style={{ fontSize: 10, fontWeight: 600, padding: '3px 6px', borderRadius: RADIUS.sm, background: TK.surface, border: `1px solid ${TK.border}`, color: TK.textMuted, cursor: 'pointer' }}
          >
            AR → EN
          </button>
          <button
            type="button"
            onClick={swapEnAr}
            title={L.swap}
            style={{ display: 'flex', alignItems: 'center', padding: '3px 6px', borderRadius: RADIUS.sm, background: TK.surface, border: `1px solid ${TK.border}`, color: TK.textMuted, cursor: 'pointer' }}
          >
            <ArrowRightLeft style={{ width: 11, height: 11 }} />
          </button>
        </div>
      </div>

      {/* Templates Drawer / Quick Fill */}
      {templates.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: TK.textMuted, textTransform: 'uppercase' }}>
            {L.templateLabel}:
          </span>
          {templates.map((t, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onEnChange(t.en);
                onArChange(t.ar);
              }}
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: RADIUS.pill,
                background: TK.bgSubtle,
                color: TK.accent,
                border: `1px solid ${TK.accentBd}`,
                cursor: 'pointer',
              }}
            >
              + {isRTL ? t.titleAr : t.titleEn}
            </button>
          ))}
        </div>
      )}

      {/* Main Bilingual Dual Textarea Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* EN Input */}
        <div>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: TK.textMuted, marginBottom: 5 }}>
            ENGLISH (EN)
          </label>
          <TextArea
            value={enValue}
            onChange={(e) => onEnChange(e.target.value)}
            placeholder={`Enter ${title.toLowerCase()} in English...`}
            rows={3}
            style={{ fontSize: 13, lineHeight: 1.6 }}
          />
        </div>

        {/* AR Input */}
        <div>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: TK.textMuted, marginBottom: 5, textAlign: 'right' }}>
            العربية (AR)
          </label>
          <TextArea
            value={arValue}
            onChange={(e) => onArChange(e.target.value)}
            placeholder={`أدخل ${titleAr || title} باللغة العربية...`}
            rows={3}
            dir="rtl"
            style={{ fontSize: 13, lineHeight: 1.7, textAlign: 'right' }}
          />
        </div>
      </div>

      {/* Focus Mode Fullscreen Writing Modal */}
      <Modal open={focusModalOpen} onClose={() => setFocusModalOpen(false)} title={`${isRTL ? titleAr : title} — ${L.focusMode}`} width="720px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 12, color: TK.textMuted, margin: 0 }}>
            {isRTL ? hintAr : hintEn}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: TK.textMuted, marginBottom: 6 }}>
                ENGLISH CONTENT
              </label>
              <TextArea
                value={enValue}
                onChange={(e) => onEnChange(e.target.value)}
                rows={8}
                placeholder={`Write clear ${title.toLowerCase()}...`}
                style={{ fontSize: 14, lineHeight: 1.7 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: TK.textMuted, marginBottom: 6, textAlign: 'right' }}>
                المحتوى العربي
              </label>
              <TextArea
                value={arValue}
                onChange={(e) => onArChange(e.target.value)}
                rows={8}
                dir="rtl"
                placeholder={`اكتب ${titleAr || title} بوضوح...`}
                style={{ fontSize: 14, lineHeight: 1.8, textAlign: 'right' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
            <Button variant="primary" size="sm" onClick={() => setFocusModalOpen(false)}>
              {isRTL ? 'إغلاق وحفظ' : 'Done & Return'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StoryBlockEditor;
