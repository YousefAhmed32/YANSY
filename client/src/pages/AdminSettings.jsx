import { useEffect, useState, useCallback } from 'react';
import { Settings, Save, RefreshCw, Shield, Cpu, Globe, CreditCard, FileText, Zap, ToggleLeft, ToggleRight, AlertCircle, Loader2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const TK = {
  bg:        '#F6F7F9',
  surface:   '#FFFFFF',
  border:    '#E8EBF0',
  accent:    '#2563EB',
  text:      '#0D1117',
  textMuted: '#6B7280',
  inputBg:   'rgba(0,0,0,0.03)',
  divider:   'rgba(0,0,0,0.05)',
};

const CATEGORY_META = {
  general:  { label: 'General',        icon: Globe,      color: '#60a5fa' },
  platform: { label: 'Platform',       icon: Settings,   color: '#2563EB' },
  security: { label: 'Security',       icon: Shield,     color: '#f87171' },
  ai:       { label: 'AI & Claude',    icon: Cpu,        color: '#a78bfa' },
  features: { label: 'Feature Flags',  icon: Zap,        color: '#34d399' },
  payments: { label: 'Payments',       icon: CreditCard, color: '#fb923c' },
  files:    { label: 'File Storage',   icon: FileText,   color: '#38bdf8' },
  email:    { label: 'Email',          icon: FileText,   color: '#f472b6' },
};

const SettingField = ({ setting, onSave }) => {
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${TK.divider}` }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: 300, color: TK.text }}>{setting.label}</div>
          {setting.description && <div style={{ fontSize: '10px', color: TK.textMuted, marginTop: '2px' }}>{setting.description}</div>}
        </div>
        <button
          onClick={async () => { const next = !isOn; setValue(next); await onSave(setting.key, next); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: isOn ? '#34d399' : TK.textMuted, transition: 'color 0.2s' }}
          title={isOn ? 'Click to disable' : 'Click to enable'}
        >
          {isOn ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 0', borderBottom: `1px solid ${TK.divider}` }}>
      <div style={{ marginBottom: '6px' }}>
        <div style={{ fontSize: '12px', fontWeight: 300, color: TK.text }}>{setting.label}</div>
        {setting.description && <div style={{ fontSize: '10px', color: TK.textMuted, marginTop: '1px' }}>{setting.description}</div>}
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {setting.type === 'number' ? (
          <input
            type="number"
            value={value}
            onChange={e => { setValue(Number(e.target.value)); setDirty(true); }}
            style={{ flex: 1, padding: '7px 10px', background: TK.inputBg, border: `1px solid ${dirty ? 'rgba(37,99,235,0.5)' : TK.border}`, borderRadius: '7px', color: TK.text, fontSize: '12px', outline: 'none', transition: 'border-color 0.2s' }}
          />
        ) : (
          <textarea
            value={value || ''}
            onChange={e => { setValue(e.target.value); setDirty(true); }}
            rows={String(value || '').length > 80 ? 3 : 1}
            style={{ flex: 1, padding: '7px 10px', background: TK.inputBg, resize: 'vertical', border: `1px solid ${dirty ? 'rgba(37,99,235,0.5)' : TK.border}`, borderRadius: '7px', color: TK.text, fontSize: '12px', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit' }}
          />
        )}
        {dirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '7px 14px', background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.4)', borderRadius: '7px', color: TK.accent, fontSize: '11px', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}
          >
            {saving ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={12} />}
            Save
          </button>
        )}
      </div>
    </div>
  );
};

const AdminSettings = () => {
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
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

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
      toast.success(`Saved: ${key}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save setting');
      throw err;
    }
  };

  const handleSeed = async () => {
    setSaving(true);
    try {
      const res = await api.post('/admin/settings/seed');
      toast.success(`Seeded ${res.data.results?.length || 0} settings`);
      fetchSettings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Seed failed');
    } finally {
      setSaving(false);
    }
  };

  const categories = Object.keys(CATEGORY_META).filter(c => grouped[c]?.length > 0);
  const currentSettings = grouped[activeCategory] || [];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: TK.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ width: '28px', height: '28px', color: TK.accent, animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: TK.bg, color: TK.text, padding: '32px 32px 60px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(37,99,235,0.25)', background: 'rgba(37,99,235,0.06)', marginBottom: '10px' }}>
            <Settings style={{ width: '10px', height: '10px', color: TK.accent }} />
            <span style={{ fontSize: '10px', fontWeight: 400, color: TK.accent, letterSpacing: '0.12em', textTransform: 'uppercase' }}>System Configuration</span>
          </div>
          <h1 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 600, letterSpacing: '-0.02em', color: TK.text, margin: 0, fontFamily: "'Inter',system-ui,sans-serif" }}>
            Settings Center
          </h1>
          <p style={{ fontSize: '12px', color: TK.textMuted, marginTop: '6px', fontWeight: 300 }}>
            {Object.values(grouped).reduce((s, arr) => s + arr.length, 0)} settings across {categories.length} categories
          </p>
        </div>
        <button
          onClick={handleSeed}
          disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', background: 'transparent', border: `1px solid ${TK.border}`, borderRadius: '8px', color: TK.textMuted, fontSize: '11px', cursor: saving ? 'not-allowed' : 'pointer' }}
        >
          {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={13} />}
          Seed Defaults
        </button>
      </div>

      {categories.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '12px' }}>
          <AlertCircle style={{ width: '32px', height: '32px', color: TK.textMuted, margin: '0 auto 12px' }} />
          <p style={{ color: TK.textMuted, fontSize: '13px', fontWeight: 300 }}>No settings found. Click "Seed Defaults" to initialize.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '20px' }}>
          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {Object.keys(CATEGORY_META).filter(c => grouped[c]?.length > 0).map(cat => {
              const meta = CATEGORY_META[cat];
              const Icon = meta.icon;
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', textAlign: 'left', background: isActive ? `${meta.color}12` : 'transparent', border: `1px solid ${isActive ? `${meta.color}30` : 'transparent'}`, color: isActive ? meta.color : TK.textMuted, fontSize: '12px', fontWeight: isActive ? 400 : 300, cursor: 'pointer', transition: 'all 0.15s', width: '100%' }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = `${meta.color}08`; e.currentTarget.style.color = meta.color; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = TK.textMuted; } }}
                >
                  <Icon size={14} />
                  {meta.label}
                  <span style={{ marginLeft: 'auto', fontSize: '10px', opacity: 0.6 }}>{grouped[cat]?.length || 0}</span>
                </button>
              );
            })}
          </div>

          {/* Settings Panel */}
          <div style={{ background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '16px', borderBottom: `1px solid ${TK.border}` }}>
              {(() => { const meta = CATEGORY_META[activeCategory]; const Icon = meta?.icon || Settings; return <Icon size={16} style={{ color: meta?.color || TK.accent }} />; })()}
              <h2 style={{ fontSize: '14px', fontWeight: 300, color: TK.text, margin: 0 }}>
                {CATEGORY_META[activeCategory]?.label || activeCategory}
              </h2>
              <span style={{ fontSize: '10px', color: TK.textMuted, marginLeft: 'auto' }}>{currentSettings.length} settings</span>
            </div>
            {currentSettings.map(s => (
              <SettingField key={s.key} setting={s} onSave={handleSave} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
