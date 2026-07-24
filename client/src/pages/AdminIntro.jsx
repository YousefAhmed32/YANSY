import { useState, useEffect, useRef } from 'react';
import {
  Upload, Trash2, Loader, Play, Eye, CheckCircle2, SkipForward, Clock, Film, MousePointerClick,
} from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { TK, RADIUS, PageHeader, Card, Button, StatCard, ConfirmDialog, Select, PageSpinner } from '../admin-ui';

const labelCls = { fontSize: '10.5px', fontWeight: 500, color: TK.textMuted, letterSpacing: '0.09em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' };
const inputStyle = { width: '100%', background: TK.bgSubtle, border: `1px solid ${TK.border}`, color: TK.text, fontSize: '13px', padding: '10px 13px', borderRadius: RADIUS.md, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };

const Toggle = ({ checked, onChange, label }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
    <div
      onClick={() => onChange(!checked)}
      style={{ width: '38px', height: '20px', borderRadius: RADIUS.pill, transition: 'background 0.2s', flexShrink: 0, background: checked ? TK.accent : TK.border, position: 'relative' }}
    >
      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: checked ? '20px' : '2px', transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
    </div>
    <span style={{ fontSize: '12px', color: TK.textMuted, fontWeight: 500 }}>{label}</span>
  </label>
);

const formatWatchTime = (seconds) => {
  const s = Math.round(seconds || 0);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
};

