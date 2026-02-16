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
        // Fallback for older browsers
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
      {/* Left: icon + value as real link */}
      <a
        href={href}
        onClick={(e) => e.stopPropagation()}
        className={`flex items-center gap-2 ${textMuted} ${hoverText} transition-colors text-sm min-w-0`}
        tabIndex={-1}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{value}</span>
      </a>

      {/* Right: copy feedback */}
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
            {label === 'Phone' ? 'Copied!' : 'Copied!'}
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

              {/* Email — click anywhere on row to copy */}
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

              {/* Phone — click anywhere on row to copy */}
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
            justify-between gap-3 ${
              isRTL ? 'sm:flex-row-reverse' : ''
            }`}
        >
          <p className={`${textSecondary} text-sm`}>
            {t('landing.footer.copyright')}
          </p>
          <div className={`flex items-center gap-2 ${textSecondary} text-sm`}>
            <Lock className="h-3.5 w-3.5 shrink-0" />
            <span>{t('landing.footer.secure')}</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;