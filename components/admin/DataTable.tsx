'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKey?: keyof T;
  filterOptions?: { label: string; value: string; filterFn: (item: T) => boolean }[];
  pageSize?: number;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = 'بحث...',
  searchKey,
  filterOptions,
  pageSize = 10,
  emptyMessage = 'لا توجد بيانات متاحة حالياً',
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Filter & Search
  const filteredData = useMemo(() => {
    let result = data;

    // Apply Filter
    if (activeFilter !== 'all' && filterOptions) {
      const selected = filterOptions.find((f) => f.value === activeFilter);
      if (selected) {
        result = result.filter(selected.filterFn);
      }
    }

    // Apply Search
    if (searchTerm.trim() && searchKey) {
      const term = searchTerm.toLowerCase();
      result = result.filter((item) => {
        const val = item[searchKey];
        return val ? String(val).toLowerCase().includes(term) : false;
      });
    }

    return result;
  }, [data, searchTerm, searchKey, activeFilter, filterOptions]);

  // 2. Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  return (
    <div className="space-y-4">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {searchKey && (
          <div className="relative max-w-sm flex-1">
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-typography-muted">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              aria-label={searchPlaceholder || 'بحث'}
              placeholder={searchPlaceholder}
              className="block w-full rounded-lg border border-border-strong bg-surface-sunken ps-9 pe-3 py-2 text-sm text-typography-primary placeholder:text-typography-muted/50 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
            />
          </div>
        )}

        {filterOptions && filterOptions.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => {
                setActiveFilter('all');
                setCurrentPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeFilter === 'all'
                  ? 'bg-brand-primary text-brand-primary-foreground'
                  : 'border border-border-subtle bg-surface-elevated text-typography-muted hover:border-brand-accent'
              }`}
            >
              الكل ({data.length})
            </button>
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setActiveFilter(opt.value);
                  setCurrentPage(1);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeFilter === opt.value
                    ? 'bg-brand-primary text-brand-primary-foreground'
                    : 'border border-border-subtle bg-surface-elevated text-typography-muted hover:border-brand-accent'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table Surface */}
      <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-elevated shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead className="border-b border-border-subtle bg-surface-sunken/60 text-xs font-semibold uppercase tracking-wider text-typography-muted">
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    scope="col"
                    className={`px-4 py-3 text-start ${col.className || ''}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {paginatedData.length > 0 ? (
                paginatedData.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className="transition-colors hover:bg-surface-sunken/40"
                  >
                    {columns.map((col, colIdx) => (
                      <td
                        key={colIdx}
                        className={`px-4 py-3.5 text-typography-primary ${col.className || ''}`}
                      >
                        {col.cell
                          ? col.cell(row)
                          : col.accessorKey
                          ? String(row[col.accessorKey] ?? '')
                          : null}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-typography-muted"
                  >
                    <Inbox className="mx-auto h-8 w-8 text-typography-muted/50" />
                    <p className="mt-2 text-sm font-medium">{emptyMessage}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border-subtle px-4 py-3 text-xs text-typography-muted">
            <div>
              عرض {(currentPage - 1) * pageSize + 1} إلى{' '}
              {Math.min(currentPage * pageSize, filteredData.length)} من أصل{' '}
              {filteredData.length} سجل
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-surface-elevated text-typography-primary disabled:opacity-40 hover:border-brand-accent transition-colors"
                aria-label="Previous Page"
              >
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </button>
              <span className="px-2 font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-surface-elevated text-typography-primary disabled:opacity-40 hover:border-brand-accent transition-colors"
                aria-label="Next Page"
              >
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
