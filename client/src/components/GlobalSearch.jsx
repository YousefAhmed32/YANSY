import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FolderKanban, Images, MessageSquare, Users, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import api from '../utils/api';

const TYPE_ICON = {
  project:   FolderKanban,
  portfolio: Images,
  message:   MessageSquare,
  user:      Users,
};

const TYPE_LABEL = {
  project:   'Project',
  portfolio: 'Portfolio',
  message:   'Message',
  user:      'User',
};

const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const GlobalSearch = ({ open, onClose }) => {
  const { isDark }  = useTheme();
  const navigate    = useNavigate();
  const inputRef    = useRef(null);
  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [selected,  setSelected]  = useState(0);

  const debouncedQuery = useDebounce(query, 300);

  const gold      = '#d4af37';
  const bg        = isDark ? '#0d0d0b' : '#ffffff';
  const border    = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const textMain  = isDark ? '#f5f5f0' : '#0a0a0a';
  const textMuted = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const hoverBg   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults(null);
      setSelected(0);
    }
  }, [open]);

  // Keyboard shortcut Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose(); else onClose(true);
      }
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Search
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults(null);
      return;
    }
    let cancelled = false;
    const search = async () => {
      setLoading(true);
      try {
        const res = await api.get('/search', { params: { q: debouncedQuery, limit: 5 } });
        if (!cancelled) {
          setResults(res.data.results);
          setSelected(0);
        }
      } catch {
        if (!cancelled) setResults(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    search();
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // Flatten results for keyboard nav
  const flatItems = results
    ? [
        ...(results.projects  || []),
        ...(results.portfolio || []),
        ...(results.messages  || []),
        ...(results.users     || []),
      ]
    : [];

  const handleKeyDown = (e) => {
    if (!flatItems.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(v => (v + 1) % flatItems.length); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(v => (v - 1 + flatItems.length) % flatItems.length); }
    if (e.key === 'Enter' && flatItems[selected]) {
      navigate(flatItems[selected].link);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '80px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: '100%', maxWidth: '560px',
          background: bg, border: `1px solid ${border}`,
          borderRadius: '14px', overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          animation: 'searchSlide 0.18s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <style>{`@keyframes searchSlide { from { opacity:0; transform:translateY(-8px) scale(0.98); } to { opacity:1; transform:none; } }`}</style>

        {/* Input row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '16px 20px',
          borderBottom: flatItems.length > 0 ? `1px solid ${border}` : 'none',
        }}>
          {loading
            ? <Loader2 style={{ width: '18px', height: '18px', color: gold, animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
            : <Search style={{ width: '18px', height: '18px', color: textMuted, flexShrink: 0 }} />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search projects, portfolio, messages..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: '15px', fontWeight: 300, color: textMain,
              caretColor: gold,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <kbd style={{
              padding: '2px 6px', borderRadius: '5px', fontSize: '10px',
              background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              color: textMuted, border: `1px solid ${border}`,
              fontFamily: 'monospace',
            }}>ESC</kbd>
            {query && (
              <button
                onClick={() => { setQuery(''); setResults(null); inputRef.current?.focus(); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: '2px', display: 'flex' }}
              >
                <X style={{ width: '15px', height: '15px' }} />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {flatItems.length > 0 && (
          <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '8px 0' }}>
            {Object.entries(results).map(([groupKey, items]) => {
              if (!items?.length) return null;
              const startIdx = flatItems.findIndex(i => i._id === items[0]._id);
              return (
                <div key={groupKey}>
                  <div style={{
                    padding: '6px 20px 4px',
                    fontSize: '9px', fontWeight: 500,
                    color: textMuted, letterSpacing: '0.14em', textTransform: 'uppercase',
                  }}>
                    {TYPE_LABEL[items[0]?.type] || groupKey}s
                  </div>
                  {items.map((item, i) => {
                    const globalIdx = startIdx + i;
                    const Icon = TYPE_ICON[item.type] || FolderKanban;
                    const isSelected = globalIdx === selected;
                    return (
                      <div
                        key={item._id}
                        onClick={() => { navigate(item.link); onClose(); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '10px 20px', cursor: 'pointer',
                          background: isSelected ? hoverBg : 'transparent',
                          borderLeft: isSelected ? `2px solid ${gold}` : '2px solid transparent',
                          transition: 'all 0.1s',
                        }}
                        onMouseEnter={() => setSelected(globalIdx)}
                      >
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                          background: isDark ? 'rgba(212,175,55,0.1)' : 'rgba(212,175,55,0.08)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon style={{ width: '14px', height: '14px', color: gold }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 300, color: textMain, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div style={{ fontSize: '11px', color: textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                        {item.meta && (
                          <span style={{ fontSize: '10px', color: textMuted, flexShrink: 0 }}>{item.meta}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {query.length >= 2 && !loading && results && flatItems.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: textMuted }}>
            <Search style={{ width: '28px', height: '28px', margin: '0 auto 10px', opacity: 0.3 }} />
            <p style={{ fontSize: '13px', fontWeight: 300 }}>No results for "{query}"</p>
          </div>
        )}

        {/* Footer hint */}
        <div style={{
          padding: '10px 20px', borderTop: `1px solid ${border}`,
          display: 'flex', gap: '16px', alignItems: 'center',
        }}>
          {[['↑↓', 'Navigate'], ['↵', 'Select'], ['Esc', 'Close']].map(([key, label]) => (
            <span key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: textMuted }}>
              <kbd style={{ padding: '1px 5px', borderRadius: '4px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', border: `1px solid ${border}`, fontFamily: 'monospace', fontSize: '10px', color: textMuted }}>{key}</kbd>
              {label}
            </span>
          ))}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
};

export default GlobalSearch;
