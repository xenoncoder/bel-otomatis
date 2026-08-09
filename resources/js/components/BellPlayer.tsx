import { useCallback, useEffect, useRef, useState } from "react";
import { FiBell, FiX, FiClock, FiRepeat, FiPause, FiPlay } from "react-icons/fi";
import { useT } from "@/lib/i18n";
import { useToast } from "@/components/ui/ToastProvider";
import { useTimeFormat, formatTimeString } from "@/lib/time-format";
import type { Schedule } from "@/lib/types";
import { GlassButton } from "@/components/ui/GlassComponents";

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
  const { toast } = useToast();

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
      toast({ title: "Batalkan penundaan alarm", type: "info" });
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
  const progressVal = maxPlays === Infinity ? 0 : ((currentPlay) / maxPlays) * 100;

  if (!open) return null;

  return (
    <div className="fixed bottom-4 md:bottom-8 right-4 md:right-8 z-50 w-[calc(100vw-2rem)] sm:w-[340px] animate-slide-up">
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top stripe */}
        <div className={`h-1.5 w-full ${isLoop ? "bg-indigo-500" : "bg-pink-500"}`} />

        {/* Header section with animated bell */}
        <div className={`px-4 py-4 text-center border-b border-white/10 relative ${isLoop ? "bg-indigo-500/10" : "bg-pink-500/10"}`}>
          <div className="flex items-center justify-center gap-3">
            {/* Animated bell */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white shadow-lg animate-pulse ${isLoop ? "bg-indigo-500" : "bg-pink-500"}`}>
              <FiBell size={20} />
            </div>
            
            <div className="flex flex-col items-start overflow-hidden text-left">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">
                {snoozed ? t("player.snoozed") : t("player.ringing")}
              </span>
              <h3 className="text-base font-black font-heading text-gray-800 dark:text-gray-100 truncate w-full max-w-[200px] leading-tight">
                {schedule?.label ?? t("player.bell")}
              </h3>
              <span className="text-xs font-bold font-body text-gray-600 dark:text-gray-400 opacity-70">
                {formatTimeString(schedule?.start_time, timeFormat)} {t("common.wib")}
              </span>
            </div>
          </div>
        </div>

        {/* Info section */}
        <div className="p-4 flex flex-col gap-4 bg-black/5 dark:bg-white/5">
          {/* Playback info */}
          <div>
            {isLoop ? (
              <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10">
                <FiRepeat size={14} className="text-indigo-500" />
                <span className="text-xs font-bold font-heading text-indigo-600 dark:text-indigo-400">
                  {t("player.loopMode")}
                </span>
              </div>
            ) : maxPlays > 1 ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between w-full">
                  <span className="text-[10px] font-bold font-body text-gray-500">
                    {t("player.playProgress", { current: currentPlay + 1, total: maxPlays })}
                  </span>
                  <span className="text-[10px] font-bold font-body text-gray-500">
                    {isPlaying ? t("player.playing") : t("player.finished")}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-pink-500 transition-all duration-300" 
                    style={{ width: `${progressVal}%` }} 
                  />
                </div>
              </div>
            ) : (
              <div className="flex justify-center gap-2">
                <span className="text-xs font-bold font-body text-gray-500">
                  {isPlaying ? t("player.playing") : t("player.finished")}
                </span>
              </div>
            )}
          </div>

          {/* Controls */}
          {snoozed ? (
            <div className="flex flex-col gap-2">
              <div className="p-2 rounded-xl bg-amber-500 text-white text-center font-bold text-xs font-body shadow-sm">
                {t("player.snoozeIn", { minutes: SNOOZE_SEC / 60 })}
              </div>
              <GlassButton variant="danger" onClick={handleStop} className="w-full">
                <FiX /> {t("player.cancelSnooze")}
              </GlassButton>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 w-full">
                <GlassButton 
                  variant="ghost" 
                  onClick={handlePauseResume} 
                  className={`flex-1 !px-2 !py-2 ${isPlaying ? "text-amber-500 hover:text-amber-600" : "text-emerald-500 hover:text-emerald-600"}`}
                >
                  {isPlaying ? <FiPause /> : <FiPlay />}
                  {isPlaying ? t("player.pause") : t("player.resume")}
                </GlassButton>
                
                <GlassButton variant="ghost" onClick={handleSnooze} className="flex-1 !px-2 !py-2">
                  <FiClock /> {t("player.snooze5")}
                </GlassButton>
              </div>

              <GlassButton 
                variant={isLoop ? "primary" : "danger"} 
                onClick={handleStop} 
                className="w-full !py-2 shadow-sm"
              >
                <FiX size={16} />
                {isLoop ? t("player.stopBell") : t("player.stop")}
              </GlassButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
