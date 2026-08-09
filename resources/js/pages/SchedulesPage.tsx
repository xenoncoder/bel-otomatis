import { useEffect, useState } from "react";
import { useSchedules } from "@/hooks/useSchedules";
import ScheduleTable from "@/components/ScheduleTable";
import BellSoundPicker from "@/components/BellSoundPicker";
import TimePicker from "@/components/TimePicker";
import DatePicker from "@/components/DatePicker";
import { api } from "@/lib/api";
import { toaster } from "@/lib/toaster";
import type { BellSound, Recurrence, Schedule } from "@/lib/types";
import {
  Box, Button, Dialog, Field, HStack, Flex, Heading, Input, Switch, Tabs, Text, VStack, IconButton
} from "@chakra-ui/react";
import { FiPlus, FiCalendar, FiRepeat, FiClock, FiX, FiSettings, FiVolume2, FiEdit2, FiSave, FiPlay, FiSquare } from "react-icons/fi";
import CloseButton from "@/components/CloseButton";
import BackgroundOrnament from "@/components/BackgroundOrnament";
import { useT } from "@/lib/i18n";

const days = [
  { value: "monday" },
  { value: "tuesday" },
  { value: "wednesday" },
  { value: "thursday" },
  { value: "friday" },
  { value: "saturday" },
  { value: "sunday" },
];

type RepeatMode = "once_play" | "count" | "loop";

interface ScheduleForm {
  start_time: string;
  label: string;
  is_active: boolean;
  bell_sound_id: string;
  recurrence: Recurrence;
  days: string[];
  specific_date: string;
  start_date: string;
  end_date: string;
  repeat_mode: RepeatMode;
  repeat_count: string;
}

const emptyForm: ScheduleForm = {
  start_time: "07:00:00",
  label: "",
  is_active: true,
  bell_sound_id: "",
  recurrence: "weekly",
  days: [],
  specific_date: "",
  start_date: "",
  end_date: "",
  repeat_mode: "once_play",
  repeat_count: "3",
};

function DayMultiSelect({ selected, onChange }: { selected: string[]; onChange: (days: string[]) => void }) {
  const t = useT();
  const dayShort: Record<string, string> = {
    monday: t("schedules.daysShort.monday"), tuesday: t("schedules.daysShort.tuesday"), wednesday: t("schedules.daysShort.wednesday"),
    thursday: t("schedules.daysShort.thursday"), friday: t("schedules.daysShort.friday"), saturday: t("schedules.daysShort.saturday"), sunday: t("schedules.daysShort.sunday"),
  };

  const toggle = (day: string) => {
    if (selected.includes(day)) {
      onChange(selected.filter((d) => d !== day));
    } else {
      onChange([...selected, day]);
    }
  };
  return (
    <HStack gap={1.5} wrap="wrap">
      {days.map((d) => {
        const isActive = selected.includes(d.value);
        return (
          <Box
            key={d.value}
            as="button"
            onClick={() => toggle(d.value)}
            px={3} py={1.5}
            borderRadius="var(--sw-radius)"
            border="1px solid var(--sw-border-color)"
            bg={isActive ? "var(--sw-pink-normal)" : "var(--sw-bg-panel)"}
            color={isActive ? "#ffffff" : "var(--sw-fg)"}
            fontWeight={isActive ? "700" : "600"}
            fontSize="sm"
            fontFamily="'Comfortaa', sans-serif"
            cursor="pointer"
            boxShadow={isActive ? "0.15rem 0.15rem 0 var(--sw-shadow-color)" : "0.1rem 0.1rem 0 var(--sw-shadow-color)"}
            _hover={{ bg: isActive ? "var(--sw-pink-light)" : "var(--sw-bg-hover)" }}
            transition="all 0.15s"
          >
            {dayShort[d.value]}
          </Box>
        );
      })}
      {selected.length > 0 && (
        <Button variant="ghost" size="xs" colorPalette="red" onClick={() => onChange([])}>
          <FiX /> {t("common.reset")}
        </Button>
      )}
    </HStack>
  );
}

