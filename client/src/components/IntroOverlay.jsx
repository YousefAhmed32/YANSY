import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { Volume2 } from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useIntroSettings } from '../hooks/useIntroSettings';

const SEEN_KEY          = 'yansy_intro_seen';
const LOAD_TIMEOUT_MS   = 6000;   // hard fallback if the video never becomes playable (autoplay path only)
const HARD_CAP_SECONDS  = 20;     // absolute safety net — the intro can never trap a visitor
const HINT_DELAY_MS     = 1100;   // how long we wait before showing the "click to begin" hint
const STRONG_GESTURES    = ['click', 'keydown', 'touchend'];
const START_TRIGGERS      = ['click', 'touchstart', 'mousemove', 'wheel', 'keydown'];

const isMobileViewport = () => window.matchMedia('(max-width: 767px)').matches;

const sendIntroBeacon = (type, watchSeconds) => {
  try {
    const url = `${api.defaults.baseURL}/intro/event`;
    const payload = JSON.stringify({ type, watchSeconds: watchSeconds || 0 });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
    } else {
      api.post('/intro/event', { type, watchSeconds: watchSeconds || 0 }).catch(() => {});
    }
  } catch {
    // analytics must never break the intro
  }
};

/**
 * Full-screen cinematic opening sequence, mounted once at the app root (outside <Routes>
 * so SPA navigation never remounts it).
 *
 * Two playback modes, controlled entirely from the admin panel:
 *  - waitForInteraction: the overlay shows black-only and never touches browser autoplay.
 *    The video silently preloads in the background; on the visitor's first click / tap /
 *    mouse move / wheel / key press, playback starts synchronously inside that gesture's
 *    call stack — which is what lets the browser allow audible (unmuted) playback.
 *  - classic autoplay: the video starts muted as soon as it's loadable (previous behavior),
 *    for sites that prefer the old zero-interaction feel over guaranteed sound.
 */
