import { useEffect, useState } from "react";
import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { FiClock } from "react-icons/fi";
import { useLang } from "@/lib/i18n";
import { useTimeFormat } from "@/lib/time-format";

const TZ = "Asia/Jakarta";

export default function DigitalClock() {
  const { lang } = useLang();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeFormat = useTimeFormat();
  const locale = lang === "id" ? "id-ID" : "en-GB";
  const time = now.toLocaleTimeString(locale, { hour12: timeFormat === "12", timeZone: TZ });
  const date = now.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ });

  return (
    <VStack gap={4} align="center" position="relative">
      {/* Time */}
      <Text
        fontSize={{ base: "6xl", md: "8xl", lg: "9xl" }}
        fontWeight="700"
        fontFamily="'IBM Plex Mono', monospace"
        letterSpacing="-0.05em"
        color="var(--sw-purple-normal)"
        lineHeight={1}
        textShadow="0.1rem 0.1rem 0 var(--sw-shadow-color)"
      >
        {time}
      </Text>

      {/* Date + icon */}
      <HStack gap={2} alignItems="center">
        <FiClock size={16} color="var(--sw-fg-subtle)" />
        <Text
          fontSize={{ base: "md", md: "lg" }}
          color="var(--sw-fg-muted)"
          textTransform="capitalize"
          fontFamily="'IBM Plex Mono', monospace"
          fontWeight="500"
        >
          {date}
        </Text>
      </HStack>

      {/* Dots accent */}
      <HStack gap={1.5} mt={1}>
        <Box w={1.5} h={1.5} borderRadius="full" bg="var(--sw-purple-normal)" />
        <Box w={1.5} h={1.5} borderRadius="full" bg="var(--sw-green-normal)" />
        <Box w={1.5} h={1.5} borderRadius="full" bg="var(--sw-pink-normal)" />
      </HStack>
    </VStack>
  );
}
