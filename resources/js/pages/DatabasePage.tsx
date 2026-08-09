import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { toaster } from "@/lib/toaster";
import {
  Box, Button, Dialog, Field, Flex, HStack, Heading, Input, Spinner, Table, Text, VStack, Badge, IconButton, Tabs, Textarea, MenuRoot, MenuTrigger, MenuContent, MenuItem } from "@chakra-ui/react";
import { FiDatabase, FiTable, FiPlus, FiEdit2, FiTrash2, FiSave, FiAlertTriangle, FiChevronUp, FiChevronDown, FiChevronLeft, FiChevronRight, FiSearch, FiDownload, FiCode, FiEye, FiPlay } from "react-icons/fi";
import CloseButton from "@/components/CloseButton";
import BackgroundOrnament from "@/components/BackgroundOrnament";
import { useT } from "@/lib/i18n";

interface TableInfo {
  name: string;
  columns: string[];
  count: number;
}

const GUARDED = ["id", "created_at", "updated_at"];

export default function DatabasePage() {
  const t = useT();
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingTable, setLoadingTable] = useState(false);

  // Insert dialog
  const [insertOpen, setInsertOpen] = useState(false);
  const [insertData, setInsertData] = useState<Record<string, string>>({});

  // Edit dialog
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});

  // Delete confirmation
  const [pendingDelete, setPendingDelete] = useState<{ id: number } | null>(null);

  // Truncate confirmation
  const [truncateOpen, setTruncateOpen] = useState(false);
  // New States
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"data" | "schema" | "sql">("data");
  const [schemaData, setSchemaData] = useState<{ columns: any[]; indexes: any[] } | null>(null);
  const [hiddenColumns, setHiddenColumns] = useState<Record<string, boolean>>({});
  
  // SQL Editor
  const [sqlOpen, setSqlOpen] = useState(false);
  const [sqlQuery, setSqlQuery] = useState("");
  const [sqlResult, setSqlResult] = useState<{ columns: string[]; data: any[] } | null>(null);
  const [sqlError, setSqlError] = useState("");


  const tableLabels: Record<string, string> = {
    schedules: t("db.tableSchedules"),
    bell_sounds: t("db.tableBellSounds"),
    settings: t("db.tableSettings"),
    bell_logs: t("db.tableBellLogs"),
  };

  const editableColumns = columns.filter((c) => !GUARDED.includes(c));
  const visibleColumns = columns.filter((c) => !hiddenColumns[c]);

  useEffect(() => {
    api.database.tables().then((res) => {
      setTables(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const loadTable = async (name: string, search = "") => {
    setLoadingTable(true);
    setActiveTable(name);
    try {
      const res = await api.database.show(name, search);
      setRows(res.data);
      setColumns(res.columns);
      setTotal(res.total);
      const sch = await api.database.schema(name);
      setSchemaData(sch as any);
    } catch {}
    finally { setLoadingTable(false); }
  };
  
  useEffect(() => {
    if (!activeTable) return;
    const t = setTimeout(() => {
      loadTable(activeTable, searchQuery);
    }, 500);
    return () => clearTimeout(t);
  }, [searchQuery]);
  
  const handleExport = (format: "csv" | "json") => {
    if (!activeTable) return;
    window.location.href = `/api/database/${activeTable}/export?format=${format}`;
  };

  const handleSqlExecute = async () => {
    setSqlError("");
    setSqlResult(null);
    try {
      const res = await api.database.query(sqlQuery) as any;
      if (res.success) {
        toaster.create({ title: res.message, type: "success" });
        if (activeTable) loadTable(activeTable, searchQuery);
      } else {
        toaster.create({ title: "Query executed successfully", type: "success" });
        setSqlResult({ columns: res.columns, data: res.data });
      }
    } catch (e: any) {
      setSqlError(e.message || "Query failed");
    }
  };


  const handleInsert = async () => {
    if (!activeTable) return;
    try {
      const payload: Record<string, unknown> = { ...insertData };
      if (activeTable === "schedules" && payload.days) {
        try { payload.days = JSON.parse(payload.days as string); } catch {}
      }
      await api.database.insert(activeTable, payload);
      toaster.create({ title: t("db.dataAdded"), type: "success" });
      setInsertOpen(false);
      setInsertData({});
      await loadTable(activeTable);
      const res = await api.database.tables();
      setTables(res.data);
    } catch (e) { toaster.create({ title: (e as Error).message, type: "error" }); }
  };

  const handleEdit = async () => {
    if (!activeTable || !editRow) return;
    try {
      const payload: Record<string, unknown> = { ...editData };
      if (activeTable === "schedules" && payload.days) {
        try { payload.days = JSON.parse(payload.days as string); } catch {}
      }
      await api.database.updateRow(activeTable, Number(editRow.id), payload);
      toaster.create({ title: t("db.dataUpdated"), type: "success" });
      setEditRow(null);
      setEditData({});
      await loadTable(activeTable);
      const res = await api.database.tables();
      setTables(res.data);
    } catch (e) { toaster.create({ title: (e as Error).message, type: "error" }); }
  };

  const handleDelete = async () => {
    if (!activeTable || !pendingDelete) return;
    try {
      await api.database.deleteRow(activeTable, pendingDelete.id);
      toaster.create({ title: t("db.dataDeleted"), type: "success" });
      setPendingDelete(null);
      await loadTable(activeTable);
      const res = await api.database.tables();
      setTables(res.data);
    } catch (e) { toaster.create({ title: (e as Error).message, type: "error" }); }
  };

  const handleTruncate = async () => {
    if (!activeTable) return;
    try {
      await api.database.truncate(activeTable);
      toaster.create({ title: t("db.tableTruncated", { name: tableLabels[activeTable] ?? activeTable }), type: "success" });
      setTruncateOpen(false);
      await loadTable(activeTable);
      const res = await api.database.tables();
      setTables(res.data);
    } catch (e) { toaster.create({ title: (e as Error).message, type: "error" }); }
  };

  const openEdit = (row: Record<string, unknown>) => {
    setEditRow(row);
    const data: Record<string, string> = {};
    for (const col of editableColumns) {
      const val = row[col];
      if (val === null || val === undefined) {
        data[col] = "";
      } else if (typeof val === "object") {
        data[col] = JSON.stringify(val);
      } else {
        data[col] = String(val);
      }
    }
    setEditData(data);
  };

  const openInsert = () => {
    const data: Record<string, string> = {};
    for (const col of editableColumns) {
      data[col] = "";
    }
    setInsertData(data);
    setInsertOpen(true);
  };

  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const sortedRows = useMemo(() => {
    if (!sortCol) return rows;
    const arr = [...rows];
    arr.sort((a, b) => {
      const va = a[sortCol];
      const vb = b[sortCol];
      const sa = va === null || va === undefined ? "" : String(va);
      const sb = vb === null || vb === undefined ? "" : String(vb);
      if (sa < sb) return sortDir === "asc" ? -1 : 1;
      if (sa > sb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [rows, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pagedRows = sortedRows.slice(start, start + pageSize);

  return (
    <Box position="relative">
      
      <VStack gap={6} align="stretch" position="relative" zIndex={1}>
      <Heading size={{ base: "xl", md: "2xl" }} fontFamily="'Comfortaa', sans-serif" fontWeight="300" color="var(--sw-fg-heading)">
        {t("db.title")}
      </Heading>

      <HStack gap={6} align="start" wrap="wrap" flexDirection={{ base: "column", md: "row" }}>
        {/* Table list sidebar */}
        <Box w={{ base: "100%", md: "220px" }} flexShrink={0}>
          <Text fontSize="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="700" mb={3} color="var(--sw-fg-muted)">
            {t("db.tables")}
          </Text>
          <Flex gap={2} align="stretch" direction={{ base: "row", md: "column" }} overflowX={{ base: "auto", md: "visible" }} css={{ "&::-webkit-scrollbar": { display: "none" }, scrollbarWidth: "none" }}>
            {loading ? (
              <Spinner size="sm" color="var(--sw-purple-normal)" />
            ) : (
              tables.map((tbl) => (
                <Box
                  key={tbl.name}
                  as="button"
                  onClick={() => loadTable(tbl.name)}
                  p={3}
                  borderRadius="var(--sw-radius)"
                  border="1px solid var(--sw-border-color)"
                  bg={activeTable === tbl.name ? "var(--sw-purple-normal)" : "var(--sw-bg-card)"}
                  color={activeTable === tbl.name ? "#ffffff" : "var(--sw-fg)"}
                  cursor="pointer"
                  transition="all 0.15s"
                  textAlign="left"
                  flexShrink={0}
                  whiteSpace="nowrap"
                  boxShadow={activeTable === tbl.name ? "0.15rem 0.15rem 0 var(--sw-shadow-color)" : "none"}
                  _hover={{ bg: activeTable === tbl.name ? "var(--sw-purple-dark)" : "var(--sw-bg-hover)" }}
                  w={{ base: "auto", md: "full" }}
                >
                  <HStack gap={2} justify="space-between">
                    <HStack gap={2}>
                      <FiTable size={14} />
                      <Text fontSize="sm" fontWeight="600" fontFamily="'Comfortaa', sans-serif">
                        {tableLabels[tbl.name] ?? tbl.name}
                      </Text>
                    </HStack>
                    <Badge
                      colorPalette={activeTable === tbl.name ? "whiteAlpha" : "gray"}
                      variant="solid"
                      fontSize="2xs"
                      borderRadius="var(--sw-radius)"
                    >
                      {tbl.count}
                    </Badge>
                  </HStack>
                </Box>
              ))
            )}
          </Flex>
        </Box>

        {/* Data table */}
        <Box flex={1} minW="0">
          {!activeTable ? (
            <Box className="sw-card" borderRadius="var(--sw-radius)" w="full">
              <Box className="sw-card-body" p={8}>
                <VStack gap={2} color="var(--sw-fg-subtle)">
                  <FiDatabase size={32} style={{ opacity: 0.4 }} />
                  <Text fontSize="sm">{t("db.selectTable")}</Text>
                </VStack>
              </Box>
            </Box>
          ) : loadingTable ? (
            <Flex justify="center" py={12}><Spinner size="xl" color="var(--sw-purple-normal)" /></Flex>
          ) : (
            <Box className="sw-card" borderRadius="var(--sw-radius)" w="full">
              <Box className="sw-card-header sw-card-header-green">
                <VStack gap={4} align="stretch">
                  <HStack justify="space-between" wrap="wrap" gap={4}>
                    <Heading size="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="800">
                      {tableLabels[activeTable] ?? activeTable}
                    </Heading>
                    
                    <Tabs.Root value={viewMode} onValueChange={(e) => setViewMode(e.value as "data" | "schema" | "sql")} variant="subtle" size="sm">
                      <Tabs.List>
                        <Tabs.Trigger value="data">{t("db.tabData")}</Tabs.Trigger>
                        <Tabs.Trigger value="schema">{t("db.tabSchema")}</Tabs.Trigger>
                        <Tabs.Trigger value="sql">{t("db.tabSql")}</Tabs.Trigger>
                      </Tabs.List>
                    </Tabs.Root>
                  </HStack>
                </VStack>
              </Box>
              <Box className="sw-card-body" p={0}>
                {viewMode === "data" && (
                  <HStack gap={3} p={3} borderBottom="1px solid var(--sw-border-color)" bg="var(--sw-bg-muted)" justify="space-between" wrap="wrap">
                    <HStack gap={2} wrap="wrap">
                      <Button bg="var(--sw-green-normal)" color="#ffffff" border="1px solid var(--sw-border-color)" size="xs" onClick={openInsert} _hover={{ bg: "var(--sw-green-dark)" }}><Box as={FiPlus} /> Tambah Data</Button>
                      <Button bg="var(--sw-pink-normal)" color="#ffffff" border="1px solid var(--sw-border-color)" size="xs" onClick={() => setTruncateOpen(true)} _hover={{ bg: "var(--sw-pink-dark)" }}><Box as={FiTrash2} /> Kosongkan Tabel</Button>
                    </HStack>
                    <HStack gap={3} wrap="wrap">
                      <Box w={{ base: "100%", sm: "200px" }}>
                        <Input
                          placeholder="Cari data..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          bg="var(--sw-bg-panel)"
                          border="1px solid var(--sw-border-color)"
                          borderRadius="var(--sw-radius)"
                          size="xs"
                        />
                      </Box>
                      <Box position="relative">
                        <MenuRoot>
                            <MenuTrigger asChild>
                              <Button size="xs" bg="var(--sw-purple-normal)" color="#ffffff" border="1px solid var(--sw-border-color)" _hover={{ bg: "var(--sw-purple-dark)" }}>
                                <Box as={FiDownload} /> {t("db.export")}
                              </Button>
                            </MenuTrigger>
                          <MenuContent 
                            position="absolute"
                            top="calc(100% + 4px)"
                            right="0"
                            zIndex="popover" 
                            bg="var(--sw-bg-card)" 
                            border="2px solid var(--sw-border-color)" 
                            boxShadow="4px 4px 0 var(--sw-shadow-color)" 
                            borderRadius="var(--sw-radius)" 
                            p={2}
                          >
                          <MenuItem 
                            value="csv" 
                            onClick={() => handleExport("csv")}
                            cursor="pointer"
                            _hover={{ bg: "var(--sw-bg-muted)" }}
                            borderRadius="md"
                            fontFamily="'IBM Plex Mono', monospace"
                            fontSize="sm"
                          >
                            <HStack gap={2}><FiDownload /> <Text>{t("db.exportCsv")}</Text></HStack>
                          </MenuItem>
                          <MenuItem 
                            value="json" 
                            onClick={() => handleExport("json")}
                            cursor="pointer"
                            _hover={{ bg: "var(--sw-bg-muted)" }}
                            borderRadius="md"
                            fontFamily="'IBM Plex Mono', monospace"
                            fontSize="sm"
                          >
                            <HStack gap={2}><FiCode /> <Text>{t("db.exportJson")}</Text></HStack>
                          </MenuItem>
                          </MenuContent>
                        </MenuRoot>
                      </Box>
                      <Box position="relative">
                        <MenuRoot closeOnSelect={false} positioning={{ placement: "bottom-end" }}>
                            <MenuTrigger asChild>
                              <Button size="xs" bg="var(--sw-cyan-normal)" color="#ffffff" border="1px solid var(--sw-border-color)" _hover={{ bg: "var(--sw-cyan-dark)" }}>
                                <Box as={FiEye} /> {t("db.columns")}
                              </Button>
                            </MenuTrigger>
                          <MenuContent 
                            position="absolute"
                            top="calc(100% + 4px)"
                            right="0"
                            maxH="300px" 
                            overflowY="auto" 
                            zIndex="popover" 
                            p={2}
                            bg="var(--sw-bg-card)" 
                            border="2px solid var(--sw-border-color)" 
                            boxShadow="4px 4px 0 var(--sw-shadow-color)" 
                            borderRadius="var(--sw-radius)"
                          >
                          {columns.map(c => (
                            <MenuItem 
                              key={c} 
                              value={c} 
                              onClick={(e) => { e.preventDefault(); setHiddenColumns(prev => ({...prev, [c]: !prev[c]})); }}
                              cursor="pointer"
                              _hover={{ bg: "var(--sw-bg-muted)" }}
                              borderRadius="md"
                            >
                              <HStack gap={3}>
                                <input type="checkbox" checked={!hiddenColumns[c]} readOnly style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--sw-purple-normal)' }} /> 
                                <Text fontSize="sm" fontFamily="'IBM Plex Mono', monospace">{c}</Text>
                              </HStack>
                            </MenuItem>
                          ))}
                          </MenuContent>
                        </MenuRoot>
                      </Box>
                    </HStack>
                  </HStack>
                )}

                <Box className="sw-table-container" overflow="auto" maxH="550px" maxW="100%">
                  {viewMode === 'sql' ? (
                    <Box p={6}>
                      <VStack gap={4} align="stretch">
                        <Textarea 
                          value={sqlQuery}
                          onChange={(e) => setSqlQuery(e.target.value)}
                          placeholder="SELECT * FROM schedules..." w="full" maxW="100%"
                          fontFamily="'IBM Plex Mono', monospace"
                          minH="150px"
                          bg="var(--sw-bg-panel)"
                          border="2px solid var(--sw-border-color)"
                          borderRadius="var(--sw-radius)"
                        />
                        <HStack justify="flex-end">
                          <Button className="sw-btn sw-btn-success" variant="ghost" onClick={handleSqlExecute}>
                            <Box as={FiPlay} /> {t("db.execute")}
                          </Button>
                        </HStack>
                        
                        {sqlError && (
                          <Box p={3} color="var(--sw-red-normal)" border="1px solid var(--sw-red-normal)" borderRadius="md" bg="transparent" fontFamily="'IBM Plex Mono', monospace" fontSize="sm">
                            {sqlError}
                          </Box>
                        )}

                        {sqlResult && (
                          <Box overflowX="auto" border="1px solid var(--sw-border-color)" borderRadius="md">
                            <Table.Root size="sm" variant="outline">
                              <Table.Header bg="var(--sw-bg-muted)">
                                <Table.Row>
                                  {sqlResult.columns.map(c => <Table.ColumnHeader key={c}>{c}</Table.ColumnHeader>)}
                                </Table.Row>
                              </Table.Header>
                              <Table.Body>
                                {sqlResult.data.map((r, i) => (
                                  <Table.Row key={i}>
                                    {sqlResult.columns.map(c => (
                                      <Table.Cell key={c}>{String(r[c] ?? "NULL")}</Table.Cell>
                                    ))}
                                  </Table.Row>
                                ))}
                              </Table.Body>
                            </Table.Root>
                          </Box>
                        )}
                      </VStack>
                    </Box>
                  ) : viewMode === 'schema' ? (
                    <Box p={4}>
                      <Heading size="xs" mb={2} color="var(--sw-fg)">Columns</Heading>
                      <Box overflowX="auto" border="1px solid var(--sw-border-color)" borderRadius="var(--sw-radius)" mb={6}>
                        <Table.Root size="sm" variant="outline">
                          <Table.Header bg="var(--sw-bg-muted)">
                            <Table.Row>
                              <Table.ColumnHeader>{t("db.colName")}</Table.ColumnHeader>
                              <Table.ColumnHeader>{t("db.colType")}</Table.ColumnHeader>
                              <Table.ColumnHeader>{t("db.colNullable")}</Table.ColumnHeader>
                              <Table.ColumnHeader>{t("db.colDefault")}</Table.ColumnHeader>
                            </Table.Row>
                          </Table.Header>
                          <Table.Body>
                            {schemaData?.columns?.map((c: any) => (
                              <Table.Row key={c.name}>
                                <Table.Cell fontWeight="700">{c.name}</Table.Cell>
                                <Table.Cell>{c.type_name}</Table.Cell>
                                <Table.Cell>{c.nullable ? "Yes" : "No"}</Table.Cell>
                                <Table.Cell>{c.default ?? "NULL"}</Table.Cell>
                              </Table.Row>
                            ))}
                          </Table.Body>
                        </Table.Root>
                      </Box>

                      <Heading size="xs" mb={2} color="var(--sw-fg)">Indexes</Heading>
                      <Box overflowX="auto" border="1px solid var(--sw-border-color)" borderRadius="var(--sw-radius)">
                        <Table.Root size="sm" variant="outline">
                          <Table.Header bg="var(--sw-bg-muted)">
                            <Table.Row>
                              <Table.ColumnHeader>{t("db.colName")}</Table.ColumnHeader>
                              <Table.ColumnHeader>Columns</Table.ColumnHeader>
                              <Table.ColumnHeader>{t("db.colUnique")}</Table.ColumnHeader>
                              <Table.ColumnHeader>{t("db.colPrimary")}</Table.ColumnHeader>
                            </Table.Row>
                          </Table.Header>
                          <Table.Body>
                            {schemaData?.indexes?.map((idx: any) => (
                              <Table.Row key={idx.name}>
                                <Table.Cell fontWeight="700">{idx.name}</Table.Cell>
                                <Table.Cell>{idx.columns.join(", ")}</Table.Cell>
                                <Table.Cell>{idx.unique ? "Yes" : "No"}</Table.Cell>
                                <Table.Cell>{idx.primary ? "Yes" : "No"}</Table.Cell>
                              </Table.Row>
                            ))}
                          </Table.Body>
                        </Table.Root>
                      </Box>
                    </Box>
                  ) : (
                    <Table.Root size="sm" variant="outline" className="sw-table-zebra sw-table-mobile" minWidth="600px">
                      <Table.Header position="sticky" top={0} zIndex={2} bg="var(--sw-bg-muted)">
                        <Table.Row>
                          {visibleColumns.map((col) => (
                            <Table.ColumnHeader
                              key={col}
                              className="sw-th-sortable"
                              data-sorted={sortCol === col}
                              onClick={() => handleSort(col)}
                              whiteSpace="nowrap"
                            >
                              {col}
                              <span className="sw-sort-icon">
                                {sortCol === col ? (
                                  sortDir === "asc" ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />
                                ) : (
                                  <FiChevronUp size={12} style={{ opacity: 0.3 }} />
                                )}
                              </span>
                            </Table.ColumnHeader>
                          ))}
                          <Table.ColumnHeader textAlign="center" whiteSpace="nowrap">{t("common.action")}</Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {pagedRows.length === 0 ? (
                          <Table.Row>
                            <Table.Cell colSpan={columns.length + 1} className="sw-table-empty">
                              {t("table.noData")}
                            </Table.Cell>
                          </Table.Row>
                        ) : (
                          pagedRows.map((row, i) => (
                            <Table.Row key={i}>
                              {visibleColumns.map((col) => (
                                <Table.Cell key={col} data-label={col} fontSize="2xs" fontFamily="'IBM Plex Mono', monospace" maxW="250px" overflow="hidden" textOverflow="ellipsis" wordBreak="break-word">
                                  {row[col] === null ? (
                                    <Text color="var(--sw-fg-subtle)">NULL</Text>
                                  ) : typeof row[col] === "object" ? (
                                    <Text color="var(--sw-purple-normal)">{JSON.stringify(row[col])}</Text>
                                  ) : (
                                    String(row[col])
                                  )}
                                </Table.Cell>
                              ))}
                              <Table.Cell data-label="" className="sw-table-actions">
                              <HStack gap={1} justify="center">
                                <IconButton aria-label={t("common.edit")} size="xs" variant="ghost" colorPalette="blue" onClick={() => openEdit(row)}>
                                  <FiEdit2 />
                                </IconButton>
                                <IconButton aria-label={t("common.delete")} size="xs" variant="ghost" colorPalette="red" onClick={() => setPendingDelete({ id: Number(row.id) })}>
                                  <FiTrash2 />
                                </IconButton>
                              </HStack>
                            </Table.Cell>
                          </Table.Row>
                        ))
                      )}
                    </Table.Body>
                      {rows.length > 0 && (
                        <Table.Footer>
                          <Table.Row>
                            <Table.Cell colSpan={columns.length + 1}>{t("table.totalRows", { count: rows.length })}</Table.Cell>
                          </Table.Row>
                        </Table.Footer>
                      )}
                    </Table.Root>
                  )}
                </Box>

                {sortedRows.length > pageSize && (
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
            </Box>
          )}
        </Box>
      </HStack>

      {/* Insert Dialog */}
      <Dialog.Root open={insertOpen} onOpenChange={(e) => setInsertOpen(e.open)} placement="center">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            maxW={{ base: "calc(100vw - 2rem)", sm: "500px" }}
            maxH="calc(100vh - 4rem)"
            display="flex"
            flexDir="column"
          >
            <Box className="sw-dialog-strip sw-dialog-strip-green" flexShrink={0} />
            <Dialog.Header flexShrink={0}>
              <HStack gap={2}>
                <FiPlus size={16} color="var(--sw-green-dark)" />
                <Dialog.Title>
                  {t("db.insertTitle", { name: activeTable ? (tableLabels[activeTable] ?? activeTable) : "" })}
                </Dialog.Title>
              </HStack>
              <Dialog.CloseTrigger asChild>
                <CloseButton />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body overflowY="auto" flex={1}>
              <VStack gap={3} align="stretch">
                {editableColumns.map((col) => (
                  <Field.Root key={col}>
                    <Field.Label fontSize="sm" fontFamily="'IBM Plex Mono', monospace" fontWeight="600">{col}</Field.Label>
                    <Input
                      border="1px solid var(--sw-border-color)"
                      borderRadius="var(--sw-radius)"
                      bg="var(--sw-bg-panel)"
                      h="36px"
                      fontSize="sm"
                      fontFamily="'IBM Plex Mono', monospace"
                      value={insertData[col] ?? ""}
                      onChange={(e) => setInsertData((d) => ({ ...d, [col]: e.target.value }))}
                      placeholder={col === "days" ? '["monday","wednesday"]' : ""}
                    />
                  </Field.Root>
                ))}
              </VStack>
            </Dialog.Body>
            <Dialog.Footer flexShrink={0}>
              <Button className="sw-btn sw-btn-success" variant="ghost" size="sm" onClick={handleInsert}>
                <Box as={FiSave} /> {t("db.add")}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Edit Dialog */}
      <Dialog.Root open={!!editRow} onOpenChange={(e) => { if (!e.open) { setEditRow(null); setEditData({}); } }} placement="center">
        <Dialog.Backdrop bg="blackAlpha.700" />
        <Dialog.Positioner>
          <Dialog.Content
            maxW={{ base: "calc(100vw - 2rem)", sm: "500px" }}
            maxH="calc(100vh - 4rem)"
            display="flex"
            flexDir="column"
          >
            <Box className="sw-dialog-strip sw-dialog-strip-blue" flexShrink={0} />
            <Dialog.Header flexShrink={0}>
              <HStack gap={2}>
                <FiEdit2 size={16} color="var(--sw-blue-normal)" />
                <Dialog.Title>
                  {t("db.editRowTitle", { id: String(editRow?.id ?? "") })}
                </Dialog.Title>
              </HStack>
              <Dialog.CloseTrigger asChild>
                <CloseButton />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body overflowY="auto" flex={1}>
              <VStack gap={3} align="stretch">
                {editableColumns.map((col) => (
                  <Field.Root key={col}>
                    <Field.Label fontSize="sm" fontFamily="'IBM Plex Mono', monospace" fontWeight="600">{col}</Field.Label>
                    <Input
                      border="1px solid var(--sw-border-color)"
                      borderRadius="var(--sw-radius)"
                      bg="var(--sw-bg-panel)"
                      h="36px"
                      fontSize="sm"
                      fontFamily="'IBM Plex Mono', monospace"
                      value={editData[col] ?? ""}
                      onChange={(e) => setEditData((d) => ({ ...d, [col]: e.target.value }))}
                      placeholder={col === "days" ? '["monday","wednesday"]' : ""}
                    />
                  </Field.Root>
                ))}
              </VStack>
            </Dialog.Body>
            <Dialog.Footer flexShrink={0}>
              <Button className="sw-btn sw-btn-primary" variant="ghost" size="sm" onClick={handleEdit}>
                <Box as={FiSave} /> {t("common.save")}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Delete confirmation */}
      <Dialog.Root open={!!pendingDelete} onOpenChange={(e) => !e.open && setPendingDelete(null)} placement="center">
        <Dialog.Backdrop bg="blackAlpha.700" />
        <Dialog.Positioner>
          <Dialog.Content maxW={{ base: "calc(100vw - 2rem)", sm: "400px" }}>
            <Box className="sw-dialog-strip sw-dialog-strip-pink" />
            <Dialog.Header>
              <Dialog.Title>{t("db.deleteRowTitle", { id: pendingDelete?.id ?? "" })}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <HStack gap={3} align="start">
                <Box
                  w={10} h={10}
                  borderRadius="var(--sw-radius)"
                  bg="var(--sw-pink-light)"
                  border="1px solid var(--sw-pink-dark)"
                  display="flex" alignItems="center" justifyContent="center"
                  flexShrink={0}
                >
                  <FiAlertTriangle size={18} color="#ba797f" />
                </Box>
                <Text fontSize="sm" color="var(--sw-fg-muted)">
                  {t("db.deleteRowConfirm", { name: activeTable ? (tableLabels[activeTable] ?? activeTable) : "" })}
                </Text>
              </HStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button className="sw-btn" variant="ghost" size="sm" onClick={() => setPendingDelete(null)}>{t("common.cancel")}</Button>
              <Button className="sw-btn sw-btn-danger" variant="ghost" size="sm" onClick={handleDelete}>
                <Box as={FiTrash2} /> {t("common.delete")}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Truncate confirmation */}
      <Dialog.Root open={truncateOpen} onOpenChange={(e) => setTruncateOpen(e.open)} placement="center">
        <Dialog.Backdrop bg="blackAlpha.700" />
        <Dialog.Positioner>
          <Dialog.Content maxW={{ base: "calc(100vw - 2rem)", sm: "420px" }}>
            <Box className="sw-dialog-strip sw-dialog-strip-red" />
            <Dialog.Header>
              <Dialog.Title>{t("db.truncateTitle")}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <HStack gap={3} align="start">
                <Box
                  w={10} h={10}
                  borderRadius="var(--sw-radius)"
                  bg="var(--sw-pink-light)"
                  border="1px solid var(--sw-pink-dark)"
                  display="flex" alignItems="center" justifyContent="center"
                  flexShrink={0}
                >
                  <FiAlertTriangle size={18} color="#ba797f" />
                </Box>
                <Text fontSize="sm" color="var(--sw-fg-muted)">
                  {t("db.truncateConfirm", { count: total, name: activeTable ? (tableLabels[activeTable] ?? activeTable) : "" })}
                </Text>
              </HStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button className="sw-btn" variant="ghost" size="sm" onClick={() => setTruncateOpen(false)}>{t("common.cancel")}</Button>
              <Button className="sw-btn sw-btn-danger" variant="ghost" size="sm" onClick={handleTruncate}>
                <Box as={FiTrash2} /> {t("db.yesTruncate")}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </VStack>
    </Box>
  );
}
