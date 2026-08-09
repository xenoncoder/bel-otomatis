import { useEffect, useState } from "react";
import { FiClock } from "react-icons/fi";
import { useLang } from "@/lib/i18n";
import { useTimeFormat } from "@/lib/time-format";
import { GlassBadge } from "./ui/GlassComponents";

const TZ = "Asia/Jakarta";

export default function DigitalClock() {
  const { lang } = useLang();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeFormat = useTimeFormat();
  const locale = lang === "id" ? "id-ID" : "en-GB";
  const time = now.toLocaleTimeString(locale, { hour12: timeFormat === "12", timeZone: TZ });
  const date = now.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ });

  return (
    <div className="flex flex-col items-center gap-4 relative">
      {/* Time */}
      <p className="text-5xl md:text-8xl lg:text-9xl font-black font-body tracking-tighter text-indigo-600 dark:text-indigo-400 leading-none drop-shadow-sm">
        {time}
      </p>

      {/* Date + icon */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-white/10 shadow-inner">
        <FiClock size={16} className="text-gray-500 shrink-0" />
        <p className="text-sm md:text-base font-bold font-body text-gray-600 dark:text-gray-400 capitalize">
          {date}
        </p>
      </div>

      {/* Dots accent */}
      <div className="flex gap-2 mt-2">
        <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50" />
        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
        <div className="w-2 h-2 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50" />
      </div>
    </div>
  );
}
