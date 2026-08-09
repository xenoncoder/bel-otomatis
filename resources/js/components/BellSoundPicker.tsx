import { useCallback, useEffect, useState } from "react";
import { fileApi, type FileItem } from "@/lib/api";
import type { BellSound } from "@/lib/types";
import {
  Box, Button, Dialog, Flex, HStack, IconButton, Spinner, Text, VStack,
} from "@chakra-ui/react";
import {
  FiFolder, FiMusic, FiChevronRight, FiCheck, FiPlay, FiSquare,
} from "react-icons/fi";
import CloseButton from "@/components/CloseButton";
import { useT } from "@/lib/i18n";

const isAudio = (mime: string | null, name: string) =>
  mime?.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(name);

interface BellSoundPickerProps {
  value: string;
  onChange: (bellSoundId: string) => void;
  sounds: BellSound[];
}

export default function BellSoundPicker({ value, onChange, sounds }: BellSoundPickerProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [dir, setDir] = useState("");
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewPath, setPreviewPath] = useState<string | null>(null);

  const selected = sounds.find((s) => String(s.id) === value);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const res = await fileApi.list(d || undefined);
      setItems(res.items);
      setDir(res.dir);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (open) load("");
  }, [open, load]);

  const breadcrumbs = dir ? dir.split("/").filter(Boolean) : [];
  const goTo = (index: number) => load(breadcrumbs.slice(0, index + 1).join("/"));
  const openFolder = (item: FileItem) => load(item.relative);

  const handlePick = (item: FileItem) => {
    if (!isAudio(item.mime, item.name)) return;
    const fullPath = "bells/" + item.relative;
    const sound = sounds.find((s) => s.file_path === fullPath);
    if (sound) {
      onChange(String(sound.id));
      setOpen(false);
      setPreviewPath(null);
    }
  };

  const audioItems = items.filter((i) => !i.is_dir && isAudio(i.mime, i.name));
  const folders = items.filter((i) => i.is_dir);

  return (
    <>
      <Box
        onClick={() => setOpen(true)}
        border="1px solid var(--sw-border-color)"
        borderRadius="var(--sw-radius)"
        bg="var(--sw-bg-panel)"
        h="38px"
        cursor="pointer"
        _hover={{ bg: "var(--sw-bg-hover)" }}
        display="flex"
        alignItems="center"
        px={3}
      >
        <HStack gap={2} w="full">
          <FiMusic size={14} color="var(--sw-purple-normal)" />
          <Text fontSize="sm" fontWeight="600" fontFamily="'Comfortaa', sans-serif" flex={1} textAlign="left">
            {selected ? selected.name : t("picker.default")}
          </Text>
          <Text fontSize="2xs" color="var(--sw-fg-subtle)">{t("picker.selectHint")}</Text>
        </HStack>
      </Box>

      <Dialog.Root open={open} onOpenChange={(e) => { setOpen(e.open); if (!e.open) setPreviewPath(null); }} placement="center">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            maxW={{ base: "calc(100vw - 2rem)", sm: "560px" }}
            maxH="85vh"
          >
            <Box className="sw-dialog-strip sw-dialog-strip-purple" />
            <Dialog.Header>
              <Dialog.Title>{t("picker.selectTitle")}</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body pb={4} pt={2}>
              {/* Breadcrumbs */}
              <HStack gap={1} fontSize="xs" mb={3} wrap="wrap">
                <Button className="sw-btn" variant="ghost" size="2xs" onClick={() => load("")} fontFamily="'Comfortaa', sans-serif">
                  <FiFolder /> {t("common.rootFolder")}
                </Button>
                {breadcrumbs.map((b, i) => (
                  <HStack key={i} gap={1}>
                    <FiChevronRight color="var(--sw-fg-subtle)" size={12} />
                    <Button className="sw-btn" variant="ghost" size="2xs" onClick={() => goTo(i)} fontFamily="'Comfortaa', sans-serif">
                      {b}
                    </Button>
                  </HStack>
                ))}
              </HStack>

              {loading ? (
                <Flex justify="center" py={8}><Spinner size="lg" color="var(--sw-purple-normal)" /></Flex>
              ) : items.length === 0 ? (
                <VStack py={8} color="var(--sw-fg-subtle)">
                  <FiFolder size={32} style={{ opacity: 0.4 }} />
                  <Text fontSize="sm">{t("files.folderEmpty")}</Text>
                </VStack>
              ) : (
                <VStack gap={1.5} align="stretch" maxH="380px" overflowY="auto" overflowX="hidden"
                  css={{ "&::-webkit-scrollbar": { width: "4px" }, "&::-webkit-scrollbar-thumb": { background: "var(--sw-purple-normal)", borderRadius: "999px" } }}
                >
                  {/* Folders */}
                  {folders.map((item) => (
                    <HStack
                      key={item.path}
                      gap={3}
                      px={3}
                      py={2}
                      borderRadius="var(--sw-radius)"
                      cursor="pointer"
                      _hover={{ bg: "var(--sw-bg-hover)" }}
                      transition="background 0.1s"
                      onClick={() => openFolder(item)}
                    >
                      <Box w={8} h={8} borderRadius="var(--sw-radius)" bg="var(--sw-green-normal)" border="1px solid var(--sw-border-color)" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                        <FiFolder size={16} color="#ffffff" />
                      </Box>
                      <Text fontSize="sm" fontWeight="600" fontFamily="'Comfortaa', sans-serif" flex={1} textAlign="left">
                        {item.name}
                      </Text>
                      <FiChevronRight color="var(--sw-fg-subtle)" />
                    </HStack>
                  ))}

                  {/* Audio files */}
                  {audioItems.map((item) => {
                    const fullPath = "bells/" + item.relative;
                    const sound = sounds.find((s) => s.file_path === fullPath);
                    const isSelected = sound && String(sound.id) === value;
                    return (
                      <Box key={item.path}>
                        <HStack
                          gap={3}
                          px={3}
                          py={2}
                          borderRadius="var(--sw-radius)"
                          cursor="pointer"
                          bg={isSelected ? "var(--sw-green-light)" : "transparent"}
                          _hover={{ bg: isSelected ? "var(--sw-green-light)" : "var(--sw-bg-hover)" }}
                          border={isSelected ? "1px solid var(--sw-border-color)" : "1px solid transparent"}
                          transition="all 0.1s"
                          onClick={() => handlePick(item)}
                        >
                          <Box w={8} h={8} borderRadius="var(--sw-radius)" bg="var(--sw-pink-normal)" border="1px solid var(--sw-border-color)" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                            <FiMusic size={16} color="#ffffff" />
                          </Box>
                          <VStack gap={0} align="start" flex={1} minW={0} w="full">
                            <Text fontSize="sm" fontWeight="600" fontFamily="'Comfortaa', sans-serif" lineClamp={1} textAlign="left" w="full">
                              {item.name}
                            </Text>
                            <Text fontSize="2xs" color="var(--sw-fg-subtle)" fontFamily="'IBM Plex Mono', monospace" textAlign="left" w="full">
                              {sound ? t("picker.registered") : t("picker.notRegistered")}
                            </Text>
                          </VStack>
                          {/* Preview button */}
                          <IconButton
                            aria-label={t("picker.preview")}
                            size="sm"
                            className={previewPath === item.url ? "sw-btn sw-btn-danger" : "sw-btn sw-btn-primary"}
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); setPreviewPath(previewPath === item.url ? null : item.url); }}
                          >
                            {previewPath === item.url ? <FiSquare size={14} /> : <FiPlay size={14} />}
                          </IconButton>
                          {isSelected && (
                            <Box w={6} h={6} borderRadius="full" bg="var(--sw-green-normal)" border="1px solid var(--sw-border-color)" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                              <FiCheck size={14} color="#ffffff" />
                            </Box>
                          )}
                        </HStack>
                        {/* Audio preview */}
                        {previewPath === item.url && (
                          <Box px={3} pb={2}>
                            <audio controls src={item.url ?? undefined} style={{ width: "100%", height: 32 }} />
                          </Box>
                        )}
                      </Box>
                    );
                  })}

                  {/* Non-audio files (greyed out) */}
                  {items.filter((i) => !i.is_dir && !isAudio(i.mime, i.name)).length > 0 && (
                    <Text fontSize="2xs" color="var(--sw-fg-subtle)" px={3} pt={2}>
                      {t("picker.hiddenCount", { count: items.filter((i) => !i.is_dir && !isAudio(i.mime, i.name)).length })}
                    </Text>
                  )}
                </VStack>
              )}
            </Dialog.Body>

            <Dialog.Footer>
              {selected && (
                <Button className="sw-btn" variant="ghost" size="sm" onClick={() => { onChange(""); setOpen(false); setPreviewPath(null); }}>
                  {t("picker.useDefault")}
                </Button>
              )}
              <Button className="sw-btn sw-btn-primary" variant="ghost" size="sm" onClick={() => { setOpen(false); setPreviewPath(null); }}>
                {t("picker.close")}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}
