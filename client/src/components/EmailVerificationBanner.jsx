import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Mail, X, CheckCircle } from 'lucide-react';
import api from '../utils/api';

const EmailVerificationBanner = () => {
  const { user } = useSelector((s) => s.auth);
  const [dismissed, setDismissed]   = useState(false);
  const [sending,   setSending]     = useState(false);
  const [sent,      setSent]        = useState(false);
  const [error,     setError]       = useState('');

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

  const gold = '#d4af37';

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 999,
      background: 'rgba(10,9,7,0.98)',
      borderBottom: '1px solid rgba(212,175,55,0.2)',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        padding: '10px 24px',
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <Mail style={{ width: 14, height: 14, color: gold, flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 300, minWidth: 200 }}>
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
              background: 'transparent',
              border: `1px solid rgba(212,175,55,0.4)`,
              borderRadius: 4, color: gold,
              fontSize: 10, letterSpacing: '0.1em',
              textTransform: 'uppercase', cursor: sending ? 'not-allowed' : 'pointer',
              fontWeight: 400, opacity: sending ? 0.6 : 1,
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { if (!sending) e.currentTarget.style.background = 'rgba(212,175,55,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            {sending ? 'Sending…' : 'Resend Email'}
          </button>
        )}

        {sent && <CheckCircle style={{ width: 14, height: 14, color: '#34d399', flexShrink: 0 }} />}

        {error && (
          <span style={{ fontSize: 11, color: '#f87171' }}>{error}</span>
        )}

        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.3)', padding: 2, flexShrink: 0,
            display: 'flex', alignItems: 'center',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
          title="Dismiss"
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
