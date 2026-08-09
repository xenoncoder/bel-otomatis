import { useMemo, useState, type ReactNode } from "react";
import { Box, HStack, Table, Text } from "@chakra-ui/react";
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
    <Box className="sw-table-container" overflow="auto" maxW="100%">
      <Table.Root size="sm" variant="outline" className="sw-table-zebra sw-table-mobile" minWidth="600px">
        <Table.Header>
          <Table.Row>
            {columns.map((col) => (
              <Table.ColumnHeader
                key={col.key}
                className={col.sortValue ? "sw-th-sortable" : undefined}
                data-sorted={sortKey === col.key}
                onClick={col.sortValue ? () => handleSort(col.key) : undefined}
                width={col.width}
                textAlign={col.align ?? "left"}
                whiteSpace="nowrap"
              >
                {col.label}
                {col.sortValue && (
                  <span className="sw-sort-icon">
                    {sortKey === col.key ? (
                      sortDir === "asc" ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />
                    ) : (
                      <FiChevronUp size={12} style={{ opacity: 0.3 }} />
                    )}
                  </span>
                )}
              </Table.ColumnHeader>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {loading ? (
            <Table.Row>
              <Table.Cell colSpan={colSpan} className="sw-table-empty">
                {t("common.loading")}
              </Table.Cell>
            </Table.Row>
          ) : paged.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={colSpan} className="sw-table-empty">
                {emptyContent ?? t("table.noData")}
              </Table.Cell>
            </Table.Row>
          ) : (
            paged.map((row) => (
              <Table.Row
                key={rowKey(row)}
                cursor={onRowClick ? "pointer" : "default"}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <Table.Cell key={col.key} data-label={col.label} textAlign={col.align ?? "left"}>
                    {col.render(row)}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))
          )}
        </Table.Body>
        {footerLabel && sorted.length > 0 && (
          <Table.Footer>
            <Table.Row>
              <Table.Cell colSpan={colSpan}>{footerLabel(sorted.length)}</Table.Cell>
            </Table.Row>
          </Table.Footer>
        )}
      </Table.Root>

      {/* Pagination */}
      {sorted.length > pageSize && (
        <Box className="sw-pagination">
          <Text className="sw-pagination-info">
            {t("table.page", { current: currentPage, total: totalPages })}
          </Text>
          <HStack gap={1}>
            <button
              type="button"
              className="sw-pagination-btn"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage <= 1}
              aria-label={t("table.prev")}
            >
              <FiChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((p, i, arr) => (
                <Box key={p} as="span" display="inline-flex" gap={1}>
                  {i > 0 && arr[i - 1] !== p - 1 && (
                    <Text className="sw-pagination-info" px={1} alignSelf="center">…</Text>
                  )}
                  <button
                    type="button"
                    className={`sw-pagination-btn${p === currentPage ? " is-active" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                </Box>
              ))}
            <button
              type="button"
              className="sw-pagination-btn"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              aria-label={t("table.next")}
            >
              <FiChevronRight size={14} />
            </button>
          </HStack>
        </Box>
      )}
    </Box>
  );
}
