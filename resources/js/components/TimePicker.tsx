import { useCallback, useEffect, useRef, useState } from "react";
import { FiChevronUp, FiChevronDown, FiClock } from "react-icons/fi";
import { useT } from "@/lib/i18n";

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function parseTime(v: string): [number, number, number] {
  const parts = v.split(":").map((p) => parseInt(p, 10) || 0);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

function clamp(n: number, max: number) {
  if (n < 0) return max;
  if (n > max) return 0;
  return n;
}

const ITEM_H = 38;
const VISIBLE = 5;

function ScrollColumn({
  items,
  value,
  onSelect,
}: {
  items: number[];
  value: number;
  onSelect: (n: number) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (listRef.current) {
      const target = value * ITEM_H;
      const current = listRef.current.scrollTop;
      if (Math.abs(current - target) > 1) {
        listRef.current.scrollTo({ top: target, behavior: "smooth" });
      }
    }
  }, [value]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      el.scrollTop += Math.sign(e.deltaY) * ITEM_H;
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div className="relative flex-1 overflow-hidden" style={{ height: ITEM_H * VISIBLE }}>
      <div
        ref={listRef}
        className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory"
        onScroll={(e) => {
          const el = listRef.current;
          if (!el) return;
          if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
          scrollTimerRef.current = setTimeout(() => {
            if (!listRef.current) return;
            const idx = Math.round(el.scrollTop / ITEM_H);
            if (idx !== value && idx >= 0 && idx < items.length) {
              listRef.current.scrollTop = idx * ITEM_H;
              onSelect(idx);
            }
          }, 80);
        }}
      >
        <div style={{ height: ITEM_H * 2 }} />
        {items.map((n) => (
          <div
            key={n}
            style={{ height: ITEM_H }}
            className={`flex items-center justify-center font-body text-xl font-bold snap-center cursor-pointer transition-all ${
              n === value ? "text-indigo-600 dark:text-indigo-400 opacity-100" : "text-gray-500 opacity-30"
            }`}
            onClick={() => onSelect(n)}
          >
            {pad(n)}
          </div>
        ))}
        <div style={{ height: ITEM_H * 2 }} />
      </div>
    </div>
  );
}

export default function TimePicker({ value, onChange, label }: TimePickerProps) {
  const t = useT();
  const [h, m, s] = parseTime(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const updateTime = useCallback(
    (nh: number, nm: number, ns: number) => {
      onChange(`${pad(nh)}:${pad(nm)}:${pad(ns)}`);
    },
    [onChange],
  );

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const mins = Array.from({ length: 60 }, (_, i) => i);
  const secs = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Display input */}
      <div
        className="flex items-center gap-3 px-4 py-2 bg-black/5 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-xl cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        onClick={() => setOpen(true)}
      >
        <FiClock size={16} className="text-indigo-500 shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e: any) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="00:00:00"
          className="w-full bg-transparent border-none outline-none text-gray-800 dark:text-gray-200 font-body font-bold text-lg"
        />
      </div>

      {/* Popup */}
      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 w-[280px] max-w-[90vw] bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl shadow-indigo-500/20 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
              {t("timePicker.selectTime")}
            </span>
            <span className="text-sm font-black font-body text-white">
              {pad(h)}:{pad(m)}:{pad(s)}
            </span>
          </div>

          {/* Columns Headers */}
          <div className="flex justify-around px-4 py-2 border-b border-black/5 dark:border-white/5">
            <span className="flex-1 text-[10px] font-bold text-center uppercase tracking-widest text-gray-500">{t("timePicker.hours")}</span>
            <span className="w-6" />
            <span className="flex-1 text-[10px] font-bold text-center uppercase tracking-widest text-gray-500">{t("timePicker.minutes")}</span>
            <span className="w-6" />
            <span className="flex-1 text-[10px] font-bold text-center uppercase tracking-widest text-gray-500">{t("timePicker.seconds")}</span>
          </div>

          {/* Columns */}
          <div className="flex px-2 py-2 relative">
            <div className="absolute top-1/2 left-2 right-2 h-[38px] -translate-y-1/2 bg-indigo-500/10 border-y border-indigo-500/30 pointer-events-none rounded" />

            <div className="flex flex-col flex-1 relative items-center">
              <button className="p-1 text-gray-400 hover:text-indigo-500" onClick={() => updateTime(clamp(h - 1, 23), m, s)}><FiChevronUp size={16} /></button>
              <ScrollColumn items={hours} value={h} onSelect={(n) => updateTime(n, m, s)} />
              <button className="p-1 text-gray-400 hover:text-indigo-500" onClick={() => updateTime(clamp(h + 1, 23), m, s)}><FiChevronDown size={16} /></button>
            </div>

            <span className="text-xl font-bold text-gray-300 self-center">:</span>

            <div className="flex flex-col flex-1 relative items-center">
              <button className="p-1 text-gray-400 hover:text-indigo-500" onClick={() => updateTime(h, clamp(m - 1, 59), s)}><FiChevronUp size={16} /></button>
              <ScrollColumn items={mins} value={m} onSelect={(n) => updateTime(h, n, s)} />
              <button className="p-1 text-gray-400 hover:text-indigo-500" onClick={() => updateTime(h, clamp(m + 1, 59), s)}><FiChevronDown size={16} /></button>
            </div>

            <span className="text-xl font-bold text-gray-300 self-center">:</span>

            <div className="flex flex-col flex-1 relative items-center">
              <button className="p-1 text-gray-400 hover:text-indigo-500" onClick={() => updateTime(h, m, clamp(s - 1, 59))}><FiChevronUp size={16} /></button>
              <ScrollColumn items={secs} value={s} onSelect={(n) => updateTime(h, m, n)} />
              <button className="p-1 text-gray-400 hover:text-indigo-500" onClick={() => updateTime(h, m, clamp(s + 1, 59))}><FiChevronDown size={16} /></button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-3 bg-black/5 dark:bg-white/5 border-t border-black/5 dark:border-white/5">
            <button className="px-4 py-1.5 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10" onClick={() => {
              const now = new Date();
              updateTime(now.getHours(), now.getMinutes(), now.getSeconds());
            }}>
              {t("common.now")}
            </button>
            <button className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-500 text-white hover:bg-indigo-600 shadow-md shadow-indigo-500/30" onClick={() => setOpen(false)}>
              {t("common.ok")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
