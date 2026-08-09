import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Dialog, VStack, Text, Box, HStack, Progress } from "@chakra-ui/react";
import { FiBell, FiX, FiClock, FiRepeat, FiPause, FiPlay } from "react-icons/fi";
import { useT } from "@/lib/i18n";
import { toaster } from "@/lib/toaster";
import { useTimeFormat, formatTimeString } from "@/lib/time-format";
import type { Schedule } from "@/lib/types";

interface BellPlayerProps {
  shouldRing: boolean;
  schedule: Schedule | null;
  onDismiss: () => void;
}

const SNOOZE_SEC = 5 * 60;

export default function BellPlayer({ shouldRing, schedule, onDismiss }: BellPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const snoozeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playCountRef = useRef(0);
  const [snoozed, setSnoozed] = useState(false);
  const [snoozeCount, setSnoozeCount] = useState(0);
  const [currentPlay, setCurrentPlay] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const t = useT();
  const timeFormat = useTimeFormat();

  const maxPlays = schedule?.loop_until_stopped ? Infinity : (schedule?.repeat_count ?? 1);
  const isLoop = schedule?.loop_until_stopped ?? false;

  const stopAudio = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (snoozeTimerRef.current) {
      clearTimeout(snoozeTimerRef.current);
      snoozeTimerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playBell = useCallback(() => {
    stopAudio();
    playCountRef.current = 0;
    setCurrentPlay(0);

    const url = schedule?.bell_sound?.url ?? "/sounds/bell.mp3";
    const audio = new Audio(url);

    if (schedule?.loop_until_stopped) {
      audio.loop = true;
    }

    audio.volume = 0.8;
    audioRef.current = audio;

    if (!schedule?.loop_until_stopped) {
      audio.addEventListener("ended", () => {
        playCountRef.current++;
        setCurrentPlay(playCountRef.current);
        if (playCountRef.current < maxPlays) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        } else {
          setIsPlaying(false);
          stopAudio();
          onDismiss();
        }
      });
    }

    audio.play().then(() => setIsPlaying(true)).catch(() => {});
  }, [schedule, maxPlays, stopAudio]);

  useEffect(() => {
    if (shouldRing) {
      setSnoozed(false);
      playBell();
      return () => stopAudio();
    }
  }, [shouldRing, playBell, stopAudio]);

  const handleStop = () => {
    if (snoozed) {
      toaster.create({ title: "Batalkan penundaan alarm", type: "info" });
    }
    stopAudio();
    setSnoozed(false);
    setSnoozeCount(0);
    onDismiss();
  };

  const handleSnooze = () => {
    stopAudio();
    setSnoozed(true);
    setSnoozeCount((c) => c + 1);
    snoozeTimerRef.current = setTimeout(() => {
      setSnoozed(false);
      playBell();
    }, SNOOZE_SEC * 1000);
  };

  const handlePauseResume = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const open = shouldRing || snoozed;
  const progressVal = maxPlays === Infinity ? undefined : ((currentPlay) / maxPlays) * 100;

  if (!open) return null;

  return (
    <Box
      position="fixed"
      bottom={{ base: 4, md: 8 }}
      right={{ base: 4, md: 8 }}
      zIndex="toast"
      bg="var(--sw-bg-card)"
      border="2px solid var(--sw-border-color)"
      borderRadius="var(--sw-radius-lg)"
      boxShadow="0.5rem 0.5rem 0 var(--sw-shadow-color)"
      w={{ base: "calc(100vw - 2rem)", sm: "340px" }}
      overflow="hidden"
      animation="slideUp 0.3s ease-out"
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      
      {/* Top stripe */}
      <Box h="6px" bg={isLoop ? "var(--sw-purple-normal)" : "var(--sw-pink-normal)"} />

      <VStack gap={0} align="stretch">
        {/* Header section with animated bell */}
        <Box
          bg={isLoop ? "var(--sw-purple-light)" : "var(--sw-pink-light)"}
          px={4} py={4}
          textAlign="center"
          borderBottom="1px solid var(--sw-border-color)"
          position="relative"
        >
          <HStack gap={3} align="center" justify="center">
            {/* Animated bell */}
            <Box
              className="sw-ring"
              w={12} h={12}
              borderRadius="full"
              border="2px solid var(--sw-border-color)"
              bg={isLoop ? "var(--sw-purple-normal)" : "var(--sw-pink-normal)"}
              color="#ffffff"
              display="flex" alignItems="center" justifyContent="center"
              boxShadow="0.2rem 0.2rem 0 var(--sw-shadow-color)"
              flexShrink={0}
            >
              <Box as={FiBell} boxSize={5} />
            </Box>
            <VStack align="flex-start" gap={0} overflow="hidden">
              <Text
                fontSize="2xs"
                color="var(--sw-fg)"
                fontWeight="700"
                textTransform="uppercase"
                letterSpacing="0.1em"
                fontFamily="'Comfortaa', sans-serif"
                opacity={0.6}
              >
                {snoozed ? t("player.snoozed") : t("player.ringing")}
              </Text>
              <Text
                fontSize="md"
                fontWeight="800"
                color="var(--sw-fg)"
                fontFamily="'Comfortaa', sans-serif"
                lineHeight="1.2"
                truncate
                maxW="200px"
              >
                {schedule?.label ?? t("player.bell")}
              </Text>
              <Text
                fontSize="xs"
                color="var(--sw-fg)"
                fontFamily="'IBM Plex Mono', monospace"
                fontWeight="700"
                opacity={0.7}
              >
                {formatTimeString(schedule?.start_time, timeFormat)} {t("common.wib")}
              </Text>
            </VStack>
          </HStack>
        </Box>

        {/* Info section */}
        <Box px={4} py={4}>
          <VStack gap={3} align="stretch">
            {/* Playback info */}
            <Box>
              {isLoop ? (
                <HStack
                  gap={2}
                  p={2}
                  borderRadius="var(--sw-radius)"
                  bg="var(--sw-bg-muted)"
                  border="1px solid var(--sw-border-color)"
                  justify="center"
                >
                  <FiRepeat size={12} color="var(--sw-purple-normal)" />
                  <Text fontSize="xs" color="var(--sw-purple-normal)" fontWeight="700" fontFamily="'Comfortaa', sans-serif">
                    {t("player.loopMode")}
                  </Text>
                </HStack>
              ) : maxPlays > 1 ? (
                <VStack gap={1}>
                  <HStack justify="space-between" w="full">
                    <Text fontSize="2xs" color="var(--sw-fg-subtle)" fontFamily="'IBM Plex Mono', monospace">
                      {t("player.playProgress", { current: currentPlay + 1, total: maxPlays })}
                    </Text>
                    <Text fontSize="2xs" color="var(--sw-fg-subtle)" fontFamily="'IBM Plex Mono', monospace">
                      {isPlaying ? t("player.playing") : t("player.finished")}
                    </Text>
                  </HStack>
                  <Progress.Root value={progressVal} size="xs" w="full" colorPalette="pink">
                    <Progress.Track bg="var(--sw-bg-muted)" borderRadius="var(--sw-radius)">
                      <Progress.Range borderRadius="var(--sw-radius)" />
                    </Progress.Track>
                  </Progress.Root>
                </VStack>
              ) : (
                <HStack justify="center" gap={2}>
                  <Text fontSize="xs" color="var(--sw-fg-subtle)" fontFamily="'IBM Plex Mono', monospace">
                    {isPlaying ? t("player.playing") : t("player.finished")}
                  </Text>
                </HStack>
              )}
            </Box>

            {/* Snoozed state */}
            {snoozed ? (
              <VStack gap={2}>
                <Box
                  p={2}
                  borderRadius="var(--sw-radius)"
                  bg="var(--sw-yellow-light)"
                  border="1px solid var(--sw-yellow-dark)"
                  textAlign="center"
                >
                  <Text fontSize="xs" color="#ffffff" fontFamily="'IBM Plex Mono', monospace">
                    {t("player.snoozeIn", { minutes: SNOOZE_SEC / 60 })}
                  </Text>
                </Box>
                <Button className="sw-btn" variant="ghost" size="sm" onClick={handleStop} colorPalette="red" w="full">
                  <Box as={FiX} /> {t("player.cancelSnooze")}
                </Button>
              </VStack>
            ) : (
              <VStack gap={2}>
                {/* Main controls */}
                <HStack gap={2} w="full">
                  <Button
                    variant="outline"
                    flex={1}
                    size="xs"
                    onClick={handlePauseResume}
                    colorPalette={isPlaying ? "yellow" : "green"}
                  >
                    <Box as={isPlaying ? FiPause : FiPlay} />
                    {isPlaying ? t("player.pause") : t("player.resume")}
                  </Button>
                  <Button
                    variant="outline"
                    flex={1}
                    size="xs"
                    onClick={handleSnooze}
                  >
                    <Box as={FiClock} /> {t("player.snooze5")}
                  </Button>
                </HStack>

                {/* Stop button */}
                <Button
                  colorPalette={isLoop ? "purple" : "pink"}
                  size="sm"
                  onClick={handleStop}
                  w="full"
                  fontWeight="800"
                  fontFamily="'Comfortaa', sans-serif"
                >
                  <FiX size={14} />
                  {isLoop ? t("player.stopBell") : t("player.stop")}
                </Button>
              </VStack>
            )}
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}
