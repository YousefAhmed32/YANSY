import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Mail, X, CheckCircle } from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { TK } from '../admin-ui';

const EmailVerificationBanner = () => {
  const { user }                        = useSelector((s) => s.auth);
  const { isRTL }                       = useLanguage();
  const [dismissed, setDismissed]       = useState(false);
  const [sending,   setSending]         = useState(false);
  const [sent,      setSent]            = useState(false);
  const [error,     setError]           = useState('');

  if (!user || user.emailVerified || dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    setError('');
    try {
      await api.post('/auth/resend-verification');
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || (isRTL ? 'فشل الإرسال. يرجى المحاولة مجدداً.' : 'Failed to send. Please try again.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{
      position: 'sticky', top: 0, zIndex: 999,
      background: TK.accentBg,
      borderBottom: `1px solid ${TK.accentBd}`,
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        padding: '10px 24px',
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <Mail style={{ width: 14, height: 14, color: TK.accentHover, flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 12, color: TK.accentHover, fontWeight: 500, minWidth: 200 }}>
          {sent
            ? (isRTL ? 'تم إرسال رابط التحقق — تحقق من بريدك الإلكتروني.' : 'Verification email sent — check your inbox.')
            : (isRTL ? 'يرجى تفعيل بريدك الإلكتروني للوصول إلى جميع الميزات.' : 'Please verify your email address to access all features.')}
        </span>

        {!sent && (
          <button
            onClick={handleResend}
            disabled={sending}
            style={{
              padding: '5px 14px',
              background: TK.ink,
              border: 'none',
              borderRadius: '6px', color: '#FFFFFF',
              fontSize: 11, fontWeight: 600,
              letterSpacing: isRTL ? 0 : '0.06em', textTransform: isRTL ? 'none' : 'uppercase',
              cursor: sending ? 'not-allowed' : 'pointer',
              opacity: sending ? 0.6 : 1,
              transition: 'background 0.2s', whiteSpace: 'nowrap', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (!sending) e.currentTarget.style.background = TK.inkHover; }}
            onMouseLeave={e => { e.currentTarget.style.background = TK.ink; }}
          >
            {sending ? (isRTL ? 'جارٍ الإرسال…' : 'Sending…') : (isRTL ? 'إعادة الإرسال' : 'Resend Email')}
          </button>
        )}

        {sent && <CheckCircle style={{ width: 14, height: 14, color: TK.green, flexShrink: 0 }} />}

        {error && <span style={{ fontSize: 11, color: TK.red }}>{error}</span>}

        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: TK.accent, opacity: 0.6, padding: 2, flexShrink: 0,
            display: 'flex', alignItems: 'center', transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; }}
          title={isRTL ? 'إغلاق' : 'Dismiss'}
          aria-label={isRTL ? 'إغلاق' : 'Dismiss'}
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
