import {
  FiBookOpen, FiClock, FiCalendar, FiFolder, FiSettings, FiActivity, FiDatabase, FiZap,
} from "react-icons/fi";
import { useT } from "@/lib/i18n";
import { GlassCard } from "@/components/ui/GlassComponents";

export default function DocumentationPage() {
  const t = useT();

  const sections = [
    {
      id: "dashboard",
      icon: FiClock,
      title: t("docs.dashboard.title"),
      desc: t("docs.dashboard.desc1"),
      features: [t("docs.dashboard.f1"), t("docs.dashboard.f2"), t("docs.dashboard.f3")],
      color: "from-purple-500 to-indigo-600",
      iconColor: "text-purple-500",
      bgLight: "bg-purple-500/10",
      border: "border-purple-500/30",
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
      color: "from-emerald-400 to-teal-500",
      iconColor: "text-emerald-500",
      bgLight: "bg-emerald-500/10",
      border: "border-emerald-500/30",
    },
    {
      id: "files",
      icon: FiFolder,
      title: t("docs.files.title"),
      desc: t("docs.files.desc1"),
      features: [t("docs.files.f1"), t("docs.files.f2"), t("docs.files.f3"), t("docs.files.f4")],
      color: "from-blue-500 to-cyan-500",
      iconColor: "text-blue-500",
      bgLight: "bg-blue-500/10",
      border: "border-blue-500/30",
    },
    {
      id: "settings",
      icon: FiSettings,
      title: t("docs.settings.title"),
      desc: t("docs.settings.desc1"),
      features: [t("docs.settings.f1"), t("docs.settings.f2"), t("docs.settings.f3"), t("docs.settings.f4")],
      color: "from-amber-400 to-orange-500",
      iconColor: "text-amber-500",
      bgLight: "bg-amber-500/10",
      border: "border-amber-500/30",
    },
    {
      id: "logs",
      icon: FiActivity,
      title: t("docs.logs.title"),
      desc: t("docs.logs.desc1"),
      features: [t("docs.logs.f1"), t("docs.logs.f2")],
      color: "from-rose-400 to-pink-500",
      iconColor: "text-rose-500",
      bgLight: "bg-rose-500/10",
      border: "border-rose-500/30",
    },
    {
      id: "database",
      icon: FiDatabase,
      title: t("docs.database.title"),
      desc: t("docs.database.desc1"),
      features: [t("docs.database.f1"), t("docs.database.f2")],
      color: "from-fuchsia-500 to-purple-600",
      iconColor: "text-fuchsia-500",
      bgLight: "bg-fuchsia-500/10",
      border: "border-fuchsia-500/30",
    },
  ];

  return (
    <div className="relative max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-purple-500/20">
          <FiBookOpen size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-black text-gray-800 dark:text-gray-100">
            {t("docs.title")}
          </h1>
          <p className="text-sm font-body font-bold text-gray-500 mt-1 uppercase tracking-widest">
            {t("docs.subtitle")}
          </p>
        </div>
      </div>

      {/* Table of Contents */}
      <GlassCard className="!p-0 overflow-hidden">
        <div className="bg-black/10 dark:bg-white/10 px-6 py-4 border-b border-white/10">
          <h2 className="font-heading font-bold text-lg text-gray-800 dark:text-gray-200">
            {t("docs.toc")}
          </h2>
        </div>
        <div className="p-4 md:p-6 flex flex-wrap gap-3">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <a key={s.id} href={`#${s.id}`} className="group">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 shadow-sm ${s.bgLight} ${s.border} hover:-translate-y-1 hover:shadow-md bg-white/50 dark:bg-black/20`}>
                  <Icon size={14} className={s.iconColor} />
                  <span className="text-sm font-bold font-heading text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    {s.title}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </GlassCard>

      {/* Introduction */}
      <GlassCard className="!p-0 overflow-hidden" id="intro">
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-4">
          <h2 className="font-heading font-bold text-lg text-emerald-800 dark:text-emerald-300">
            {t("docs.intro.title")}
          </h2>
        </div>
        <div className="p-4 md:p-6 bg-black/5 dark:bg-white/5">
          <p className="text-sm font-body text-gray-600 dark:text-gray-400 leading-relaxed font-bold">
            {t("docs.intro.desc")}
          </p>
        </div>
      </GlassCard>

      {/* Feature sections */}
      {sections.map((s) => {
        const Icon = s.icon;
        return (
          <GlassCard key={s.id} className="!p-0 overflow-hidden" id={s.id}>
            <div className={`bg-gradient-to-r ${s.color} px-6 py-4 flex items-center gap-3`}>
              <Icon size={18} className="text-white" />
              <h2 className="font-heading font-bold text-lg text-white">{s.title}</h2>
            </div>
            <div className="p-4 md:p-6 bg-black/5 dark:bg-white/5 flex flex-col gap-4">
              <p className="text-sm font-body text-gray-600 dark:text-gray-400 font-bold leading-relaxed">
                {s.desc}
              </p>
              <div className="flex flex-col gap-3">
                {s.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${s.bgLight} ${s.border}`}>
                      <span className={`text-xs font-black font-body ${s.iconColor}`}>{i + 1}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-body font-bold leading-relaxed">
                      {f}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        );
      })}

      {/* Tips & Tricks */}
      <GlassCard className="!p-0 overflow-hidden" id="tips">
        <div className="bg-amber-500 px-6 py-4 flex items-center gap-3">
          <FiZap size={18} className="text-white" />
          <h2 className="font-heading font-bold text-lg text-white">{t("docs.tips.title")}</h2>
        </div>
        <div className="p-4 md:p-6 bg-black/5 dark:bg-white/5 flex flex-col gap-4">
          {[t("docs.tips.desc1"), t("docs.tips.desc2"), t("docs.tips.desc3"), t("docs.tips.desc4"), t("docs.tips.desc5")].map((tip, i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 shadow-sm">
              <div className="bg-amber-400 text-white w-6 h-6 rounded-lg flex items-center justify-center shrink-0 font-black text-xs">
                {i + 1}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-body font-bold leading-relaxed">
                {tip}
              </p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
