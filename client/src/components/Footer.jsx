import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  MessageCircle,
  Shield,
  Lock,
  Mail,
  Phone,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useState, useCallback } from 'react';

// ─── Social Icons (custom SVGs for pixel-perfect brand logos) ─────────────────
const InstagramIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const TikTokIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.15 8.15 0 004.77 1.52V6.76a4.85 4.85 0 01-1-.07z" />
  </svg>
);

const FacebookIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const WhatsAppIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

// ─── Social Link Component ─────────────────────────────────────────────────────
const SocialLink = ({ href, icon: Icon, label, isDark, color, hoverColor }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    title={label}
    className={`
      group relative flex items-center justify-center w-9 h-9 rounded-xl
      border transition-all duration-300
      ${isDark
        ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
        : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'}
      active:scale-95
    `}
  >
    <Icon
      className={`h-4 w-4 transition-all duration-300 ${color} group-hover:${hoverColor} group-hover:scale-110`}
    />
  </a>
);

// ─── Copy-on-click Contact Row ────────────────────────────────────────────────
const CopyableContact = ({
  icon: Icon,
  value,
  href,
  label,
  isRTL,
  textMuted,
  hoverText,
  borderClass,
  isDark,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        const el = document.createElement('textarea');
        el.value = value;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    },
    [value]
  );

  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50';

  return (
    <div
      className={`group flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border ${borderClass}
        ${hoverBg} transition-all duration-200 cursor-pointer active:scale-[0.98] select-none`}
      onClick={handleCopy}
      title={`Click to copy ${label}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCopy(e)}
      aria-label={`${label}: ${value}. Click to copy.`}
    >
      <a
        href={href}
        onClick={(e) => e.stopPropagation()}
        className={`flex items-center gap-2 ${textMuted} ${hoverText} transition-colors text-sm min-w-0`}
        tabIndex={-1}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{value}</span>
      </a>

      <span
        className={`shrink-0 transition-all duration-200 text-xs font-medium whitespace-nowrap ${
          copied
            ? 'text-green-500'
            : `${textMuted} opacity-0 group-hover:opacity-70`
        }`}
      >
        {copied ? (
          <span className="flex items-center gap-1">
            <Check className="h-3.5 w-3.5" />
            Copied!
          </span>
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </span>
    </div>
  );
};

// ─── Footer Nav Link ──────────────────────────────────────────────────────────
const FooterLink = ({ href, label, textMuted, hoverText, isRTL }) => (
  <li>
    <a
      href={href}
      className={`group flex items-center gap-1 ${textMuted} ${hoverText} transition-colors text-sm`}
    >
      <ChevronRight
        className={`h-3 w-3 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0 ${
          isRTL ? 'rotate-180 order-last' : ''
        }`}
      />
      <span>{label}</span>
    </a>
  </li>
);

// ─── Main Footer ──────────────────────────────────────────────────────────────
const Footer = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { isRTL, dir } = useLanguage();

  // Theme tokens
  const bgClass       = isDark ? 'bg-black'        : 'bg-white';
  const textClass     = isDark ? 'text-white'       : 'text-gray-900';
  const textMuted     = isDark ? 'text-gray-400'    : 'text-gray-500';
  const textSecondary = isDark ? 'text-gray-600'    : 'text-gray-400';
  const borderClass   = isDark ? 'border-white/10'  : 'border-gray-200';
  const borderBottom  = isDark ? 'border-gray-800'  : 'border-gray-200';
  const hoverText     = isDark ? 'hover:text-white' : 'hover:text-gray-900';
  const badgeBorder   = isDark ? 'border-white/10'  : 'border-gray-200';
  const badgeBg       = isDark ? 'bg-white/5'       : 'bg-gray-50';
  const dividerClass  = isDark ? 'border-white/5'   : 'border-gray-100';

  const footerLinks = {
    platform: [
      { label: t('landing.footer.dashboard'), to: '#platform' },
      { label: t('landing.footer.projects'),  to: '#platform' },
      { label: t('landing.footer.messages'),  to: '#platform' },
      { label: t('landing.footer.analytics'), to: '#platform' },
    ],
    solutions: [
      { label: t('landing.footer.clientPortal'),   to: '#solutions' },
      { label: t('landing.footer.teamManagement'), to: '#solutions' },
      { label: t('landing.footer.realTime'),       to: '#solutions' },
      { label: t('landing.footer.security'),       to: '#solutions' },
    ],
    company: [
      { label: t('landing.footer.about'),   to: '#contact' },
      { label: t('landing.footer.privacy'), to: '#contact' },
      { label: t('landing.footer.terms'),   to: '#contact' },
      { label: t('landing.footer.support'), to: '#contact' },
    ],
  };

  const phoneNumber  = '+201090385390';
  const emailAddress = 'yansytech@gmail.com';

  const whatsappMessage = encodeURIComponent(
    t('landing.whatsapp.message', 'Hello, I need help with YANSY')
  );
  const whatsappUrl = `https://api.whatsapp.com/send/?phone=201090385390&text=${whatsappMessage}&type=phone_number&app_absent=0`;

  // ─── Social links config ───────────────────────────────────────────────────
  const socialLinks = [
    {
      href: 'https://www.instagram.com/yansyteach/',
      icon: InstagramIcon,
      label: 'Instagram',
      color: isDark ? 'text-gray-400' : 'text-gray-500',
      hoverColor: 'text-pink-500',
    },
    {
      href: 'https://www.tiktok.com/@yansytech',
      icon: TikTokIcon,
      label: 'TikTok',
      color: isDark ? 'text-gray-400' : 'text-gray-500',
      hoverColor: isDark ? 'text-white' : 'text-gray-900',
    },
    {
      href: 'https://www.facebook.com/share/1AduSCztUH/',
      icon: FacebookIcon,
      label: 'Facebook',
      color: isDark ? 'text-gray-400' : 'text-gray-500',
      hoverColor: 'text-blue-500',
    },
    {
      href: whatsappUrl,
      icon: WhatsAppIcon,
      label: 'WhatsApp',
      color: isDark ? 'text-gray-400' : 'text-gray-500',
      hoverColor: 'text-green-500',
    },
  ];

  return (
    <footer
      className={`${bgClass} ${textClass} border-t ${borderClass} transition-colors duration-300`}
      dir={dir}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-0">

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">

          {/* ── Brand Column ── */}
          <div className="lg:col-span-1 flex flex-col gap-5">
            <Link to="/home" className="inline-flex items-center group w-fit">
              <img
                src="/assets/image/logo/logo.png"
                alt="YANSY"
                className="h-8 md:h-9 w-auto object-contain transition-all duration-500 group-hover:opacity-80 group-hover:scale-105"
              />
            </Link>

            <p className={`${textMuted} text-sm leading-relaxed`}>
              {t('landing.footer.description')}
            </p>

            {/* Trust badge */}
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${badgeBorder} ${badgeBg} w-fit`}
            >
              <Shield className="h-3.5 w-3.5 text-green-500 shrink-0" />
              <span className={`${textMuted} text-xs font-medium`}>
                {t('landing.footer.trusted')}
              </span>
            </div>

            {/* ── Social Media Icons ── */}
            <div className="flex flex-col gap-3">
              <p className={`${textMuted} text-xs font-semibold uppercase tracking-widest`}>
                {t('landing.footer.followUs', 'Follow Us')}
              </p>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                {socialLinks.map((social) => (
                  <SocialLink
                    key={social.label}
                    href={social.href}
                    icon={social.icon}
                    label={social.label}
                    isDark={isDark}
                    color={social.color}
                    hoverColor={social.hoverColor}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── Platform Links ── */}
          <div>
            <h3 className={`${textClass} text-xs font-semibold uppercase tracking-widest mb-5`}>
              {t('landing.footer.platform')}
            </h3>
            <ul className="space-y-3">
              {footerLinks.platform.map((link, i) => (
                <FooterLink
                  key={i}
                  href={link.to}
                  label={link.label}
                  textMuted={textMuted}
                  hoverText={hoverText}
                  isRTL={isRTL}
                />
              ))}
            </ul>
          </div>

          {/* ── Solutions Links ── */}
          <div>
            <h3 className={`${textClass} text-xs font-semibold uppercase tracking-widest mb-5`}>
              {t('landing.footer.solutions')}
            </h3>
            <ul className="space-y-3">
              {footerLinks.solutions.map((link, i) => (
                <FooterLink
                  key={i}
                  href={link.to}
                  label={link.label}
                  textMuted={textMuted}
                  hoverText={hoverText}
                  isRTL={isRTL}
                />
              ))}
            </ul>
          </div>

          {/* ── Company + Contact ── */}
          <div>
            <h3 className={`${textClass} text-xs font-semibold uppercase tracking-widest mb-5`}>
              {t('landing.footer.company')}
            </h3>
            <ul className="space-y-3 mb-6">
              {footerLinks.company.map((link, i) => (
                <FooterLink
                  key={i}
                  href={link.to}
                  label={link.label}
                  textMuted={textMuted}
                  hoverText={hoverText}
                  isRTL={isRTL}
                />
              ))}
            </ul>

            {/* ── Contact Items ── */}
            <div className="space-y-2">

              {/* Email */}
              <CopyableContact
                icon={Mail}
                value={emailAddress}
                href={`mailto:${emailAddress}`}
                label="Email"
                isRTL={isRTL}
                textMuted={textMuted}
                hoverText={hoverText}
                borderClass={borderClass}
                isDark={isDark}
              />

              {/* Phone */}
              <CopyableContact
                icon={Phone}
                value={phoneNumber}
                href={`tel:${phoneNumber}`}
                label="Phone"
                isRTL={isRTL}
                textMuted={textMuted}
                hoverText={hoverText}
                borderClass={borderClass}
                isDark={isDark}
              />

              {/* WhatsApp CTA */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border
                  border-green-500/30 bg-green-500/5 hover:bg-green-500/10 hover:border-green-500/50
                  transition-all duration-200 active:scale-[0.98]"
              >
                <span className="flex items-center gap-2 text-green-500 text-sm font-medium">
                  <MessageCircle className="h-4 w-4 transition-transform duration-300 group-hover:scale-110 shrink-0" />
                  {t('landing.footer.whatsapp', 'WhatsApp Support')}
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-green-500/50 group-hover:text-green-500 transition-colors shrink-0" />
              </a>

            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div
          className={`mt-12 py-6 border-t ${borderBottom} flex flex-col sm:flex-row items-center
            justify-between gap-3 ${isRTL ? 'sm:flex-row-reverse' : ''}`}
        >
          <p className={`${textSecondary} text-sm`}>
            {t('landing.footer.copyright')}
          </p>

          {/* Social icons repeated in bottom bar (compact) — optional, remove if you prefer only top */}
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                title={social.label}
                className={`${textSecondary} hover:${
                  social.label === 'Instagram' ? 'text-pink-500'
                  : social.label === 'TikTok'  ? (isDark ? 'text-white' : 'text-gray-900')
                  : social.label === 'Facebook' ? 'text-blue-500'
                  : 'text-green-500'
                } transition-colors duration-200`}
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}

            <span className={`${isDark ? 'bg-white/10' : 'bg-gray-200'} w-px h-4 mx-1`} />

            <div className={`flex items-center gap-2 ${textSecondary} text-sm`}>
              <Lock className="h-3.5 w-3.5 shrink-0" />
              <span>{t('landing.footer.secure')}</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};
//test
export default Footer;