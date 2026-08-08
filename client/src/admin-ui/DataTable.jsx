import { useState } from 'react';
import { ChevronUp, ChevronDown, Inbox } from 'lucide-react';
import { TK, RADIUS } from './tokens';
import { Skeleton, EmptyState, Pagination } from './Primitives';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * Generic admin data table.
 *
 * columns: [{ key, label, width, align, sortable, render(row) }]
 * rows: array of data objects (each needs a stable `id` via getRowId)
 * emptyTitle should be passed translated by the caller — the default below
 * is only a bilingual fallback, never raw English.
 */
export const DataTable = ({
  columns,
  rows,
  getRowId = (r) => r._id || r.id,
  loading = false,
  emptyIcon = Inbox,
  emptyTitle,
  emptySubtitle,
  emptyAction,
  sortKey,
  sortDir = 'asc',
  onSort,
  selectable = false,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onRowClick,
  isRTL = false,
  footer,
  page,
  totalPages,
  onPageChange,
  dense = false,
}) => {
  const { isRTL: contextRTL } = useLanguage();
  const rtl = isRTL || contextRTL;
  const resolvedEmptyTitle = emptyTitle ?? (rtl ? 'لا توجد نتائج' : 'No results');
  const allSelected = selectable && rows.length > 0 && rows.every(r => selectedIds?.has(getRowId(r)));
  const cellPad = dense ? '10px 16px' : '14px 20px';

  return (
    <div style={{ background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: RADIUS.xl, overflow: 'hidden' }}>
      <div className="au-scroll" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${TK.border}` }}>
              {selectable && (
                <th style={{ padding: cellPad, width: '36px' }}>
                  <input type="checkbox" className="au-checkbox" checked={allSelected} onChange={onToggleSelectAll} />
                </th>
              )}
              {columns.map(col => {
                const active = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={col.sortable ? () => onSort?.(col.key) : undefined}
                    style={{
                      padding: cellPad, textAlign: col.align || (rtl ? 'right' : 'left'),
                      fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: active ? TK.accent : TK.textMuted, width: col.width,
                      cursor: col.sortable ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {col.label}
                      {col.sortable && active && (sortDir === 'asc' ? <ChevronUp style={{ width: '11px', height: '11px' }} /> : <ChevronDown style={{ width: '11px', height: '11px' }} />)}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${TK.borderSoft}` }}>
                  {selectable && <td style={{ padding: cellPad }} />}
                  {columns.map(col => (
                    <td key={col.key} style={{ padding: cellPad }}><Skeleton height="12px" width={col.skeletonWidth || '70%'} /></td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)}>
                  <EmptyState icon={emptyIcon} title={resolvedEmptyTitle} subtitle={emptySubtitle} action={emptyAction} />
                </td>
              </tr>
            ) : rows.map(row => {
              const id = getRowId(row);
              const selected = selectedIds?.has(id);
              return (
                <tr
                  key={id}
                  className="au-row"
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  style={{
                    borderBottom: `1px solid ${TK.borderSoft}`,
                    background: selected ? TK.activeBg : 'transparent',
                    cursor: onRowClick ? 'pointer' : 'default',
                  }}
                >
                  {selectable && (
                    <td style={{ padding: cellPad }} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" className="au-checkbox" checked={!!selected} onChange={() => onToggleSelect(id)} />
                    </td>
                  )}
                  {columns.map(col => (
                    <td key={col.key} style={{ padding: cellPad, textAlign: col.align || (rtl ? 'right' : 'left') }}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(footer || (totalPages > 1)) && (
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${TK.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '11.5px', color: TK.textMuted }}>{footer}</span>
          {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={onPageChange} isRTL={rtl} />}
        </div>
      )}
    </div>
  );
};

/** Client-side sort/select helper for tables that don't paginate server-side. */
export const useTableState = (initialSort = null) => {
  const [sortKey, setSortKey] = useState(initialSort);
  const [sortDir, setSortDir] = useState('asc');
  const [selectedIds, setSelectedIds] = useState(new Set());

  const onSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sortRows = (rows) => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  };

  const toggleSelect = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleSelectAll = (rows, getRowId) => setSelectedIds(prev => {
    const allIn = rows.every(r => prev.has(getRowId(r)));
    if (allIn) return new Set();
    return new Set(rows.map(getRowId));
  });

  return { sortKey, sortDir, onSort, sortRows, selectedIds, setSelectedIds, toggleSelect, toggleSelectAll };
};
