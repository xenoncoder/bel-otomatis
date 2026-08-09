import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { FiX, FiBell, FiClock } from "react-icons/fi";
import { useT, useLang } from "@/lib/i18n";
import { useTimeFormat, formatTimeString } from "@/lib/time-format";
import { useBellPolling } from "@/hooks/useBellPolling";
import BackgroundOrnament from "@/components/BackgroundOrnament";
import { Box, Text, VStack, HStack } from "@chakra-ui/react";

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

interface FullscreenDisplayProps {
  onExit: () => void;
}

export default function FullscreenDisplay({ onExit }: FullscreenDisplayProps) {
  const t = useT();
  const { lang } = useLang();
  const timeFormat = useTimeFormat();
  const locale = lang === "id" ? "id-ID" : "en-GB";
  const { shouldRing, currentSchedule, todaySchedules, dismiss } = useBellPolling();
  const [, setTick] = useState(0);
  const exitTimerRef = useRef<number | null>(null);
  const wasRingingRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  const handleExit = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onExit();
  }, [onExit]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); handleExit(); }
    };
    const onFsChange = () => {
      if (!document.fullscreenElement) {
        exitTimerRef.current = window.setTimeout(() => onExit(), 300);
      } else if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFsChange);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, [handleExit, onExit]);

  const { hh, mm, ss } = getJakartaParts();
  const nowSec = Number(hh) * 3600 + Number(mm) * 60 + Number(ss);

  const upcoming = todaySchedules
    .filter((s) => toSec(s.start_time) > nowSec)
    .sort((a, b) => toSec(a.start_time) - toSec(b.start_time));
  const next = upcoming[0];
  const upcomingList = upcoming.slice(0, 4);

  const countdown = (() => {
    if (!next) return null;
    let diff = toSec(next.start_time) - nowSec;
    if (diff <= 0) return "00:00:00";
    const h = Math.floor(diff / 3600); diff %= 3600;
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
  })();

  const now = new Date();
  const timeStr = now.toLocaleTimeString(locale, { hour12: timeFormat === "12", timeZone: TZ });
  const dateStr = now.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ });

  const isRinging = shouldRing && !!currentSchedule;

  return createPortal(
    <Box
      position="fixed"
      top={0} left={0}
      w="100%" h="100%"
      color={isRinging ? "var(--sw-fg)" : "var(--sw-fg)"}
      zIndex={99999}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      onClick={handleExit}
      cursor="pointer"
      overflow="hidden"
      transition="background 0.3s"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        background: "radial-gradient(ellipse at 50% 40%, var(--sw-bg-card) 0%, var(--sw-bg-muted) 100%)",
      }}
      className="sw-no-scrollbar"
    >
      <BackgroundOrnament variant="normal" />

      {/* Top bar — exit hint + button */}
      <Box
        position="absolute"
        top={0} left={0} right={0}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        px={{ base: 4, md: 8 }}
        py={{ base: 4, md: 5 }}
        zIndex={2}
        pointerEvents="none"
      >
        <HStack gap={2} opacity={0.5}>
          <Text
            fontSize="sm"
            fontFamily="'IBM Plex Mono', monospace"
            color="var(--sw-fg-subtle)"
          >
            {t("fullscreen.clickToExit")}
          </Text>
        </HStack>
        <Box
          w={{ base: 10, md: 12 }}
          h={{ base: 10, md: 12 }}
          borderRadius="var(--sw-radius)"
          border="2px solid var(--sw-border-color)"
          bg="var(--sw-bg-card)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          boxShadow="0.2rem 0.2rem 0 var(--sw-shadow-color)"
          _hover={{ transform: "translate(-0.05rem, -0.05rem)", boxShadow: "0.25rem 0.25rem 0 var(--sw-shadow-color)" }}
          transition="all 0.15s"
          color="var(--sw-fg)"
          pointerEvents="auto"
        >
          <FiX size={24} />
        </Box>
      </Box>

      {isRinging ? (
        /* ============ RINGING STATE ============ */
        <VStack gap={{ base: 6, md: 10 }} alignItems="center" zIndex={1} onClick={handleExit}>
          {/* Pulsing rings behind bell */}
          <Box position="relative" display="flex" alignItems="center" justifyContent="center">
            <Box
              position="absolute"
              w={{ base: 180, md: 260 }}
              h={{ base: 180, md: 260 }}
              borderRadius="50%"
              border="3px solid var(--sw-purple-normal)"
              opacity={0.2}
              className="sw-pulse"
            />
            <Box
              position="absolute"
              w={{ base: 140, md: 200 }}
              h={{ base: 140, md: 200 }}
              borderRadius="50%"
              border="3px solid var(--sw-purple-normal)"
              opacity={0.3}
              className="sw-pulse"
              style={{ animationDelay: "0.3s" }}
            />
            {/* Bell icon */}
            <Box
              className="sw-ring"
              w={{ base: 100, md: 150 }}
              h={{ base: 100, md: 150 }}
              borderRadius="50%"
              border="4px solid var(--sw-border-color)"
              bg="var(--sw-purple-normal)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
              boxShadow="0.5rem 0.5rem 0 var(--sw-shadow-color)"
              position="relative"
              zIndex={1}
            >
              <FiBell size={75} color="#ffffff" strokeWidth={2.5} />
            </Box>
          </Box>

          {/* Ringing text */}
          <Text
            fontSize={{ base: "4xl", md: "7xl" }}
            fontFamily="'Comfortaa', sans-serif"
            fontWeight="800"
            color="var(--sw-fg-heading)"
            letterSpacing="0.08em"
            textTransform="uppercase"
          >
            {t("fullscreen.ringing")}
          </Text>

          {/* Label + time */}
          {currentSchedule?.label && (
            <Box
              px={{ base: 6, md: 8 }}
              py={{ base: 2, md: 3 }}
              borderRadius="var(--sw-radius-lg)"
              bg="var(--sw-purple-light)"
              border="2px solid var(--sw-border-color)"
            >
              <Text
                fontSize={{ base: "2xl", md: "4xl" }}
                fontFamily="'Comfortaa', sans-serif"
                fontWeight="700"
                color="var(--sw-fg)"
              >
                {currentSchedule.label}
              </Text>
            </Box>
          )}
          <Text
            fontSize={{ base: "5xl", md: "8xl" }}
            fontFamily="'IBM Plex Mono', monospace"
            fontWeight="700"
            color="var(--sw-purple-normal)"
            opacity={0.9}
            letterSpacing="-0.03em"
          >
            {formatTimeString(currentSchedule?.start_time, timeFormat)}
          </Text>
        </VStack>
      ) : (
        /* ============ NORMAL STATE ============ */
        <>
          {/* Clock — centered */}
          <VStack gap={2} alignItems="center" zIndex={1}>
            <Text
              fontSize={{ base: "7xl", sm: "9xl", md: "16xl", lg: "20xl" }}
              fontWeight="700"
              fontFamily="'IBM Plex Mono', monospace"
              letterSpacing="-0.05em"
              color="var(--sw-purple-normal)"
              lineHeight={1}
              textShadow="0.08rem 0.08rem 0 var(--sw-shadow-color)"
            >
              {timeStr}
            </Text>
            <Text
              fontSize={{ base: "md", sm: "lg", md: "xl" }}
              color="var(--sw-fg-muted)"
              textTransform="capitalize"
              fontFamily="'IBM Plex Mono', monospace"
              opacity={0.7}
            >
              {dateStr}
            </Text>
          </VStack>

          {/* Countdown — bottom right */}
          {next ? (
            <Box
              position="absolute"
              bottom={{ base: 4, md: 8 }}
              right={{ base: 4, md: 8 }}
              zIndex={2}
              textAlign="right"
            >
              <HStack gap={2} alignItems="center" justifyContent="flex-end" mb={1}>
                <Text
                  fontSize={{ base: "xs", md: "sm" }}
                  fontFamily="'IBM Plex Mono', monospace"
                  color="var(--sw-fg-subtle)"
                  textTransform="uppercase"
                  letterSpacing="0.15em"
                >
                  {t("fullscreen.nextBellIn")}
                </Text>
                <FiClock size={14} color="var(--sw-fg-subtle)" />
              </HStack>
              <Text
                fontSize={{ base: "2xl", md: "4xl", lg: "5xl" }}
                fontFamily="'IBM Plex Mono', monospace"
                fontWeight="700"
                color="var(--sw-fg)"
                letterSpacing="-0.03em"
                lineHeight={1}
              >
                {countdown}
              </Text>
              <Text
                fontSize={{ base: "md", md: "lg" }}
                fontFamily="'Comfortaa', sans-serif"
                fontWeight="700"
                color="var(--sw-purple-normal)"
                mt={1}
              >
                {next.label}
              </Text>
              <Text
                fontSize={{ base: "xs", md: "sm" }}
                fontFamily="'IBM Plex Mono', monospace"
                color="var(--sw-fg-muted)"
              >
                {t("fullscreen.nextBellAt")} {formatTimeString(next.start_time, timeFormat)} {t("common.wib")}
              </Text>
            </Box>
          ) : (
            <Box
              position="absolute"
              bottom={{ base: 4, md: 8 }}
              right={{ base: 4, md: 8 }}
              zIndex={2}
              textAlign="right"
            >
              <Text
                fontSize={{ base: "lg", md: "xl" }}
                fontFamily="'Comfortaa', sans-serif"
                fontWeight="600"
                color="var(--sw-fg-subtle)"
              >
                {t("fullscreen.noMoreBells")}
              </Text>
            </Box>
          )}
        </>
      )}
    </Box>,
    document.body,
  );
}
