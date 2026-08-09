import { useTheme } from "next-themes";
import { FiMoon, FiSun } from "react-icons/fi";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";

export default function DarkModeToggle() {
  const t = useT();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-10 h-10 rounded-xl border border-white/20 dark:border-white/10 opacity-0 pointer-events-none" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? t("theme.light") : t("theme.dark")}
      className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-white/10 border border-white/20 dark:border-white/10 text-gray-700 dark:text-gray-300 shadow-sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <FiSun size={18} strokeWidth={2.5} className="text-amber-500" /> : <FiMoon size={18} strokeWidth={2.5} className="text-indigo-500" />}
    </button>
  );
}
