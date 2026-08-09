import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Settings } from "@/lib/types";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSettings(await api.settings.get());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(async (data: Settings) => {
    const updated = await api.settings.update(data);
    setSettings(updated);
    return updated;
  }, []);

  return { settings, loading, update, reload: load };
}
