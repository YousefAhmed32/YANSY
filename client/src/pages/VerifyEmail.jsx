import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import api from '../utils/api';
import { useSEO } from '../hooks/useSEO';

const VerifyEmail = () => {
  useSEO({ title: 'Verify Email | YANSY TECH', noIndex: true });

  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!token) { setStatus('no-token'); return; }
    api.get(`/auth/verify-email/${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  const states = {
    loading: {
      icon: <Loader2 style={{ width: 44, height: 44, color: '#2563EB', animation: 'spin 1s linear infinite' }} />,
      title: 'Verifying your email…',
      message: 'Please wait while we verify your email address.',
      action: null,
    },
    success: {
      icon: <CheckCircle style={{ width: 44, height: 44, color: '#10B981' }} />,
      title: 'Email verified!',
      message: 'Your email address has been successfully verified. Your account is now fully active.',
      action: (
        <Link to="/app/dashboard" style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          padding: '11px 24px',
          background: '#0D1117', borderRadius: '9px',
          color: '#FFFFFF', fontSize: '13px', fontWeight: 600,
          textDecoration: 'none', transition: 'background 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1a2230'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#0D1117'; }}
        >
          Go to Dashboard
        </Link>
      ),
    },
    error: {
      icon: <XCircle style={{ width: 44, height: 44, color: '#EF4444' }} />,
      title: 'Verification failed',
      message: 'This verification link is invalid or has expired. Please request a new one from your dashboard.',
      action: (
        <Link to="/app/dashboard" style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          padding: '11px 24px',
          background: 'transparent', border: '1px solid #E8EBF0', borderRadius: '9px',
          color: '#6B7280', fontSize: '13px', fontWeight: 500,
          textDecoration: 'none', transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.color = '#2563EB'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8EBF0'; e.currentTarget.style.color = '#6B7280'; }}
        >
          Back to Dashboard
        </Link>
      ),
    },
    'no-token': {
      icon: <Mail style={{ width: 44, height: 44, color: '#9CA3AF' }} />,
      title: 'No token found',
      message: 'Please use the verification link from your email. If you need a new link, go to your dashboard.',
      action: (
        <Link to="/app/dashboard" style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          padding: '11px 24px',
          background: 'transparent', border: '1px solid #E8EBF0', borderRadius: '9px',
          color: '#6B7280', fontSize: '13px', fontWeight: 500,
          textDecoration: 'none', transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.color = '#2563EB'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8EBF0'; e.currentTarget.style.color = '#6B7280'; }}
        >
          Go to Dashboard
        </Link>
      ),
    },
  };

  const current = states[status];

  return (
    <div style={{
      minHeight: '100vh', background: '#F6F7F9',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 16px',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        maxWidth: 440, width: '100%',
        background: '#FFFFFF', border: '1px solid #E8EBF0',
        borderRadius: '16px', padding: '48px 40px',
        textAlign: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.08em', color: '#0D1117', marginBottom: '2px' }}>YANSY</div>
          <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '32px' }}>TECH</div>
        </Link>

        <div style={{ marginBottom: '22px', display: 'flex', justifyContent: 'center' }}>
          {current.icon}
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0D1117', letterSpacing: '-0.02em', margin: '0 0 10px' }}>
          {current.title}
        </h1>

        <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.65, margin: '0 0 28px', fontWeight: 400 }}>
          {current.message}
        </p>

        {current.action}
      </div>
    </div>
  );
};

export default VerifyEmail;
