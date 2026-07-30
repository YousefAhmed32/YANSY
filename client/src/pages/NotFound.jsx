import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Home } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSEO } from '../hooks/useSEO';

const QUICK_LINKS = [
  { to: '/portfolio', en: 'Portfolio', ar: 'معرض الأعمال' },
  { to: '/case-studies', en: 'Case Studies', ar: 'دراسات الحالة' },
  { to: '/contact', en: 'Contact', ar: 'تواصل معنا' },
];

const NotFound = () => {
  const { isRTL } = useLanguage();

  useSEO({
    title: isRTL ? 'الصفحة غير موجودة | يانسي تك' : 'Page Not Found | YANSY TECH',
    description: isRTL ? 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها.' : "The page you're looking for doesn't exist or has been moved.",
    noIndex: true,
  });

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{
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
        letterSpacing: isRTL ? 0 : '-0.025em',
        fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
      }}>
        {isRTL ? 'الصفحة غير موجودة' : 'Page not found'}
      </h1>

      <p style={{
        fontSize: '15px', fontWeight: 400,
        color: '#6B7280', maxWidth: '360px',
        lineHeight: 1.65, marginBottom: '32px',
        fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
      }}>
        {isRTL ? 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها.' : "The page you're looking for doesn't exist or has been moved."}
      </p>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '32px' }}>
        <Link to="/" className="btn-primary" style={{ fontSize: '13px', padding: '11px 22px', textDecoration: 'none' }}>
          <Home style={{ width: '14px', height: '14px' }} />
          {isRTL ? 'الرئيسية' : 'Go home'}
        </Link>
        <button
          onClick={() => window.history.back()}
          className="btn-secondary"
          style={{ fontSize: '13px', padding: '11px 22px' }}
        >
          {isRTL ? <ArrowRight style={{ width: '14px', height: '14px' }} /> : <ArrowLeft style={{ width: '14px', height: '14px' }} />}
          {isRTL ? 'رجوع' : 'Go back'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {QUICK_LINKS.map(l => (
          <Link
            key={l.to}
            to={l.to}
            style={{ fontSize: '12.5px', fontWeight: 600, color: '#2563EB', textDecoration: 'none' }}
          >
            {isRTL ? l.ar : l.en}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default NotFound;
