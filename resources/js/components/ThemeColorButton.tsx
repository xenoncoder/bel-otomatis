import { useState, useRef, useEffect } from "react";
import { IconButton, Box, HStack, Text } from "@chakra-ui/react";
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
      <IconButton
        ref={btnRef as never}
        aria-label={t("theme.color")}
        variant="ghost"
        size="sm"
        borderRadius="var(--sw-radius)"
        border="2px solid var(--sw-border-color)"
        bg="var(--sw-bg-card)"
        boxShadow="0.2rem 0.2rem 0 var(--sw-shadow-color)"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
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
        position="relative"
      >
        <Box position="relative" display="flex" alignItems="center" justifyContent="center">
          <FiDroplet size={14} strokeWidth={2.5} />
          <Box
            position="absolute"
            bottom={-1}
            right={-1}
            w={2.5}
            h={2.5}
            borderRadius="50%"
            border="2px solid var(--sw-border-color)"
            bg={colors[accent].normal}
          />
        </Box>
      </IconButton>

      {open && createPortal(
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            zIndex: 99999,
            background: "var(--sw-bg-card)",
            border: "1px solid var(--sw-border-color)",
            borderRadius: "var(--sw-radius)",
            boxShadow: "0.4rem 0.4rem 0 var(--sw-shadow-color)",
            padding: "0.75rem",
            animation: "sw-tooltip-in 0.1s ease-out",
          }}
        >
          <Text
            fontSize="2xs"
            fontFamily="'Comfortaa', sans-serif"
            fontWeight="800"
            textTransform="uppercase"
            letterSpacing="0.05em"
            color="var(--sw-fg-subtle)"
            mb={2}
            textAlign="center"
          >
            {t("theme.color")}
          </Text>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
            {colorKeys.map((key) => {
              const c = colors[key];
              const isActive = accent === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setAccent(key); setOpen(false); }}
                  title={t("theme.color." + key)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "var(--sw-radius)",
                    border: isActive ? "2px solid var(--sw-border-color)" : "1px solid var(--sw-border-color)",
                    boxShadow: isActive ? "0.15rem 0.15rem 0 var(--sw-shadow-color)" : "none",
                    background: c.normal,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    transform: isActive ? "none" : "scale(1)",
                  }}
                >
                  {isActive && (
                    <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#fff", border: "1px solid #000" }} />
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
