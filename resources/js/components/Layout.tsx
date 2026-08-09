import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Box, Flex, HStack, Text, VStack } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FiHome,
  FiCalendar,
  FiSettings,
  FiActivity,
  FiFolder,
  FiDatabase,
  FiBookOpen,
  FiBell,
  FiVolume2,
  FiStopCircle,
  FiMoreHorizontal,
} from "react-icons/fi";
import DarkModeToggle from "./DarkModeToggle";
import ThemeColorButton from "./ThemeColorButton";
import SaweriaTooltip from "./SaweriaTooltip";
import BackgroundOrnament from "./BackgroundOrnament";
import BellPlayer from "./BellPlayer";
import { useT, useLang } from "@/lib/i18n";
import { useTimeFormat, formatTimeString } from "@/lib/time-format";
import { useBellPolling } from "@/hooks/useBellPolling";
import { routes } from "@/lib/route-encoder";

function NavClock() {
  const t = useT();
  const { lang } = useLang();
  const timeFormat = useTimeFormat();
  const dateLocale = lang === "id" ? "id-ID" : "en-GB";
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: timeFormat === "12",
          timeZone: "Asia/Jakarta",
        }).format(now),
      );
      setDate(
        new Intl.DateTimeFormat(dateLocale, {
          weekday: "short",
          day: "2-digit",
          month: "short",
          timeZone: "Asia/Jakarta",
        }).format(now),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timeFormat, dateLocale]);
  return (
    <Box
      display={{ base: "none", md: "flex" }}
      flexDirection="column"
      alignItems="flex-end"
      fontFamily="'IBM Plex Mono', monospace"
      fontSize="0.7rem"
      color="var(--sw-fg-muted)"
      lineHeight={1.2}
      flexShrink={0}
    >
      <Box fontWeight={700} color="var(--sw-fg)" letterSpacing="-0.02em">
        {time}
        <Box as="span" fontSize="0.6rem" color="var(--sw-fg-subtle)" ml={1}>
          {t("common.wib")}
        </Box>
      </Box>
      <Box textTransform="capitalize">{date}</Box>
    </Box>
  );
}

function LangToggle() {
  const { lang, setLang } = useLang();
  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: "0.15rem 0.5rem",
    fontSize: "0.65rem",
    fontFamily: "'IBM Plex Mono', monospace",
    borderRadius: "var(--sw-radius)",
    border: "none",
    background: active ? "var(--sw-purple-normal)" : "transparent",
    color: active ? "#ffffff" : "var(--sw-fg)",
    fontWeight: active ? 900 : 700,
    cursor: "pointer",
    transition: "all 0.15s",
    lineHeight: 1.4,
  });
  return (
    <Flex
      align="center"
      gap={0.5}
      p={0.5}
      borderRadius="var(--sw-radius)"
      border="2px solid var(--sw-border-color)"
      bg="var(--sw-bg-panel)"
      flexShrink={0}
    >
      <button
        aria-label="Indonesia"
        style={btnStyle(lang === "id")}
        onClick={() => setLang("id")}
        onMouseEnter={(e) => {
          if (lang !== "id") e.currentTarget.style.background = "var(--sw-bg-hover)";
        }}
        onMouseLeave={(e) => {
          if (lang !== "id") e.currentTarget.style.background = "transparent";
        }}
      >
        ID
      </button>
      <button
        aria-label="English"
        style={btnStyle(lang === "en")}
        onClick={() => setLang("en")}
        onMouseEnter={(e) => {
          if (lang !== "en") e.currentTarget.style.background = "var(--sw-bg-hover)";
        }}
        onMouseLeave={(e) => {
          if (lang !== "en") e.currentTarget.style.background = "transparent";
        }}
      >
        EN
      </button>
    </Flex>
  );
}

interface NavItem {
  to: string;
  label: string;
  icon: typeof FiHome;
  end?: boolean;
}

