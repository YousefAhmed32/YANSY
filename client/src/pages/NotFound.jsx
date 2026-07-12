import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

const NotFound = () => (
  <div style={{
    minHeight: '100vh', background: '#FFFFFF',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px', flexDirection: 'column', textAlign: 'center',
  }}>
    <div style={{
      fontSize: 'clamp(72px,14vw,140px)', fontWeight: 800,
      color: '#0D1117', lineHeight: 1,
      letterSpacing: '-0.06em', marginBottom: '4px',
      opacity: 0.06,
    }}>
      404
    </div>

    <h1 style={{
      fontSize: 'clamp(22px,3vw,30px)', fontWeight: 700,
      color: '#0D1117', margin: '-16px 0 10px',
      letterSpacing: '-0.025em',
    }}>
      Page not found
    </h1>

    <p style={{
      fontSize: '15px', fontWeight: 400,
      color: '#6B7280', maxWidth: '360px',
      lineHeight: 1.65, marginBottom: '32px',
    }}>
      The page you're looking for doesn't exist or has been moved.
    </p>

    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
      <Link
        to="/"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          padding: '11px 22px',
          background: '#0D1117', borderRadius: '9px',
          color: '#FFFFFF', fontSize: '13px', fontWeight: 600,
          textDecoration: 'none', transition: 'background 0.2s',
          border: 'none',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#1a2230'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#0D1117'; }}
      >
        <Home style={{ width: '14px', height: '14px' }} />
        Go home
      </Link>
      <button
        onClick={() => window.history.back()}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          padding: '11px 22px',
          background: 'transparent', borderRadius: '9px',
          border: '1px solid #E8EBF0',
          color: '#6B7280', fontSize: '13px', fontWeight: 500,
          cursor: 'pointer', transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.color = '#2563EB'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8EBF0'; e.currentTarget.style.color = '#6B7280'; }}
      >
        <ArrowLeft style={{ width: '14px', height: '14px' }} />
        Go back
      </button>
    </div>
  </div>
);

export default NotFound;
