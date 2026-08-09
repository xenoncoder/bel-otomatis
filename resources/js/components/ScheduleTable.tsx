import { Badge, Box, HStack, IconButton, Text, VStack, Dialog, Button } from "@chakra-ui/react";
import { FiTrash2, FiEdit2, FiCalendar, FiMusic, FiClock, FiRepeat, FiAlertTriangle, FiPlay, FiSquare, FiCopy } from "react-icons/fi";
import { useState, useRef } from "react";
import type { Recurrence, Schedule } from "@/lib/types";
import { useT, useLang } from "@/lib/i18n";
import { DataTable, type Column } from "@/components/DataTable";

interface ScheduleTableProps {
  schedules: Schedule[];
  loading: boolean;
  onDelete: (id: number) => void;
  onEdit: (schedule: Schedule) => void;
  onCopy: (schedule: Schedule) => void;
}

const recurrenceIcon: Record<Recurrence, typeof FiCalendar> = {
  once: FiCalendar,
  daily: FiClock,
  weekly: FiRepeat,
  yearly: FiCalendar,
};

const AudioPreviewButton = ({ url }: { url: string }) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (playing && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    } else {
      const audio = new Audio(url);
      audio.onended = () => setPlaying(false);
      audio.onerror = () => setPlaying(false);
      audio.play().catch(() => setPlaying(false));
      audioRef.current = audio;
      setPlaying(true);
    }
  };

  return (
    <IconButton
      size="xs"
      className={playing ? "sw-btn sw-btn-danger" : "sw-btn sw-btn-primary"}
      variant="ghost"
      onClick={toggle}
      title={playing ? "Stop preview" : "Play preview"}
      borderRadius="full"
    >
      {playing ? <FiSquare /> : <FiPlay />}
    </IconButton>
  );
};