export default function SchedulesPage() {
  const t = useT();
  const { schedules, loading, reload } = useSchedules();
  const [activeDay, setActiveDay] = useState("monday");
  const [sounds, setSounds] = useState<BellSound[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState<ScheduleForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const dayLabel: Record<string, string> = {
    monday: t("schedules.days.monday"), tuesday: t("schedules.days.tuesday"), wednesday: t("schedules.days.wednesday"),
    thursday: t("schedules.days.thursday"), friday: t("schedules.days.friday"), saturday: t("schedules.days.saturday"), sunday: t("schedules.days.sunday"),
  };

  const recurrenceOptions: { value: Recurrence; label: string; icon: typeof FiRepeat }[] = [
    { value: "once", label: t("schedules.recurrence.once"), icon: FiCalendar },
    { value: "daily", label: t("schedules.recurrence.daily"), icon: FiClock },
    { value: "weekly", label: t("schedules.recurrence.weekly"), icon: FiRepeat },
    { value: "yearly", label: t("schedules.recurrence.yearly"), icon: FiCalendar },
  ];

  // Edit state
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<ScheduleForm | null>(null);
  const [editAdvanced, setEditAdvanced] = useState(false);
  const [isCopy, setIsCopy] = useState(false);

  useEffect(() => {
    api.bellSounds.list().then(setSounds).catch(() => {});
  }, []);

  const set = <K extends keyof ScheduleForm>(key: K, value: ScheduleForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const filtered = schedules.filter((s) => {
    if (s.days && s.days.length > 0) return s.days.includes(activeDay);
    if (s.recurrence === "daily") return true;
    return s.day === activeDay;
  });

  const buildPayload = (f: ScheduleForm) => ({
    start_time: f.start_time,
    end_time: null,
    label: f.label,
    is_active: f.is_active,
    bell_sound_id: f.bell_sound_id ? Number(f.bell_sound_id) : null,
    recurrence: f.recurrence,
    days: (f.recurrence === "daily" || f.recurrence === "weekly") ? f.days : null,
    specific_date: f.specific_date || null,
    start_date: f.start_date || null,
    end_date: f.end_date || null,
    repeat_count: f.repeat_mode === "count" ? Number(f.repeat_count) : null,
    loop_until_stopped: f.repeat_mode === "loop",
  });

  const handleAdd = async () => {
    if (!form.label.trim()) { toaster.create({ title: t("schedules.labelRequired"), type: "warning" }); return; }
    if ((form.recurrence === "once" || form.recurrence === "yearly") && !form.specific_date) {
      toaster.create({ title: t("schedules.dateRequired"), type: "warning" }); return;
    }
    if (form.recurrence === "weekly" && form.days.length === 0) {
      toaster.create({ title: t("schedules.minDayRequired"), type: "warning" }); return;
    }
    setSaving(true);
    try {
      await api.schedules.create(buildPayload(form));
      toaster.create({ title: t("schedules.added"), type: "success" });
      setForm({ ...emptyForm });
      await reload();
    } catch (e) { toaster.create({ title: (e as Error).message, type: "error" }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.schedules.delete(id);
      toaster.create({ title: t("schedules.deleted"), type: "success" });
      await reload();
    } catch (e) { toaster.create({ title: (e as Error).message, type: "error" }); }
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setEditForm({
      start_time: schedule.start_time,
      label: schedule.label,
      is_active: schedule.is_active,
      bell_sound_id: schedule.bell_sound_id ? String(schedule.bell_sound_id) : "",
      recurrence: schedule.recurrence,
      days: schedule.days ?? [],
      specific_date: schedule.specific_date ?? "",
      start_date: schedule.start_date ?? "",
      end_date: schedule.end_date ?? "",
      repeat_mode: schedule.loop_until_stopped ? "loop" : schedule.repeat_count ? "count" : "once_play",
      repeat_count: schedule.repeat_count ? String(schedule.repeat_count) : "3",
    });
    setEditAdvanced(!!(schedule.start_date || schedule.end_date));
  };

  const handleCopy = (schedule: Schedule) => {
    setIsCopy(true);
    setEditingSchedule(schedule);
    setEditForm({
      start_time: schedule.start_time,
      label: schedule.label + " (Copy)",
      is_active: schedule.is_active,
      bell_sound_id: schedule.bell_sound_id ? String(schedule.bell_sound_id) : "",
      recurrence: schedule.recurrence,
      days: schedule.days ?? [],
      specific_date: schedule.specific_date ?? "",
      start_date: schedule.start_date ?? "",
      end_date: schedule.end_date ?? "",
      repeat_count: String(schedule.repeat_count ?? 1),
            repeat_mode: schedule.loop_until_stopped ? "loop" : "count",
    });
    setEditAdvanced(!!(schedule.start_date || schedule.end_date));
  };

  const handleEditSave = async () => {
    if (!editingSchedule || !editForm) return;
    if (editForm.recurrence === "weekly" && editForm.days.length === 0) {
      toaster.create({ title: t("schedules.minDayRequired"), type: "warning" }); return;
    }
    try {
      await api.schedules.update(editingSchedule.id, buildPayload(editForm));
      toaster.create({ title: t("schedules.updated"), type: "success" });
      setEditingSchedule(null);
      setEditForm(null);
      await reload();
    } catch (e) { toaster.create({ title: (e as Error).message, type: "error" }); }
  };

  const setEdit = <K extends keyof ScheduleForm>(key: K, value: ScheduleForm[K]) =>
    setEditForm((f) => f ? ({ ...f, [key]: value }) : f);

  const renderForm = (f: ScheduleForm, setter: typeof set, advanced: boolean, setAdvanced: (v: boolean) => void) => (
    <VStack gap={5} align="stretch">
      {/* Section 1: Waktu & Label */}
      <Box
        p={4}
        borderRadius="var(--sw-radius)"
        bg="var(--sw-bg-muted)"
        border="1px solid var(--sw-border-color)"
      >
        <HStack gap={2} mb={3}>
          <Box w={6} h={6} borderRadius="var(--sw-radius)" bg="var(--sw-purple-normal)" border="1px solid var(--sw-border-color)" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
            <FiClock size={12} color="#ffffff" />
          </Box>
          <Text fontSize="xs" fontFamily="'Comfortaa', sans-serif" fontWeight="800" color="var(--sw-fg)" textTransform="uppercase" letterSpacing="0.03em">
            {t("schedules.sectionTimeLabel")}
          </Text>
        </HStack>
        <Flex gap={3} align="flex-start" direction={{ base: "column", sm: "row" }} flexWrap="wrap">
          <Field.Root w={{ base: "full", sm: "180px" }} flexShrink={0}>
            <TimePicker label={t("schedules.startTime")} value={f.start_time} onChange={(v) => setter("start_time", v)} />
          </Field.Root>
          <Field.Root flex={1} w={{ base: "full", sm: "auto" }} minW={0}>
            <Field.Label fontSize="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="700"
                    flexShrink={0}
                    whiteSpace="nowrap"
                    justifyContent="center">{t("common.label")}</Field.Label>
            <Input
              placeholder={t("schedules.labelPlaceholder")}
              border="1px solid var(--sw-border-color)"
              borderRadius="var(--sw-radius)"
              bg="var(--sw-bg-panel)"
              h="38px"
              value={f.label}
              onChange={(e) => setter("label", e.target.value)}
            />
          </Field.Root>
        </Flex>
      </Box>

      {/* Section 2: Pengulangan */}
      <Box
        p={4}
        borderRadius="var(--sw-radius)"
        bg="var(--sw-bg-muted)"
        border="1px solid var(--sw-border-color)"
      >
        <HStack gap={2} mb={3}>
          <Box w={6} h={6} borderRadius="var(--sw-radius)" bg="var(--sw-blue-normal)" border="1px solid var(--sw-border-color)" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
            <FiRepeat size={12} color="#ffffff" />
          </Box>
          <Text fontSize="xs" fontFamily="'Comfortaa', sans-serif" fontWeight="800" color="var(--sw-fg)" textTransform="uppercase" letterSpacing="0.03em">
            {t("schedules.sectionRecurrence")}
          </Text>
        </HStack>
        <VStack gap={3} align="stretch">
          <HStack gap={2} wrap="wrap">
            {recurrenceOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = f.recurrence === opt.value;
              return (
                <Box
                  key={opt.value}
                  as="button"
                  onClick={() => setter("recurrence", opt.value)}
                  px={3} py={{ base: 1.5, md: 2 }}
                  borderRadius="var(--sw-radius)"
                  border="1px solid var(--sw-border-color)"
                  bg={isActive ? "var(--sw-purple-normal)" : "var(--sw-bg-panel)"}
                  color={isActive ? "#ffffff" : "var(--sw-fg)"}
                  fontWeight={isActive ? "700" : "600"}
                  fontSize="sm"
                  fontFamily="'Comfortaa', sans-serif"
                  cursor="pointer"
                  boxShadow={isActive ? "0.15rem 0.15rem 0 var(--sw-shadow-color)" : "0.1rem 0.1rem 0 var(--sw-shadow-color)"}
                  transition="all 0.15s"
                  display="flex" alignItems="center" gap={1.5}
                >
                  <Icon size={12} />
                  {opt.label}
                </Box>
              );
            })}
          </HStack>

          {(f.recurrence === "daily" || f.recurrence === "weekly") && (
            <Box>
              <Text fontSize="xs" color="var(--sw-fg-muted)" mb={2} fontFamily="'IBM Plex Mono', monospace" fontWeight="600">
                {f.recurrence === "daily" ? t("schedules.selectDaysDaily") : t("schedules.selectDaysWeekly")}
              </Text>
              <DayMultiSelect selected={f.days} onChange={(d) => setter("days", d)} />
            </Box>
          )}

          {(f.recurrence === "once" || f.recurrence === "yearly") && (
            <Field.Root w={{ base: "full", sm: "280px" }}>
              <DatePicker
                label={f.recurrence === "once" ? t("schedules.dateLabel") : t("schedules.dateLabelYearly")}
                value={f.specific_date}
                onChange={(v) => setter("specific_date", v)}
              />
            </Field.Root>
          )}
        </VStack>
      </Box>

      {/* Section 3: Suara & Pemutaran */}
      <Box
        p={4}
        borderRadius="var(--sw-radius)"
        bg="var(--sw-bg-muted)"
        border="1px solid var(--sw-border-color)"
      >
        <HStack gap={2} mb={3}>
          <Box w={6} h={6} borderRadius="var(--sw-radius)" bg="var(--sw-pink-normal)" border="1px solid var(--sw-border-color)" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
            <FiVolume2 size={12} color="#ffffff" />
          </Box>
          <Text fontSize="xs" fontFamily="'Comfortaa', sans-serif" fontWeight="800" color="var(--sw-fg)" textTransform="uppercase" letterSpacing="0.03em">
            {t("schedules.sectionSound")}
          </Text>
        </HStack>
        <VStack gap={3} align="stretch">
            <Field.Root w={{ base: "full", sm: "350px" }}>
              <Field.Label fontSize="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="700"
                    flexShrink={0}
                    whiteSpace="nowrap"
                    justifyContent="center">{t("schedules.bellSound")}</Field.Label>
              <HStack gap={2} w="full">
                <Box flex={1}>
                  <BellSoundPicker
                    value={f.bell_sound_id}
                    onChange={(id) => setter("bell_sound_id", id)}
                    sounds={sounds}
                  />
                </Box>
                  <IconButton 
                    aria-label="Preview Sound"
                    className={isPlayingPreview ? "sw-btn sw-btn-danger" : "sw-btn sw-btn-success"}
                    variant="ghost"
                    onClick={() => {
                    if (isPlayingPreview && previewAudio) {
                      previewAudio.pause();
                      previewAudio.currentTime = 0;
                      setIsPlayingPreview(false);
                    } else {
                      const sound = sounds.find(s => String(s.id) === String(f.bell_sound_id));
                      if (sound && sound.url) {
                        const audio = new Audio(sound.url);
                        setPreviewAudio(audio);
                        audio.onended = () => setIsPlayingPreview(false);
                        audio.play().then(() => setIsPlayingPreview(true)).catch(() => toaster.create({ title: "Gagal memutar audio", type: "error" }));
                      }
                    }
                  }}
                  disabled={!f.bell_sound_id}
                >
                  {isPlayingPreview ? <FiSquare /> : <FiPlay />}
                </IconButton>
              </HStack>
            </Field.Root>

          <Field.Root>
            <Field.Label fontSize="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="700"
                    flexShrink={0}
                    whiteSpace="nowrap"
                    justifyContent="center">{t("schedules.playMode")}</Field.Label>
            <HStack gap={2} wrap="wrap">
              {[
                { value: "once_play" as RepeatMode, label: t("schedules.playOnce") },
                { value: "count" as RepeatMode, label: t("schedules.playRepeat") },
                { value: "loop" as RepeatMode, label: t("schedules.playLoop") },
              ].map((opt) => {
                const isActive = f.repeat_mode === opt.value;
                return (
                  <Box
                    key={opt.value}
                    as="button"
                    onClick={() => setter("repeat_mode", opt.value)}
                    px={3} py={1.5}
                    borderRadius="var(--sw-radius)"
                    border="1px solid var(--sw-border-color)"
                    bg={isActive ? "var(--sw-green-normal)" : "var(--sw-bg-panel)"}
                    color={isActive ? "#ffffff" : "var(--sw-fg)"}
                    fontWeight={isActive ? "700" : "600"}
                    fontSize="sm"
                    fontFamily="'Comfortaa', sans-serif"
                    cursor="pointer"
                    boxShadow={isActive ? "0.15rem 0.15rem 0 var(--sw-shadow-color)" : "0.1rem 0.1rem 0 var(--sw-shadow-color)"}
                    _hover={{ bg: isActive ? "var(--sw-green-light)" : "var(--sw-bg-hover)" }}
                    transition="all 0.15s"
                  >
                    {opt.label}
                  </Box>
                );
              })}
            </HStack>
          </Field.Root>

          {f.repeat_mode === "count" && (
            <Field.Root w="100px">
              <Field.Label fontSize="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="700"
                    flexShrink={0}
                    whiteSpace="nowrap"
                    justifyContent="center">{t("schedules.repeatCount")}</Field.Label>
              <Input
                type="number"
                min={1}
                border="1px solid var(--sw-border-color)"
                borderRadius="var(--sw-radius)"
                bg="var(--sw-bg-panel)"
                h="38px"
                textAlign="center"
                fontFamily="'IBM Plex Mono', monospace"
                fontWeight="700"
                    flexShrink={0}
                    whiteSpace="nowrap"
                    justifyContent="center"
                value={f.repeat_count}
                onChange={(e) => setter("repeat_count", e.target.value)}
              />
            </Field.Root>
          )}
        </VStack>
      </Box>

      {/* Section 4: Advanced */}
      <Box>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setAdvanced(!advanced)}
          fontFamily="'Comfortaa', sans-serif"
          fontWeight="700"
                    flexShrink={0}
                    whiteSpace="nowrap"
                    justifyContent="center"
          color="var(--sw-fg-muted)"
        >
          <FiSettings size={12} />
          {advanced ? t("schedules.hideAdvanced") : t("schedules.showAdvanced")}
        </Button>
        {advanced && (
          <Box mt={3} p={4} borderRadius="var(--sw-radius)" bg="var(--sw-bg-muted)" border="1px solid var(--sw-border-color)">
            <VStack gap={4} align="stretch">
              <HStack gap={4} align="flex-start" wrap="wrap">
                <Field.Root w={{ base: "full", sm: "200px" }}>
                  <DatePicker
                    label={t("schedules.activeFrom")}
                    value={f.start_date}
                    onChange={(v) => setter("start_date", v)}
                  />
                </Field.Root>
                <Field.Root w={{ base: "full", sm: "200px" }}>
                  <DatePicker
                    label={t("schedules.activeUntil")}
                    value={f.end_date}
                    onChange={(v) => setter("end_date", v)}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label fontSize="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="700"
                    flexShrink={0}
                    whiteSpace="nowrap"
                    justifyContent="center">{t("schedules.status")}</Field.Label>
                  <Switch.Root
                    checked={f.is_active}
                    onCheckedChange={(e) => setter("is_active", e.checked)}
                  >
                    <Switch.HiddenInput />
                    <Switch.Control />
                    <Switch.Label />
                  </Switch.Root>
                </Field.Root>
                {(f.start_date || f.end_date) && (
                  <Button
                    variant="ghost"
                    size="xs"
                    colorPalette="red"
                    onClick={() => { setter("start_date", ""); setter("end_date", ""); }}
                  >
                    <FiX /> {t("schedules.resetDates")}
                  </Button>
                )}
              </HStack>
            </VStack>
          </Box>
        )}
      </Box>
    </VStack>
  );

  return (
    <Box position="relative">
      <BackgroundOrnament variant="normal" />
      <VStack gap={6} align="stretch" position="relative" zIndex={1}>
      <Heading size={{ base: "xl", md: "2xl" }} fontFamily="'Comfortaa', sans-serif" fontWeight="300" color="var(--sw-fg-heading)">
        {t("schedules.title")}
      </Heading>

      {/* Add Schedule */}
      <Box className="sw-card" borderRadius="var(--sw-radius)">
        <Box className="sw-card-header">
          <Heading size="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="800">{t("schedules.addCard")}</Heading>
        </Box>
        <Box className="sw-card-body" p={{ base: 4, md: 6 }}>
          {renderForm(form, set, showAdvanced, setShowAdvanced)}
          {sounds.length === 0 && (
            <Text fontSize="xs" color="var(--sw-fg-subtle)" fontFamily="'IBM Plex Mono', monospace" mt={4}>
              {t("schedules.noBellSound")}
            </Text>
          )}
          <Button
            bg="var(--sw-green-normal)"
            color="#ffffff"
            onClick={handleAdd}
            loading={saving}
            alignSelf="flex-start"
            size="sm"
            mt={5}
            gap={2}
            borderRadius="var(--sw-radius)"
            boxShadow="0.2rem 0.2rem 0 var(--sw-shadow-color)"
            _hover={{ transform: "translate(-2px, -2px)", boxShadow: "0.3rem 0.3rem 0 var(--sw-shadow-color)" }}
            _active={{ transform: "translate(0, 0)", boxShadow: "0.1rem 0.1rem 0 var(--sw-shadow-color)" }}
            transition="all 0.2s"
          >
            <FiPlus size={14} /> {t("schedules.add")}
          </Button>
        </Box>
      </Box>

      {/* Schedule list */}
      <Box className="sw-card" borderRadius="var(--sw-radius)">
        <Box className="sw-card-header sw-card-header-green">
          <Heading size="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="800">{t("schedules.list")}</Heading>
        </Box>
        <Box className="sw-card-body" p={{ base: 4, md: 6 }}>
          <Tabs.Root value={activeDay} onValueChange={(e) => setActiveDay(e.value)}>
            <Tabs.List
                display="flex"
                flexWrap="nowrap"
                overflowX="auto"
                bg="var(--sw-bg-card)"
                p={1.5}
                borderRadius="var(--sw-radius)"
                border="1px solid var(--sw-border-color)"
                boxShadow="0.2rem 0.2rem 0 var(--sw-shadow-color)"
                gap={2}
                css={{ 
                  "&::-webkit-scrollbar": { display: "none" }, 
                  scrollbarWidth: "none", 
                  WebkitOverflowScrolling: "touch" 
                }}
              >
              {days.map((d) => (
                <Tabs.Trigger
                  key={d.value}
                  value={d.value}
                  px={{ base: 3, md: 4 }}
                  py={{ base: 1.5, md: 2 }}
                  borderRadius="var(--sw-radius)"
                  fontWeight="700"
                    flexShrink={0}
                    whiteSpace="nowrap"
                    justifyContent="center"
                  fontFamily="'Comfortaa', sans-serif"
                  color="var(--sw-fg)"
                  _selected={{ bg: "var(--sw-purple-normal)", color: "#ffffff", boxShadow: "0.2rem 0.2rem 0 var(--sw-shadow-color)", transform: "translate(-2px, -2px)" }}
                  _hover={{ bg: "var(--sw-bg-hover)" }}
                  transition="all 0.2s"
                  display="flex"
                  alignItems="center"
                  gap={2}
                >
                  <FiCalendar />
                  {dayLabel[d.value]}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            <Box mt={5}>
              <Text fontSize="sm" color="var(--sw-fg-muted)" mb={3} fontFamily="'IBM Plex Mono', monospace">
                {t("schedules.schedulesForDay", { count: filtered.length, day: dayLabel[activeDay] ?? "" })}
              </Text>
              <ScheduleTable schedules={filtered} loading={loading} onDelete={handleDelete} onEdit={handleEdit} onCopy={handleCopy} />
            </Box>
          </Tabs.Root>
        </Box>
      </Box>

      {/* Edit Dialog */}
      <Dialog.Root open={!!editingSchedule} onOpenChange={(e) => { if (!e.open) { setEditingSchedule(null); setEditForm(null); setIsCopy(false); } }} placement="center" size="xl">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            maxW={{ base: "calc(100vw - 2rem)", md: "600px" }}
            maxH="calc(100vh - 4rem)"
            display="flex"
            flexDir="column"
          >
            <Box className="sw-dialog-strip sw-dialog-strip-blue" flexShrink={0} />
            <Dialog.Header flexShrink={0}>
              <HStack gap={2}>
                <FiEdit2 size={16} color="var(--sw-blue-normal)" />
                <Dialog.Title>{t("schedules.editTitle")}</Dialog.Title>
              </HStack>
              <Dialog.CloseTrigger asChild>
                <CloseButton />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body overflowY="auto" flex={1}>
              {editForm && renderForm(editForm, setEdit, editAdvanced, setEditAdvanced)}
            </Dialog.Body>
            <Dialog.Footer flexShrink={0}>
              <Button
                  bg="var(--sw-blue-normal)"
                  color="#ffffff"
                  size="sm"
                  onClick={handleEditSave}
                  borderRadius="var(--sw-radius)"
                  boxShadow="0.2rem 0.2rem 0 var(--sw-shadow-color)"
                  _hover={{ transform: "translate(-2px, -2px)", boxShadow: "0.3rem 0.3rem 0 var(--sw-shadow-color)", bg: "var(--sw-blue-dark)" }}
                  _active={{ transform: "translate(0, 0)", boxShadow: "0.1rem 0.1rem 0 var(--sw-shadow-color)" }}
                  transition="all 0.2s"
                >
                <Box as={FiSave} /> {t("schedules.saveChanges")}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </VStack>
    </Box>
  );
}
