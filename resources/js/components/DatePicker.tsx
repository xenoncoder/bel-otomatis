import { useCallback, useEffect, useRef, useState } from "react";
import { Box, HStack, Text } from "@chakra-ui/react";
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

const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
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

  const displayValue = parsed
    ? new Date(parsed.y, parsed.m, parsed.d).toLocaleDateString(locale, {
        weekday: "short", day: "2-digit", month: "short", year: "numeric",
      })
    : (placeholder ?? t("datePicker.selectDate"));

  return (
    <Box ref={containerRef} position="relative">
      {label && (
        <Text fontSize="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="700" mb={1.5}>
          {label}
        </Text>
      )}

      <HStack
        className="sw-timepicker-display"
        gap={2}
        position="relative"
        onClick={() => setOpen(true)}
      >
        <Box color="var(--sw-purple-normal)" flexShrink={0} cursor="pointer" onClick={(e) => { e.stopPropagation(); setOpen(!open); }} display="flex" alignItems="center">
          <FiCalendar size={16} />
        </Box>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder={placeholder || "DD-MM-YYYY"}
          style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "var(--sw-fg)", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.9rem", fontWeight: "700" }}
        />
      </HStack>

      {open && createPortal(
        <div
          ref={popupRef}
          className="sw-timepicker-popup"
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            zIndex: 99999,
            width: 300,
            maxWidth: "calc(100vw - 1rem)",
            background: "var(--sw-bg-card)",
            border: "1px solid var(--sw-border-color)",
            borderRadius: "var(--sw-radius)",
            boxShadow: "0.4rem 0.4rem 0 var(--sw-shadow-color)",
            overflow: "hidden",
          }}
        >
          <Box px={3} py={2} bg="var(--sw-purple-normal)" display="flex" alignItems="center" justifyContent="space-between">
            <button
              type="button"
              className="sw-timepicker-stepper"
              onClick={prevMonth}
              style={{ width: 24, height: 24 }}
            >
              <FiChevronLeft size={14} />
            </button>
            <Text fontSize="xs" fontFamily="'Comfortaa', sans-serif" fontWeight="800" color="var(--sw-fg)">
              {t("datePicker.monthsFull." + MONTH_FULL_KEYS[viewM])} {viewY}
            </Text>
            <button
              type="button"
              className="sw-timepicker-stepper"
              onClick={nextMonth}
              style={{ width: 24, height: 24 }}
            >
              <FiChevronRight size={14} />
            </button>
          </Box>

          <Box p={2}>
            <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={1} mb={1}>
              {DAY_KEYS.map((dk) => (
                <Text key={dk} fontSize="2xs" fontFamily="'Comfortaa', sans-serif" fontWeight="800" textAlign="center" color="var(--sw-fg-subtle)" textTransform="uppercase">
                  {t("datePicker.daysShort." + dk)}
                </Text>
              ))}
            </Box>

            <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={1}>
              {cells.map((d, i) => {
                if (d === null) return <Box key={i} />;
                const dateStr = formatDate(viewY, viewM, d);
                const isSelected = value === dateStr;
                const isToday = todayStr === dateStr;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectDate(d)}
                    style={{
                      height: 32,
                      borderRadius: "var(--sw-radius)",
                      border: isSelected
                        ? "1px solid var(--sw-border-color)"
                        : isToday
                        ? "1px solid var(--sw-purple-normal)"
                        : "1px solid transparent",
                      background: isSelected ? "var(--sw-purple-normal)" : "transparent",
                      color: isSelected ? "#000" : "var(--sw-fg)",
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "0.8rem",
                      fontWeight: isSelected ? 700 : 500,
                      cursor: "pointer",
                      boxShadow: isSelected ? "0.15rem 0.15rem 0 var(--sw-shadow-color)" : "none",
                      transition: "all 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "var(--sw-purple-light)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.transform = "none";
                      }
                    }}
                  >
                    {d}
                  </button>
                );
              })}
            </Box>
          </Box>

          <HStack gap={2} p={2} borderTop="1px solid var(--sw-border-color)" bg="var(--sw-bg-muted)" justify="space-between">
            <button
              type="button"
              className="sw-timepicker-preset"
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
              className="sw-timepicker-done"
              onClick={() => setOpen(false)}
            >
              {t("common.ok")}
            </button>
          </HStack>
        </div>,
        document.body
      )}
    </Box>
  );
}
