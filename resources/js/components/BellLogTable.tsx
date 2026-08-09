import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { BellLog } from "@/lib/types";
import { Badge, Box, HStack, Text, VStack } from "@chakra-ui/react";
import { FiActivity, FiBell } from "react-icons/fi";
import { useT, useLang } from "@/lib/i18n";
import { useTimeFormat } from "@/lib/time-format";

export default function BellLogTable({ refreshKey = 0 }: { refreshKey?: number }) {
  const t = useT();
  const { lang } = useLang();
  const timeFormat = useTimeFormat();
  const locale = lang === "id" ? "id-ID" : "en-GB";
  const [logs, setLogs] = useState<BellLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try { setLogs(await api.bellLogs.list(10)); } finally { setLoading(false); }
    };
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [refreshKey]);

  if (loading) {
    return (
      <VStack py={6} color="var(--sw-fg-subtle)" fontSize="sm">
        <FiActivity size={24} style={{ opacity: 0.4 }} />
        <Text>{t("bellLog.loading")}</Text>
      </VStack>
    );
  }

  if (logs.length === 0) {
    return (
      <VStack py={6} color="var(--sw-fg-subtle)" fontSize="sm">
        <FiBell size={24} style={{ opacity: 0.4 }} />
        <Text>{t("bellLog.empty")}</Text>
      </VStack>
    );
  }

  return (
    <Box
      borderRadius="0"
      overflow="hidden"
    >
      <VStack
        gap={0}
        align="stretch"
        maxH="300px"
        overflowY="auto"
        overflowX="hidden"
        css={{
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-thumb": { background: "var(--sw-purple-normal)", borderRadius: "999px" },
        }}
      >
        {logs.map((log, i) => (
          <HStack
            key={log.id}
            gap={3}
            px={4}
            py={3}
            bg={i % 2 === 0 ? "var(--sw-bg-muted)" : "transparent"}
            _hover={{ bg: "var(--sw-bg-hover)" }}
            transition="background 0.1s"
            align="center"
            borderBottom={i < logs.length - 1 ? "1px solid var(--sw-table-border)" : undefined}
          >
            <Box
              w={7} h={7} flexShrink={0}
              borderRadius="var(--sw-radius)"
              bg={log.status === "manual" ? "var(--sw-yellow-normal)" : "var(--sw-green-normal)"}
              border="1px solid var(--sw-border-color)"
              display="flex" alignItems="center" justifyContent="center"
            >
              <FiBell size={13} color="#ffffff" />
            </Box>
            <VStack gap={0} align="start" flex={1} minW={0}>
              <Text fontSize="sm" fontWeight="700" fontFamily="'Comfortaa', sans-serif" lineClamp={1}>
                {log.schedule?.label ?? t("bellLog.bell")}
              </Text>
              <Text fontSize="2xs" color="var(--sw-fg-subtle)" fontFamily="'IBM Plex Mono', monospace" whiteSpace="nowrap">
                {new Date(log.triggered_at).toLocaleString(locale, {
                  day: "2-digit", month: "short",
                  hour: "2-digit", minute: "2-digit",
                  hour12: timeFormat === "12",
                  timeZone: "Asia/Jakarta",
                })}
              </Text>
            </VStack>
            <Badge
              colorPalette={log.status === "manual" ? "yellow" : "green"}
              variant="solid"
              fontSize="2xs"
              px={2}
              py={0.5}
              borderRadius="var(--sw-radius)"
              textTransform="capitalize"
              fontFamily="'Comfortaa', sans-serif"
              fontWeight="700"
              flexShrink={0}
            >
              {t("logStatus." + log.status)}
            </Badge>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}
