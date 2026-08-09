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
import { useToast } from "@/components/ui/ToastProvider";
import { useState, useCallback } from "react";
import { FiPlay, FiClock, FiZap, FiWatch, FiGlobe, FiMaximize } from "react-icons/fi";
import { GlassCard, GlassButton } from "@/components/ui/GlassComponents";

export default function DashboardPage() {
  const { shouldRing, todaySchedules, trigger } = useBellPolling();
  const [tab, setTab] = useState("clock");
  const [testing, setTesting] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [logRefresh, setLogRefresh] = useState(0);
  const t = useT();
  const { toast } = useToast();

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
    if (!next) { toast({ title: t("dashboard.noScheduleToTest"), type: "warning" }); return; }
    setTesting(true);
    try {
      await api.schedules.trigger(next.id);
      toast({ title: t("dashboard.bellTested", { label: next.label }), type: "info" });
      setLogRefresh((n) => n + 1);
      trigger(next);
    } catch (e) {
      toast({ title: (e as Error).message, type: "error" });
    } finally { setTesting(false); }
  };

  const enterFullscreen = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      /* not supported */
    }
    setFullscreen(true);
  }, []);

  return (
    <div className="relative">
      <div className="flex flex-col gap-6 relative z-10">
        {fullscreen && <FullscreenDisplay onExit={() => setFullscreen(false)} />}

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 w-full">
          <div className="flex flex-col items-center md:items-start flex-1 w-full">
            <h1 className="text-3xl md:text-5xl font-heading font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-300 dark:to-purple-300 mb-2">
              {t("dashboard.title")}
            </h1>
            <BellStatus shouldRing={shouldRing} />
          </div>
          <div className="flex gap-3 shrink-0">
            <GlassButton variant="success" onClick={handleTestBell} disabled={testing}>
              <FiPlay size={16} /> {t("dashboard.testBell")}
            </GlassButton>
            <GlassButton variant="primary" onClick={enterFullscreen}>
              <FiMaximize size={16} /> {t("fullscreen.enter")}
            </GlassButton>
          </div>
        </div>

        <div>
          {/* Custom Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tabItem) => {
              const TabIcon = tabItem.icon;
              const isActive = tab === tabItem.value;
              return (
                <button
                  key={tabItem.value}
                  onClick={() => setTab(tabItem.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-heading font-bold text-sm transition-all whitespace-nowrap ${
                    isActive 
                      ? "bg-indigo-500/80 text-white shadow-lg shadow-indigo-500/30" 
                      : "glass-panel hover:bg-white/20 dark:hover:bg-white/10"
                  }`}
                >
                  <TabIcon size={16} />
                  {tabItem.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            {tab === "clock" && (
              <div className="flex flex-col gap-6">
                <GlassCard className="!p-0 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 border-b border-white/10">
                    <h2 className="font-heading font-bold text-lg text-white">{t("dashboard.currentTime")}</h2>
                  </div>
                  <div className="p-4 md:p-8 flex justify-center items-center bg-black/5 dark:bg-white/5">
                    <DigitalClock />
                  </div>
                </GlassCard>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CountdownTimer schedules={todaySchedules} />
                  <GlassCard className="!p-0 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 border-b border-white/10">
                      <h2 className="font-heading font-bold text-lg text-white">{t("dashboard.activityLog")}</h2>
                    </div>
                    <div className="bg-black/5 dark:bg-white/5 h-full">
                      <BellLogTable refreshKey={logRefresh} />
                    </div>
                  </GlassCard>
                </div>
              </div>
            )}
            
            {tab === "stopwatch" && (
              <GlassCard className="!p-0 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 border-b border-white/10">
                  <h2 className="font-heading font-bold text-lg text-white">{t("dashboard.stopwatch")}</h2>
                </div>
                <div className="p-6">
                  <Stopwatch />
                </div>
              </GlassCard>
            )}
            {tab === "timer" && (
              <GlassCard className="!p-0 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 border-b border-white/10">
                  <h2 className="font-heading font-bold text-lg text-white">{t("dashboard.timer")}</h2>
                </div>
                <div className="p-6">
                  <Timer />
                </div>
              </GlassCard>
            )}
            {tab === "world" && (
              <GlassCard className="!p-0 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 border-b border-white/10">
                  <h2 className="font-heading font-bold text-lg text-white">{t("dashboard.worldClock")}</h2>
                </div>
                <div className="p-6">
                  <WorldClock />
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
