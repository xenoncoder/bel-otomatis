import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { BellLog } from "@/lib/types";
import {
  Badge, Box, Button, Dialog, HStack, Heading, IconButton, Text, VStack,
} from "@chakra-ui/react";
import { FiActivity, FiTrash2, FiAlertTriangle } from "react-icons/fi";
import { useT, useLang } from "@/lib/i18n";
import { useTimeFormat } from "@/lib/time-format";
import { toaster } from "@/lib/toaster";
import { DataTable, type Column } from "@/components/DataTable";
import CloseButton from "@/components/CloseButton";
import BackgroundOrnament from "@/components/BackgroundOrnament";

export default function LogsPage() {
  const t = useT();
  const { lang } = useLang();
  const timeFormat = useTimeFormat();
  const locale = lang === "id" ? "id-ID" : "en-GB";
  const [logs, setLogs] = useState<BellLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<BellLog | null>(null);
  const [clearOpen, setClearOpen] = useState(false);

  const dayLabel: Record<string, string> = {
    monday: t("schedules.days.monday"), tuesday: t("schedules.days.tuesday"), wednesday: t("schedules.days.wednesday"),
    thursday: t("schedules.days.thursday"), friday: t("schedules.days.friday"), saturday: t("schedules.days.saturday"), sunday: t("schedules.days.sunday"),
  };

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setLogs(await api.bellLogs.list(100));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload, refreshKey]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.bellLogs.delete(deleteTarget.id);
      toaster.create({ title: t("logs.deleted"), type: "success" });
      setDeleteTarget(null);
      setRefreshKey((n) => n + 1);
    } catch (e) {
      toaster.create({ title: (e as Error).message, type: "error" });
    }
  };

  const handleClearAll = async () => {
    try {
      await api.bellLogs.clearAll();
      toaster.create({ title: t("logs.allCleared"), type: "success" });
      setClearOpen(false);
      setRefreshKey((n) => n + 1);
    } catch (e) {
      toaster.create({ title: (e as Error).message, type: "error" });
    }
  };

  const columns: Column<BellLog>[] = [
    {
      key: "waktu",
      label: t("table.waktu"),
      sortValue: (log) => log.triggered_at,
      render: (log) => (
        <Text fontFamily="'IBM Plex Mono', monospace" fontSize="xs" whiteSpace="nowrap">
          {new Date(log.triggered_at).toLocaleString(locale, {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit", second: "2-digit",
            hour12: timeFormat === "12",
            timeZone: "Asia/Jakarta",
          })}
        </Text>
      ),
    },
    {
      key: "hari",
      label: t("table.hari"),
      render: (log) => (
        <Text textTransform="capitalize" whiteSpace="nowrap">
          {log.schedule?.day ? (dayLabel[log.schedule.day] ?? log.schedule.day) : "-"}
        </Text>
      ),
    },
    {
      key: "label",
      label: t("common.label"),
      sortValue: (log) => log.schedule?.label ?? "",
      render: (log) => (
        <Text fontWeight="600" fontFamily="'Comfortaa', sans-serif">
          {log.schedule?.label ?? "-"}
        </Text>
      ),
    },
    {
      key: "jam",
      label: t("table.jam"),
      render: (log) => (
        <Text fontFamily="'IBM Plex Mono', monospace" whiteSpace="nowrap" color="var(--sw-purple-normal)" fontWeight="700">
          {log.schedule?.start_time ?? "-"}
        </Text>
      ),
    },
    {
      key: "status",
      label: t("common.status"),
      render: (log) => (
        <Badge
          colorPalette={log.status === "manual" ? "yellow" : "green"}
          variant="solid"
          fontSize="2xs"
          px={2}
          py={0.5}
          borderRadius="var(--sw-radius)"
          textTransform="capitalize"
          fontFamily="'Comfortaa', sans-serif"
          fontWeight="700"
        >
          {t("logStatus." + log.status)}
        </Badge>
      ),
    },
    {
      key: "aksi",
      label: t("common.action"),
      align: "center",
      width: "60px",
      render: (log) => (
        <HStack gap={1} justify="center">
          <IconButton
            aria-label={t("common.delete")}
            size="xs"
            variant="ghost"
            colorPalette="red"
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(log); }}
          >
            <FiTrash2 />
          </IconButton>
        </HStack>
      ),
    },
  ];

  return (
    <Box position="relative">
      <BackgroundOrnament variant="normal" />
      <VStack gap={6} align="stretch" position="relative" zIndex={1}>
      <HStack justify="space-between" wrap="wrap" gap={4} align="start">
        <Heading size={{ base: "xl", md: "2xl" }} fontFamily="'Comfortaa', sans-serif" fontWeight="300" color="var(--sw-fg-heading)">
          {t("logs.title")}
        </Heading>
        {logs.length > 0 && (
          <Button variant="outline" size="sm" colorPalette="red" onClick={() => setClearOpen(true)} flexShrink={0}>
            <Box as={FiTrash2} /> {t("logs.clearAll")}
          </Button>
        )}
      </HStack>

      <Box className="sw-card" borderRadius="var(--sw-radius)">
        <Box className="sw-card-header sw-card-header-green">
          <Heading size="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="800">{t("logs.history")}</Heading>
        </Box>
        <Box className="sw-card-body" p={{ base: 4, md: 6 }}>
          <DataTable
            columns={columns}
            data={logs}
            loading={loading}
            rowKey={(log) => log.id}
            pageSize={10}
            footerLabel={(count) => t("table.totalLogs", { count })}
            emptyContent={
              <VStack gap={1}>
                <FiActivity size={28} style={{ opacity: 0.4 }} />
                <Text>{t("table.noActivity")}</Text>
              </VStack>
            }
          />
        </Box>
      </Box>

      {/* Delete single log dialog */}
      <Dialog.Root open={!!deleteTarget} onOpenChange={(e) => !e.open && setDeleteTarget(null)} placement="center">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW={{ base: "calc(100vw - 2rem)", sm: "400px" }}>
            <Box className="sw-dialog-strip sw-dialog-strip-pink" />
            <Dialog.Header>
              <Dialog.Title>{t("logs.deleteTitle")}</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton />
              </Dialog.CloseTrigger>
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
                  {t("logs.deleteConfirm")}
                </Text>
              </HStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>{t("common.cancel")}</Button>
              <Button colorPalette="red" size="sm" onClick={handleDelete}>
                <Box as={FiTrash2} /> {t("common.delete")}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Clear all logs dialog */}
      <Dialog.Root open={clearOpen} onOpenChange={(e) => setClearOpen(e.open)} placement="center">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW={{ base: "calc(100vw - 2rem)", sm: "400px" }}>
            <Box className="sw-dialog-strip sw-dialog-strip-pink" />
            <Dialog.Header>
              <Dialog.Title>{t("logs.clearAllTitle")}</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton />
              </Dialog.CloseTrigger>
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
                  {t("logs.clearAllConfirm", { count: logs.length })}
                </Text>
              </HStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" size="sm" onClick={() => setClearOpen(false)}>{t("common.cancel")}</Button>
              <Button colorPalette="red" size="sm" onClick={handleClearAll}>
                <Box as={FiTrash2} /> {t("logs.clearAll")}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </VStack>
    </Box>
  );
}
