import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, Mic } from 'lucide-react';

const BAR_COUNT = 34;

// Deterministic "amplitude" per card so the waveform doesn't reshuffle on
// every re-render — a real decoded waveform isn't worth the payload for a
// handful of short voice notes, but a static per-card shape reads as
// intentional rather than random noise.
const seededHeight = (seed) => {
  const x = Math.sin(seed * 999.7) * 10000;
  const frac = x - Math.floor(x);
  return 0.22 + frac * 0.78; // 22%–100% of track height
};

const formatTime = (s) => {
  if (!Number.isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
};

/**
 * WhatsApp-style voice note bubble with a custom player. Audio itself is only
 * requested once the card scrolls into view (`shouldLoad`), and only at
 * preload="metadata" — enough for real duration, not the full file.
 *
 * Playback is exclusive across the section: starting one pauses whichever
 * other card owns `playingId`, coordinated by the parent via `onPlayRequest`.
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

  useEffect(() => {
    const el = cardRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShouldLoad(true); io.disconnect(); }
    }, { threshold: 0, rootMargin: '200px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Exclusive playback — another card claimed the "now playing" slot.
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
    <div ref={cardRef} className="vn-card">
      <style>{`
        .vn-card {
          background: #FFFFFF;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: box-shadow 0.28s cubic-bezier(0.16,1,0.3,1),
                      border-color 0.22s ease,
                      transform 0.28s cubic-bezier(0.16,1,0.3,1);
        }
        .vn-card:hover {
          box-shadow: 0 12px 36px rgba(0,0,0,0.08);
          border-color: var(--border-strong);
          transform: translateY(-2px);
        }
        .vn-play {
          width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
          background: var(--accent);
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .vn-play:hover { background: var(--accent-hover); transform: scale(1.06); }
        .vn-bar {
          width: 2.5px;
          border-radius: 2px;
          background: var(--border-strong);
          transition: background 0.25s ease;
          flex-shrink: 0;
        }
        .vn-bar.played { background: var(--accent); }
        @media (prefers-reduced-motion: reduce) {
          .vn-card, .vn-play { transition: none; }
        }
      `}</style>

      <button
        className="vn-play"
        onClick={togglePlay}
        aria-label={isPlaying ? (isRTL ? 'إيقاف' : 'Pause') : (isRTL ? 'تشغيل' : 'Play')}
      >
        {isPlaying
          ? <Pause style={{ width: 16, height: 16, color: '#fff' }} fill="#fff" />
          : <Play style={{ width: 16, height: 16, color: '#fff', marginInlineStart: 2 }} fill="#fff" />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 6, flexDirection: isRTL ? 'row-reverse' : 'row',
        }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 10, fontWeight: 600, color: '#0EA85F',
            background: '#ECFDF5', border: '1px solid #D1FAE5',
            padding: '2px 7px', borderRadius: 100,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          }}>
            <Mic style={{ width: 9, height: 9 }} aria-hidden />
            {tag}
          </span>
        </div>

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
          style={{
            display: 'flex', alignItems: 'center', gap: 2, height: 26, cursor: 'pointer',
            flexDirection: isRTL ? 'row-reverse' : 'row',
          }}
        >
          {bars.map((h, i) => (
            <span
              key={i}
              className={`vn-bar ${i < playedBars ? 'played' : ''}`}
              style={{ height: `${h * 100}%` }}
              aria-hidden
            />
          ))}
        </div>

        {/* Locked LTR — inside an RTL ancestor, the bidi algorithm treats
            "0:00" and "0:14" as separate neutral-direction runs around the
            slash and visually swaps their order (duration before elapsed). */}
        <div dir="ltr" style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 4, fontVariantNumeric: 'tabular-nums', textAlign: isRTL ? 'right' : 'left' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

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
