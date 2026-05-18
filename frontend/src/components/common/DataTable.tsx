import { useState, useMemo } from 'react';
import { Download, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { downloadCsv } from '../../utils/csv';

export interface Column<T> {
  key: string;
  header: string;
  accessor: (row: T) => string | number;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  className?: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  title?: string;
  exportFilename?: string;
  emptyMessage?: string;
}

type SortDir = 'asc' | 'desc' | null;

export function DataTable<T>({ columns, data, title, exportFilename, emptyMessage }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return data;
    return [...data].sort((a, b) => {
      const va = col.accessor(a);
      const vb = col.accessor(b);
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      return sortDir === 'asc'
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
  }, [data, sortKey, sortDir, columns]);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc');
      if (sortDir === 'desc') setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function handleExport() {
    if (!exportFilename) return;
    const headers = columns.map((c) => c.header);
    const rows = sortedData.map((row) => columns.map((c) => c.accessor(row)));
    downloadCsv(exportFilename, headers, rows);
  }

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey)
      return <ChevronsUpDown className="ml-1 inline h-3 w-3 text-clay-soft hover:text-clay-primary" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="ml-1 inline h-3 w-3 text-clay-primary" />
    ) : (
      <ChevronDown className="ml-1 inline h-3 w-3 text-clay-primary" />
    );
  };

  if (data.length === 0) {
    return (
      <div className="clay-card overflow-hidden">
        {title && (
          <div className="border-b border-clay-border px-5 py-3">
            <h3 className="text-sm font-semibold text-clay-ink">{title}</h3>
          </div>
        )}
        <div className="flex items-center justify-center py-12 text-sm text-clay-muted">
          {emptyMessage || 'No data available'}
        </div>
      </div>
    );
  }

  return (
    <div className="clay-card overflow-hidden">
      {(title || exportFilename) && (
        <div className="flex items-center justify-between border-b border-clay-border px-5 py-3">
          {title && <h3 className="text-sm font-semibold text-clay-ink">{title}</h3>}
          {exportFilename && (
            <button
              onClick={handleExport}
              className="clay-button-ghost flex items-center gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="clay-table w-full text-sm">
          <thead>
            <tr className="bg-clay-surface2">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`whitespace-nowrap border-b border-clay-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-clay-muted ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  } ${col.sortable !== false ? 'cursor-pointer select-none hover:text-clay-primary' : ''}`}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  {col.header}
                  {col.sortable !== false && <SortIcon colKey={col.key} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-clay-border">
            {sortedData.map((row, i) => (
              <tr key={i} className="transition-colors hover:bg-clay-surface2">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`whitespace-nowrap px-4 py-3 ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    } ${col.className || ''}`}
                  >
                    {col.render ? col.render(row) : col.accessor(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
