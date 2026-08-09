import { Box, HStack, Heading, Text, VStack, Badge } from "@chakra-ui/react";
import {
  FiBookOpen, FiClock, FiCalendar, FiFolder, FiSettings, FiActivity, FiDatabase, FiZap,
} from "react-icons/fi";
import { useT } from "@/lib/i18n";
import BackgroundOrnament from "@/components/BackgroundOrnament";

export default function DocumentationPage() {
  const t = useT();

  const sections = [
    {
      id: "dashboard",
      icon: FiClock,
      title: t("docs.dashboard.title"),
      desc: t("docs.dashboard.desc1"),
      features: [t("docs.dashboard.f1"), t("docs.dashboard.f2"), t("docs.dashboard.f3")],
      color: "var(--sw-purple-normal)",
      colorLight: "var(--sw-purple-light)",
    },
    {
      id: "schedules",
      icon: FiCalendar,
      title: t("docs.schedules.title"),
      desc: t("docs.schedules.desc1"),
      features: [
        t("docs.schedules.f1"), t("docs.schedules.f2"), t("docs.schedules.f3"), t("docs.schedules.f4"),
        t("docs.schedules.mode1"), t("docs.schedules.mode2"), t("docs.schedules.mode3"),
      ],
      color: "var(--sw-green-normal)",
      colorLight: "var(--sw-green-light)",
    },
    {
      id: "files",
      icon: FiFolder,
      title: t("docs.files.title"),
      desc: t("docs.files.desc1"),
      features: [t("docs.files.f1"), t("docs.files.f2"), t("docs.files.f3"), t("docs.files.f4")],
      color: "var(--sw-blue-normal)",
      colorLight: "var(--sw-blue-light)",
    },
    {
      id: "settings",
      icon: FiSettings,
      title: t("docs.settings.title"),
      desc: t("docs.settings.desc1"),
      features: [t("docs.settings.f1"), t("docs.settings.f2"), t("docs.settings.f3"), t("docs.settings.f4")],
      color: "var(--sw-yellow-normal)",
      colorLight: "var(--sw-yellow-light)",
    },
    {
      id: "logs",
      icon: FiActivity,
      title: t("docs.logs.title"),
      desc: t("docs.logs.desc1"),
      features: [t("docs.logs.f1"), t("docs.logs.f2")],
      color: "var(--sw-pink-normal)",
      colorLight: "var(--sw-pink-light)",
    },
    {
      id: "database",
      icon: FiDatabase,
      title: t("docs.database.title"),
      desc: t("docs.database.desc1"),
      features: [t("docs.database.f1"), t("docs.database.f2")],
      color: "var(--sw-purple-dark)",
      colorLight: "var(--sw-purple-light)",
    },
  ];

  return (
    <Box position="relative">
      <BackgroundOrnament variant="normal" />
      <VStack gap={6} align="stretch" position="relative" zIndex={1}>
        {/* Header */}
        <HStack gap={4} align="start" wrap="wrap">
          <Box
            w={{ base: 12, md: 14 }}
            h={{ base: 12, md: 14 }}
            borderRadius="var(--sw-radius)"
            bg="var(--sw-purple-normal)"
            border="1px solid var(--sw-border-color)"
            boxShadow="0.2rem 0.2rem 0 var(--sw-shadow-color)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <FiBookOpen size={24} color="var(--sw-fg)" strokeWidth={2.5} />
          </Box>
          <VStack gap={1} align="start" flex={1}>
            <Heading size={{ base: "xl", md: "2xl" }} fontFamily="'Comfortaa', sans-serif" fontWeight="300" color="var(--sw-fg-heading)">
              {t("docs.title")}
            </Heading>
            <Text fontSize="sm" color="var(--sw-fg-muted)" fontFamily="'IBM Plex Mono', monospace">
              {t("docs.subtitle")}
            </Text>
          </VStack>
        </HStack>

        {/* Table of Contents */}
        <Box className="sw-card" borderRadius="var(--sw-radius)">
          <Box className="sw-card-header">
            <Heading size="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="800">{t("docs.toc")}</Heading>
          </Box>
          <Box className="sw-card-body" p={{ base: 3, md: 4 }}>
            <HStack gap={2} wrap="wrap">
              {sections.map((s) => {
                const Icon = s.icon;
                return (
                  <a key={s.id} href={`#${s.id}`} style={{ textDecoration: "none" }}>
                    <HStack
                      gap={1.5}
                      px={3} py={1.5}
                      borderRadius="var(--sw-radius)"
                      border="1px solid var(--sw-border-color)"
                      bg="var(--sw-bg-panel)"
                      _hover={{ transform: "translateY(-2px)", boxShadow: "0.15rem 0.15rem 0 var(--sw-shadow-color)" }}
                      transition="all 0.15s"
                    >
                      <Icon size={12} color={s.color} />
                      <Text fontSize="xs" fontWeight="600" fontFamily="'Comfortaa', sans-serif" color="var(--sw-fg)">
                        {s.title}
                      </Text>
                    </HStack>
                  </a>
                );
              })}
            </HStack>
          </Box>
        </Box>

        {/* Introduction */}
        <Box className="sw-card" borderRadius="var(--sw-radius)" id="intro">
          <Box className="sw-card-header sw-card-header-green">
            <Heading size="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="800">{t("docs.intro.title")}</Heading>
          </Box>
          <Box className="sw-card-body" p={{ base: 4, md: 6 }}>
            <Text fontSize="sm" color="var(--sw-fg-muted)" fontFamily="'IBM Plex Mono', monospace" lineHeight={1.7}>
              {t("docs.intro.desc")}
            </Text>
          </Box>
        </Box>

        {/* Feature sections */}
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Box key={s.id} className="sw-card" borderRadius="var(--sw-radius)" id={s.id}>
              <Box className="sw-card-header" style={{ background: s.color }}>
                <HStack gap={2} align="center">
                  <Icon size={14} color="#ffffff" />
                  <Heading size="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="800">{s.title}</Heading>
                </HStack>
              </Box>
              <Box className="sw-card-body" p={{ base: 4, md: 6 }}>
                <Text fontSize="sm" color="var(--sw-fg-muted)" fontFamily="'IBM Plex Mono', monospace" lineHeight={1.7} mb={4}>
                  {s.desc}
                </Text>
                <VStack gap={2} align="stretch">
                  {s.features.map((f, i) => (
                    <HStack key={i} gap={2} align="start">
                      <Box
                        w={5} h={5}
                        borderRadius="var(--sw-radius)"
                        bg={s.colorLight}
                        border="1px solid var(--sw-border-color)"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                        mt={0.5}
                      >
                        <Text fontSize="2xs" fontWeight="800" fontFamily="'IBM Plex Mono', monospace" color="var(--sw-fg)">
                          {i + 1}
                        </Text>
                      </Box>
                      <Text fontSize="sm" color="var(--sw-fg)" fontFamily="'IBM Plex Mono', monospace" lineHeight={1.6}>
                        {f}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            </Box>
          );
        })}

        {/* Tips & Tricks */}
        <Box className="sw-card" borderRadius="var(--sw-radius)" id="tips">
          <Box className="sw-card-header" style={{ background: "var(--sw-yellow-normal)" }}>
            <HStack gap={2} align="center">
              <FiZap size={14} color="#ffffff" />
              <Heading size="sm" fontFamily="'Comfortaa', sans-serif" fontWeight="800">{t("docs.tips.title")}</Heading>
            </HStack>
          </Box>
          <Box className="sw-card-body" p={{ base: 4, md: 6 }}>
            <VStack gap={3} align="stretch">
              {[t("docs.tips.desc1"), t("docs.tips.desc2"), t("docs.tips.desc3"), t("docs.tips.desc4"), t("docs.tips.desc5")].map((tip, i) => (
                <HStack key={i} gap={3} align="start" p={3} borderRadius="var(--sw-radius)" bg="var(--sw-bg-muted)" border="1px solid var(--sw-border-color)">
                  <Badge colorPalette="yellow" variant="solid" fontSize="2xs" px={2} py={0.5} borderRadius="var(--sw-radius)" fontFamily="'Comfortaa', sans-serif" fontWeight="800" flexShrink={0}>
                    {i + 1}
                  </Badge>
                  <Text fontSize="sm" color="var(--sw-fg)" fontFamily="'IBM Plex Mono', monospace" lineHeight={1.6}>
                    {tip}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        </Box>
      </VStack>
    </Box>
  );
}
