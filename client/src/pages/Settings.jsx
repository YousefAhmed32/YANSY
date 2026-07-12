import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon, Sun, Moon, Globe, Bell, Shield,
  Monitor, ArrowLeft, Check, ChevronRight, Palette, Volume2
} from 'lucide-react';
import { gsap } from 'gsap';

// ── Toggle Switch ─────────────────────────────────────────────────────────────
const Toggle = ({ value, onChange, isDark }) => {
  const gold = '#2563EB';
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: '40px', height: '22px', borderRadius: '11px',
        background: value ? 'rgba(37,99,235,0.2)' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
        border: `1px solid ${value ? 'rgba(37,99,235,0.4)' : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)')}`,
        cursor: 'pointer',
        padding: '2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: value ? 'flex-end' : 'flex-start',
        transition: 'all 0.25s',
        flexShrink: 0,
      }}
    >
      <div style={{
        width: '16px', height: '16px', borderRadius: '50%',
        background: value ? gold : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'),
        transition: 'all 0.25s',
        boxShadow: value ? `0 0 6px rgba(37,99,235,0.4)` : 'none',
      }} />
    </button>
  );
};

// ── Setting Row ───────────────────────────────────────────────────────────────
const SettingRow = ({ label, description, children, isDark }) => {
  const border   = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textMain = isDark ? '#f5f5f0' : '#0a0a0a';
  const textMuted = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 0',
      borderBottom: `1px solid ${border}`,
    }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 300, color: textMain, marginBottom: '2px' }}>{label}</div>
        {description && <div style={{ fontSize: '10px', fontWeight: 300, color: textMuted }}>{description}</div>}
      </div>
      <div style={{ flexShrink: 0, marginLeft: '16px' }}>{children}</div>
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
        padding: '14px 22px',
        borderBottom: `1px solid ${border}`,
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        {Icon && <Icon style={{ width: '13px', height: '13px', color: gold }} />}
        <h2 style={{
          fontSize: '11px', fontWeight: 400, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: textMain, margin: 0,
        }}>
          {title}
        </h2>
      </div>
      <div style={{ padding: '0 22px' }}>
        {children}
      </div>
    </div>
  );
};

