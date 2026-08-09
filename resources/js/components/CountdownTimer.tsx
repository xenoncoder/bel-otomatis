import { useEffect, useState } from "react";
import { FiClock, FiBell, FiChevronRight } from "react-icons/fi";
import type { Schedule } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { useTimeFormat, formatTimeString } from "@/lib/time-format";

const TZ = "Asia/Jakarta";

function getJakartaParts() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false, timeZone: TZ,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  return { hh: get("hour"), mm: get("minute"), ss: get("second") };
}

function toSec(time: string) {
  const [h, m, s] = time.split(":").map(Number);
  return (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
}

interface CountdownTimerProps {
  schedules: Schedule[];
}

export default function CountdownTimer({ schedules }: CountdownTimerProps) {
  const t = useT();
  const timeFormat = useTimeFormat();
  const [, setNow] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setNow((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const { hh, mm, ss } = getJakartaParts();
  const nowSec = Number(hh) * 3600 + Number(mm) * 60 + Number(ss);

  const upcoming = schedules
    .filter((s) => toSec(s.start_time) > nowSec)
    .sort((a, b) => toSec(a.start_time) - toSec(b.start_time));
  const next = upcoming[0];
  const afterNext = upcoming.slice(1, 4);

  const countdown = (() => {
    if (!next) return null;
    let diff = toSec(next.start_time) - nowSec;
    if (diff <= 0) return { h: 0, m: 0, s: 0 };
    return { h: Math.floor(diff / 3600), m: Math.floor((diff % 3600) / 60), s: diff % 60 };
  })();

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="glass-panel overflow-hidden !p-0 flex flex-col">
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 border-b border-white/10 flex items-center gap-2">
        <FiClock size={16} className="text-white" />
        <h2 className="font-heading font-bold text-lg text-white">{t("countdown.title")}</h2>
      </div>
      <div className="p-4 md:p-6 bg-black/5 dark:bg-white/5 flex-1">
        {next && countdown ? (
          <div className="flex flex-col gap-6">
            {/* Label + time */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
                <FiBell size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-base font-bold font-heading text-gray-800 dark:text-gray-100 truncate">
                  {next.label}
                </p>
                <p className="text-xs text-gray-500 font-body font-bold mt-0.5">
                  {t("countdown.at", { time: formatTimeString(next.start_time, timeFormat) })}
                </p>
              </div>
            </div>

            {/* Countdown — split boxes */}
            <div className="flex justify-center items-center gap-3">
              {[
                { val: countdown.h, label: t("timer.hours") },
                { val: countdown.m, label: t("timer.minutes") },
                { val: countdown.s, label: t("timer.seconds") },
              ].map((unit, i) => (
                <div key={i} className="flex items-center gap-3">
                  {i > 0 && (
                    <p className="text-3xl font-black text-gray-400 dark:text-gray-600 font-body">:</p>
                  )}
                  <div className="flex flex-col items-center bg-white/50 dark:bg-black/30 border border-white/20 dark:border-white/10 rounded-2xl w-16 md:w-20 py-3 shadow-inner">
                    <p className="text-3xl md:text-4xl font-black text-purple-600 dark:text-purple-400 font-body tracking-tighter leading-none">
                      {pad(unit.val)}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-2 font-bold">
                      {unit.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Upcoming bells */}
            {afterNext.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                  {t("countdown.nextBell")}
                </p>
                <div className="flex flex-col gap-2">
                  {afterNext.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/30 dark:bg-white/5 border border-white/20 dark:border-white/10 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
                    >
                      <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        {formatTimeString(s.start_time, timeFormat)}
                      </p>
                      <FiChevronRight size={14} className="text-gray-400" />
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 border border-white/10 flex items-center justify-center">
              <FiBell size={24} className="text-gray-400" />
            </div>
            <p className="text-sm font-bold text-gray-500 text-center">
              {t("countdown.noMore")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
