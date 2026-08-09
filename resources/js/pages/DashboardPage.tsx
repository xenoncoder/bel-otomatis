import { useBellPolling } from "@/hooks/useBellPolling";
import BellLogTable from "@/components/BellLogTable";
import BellStatus from "@/components/BellStatus";
import CountdownTimer from "@/components/CountdownTimer";
import DigitalClock from "@/components/DigitalClock";
import FullscreenDisplay from "@/components/FullscreenDisplay";
import BackgroundOrnament from "@/components/BackgroundOrnament";
import Stopwatch from "@/components/Stopwatch";
import Timer from "@/components/Timer";
import WorldClock from "@/components/WorldClock";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { toaster } from "@/lib/toaster";
import { useState, useCallback } from "react";
import { Box, Button, Flex, HStack, Heading, SimpleGrid, Tabs, Text, VStack } from "@chakra-ui/react";
import { FiPlay, FiClock, FiZap, FiWatch, FiGlobe, FiMaximize } from "react-icons/fi";

export default function DashboardPage() {
  const { shouldRing, todaySchedules, trigger } = useBellPolling();
  const [tab, setTab] = useState("clock");
  const [testing, setTesting] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [logRefresh, setLogRefresh] = useState(0);
  const t = useT();

  const tabs = [
    { value: "clock", label: t("tab.clock"), icon: FiClock },
    { value: "stopwatch", label: t("tab.stopwatch"), icon: FiZap },
    { value: "timer", label: t("tab.timer"), icon: FiWatch },
    { value: "world", label: t("tab.worldClock"), icon: FiGlobe },
  ];

  const handleTestBell = async () => {
    const nowStr = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false, timeZone: "Asia/Jakarta",
    }).format(new Date());
    const next = todaySchedules.find((s) => s.start_time > nowStr) ?? todaySchedules[0];
    if (!next) { toaster.create({ title: t("dashboard.noScheduleToTest"), type: "warning" }); return; }
    setTesting(true);
    try {
      await api.schedules.trigger(next.id);
      toaster.create({ title: t("dashboard.bellTested", { label: next.label }), type: "info" });
      setLogRefresh((n) => n + 1);
      trigger(next);
    } catch (e) {
      toaster.create({ title: (e as Error).message, type: "error" });
    } finally { setTesting(false); }
  };

  const enterFullscreen = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      /* not supported, still show overlay */
    }
    setFullscreen(true);
  }, []);

  return (
    <Box position="relative">
      <BackgroundOrnament variant="normal" />
      <VStack gap={6} align="stretch" position="relative" zIndex={1}>
        {fullscreen && <FullscreenDisplay onExit={() => setFullscreen(false)} />}

        <Flex justify="space-between" align="center" gap={3} direction={{ base: "column", md: "row" }} w="full">
          <VStack gap={1} align={{ base: "center", md: "start" }} flex={1} minW={0} w="full">
            <Heading size={{ base: "xl", md: "2xl" }} fontFamily="'Comfortaa', sans-serif" fontWeight="300" color="var(--sw-fg-heading)" textAlign={{ base: "center", md: "left" }}>
              {t("dashboard.title")}
            </Heading>
            <BellStatus shouldRing={shouldRing} />
          </VStack>
          <HStack gap={2} flexShrink={0}>
            <Button className="sw-btn sw-btn-success" size="sm" onClick={handleTestBell} loading={testing} whiteSpace="nowrap" gap={2} variant="ghost">
              <FiPlay size={14} /> {t("dashboard.testBell")}
            </Button>
            <Button className="sw-btn sw-btn-primary" size="sm" onClick={enterFullscreen} whiteSpace="nowrap" gap={2} variant="ghost">
              <FiMaximize size={14} /> {t("fullscreen.enter")}
            </Button>
          </HStack>
        </Flex>

        <Tabs.Root value={tab} onValueChange={(e) => setTab(e.value)}>
          <Tabs.List bg="var(--sw-bg-card)" p={1} borderRadius="var(--sw-radius)" border="1px solid var(--sw-border-color)" boxShadow="0.2rem 0.2rem 0 var(--sw-shadow-color)" gap={1} overflowX="auto" css={{ "&::-webkit-scrollbar": { display: "none" }, scrollbarWidth: "none" }}>
            {tabs.map((tabItem) => {
              const TabIcon = tabItem.icon;
              return (
                <Tabs.Trigger key={tabItem.value} value={tabItem.value} className="sw-tab">
                  <Box as="span" display="inline-flex" alignItems="center" gap={1.5}>
                    <TabIcon size={14} />
                    {tabItem.label}
                  </Box>
                </Tabs.Trigger>
              );
            })}
          </Tabs.List>

          <Box mt={6}>
            {tab === "clock" && (
              <VStack gap={6} align="stretch">
                <Box className="sw-card" borderRadius="var(--sw-radius)">
                  <Box className="sw-card-header sw-card-header-green">
                    <Heading size="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="800">{t("dashboard.currentTime")}</Heading>
                  </Box>
                  <Box className="sw-card-body" p={{ base: 4, md: 8 }}>
                    <DigitalClock />
                  </Box>
                </Box>
                <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
                  <CountdownTimer schedules={todaySchedules} />
                  <Box className="sw-card" borderRadius="var(--sw-radius)">
                    <Box className="sw-card-header">
                      <Heading size="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="800">{t("dashboard.activityLog")}</Heading>
                    </Box>
                    <Box className="sw-card-body" p={0}>
                      <BellLogTable refreshKey={logRefresh} />
                    </Box>
                  </Box>
                </SimpleGrid>
              </VStack>
            )}
            {tab === "stopwatch" && (
              <Box className="sw-card" borderRadius="var(--sw-radius)">
                <Box className="sw-card-header sw-card-header-green">
                  <Heading size="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="800">{t("dashboard.stopwatch")}</Heading>
                </Box>
                <Box className="sw-card-body" p={{ base: 4, md: 6 }}>
                  <Stopwatch />
                </Box>
              </Box>
            )}
            {tab === "timer" && (
              <Box className="sw-card" borderRadius="var(--sw-radius)">
                <Box className="sw-card-header sw-card-header-green">
                  <Heading size="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="800">{t("dashboard.timer")}</Heading>
                </Box>
                <Box className="sw-card-body" p={{ base: 4, md: 6 }}>
                  <Timer />
                </Box>
              </Box>
            )}
            {tab === "world" && (
              <Box className="sw-card" borderRadius="var(--sw-radius)">
                <Box className="sw-card-header sw-card-header-green">
                  <Heading size="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="800">{t("dashboard.worldClock")}</Heading>
                </Box>
                <Box className="sw-card-body" p={{ base: 4, md: 6 }}>
                  <WorldClock />
                </Box>
              </Box>
            )}
          </Box>
        </Tabs.Root>
      </VStack>
    </Box>
  );
}
