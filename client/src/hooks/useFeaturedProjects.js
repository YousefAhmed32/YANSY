import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

// Shared by the hero preview and work section: one source of published work.
export const useFeaturedProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    api.get('/portfolio?featured=true&limit=3', { signal: controller.signal })
      .then(({ data }) => {
        if (alive) setProjects(Array.isArray(data.projects) ? data.projects : []);
      })
      .catch(() => { if (alive) setFailed(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; controller.abort(); };
  }, [attempt]);

  const retry = useCallback(() => {
    setLoading(true);
    setFailed(false);
    setAttempt(value => value + 1);
  }, []);

  return { projects, loading, failed, retry };
};
