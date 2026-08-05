import { Plus, Trash2, Upload, X, Mic } from 'lucide-react';
import { TK, RADIUS, TextInput, TextArea, IconButton, Spinner } from '../../admin-ui';
import { mediaSrc } from '../../utils/media';
import { BilingualPair } from './shared';
import RelationPicker from './RelationPicker';

const Repeater = ({ title, hint, items, onChange, addLabel, removeLabel, newItem, renderRow, isRTL }) => (
  <div>
    <p style={{ fontSize: 12, fontWeight: 700, color: TK.textMuted, letterSpacing: isRTL ? 0 : '0.04em', marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>{title}</p>
    {hint && <p style={{ fontSize: 10.5, color: TK.textLight, marginBottom: 12, textAlign: isRTL ? 'right' : 'left' }}>{hint}</p>}
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <div style={{ flex: 1 }}>{renderRow(item, i, (patch) => onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it))))}</div>
          <IconButton icon={Trash2} variant="outline" onClick={() => onChange(items.filter((_, idx) => idx !== i))} aria-label={removeLabel} />
        </div>
      ))}
    </div>
    <button onClick={() => onChange([...items, newItem])} style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: TK.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
      <Plus style={{ width: 12, height: 12 }} /> {addLabel}
    </button>
  </div>
);

