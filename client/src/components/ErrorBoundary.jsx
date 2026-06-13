import { Component } from 'react';

/* ─── Fallback UI ─────────────────────────────────────────────────────────── */
const ErrorFallback = ({ onReset }) => (
  <div
    className="bg-black text-white min-h-screen flex flex-col items-center justify-center px-6 text-center"
    role="alert"
  >
    {/* Gold accent */}
    <div
      aria-hidden
      style={{
        width: 1,
        height: 80,
        background: 'linear-gradient(to bottom, transparent, rgba(212,175,55,0.5), transparent)',
        marginBottom: 40,
      }}
    />

    {/* Eyebrow */}
    <p
      style={{
        fontSize: 10,
        letterSpacing: '0.35em',
        textTransform: 'uppercase',
        color: 'rgba(212,175,55,0.55)',
        marginBottom: 16,
        fontWeight: 300,
      }}
    >
      Unexpected Error
    </p>

    {/* Heading */}
    <h1
      style={{
        fontFamily: "'Inter',system-ui,sans-serif",
        fontSize: 'clamp(2.4rem, 5vw, 4rem)',
        fontWeight: 300,
        letterSpacing: '-0.02em',
        lineHeight: 1.1,
        color: '#fff',
        marginBottom: 16,
      }}
    >
      Something went wrong
    </h1>

    {/* Sub */}
    <p
      style={{
        fontSize: '1rem',
        fontWeight: 300,
        color: 'rgba(255,255,255,0.4)',
        maxWidth: 400,
        lineHeight: 1.65,
        marginBottom: 40,
      }}
    >
      A critical error occurred. Our team has been notified. Please try refreshing the page.
    </p>

    {/* Actions */}
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
      <button
        onClick={onReset}
        style={{
          padding: '12px 32px',
          background: '#d4af37',
          color: '#000',
          fontSize: 11,
          fontWeight: 400,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Try Again
      </button>
      <button
        onClick={() => { window.location.href = '/'; }}
        style={{
          padding: '12px 32px',
          background: 'transparent',
          color: 'rgba(255,255,255,0.5)',
          fontSize: 11,
          fontWeight: 300,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          border: '1px solid rgba(255,255,255,0.12)',
          cursor: 'pointer',
        }}
      >
        Go Home
      </button>
    </div>

    {/* Bottom accent */}
    <div
      aria-hidden
      style={{
        marginTop: 64,
        width: 1,
        height: 80,
        background: 'linear-gradient(to bottom, rgba(212,175,55,0.5), transparent)',
      }}
    />
  </div>
);

/* ─── Error Boundary Class Component ─────────────────────────────────────── */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production, send to error monitoring service (Sentry, etc.)
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Caught error:', error);
      console.error('[ErrorBoundary] Component stack:', info.componentStack);
    }
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={this.handleReset} />;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
