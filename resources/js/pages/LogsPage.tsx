import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { BellLog } from "@/lib/types";
import { FiActivity, FiTrash2, FiAlertTriangle, FiFileText } from "react-icons/fi";
import { useT, useLang } from "@/lib/i18n";
import { useTimeFormat } from "@/lib/time-format";
import { useToast } from "@/components/ui/ToastProvider";
import { DataTable, type Column } from "@/components/DataTable";
import { GlassCard, GlassButton, GlassBadge } from "@/components/ui/GlassComponents";
import { GlassModal } from "@/components/ui/GlassModal";

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
  const { toast } = useToast();

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
      toast({ title: t("logs.deleted"), type: "success" });
      setDeleteTarget(null);
      setRefreshKey((n) => n + 1);
    } catch (e) {
      toast({ title: (e as Error).message, type: "error" });
    }
  };

  const handleClearAll = async () => {
    try {
      await api.bellLogs.clearAll();
      toast({ title: t("logs.allCleared"), type: "success" });
      setClearOpen(false);
      setRefreshKey((n) => n + 1);
    } catch (e) {
      toast({ title: (e as Error).message, type: "error" });
    }
  };

  const columns: Column<BellLog>[] = [
    {
      key: "waktu",
      label: t("table.waktu"),
      sortValue: (log) => log.triggered_at,
      render: (log) => (
        <span className="font-body text-xs font-bold text-gray-500 whitespace-nowrap uppercase tracking-widest">
          {new Date(log.triggered_at).toLocaleString(locale, {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit", second: "2-digit",
            hour12: timeFormat === "12",
            timeZone: "Asia/Jakarta",
          })}
        </span>
      ),
    },
    {
      key: "hari",
      label: t("table.hari"),
      render: (log) => (
        <span className="capitalize font-bold text-sm whitespace-nowrap text-gray-700 dark:text-gray-300">
          {log.schedule?.day ? (dayLabel[log.schedule.day] ?? log.schedule.day) : "-"}
        </span>
      ),
    },
    {
      key: "label",
      label: t("common.label"),
      sortValue: (log) => log.schedule?.label ?? "",
      render: (log) => (
        <span className="font-heading font-black text-gray-800 dark:text-gray-100">
          {log.schedule?.label ?? "-"}
        </span>
      ),
    },
    {
      key: "jam",
      label: t("table.jam"),
      render: (log) => (
        <span className="font-body font-black text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
          {log.schedule?.start_time ?? "-"}
        </span>
      ),
    },
    {
      key: "status",
      label: t("common.status"),
      render: (log) => (
        <GlassBadge color={log.status === "manual" ? "yellow" : "green"}>
          {t("logStatus." + log.status)}
        </GlassBadge>
      ),
    },
    {
      key: "aksi",
      label: t("common.action"),
      align: "center",
      render: (log) => (
        <div className="flex justify-center">
          <button
            title={t("common.delete")}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/50 dark:bg-white/10 hover:bg-rose-500 hover:text-white text-rose-600 dark:text-rose-400 transition-colors shadow-sm"
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(log); }}
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="relative max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-purple-500/20">
            <FiFileText size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-gray-800 dark:text-gray-100">
              {t("logs.title")}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {logs.length > 0 && (
            <GlassButton variant="danger" onClick={() => setClearOpen(true)} className="flex-1 md:flex-none">
              <FiTrash2 /> {t("logs.clearAll")}
            </GlassButton>
          )}
        </div>
      </div>

      <GlassCard className="!p-0 overflow-hidden flex flex-col">
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-4">
          <h2 className="font-heading font-bold text-lg text-emerald-800 dark:text-emerald-300">
            {t("logs.history")}
          </h2>
        </div>
        <div className="p-4 md:p-6 bg-black/5 dark:bg-white/5">
          <DataTable
            columns={columns}
            data={logs}
            loading={loading}
            rowKey={(log) => log.id}
            pageSize={10}
            footerLabel={(count) => t("table.totalLogs", { count })}
            emptyContent={
              <div className="flex flex-col gap-2 items-center justify-center py-10 text-gray-500">
                <FiActivity size={32} className="opacity-40 animate-pulse" />
                <p className="font-bold text-sm">{t("table.noActivity")}</p>
              </div>
            }
          />
        </div>
      </GlassCard>

      {/* Delete single log dialog */}
      <GlassModal 
        isOpen={!!deleteTarget} 
        onClose={() => setDeleteTarget(null)} 
        title={t("logs.deleteTitle")}
        footer={
          <>
            <GlassButton variant="ghost" onClick={() => setDeleteTarget(null)}>{t("common.cancel")}</GlassButton>
            <GlassButton variant="danger" onClick={handleDelete}><FiTrash2 /> {t("common.delete")}</GlassButton>
          </>
        }
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
            <FiAlertTriangle size={24} />
          </div>
          <p className="font-bold text-gray-800 dark:text-gray-200 mt-2">
            {t("logs.deleteConfirm")}
          </p>
        </div>
      </GlassModal>

      {/* Clear all logs dialog */}
      <GlassModal 
        isOpen={clearOpen} 
        onClose={() => setClearOpen(false)} 
        title={t("logs.clearAllTitle")}
        footer={
          <>
            <GlassButton variant="ghost" onClick={() => setClearOpen(false)}>{t("common.cancel")}</GlassButton>
            <GlassButton variant="danger" onClick={handleClearAll}><FiTrash2 /> {t("logs.clearAll")}</GlassButton>
          </>
        }
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
            <FiAlertTriangle size={24} />
          </div>
          <p className="font-bold text-gray-800 dark:text-gray-200 mt-2">
            {t("logs.clearAllConfirm", { count: logs.length })}
          </p>
        </div>
      </GlassModal>
    </div>
  );
}
