import { useCallback, useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiCalendar } from "react-icons/fi";
import { createPortal } from "react-dom";
import { useT, useLang } from "@/lib/i18n";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function parseDate(v: string): { y: number; m: number; d: number } | null {
  if (!v) return null;
  const parts = v.split("-").map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return { y: parts[0], m: parts[1] - 1, d: parts[2] };
}

function formatDate(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

function firstDayOfMonth(y: number, m: number): number {
  return new Date(y, m, 1).getDay();
}

const MONTH_FULL_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export default function DatePicker({ value, onChange, label, placeholder }: DatePickerProps) {
  const t = useT();
  const { lang } = useLang();
  const locale = lang === "id" ? "id-ID" : "en-GB";

  const parsed = parseDate(value);
  const [open, setOpen] = useState(false);
  const [viewY, setViewY] = useState(parsed?.y ?? new Date().getFullYear());
  const [viewM, setViewM] = useState(parsed?.m ?? new Date().getMonth());
  const containerRef = useRef<HTMLDivElement>(null);

  const [inputValue, setInputValue] = useState("");
  useEffect(() => {
    if (value) {
      const p = value.split("-");
      if (p.length === 3) setInputValue(`${p[2]}-${p[1]}-${p[0]}`);
      else setInputValue(value);
    } else {
      setInputValue("");
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const p = val.split("-");
    if (p.length === 3 && p[0].length === 2 && p[1].length === 2 && p[2].length === 4) {
      const parsedY = parseInt(p[2], 10);
      const parsedM = parseInt(p[1], 10);
      if (!isNaN(parsedY) && !isNaN(parsedM) && parsedM >= 1 && parsedM <= 12) {
        setViewY(parsedY);
        setViewM(parsedM - 1);
      }
      onChange(`${p[2]}-${p[1]}-${p[0]}`);
    }
  };
  
  const popupRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (parsed) {
      setViewY(parsed.y);
      setViewM(parsed.m);
    }
  }, [value]);

  const updatePosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const popupW = 300;
      let left = rect.left;
      if (left + popupW > window.innerWidth - 8) {
        left = window.innerWidth - popupW - 8;
      }
      setCoords({ top: rect.bottom + 6, left });
    }
  }, []);

  useEffect(() => {
    if (open) {
      updatePosition();
      const handler = (e: MouseEvent) => {
        if (popupRef.current && popupRef.current.contains(e.target as Node)) return;
        if (containerRef.current && containerRef.current.contains(e.target as Node)) return;
        setOpen(false);
      };
      const scrollHandler = () => { setOpen(false); };
      document.addEventListener("mousedown", handler);
      window.addEventListener("scroll", scrollHandler, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        document.removeEventListener("mousedown", handler);
        window.removeEventListener("scroll", scrollHandler, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [open, updatePosition]);

  const selectDate = (d: number) => {
    onChange(formatDate(viewY, viewM, d));
    setOpen(false);
  };

  const prevMonth = () => {
    if (viewM === 0) { setViewY((y) => y - 1); setViewM(11); }
    else setViewM((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewM === 11) { setViewY((y) => y + 1); setViewM(0); }
    else setViewM((m) => m + 1);
  };

  const today = new Date();
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

  const dim = daysInMonth(viewY, viewM);
  const firstDay = firstDayOfMonth(viewY, viewM);
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <p className="text-sm font-heading font-bold mb-1.5 text-gray-700 dark:text-gray-300">
          {label}
        </p>
      )}

      <div
        className="flex items-center gap-2 px-4 h-[42px] rounded-xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-black/20 cursor-pointer shadow-inner focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 transition-all w-full"
        onClick={() => setOpen(true)}
      >
        <div 
          className="text-indigo-500 shrink-0 cursor-pointer flex items-center" 
          onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        >
          <FiCalendar size={16} />
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder={placeholder || "DD-MM-YYYY"}
          className="w-full bg-transparent border-none outline-none text-gray-800 dark:text-gray-200 font-body text-[0.9rem] font-bold"
        />
      </div>

      {open && createPortal(
        <div
          ref={popupRef}
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            zIndex: 99999,
          }}
          className="w-[300px] max-w-[calc(100vw-1rem)] bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden flex flex-col"
        >
          <div className="px-4 py-3 bg-indigo-500 flex items-center justify-between text-white">
            <button
              type="button"
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              onClick={prevMonth}
            >
              <FiChevronLeft size={18} />
            </button>
            <p className="text-sm font-heading font-black">
              {t("datePicker.monthsFull." + MONTH_FULL_KEYS[viewM])} {viewY}
            </p>
            <button
              type="button"
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              onClick={nextMonth}
            >
              <FiChevronRight size={18} />
            </button>
          </div>

          <div className="p-3">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAY_KEYS.map((dk) => (
                <p key={dk} className="text-[10px] font-heading font-black text-center text-gray-500 uppercase tracking-widest">
                  {t("datePicker.daysShort." + dk)}
                </p>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                if (d === null) return <div key={i} />;
                const dateStr = formatDate(viewY, viewM, d);
                const isSelected = value === dateStr;
                const isToday = todayStr === dateStr;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectDate(d)}
                    className={`
                      h-8 rounded-lg font-body text-xs font-bold transition-all flex items-center justify-center
                      ${isSelected 
                        ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20" 
                        : isToday
                        ? "border border-indigo-500 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                        : "text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10"
                      }
                    `}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 p-3 border-t border-white/10 bg-black/5 dark:bg-white/5 justify-between">
            <button
              type="button"
              className="px-4 py-1.5 rounded-lg text-xs font-bold font-body text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
              onClick={() => {
                const now = new Date();
                setViewY(now.getFullYear());
                setViewM(now.getMonth());
                selectDate(now.getDate());
              }}
            >
              {t("datePicker.today")}
            </button>
            <button
              type="button"
              className="px-4 py-1.5 rounded-lg text-xs font-bold font-body bg-indigo-500 text-white hover:bg-indigo-600 transition-colors shadow-sm"
              onClick={() => setOpen(false)}
            >
              {t("common.ok")}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
