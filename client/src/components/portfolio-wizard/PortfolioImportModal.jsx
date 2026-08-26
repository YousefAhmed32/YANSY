import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { UploadCloud, FileJson, AlertCircle, CheckCircle2, HelpCircle, AlertTriangle, ImageOff, RotateCw } from 'lucide-react';
import { TK, RADIUS, Modal, Button, Spinner } from '../../admin-ui';
import api from '../../utils/api';
import {
  parsePortableFile, PortableFileError, buildReviewSummary, extractRelationsForResolve,
  summarizeResolution, mergeIntoForm, analyzePortableImport,
} from '../../utils/portfolioPortable';

const RELATION_FIELD_LABEL = {
  category:     { en: 'Category',     ar: 'الفئة' },
  industry:     { en: 'Industry',     ar: 'المجال' },
  projectType:  { en: 'Project Type', ar: 'نوع المشروع' },
  client:       { en: 'Client',       ar: 'العميل' },
  services:     { en: 'Service',      ar: 'خدمة' },
  technologies: { en: 'Technology',   ar: 'تقنية' },
  projectTags:  { en: 'Tag',          ar: 'وسم' },
  team:         { en: 'Team member',  ar: 'عضو فريق' },
};
const relationLabel = (field, isRTL) => (isRTL ? RELATION_FIELD_LABEL[field]?.ar : RELATION_FIELD_LABEL[field]?.en) || field;
const relationName = (row) => row.requested?.name || row.requested?.nameAr || row.requested?.slug || '—';

/**
 * Staged JSON import flow — pick/drop a file → parse + validate locally →
 * dry-run relation resolution against the real libraries → review summary →
 * explicit Apply. Shared by both editors (see PortfolioIOMenu.jsx).
 *
 * Nothing here ever touches the live editor `form` state until the admin
 * clicks Apply, and Apply hands the caller ONE merged form object to commit
 * with a single setForm() call — so previewing an import can never trigger
 * autosave, and applying one is a single coherent state transition (see the
 * import-safety requirements in the feature brief). A network/resolution
 * failure at any stage leaves `existingForm` completely untouched — this
 * component only ever reads it, right at the end, to compute the merge.
 */
