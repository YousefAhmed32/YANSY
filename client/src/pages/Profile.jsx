import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Building2, Tag, Save, ArrowLeft,
  CheckCircle2, AlertCircle, Shield, Camera, Edit3, Key
} from 'lucide-react';
import api from '../utils/api';
import { getMe } from '../store/authSlice';
import { gsap } from 'gsap';

// ── Field Component ───────────────────────────────────────────────────────────
const Field = ({ label, value, onChange, type = 'text', placeholder, required, icon: Icon, isDark, readOnly, hint }) => {
  const border    = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const focusBorder = 'rgba(37,99,235,0.5)';
  const bg        = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const textMain  = isDark ? '#f5f5f0' : '#0a0a0a';
  const textMuted = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const readBg    = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';

  return (
    <div>
      <label style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        fontSize: '10px', fontWeight: 400, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: textMuted,
        marginBottom: '8px',
      }}>
        {Icon && <Icon style={{ width: '11px', height: '11px' }} />}
        {label}
        {required && <span style={{ color: '#2563EB' }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange ? e => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: readOnly ? readBg : bg,
          border: `1px solid ${border}`,
          borderRadius: '8px',
          color: readOnly ? textMuted : textMain,
          fontSize: '13px',
          fontWeight: 300,
          fontFamily: 'inherit',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s',
          cursor: readOnly ? 'not-allowed' : 'text',
          outline: 'none',
        }}
        onFocus={e => { if (!readOnly) e.target.style.borderColor = focusBorder; }}
        onBlur={e  => { e.target.style.borderColor = border; }}
      />
      {hint && (
        <p style={{ fontSize: '10px', color: textMuted, marginTop: '5px', fontWeight: 300 }}>{hint}</p>
      )}
    </div>
  );
};

