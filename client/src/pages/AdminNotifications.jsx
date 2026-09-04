import { useState } from 'react';
import { Bell, Send, Users, User, UserCheck, Star, Crown, Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { TK, RADIUS, PageHeader, Card, SectionHead, Button, TextInput } from '../admin-ui';

const getTypes = (language) => [
  { value: 'info',    label: language === 'ar' ? 'معلومة' : 'Info',    icon: Info,          color: '#60a5fa' },
  { value: 'success', label: language === 'ar' ? 'نجاح' : 'Success', icon: CheckCircle2,  color: '#34d399' },
  { value: 'warning', label: language === 'ar' ? 'تحذير' : 'Warning', icon: AlertTriangle, color: '#f59e0b' },
  { value: 'alert',   label: language === 'ar' ? 'تنبيه' : 'Alert',   icon: AlertCircle,   color: '#f87171' },
];

const getTargets = (language) => [
  { value: '',            label: language === 'ar' ? 'جميع المستخدمين' : 'All Users',   icon: Users,     description: language === 'ar' ? 'كل حساب نشط' : 'Every active account' },
  { value: 'USER',        label: language === 'ar' ? 'المستخدمون فقط' : 'Users Only',  icon: User,      description: language === 'ar' ? 'العملاء الأساسيون' : 'Standard clients' },
  { value: 'MANAGER',     label: language === 'ar' ? 'المدراء' : 'Managers',    icon: UserCheck, description: language === 'ar' ? 'المدراء وما فوق' : 'Managers and above' },
  { value: 'ADMIN',       label: language === 'ar' ? 'المسؤولون' : 'Admins',      icon: Star,      description: language === 'ar' ? 'المسؤولون والمسؤولون العامون' : 'Admins and super admins' },
  { value: 'SUPER_ADMIN', label: language === 'ar' ? 'المسؤول العام' : 'Super Admin', icon: Crown,     description: language === 'ar' ? 'المسؤولون العامون فقط' : 'Super admins only' },
];

const labelStyle = { display: 'block', fontSize: '11px', color: TK.textMuted, marginBottom: '8px', letterSpacing: '0.06em', textTransform: 'uppercase' };

const BroadcastHistory = ({ items, language, types }) => {
  if (items.length === 0) return null;
  return (
    <Card>
      <SectionHead title={language === 'ar' ? 'البثوث الأخيرة' : 'Recent Broadcasts'} />
      {items.map((b, i) => {
        const typeCfg = types.find(t => t.value === b.type) || types[0];
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', borderBottom: i < items.length - 1 ? `1px solid ${TK.borderSoft}` : 'none' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: RADIUS.md, background: `${typeCfg.color}12`, border: `1px solid ${typeCfg.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <typeCfg.icon size={13} style={{ color: typeCfg.color }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: TK.text }}>{b.title}</div>
              <div style={{ fontSize: '10px', color: TK.textMuted, marginTop: '2px' }}>{b.message}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '11px', color: TK.green, fontWeight: 500 }}>{language === 'ar' ? `تم الإرسال إلى ${b.count}` : `${b.count} sent`}</div>
              <div style={{ fontSize: '10px', color: TK.textMuted }}>{b.target || (language === 'ar' ? 'الكل' : 'all')}</div>
            </div>
          </div>
        );
      })}
    </Card>
  );
};

