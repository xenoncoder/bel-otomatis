import { useState, useRef } from "react";
import { FiTrash2, FiEdit2, FiCalendar, FiClock, FiRepeat, FiAlertTriangle, FiPlay, FiSquare, FiCopy, FiX } from "react-icons/fi";
import type { Recurrence, Schedule } from "@/lib/types";
import { useT, useLang } from "@/lib/i18n";
import { DataTable, type Column } from "@/components/DataTable";
import { GlassButton } from "./ui/GlassComponents";
import { GlassModal } from "./ui/GlassModal";

interface ScheduleTableProps {
  schedules: Schedule[];
  loading: boolean;
  onEdit: (schedule: Schedule) => void;
  onSelectionChange: (ids: number[]) => void;
  selectedIds: number[];
  error?: any;
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
    <button
      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
        playing ? "bg-rose-500 text-white shadow-lg shadow-rose-500/50" : "bg-indigo-500 text-white shadow-md shadow-indigo-500/30 hover:bg-indigo-400"
      }`}
      onClick={toggle}
      title={playing ? "Stop preview" : "Play preview"}
    >
      {playing ? <FiSquare size={10} /> : <FiPlay size={10} className="ml-0.5" />}
    </button>
  );
};

export default function ScheduleTable({ schedules, loading, onEdit, onSelectionChange, selectedIds }: ScheduleTableProps) {
  const t = useT();
  const { lang } = useLang();
  const locale = lang === "id" ? "id-ID" : "en-GB";

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const columns: Column<Schedule>[] = [
    {
      key: "select",
      label: "",
      render: (s) => (
        <input 
          type="checkbox" 
          checked={selectedIds.includes(s.id)}
          onChange={() => toggleSelect(s.id)}
          className="w-4 h-4 rounded border-white/20 bg-black/10 dark:bg-white/10 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
        />
      ),
    },
    {
      key: "start",
      label: t("table.start"),
      sortValue: (s) => s.start_time,
      render: (s) => (
        <span className="font-body font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
          {s.start_time}
        </span>
      ),
    },
    {
      key: "label",
      label: t("common.label"),
      sortValue: (s) => s.label,
      render: (s) => (
        <span className="font-heading font-bold text-gray-800 dark:text-gray-100">{s.label}</span>
      ),
    },
    {
      key: "sound",
      label: t("table.sound"),
      render: (s) => (
        <div className="flex items-center gap-2">
          <AudioPreviewButton url={s.bell_sound?.url ?? "/sounds/bell.mp3"} />
          <span className="text-xs text-gray-500 font-bold whitespace-nowrap truncate max-w-[120px]">
            {s.bell_sound?.name ?? t("common.default")}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      label: t("common.status"),
      render: (s) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          s.is_active ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30" : "bg-gray-500/20 text-gray-700 dark:text-gray-300 border border-gray-500/30"
        }`}>
          {s.is_active ? t("common.active") : t("common.inactive")}
        </span>
      ),
    },
    {
      key: "aksi",
      label: t("common.action"),
      align: "center",
      render: (s) => (
        <div className="flex justify-center">
          <button
            title={t("table.editSchedule")}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/50 dark:bg-white/10 hover:bg-indigo-500 hover:text-white text-indigo-600 dark:text-indigo-400 transition-colors shadow-sm"
            onClick={() => onEdit(s)}
          >
            <FiEdit2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={schedules}
      loading={loading}
      rowKey={(s) => s.id}
      pageSize={8}
      footerLabel={(count) => t("table.totalSchedules", { count })}
      emptyContent={
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-gray-500">
          <FiCalendar size={32} className="opacity-40" />
          <p className="text-sm font-bold">{t("table.noSchedules")}</p>
        </div>
      }
    />
  );
}
