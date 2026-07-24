import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Upload, X, Plus, Trash2, GripVertical, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import api from '../utils/api';
import { mediaSrc } from '../utils/media';
import { CATEGORIES, categoryLabel } from '../utils/portfolioTaxonomy';
import { useLanguage } from '../contexts/LanguageContext';
import {
  TK, RADIUS, SHADOW, PageHeader, Card, Badge, Button, IconButton,
  TextInput, TextArea, Select, Switch, Stepper, Spinner, PageSpinner,
} from '../admin-ui';

const emptyForm = {
  title: '', titleAr: '', category: 'E-commerce', industry: '',
  description: '', descriptionAr: '',
  challenge: '', challengeAr: '', solution: '', solutionAr: '', process: '', processAr: '', results: '', resultsAr: '',
  liveUrl: '', tags: '', duration: '', teamSize: '', year: new Date().getFullYear(),
  metrics: [],
  testimonial: { quote: '', quoteAr: '', author: '', role: '', roleAr: '' },
  metaTitle: '', metaDescription: '',
  featured: false, status: 'draft',
};

const STATUS_TONE = { draft: 'neutral', published: 'success', archived: 'warning' };

const Field = ({ label, required, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: TK.textMuted, letterSpacing: '0.03em', marginBottom: '7px' }}>
      {label}{required && <span style={{ color: TK.red, marginInlineStart: '3px' }}>*</span>}
    </label>
    {children}
  </div>
);

