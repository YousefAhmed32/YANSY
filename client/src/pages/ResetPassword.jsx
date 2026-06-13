import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useDispatch } from 'react-redux';
import api from '../utils/api';
import { useTheme } from '../contexts/ThemeContext';

const ResetPassword = () => {
  const { isDark }  = useTheme();
  const navigate    = useNavigate();
  const [params]    = useSearchParams();
  const token       = params.get('token');

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState('');

  const gold      = '#d4af37';
  const bg        = isDark ? '#080806' : '#fafaf9';
  const surface   = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const border    = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const textMain  = isDark ? '#f5f5f0' : '#0a0a0a';
  const textMuted = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';

  useEffect(() => {
    if (!token) setError('Invalid reset link. Please request a new one.');
  }, [token]);

  const strength = () => {
    let s = 0;
    if (password.length >= 8)   s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  };

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength()];
  const strengthColor = ['', '#f87171', '#f59e0b', '#60a5fa', '#34d399'][strength()];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return setError('Invalid reset link.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');

    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => navigate('/app/dashboard'), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. The link may have expired.');
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
        background: surface, border: `1px solid ${border}`,
        borderRadius: '16px', padding: '40px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{
            fontFamily: "'Inter',system-ui,sans-serif",
            fontSize: '20px', fontWeight: 400,
            letterSpacing: '0.3em', color: gold, textTransform: 'uppercase',
          }}>
            YANSY
          </span>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <CheckCircle2 style={{ width: '24px', height: '24px', color: '#34d399' }} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 300, color: textMain, marginBottom: '12px' }}>Password Reset</h2>
            <p style={{ fontSize: '13px', color: textMuted, lineHeight: 1.6 }}>
              Your password has been reset. Redirecting to your dashboard...
            </p>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: '22px', fontWeight: 300, color: textMain, marginBottom: '8px', textAlign: 'center' }}>
              Set New Password
            </h2>
            <p style={{ fontSize: '13px', color: textMuted, textAlign: 'center', marginBottom: '28px', lineHeight: 1.6 }}>
              Choose a strong password for your account.
            </p>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px',
                padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
                background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)',
                fontSize: '12px', color: '#f87171',
              }}>
                <AlertCircle style={{ width: '14px', height: '14px', flexShrink: 0, marginTop: '1px' }} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* New password */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 400, color: textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{
                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                    width: '15px', height: '15px', color: textMuted, pointerEvents: 'none',
                  }} />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '12px 42px',
                      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      border: `1px solid ${border}`,
                      borderRadius: '8px', color: textMain, fontSize: '14px', outline: 'none',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(212,175,55,0.5)'; }}
                    onBlur={e => { e.target.style.borderColor = border; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{
                      position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: 0,
                    }}
                  >
                    {showPw ? <EyeOff style={{ width: '15px', height: '15px' }} /> : <Eye style={{ width: '15px', height: '15px' }} />}
                  </button>
                </div>

                {/* Strength bar */}
                {password.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{
                          flex: 1, height: '3px', borderRadius: '2px',
                          background: i <= strength() ? strengthColor : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                          transition: 'background 0.2s',
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '10px', color: strengthColor }}>{strengthLabel}</span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 400, color: textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{
                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                    width: '15px', height: '15px', color: textMuted, pointerEvents: 'none',
                  }} />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat password"
                    required
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '12px 14px 12px 42px',
                      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      border: `1px solid ${confirm && password !== confirm ? 'rgba(248,113,113,0.5)' : border}`,
                      borderRadius: '8px', color: textMain, fontSize: '14px', outline: 'none',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(212,175,55,0.5)'; }}
                    onBlur={e => { e.target.style.borderColor = confirm && password !== confirm ? 'rgba(248,113,113,0.5)' : border; }}
                  />
                </div>
                {confirm && password !== confirm && (
                  <p style={{ fontSize: '11px', color: '#f87171', marginTop: '6px' }}>Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                style={{
                  width: '100%', padding: '13px',
                  background: (loading || !token) ? 'rgba(212,175,55,0.5)' : gold,
                  border: 'none', borderRadius: '8px',
                  color: '#000', fontSize: '12px', fontWeight: 600,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  cursor: (loading || !token) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
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

export default ResetPassword;
