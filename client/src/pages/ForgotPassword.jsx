import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';

const ForgotPassword = () => {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');
  const formRef = useRef(null);

  const shakeForm = () => {
    if (!formRef.current) return;
    formRef.current.style.animation = 'none';
    requestAnimationFrame(() => { formRef.current.style.animation = 'shake 0.4s ease'; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required.'); shakeForm(); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset email. Please try again.');
      shakeForm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#F6F7F9',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-7px)} 40%{transform:translateX(7px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
      `}</style>

      <div ref={formRef} style={{
        width: '100%', maxWidth: '400px',
        background: '#FFFFFF',
        border: '1px solid #E8EBF0',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.08em', color: '#0D1117' }}>YANSY</span>
            <span style={{ display: 'block', fontSize: '9px', letterSpacing: '0.2em', color: '#9CA3AF', textTransform: 'uppercase', marginTop: '2px' }}>TECH</span>
          </Link>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <CheckCircle2 style={{ width: '22px', height: '22px', color: '#10B981' }} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0D1117', marginBottom: '10px', letterSpacing: '-0.02em' }}>
              Check your email
            </h2>
            <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.6, marginBottom: '28px' }}>
              If an account exists for <strong style={{ color: '#0D1117', fontWeight: 500 }}>{email}</strong>, we sent a reset link. Check your inbox and spam folder.
            </p>
            <Link
              to="/login"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#2563EB', textDecoration: 'none', fontWeight: 500 }}
              onMouseEnter={e => { e.currentTarget.style.color = '#1D4ED8'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#2563EB'; }}
            >
              <ArrowLeft style={{ width: '13px', height: '13px' }} />
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0D1117', marginBottom: '8px', textAlign: 'center', letterSpacing: '-0.025em' }}>
              Reset your password
            </h2>
            <p style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', marginBottom: '28px', lineHeight: 1.6 }}>
              Enter your email address and we'll send you a reset link.
            </p>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px',
                padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
                background: '#FEF2F2', border: '1px solid #FECACA',
              }}>
                <svg style={{ width: '14px', height: '14px', color: '#EF4444', flexShrink: 0, marginTop: '1px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p style={{ fontSize: '12px', color: '#B91C1C', margin: 0, lineHeight: 1.5 }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="fp-email" style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '6px', letterSpacing: '0.01em' }}>
                  Email address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{
                    position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)',
                    width: '15px', height: '15px', color: '#9CA3AF', pointerEvents: 'none',
                  }} />
                  <input
                    id="fp-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '11px 14px 11px 40px',
                      background: '#FFFFFF', border: '1px solid #E8EBF0',
                      borderRadius: '8px', color: '#0D1117', fontSize: '14px', outline: 'none',
                      transition: 'border-color 0.2s', fontFamily: "'Inter',system-ui,sans-serif",
                    }}
                    onFocus={e => { e.target.style.borderColor = '#2563EB'; }}
                    onBlur={e => { e.target.style.borderColor = '#E8EBF0'; }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '12px',
                  background: loading ? '#9CA3AF' : '#0D1117',
                  border: 'none', borderRadius: '8px',
                  color: '#FFFFFF', fontSize: '14px', fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#1a2230'; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#0D1117'; }}
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Link
                to="/login"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6B7280', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#2563EB'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#6B7280'; }}
              >
                <ArrowLeft style={{ width: '13px', height: '13px' }} />
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
