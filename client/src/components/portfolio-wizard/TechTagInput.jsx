import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, Star, Copy, Clock, Sparkles, Check, Move, Search,
  Wand2, Layers, Cpu, Code2, Trash2
} from 'lucide-react';
import { TK, RADIUS, SHADOW, Modal, Button } from '../../admin-ui';
import api from '../../utils/api';
import {
  STACK_TEMPLATES, CATEGORY_SUGGESTIONS, DETECTED_PROJECT_TECHS
} from '../../data/techCatalog';

/**
 * `value`/`onChange` deal in Technology library objects ({_id, name, ...} —
 * see server/models/Technology.js), not free-text strings — the tech stack
 * is now a reusable library like Team/Client/etc, not per-project duplicated
 * data. Typing a name that doesn't exist yet in the library still works
 * (`addTags` find-or-creates it via POST /technologies), so the UX of
 * "just type or paste" is unchanged; what's new is that the SAME technology
 * typed on a later project reuses the same library entry instead of being a
 * fresh disconnected string, and usageCount/isPinned/lastUsedAt are tracked
 * server-side instead of per-browser localStorage.
 */
export const TechTagInput = ({
  value = [],
  onChange,
  placeholder,
  isRTL = false,
  projectId,
  category = 'Other',
}) => {
  const [draft, setDraft] = useState('');
  const [catalog, setCatalog] = useState([]);

  useEffect(() => {
    api.get('/technologies', { params: { limit: 300 } })
      .then(({ data }) => setCatalog(data.items || []))
      .catch(() => {});
  }, []);

  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Copy tech stack modal state
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const toggleFavorite = async (tech, e) => {
    e?.stopPropagation();
    try {
      const { data } = await api.patch(`/technologies/${tech._id}/pin`);
      setCatalog((prev) => prev.map((c) => (c._id === tech._id ? data.item : c)));
    } catch { /* non-critical UI affordance */ }
  };

  // Accepts either a Technology object (from a catalog chip) or a plain
  // name string (typed/pasted/template/recommendation) for the `isSelected`
  // check that drives every suggestion list's "already added" filter.
  const isSelected = useCallback(
    (techOrName) => {
      if (techOrName && typeof techOrName === 'object') return value.some((v) => v._id === techOrName._id);
      const name = String(techOrName).toLowerCase();
      return value.some((v) => v.name?.toLowerCase() === name);
    },
    [value]
  );

  // Adds Technology objects and/or raw name strings — raw strings that don't
  // match an existing library entry are find-or-created via POST
  // /technologies, so a first-time name becomes the canonical library entry
  // future projects reuse instead of a disconnected duplicate.
  const addTags = useCallback(
    async (newItems) => {
      const items = (Array.isArray(newItems) ? newItems : [newItems]).filter(Boolean);
      if (!items.length) return;

      const resolved = [];
      for (const item of items) {
        if (typeof item === 'object' && item._id) { resolved.push(item); continue; }
        const raw = String(item).trim();
        if (!raw) continue;
        const existing = catalog.find((c) => c.name.toLowerCase() === raw.toLowerCase());
        if (existing) { resolved.push(existing); continue; }
        try {
          const { data } = await api.post('/technologies', { name: raw });
          setCatalog((prev) => [...prev, data.item]);
          resolved.push(data.item);
        } catch { /* validation error or dedupe race — skip this one */ }
      }

      const existingIds = new Set(value.map((v) => v._id));
      const addedClean = resolved.filter((t) => t && !existingIds.has(t._id));
      if (addedClean.length > 0) onChange([...value, ...addedClean]);

      setDraft('');
      setShowSuggestions(false);
    },
    [value, onChange, catalog]
  );

  const removeTag = useCallback(
    (tech) => onChange(value.filter((t) => t._id !== tech._id)),
    [value, onChange]
  );

  const clearAllTags = useCallback(() => onChange([]), [onChange]);

  // Smart paste handler
  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;

    const splitTags = pastedText
      .split(/[,|\n;\t]+/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (splitTags.length > 1 || (splitTags.length === 1 && splitTags[0] !== pastedText)) {
      e.preventDefault();
      addTags(splitTags);
    }
  };

  // Autocomplete filtering — matches against the real Technology library
  const suggestions = useMemo(() => {
    const query = draft.trim().toLowerCase();
    if (!query) return [];
    return catalog
      .filter((tech) => tech.name.toLowerCase().includes(query) && !isSelected(tech))
      .slice(0, 8);
  }, [draft, catalog, isSelected]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions]);

  const handleKeyDown = (e) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && suggestions[selectedIndex])) {
        e.preventDefault();
        addTags(suggestions[selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
    }

    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (draft.trim()) addTags(draft);
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch projects for "Copy Tech Stack" modal
  const openCopyModal = async () => {
    setCopyModalOpen(true);
    if (projects.length > 0) return;
    setLoadingProjects(true);
    try {
      const { data } = await api.get('/portfolio/admin', { params: { limit: 100 } });
      setProjects((data.projects || []).filter((p) => p.technologies?.length > 0 && p._id !== projectId));
    } catch {
      // ignore
    } finally {
      setLoadingProjects(false);
    }
  };

  const importProjectTags = (projTechs) => {
    addTags(projTechs);
    setCopyModalOpen(false);
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const reordered = [...value];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, moved);
    onChange(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const favorites = useMemo(() => catalog.filter((c) => c.isPinned), [catalog]);
  const recents = useMemo(
    () => [...catalog].filter((c) => c.lastUsedAt).sort((a, b) => new Date(b.lastUsedAt) - new Date(a.lastUsedAt)),
    [catalog]
  );

  // Quick add chips: pinned first, then the rest of the library alphabetically
  const quickAddChips = useMemo(() => {
    const pinnedIds = new Set(favorites.map((f) => f._id));
    return [...catalog].sort((a, b) => {
      const aP = pinnedIds.has(a._id), bP = pinnedIds.has(b._id);
      if (aP && !bP) return -1;
      if (!aP && bP) return 1;
      return a.name.localeCompare(b.name);
    }).slice(0, 24);
  }, [catalog, favorites]);

  const categoryRecommendations = useMemo(() => {
    const recs = CATEGORY_SUGGESTIONS[category] || CATEGORY_SUGGESTIONS['Other'];
    return recs.filter((r) => !isSelected(r));
  }, [category, isSelected]);

  const detectedTechsNotSelected = useMemo(() => {
    return DETECTED_PROJECT_TECHS.filter((t) => !isSelected(t));
  }, [isSelected]);

  const recentsToShow = useMemo(
    () => recents.filter((r) => !isSelected(r)).slice(0, 10),
    [recents, isSelected]
  );

  const filteredCopyProjects = useMemo(() => {
    if (!projectSearch.trim()) return projects;
    const q = projectSearch.toLowerCase();
    return projects.filter(
      (p) => p.title?.toLowerCase().includes(q) || p.technologies?.some((t) => t.name.toLowerCase().includes(q))
    );
  }, [projects, projectSearch]);

  const L = {
    managerTitle: isRTL ? 'إدارة تقنيات المشروع' : 'Technology Manager',
    quickAdd: isRTL ? 'إضافة سريعة' : 'Quick Add',
    templates: isRTL ? 'القوالب الجاهزة' : 'Templates',
    copyTechStack: isRTL ? 'نسخ من مشروع آخر' : 'Copy Tech Stack',
    recentlyUsed: isRTL ? 'مستعملة مؤخرًا' : 'Recently Used',
    recommended: (cat) => isRTL ? `مقترحات لمجال: ${cat}` : `Recommended for ${cat}`,
    detectedTitle: isRTL ? '✨ تقنيات مكتشفة من المشروع' : '✨ Detected Technologies',
    importAllDetected: isRTL ? 'استيراد الكل' : 'Import All',
    copyModalTitle: isRTL ? 'استيراد التقنيات من مشروع آخر' : 'Copy Tech Stack from Project',
    searchProjects: isRTL ? 'ابحث في المشاريع...' : 'Search projects...',
    noProjects: isRTL ? 'لا توجد مشاريع أخرى تحتوي على تقنيات.' : 'No other projects with tags found.',
    importTags: isRTL ? 'استيراد التقنيات' : 'Import Stack',
    typeHint: isRTL ? 'اكتب تقنية أو قم بلصق نص كامل (React, Node, MongoDB)...' : 'Type or paste technologies (React, Node.js, MongoDB)...',
    loading: isRTL ? 'جارٍ تحميل المشاريع...' : 'Loading projects...',
    markFav: isRTL ? 'إضافة للمفضلة' : 'Mark Favorite',
    unmarkFav: isRTL ? 'إزالة من المفضلة' : 'Remove Favorite',
    clearAll: isRTL ? 'مسح الكل' : 'Clear All',
    activeTags: (count) => isRTL ? `التقنيات الحالية (${count})` : `Selected Technologies (${count})`,
  };
  const removeLabel = (tag) => (isRTL ? `إزالة ${tag}` : `Remove ${tag}`);

  return (
    <div
      style={{
        background: TK.surface,
        border: `1px solid ${TK.border}`,
        borderRadius: RADIUS.xl,
        padding: '20px',
        boxShadow: SHADOW.sm,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Top Header & Copy Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: RADIUS.md, background: TK.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TK.accent }}>
            <Cpu style={{ width: 15, height: 15 }} />
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: TK.text, margin: 0 }}>{L.managerTitle}</h4>
            <span style={{ fontSize: 11, color: TK.textMuted }}>{L.activeTags(value.length)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {value.length > 0 && (
            <Button type="button" variant="ghost" size="sm" icon={Trash2} onClick={clearAllTags} style={{ fontSize: 11, color: TK.red }}>
              {L.clearAll}
            </Button>
          )}
          <Button type="button" variant="secondary" size="sm" icon={Copy} onClick={openCopyModal} style={{ fontSize: 11.5 }}>
            {L.copyTechStack}
          </Button>
        </div>
      </div>

      {/* 1. Category Smart Suggestions (If category matches) */}
      {categoryRecommendations.length > 0 && (
        <div style={{ background: 'rgba(37,99,235,0.04)', border: `1px solid ${TK.accentBd}`, borderRadius: RADIUS.lg, padding: '10px 12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: TK.accent, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <Wand2 style={{ width: 12, height: 12 }} />
            {L.recommended(category)}
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            {categoryRecommendations.map((tech) => (
              <button
                key={tech}
                type="button"
                onClick={() => addTags(tech)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
                  padding: '3px 9px', borderRadius: RADIUS.pill, background: TK.surface, color: TK.accent,
                  border: `1px solid ${TK.accentBd}`, cursor: 'pointer', transition: 'all 0.15s ease',
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                }}
              >
                <span>{tech}</span>
                <Plus style={{ width: 10, height: 10 }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Detected Technologies from Codebase */}
      {detectedTechsNotSelected.length > 0 && (
        <div style={{ background: 'rgba(124,58,237,0.04)', border: `1px solid rgba(124,58,237,0.2)`, borderRadius: RADIUS.lg, padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: TK.purple, letterSpacing: '0.04em', textTransform: 'uppercase', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <Code2 style={{ width: 12, height: 12 }} />
              {L.detectedTitle} ({detectedTechsNotSelected.length})
            </span>
            <button
              type="button"
              onClick={() => addTags(detectedTechsNotSelected)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700,
                color: TK.purple, background: 'rgba(124,58,237,0.1)', border: 'none', borderRadius: RADIUS.pill,
                padding: '2px 8px', cursor: 'pointer',
              }}
            >
              <Sparkles style={{ width: 10, height: 10 }} /> {L.importAllDetected}
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            {detectedTechsNotSelected.map((tech) => (
              <button
                key={tech}
                type="button"
                onClick={() => addTags(tech)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 500,
                  padding: '3px 9px', borderRadius: RADIUS.pill, background: TK.surface, color: TK.purple,
                  border: `1px solid rgba(124,58,237,0.25)`, cursor: 'pointer', transition: 'all 0.15s ease',
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                }}
              >
                <span>{tech}</span>
                <Plus style={{ width: 10, height: 10 }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Reusable Stack Templates */}
      <div>
        <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: TK.textMuted, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>
          {L.templates}
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          {STACK_TEMPLATES.map((tmpl) => {
            const allIn = tmpl.tags.every((t) => isSelected(t));
            return (
              <button
                key={tmpl.name}
                type="button"
                onClick={() => addTags(tmpl.tags)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
                  padding: '4px 10px', borderRadius: RADIUS.pill,
                  background: allIn ? `${tmpl.color}15` : TK.bgSubtle,
                  color: allIn ? tmpl.color : TK.text,
                  border: `1px solid ${allIn ? tmpl.color : TK.border}`,
                  cursor: 'pointer', transition: 'all 0.15s ease',
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                }}
                title={`+ ${tmpl.tags.join(', ')}`}
              >
                <Sparkles style={{ width: 11, height: 11, color: tmpl.color }} />
                <span>+ {isRTL ? tmpl.nameAr : tmpl.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Quick Add Chips (Pinned first, then the rest of the library) */}
      <div>
        <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: TK.textMuted, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>
          {L.quickAdd}
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          {quickAddChips.map((tech) => {
            const active = isSelected(tech);

            return (
              <button
                key={tech._id}
                type="button"
                onClick={() => (active ? removeTag(tech) : addTags(tech))}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 500,
                  padding: '4px 10px', borderRadius: RADIUS.pill,
                  background: active ? TK.accent : TK.bgSubtle,
                  color: active ? '#FFFFFF' : TK.text,
                  border: `1px solid ${active ? TK.accent : TK.border}`,
                  cursor: 'pointer', transition: 'all 0.15s ease',
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                }}
              >
                <button
                  type="button"
                  onClick={(e) => toggleFavorite(tech, e)}
                  style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  title={tech.isPinned ? L.unmarkFav : L.markFav}
                >
                  <Star style={{ width: 10, height: 10, color: tech.isPinned ? '#F59E0B' : active ? 'rgba(255,255,255,0.6)' : TK.textLight, fill: tech.isPinned ? '#F59E0B' : 'none' }} />
                </button>
                <span>{tech.name}</span>
                {active ? <Check style={{ width: 11, height: 11, color: '#FFF' }} /> : <Plus style={{ width: 11, height: 11, color: TK.textLight }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Recently Used */}
      {recentsToShow.length > 0 && (
        <div>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: TK.textMuted, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <Clock style={{ width: 11, height: 11 }} />
            {L.recentlyUsed}
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            {recentsToShow.map((tech) => (
              <button
                key={tech._id}
                type="button"
                onClick={() => addTags(tech)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 500,
                  padding: '4px 10px', borderRadius: RADIUS.pill, background: TK.bgSubtle, color: TK.textMuted,
                  border: `1px dashed ${TK.border}`, cursor: 'pointer', flexDirection: isRTL ? 'row-reverse' : 'row',
                }}
              >
                <span>{tech.name}</span>
                <Plus style={{ width: 11, height: 11, color: TK.textLight }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 6. Active Tags Container & Direct Input Box */}
      <div ref={containerRef} style={{ position: 'relative', marginTop: 4 }}>
        <div
          className="au-input"
          onClick={() => inputRef.current?.focus()}
          style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, minHeight: 52,
            background: TK.bgSubtle, border: `1.5px solid ${showSuggestions ? TK.accent : TK.border}`,
            boxShadow: showSuggestions ? `0 0 0 3px ${TK.accentBg}` : 'none',
            borderRadius: RADIUS.lg, padding: '10px 12px', cursor: 'text', transition: 'all 0.15s ease',
            flexDirection: isRTL ? 'row-reverse' : 'row',
          }}
        >
          {/* Selected Tag Chips with Motion & Drag */}
          <AnimatePresence margin={false}>
            {value.map((tech, idx) => {
              const isBeingDragged = draggedIndex === idx;
              const isDragOver = dragOverIndex === idx;

              return (
                <motion.span
                  key={tech._id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={() => { setDraggedIndex(null); setDragOverIndex(null); }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
                    padding: '5px 10px', borderRadius: RADIUS.pill,
                    background: tech.isPinned ? 'rgba(245, 158, 11, 0.12)' : TK.surface,
                    color: tech.isPinned ? '#D97706' : TK.text,
                    border: `1px solid ${tech.isPinned ? 'rgba(245, 158, 11, 0.35)' : TK.border}`,
                    boxShadow: SHADOW.xs, opacity: isBeingDragged ? 0.4 : 1,
                    transform: isDragOver ? 'scale(1.05)' : 'none', cursor: 'grab', userSelect: 'none',
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                  }}
                >
                  <Move style={{ width: 10, height: 10, opacity: 0.4, cursor: 'grab' }} />
                  {tech.isPinned && <Star style={{ width: 10, height: 10, fill: '#F59E0B', color: '#F59E0B' }} />}
                  <span>🏷 {tech.name}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeTag(tech); }}
                    aria-label={removeLabel(tech.name)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'none', border: 'none', cursor: 'pointer', color: TK.textMuted,
                      padding: 1, borderRadius: '50%', opacity: 0.8,
                    }}
                  >
                    <X style={{ width: 11, height: 11 }} />
                  </button>
                </motion.span>
              );
            })}
          </AnimatePresence>

          {/* Direct Input */}
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={showSuggestions && suggestions.length > 0}
            aria-autocomplete="list"
            aria-controls="tech-tag-suggestions"
            aria-activedescendant={showSuggestions && suggestions[selectedIndex] ? `tech-suggestion-${selectedIndex}` : undefined}
            aria-label={placeholder || L.typeHint}
            value={draft}
            onChange={(e) => { setDraft(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={value.length === 0 ? (placeholder || L.typeHint) : ''}
            dir={isRTL ? 'rtl' : 'ltr'}
            style={{
              flex: 1, minWidth: 160, fontSize: 13, color: TK.text, border: 'none', outline: 'none', background: 'none',
              textAlign: isRTL ? 'right' : 'left',
            }}
          />
        </div>

        {/* Autocomplete Suggestions Popover */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              id="tech-tag-suggestions"
              role="listbox"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'absolute', top: '100%', insetInlineStart: 0, insetInlineEnd: 0, marginTop: 6, zIndex: 100,
                background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: RADIUS.lg,
                boxShadow: SHADOW.md, overflow: 'hidden',
              }}
            >
              {suggestions.map((tech, i) => {
                const isCurrentFocus = i === selectedIndex;

                return (
                  <div
                    key={tech._id}
                    id={`tech-suggestion-${i}`}
                    role="option"
                    aria-selected={isCurrentFocus}
                    onMouseDown={(e) => { e.preventDefault(); addTags(tech); }}
                    onMouseEnter={() => setSelectedIndex(i)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '9px 14px', fontSize: 13, fontWeight: 500,
                      color: isCurrentFocus ? TK.accent : TK.text,
                      background: isCurrentFocus ? TK.accentBg : 'transparent',
                      cursor: 'pointer', transition: 'background 0.1s ease',
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <Plus style={{ width: 13, height: 13, color: isCurrentFocus ? TK.accent : TK.textLight }} />
                      {tech.name}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(tech, e)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                    >
                      <Star style={{ width: 13, height: 13, color: tech.isPinned ? '#F59E0B' : TK.textLight, fill: tech.isPinned ? '#F59E0B' : 'none' }} />
                    </button>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Copy Tech Stack Modal */}
      <Modal open={copyModalOpen} onClose={() => setCopyModalOpen(false)} title={L.copyModalTitle} width="560px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: 12, width: 14, height: 14, color: TK.textMuted }} />
            <input
              type="text"
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              placeholder={L.searchProjects}
              style={{
                width: '100%', fontSize: 13, padding: '9px 12px', paddingInlineStart: 34,
                background: TK.bgSubtle, border: `1px solid ${TK.border}`, borderRadius: RADIUS.md,
                outline: 'none', color: TK.text,
              }}
            />
          </div>

          {/* Project List */}
          <div className="au-scroll" style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loadingProjects && (
              <p style={{ fontSize: 13, color: TK.textMuted, textAlign: 'center', padding: 20 }}>
                {L.loading}
              </p>
            )}

            {!loadingProjects && filteredCopyProjects.length === 0 && (
              <p style={{ fontSize: 12.5, color: TK.textMuted, textAlign: 'center', padding: 24 }}>
                {L.noProjects}
              </p>
            )}

            {filteredCopyProjects.map((p) => {
              const projTechs = p.technologies || [];

              return (
                <div
                  key={p._id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: TK.surface, border: `1px solid ${TK.border}`,
                    borderRadius: RADIUS.lg, gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: TK.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.title}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                      {projTechs.slice(0, 8).map((t) => (
                        <span
                          key={t._id}
                          style={{
                            fontSize: 10.5, fontWeight: 500, padding: '2px 6px', borderRadius: RADIUS.sm,
                            background: isSelected(t) ? TK.accentBg : TK.bgSubtle,
                            color: isSelected(t) ? TK.accent : TK.textMuted,
                          }}
                        >
                          {t.name}
                        </span>
                      ))}
                      {projTechs.length > 8 && (
                        <span style={{ fontSize: 10.5, color: TK.textLight }}>
                          +{projTechs.length - 8}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button size="sm" variant="secondary" icon={Plus} onClick={() => importProjectTags(projTechs)} style={{ flexShrink: 0 }}>
                    {L.importTags} ({projTechs.length})
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TechTagInput;
