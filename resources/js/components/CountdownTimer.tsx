import { useEffect, useState } from "react";
import { Box, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { FiClock, FiBell, FiChevronRight } from "react-icons/fi";
import type { Schedule } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { useTimeFormat, formatTimeString } from "@/lib/time-format";

const TZ = "Asia/Jakarta";

function getJakartaParts() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false, timeZone: TZ,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  return { hh: get("hour"), mm: get("minute"), ss: get("second") };
}

function toSec(time: string) {
  const [h, m, s] = time.split(":").map(Number);
  return (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
}

interface CountdownTimerProps {
  schedules: Schedule[];
}

export default function CountdownTimer({ schedules }: CountdownTimerProps) {
  const t = useT();
  const timeFormat = useTimeFormat();
  const [, setNow] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setNow((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const { hh, mm, ss } = getJakartaParts();
  const nowSec = Number(hh) * 3600 + Number(mm) * 60 + Number(ss);

  const upcoming = schedules
    .filter((s) => toSec(s.start_time) > nowSec)
    .sort((a, b) => toSec(a.start_time) - toSec(b.start_time));
  const next = upcoming[0];
  const afterNext = upcoming.slice(1, 4);

  const countdown = (() => {
    if (!next) return null;
    let diff = toSec(next.start_time) - nowSec;
    if (diff <= 0) return { h: 0, m: 0, s: 0 };
    return { h: Math.floor(diff / 3600), m: Math.floor((diff % 3600) / 60), s: diff % 60 };
  })();

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <Box className="sw-card" borderRadius="var(--sw-radius)">
      <Box className="sw-card-header">
        <HStack gap={2} align="center">
          <FiClock size={14} color="#ffffff" />
          <Heading size="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="800">{t("countdown.title")}</Heading>
        </HStack>
      </Box>
      <Box className="sw-card-body" p={{ base: 4, md: 5 }}>
        {next && countdown ? (
          <VStack gap={4} align="stretch">
            {/* Label + time */}
            <HStack gap={2} align="center" wrap="wrap">
              <Box
                w={9} h={9}
                borderRadius="var(--sw-radius)"
                bg="var(--sw-purple-normal)"
                border="1px solid var(--sw-border-color)"
                display="flex" alignItems="center" justifyContent="center"
                flexShrink={0}
                boxShadow="0.15rem 0.15rem 0 var(--sw-shadow-color)"
              >
                <FiBell size={15} color="#ffffff" />
              </Box>
              <VStack gap={0} align="start" flex={1} minW={0}>
                <Text fontSize="sm" fontWeight="700" fontFamily="'Comfortaa', sans-serif" lineClamp={1}>
                  {next.label}
                </Text>
                <Text fontSize="xs" color="var(--sw-fg-muted)" fontFamily="'IBM Plex Mono', monospace">
                  {t("countdown.at", { time: formatTimeString(next.start_time, timeFormat) })}
                </Text>
              </VStack>
            </HStack>

            {/* Countdown — split boxes */}
            <HStack gap={2} justify="center" align="stretch">
              {[
                { val: countdown.h, label: t("timer.hours") },
                { val: countdown.m, label: t("timer.minutes") },
                { val: countdown.s, label: t("timer.seconds") },
              ].map((unit, i) => (
                <HStack key={i} gap={2} align="stretch">
                  {i > 0 && (
                    <Text alignSelf="center" fontSize="2xl" fontWeight="700" color="var(--sw-fg-subtle)" fontFamily="'IBM Plex Mono', monospace">:</Text>
                  )}
                  <Box
                    flex={1}
                    minW="60px"
                    borderRadius="var(--sw-radius)"
                    bg="var(--sw-bg-panel)"
                    border="1px solid var(--sw-border-color)"
                    boxShadow="0.2rem 0.2rem 0 var(--sw-shadow-color)"
                    textAlign="center"
                    py={2}
                  >
                    <Text
                      fontSize={{ base: "2xl", md: "3xl" }}
                      fontFamily="'IBM Plex Mono', monospace"
                      fontWeight="700"
                      color="var(--sw-purple-normal)"
                      lineHeight={1}
                      letterSpacing="-0.03em"
                    >
                      {pad(unit.val)}
                    </Text>
                    <Text
                      fontSize="2xs"
                      fontFamily="'IBM Plex Mono', monospace"
                      color="var(--sw-fg-subtle)"
                      textTransform="uppercase"
                      letterSpacing="0.05em"
                      mt={1}
                    >
                      {unit.label}
                    </Text>
                  </Box>
                </HStack>
              ))}
            </HStack>

            {/* Upcoming bells */}
            {afterNext.length > 0 && (
              <Box>
                <Text fontSize="2xs" fontFamily="'Comfortaa', sans-serif" fontWeight="700" color="var(--sw-fg-subtle)" textTransform="uppercase" letterSpacing="wider" mb={2}>
                  {t("countdown.nextBell")}
                </Text>
                <VStack gap={1} align="stretch">
                  {afterNext.map((s, i) => (
                    <HStack
                      key={i}
                      gap={2}
                      px={2}
                      py={1.5}
                      borderRadius="var(--sw-radius)"
                      bg="var(--sw-bg-muted)"
                      border="1px solid transparent"
                      _hover={{ bg: "var(--sw-bg-hover)", border: "1px solid var(--sw-border-color)" }}
                      transition="all 0.15s"
                    >
                      <Text
                        fontSize="xs"
                        fontFamily="'IBM Plex Mono', monospace"
                        fontWeight="700"
                        color="var(--sw-purple-normal)"
                        whiteSpace="nowrap"
                      >
                        {formatTimeString(s.start_time, timeFormat)}
                      </Text>
                      <FiChevronRight size={10} color="var(--sw-fg-subtle)" />
                      <Text
                        fontSize="xs"
                        fontFamily="'Comfortaa', sans-serif"
                        fontWeight="600"
                        color="var(--sw-fg-muted)"
                        lineClamp={1}
                      >
                        {s.label}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            )}
          </VStack>
        ) : (
          <VStack gap={3} py={4} alignItems="center">
            <Box
              w={12} h={12}
              borderRadius="50%"
              bg="var(--sw-bg-muted)"
              border="1px solid var(--sw-border-color)"
              display="flex" alignItems="center" justifyContent="center"
              opacity={0.6}
            >
              <FiBell size={20} color="var(--sw-fg-subtle)" />
            </Box>
            <Text fontSize="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="600" color="var(--sw-fg-subtle)" textAlign="center">
              {t("countdown.noMore")}
            </Text>
          </VStack>
        )}
      </Box>
    </Box>
  );
}
