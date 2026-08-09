import { useMemo, useState, type ReactNode } from "react";
import { FiChevronUp, FiChevronDown, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useT } from "@/lib/i18n";

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  width?: string;
  align?: "left" | "center" | "right";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyContent?: ReactNode;
  rowKey: (row: T) => string | number;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  footerLabel?: (count: number) => string;
}

export function DataTable<T>({
  columns,
  data,
  loading,
  emptyContent,
  rowKey,
  pageSize = 10,
  onRowClick,
  footerLabel,
}: DataTableProps<T>) {
  const t = useT();
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return data;
    const arr = [...data];
    arr.sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [data, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const paged = sorted.slice(start, start + pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const colSpan = columns.length;

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="overflow-x-auto rounded-xl border border-white/20 dark:border-white/10 bg-white/30 dark:bg-black/10">
        <table className="w-full text-left min-w-[600px] border-collapse">
          <thead className="bg-black/5 dark:bg-white/5 border-b border-white/10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-3 px-4 font-bold text-xs text-gray-500 uppercase tracking-widest transition-colors ${
                    col.sortValue ? "cursor-pointer hover:text-indigo-500" : ""
                  }`}
                  style={{ 
                    width: col.width,
                    textAlign: col.align ?? "left"
                  }}
                  onClick={col.sortValue ? () => handleSort(col.key) : undefined}
                >
                  <div className={`flex items-center gap-1 ${col.align === "center" ? "justify-center" : col.align === "right" ? "justify-end" : ""}`}>
                    {col.label}
                    {col.sortValue && (
                      <span className="shrink-0 flex items-center">
                        {sortKey === col.key ? (
                          sortDir === "asc" ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />
                        ) : (
                          <FiChevronUp size={12} className="opacity-20" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colSpan} className="py-8 text-center">
                  <div className="flex justify-center">
                    <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                  </div>
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="py-8 text-center text-sm font-bold text-gray-500">
                  {emptyContent ?? t("table.noData")}
                </td>
              </tr>
            ) : (
              paged.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-b border-white/5 transition-colors ${
                    onRowClick ? "cursor-pointer hover:bg-white/20 dark:hover:bg-white/5" : "hover:bg-white/10 dark:hover:bg-white/5"
                  }`}
                >
                  {columns.map((col) => (
                    <td 
                      key={col.key} 
                      className="py-3 px-4 text-sm"
                      style={{ textAlign: col.align ?? "left" }}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          {footerLabel && sorted.length > 0 && (
            <tfoot className="bg-black/5 dark:bg-white/5 border-t border-white/10">
              <tr>
                <td colSpan={colSpan} className="py-3 px-4 text-xs font-bold text-gray-500">
                  {footerLabel(sorted.length)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination */}
      {sorted.length > pageSize && (
        <div className="flex justify-between items-center px-2">
          <span className="text-sm font-bold text-gray-500">
            {t("table.page", { current: currentPage, total: totalPages })}
          </span>
          <div className="flex gap-1 items-center">
            <button
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              <FiChevronLeft size={16} />
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, i, arr) => (
                  <div key={p} className="flex items-center gap-1">
                    {i > 0 && arr[i - 1] !== p - 1 && (
                      <span className="px-1 text-gray-400">…</span>
                    )}
                    <button
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
                        p === currentPage 
                          ? "bg-indigo-500 text-white shadow-sm" 
                          : "text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/10"
                      }`}
                    >
                      {p}
                    </button>
                  </div>
                ))}
            </div>

            <button
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
