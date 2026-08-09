import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";

const CLOCKS = [
  { label: "WIB (Jakarta)", tz: "Asia/Jakarta" },
  { label: "WITA (Makassar)", tz: "Asia/Makassar" },
  { label: "WIT (Jayapura)", tz: "Asia/Jayapura" },
  { label: "UTC (London)", tz: "UTC" },
  { label: "Makkah (Arab Saudi)", tz: "Asia/Riyadh" },
  { label: "Tokyo (Jepang)", tz: "Asia/Tokyo" },
];

export default function WorldClock() {
  const [time, setTime] = useState(new Date());
  const t = useT();

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const formatDate = (tz: string) => {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
      timeZone: tz,
    }).format(time);
  };

  const formatTime = (tz: string) => {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false, timeZone: tz,
    }).format(time).replace(/\./g, ":");
  };

  const isDay = (tz: string) => {
    const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: tz }).format(time));
    return h >= 6 && h < 18;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {CLOCKS.map((c) => {
        const day = isDay(c.tz);
        return (
          <div
            key={c.tz}
            className={`flex flex-col p-4 rounded-xl border relative overflow-hidden transition-all duration-500 \${
              day 
                ? "bg-gradient-to-br from-blue-50 to-sky-100 dark:from-blue-900/30 dark:to-sky-800/30 border-blue-200 dark:border-blue-800" 
                : "bg-gradient-to-br from-indigo-900 to-slate-900 border-indigo-800"
            }`}
          >
            {day ? (
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-400 rounded-full blur-xl opacity-30" />
            ) : (
              <div className="absolute top-2 right-4 w-8 h-8 rounded-full shadow-[inset_-8px_-4px_0_0_#cbd5e1] opacity-50" />
            )}
            
            <h3 className={`font-bold text-sm mb-1 \${day ? "text-blue-900 dark:text-blue-100" : "text-indigo-100"}`}>
              {c.label}
            </h3>
            
            <p className={`font-body font-black text-3xl tracking-tighter mb-1 \${day ? "text-blue-700 dark:text-blue-300" : "text-white"}`}>
              {formatTime(c.tz)}
            </p>
            
            <p className={`text-xs font-bold \${day ? "text-blue-600/70 dark:text-blue-400/70" : "text-indigo-300/70"}`}>
              {formatDate(c.tz)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