const AdminNotifications = () => {
  const { language } = useLanguage();
  const [form, setForm] = useState({ title: '', message: '', type: 'info', targetRole: '', link: '' });
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(false);
  const [history, setHistory] = useState([]);

  const TYPES = getTypes(language);
  const TARGETS = getTargets(language);
  const selectedType   = TYPES.find(t => t.value === form.type) || TYPES[0];
  const selectedTarget = TARGETS.find(t => t.value === form.targetRole) || TARGETS[0];

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error(language === 'ar' ? 'العنوان والرسالة مطلوبان' : 'Title and message are required');
      return;
    }
    setSending(true);
    try {
      const payload = { title: form.title, message: form.message, type: form.type };
      if (form.targetRole) payload.targetRole = form.targetRole;
      if (form.link.trim()) payload.link = form.link.trim();

      const res = await api.post('/notifications/broadcast', payload);
      toast.success(language === 'ar' ? `تم الإرسال إلى ${res.data.count} مستخدم` : `Sent to ${res.data.count} users`);
      setHistory(prev => [{ ...payload, count: res.data.count, target: form.targetRole || 'all', sentAt: new Date() }, ...prev.slice(0, 9)]);
      setForm({ title: '', message: '', type: 'info', targetRole: '', link: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || (language === 'ar' ? 'فشل إرسال البث' : 'Failed to send broadcast'));
    } finally {
      setSending(false);
    }
  };

  const disableSend = sending || !form.title.trim() || !form.message.trim();

  return (
    <div style={{ minHeight: '100vh', background: TK.bg, padding: '32px 32px 60px' }}>
      <PageHeader
        icon={Bell}
        eyebrow={language === 'ar' ? 'التواصل' : 'Communication'}
        title={language === 'ar' ? 'مركز الإشعارات' : 'Notification Center'}
        subtitle={language === 'ar' ? 'بث الإعلانات للمستخدمين حسب الدور أو على مستوى المنصة' : 'Broadcast announcements to users by role or platform-wide'}
      />

      <div className="admin-notif-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: '24px' }}>
        <style>{`@media (max-width: 860px) { .admin-notif-grid { grid-template-columns: 1fr !important; } }`}</style>
        {/* Compose panel */}
        <div style={{ minWidth: 0 }}>
          <Card style={{ marginBottom: '20px' }}>
            <SectionHead title={language === 'ar' ? 'إنشاء بث' : 'Compose Broadcast'} />

            {/* Type */}
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>{language === 'ar' ? 'النوع' : 'Type'}</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setForm(f => ({ ...f, type: t.value }))}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: RADIUS.md, background: form.type === t.value ? `${t.color}15` : 'transparent', border: `1px solid ${form.type === t.value ? t.color + '40' : TK.border}`, color: form.type === t.value ? t.color : TK.textMuted, fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    <t.icon size={12} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target */}
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>{language === 'ar' ? 'الجمهور' : 'Audience'}</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {TARGETS.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setForm(f => ({ ...f, targetRole: t.value }))}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: RADIUS.md, background: form.targetRole === t.value ? TK.accentBg : 'transparent', border: `1px solid ${form.targetRole === t.value ? TK.accentBd : TK.border}`, color: form.targetRole === t.value ? TK.accent : TK.textMuted, fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    <t.icon size={12} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>{language === 'ar' ? 'العنوان *' : 'Title *'}</label>
              <TextInput
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder={language === 'ar' ? 'عنوان الإشعار...' : 'Notification title...'}
                maxLength={100}
              />
            </div>

            {/* Message */}
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>{language === 'ar' ? 'الرسالة *' : 'Message *'}</label>
              <div className="au-input" style={{ background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: RADIUS.md, padding: '9px 13px' }}>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder={language === 'ar' ? 'اكتب رسالتك...' : 'Write your message...'}
                  rows={4}
                  maxLength={500}
                  style={{ width: '100%', fontSize: '13px', color: TK.text, resize: 'vertical', fontFamily: 'inherit', display: 'block' }}
                />
              </div>
              <div style={{ fontSize: '10px', color: TK.textMuted, textAlign: 'right', marginTop: '4px' }}>{form.message.length}/500</div>
            </div>

            {/* Link */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>{language === 'ar' ? 'رابط الإجراء (اختياري)' : 'Action Link (optional)'}</label>
              <TextInput
                value={form.link}
                onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                placeholder="/app/billing"
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Button variant="secondary" onClick={() => setPreview(p => !p)}>
                {preview ? (language === 'ar' ? 'إخفاء' : 'Hide') : (language === 'ar' ? 'معاينة' : 'Preview')}
              </Button>
              <Button
                variant="primary"
                icon={Send}
                loading={sending}
                disabled={disableSend}
                onClick={handleSend}
                style={{ flex: 1 }}
              >
                {sending ? (language === 'ar' ? 'جارٍ الإرسال...' : 'Sending...') : (language === 'ar' ? `إرسال إلى ${selectedTarget.label}` : `Send to ${selectedTarget.label}`)}
              </Button>
            </div>
          </Card>

          <BroadcastHistory items={history} language={language} types={TYPES} />
        </div>

        {/* Preview + info panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {preview && (
            <Card>
              <SectionHead title={language === 'ar' ? 'معاينة' : 'Preview'} />
              <div style={{ padding: '14px', background: `${selectedType.color}10`, border: `1px solid ${selectedType.color}25`, borderRadius: RADIUS.lg }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <selectedType.icon size={14} style={{ color: selectedType.color }} />
                  <span style={{ fontSize: '12px', fontWeight: 500, color: selectedType.color }}>{form.title || (language === 'ar' ? 'عنوان الإشعار' : 'Notification Title')}</span>
                </div>
                <p style={{ fontSize: '11px', color: TK.textMuted, margin: 0 }}>{form.message || (language === 'ar' ? 'ستظهر رسالتك هنا...' : 'Your message will appear here...')}</p>
                {form.link && <div style={{ fontSize: '10px', color: TK.accent, marginTop: '8px' }}>&rarr; {form.link}</div>}
              </div>
              <div style={{ marginTop: '10px', fontSize: '10px', color: TK.textMuted }}>
                {language === 'ar' ? 'إلى' : 'To'}: <strong style={{ color: TK.text }}>{selectedTarget.label}</strong> &middot; {selectedTarget.description}
              </div>
            </Card>
          )}

          {/* Tips */}
          <Card>
            <SectionHead title={language === 'ar' ? 'نصائح' : 'Tips'} />
            {[
              { icon: Bell,  text: language === 'ar' ? 'تظهر الإشعارات في أيقونة الجرس لجميع المستلمين.' : 'Notifications appear in the bell icon for all recipients.' },
              { icon: Send,  text: language === 'ar' ? 'تسليم فوري عبر Socket.IO للمستخدمين المتصلين.' : 'Real-time delivery via Socket.IO for online users.' },
              { icon: Users, text: language === 'ar' ? 'الحسابات غير النشطة أو الموقوفة مستثناة من البثوث.' : 'Inactive/suspended accounts are excluded from broadcasts.' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                <Icon size={13} style={{ color: TK.accent, flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '11px', color: TK.textMuted }}>{text}</span>
              </div>
            ))}
          </Card>

          {/* Severity guide */}
          <Card>
            <SectionHead title={language === 'ar' ? 'دليل الشدة' : 'Severity Guide'} />
            {TYPES.map(t => (
              <div key={t.value} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <t.icon size={13} style={{ color: t.color }} />
                <div>
                  <span style={{ fontSize: '11px', color: t.color, fontWeight: 500 }}>{t.label}:</span>
                  <span style={{ fontSize: '11px', color: TK.textMuted, marginLeft: '5px' }}>
                    {t.value === 'info'    && (language === 'ar' ? 'إعلانات عامة' : 'General announcements')}
                    {t.value === 'success' && (language === 'ar' ? 'أخبار سارة، إطلاقات' : 'Good news, launches')}
                    {t.value === 'warning' && (language === 'ar' ? 'صيانة، مشكلات' : 'Maintenance, issues')}
                    {t.value === 'alert'   && (language === 'ar' ? 'حرج، عاجل' : 'Critical, urgent')}
                  </span>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;
