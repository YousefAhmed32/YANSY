import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const PortfolioFilters = ({ filters, onChange, onReset, categories, industries, technologies, presentationModes, deliveryStatuses, isRTL, t }) => {
  const [expanded, setExpanded] = useState(false);
  const extraCount = ['industry', 'tag', 'mode', 'work', 'featuredOnly'].filter(key => Boolean(filters[key])).length + (filters.sort !== 'latest' ? 1 : 0);
  const hasFilters = extraCount > 0 || Boolean(filters.category || filters.searchInput);
  const name = item => isRTL ? (item.nameAr || item.name) : (item.name || item.nameAr);

  return (
    <div className="portfolio-filters">
      <div className="portfolio-toolbar">
        <div className="portfolio-categories" role="group" aria-label={t('categories')}>
          {[{ _id: 'all', slug: '', name: t('all') }, ...categories].map(item => (
            <button key={item._id || item.slug} type="button" aria-pressed={filters.category === item.slug} onClick={() => onChange('category', item.slug)}>
              {name(item)}
            </button>
          ))}
        </div>
        <div className="portfolio-search-controls">
          <div className="portfolio-search">
            <Search size={17} aria-hidden="true" />
            <input type="search" value={filters.searchInput} onChange={event => onChange('searchInput', event.target.value)} placeholder={t('search')} aria-label={t('search')} />
            {filters.searchInput && <button type="button" onClick={() => onChange('searchInput', '')} aria-label={t('clearSearch')}><X size={16} aria-hidden="true" /></button>}
          </div>
          <button type="button" className="portfolio-filter-toggle" onClick={() => setExpanded(value => !value)} aria-expanded={expanded} aria-controls="portfolio-advanced-filters" aria-label={t('filters')}>
            <SlidersHorizontal size={18} aria-hidden="true" />
            {extraCount > 0 && <span className="portfolio-filter-count">{extraCount}</span>}
          </button>
        </div>
      </div>
      {expanded && (
        <div id="portfolio-advanced-filters" className="portfolio-advanced" role="region" aria-label={t('filters')}>
          <div className="portfolio-advanced__fields">
            {industries.length > 0 && <label>{t('industry')}<select aria-label={t('industry')} value={filters.industry} onChange={event => onChange('industry', event.target.value)}><option value="">{t('allIndustries')}</option>{industries.map(item => <option key={item._id || item.slug} value={item.slug}>{name(item)}</option>)}</select></label>}
            {technologies.length > 0 && <label>{t('technology')}<select aria-label={t('technology')} value={filters.tag} onChange={event => onChange('tag', event.target.value)}><option value="">{t('allTechnologies')}</option>{technologies.map(item => <option key={item._id || item.slug} value={item.slug}>{name(item)}</option>)}</select></label>}
            <label>{t('sort')}<select aria-label={t('sort')} value={filters.sort} disabled={Boolean(filters.searchInput.trim())} onChange={event => onChange('sort', event.target.value)}>{['latest', 'oldest', 'popular'].map(value => <option key={value} value={value}>{t(value)}</option>)}</select></label>
            {presentationModes.showcase > 0 && <label>{t('format')}<select aria-label={t('format')} value={filters.mode} onChange={event => onChange('mode', event.target.value)}>{['', 'caseStudy', 'showcase'].map(value => <option key={value} value={value}>{t(value || 'allFormats')}</option>)}</select></label>}
            {deliveryStatuses.concept > 0 && <label>{t('workType')}<select aria-label={t('workType')} value={filters.work} onChange={event => onChange('work', event.target.value)}>{['', 'live', 'concept'].map(value => <option key={value} value={value}>{t(value || 'allWork')}</option>)}</select></label>}
          </div>
          <div className="portfolio-advanced__footer">
            <label className="portfolio-featured-check"><input type="checkbox" checked={filters.featuredOnly} onChange={event => onChange('featuredOnly', event.target.checked)} />{t('featuredOnly')}</label>
            {hasFilters && <button type="button" className="portfolio-text-button" onClick={onReset}>{t('reset')}</button>}
          </div>
        </div>
      )}
      {!expanded && hasFilters && <div className="portfolio-active-summary"><span>{t('filtering')}</span><button type="button" className="portfolio-text-button" onClick={onReset}>{t('reset')}</button></div>}
    </div>
  );
};

export default PortfolioFilters;
