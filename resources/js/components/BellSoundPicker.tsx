import { useCallback, useEffect, useState } from "react";
import { fileApi, type FileItem } from "@/lib/api";
import type { BellSound } from "@/lib/types";
import {
  FiFolder, FiMusic, FiChevronRight, FiCheck, FiPlay, FiSquare,
} from "react-icons/fi";
import { useT } from "@/lib/i18n";
import { GlassModal } from "@/components/ui/GlassModal";
import { GlassButton } from "@/components/ui/GlassComponents";

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
      <div
        onClick={() => setOpen(true)}
        className="flex items-center px-3 h-[38px] border border-white/20 dark:border-white/10 rounded-xl bg-white/50 dark:bg-black/20 cursor-pointer hover:bg-white/80 dark:hover:bg-white/10 transition-colors w-full"
      >
        <div className="flex items-center gap-2 w-full">
          <FiMusic size={14} className="text-indigo-500 shrink-0" />
          <span className="text-sm font-bold font-heading flex-1 text-left text-gray-700 dark:text-gray-300 truncate">
            {selected ? selected.name : t("picker.default")}
          </span>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider shrink-0">{t("picker.selectHint")}</span>
        </div>
      </div>

      <GlassModal isOpen={open} onClose={() => { setOpen(false); setPreviewPath(null); }} title={t("picker.selectTitle")} footer={
        <>
          {selected && (
            <GlassButton variant="ghost" onClick={() => { onChange(""); setOpen(false); setPreviewPath(null); }}>
              {t("picker.useDefault")}
            </GlassButton>
          )}
          <GlassButton variant="primary" onClick={() => { setOpen(false); setPreviewPath(null); }}>
            {t("picker.close")}
          </GlassButton>
        </>
      }>
        <div className="pb-4 pt-2">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-xs mb-3 flex-wrap">
            <button onClick={() => load("")} className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 font-bold text-gray-600 dark:text-gray-400 transition-colors">
              <FiFolder /> {t("common.rootFolder")}
            </button>
            {breadcrumbs.map((b, i) => (
              <div key={i} className="flex items-center gap-1">
                <FiChevronRight className="text-gray-400 text-[10px]" />
                <button onClick={() => goTo(i)} className="px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 font-bold text-gray-600 dark:text-gray-400 transition-colors">
                  {b}
                </button>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-gray-500 gap-2">
              <FiFolder size={32} className="opacity-40" />
              <p className="text-sm font-bold">{t("files.folderEmpty")}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-[380px] overflow-y-auto pr-1 overflow-x-hidden">
              {/* Folders */}
              {folders.map((item) => (
                <div
                  key={item.path}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  onClick={() => openFolder(item)}
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                    <FiFolder size={16} className="text-white" />
                  </div>
                  <span className="text-sm font-bold font-heading flex-1 text-left text-gray-700 dark:text-gray-300">
                    {item.name}
                  </span>
                  <FiChevronRight className="text-gray-400" />
                </div>
              ))}

              {/* Audio files */}
              {audioItems.map((item) => {
                const fullPath = "bells/" + item.relative;
                const sound = sounds.find((s) => s.file_path === fullPath);
                const isSelected = sound && String(sound.id) === value;
                return (
                  <div key={item.path}>
                    <div
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all border ${isSelected ? "bg-emerald-500/10 border-emerald-500/20" : "bg-transparent border-transparent hover:bg-black/5 dark:hover:bg-white/5"}`}
                      onClick={() => handlePick(item)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center shrink-0">
                        <FiMusic size={16} className="text-white" />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-bold font-heading truncate text-left text-gray-700 dark:text-gray-300">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-gray-500 font-body font-bold text-left uppercase tracking-wider">
                          {sound ? t("picker.registered") : t("picker.notRegistered")}
                        </span>
                      </div>
                      {/* Preview button */}
                      <button
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors shrink-0 ${previewPath === item.url ? "bg-rose-500 text-white" : "bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-indigo-500 hover:text-white"}`}
                        onClick={(e) => { e.stopPropagation(); setPreviewPath(previewPath === item.url ? null : item.url); }}
                      >
                        {previewPath === item.url ? <FiSquare size={12} /> : <FiPlay size={12} className="ml-0.5" />}
                      </button>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                          <FiCheck size={14} className="text-white" />
                        </div>
                      )}
                    </div>
                    {/* Audio preview */}
                    {previewPath === item.url && (
                      <div className="px-3 pb-2 mt-2">
                        <audio controls src={item.url ?? undefined} className="w-full h-8" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Non-audio files (greyed out) */}
              {items.filter((i) => !i.is_dir && !isAudio(i.mime, i.name)).length > 0 && (
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-3 pt-2">
                  {t("picker.hiddenCount", { count: items.filter((i) => !i.is_dir && !isAudio(i.mime, i.name)).length })}
                </p>
              )}
            </div>
          )}
        </div>
      </GlassModal>
    </>
  );
}