export default function ScheduleTable({ schedules, loading, onDelete, onEdit, onCopy }: ScheduleTableProps) {
  const t = useT();
  const { lang } = useLang();
  const locale = lang === "id" ? "id-ID" : "en-GB";
  const [pendingDelete, setPendingDelete] = useState<Schedule | null>(null);

  const recurrenceLabel: Record<Recurrence, string> = {
    once: t("schedules.recurrence.once"),
    daily: t("schedules.recurrence.daily"),
    weekly: t("schedules.recurrence.weekly"),
    yearly: t("schedules.recurrence.yearly"),
  };

  const dayLabel: Record<string, string> = {
    monday: t("schedules.days.monday"), tuesday: t("schedules.days.tuesday"), wednesday: t("schedules.days.wednesday"),
    thursday: t("schedules.days.thursday"), friday: t("schedules.days.friday"), saturday: t("schedules.days.saturday"), sunday: t("schedules.days.sunday"),
  };

  const dayShort: Record<string, string> = {
    monday: t("schedules.daysShort.monday"), tuesday: t("schedules.daysShort.tuesday"), wednesday: t("schedules.daysShort.wednesday"),
    thursday: t("schedules.daysShort.thursday"), friday: t("schedules.daysShort.friday"), saturday: t("schedules.daysShort.saturday"), sunday: t("schedules.daysShort.sunday"),
  };

  const confirmDelete = () => {
    if (pendingDelete) {
      onDelete(pendingDelete.id);
      setPendingDelete(null);
    }
  };

  const columns: Column<Schedule>[] = [
    {
      key: "start",
      label: t("table.start"),
      sortValue: (s) => s.start_time,
      render: (s) => (
        <Text fontFamily="'IBM Plex Mono', monospace" fontWeight="700" whiteSpace="nowrap" color="var(--sw-purple-normal)">
          {s.start_time}
        </Text>
      ),
    },
    {
      key: "label",
      label: t("common.label"),
      sortValue: (s) => s.label,
      render: (s) => (
        <Text fontWeight="600" fontFamily="'Comfortaa', sans-serif">{s.label}</Text>
      ),
    },
    {
      key: "jenis",
      label: t("table.jenis"),
      render: (s) => {
        const RIcon = recurrenceIcon[s.recurrence] ?? FiRepeat;
        let scheduleInfo = "";
        if ((s.recurrence === "weekly" || s.recurrence === "daily") && s.days && s.days.length > 0) {
          scheduleInfo = s.days.map((d) => dayShort[d] ?? d).join(", ");
        } else if (s.recurrence === "daily") {
          scheduleInfo = t("schedules.everyDay");
        } else if (s.recurrence === "once" && s.specific_date) {
                scheduleInfo = new Date(s.specific_date).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
              } else if (s.recurrence === "yearly" && s.specific_date) {
                scheduleInfo = new Date(s.specific_date).toLocaleDateString(locale, { day: "2-digit", month: "long" });
        }
        return (
          <HStack gap={1.5}>
            <RIcon size={12} color="var(--sw-fg-subtle)" />
            <Text fontSize="xs" color="var(--sw-fg-muted)" whiteSpace="nowrap">
              {recurrenceLabel[s.recurrence]}
            </Text>
            {scheduleInfo && (
              <Text fontSize="2xs" color="var(--sw-fg-subtle)" whiteSpace="nowrap">
                ({scheduleInfo})
              </Text>
            )}
          </HStack>
        );
      },
    },
    {
      key: "sound",
      label: t("table.sound"),
      render: (s) => (
        <HStack gap={1}>
          <AudioPreviewButton url={s.bell_sound?.url ?? "/sounds/bell.mp3"} />
          <Text fontSize="xs" color="var(--sw-fg-muted)" whiteSpace="nowrap">
            {s.bell_sound?.name ?? t("common.default")}
          </Text>
        </HStack>
      ),
    },
    {
      key: "status",
      label: t("common.status"),
      render: (s) => (
        <Badge
          colorPalette={s.is_active ? "green" : "gray"}
          variant="solid"
          fontFamily="'Comfortaa', sans-serif"
          fontWeight="700"
          fontSize="2xs"
          px={2}
          py={0.5}
          borderRadius="var(--sw-radius)"
          textTransform="capitalize"
        >
          {s.is_active ? t("common.active") : t("common.inactive")}
        </Badge>
      ),
    },
    {
      key: "aksi",
      label: t("common.action"),
      align: "center",
      render: (s) => (
        <HStack gap={1} justify="center">
          <IconButton
            aria-label={t("table.editSchedule")}
            size="sm"
            className="sw-btn sw-btn-primary"
            variant="ghost"
            borderRadius="full"
            onClick={() => onEdit(s)}
          >
            <FiEdit2 />
          </IconButton>
          <IconButton
            aria-label="Copy Schedule"
            size="sm"
            className="sw-btn sw-btn-success"
            variant="ghost"
            borderRadius="full"
            onClick={() => onCopy(s)}
          >
            <FiCopy />
          </IconButton>
          <IconButton
            aria-label={t("table.deleteSchedule")}
            size="sm"
            className="sw-btn sw-btn-danger"
            variant="ghost"
            borderRadius="full"
            onClick={() => setPendingDelete(s)}
          >
            <FiTrash2 />
          </IconButton>
        </HStack>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={schedules}
        loading={loading}
        rowKey={(s) => s.id}
        pageSize={8}
        footerLabel={(count) => t("table.totalSchedules", { count })}
        emptyContent={
          <VStack gap={1}>
            <FiCalendar size={28} style={{ opacity: 0.4 }} />
            <Text>{t("table.noSchedules")}</Text>
          </VStack>
        }
      />

      {/* Delete confirmation dialog */}
      <Dialog.Root open={!!pendingDelete} onOpenChange={(e) => !e.open && setPendingDelete(null)} placement="center">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW={{ base: "calc(100vw - 2rem)", sm: "400px" }}>
            <Box className="sw-dialog-strip sw-dialog-strip-pink" />
            <Dialog.Header>
              <Dialog.Title>{t("schedules.deleteTitle")}</Dialog.Title>
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
                  <FiAlertTriangle size={18} color="var(--sw-pink-dark)" />
                </Box>
                <Text fontSize="sm" color="var(--sw-fg-muted)">
                  {t("schedules.deleteConfirm", { label: pendingDelete?.label ?? "", time: pendingDelete?.start_time ?? "" })}
                </Text>
              </HStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button className="sw-btn" variant="ghost" size="sm" onClick={() => setPendingDelete(null)}>{t("common.cancel")}</Button>
              <Button className="sw-btn sw-btn-danger" variant="ghost" size="sm" onClick={confirmDelete}>
                <Box as={FiTrash2} /> {t("common.delete")}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}