const PortfolioWizard = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();

  const [step, setStep]       = useState(1);
  const [form, setForm]       = useState(emptyForm);
  const [coverImage, setCoverImage] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [pendingUploads, setPendingUploads] = useState([]); // [{key,name,progress}]
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving]   = useState(false);
  const [savingMode, setSavingMode] = useState(null); // 'draft' | 'publish' | null
  const coverInputRef   = useRef(null);
  const galleryInputRef = useRef(null);
  const dragIdx = useRef(null);
  const dragOverIdx = useRef(null);

  const STEPS = isRTL ? ['الأساسيات', 'دراسة الحالة', 'الوسائط', 'SEO والنشر'] : ['Basics', 'Case Study', 'Media', 'SEO & Publish'];
  const enSuffix = isRTL ? ' (إنجليزي)' : ' (EN)';
  const arSuffix = isRTL ? ' (عربي)' : ' (AR)';

  const L = {
    portfolio: isRTL ? 'معرض الأعمال' : 'Portfolio',
    editProject: isRTL ? 'تعديل المشروع' : 'Edit Project',
    newProject: isRTL ? 'مشروع جديد' : 'New Project',
    editSubtitle: isRTL ? 'تحديث تفاصيل هذا المشروع' : 'Update the details of this project',
    newSubtitle: isRTL ? 'أضف مشروعًا جديدًا إلى معرض الأعمال' : 'Add a new project to the portfolio',
    title: isRTL ? 'العنوان' : 'Title',
    category: isRTL ? 'الفئة' : 'Category',
    industry: isRTL ? 'المجال' : 'Industry',
    industryPh: isRTL ? 'مثال: التكنولوجيا المالية، اللوجستيات' : 'e.g. Fintech, Logistics',
    tags: isRTL ? 'الوسوم / التقنيات (مفصولة بفواصل)' : 'Tags / Technologies (comma separated)',
    tagsPh: 'React, Node.js, MongoDB',
    liveUrl: isRTL ? 'الرابط المباشر' : 'Live URL',
    year: isRTL ? 'السنة' : 'Year',
    duration: isRTL ? 'المدة' : 'Duration',
    durationPh: isRTL ? '8 أسابيع' : '8 weeks',
    team: isRTL ? 'الفريق' : 'Team',
    teamPh: isRTL ? '4 أشخاص' : '4 people',
    summary: isRTL ? 'الملخص' : 'Summary',
    summaryPh: isRTL ? 'ملخص قصير يظهر في البطاقات ونتائج البحث' : 'Short summary shown on cards & SEO',
    challenge: isRTL ? 'التحدي' : 'The Challenge',
    solution: isRTL ? 'الحل' : 'The Solution',
    process: isRTL ? 'منهجية العمل' : 'Our Process',
    results: isRTL ? 'النتائج' : 'The Results',
    metrics: isRTL ? 'المؤشرات' : 'Metrics',
    addMetric: isRTL ? 'إضافة مؤشر' : 'Add metric',
    metricValuePh: '+230%',
    metricLabelPh: isRTL ? 'معدل التحويل' : 'Conversion rate',
    testimonial: isRTL ? 'رأي العميل' : 'Client Testimonial',
    quotePh: isRTL ? 'الاقتباس' : 'Quote',
    authorPh: isRTL ? 'اسم الكاتب' : 'Author name',
    rolePh: isRTL ? 'المنصب' : 'Role',
    coverImage: isRTL ? 'صورة الغلاف' : 'Cover Image',
    replaceCover: isRTL ? 'استبدال الغلاف' : 'Replace cover',
    uploadCover: isRTL ? 'رفع صورة الغلاف' : 'Upload cover',
    galleryImages: isRTL ? 'صور المعرض' : 'Gallery Images',
    addGalleryImages: isRTL ? 'إضافة صور للمعرض' : 'Add gallery images',
    dragHint: isRTL ? 'اسحب الصور لإعادة الترتيب. الصورة الأولى بعد الغلاف تظهر أولاً في معرض دراسة الحالة.' : 'Drag tiles to reorder. First image after the cover appears first in the case study gallery.',
    noImage: isRTL ? 'لا توجد صورة' : 'No image',
    metaTitle: isRTL ? 'عنوان SEO' : 'Meta Title',
    metaDescription: isRTL ? 'وصف SEO' : 'Meta Description',
    featured: isRTL ? 'مميز (يظهر في الصفحة الرئيسية)' : 'Featured (show on Home)',
    status: isRTL ? 'الحالة' : 'Status',
    statusDraft: isRTL ? 'مسودة' : 'Draft',
    statusPublished: isRTL ? 'منشور' : 'Published',
    statusArchived: isRTL ? 'مؤرشف' : 'Archived',
    untitled: isRTL ? 'مشروع بلا عنوان' : 'Untitled project',
    noSummary: isRTL ? 'لا يوجد ملخص بعد.' : 'No summary yet.',
    galleryCount: (n) => (isRTL ? `${n} صورة في المعرض` : `${n} gallery image${n === 1 ? '' : 's'}`),
    back: isRTL ? 'رجوع' : 'Back',
    next: isRTL ? 'التالي' : 'Next',
    saveAsDraft: isRTL ? 'حفظ كمسودة' : 'Save as Draft',
    publishProject: isRTL ? 'نشر المشروع' : 'Publish Project',
    updateAndPublish: isRTL ? 'تحديث ونشر' : 'Update & Publish',
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setTestimonial = (k, v) => setForm((f) => ({ ...f, testimonial: { ...f.testimonial, [k]: v } }));

  // ── Load existing project (edit mode) ───────────────────────────────────
  useEffect(() => {
    if (!isEdit) return;
    api.get(`/portfolio/admin/${id}`)
      .then(({ data }) => {
        const p = data.project;
        setForm({
          title: p.title || '', titleAr: p.titleAr || '', category: p.category || 'E-commerce', industry: p.industry || '',
          description: p.description || '', descriptionAr: p.descriptionAr || '',
          challenge: p.challenge || '', challengeAr: p.challengeAr || '',
          solution: p.solution || '', solutionAr: p.solutionAr || '',
          process: p.process || '', processAr: p.processAr || '',
          results: p.results || '', resultsAr: p.resultsAr || '',
          liveUrl: p.liveUrl || '', tags: (p.tags || []).join(', '),
          duration: p.duration || '', teamSize: p.teamSize || '', year: p.year || '',
          metrics: p.metrics || [],
          testimonial: p.testimonial || { quote: '', quoteAr: '', author: '', role: '', roleAr: '' },
          metaTitle: p.metaTitle || '', metaDescription: p.metaDescription || '',
          featured: Boolean(p.featured), status: p.status || 'draft',
        });
        setCoverImage(p.coverImage || null);
        setGallery(p.gallery || []);
      })
      .catch(() => toast.error(isRTL ? 'فشل تحميل المشروع' : 'Failed to load project'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  // ── Upload helper ────────────────────────────────────────────────────────
  const uploadFile = async (file, key) => {
    const fd = new FormData();
    fd.append('file', file);
    setPendingUploads((u) => [...u, { key, name: file.name, progress: 0 }]);
    try {
      const { data } = await api.post('/portfolio/admin/media', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const progress = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
          setPendingUploads((u) => u.map((x) => (x.key === key ? { ...x, progress } : x)));
        },
      });
      return data.asset;
    } finally {
      setPendingUploads((u) => u.filter((x) => x.key !== key));
    }
  };

  const deleteAsset = (asset) => {
    if (!asset?.publicId) return;
    api.delete('/portfolio/admin/media', { data: { publicId: asset.publicId, provider: asset.provider } }).catch(() => {});
  };

  const handleCoverSelect = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const old = coverImage;
    try {
      const asset = await uploadFile(file, 'cover');
      setCoverImage(asset);
      deleteAsset(old);
    } catch { toast.error(isRTL ? 'فشل رفع صورة الغلاف' : 'Cover upload failed'); }
  };

  const handleGallerySelect = async (e) => {
    const files = Array.from(e.target.files).slice(0, 20);
    e.target.value = '';
    await Promise.all(files.map(async (file) => {
      const key = `g-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      try {
        const asset = await uploadFile(file, key);
        setGallery((g) => [...g, asset]);
      } catch { toast.error(isRTL ? `فشل رفع ${file.name}` : `Failed to upload ${file.name}`); }
    }));
  };

  const removeGalleryImage = (idx) => {
    const asset = gallery[idx];
    setGallery((g) => g.filter((_, i) => i !== idx));
    deleteAsset(asset);
  };

  const handleGalleryDrop = () => {
    if (dragIdx.current === null || dragOverIdx.current === null || dragIdx.current === dragOverIdx.current) return;
    setGallery((g) => {
      const next = [...g];
      const [moved] = next.splice(dragIdx.current, 1);
      next.splice(dragOverIdx.current, 0, moved);
      return next;
    });
    dragIdx.current = null;
    dragOverIdx.current = null;
  };

  // ── Metrics ──────────────────────────────────────────────────────────────
  const addMetric = () => set('metrics', [...form.metrics, { label: '', value: '' }]);
  const updateMetric = (i, field, val) => set('metrics', form.metrics.map((m, idx) => (idx === i ? { ...m, [field]: val } : m)));
  const removeMetric = (i) => set('metrics', form.metrics.filter((_, idx) => idx !== i));

  // ── Validation / navigation ──────────────────────────────────────────────
  const validateStep = (s) => {
    if (s === 1) return form.title.trim().length > 0 && form.category;
    if (s === 2) return form.description.trim().length > 0;
    if (s === 3) return Boolean(coverImage?.url);
    return true;
  };
  const goNext = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, STEPS.length));
    else toast.error(isRTL ? 'يرجى إكمال الحقول المطلوبة قبل المتابعة' : 'Please complete the required fields before continuing');
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (publishNow) => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error(isRTL ? 'العنوان والملخص مطلوبان' : 'Title and description are required');
      setStep(1);
      return;
    }
    if (!coverImage?.url) {
      toast.error(isRTL ? 'صورة الغلاف مطلوبة' : 'Cover image is required');
      setStep(3);
      return;
    }

    setSaving(true);
    setSavingMode(publishNow ? 'publish' : 'draft');
    const payload = {
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      year: form.year ? Number(form.year) : undefined,
      metrics: form.metrics.filter((m) => m.label && m.value),
      coverImage, gallery,
      status: publishNow ? 'published' : form.status,
    };

    try {
      if (isEdit) {
        await api.put(`/portfolio/admin/${id}`, payload);
        toast.success(isRTL ? 'تم تحديث المشروع' : 'Project updated');
      } else {
        await api.post('/portfolio/admin', payload);
        toast.success(isRTL ? 'تم إنشاء المشروع' : 'Project created');
      }
      setTimeout(() => navigate('/app/admin/portfolio'), 400);
    } catch (err) {
      toast.error(err?.response?.data?.error || (isRTL ? 'فشل الحفظ' : 'Save failed'));
      setSaving(false);
      setSavingMode(null);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: TK.bg }}>
        <PageSpinner />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: TK.bg, padding: '32px 32px 60px' }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        <Link
          to="/app/admin/portfolio"
          className="au-back-link"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, color: TK.textMuted, textDecoration: 'none', marginBottom: '16px' }}
        >
          {isRTL ? <ChevronRight style={{ width: '14px', height: '14px' }} /> : <ChevronLeft style={{ width: '14px', height: '14px' }} />}
          {L.portfolio}
        </Link>

        <PageHeader
          title={isEdit ? L.editProject : L.newProject}
          subtitle={isEdit ? L.editSubtitle : L.newSubtitle}
          actions={<Badge tone={STATUS_TONE[form.status] || 'neutral'} dot>{form.status === 'published' ? L.statusPublished : form.status === 'archived' ? L.statusArchived : L.statusDraft}</Badge>}
        />

        <div style={{ marginBottom: '24px' }}>
          <Stepper steps={STEPS} current={step - 1} onStepChange={(i) => setStep(i + 1)} />
        </div>

        <Card padding="24px" style={{ marginBottom: '20px' }}>
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={`${L.title}${enSuffix}`} required>
                  <TextInput required value={form.title} onChange={(e) => set('title', e.target.value)} placeholder={isRTL ? 'اسم المشروع' : 'Project name'} />
                </Field>
                <Field label={`${L.title}${arSuffix}`}>
                  <TextInput value={form.titleAr} onChange={(e) => set('titleAr', e.target.value)} dir="rtl" placeholder="اسم المشروع" />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={L.category} required>
                  <Select value={form.category} onChange={(e) => set('category', e.target.value)} options={CATEGORIES.map((c) => ({ value: c, label: categoryLabel(c, language) }))} />
                </Field>
                <Field label={L.industry}>
                  <TextInput value={form.industry} onChange={(e) => set('industry', e.target.value)} placeholder={L.industryPh} />
                </Field>
              </div>
              <Field label={L.tags}>
                <TextInput value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder={L.tagsPh} />
              </Field>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Field label={L.liveUrl}>
                  <TextInput type="url" value={form.liveUrl} onChange={(e) => set('liveUrl', e.target.value)} placeholder="https://..." />
                </Field>
                <Field label={L.year}>
                  <TextInput type="number" value={form.year} onChange={(e) => set('year', e.target.value)} />
                </Field>
                <Field label={L.duration}>
                  <TextInput value={form.duration} onChange={(e) => set('duration', e.target.value)} placeholder={L.durationPh} />
                </Field>
                <Field label={L.team}>
                  <TextInput value={form.teamSize} onChange={(e) => set('teamSize', e.target.value)} placeholder={L.teamPh} />
                </Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={`${L.summary}${enSuffix}`} required>
                  <TextArea required rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder={L.summaryPh} />
                </Field>
                <Field label={`${L.summary}${arSuffix}`}>
                  <TextArea rows={3} value={form.descriptionAr} onChange={(e) => set('descriptionAr', e.target.value)} dir="rtl" />
                </Field>
              </div>

              {[
                ['challenge', 'challengeAr', L.challenge],
                ['solution', 'solutionAr', L.solution],
                ['process', 'processAr', L.process],
                ['results', 'resultsAr', L.results],
              ].map(([enKey, arKey, title]) => (
                <div key={enKey} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={`${title}${enSuffix}`}>
                    <TextArea rows={3} value={form[enKey]} onChange={(e) => set(enKey, e.target.value)} />
                  </Field>
                  <Field label={`${title}${arSuffix}`}>
                    <TextArea rows={3} value={form[arKey]} onChange={(e) => set(arKey, e.target.value)} dir="rtl" />
                  </Field>
                </div>
              ))}

              {/* Metrics */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: TK.textMuted, letterSpacing: '0.03em', marginBottom: '8px' }}>{L.metrics}</label>
                <div className="space-y-2">
                  {form.metrics.map((m, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px' }}>
                      <TextInput value={m.value} onChange={(e) => updateMetric(i, 'value', e.target.value)} placeholder={L.metricValuePh} containerStyle={{ width: '110px', flexShrink: 0 }} />
                      <TextInput value={m.label} onChange={(e) => updateMetric(i, 'label', e.target.value)} placeholder={L.metricLabelPh} containerStyle={{ flex: 1 }} />
                      <IconButton icon={Trash2} variant="outline" onClick={() => removeMetric(i)} aria-label={isRTL ? 'حذف' : 'Remove'} />
                    </div>
                  ))}
                </div>
                <button
                  onClick={addMetric}
                  className="au-back-link"
                  style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, color: TK.accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
                >
                  <Plus style={{ width: '14px', height: '14px' }} /> {L.addMetric}
                </button>
              </div>

              {/* Testimonial */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: TK.textMuted, letterSpacing: '0.03em', marginBottom: '8px' }}>{L.testimonial}</label>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <TextArea rows={3} value={form.testimonial.quote} onChange={(e) => setTestimonial('quote', e.target.value)} placeholder={`${L.quotePh}${enSuffix}`} />
                    <TextArea rows={3} value={form.testimonial.quoteAr} onChange={(e) => setTestimonial('quoteAr', e.target.value)} dir="rtl" placeholder={`${L.quotePh}${arSuffix}`} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <TextInput value={form.testimonial.author} onChange={(e) => setTestimonial('author', e.target.value)} placeholder={L.authorPh} />
                    <TextInput value={form.testimonial.role} onChange={(e) => setTestimonial('role', e.target.value)} placeholder={`${L.rolePh}${enSuffix}`} />
                    <TextInput value={form.testimonial.roleAr} onChange={(e) => setTestimonial('roleAr', e.target.value)} dir="rtl" placeholder={`${L.rolePh}${arSuffix}`} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: TK.textMuted, letterSpacing: '0.03em', marginBottom: '8px' }}>
                  {L.coverImage}<span style={{ color: TK.red, marginInlineStart: '3px' }}>*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div style={{ position: 'relative', aspectRatio: '16/9', borderRadius: RADIUS.lg, overflow: 'hidden', background: TK.bgSubtle, border: `1px solid ${TK.border}` }}>
                    {coverImage?.url ? (
                      <img src={mediaSrc(coverImage)} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TK.textLight }}>
                        <ImageIcon style={{ width: '22px', height: '22px' }} />
                      </div>
                    )}
                    {pendingUploads.some((u) => u.key === 'cover') && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Spinner />
                      </div>
                    )}
                  </div>
                  <label className="au-upload-tile" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', aspectRatio: '16/9', borderRadius: RADIUS.lg, border: `1.5px dashed ${TK.border}`, cursor: 'pointer' }}>
                    <Upload style={{ width: '18px', height: '18px', color: TK.textLight }} />
                    <span style={{ fontSize: '11.5px', color: TK.textMuted, fontWeight: 500 }}>{coverImage ? L.replaceCover : L.uploadCover}</span>
                    <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverSelect} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: TK.textMuted, letterSpacing: '0.03em', marginBottom: '8px' }}>{L.galleryImages}</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2" style={{ marginBottom: '12px' }}>
                  {gallery.map((img, i) => (
                    <div
                      key={img.publicId || i}
                      draggable
                      onDragStart={() => (dragIdx.current = i)}
                      onDragEnter={() => (dragOverIdx.current = i)}
                      onDragEnd={handleGalleryDrop}
                      onDragOver={(e) => e.preventDefault()}
                      className="group relative"
                      style={{ aspectRatio: '16/9', borderRadius: RADIUS.md, overflow: 'hidden', background: TK.bgSubtle, border: `1px solid ${TK.border}`, cursor: 'grab' }}
                    >
                      <img src={mediaSrc(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ position: 'absolute', top: '5px', insetInlineStart: '5px', width: '18px', height: '18px', borderRadius: RADIUS.sm, background: 'rgba(13,17,23,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <GripVertical style={{ width: '12px', height: '12px', color: '#fff' }} />
                      </div>
                      <button
                        onClick={() => removeGalleryImage(i)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ position: 'absolute', top: '5px', insetInlineEnd: '5px', width: '20px', height: '20px', borderRadius: RADIUS.pill, background: 'rgba(255,255,255,0.95)', border: `1px solid ${TK.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: SHADOW.xs, cursor: 'pointer' }}
                      >
                        <X style={{ width: '11px', height: '11px', color: TK.textMuted }} />
                      </button>
                    </div>
                  ))}
                  {pendingUploads.filter((u) => u.key !== 'cover').map((u) => (
                    <div key={u.key} style={{ position: 'relative', aspectRatio: '16/9', borderRadius: RADIUS.md, background: TK.bgSubtle, border: `1px solid ${TK.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Spinner size={18} />
                      <span style={{ fontSize: '9.5px', color: TK.textLight }}>{u.progress}%</span>
                    </div>
                  ))}
                </div>
                <label className="au-upload-tile" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 16px', borderRadius: RADIUS.md, border: `1.5px dashed ${TK.border}`, cursor: 'pointer', fontSize: '12px', color: TK.textMuted, fontWeight: 500 }}>
                  <Upload style={{ width: '14px', height: '14px' }} /> {L.addGalleryImages}
                  <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleGallerySelect} style={{ display: 'none' }} />
                </label>
                <p style={{ fontSize: '10.5px', color: TK.textLight, marginTop: '8px' }}>{L.dragHint}</p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={L.metaTitle}>
                  <TextInput value={form.metaTitle} onChange={(e) => set('metaTitle', e.target.value)} placeholder={form.title} />
                </Field>
                <Field label={L.metaDescription}>
                  <TextInput value={form.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} placeholder={form.description?.slice(0, 60)} />
                </Field>
              </div>

              <div className="flex flex-wrap items-center gap-8">
                <Switch checked={form.featured} onChange={(v) => set('featured', v)} label={L.featured} />
                <Field label={L.status}>
                  <Select
                    value={form.status}
                    onChange={(e) => set('status', e.target.value)}
                    options={[
                      { value: 'draft', label: L.statusDraft },
                      { value: 'published', label: L.statusPublished },
                      { value: 'archived', label: L.statusArchived },
                    ]}
                  />
                </Field>
              </div>

              {/* Preview summary */}
              <Card padding="16px" style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '112px', height: '80px', flexShrink: 0, borderRadius: RADIUS.md, overflow: 'hidden', background: TK.bgSubtle, border: `1px solid ${TK.borderSoft}` }}>
                  {coverImage?.url && <img src={mediaSrc(coverImage)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: TK.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.title || L.untitled}</p>
                  <p style={{
                    fontSize: '12px', color: TK.textMuted, margin: '5px 0 0',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>{form.description || L.noSummary}</p>
                  <p style={{ fontSize: '10.5px', color: TK.textLight, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '8px 0 0' }}>
                    {categoryLabel(form.category, language)} · {L.galleryCount(gallery.length)}
                  </p>
                </div>
              </Card>
            </div>
          )}
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="secondary" onClick={goBack} disabled={step === 1}>
            {isRTL ? <ChevronRight style={{ width: '14px', height: '14px' }} /> : <ChevronLeft style={{ width: '14px', height: '14px' }} />}
            {L.back}
          </Button>

          {step < STEPS.length ? (
            <Button variant="primary" onClick={goNext}>
              {L.next}
              {isRTL ? <ChevronLeft style={{ width: '14px', height: '14px' }} /> : <ChevronRight style={{ width: '14px', height: '14px' }} />}
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => handleSubmit(false)} disabled={saving} loading={savingMode === 'draft'}>
                {L.saveAsDraft}
              </Button>
              <Button variant="primary" onClick={() => handleSubmit(true)} disabled={saving} loading={savingMode === 'publish'}>
                {isEdit ? L.updateAndPublish : L.publishProject}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioWizard;
