import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type AccentColor = "purple" | "blue" | "pink" | "green" | "yellow" | "red" | "teal" | "indigo";

interface AccentPalette {
  light: string;
  normal: string;
  dark: string;
  rgb: string;
  bgLight: string;
  bgLightCard: string;
  bgLightMuted: string;
  bgDark: string;
  bgDarkCard: string;
  bgDarkMuted: string;
}

const colorMap: Record<AccentColor, AccentPalette> = {
  purple: {
    light: "#a78bfa", normal: "#7c3aed", dark: "#5b21b6", rgb: "166,131,221",
    bgLight: "#f3eef9", bgLightCard: "#f8f5fc", bgLightMuted: "#ede4f7",
    bgDark: "#1a1426", bgDarkCard: "#221a33", bgDarkMuted: "#2d2245",
  },
  blue: {
    light: "#a1c8ff", normal: "#3b82f6", dark: "#1e40af", rgb: "59,130,246",
    bgLight: "#eef4ff", bgLightCard: "#f5f8ff", bgLightMuted: "#e3ecfd",
    bgDark: "#0f1729", bgDarkCard: "#16203a", bgDarkMuted: "#1e2d4d",
  },
  pink: {
    light: "#f472b6", normal: "#db2777", dark: "#9d174d", rgb: "236,72,153",
    bgLight: "#fdf0f5", bgLightCard: "#fef6f9", bgLightMuted: "#fbe4ee",
    bgDark: "#1f1018", bgDarkCard: "#2a1622", bgDarkMuted: "#361d2c",
  },
  green: {
    light: "#34d399", normal: "#059669", dark: "#047857", rgb: "16,185,129",
    bgLight: "#ecfaf4", bgLightCard: "#f3fcf8", bgLightMuted: "#dcf5eb",
    bgDark: "#0c1f1a", bgDarkCard: "#122a23", bgDarkMuted: "#1a352c",
  },
  yellow: {
    light: "#fbbf24", normal: "#d97706", dark: "#b45309", rgb: "245,158,11",
    bgLight: "#fdf6e8", bgLightCard: "#fefaf2", bgLightMuted: "#faeed3",
    bgDark: "#1e1a0f", bgDarkCard: "#2a2415", bgDarkMuted: "#362e1c",
  },
  red: {
    light: "#fca5a5", normal: "#ef4444", dark: "#991b1b", rgb: "239,68,68",
    bgLight: "#fdf1f1", bgLightCard: "#fef6f6", bgLightMuted: "#fbe5e5",
    bgDark: "#1e0f0f", bgDarkCard: "#2a1515", bgDarkMuted: "#361c1c",
  },
  teal: {
    light: "#67e8f9", normal: "#0891b2", dark: "#0e7490", rgb: "20,184,166",
    bgLight: "#eefbf7", bgLightCard: "#f4fdfa", bgLightMuted: "#dff6f1",
    bgDark: "#0c1b1a", bgDarkCard: "#112624", bgDarkMuted: "#193029",
  },
  indigo: {
    light: "#c7d2fe", normal: "#6366f1", dark: "#3730a3", rgb: "99,102,241",
    bgLight: "#eef0ff", bgLightCard: "#f4f5ff", bgLightMuted: "#e3e6fc",
    bgDark: "#131221", bgDarkCard: "#1b1a30", bgDarkMuted: "#25233f",
  },
};

type ThemeContextValue = {
  accent: AccentColor;
  setAccent: (c: AccentColor) => void;
  colors: typeof colorMap;
};

const ThemeColorContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "bel-accent";

function detectInitialAccent(): AccentColor {
  if (typeof window === "undefined") return "purple";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && stored in colorMap) return stored as AccentColor;
  return "purple";
}

function applyAccent(color: AccentColor) {
  const c = colorMap[color];
  const root = document.documentElement;
  root.style.setProperty("--sw-purple-light", c.light);
  root.style.setProperty("--sw-purple-normal", c.normal);
  root.style.setProperty("--sw-purple-dark", c.dark);
  root.style.setProperty("--sw-accent-rgb", c.rgb);
  root.style.setProperty("--sw-theme-bg-light", c.bgLight);
  root.style.setProperty("--sw-theme-bg-card-light", c.bgLightCard);
  root.style.setProperty("--sw-theme-bg-muted-light", c.bgLightMuted);
  root.style.setProperty("--sw-theme-bg-dark", c.bgDark);
  root.style.setProperty("--sw-theme-bg-card-dark", c.bgDarkCard);
  root.style.setProperty("--sw-theme-bg-muted-dark", c.bgDarkMuted);
}

export function ThemeColorProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState<AccentColor>(detectInitialAccent);

  useEffect(() => {
    applyAccent(accent);
    localStorage.setItem(STORAGE_KEY, accent);
  }, [accent]);

  const setAccent = useCallback((c: AccentColor) => setAccentState(c), []);

  const value = useMemo(() => ({ accent, setAccent, colors: colorMap }), [accent, setAccent]);

  return <ThemeColorContext.Provider value={value}>{children}</ThemeColorContext.Provider>;
}

export function useThemeColor() {
  const ctx = useContext(ThemeColorContext);
  if (!ctx) throw new Error("useThemeColor must be used within ThemeColorProvider");
  return ctx;
}
