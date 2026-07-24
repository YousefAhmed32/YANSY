import { useEffect, useState, useCallback } from 'react';
import { Settings, Save, RefreshCw, Shield, Cpu, Globe, CreditCard, FileText, Zap, ToggleLeft, ToggleRight, AlertCircle, Loader2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { TK, RADIUS, PageHeader, Card, Button, EmptyState } from '../admin-ui';

const categoryMeta = (language) => ({
  general:  { label: language === 'ar' ? 'عام' : 'General',        icon: Globe,      color: '#60a5fa' },
  platform: { label: language === 'ar' ? 'المنصة' : 'Platform',       icon: Settings,   color: TK.accent },
  security: { label: language === 'ar' ? 'الأمان' : 'Security',       icon: Shield,     color: TK.red },
  ai:       { label: language === 'ar' ? 'الذكاء الاصطناعي و Claude' : 'AI & Claude',    icon: Cpu,        color: '#a78bfa' },
  features: { label: language === 'ar' ? 'مزايا التبديل' : 'Feature Flags',  icon: Zap,        color: TK.green },
  payments: { label: language === 'ar' ? 'المدفوعات' : 'Payments',       icon: CreditCard, color: '#fb923c' },
  files:    { label: language === 'ar' ? 'تخزين الملفات' : 'File Storage',   icon: FileText,   color: '#38bdf8' },
  email:    { label: language === 'ar' ? 'البريد الإلكتروني' : 'Email',          icon: FileText,   color: '#f472b6' },
});

const SettingField = ({ setting, onSave, language }) => {
  const [value, setValue] = useState(setting.value);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(setting.key, value);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  if (setting.type === 'boolean') {
    const isOn = Boolean(value);
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${TK.borderSoft}` }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12.5px', fontWeight: 500, color: TK.text }}>{setting.label}</div>
          {setting.description && <div style={{ fontSize: '10.5px', color: TK.textMuted, marginTop: '2px' }}>{setting.description}</div>}
        </div>
        <button
          onClick={async () => { const next = !isOn; setValue(next); await onSave(setting.key, next); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: isOn ? TK.green : TK.textMuted, transition: 'color 0.2s' }}
          title={language === 'ar' ? (isOn ? 'انقر للتعطيل' : 'انقر للتفعيل') : (isOn ? 'Click to disable' : 'Click to enable')}
        >
          {isOn ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 0', borderBottom: `1px solid ${TK.borderSoft}` }}>
      <div style={{ marginBottom: '6px' }}>
        <div style={{ fontSize: '12.5px', fontWeight: 500, color: TK.text }}>{setting.label}</div>
        {setting.description && <div style={{ fontSize: '10.5px', color: TK.textMuted, marginTop: '1px' }}>{setting.description}</div>}
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {setting.type === 'number' ? (
          <input
            type="number"
            value={value}
            onChange={e => { setValue(Number(e.target.value)); setDirty(true); }}
            style={{ flex: 1, padding: '7px 10px', background: TK.bgSubtle, border: `1px solid ${dirty ? TK.accentBd : TK.border}`, borderRadius: RADIUS.sm, color: TK.text, fontSize: '12px', outline: 'none', transition: 'border-color 0.2s' }}
          />
        ) : (
          <textarea
            value={value || ''}
            onChange={e => { setValue(e.target.value); setDirty(true); }}
            rows={String(value || '').length > 80 ? 3 : 1}
            style={{ flex: 1, padding: '7px 10px', background: TK.bgSubtle, resize: 'vertical', border: `1px solid ${dirty ? TK.accentBd : TK.border}`, borderRadius: RADIUS.sm, color: TK.text, fontSize: '12px', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit' }}
          />
        )}
        {dirty && (
          <Button variant="secondary" size="sm" icon={Save} onClick={handleSave} loading={saving}>{language === 'ar' ? 'حفظ' : 'Save'}</Button>
        )}
      </div>
    </div>
  );
};

const AdminSettings = () => {
  const { language } = useLanguage();
  const CATEGORY_META = categoryMeta(language);
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('general');
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/settings');
      setGrouped(res.data.grouped || {});
    } catch (err) {
      toast.error(language === 'ar' ? 'فشل تحميل الإعدادات' : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async (key, value) => {
    try {
      await api.patch(`/admin/settings/${key}`, { value });
      setGrouped(prev => {
        const next = { ...prev };
        for (const cat of Object.keys(next)) {
          next[cat] = next[cat].map(s => s.key === key ? { ...s, value } : s);
        }
        return next;
      });
      toast.success(language === 'ar' ? `تم الحفظ: ${key}` : `Saved: ${key}`);
    } catch (err) {
      toast.error(err.response?.data?.error || (language === 'ar' ? 'فشل حفظ الإعداد' : 'Failed to save setting'));
      throw err;
    }
  };

  const handleSeed = async () => {
    setSaving(true);
    try {
      const res = await api.post('/admin/settings/seed');
      toast.success(language === 'ar' ? `تمت تهيئة ${res.data.results?.length || 0} إعداد` : `Seeded ${res.data.results?.length || 0} settings`);
      fetchSettings();
    } catch (err) {
      toast.error(err.response?.data?.error || (language === 'ar' ? 'فشلت التهيئة' : 'Seed failed'));
    } finally {
      setSaving(false);
    }
  };

  const categories = Object.keys(CATEGORY_META).filter(c => grouped[c]?.length > 0);
  const currentSettings = grouped[activeCategory] || [];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: TK.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ width: '28px', height: '28px', color: TK.accent, animation: 'au-spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: TK.bg, padding: '32px 32px 60px' }}>

      <PageHeader
        icon={Settings}
        eyebrow={language === 'ar' ? 'إعدادات النظام' : 'System Configuration'}
        title={language === 'ar' ? 'مركز الإعدادات' : 'Settings Center'}
        subtitle={language === 'ar'
          ? `${Object.values(grouped).reduce((s, arr) => s + arr.length, 0)} إعداد عبر ${categories.length} فئة`
          : `${Object.values(grouped).reduce((s, arr) => s + arr.length, 0)} settings across ${categories.length} categories`}
        actions={<Button variant="secondary" icon={RefreshCw} onClick={handleSeed} loading={saving}>{language === 'ar' ? 'تهيئة الافتراضيات' : 'Seed Defaults'}</Button>}
      />

      {categories.length === 0 ? (
        <Card>
          <EmptyState icon={AlertCircle} title={language === 'ar' ? 'لا توجد إعدادات.' : 'No settings found.'} subtitle={language === 'ar' ? 'انقر على "تهيئة الافتراضيات" للبدء.' : 'Click "Seed Defaults" to initialize.'} />
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '20px' }}>
          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {categories.map(cat => {
              const meta = CATEGORY_META[cat];
              const Icon = meta.icon;
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="au-row"
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: RADIUS.md, textAlign: 'left', background: isActive ? `${meta.color}12` : 'transparent', border: `1px solid ${isActive ? `${meta.color}30` : 'transparent'}`, color: isActive ? meta.color : TK.textMuted, fontSize: '12px', fontWeight: isActive ? 600 : 400, cursor: 'pointer', width: '100%' }}
                >
                  <Icon size={14} />
                  {meta.label}
                  <span style={{ marginLeft: 'auto', fontSize: '10px', opacity: 0.6 }}>{grouped[cat]?.length || 0}</span>
                </button>
              );
            })}
          </div>

          {/* Settings Panel */}
          <Card padding="24px">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '16px', borderBottom: `1px solid ${TK.border}` }}>
              {(() => { const meta = CATEGORY_META[activeCategory]; const Icon = meta?.icon || Settings; return <Icon size={16} style={{ color: meta?.color || TK.accent }} />; })()}
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: TK.text, margin: 0 }}>
                {CATEGORY_META[activeCategory]?.label || activeCategory}
              </h2>
              <span style={{ fontSize: '10px', color: TK.textMuted, marginLeft: 'auto' }}>{language === 'ar' ? `${currentSettings.length} إعداد` : `${currentSettings.length} settings`}</span>
            </div>
            {currentSettings.map(s => (
              <SettingField key={s.key} setting={s} onSave={handleSave} language={language} />
            ))}
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
