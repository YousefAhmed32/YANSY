import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { MessageCircle, Shield, Lock, Mail, Phone } from 'lucide-react';

const Footer = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { isRTL, dir } = useLanguage();

  // Theme-aware classes
  const bgClass = isDark ? 'bg-black' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-600';
  const textSecondary = isDark ? 'text-gray-500' : 'text-gray-500';
  const borderClass = isDark ? 'border-white/10' : 'border-gray-200';
  const borderDark = isDark ? 'border-gray-800' : 'border-gray-300';
  const hoverText = isDark ? 'hover:text-white' : 'hover:text-gray-900';

  const footerLinks = {
    platform: [
      { label: t('landing.footer.dashboard'), to: '#platform' },
      { label: t('landing.footer.projects'), to: '#platform' },
      { label: t('landing.footer.messages'), to: '#platform' },
      { label: t('landing.footer.analytics'), to: '#platform' },
    ],
    solutions: [
      { label: t('landing.footer.clientPortal'), to: '#solutions' },
      { label: t('landing.footer.teamManagement'), to: '#solutions' },
      { label: t('landing.footer.realTime'), to: '#solutions' },
      { label: t('landing.footer.security'), to: '#solutions' },
    ],
    company: [
      { label: t('landing.footer.about'), to: '#contact' },
      { label: t('landing.footer.privacy'), to: '#contact' },
      { label: t('landing.footer.terms'), to: '#contact' },
      { label: t('landing.footer.support'), to: '#contact' },
    ],
  };

  const whatsappNumber = '201090385390';
  const whatsappMessage = encodeURIComponent(
    t('landing.whatsapp.message', 'Hello, I need help with YANSY')
  );
  const whatsappUrl = `https://api.whatsapp.com/send/?phone=${whatsappNumber}&text=${whatsappMessage}&type=phone_number&app_absent=0`;

  return (
    <footer className={`${bgClass} ${textClass} border-t ${borderClass} transition-colors duration-300`} dir={dir}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12`}>
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link
              to="/home"
              className="inline-flex items-center mb-6 group"
            >
              <img
                src="/assets/image/logo/logo.png"
                alt="YANSY"
                className="h-8 md:h-9 w-auto object-contain transition-all duration-500 group-hover:opacity-80 group-hover:scale-105"
              />
            </Link>

            <p className={`${textMuted} text-sm leading-relaxed mb-6`}>
              {t('landing.footer.description')}
            </p>
            <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'} ${textMuted} text-sm`}>
              <Shield className="h-4 w-4" />
              <span>{t('landing.footer.trusted')}</span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className={`${textClass} font-semibold mb-4`}>{t('landing.footer.platform')}</h3>
            <ul className="space-y-3">
              {footerLinks.platform.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.to}
                    className={`${textMuted} ${hoverText} transition-colors text-sm`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions Links */}
          <div>
            <h3 className={`${textClass} font-semibold mb-4`}>{t('landing.footer.solutions')}</h3>
            <ul className="space-y-3">
              {footerLinks.solutions.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.to}
                    className={`${textMuted} ${hoverText} transition-colors text-sm`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company & Contact */}
          <div>
            <h3 className={`${textClass} font-semibold mb-4`}>{t('landing.footer.company')}</h3>
            <ul className="space-y-3 mb-6">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.to}
                    className={`${textMuted} ${hoverText} transition-colors text-sm`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="space-y-3">
              <a
                href={`mailto:yansytech@gmail.com`}
                className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'} ${textMuted} ${hoverText} transition-colors text-sm`}
              >
                <Mail className="h-4 w-4" />
                <span>yansytech@gmail.com</span>
              </a>
              {/* Enhanced WhatsApp Support Link */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'} px-4 py-2 border ${borderClass} rounded-sm ${textMuted} ${hoverText} transition-all duration-300 hover:border-white/30 hover:bg-white/5 text-sm`}
              >
                <MessageCircle className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                <span className="font-medium">{t('landing.footer.whatsapp', 'WhatsApp Support')}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`mt-12 pt-8 border-t ${borderDark} flex flex-col md:flex-row justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          <p className={`${textSecondary} text-sm mb-4 md:mb-0`}>
            {t('landing.footer.copyright')}
          </p>
          <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'} ${textSecondary} text-sm`}>
            <Lock className="h-4 w-4" />
            <span>{t('landing.footer.secure')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
