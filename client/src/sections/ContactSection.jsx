// sections/ContactSection.jsx
// ─────────────────────────────────────────────────────────────
// Premium cinematic contact section
// Clear hierarchy: 1 primary CTA + 1 secondary
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef } from 'react';
import { trackWhatsAppClick, trackCTAClick } from '../utils/ga4';

const ContactSection = ({ isRTL, onStartProject, t, homeT }) => {
  const WA_URL = 'https://wa.me/201090385390?text=Hello%2C%20I%27d%20like%20to%20discuss%20a%20project%20with%20YANSY.';
  const titleRef = useRef(null);
  const bodyRef  = useRef(null);

  useEffect(() => {
    const els = [titleRef.current, bodyRef.current].filter(Boolean);
    const ios = els.map((el, i) => {
      const io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            el.style.transition = `opacity .9s ${i * 0.15}s ease, transform .9s ${i * 0.15}s ease`;
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
            io.disconnect();
          }
        },
        { threshold: 0.2 }
      );
      io.observe(el);
      return io;
    });
    return () => ios.forEach((io) => io.disconnect());
  }, []);

  return (
    <section
      id="contact"
      className="relative overflow-hidden"
      style={{
        background  : 'linear-gradient(180deg, #000 0%, #060402 50%, #000 100%)',
        padding     : 'clamp(80px,14vw,160px) clamp(20px,5vw,56px)',
      }}
    >
      {/* ── Cinematic ambient ── */}
      <div aria-hidden style={{
        position:'absolute',inset:0,pointerEvents:'none',
        background:'radial-gradient(ellipse 70% 60% at 50% 50%,rgba(212,175,55,.04) 0%,transparent 70%)',
      }}/>
      {/* Vertical beam — always centered, direction-agnostic */}
      <div aria-hidden style={{
        position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',
        width:'1px',height:'40%',
        background:'linear-gradient(to bottom,rgba(212,175,55,.12),transparent)',
        pointerEvents:'none',
      }}/>

      {/* ── Corner accents ── */}
      <div aria-hidden className="hidden md:block absolute top-10 left-10 w-12 h-12"
        style={{ borderTop:'1px solid rgba(212,175,55,.12)', borderLeft:'1px solid rgba(212,175,55,.12)' }}/>
      <div aria-hidden className="hidden md:block absolute top-10 right-10 w-12 h-12"
        style={{ borderTop:'1px solid rgba(212,175,55,.12)', borderRight:'1px solid rgba(212,175,55,.12)' }}/>
      <div aria-hidden className="hidden md:block absolute bottom-10 left-10 w-12 h-12"
        style={{ borderBottom:'1px solid rgba(212,175,55,.12)', borderLeft:'1px solid rgba(212,175,55,.12)' }}/>
      <div aria-hidden className="hidden md:block absolute bottom-10 right-10 w-12 h-12"
        style={{ borderBottom:'1px solid rgba(212,175,55,.12)', borderRight:'1px solid rgba(212,175,55,.12)' }}/>

      <div
        className={`text-center relative z-10 mx-auto`}
        style={{ maxWidth: 860 }}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* ── Eyebrow ── */}
        <div
          ref={titleRef}
          style={{ opacity: 0, transform: 'translateY(20px)' }}
        >
          <p style={{
            fontSize    : 10,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            color       : 'rgba(212,175,55,.65)',
            fontWeight  : 500,
            marginBottom: 20,
          }}>
            {isRTL ? 'الخطوة الأولى مجانية' : 'The first step is free'}
          </p>

          {/* ── Hero headline ── */}
          <h2
            className={isRTL ? 'font-bold' : 'font-bold tracking-tight'}
            style={{
              fontFamily   : isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
              fontSize     : 'clamp(2.5rem, 8vw, 7rem)',
              letterSpacing: isRTL ? '0' : '-0.035em',
              lineHeight   : isRTL ? 1.3 : 1.06,
              color        : '#fff',
              marginBottom : '1rem',
              textAlign    : isRTL ? 'center' : 'center',
            }}
          >
            {homeT('contact.title', isRTL ? 'جاهز لتحويل فكرتك لإيرادات؟' : 'Ready to turn your idea into revenue?')}
          </h2>

          {/* Decorative line */}
          <div style={{
            width:'40px',height:'1px',
            background:'linear-gradient(to right,transparent,#d4af37,transparent)',
            margin:'24px auto',
          }} aria-hidden />
        </div>

        {/* ── Sub copy ── */}
        <div
          ref={bodyRef}
          style={{ opacity: 0, transform: 'translateY(20px)' }}
        >
          <p style={{
            fontSize    : 'clamp(1rem,2vw,1.25rem)',
            fontWeight  : 400,
            color       : 'rgba(255,255,255,.65)',
            marginBottom: '0.5rem',
            lineHeight  : 1.65,
          }}>
            {homeT('contact.subtitle', isRTL
              ? 'في 30 دقيقة، نحدد نطاق مشروعك ونعطيك جدولاً زمنياً واقعياً وعرض سعر صادق — بدون ضغط بيع.'
              : 'In 30 minutes, we\'ll scope your project, give you a realistic timeline, and an honest quote. Zero sales pressure.'
            )}
          </p>
          <p style={{
            fontSize    : 'clamp(.85rem,1.5vw,1rem)',
            fontWeight  : 400,
            color       : 'rgba(255,255,255,.35)',
            marginBottom: '2.5rem',
            lineHeight  : 1.6,
          }}>
            {homeT('contact.description', isRTL
              ? '✓ استشارة مجانية · ✓ وثيقة نطاق مشمولة · ✓ رد خلال 24 ساعة'
              : '✓ Free strategy call · ✓ Scope document included · ✓ Reply within 24 hours'
            )}
          </p>

          {/* ── CTAs ── */}
          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center mb-10 ${isRTL ? 'sm:flex-row-reverse' : ''}`}
          >
            {/* Primary */}
            <button
              onClick={() => { onStartProject?.(); trackCTAClick('start-project', 'contact-section'); }}
              className="group relative inline-flex items-center justify-center gap-3 text-black text-xs font-medium tracking-widest uppercase transition-all duration-400 active:scale-95 overflow-hidden"
              style={{
                padding     : '18px clamp(32px,5vw,56px)',
                background  : '#d4af37',
                border      : '2px solid #d4af37',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background    = '#c9a22a';
                e.currentTarget.style.borderColor   = '#c9a22a';
                e.currentTarget.style.boxShadow     = '0 12px 48px rgba(212,175,55,.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background    = '#d4af37';
                e.currentTarget.style.borderColor   = '#d4af37';
                e.currentTarget.style.boxShadow     = 'none';
              }}
            >
              {/* Shimmer sweeps in reading direction */}
              <span className={`absolute inset-0 transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent ${isRTL ? 'translate-x-full group-hover:-translate-x-full' : '-translate-x-full group-hover:translate-x-full'}`} />
              <span className="relative">{homeT('contact.startProject', isRTL ? 'احجز مكالمة الاستراتيجية المجانية' : 'Book Your Free Strategy Call')}</span>
              <svg
                className={`relative w-4 h-4 flex-shrink-0 transition-transform duration-300 ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>

            {/* Secondary — WhatsApp */}
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackWhatsAppClick('contact-section')}
              className={`group inline-flex justify-center items-center gap-3 text-xs font-light tracking-widest uppercase transition-all duration-350 active:scale-95 ${isRTL ? 'flex-row-reverse' : ''}`}
              style={{
                padding     : '18px clamp(24px,4vw,40px)',
                border      : '2px solid rgba(255,255,255,.15)',
                color       : 'rgba(255,255,255,.65)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,.35)';
                e.currentTarget.style.color       = '#fff';
                e.currentTarget.style.background  = 'rgba(255,255,255,.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,.15)';
                e.currentTarget.style.color       = 'rgba(255,255,255,.65)';
                e.currentTarget.style.background  = 'transparent';
              }}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              {homeT('contact.whatsapp', 'Chat on WhatsApp')}
            </a>
          </div>

          {/* ── Trust signals ── */}
          <div
            className={`flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-light ${isRTL ? 'flex-row-reverse' : ''}`}
            style={{ color: 'rgba(255,255,255,.28)' }}
          >
            {[
              homeT('contact.trust1', '✓ Free consultation'),
              homeT('contact.trust2', '✓ No commitment required'),
              homeT('contact.trust3', '✓ Response within 24h'),
            ].map((s) => (
              <span
                key={s}
                className="transition-colors duration-300"
                onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(212,175,55,.55)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,.28)'; }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
