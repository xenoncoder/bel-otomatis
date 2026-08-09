import { useCallback, useEffect, useState, useMemo } from "react";
import { fileApi, type FileItem } from "@/lib/api";
import { useT, useLang } from "@/lib/i18n";
import { useToast } from "@/components/ui/ToastProvider";
import {
  FiFolder, FiFile, FiTrash2, FiEdit2, FiUploadCloud, FiFolderPlus, FiChevronRight, FiChevronLeft, FiMusic,
  FiAlertTriangle, FiGrid, FiList, FiLink, FiChevronUp, FiChevronDown
} from "react-icons/fi";
import { GlassCard, GlassButton, GlassInput, GlassBadge } from "@/components/ui/GlassComponents";
import { GlassModal } from "@/components/ui/GlassModal";

function formatSize(bytes: number) {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(dateStr: string, locale: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
}

const isAudio = (mime: string | null, name: string) =>
  mime?.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|aac)$/i.test(name);

type ViewMode = "grid" | "list";

export default function FileManagerPage() {
  const t = useT();
  const { lang } = useLang();
  const locale = lang === "id" ? "id-ID" : "en-GB";
  const [dir, setDir] = useState("");
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const [sortCol, setSortCol] = useState<"name" | "size" | "modified">("name");
  const [sortDesc, setSortDesc] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.is_dir && !b.is_dir) return -1;
      if (!a.is_dir && b.is_dir) return 1;
      
      let res = 0;
      if (sortCol === "name") res = a.name.localeCompare(b.name);
      else if (sortCol === "size") res = a.size - b.size;
      else if (sortCol === "modified") {
         const tA = new Date(a.modified || 0).getTime();
         const tB = new Date(b.modified || 0).getTime();
         res = tA - tB;
      }
      
      return sortDesc ? -res : res;
    });
  }, [items, sortCol, sortDesc]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / itemsPerPage));
  const pagedItems = sortedItems.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  useEffect(() => {
    setPage(1);
  }, [dir, sortCol, sortDesc, items.length]);

  const handleSort = (col: "name" | "size" | "modified") => {
    if (sortCol === col) setSortDesc(!sortDesc);
    else { setSortCol(col); setSortDesc(false); }
  };

  const SortIcon = ({ col }: { col: "name" | "size" | "modified" }) => {
    if (sortCol !== col) return null;
    return sortDesc ? <FiChevronDown className="inline" /> : <FiChevronUp className="inline" />;
  };

  const [folderOpen, setFolderOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null);
  const [folderName, setFolderName] = useState("");
  const [renameName, setRenameName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);

  const [urlOpen, setUrlOpen] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [urlName, setUrlName] = useState("");
  const [urlUploading, setUrlUploading] = useState(false);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const res = await fileApi.list(d || undefined);
      setItems(res.items);
      setDir(res.dir);
    } catch (e) {
      toast({ title: (e as Error).message, type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(""); }, [load]);

  const breadcrumbs = dir ? dir.split("/").filter(Boolean) : [];

  const goTo = (index: number) => load(breadcrumbs.slice(0, index + 1).join("/"));
  const openFolder = (item: FileItem) => load(item.relative);

  const processFiles = async (files: FileList | File[]) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        await fileApi.upload(f, dir || undefined);
      }
      toast({ title: t("files.uploaded", { count: files.length }), type: "success" });
      await load(dir);
    } catch (e) {
      toast({ title: (e as Error).message, type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) await processFiles(e.target.files);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) await processFiles(e.dataTransfer.files);
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    try {
      await fileApi.createFolder(folderName.trim(), dir || undefined);
      toast({ title: t("files.folderCreated"), type: "success" });
      setFolderName("");
      setFolderOpen(false);
      await load(dir);
    } catch (e) { toast({ title: (e as Error).message, type: "error" }); }
  };

  const handleRename = async () => {
    if (!renameTarget || !renameName.trim()) return;
    try {
      await fileApi.rename(renameTarget.path, renameName.trim());
      toast({ title: t("files.renamed"), type: "success" });
      setRenameTarget(null);
      setRenameName("");
      await load(dir);
    } catch (e) { toast({ title: (e as Error).message, type: "error" }); }
  };

  const handleUploadUrl = async () => {
    if (!urlValue.trim()) return;
    setUrlUploading(true);
    try {
      await fileApi.uploadFromUrl(urlValue.trim(), dir || undefined, urlName.trim() || undefined);
      toast({ title: t("files.urlDownloaded"), type: "success" });
      setUrlValue(""); setUrlName(""); setUrlOpen(false);
      await load(dir);
    } catch (e) { toast({ title: (e as Error).message, type: "error" });
    } finally { setUrlUploading(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fileApi.delete(deleteTarget.path);
      toast({ title: t("files.deleted"), type: "success" });
      setDeleteTarget(null);
      await load(dir);
    } catch (e) { toast({ title: (e as Error).message, type: "error" }); }
  };

  const startRename = (item: FileItem) => {
    setRenameTarget(item);
    setRenameName(item.name);
  };

  const iconFor = (item: FileItem) => {
    if (item.is_dir) return <FiFolder size={20} className="fill-current text-white/50" />;
    if (isAudio(item.mime, item.name)) return <FiMusic size={20} className="fill-current text-white/50" />;
    return <FiFile size={20} className="text-white" />;
  };

  return (
    <div className="relative max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-purple-500/20">
            <FiFolder size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-gray-800 dark:text-gray-100">
              {t("files.title")}
            </h1>
          </div>
        </div>
      </div>

      <GlassCard 
        className="!p-0 overflow-hidden flex flex-col min-h-[500px]"
      >
        <div 
          className="relative flex-1 flex flex-col"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm border-4 border-dashed border-emerald-500 rounded-xl flex items-center justify-center">
              <div className="text-white text-center flex flex-col items-center">
                <FiUploadCloud size={64} className="text-emerald-500 mb-4" />
                <h3 className="font-heading font-black text-2xl">Lepaskan file di sini</h3>
                <p className="font-body font-bold text-gray-300">File akan otomatis diunggah</p>
              </div>
            </div>
          )}

          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-4 flex justify-between items-center">
            <h2 className="font-heading font-bold text-lg text-emerald-800 dark:text-emerald-300">
              {t("files.manage")}
            </h2>
            <span className="text-xs font-bold font-body text-gray-500 uppercase tracking-wider">
              {items.length} {t("common.item")}
            </span>
          </div>

          <div className="p-4 md:p-6 bg-black/5 dark:bg-white/5 flex-1 flex flex-col gap-6">
            
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                <button onClick={() => load("")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold text-indigo-600 hover:bg-indigo-500/10 transition-colors whitespace-nowrap">
                  <FiFolder className="fill-indigo-600/30" /> {t("common.rootFolder")}
                </button>
                {breadcrumbs.map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <FiChevronRight className="text-gray-400" />
                    <button onClick={() => goTo(i)} className="px-3 py-1.5 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 transition-colors whitespace-nowrap">
                      {b}
                    </button>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
                <select 
                  className="px-3 py-1.5 rounded-lg bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 text-sm font-bold text-gray-700 dark:text-gray-300 outline-none hover:border-indigo-500/50 cursor-pointer"
                  value={`${sortCol}-${sortDesc}`}
                  onChange={(e) => {
                    const [c, d] = e.target.value.split("-");
                    setSortCol(c as any);
                    setSortDesc(d === "true");
                  }}
                >
                  <option value="name-false">Name (A-Z)</option>
                  <option value="name-true">Name (Z-A)</option>
                  <option value="size-false">Size (Low-High)</option>
                  <option value="size-true">Size (High-Low)</option>
                  <option value="modified-false">Date (Old-New)</option>
                  <option value="modified-true">Date (New-Old)</option>
                </select>

                <div className="flex bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-lg p-0.5">
                  <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-indigo-500 text-white" : "text-gray-500 hover:text-indigo-500"}`}>
                    <FiGrid size={14} />
                  </button>
                  <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-indigo-500 text-white" : "text-gray-500 hover:text-indigo-500"}`}>
                    <FiList size={14} />
                  </button>
                </div>

                <GlassButton variant="primary" onClick={() => setFolderOpen(true)} className="!px-3 !py-1.5">
                  <FiFolderPlus /> {t("files.folderNew")}
                </GlassButton>
                
                <GlassButton variant="primary" onClick={() => setUrlOpen(true)} className="!px-3 !py-1.5">
                  <FiLink /> URL
                </GlassButton>
                
                <label className={`cursor-pointer px-3 py-1.5 rounded-lg text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/20 flex items-center gap-2 transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <FiUploadCloud /> {t("files.upload")}
                  <input type="file" multiple hidden onChange={handleUpload} accept="audio/*" />
                </label>
              </div>
            </div>

            {loading ? (
              <div className="flex-1 flex justify-center items-center py-20">
                <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
              </div>
            ) : items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-500 py-20">
                <FiFolder size={48} className="opacity-30" />
                <p className="font-bold">{t("files.folderEmpty")}</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {pagedItems.map(item => (
                  <div 
                    key={item.path}
                    onClick={() => item.is_dir && openFolder(item)}
                    className={`bg-white/40 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-2xl p-4 flex flex-col gap-3 transition-all hover:-translate-y-1 hover:shadow-lg ${item.is_dir ? "cursor-pointer hover:border-indigo-500/50" : ""}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${item.is_dir || isAudio(item.mime, item.name) ? "from-indigo-500 to-purple-600" : "from-rose-400 to-pink-500"} shadow-md`}>
                        {iconFor(item)}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); startRename(item); }} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-indigo-500 hover:bg-white/50 transition-colors">
                          <FiEdit2 size={14} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-white/50 transition-colors">
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="font-heading font-bold text-gray-800 dark:text-gray-100 truncate" title={item.name}>{item.name}</p>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider font-body mt-0.5">
                        {item.is_dir ? t("common.folder") : formatSize(item.size)}
                      </p>
                    </div>
                    {!item.is_dir && isAudio(item.mime, item.name) && item.url && (
                      <audio controls src={item.url} className="w-full h-8 mt-2" onClick={(e) => e.stopPropagation()} />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-3 px-4 font-bold text-sm text-gray-500 uppercase tracking-widest">{t("common.type")}</th>
                      <th className="py-3 px-4 font-bold text-sm text-gray-500 uppercase tracking-widest cursor-pointer hover:text-indigo-500" onClick={() => handleSort("name")}>
                        {t("common.name")} <SortIcon col="name" />
                      </th>
                      <th className="py-3 px-4 font-bold text-sm text-gray-500 uppercase tracking-widest cursor-pointer hover:text-indigo-500" onClick={() => handleSort("size")}>
                        {t("common.size")} <SortIcon col="size" />
                      </th>
                      <th className="py-3 px-4 font-bold text-sm text-gray-500 uppercase tracking-widest cursor-pointer hover:text-indigo-500" onClick={() => handleSort("modified")}>
                        {t("common.modified")} <SortIcon col="modified" />
                      </th>
                      <th className="py-3 px-4 font-bold text-sm text-gray-500 uppercase tracking-widest">{t("common.audio")}</th>
                      <th className="py-3 px-4 font-bold text-sm text-gray-500 uppercase tracking-widest text-center">{t("common.action")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedItems.map(item => (
                      <tr key={item.path} onClick={() => item.is_dir && openFolder(item)} className={`border-b border-white/5 hover:bg-white/20 dark:hover:bg-white/5 transition-colors ${item.is_dir ? "cursor-pointer" : ""}`}>
                        <td className="py-3 px-4">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${item.is_dir || isAudio(item.mime, item.name) ? "from-indigo-500 to-purple-600" : "from-rose-400 to-pink-500"}`}>
                            {iconFor(item)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-heading font-bold text-gray-800 dark:text-gray-100 truncate max-w-[200px]" title={item.name}>{item.name}</p>
                          {item.is_dir && <GlassBadge color="green" className="!px-1.5 !py-0 !text-[10px] mt-1">{t("common.folder")}</GlassBadge>}
                        </td>
                        <td className="py-3 px-4 font-body font-bold text-xs text-gray-500">
                          {item.is_dir ? "-" : formatSize(item.size)}
                        </td>
                        <td className="py-3 px-4 font-body font-bold text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(item.modified, locale)}
                        </td>
                        <td className="py-3 px-4">
                          {!item.is_dir && isAudio(item.mime, item.name) && item.url ? (
                            <audio controls src={item.url} className="w-[180px] h-8" onClick={(e) => e.stopPropagation()} />
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); startRename(item); }} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-indigo-500 hover:bg-white/50 transition-colors">
                              <FiEdit2 size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-white/50 transition-colors">
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
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
        </div>
      </GlassCard>

      {/* Dialog: Folder Baru */}
      <GlassModal isOpen={folderOpen} onClose={() => setFolderOpen(false)} title={t("files.folderNew")} footer={
        <>
          <GlassButton variant="ghost" onClick={() => setFolderOpen(false)}>{t("common.cancel")}</GlassButton>
          <GlassButton variant="success" onClick={handleCreateFolder}>{t("files.create")}</GlassButton>
        </>
      }>
        <GlassInput 
          placeholder={t("files.folderNamePlaceholder")} 
          value={folderName} 
          onChange={(e: any) => setFolderName(e.target.value)} 
          autoFocus 
        />
      </GlassModal>

      {/* Dialog: Upload dari URL */}
      <GlassModal isOpen={urlOpen} onClose={() => setUrlOpen(false)} title={t("files.urlDialogTitle")} footer={
        <>
          <GlassButton variant="ghost" onClick={() => setUrlOpen(false)}>{t("common.cancel")}</GlassButton>
          <GlassButton variant="primary" onClick={handleUploadUrl} disabled={urlUploading}>
            <FiUploadCloud /> {t("files.downloadSave")}
          </GlassButton>
        </>
      }>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">{t("files.urlLabel")}</p>
            <GlassInput placeholder={t("files.urlPlaceholder")} value={urlValue} onChange={(e: any) => setUrlValue(e.target.value)} autoFocus />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">{t("files.nameLabel")}</p>
            <GlassInput placeholder={t("files.namePlaceholder")} value={urlName} onChange={(e: any) => setUrlName(e.target.value)} />
          </div>
        </div>
      </GlassModal>

      {/* Dialog: Rename */}
      <GlassModal isOpen={!!renameTarget} onClose={() => setRenameTarget(null)} title={t("files.renameTitle")} footer={
        <>
          <GlassButton variant="ghost" onClick={() => setRenameTarget(null)}>{t("common.cancel")}</GlassButton>
          <GlassButton variant="success" onClick={handleRename}>{t("common.save")}</GlassButton>
        </>
      }>
        <GlassInput value={renameName} onChange={(e: any) => setRenameName(e.target.value)} autoFocus />
      </GlassModal>

      {/* Dialog: Delete confirmation */}
      <GlassModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={t("files.deleteTitle", { type: deleteTarget?.is_dir ? t("common.folder") : t("common.file") })} footer={
        <>
          <GlassButton variant="ghost" onClick={() => setDeleteTarget(null)}>{t("common.cancel")}</GlassButton>
          <GlassButton variant="danger" onClick={confirmDelete}><FiTrash2 /> {t("common.delete")}</GlassButton>
        </>
      }>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
            <FiAlertTriangle size={24} />
          </div>
          <p className="font-bold text-gray-800 dark:text-gray-200 mt-2">
            {t("files.deleteConfirm", { name: deleteTarget?.name ?? "" })}
            {deleteTarget?.is_dir && <> {t("files.deleteFolderWarning")}</>}
          </p>
        </div>
      </GlassModal>
    </div>
  );
}
