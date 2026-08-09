import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { GlassButton, GlassInput } from "./ui/GlassComponents";

function formatSec(sec: number): string {
  if (sec <= 0) return "00:00:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function Timer() {
  const t = useT();
  const [inputH, setInputH] = useState(0);
  const [inputM, setInputM] = useState(5);
  const [inputS, setInputS] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          setDone(true);
          try {
            const audio = new Audio("/sounds/bell.mp3");
            audio.volume = 0.8;
            audio.play().catch(() => {});
          } catch {}
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const handleStart = () => {
    const total = inputH * 3600 + inputM * 60 + inputS;
    if (total <= 0) return;
    setDone(false);
    setRemaining(total);
    setRunning(true);
  };

  const handlePause = () => setRunning(false);
  const handleReset = () => { setRunning(false); setRemaining(0); setDone(false); };

  const total = inputH * 3600 + inputM * 60 + inputS;

  return (
    <div className="flex flex-col gap-6">
      <div className={`p-6 md:p-10 text-center rounded-2xl bg-black/5 dark:bg-white/5 border border-white/10 shadow-inner flex flex-col items-center justify-center transition-all ${done ? "bg-rose-500/20 border-rose-500/50 animate-pulse shadow-rose-500/20 shadow-xl" : ""}`}>
        <p className={`text-5xl md:text-7xl font-body font-black tracking-tighter ${done ? "text-rose-600 dark:text-rose-400" : "text-indigo-600 dark:text-indigo-400"}`}>
          {formatSec(remaining)}
        </p>
        {done && (
          <p className="mt-4 font-bold text-lg text-rose-600 dark:text-rose-400">
            {t("timer.timeUp")}
          </p>
        )}
      </div>

      {!running && remaining === 0 && (
        <div className="flex justify-center flex-wrap gap-4">
          {[
            { label: t("timer.hours"), val: inputH, set: setInputH, max: 23 },
            { label: t("timer.minutes"), val: inputM, set: setInputM, max: 59 },
            { label: t("timer.seconds"), val: inputS, set: setInputS, max: 59 },
          ].map((f) => (
            <div key={f.label} className="flex flex-col items-center gap-2">
              <GlassInput
                type="number"
                min={0}
                max={f.max}
                value={f.val}
                onChange={(e: any) => f.set(Math.min(f.max, Math.max(0, Number(e.target.value) || 0)))}
                className="w-20 text-center font-body font-bold text-xl !py-3"
              />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{f.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center flex-wrap gap-3">
        {!running && remaining === 0 && (
          <GlassButton variant="success" onClick={handleStart} disabled={total <= 0}>
            {t("timer.start")}
          </GlassButton>
        )}
        {running && (
          <GlassButton variant="warning" onClick={handlePause}>
            {t("timer.pause")}
          </GlassButton>
        )}
        {!running && remaining > 0 && (
          <GlassButton variant="success" onClick={() => setRunning(true)}>
            {t("timer.resume")}
          </GlassButton>
        )}
        {remaining > 0 && (
          <GlassButton variant="danger" onClick={handleReset}>
            {t("timer.reset")}
          </GlassButton>
        )}
      </div>
    </div>
  );
}
