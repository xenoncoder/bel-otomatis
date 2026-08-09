import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { api } from "@/lib/api";
import type { Schedule } from "@/lib/types";

const TZ = "Asia/Jakarta";

function getJakartaTime(): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false, timeZone: TZ,
  }).format(new Date());
}

// === Global singleton state ===
let shouldRingState = false;
let currentScheduleState: Schedule | null = null;
let todaySchedulesState: Schedule[] = [];
const listeners = new Set<() => void>();

function emit() { listeners.forEach((l) => l()); }

let pollIntervalId: ReturnType<typeof setInterval> | null = null;
let pollRefCount = 0;
let lastRungKey: string | null = null;

function startPolling(intervalMs: number) {
  pollRefCount++;
  if (pollIntervalId) return;

  let schedulesCache: Schedule[] = [];
  let lastFetch = 0;

  const checkBell = async () => {
    const nowMs = Date.now();
    if (nowMs - lastFetch > 30000 || schedulesCache.length === 0) {
      try {
        schedulesCache = await api.schedules.today();
        todaySchedulesState = schedulesCache;
        emit();
        lastFetch = nowMs;
      } catch { /* silent */ }
    }

    const now = getJakartaTime();
    const match = schedulesCache.find((s) => s.start_time === now);
    if (match && lastRungKey !== `${match.id}-${now}`) {
      lastRungKey = `${match.id}-${now}`;
      shouldRingState = true;
      currentScheduleState = match;
      emit();
    }
  };

  checkBell();
  pollIntervalId = setInterval(checkBell, intervalMs);
}

function stopPolling() {
  pollRefCount = Math.max(0, pollRefCount - 1);
  if (pollRefCount === 0 && pollIntervalId) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
}

function dismissGlobal() {
  shouldRingState = false;
  currentScheduleState = null;
  emit();
}

function triggerGlobal(schedule: Schedule) {
  shouldRingState = true;
  currentScheduleState = schedule;
  emit();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function useBellPolling(intervalMs = 1000) {
  const stateRef = useRef({ shouldRing: shouldRingState, currentSchedule: currentScheduleState, todaySchedules: todaySchedulesState });

  const getSnapshot = () => {
    const changed =
      stateRef.current.shouldRing !== shouldRingState ||
      stateRef.current.currentSchedule !== currentScheduleState ||
      stateRef.current.todaySchedules !== todaySchedulesState;
    if (changed) {
      stateRef.current = {
        shouldRing: shouldRingState,
        currentSchedule: currentScheduleState,
        todaySchedules: todaySchedulesState,
      };
    }
    return stateRef.current;
  };

  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    startPolling(intervalMs);
    return () => stopPolling();
  }, [intervalMs]);

  return {
    shouldRing: shouldRingState,
    currentSchedule: currentScheduleState,
    todaySchedules: todaySchedulesState,
    dismiss: dismissGlobal,
    trigger: triggerGlobal,
  };
}
