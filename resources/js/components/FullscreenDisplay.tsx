import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { FiX, FiBell, FiClock } from "react-icons/fi";
import { useT, useLang } from "@/lib/i18n";
import { useTimeFormat, formatTimeString } from "@/lib/time-format";
import { useBellPolling } from "@/hooks/useBellPolling";
import BackgroundOrnament from "@/components/BackgroundOrnament";

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

interface FullscreenDisplayProps {
  onExit: () => void;
}

export default function FullscreenDisplay({ onExit }: FullscreenDisplayProps) {
  const t = useT();
  const { lang } = useLang();
  const timeFormat = useTimeFormat();
  const locale = lang === "id" ? "id-ID" : "en-GB";
  const { shouldRing, currentSchedule, todaySchedules, dismiss } = useBellPolling();
  const [, setTick] = useState(0);
  const exitTimerRef = useRef<number | null>(null);
  const wasRingingRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  const handleExit = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onExit();
  }, [onExit]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); handleExit(); }
    };
    const onFsChange = () => {
      if (!document.fullscreenElement) {
        exitTimerRef.current = window.setTimeout(() => onExit(), 300);
      } else if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFsChange);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, [handleExit, onExit]);

  const { hh, mm, ss } = getJakartaParts();
  const nowSec = Number(hh) * 3600 + Number(mm) * 60 + Number(ss);

  const upcoming = todaySchedules
    .filter((s) => toSec(s.start_time) > nowSec)
    .sort((a, b) => toSec(a.start_time) - toSec(b.start_time));
  const next = upcoming[0];
  const upcomingList = upcoming.slice(0, 4);

  const countdown = (() => {
    if (!next) return null;
    let diff = toSec(next.start_time) - nowSec;
    if (diff <= 0) return "00:00:00";
    const h = Math.floor(diff / 3600); diff %= 3600;
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
  })();

  const now = new Date();
  const timeStr = now.toLocaleTimeString(locale, { hour12: timeFormat === "12", timeZone: TZ });
  const dateStr = now.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ });

  const isRinging = shouldRing && !!currentSchedule;

  return createPortal(
    <div
      onClick={handleExit}
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-300 ${isRinging ? "bg-black/95 text-white" : "bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white"}`}
    >
      <BackgroundOrnament variant="normal" />

      {/* Top bar — exit hint + button */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 md:px-8 py-4 md:py-5 z-20 pointer-events-none">
        <div className="flex items-center gap-2 opacity-50">
          <p className="text-sm font-body text-gray-300">
            {t("fullscreen.clickToExit")}
          </p>
        </div>
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl border border-white/20 bg-black/20 backdrop-blur-md flex items-center justify-center pointer-events-auto hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-lg transition-all text-white shadow-md cursor-pointer">
          <FiX size={24} />
        </div>
      </div>

      {isRinging ? (
        /* ============ RINGING STATE ============ */
        <div className="flex flex-col items-center gap-6 md:gap-10 z-10" onClick={handleExit}>
          {/* Pulsing rings behind bell */}
          <div className="relative flex items-center justify-center">
            <div className="absolute w-[180px] h-[180px] md:w-[260px] md:h-[260px] rounded-full border-4 border-indigo-500 opacity-20 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
            <div className="absolute w-[140px] h-[140px] md:w-[200px] md:h-[200px] rounded-full border-4 border-indigo-500 opacity-30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" style={{ animationDelay: "0.3s" }} />
            
            {/* Bell icon */}
            <div className="relative z-10 w-[100px] h-[100px] md:w-[150px] md:h-[150px] rounded-full border-[6px] border-white/20 bg-indigo-500 flex items-center justify-center shadow-2xl shadow-indigo-500/50 animate-bounce">
              <FiBell size={75} color="#ffffff" strokeWidth={2.5} />
            </div>
          </div>

          {/* Ringing text */}
          <p className="text-4xl md:text-7xl font-heading font-black text-white tracking-wider uppercase animate-pulse">
            {t("fullscreen.ringing")}
          </p>

          {/* Label + time */}
          {currentSchedule?.label && (
            <div className="px-6 md:px-8 py-2 md:py-3 rounded-2xl bg-indigo-500/20 border-2 border-indigo-500/50 backdrop-blur-md">
              <p className="text-2xl md:text-4xl font-heading font-bold text-white shadow-sm">
                {currentSchedule.label}
              </p>
            </div>
          )}
          <p className="text-5xl md:text-8xl font-body font-black text-indigo-400 opacity-90 tracking-tighter">
            {formatTimeString(currentSchedule?.start_time, timeFormat)}
          </p>
        </div>
      ) : (
        /* ============ NORMAL STATE ============ */
        <>
          {/* Clock — centered */}
          <div className="flex flex-col items-center gap-2 z-10 drop-shadow-xl">
            <p className="text-[7rem] sm:text-[9rem] md:text-[14rem] lg:text-[18rem] font-bold font-body tracking-tighter text-indigo-300 leading-none drop-shadow-2xl">
              {timeStr}
            </p>
            <p className="text-lg sm:text-xl md:text-2xl text-indigo-200 capitalize font-body opacity-80 tracking-widest font-bold">
              {dateStr}
            </p>
          </div>

          {/* Countdown — bottom right */}
          {next ? (
            <div className="absolute bottom-4 md:bottom-8 right-4 md:right-8 z-20 text-right bg-black/20 p-6 rounded-3xl backdrop-blur-md border border-white/10 shadow-2xl">
              <div className="flex items-center justify-end gap-2 mb-1">
                <p className="text-xs md:text-sm font-body text-indigo-200 uppercase tracking-widest">
                  {t("fullscreen.nextBellIn")}
                </p>
                <FiClock size={14} className="text-indigo-200" />
              </div>
              <p className="text-3xl md:text-5xl lg:text-6xl font-body font-black text-white tracking-tighter leading-none my-2 drop-shadow-md">
                {countdown}
              </p>
              <p className="text-lg md:text-xl font-heading font-bold text-indigo-300 drop-shadow-md">
                {next.label}
              </p>
              <p className="text-xs md:text-sm font-body text-indigo-200 opacity-70 mt-1">
                {t("fullscreen.nextBellAt")} {formatTimeString(next.start_time, timeFormat)} {t("common.wib")}
              </p>
            </div>
          ) : (
            <div className="absolute bottom-4 md:bottom-8 right-4 md:right-8 z-20 text-right bg-black/20 p-6 rounded-3xl backdrop-blur-md border border-white/10 shadow-2xl">
              <p className="text-lg md:text-xl font-heading font-bold text-gray-400">
                {t("fullscreen.noMoreBells")}
              </p>
            </div>
          )}
        </>
      )}
    </div>,
    document.body,
  );
}
