import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const ResetPassword = () => {
  const navigate    = useNavigate();
  const [params]    = useSearchParams();
  const token       = params.get('token');

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState('');
  const [focused,   setFocused]   = useState(null);
  const formRef = useRef(null);

  useEffect(() => {
    if (!token) setError('Invalid reset link. Please request a new one.');
  }, [token]);

  const shakeForm = () => {
    if (!formRef.current) return;
    formRef.current.style.animation = 'none';
    requestAnimationFrame(() => { formRef.current.style.animation = 'shake 0.4s ease'; });
  };

  const strength = () => {
    let s = 0;
    if (password.length >= 8)          s++;
    if (/[A-Z]/.test(password))        s++;
    if (/[0-9]/.test(password))        s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  };
  const strLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength()];
  const strColor = ['', '#EF4444', '#F59E0B', '#3B82F6', '#10B981'][strength()];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return setError('Invalid reset link.');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); shakeForm(); return; }
    if (password !== confirm) { setError('Passwords do not match.'); shakeForm(); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => navigate('/app/dashboard'), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. The link may have expired.');
      shakeForm();
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (name) => ({
    width: '100%', boxSizing: 'border-box',
    padding: '11px 42px',
    background: '#FFFFFF', border: `1px solid ${focused === name ? '#2563EB' : '#E8EBF0'}`,
    borderRadius: '8px', color: '#0D1117', fontSize: '14px', outline: 'none',
    transition: 'border-color 0.2s', fontFamily: "'Inter',system-ui,sans-serif",
  });

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
        background: '#FFFFFF', border: '1px solid #E8EBF0',
        borderRadius: '16px', padding: '40px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.08em', color: '#0D1117' }}>YANSY</span>
            <span style={{ display: 'block', fontSize: '9px', letterSpacing: '0.2em', color: '#9CA3AF', textTransform: 'uppercase', marginTop: '2px' }}>TECH</span>
          </Link>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <CheckCircle2 style={{ width: '22px', height: '22px', color: '#10B981' }} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0D1117', marginBottom: '10px', letterSpacing: '-0.02em' }}>Password reset</h2>
            <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.6 }}>
              Your password has been reset. Redirecting to your dashboard…
            </p>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0D1117', marginBottom: '8px', textAlign: 'center', letterSpacing: '-0.025em' }}>
              Set new password
            </h2>
            <p style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', marginBottom: '28px', lineHeight: 1.6 }}>
              Choose a strong password for your account.
            </p>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px',
                padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
                background: '#FEF2F2', border: '1px solid #FECACA',
              }}>
                <AlertCircle style={{ width: '14px', height: '14px', color: '#EF4444', flexShrink: 0, marginTop: '1px' }} />
                <p style={{ fontSize: '12px', color: '#B91C1C', margin: 0, lineHeight: 1.5 }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>New password</label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: '#9CA3AF', pointerEvents: 'none' }} />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    style={inputStyle('password')}
                    onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0, display: 'flex' }}>
                    {showPw ? <EyeOff style={{ width: '15px', height: '15px' }} /> : <Eye style={{ width: '15px', height: '15px' }} />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= strength() ? strColor : '#E8EBF0', transition: 'background 0.2s' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '10px', color: strColor, fontWeight: 500 }}>{strLabel}</span>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Confirm password</label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: '#9CA3AF', pointerEvents: 'none' }} />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat password"
                    required
                    style={{ ...inputStyle('confirm'), borderColor: confirm && password !== confirm ? '#FECACA' : (focused === 'confirm' ? '#2563EB' : '#E8EBF0') }}
                    onFocus={() => setFocused('confirm')} onBlur={() => setFocused(null)}
                  />
                </div>
                {confirm && password !== confirm && (
                  <p style={{ fontSize: '11px', color: '#EF4444', marginTop: '5px' }}>Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                style={{
                  width: '100%', padding: '12px',
                  background: (loading || !token) ? '#9CA3AF' : '#0D1117',
                  border: 'none', borderRadius: '8px',
                  color: '#FFFFFF', fontSize: '14px', fontWeight: 600,
                  cursor: (loading || !token) ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
                }}
                onMouseEnter={e => { if (!loading && token) e.currentTarget.style.background = '#1a2230'; }}
                onMouseLeave={e => { if (!loading && token) e.currentTarget.style.background = '#0D1117'; }}
              >
                {loading ? 'Resetting…' : 'Reset Password'}
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

export default ResetPassword;
