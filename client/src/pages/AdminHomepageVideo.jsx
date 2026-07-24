import { useState, useEffect, useRef } from 'react';
import {
  Upload, Trash2, Loader, Play, Eye, CheckCircle2, MousePointerClick, Clapperboard, Image as ImageIcon, Film,
} from 'lucide-react';
import api from '../utils/api';
import { mediaSrc } from '../utils/media';
import { TK, RADIUS, FONT, PageHeader, Card, Button, StatCard, ConfirmDialog, Select, PageSpinner } from '../admin-ui';
import { useLanguage } from '../contexts/LanguageContext';

const labelCls = { fontSize: '10.5px', fontWeight: 500, color: TK.textMuted, letterSpacing: '0.09em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' };
const inputStyle = { width: '100%', background: TK.bgSubtle, border: `1px solid ${TK.border}`, color: TK.text, fontSize: '13px', padding: '10px 13px', borderRadius: RADIUS.md, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const sectionTitle = { fontSize: '13px', fontWeight: 600, color: TK.text, margin: '0 0 16px' };

const Toggle = ({ checked, onChange, label }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
    <div onClick={() => onChange(!checked)}
      style={{ width: '38px', height: '20px', borderRadius: RADIUS.pill, transition: 'background 0.2s', flexShrink: 0, background: checked ? TK.accent : TK.border, position: 'relative' }}>
      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: checked ? '20px' : '2px', transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
    </div>
    <span style={{ fontSize: '12px', color: TK.textMuted, fontWeight: 500 }}>{label}</span>
  </label>
);

const Field = ({ label, children, half }) => (
  <div style={half ? {} : { gridColumn: '1 / -1' }}>
    <label style={labelCls}>{label}</label>
    {children}
  </div>
);

const AdminHomepageVideo = () => {
  const { language, isRTL } = useLanguage();
  const font = FONT(isRTL);

  const T = {
    eyebrow:          language === 'ar' ? 'الصفحة الرئيسية' : 'Homepage',
    title:            language === 'ar' ? 'عرض الفيديو' : 'Video Showcase',
    subtitle:         language === 'ar' ? 'قسم فيديو سينمائي مميز في الصفحة الرئيسية — مستقل تمامًا عن المقدمة' : 'Premium cinematic video section on the homepage — fully independent of the intro',
    enabled:          language === 'ar' ? 'مُفعّل' : 'Enabled',
    disabled:         language === 'ar' ? 'معطّل' : 'Disabled',
    views:            language === 'ar' ? 'المشاهدات' : 'Views',
    playCount:        language === 'ar' ? 'عدد التشغيلات' : 'Play Count',
    completionRate:   language === 'ar' ? 'معدل الإكمال' : 'Completion Rate',
    completed:        language === 'ar' ? 'مكتمل' : 'completed',
    ctaClickRate:     language === 'ar' ? 'معدل نقر الدعوة للعمل' : 'CTA Click Rate',
    clicks:           language === 'ar' ? 'نقرة' : 'clicks',
    videoSectionTitle:language === 'ar' ? 'الفيديو' : 'Video',
    videoSource:      language === 'ar' ? 'مصدر الفيديو' : 'Video Source',
    useIntroVideo:    language === 'ar' ? 'استخدام فيديو المقدمة (متزامن مباشرة)' : 'Use Intro Video (reused live)',
    uploadSeparateVideo: language === 'ar' ? 'رفع فيديو منفصل' : 'Upload Separate Video',
    introVideoNote:   language === 'ar' ? 'يعرض هذا القسم حاليًا نفس الفيديو المُعدّ في نظام المقدمة. استبدال فيديو المقدمة سيحدّث هذا القسم تلقائيًا أيضًا.' : 'This section currently plays the same video configured in the Intro System. Replacing the intro video will automatically update this section too.',
    currentFile:      language === 'ar' ? 'الملف الحالي:' : 'Current file:',
    noVideo:          language === 'ar' ? 'لا يوجد فيديو' : 'No video',
    replaceVideo:     language === 'ar' ? 'استبدال الفيديو' : 'Replace video',
    uploadVideo:       language === 'ar' ? 'رفع فيديو' : 'Upload video',
    deleteVideo:      language === 'ar' ? 'حذف الفيديو' : 'Delete video',
    posterImage:      language === 'ar' ? 'صورة الغلاف' : 'Poster Image',
    replacePoster:    language === 'ar' ? 'استبدال الغلاف' : 'Replace poster',
    uploadPoster:     language === 'ar' ? 'رفع غلاف' : 'Upload poster',
    deletePoster:     language === 'ar' ? 'حذف الغلاف' : 'Delete poster',
    contentSectionTitle: language === 'ar' ? 'المحتوى' : 'Content',
    headlineEn:       language === 'ar' ? 'العنوان الرئيسي (إنجليزي)' : 'Headline (EN)',
    headlineAr:       language === 'ar' ? 'العنوان الرئيسي (عربي)' : 'Headline (AR)',
    subtitleEn:       language === 'ar' ? 'العنوان الفرعي (إنجليزي)' : 'Subtitle (EN)',
    subtitleAr:       language === 'ar' ? 'العنوان الفرعي (عربي)' : 'Subtitle (AR)',
    descriptionEn:    language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (EN)',
    descriptionAr:    language === 'ar' ? 'الوصف (عربي)' : 'Description (AR)',
    ctaTextEn:        language === 'ar' ? 'نص الدعوة للعمل (إنجليزي)' : 'CTA Text (EN)',
    ctaTextAr:        language === 'ar' ? 'نص الدعوة للعمل (عربي)' : 'CTA Text (AR)',
    ctaLink:          language === 'ar' ? 'رابط الدعوة للعمل' : 'CTA Link',
    ctaLinkPlaceholder: language === 'ar' ? '/portfolio أو #contact أو https://...' : '/portfolio, #contact, or https://...',
    playbackSectionTitle: language === 'ar' ? 'سلوك التشغيل' : 'Playback Behavior',
    playTrigger:      language === 'ar' ? 'مُشغّل التشغيل' : 'Play Trigger',
    playVisible:      language === 'ar' ? 'التشغيل عند الظهور (التمرير إلى العرض)' : 'Play When Visible (scroll into view)',
    playAutoplay:     language === 'ar' ? 'التشغيل التلقائي فورًا' : 'Autoplay Immediately',
    playClick:        language === 'ar' ? 'التشغيل عند النقر' : 'Play On Click',
    playScroll:       language === 'ar' ? 'التشغيل عند أول تمرير' : 'Play On First Scroll',
    autoplay:         language === 'ar' ? 'تشغيل تلقائي' : 'Autoplay',
    startMuted:       language === 'ar' ? 'بدء بدون صوت' : 'Start Muted',
    loop:             language === 'ar' ? 'تكرار' : 'Loop',
    showControls:     language === 'ar' ? 'إظهار عناصر التحكم' : 'Show Controls',
    showProgress:     language === 'ar' ? 'إظهار شريط التقدم' : 'Show Progress',
    showSoundButton:  language === 'ar' ? 'إظهار زر الصوت' : 'Show Sound Button',
    showFullscreenButton: language === 'ar' ? 'إظهار زر ملء الشاشة' : 'Show Fullscreen Button',
    designSectionTitle: language === 'ar' ? 'التصميم' : 'Design',
    sectionHeight:    language === 'ar' ? 'ارتفاع القسم' : 'Section Height',
    compact:          language === 'ar' ? 'مضغوط' : 'Compact',
    standard:         language === 'ar' ? 'قياسي' : 'Standard',
    large:            language === 'ar' ? 'كبير' : 'Large',
    cinematic:        language === 'ar' ? 'سينمائي (ملء الارتفاع)' : 'Cinematic (full height)',
    backgroundStyle:  language === 'ar' ? 'نمط الخلفية' : 'Background Style',
    dark:             language === 'ar' ? 'داكن' : 'Dark',
    black:            language === 'ar' ? 'أسود' : 'Black',
    light:            language === 'ar' ? 'فاتح' : 'Light',
    gradient:         language === 'ar' ? 'متدرج' : 'Gradient',
    animationStyle:   language === 'ar' ? 'نمط الحركة' : 'Animation Style',
    animCinematic:    language === 'ar' ? 'سينمائي (ضبابية + تكبير)' : 'Cinematic (blur + scale)',
    fade:             language === 'ar' ? 'تلاشي' : 'Fade',
    scale:            language === 'ar' ? 'تكبير' : 'Scale',
    slideUp:          language === 'ar' ? 'انزلاق للأعلى' : 'Slide up',
    shadowStyle:      language === 'ar' ? 'نمط الظل' : 'Shadow Style',
    none:             language === 'ar' ? 'بلا' : 'None',
    soft:             language === 'ar' ? 'ناعم' : 'Soft',
    elevated:         language === 'ar' ? 'مرتفع' : 'Elevated',
    glow:             language === 'ar' ? 'توهج' : 'Glow',
    overlayOpacity:   language === 'ar' ? 'شفافية الطبقة العلوية (%)' : 'Overlay Opacity (%)',
    borderRadius:     language === 'ar' ? 'انحناء الحواف (بكسل)' : 'Border Radius (px)',
    spacing:          language === 'ar' ? 'التباعد' : 'Spacing',
    comfortable:      language === 'ar' ? 'مريح' : 'Comfortable',
    spacious:         language === 'ar' ? 'واسع' : 'Spacious',
    roundedCorners:   language === 'ar' ? 'حواف مستديرة' : 'Rounded Corners',
    glowEffect:       language === 'ar' ? 'تأثير التوهج' : 'Glow Effect',
    marginTop:        language === 'ar' ? 'الهامش العلوي (بكسل)' : 'Margin Top (px)',
    marginBottom:     language === 'ar' ? 'الهامش السفلي (بكسل)' : 'Margin Bottom (px)',
    visibilitySectionTitle: language === 'ar' ? 'الظهور' : 'Visibility',
    hideOnMobile:     language === 'ar' ? 'إخفاء على الجوال' : 'Hide on Mobile',
    hideOnDesktop:    language === 'ar' ? 'إخفاء على سطح المكتب' : 'Hide on Desktop',
    saveChanges:      language === 'ar' ? 'حفظ التغييرات' : 'Save Changes',
    deleteVideoTitle: language === 'ar' ? 'هل تريد حذف هذا الفيديو؟' : 'Delete this video?',
    deleteVideoDesc:  language === 'ar' ? 'سيعود هذا القسم تلقائيًا إلى فيديو المقدمة.' : 'The section will automatically fall back to the intro video.',
    deletePosterTitle: language === 'ar' ? 'هل تريد حذف صورة الغلاف؟' : 'Delete the poster image?',
    deleteLabel:      language === 'ar' ? 'حذف' : 'Delete',
    cancelLabel:      language === 'ar' ? 'إلغاء' : 'Cancel',
    loadFailed:       language === 'ar' ? 'فشل تحميل إعدادات عرض الفيديو' : 'Failed to load video showcase settings',
    saveSuccess:      language === 'ar' ? 'تم حفظ إعدادات عرض الفيديو ✓' : 'Video showcase settings saved ✓',
    saveFailed:       language === 'ar' ? 'فشل الحفظ' : 'Save failed',
    videoUploadSuccess: language === 'ar' ? 'تم رفع الفيديو ✓' : 'Video uploaded ✓',
    uploadFailed:     language === 'ar' ? 'فشل الرفع' : 'Upload failed',
    videoRemoved:     language === 'ar' ? 'تمت إزالة الفيديو — تمت العودة إلى فيديو المقدمة ✓' : 'Video removed — reverted to the intro video ✓',
    deleteFailed:     language === 'ar' ? 'فشل الحذف' : 'Delete failed',
    posterUploadSuccess: language === 'ar' ? 'تم رفع الغلاف ✓' : 'Poster uploaded ✓',
    posterRemoved:    language === 'ar' ? 'تمت إزالة الغلاف ✓' : 'Poster removed ✓',
  };

  const [settings, setSettings] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [uploadingVideo, setUploadingVideo]   = useState(null);
  const [uploadingPoster, setUploadingPoster] = useState(null);
  const [toast, setToast]       = useState(null);
  const [confirmDeleteVideo, setConfirmDeleteVideo]   = useState(false);
  const [confirmDeletePoster, setConfirmDeletePoster] = useState(false);
  const videoInputRef  = useRef(null);
  const posterInputRef = useRef(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/homepage-video/admin');
      setSettings(data.settings);
    } catch { showToast(T.loadFailed, 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchSettings(); }, []);

  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));
  const setLocalized = (field, lang, v) => setSettings((s) => ({ ...s, [field]: { ...s[field], [lang]: v } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/homepage-video/admin', {
        enabled: settings.enabled,
        videoSource: settings.videoSource,
        headline: settings.headline, subtitle: settings.subtitle, description: settings.description,
        ctaText: settings.ctaText, ctaLink: settings.ctaLink,
        autoplay: settings.autoplay, muted: settings.muted, loop: settings.loop, playTrigger: settings.playTrigger,
        showControls: settings.showControls, showProgress: settings.showProgress,
        showSoundButton: settings.showSoundButton, showFullscreenButton: settings.showFullscreenButton,
        sectionHeight: settings.sectionHeight, backgroundStyle: settings.backgroundStyle,
        overlayOpacity: settings.overlayOpacity, animationStyle: settings.animationStyle,
        roundedCorners: settings.roundedCorners, borderRadius: settings.borderRadius,
        shadowStyle: settings.shadowStyle, glowEffect: settings.glowEffect, spacing: settings.spacing,
        marginTop: settings.marginTop, marginBottom: settings.marginBottom,
        hideOnMobile: settings.hideOnMobile, hideOnDesktop: settings.hideOnDesktop,
      });
      setSettings(data.settings);
      showToast(T.saveSuccess);
    } catch (err) {
      showToast(err?.response?.data?.error || T.saveFailed, 'error');
    } finally { setSaving(false); }
  };

  const handleVideoSelect = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const fd = new FormData();
    fd.append('video', file);
    setUploadingVideo(0);
    try {
      const { data } = await api.post('/homepage-video/admin/video', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => setUploadingVideo(evt.total ? Math.round((evt.loaded / evt.total) * 100) : 0),
      });
      setSettings(data.settings);
      showToast(T.videoUploadSuccess);
    } catch (err) {
      showToast(err?.response?.data?.error || T.uploadFailed, 'error');
    } finally { setUploadingVideo(null); }
  };

  const handleDeleteVideo = async () => {
    try {
      const { data } = await api.delete('/homepage-video/admin/video');
      setSettings(data.settings);
      setConfirmDeleteVideo(false);
      showToast(T.videoRemoved);
    } catch { showToast(T.deleteFailed, 'error'); }
  };

  const handlePosterSelect = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const fd = new FormData();
    fd.append('poster', file);
    setUploadingPoster(0);
    try {
      const { data } = await api.post('/homepage-video/admin/poster', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => setUploadingPoster(evt.total ? Math.round((evt.loaded / evt.total) * 100) : 0),
      });
      setSettings(data.settings);
      showToast(T.posterUploadSuccess);
    } catch (err) {
      showToast(err?.response?.data?.error || T.uploadFailed, 'error');
    } finally { setUploadingPoster(null); }
  };

  const handleDeletePoster = async () => {
    try {
      const { data } = await api.delete('/homepage-video/admin/poster');
      setSettings(data.settings);
      setConfirmDeletePoster(false);
      showToast(T.posterRemoved);
    } catch { showToast(T.deleteFailed, 'error'); }
  };

  if (loading || !settings) {
    return <div style={{ minHeight: '100vh', background: TK.bg }}><PageSpinner /></div>;
  }

  const { analytics } = settings;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: TK.bg, padding: '32px 32px 60px', fontFamily: font }}>
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', [isRTL ? 'left' : 'right']: '24px', zIndex: 999, padding: '12px 20px', borderRadius: RADIUS.md,
          fontSize: '13px', fontWeight: 500, border: `1px solid ${toast.type === 'error' ? TK.redBd : TK.accentBd}`,
          background: toast.type === 'error' ? TK.redBg : TK.accentBg, color: toast.type === 'error' ? TK.red : TK.accent,
        }}>
          {toast.msg}
        </div>
      )}

      <PageHeader
        icon={Clapperboard}
        eyebrow={T.eyebrow}
        title={T.title}
        subtitle={T.subtitle}
        actions={<Toggle checked={settings.enabled} onChange={(v) => set('enabled', v)} label={settings.enabled ? T.enabled : T.disabled} />}
      />

      {/* Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <StatCard icon={Eye} label={T.views} value={analytics.views} tone="info" />
        <StatCard icon={Play} label={T.playCount} value={analytics.playCount} tone="purple" />
        <StatCard icon={CheckCircle2} label={T.completionRate} value={`${analytics.completionRate}%`} sub={`${analytics.completions} ${T.completed}`} tone="success" />
        <StatCard icon={MousePointerClick} label={T.ctaClickRate} value={`${analytics.ctr}%`} sub={`${analytics.clicks} ${T.clicks}`} tone="warning" />
      </div>

      {/* Video source + media */}
      <Card style={{ marginBottom: '20px' }}>
        <p style={sectionTitle}>{T.videoSectionTitle}</p>
        <div style={{ marginBottom: '16px', maxWidth: '360px' }}>
          <label style={labelCls}>{T.videoSource}</label>
          <Select
            value={settings.videoSource}
            onChange={(e) => set('videoSource', e.target.value)}
            options={[
              { value: 'intro', label: T.useIntroVideo },
              { value: 'own', label: T.uploadSeparateVideo },
            ]}
            style={{ width: '100%' }}
          />
        </div>

        {settings.videoSource === 'intro' ? (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '14px', background: TK.bgSubtle, border: `1px solid ${TK.border}`, borderRadius: RADIUS.md }}>
            <Film style={{ width: '18px', height: '18px', color: TK.textLight, flexShrink: 0 }} />
            <p style={{ fontSize: '12px', color: TK.textMuted, margin: 0 }}>
              {T.introVideoNote}
              {settings.effectiveVideoUrl && <> {T.currentFile} <code style={{ fontSize: '11px' }}>{settings.effectiveVideoUrl.split('/').pop()}</code></>}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ position: 'relative', aspectRatio: '16/9', background: '#0D1117', border: `1px solid ${TK.border}`, borderRadius: RADIUS.md, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {settings.videoUrl ? (
                <video src={encodeURI(settings.videoUrl)} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{ color: 'rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Play style={{ width: '22px', height: '22px' }} />
                  <span style={{ fontSize: '11px' }}>{T.noVideo}</span>
                </div>
              )}
              {uploadingVideo !== null && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Loader style={{ width: '18px', height: '18px', color: '#fff', animation: 'au-spin 0.8s linear infinite' }} />
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{uploadingVideo}%</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 18px', border: `1px dashed ${TK.border}`, borderRadius: RADIUS.md, cursor: 'pointer', fontSize: '12px', fontWeight: 500, color: TK.textMuted }}>
                <Upload style={{ width: '14px', height: '14px' }} /> {settings.videoUrl ? T.replaceVideo : T.uploadVideo}
                <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleVideoSelect} style={{ display: 'none' }} />
              </label>
              {settings.videoUrl && (
                <Button variant="danger" icon={Trash2} onClick={() => setConfirmDeleteVideo(true)}>{T.deleteVideo}</Button>
              )}
            </div>
          </div>
        )}

        <div style={{ borderTop: `1px solid ${TK.borderSoft}`, marginTop: '20px', paddingTop: '20px' }}>
          <label style={labelCls}>{T.posterImage}</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ position: 'relative', aspectRatio: '16/9', background: TK.bgSubtle, border: `1px solid ${TK.border}`, borderRadius: RADIUS.md, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {settings.poster?.url ? (
                <img src={mediaSrc(settings.poster)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <ImageIcon style={{ width: '20px', height: '20px', color: TK.textLight }} />
              )}
              {uploadingPoster !== null && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Loader style={{ width: '16px', height: '16px', color: '#fff', animation: 'au-spin 0.8s linear infinite' }} />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 18px', border: `1px dashed ${TK.border}`, borderRadius: RADIUS.md, cursor: 'pointer', fontSize: '12px', fontWeight: 500, color: TK.textMuted }}>
                <Upload style={{ width: '14px', height: '14px' }} /> {settings.poster?.url ? T.replacePoster : T.uploadPoster}
                <input ref={posterInputRef} type="file" accept="image/*" onChange={handlePosterSelect} style={{ display: 'none' }} />
              </label>
              {settings.poster?.url && (
                <Button variant="danger" icon={Trash2} onClick={() => setConfirmDeletePoster(true)}>{T.deletePoster}</Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Content */}
      <Card style={{ marginBottom: '20px' }}>
        <p style={sectionTitle}>{T.contentSectionTitle}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label={T.headlineEn} half><input value={settings.headline?.en || ''} onChange={(e) => setLocalized('headline', 'en', e.target.value)} style={inputStyle} /></Field>
          <Field label={T.headlineAr} half><input dir="rtl" value={settings.headline?.ar || ''} onChange={(e) => setLocalized('headline', 'ar', e.target.value)} style={inputStyle} /></Field>

          <Field label={T.subtitleEn} half><input value={settings.subtitle?.en || ''} onChange={(e) => setLocalized('subtitle', 'en', e.target.value)} style={inputStyle} /></Field>
          <Field label={T.subtitleAr} half><input dir="rtl" value={settings.subtitle?.ar || ''} onChange={(e) => setLocalized('subtitle', 'ar', e.target.value)} style={inputStyle} /></Field>

          <Field label={T.descriptionEn} half><textarea rows={3} value={settings.description?.en || ''} onChange={(e) => setLocalized('description', 'en', e.target.value)} style={{ ...inputStyle, resize: 'none' }} /></Field>
          <Field label={T.descriptionAr} half><textarea rows={3} dir="rtl" value={settings.description?.ar || ''} onChange={(e) => setLocalized('description', 'ar', e.target.value)} style={{ ...inputStyle, resize: 'none' }} /></Field>

          <Field label={T.ctaTextEn} half><input value={settings.ctaText?.en || ''} onChange={(e) => setLocalized('ctaText', 'en', e.target.value)} style={inputStyle} /></Field>
          <Field label={T.ctaTextAr} half><input dir="rtl" value={settings.ctaText?.ar || ''} onChange={(e) => setLocalized('ctaText', 'ar', e.target.value)} style={inputStyle} /></Field>

          <Field label={T.ctaLink}><input value={settings.ctaLink || ''} onChange={(e) => set('ctaLink', e.target.value)} placeholder={T.ctaLinkPlaceholder} style={inputStyle} /></Field>
        </div>
      </Card>

      {/* Playback behavior */}
      <Card style={{ marginBottom: '20px' }}>
        <p style={sectionTitle}>{T.playbackSectionTitle}</p>
        <div style={{ maxWidth: '320px', marginBottom: '18px' }}>
          <label style={labelCls}>{T.playTrigger}</label>
          <Select
            value={settings.playTrigger}
            onChange={(e) => set('playTrigger', e.target.value)}
            options={[
              { value: 'visible', label: T.playVisible },
              { value: 'autoplay', label: T.playAutoplay },
              { value: 'click', label: T.playClick },
              { value: 'scroll', label: T.playScroll },
            ]}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          <Toggle checked={settings.autoplay} onChange={(v) => set('autoplay', v)} label={T.autoplay} />
          <Toggle checked={settings.muted} onChange={(v) => set('muted', v)} label={T.startMuted} />
          <Toggle checked={settings.loop} onChange={(v) => set('loop', v)} label={T.loop} />
        </div>
        <div style={{ borderTop: `1px solid ${TK.borderSoft}`, marginTop: '20px', paddingTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          <Toggle checked={settings.showControls} onChange={(v) => set('showControls', v)} label={T.showControls} />
          <Toggle checked={settings.showProgress} onChange={(v) => set('showProgress', v)} label={T.showProgress} />
          <Toggle checked={settings.showSoundButton} onChange={(v) => set('showSoundButton', v)} label={T.showSoundButton} />
          <Toggle checked={settings.showFullscreenButton} onChange={(v) => set('showFullscreenButton', v)} label={T.showFullscreenButton} />
        </div>
      </Card>

      {/* Design */}
      <Card style={{ marginBottom: '20px' }}>
        <p style={sectionTitle}>{T.designSectionTitle}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
          <Field label={T.sectionHeight} half>
            <Select value={settings.sectionHeight} onChange={(e) => set('sectionHeight', e.target.value)}
              options={[{ value: 'compact', label: T.compact }, { value: 'standard', label: T.standard }, { value: 'large', label: T.large }, { value: 'cinematic', label: T.cinematic }]}
              style={{ width: '100%' }} />
          </Field>
          <Field label={T.backgroundStyle} half>
            <Select value={settings.backgroundStyle} onChange={(e) => set('backgroundStyle', e.target.value)}
              options={[{ value: 'dark', label: T.dark }, { value: 'black', label: T.black }, { value: 'light', label: T.light }, { value: 'gradient', label: T.gradient }]}
              style={{ width: '100%' }} />
          </Field>
          <Field label={T.animationStyle} half>
            <Select value={settings.animationStyle} onChange={(e) => set('animationStyle', e.target.value)}
              options={[{ value: 'cinematic', label: T.animCinematic }, { value: 'fade', label: T.fade }, { value: 'scale', label: T.scale }, { value: 'slide', label: T.slideUp }]}
              style={{ width: '100%' }} />
          </Field>
          <Field label={T.shadowStyle} half>
            <Select value={settings.shadowStyle} onChange={(e) => set('shadowStyle', e.target.value)}
              options={[{ value: 'none', label: T.none }, { value: 'soft', label: T.soft }, { value: 'elevated', label: T.elevated }, { value: 'glow', label: T.glow }]}
              style={{ width: '100%' }} />
          </Field>
          <Field label={T.overlayOpacity} half>
            <input type="number" min={0} max={100} value={settings.overlayOpacity} onChange={(e) => set('overlayOpacity', Number(e.target.value))} style={inputStyle} />
          </Field>
          <Field label={T.borderRadius} half>
            <input type="number" min={0} max={64} value={settings.borderRadius} onChange={(e) => set('borderRadius', Number(e.target.value))} disabled={!settings.roundedCorners} style={{ ...inputStyle, opacity: settings.roundedCorners ? 1 : 0.5 }} />
          </Field>
          <Field label={T.spacing} half>
            <Select value={settings.spacing} onChange={(e) => set('spacing', e.target.value)}
              options={[{ value: 'compact', label: T.compact }, { value: 'comfortable', label: T.comfortable }, { value: 'spacious', label: T.spacious }]}
              style={{ width: '100%' }} />
          </Field>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px' }}>
            <Toggle checked={settings.roundedCorners} onChange={(v) => set('roundedCorners', v)} label={T.roundedCorners} />
            <Toggle checked={settings.glowEffect} onChange={(v) => set('glowEffect', v)} label={T.glowEffect} />
          </div>
          <Field label={T.marginTop} half>
            <input type="number" min={0} max={400} value={settings.marginTop} onChange={(e) => set('marginTop', Number(e.target.value))} style={inputStyle} />
          </Field>
          <Field label={T.marginBottom} half>
            <input type="number" min={0} max={400} value={settings.marginBottom} onChange={(e) => set('marginBottom', Number(e.target.value))} style={inputStyle} />
          </Field>
        </div>
      </Card>

      {/* Visibility */}
      <Card style={{ marginBottom: '20px' }}>
        <p style={sectionTitle}>{T.visibilitySectionTitle}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          <Toggle checked={settings.hideOnMobile} onChange={(v) => set('hideOnMobile', v)} label={T.hideOnMobile} />
          <Toggle checked={settings.hideOnDesktop} onChange={(v) => set('hideOnDesktop', v)} label={T.hideOnDesktop} />
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" size="lg" onClick={handleSave} loading={saving}>{T.saveChanges}</Button>
      </div>

      <ConfirmDialog
        open={confirmDeleteVideo}
        onClose={() => setConfirmDeleteVideo(false)}
        onConfirm={handleDeleteVideo}
        title={T.deleteVideoTitle}
        description={T.deleteVideoDesc}
        confirmLabel={T.deleteLabel}
        cancelLabel={T.cancelLabel}
      />
      <ConfirmDialog
        open={confirmDeletePoster}
        onClose={() => setConfirmDeletePoster(false)}
        onConfirm={handleDeletePoster}
        title={T.deletePosterTitle}
        confirmLabel={T.deleteLabel}
        cancelLabel={T.cancelLabel}
      />
    </div>
  );
};

export default AdminHomepageVideo;
