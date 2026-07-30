  import { useState, useEffect, useRef, useCallback } from 'react';
  import { Link } from 'react-router-dom';
  import { useTranslation } from 'react-i18next';
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, ArrowUpRight } from 'lucide-react';
  import { useLanguage } from '../contexts/LanguageContext';
  import { useHomepageVideoSettings } from '../hooks/useHomepageVideoSettings';
  import { adaptiveVideoSrc } from '../utils/adaptiveVideo';
  import ProgressiveImage from './ProgressiveImage';
  import api from '../utils/api';

  gsap.registerPlugin(ScrollTrigger);

  const sendShowcaseBeacon = (type, watchSeconds) => {
    try {
      const url = `${api.defaults.baseURL}/homepage-video/event`;
      const payload = JSON.stringify({ type, watchSeconds: watchSeconds || 0 });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
      } else {
        api.post('/homepage-video/event', { type, watchSeconds: watchSeconds || 0 }).catch(() => {});
      }
    } catch {
      // analytics must never break the section
    }
  };

  const HEIGHTS = { compact: '56vh', standard: '72vh', large: '86vh', cinematic: '100vh' };
  const SPACING_GAP = { compact: 32, comfortable: 56, spacious: 88 };
  const BACKGROUNDS = {
    dark:     '#0A0B0D',
    black:    '#000000',
    light:    'rgb(var(--bg-surface))',
    gradient: 'radial-gradient(120% 120% at 50% 0%, #12151C 0%, #05060A 60%, #000000 100%)',
  };

  const shadowFor = (style) => ({
    none:     'none',
    soft:     '0 20px 60px rgba(0,0,0,0.18)',
    elevated: '0 30px 90px rgba(0,0,0,0.35), 0 10px 30px rgba(0,0,0,0.25)',
    glow:     '0 30px 90px rgba(0,0,0,0.4), 0 0 120px rgba(37,99,235,0.15)',
  }[style] ?? '0 30px 90px rgba(0,0,0,0.35)');

  const formatTime = (s) => {
    if (!Number.isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${String(r).padStart(2, '0')}`;
  };

  const controlBtnStyle = {
    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)',
    color: '#fff', cursor: 'pointer', backdropFilter: 'blur(8px)',
    transition: 'background 0.2s ease',
  };

  const CtaLink = ({ link, label, onClick, isRTL }) => {
    const style = {
      display: 'inline-flex', alignItems: 'center', gap: 10,
      padding: '15px 34px', background: 'rgb(var(--accent))', color: '#fff',
      fontSize: 13, fontWeight: 500, letterSpacing: '0.04em',
      borderRadius: 999, textDecoration: 'none',
      transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1), background 0.3s',
    };
    const onEnter = (e) => { e.currentTarget.style.background = 'rgb(var(--accent-hover))'; e.currentTarget.style.transform = 'translateY(-2px)'; };
    const onLeave = (e) => { e.currentTarget.style.background = 'rgb(var(--accent))'; e.currentTarget.style.transform = 'translateY(0)'; };
    const arrow = <ArrowUpRight style={{ width: 16, height: 16, transform: isRTL ? 'scaleX(-1)' : 'none' }} />;

    if (!link) {
      return <button onClick={onClick} style={style} onMouseEnter={onEnter} onMouseLeave={onLeave}>{label}{arrow}</button>;
    }
    if (link.startsWith('/')) {
      return <Link to={link} onClick={onClick} style={style} onMouseEnter={onEnter} onMouseLeave={onLeave}>{label}{arrow}</Link>;
    }
    return (
      <a href={link} onClick={onClick} target={link.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
        style={style} onMouseEnter={onEnter} onMouseLeave={onLeave}>{label}{arrow}</a>
    );
  };

  /**
   * Premium full-width homepage video showcase — entirely independent of the
   * intro overlay system (see IntroOverlay.jsx). Can point at the same video
   * (videoSource: 'intro', resolved live server-side) or its own upload.
   */
  const HomepageVideoShowcase = () => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const { settings, loading } = useHomepageVideoSettings();

    const sectionRef  = useRef(null);
    const cardRef      = useRef(null);
    const textRef       = useRef(null);
    const videoRef        = useRef(null);
    const progressTrackRef = useRef(null);

    const [shouldLoad, setShouldLoad]     = useState(false);
    const [isPlaying, setIsPlaying]       = useState(false);
    const [isMuted, setIsMuted]           = useState(true);
    const [isBuffering, setIsBuffering]   = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [progress, setProgress]         = useState(0);
    const [currentTime, setCurrentTime]   = useState(0);
    const [duration, setDuration]         = useState(0);
    const [hasStarted, setHasStarted]     = useState(false);
    const [controlsVisible, setControlsVisible] = useState(true);

    const userPausedRef   = useRef(false);
    const hasViewedRef     = useRef(false);
    const hasCompletedRef   = useRef(false);
    const hideControlsTimer  = useRef(null);

    useEffect(() => { if (settings) setIsMuted(settings.muted !== false); }, [settings]);

    const attemptPlay = useCallback(() => {
      const video = videoRef.current;
      if (!video) return;
      video.play().catch(() => {
        if (!video.muted) { video.muted = true; setIsMuted(true); video.play().catch(() => {}); }
      });
    }, []);

    const togglePlay = useCallback(() => {
      const video = videoRef.current;
      if (!video) return;
      if (video.paused) { userPausedRef.current = false; attemptPlay(); }
      else { video.pause(); userPausedRef.current = true; }
    }, [attemptPlay]);

    const toggleMute = useCallback(() => {
      const video = videoRef.current;
      if (!video) return;
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }, []);

    const toggleFullscreen = useCallback(() => {
      const el = cardRef.current;
      if (!el) return;
      if (!document.fullscreenElement) el.requestFullscreen?.();
      else document.exitFullscreen?.();
    }, []);

    const seek = useCallback((clientX) => {
      const track = progressTrackRef.current;
      const video = videoRef.current;
      if (!track || !video || !duration) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
      video.currentTime = ratio * duration;
    }, [duration]);

    // Fullscreen state tracking
    useEffect(() => {
      const onChange = () => setIsFullscreen(document.fullscreenElement === cardRef.current);
      document.addEventListener('fullscreenchange', onChange);
      return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    // Apply the configured initial mute state to the element itself the moment it mounts.
    // This must stay imperative (never a `muted` JSX prop) — declared before the play-start
    // effects below so it always runs first when `shouldLoad` flips true on the same render.
    useEffect(() => {
      if (!shouldLoad || !videoRef.current || !settings) return;
      videoRef.current.muted = settings.muted !== false;
    }, [shouldLoad, settings]);

    // Lazy-load + auto-pause/resume on scroll visibility. The *first* play attempt for
    // 'visible'/'autoplay' triggers is intentionally NOT made here — at the moment this
    // callback fires, `shouldLoad` has only just been requested, so the <video> element
    // hasn't mounted yet (React re-renders asynchronously) and attemptPlay() would silently
    // no-op against a null ref. That first attempt is handled by the effect below instead,
    // which depends on `shouldLoad` directly and therefore only runs once the element exists.
    // This callback only needs to handle *resuming* an already-started video (`hasStarted`),
    // whose element is guaranteed to already be mounted.
    useEffect(() => {
      if (!sectionRef.current || !settings) return;
      const io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          if (hasStarted && !userPausedRef.current) attemptPlay();
        } else if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
      }, { threshold: 0.35, rootMargin: '200px 0px' });
      io.observe(sectionRef.current);
      return () => io.disconnect();
    }, [settings, attemptPlay, hasStarted]);

    // First-time start for 'autoplay' and 'visible' triggers — fires once the video element
    // genuinely exists (shouldLoad flipped true), immune to the mount-timing race above.
    useEffect(() => {
      if (!shouldLoad || !settings || hasStarted || userPausedRef.current) return;
      if (settings.playTrigger === 'autoplay' || settings.playTrigger === 'visible') attemptPlay();
    }, [shouldLoad, settings, hasStarted, attemptPlay]);

    // "Scroll" trigger — starts on the visitor's first scroll anywhere on the page. If that
    // scroll happens before the section has lazy-loaded, the immediate attempt below no-ops
    // safely and the catch-up effect that follows starts it once the element actually exists.
    const scrollIntentRef = useRef(false);
    useEffect(() => {
      if (!settings || settings.playTrigger !== 'scroll' || hasStarted) return;
      const onScroll = () => { scrollIntentRef.current = true; attemptPlay(); };
      window.addEventListener('scroll', onScroll, { passive: true, once: true });
      return () => window.removeEventListener('scroll', onScroll);
    }, [settings, hasStarted, attemptPlay]);

    useEffect(() => {
      if (!shouldLoad || !scrollIntentRef.current || hasStarted) return;
      attemptPlay();
    }, [shouldLoad, hasStarted, attemptPlay]);

    // Video element event wiring
    useEffect(() => {
      const video = videoRef.current;
      if (!video || !shouldLoad) return;

      const onPlay = () => {
        setIsPlaying(true);
        setHasStarted(true);
        if (!hasViewedRef.current) { hasViewedRef.current = true; sendShowcaseBeacon('view', 0); }
        sendShowcaseBeacon('play', 0);
      };
      const onPause = () => setIsPlaying(false);
      const onTimeUpdate = () => {
        setCurrentTime(video.currentTime);
        setProgress(video.duration ? (video.currentTime / video.duration) * 100 : 0);
      };
      const onLoadedMetadata = () => setDuration(video.duration);
      const onWaiting = () => setIsBuffering(true);
      const onPlaying = () => setIsBuffering(false);
      const onEnded = () => {
        setIsPlaying(false);
        if (!hasCompletedRef.current) { hasCompletedRef.current = true; sendShowcaseBeacon('complete', video.duration || 0); }
      };

      video.addEventListener('play', onPlay);
      video.addEventListener('pause', onPause);
      video.addEventListener('timeupdate', onTimeUpdate);
      video.addEventListener('loadedmetadata', onLoadedMetadata);
      video.addEventListener('waiting', onWaiting);
      video.addEventListener('playing', onPlaying);
      video.addEventListener('ended', onEnded);
      return () => {
        video.removeEventListener('play', onPlay);
        video.removeEventListener('pause', onPause);
        video.removeEventListener('timeupdate', onTimeUpdate);
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.removeEventListener('waiting', onWaiting);
        video.removeEventListener('playing', onPlaying);
        video.removeEventListener('ended', onEnded);
      };
    }, [shouldLoad]);

    // Cinematic scroll-reveal entrance
    useEffect(() => {
      if (!settings || !sectionRef.current) return;
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const els = [textRef.current, cardRef.current].filter(Boolean);
      if (prefersReduced) { gsap.set(els, { opacity: 1, y: 0, scale: 1, filter: 'none' }); return; }

      const from = {
        fade:      { opacity: 0 },
        scale:     { opacity: 0, scale: 0.92 },
        slide:     { opacity: 0, y: 60 },
        cinematic: { opacity: 0, y: 50, scale: 0.94, filter: 'blur(12px)' },
      }[settings.animationStyle || 'cinematic'];

      const ctx = gsap.context(() => {
        gsap.fromTo(els, from, {
          opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
          duration: 1.1, stagger: 0.15, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 78%', once: true },
        });
      }, sectionRef);
      return () => ctx.revert();
    }, [settings]);

    const showControlsTemporarily = useCallback(() => {
      setControlsVisible(true);
      clearTimeout(hideControlsTimer.current);
      hideControlsTimer.current = setTimeout(() => setControlsVisible(false), 2600);
    }, []);
    useEffect(() => () => clearTimeout(hideControlsTimer.current), []);

    if (loading || !settings || !settings.enabled || !settings.videoUrl) return null;

    const isLight = settings.backgroundStyle === 'light';
    const title       = isRTL ? settings.headline?.ar     : settings.headline?.en;
    const subtitle     = isRTL ? settings.subtitle?.ar      : settings.subtitle?.en;
    const description   = isRTL ? settings.description?.ar   : settings.description?.en;
    const ctaLabel        = isRTL ? settings.ctaText?.ar        : settings.ctaText?.en;
    const gap = SPACING_GAP[settings.spacing] || 56;

    return (
      <section
        ref={sectionRef}
        dir={isRTL ? 'rtl' : 'ltr'}
        data-hide-mobile={settings.hideOnMobile ? '1' : undefined}
        data-hide-desktop={settings.hideOnDesktop ? '1' : undefined}
        className="yansy-video-showcase"
        style={{
          position: 'relative', overflow: 'hidden',
          background: BACKGROUNDS[settings.backgroundStyle] || BACKGROUNDS.dark,
          paddingTop: `${gap + (settings.marginTop || 0)}px`,
          paddingBottom: `${gap + (settings.marginBottom || 0)}px`,
          paddingLeft: 'clamp(1.25rem, 5vw, 3rem)', paddingRight: 'clamp(1.25rem, 5vw, 3rem)',
        }}
      >
        <style>{`
          @media (max-width: 767px) { .yansy-video-showcase[data-hide-mobile] { display: none !important; } }
          @media (min-width: 768px) { .yansy-video-showcase[data-hide-desktop] { display: none !important; } }
          @keyframes yansy-glow-pulse { 0%,100% { opacity: .5; transform: scale(1); } 50% { opacity: .8; transform: scale(1.06); } }
          @keyframes yansy-vs-spin { to { transform: rotate(360deg); } }
          @keyframes yansy-play-ring { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.35); opacity: 0; } }
          @media (prefers-reduced-motion: reduce) {
            .yansy-video-showcase * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
          }
          /* vh is computed against the browser's largest possible viewport, so on
             mobile Safari/Chrome (address bar visible) these presets render taller
             than what's actually visible. dvh tracks the real, current viewport. */
          .yvs-h-compact    { height: ${HEIGHTS.compact}; height: 56dvh; }
          .yvs-h-standard   { height: ${HEIGHTS.standard}; height: 72dvh; }
          .yvs-h-large      { height: ${HEIGHTS.large}; height: 86dvh; }
          .yvs-h-cinematic  { height: ${HEIGHTS.cinematic}; height: 100dvh; }
        `}</style>

        <div style={{ maxWidth: 1360, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {(title || subtitle || description) && (
            <div ref={textRef} style={{ textAlign: 'center', maxWidth: 720, margin: `0 auto ${gap * 0.9}px` }}>
              {/* <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 16px', borderRadius: 999, marginBottom: 22,
                background: isLight ? 'rgba(37,99,235,0.08)' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${isLight ? 'rgba(37,99,235,0.18)' : 'rgba(255,255,255,0.14)'}`,
              }}>
                <span aria-hidden style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgb(var(--accent))' }} />
                <span style={{
                  fontSize: 10.5, fontWeight: 600, letterSpacing: isRTL ? 0 : '0.16em', textTransform: isRTL ? 'none' : 'uppercase',
                  color: isLight ? 'rgb(var(--accent))' : 'rgba(255,255,255,0.85)',
                }}>
                  {isRTL ? 'قدراتنا الرقمية' : 'Our Capabilities'}
                </span>
              </div>
              {title && (
                <h2 style={{
                  fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05,
                  color: isLight ? 'rgb(var(--text-primary))' : 'rgb(var(--bg-elevated))', margin: '0 0 18px',
                }}>
                  {title}
                </h2>
              )}
              {subtitle && (
                <p style={{
                  fontSize: 'clamp(1rem, 1.6vw, 1.25rem)', fontWeight: 300, lineHeight: 1.6,
                  color: isLight ? 'rgb(var(--text-secondary))' : 'rgba(255,255,255,0.65)', margin: 0,
                }}>
                  {subtitle}
                </p>
              )} */}
              {description && (
                <p style={{
                  fontSize: '0.9375rem', fontWeight: 300, lineHeight: 1.7, marginTop: 14,
                  color: isLight ? 'rgb(var(--text-tertiary))' : 'rgba(255,255,255,0.4)',
                }}>
                  {description}
                </p>
              )}
            </div>
          )}

          <div style={{ position: 'relative' }}>
            {settings.glowEffect && (
              <div aria-hidden="true" style={{
                position: 'absolute', inset: '-8%', zIndex: 0, pointerEvents: 'none',
                background: 'radial-gradient(60% 60% at 50% 45%, rgba(37,99,235,0.35) 0%, transparent 70%)',
                filter: 'blur(70px)', animation: 'yansy-glow-pulse 6s ease-in-out infinite',
              }} />
            )}

            <div
              ref={cardRef}
              tabIndex={0}
              role="region"
              aria-label={title || t('landing.videoShowcase.watch')}
              onMouseMove={showControlsTemporarily}
              onKeyDown={(e) => {
                if (e.key === ' ') { e.preventDefault(); togglePlay(); }
                if (e.key.toLowerCase() === 'm') toggleMute();
                if (e.key.toLowerCase() === 'f') toggleFullscreen();
              }}
              className={`yvs-h-${HEIGHTS[settings.sectionHeight] ? settings.sectionHeight : 'large'}`}
              style={{
                position: 'relative', zIndex: 1, overflow: 'hidden', outline: 'none',
                borderRadius: settings.roundedCorners ? `${settings.borderRadius}px` : 0,
                boxShadow: shadowFor(settings.shadowStyle),
                background: '#000',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {settings.poster?.url && !hasStarted && (
                <ProgressiveImage asset={settings.poster} alt={title || ''} priority fill />
              )}

              {shouldLoad && (
                <video
                  ref={videoRef}
                  src={adaptiveVideoSrc(settings.videoUrl)}
                  playsInline
                  loop={settings.loop}
                  preload="metadata"
                  aria-hidden="true"
                  tabIndex={-1}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}

              <div aria-hidden="true" style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: `linear-gradient(to top, rgba(0,0,0,${(settings.overlayOpacity ?? 35) / 100}) 0%, transparent 55%)`,
              }} />
              <div aria-hidden="true" style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, transparent 22%)',
              }} />

              {isBuffering && shouldLoad && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', animation: 'yansy-vs-spin 0.9s linear infinite' }} />
                </div>
              )}

              {!isPlaying && shouldLoad && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 92, height: 92 }}>
                  <span aria-hidden style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.35)',
                    animation: 'yansy-play-ring 2.2s cubic-bezier(0.2,0.7,0.4,1) infinite',
                  }} />
                  <button
                    onClick={togglePlay}
                    aria-label={t('landing.videoShowcase.play')}
                    style={{
                      position: 'absolute', inset: 0, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                      border: '1px solid rgba(255,255,255,0.32)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1), background 0.3s, box-shadow 0.3s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.45)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.35)'; }}
                  >
                    <Play style={{ width: 26, height: 26, color: '#fff', marginInlineStart: 4 }} fill="#fff" />
                  </button>
                </div>
              )}

              {settings.showControls && shouldLoad && (
                <div style={{
                  position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 20px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)',
                  opacity: controlsVisible || !isPlaying ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                }}>
                  <button onClick={togglePlay} aria-label={isPlaying ? t('landing.videoShowcase.pause') : t('landing.videoShowcase.play')} style={controlBtnStyle}>
                    {isPlaying ? <Pause style={{ width: 15, height: 15 }} /> : <Play style={{ width: 15, height: 15 }} />}
                  </button>

                  {settings.showProgress && (
                    <div
                      ref={progressTrackRef}
                      role="slider" aria-label="Seek" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}
                      tabIndex={0}
                      onClick={(e) => seek(e.clientX)}
                      onKeyDown={(e) => {
                        const v = videoRef.current;
                        if (!v) return;
                        if (e.key === 'ArrowRight') v.currentTime = Math.min(v.currentTime + 5, duration);
                        if (e.key === 'ArrowLeft')  v.currentTime = Math.max(v.currentTime - 5, 0);
                      }}
                      style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.25)', borderRadius: 999, cursor: 'pointer', position: 'relative' }}
                    >
                      <div style={{ position: 'absolute', [isRTL ? 'right' : 'left']: 0, top: 0, bottom: 0, width: `${progress}%`, background: 'rgb(var(--accent))', borderRadius: 999 }} />
                    </div>
                  )}

                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', minWidth: 76, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>

                  {settings.showSoundButton && (
                    <button onClick={toggleMute} aria-label={isMuted ? t('landing.videoShowcase.unmute') : t('landing.videoShowcase.mute')} style={controlBtnStyle}>
                      {isMuted ? <VolumeX style={{ width: 15, height: 15 }} /> : <Volume2 style={{ width: 15, height: 15 }} />}
                    </button>
                  )}
                  {settings.showFullscreenButton && (
                    <button onClick={toggleFullscreen} aria-label={isFullscreen ? t('landing.videoShowcase.exitFullscreen') : t('landing.videoShowcase.fullscreen')} style={controlBtnStyle}>
                      {isFullscreen ? <Minimize style={{ width: 15, height: 15 }} /> : <Maximize style={{ width: 15, height: 15 }} />}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {ctaLabel && (
            <div style={{ textAlign: 'center', marginTop: gap * 0.75 }}>
              <CtaLink link={settings.ctaLink} label={ctaLabel} isRTL={isRTL} onClick={() => sendShowcaseBeacon('click', 0)} />
            </div>
          )}
        </div>
      </section>
    );
  };

  export default HomepageVideoShowcase;
