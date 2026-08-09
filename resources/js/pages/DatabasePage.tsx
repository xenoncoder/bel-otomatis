import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";
import { useT } from "@/lib/i18n";
import { 
  FiDatabase, FiTable, FiPlus, FiEdit2, FiTrash2, FiSave, FiAlertTriangle, 
  FiChevronUp, FiChevronDown, FiChevronLeft, FiChevronRight, FiDownload, FiCode, FiEye, FiPlay 
} from "react-icons/fi";
import { GlassCard, GlassButton, GlassInput, GlassBadge } from "@/components/ui/GlassComponents";
import { GlassModal } from "@/components/ui/GlassModal";

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
  const [loading, setLoading] = useState(true);
  const [loadingTable, setLoadingTable] = useState(false);
  const { toast } = useToast();

  const [insertOpen, setInsertOpen] = useState(false);
  const [insertData, setInsertData] = useState<Record<string, string>>({});
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<{ id: number } | null>(null);
  const [truncateOpen, setTruncateOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"data" | "schema" | "sql">("data");
  const [schemaData, setSchemaData] = useState<{ columns: any[]; indexes: any[] } | null>(null);
  const [hiddenColumns, setHiddenColumns] = useState<Record<string, boolean>>({});
  
  const [sqlQuery, setSqlQuery] = useState("");
  const [sqlResult, setSqlResult] = useState<{ columns: string[]; data: any[] } | null>(null);

  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

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
    setExportMenuOpen(false);
  };

  const handleSqlExecute = async () => {
    setSqlResult(null);
    try {
      const res = await api.database.query(sqlQuery) as any;
      if (res.success) {
        toast({ title: res.message, type: "success" });
        if (activeTable) loadTable(activeTable, searchQuery);
      } else {
        toast({ title: "Query executed successfully", type: "success" });
        setSqlResult({ columns: res.columns, data: res.data });
      }
    } catch (e: any) {
      toast({ title: "Query Error", description: e.message || "Query failed", type: "error" });
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
      toast({ title: t("db.dataAdded"), type: "success" });
      setInsertOpen(false);
      setInsertData({});
      await loadTable(activeTable);
      const res = await api.database.tables();
      setTables(res.data);
    } catch (e) { toast({ title: (e as Error).message, type: "error" }); }
  };

  const handleEdit = async () => {
    if (!activeTable || !editRow) return;
    try {
      const payload: Record<string, unknown> = { ...editData };
      if (activeTable === "schedules" && payload.days) {
        try { payload.days = JSON.parse(payload.days as string); } catch {}
      }
      await api.database.updateRow(activeTable, Number(editRow.id), payload);
      toast({ title: t("db.dataUpdated"), type: "success" });
      setEditRow(null);
      setEditData({});
      await loadTable(activeTable);
      const res = await api.database.tables();
      setTables(res.data);
    } catch (e) { toast({ title: (e as Error).message, type: "error" }); }
  };

  const handleDelete = async () => {
    if (!activeTable || !pendingDelete) return;
    try {
      await api.database.deleteRow(activeTable, pendingDelete.id);
      toast({ title: t("db.dataDeleted"), type: "success" });
      setPendingDelete(null);
      await loadTable(activeTable);
      const res = await api.database.tables();
      setTables(res.data);
    } catch (e) { toast({ title: (e as Error).message, type: "error" }); }
  };

  const handleTruncate = async () => {
    if (!activeTable) return;
    try {
      await api.database.truncate(activeTable);
      toast({ title: t("db.tableTruncated", { name: tableLabels[activeTable] ?? activeTable }), type: "success" });
      setTruncateOpen(false);
      await loadTable(activeTable);
      const res = await api.database.tables();
      setTables(res.data);
    } catch (e) { toast({ title: (e as Error).message, type: "error" }); }
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
    <div className="relative max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-purple-500/20 shrink-0">
          <FiDatabase size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-black text-gray-800 dark:text-gray-100">
            {t("db.title")}
          </h1>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Table list sidebar */}
        <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">
          <p className="text-sm font-heading font-bold text-gray-500 ml-1 uppercase tracking-wider">{t("db.tables")}</p>
          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
            {loading ? (
              <div className="flex justify-center p-4"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
              tables.map(tbl => (
                <button
                  key={tbl.name}
                  onClick={() => loadTable(tbl.name)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all whitespace-nowrap md:whitespace-normal flex-shrink-0 border ${
                    activeTable === tbl.name 
                    ? "bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/20" 
                    : "bg-white/50 dark:bg-black/20 text-gray-600 dark:text-gray-400 border-white/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FiTable className={activeTable === tbl.name ? "text-indigo-200" : "text-gray-400"} />
                    <span className="font-heading font-bold text-sm">{tableLabels[tbl.name] ?? tbl.name}</span>
                  </div>
                  <GlassBadge color={activeTable === tbl.name ? "white" : "gray"} className="!py-0 !px-1.5">{tbl.count}</GlassBadge>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Data area */}
        <div className="flex-1 w-full min-w-0">
          {!activeTable ? (
            <GlassCard className="flex flex-col items-center justify-center gap-3 py-20 text-gray-500">
              <FiDatabase size={48} className="opacity-30" />
              <p className="font-bold">{t("db.selectTable")}</p>
            </GlassCard>
          ) : loadingTable ? (
            <GlassCard className="flex justify-center py-20">
              <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
            </GlassCard>
          ) : (
            <GlassCard className="!p-0 overflow-hidden flex flex-col">
              <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="font-heading font-bold text-lg text-emerald-800 dark:text-emerald-300">
                  {tableLabels[activeTable] ?? activeTable}
                </h2>
                <div className="flex bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-lg p-1 overflow-x-auto scrollbar-hide">
                  <button onClick={() => setViewMode("data")} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors whitespace-nowrap ${viewMode === "data" ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/10"}`}>{t("db.tabData")}</button>
                  <button onClick={() => setViewMode("schema")} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors whitespace-nowrap ${viewMode === "schema" ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/10"}`}>{t("db.tabSchema")}</button>
                  <button onClick={() => setViewMode("sql")} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors whitespace-nowrap ${viewMode === "sql" ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/10"}`}>{t("db.tabSql")}</button>
                </div>
              </div>

              <div className="bg-black/5 dark:bg-white/5 flex-1">
                {viewMode === "data" && (
                  <div className="p-4 border-b border-white/10 flex flex-col lg:flex-row justify-between gap-4">
                    <div className="flex gap-2">
                      <GlassButton variant="success" onClick={openInsert} className="!px-3 !py-1.5"><FiPlus /> Tambah</GlassButton>
                      <GlassButton variant="danger" onClick={() => setTruncateOpen(true)} className="!px-3 !py-1.5"><FiTrash2 /> Kosongkan</GlassButton>
                    </div>
                    <div className="flex gap-3">
                      <GlassInput placeholder="Cari data..." value={searchQuery} onChange={(e: any) => setSearchQuery(e.target.value)} className="w-full sm:w-48 !py-1.5" />
                      
                      {/* Export Dropdown */}
                      <div className="relative">
                        <GlassButton variant="primary" onClick={() => { setExportMenuOpen(!exportMenuOpen); setColumnsMenuOpen(false); }} className="!px-3 !py-1.5 whitespace-nowrap">
                          <FiDownload /> Export
                        </GlassButton>
                        {exportMenuOpen && (
                          <div className="absolute right-0 top-full mt-2 w-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-xl shadow-xl z-50 p-2 flex flex-col gap-1">
                            <button onClick={() => handleExport("csv")} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"><FiDownload /> CSV</button>
                            <button onClick={() => handleExport("json")} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"><FiCode /> JSON</button>
                          </div>
                        )}
                      </div>

                      {/* Columns Dropdown */}
                      <div className="relative">
                        <GlassButton variant="primary" onClick={() => { setColumnsMenuOpen(!columnsMenuOpen); setExportMenuOpen(false); }} className="!px-3 !py-1.5 whitespace-nowrap">
                          <FiEye /> Kolom
                        </GlassButton>
                        {columnsMenuOpen && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-xl shadow-xl z-50 p-2 flex flex-col gap-1 max-h-60 overflow-y-auto">
                            {columns.map(c => (
                              <button key={c} onClick={() => setHiddenColumns(prev => ({...prev, [c]: !prev[c]}))} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                                <input type="checkbox" checked={!hiddenColumns[c]} readOnly className="w-4 h-4 rounded text-indigo-500" />
                                <span className="font-body">{c}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative">
                  {viewMode === "sql" ? (
                    <div className="p-6 flex flex-col gap-4">
                      <textarea
                        value={sqlQuery}
                        onChange={(e) => setSqlQuery(e.target.value)}
                        placeholder="SELECT * FROM schedules..."
                        className="w-full min-h-[150px] p-4 bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-xl font-body text-sm font-bold text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-500/50 resize-y"
                      />
                      <div className="flex justify-end">
                        <GlassButton variant="success" onClick={handleSqlExecute}><FiPlay /> Execute SQL</GlassButton>
                      </div>
                      
                      {sqlResult && (
                        <div className="mt-4 border border-white/20 dark:border-white/10 rounded-xl overflow-hidden bg-white/30 dark:bg-white/5">
                          <table className="w-full text-left">
                            <thead className="bg-black/5 dark:bg-white/5 border-b border-white/10">
                              <tr>
                                {sqlResult.columns.map(c => (
                                  <th key={c} className="py-2 px-4 font-bold text-xs text-gray-500 uppercase tracking-widest">{c}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sqlResult.data.map((r, i) => (
                                <tr key={i} className="border-b border-white/5 hover:bg-white/20 dark:hover:bg-white/5">
                                  {sqlResult.columns.map(c => (
                                    <td key={c} className="py-2 px-4 text-xs font-body font-bold text-gray-600 dark:text-gray-400">{String(r[c] ?? "NULL")}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : viewMode === "schema" ? (
                    <div className="p-6 flex flex-col gap-6">
                      <div>
                        <h3 className="font-heading font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider text-sm">Columns</h3>
                        <div className="border border-white/20 dark:border-white/10 rounded-xl overflow-hidden bg-white/30 dark:bg-white/5">
                          <table className="w-full text-left">
                            <thead className="bg-black/5 dark:bg-white/5 border-b border-white/10">
                              <tr>
                                <th className="py-2 px-4 font-bold text-xs text-gray-500 uppercase tracking-widest">{t("db.colName")}</th>
                                <th className="py-2 px-4 font-bold text-xs text-gray-500 uppercase tracking-widest">{t("db.colType")}</th>
                                <th className="py-2 px-4 font-bold text-xs text-gray-500 uppercase tracking-widest">{t("db.colNullable")}</th>
                                <th className="py-2 px-4 font-bold text-xs text-gray-500 uppercase tracking-widest">{t("db.colDefault")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {schemaData?.columns?.map((c: any) => (
                                <tr key={c.name} className="border-b border-white/5 hover:bg-white/20 dark:hover:bg-white/5">
                                  <td className="py-2 px-4 text-xs font-bold font-body text-gray-800 dark:text-gray-200">{c.name}</td>
                                  <td className="py-2 px-4 text-xs font-bold font-body text-gray-600 dark:text-gray-400">{c.type_name}</td>
                                  <td className="py-2 px-4 text-xs font-bold font-body text-gray-600 dark:text-gray-400">{c.nullable ? "Yes" : "No"}</td>
                                  <td className="py-2 px-4 text-xs font-bold font-body text-gray-600 dark:text-gray-400">{c.default ?? "NULL"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-heading font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider text-sm">Indexes</h3>
                        <div className="border border-white/20 dark:border-white/10 rounded-xl overflow-hidden bg-white/30 dark:bg-white/5">
                          <table className="w-full text-left">
                            <thead className="bg-black/5 dark:bg-white/5 border-b border-white/10">
                              <tr>
                                <th className="py-2 px-4 font-bold text-xs text-gray-500 uppercase tracking-widest">Name</th>
                                <th className="py-2 px-4 font-bold text-xs text-gray-500 uppercase tracking-widest">Columns</th>
                                <th className="py-2 px-4 font-bold text-xs text-gray-500 uppercase tracking-widest">Unique</th>
                                <th className="py-2 px-4 font-bold text-xs text-gray-500 uppercase tracking-widest">Primary</th>
                              </tr>
                            </thead>
                            <tbody>
                              {schemaData?.indexes?.map((idx: any) => (
                                <tr key={idx.name} className="border-b border-white/5 hover:bg-white/20 dark:hover:bg-white/5">
                                  <td className="py-2 px-4 text-xs font-bold font-body text-gray-800 dark:text-gray-200">{idx.name}</td>
                                  <td className="py-2 px-4 text-xs font-bold font-body text-gray-600 dark:text-gray-400">{idx.columns.join(", ")}</td>
                                  <td className="py-2 px-4 text-xs font-bold font-body text-gray-600 dark:text-gray-400">{idx.unique ? "Yes" : "No"}</td>
                                  <td className="py-2 px-4 text-xs font-bold font-body text-gray-600 dark:text-gray-400">{idx.primary ? "Yes" : "No"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <table className="w-full text-left min-w-[600px] border-collapse">
                      <thead className="sticky top-0 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-md shadow-sm z-10">
                        <tr>
                          {visibleColumns.map(col => (
                            <th 
                              key={col} 
                              onClick={() => handleSort(col)}
                              className="py-3 px-4 font-bold text-xs text-gray-500 uppercase tracking-widest cursor-pointer hover:text-indigo-500 transition-colors whitespace-nowrap"
                            >
                              <div className="flex items-center gap-1">
                                {col}
                                {sortCol === col ? (
                                  sortDir === "asc" ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />
                                ) : (
                                  <FiChevronUp size={12} className="opacity-20" />
                                )}
                              </div>
                            </th>
                          ))}
                          <th className="py-3 px-4 font-bold text-xs text-gray-500 uppercase tracking-widest text-center">{t("common.action")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedRows.length === 0 ? (
                          <tr>
                            <td colSpan={visibleColumns.length + 1} className="py-8 text-center text-sm font-bold text-gray-500">
                              {t("table.noData")}
                            </td>
                          </tr>
                        ) : (
                          pagedRows.map((row, i) => (
                            <tr key={i} className="border-b border-white/5 hover:bg-white/30 dark:hover:bg-white/5 transition-colors">
                              {visibleColumns.map((col) => (
                                <td key={col} className="py-2.5 px-4 text-xs font-bold font-body max-w-[200px] truncate">
                                  {row[col] === null ? (
                                    <span className="text-gray-400 opacity-50">NULL</span>
                                  ) : typeof row[col] === "object" ? (
                                    <span className="text-indigo-500">{JSON.stringify(row[col])}</span>
                                  ) : (
                                    <span className="text-gray-700 dark:text-gray-300">{String(row[col])}</span>
                                  )}
                                </td>
                              ))}
                              <td className="py-2 px-4">
                                <div className="flex justify-center gap-1">
                                  <button onClick={() => openEdit(row)} className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-indigo-500 hover:bg-white/50 transition-colors">
                                    <FiEdit2 size={12} />
                                  </button>
                                  <button onClick={() => setPendingDelete({ id: Number(row.id) })} className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-white/50 transition-colors">
                                    <FiTrash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>

                {viewMode === "data" && totalPages > 1 && (
                  <div className="flex justify-between items-center p-4 border-t border-white/10 bg-black/5 dark:bg-white/5">
                    <span className="text-sm font-bold text-gray-500">
                      Page {page} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                      <GlassButton variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="!px-3 !py-1">
                        <FiChevronLeft />
                      </GlassButton>
                      <GlassButton variant="ghost" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="!px-3 !py-1">
                        <FiChevronRight />
                      </GlassButton>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Insert Dialog */}
      <GlassModal isOpen={insertOpen} onClose={() => setInsertOpen(false)} title={t("db.insertTitle", { name: activeTable ? (tableLabels[activeTable] ?? activeTable) : "" })} footer={
        <>
          <GlassButton variant="ghost" onClick={() => setInsertOpen(false)}>{t("common.cancel")}</GlassButton>
          <GlassButton variant="success" onClick={handleInsert}><FiSave /> {t("db.add")}</GlassButton>
        </>
      }>
        <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2">
          {editableColumns.map((col) => (
            <div key={col}>
              <p className="text-xs font-bold text-gray-500 mb-1 ml-1 font-body">{col}</p>
              <GlassInput 
                value={insertData[col] ?? ""} 
                onChange={(e: any) => setInsertData((d) => ({ ...d, [col]: e.target.value }))}
                placeholder={col === "days" ? '["monday","wednesday"]' : ""}
              />
            </div>
          ))}
        </div>
      </GlassModal>

      {/* Edit Dialog */}
      <GlassModal isOpen={!!editRow} onClose={() => { setEditRow(null); setEditData({}); }} title={t("db.editRowTitle", { id: String(editRow?.id ?? "") })} footer={
        <>
          <GlassButton variant="ghost" onClick={() => { setEditRow(null); setEditData({}); }}>{t("common.cancel")}</GlassButton>
          <GlassButton variant="primary" onClick={handleEdit}><FiSave /> {t("common.save")}</GlassButton>
        </>
      }>
        <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2">
          {editableColumns.map((col) => (
            <div key={col}>
              <p className="text-xs font-bold text-gray-500 mb-1 ml-1 font-body">{col}</p>
              <GlassInput 
                value={editData[col] ?? ""} 
                onChange={(e: any) => setEditData((d) => ({ ...d, [col]: e.target.value }))}
                placeholder={col === "days" ? '["monday","wednesday"]' : ""}
              />
            </div>
          ))}
        </div>
      </GlassModal>

      {/* Delete confirmation */}
      <GlassModal isOpen={!!pendingDelete} onClose={() => setPendingDelete(null)} title={t("db.deleteRowTitle", { id: String(pendingDelete?.id ?? "") })} footer={
        <>
          <GlassButton variant="ghost" onClick={() => setPendingDelete(null)}>{t("common.cancel")}</GlassButton>
          <GlassButton variant="danger" onClick={handleDelete}><FiTrash2 /> {t("common.delete")}</GlassButton>
        </>
      }>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
            <FiAlertTriangle size={24} />
          </div>
          <p className="font-bold text-gray-800 dark:text-gray-200 mt-2">
            {t("db.deleteRowConfirm", { name: activeTable ? (tableLabels[activeTable] ?? activeTable) : "" })}
          </p>
        </div>
      </GlassModal>

      {/* Truncate confirmation */}
      <GlassModal isOpen={truncateOpen} onClose={() => setTruncateOpen(false)} title={t("db.truncateTitle")} footer={
        <>
          <GlassButton variant="ghost" onClick={() => setTruncateOpen(false)}>{t("common.cancel")}</GlassButton>
          <GlassButton variant="danger" onClick={handleTruncate}><FiTrash2 /> {t("db.truncate")}</GlassButton>
        </>
      }>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
            <FiAlertTriangle size={24} />
          </div>
          <p className="font-bold text-gray-800 dark:text-gray-200 mt-2">
            {t("db.truncateConfirm", { name: activeTable ? (tableLabels[activeTable] ?? activeTable) : "" })}
          </p>
        </div>
      </GlassModal>

    </div>
  );
}
