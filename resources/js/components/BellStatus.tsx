import { Badge, Box, HStack, Text } from "@chakra-ui/react";
import { useT } from "@/lib/i18n";

interface BellStatusProps {
  shouldRing: boolean;
}

export default function BellStatus({ shouldRing }: BellStatusProps) {
  const t = useT();
  return (
    <HStack gap={2}>
      <Box
        w={3}
        h={3}
        borderRadius="full"
        border="1px solid var(--sw-border-color)"
        bg={shouldRing ? "var(--sw-pink-normal)" : "var(--sw-green-normal)"}
        className={shouldRing ? "sw-pulse" : undefined}
      />
      <Badge
        colorPalette={shouldRing ? "red" : "green"}
        variant="solid"
        fontSize="xs"
        fontFamily="'Comfortaa', sans-serif"
        fontWeight="700"
        border="1px solid var(--sw-border-color)"
        borderRadius="var(--sw-radius)"
      >
        {shouldRing ? t("bellStatus.ringing") : t("bellStatus.idle")}
      </Badge>
    </HStack>
  );
}
