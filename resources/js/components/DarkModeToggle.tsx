import { IconButton } from "@chakra-ui/react";
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
    return <IconButton aria-label="theme" variant="ghost" size="sm" pointerEvents="none" opacity={0} borderRadius="var(--sw-radius)" border="2px solid var(--sw-border-color)" />;
  }

  const isDark = theme === "dark";

  return (
    <IconButton
      aria-label={isDark ? t("theme.light") : t("theme.dark")}
      variant="ghost"
      size="sm"
      borderRadius="var(--sw-radius)"
      border="2px solid var(--sw-border-color)"
      bg="var(--sw-bg-card)"
      boxShadow="0.2rem 0.2rem 0 var(--sw-shadow-color)"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      color="var(--sw-fg)"
      _hover={{
        bg: "var(--sw-bg-hover)",
        transform: "translate(-0.05rem, -0.05rem)",
        boxShadow: "0.2rem 0.2rem 0 var(--sw-shadow-color)",
      }}
      _active={{
        transform: "translate(0.1rem, 0.1rem)",
        boxShadow: "0.05rem 0.05rem 0 var(--sw-shadow-color)",
      }}
      transition="all 0.15s"
    >
      {isDark ? <FiSun size={14} strokeWidth={2.5} /> : <FiMoon size={14} strokeWidth={2.5} />}
    </IconButton>
  );
}
