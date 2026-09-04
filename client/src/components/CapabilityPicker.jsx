import { useState, useRef, useMemo, useCallback, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Search, X, Check, ShieldCheck, LayoutDashboard, ShoppingCart,
  FileText, MessageSquare, Cpu,
} from 'lucide-react';
import { FEATURE_TAGS } from '../constants/projectOptions';

/* ═══════════════════════════════════════════════════════════════
   CapabilityPicker — the "what features do you need" step.

   Replaces the old accordion-under-the-description-field pattern
   (fixed maxHeight:600, clipped content, 36 tiny pills in a wall)
   with a proper category-tab + panel picker:

   - No internal scroll container of its own — every category panel
     is short enough (max 6 items) to sit inline in the modal's one
     scroll owner, so opening a category only ever *adds* height to
     that single scrollable region instead of clipping content.
   - Real checkbox semantics (a visually-hidden native <input
     type="checkbox">) so screen readers announce checked state
     correctly and Space toggles it, not just a styled <button>.
   - A cross-category selected-summary stays visible under the
     tabs at all times, so a selection made in one category is
     still visible (and removable) while browsing another.
   - Search flattens all 6×6 features into one filtered, grouped
     list — the fastest path once someone knows what they want.
   ═══════════════════════════════════════════════════════════════ */

const CATEGORY_ICONS = {
  shield: ShieldCheck, dashboard: LayoutDashboard, cart: ShoppingCart,
  file: FileText, message: MessageSquare, cpu: Cpu,
};

// Defined at module scope (not inside CapabilityPicker's render body) so
// React treats it as a stable component type across renders — an inline
// component defined per-render would remount every checkbox on every
// keystroke in the search box, silently dropping focus/selection state.
const Option = ({ id, tagKey, label, sel, onToggle }) => (
  <label htmlFor={id} className={`cp-option ${sel ? 'sel' : ''}`}>
    <input
      id={id}
      type="checkbox"
      checked={sel}
      onChange={() => onToggle(tagKey)}
      className="cp-native-checkbox"
    />
    <span className="cp-checkmark" aria-hidden="true">
      {sel && <Check style={{ width: 12, height: 12, color: '#fff' }} strokeWidth={3} />}
    </span>
    <span className="cp-option-label">{label}</span>
  </label>
);

