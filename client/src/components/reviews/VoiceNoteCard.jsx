import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, Mic } from 'lucide-react';
import s from './ClientProof.module.css';

const BAR_COUNT = 34;

/**
 * Deterministic "amplitude" per card so the waveform shape is stable across
 * re-renders — a real decoded waveform isn't worth the payload for a handful
 * of short voice notes, but a static per-card shape reads as intentional
 * rather than random noise.
 */
const seededHeight = (seed) => {
  const x = Math.sin(seed * 999.7) * 10000;
  const frac = x - Math.floor(x);
  return 0.22 + frac * 0.78; // 22%–100% of track height
};

const formatTime = (sec) => {
  if (!Number.isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const r = Math.floor(sec % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
};

/**
 * WhatsApp-style voice note bubble with a custom player.
 *
 * Premium redesign features:
 * - Gradient play button with glow shadow
 * - Animated waveform bars during playback
 * - Glassmorphism card with hover glow
 * - Lazy audio loading via IntersectionObserver
 * - Exclusive playback — starting one pauses any other card
 */
const VoiceNoteCard = ({ id, src, index, label, tag, isRTL, playingId, onPlayRequest }) => {
  const cardRef = useRef(null);
  const audioRef = useRef(null);
  const trackRef = useRef(null);

  const [shouldLoad, setShouldLoad] = useState(() => typeof IntersectionObserver === 'undefined');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const bars = useMemo(
    () => Array.from({ length: BAR_COUNT }, (_, i) => seededHeight(index * 97 + i)),
    [index]
  );

  // Lazy load audio when card scrolls into view
  useEffect(() => {
    const el = cardRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShouldLoad(true); io.disconnect(); }
    }, { threshold: 0, rootMargin: '200px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Exclusive playback — another card claimed the "now playing" slot
  useEffect(() => {
    if (playingId !== id && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, [playingId, id]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      onPlayRequest(id);
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [id, onPlayRequest]);

  const seek = useCallback((clientX) => {
    const track = trackRef.current;
    const audio = audioRef.current;
    if (!track || !audio || !duration) return;
    const rect = track.getBoundingClientRect();
    const raw = (clientX - rect.left) / rect.width;
    const ratio = isRTL ? 1 - raw : raw;
    audio.currentTime = Math.min(Math.max(ratio, 0), 1) * duration;
  }, [duration, isRTL]);

  const progress = duration ? Math.min(currentTime / duration, 1) : 0;
  const playedBars = Math.round(progress * BAR_COUNT);

  return (
    <div ref={cardRef} className={s.vnCard}>
      {/* Play / Pause button */}
      <button
        className={s.vnPlay}
        onClick={togglePlay}
        aria-label={isPlaying ? (isRTL ? 'إيقاف' : 'Pause') : (isRTL ? 'تشغيل' : 'Play')}
      >
        {isPlaying
          ? <Pause style={{ width: 16, height: 16, color: '#fff' }} fill="#fff" />
          : <Play style={{ width: 16, height: 16, color: '#fff', marginInlineStart: 2 }} fill="#fff" />}
      </button>

      {/* Body: meta + waveform + time */}
      <div className={s.vnBody}>
        <div className={s.vnMeta} style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <span className={s.vnLabel}>{label}</span>
          <span className={s.vnBadge} style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <Mic style={{ width: 9, height: 9 }} aria-hidden />
            {tag}
          </span>
        </div>

        {/* Waveform track */}
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label={isRTL ? 'موضع التشغيل' : 'Seek'}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          onClick={(e) => seek(e.clientX)}
          onKeyDown={(e) => {
            const audio = audioRef.current;
            if (!audio) return;
            if (e.key === 'ArrowRight') audio.currentTime = Math.min(audio.currentTime + 3, duration || 0);
            if (e.key === 'ArrowLeft') audio.currentTime = Math.max(audio.currentTime - 3, 0);
          }}
          className={s.vnTrack}
          style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
        >
          {bars.map((h, i) => {
            const played = i < playedBars;
            const shouldAnimate = isPlaying && played && i >= playedBars - 3;
            return (
              <span
                key={i}
                className={`${played ? s.vnBarPlayed : s.vnBar} ${shouldAnimate ? s.vnBarAnimated : ''}`}
                style={{
                  height: `${h * 100}%`,
                  animationDelay: shouldAnimate ? `${(i % 3) * 0.12}s` : undefined,
                }}
                aria-hidden
              />
            );
          })}
        </div>

        {/* Time display — locked LTR to prevent bidi reordering of "0:00 / 0:14" */}
        <div
          dir="ltr"
          className={s.vnTime}
          style={{ textAlign: isRTL ? 'right' : 'left' }}
        >
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Audio element — only loaded when card is in viewport */}
      {shouldLoad && (
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          style={{ display: 'none' }}
        />
      )}
    </div>
  );
};

export default VoiceNoteCard;
