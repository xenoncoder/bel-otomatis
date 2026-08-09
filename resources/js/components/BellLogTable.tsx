import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { BellLog } from "@/lib/types";
import { FiActivity, FiBell } from "react-icons/fi";
import { useT, useLang } from "@/lib/i18n";
import { useTimeFormat } from "@/lib/time-format";
import { GlassBadge } from "./ui/GlassComponents";

export default function BellLogTable({ refreshKey = 0 }: { refreshKey?: number }) {
  const t = useT();
  const { lang } = useLang();
  const timeFormat = useTimeFormat();
  const locale = lang === "id" ? "id-ID" : "en-GB";
  const [logs, setLogs] = useState<BellLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try { setLogs(await api.bellLogs.list(10)); } finally { setLoading(false); }
    };
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3 text-gray-500">
        <FiActivity size={24} className="opacity-40 animate-pulse" />
        <p className="text-sm font-bold">{t("bellLog.loading")}</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3 text-gray-500">
        <FiBell size={24} className="opacity-40" />
        <p className="text-sm font-bold">{t("bellLog.empty")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="flex flex-col max-h-[300px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-transparent">
        {logs.map((log, i) => (
          <div
            key={log.id}
            className={`flex items-center gap-3 px-4 py-3 transition-colors ${
              i % 2 === 0 ? "bg-black/5 dark:bg-white/5" : "bg-transparent"
            } hover:bg-black/10 dark:hover:bg-white/10 ${
              i < logs.length - 1 ? "border-b border-white/10 dark:border-white/5" : ""
            }`}
          >
            <div
              className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center border shadow-inner ${
                log.status === "manual"
                  ? "bg-amber-500/80 border-amber-400 text-white"
                  : "bg-emerald-500/80 border-emerald-400 text-white"
              }`}
            >
              <FiBell size={14} />
            </div>
            
            <div className="flex flex-col items-start flex-1 min-w-0">
              <p className="text-sm font-bold font-heading text-gray-800 dark:text-gray-100 truncate w-full">
                {log.schedule?.label ?? t("bellLog.bell")}
              </p>
              <p className="text-[10px] font-body text-gray-500 whitespace-nowrap uppercase tracking-widest mt-0.5">
                {new Date(log.triggered_at).toLocaleString(locale, {
                  day: "2-digit", month: "short",
                  hour: "2-digit", minute: "2-digit",
                  hour12: timeFormat === "12",
                  timeZone: "Asia/Jakarta",
                })}
              </p>
            </div>
            
            <GlassBadge color={log.status === "manual" ? "yellow" : "green"} className="shrink-0">
              {t("logStatus." + log.status)}
            </GlassBadge>
          </div>
        ))}
      </div>
    </div>
  );
}
