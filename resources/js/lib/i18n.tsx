import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translations, type Lang } from "./translations";

type LangContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const LangContext = createContext<LangContextValue | null>(null);

const STORAGE_KEY = "bel-lang";

function detectInitialLang(): Lang {
  if (typeof window === "undefined") return "id";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "id" || stored === "en") return stored;
  const browser = navigator.language.toLowerCase();
  return browser.startsWith("id") ? "id" : "en";
}

export function translate(key: string, params?: Record<string, string | number>): string {
  const lang = detectInitialLang();
  const dict = translations[lang];
  let str = dict[key] ?? translations.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return str;
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitialLang);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    const appName = translations[lang]["app.name"] ?? "BEL OTOMATIS";
    document.title = `${appName} Sekolah`;
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const dict = translations[lang];
      let str = dict[key] ?? translations.en[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }
      return str;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}

export function useT() {
  return useLang().t;
}
