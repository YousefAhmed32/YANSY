import { useState } from 'react';
import { useSelector } from 'react-redux';
import { UserCircle, Eye, EyeOff, CheckCircle2, Lock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';

const TK = {
  bg:        '#F6F7F9',
  surface:   '#FFFFFF',
  border:    '#E8EBF0',
  accent:    '#2563EB',
  accentBg:  'rgba(37,99,235,0.06)',
  text:      '#0D1117',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
};

const Field = ({ label, value, onChange, type = 'text', placeholder, disabled = false }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ fontSize: '12px', color: TK.textMuted, display: 'block', marginBottom: '5px', fontWeight: 500 }}>
        {label}
      </label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: '10px',
          border: `1px solid ${focused ? TK.accent : TK.border}`,
          fontSize: '13px', color: disabled ? TK.textMuted : TK.text,
          background: disabled ? TK.bg : TK.surface, outline: 'none',
          fontFamily: 'inherit', boxSizing: 'border-box',
          transition: 'border-color 0.15s', cursor: disabled ? 'default' : 'text',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
};

const Account = () => {
  const { language, isRTL, toggleLanguage } = useLanguage();
  const { user } = useSelector(s => s.auth);

  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [saveError, setSaveError] = useState('');

  // Profile fields
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone,    setPhone]    = useState(user?.phone    || '');
  const [company,  setCompany]  = useState(user?.company  || '');
  const [city,     setCity]     = useState(user?.city     || '');
  const [country,  setCountry]  = useState(user?.country  || '');
  const [website,  setWebsite]  = useState(user?.website  || '');
  const [role,     setRole]     = useState(user?.role     || '');

  // Password fields
  const [curPwd, setCurPwd]   = useState('');
  const [newPwd, setNewPwd]   = useState('');
  const [conPwd, setConPwd]   = useState('');
  const [showPwd, setShowPwd] = useState({ cur: false, new: false, con: false });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSaved,  setPwdSaved]  = useState(false);
  const [pwdError,  setPwdError]  = useState('');

  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError('');
    try {
      await axios.put(`${apiBase}/users/profile`, {
        fullName, phone, company, city, country, website,
      }, { headers });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError(language === 'ar' ? 'فشل الحفظ. يرجى المحاولة مجدداً.' : 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    setPwdError('');
    if (newPwd !== conPwd) { setPwdError(language === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'); return; }
    if (newPwd.length < 6)  { setPwdError(language === 'ar' ? '6 أحرف على الأقل' : 'Minimum 6 characters'); return; }
    setPwdSaving(true);
    try {
      await axios.put(`${apiBase}/users/change-password`, { currentPassword: curPwd, newPassword: newPwd }, { headers });
      setPwdSaved(true);
      setCurPwd(''); setNewPwd(''); setConPwd('');
      setTimeout(() => setPwdSaved(false), 3000);
    } catch (err) {
      setPwdError(err?.response?.data?.message || (language === 'ar' ? 'فشل تحديث كلمة المرور' : 'Failed to update password'));
    } finally {
      setPwdSaving(false);
    }
  };

  const TABS = [
    { id: 'profile',  en: 'Personal Info', ar: 'المعلومات الشخصية' },
    { id: 'security', en: 'Security',       ar: 'الأمان'            },
  ];

  return (
    <div style={{
      minHeight: '100vh', background: TK.bg,
      padding: 'clamp(16px,3vw,32px)',
      fontFamily: isRTL ? 'IBM Plex Sans Arabic,system-ui,sans-serif' : 'Inter,system-ui,sans-serif',
      direction: isRTL ? 'rtl' : 'ltr', maxWidth: '760px', margin: '0 auto',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '9px', background: TK.accentBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <UserCircle style={{ width: '18px', height: '18px', color: TK.accent }} />
        </div>
        <div>
          <h1 style={{ fontSize: 'clamp(18px,3vw,22px)', fontWeight: 700, color: TK.text, margin: 0 }}>
            {language === 'ar' ? 'حسابي' : 'My Account'}
          </h1>
          <p style={{ fontSize: '12.5px', color: TK.textMuted, margin: '3px 0 0' }}>
            {language === 'ar' ? 'أدِر ملفك الشخصي وتفضيلاتك' : 'Manage your profile and preferences'}
          </p>
        </div>
      </div>

      {/* Avatar row */}
      <div style={{
        background: TK.surface, borderRadius: '16px', border: `1px solid ${TK.border}`,
        padding: '20px 24px', marginBottom: '16px',
        display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
      }}>
        <div style={{
          width: '54px', height: '54px', borderRadius: '14px', flexShrink: 0,
          background: TK.accentBg, border: '2px solid rgba(37,99,235,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', fontWeight: 700, color: TK.accent,
        }}>
          {user?.fullName?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: TK.text, marginBottom: '2px' }}>
            {user?.fullName || (language === 'ar' ? 'المستخدم' : 'User')}
          </div>
          <div style={{ fontSize: '12.5px', color: TK.textMuted }}>{user?.email}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `2px solid ${TK.border}`, marginBottom: '20px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '9px 18px', fontSize: '13px', fontWeight: isActive ? 500 : 400,
                color: isActive ? TK.accent : TK.textMuted, background: 'none', border: 'none',
                cursor: 'pointer', borderBottom: isActive ? `2px solid ${TK.accent}` : '2px solid transparent',
                marginBottom: '-2px', transition: 'color 0.14s', fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}
            >
              {language === 'ar' ? tab.ar : tab.en}
            </button>
          );
        })}
      </div>

      {/* ── Profile Tab ── */}
      {activeTab === 'profile' && (
        <div style={{ background: TK.surface, borderRadius: '16px', border: `1px solid ${TK.border}`, padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,280px),1fr))', gap: '14px', marginBottom: '20px' }}>
            <Field label={language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
              value={fullName} onChange={setFullName}
              placeholder={language === 'ar' ? 'اسمك الكامل' : 'Your full name'} />
            <Field label={language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              value={user?.email || ''} onChange={() => {}} disabled
              placeholder="email@example.com" />
            <Field label={language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
              value={phone} onChange={setPhone} type="tel"
              placeholder="+1 (555) 123-4567" />
            <Field label={language === 'ar' ? 'اسم الشركة' : 'Company Name'}
              value={company} onChange={setCompany}
              placeholder={language === 'ar' ? 'اسم شركتك' : 'Your company name'} />
            <Field label={language === 'ar' ? 'الدولة' : 'Country'}
              value={country} onChange={setCountry}
              placeholder={language === 'ar' ? 'الدولة' : 'Country'} />
            <Field label={language === 'ar' ? 'المدينة' : 'City'}
              value={city} onChange={setCity}
              placeholder={language === 'ar' ? 'المدينة' : 'City'} />
            <Field label={language === 'ar' ? 'الموقع الإلكتروني' : 'Website'}
              value={website} onChange={setWebsite}
              placeholder="https://yourwebsite.com" />
          </div>

          {/* Language preference */}
          <div style={{ padding: '14px', borderRadius: '10px', background: TK.bg, border: `1px solid ${TK.border}`, marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: TK.text, marginBottom: '2px' }}>
                  {language === 'ar' ? 'اللغة' : 'Language'}
                </div>
                <div style={{ fontSize: '11.5px', color: TK.textMuted }}>
                  {language === 'ar' ? 'العربية والإنجليزية مدعومتان' : 'Arabic and English supported'}
                </div>
              </div>
              <button onClick={toggleLanguage}
                style={{
                  padding: '7px 16px', borderRadius: '8px',
                  border: `1px solid ${TK.border}`, background: TK.surface,
                  fontSize: '12.5px', fontWeight: 500, color: TK.textMuted,
                  cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = TK.accent; e.currentTarget.style.color = TK.accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = TK.border; e.currentTarget.style.color = TK.textMuted; }}
              >
                {language === 'en' ? 'التحويل للعربية' : 'Switch to English'}
              </button>
            </div>
          </div>

          {/* Save area */}
          {saveError && (
            <div style={{ padding: '10px 14px', borderRadius: '9px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)', fontSize: '12.5px', color: '#dc2626', marginBottom: '14px' }}>
              {saveError}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={handleSave} disabled={saving}
              style={{
                padding: '10px 24px', borderRadius: '10px', background: TK.accent, color: '#fff',
                border: 'none', cursor: saving ? 'default' : 'pointer', fontSize: '13.5px', fontWeight: 500,
                fontFamily: 'inherit', transition: 'opacity 0.15s', opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? (language === 'ar' ? 'جارٍ الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
            </button>
            {saved && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#16a34a', fontSize: '12.5px' }}>
                <CheckCircle2 style={{ width: '14px', height: '14px' }} />
                {language === 'ar' ? 'تم الحفظ!' : 'Saved!'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Security Tab ── */}
      {activeTab === 'security' && (
        <div style={{ background: TK.surface, borderRadius: '16px', border: `1px solid ${TK.border}`, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <Lock style={{ width: '15px', height: '15px', color: TK.textMuted }} />
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: TK.text, margin: 0 }}>
              {language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '400px' }}>
            {/* Current password */}
            <div>
              <label style={{ fontSize: '12px', color: TK.textMuted, display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                {language === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd.cur ? 'text' : 'password'} value={curPwd} onChange={e => setCurPwd(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 40px 10px 14px', borderRadius: '10px',
                    border: `1px solid ${TK.border}`, fontSize: '13px', color: TK.text,
                    background: TK.surface, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => { e.target.style.borderColor = TK.accent; }}
                  onBlur={e => { e.target.style.borderColor = TK.border; }}
                />
                <button type="button" onClick={() => setShowPwd(p => ({ ...p, cur: !p.cur }))}
                  style={{
                    position: 'absolute', [isRTL ? 'left' : 'right']: '10px', top: '50%',
                    transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer',
                    color: TK.textLight, display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPwd.cur ? <EyeOff style={{ width: '14px', height: '14px' }} /> : <Eye style={{ width: '14px', height: '14px' }} />}
                </button>
              </div>
            </div>

            {/* New password */}
            {[
              { label: language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password', val: newPwd, set: setNewPwd, key: 'new' },
              { label: language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password', val: conPwd, set: setConPwd, key: 'con' },
            ].map(({ label, val, set, key }) => (
              <div key={key}>
                <label style={{ fontSize: '12px', color: TK.textMuted, display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                  {label}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPwd[key] ? 'text' : 'password'} value={val} onChange={e => set(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 40px 10px 14px', borderRadius: '10px',
                      border: `1px solid ${TK.border}`, fontSize: '13px', color: TK.text,
                      background: TK.surface, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => { e.target.style.borderColor = TK.accent; }}
                    onBlur={e => { e.target.style.borderColor = TK.border; }}
                  />
                  <button type="button" onClick={() => setShowPwd(p => ({ ...p, [key]: !p[key] }))}
                    style={{
                      position: 'absolute', [isRTL ? 'left' : 'right']: '10px', top: '50%',
                      transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer',
                      color: TK.textLight, display: 'flex', alignItems: 'center',
                    }}
                  >
                    {showPwd[key] ? <EyeOff style={{ width: '14px', height: '14px' }} /> : <Eye style={{ width: '14px', height: '14px' }} />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pwdError && (
            <div style={{ padding: '10px 14px', borderRadius: '9px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)', fontSize: '12.5px', color: '#dc2626', margin: '14px 0', maxWidth: '400px' }}>
              {pwdError}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
            <button onClick={handlePasswordUpdate} disabled={pwdSaving || !curPwd || !newPwd || !conPwd}
              style={{
                padding: '10px 24px', borderRadius: '10px', background: TK.accent, color: '#fff',
                border: 'none', cursor: (pwdSaving || !curPwd || !newPwd || !conPwd) ? 'default' : 'pointer',
                fontSize: '13.5px', fontWeight: 500, fontFamily: 'inherit', transition: 'opacity 0.15s',
                opacity: (pwdSaving || !curPwd || !newPwd || !conPwd) ? 0.6 : 1,
              }}
            >
              {pwdSaving ? (language === 'ar' ? 'جارٍ التحديث...' : 'Updating...') : (language === 'ar' ? 'تحديث كلمة المرور' : 'Update Password')}
            </button>
            {pwdSaved && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#16a34a', fontSize: '12.5px' }}>
                <CheckCircle2 style={{ width: '14px', height: '14px' }} />
                {language === 'ar' ? 'تم التحديث!' : 'Updated!'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;
