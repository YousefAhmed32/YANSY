import { TK } from '../../admin-ui';
import { Field, BilingualPair, TagInput } from './shared';

const StorySection = ({ form, set, isRTL }) => {
  const L = {
    summary: isRTL ? 'الملخص' : 'Summary',
    summaryPh: isRTL ? 'يظهر في البطاقات ونتائج البحث ومقدمة الصفحة الرئيسية' : 'Shown on cards, search results, and the hero lead',
    storyArc: isRTL ? 'مسار القصة' : 'THE STORY ARC',
    goal: isRTL ? 'الهدف' : 'Goal',
    goalPh: isRTL ? 'ما أراده العميل في البداية' : 'What the client wanted going in',
    painPoints: isRTL ? 'نقاط الألم' : 'Pain points',
    challenge: isRTL ? 'التحدي' : 'The Challenge',
    solution: isRTL ? 'الحل' : 'The Solution',
    process: isRTL ? 'منهجية العمل' : 'Our Process',
    tags: isRTL ? 'الوسوم / التقنيات' : 'Tags / Tech stack',
    tagsHint: isRTL ? 'تُستخدم كوسوم "التقنيات المستخدمة" في الصفحة العامة' : "Doubles as the 'Built With' pills on the public page",
    tagsPh: isRTL ? 'React، Node.js، MongoDB...' : 'React, Node.js, MongoDB...',
  };

  return (
    <div className="space-y-6">
      <BilingualPair label={L.summary} required multiline rows={3} isRTL={isRTL} enValue={form.description} arValue={form.descriptionAr} onEnChange={(v) => set('description', v)} onArChange={(v) => set('descriptionAr', v)} placeholder={L.summaryPh} />

      <div style={{ borderTop: `1px solid ${TK.border}`, paddingTop: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: TK.textMuted, letterSpacing: isRTL ? 0 : '0.04em', marginBottom: 16, textAlign: isRTL ? 'right' : 'left' }}>{L.storyArc}</p>
        <div className="space-y-5">
          <BilingualPair label={L.goal} multiline rows={2} isRTL={isRTL} enValue={form.goals} arValue={form.goalsAr} onEnChange={(v) => set('goals', v)} onArChange={(v) => set('goalsAr', v)} placeholder={L.goalPh} />
          <BilingualPair label={L.painPoints} multiline rows={2} isRTL={isRTL} enValue={form.painPoints} arValue={form.painPointsAr} onEnChange={(v) => set('painPoints', v)} onArChange={(v) => set('painPointsAr', v)} />
          <BilingualPair label={L.challenge} multiline rows={3} isRTL={isRTL} enValue={form.challenge} arValue={form.challengeAr} onEnChange={(v) => set('challenge', v)} onArChange={(v) => set('challengeAr', v)} />
          <BilingualPair label={L.solution} multiline rows={3} isRTL={isRTL} enValue={form.solution} arValue={form.solutionAr} onEnChange={(v) => set('solution', v)} onArChange={(v) => set('solutionAr', v)} />
          <BilingualPair label={L.process} multiline rows={3} isRTL={isRTL} enValue={form.process} arValue={form.processAr} onEnChange={(v) => set('process', v)} onArChange={(v) => set('processAr', v)} />
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${TK.border}`, paddingTop: 20 }}>
        <Field label={L.tags} hint={L.tagsHint} isRTL={isRTL}>
          <TagInput value={form.tags} onChange={(v) => set('tags', v)} placeholder={L.tagsPh} isRTL={isRTL} />
        </Field>
      </div>
    </div>
  );
};

export default StorySection;
