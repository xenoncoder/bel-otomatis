import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { GlassButton } from "./ui/GlassComponents";

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const cs = Math.floor((ms % 1000) / 10);
  if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

export default function Stopwatch() {
  const t = useT();
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const startRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now() - elapsed;
    const tick = () => {
      setElapsed(performance.now() - startRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running]);

  const handleStartPause = () => setRunning((r) => !r);
  const handleReset = () => { setRunning(false); setElapsed(0); setLaps([]); };
  const handleLap = () => { if (running) setLaps((l) => [...l, elapsed]); };

  return (
    <div className="flex flex-col gap-6">
      <div className="p-6 md:p-10 text-center rounded-2xl bg-black/5 dark:bg-white/5 border border-white/10 shadow-inner">
        <p className="text-4xl md:text-7xl font-body font-black tracking-tighter text-indigo-600 dark:text-indigo-400">
          {formatMs(elapsed)}
        </p>
      </div>
      <div className="flex justify-center gap-3 flex-wrap">
        <GlassButton variant={running ? "warning" : "success"} onClick={handleStartPause}>
          {running ? t("stopwatch.pause") : t("stopwatch.start")}
        </GlassButton>
        <GlassButton variant="primary" onClick={handleLap} disabled={!running}>
          {t("stopwatch.lap")}
        </GlassButton>
        <GlassButton variant="danger" onClick={handleReset}>
          {t("stopwatch.reset")}
        </GlassButton>
      </div>
      {laps.length > 0 && (
        <div className="glass-panel p-4 max-h-[300px] overflow-y-auto">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
            {t("stopwatch.lapTimes")}
          </h3>
          <div className="flex flex-col gap-2">
            {laps.map((lap, i) => (
              <div key={i} className="flex justify-between items-center px-3 py-2 rounded-xl bg-white/20 dark:bg-white/5 border border-white/10">
                <span className="text-sm font-bold text-gray-500">
                  {t("stopwatch.lapLabel", { n: i + 1 })}
                </span>
                <span className="text-sm font-black text-gray-800 dark:text-gray-200 font-body">
                  {formatMs(lap)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
