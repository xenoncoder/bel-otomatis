import { useRef, useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { toaster } from "@/lib/toaster";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";
import {
  Box, Button, Grid, Checkbox, Dialog, Field, HStack, Heading, Input, Text, VStack, MenuRoot, MenuTrigger, MenuContent, MenuItem,
} from "@chakra-ui/react";
import { FiDownload, FiUpload, FiSave, FiAlertTriangle, FiChevronDown } from "react-icons/fi";
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
    <Box position="relative">
      <BackgroundOrnament variant="normal" />
      <VStack gap={6} align="stretch" position="relative" zIndex={1}>
      <Heading size={{ base: "xl", md: "2xl" }} fontFamily="'Comfortaa', sans-serif" fontWeight="300" color="var(--sw-fg-heading)">
        {t("settings.title")}
      </Heading>

      {/* Config card with green header */}
      <Box className="sw-card" borderRadius="var(--sw-radius)">
        <Box className="sw-card-header sw-card-header-green">
          <Heading size="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="800">{t("settings.configSystem")}</Heading>
        </Box>
        <Box className="sw-card-body" p={{ base: 4, md: 6 }}>
          <VStack gap={5} align="stretch" maxW="420px">
            <Field.Root>
              <Field.Label fontFamily="'Comfortaa', sans-serif" fontWeight="700">{t("settings.volume")}</Field.Label>
              <Input
                type="number"
                border="1px solid var(--sw-border-color)"
                borderRadius="var(--sw-radius)"
                bg="var(--sw-bg-panel)"
                value={current.volume ?? ""}
                onChange={(e) => set("volume", e.target.value)}
              />
            </Field.Root>
            <Field.Root>
              <Field.Label fontFamily="'Comfortaa', sans-serif" fontWeight="700">{t("settings.timezone")}</Field.Label>
              
{(() => {
  const timezoneGroups = [
    { label: t("tz.indonesia"), options: [
      { value: "Asia/Jakarta", label: "WIB — Jakarta (UTC+7)" },
      { value: "Asia/Makassar", label: "WITA — Makassar (UTC+8)" },
      { value: "Asia/Jayapura", label: "WIT — Jayapura (UTC+9)" },
      { value: "Asia/Pontianak", label: "WIB — Pontianak (UTC+7)" },
    ] },
    { label: t("tz.asia"), options: [
      { value: "Asia/Singapore", label: "Singapore (UTC+8)" },
      { value: "Asia/Kuala_Lumpur", label: "Kuala Lumpur (UTC+8)" },
      { value: "Asia/Bangkok", label: "Bangkok (UTC+7)" },
      { value: "Asia/Tokyo", label: "Tokyo (UTC+9)" },
      { value: "Asia/Seoul", label: "Seoul (UTC+9)" },
      { value: "Asia/Shanghai", label: "Shanghai (UTC+8)" },
      { value: "Asia/Hong_Kong", label: "Hong Kong (UTC+8)" },
      { value: "Asia/Taipei", label: "Taipei (UTC+8)" },
      { value: "Asia/Manila", label: "Manila (UTC+8)" },
      { value: "Asia/Ho_Chi_Minh", label: "Ho Chi Minh (UTC+7)" },
      { value: "Asia/Jerusalem", label: "Jerusalem (UTC+2)" },
      { value: "Asia/Dubai", label: "Dubai (UTC+4)" },
      { value: "Asia/Riyadh", label: "Riyadh (UTC+3)" },
      { value: "Asia/Kolkata", label: "Kolkata (UTC+5:30)" },
      { value: "Asia/Karachi", label: "Karachi (UTC+5)" },
      { value: "Asia/Dhaka", label: "Dhaka (UTC+6)" },
      { value: "Asia/Tehran", label: "Tehran (UTC+3:30)" },
      { value: "Asia/Baghdad", label: "Baghdad (UTC+3)" },
      { value: "Asia/Kathmandu", label: "Kathmandu (UTC+5:45)" },
      { value: "Asia/Yangon", label: "Yangon (UTC+6:30)" },
    ] },
    { label: t("tz.eropa"), options: [
      { value: "Europe/London", label: "London (UTC+0)" },
      { value: "Europe/Paris", label: "Paris (UTC+1)" },
      { value: "Europe/Berlin", label: "Berlin (UTC+1)" },
      { value: "Europe/Madrid", label: "Madrid (UTC+1)" },
      { value: "Europe/Rome", label: "Rome (UTC+1)" },
      { value: "Europe/Amsterdam", label: "Amsterdam (UTC+1)" },
      { value: "Europe/Brussels", label: "Brussels (UTC+1)" },
      { value: "Europe/Stockholm", label: "Stockholm (UTC+1)" },
      { value: "Europe/Oslo", label: "Oslo (UTC+1)" },
      { value: "Europe/Copenhagen", label: "Copenhagen (UTC+1)" },
      { value: "Europe/Helsinki", label: "Helsinki (UTC+2)" },
      { value: "Europe/Warsaw", label: "Warsaw (UTC+1)" },
      { value: "Europe/Moscow", label: "Moscow (UTC+3)" },
      { value: "Europe/Istanbul", label: "Istanbul (UTC+3)" },
      { value: "Europe/Athens", label: "Athens (UTC+2)" },
      { value: "Europe/Prague", label: "Prague (UTC+1)" },
      { value: "Europe/Vienna", label: "Vienna (UTC+1)" },
      { value: "Europe/Dublin", label: "Dublin (UTC+0)" },
      { value: "Europe/Lisbon", label: "Lisbon (UTC+0)" },
      { value: "Europe/Zurich", label: "Zurich (UTC+1)" },
    ] },
    { label: t("tz.amerika"), options: [
      { value: "America/New_York", label: "New York (UTC-5)" },
      { value: "America/Los_Angeles", label: "Los Angeles (UTC-8)" },
      { value: "America/Chicago", label: "Chicago (UTC-6)" },
      { value: "America/Denver", label: "Denver (UTC-7)" },
      { value: "America/Phoenix", label: "Phoenix (UTC-7)" },
      { value: "America/Toronto", label: "Toronto (UTC-5)" },
      { value: "America/Vancouver", label: "Vancouver (UTC-8)" },
      { value: "America/Mexico_City", label: "Mexico City (UTC-6)" },
      { value: "America/Sao_Paulo", label: "Sao Paulo (UTC-3)" },
      { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (UTC-3)" },
      { value: "America/Bogota", label: "Bogota (UTC-5)" },
      { value: "America/Lima", label: "Lima (UTC-5)" },
      { value: "America/Santiago", label: "Santiago (UTC-4)" },
      { value: "America/Caracas", label: "Caracas (UTC-4)" },
      { value: "America/Havana", label: "Havana (UTC-5)" },
      { value: "America/Anchorage", label: "Anchorage (UTC-9)" },
      { value: "America/Honolulu", label: "Honolulu (UTC-10)" },
    ] },
    { label: t("tz.afrika"), options: [
      { value: "Africa/Cairo", label: "Cairo (UTC+2)" },
      { value: "Africa/Johannesburg", label: "Johannesburg (UTC+2)" },
      { value: "Africa/Lagos", label: "Lagos (UTC+1)" },
      { value: "Africa/Nairobi", label: "Nairobi (UTC+3)" },
      { value: "Africa/Casablanca", label: "Casablanca (UTC+1)" },
      { value: "Africa/Accra", label: "Accra (UTC+0)" },
      { value: "Africa/Addis_Ababa", label: "Addis Ababa (UTC+3)" },
      { value: "Africa/Algiers", label: "Algiers (UTC+1)" },
      { value: "Africa/Tunis", label: "Tunis (UTC+1)" },
    ] },
    { label: t("tz.oseania"), options: [
      { value: "Australia/Sydney", label: "Sydney (UTC+10)" },
      { value: "Australia/Melbourne", label: "Melbourne (UTC+10)" },
      { value: "Australia/Perth", label: "Perth (UTC+8)" },
      { value: "Australia/Brisbane", label: "Brisbane (UTC+10)" },
      { value: "Australia/Adelaide", label: "Adelaide (UTC+9:30)" },
      { value: "Pacific/Auckland", label: "Auckland (UTC+12)" },
      { value: "Pacific/Fiji", label: "Fiji (UTC+12)" },
      { value: "Pacific/Honolulu", label: "Honolulu (UTC-10)" },
      { value: "Pacific/Guam", label: "Guam (UTC+10)" },
    ] },
    { label: t("tz.lainnya"), options: [
      { value: "UTC", label: "UTC (UTC+0)" },
      { value: "Atlantic/Reykjavik", label: "Reykjavik (UTC+0)" },
      { value: "Atlantic/Canary", label: "Canary (UTC+0)" },
    ] },
  ];
  const selectedTz = current.timezone ?? "Asia/Jakarta";
  const selectedLabel = timezoneGroups.flatMap(g => g.options).find(o => o.value === selectedTz)?.label || selectedTz;

  return (
    <Box position="relative">
      <MenuRoot>
        <MenuTrigger asChild>
          <Button 
            variant="outline" 
            w="full" 
            h="38px" 
            justifyContent="space-between" 
            fontFamily="'IBM Plex Mono', monospace"
            fontWeight="normal"
            bg="var(--sw-bg-panel)"
            borderRadius="var(--sw-radius)"
            border="2px solid var(--sw-border-color)"
            color="var(--sw-fg)"
            textAlign="left"
            px={3}
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
          maxH="300px" 
          overflowY="auto" 
          bg="var(--sw-bg-card)" 
          border="2px solid var(--sw-border-color)" 
          boxShadow="4px 4px 0 var(--sw-shadow-color)" 
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
                  _hover={{ bg: "var(--sw-bg-muted)" }}
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
                border="1px solid var(--sw-border-color)"
                borderRadius="var(--sw-radius)"
                bg="var(--sw-bg-panel)"
                value={current.bell_duration ?? ""}
                onChange={(e) => set("bell_duration", e.target.value)}
              />
            </Field.Root>

            {/* Time format toggle */}
            <Field.Root>
              <Field.Label fontFamily="'Comfortaa', sans-serif" fontWeight="700">{t("settings.timeFormat")}</Field.Label>
              <HStack gap={2} w="full">
                {["24", "12"].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => set("time_format", fmt)}
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      padding: "0.5rem 1rem",
                      borderRadius: "var(--sw-radius)",
                      border: "1px solid var(--sw-border-color)",
                      background: (current.time_format ?? "24") === fmt ? "var(--sw-purple-normal)" : "var(--sw-bg-panel)",
                      color: (current.time_format ?? "24") === fmt ? "#ffffff" : "var(--sw-fg)",
                      boxShadow: (current.time_format ?? "24") === fmt ? "0.2rem 0.2rem 0 var(--sw-shadow-color)" : "none",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      width: "50%",
                      textAlign: "center",
                    }}
                  >
                    {fmt === "24" ? t("settings.timeFormat24") : t("settings.timeFormat12")}
                  </button>
                ))}
              </HStack>
            </Field.Root>

            <Button className="sw-btn sw-btn-success" variant="ghost" onClick={handleSave} loading={saving} alignSelf="flex-start" size="sm">
              <Box as={FiSave} /> {t("settings.save")}
            </Button>
          </VStack>
        </Box>
      </Box>

      {/* Backup card with pink header */}
      <Box className="sw-card" borderRadius="var(--sw-radius)">
        <Box className="sw-card-header">
          <Heading size="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="800">{t("settings.backupRestore")}</Heading>
        </Box>
        <Box className="sw-card-body" p={{ base: 4, md: 6 }}>
          <Text fontSize="sm" color="var(--sw-fg-muted)" mb={5} fontFamily="'IBM Plex Mono', monospace">
            {t("settings.backupDesc")}
          </Text>
          <VStack gap={4} align="stretch" maxW="500px">
            <HStack gap={3} wrap="wrap" flexDirection={{ base: "column", sm: "row" }} w="full">
              <Button className="sw-btn sw-btn-success" variant="ghost" onClick={() => setExportOpen(true)} loading={exporting} size="sm" w={{ base: "full", sm: "auto" }}>
                <Box as={FiDownload} /> {t("settings.downloadBackup")}
              </Button>
              <Button colorPalette="yellow" loading={importing} onClick={() => fileInputRef.current?.click()} size="sm" w={{ base: "full", sm: "auto" }}>
                <Box as={FiUpload} /> {t("settings.restoreFromFile")}
              </Button>
              <input ref={fileInputRef} type="file" accept=".zip,.json,application/zip,application/json" hidden onChange={handleFileSelect} />
            </HStack>
            <Checkbox.Root checked={overwrite} onCheckedChange={(e) => setOverwrite(e.checked === true)}>
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label fontSize="sm" color="var(--sw-fg-muted)">
                {t("settings.overwriteLabel")}
              </Checkbox.Label>
            </Checkbox.Root>
            {overwrite && (
              <Box p={3} borderRadius="var(--sw-radius)" bg="#FFDCDC" border="1px solid #E53E3E">
                <HStack gap={2}>
                  <Box as={FiAlertTriangle} color="#E53E3E" />
                  <Text fontSize="xs" color="#E53E3E">
                    {t("settings.overwriteWarning")}
                  </Text>
                </HStack>
              </Box>
            )}
            <Box p={3} borderRadius="var(--sw-radius)" bg="var(--sw-bg-muted)" border="1px solid var(--sw-border-color)">
              <Text fontSize="xs" color="var(--sw-fg-subtle)">
                {t("settings.backupIncludes")}
              </Text>
            </Box>
          </VStack>
        </Box>
      </Box>

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
                <Box p={3} borderRadius="var(--sw-radius)" bg="var(--sw-bg-muted)" border="1px solid var(--sw-border-color)">
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
              <Button className="sw-btn sw-btn-success" variant="ghost" size="sm" onClick={confirmExport}>
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
                <Box p={3} borderRadius="var(--sw-radius)" bg="var(--sw-bg-muted)" border="1px solid var(--sw-border-color)">
                  <Text fontSize="sm" fontFamily="'IBM Plex Mono', monospace" fontWeight="600" color="var(--sw-fg)" wordBreak="break-all">
                    {pendingFile?.name}
                  </Text>
                  <Text fontSize="xs" color="var(--sw-fg-subtle)" mt={1}>
                    {t("settings.fileSize", { size: pendingFile ? (pendingFile.size / 1024).toFixed(1) : 0 })}
                  </Text>
                </Box>
                {overwrite ? (
                  <Box p={3} borderRadius="var(--sw-radius)" bg="var(--sw-pink-light)" border="1px solid var(--sw-pink-dark)">
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
              <Button colorPalette={overwrite ? "red" : "yellow"} size="sm" onClick={confirmImport}>
                <Box as={FiUpload} /> {overwrite ? t("settings.yesOverwrite") : t("settings.yesRestore")}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Grid>
    </Box>
  );
}