const CapabilityPicker = ({ selected, onToggle, onClear, errorId }) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const uid = useId();

  const [activeCategory, setActiveCategory] = useState(FEATURE_TAGS[0].categoryKey);
  const [search, setSearch] = useState('');
  const tabRefs = useRef({});

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const query = search.trim().toLowerCase();

  const countInCategory = useCallback(
    (categoryKey) => FEATURE_TAGS.find(g => g.categoryKey === categoryKey)
      .tags.filter(tagKey => selectedSet.has(tagKey)).length,
    [selectedSet]
  );

  // Search matches the translated label (works identically in AR/EN since
  // t() resolves to whichever language is active) or the category name.
  const searchResults = useMemo(() => {
    if (!query) return null;
    return FEATURE_TAGS.map(group => ({
      group,
      tags: group.tags.filter(tagKey => {
        const label = t(`projectForm.steps.tags.options.${tagKey}`).toLowerCase();
        const catLabel = t(`projectForm.steps.tags.categories.${group.categoryKey}`).toLowerCase();
        return label.includes(query) || catLabel.includes(query);
      }),
    })).filter(g => g.tags.length > 0);
  }, [query, t]);

  const activeGroup = FEATURE_TAGS.find(g => g.categoryKey === activeCategory);

  /* ── Keyboard nav across tabs — arrows move focus+selection, Home/End jump ── */
  const onTabKeyDown = (e, idx) => {
    const keys = { ArrowRight: isRTL ? -1 : 1, ArrowLeft: isRTL ? 1 : -1 };
    if (e.key in keys) {
      e.preventDefault();
      const next = (idx + keys[e.key] + FEATURE_TAGS.length) % FEATURE_TAGS.length;
      const cat = FEATURE_TAGS[next].categoryKey;
      setActiveCategory(cat);
      tabRefs.current[cat]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      const cat = FEATURE_TAGS[0].categoryKey;
      setActiveCategory(cat); tabRefs.current[cat]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      const cat = FEATURE_TAGS[FEATURE_TAGS.length - 1].categoryKey;
      setActiveCategory(cat); tabRefs.current[cat]?.focus();
    }
  };

  const renderOption = (tagKey) => (
    <Option
      key={tagKey}
      id={`${uid}-opt-${tagKey}`}
      tagKey={tagKey}
      label={t(`projectForm.steps.tags.options.${tagKey}`)}
      sel={selectedSet.has(tagKey)}
      onToggle={onToggle}
    />
  );

  return (
    <div className="cp-root">
      {/* ── Search ── */}
      <div className="cp-search">
        <Search className="cp-search-icon" style={{ width: 15, height: 15 }} aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('projectForm.steps.tags.searchPlaceholder')}
          aria-label={t('projectForm.steps.tags.searchPlaceholder')}
          className="cp-search-input"
        />
        {search && (
          <button type="button" onClick={() => setSearch('')} className="cp-search-clear"
            aria-label={t('projectForm.steps.tags.searchClear')}>
            <X style={{ width: 13, height: 13 }} />
          </button>
        )}
      </div>

      {searchResults ? (
        /* ── Search results — flattened, grouped by category for context ── */
        <div className="cp-search-results" aria-live="polite">
          {searchResults.length === 0 ? (
            <p className="cp-empty-hint">{t('projectForm.steps.tags.searchEmpty', { query: search })}</p>
          ) : searchResults.map(({ group, tags }) => (
            <div key={group.categoryKey} className="cp-search-group">
              <p className="cp-search-group-label">{t(`projectForm.steps.tags.categories.${group.categoryKey}`)}</p>
              <div className="cp-option-grid">
                {tags.map(renderOption)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* ── Category tabs ── */}
          <div className="cp-tabs" role="tablist" aria-label={t('projectForm.steps.tags.title')}>
            {FEATURE_TAGS.map((group, idx) => {
              const Icon = CATEGORY_ICONS[group.icon];
              const isActive = group.categoryKey === activeCategory;
              const n = countInCategory(group.categoryKey);
              return (
                <button
                  key={group.categoryKey}
                  ref={(el) => { tabRefs.current[group.categoryKey] = el; }}
                  type="button"
                  role="tab"
                  id={`${uid}-tab-${group.categoryKey}`}
                  aria-controls={`${uid}-panel-${group.categoryKey}`}
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveCategory(group.categoryKey)}
                  onKeyDown={(e) => onTabKeyDown(e, idx)}
                  className={`cp-tab ${isActive ? 'active' : ''}`}
                >
                  {Icon && <Icon style={{ width: 14, height: 14 }} aria-hidden="true" />}
                  <span>{t(`projectForm.steps.tags.categories.${group.categoryKey}`)}</span>
                  {n > 0 && <span className="cp-tab-count">{n}</span>}
                </button>
              );
            })}
          </div>

          {/* ── Active category panel ── */}
          <div
            role="tabpanel"
            id={`${uid}-panel-${activeGroup.categoryKey}`}
            aria-labelledby={`${uid}-tab-${activeGroup.categoryKey}`}
            tabIndex={0}
            className="cp-panel"
          >
            <div className="cp-option-grid">
              {activeGroup.tags.map(renderOption)}
            </div>
          </div>
        </>
      )}

      {/* ── Cross-category selected summary — always visible ── */}
      <div className="cp-summary" aria-live="polite" id={errorId}>
        {selected.length === 0 ? (
          <p className="cp-empty-hint">{t('projectForm.steps.tags.emptyHint')}</p>
        ) : (
          <>
            <div className="cp-summary-head">
              <span className="cp-summary-count">
                {t('projectForm.steps.tags.selectedCount', { count: selected.length })}
              </span>
              <button type="button" onClick={onClear} className="cp-clear-btn">
                {t('projectForm.steps.tags.clearAll')}
              </button>
            </div>
            <div className="cp-chip-row">
              {selected.map(tagKey => (
                <button key={tagKey} type="button" onClick={() => onToggle(tagKey)} className="cp-chip"
                  aria-label={t('projectForm.steps.tags.removeOne', { name: t(`projectForm.steps.tags.options.${tagKey}`) })}>
                  {t(`projectForm.steps.tags.options.${tagKey}`)}
                  <X style={{ width: 11, height: 11 }} aria-hidden="true" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CapabilityPicker;