const ProofResultsSection = ({ form, set, isRTL, uploadMedia, deleteMedia }) => {
  const screenshots = form.proofScreenshots || [];
  const testimonials = form.testimonials || [];
  const awards = form.awards || [];

  const L = {
    results: isRTL ? 'النتائج' : 'Results',
    resultsPh: isRTL ? 'جملة الخلاصة — ما الذي تغيّر' : 'The payoff statement — what changed',
    metricsTitle: isRTL ? 'المؤشرات الرئيسية' : 'HEADLINE METRICS',
    metricsHint: isRTL ? 'تظهر كشرائح زجاجية عائمة فوق صورة الغلاف (حتى 4).' : 'Shown as floating glass chips over the hero image (up to 4).',
    addMetric: isRTL ? 'إضافة مؤشر' : 'Add metric',
    removeMetric: isRTL ? 'إزالة المؤشر' : 'Remove metric',
    metricValuePh: '+230%',
    metricLabelPh: isRTL ? 'معدل التحويل' : 'Conversion rate',
    perfTitle: isRTL ? 'الأداء — قبل / بعد' : 'PERFORMANCE — BEFORE / AFTER',
    perfHint: isRTL ? 'مؤشرات تقنية داعمة (وقت التحميل، نتيجة Lighthouse...).' : 'Technical proof points (load time, Lighthouse score, ...).',
    addRow: isRTL ? 'إضافة صف' : 'Add row',
    removeRow: isRTL ? 'إزالة الصف' : 'Remove row',
    loadTimePh: isRTL ? 'وقت التحميل' : 'Load time',
    before: isRTL ? 'قبل' : 'Before',
    after: isRTL ? 'بعد' : 'After',
    testimonialTitle: isRTL ? 'رأي العميل' : 'CLIENT TESTIMONIAL',
    testimonialHint: isRTL ? 'اختر من مكتبة الشهادات المشتركة أو أنشئ واحدة جديدة.' : 'Pick from the shared Testimonials library or create a new one.',
    chatProofTitle: isRTL ? 'دليل واتساب / المحادثات' : 'WHATSAPP / CHAT PROOF',
    chatProofHint: isRTL ? 'لقطات شاشة لرسائل حقيقية من العملاء — تظهر في شبكة بإطار هاتف.' : 'Screenshots of real client messages — shown in a phone-frame grid.',
    remove: isRTL ? 'إزالة' : 'Remove',
    awardsTitle: isRTL ? 'الجوائز والشهادات' : 'AWARDS & CERTIFICATIONS',
    awardsHint: isRTL ? 'اختر من مكتبة الجوائز المشتركة أو أنشئ واحدة جديدة.' : 'Pick from the shared Awards library or create a new one.',
    faqsTitle: isRTL ? 'الأسئلة الشائعة' : 'FAQS',
    addQuestion: isRTL ? 'إضافة سؤال' : 'Add question',
    removeQuestion: isRTL ? 'إزالة السؤال' : 'Remove question',
    questionPh: isRTL ? 'السؤال' : 'Question',
    answerPh: isRTL ? 'الإجابة' : 'Answer',
  };

  return (
    <div className="space-y-8">
      <BilingualPair label={L.results} multiline rows={3} isRTL={isRTL} enValue={form.results} arValue={form.resultsAr} onEnChange={(v) => set('results', v)} onArChange={(v) => set('resultsAr', v)} placeholder={L.resultsPh} />

      <Repeater
        title={L.metricsTitle} hint={L.metricsHint} isRTL={isRTL}
        items={form.metrics} onChange={(v) => set('metrics', v)} addLabel={L.addMetric} removeLabel={L.removeMetric} newItem={{ label: '', value: '' }}
        renderRow={(m, i, patch) => (
          <div style={{ display: 'flex', gap: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <TextInput value={m.value} onChange={(e) => patch({ value: e.target.value })} placeholder={L.metricValuePh} containerStyle={{ width: 110, flexShrink: 0 }} dir="ltr" />
            <TextInput value={m.label} onChange={(e) => patch({ label: e.target.value })} placeholder={L.metricLabelPh} containerStyle={{ flex: 1 }} dir={isRTL ? 'rtl' : 'ltr'} />
          </div>
        )}
      />

      <Repeater
        title={L.perfTitle} hint={L.perfHint} isRTL={isRTL}
        items={form.performanceMetrics} onChange={(v) => set('performanceMetrics', v)} addLabel={L.addRow} removeLabel={L.removeRow} newItem={{ label: '', before: '', after: '' }}
        renderRow={(m, i, patch) => (
          <div style={{ display: 'flex', gap: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <TextInput value={m.label} onChange={(e) => patch({ label: e.target.value })} placeholder={L.loadTimePh} containerStyle={{ flex: 1 }} dir={isRTL ? 'rtl' : 'ltr'} />
            <TextInput value={m.before} onChange={(e) => patch({ before: e.target.value })} placeholder={L.before} containerStyle={{ width: 90, flexShrink: 0 }} dir="ltr" />
            <TextInput value={m.after} onChange={(e) => patch({ after: e.target.value })} placeholder={L.after} containerStyle={{ width: 90, flexShrink: 0 }} dir="ltr" />
          </div>
        )}
      />

      <div style={{ borderTop: `1px solid ${TK.border}`, paddingTop: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: TK.textMuted, letterSpacing: isRTL ? 0 : '0.04em', marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>{L.testimonialTitle}</p>
        <p style={{ fontSize: 10.5, color: TK.textLight, marginBottom: 12, textAlign: isRTL ? 'right' : 'left' }}>{L.testimonialHint}</p>
        <RelationPicker
          apiBase="/testimonials"
          value={testimonials}
          onChange={(v) => set('testimonials', v)}
          multiple
          displayField="author"
          quickCreateFields={[
            { key: 'author', label: 'Author name', labelAr: 'اسم الكاتب', required: true },
            { key: 'authorAr', label: 'Author name (Arabic)', labelAr: 'اسم الكاتب (عربي)' },
            { key: 'role', label: 'Role (EN)', labelAr: 'المنصب (إنجليزي)' },
            { key: 'roleAr', label: 'Role (AR)', labelAr: 'المنصب (عربي)' },
            { key: 'quote', label: 'Quote (EN)', labelAr: 'الاقتباس (إنجليزي)', required: true, multiline: true },
            { key: 'quoteAr', label: 'Quote (AR)', labelAr: 'الاقتباس (عربي)', multiline: true },
          ]}
        />
        {testimonials.length > 0 && (
          <div className="space-y-2" style={{ marginTop: 12 }}>
            {testimonials.map((t) => (
              <div key={t._id} style={{ padding: '10px 14px', borderRadius: RADIUS.md, border: `1px solid ${TK.border}` }}>
                <p style={{ fontSize: 12.5, color: TK.text, fontStyle: 'italic', margin: '0 0 6px' }}>"{t.quote}"</p>
                <p style={{ fontSize: 11, color: TK.textMuted, margin: 0 }}>— {t.author}{t.role ? `, ${t.role}` : ''}</p>
                {t.audio?.url && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <Mic style={{ width: 12, height: 12, color: TK.accent, flexShrink: 0 }} />
                    <audio src={mediaSrc(t.audio)} controls style={{ height: 28, flex: 1 }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ borderTop: `1px solid ${TK.border}`, paddingTop: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: TK.textMuted, letterSpacing: isRTL ? 0 : '0.04em', marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>{L.chatProofTitle}</p>
        <p style={{ fontSize: 10.5, color: TK.textLight, marginBottom: 12, textAlign: isRTL ? 'right' : 'left' }}>{L.chatProofHint}</p>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-2">
          {screenshots.map((shot, i) => (
            <div key={i} style={{ position: 'relative', aspectRatio: '9/16', borderRadius: RADIUS.sm, overflow: 'hidden', border: `1px solid ${TK.border}` }}>
              <img src={mediaSrc(shot)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button onClick={() => { deleteMedia(shot); set('proofScreenshots', screenshots.filter((_, idx) => idx !== i)); }} style={{ position: 'absolute', top: 3, insetInlineEnd: 3, width: 16, height: 16, borderRadius: '50%', background: 'rgba(13,17,23,0.6)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} aria-label={L.remove}>
                <X style={{ width: 9, height: 9, color: '#fff' }} />
              </button>
            </div>
          ))}
          <label className="au-upload-tile" style={{ aspectRatio: '9/16', borderRadius: RADIUS.sm, border: `1.5px dashed ${TK.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Upload style={{ width: 14, height: 14, color: TK.textLight }} />
            <input type="file" accept="image/*" multiple onChange={async (e) => {
              const files = Array.from(e.target.files); e.target.value = '';
              for (const file of files) {
                const asset = await uploadMedia(file, `proof-${Date.now()}-${Math.random().toString(36).slice(2)}`).catch(() => null);
                if (asset) set('proofScreenshots', [...(form.proofScreenshots || []), asset]);
              }
            }} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: TK.textMuted, letterSpacing: isRTL ? 0 : '0.04em', marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>{L.awardsTitle}</p>
        <p style={{ fontSize: 10.5, color: TK.textLight, marginBottom: 12, textAlign: isRTL ? 'right' : 'left' }}>{L.awardsHint}</p>
        <RelationPicker
          apiBase="/awards"
          value={awards}
          onChange={(v) => set('awards', v)}
          multiple
          displayField="title"
          quickCreateFields={[
            { key: 'title', label: 'Award title', labelAr: 'اسم الجائزة', required: true },
            { key: 'titleAr', label: 'Award title (Arabic)', labelAr: 'اسم الجائزة (عربي)' },
            { key: 'org', label: 'Issuing organization', labelAr: 'الجهة المانحة' },
            { key: 'year', label: 'Year', labelAr: 'السنة' },
          ]}
        />
      </div>

      <Repeater
        title={L.faqsTitle} isRTL={isRTL}
        items={form.faqs} onChange={(v) => set('faqs', v)} addLabel={L.addQuestion} removeLabel={L.removeQuestion} newItem={{ question: '', answer: '' }}
        renderRow={(f, i, patch) => (
          <div className="space-y-1.5">
            <TextInput value={f.question} onChange={(e) => patch({ question: e.target.value })} placeholder={L.questionPh} dir={isRTL ? 'rtl' : 'ltr'} />
            <TextArea rows={2} value={f.answer} onChange={(e) => patch({ answer: e.target.value })} placeholder={L.answerPh} dir={isRTL ? 'rtl' : 'ltr'} />
          </div>
        )}
      />
    </div>
  );
};

export default ProofResultsSection;
