import { useCallback, useEffect, useState, useMemo } from "react";
import { fileApi, type FileItem } from "@/lib/api";
import { useT, useLang } from "@/lib/i18n";
import { toaster } from "@/lib/toaster";
import {
  Box, Button, Dialog, Flex, HStack, Heading, IconButton, Input, SimpleGrid, Spinner, Text, VStack, Table, Badge,
} from "@chakra-ui/react";
import {
  FiFolder, FiFile, FiTrash2, FiEdit2, FiUploadCloud, FiFolderPlus, FiChevronRight, FiChevronLeft, FiMusic,
  FiAlertTriangle, FiGrid, FiList, FiLink, FiChevronUp, FiChevronDown, FiArrowUp, FiArrowDown,
} from "react-icons/fi";
import CloseButton from "@/components/CloseButton";
import BackgroundOrnament from "@/components/BackgroundOrnament";

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
    return sortDesc ? <FiChevronDown style={{display:"inline"}} /> : <FiChevronUp style={{display:"inline"}} />;
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
      toaster.create({ title: (e as Error).message, type: "error" });
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
      toaster.create({ title: t("files.uploaded", { count: files.length }), type: "success" });
      await load(dir);
    } catch (e) {
      toaster.create({ title: (e as Error).message, type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processFiles(e.target.files);
    }
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    try {
      await fileApi.createFolder(folderName.trim(), dir || undefined);
      toaster.create({ title: t("files.folderCreated"), type: "success" });
      setFolderName("");
      setFolderOpen(false);
      await load(dir);
    } catch (e) {
      toaster.create({ title: (e as Error).message, type: "error" });
    }
  };

  const handleRename = async () => {
    if (!renameTarget || !renameName.trim()) return;
    try {
      await fileApi.rename(renameTarget.path, renameName.trim());
      toaster.create({ title: t("files.renamed"), type: "success" });
      setRenameTarget(null);
      setRenameName("");
      await load(dir);
    } catch (e) {
      toaster.create({ title: (e as Error).message, type: "error" });
    }
  };

  const handleUploadUrl = async () => {
    if (!urlValue.trim()) return;
    setUrlUploading(true);
    try {
      await fileApi.uploadFromUrl(urlValue.trim(), dir || undefined, urlName.trim() || undefined);
      toaster.create({ title: t("files.urlDownloaded"), type: "success" });
      setUrlValue("");
      setUrlName("");
      setUrlOpen(false);
      await load(dir);
    } catch (e) {
      toaster.create({ title: (e as Error).message, type: "error" });
    } finally {
      setUrlUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fileApi.delete(deleteTarget.path);
      toaster.create({ title: t("files.deleted"), type: "success" });
      setDeleteTarget(null);
      await load(dir);
    } catch (e) {
      toaster.create({ title: (e as Error).message, type: "error" });
    }
  };

  const startRename = (item: FileItem) => {
    setRenameTarget(item);
    setRenameName(item.name);
  };

  const iconFor = (item: FileItem) => {
    if (item.is_dir) return <FiFolder size={18} color="#ffffff" fill="#ffffff" fillOpacity={0.3} />;
    if (isAudio(item.mime, item.name)) return <FiMusic size={18} color="#ffffff" fill="#ffffff" fillOpacity={0.3} />;
    return <FiFile size={18} color="#ffffff" />;
  };

  const bgFor = (item: FileItem) =>
    item.is_dir || isAudio(item.mime, item.name) ? "var(--sw-purple-normal)" : "var(--sw-pink-normal)";

  return (
    <Box position="relative">
      <BackgroundOrnament variant="normal" />
      <VStack gap={6} align="stretch" position="relative" zIndex={1}>
      <Heading size={{ base: "xl", md: "2xl" }} fontFamily="'Comfortaa', sans-serif" fontWeight="300" color="var(--sw-fg-heading)">
        {t("files.title")}
      </Heading>

      <Box 
        className="sw-card" 
        borderRadius="var(--sw-radius)" 
        position="relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <Flex position="absolute" inset={0} bg="rgba(0,0,0,0.7)" backdropFilter="blur(3px)" zIndex={10} align="center" justify="center" borderRadius="inherit" border="4px dashed var(--sw-green-normal)">
            <VStack color="white">
              <FiUploadCloud size={64} color="var(--sw-green-normal)" />
              <Heading size="md" fontFamily="'Comfortaa', sans-serif" fontWeight="800">Lepaskan file di sini</Heading>
              <Text fontSize="sm" fontFamily="'IBM Plex Mono', monospace">File akan otomatis diunggah</Text>
            </VStack>
          </Flex>
        )}
        <Box className="sw-card-header sw-card-header-green">
          <Flex justify="space-between" align="center">
            <Heading size="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="800">{t("files.manage")}</Heading>
            <Text fontSize="2xs" color="var(--sw-fg)" fontFamily="'IBM Plex Mono', monospace" opacity={0.6}>
              {items.length} {t("common.item")}
            </Text>
          </Flex>
        </Box>
        <Box className="sw-card-body" p={{ base: 3, md: 6 }}>
          <Box mb={4} p={3} borderRadius="var(--sw-radius)" bg="var(--sw-bg-muted)" border="1px solid var(--sw-border-color)">
            <HStack gap={2} align="start">
              <FiMusic color="var(--sw-purple-normal)" size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <Text fontSize="xs" color="var(--sw-fg-muted)" fontFamily="'IBM Plex Mono', monospace">
                {t("files.info")}
              </Text>
            </HStack>
          </Box>

          {/* Toolbar */}
          <Flex direction={{ base: "column", sm: "row" }} justify="space-between" align={{ base: "stretch", sm: "center" }} mb={5} gap={3}>
            {/* Breadcrumbs */}
            <HStack gap={1} fontSize="sm" wrap="wrap" maxW={{ base: "100%", md: "50%" }} overflowX="auto"
              css={{ "&::-webkit-scrollbar": { display: "none" }, scrollbarWidth: "none" }}
            >
              <Button variant="ghost" size="xs" onClick={() => load("")} fontFamily="'IBM Plex Mono', monospace" flexShrink={0} color="var(--sw-purple-normal)">
                <FiFolder fill="var(--sw-purple-normal)" fillOpacity={0.2} /> {t("common.rootFolder")}
              </Button>
              {breadcrumbs.map((b, i) => (
                <HStack key={i} gap={1} flexShrink={0}>
                  <FiChevronRight color="var(--sw-fg-subtle)" />
                  <Button variant="ghost" size="xs" onClick={() => goTo(i)} fontFamily="'IBM Plex Mono', monospace">
                    {b}
                  </Button>
                </HStack>
              ))}
            </HStack>

            {/* Actions + view toggle */}
            <HStack gap={2} wrap="wrap" align="center" w={{ base: "full", sm: "auto" }}>
              
              {/* Sort Selector */}
              <Box>
                <select 
                  className="sw-select-sm"
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
              </Box>

              {/* View toggle */}
              <HStack gap={0.5} p={0.5} borderRadius="var(--sw-radius)" border="1px solid var(--sw-border-color)" bg="var(--sw-bg-panel)">
                <IconButton
                  aria-label={t("files.gridView")}
                  size="2xs"
                  variant="ghost"
                  onClick={() => setViewMode("grid")}
                  bg={viewMode === "grid" ? "var(--sw-purple-normal)" : "transparent"}
                  color={viewMode === "grid" ? "#ffffff" : "var(--sw-fg)"}
                  borderRadius="var(--sw-radius)"
                  _hover={{ bg: viewMode === "grid" ? "var(--sw-purple-dark)" : "var(--sw-bg-hover)" }}
                >
                  <FiGrid size={13} />
                </IconButton>
                <IconButton
                  aria-label={t("files.listView")}
                  size="2xs"
                  variant="ghost"
                  onClick={() => setViewMode("list")}
                  bg={viewMode === "list" ? "var(--sw-purple-normal)" : "transparent"}
                  color={viewMode === "list" ? "#ffffff" : "var(--sw-fg)"}
                  borderRadius="var(--sw-radius)"
                  _hover={{ bg: viewMode === "list" ? "var(--sw-purple-dark)" : "var(--sw-bg-hover)" }}
                >
                  <FiList size={13} />
                </IconButton>
              </HStack>

              <button
                type="button"
                onClick={() => setFolderOpen(true)}
                className="sw-btn-outline"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.375rem 1rem",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  background: "var(--sw-bg-panel)",
                  color: "var(--sw-fg)",
                  border: "1px solid var(--sw-border-color)",
                  borderRadius: "var(--sw-radius)",
                  boxShadow: "0.25rem 0.25rem 0 var(--sw-shadow-color)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  userSelect: "none",
                  height: "38px",
                }}
              >
                <FiFolderPlus /> {t("files.folderNew")}
              </button>
              <button
                type="button"
                onClick={() => setUrlOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.375rem 1rem",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  background: "var(--sw-bg-panel)",
                  color: "var(--sw-fg)",
                  border: "1px solid var(--sw-border-color)",
                  borderRadius: "var(--sw-radius)",
                  boxShadow: "0.25rem 0.25rem 0 var(--sw-shadow-color)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  userSelect: "none",
                  height: "38px",
                }}
              >
                <FiLink /> {t("files.uploadUrl")}
              </button>
              <Box
                as="label"
                display="inline-flex"
                alignItems="center"
                gap={2}
                px={4}
                h="38px"
                fontSize="sm"
                fontFamily="'IBM Plex Mono', monospace"
                fontWeight="600"
                bg="var(--sw-green-normal)"
                color="#ffffff"
                border="1px solid var(--sw-border-color)"
                borderRadius="var(--sw-radius)"
                boxShadow="0.2rem 0.2rem 0 var(--sw-shadow-color)"
                cursor={uploading ? "wait" : "pointer"}
                _hover={{ transform: "translate(-0.05rem, -0.05rem)", boxShadow: "0.25rem 0.25rem 0 var(--sw-shadow-color)" }}
                _active={{ transform: "translate(0.1rem, 0.1rem)", boxShadow: "0.1rem 0.1rem 0 var(--sw-shadow-color)" }}
                transition="box-shadow 0.1s, transform 0.2s"
                opacity={uploading ? 0.5 : 1}
                userSelect="none"
              >
                <FiUploadCloud /> {t("files.upload")}
                <input type="file" multiple hidden onChange={handleUpload} accept="audio/*" />
              </Box>
            </HStack>
          </Flex>

          {loading ? (
            <Flex justify="center" py={12}><Spinner size="xl" color="var(--sw-purple-normal)" /></Flex>
          ) : items.length === 0 ? (
            <Box textAlign="center" py={12} color="var(--sw-fg-subtle)">
              <FiFolder size={40} style={{ margin: "0 auto", opacity: 0.4 }} />
              <Text mt={2}>{t("files.folderEmpty")}</Text>
            </Box>
          ) : viewMode === "grid" ? (
            /* === GRID VIEW === */
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={4}>
              {pagedItems.map((item) => (
                <Box
                  key={item.path}
                  className="sw-card sw-card-hover"
                  p={4}
                  borderRadius="var(--sw-radius)"
                  cursor={item.is_dir ? "pointer" : "default"}
                  onClick={() => item.is_dir && openFolder(item)}
                >
                  <VStack gap={3} align="stretch">
                    <Flex justify="space-between" align="start">
                      <Box
                        w={10} h={10}
                        borderRadius="var(--sw-radius)"
                        border="1px solid var(--sw-border-color)"
                        bg={bgFor(item)}
                        color="var(--sw-fg)"
                        display="flex" alignItems="center" justifyContent="center"
                        flexShrink={0}
                      >
                        {iconFor(item)}
                      </Box>
                      <HStack gap={0.5}>
                        <IconButton aria-label={t("files.rename")} size="2xs" variant="ghost" colorPalette="gray" onClick={(e) => { e.stopPropagation(); startRename(item); }}>
                          <FiEdit2 />
                        </IconButton>
                        <IconButton aria-label={t("common.delete")} size="2xs" variant="ghost" colorPalette="red" onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}>
                          <FiTrash2 />
                        </IconButton>
                      </HStack>
                    </Flex>
                    <Text fontSize="sm" fontWeight="700" fontFamily="'Comfortaa', sans-serif" lineClamp={1} title={item.name}>
                      {item.name}
                    </Text>
                    <Text fontSize="xs" color="var(--sw-fg-muted)" fontFamily="'IBM Plex Mono', monospace">
                      {item.is_dir ? t("common.folder") : formatSize(item.size)}
                    </Text>
                    {!item.is_dir && isAudio(item.mime, item.name) && item.url && (
                      <audio controls src={item.url} style={{ width: "100%", height: 36 }} onClick={(e) => e.stopPropagation()} />
                    )}
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>
          ) : (
            /* === LIST VIEW === */
            <Box className="sw-table-container" overflowX="auto">
              <Table.Root size="sm" variant="outline" className="sw-table-zebra sw-table-mobile">
                <Table.Header>
                  <Table.Row>
                      <Table.ColumnHeader w="40px">{t("common.type")}</Table.ColumnHeader>
                      <Table.ColumnHeader cursor="pointer" onClick={() => handleSort("name")} userSelect="none">
                        <HStack gap={1}><Text>{t("common.name")}</Text><SortIcon col="name" /></HStack>
                      </Table.ColumnHeader>
                      <Table.ColumnHeader cursor="pointer" onClick={() => handleSort("size")} userSelect="none" whiteSpace="nowrap">
                        <HStack gap={1}><Text>{t("common.size")}</Text><SortIcon col="size" /></HStack>
                      </Table.ColumnHeader>
                      <Table.ColumnHeader cursor="pointer" onClick={() => handleSort("modified")} userSelect="none" whiteSpace="nowrap">
                        <HStack gap={1}><Text>{t("common.modified")}</Text><SortIcon col="modified" /></HStack>
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>{t("common.audio")}</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center" w="80px">{t("common.action")}</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                  {pagedItems.map((item) => (
                    <Table.Row
                      key={item.path}
                      cursor={item.is_dir ? "pointer" : "default"}
                      onClick={() => item.is_dir && openFolder(item)}
                      _hover={{ bg: "var(--sw-purple-light)" }}
                    >
                      <Table.Cell data-label={t("common.type")}>
                        <Box
                          w={8} h={8}
                          borderRadius="var(--sw-radius)"
                          border="1px solid var(--sw-border-color)"
                          bg={bgFor(item)}
                          color="var(--sw-fg)"
                          display="flex" alignItems="center" justifyContent="center"
                        >
                          {iconFor(item)}
                        </Box>
                      </Table.Cell>
                      <Table.Cell data-label={t("common.name")}>
                        <Text fontSize="sm" fontWeight="700" fontFamily="'Comfortaa', sans-serif" lineClamp={1} title={item.name}>
                          {item.name}
                        </Text>
                        {item.is_dir && (
                          <Badge colorPalette="green" variant="subtle" fontSize="2xs" mt={0.5}>{t("common.folder")}</Badge>
                        )}
                        {isAudio(item.mime, item.name) && !item.is_dir && (
                          <Badge colorPalette="pink" variant="subtle" fontSize="2xs" mt={0.5}>{t("common.audio")}</Badge>
                        )}
                      </Table.Cell>
                      <Table.Cell data-label={t("common.size")} fontSize="xs" fontFamily="'IBM Plex Mono', monospace" color="var(--sw-fg-muted)" whiteSpace="nowrap">
                        {item.is_dir ? "-" : formatSize(item.size)}
                      </Table.Cell>
                      <Table.Cell data-label={t("common.modified")} fontSize="xs" fontFamily="'IBM Plex Mono', monospace" color="var(--sw-fg-subtle)" whiteSpace="nowrap">
                        {formatDate(item.modified, locale)}
                      </Table.Cell>
                      <Table.Cell data-label={t("common.audio")}>
                        {!item.is_dir && isAudio(item.mime, item.name) && item.url ? (
                          <audio controls src={item.url} style={{ width: "180px", height: 32 }} onClick={(e) => e.stopPropagation()} />
                        ) : (
                          <Text fontSize="xs" color="var(--sw-fg-subtle)">-</Text>
                        )}
                      </Table.Cell>
                      <Table.Cell data-label="" className="sw-table-actions">
                        <HStack gap={1} justify="center" onClick={(e) => e.stopPropagation()}>
                          <IconButton aria-label={t("files.rename")} size="xs" variant="ghost" colorPalette="blue" onClick={() => startRename(item)}>
                            <FiEdit2 />
                          </IconButton>
                          <IconButton aria-label={t("common.delete")} size="xs" variant="ghost" colorPalette="red" onClick={() => setDeleteTarget(item)}>
                            <FiTrash2 />
                          </IconButton>
                        </HStack>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
                {items.length > 0 && (
                  <Table.Footer>
                    <Table.Row>
                      <Table.Cell colSpan={6}>{t("table.totalItems", { count: items.length })}</Table.Cell>
                    </Table.Row>
                  </Table.Footer>
                )}
              </Table.Root>
            </Box>
          )}
        
          {/* Pagination */}
          {totalPages > 1 && (
            <Flex justify="space-between" align="center" mt={6} pt={4} borderTop="1px solid var(--sw-border-color)">
              <Text fontSize="sm" fontFamily="'IBM Plex Mono', monospace" color="var(--sw-fg-subtle)">
                {t("table.page" as any) || "Page"} {page} {t("table.of" as any) || "of"} {totalPages}
              </Text>
              <HStack gap={2}>
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                  <FiChevronLeft />
                </Button>
                <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                  <FiChevronRight />
                </Button>
              </HStack>
            </Flex>
          )}

        </Box>
      </Box>

      {/* Dialog: Folder Baru */}
      <Dialog.Root open={folderOpen} onOpenChange={(e) => setFolderOpen(e.open)} placement="center">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW={{ base: "calc(100vw - 2rem)", sm: "400px" }}>
            <Box className="sw-dialog-strip sw-dialog-strip-green" />
            <Dialog.Header>
              <Dialog.Title>{t("files.folderNew")}</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <Input
                placeholder={t("files.folderNamePlaceholder")}
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                autoFocus
                border="1px solid var(--sw-border-color)"
                borderRadius="var(--sw-radius)"
                bg="var(--sw-bg-panel)"
              />
            </Dialog.Body>
            <Dialog.Footer>
              <Button className="sw-btn sw-btn-success" size="sm" variant="ghost" onClick={handleCreateFolder}>{t("files.create")}</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Dialog: Upload dari URL */}
      <Dialog.Root open={urlOpen} onOpenChange={(e) => setUrlOpen(e.open)} placement="center">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW={{ base: "calc(100vw - 2rem)", sm: "480px" }}>
            <Box className="sw-dialog-strip sw-dialog-strip-purple" />
            <Dialog.Header>
              <Dialog.Title>{t("files.urlDialogTitle")}</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <VStack gap={3} align="stretch">
                <Box>
                  <Text fontSize="xs" fontFamily="'IBM Plex Mono', monospace" color="var(--sw-fg-muted)" mb={1}>
                    {t("files.urlLabel")}
                  </Text>
                  <Input
                    placeholder={t("files.urlPlaceholder")}
                    value={urlValue}
                    onChange={(e) => setUrlValue(e.target.value)}
                    autoFocus
                    border="1px solid var(--sw-border-color)"
                    borderRadius="var(--sw-radius)"
                    bg="var(--sw-bg-panel)"
                  />
                </Box>
                <Box>
                  <Text fontSize="xs" fontFamily="'IBM Plex Mono', monospace" color="var(--sw-fg-muted)" mb={1}>
                    {t("files.nameLabel")}
                  </Text>
                  <Input
                    placeholder={t("files.namePlaceholder")}
                    value={urlName}
                    onChange={(e) => setUrlName(e.target.value)}
                    border="1px solid var(--sw-border-color)"
                    borderRadius="var(--sw-radius)"
                    bg="var(--sw-bg-panel)"
                  />
                </Box>
                <HStack gap={2} p={2} borderRadius="var(--sw-radius)" bg="var(--sw-bg-muted)" border="1px solid var(--sw-border-color)">
                  <FiLink color="var(--sw-purple-normal)" size={14} style={{ flexShrink: 0 }} />
                  <Text fontSize="2xs" fontFamily="'IBM Plex Mono', monospace" color="var(--sw-fg-muted)">
                    {t("files.urlHint")}
                  </Text>
                </HStack>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button className="sw-btn sw-btn-primary" size="sm" variant="ghost" onClick={handleUploadUrl} loading={urlUploading}>
                <FiUploadCloud /> {t("files.downloadSave")}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Dialog: Rename */}
      <Dialog.Root open={!!renameTarget} onOpenChange={(e) => !e.open && setRenameTarget(null)} placement="center">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW={{ base: "calc(100vw - 2rem)", sm: "400px" }}>
            <Box className="sw-dialog-strip sw-dialog-strip-blue" />
            <Dialog.Header>
              <Dialog.Title>{t("files.renameTitle")}</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <Input
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                autoFocus
                border="1px solid var(--sw-border-color)"
                borderRadius="var(--sw-radius)"
                bg="var(--sw-bg-panel)"
              />
            </Dialog.Body>
            <Dialog.Footer>
              <Button className="sw-btn sw-btn-success" size="sm" variant="ghost" onClick={handleRename}>{t("common.save")}</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Dialog: Delete confirmation */}
      <Dialog.Root open={!!deleteTarget} onOpenChange={(e) => !e.open && setDeleteTarget(null)} placement="center">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW={{ base: "calc(100vw - 2rem)", sm: "400px" }}>
            <Box className="sw-dialog-strip sw-dialog-strip-pink" />
            <Dialog.Header>
              <Dialog.Title>{t("files.deleteTitle", { type: deleteTarget?.is_dir ? t("common.folder") : t("common.file") })}</Dialog.Title>
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
                  {t("files.deleteConfirm", { name: deleteTarget?.name ?? "" })}
                  {deleteTarget?.is_dir && <> {t("files.deleteFolderWarning")}</>}
                </Text>
              </HStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button className="sw-btn" size="sm" variant="ghost" onClick={() => setDeleteTarget(null)}>{t("common.cancel")}</Button>
              <Button className="sw-btn sw-btn-danger" size="sm" variant="ghost" onClick={confirmDelete}>
                <Box as={FiTrash2} /> {t("common.delete")}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </VStack>
    </Box>
  );
}