function MobileBottomNav({ primaryItems, moreItems }: { primaryItems: NavItem[]; moreItems: NavItem[] }) {
  const t = useT();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreBtnRef = useRef<HTMLSpanElement>(null);
  const [coords, setCoords] = useState({ bottom: 0, right: 0 });
  const location = useLocation();

  useEffect(() => { setMoreOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (moreOpen && moreBtnRef.current) {
      const rect = moreBtnRef.current.getBoundingClientRect();
      setCoords({
        bottom: window.innerHeight - rect.top + 8,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    }
  }, [moreOpen]);

  useEffect(() => {
    const handler = () => setMoreOpen(false);
    if (moreOpen) {
      document.addEventListener("click", handler);
      return () => document.removeEventListener("click", handler);
    }
  }, [moreOpen]);

  const isMoreActive = moreItems.some((i) => location.pathname === i.to);
  const popupWidth = 176;

  return (
    <>
      <Box className="sw-bottom-nav" display={{ base: "flex", lg: "none" }}>
        {primaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} end={item.end} style={{ textDecoration: "none" }}>
              {({ isActive }) => (
                <Box as="span" className={`sw-bottom-nav-item ${isActive ? "active" : ""}`}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.label}</span>
                </Box>
              )}
            </NavLink>
          );
        })}
        {/* More button */}
        <Box
          as="span"
          ref={moreBtnRef as never}
          className={`sw-bottom-nav-item ${moreOpen || isMoreActive ? "active" : ""}`}
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); setMoreOpen((o) => !o); }}
          cursor="pointer"
        >
          <FiMoreHorizontal size={18} strokeWidth={moreOpen || isMoreActive ? 2.5 : 2} />
          <span>{t("nav.more")}</span>
        </Box>
      </Box>

      {moreOpen && createPortal(
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            bottom: coords.bottom,
            right: coords.right,
            width: popupWidth,
            zIndex: 200,
            background: "var(--sw-bg-card)",
            border: "1px solid var(--sw-border-color)",
            borderRadius: "var(--sw-radius)",
            boxShadow: "0.4rem 0.4rem 0 var(--sw-shadow-color)",
            padding: "0.5rem",
            animation: "sw-tooltip-in 0.1s ease-out",
          }}
        >
          <Text
            fontSize="2xs"
            fontFamily="'Comfortaa', sans-serif"
            fontWeight="800"
            textTransform="uppercase"
            letterSpacing="0.05em"
            color="var(--sw-fg-subtle)"
            px={2} py={1} mb={1}
          >
            {t("nav.more")}
          </Text>
          {moreItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                style={{ textDecoration: "none" }}
                onClick={() => setMoreOpen(false)}
              >
                <HStack
                  gap={2}
                  px={2}
                  py={2}
                  borderRadius="var(--sw-radius)"
                  bg={isActive ? "var(--sw-purple-normal)" : "transparent"}
                  color={isActive ? "#ffffff" : "var(--sw-fg)"}
                  _hover={isActive ? {} : { bg: "var(--sw-bg-hover)" }}
                  transition="background 0.1s"
                  cursor="pointer"
                >
                  <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
                  <Text fontSize="xs" fontWeight="700" fontFamily="'Comfortaa', sans-serif">{item.label}</Text>
                </HStack>
              </NavLink>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}