const AdminIntro = () => {
  const { language } = useLanguage();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(null); // progress 0-100 or null
  const [deleting, setDeleting]   = useState(false);
  const [toast, setToast]         = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const videoInputRef = useRef(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/intro/admin');
      setSettings(data.settings);
    } catch { showToast(language === 'ar' ? 'فشل تحميل إعدادات المقدمة' : 'Failed to load intro settings', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSettings(); }, []);

  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/intro/admin', {
        enabled: settings.enabled,
        deviceMode: settings.deviceMode,
        playMode: settings.playMode,
        loop: settings.loop,
        waitForInteraction: settings.waitForInteraction,
        autoplayMuted: settings.autoplayMuted,
        playWithSound: settings.playWithSound,
        skipEnabled: settings.skipEnabled,
        skipDelaySeconds: settings.skipDelaySeconds,
        fadeDurationMs: settings.fadeDurationMs,
        transitionDurationMs: settings.transitionDurationMs,
      });
      setSettings(data.settings);
      showToast(language === 'ar' ? 'تم حفظ إعدادات المقدمة ✓' : 'Intro settings saved ✓');
    } catch (err) {
      showToast(err?.response?.data?.error || (language === 'ar' ? 'فشل الحفظ' : 'Save failed'), 'error');
    } finally { setSaving(false); }
  };

  const handleVideoSelect = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    const fd = new FormData();
    fd.append('video', file);
    setUploading(0);
    try {
      const { data } = await api.post('/intro/admin/video', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => setUploading(evt.total ? Math.round((evt.loaded / evt.total) * 100) : 0),
      });
      setSettings(data.settings);
      showToast(language === 'ar' ? 'تم رفع الفيديو ✓' : 'Video uploaded ✓');
    } catch (err) {
      showToast(err?.response?.data?.error || (language === 'ar' ? 'فشل الرفع' : 'Upload failed'), 'error');
    } finally { setUploading(null); }
  };

  const handleDeleteVideo = async () => {
    setDeleting(true);
    try {
      const { data } = await api.delete('/intro/admin/video');
      setSettings(data.settings);
      setConfirmDelete(false);
      showToast(language === 'ar' ? 'تم حذف الفيديو ✓' : 'Video removed ✓');
    } catch { showToast(language === 'ar' ? 'فشل الحذف' : 'Delete failed', 'error'); }
    finally { setDeleting(false); }
  };

  if (loading || !settings) {
    return (
      <div style={{ minHeight: '100vh', background: TK.bg }}>
        <PageSpinner />
      </div>
    );
  }

  const { analytics } = settings;

  return (
    <div style={{ minHeight: '100vh', background: TK.bg, padding: '32px 32px 60px' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 999, padding: '12px 20px', borderRadius: RADIUS.md,
          fontSize: '13px', fontWeight: 500, border: `1px solid ${toast.type === 'error' ? TK.redBd : TK.accentBd}`,
          background: toast.type === 'error' ? TK.redBg : TK.accentBg, color: toast.type === 'error' ? TK.red : TK.accent,
        }}>
          {toast.msg}
        </div>
      )}

      <PageHeader
        icon={Film}
        eyebrow={language === 'ar' ? 'الصفحة الرئيسية' : 'Homepage'}
        title={language === 'ar' ? 'نظام المقدمة' : 'Intro System'}
        subtitle={language === 'ar' ? 'مقطع افتتاحي سينمائي يظهر عند أول زيارة للصفحة الرئيسية' : 'Cinematic opening sequence shown on first visit to the homepage'}
        actions={<Toggle checked={settings.enabled} onChange={(v) => set('enabled', v)} label={language === 'ar' ? (settings.enabled ? 'مفعّل' : 'معطّل') : (settings.enabled ? 'Enabled' : 'Disabled')} />}
      />

      {/* Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <StatCard icon={Eye} label={language === 'ar' ? 'المشاهدات' : 'Views'} value={analytics.views} tone="info" />
        <StatCard icon={CheckCircle2} label={language === 'ar' ? 'معدل الإكمال' : 'Completion Rate'} value={`${analytics.completionRate}%`} sub={language === 'ar' ? `${analytics.completions} اكتمل` : `${analytics.completions} completed`} tone="success" />
        <StatCard icon={SkipForward} label={language === 'ar' ? 'معدل التخطي' : 'Skip Rate'} value={`${analytics.skipRate}%`} sub={language === 'ar' ? `${analytics.skips} تم تخطيه` : `${analytics.skips} skipped`} tone="warning" />
        <StatCard icon={Clock} label={language === 'ar' ? 'متوسط وقت المشاهدة' : 'Avg. Watch Time'} value={formatWatchTime(analytics.avgWatchSeconds)} tone="purple" />
      </div>

      {/* Video */}
      <Card style={{ marginBottom: '20px' }}>
        <label style={labelCls}>{language === 'ar' ? 'فيديو المقدمة' : 'Intro Video'}</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ position: 'relative', aspectRatio: '16/9', background: '#0D1117', border: `1px solid ${TK.border}`, borderRadius: RADIUS.md, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {settings.videoUrl ? (
              <video src={encodeURI(settings.videoUrl)} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Play style={{ width: '22px', height: '22px' }} />
                <span style={{ fontSize: '11px' }}>{language === 'ar' ? 'لا يوجد فيديو' : 'No video'}</span>
              </div>
            )}
            {uploading !== null && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Loader style={{ width: '18px', height: '18px', color: '#fff', animation: 'au-spin 0.8s linear infinite' }} />
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{uploading}%</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 18px', border: `1px dashed ${TK.border}`, borderRadius: RADIUS.md, cursor: 'pointer', fontSize: '12px', fontWeight: 500, color: TK.textMuted, transition: 'border-color 0.15s' }}>
              <Upload style={{ width: '14px', height: '14px' }} /> {settings.videoUrl ? (language === 'ar' ? 'استبدال الفيديو' : 'Replace video') : (language === 'ar' ? 'رفع فيديو' : 'Upload video')}
              <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleVideoSelect} style={{ display: 'none' }} />
            </label>
            {settings.videoUrl && (
              <Button variant="danger" icon={Trash2} onClick={() => setConfirmDelete(true)}>{language === 'ar' ? 'حذف الفيديو' : 'Delete video'}</Button>
            )}
            <p style={{ fontSize: '10.5px', color: TK.textLight, margin: 0 }}>{language === 'ar' ? 'MP4 أو WebM أو MOV. يتم تحسين الفيديوهات المرفوعة وتسليمها عبر شبكة CDN تلقائيًا في بيئة الإنتاج.' : 'MP4, WebM or MOV. Uploaded videos are optimized and CDN-delivered automatically in production.'}</p>
          </div>
        </div>
      </Card>

      {/* Playback mode */}
      <Card style={{ marginBottom: '20px' }}>
        <label style={labelCls}>{language === 'ar' ? 'وضع التشغيل' : 'Playback Mode'}</label>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px', borderRadius: RADIUS.md, background: settings.waitForInteraction ? TK.accentBg : TK.bgSubtle, border: `1px solid ${settings.waitForInteraction ? TK.accentBd : TK.border}` }}>
          <MousePointerClick style={{ width: '18px', height: '18px', color: settings.waitForInteraction ? TK.accent : TK.textLight, flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <Toggle checked={settings.waitForInteraction} onChange={(v) => set('waitForInteraction', v)} label={language === 'ar' ? 'الانتظار حتى أول تفاعل من المستخدم' : 'Wait for first user interaction'} />
            <p style={{ fontSize: '11px', color: TK.textLight, margin: '8px 0 0' }}>
              {language === 'ar'
                ? 'بدون تشغيل تلقائي من المتصفح. تعرض المقدمة شاشة سوداء وتقوم بتحميل الفيديو بصمت، ثم تبدأ تشغيله — مع الصوت — فور أن ينقر الزائر أو يلمس أو يحرك الفأرة أو يمرّر أو يضغط مفتاحًا. هذه هي الطريقة الوحيدة لضمان تشغيل الصوت.'
                : 'No browser autoplay. The intro shows black, silently preloads the video, and starts it — with sound — the instant the visitor clicks, taps, moves the mouse, scrolls, or presses a key. This is the only way to guarantee audio plays.'}
            </p>
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          {settings.waitForInteraction ? (
            <Toggle
              checked={settings.playWithSound}
              onChange={(v) => set('playWithSound', v)}
              label={language === 'ar' ? 'التشغيل مع الصوت بعد التفاعل' : 'Play with sound after interaction'}
            />
          ) : (
            <Toggle
              checked={settings.autoplayMuted}
              onChange={(v) => set('autoplayMuted', v)}
              label={language === 'ar' ? 'تشغيل تلقائي بدون صوت (موصى به — المتصفحات تمنع التشغيل التلقائي المصحوب بصوت)' : 'Autoplay muted (recommended — browsers block audible autoplay)'}
            />
          )}
        </div>
      </Card>

      {/* Targeting & behavior */}
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={labelCls}>{language === 'ar' ? 'استهداف الأجهزة' : 'Device Targeting'}</label>
            <Select
              value={settings.deviceMode}
              onChange={(e) => set('deviceMode', e.target.value)}
              options={[
                { value: 'both', label: language === 'ar' ? 'سطح المكتب والجوال معًا' : 'Both desktop & mobile' },
                { value: 'desktop', label: language === 'ar' ? 'سطح المكتب فقط' : 'Desktop only' },
                { value: 'mobile', label: language === 'ar' ? 'الجوال فقط' : 'Mobile only' },
              ]}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={labelCls}>{language === 'ar' ? 'تكرار التشغيل' : 'Play Frequency'}</label>
            <Select
              value={settings.playMode}
              onChange={(e) => set('playMode', e.target.value)}
              options={[
                { value: 'always', label: language === 'ar' ? 'تشغيل في كل زيارة' : 'Play Every Visit' },
                { value: 'once-per-session', label: language === 'ar' ? 'تشغيل مرة واحدة لكل جلسة' : 'Play Once Per Session' },
              ]}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <Toggle checked={settings.loop} onChange={(v) => set('loop', v)} label={language === 'ar' ? 'تكرار الفيديو أثناء ظهور المقدمة' : 'Loop video while intro is on screen'} />

        <div style={{ borderTop: `1px solid ${TK.borderSoft}`, marginTop: '24px', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Toggle checked={settings.skipEnabled} onChange={(v) => set('skipEnabled', v)} label={language === 'ar' ? 'إظهار زر التخطي' : 'Show skip button'} />
          {settings.skipEnabled && (
            <div style={{ maxWidth: '200px' }}>
              <label style={labelCls}>{language === 'ar' ? 'يظهر زر التخطي بعد (ثوانٍ)' : 'Skip appears after (seconds)'}</label>
              <input type="number" min={0} max={30} value={settings.skipDelaySeconds}
                onChange={(e) => set('skipDelaySeconds', Number(e.target.value))} style={inputStyle} />
            </div>
          )}
        </div>

        <div style={{ borderTop: `1px solid ${TK.borderSoft}`, marginTop: '24px', paddingTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelCls}>{language === 'ar' ? 'مدة التلاشي الداخل (مللي ثانية)' : 'Fade-in duration (ms)'}</label>
            <input type="number" min={0} max={5000} step={50} value={settings.fadeDurationMs}
              onChange={(e) => set('fadeDurationMs', Number(e.target.value))} style={inputStyle} />
          </div>
          <div>
            <label style={labelCls}>{language === 'ar' ? 'مدة انتقال الخروج (مللي ثانية)' : 'Exit transition duration (ms)'}</label>
            <input type="number" min={0} max={5000} step={50} value={settings.transitionDurationMs}
              onChange={(e) => set('transitionDurationMs', Number(e.target.value))} style={inputStyle} />
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
        <Button variant="primary" size="lg" onClick={handleSave} loading={saving}>{language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}</Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDeleteVideo}
        loading={deleting}
        title={language === 'ar' ? 'حذف فيديو المقدمة؟' : 'Delete intro video?'}
        description={language === 'ar' ? 'سيتم تعطيل المقدمة حتى يتم رفع فيديو جديد.' : 'The intro will be disabled until a new one is uploaded.'}
        confirmLabel={language === 'ar' ? 'حذف' : 'Delete'}
      />
    </div>
  );
};

export default AdminIntro;
