import { useState } from 'react';
import { Bell, Send, Users, User, UserCheck, Star, Crown, Info, CheckCircle2, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const TYPES = [
  { value: 'info',    label: 'Info',    icon: Info,         color: '#60a5fa' },
  { value: 'success', label: 'Success', icon: CheckCircle2, color: '#34d399' },
  { value: 'warning', label: 'Warning', icon: AlertTriangle, color: '#f59e0b' },
  { value: 'alert',   label: 'Alert',   icon: AlertCircle,  color: '#f87171' },
];

const TARGETS = [
  { value: '',            label: 'All Users',  icon: Users,     description: 'Every active account' },
  { value: 'USER',        label: 'Users Only', icon: User,      description: 'Standard clients' },
  { value: 'MANAGER',     label: 'Managers',   icon: UserCheck, description: 'Managers and above' },
  { value: 'ADMIN',       label: 'Admins',     icon: Star,      description: 'Admins and super admins' },
  { value: 'SUPER_ADMIN', label: 'Super Admin',icon: Crown,     description: 'Super admins only' },
];

const BroadcastHistory = ({ items, isDark }) => {
  const surface = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const border  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textMain = isDark ? '#f5f5f0' : '#0a0a0a';
  const textMuted = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  if (items.length === 0) return null;
  return (
    <div style={{ padding: '22px', background: surface, border: `1px solid ${border}`, borderRadius: '12px' }}>
      <h2 style={{ fontSize: '11px', fontWeight: 400, color: textMain, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 16px' }}>
        Recent Broadcasts
      </h2>
      {items.map((b, i) => {
        const typeCfg = TYPES.find(t => t.value === b.type) || TYPES[0];
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', borderBottom: i < items.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` : 'none' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${typeCfg.color}12`, border: `1px solid ${typeCfg.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <typeCfg.icon size={13} style={{ color: typeCfg.color }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 300, color: textMain }}>{b.title}</div>
              <div style={{ fontSize: '10px', color: textMuted, marginTop: '2px' }}>{b.message}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 300 }}>{b.count} sent</div>
              <div style={{ fontSize: '10px', color: textMuted }}>{b.target || 'all'}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AdminNotifications = () => {
  const { isDark } = useTheme();
  const [form, setForm] = useState({ title: '', message: '', type: 'info', targetRole: '', link: '' });
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(false);
  const [history, setHistory] = useState([]);

  const bg       = isDark ? '#080806' : '#fafaf9';
  const surface  = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const border   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textMain = isDark ? '#f5f5f0' : '#0a0a0a';
  const textMuted = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const inputBg  = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  const gold     = '#d4af37';

  const selectedType   = TYPES.find(t => t.value === form.type) || TYPES[0];
  const selectedTarget = TARGETS.find(t => t.value === form.targetRole) || TARGETS[0];

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    setSending(true);
    try {
      const payload = { title: form.title, message: form.message, type: form.type };
      if (form.targetRole) payload.targetRole = form.targetRole;
      if (form.link.trim()) payload.link = form.link.trim();

      const res = await api.post('/notifications/broadcast', payload);
      toast.success(`Sent to ${res.data.count} users`);

      setHistory(prev => [{ ...payload, count: res.data.count, target: form.targetRole || 'all', sentAt: new Date() }, ...prev.slice(0, 9)]);
      setForm({ title: '', message: '', type: 'info', targetRole: '', link: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  const inputStyle = { width: '100%', padding: '10px 12px', background: inputBg, border: `1px solid ${border}`, borderRadius: '8px', color: textMain, fontSize: '12px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s' };

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textMain, padding: '32px 32px 60px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(212,175,55,0.25)', background: 'rgba(212,175,55,0.06)', marginBottom: '10px' }}>
          <Bell style={{ width: '10px', height: '10px', color: gold }} />
          <span style={{ fontSize: '10px', fontWeight: 400, color: gold, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Communication</span>
        </div>
        <h1 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 600, letterSpacing: '-0.02em', color: textMain, margin: 0, fontFamily: "'Inter',system-ui,sans-serif" }}>
          Notification Center
        </h1>
        <p style={{ fontSize: '12px', color: textMuted, marginTop: '6px', fontWeight: 300 }}>
          Broadcast announcements to users by role or platform-wide
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* Compose panel */}
        <div>
          <div style={{ padding: '24px', background: surface, border: `1px solid ${border}`, borderRadius: '12px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 400, color: textMain, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 20px' }}>
              Compose Broadcast
            </h2>

            {/* Notification type */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: textMuted, marginBottom: '8px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Type</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setForm(f => ({ ...f, type: t.value }))}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '8px', background: form.type === t.value ? `${t.color}15` : 'transparent', border: `1px solid ${form.type === t.value ? t.color + '40' : border}`, color: form.type === t.value ? t.color : textMuted, fontSize: '11px', cursor: 'pointer', transition: 'all 0.15s' }}
                  >
                    <t.icon size={12} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: textMuted, marginBottom: '8px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Audience</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {TARGETS.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setForm(f => ({ ...f, targetRole: t.value }))}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '8px', background: form.targetRole === t.value ? 'rgba(212,175,55,0.1)' : 'transparent', border: `1px solid ${form.targetRole === t.value ? 'rgba(212,175,55,0.4)' : border}`, color: form.targetRole === t.value ? gold : textMuted, fontSize: '11px', cursor: 'pointer', transition: 'all 0.15s' }}
                  >
                    <t.icon size={12} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: textMuted, marginBottom: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Title *</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Notification title..."
                maxLength={100}
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = border; }}
              />
            </div>

            {/* Message */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: textMuted, marginBottom: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Message *</label>
              <textarea
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Write your message..."
                rows={4}
                maxLength={500}
                style={{ ...inputStyle, resize: 'vertical' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = border; }}
              />
              <div style={{ fontSize: '10px', color: textMuted, textAlign: 'right', marginTop: '4px' }}>{form.message.length}/500</div>
            </div>

            {/* Optional link */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: textMuted, marginBottom: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Action Link (optional)</label>
              <input
                value={form.link}
                onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                placeholder="/app/billing"
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = border; }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setPreview(p => !p)}
                style={{ padding: '10px 18px', background: 'transparent', border: `1px solid ${border}`, borderRadius: '8px', color: textMuted, fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                {preview ? 'Hide' : 'Preview'}
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !form.title.trim() || !form.message.trim()}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 18px', background: (sending || !form.title.trim() || !form.message.trim()) ? 'rgba(212,175,55,0.05)' : 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.4)', borderRadius: '8px', color: (sending || !form.title.trim() || !form.message.trim()) ? textMuted : gold, fontSize: '12px', cursor: (sending || !form.title.trim() || !form.message.trim()) ? 'not-allowed' : 'pointer', fontWeight: 400, transition: 'all 0.2s', letterSpacing: '0.08em' }}
              >
                {sending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                {sending ? 'Sending...' : `Send to ${selectedTarget.label}`}
              </button>
            </div>
          </div>

          {/* Broadcast history */}
          <BroadcastHistory items={history} isDark={isDark} />
        </div>

        {/* Preview + info panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Preview */}
          {preview && (
            <div style={{ padding: '22px', background: surface, border: `1px solid ${border}`, borderRadius: '12px' }}>
              <h3 style={{ fontSize: '10px', fontWeight: 400, color: textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 14px' }}>Preview</h3>
              <div style={{ padding: '14px', background: `${selectedType.color}10`, border: `1px solid ${selectedType.color}25`, borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <selectedType.icon size={14} style={{ color: selectedType.color }} />
                  <span style={{ fontSize: '12px', fontWeight: 400, color: selectedType.color }}>{form.title || 'Notification Title'}</span>
                </div>
                <p style={{ fontSize: '11px', color: textMuted, margin: 0, fontWeight: 300 }}>{form.message || 'Your message will appear here...'}</p>
                {form.link && <div style={{ fontSize: '10px', color: gold, marginTop: '8px' }}>→ {form.link}</div>}
              </div>
              <div style={{ marginTop: '10px', fontSize: '10px', color: textMuted }}>
                To: <strong style={{ color: textMain }}>{selectedTarget.label}</strong> · {selectedTarget.description}
              </div>
            </div>
          )}

          {/* Tips */}
          <div style={{ padding: '18px 20px', background: surface, border: `1px solid ${border}`, borderRadius: '12px' }}>
            <h3 style={{ fontSize: '10px', fontWeight: 400, color: textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 14px' }}>Tips</h3>
            {[
              { icon: Bell, text: 'Notifications appear in the bell icon for all recipients.' },
              { icon: Send, text: 'Real-time delivery via Socket.IO for online users.' },
              { icon: Users, text: 'Inactive/suspended accounts are excluded from broadcasts.' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                <Icon size={13} style={{ color: gold, flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '11px', color: textMuted, fontWeight: 300 }}>{text}</span>
              </div>
            ))}
          </div>

          {/* Severity guide */}
          <div style={{ padding: '18px 20px', background: surface, border: `1px solid ${border}`, borderRadius: '12px' }}>
            <h3 style={{ fontSize: '10px', fontWeight: 400, color: textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 14px' }}>Severity Guide</h3>
            {TYPES.map(t => (
              <div key={t.value} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <t.icon size={13} style={{ color: t.color }} />
                <div>
                  <span style={{ fontSize: '11px', color: t.color, fontWeight: 400 }}>{t.label}:</span>
                  <span style={{ fontSize: '11px', color: textMuted, marginLeft: '5px', fontWeight: 300 }}>
                    {t.value === 'info'    && 'General announcements'}
                    {t.value === 'success' && 'Good news, launches'}
                    {t.value === 'warning' && 'Maintenance, issues'}
                    {t.value === 'alert'   && 'Critical, urgent'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default AdminNotifications;
