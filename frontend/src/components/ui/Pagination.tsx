import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  /** Zero-based index of the page currently on screen. */
  page: number;
  /** Rows shown per page. */
  pageSize: number;
  /** Total number of rows in the full collection. */
  total: number;
  onPageChange: (page: number) => void;
  /** Rows per page choices offered in the selector. */
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
}

/** How many numbered buttons to show on each side of the current page. */
const WINDOW = 2;

const btnBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  border: '1px solid var(--border)',
  borderRadius: 8,
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  fontWeight: 600,
  fontFamily: 'inherit',
};

/**
 * Client-side pagination controls.
 *
 * The rows are already fully in memory at this point — the loaders drain the
 * whole collection so aggregations stay honest — so paging here is a pure
 * slice. It never changes what totals or KPI cards compute from.
 */
export const Pagination: React.FC<Props> = ({
  page,
  pageSize,
  total,
  onPageChange,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
}) => {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  // Keep the requested page inside range when the collection shrinks
  // (e.g. rows deleted or filtered away on a later page).
  const safePage = Math.min(page, pageCount - 1);

  const pages = useMemo(() => {
    const out: (number | '…')[] = [];
    const start = Math.max(0, safePage - WINDOW);
    const end = Math.min(pageCount - 1, safePage + WINDOW);

    if (start > 0) {
      out.push(0);
      if (start > 1) out.push('…');
    }
    for (let i = start; i <= end; i++) out.push(i);
    if (end < pageCount - 1) {
      if (end < pageCount - 2) out.push('…');
      out.push(pageCount - 1);
    }
    return out;
  }, [safePage, pageCount]);

  const from = total === 0 ? 0 : safePage * pageSize + 1;
  const to = Math.min(total, (safePage + 1) * pageSize);
  const size = 34;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
        padding: '12px 4px 0',
        borderTop: '1px solid var(--border)',
        marginTop: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
        <span>
          Showing <strong style={{ color: 'var(--text-primary)' }}>{from}–{to}</strong> of{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{total}</strong> record{total === 1 ? '' : 's'}
        </span>

        {onPageSizeChange && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span>Per page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={{
                padding: '5px 8px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--bg-subtle)',
                color: 'var(--text-primary)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, safePage - 1))}
          disabled={safePage === 0}
          aria-label="Previous page"
          title="Previous page"
          style={{
            ...btnBase,
            height: size,
            minWidth: size,
            padding: '0 8px',
            opacity: safePage === 0 ? 0.45 : 1,
            cursor: safePage === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          <ChevronLeft size={15} />
        </button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} style={{ padding: '0 4px', fontSize: 12, color: 'var(--text-muted)' }}>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === safePage ? 'page' : undefined}
              style={{
                ...btnBase,
                height: size,
                minWidth: size,
                padding: '0 8px',
                fontSize: 12,
                background: p === safePage ? 'var(--solid-btn-bg)' : 'var(--bg-card)',
                color: p === safePage ? 'var(--solid-btn-text)' : 'var(--text-primary)',
                borderColor: p === safePage ? 'var(--solid-btn-bg)' : 'var(--border)',
              }}
            >
              {p + 1}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(pageCount - 1, safePage + 1))}
          disabled={safePage >= pageCount - 1}
          aria-label="Next page"
          title="Next page"
          style={{
            ...btnBase,
            height: size,
            minWidth: size,
            padding: '0 8px',
            opacity: safePage >= pageCount - 1 ? 0.45 : 1,
            cursor: safePage >= pageCount - 1 ? 'not-allowed' : 'pointer',
          }}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
