import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import api from '../utils/api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // loading | success | error | no-token

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      return;
    }
    api.get(`/auth/verify-email/${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  const gold = '#d4af37';

  const states = {
    loading: {
      icon: <Loader2 style={{ width: 48, height: 48, color: gold, animation: 'spin 1s linear infinite' }} />,
      title: 'Verifying your email…',
      message: 'Please wait while we verify your email address.',
      action: null,
    },
    success: {
      icon: <CheckCircle style={{ width: 48, height: 48, color: '#34d399' }} />,
      title: 'Email Verified!',
      message: 'Your email address has been successfully verified. Your account is now fully active.',
      action: <Link to="/app/dashboard" style={{
        display: 'inline-block', padding: '12px 28px',
        background: gold, color: '#000',
        fontSize: '12px', fontWeight: 600, letterSpacing: '0.12em',
        textTransform: 'uppercase', textDecoration: 'none', borderRadius: '6px',
      }}>Go to Dashboard</Link>,
    },
    error: {
      icon: <XCircle style={{ width: 48, height: 48, color: '#f87171' }} />,
      title: 'Verification Failed',
      message: 'This verification link is invalid or has expired. Please request a new one from your dashboard.',
      action: <Link to="/app/dashboard" style={{
        display: 'inline-block', padding: '12px 28px',
        background: 'rgba(212,175,55,0.1)', color: gold,
        border: '1px solid rgba(212,175,55,0.3)',
        fontSize: '12px', fontWeight: 600, letterSpacing: '0.12em',
        textTransform: 'uppercase', textDecoration: 'none', borderRadius: '6px',
      }}>Back to Dashboard</Link>,
    },
    'no-token': {
      icon: <Mail style={{ width: 48, height: 48, color: 'rgba(255,255,255,0.4)' }} />,
      title: 'No Token Found',
      message: 'Please use the verification link from your email. If you need a new link, go to your dashboard.',
      action: <Link to="/app/dashboard" style={{
        display: 'inline-block', padding: '12px 28px',
        background: 'rgba(212,175,55,0.1)', color: gold,
        border: '1px solid rgba(212,175,55,0.3)',
        fontSize: '12px', fontWeight: 600, letterSpacing: '0.12em',
        textTransform: 'uppercase', textDecoration: 'none', borderRadius: '6px',
      }}>Go to Dashboard</Link>,
    },
  };

  const current = states[status];

  return (
    <div style={{
      minHeight: '100vh', background: '#080806',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 16px',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        maxWidth: 480, width: '100%',
        background: '#0d0d0b',
        border: '1px solid rgba(212,175,55,0.15)',
        borderRadius: '12px',
        padding: '48px 40px',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{
          fontSize: 13, letterSpacing: '0.4em', textTransform: 'uppercase',
          color: gold, fontFamily: 'Georgia, serif', marginBottom: 32,
        }}>
          YANSY
        </div>

        {/* Icon */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
          {current.icon}
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 24, fontWeight: 300, color: '#f5f5f0',
          letterSpacing: '-0.01em', margin: '0 0 12px',
          fontFamily: "'Inter',system-ui,sans-serif",
        }}>
          {current.title}
        </h1>

        {/* Message */}
        <p style={{
          fontSize: 14, color: 'rgba(255,255,255,0.5)',
          lineHeight: 1.7, margin: '0 0 32px', fontWeight: 300,
        }}>
          {current.message}
        </p>

        {/* Action */}
        {current.action}
      </div>
    </div>
  );
};

export default VerifyEmail;
