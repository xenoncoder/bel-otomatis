import { FiX } from "react-icons/fi";
import { useT } from "@/lib/i18n";

interface CloseButtonProps {
  onClick?: () => void;
  size?: "xs" | "sm";
  top?: number | string;
  right?: number | string;
}

export default function CloseButton({ onClick, size = "xs", top = 2, right = 2 }: CloseButtonProps) {
  const t = useT();
  return (
    <button
      type="button"
      aria-label={t("close.aria")}
      onClick={onClick}
      className={`absolute flex items-center justify-center rounded-lg transition-colors border border-white/20 dark:border-white/10 bg-white/50 dark:bg-black/20 hover:bg-rose-500 hover:text-white hover:border-rose-500 text-gray-500 shadow-sm ${size === "xs" ? "w-6 h-6" : "w-8 h-8"}`}
      style={{ top: typeof top === "number" ? top * 4 : top, right: typeof right === "number" ? right * 4 : right }}
    >
      <FiX size={size === "xs" ? 14 : 16} strokeWidth={2.5} />
    </button>
  );
}
