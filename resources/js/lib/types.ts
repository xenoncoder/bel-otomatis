export interface BellSound {
  id: number;
  name: string;
  file_path: string;
  url: string | null;
}

export type Recurrence = 'once' | 'daily' | 'weekly' | 'yearly';

export interface Schedule {
  id: number;
  day: string | null;
  days: string[] | null;
  start_time: string;
  end_time: string | null;
  label: string;
  bell_sound_id: number | null;
  bell_sound?: BellSound | null;
  is_active: boolean;
  recurrence: Recurrence;
  specific_date: string | null;
  start_date: string | null;
  end_date: string | null;
  repeat_count: number | null;
  loop_until_stopped: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BellLog {
  id: number;
  schedule_id: number;
  schedule?: Schedule;
  triggered_at: string;
  status: string;
}

export type Settings = Record<string, string>;
