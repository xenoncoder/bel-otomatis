import { IconButton } from "@chakra-ui/react";
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
    <IconButton
      aria-label={t("close.aria")}
      onClick={onClick}
      size={size}
      position="absolute"
      top={top}
      right={right}
      bg="var(--sw-bg-panel)"
      border="1px solid var(--sw-border-color)"
      borderRadius="var(--sw-radius)"
      boxShadow="0.2rem 0.2rem 0 var(--sw-shadow-color)"
      color="var(--sw-fg)"
      _hover={{
        bg: "var(--sw-pink-light)",
        transform: "translate(-0.05rem, -0.05rem)",
        boxShadow: "0.25rem 0.25rem 0 var(--sw-shadow-color)",
      }}
      _active={{
        transform: "translate(0.15rem, 0.15rem)",
        boxShadow: "0.05rem 0.05rem 0 var(--sw-shadow-color)",
      }}
      transition="box-shadow 0.1s, transform 0.2s"
      css={{
        "&": {
          boxShadow: "0.2rem 0.2rem 0 var(--sw-shadow-color) !important",
          border: "1px solid var(--sw-border-color) !important",
        },
      }}
    >
      <FiX size={size === "xs" ? 14 : 16} strokeWidth={2.5} />
    </IconButton>
  );
}
