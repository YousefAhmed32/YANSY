import { useState, useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { trackCTAClick, trackWhatsAppClick } from '../utils/ga4';
import WhatsAppGlyph from './WhatsAppGlyph';
import { useIsMobile } from '../hooks/useIsMobile';
import './MobileStickyBar.css';

const WA_URL = 'https://wa.me/201090385390';

const MobileStickyBar = ({ onStartProject, isRTL, hidden = false }) => {
  const isMobile = useIsMobile();
  const [pastActions, setPastActions] = useState(false);
  const [atContact, setAtContact] = useState(false);

  useEffect(() => {
    if (!isMobile) return undefined;
    const actions = document.querySelector('#hero .hero-cta-group');
    const contact = document.querySelector('#home-contact');
    if (!actions) return undefined;

    // Observe the real actions, including restored scroll positions and reflow.
    // A fixed scroll threshold overlaps the hero on narrow phones.
    const heroObserver = new IntersectionObserver(([entry]) => {
      setPastActions(!entry.isIntersecting && entry.boundingClientRect.bottom <= 68);
    }, { rootMargin: '-68px 0px 0px', threshold: 0 });
    heroObserver.observe(actions);

    const contactObserver = new IntersectionObserver(([entry]) => setAtContact(entry.isIntersecting));
    if (contact) contactObserver.observe(contact);
    return () => {
      heroObserver.disconnect();
      contactObserver.disconnect();
    };
  }, [isMobile]);

  const visible = isMobile && pastActions && !atContact && !hidden;
  const waText = isRTL
    ? 'مرحباً YANSY، حابب أتكلم معاكم عن مشروع جديد'
    : "Hi YANSY, I'd like to discuss a new project.";

  return (
    <aside
      className={`ys-mobile-bar${visible ? ' is-visible' : ''}`}
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-label={isRTL ? 'تواصل معنا' : 'Get in touch'}
      aria-hidden={!visible}
      inert={!visible}
    >
      <a
        href={`${WA_URL}?text=${encodeURIComponent(waText)}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackWhatsAppClick('mobile-sticky-bar')}
        className="ys-mobile-wa-cta"
      >
        <span className="ys-mobile-wa-icon"><WhatsAppGlyph size={19} /></span>
        <span>{isRTL ? 'نتكلم واتساب' : 'WhatsApp us'}</span>
      </a>
      <button
        type="button"
        className="ys-mobile-project-cta"
        onClick={() => {
          trackCTAClick('mobile-sticky-start-project');
          onStartProject?.();
        }}
      >
        <span>{isRTL ? 'ناقش مشروعك' : 'Discuss a project'}</span>
        <ArrowUpRight size={17} className="icon-directional" aria-hidden />
      </button>
    </aside>
  );
};

export default MobileStickyBar;
