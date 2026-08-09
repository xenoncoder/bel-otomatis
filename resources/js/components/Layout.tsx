import { Outlet, NavLink } from "react-router-dom";
import { useT } from "@/lib/i18n";
import { FiGrid, FiCalendar, FiSettings, FiDatabase, FiFileText, FiFolder, FiBell, FiStopCircle } from "react-icons/fi";
import BackgroundOrnament from "./BackgroundOrnament";
import BellPlayer from "./BellPlayer";
import DarkModeToggle from "./DarkModeToggle";
import { useBellPolling } from "@/hooks/useBellPolling";
import { useTimeFormat } from "@/lib/time-format";
import { useSettings } from "@/hooks/useSettings";
import SaweriaTooltip from "./SaweriaTooltip";
import React, { useState } from "react";

const routes = {
  dashboard: "/",
  schedules: "/schedules",
  settings: "/settings",
  database: "/database",
  logs: "/logs",
  files: "/files"
};

const navItems = [
  { to: routes.dashboard, label: "Dashboard", icon: FiGrid, end: true },
  { to: routes.schedules, label: "Jadwal", icon: FiCalendar, end: false },
  { to: routes.files, label: "Audio", icon: FiFolder, end: false },
  { to: routes.database, label: "Database", icon: FiDatabase, end: false },
  { to: routes.logs, label: "Log", icon: FiFileText, end: false },
  { to: routes.settings, label: "Pengaturan", icon: FiSettings, end: false },
];

function NavClock() {
  const [time, setTime] = useState(new Date());
  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const { settings } = useSettings();
  const formatOpt: Intl.DateTimeFormatOptions = { 
    hour: '2-digit', minute: '2-digit', 
    hour12: settings?.time_format === '12'
  };
  return (
    <div className="glass-panel px-3 py-1 text-sm font-bold tracking-wider">
      {time.toLocaleTimeString('id-ID', formatOpt).replace('.', ':')}
    </div>
  );
}

export default function Layout() {
  const t = useT();
  const { settings } = useSettings();
  const { currentSchedule, dismiss, shouldRing } = useBellPolling();
    const year = new Date().getFullYear();

  return (
    <div className="min-h-screen relative text-gray-900 dark:text-gray-100 flex flex-col">
      <BackgroundOrnament variant={shouldRing ? "ringing" : "normal"} />
      <BellPlayer shouldRing={shouldRing} schedule={currentSchedule} onDismiss={dismiss} />

      {shouldRing && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm p-4 glass-panel border-purple-500/50 bg-purple-500/20 shadow-2xl shadow-purple-500/30 animate-pulse">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center animate-bounce">
                <FiBell size={20} color="white" />
              </div>
              <div>
                <p className="font-heading font-bold text-sm text-purple-900 dark:text-purple-100">{t("dashboard.loopingAlert")}</p>
                <p className="text-xl font-heading font-black text-gray-800 dark:text-gray-100">{currentSchedule?.label}</p>
                <p className="text-sm font-bold text-gray-500 font-body">{currentSchedule?.start_time} WIB</p>
              </div>
            </div>
            <button onClick={dismiss} className="glass-btn bg-purple-600 hover:bg-purple-500 text-white !py-1 !px-3 text-xs">
              <FiStopCircle /> Stop
            </button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white/10 dark:bg-black/20 backdrop-blur-xl border-b border-white/20 dark:border-white/10 shadow-lg">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = routes.dashboard}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <FiBell size={20} color="white" />
            </div>
            <h1 className="font-heading font-black text-xl uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              {t("app.name")}
            </h1>
          </div>

          <nav className="hidden lg:flex items-center justify-center gap-2 flex-1">
            {navItems.map((item) => (
              <SaweriaTooltip key={item.to} label={item.label} placement="bottom">
                <NavLink to={item.to} end={item.end} className={({isActive}) => 
                  `p-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-white/30 dark:bg-white/10 shadow-inner' : 'hover:bg-white/10 dark:hover:bg-white/5'}`
                }>
                  {({ isActive }) => <item.icon size={20} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'} strokeWidth={isActive ? 2.5 : 2} />}
                </NavLink>
              </SaweriaTooltip>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <NavClock />
            <DarkModeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 max-w-[1400px] mx-auto w-full pb-24 z-10 relative">
        <Outlet />
      </main>

      <footer className="hidden lg:block fixed bottom-0 left-0 right-0 glass-panel !rounded-none !border-x-0 !border-b-0 py-2 z-40 text-center">
        <p className="text-xs text-gray-500 font-body tracking-wider">
          &copy; {year} - Dibuat dengan &hearts; di Purbalingga
        </p>
      </footer>
      
      {/* Mobile Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 glass-panel !rounded-none !border-x-0 !border-b-0 z-50 px-2 pb-safe pt-2">
         <div className="flex justify-around items-center h-14">
            {navItems.slice(0,5).map(item => (
                <NavLink key={item.to} to={item.to} className={({isActive}) => 
                  `flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700'}`
                }>
                  <item.icon size={20} />
                  <span className="text-[10px] font-bold">{item.label}</span>
                </NavLink>
            ))}
         </div>
      </div>
    </div>
  );
}
