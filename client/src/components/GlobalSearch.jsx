import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FolderKanban, Images, MessageSquare, Users, Loader2 } from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { TK } from '../admin-ui';

const TYPE_ICON = { project: FolderKanban, portfolio: Images, message: MessageSquare, user: Users };
const TYPE_LABEL = (isRTL) => ({
  project:   isRTL ? 'مشاريع'   : 'Projects',
  portfolio: isRTL ? 'أعمال'    : 'Portfolio',
  message:   isRTL ? 'رسائل'    : 'Messages',
  user:      isRTL ? 'مستخدمون' : 'Users',
});

const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const GlobalSearch = ({ open, onClose }) => {
  const navigate  = useNavigate();
  const { isRTL }  = useLanguage();
  const inputRef  = useRef(null);
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [selected, setSelected] = useState(0);

  const debouncedQuery = useDebounce(query, 300);
  const typeLabel = TYPE_LABEL(isRTL);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults(null);
      setSelected(0);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); if (open) onClose(); }
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) { setResults(null); return; }
    let cancelled = false;
    const search = async () => {
      setLoading(true);
      try {
        const res = await api.get('/search', { params: { q: debouncedQuery, limit: 5 } });
        if (!cancelled) { setResults(res.data.results); setSelected(0); }
      } catch {
        if (!cancelled) setResults(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    search();
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const flatItems = results
    ? [...(results.projects || []), ...(results.portfolio || []), ...(results.messages || []), ...(results.users || [])]
    : [];

  const handleKeyDown = (e) => {
    if (!flatItems.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(v => (v + 1) % flatItems.length); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(v => (v - 1 + flatItems.length) % flatItems.length); }
    if (e.key === 'Enter' && flatItems[selected]) { navigate(flatItems[selected].link); onClose(); }
  };

  if (!open) return null;

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(24,24,27,0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '80px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: '560px',
        background: TK.surface, border: `1px solid ${TK.border}`,
        borderRadius: '14px', overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)',
        animation: 'searchSlide 0.18s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <style>{`
          @keyframes searchSlide { from { opacity:0; transform:translateY(-8px) scale(0.98); } to { opacity:1; transform:none; } }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>

        {/* Input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '16px 20px',
          borderBottom: flatItems.length > 0 ? `1px solid ${TK.border}` : 'none',
        }}>
          {loading
            ? <Loader2 style={{ width: '18px', height: '18px', color: TK.text, animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
            : <Search style={{ width: '18px', height: '18px', color: TK.textLight, flexShrink: 0 }} />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRTL ? 'ابحث في المشاريع والأعمال والرسائل...' : 'Search projects, portfolio, messages...'}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: '15px', fontWeight: 400, color: TK.text,
              caretColor: TK.text,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <kbd style={{
              padding: '2px 6px', borderRadius: '5px', fontSize: '10px',
              background: TK.bgSubtle, color: TK.textLight,
              border: `1px solid ${TK.border}`, fontFamily: 'monospace',
            }}>ESC</kbd>
            {query && (
              <button
                onClick={() => { setQuery(''); setResults(null); inputRef.current?.focus(); }}
                aria-label={isRTL ? 'مسح' : 'Clear'}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: TK.textLight, padding: '2px', display: 'flex' }}
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
                    fontSize: '9px', fontWeight: 600,
                    color: TK.textLight, letterSpacing: isRTL ? 0 : '0.14em', textTransform: isRTL ? 'none' : 'uppercase',
                  }}>
                    {typeLabel[items[0]?.type] || groupKey}
                  </div>
                  {items.map((item, i) => {
                    const globalIdx = startIdx + i;
                    const Icon      = TYPE_ICON[item.type] || FolderKanban;
                    const isSelected = globalIdx === selected;
                    return (
                      <div
                        key={item._id}
                        onClick={() => { navigate(item.link); onClose(); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '10px 20px', cursor: 'pointer',
                          background: isSelected ? TK.bgSubtle : 'transparent',
                          borderInlineStart: isSelected ? `2px solid ${TK.ink}` : '2px solid transparent',
                          transition: 'all 0.1s',
                        }}
                        onMouseEnter={() => setSelected(globalIdx)}
                      >
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                          background: TK.bgSubtle,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon style={{ width: '14px', height: '14px', color: TK.text }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 400, color: TK.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div style={{ fontSize: '11px', color: TK.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                        {item.meta && (
                          <span style={{ fontSize: '10px', color: TK.textLight, flexShrink: 0 }}>{item.meta}</span>
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
          <div style={{ padding: '32px', textAlign: 'center', color: TK.textLight }}>
            <Search style={{ width: '28px', height: '28px', margin: '0 auto 10px', opacity: 0.3 }} />
            <p style={{ fontSize: '13px', fontWeight: 400, color: TK.textMuted }}>
              {isRTL ? `لا نتائج لـ "${query}"` : `No results for "${query}"`}
            </p>
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '10px 20px', borderTop: `1px solid ${TK.border}`,
          display: 'flex', gap: '16px', alignItems: 'center',
        }}>
          {[
            ['↑↓', isRTL ? 'تنقل' : 'Navigate'],
            ['↵', isRTL ? 'اختيار' : 'Select'],
            ['Esc', isRTL ? 'إغلاق' : 'Close'],
          ].map(([key, label]) => (
            <span key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: TK.textLight }}>
              <kbd style={{
                padding: '1px 5px', borderRadius: '4px',
                background: TK.bgSubtle, border: `1px solid ${TK.border}`,
                fontFamily: 'monospace', fontSize: '10px', color: TK.textMuted,
              }}>{key}</kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
