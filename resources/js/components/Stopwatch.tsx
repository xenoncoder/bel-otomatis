import { useEffect, useRef, useState } from "react";
import { Box, Button, HStack, Heading, Text, VStack } from "@chakra-ui/react";
import { useT } from "@/lib/i18n";

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const cs = Math.floor((ms % 1000) / 10);
  if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

export default function Stopwatch() {
  const t = useT();
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const startRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now() - elapsed;
    const tick = () => {
      setElapsed(performance.now() - startRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running]);

  const handleStartPause = () => setRunning((r) => !r);
  const handleReset = () => { setRunning(false); setElapsed(0); setLaps([]); };
  const handleLap = () => { if (running) setLaps((l) => [...l, elapsed]); };

  return (
    <VStack gap={6} align="stretch">
      <Box p={{ base: 4, md: 8 }} textAlign="center" borderRadius="var(--sw-radius)" bg="var(--sw-bg-muted)" border="1px solid var(--sw-border-color)">
        <Text
          fontSize={{ base: "4xl", md: "7xl" }}
          fontFamily="'IBM Plex Mono', monospace"
          fontWeight="700"
          letterSpacing="-0.03em"
          color="var(--sw-purple-normal)"
        >
          {formatMs(elapsed)}
        </Text>
      </Box>
      <HStack justify="center" gap={3} wrap="wrap">
        <Button className="sw-btn sw-btn-success" variant="ghost" size="sm" onClick={handleStartPause}>
          {running ? t("stopwatch.pause") : t("stopwatch.start")}
        </Button>
        <Button className="sw-btn" variant="ghost" size="sm" onClick={handleLap} disabled={!running}>
          {t("stopwatch.lap")}
        </Button>
        <Button className="sw-btn sw-btn-danger" variant="ghost" size="sm" onClick={handleReset}>
          {t("stopwatch.reset")}
        </Button>
      </HStack>
      {laps.length > 0 && (
        <Box className="sw-card" p={4} maxH="300px" overflowY="auto" overflowX="hidden" borderRadius="var(--sw-radius)">
          <Heading size="xs" mb={3} color="var(--sw-fg-muted)" fontFamily="'Comfortaa', sans-serif" fontWeight="700">{t("stopwatch.lapTimes")}</Heading>
          <VStack gap={1} align="stretch">
            {laps.map((lap, i) => (
              <HStack key={i} justify="space-between" px={2} py={1} borderRadius="var(--sw-radius)" _hover={{ bg: "var(--sw-bg-hover)" }}>
                <Text fontSize="sm" color="var(--sw-fg-subtle)" fontFamily="'IBM Plex Mono', monospace">{t("stopwatch.lapLabel", { n: i + 1 })}</Text>
                <Text fontSize="sm" fontFamily="'IBM Plex Mono', monospace" fontWeight="600">{formatMs(lap)}</Text>
              </HStack>
            ))}
          </VStack>
        </Box>
      )}
    </VStack>
  );
}
