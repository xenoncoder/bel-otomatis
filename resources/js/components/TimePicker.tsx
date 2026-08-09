import { useCallback, useEffect, useRef, useState } from "react";
import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { FiChevronUp, FiChevronDown, FiClock } from "react-icons/fi";
import { useT } from "@/lib/i18n";

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function parseTime(v: string): [number, number, number] {
  const parts = v.split(":").map((p) => parseInt(p, 10) || 0);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

function clamp(n: number, max: number) {
  if (n < 0) return max;
  if (n > max) return 0;
  return n;
}

const ITEM_H = 38;
const VISIBLE = 5;

function ScrollColumn({
  items,
  value,
  onSelect,
}: {
  items: number[];
  value: number;
  onSelect: (n: number) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserScrollingRef = useRef(false);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (listRef.current) {
      const target = value * ITEM_H;
      const current = listRef.current.scrollTop;
      if (Math.abs(current - target) > 1) {
        listRef.current.scrollTo({ top: target, behavior: "smooth" });
      }
    }
    prevValueRef.current = value;
  }, [value]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      el.scrollTop += Math.sign(e.deltaY) * ITEM_H;
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <Box
      className="sw-timecol"
      position="relative"
      h={ITEM_H * VISIBLE}
      overflow="hidden"
      flex={1}
    >
      <Box
        ref={listRef}
        h="100%"
        overflowY="auto"
        css={{
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          scrollSnapType: "y mandatory",
        }}
        onScroll={(e) => {
          const el = listRef.current;
          if (!el) return;
          isUserScrollingRef.current = true;
          if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
          scrollTimerRef.current = setTimeout(() => {
            if (!listRef.current) return;
            const idx = Math.round(el.scrollTop / ITEM_H);
            isUserScrollingRef.current = false;
            if (idx !== value && idx >= 0 && idx < items.length) {
              listRef.current.scrollTop = idx * ITEM_H;
              onSelect(idx);
            }
          }, 80);
        }}
      >
        <Box h={ITEM_H * 2} />
        {items.map((n) => (
          <Box
            key={n}
            h={`${ITEM_H}px`}
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontFamily="'IBM Plex Mono', monospace"
            fontSize="1.25rem"
            fontWeight="700"
            color={n === value ? "var(--sw-fg)" : "var(--sw-fg-subtle)"}
            opacity={n === value ? 1 : 0.3}
            transition="opacity 0.15s, color 0.15s"
            css={{ scrollSnapAlign: "center", cursor: "pointer" }}
            onClick={() => onSelect(n)}
          >
            {pad(n)}
          </Box>
        ))}
        <Box h={ITEM_H * 2} />
      </Box>
    </Box>
  );
}

