import { useEffect, useRef, useState } from "react";
import { Box, Button, HStack, Input, Text, VStack } from "@chakra-ui/react";
import { useT } from "@/lib/i18n";

function formatSec(sec: number): string {
  if (sec <= 0) return "00:00:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function Timer() {
  const t = useT();
  const [inputH, setInputH] = useState(0);
  const [inputM, setInputM] = useState(5);
  const [inputS, setInputS] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          setDone(true);
          try {
            const audio = new Audio("/sounds/bell.mp3");
            audio.volume = 0.8;
            audio.play().catch(() => {});
          } catch {}
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const handleStart = () => {
    const total = inputH * 3600 + inputM * 60 + inputS;
    if (total <= 0) return;
    setDone(false);
    setRemaining(total);
    setRunning(true);
  };

  const handlePause = () => setRunning(false);
  const handleReset = () => { setRunning(false); setRemaining(0); setDone(false); };

  const total = inputH * 3600 + inputM * 60 + inputS;

  return (
    <VStack gap={6} align="stretch">
      <Box
        className={done ? "sw-pulse" : ""}
        p={{ base: 4, md: 8 }}
        textAlign="center"
        borderRadius="var(--sw-radius)"
        bg={done ? "var(--sw-pink-light)" : "var(--sw-bg-muted)"}
        border="2px solid var(--sw-border-color)"
        boxShadow={done ? "0.4rem 0.4rem 0 var(--sw-shadow-color)" : "none"}
      >
        <Text
          fontSize={{ base: "4xl", md: "7xl" }}
          fontFamily="'IBM Plex Mono', monospace"
          fontWeight="700"
          letterSpacing="-0.03em"
          color={done ? "var(--sw-pink-dark)" : "var(--sw-purple-normal)"}
        >
          {formatSec(remaining)}
        </Text>
        {done && (
          <Text
            fontSize="xl"
            color="var(--sw-pink-dark)"
            mt={2}
            fontFamily="'Comfortaa', sans-serif"
            fontWeight="800"
          >
            {t("timer.timeUp")}
          </Text>
        )}
      </Box>

      {!running && remaining === 0 && (
        <HStack justify="center" gap={2} wrap="wrap">
          {[
            { label: t("timer.hours"), val: inputH, set: setInputH, max: 23 },
            { label: t("timer.minutes"), val: inputM, set: setInputM, max: 59 },
            { label: t("timer.seconds"), val: inputS, set: setInputS, max: 59 },
          ].map((f) => (
            <VStack key={f.label} gap={1}>
              <Input
                type="number"
                min={0}
                max={f.max}
                value={f.val}
                onChange={(e) => f.set(Math.min(f.max, Math.max(0, Number(e.target.value) || 0)))}
                w={{ base: "70px", sm: "80px" }}
                textAlign="center"
                fontSize="2xl"
                fontFamily="'IBM Plex Mono', monospace"
                border="1px solid var(--sw-border-color)"
                borderRadius="var(--sw-radius)"
                bg="var(--sw-bg-panel)"
              />
              <Text fontSize="xs" color="var(--sw-fg-subtle)" fontFamily="'IBM Plex Mono', monospace">{f.label}</Text>
            </VStack>
          ))}
        </HStack>
      )}

      <HStack justify="center" gap={3} wrap="wrap">
        {!running && remaining === 0 && (
          <Button className="sw-btn sw-btn-success" variant="ghost" size="sm" onClick={handleStart} disabled={total <= 0}>
            {t("timer.start")}
          </Button>
        )}
        {running && (
          <Button className="sw-btn sw-btn-warning" variant="ghost" size="sm" onClick={handlePause}>
            {t("timer.pause")}
          </Button>
        )}
        {!running && remaining > 0 && (
          <Button className="sw-btn sw-btn-success" variant="ghost" size="sm" onClick={() => setRunning(true)}>
            {t("timer.resume")}
          </Button>
        )}
        {remaining > 0 && (
          <Button className="sw-btn sw-btn-danger" variant="ghost" size="sm" onClick={handleReset}>
            {t("timer.reset")}
          </Button>
        )}
      </HStack>
    </VStack>
  );
}
