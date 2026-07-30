import { Component } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const FONT_EN = "'Inter',system-ui,sans-serif";
const FONT_AR = "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif";

/* ─── Fallback UI ─────────────────────────────────────────────────────────── */
// Hardcoded light-theme colors rather than CSS custom properties — this is
// the last-resort UI shown when something has already gone catastrophically
// wrong, so it shouldn't depend on the stylesheet having loaded correctly.
const ErrorFallback = ({ onReset }) => {
  const { isRTL } = useLanguage();
  const font = isRTL ? FONT_AR : FONT_EN;

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        background: '#FFFFFF', color: '#0A0A0A', minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px', textAlign: 'center', fontFamily: font,
      }}
      role="alert"
    >
      <div aria-hidden style={{
        width: 1, height: 80, marginBottom: 40,
        background: 'linear-gradient(to bottom, transparent, rgba(37,99,235,0.5), transparent)',
      }} />

      <p style={{
        fontSize: 10, letterSpacing: isRTL ? 0 : '0.35em', textTransform: isRTL ? 'none' : 'uppercase',
        color: '#2563EB', marginBottom: 16, fontWeight: 600,
      }}>
        {isRTL ? 'خطأ غير متوقع' : 'Unexpected Error'}
      </p>

      <h1 style={{
        fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 700, letterSpacing: isRTL ? 0 : '-0.02em',
        lineHeight: 1.2, color: '#0A0A0A', marginBottom: 16,
      }}>
        {isRTL ? 'حدث خطأ ما' : 'Something went wrong'}
      </h1>

      <p style={{
        fontSize: '1rem', fontWeight: 400, color: 'rgba(10,10,10,0.62)',
        maxWidth: 420, lineHeight: 1.65, marginBottom: 40,
      }}>
        {isRTL
          ? 'حدث خطأ غير متوقع. تم إخطار فريقنا. يرجى محاولة تحديث الصفحة.'
          : 'An unexpected error occurred. Our team has been notified. Please try refreshing the page.'}
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={onReset}
          style={{
            padding: '12px 32px', background: '#2563EB', color: '#FFFFFF',
            fontSize: 11, fontWeight: 600, letterSpacing: isRTL ? 0 : '0.2em', textTransform: isRTL ? 'none' : 'uppercase',
            border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {isRTL ? 'إعادة المحاولة' : 'Try Again'}
        </button>
        <button
          onClick={() => { window.location.href = '/'; }}
          style={{
            padding: '12px 32px', background: 'transparent', color: 'rgba(10,10,10,0.72)',
            fontSize: 11, fontWeight: 500, letterSpacing: isRTL ? 0 : '0.2em', textTransform: isRTL ? 'none' : 'uppercase',
            border: '1px solid rgba(10,10,10,0.15)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {isRTL ? 'الصفحة الرئيسية' : 'Go Home'}
        </button>
      </div>

      <div aria-hidden style={{
        marginTop: 64, width: 1, height: 80,
        background: 'linear-gradient(to bottom, rgba(37,99,235,0.5), transparent)',
      }} />
    </div>
  );
};

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
