import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';
import { useTheme } from '../contexts/ThemeContext';

const ForgotPassword = () => {
  const { isDark } = useTheme();
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  const gold      = '#d4af37';
  const bg        = isDark ? '#080806' : '#fafaf9';
  const surface   = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const border    = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const textMain  = isDark ? '#f5f5f0' : '#0a0a0a';
  const textMuted = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError('Email is required.');
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%', maxWidth: '400px',
        background: surface,
        border: `1px solid ${border}`,
        borderRadius: '16px',
        padding: '40px',
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{
            fontFamily: "'Inter',system-ui,sans-serif",
            fontSize: '20px', fontWeight: 400,
            letterSpacing: '0.3em', color: gold, textTransform: 'uppercase',
          }}>
            YANSY
          </span>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <CheckCircle2 style={{ width: '24px', height: '24px', color: '#34d399' }} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 300, color: textMain, marginBottom: '12px' }}>
              Check your email
            </h2>
            <p style={{ fontSize: '13px', color: textMuted, lineHeight: 1.6, marginBottom: '24px' }}>
              If an account exists for <strong style={{ color: textMain }}>{email}</strong>, we sent a password reset link. Check your inbox and spam folder.
            </p>
            <Link
              to="/login"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '12px', color: gold, textDecoration: 'none',
                letterSpacing: '0.08em',
              }}
            >
              <ArrowLeft style={{ width: '13px', height: '13px' }} />
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: '22px', fontWeight: 300, color: textMain, marginBottom: '8px', textAlign: 'center' }}>
              Reset your password
            </h2>
            <p style={{ fontSize: '13px', color: textMuted, textAlign: 'center', marginBottom: '28px', lineHeight: 1.6 }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
                background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)',
                fontSize: '12px', color: '#f87171',
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 400, color: textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{
                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                    width: '15px', height: '15px', color: textMuted, pointerEvents: 'none',
                  }} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '12px 14px 12px 42px',
                      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      border: `1px solid ${border}`,
                      borderRadius: '8px',
                      color: textMain, fontSize: '14px', outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(212,175,55,0.5)'; }}
                    onBlur={e => { e.target.style.borderColor = border; }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '13px',
                  background: loading ? 'rgba(212,175,55,0.5)' : gold,
                  border: 'none', borderRadius: '8px',
                  color: '#000', fontSize: '12px', fontWeight: 600,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  fontSize: '12px', color: textMuted, textDecoration: 'none', transition: 'color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = gold; }}
                onMouseLeave={e => { e.currentTarget.style.color = textMuted; }}
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
