import { useState, useEffect } from 'react';
import api from '../utils/api';

// Module-level cache — this section only ever needs to fetch its settings once
// per page load, no matter how many times the hook is consumed.
let cache = null;
let cachePromise = null;

const fetchSettings = () => {
  if (cache) return Promise.resolve(cache);
  if (!cachePromise) {
    cachePromise = api.get('/homepage-video/settings')
      .then(({ data }) => { cache = data.settings; return cache; })
      .catch(() => null);
  }
  return cachePromise;
};

export const useHomepageVideoSettings = () => {
  const [settings, setSettings] = useState(cache);
  const [loading, setLoading]   = useState(!cache);

  useEffect(() => {
    if (cache) { setSettings(cache); setLoading(false); return; }
    let cancelled = false;
    fetchSettings().then((s) => { if (!cancelled) { setSettings(s); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  return { settings, loading };
};
