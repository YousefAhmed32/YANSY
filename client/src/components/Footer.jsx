import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { trackWhatsAppClick } from '../utils/ga4';
import { Mail, Phone, MessageCircle, ArrowUpRight } from 'lucide-react';
import { useState, useCallback } from 'react';

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.15 8.15 0 004.77 1.52V6.76a4.85 4.85 0 01-1-.07z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const SocialLink = (props) => (
  <a
    href={props.href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={props.label}
    title={props.label}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: 32, height: 32, borderRadius: '8px',
      border: '1px solid #E8EBF0', background: '#FFFFFF',
      color: '#5C6370', textDecoration: 'none',
      transition: 'border-color 0.2s, background 0.2s, color 0.2s, transform 0.15s',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.color = props.hoverColor;
      e.currentTarget.style.borderColor = '#C9CDD6';
      e.currentTarget.style.background = '#FAFAFA';
      e.currentTarget.style.transform = 'translateY(-1px)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.color = '#5C6370';
      e.currentTarget.style.borderColor = '#E8EBF0';
      e.currentTarget.style.background = '#FFFFFF';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
  >
    <props.icon />
  </a>
);

const FooterLink = ({ to, label }) => (
  <li style={{ listStyle: 'none' }}>
    <Link
      to={to}
      style={{
        fontSize: 13, color: '#5C6370', textDecoration: 'none',
        display: 'inline-block', lineHeight: 1.5,
        transition: 'color 0.18s',
      }}
      onMouseEnter={e => e.currentTarget.style.color = '#0D1117'}
      onMouseLeave={e => e.currentTarget.style.color = '#5C6370'}
    >
      {label}
    </Link>
  </li>
);

const CopyableRow = ({ icon, value, href, label }) => {
  const RowIcon = icon;
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async e => {
    e.preventDefault();
    e.stopPropagation();
    try { await navigator.clipboard.writeText(value); }
    catch {
      const el = Object.assign(document.createElement('textarea'), { value, style: 'position:fixed;opacity:0' });
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [value]);

  return (
    <div
      onClick={handleCopy}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleCopy(e)}
      aria-label={`${label}: ${value}. Click to copy.`}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        padding: '8px 12px', borderRadius: '8px', border: '1px solid #E8EBF0',
        background: '#FAFAFA', cursor: 'pointer',
        transition: 'background 0.18s, border-color 0.18s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#C9CDD6'; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#FAFAFA'; e.currentTarget.style.borderColor = '#E8EBF0'; }}
    >
      <a
        href={href}
        onClick={e => e.stopPropagation()}
        tabIndex={-1}
        style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#374151', textDecoration: 'none', fontSize: 12.5 }}
      >
        <RowIcon style={{ width: 13, height: 13, color: '#9BA3AE', flexShrink: 0 }} />
        <span>{value}</span>
      </a>
      <span style={{ fontSize: 10.5, fontWeight: 700, color: copied ? '#16a34a' : '#9BA3AE', flexShrink: 0, letterSpacing: '0.04em' }}>
        {copied ? '✓' : 'Copy'}
      </span>
    </div>
  );
};

const Footer = () => {
  const { t } = useTranslation();
  const { isRTL, dir } = useLanguage();

  const whatsappMessage = encodeURIComponent(t('landing.whatsapp.message', 'Hello, I need help with YANSY'));
  const whatsappUrl = `https://api.whatsapp.com/send/?phone=201090385390&text=${whatsappMessage}&type=phone_number&app_absent=0`;

  const LINKS = {
    resources: [
      { label: isRTL ? 'دراسات الحالة' : 'Case Studies', to: '/case-studies' },
      { label: isRTL ? 'معرض الأعمال'  : 'Portfolio',    to: '/portfolio' },
      { label: isRTL ? 'القطاعات'      : 'Industries',   to: '/industries' },
      { label: isRTL ? 'المدونة'        : 'Blog',         to: '/blog' },
      { label: isRTL ? 'الأسعار'       : 'Pricing',      to: '/pricing' },
    ],
    company: [
      // { label: isRTL ? 'من نحن'       : 'About',          to: '/about' },
      { label: isRTL ? 'لماذا YANSY'  : 'Why YANSY',      to: '/why-yansy' },
      { label: isRTL ? 'تواصل معنا'   : 'Contact',        to: '/contact' },
      { label: isRTL ? 'بوابة العملاء' : 'Client Portal', to: '/login' },
    ],
  };

  const SOCIALS = [
    { href: 'https://www.instagram.com/yansyteach/', icon: InstagramIcon, label: 'Instagram', hoverColor: '#E1306C' },
    { href: 'https://www.tiktok.com/@yansytech',    icon: TikTokIcon,    label: 'TikTok',    hoverColor: '#0D1117' },
    { href: 'https://www.facebook.com/share/1AduSCztUH/', icon: FacebookIcon, label: 'Facebook', hoverColor: '#1877F2' },
    { href: whatsappUrl, icon: WhatsAppIcon, label: 'WhatsApp', hoverColor: '#25D366' },
  ];

  return (
    <footer
      dir={dir}
      style={{
        background: '#FAFAFA',
        borderTop: '1px solid #E8EBF0',
      }}
    >
      {/* Top brand statement */}
      <div style={{
        borderBottom: '1px solid #E8EBF0',
        paddingTop: 'clamp(3.5rem, 7vw, 6rem)',
        paddingBottom: 'clamp(3.5rem, 7vw, 6rem)',
        paddingLeft:  'clamp(1.25rem, 5vw, 3rem)',
        paddingRight: 'clamp(1.25rem, 5vw, 3rem)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 'clamp(1.5rem, 3vw, 2.5rem)',
          }}>
            <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
              <Link to="/" style={{ display: 'inline-block', marginBottom: 20 }}>
                <img
                  src="/assets/image/logo/logo-2.png"
                  alt="YANSY"
                  style={{ height: 36, width: 'auto', objectFit: 'contain' }}
                />
              </Link>
              <p style={{
                fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                fontWeight: 700,
                color: '#0D1117',
                letterSpacing: '-0.025em',
                lineHeight: 1.25,
                margin: 0,
                maxWidth: 500,
                fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
              }}>
                {isRTL
                  ? 'نبني المنتجات الرقمية التي تنمّي الأعمال.'
                  : 'We build digital products that grow businesses.'}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: isRTL ? 'flex-start' : 'flex-end', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {SOCIALS.map(s => (
                  <SocialLink key={s.label} href={s.href} icon={s.icon} label={s.label} hoverColor={s.hoverColor} />
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', animation: 'pulse-dot 2s ease-in-out infinite' }} aria-hidden />
                <span style={{ fontSize: 11.5, fontWeight: 600, color: '#16a34a' }}>
                  {isRTL ? 'نقبل مشاريع جديدة' : 'Accepting new projects'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nav grid */}
      <div style={{
        paddingTop: 'clamp(2.5rem, 5vw, 4rem)',
        paddingBottom: 'clamp(2.5rem, 5vw, 4rem)',
        paddingLeft:  'clamp(1.25rem, 5vw, 3rem)',
        paddingRight: 'clamp(1.25rem, 5vw, 3rem)',
        borderBottom: '1px solid #E8EBF0',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 'clamp(2rem, 4vw, 3rem)',
          }}>
            {/* Resources */}
            <div>
              <h3 style={{
                fontSize: 10, fontWeight: 800, color: '#0D1117',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                marginBottom: 18,
                textAlign: isRTL ? 'right' : 'left',
              }}>
                {isRTL ? 'محتوى' : 'Resources'}
              </h3>
              <ul style={{ padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, textAlign: isRTL ? 'right' : 'left' }}>
                {LINKS.resources.map((l, i) => <FooterLink key={i} to={l.to} label={l.label} />)}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 style={{
                fontSize: 10, fontWeight: 800, color: '#0D1117',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                marginBottom: 18,
                textAlign: isRTL ? 'right' : 'left',
              }}>
                {isRTL ? 'الشركة' : 'Company'}
              </h3>
              <ul style={{ padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, textAlign: isRTL ? 'right' : 'left' }}>
                {LINKS.company.map((l, i) => <FooterLink key={i} to={l.to} label={l.label} />)}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 style={{
                fontSize: 10, fontWeight: 800, color: '#0D1117',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                marginBottom: 18,
                textAlign: isRTL ? 'right' : 'left',
              }}>
                {isRTL ? 'تواصل معنا' : 'Contact'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <CopyableRow icon={Mail} value="yansytech@gmail.com" href="mailto:yansytech@gmail.com" label="Email" />
                <CopyableRow icon={Phone} value="+201090385390" href="tel:+201090385390" label="Phone" />
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackWhatsAppClick('footer')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    padding: '8px 12px', borderRadius: '8px',
                    border: '1px solid rgba(34,197,94,0.22)',
                    background: 'rgba(34,197,94,0.04)',
                    textDecoration: 'none',
                    transition: 'background 0.18s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.09)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.04)'}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#16a34a', fontSize: 12.5, fontWeight: 600 }}>
                    <MessageCircle style={{ width: 13, height: 13 }} />
                    {t('landing.footer.whatsapp', 'WhatsApp Support')}
                  </span>
                  <ArrowUpRight style={{ width: 12, height: 12, color: '#16a34a', opacity: 0.6 }} />
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        paddingTop: 20,
        paddingBottom: 20,
        paddingLeft:  'clamp(1.25rem, 5vw, 3rem)',
        paddingRight: 'clamp(1.25rem, 5vw, 3rem)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          }}>
            <p style={{ fontSize: 12, color: '#9BA3AE', margin: 0 }}>
              {t('landing.footer.copyright', '© 2025 YANSY Tech. All rights reserved.')}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {[1, 0.5, 0.25].map((o, i) => (
                <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: '#2563EB', opacity: o }} aria-hidden />
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
