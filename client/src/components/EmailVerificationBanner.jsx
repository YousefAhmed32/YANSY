import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Mail, X, CheckCircle } from 'lucide-react';
import api from '../utils/api';

const EmailVerificationBanner = () => {
  const { user }                        = useSelector((s) => s.auth);
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
      setError(err.response?.data?.error || 'Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 999,
      background: '#EFF6FF',
      borderBottom: '1px solid #DBEAFE',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        padding: '10px 24px',
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <Mail style={{ width: 14, height: 14, color: '#2563EB', flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 12, color: '#1D4ED8', fontWeight: 500, minWidth: 200 }}>
          {sent
            ? 'Verification email sent — check your inbox.'
            : 'Please verify your email address to access all features.'}
        </span>

        {!sent && (
          <button
            onClick={handleResend}
            disabled={sending}
            style={{
              padding: '5px 14px',
              background: '#2563EB',
              border: 'none',
              borderRadius: '6px', color: '#FFFFFF',
              fontSize: 11, fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              cursor: sending ? 'not-allowed' : 'pointer',
              opacity: sending ? 0.6 : 1,
              transition: 'background 0.2s', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { if (!sending) e.currentTarget.style.background = '#1D4ED8'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#2563EB'; }}
          >
            {sending ? 'Sending…' : 'Resend Email'}
          </button>
        )}

        {sent && <CheckCircle style={{ width: 14, height: 14, color: '#10B981', flexShrink: 0 }} />}

        {error && <span style={{ fontSize: 11, color: '#EF4444' }}>{error}</span>}

        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#93C5FD', padding: 2, flexShrink: 0,
            display: 'flex', alignItems: 'center', transition: 'color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#2563EB'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#93C5FD'; }}
          title="Dismiss"
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
