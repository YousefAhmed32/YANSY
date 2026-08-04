import { useMemo } from 'react';
import { Sparkles, CheckCircle2, Circle, Trophy, Lightbulb } from 'lucide-react';
import { TK, RADIUS, SHADOW } from '../../admin-ui';

export const calcStoryQuality = (form = {}) => {
  const checks = [
    {
      id: 'summary',
      en: 'Summary (120+ chars)',
      ar: 'الملخص (120+ حرف)',
      passed: Boolean(form.description && form.description.trim().length >= 120),
      weight: 20,
    },
    {
      id: 'goals',
      en: 'Client Goals Defined',
      ar: 'أهداف العميل المحددة',
      passed: Boolean(form.goals && form.goals.trim().length >= 30),
      weight: 15,
    },
    {
      id: 'painPoints',
      en: 'Pain Points Highlighted',
      ar: 'تحديد نقاط الألم',
      passed: Boolean(form.painPoints && form.painPoints.trim().length >= 30),
      weight: 15,
    },
    {
      id: 'challenge',
      en: 'Technical Challenge Detailed',
      ar: 'تفصيل التحدي التقني',
      passed: Boolean(form.challenge && form.challenge.trim().length >= 80),
      weight: 20,
    },
    {
      id: 'solution',
      en: 'Architectural Solution Explained',
      ar: 'شرح الحل والمعمارية',
      passed: Boolean(form.solution && form.solution.trim().length >= 80),
      weight: 20,
    },
    {
      id: 'process',
      en: 'Process & Delivery Outlined',
      ar: 'منهجية العمل والخطوات',
      passed: Boolean(form.process && form.process.trim().length >= 30),
      weight: 10,
    },
  ];

  const score = checks.reduce((acc, c) => acc + (c.passed ? c.weight : 0), 0);
  return { score, checks };
};

export const StoryQualityMeter = ({ form, isRTL = false }) => {
  const { score, checks } = useMemo(() => calcStoryQuality(form), [form]);

  const scoreTone = useMemo(() => {
    if (score >= 85) return { color: '#10B981', bg: 'rgba(16,185,129,0.1)', text: isRTL ? 'قصة ممتازة جاهرة للنشر ✨' : 'World-Class Case Study ✨' };
    if (score >= 60) return { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', text: isRTL ? 'قصة جيدة جدًا — تنقصها تفاصيل' : 'Good Progress — Add Depth' };
    return { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', text: isRTL ? 'مسودة أولية — أضف التحدي والحل' : 'Draft Stage — Needs Detail' };
  }, [score, isRTL]);

  const L = {
    qualityTitle: isRTL ? 'جودة القصة والـ Case Study' : 'Case Study Quality',
    checklist: isRTL ? 'قائمة التحسين' : 'Optimization Checklist',
  };

  return (
    <div
      style={{
        background: TK.surface,
        border: `1px solid ${TK.border}`,
        borderRadius: RADIUS.xl,
        padding: '18px 20px',
        boxShadow: SHADOW.sm,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Top Score Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: RADIUS.md, background: scoreTone.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: scoreTone.color }}>
            <Trophy style={{ width: 15, height: 15 }} />
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: TK.text, margin: 0 }}>{L.qualityTitle}</h4>
            <span style={{ fontSize: 11, fontWeight: 600, color: scoreTone.color }}>{scoreTone.text}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: scoreTone.color, fontFamily: 'monospace' }}>{score}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ height: 6, background: TK.bgSubtle, borderRadius: RADIUS.pill, overflow: 'hidden', position: 'relative' }}>
        <div
          style={{
            height: '100%',
            width: `${score}%`,
            background: scoreTone.color,
            borderRadius: RADIUS.pill,
            transition: 'width 0.4s ease, background 0.3s ease',
          }}
        />
      </div>

      {/* Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: TK.textMuted, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 2 }}>
          {L.checklist}
        </span>
        {checks.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              fontSize: 11.5,
              color: item.passed ? TK.text : TK.textMuted,
              flexDirection: isRTL ? 'row-reverse' : 'row',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {item.passed ? (
                <CheckCircle2 style={{ width: 13, height: 13, color: '#10B981', flexShrink: 0 }} />
              ) : (
                <Circle style={{ width: 13, height: 13, color: TK.textLight, flexShrink: 0 }} />
              )}
              <span style={{ textDecoration: item.passed ? 'none' : 'none' }}>
                {isRTL ? item.ar : item.en}
              </span>
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, color: item.passed ? '#10B981' : TK.textLight }}>
              +{item.weight}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoryQualityMeter;
