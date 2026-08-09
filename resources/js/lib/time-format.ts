import { useSettings } from "@/hooks/useSettings";

export function useTimeFormat() {
  const { settings } = useSettings();
  return settings?.time_format === "12" ? "12" : "24";
}

export function formatTimeString(timeStr: string | undefined, format: "12" | "24"): string {
  if (!timeStr) return "-";
  const parts = timeStr.split(":");
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  const s = parseInt(parts[2], 10) || 0;

  if (format === "12") {
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    const mm = String(m).padStart(2, "0");
    const ss = s > 0 ? `:${String(s).padStart(2, "0")}` : "";
    return `${h12}:${mm}${ss} ${period}`;
  }

  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const ss = s > 0 ? `:${String(s).padStart(2, "0")}` : "";
  return `${hh}:${mm}${ss}`;
}
