import { useEffect, useState } from 'react';
import {
  Target, MessageCircle, FileText, Users, Percent, Clock, TrendingDown,
  CheckCircle2, ArrowRightLeft,
} from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { TK, RADIUS, PageHeader, Card, Button, StatCard, Select, PageSpinner } from '../admin-ui';

const labelCls = { fontSize: '10.5px', fontWeight: 500, color: TK.textMuted, letterSpacing: '0.09em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' };
const inputStyle = { width: '100%', background: TK.bgSubtle, border: `1px solid ${TK.border}`, color: TK.text, fontSize: '13px', padding: '10px 13px', borderRadius: RADIUS.md, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const subLabel = { fontSize: 9.5, color: TK.textLight, marginBottom: 4, letterSpacing: '.08em', textTransform: 'uppercase' };

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

const LocalizedField = ({ label, valueEn, valueAr, onChangeEn, onChangeAr, placeholderEn, placeholderAr, multiline }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={labelCls}>{label}</label>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
      <div>
        <div style={subLabel}>EN</div>
        {multiline
          ? <textarea rows={2} value={valueEn} onChange={(e) => onChangeEn(e.target.value)} placeholder={placeholderEn} style={{ ...inputStyle, resize: 'vertical' }} />
          : <input value={valueEn} onChange={(e) => onChangeEn(e.target.value)} placeholder={placeholderEn} style={inputStyle} />}
      </div>
      <div>
        <div style={subLabel}>AR</div>
        {multiline
          ? <textarea dir="rtl" rows={2} value={valueAr} onChange={(e) => onChangeAr(e.target.value)} placeholder={placeholderAr} style={{ ...inputStyle, resize: 'vertical' }} />
          : <input dir="rtl" value={valueAr} onChange={(e) => onChangeAr(e.target.value)} placeholder={placeholderAr} style={inputStyle} />}
      </div>
    </div>
  </div>
);

const formatSeconds = (s) => {
  const n = Math.round(s || 0);
  const m = Math.floor(n / 60);
  const r = n % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
};

const AdminStartProject = () => {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/start-project/admin');
      setSettings(data.settings);
    } catch { showToast(ar ? 'فشل تحميل الإعدادات' : 'Failed to load settings', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSettings(); }, []);

  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));
  const setLoc = (field, lang, v) => setSettings((s) => ({ ...s, [field]: { ...s[field], [lang]: v } }));

  const handleSave = async () => {
    if (!settings.whatsappEnabled && !settings.formEnabled) {
      showToast(ar ? 'يجب إبقاء قناة واحدة على الأقل مفعّلة' : 'At least one channel must remain enabled', 'error');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put('/start-project/admin', {
        whatsappEnabled: settings.whatsappEnabled,
        formEnabled: settings.formEnabled,
        whatsappNumber: settings.whatsappNumber,
        whatsappTitle: settings.whatsappTitle,
        whatsappDescription: settings.whatsappDescription,
        whatsappResponseTime: settings.whatsappResponseTime,
        formTitle: settings.formTitle,
        formDescription: settings.formDescription,
        formResponseTime: settings.formResponseTime,
        buttonOrder: settings.buttonOrder,
        defaultOption: settings.defaultOption,
      });
      setSettings(data.settings);
      showToast(ar ? 'تم حفظ الإعدادات ✓' : 'Settings saved ✓');
    } catch (err) {
      showToast(err?.response?.data?.error || (ar ? 'فشل الحفظ' : 'Save failed'), 'error');
    } finally { setSaving(false); }
  };

  if (loading || !settings) {
    return (
      <div style={{ minHeight: '100vh', background: TK.bg }}>
        <PageSpinner />
      </div>
    );
  }

  const { analytics } = settings;
  const stepLabels = ar
    ? ['نوع المشروع', 'فكرتك', 'التفاصيل', 'تواصل معنا']
    : ['Project Type', 'Your Idea', 'Details', 'Contact'];

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
        icon={Target}
        eyebrow={ar ? 'الصفحة الرئيسية' : 'Homepage'}
        title={ar ? 'تدفق بدء المشروع' : 'Start Project Flow'}
        subtitle={ar ? 'شاشة القرار بين واتساب ونموذج طلب المشروع، مع التحليلات' : 'The WhatsApp-vs-Form decision screen shown across the site, plus analytics'}
      />

      {/* Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <StatCard icon={Users} label={ar ? 'مشاهدات شاشة القرار' : 'Decision Views'} value={analytics.decisionViews} tone="info" />
        <StatCard icon={MessageCircle} label={ar ? 'اختاروا واتساب' : 'Chose WhatsApp'} value={analytics.whatsappChosen} sub={`${analytics.whatsappSharePct}%`} tone="success" />
        <StatCard icon={FileText} label={ar ? 'اختاروا النموذج' : 'Chose Form'} value={analytics.formChosen} sub={`${analytics.formSharePct}%`} tone="purple" />
        <StatCard icon={CheckCircle2} label={ar ? 'معدل إكمال النموذج' : 'Form Completion'} value={`${analytics.formCompletionRate}%`} sub={ar ? `${analytics.formCompleted} أكمل` : `${analytics.formCompleted} completed`} tone="success" />
        <StatCard icon={ArrowRightLeft} label={ar ? 'معدل إرسال واتساب' : 'WhatsApp Send Rate'} value={`${analytics.whatsappCompletionRate}%`} sub={ar ? `${analytics.whatsappSubmitted} أُرسل` : `${analytics.whatsappSubmitted} sent`} tone="warning" />
        <StatCard icon={Clock} label={ar ? 'متوسط وقت الإكمال' : 'Avg. Completion Time'} value={formatSeconds(analytics.avgCompletionSeconds)} tone="neutral" />
      </div>

      {/* Step drop-off */}
      <Card style={{ marginBottom: '20px' }}>
        <label style={labelCls}>
          <TrendingDown style={{ width: 12, height: 12, display: 'inline', marginInlineEnd: 6, verticalAlign: '-1px' }} />
          {ar ? 'التسرب لكل خطوة في النموذج' : 'Form Step Drop-off'}
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
          {stepLabels.map((label, i) => {
            const reached = analytics.formStepReached[i] || 0;
            const max = Math.max(...analytics.formStepReached, 1);
            const pct = Math.round((reached / max) * 100);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '90px', fontSize: '11.5px', color: TK.textMuted, flexShrink: 0 }}>{label}</div>
                <div style={{ flex: 1, height: '10px', background: TK.bgSubtle, borderRadius: RADIUS.pill, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: TK.accent, borderRadius: RADIUS.pill, transition: 'width 0.3s' }} />
                </div>
                <div style={{ width: '46px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: TK.text, flexShrink: 0 }}>{reached}</div>
                {i > 0 && (
                  <div style={{ width: '56px', textAlign: 'right', fontSize: '10.5px', color: analytics.dropOffPerStep[i] > 0 ? TK.red : TK.textLight, flexShrink: 0 }}>
                    {analytics.dropOffPerStep[i] > 0 ? `-${analytics.dropOffPerStep[i]}%` : '—'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Channels */}
      <Card style={{ marginBottom: '20px' }}>
        <label style={labelCls}>{ar ? 'القنوات' : 'Channels'}</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
          <Toggle checked={settings.whatsappEnabled} onChange={(v) => set('whatsappEnabled', v)} label={ar ? 'تفعيل خيار واتساب' : 'Enable WhatsApp option'} />
          <Toggle checked={settings.formEnabled} onChange={(v) => set('formEnabled', v)} label={ar ? 'تفعيل خيار نموذج الموقع' : 'Enable website form option'} />
        </div>
        {(!settings.whatsappEnabled || !settings.formEnabled) && (
          <p style={{ fontSize: '11px', color: TK.textLight, marginTop: '10px' }}>
            {ar ? 'عند تفعيل قناة واحدة فقط، سيتم تخطي شاشة الاختيار تلقائيًا.' : 'When only one channel is enabled, the decision screen is skipped automatically.'}
          </p>
        )}
      </Card>

      {/* WhatsApp copy */}
      <Card style={{ marginBottom: '20px' }}>
        <label style={labelCls}>{ar ? 'إعدادات واتساب' : 'WhatsApp Settings'}</label>
        <div style={{ marginTop: '10px', marginBottom: '16px' }}>
          <label style={labelCls}>{ar ? 'رقم واتساب (بصيغة دولية)' : 'WhatsApp Number (international format)'}</label>
          <input value={settings.whatsappNumber} onChange={(e) => set('whatsappNumber', e.target.value)} placeholder="+201090385390" style={inputStyle} />
        </div>
        <LocalizedField
          label={ar ? 'عنوان البطاقة' : 'Card Title'}
          valueEn={settings.whatsappTitle?.en || ''} valueAr={settings.whatsappTitle?.ar || ''}
          onChangeEn={(v) => setLoc('whatsappTitle', 'en', v)} onChangeAr={(v) => setLoc('whatsappTitle', 'ar', v)}
          placeholderEn="Continue on WhatsApp" placeholderAr="تواصل عبر واتساب"
        />
        <LocalizedField
          label={ar ? 'الوصف' : 'Description'}
          valueEn={settings.whatsappDescription?.en || ''} valueAr={settings.whatsappDescription?.ar || ''}
          onChangeEn={(v) => setLoc('whatsappDescription', 'en', v)} onChangeAr={(v) => setLoc('whatsappDescription', 'ar', v)}
          placeholderEn="Talk directly with our team and get a quick response." placeholderAr="تحدث مباشرة مع فريقنا واحصل على رد سريع."
          multiline
        />
        <LocalizedField
          label={ar ? 'الوقت المتوقع للرد' : 'Estimated Response Time'}
          valueEn={settings.whatsappResponseTime?.en || ''} valueAr={settings.whatsappResponseTime?.ar || ''}
          onChangeEn={(v) => setLoc('whatsappResponseTime', 'en', v)} onChangeAr={(v) => setLoc('whatsappResponseTime', 'ar', v)}
          placeholderEn="Usually replies in minutes" placeholderAr="غالباً نرد خلال دقائق"
        />
      </Card>

      {/* Form copy */}
      <Card style={{ marginBottom: '20px' }}>
        <label style={labelCls}>{ar ? 'إعدادات نموذج الموقع' : 'Website Form Settings'}</label>
        <div style={{ marginTop: '10px' }}>
          <LocalizedField
            label={ar ? 'عنوان البطاقة' : 'Card Title'}
            valueEn={settings.formTitle?.en || ''} valueAr={settings.formTitle?.ar || ''}
            onChangeEn={(v) => setLoc('formTitle', 'en', v)} onChangeAr={(v) => setLoc('formTitle', 'ar', v)}
            placeholderEn="Submit a Project Request" placeholderAr="أرسل طلب مشروع"
          />
          <LocalizedField
            label={ar ? 'الوصف' : 'Description'}
            valueEn={settings.formDescription?.en || ''} valueAr={settings.formDescription?.ar || ''}
            onChangeEn={(v) => setLoc('formDescription', 'en', v)} onChangeAr={(v) => setLoc('formDescription', 'ar', v)}
            placeholderEn="Share your project details and receive a structured proposal." placeholderAr="شاركنا تفاصيل مشروعك واحصل على عرض منظم."
            multiline
          />
          <LocalizedField
            label={ar ? 'الوقت المتوقع للإكمال' : 'Estimated Completion Time'}
            valueEn={settings.formResponseTime?.en || ''} valueAr={settings.formResponseTime?.ar || ''}
            onChangeEn={(v) => setLoc('formResponseTime', 'en', v)} onChangeAr={(v) => setLoc('formResponseTime', 'ar', v)}
            placeholderEn="Takes about 2 minutes" placeholderAr="يستغرق حوالي دقيقتين"
          />
        </div>
      </Card>

      {/* Presentation */}
      <Card>
        <label style={labelCls}>{ar ? 'العرض' : 'Presentation'}</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '10px' }}>
          <div>
            <label style={labelCls}>
              <Percent style={{ width: 11, height: 11, display: 'inline', marginInlineEnd: 5, verticalAlign: '-1px' }} />
              {ar ? 'ترتيب الأزرار' : 'Button Order'}
            </label>
            <Select
              value={settings.buttonOrder}
              onChange={(e) => set('buttonOrder', e.target.value)}
              options={[
                { value: 'whatsapp-first', label: ar ? 'واتساب أولاً' : 'WhatsApp first' },
                { value: 'form-first', label: ar ? 'النموذج أولاً' : 'Form first' },
              ]}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={labelCls}>{ar ? 'الخيار الافتراضي (تركيز لوحة المفاتيح)' : 'Default Option (keyboard focus)'}</label>
            <Select
              value={settings.defaultOption || ''}
              onChange={(e) => set('defaultOption', e.target.value || null)}
              options={[
                { value: '', label: ar ? 'بدون تحيّز — الأول في الترتيب' : 'No bias — whichever is first' },
                { value: 'whatsapp', label: ar ? 'واتساب' : 'WhatsApp' },
                { value: 'form', label: ar ? 'النموذج' : 'Form' },
              ]}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <p style={{ fontSize: '11px', color: TK.textLight, marginTop: '10px' }}>
          {ar ? 'كلا الخيارين يظهران بنفس الحجم والوزن البصري دائمًا — هذا الإعداد يتحكم فقط بترتيب العرض والتركيز الافتراضي.' : 'Both options always render with equal size and visual weight — this only controls display order and initial keyboard focus.'}
        </p>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
        <Button variant="primary" size="lg" onClick={handleSave} loading={saving}>{ar ? 'حفظ التغييرات' : 'Save Changes'}</Button>
      </div>
    </div>
  );
};

export default AdminStartProject;