export default function TimePicker({ value, onChange, label }: TimePickerProps) {
  const t = useT();
  const [h, m, s] = parseTime(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const updateTime = useCallback(
    (nh: number, nm: number, ns: number) => {
      onChange(`${pad(nh)}:${pad(nm)}:${pad(ns)}`);
    },
    [onChange],
  );

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const mins = Array.from({ length: 60 }, (_, i) => i);
  const secs = Array.from({ length: 60 }, (_, i) => i);

  return (
    <Box ref={containerRef} position="relative">
      {label && (
        <Text fontSize="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="700" mb={1.5}>
          {label}
        </Text>
      )}

      {/* Display input */}
      <HStack
        className="sw-timepicker-display"
        gap={2}
        position="relative"
        onClick={() => setOpen(true)}
      >
        <Box color="var(--sw-purple-normal)" flexShrink={0} cursor="pointer" onClick={(e) => { e.stopPropagation(); setOpen(!open); }} display="flex" alignItems="center">
          <FiClock size={16} />
        </Box>
        <input
          type="text"
          value={value}
          onChange={(e: any) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="00:00:00"
          style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "var(--sw-fg)", fontFamily: "'IBM Plex Mono', monospace", fontSize: "1.1rem", fontWeight: "700" }}
        />
      </HStack>

      {/* Popup */}
      {open && (
        <Box
          className="sw-timepicker-popup"
          position="absolute"
          top="calc(100% + 0.5rem)"
          left={0}
          zIndex={50}
          w="280px"
          maxW="calc(100vw - 2rem)"
          bg="var(--sw-bg-card)"
          border="1px solid var(--sw-border-color)"
          borderRadius="var(--sw-radius)"
          boxShadow="0.4rem 0.4rem 0 var(--sw-shadow-color)"
          overflow="hidden"
        >
          {/* Header */}
          <Box
            className="sw-timepicker-popup-header"
            px={3}
            py={2}
            bg="var(--sw-purple-normal)"
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Text fontSize="2xs" fontFamily="'Comfortaa', sans-serif" fontWeight="800" textTransform="uppercase" letterSpacing="0.05em" color="#ffffff">
              {t("timePicker.selectTime")}
            </Text>
            <Text fontSize="2xs" fontFamily="'IBM Plex Mono', monospace" fontWeight="700" color="var(--sw-fg)">
              {pad(h)}:{pad(m)}:{pad(s)}
            </Text>
          </Box>

          {/* Columns Headers */}
          <HStack px={4} py={2} justify="space-around">
            <Text flex={1} fontSize="2xs" fontFamily="'Comfortaa', sans-serif" fontWeight="800" textTransform="uppercase" textAlign="center" color="var(--sw-fg-subtle)">
              {t("timePicker.hours")}
            </Text>
            <Box w="1.5rem" /> {/* Spacer for colon */}
            <Text flex={1} fontSize="2xs" fontFamily="'Comfortaa', sans-serif" fontWeight="800" textTransform="uppercase" textAlign="center" color="var(--sw-fg-subtle)">
              {t("timePicker.minutes")}
            </Text>
            <Box w="1.5rem" /> {/* Spacer for colon */}
            <Text flex={1} fontSize="2xs" fontFamily="'Comfortaa', sans-serif" fontWeight="800" textTransform="uppercase" textAlign="center" color="var(--sw-fg-subtle)">
              {t("timePicker.seconds")}
            </Text>
          </HStack>

          {/* Columns */}
          <HStack gap={0} align="stretch" position="relative" px={1} py={2}>
            {/* Center highlight band */}
            <Box
              position="absolute"
              top="50%"
              left="8px"
              right="8px"
              h={`${ITEM_H}px`}
              transform="translateY(-50%)"
              border="2px solid var(--sw-purple-normal)"
              borderRadius="var(--sw-radius)"
              bg="var(--sw-purple-light)"
              opacity={0.3}
              pointerEvents="none"
            />

            {/* Hours */}
            <VStack gap={0} align="stretch" flex={1} position="relative">
              <HStack gap={0}>
                <button type="button" className="sw-timepicker-stepper" onClick={() => updateTime(clamp(h + 1, 23), m, s)}>
                  <FiChevronUp size={12} />
                </button>
                <ScrollColumn items={hours} value={h} onSelect={(n) => updateTime(n, m, s)} />
                <button type="button" className="sw-timepicker-stepper" onClick={() => updateTime(clamp(h - 1, 23), m, s)}>
                  <FiChevronDown size={12} />
                </button>
              </HStack>
            </VStack>

            <Text fontSize="1.5rem" fontWeight="700" color="var(--sw-fg-subtle)" alignSelf="center">:</Text>

            {/* Minutes */}
            <VStack gap={0} align="stretch" flex={1} position="relative">
              <HStack gap={0}>
                <button type="button" className="sw-timepicker-stepper" onClick={() => updateTime(h, clamp(m + 1, 59), s)}>
                  <FiChevronUp size={12} />
                </button>
                <ScrollColumn items={mins} value={m} onSelect={(n) => updateTime(h, n, s)} />
                <button type="button" className="sw-timepicker-stepper" onClick={() => updateTime(h, clamp(m - 1, 59), s)}>
                  <FiChevronDown size={12} />
                </button>
              </HStack>
            </VStack>

            <Text fontSize="1.5rem" fontWeight="700" color="var(--sw-fg-subtle)" alignSelf="center">:</Text>

            {/* Seconds */}
            <VStack gap={0} align="stretch" flex={1} position="relative">
              <HStack gap={0}>
                <button type="button" className="sw-timepicker-stepper" onClick={() => updateTime(h, m, clamp(s + 1, 59))}>
                  <FiChevronUp size={12} />
                </button>
                <ScrollColumn items={secs} value={s} onSelect={(n) => updateTime(h, m, n)} />
                <button type="button" className="sw-timepicker-stepper" onClick={() => updateTime(h, m, clamp(s - 1, 59))}>
                  <FiChevronDown size={12} />
                </button>
              </HStack>
            </VStack>
          </HStack>


          {/* Footer */}
          <HStack gap={2} p={2} borderTop="1px solid var(--sw-border-color)" bg="var(--sw-bg-muted)" justify="flex-end">
            <button
              type="button"
              className="sw-timepicker-preset"
              onClick={() => {
                const now = new Date();
                updateTime(now.getHours(), now.getMinutes(), now.getSeconds());
              }}
            >
              {t("common.now")}
            </button>
            <button
              type="button"
              className="sw-timepicker-done"
              onClick={() => setOpen(false)}
            >
              {t("common.ok")}
            </button>
          </HStack>
        </Box>
      )}
    </Box>
  );
}