const IntroOverlay = () => {
  const location = useLocation();
  const { isRTL } = useLanguage();

  // Arms the first time the visitor reaches the homepage in this session — whether
  // that's the initial load or a later SPA navigation from a deep link — then never
  // re-arms, so revisiting Home afterward can't trigger it a second time.
  const [armed, setArmed] = useState(false);
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (attemptedRef.current) return;
    if (location.pathname !== '/' && location.pathname !== '/home') return;
    attemptedRef.current = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (sessionStorage.getItem(SEEN_KEY)) return;
    setArmed(true);
  }, [location.pathname]);

  const { settings, loading } = useIntroSettings(armed);

  const [phase, setPhase]       = useState('gate'); // gate | waiting | playing | exiting | done
  const [showSkip, setShowSkip] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const overlayRef    = useRef(null);
  const videoRef       = useRef(null);
  const skipBtnRef      = useRef(null);
  const playStartRef   = useRef(null);
  const finishedRef     = useRef(false);
  const interactedRef    = useRef(false); // a qualifying gesture has occurred (may arrive before the video even exists)
  const playInitiatedRef  = useRef(false); // guards beginPlaybackWithGesture against double-invocation
  const timersRef        = useRef([]);

  const after = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);
  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };

  // `fast=true` is for paths where no video was ever actually shown (disabled,
  // device mismatch, load timeout, autoplay blocked) — those should clear the black
  // screen near-instantly rather than running the full cinematic transition, which
  // is reserved for a real end-of-video handoff.
  const finish = useCallback((eventType, markSeen, fast = false) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearTimers();

    if (eventType) {
      const watchSeconds = playStartRef.current ? (performance.now() - playStartRef.current) / 1000 : 0;
      sendIntroBeacon(eventType, watchSeconds);
    }
    if (markSeen) sessionStorage.setItem(SEEN_KEY, '1');

    const duration = fast ? 0.18 : (settings?.transitionDurationMs ?? 900) / 1000;
    setPhase('exiting');
    if (overlayRef.current) {
      gsap.to(overlayRef.current, { opacity: 0, duration, ease: 'power2.inOut', onComplete: () => setPhase('done') });
    } else {
      setPhase('done');
    }
  }, [settings]);

  // Resolve the remaining (async) eligibility rules once settings arrive
  useEffect(() => {
    if (!armed || loading) return;
    if (!settings || !settings.enabled || !settings.videoUrl) { finish(null, false, true); return; }

    const mobile = isMobileViewport();
    if (settings.deviceMode === 'desktop' && mobile)  { finish(null, false, true); return; }
    if (settings.deviceMode === 'mobile'  && !mobile) { finish(null, false, true); return; }

    if (!settings.waitForInteraction) { setPhase('playing'); return; }
    // A fast visitor may have already interacted while we were still fetching settings —
    // don't make them wait a second time; go straight to 'playing' and let the dedicated
    // effect below start the video the instant its element exists.
    setPhase(interactedRef.current ? 'playing' : 'waiting');
  }, [armed, loading, settings, finish]);

  // Once the video is playing (with sound or muted, gesture-driven or autoplay-driven),
  // this covers everything downstream: fade-in reveal, skip timer, the hard safety cap,
  // and analytics — identical regardless of which mode got us here.
  const handlePlayingStarted = useCallback(() => {
    const video = videoRef.current;
    if (!video || playStartRef.current) return;
    playStartRef.current = performance.now();
    setShowHint(false);
    sendIntroBeacon('view', 0);
    gsap.to(video, { opacity: 1, duration: (settings.fadeDurationMs ?? 600) / 1000, ease: 'power2.out' });

    const onceSession = settings.playMode === 'once-per-session';
    if (settings.skipEnabled) after(() => setShowSkip(true), (settings.skipDelaySeconds ?? 3) * 1000);

    const capSeconds = Math.min(video.duration || HARD_CAP_SECONDS, HARD_CAP_SECONDS);
    after(() => finish('complete', onceSession), capSeconds * 1000);
  }, [settings, finish, after]);

  // Shared result listeners — active for both the "waiting for interaction" preload
  // window and the classic-autoplay path, since either one ends with the same video element.
  useEffect(() => {
    if ((phase !== 'waiting' && phase !== 'playing') || !videoRef.current || !settings) return;
    const video = videoRef.current;
    const onceSession = settings.playMode === 'once-per-session';

    // Opacity/muted are owned imperatively from here on — never via React's `style`/`muted`
    // props, or the next re-render (e.g. the skip button appearing) would stomp them back
    // to whatever the JSX literal says, undoing playback state.
    if (!interactedRef.current) {
      gsap.set(video, { opacity: 0 });
      video.muted = true;
    }

    const onPlaying = () => handlePlayingStarted();
    const onEnded = () => { if (!settings.loop) finish('complete', onceSession); };
    const onError = () => finish(null, onceSession, true);

    video.addEventListener('playing', onPlaying);
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);
    return () => {
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
    };
  }, [phase, settings, finish, handlePlayingStarted]);

  // Classic autoplay path only — starts playback itself as soon as the video is loadable.
  useEffect(() => {
    if (phase !== 'playing' || settings?.waitForInteraction || !videoRef.current || !settings) return;
    const video = videoRef.current;
    const onceSession = settings.playMode === 'once-per-session';

    let attempted = false;
    const attemptPlay = () => {
      if (attempted) return;
      attempted = true;
      clearTimeout(loadTimeout);
      video.muted = settings.autoplayMuted !== false;
      video.play().catch(() => finish(null, onceSession, true)); // autoplay blocked — bail out cleanly
    };
    const loadTimeout = after(() => finish(null, onceSession, true), LOAD_TIMEOUT_MS);

    video.addEventListener('loadeddata', attemptPlay);
    video.addEventListener('canplay', attemptPlay);
    if (video.readyState >= 2) attemptPlay();

    return () => {
      clearTimeout(loadTimeout);
      video.removeEventListener('loadeddata', attemptPlay);
      video.removeEventListener('canplay', attemptPlay);
    };
  }, [phase, settings, finish, after]);

  // Interaction-gated path — starts playback (with sound, falling back to muted-then-upgrade
  // for weak gestures like a bare mouse move) the instant a video element exists to drive.
  const beginPlaybackWithGesture = useCallback(() => {
    const video = videoRef.current;
    if (!video || playInitiatedRef.current) return;
    playInitiatedRef.current = true;

    const onceSession = settings?.playMode === 'once-per-session';
    const wantsSound = settings?.playWithSound !== false;

    if (wantsSound) {
      video.muted = false;
      video.play().catch(() => {
        // The triggering gesture was too weak for audible autoplay (e.g. mouse move) —
        // start muted immediately so the video is never stuck, then upgrade to sound the
        // moment a stronger gesture (click/key/tap) arrives.
        video.muted = true;
        video.play().catch(() => finish(null, onceSession, true));

        const upgrade = () => {
          if (videoRef.current && !videoRef.current.paused) videoRef.current.muted = false;
          STRONG_GESTURES.forEach((t) => window.removeEventListener(t, upgrade));
        };
        STRONG_GESTURES.forEach((t) => window.addEventListener(t, upgrade, { once: true }));
      });
    } else {
      video.muted = true;
      video.play().catch(() => finish(null, onceSession, true));
    }
  }, [settings, finish]);

  // Records the visitor's first qualifying gesture as early as possible — from the very
  // start of the black 'gate' screen, not just once we reach 'waiting' — so an unusually
  // fast click during the settings fetch is never silently dropped. If the video element
  // already exists, starts it immediately, synchronously inside this gesture's call stack.
  const handleFirstInteraction = useCallback(() => {
    if (interactedRef.current) return;
    interactedRef.current = true;
    if (videoRef.current) {
      setPhase('playing');
      beginPlaybackWithGesture();
    }
    // else: video isn't mounted yet — the eligibility effect + the dedicated
    // "deferred start" effect below will pick this up as soon as it is.
  }, [beginPlaybackWithGesture]);

  useEffect(() => {
    if (!armed || (phase !== 'gate' && phase !== 'waiting')) return;

    const onKeyStart = (e) => { if (e.key !== 'Escape') handleFirstInteraction(); };
    START_TRIGGERS.filter((t) => t !== 'keydown').forEach((t) => window.addEventListener(t, handleFirstInteraction, { passive: true }));
    window.addEventListener('keydown', onKeyStart);

    const hintTimer = phase === 'waiting' ? after(() => setShowHint(true), HINT_DELAY_MS) : null;

    return () => {
      START_TRIGGERS.filter((t) => t !== 'keydown').forEach((t) => window.removeEventListener(t, handleFirstInteraction));
      window.removeEventListener('keydown', onKeyStart);
      if (hintTimer) clearTimeout(hintTimer);
    };
  }, [armed, phase, handleFirstInteraction, after]);

  // Covers the rare case where the gesture arrived before the video element existed
  // (settings still loading) — starts it the moment the element mounts.
  useEffect(() => {
    if (phase !== 'playing' || !settings?.waitForInteraction || !interactedRef.current) return;
    beginPlaybackWithGesture();
  }, [phase, settings, beginPlaybackWithGesture]);

  useEffect(() => () => clearTimers(), []);

  // Move focus into the overlay exactly once per phase entry — not on every
  // showSkip/settings change, or a keyboard user tabbing to Skip would get yanked back.
  useEffect(() => {
    if (phase === 'gate' || phase === 'waiting' || phase === 'playing') overlayRef.current?.focus();
  }, [phase]);

  // Escape always offers an immediate exit, at any phase. Tab is trapped inside this
  // full-screen takeover (once something exists to trap focus to) so keyboard users can
  // never tab into homepage content hidden behind it.
  useEffect(() => {
    if (phase === 'gate' || phase === 'done' || phase === 'exiting') return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        finish('skip', settings?.playMode === 'once-per-session', phase !== 'playing' || !playStartRef.current);
        return;
      }
      if (phase === 'playing' && e.key === 'Tab') {
        e.preventDefault();
        (showSkip ? skipBtnRef.current : overlayRef.current)?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [phase, showSkip, settings, finish]);

  if (!armed || phase === 'done') return null;

  const showHintNow = phase === 'waiting' && showHint;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={isRTL ? 'مقدمة الموقع' : 'Site intro'}
      tabIndex={-1}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', outline: 'none', cursor: phase === 'waiting' ? 'pointer' : 'default',
      }}
    >
      {(phase === 'waiting' || phase === 'playing') && settings?.videoUrl && (
        <video
          ref={videoRef}
          src={encodeURI(settings.videoUrl)}
          playsInline
          loop={settings.loop}
          preload="auto"
          disablePictureInPicture
          aria-hidden="true"
          tabIndex={-1}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      )}

      {showHintNow && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', bottom: '14%', left: 0, right: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            animation: 'intro-hint-in 0.6s ease forwards',
            pointerEvents: 'none',
          }}
        >
          <style>{`
            @keyframes intro-hint-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes intro-hint-pulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
          `}</style>
          <span style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'intro-hint-pulse 2s ease-in-out infinite',
          }}>
            {settings?.playWithSound !== false
              ? <Volume2 className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.8)' }} />
              : <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.8)' }} />}
          </span>
          <p style={{
            fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 300,
            color: 'rgba(255,255,255,0.65)', margin: 0, textAlign: 'center',
          }}>
            {isRTL ? 'انقر أو حرّك للبدء' : 'Move, click, or tap to begin'}
          </p>
        </div>
      )}

      {showSkip && settings?.skipEnabled && phase === 'playing' && (
        <button
          ref={skipBtnRef}
          onClick={() => finish('skip', settings.playMode === 'once-per-session')}
          aria-label={isRTL ? 'تخطي المقدمة' : 'Skip intro'}
          style={{
            position: 'absolute', bottom: 32, [isRTL ? 'left' : 'right']: 32,
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 22px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 999,
            color: 'rgba(255,255,255,0.85)',
            fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 300,
            backdropFilter: 'blur(8px)',
            cursor: 'pointer',
            transition: 'background 0.2s ease, border-color 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.16)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
        >
          {isRTL ? 'تخطي' : 'Skip'}
        </button>
      )}
    </div>
  );
};

export default IntroOverlay;
