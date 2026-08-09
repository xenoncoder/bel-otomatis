import { useT } from "@/lib/i18n";
import { GlassBadge } from "./ui/GlassComponents";

interface BellStatusProps {
  shouldRing: boolean;
}

export default function BellStatus({ shouldRing }: BellStatusProps) {
  const t = useT();
  return (
    <div className="flex items-center gap-2 mt-2">
      <div
        className={`w-3 h-3 rounded-full border border-white/20 shadow-md ${
          shouldRing 
            ? "bg-rose-500 shadow-rose-500/50 animate-pulse" 
            : "bg-emerald-500 shadow-emerald-500/50"
        }`}
      />
      <GlassBadge color={shouldRing ? "red" : "green"}>
        {shouldRing ? t("bellStatus.ringing") : t("bellStatus.idle")}
      </GlassBadge>
    </div>
  );
}
