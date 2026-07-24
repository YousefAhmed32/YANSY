import { useState, useEffect } from 'react';
import api from '../utils/api';

// Module-level cache — the intro overlay mounts once per SPA session, but this
// keeps a second hook consumer (e.g. dev tooling) from re-fetching needlessly.
let cache = null;
let cachePromise = null;

const fetchSettings = () => {
  if (cache) return Promise.resolve(cache);
  if (!cachePromise) {
    cachePromise = api.get('/intro/settings')
      .then(({ data }) => { cache = data.settings; return cache; })
      .catch(() => null);
  }
  return cachePromise;
};

export const useIntroSettings = (enabled = true) => {
  const [settings, setSettings] = useState(cache);
  // Starts true and only flips once we actually have an answer — `enabled` starts
  // false and flips true a tick later (see IntroOverlow's `armed` state), so this
  // can NOT be derived from `enabled` in the useState initializer: that initializer
  // only ever runs once, on the very first (enabled=false) render, and would get
  // stuck at `loading=false` forever — racing ahead of the real fetch.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    if (cache) { setSettings(cache); setLoading(false); return; }
    let cancelled = false;
    fetchSettings().then((s) => { if (!cancelled) { setSettings(s); setLoading(false); } });
    return () => { cancelled = true; };
  }, [enabled]);

  return { settings, loading };
};
