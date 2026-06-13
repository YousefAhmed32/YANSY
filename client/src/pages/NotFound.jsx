import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const NotFound = () => {
  const { isDark } = useTheme();

  const gold      = '#d4af37';
  const bg        = isDark ? '#080806' : '#fafaf9';
  const textMain  = isDark ? '#f5f5f0' : '#0a0a0a';
  const textMuted = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';

  return (
    <div style={{
      minHeight: '100vh', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', flexDirection: 'column', textAlign: 'center',
    }}>
      <div style={{
        fontFamily: "'Inter',system-ui,sans-serif",
        fontSize: 'clamp(64px, 12vw, 128px)',
        fontWeight: 700,
        color: gold,
        lineHeight: 1,
        letterSpacing: '-0.04em',
        opacity: 0.6,
        marginBottom: '16px',
      }}>
        404
      </div>

      <h1 style={{
        fontSize: 'clamp(20px, 3vw, 28px)',
        fontWeight: 600,
        color: textMain,
        margin: '0 0 12px',
        letterSpacing: '-0.02em',
      }}>
        Page Not Found
      </h1>

      <p style={{
        fontSize: '14px',
        fontWeight: 300,
        color: textMuted,
        maxWidth: '360px',
        lineHeight: 1.6,
        marginBottom: '32px',
      }}>
        The page you're looking for doesn't exist or has been moved.
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px',
            padding: '11px 20px',
            background: gold,
            border: 'none', borderRadius: '8px',
            color: '#000', fontSize: '11px', fontWeight: 600,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            textDecoration: 'none', transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
        >
          <Home style={{ width: '13px', height: '13px' }} />
          Go Home
        </Link>
        <button
          onClick={() => window.history.back()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px',
            padding: '11px 20px',
            background: 'transparent',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
            borderRadius: '8px',
            color: textMuted, fontSize: '11px', fontWeight: 300,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = gold; e.currentTarget.style.color = gold; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'; e.currentTarget.style.color = textMuted; }}
        >
          <ArrowLeft style={{ width: '13px', height: '13px' }} />
          Go Back
        </button>
      </div>
    </div>
  );
};

export default NotFound;