const PortfolioImportModal = ({ open, onClose, isRTL, existingForm, onApply }) => {
  const [stage, setStage] = useState('pick'); // pick | loading | review | error
  const [dragActive, setDragActive] = useState(false);
  const [envelope, setEnvelope] = useState(null);
  const [resolution, setResolution] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [strategy, setStrategy] = useState('fillEmpty');
  const [applying, setApplying] = useState(false);
  const fileInputRef = useRef(null);
  const errorSummaryRef = useRef(null);

  const reset = () => {
    setStage('pick'); setEnvelope(null); setResolution(null); setErrorMsg('');
    setStrategy('fillEmpty'); setApplying(false); setDragActive(false);
  };

  useEffect(() => { if (open) reset(); }, [open]);
  useEffect(() => { if (stage === 'error') errorSummaryRef.current?.focus(); }, [stage]);

  const L = {
    title: isRTL ? 'استيراد JSON' : 'Import JSON',
    dropHint: isRTL ? 'اسحب وأفلت ملف JSON هنا، أو' : 'Drag and drop a JSON file here, or',
    browse: isRTL ? 'اختيار ملف' : 'Choose file',
    acceptHint: isRTL ? 'ملفات .json فقط — لا يتم استيراد أي صور أو فيديوهات.' : '.json files only — no images or video are imported.',
    parsing: isRTL ? 'جارٍ التحقق من الملف…' : 'Validating file…',
    resolving: isRTL ? 'جارٍ مطابقة المكتبات المرتبطة…' : 'Resolving library relations…',
    invalidTitle: isRTL ? 'تعذّر استيراد هذا الملف' : 'This file can\'t be imported',
    retry: isRTL ? 'إعادة المحاولة' : 'Try again',
    chooseAnother: isRTL ? 'اختيار ملف آخر' : 'Choose a different file',
    detected: isRTL ? 'تم اكتشاف:' : 'Detected:',
    mode: isRTL ? 'نمط العرض' : 'Presentation mode',
    schemaVersion: isRTL ? 'إصدار المخطط' : 'Schema version',
    fieldsFound: isRTL ? 'حقل مُعبّأ' : 'populated fields',
    mediaReminder: isRTL
      ? 'لا تحتوي هذه الملفات على صور أو فيديوهات — ستحتاج لرفعها يدويًا بعد التطبيق.'
      : 'This file contains no images or video — you\'ll need to upload media manually after applying.',
    mediaCount: (n) => isRTL ? `${n} عنصر وسائط بحاجة لرفع يدوي` : `${n} media slot${n === 1 ? '' : 's'} need manual upload`,
    resolvedRelations: isRTL ? 'الروابط المطابقة تلقائيًا' : 'Automatically resolved relations',
    unresolvedRelations: isRTL ? 'روابط غير مطابقة' : 'Unresolved relations',
    ambiguousRelations: isRTL ? 'روابط غامضة (أكثر من تطابق محتمل)' : 'Ambiguous relations (more than one possible match)',
    requiredBlocked: isRTL
      ? 'لم يتم العثور على "الفئة" في مكتبتك — هذا الحقل مطلوب. عدّل الملف أو اختر الفئة يدويًا بعد الإلغاء.'
      : 'This file\'s Category could not be matched in your library — Category is required. Edit the file, or cancel and set it manually.',
    unresolvedNote: isRTL
      ? 'ستبقى هذه الحقول فارغة بعد التطبيق — يمكنك اختيارها يدويًا من القوائم المعتادة (وتشمل خيار الإنشاء المباشر) بعد المراجعة.'
      : 'These will be left empty after applying — pick them manually from the normal fields (which include quick-create) once you review the result.',
    ackUnresolved: isRTL ? 'فهمت أن الحقول أعلاه ستبقى فارغة — أكمل التطبيق' : 'I understand the fields above will be left empty — continue applying',
    strategyLabel: isRTL ? 'طريقة الدمج' : 'Merge strategy',
    replace: isRTL ? 'استبدال البيانات الحالية' : 'Replace current data',
    replaceHint: isRTL ? 'يستبدل كل الحقول النصية بمحتوى الملف (الوسائط تبقى كما هي دائمًا).' : 'Overwrites every textual/structured field with the file\'s content (media is always preserved).',
    fillEmpty: isRTL ? 'تعبئة الحقول الفارغة فقط' : 'Fill empty fields only',
    fillEmptyHint: isRTL ? 'الخيار الأكثر أمانًا — لا يغيّر أي حقل يحتوي بالفعل على قيمة.' : 'The safer option — never touches a field that already has a value.',
    cancel: isRTL ? 'إلغاء' : 'Cancel',
    apply: isRTL ? 'تطبيق' : 'Apply',
    applied: isRTL ? 'تم تطبيق الاستيراد — راجع الحقول ثم احفظ/انشر يدويًا' : 'Import applied — review the fields, then save/publish manually',
    neverPublishes: isRTL
      ? 'الاستيراد لا ينشر المشروع تلقائيًا أبدًا — سيبقى بحالة "مسودة" حتى تنشره بنفسك.'
      : 'Importing never publishes automatically — the project stays in Draft until you publish it yourself.',
    readyCount: isRTL ? 'جاهز للاستيراد' : 'Ready to import',
    skippedCount: isRTL ? 'سيتم تجاهله' : 'Will be skipped',
    preservedCount: isRTL ? 'سيبقى كما هو' : 'Will be preserved',
    skippedTitle: isRTL ? 'حقول لن يتم استيرادها' : 'Fields that will not be imported',
    nothingReady: isRTL ? 'لا يحتوي الملف على حقول متوافقة قابلة للاستيراد.' : 'This file contains no compatible fields to import.',
    reason: {
      unresolvedRelation: isRTL ? 'غير موجود في المكتبة الحالية' : 'Not found in the current library',
      ambiguousRelation: isRTL ? 'أكثر من تطابق محتمل' : 'More than one possible match',
      invalidUrl: isRTL ? 'رابط غير صالح' : 'Invalid URL', invalidEnum: isRTL ? 'قيمة غير مدعومة' : 'Unsupported value',
      unknownField: isRTL ? 'حقل غير معروف' : 'Unknown field', protectedField: isRTL ? 'حقل نظام محمي' : 'Protected system field',
      editorModeIsFixed: isRTL ? 'نمط المحرر لا يتغير بالاستيراد' : 'Editor mode is not changed by import',
      textTooLong: isRTL ? 'النص أطول من الحد المسموح' : 'Text exceeds the allowed limit',
      maximumThree: isRTL ? 'الحد الأقصى ثلاث نقاط' : 'Maximum three highlights',
      invalidItem: isRTL ? 'عنصر غير صالح' : 'Invalid item', emptyItem: isRTL ? 'عنصر فارغ' : 'Empty item',
      unsupportedBlock: isRTL ? 'نوع محتوى غير مدعوم' : 'Unsupported content block',
      expectedText: isRTL ? 'يجب أن تكون القيمة نصًا' : 'Expected text', expectedArray: isRTL ? 'يجب أن تكون القيمة قائمة' : 'Expected a list',
      expectedBoolean: isRTL ? 'قيمة منطقية غير صالحة' : 'Expected true or false', expectedInteger: isRTL ? 'يجب أن تكون القيمة عددًا صحيحًا' : 'Expected an integer',
      invalidDate: isRTL ? 'تاريخ غير صالح' : 'Invalid date', invalidYear: isRTL ? 'سنة غير صالحة' : 'Invalid year',
    },
  };

  const CODE_MESSAGE = {
    MALFORMED_JSON: isRTL ? 'هذا الملف ليس JSON صالحًا.' : 'This file is not valid JSON.',
    INVALID_FORMAT: isRTL ? 'هذا الملف ليس تصديرًا لمشروع محفظة من يانسي.' : 'This file is not a recognized YANSY portfolio export.',
    UNSUPPORTED_SCHEMA_VERSION: isRTL ? 'إصدار مخطط هذا الملف غير مدعوم في هذا الإصدار من لوحة التحكم.' : 'This file\'s schema version is not supported by this version of the admin.',
    MISSING_SCHEMA_VERSION: isRTL ? 'هذا الملف لا يحتوي على رقم إصدار المخطط.' : 'This file is missing a schema version.',
    MISSING_PROJECT: isRTL ? 'لا يحتوي هذا الملف على بيانات مشروع.' : 'This file has no project data.',
    TOO_LARGE: isRTL ? 'هذا الملف كبير جدًا ليتم استيراده.' : 'This file is too large to import.',
    TOO_DEEP: isRTL ? 'بنية هذا الملف معقّدة أكثر من اللازم.' : 'This file is nested too deeply to be valid.',
    UNSAFE_KEY: isRTL ? 'يحتوي هذا الملف على مفتاح غير مسموح به.' : 'This file contains a disallowed key.',
  };

  const handleFile = async (file) => {
    if (!file) return;
    setStage('loading');
    try {
      const text = await file.text();
      const parsed = parsePortableFile(text);
      setEnvelope(parsed);

      const { data } = await api.post('/portfolio/admin/import/resolve', {
        format: parsed.format,
        schemaVersion: parsed.schemaVersion,
        relations: extractRelationsForResolve(parsed.project),
      });
      setResolution(data.resolved);
      setStage('review');
    } catch (err) {
      if (err instanceof PortableFileError) {
        setErrorMsg(CODE_MESSAGE[err.code] || err.message);
      } else {
        setErrorMsg(err?.response?.data?.error || (isRTL ? 'تعذّر الاتصال بالخادم لمطابقة الروابط — حاول مرة أخرى.' : 'Could not reach the server to resolve relations — try again.'));
      }
      setStage('error');
    }
  };

  const onSelect = (e) => { const f = e.target.files?.[0]; e.target.value = ''; handleFile(f); };
  const onDrop = (e) => { e.preventDefault(); setDragActive(false); const f = e.dataTransfer?.files?.[0]; handleFile(f); };

  const summary = envelope ? buildReviewSummary(envelope, isRTL) : null;
  const resSummary = envelope && resolution ? summarizeResolution(envelope.project, resolution) : null;
  const importPlan = envelope && resolution ? analyzePortableImport(envelope.project, resolution, existingForm, strategy) : null;
  const canApply = Boolean(importPlan?.counts.ready);

  const apply = () => {
    if (!canApply) return;
    setApplying(true);
    try {
      const next = mergeIntoForm(existingForm, envelope.project, resolution, strategy);
      onApply(next, importPlan);
      toast.success(isRTL
        ? `تم استيراد ${importPlan.counts.ready} وتجاهل ${importPlan.counts.skipped}`
        : `${importPlan.counts.ready} imported, ${importPlan.counts.skipped} skipped`);
      onClose();
    } finally {
      setApplying(false);
    }
  };

  const Dropzone = (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={onDrop}
      style={{
        borderRadius: RADIUS.lg, border: `1.5px dashed ${dragActive ? TK.accent : TK.border}`,
        background: dragActive ? TK.accentBg : TK.bgSubtle, padding: '40px 20px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center',
      }}
    >
      <UploadCloud style={{ width: 26, height: 26, color: dragActive ? TK.accent : TK.textLight }} />
      <p style={{ fontSize: 12.5, color: TK.textMuted, margin: 0 }}>{L.dropHint}</p>
      <label
        className="au-focus-ring"
        tabIndex={0}
        role="button"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: RADIUS.md, background: TK.accent, color: TK.accentFg, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
      >
        <FileJson style={{ width: 13, height: 13 }} /> {L.browse}
        <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={onSelect} style={{ display: 'none' }} />
      </label>
      <p style={{ fontSize: 10.5, color: TK.textLight, margin: 0 }}>{L.acceptHint}</p>
    </div>
  );

  const ErrorBlock = (
    <div ref={errorSummaryRef} role="alert" tabIndex={-1} style={{ outline: 'none' }}>
      <div style={{ display: 'flex', gap: 10, padding: '14px 16px', borderRadius: RADIUS.md, background: TK.redBg, border: `1px solid ${TK.redBd}`, marginBottom: 14 }}>
        <AlertCircle style={{ width: 17, height: 17, color: TK.red, flexShrink: 0, marginTop: 1 }} aria-hidden />
        <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: TK.red, margin: '0 0 4px' }}>{L.invalidTitle}</p>
          <p style={{ fontSize: 12.5, color: TK.red, margin: 0, lineHeight: 1.5 }}>{errorMsg}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="secondary" size="sm" onClick={reset}>{L.chooseAnother}</Button>
        {envelope && <Button variant="secondary" size="sm" icon={RotateCw} onClick={() => handleFile(new File([JSON.stringify(envelope)], 'retry.json', { type: 'application/json' }))}>{L.retry}</Button>}
      </div>
    </div>
  );

  const RelationRow = ({ row, tone }) => (
    <li style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 12, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
      {tone === 'ok' ? <CheckCircle2 style={{ width: 13, height: 13, color: TK.green, flexShrink: 0 }} /> : tone === 'ambiguous' ? <HelpCircle style={{ width: 13, height: 13, color: TK.accent, flexShrink: 0 }} /> : <AlertTriangle style={{ width: 13, height: 13, color: TK.textLight, flexShrink: 0 }} />}
      <span style={{ color: TK.textMuted }}>{relationLabel(row.field, isRTL)}:</span>
      <span style={{ color: TK.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {tone === 'ok' ? (isRTL ? row.item?.nameAr || row.item?.name : row.item?.name) : relationName(row)}
      </span>
    </li>
  );

  return (
    <Modal open={open} onClose={onClose} title={L.title} width="560px">
      {stage === 'pick' && Dropzone}

      {stage === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '36px 0' }}>
          <Spinner />
          <p style={{ fontSize: 12.5, color: TK.textMuted }}>{envelope ? L.resolving : L.parsing}</p>
        </div>
      )}

      {stage === 'error' && ErrorBlock}

      {stage === 'review' && summary && resSummary && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: 14, borderRadius: RADIUS.md, background: TK.bgSubtle, border: `1px solid ${TK.border}` }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: TK.textLight, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{L.detected}</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: TK.text, margin: '0 0 8px' }}>{summary.title}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: 11.5, color: TK.textMuted }}>
              <span>{L.mode}: <strong style={{ color: TK.text }}>{summary.presentationModeLabel}</strong></span>
              <span>{L.schemaVersion}: <strong style={{ color: TK.text }}>{summary.schemaVersion}</strong></span>
              <span><strong style={{ color: TK.text }}>{summary.populatedFieldCount}</strong> {L.fieldsFound}</span>
            </div>
          </div>

          {importPlan && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }} aria-live="polite">
              {[
                { label: L.readyCount, value: importPlan.counts.ready, color: TK.green, bg: TK.greenBg },
                { label: L.skippedCount, value: importPlan.counts.skipped, color: TK.accent, bg: TK.accentBg },
                { label: L.preservedCount, value: importPlan.counts.preserved, color: TK.textMuted, bg: TK.bgSubtle },
              ].map((item) => (
                <div key={item.label} style={{ padding: '10px 8px', borderRadius: RADIUS.md, background: item.bg, border: `1px solid ${TK.border}`, textAlign: 'center' }}>
                  <strong style={{ display: 'block', fontSize: 17, color: item.color }}>{item.value}</strong>
                  <span style={{ display: 'block', fontSize: 10.5, color: TK.textMuted, lineHeight: 1.35 }}>{item.label}</span>
                </div>
              ))}
            </div>
          )}

          {importPlan?.counts.skipped > 0 && (
            <details style={{ border: `1px solid ${TK.accentBd}`, borderRadius: RADIUS.md, background: TK.accentBg, padding: '10px 12px' }}>
              <summary style={{ cursor: 'pointer', fontSize: 12, fontWeight: 700, color: TK.accent }}>{L.skippedTitle} ({importPlan.counts.skipped})</summary>
              <ul style={{ margin: '8px 0 0', paddingInlineStart: 18, maxHeight: 160, overflowY: 'auto' }}>
                {importPlan.rows.filter((r) => r.status.startsWith('skipped')).map((row, index) => (
                  <li key={`${row.path}-${index}`} style={{ fontSize: 11.5, color: TK.textMuted, marginBottom: 5, overflowWrap: 'anywhere' }}>
                    <strong style={{ color: TK.text }}>{row.path}</strong> — {L.reason[row.reason] || row.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {importPlan && importPlan.counts.ready === 0 && (
            <div role="status" style={{ padding: '10px 12px', borderRadius: RADIUS.md, background: TK.bgSubtle, border: `1px solid ${TK.border}`, fontSize: 12, color: TK.textMuted }}>
              {L.nothingReady}
            </div>
          )}

          {summary.mediaManifestCount > 0 && (
            <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderRadius: RADIUS.md, background: TK.accentBg, border: `1px solid ${TK.accentBd}`, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <ImageOff style={{ width: 14, height: 14, color: TK.accent, flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 11.5, color: TK.accent, margin: 0, lineHeight: 1.5 }}>{L.mediaCount(summary.mediaManifestCount)} — {L.mediaReminder}</p>
            </div>
          )}

          {resSummary.rows.filter((r) => r.status === 'resolved').length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: TK.textMuted, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{L.resolvedRelations}</p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {resSummary.rows.filter((r) => r.status === 'resolved').map((r, i) => <RelationRow key={`ok-${i}`} row={r} tone="ok" />)}
              </ul>
            </div>
          )}

          {resSummary.ambiguous.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: TK.accent, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{L.ambiguousRelations}</p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {resSummary.ambiguous.map((r, i) => <RelationRow key={`amb-${i}`} row={r} tone="ambiguous" />)}
              </ul>
            </div>
          )}

          {resSummary.unresolvedOptional.filter((r) => r.status === 'unresolved').length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: TK.textMuted, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{L.unresolvedRelations}</p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {resSummary.unresolvedOptional.filter((r) => r.status === 'unresolved').map((r, i) => <RelationRow key={`un-${i}`} row={r} tone="unresolved" />)}
              </ul>
              <p style={{ fontSize: 11, color: TK.textLight, margin: '4px 0 0', lineHeight: 1.5 }}>{L.unresolvedNote}</p>
            </div>
          )}

          <div style={{ borderTop: `1px solid ${TK.border}`, paddingTop: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: TK.textMuted, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{L.strategyLabel}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { value: 'fillEmpty', label: L.fillEmpty, hint: L.fillEmptyHint },
                { value: 'replace', label: L.replace, hint: L.replaceHint },
              ].map((opt) => (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: 10, borderRadius: RADIUS.md, border: `1px solid ${strategy === opt.value ? TK.accentBd : TK.border}`, background: strategy === opt.value ? TK.accentBg : 'transparent', cursor: 'pointer', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <input type="radio" name="import-merge-strategy" checked={strategy === opt.value} onChange={() => setStrategy(opt.value)} style={{ marginTop: 2 }} />
                  <span>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: TK.text }}>{opt.label}</span>
                    <span style={{ display: 'block', fontSize: 11, color: TK.textLight, marginTop: 2, lineHeight: 1.5 }}>{opt.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 11, color: TK.textLight, margin: 0, lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <AlertTriangle style={{ width: 12, height: 12, flexShrink: 0, marginTop: 1 }} /> {L.neverPublishes}
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="secondary" onClick={onClose}>{L.cancel}</Button>
            <Button variant="primary" onClick={apply} loading={applying} disabled={!canApply}>
              {canApply ? (isRTL ? `استيراد ${importPlan.counts.ready} حقلًا` : `Import ${importPlan.counts.ready} fields`) : L.apply}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default PortfolioImportModal;
