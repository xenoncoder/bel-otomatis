import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Schedule } from "@/lib/types";

export function useSchedules(day?: string) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.schedules.list(day ? { day } : undefined);
      setSchedules(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [day]);

  useEffect(() => {
    load();
  }, [load]);

  return { schedules, loading, error, reload: load };
}