// ── Main Settings ─────────────────────────────────────────────────────────────
const Settings = () => {
  const { isDark, toggleTheme } = useTheme();
  const { language, toggleLanguage, dir } = useLanguage();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);

  // Notification preferences (stored locally for now)
  const [notifPrefs, setNotifPrefs] = useState({
    projectUpdates: true,
    messages:       true,
    marketing:      false,
    weeklyReport:   false,
  });
  const [saved, setSaved] = useState(false);

  const containerRef = useRef(null);

  const bg       = isDark ? '#080806' : '#fafaf9';
  const textMain = isDark ? '#f5f5f0' : '#0a0a0a';
  const textMuted = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const gold     = '#2563EB';
  const border   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current.children,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out', delay: 0.1 }
      );
    }
    // Load saved prefs
    const saved = localStorage.getItem('yansy_notif_prefs');
    if (saved) {
      try { setNotifPrefs(JSON.parse(saved)); } catch {}
    }
  }, []);

  const handleSavePrefs = () => {
    localStorage.setItem('yansy_notif_prefs', JSON.stringify(notifPrefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const setNotif = (key) => (val) => {
    setNotifPrefs(p => ({ ...p, [key]: val }));
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

          <h1 style={{
            fontSize: '28px', fontWeight: 600, letterSpacing: '-0.01em',
            color: textMain, margin: 0, fontFamily: "'Inter',system-ui,sans-serif",
          }}>
            Settings
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 300, color: textMuted, marginTop: '6px' }}>
            Customize your workspace preferences
          </p>
        </div>

        {/* ── Appearance ── */}
        <Section title="Appearance" icon={Palette} isDark={isDark}>
          <SettingRow
            label="Dark Mode"
            description="Switch between light and dark theme"
            isDark={isDark}
          >
            <Toggle value={isDark} onChange={toggleTheme} isDark={isDark} />
          </SettingRow>

          <SettingRow label="Theme" isDark={isDark}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['System', 'Light', 'Dark'].map(opt => (
                <button
                  key={opt}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: `1px solid ${(opt === 'Dark' && isDark) || (opt === 'Light' && !isDark)
                      ? 'rgba(37,99,235,0.5)'
                      : border
                    }`,
                    background: (opt === 'Dark' && isDark) || (opt === 'Light' && !isDark)
                      ? 'rgba(37,99,235,0.1)'
                      : 'transparent',
                    color: (opt === 'Dark' && isDark) || (opt === 'Light' && !isDark) ? gold : textMuted,
                    fontSize: '10px', fontWeight: 300, cursor: 'pointer',
                    transition: 'all 0.15s',
                    letterSpacing: '0.06em',
                  }}
                  onClick={() => {
                    if ((opt === 'Dark' && !isDark) || (opt === 'Light' && isDark)) toggleTheme();
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </SettingRow>
        </Section>

        {/* ── Language ── */}
        <Section title="Language & Region" icon={Globe} isDark={isDark}>
          <SettingRow
            label="Language"
            description="Choose your preferred language"
            isDark={isDark}
          >
            <button
              onClick={toggleLanguage}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '6px 14px',
                background: 'rgba(37,99,235,0.08)',
                border: '1px solid rgba(37,99,235,0.25)',
                borderRadius: '7px',
                color: gold, fontSize: '11px',
                fontWeight: 300, cursor: 'pointer',
                transition: 'all 0.2s', letterSpacing: '0.06em',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.08)'; }}
            >
              <Globe style={{ width: '13px', height: '13px' }} />
              {language === 'en' ? '🇺🇸 English' : '🇸🇦 العربية'}
              <ChevronRight style={{ width: '11px', height: '11px', opacity: 0.6 }} />
            </button>
          </SettingRow>
          <SettingRow
            label="RTL Direction"
            description="Right-to-left text direction"
            isDark={isDark}
          >
            <Toggle
              value={language === 'ar'}
              onChange={toggleLanguage}
              isDark={isDark}
            />
          </SettingRow>
        </Section>

        {/* ── Notifications ── */}
        <Section title="Notifications" icon={Bell} isDark={isDark}>
          <SettingRow
            label="Project Updates"
            description="Notify me when project status changes"
            isDark={isDark}
          >
            <Toggle value={notifPrefs.projectUpdates} onChange={setNotif('projectUpdates')} isDark={isDark} />
          </SettingRow>
          <SettingRow
            label="New Messages"
            description="Notify me on new message threads"
            isDark={isDark}
          >
            <Toggle value={notifPrefs.messages} onChange={setNotif('messages')} isDark={isDark} />
          </SettingRow>
          <SettingRow
            label="Platform Updates"
            description="News about features and improvements"
            isDark={isDark}
          >
            <Toggle value={notifPrefs.marketing} onChange={setNotif('marketing')} isDark={isDark} />
          </SettingRow>
          <SettingRow
            label="Weekly Summary"
            description="A weekly digest of your activity"
            isDark={isDark}
          >
            <Toggle value={notifPrefs.weeklyReport} onChange={setNotif('weeklyReport')} isDark={isDark} />
          </SettingRow>

          {/* Save prefs */}
          <div style={{ padding: '16px 0' }}>
            <button
              onClick={handleSavePrefs}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '9px 18px',
                background: saved ? 'rgba(52,211,153,0.1)' : 'rgba(37,99,235,0.08)',
                border: `1px solid ${saved ? 'rgba(52,211,153,0.3)' : 'rgba(37,99,235,0.25)'}`,
                borderRadius: '7px',
                color: saved ? '#34d399' : gold,
                fontSize: '10px', fontWeight: 400,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'all 0.25s',
              }}
            >
              {saved ? <Check style={{ width: '12px', height: '12px' }} /> : <Bell style={{ width: '12px', height: '12px' }} />}
              {saved ? 'Preferences Saved' : 'Save Preferences'}
            </button>
          </div>
        </Section>

        {/* ── Security ── */}
        <Section title="Security" icon={Shield} isDark={isDark}>
          <SettingRow
            label="Two-Factor Authentication"
            description="Add an extra layer of security (coming soon)"
            isDark={isDark}
          >
            <span style={{ fontSize: '10px', fontWeight: 300, color: textMuted, padding: '3px 8px', border: `1px solid ${border}`, borderRadius: '10px' }}>
              Coming Soon
            </span>
          </SettingRow>
          <SettingRow
            label="Active Sessions"
            description="Manage devices logged into your account"
            isDark={isDark}
          >
            <button
              onClick={() => navigate('/app/profile')}
              style={{
                padding: '5px 12px',
                background: 'transparent',
                border: `1px solid ${border}`,
                borderRadius: '6px',
                color: textMuted, fontSize: '10px',
                cursor: 'pointer', transition: 'all 0.15s',
                letterSpacing: '0.06em',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = textMain; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = textMuted; e.currentTarget.style.borderColor = border; }}
            >
              View
            </button>
          </SettingRow>
          <SettingRow
            label="Change Password"
            description="Update your account password"
            isDark={isDark}
          >
            <button
              onClick={() => navigate('/app/profile')}
              style={{
                padding: '5px 12px',
                background: 'transparent',
                border: `1px solid ${border}`,
                borderRadius: '6px',
                color: textMuted, fontSize: '10px',
                cursor: 'pointer', transition: 'all 0.15s',
                letterSpacing: '0.06em',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = textMain; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = textMuted; e.currentTarget.style.borderColor = border; }}
            >
              Update
            </button>
          </SettingRow>
        </Section>

        {/* ── Account info footer ── */}
        <div style={{
          padding: '14px 18px',
          background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
          border: `1px solid ${border}`,
          borderRadius: '10px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px',
        }}>
          <div style={{ fontSize: '11px', color: textMuted, fontWeight: 300 }}>
            Account: <strong style={{ fontWeight: 400, color: textMain }}>{user?.email}</strong>
          </div>
          <div style={{ fontSize: '10px', color: textMuted, fontWeight: 300 }}>
            v1.0.0 · {user?.role === 'ADMIN' ? 'Admin Plan' : 'Client Plan'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
