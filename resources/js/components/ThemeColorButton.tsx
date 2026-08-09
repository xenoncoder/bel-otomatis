import { useState, useRef, useEffect } from "react";
import { FiDroplet } from "react-icons/fi";
import { useThemeColor, type AccentColor } from "@/lib/theme-color";
import { useT } from "@/lib/i18n";
import { createPortal } from "react-dom";

export default function ThemeColorButton() {
  const t = useT();
  const { accent, setAccent, colors } = useThemeColor();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const popupWidth = 180;
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        setCoords({ top: rect.bottom + 6, left: window.innerWidth - popupWidth - 8 });
      } else {
        setCoords({ top: rect.bottom + 6, left: rect.right - popupWidth });
      }
    }
  }, [open]);

  useEffect(() => {
    const handler = () => setOpen(false);
    if (open) {
      document.addEventListener("click", handler);
      return () => document.removeEventListener("click", handler);
    }
  }, [open]);

  const colorKeys = Object.keys(colors) as AccentColor[];

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={t("theme.color")}
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-white/10 border border-white/20 dark:border-white/10 relative shadow-sm"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
      >
        <div className="relative flex items-center justify-center">
          <FiDroplet size={18} className="text-gray-700 dark:text-gray-300" strokeWidth={2.5} />
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900"
            style={{ backgroundColor: colors[accent].normal }}
          />
        </div>
      </button>

      {open && createPortal(
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            zIndex: 99999,
          }}
          className="w-[180px] p-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-xl animate-fade-in"
        >
          <p className="text-[10px] font-heading font-black uppercase tracking-widest text-gray-500 mb-2 text-center">
            {t("theme.color")}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {colorKeys.map((key) => {
              const c = colors[key];
              const isActive = accent === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setAccent(key); setOpen(false); }}
                  title={t("theme.color." + key)}
                  className={`w-7 h-7 rounded-lg transition-all flex items-center justify-center ${isActive ? "border-2 border-gray-900 dark:border-white scale-110 shadow-md" : "border border-black/10 dark:border-white/10 scale-100 hover:scale-105"}`}
                  style={{ backgroundColor: c.normal }}
                >
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                  )}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
