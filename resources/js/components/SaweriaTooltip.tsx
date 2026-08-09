import { useState, useRef, useLayoutEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface SaweriaTooltipProps {
  label: string;
  children: ReactNode;
  placement?: "bottom" | "top";
}

export default function SaweriaTooltip({ label, children, placement = "bottom" }: SaweriaTooltipProps) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (show && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setCoords({
        top: placement === "bottom" ? rect.bottom + 6 : rect.top - 6,
        left: rect.left + rect.width / 2,
      });
    }
  }, [show, placement]);

  return (
    <>
      <span
        ref={ref}
        style={{ display: "inline-flex", position: "relative" }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
      >
        {children}
      </span>
      {show && createPortal(
        <div
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            transform: placement === "bottom" ? "translateX(-50%)" : "translate(-50%, -100%)",
            zIndex: 99999,
            whiteSpace: "nowrap",
            background: "var(--sw-fg)",
            color: "var(--sw-bg-card)",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.7rem",
            fontWeight: 600,
            padding: "0.25rem 0.625rem",
            borderRadius: "var(--sw-radius)",
            border: "1px solid var(--sw-border-color)",
            boxShadow: "0.15rem 0.15rem 0 var(--sw-shadow-color)",
            pointerEvents: "none",
            animation: "sw-tooltip-in 0.1s ease-out",
          }}
        >
          {label}
        </div>,
        document.body
      )}
    </>
  );
}