export default function Layout() {
  const t = useT();
  const timeFormat = useTimeFormat();
  const { shouldRing, currentSchedule, dismiss } = useBellPolling();
  const isLooping = shouldRing && currentSchedule?.loop_until_stopped;

  const navItems: NavItem[] = [
    { to: routes.dashboard, label: t("nav.dashboard"), icon: FiHome, end: true },
    { to: routes.schedules, label: t("nav.schedules"), icon: FiCalendar },
    { to: routes.files, label: t("nav.files"), icon: FiFolder },
    { to: routes.settings, label: t("nav.settings"), icon: FiSettings },
    { to: routes.logs, label: t("nav.logs"), icon: FiActivity },
    { to: routes.database, label: t("nav.database"), icon: FiDatabase },
    { to: routes.docs, label: t("nav.docs"), icon: FiBookOpen },
  ];

  const primaryNavItems = navItems.slice(0, 4);
  const moreNavItems = navItems.slice(4);
  const year = new Date().getFullYear();

  const navLinkStyle = (isActive: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "2.25rem",
    height: "2.25rem",
    border: "1px solid",
    borderColor: isActive ? "var(--sw-border-color)" : "transparent",
    borderRadius: "var(--sw-radius)",
    background: isActive ? "var(--sw-purple-normal)" : "transparent",
    color: isActive ? "#ffffff" : "var(--sw-fg)",
    boxShadow: isActive ? "0.2rem 0.2rem 0 var(--sw-shadow-color)" : "none",
    transition: "all 0.1s ease",
    cursor: "pointer",
  });

  return (
    <Box minH="100vh" position="relative" bg="var(--sw-bg)" color="var(--sw-fg)">
      <BackgroundOrnament variant={isLooping ? "ringing" : "normal"} />
      <BellPlayer shouldRing={shouldRing} schedule={currentSchedule} onDismiss={dismiss} />

      {/* Loop bell alert banner */}
      {isLooping && (
        <Box
          position="fixed"
          top="64px"
          left="50%"
          transform="translateX(-50%)"
          zIndex={1050}
          maxW="90vw"
          p={3}
          borderRadius="var(--sw-radius)"
          bg="var(--sw-purple-light)"
          border="2px solid var(--sw-purple-normal)"
          boxShadow="0.3rem 0.3rem 0 var(--sw-shadow-color)"
        >
          <HStack justify="space-between" wrap="wrap" gap={3}>
            <HStack gap={3}>
              <Box
                w={8}
                h={8}
                borderRadius="var(--sw-radius)"
                bg="var(--sw-purple-normal)"
                border="2px solid var(--sw-border-color)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
                className="sw-pulse"
              >
                <FiVolume2 size={16} color="#fff" />
              </Box>
              <VStack gap={0} align="start">
                <Text fontFamily="'Comfortaa', sans-serif" fontWeight="800" fontSize="sm" color="var(--sw-fg)">
                  {t("dashboard.loopingAlert")}
                </Text>
                <Text fontSize="xs" color="var(--sw-fg)" opacity={0.7} fontFamily="'IBM Plex Mono', monospace">
                  {currentSchedule?.label} — {formatTimeString(currentSchedule?.start_time, timeFormat)} {t("common.wib")}
                </Text>
              </VStack>
            </HStack>
            <button
              type="button"
              onClick={dismiss}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                padding: "0.25rem 0.75rem",
                fontFamily: "'Comfortaa', sans-serif",
                fontWeight: 800,
                fontSize: "0.75rem",
                background: "var(--sw-purple-normal)",
                color: "#120d1c",
                border: "1px solid var(--sw-border-color)",
                borderRadius: "var(--sw-radius)",
                boxShadow: "0.15rem 0.15rem 0 var(--sw-shadow-color)",
                cursor: "pointer",
              }}
            >
              <FiStopCircle size={14} /> {t("dashboard.turnOffBell")}
            </button>
          </HStack>
        </Box>
      )}

      <Box position="relative" zIndex={1}>
        {/* ===== Navbar ===== */}
        <Box
          as="header"
          position="sticky"
          top={0}
          zIndex={50}
          bg="color-mix(in srgb, var(--sw-bg-card) 85%, transparent)"
          backdropFilter="blur(12px)"
          borderBottom="1px solid var(--sw-border-color)"
          boxShadow="0 0.3rem 0 var(--sw-shadow-color)"
        >
          <Flex
            align="center"
            justify="space-between"
            px={{ base: 3, md: 6 }}
            py={2}
            maxW="1400px"
            mx="auto"
            gap={3}
            h="52px"
          >
            {/* Logo + app name */}
            <HStack gap={2} flexShrink={0}>
              <Flex
                w={{ base: "1.75rem", md: "2rem" }}
                h={{ base: "1.75rem", md: "2rem" }}
                borderRadius="var(--sw-radius)"
                bg="var(--sw-purple-normal)"
                border="2px solid var(--sw-border-color)"
                boxShadow="0.2rem 0.2rem 0 var(--sw-shadow-color)"
                align="center"
                justify="center"
                flexShrink={0}
                cursor="pointer"
                onClick={() => (window.location.href = routes.dashboard)}
                _hover={{
                  transform: "translate(-0.05rem, -0.05rem)",
                  boxShadow: "0.25rem 0.25rem 0 var(--sw-shadow-color)",
                }}
                _active={{
                  transform: "translate(0.1rem, 0.1rem)",
                  boxShadow: "0.1rem 0.1rem 0 var(--sw-shadow-color)",
                }}
                transition="all 0.15s"
              >
                <FiBell size={16} color="#ffffff" strokeWidth={2.5} />
              </Flex>
              <Text
                fontFamily="'Righteous', cursive"
                fontWeight={400}
                fontSize={{ base: "1rem", md: "1.2rem" }}
                color="var(--sw-purple-normal)"
                letterSpacing="0.05em"
                whiteSpace="nowrap"
                textTransform="uppercase"
              >
                {t("app.name")}
              </Text>
            </HStack>

            {/* Nav links — icon only with tooltips (desktop) */}
            <HStack gap={1} display={{ base: "none", lg: "flex" }} flex={1} justify="center">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SaweriaTooltip key={item.to} label={item.label} placement="bottom">
                    <Box>
                      <NavLink to={item.to} end={item.end}>
                        {({ isActive }) => (
                          <Box
                            as="span"
                            style={navLinkStyle(isActive)}
                            _hover={{
                              bg: isActive ? "var(--sw-purple-normal)" : "var(--sw-bg-hover)",
                              transform: isActive ? "none" : "translateY(-2px)",
                            }}
                          >
                            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                          </Box>
                        )}
                      </NavLink>
                    </Box>
                  </SaweriaTooltip>
                );
              })}
            </HStack>

            {/* Right: clock + lang + theme + dark mode */}
            <HStack gap={{ base: 1, md: 2 }} align="center" flexShrink={0}>
              <NavClock />
              <LangToggle />
              <ThemeColorButton />
              <DarkModeToggle />
            </HStack>
          </Flex>
        </Box>

        {/* ===== Main content ===== */}
        <Box
          as="main"
          p={{ base: 3, md: 6 }}
          maxW="1400px"
          mx="auto"
          pb={{ base: "5rem", lg: "6rem" }}
          minH="calc(100vh - 200px)"
        >
          <Outlet />
        </Box>

        {/* ===== Footer — fixed (desktop only) ===== */}
        <Box
          as="footer"
          display={{ base: "none", lg: "block" }}
          position="fixed"
          bottom={0}
          left={0}
          right={0}
          bg="var(--sw-bg-card)"
          borderTop="1px solid var(--sw-border-color)"
          boxShadow="0 -0.2rem 0 var(--sw-shadow-color)"
          px={6}
          py={2}
          zIndex={40}
        >
          <Flex align="center" justify="center" maxW="1400px" mx="auto">
            <Text fontSize="0.7rem" fontFamily="'IBM Plex Mono', monospace" color="var(--sw-fg-muted)">
              &copy; {year} &bull; {t("footer.madeWith")} <Box as="span" color="var(--sw-red-normal)">&hearts;</Box> di Purbalingga
            </Text>
          </Flex>
        </Box>

        {/* ===== Mobile / tablet bottom navigation ===== */}
        <MobileBottomNav primaryItems={primaryNavItems} moreItems={moreNavItems} />
      </Box>
    </Box>
  );
}
