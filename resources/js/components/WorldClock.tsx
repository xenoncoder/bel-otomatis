import { useEffect, useState } from "react";
import { Box, HStack, Text, VStack, SimpleGrid, Heading } from "@chakra-ui/react";
import { useT, useLang } from "@/lib/i18n";
import { useTimeFormat } from "@/lib/time-format";

interface CityClock {
  city: string;
  label: string;
  tz: string;
}

const CITIES: CityClock[] = [
  { city: "Jakarta", label: "worldClock.indonesia", tz: "Asia/Jakarta" },
  { city: "Tokyo", label: "worldClock.japan", tz: "Asia/Tokyo" },
  { city: "London", label: "worldClock.uk", tz: "Europe/London" },
  { city: "New York", label: "worldClock.usa", tz: "America/New_York" },
  { city: "Dubai", label: "worldClock.uae", tz: "Asia/Dubai" },
  { city: "Sydney", label: "worldClock.australia", tz: "Australia/Sydney" },
];

function getTime(tz: string, timeFormat: "12" | "24", locale: string) {
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: timeFormat === "12", timeZone: tz,
  }).format(new Date());
  const date = new Intl.DateTimeFormat(locale, {
    weekday: "short", day: "numeric", month: "short",
    timeZone: tz,
  }).format(new Date());
  return { time, date };
}

export default function WorldClock() {
  const t = useT();
  const { lang } = useLang();
  const locale = lang === "id" ? "id-ID" : "en-GB";
  const timeFormat = useTimeFormat();
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={4}>
      {CITIES.map((c) => {
        const { time, date } = getTime(c.tz, timeFormat, locale);
        const isJakarta = c.city === "Jakarta";
        return (
          <Box
            key={c.city}
            className={`sw-card ${isJakarta ? "sw-card-hover" : ""}`}
            p={5}
            borderRadius="var(--sw-radius)"
            borderWidth={isJakarta ? "2px" : "1px"}
            borderColor="var(--sw-border-color)"
            bg={isJakarta ? "var(--sw-green-light)" : "var(--sw-bg-card)"}
          >
            <VStack gap={1} align="stretch">
              <HStack justify="space-between">
                <Heading size="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="800">{c.city}</Heading>
                <Text fontSize="xs" color="var(--sw-fg-subtle)" fontFamily="'IBM Plex Mono', monospace">{t(c.label)}</Text>
              </HStack>
              <Text
                fontSize={{ base: "2xl", md: "3xl" }}
                fontFamily="'IBM Plex Mono', monospace"
                fontWeight="700"
                color={isJakarta ? "var(--sw-green-dark)" : "var(--sw-purple-normal)"}
              >
                {time}
              </Text>
              <Text fontSize="xs" color="var(--sw-fg-muted)" textTransform="capitalize" fontFamily="'IBM Plex Mono', monospace">
                {date}
              </Text>
            </VStack>
          </Box>
        );
      })}
    </SimpleGrid>
  );
}