// ── Section Card ──────────────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, children, isDark }) => {
  const surface  = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const border   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textMain = isDark ? '#f5f5f0' : '#0a0a0a';
  const gold     = '#2563EB';

  return (
    <div style={{
      background: surface,
      border: `1px solid ${border}`,
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '16px 22px',
        borderBottom: `1px solid ${border}`,
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        {Icon && <Icon style={{ width: '14px', height: '14px', color: gold }} />}
        <h2 style={{
          fontSize: '11px', fontWeight: 400, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: textMain, margin: 0,
        }}>
          {title}
        </h2>
      </div>
      <div style={{ padding: '22px' }}>
        {children}
      </div>
    </div>
  );
};

// ── Main Profile ──────────────────────────────────────────────────────────────
const Profile = () => {
  const { t }          = useTranslation();
  const { isDark }     = useTheme();
  const { dir }        = useLanguage();
  const dispatch       = useDispatch();
  const navigate       = useNavigate();
  const { user }       = useSelector(s => s.auth);

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phoneNumber: user?.phoneNumber || '',
    brandName: user?.brandName || '',
    companyName: user?.companyName || '',
  });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [saving, setSaving]   = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [status, setStatus]   = useState(null); // 'success' | 'error' | null
  const [pwStatus, setPwStatus] = useState(null);
  const [pwMsg, setPwMsg]     = useState('');

  const containerRef = useRef(null);

  // Theme tokens
  const bg       = isDark ? '#080806' : '#fafaf9';
  const border   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textMain = isDark ? '#f5f5f0' : '#0a0a0a';
  const textMuted = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const gold     = '#2563EB';

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out', delay: 0.1 }
      );
    }
  }, []);

  const handleSaveProfile = async () => {
    if (!form.fullName.trim()) return;
    setSaving(true);
    setStatus(null);
    try {
      await api.put('/users/profile', form);
      await dispatch(getMe());
      setStatus('success');
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      setPwStatus('error'); setPwMsg('Please fill in all fields.'); return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      setPwStatus('error'); setPwMsg('New passwords do not match.'); return;
    }
    if (pwForm.newPw.length < 6) {
      setPwStatus('error'); setPwMsg('Password must be at least 6 characters.'); return;
    }
    setSavingPw(true);
    setPwStatus(null);
    try {
      await api.put('/users/change-password', {
        currentPassword: pwForm.current,
        newPassword: pwForm.newPw,
      });
      setPwStatus('success');
      setPwMsg('Password updated successfully.');
      setPwForm({ current: '', newPw: '', confirm: '' });
      setTimeout(() => { setPwStatus(null); setPwMsg(''); }, 4000);
    } catch (err) {
      setPwStatus('error');
      setPwMsg(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div
      dir={dir}
      style={{ minHeight: '100vh', background: bg, color: textMain, padding: '32px' }}
    >
      <div ref={containerRef} style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ── Back + Header ── */}
        <div>
          <button
            onClick={() => navigate('/app/dashboard')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: textMuted, fontSize: '12px', fontWeight: 300,
              letterSpacing: '0.06em', marginBottom: '20px',
              padding: 0, transition: 'color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = textMain; }}
            onMouseLeave={e => { e.currentTarget.style.color = textMuted; }}
          >
            <ArrowLeft style={{ width: '14px', height: '14px' }} />
            Back to Dashboard
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '6px' }}>
            {/* Avatar */}
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'linear-gradient(135deg,rgba(37,99,235,0.3),rgba(37,99,235,0.06))',
              border: '2px solid rgba(37,99,235,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', fontWeight: 600, color: gold,
              fontFamily: "'Inter',system-ui,sans-serif",
              flexShrink: 0, position: 'relative',
            }}>
              {user?.fullName?.[0]?.toUpperCase() || '?'}
              <div style={{
                position: 'absolute', bottom: 0, right: 0,
                width: '18px', height: '18px', borderRadius: '50%',
                background: isDark ? '#0d0d0b' : '#ffffff',
                border: `1px solid ${border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}>
                <Camera style={{ width: '9px', height: '9px', color: textMuted }} />
              </div>
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.01em', color: textMain, margin: 0, fontFamily: "'Inter',system-ui,sans-serif" }}>
                {user?.fullName || 'Your Profile'}
              </h1>
              <p style={{ fontSize: '11px', fontWeight: 300, color: textMuted, margin: '3px 0 0' }}>
                {user?.email} · {user?.role === 'ADMIN' ? 'Admin' : 'Member'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Personal Information ── */}
        <Section title="Personal Information" icon={User} isDark={isDark}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field
              label="Full Name" required
              value={form.fullName}
              onChange={v => setForm(f => ({ ...f, fullName: v }))}
              placeholder="Your full name"
              icon={User}
              isDark={isDark}
            />
            <Field
              label="Email Address"
              value={user?.email || ''}
              icon={Mail}
              isDark={isDark}
              readOnly
              hint="Email cannot be changed"
            />
            <Field
              label="Phone Number"
              value={form.phoneNumber}
              onChange={v => setForm(f => ({ ...f, phoneNumber: v }))}
              placeholder="+1 (555) 123-4567"
              icon={Phone}
              isDark={isDark}
            />
            <Field
              label="Role"
              value={user?.role === 'ADMIN' ? 'Administrator' : 'Client Member'}
              icon={Shield}
              isDark={isDark}
              readOnly
            />
          </div>
        </Section>

        {/* ── Business Information ── */}
        <Section title="Business Information" icon={Building2} isDark={isDark}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field
              label="Brand Name"
              value={form.brandName}
              onChange={v => setForm(f => ({ ...f, brandName: v }))}
              placeholder="Your brand"
              icon={Tag}
              isDark={isDark}
            />
            <Field
              label="Company Name"
              value={form.companyName}
              onChange={v => setForm(f => ({ ...f, companyName: v }))}
              placeholder="Your company"
              icon={Building2}
              isDark={isDark}
            />
          </div>
        </Section>

        {/* ── Save Button + Status ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '11px 22px',
              background: saving ? 'rgba(37,99,235,0.08)' : 'rgba(37,99,235,0.1)',
              border: '1px solid rgba(37,99,235,0.35)',
              borderRadius: '8px',
              color: gold, fontSize: '11px',
              fontWeight: 400, letterSpacing: '0.1em',
              textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', opacity: saving ? 0.7 : 1,
            }}
            onMouseEnter={e => { if (!saving) { e.currentTarget.style.background = gold; e.currentTarget.style.color = '#000'; } }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.1)'; e.currentTarget.style.color = gold; }}
          >
            <Save style={{ width: '14px', height: '14px' }} />
            {saving ? 'Saving…' : 'Save Profile'}
          </button>

          {status === 'success' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '12px', fontWeight: 300 }}>
              <CheckCircle2 style={{ width: '14px', height: '14px' }} />
              Profile updated
            </div>
          )}
          {status === 'error' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontSize: '12px', fontWeight: 300 }}>
              <AlertCircle style={{ width: '14px', height: '14px' }} />
              Failed to save — please try again
            </div>
          )}
        </div>

        {/* ── Change Password ── */}
        <Section title="Change Password" icon={Key} isDark={isDark}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field
              label="Current Password"
              type="password"
              value={pwForm.current}
              onChange={v => setPwForm(f => ({ ...f, current: v }))}
              placeholder="••••••••"
              isDark={isDark}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Field
                label="New Password"
                type="password"
                value={pwForm.newPw}
                onChange={v => setPwForm(f => ({ ...f, newPw: v }))}
                placeholder="Min. 6 characters"
                isDark={isDark}
              />
              <Field
                label="Confirm Password"
                type="password"
                value={pwForm.confirm}
                onChange={v => setPwForm(f => ({ ...f, confirm: v }))}
                placeholder="Repeat new password"
                isDark={isDark}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
              <button
                onClick={handleChangePassword}
                disabled={savingPw}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px',
                  background: 'transparent',
                  border: `1px solid ${border}`,
                  borderRadius: '8px',
                  color: textMuted, fontSize: '11px',
                  fontWeight: 400, letterSpacing: '0.08em',
                  textTransform: 'uppercase', cursor: savingPw ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s', opacity: savingPw ? 0.7 : 1,
                }}
                onMouseEnter={e => { if (!savingPw) { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.4)'; e.currentTarget.style.color = gold; } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = textMuted; }}
              >
                <Key style={{ width: '13px', height: '13px' }} />
                {savingPw ? 'Updating…' : 'Update Password'}
              </button>

              {pwStatus === 'success' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#34d399', fontSize: '11px' }}>
                  <CheckCircle2 style={{ width: '13px', height: '13px' }} />
                  {pwMsg}
                </div>
              )}
              {pwStatus === 'error' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#f87171', fontSize: '11px' }}>
                  <AlertCircle style={{ width: '13px', height: '13px' }} />
                  {pwMsg}
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* ── Account Info ── */}
        <div style={{
          padding: '14px 18px',
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          border: `1px solid ${border}`,
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <Shield style={{ width: '14px', height: '14px', color: textMuted, flexShrink: 0 }} />
          <p style={{ fontSize: '11px', fontWeight: 300, color: textMuted, margin: 0, lineHeight: 1.5 }}>
            Your data is encrypted and stored securely. We never share your information with third parties.
          </p>
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 600px) {
          div[style*="gridTemplateColumns: '1fr 1fr'"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Profile;
