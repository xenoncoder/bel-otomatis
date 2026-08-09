import { useRef, useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { toaster } from "@/lib/toaster";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";
import {
  Box, Button, Grid, Checkbox, Dialog, Field, HStack, Flex, Heading, Input, Text, VStack, MenuRoot, MenuTrigger, MenuContent, MenuItem,
} from "@chakra-ui/react";
import { FiX, FiDownload, FiUpload, FiSave, FiAlertTriangle, FiChevronDown, FiSettings } from "react-icons/fi";
import CloseButton from "@/components/CloseButton";
import BackgroundOrnament from "@/components/BackgroundOrnament";

export default function SettingsPage() {
  const t = useT();
  const { settings, loading, update } = useSettings();
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [overwrite, setOverwrite] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const current = { ...settings, ...form };
  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await update(form);
      setForm({});
      toaster.create({ title: t("settings.saved"), type: "success" });
    } catch (e) {
      toaster.create({ title: (e as Error).message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const confirmExport = async () => {
    setExportOpen(false);
    setExporting(true);
    try {
      await api.backup.export();
      toaster.create({ title: t("settings.backupDownloaded"), type: "success" });
    } catch (e) {
      toaster.create({ title: (e as Error).message, type: "error" });
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setImportOpen(true);
    e.target.value = "";
  };

  const confirmImport = async () => {
    if (!pendingFile) return;
    setImportOpen(false);
    setImporting(true);
    try {
      const res = await api.backup.import(pendingFile, overwrite);
      toaster.create({
        title: res.message,
        description: t("settings.importedDesc", { settings: res.imported.settings, sounds: res.imported.bell_sounds, schedules: res.imported.schedules }),
        type: "success",
      });
      setPendingFile(null);
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      toaster.create({ title: (e as Error).message, type: "error" });
    } finally {
      setImporting(false);
    }
  };

  const cancelImport = () => {
    setImportOpen(false);
    setPendingFile(null);
  };

  if (loading) return <Heading size="md">{t("settings.loading")}</Heading>;

  return (
    <Box position="relative" minH="80vh">
      <BackgroundOrnament variant="normal" />
      <VStack gap={8} align="stretch" position="relative" zIndex={1} maxW="800px" mx="auto" pt={{ base: 4, md: 8 }}>
        <Box textAlign="center" mb={4}>
          <Heading size={{ base: "2xl", md: "4xl" }} fontFamily="'Righteous', cursive" fontWeight="normal" color="var(--sw-purple-normal)" textShadow="3px 3px 0 var(--sw-shadow-color)" letterSpacing="wider">
            {t("settings.title")}
          </Heading>
          <Text fontFamily="'IBM Plex Mono', monospace" color="var(--sw-fg-muted)" mt={2}>Konfigurasi preferensi sistem dan cadangan data.</Text>
        </Box>

        <VStack gap={8} align="stretch">
          {/* Card: Konfigurasi Sistem */}
          <Box className="sw-card" borderRadius="var(--sw-radius)" overflow="hidden" position="relative">
            <Box position="absolute" top={0} left={0} w="8px" h="full" bg="var(--sw-green-normal)" />
            <Box p={{ base: 5, md: 8 }} pl={{ base: 7, md: 10 }}>
              <HStack gap={3} mb={6}>
                <Box p={2} bg="var(--sw-green-light)" borderRadius="md" border="2px solid var(--sw-green-dark)">
                  <FiSettings size={20} color="var(--sw-green-dark)" />
                </Box>
                <Heading size="md" fontFamily="'Comfortaa', sans-serif" fontWeight="800" color="var(--sw-fg)">{t("settings.configSystem")}</Heading>
              </HStack>

              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
                <Field.Root>
                  <Field.Label fontFamily="'Comfortaa', sans-serif" fontWeight="700">{t("settings.volume")}</Field.Label>
                  <Input
                    type="number"
                    size="lg"
                    border="2px solid var(--sw-border-color)"
                    borderRadius="var(--sw-radius)"
                    bg="var(--sw-bg-panel)"
                    value={current.volume ?? ""}
                    onChange={(e) => set("volume", e.target.value)}
                    _focus={{ borderColor: "var(--sw-green-normal)", boxShadow: "0.2rem 0.2rem 0 var(--sw-shadow-color)", transform: "translate(-1px, -1px)" }}
                    transition="all 0.2s"
                  />
                  <Text fontSize="xs" color="var(--sw-fg-subtle)" mt={1}>0-100</Text>
                </Field.Root>

                <Field.Root>
                  <Field.Label fontFamily="'Comfortaa', sans-serif" fontWeight="700">{t("settings.timezone")}</Field.Label>
                  {(() => {
                    const timezoneGroups = [
                      { label: t("tz.indonesia"), options: [
                        { value: "Asia/Jakarta", label: "WIB - Jakarta (UTC+7)" },
                        { value: "Asia/Makassar", label: "WITA - Makassar (UTC+8)" },
                        { value: "Asia/Jayapura", label: "WIT - Jayapura (UTC+9)" },
                        { value: "Asia/Pontianak", label: "WIB - Pontianak (UTC+7)" },
                      ] },
                      { label: t("tz.asia"), options: [
                        { value: "Asia/Singapore", label: "Singapore (UTC+8)" },
                        { value: "Asia/Kuala_Lumpur", label: "Kuala Lumpur (UTC+8)" },
                        { value: "Asia/Bangkok", label: "Bangkok (UTC+7)" },
                        { value: "Asia/Tokyo", label: "Tokyo (UTC+9)" },
                      ] },
                      { label: t("tz.eropa"), options: [
                        { value: "Europe/London", label: "London (UTC+0)" },
                      ] },
                      { label: t("tz.amerika"), options: [
                        { value: "America/New_York", label: "New York (UTC-5)" },
                      ] },
                    ];
                    const selectedTz = current.timezone ?? "Asia/Jakarta";
                    const selectedLabel = timezoneGroups.flatMap(g => g.options).find(o => o.value === selectedTz)?.label || selectedTz;

                    return (
                      <Box position="relative" w="full">
                        <MenuRoot>
                          <MenuTrigger asChild>
                            <Button 
                              variant="outline" 
                              w="full" 
                              size="lg"
                              justifyContent="space-between" 
                              fontFamily="'IBM Plex Mono', monospace"
                              fontWeight="bold"
                              bg="var(--sw-bg-panel)"
                              borderRadius="var(--sw-radius)"
                              border="2px solid var(--sw-border-color)"
                              color="var(--sw-fg)"
                              textAlign="left"
                              px={4}
                              _hover={{ borderColor: "var(--sw-green-normal)", transform: "translate(-1px, -1px)", boxShadow: "0.2rem 0.2rem 0 var(--sw-shadow-color)" }}
                              transition="all 0.2s"
                            >
                              {selectedLabel}
                              <FiChevronDown />
                            </Button>
                          </MenuTrigger>
                          <MenuContent 
                            position="absolute"
                            top="calc(100% + 4px)"
                            left="0"
                            w="full"
                            maxH="250px" 
                            overflowY="auto" 
                            bg="var(--sw-bg-card)" 
                            border="2px solid var(--sw-border-color)" 
                            boxShadow="0.3rem 0.3rem 0 var(--sw-shadow-color)" 
                            borderRadius="var(--sw-radius)"
                            p={2}
                            zIndex="popover"
                          >
                            {timezoneGroups.map(group => (
                              <Box key={group.label} mb={2}>
                                <Text fontSize="xs" fontWeight="bold" color="var(--sw-fg-muted)" px={2} py={1}>{group.label}</Text>
                                {group.options.map(opt => (
                                  <MenuItem 
                                    key={opt.value} 
                                    value={opt.value} 
                                    onClick={() => set("timezone", opt.value)}
                                    cursor="pointer"
                                    _hover={{ bg: "var(--sw-purple-normal)", color: "#fff" }}
                                    borderRadius="md"
                                    px={3} py={2}
                                    fontFamily="'IBM Plex Mono', monospace"
                                    fontSize="sm"
                                  >
                                    {opt.label}
                                  </MenuItem>
                                ))}
                              </Box>
                            ))}
                          </MenuContent>
                        </MenuRoot>
                      </Box>
                    );
                  })()}
                </Field.Root>

                <Field.Root>
                  <Field.Label fontFamily="'Comfortaa', sans-serif" fontWeight="700">{t("settings.bellDuration")}</Field.Label>
                  <Input
                    type="number"
                    size="lg"
                    border="2px solid var(--sw-border-color)"
                    borderRadius="var(--sw-radius)"
                    bg="var(--sw-bg-panel)"
                    value={current.bell_duration ?? ""}
                    onChange={(e) => set("bell_duration", e.target.value)}
                    _focus={{ borderColor: "var(--sw-green-normal)", boxShadow: "0.2rem 0.2rem 0 var(--sw-shadow-color)", transform: "translate(-1px, -1px)" }}
                    transition="all 0.2s"
                  />
                  <Text fontSize="xs" color="var(--sw-fg-subtle)" mt={1}>Detik</Text>
                </Field.Root>

                <Field.Root>
                  <Field.Label fontFamily="'Comfortaa', sans-serif" fontWeight="700">{t("settings.timeFormat")}</Field.Label>
                  <HStack gap={2} w="full">
                    {["24", "12"].map((fmt) => {
                      const isActive = (current.time_format ?? "24") === fmt;
                      return (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => set("time_format", fmt)}
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontWeight: 700,
                            fontSize: "1rem",
                            padding: "0.6rem 1rem",
                            borderRadius: "var(--sw-radius)",
                            border: "2px solid var(--sw-border-color)",
                            background: isActive ? "var(--sw-green-normal)" : "var(--sw-bg-panel)",
                            color: isActive ? "#ffffff" : "var(--sw-fg)",
                            boxShadow: isActive ? "0.2rem 0.2rem 0 var(--sw-shadow-color)" : "none",
                            cursor: "pointer",
                            transition: "all 0.15s",
                            flex: 1,
                            textAlign: "center",
                            transform: isActive ? "translate(-2px, -2px)" : "none"
                          }}
                        >
                          {fmt === "24" ? t("settings.timeFormat24") : t("settings.timeFormat12")}
                        </button>
                      );
                    })}
                  </HStack>
                </Field.Root>
              </Grid>

              <Flex mt={8} justifyContent="flex-end">
                <Button className="sw-btn sw-btn-success" size="lg" px={8} onClick={handleSave} loading={saving}>
                  <Box as={FiSave} mr={2} /> {t("settings.save")}
                </Button>
              </Flex>
            </Box>
          </Box>

          {/* Card: Backup & Restore */}
          <Box className="sw-card" borderRadius="var(--sw-radius)" overflow="hidden" position="relative">
            <Box position="absolute" top={0} left={0} w="8px" h="full" bg="var(--sw-blue-normal)" />
            <Box p={{ base: 5, md: 8 }} pl={{ base: 7, md: 10 }}>
              <HStack gap={3} mb={4}>
                <Box p={2} bg="var(--sw-blue-light)" borderRadius="md" border="2px solid var(--sw-blue-dark)">
                  <FiDownload size={20} color="var(--sw-blue-dark)" />
                </Box>
                <Heading size="md" fontFamily="'Comfortaa', sans-serif" fontWeight="800" color="var(--sw-fg)">{t("settings.backupRestore")}</Heading>
              </HStack>
              <Text fontSize="sm" color="var(--sw-fg-muted)" mb={6} fontFamily="'IBM Plex Mono', monospace">
                {t("settings.backupDesc")}
              </Text>

              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
                <Box p={5} borderRadius="var(--sw-radius)" bg="var(--sw-bg-muted)" border="2px solid var(--sw-border-color)" display="flex" flexDirection="column" gap={4}>
                  <Heading size="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="700">Backup Data</Heading>
                  <Text fontSize="xs" color="var(--sw-fg-subtle)" flex={1}>
                    Unduh semua pengaturan, jadwal, dan file audio Anda ke dalam file zip untuk keamanan.
                  </Text>
                  <Button className="sw-btn sw-btn-primary" onClick={() => setExportOpen(true)} loading={exporting} w="full">
                    <Box as={FiDownload} mr={2} /> {t("settings.downloadBackup")}
                  </Button>
                </Box>

                <Box p={5} borderRadius="var(--sw-radius)" bg="var(--sw-bg-muted)" border="2px solid var(--sw-border-color)" display="flex" flexDirection="column" gap={4}>
                  <Heading size="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="700">Restore Data</Heading>
                  <Text fontSize="xs" color="var(--sw-fg-subtle)" flex={1}>
                    Kembalikan sistem Anda menggunakan file backup (.zip atau .json) yang sebelumnya telah diunduh.
                  </Text>
                  <Checkbox.Root checked={overwrite} onCheckedChange={(e) => setOverwrite(e.checked === true)} mb={1}>
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label fontSize="xs" fontWeight="bold" color={overwrite ? "var(--sw-pink-normal)" : "var(--sw-fg-muted)"}>
                      {t("settings.overwriteLabel")}
                    </Checkbox.Label>
                  </Checkbox.Root>
                  <Button className="sw-btn sw-btn-warning" loading={importing} onClick={() => fileInputRef.current?.click()} w="full">
                    <Box as={FiUpload} mr={2} /> {t("settings.restoreFromFile")}
                  </Button>
                  <input ref={fileInputRef} type="file" accept=".zip,.json,application/zip,application/json" hidden onChange={handleFileSelect} />
                </Box>
              </Grid>
            </Box>
          </Box>
        </VStack>
      </VStack>

      {/* Dialog: Export confirmation */}
      <Dialog.Root open={exportOpen} onOpenChange={(e) => setExportOpen(e.open)} placement="center">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW={{ base: "calc(100vw - 2rem)", sm: "440px" }}>
            <Box className="sw-dialog-strip sw-dialog-strip-green" />
            <Dialog.Header>
              <Dialog.Title>{t("settings.backupConfirmTitle")}</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <VStack gap={3} align="stretch">
                <Text fontSize="sm" color="var(--sw-fg)" fontWeight="600">{t("settings.backupConfirmBody")}</Text>
                <Box p={3} borderRadius="var(--sw-radius)" bg="var(--sw-bg-muted)" border="2px solid var(--sw-border-color)">
                  <VStack gap={1} align="stretch" fontSize="sm" color="var(--sw-fg)" fontWeight="600">
                    <Text>{t("settings.backupItem1")}</Text>
                    <Text>{t("settings.backupItem2")}</Text>
                    <Text>{t("settings.backupItem3")}</Text>
                    <Text>{t("settings.backupItem4")}</Text>
                  </VStack>
                </Box>
                <Text fontSize="sm" color="var(--sw-fg)" fontWeight="600">{t("settings.backupConfirmQ")}</Text>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button className="sw-btn" variant="ghost" size="sm" onClick={() => setExportOpen(false)} title={t("common.cancel")}>
                <Box as={FiX} />
              </Button>
              <Button className="sw-btn sw-btn-success" size="sm" onClick={confirmExport}>
                <Box as={FiDownload} /> {t("settings.yesDownload")}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Dialog: Import confirmation */}
      <Dialog.Root open={importOpen} onOpenChange={(e) => { if (!e.open) cancelImport(); }} placement="center">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW={{ base: "calc(100vw - 2rem)", sm: "480px" }}>
            <Box className={overwrite ? "sw-dialog-strip sw-dialog-strip-red" : "sw-dialog-strip sw-dialog-strip-yellow"} />
            <Dialog.Header>
              <Dialog.Title>
                {overwrite ? t("settings.restoreConfirmOverwrite") : t("settings.restoreConfirm")}
              </Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <VStack gap={3} align="stretch">
                <Text fontSize="sm" color="var(--sw-fg)" fontWeight="600">{t("settings.restoreFile")}</Text>
                <Box p={3} borderRadius="var(--sw-radius)" bg="var(--sw-bg-muted)" border="2px solid var(--sw-border-color)">
                  <Text fontSize="sm" fontFamily="'IBM Plex Mono', monospace" fontWeight="600" color="var(--sw-fg)" wordBreak="break-all">
                    {pendingFile?.name}
                  </Text>
                  <Text fontSize="xs" color="var(--sw-fg-subtle)" mt={1}>
                    {t("settings.fileSize", { size: pendingFile ? (pendingFile.size / 1024).toFixed(1) : 0 })}
                  </Text>
                </Box>
                {overwrite ? (
                  <Box p={3} borderRadius="var(--sw-radius)" bg="var(--sw-pink-light)" border="2px solid var(--sw-pink-dark)">
                    <HStack gap={2} align="start">
                      <Box as={FiAlertTriangle} color="var(--sw-pink-dark)" flexShrink={0} mt="2px" />
                      <Text fontSize="sm" color="var(--sw-pink-dark)" fontWeight="700">
                        {t("settings.restoreOverwriteWarning")}
                      </Text>
                    </HStack>
                  </Box>
                ) : (
                  <Text fontSize="sm" color="var(--sw-fg-muted)">
                    {t("settings.restoreNormalInfo")}
                  </Text>
                )}
                <Text fontSize="sm" color="var(--sw-fg)" fontWeight="700">{t("settings.restoreConfirmQ")}</Text>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button className="sw-btn" variant="ghost" size="sm" onClick={cancelImport} title={t("common.cancel")}>
                <Box as={FiX} />
              </Button>
              <Button colorPalette={overwrite ? "red" : "yellow"} size="sm" onClick={confirmImport}>
                <Box as={FiUpload} /> {overwrite ? t("settings.yesOverwrite") : t("settings.yesRestore")}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
}
