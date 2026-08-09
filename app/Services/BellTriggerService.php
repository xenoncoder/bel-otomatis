<?php

namespace App\Services;

use App\Events\BellRung;
use App\Models\BellLog;
use App\Models\Schedule;

class BellTriggerService
{
    public function __construct(
        private ScheduleService $scheduleService,
        private BellLogService $bellLogService,
        private SettingService $settingService
    ) {}

    private function applySystemVolume(): void
    {
        $settings = $this->settingService->all();
        $volume = $settings->get('volume', 100);
        
        if (PHP_OS_FAMILY === 'Linux') {
            exec('amixer sset Master ' . (int)$volume . '%');
        } else {
            $exe = base_path('setvol.exe');
            if (file_exists($exe)) {
                exec('"' . $exe . '" ' . (int)$volume);
            }
        }
    }

    public function checkAndTrigger(): ?BellLog
    {
        $now = now()->format('H:i:s');
        $today = strtolower(now()->format('l'));
        $todayDate = now()->format('Y-m-d');
        $todayMonthDay = now()->format('m-d');

        $schedules = Schedule::query()
            ->active()
            ->where('start_time', $now)
            ->where(function ($q) use ($today, $todayDate, $todayMonthDay) {
                $q->where(function ($q2) {
                    $q2->whereIn('recurrence', ['daily', 'weekly']);
                })
                ->orWhere(function ($q2) use ($todayDate) {
                    $q2->where('recurrence', 'once')->whereDate('specific_date', $todayDate);
                })
                ->orWhere(function ($q2) use ($todayMonthDay) {
                    $q2->where('recurrence', 'yearly')
                        ->whereMonth('specific_date', substr($todayMonthDay, 0, 2))
                        ->whereDay('specific_date', substr($todayMonthDay, 3, 2));
                });
            })
            ->where(function ($q) {
                $q->whereNull('start_date')->orWhereDate('start_date', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('end_date')->orWhereDate('end_date', '>=', now());
            })
            ->with(['bellSound:id,name,file_path'])
            ->get(['id', 'day', 'days', 'start_time', 'end_time', 'label', 'bell_sound_id', 'is_active', 'recurrence', 'repeat_count', 'loop_until_stopped']);

        $schedule = $schedules->first(function ($s) use ($today) {
            if (!in_array($s->recurrence, ['daily', 'weekly'])) {
                return true;
            }
            $days = $s->days ?? [];
            if ($s->recurrence === 'daily' && empty($days)) {
                return true;
            }
            return in_array($today, $days);
        });

        if (!$schedule) {
            return null;
        }

        if ($this->bellLogService->isAlreadyRungToday($schedule->id, $now)) {
            return null;
        }

                $log = $this->bellLogService->log($schedule);
        $this->applySystemVolume();
        event(new BellRung($schedule));

        if ($schedule->recurrence === 'once') {
            $schedule->update(['is_active' => false]);
        }

        return $log;
    }

    public function triggerManually(int $scheduleId): BellLog
    {
        $schedule = Schedule::query()
            ->where('id', $scheduleId)
            ->with(['bellSound:id,name,file_path'])
            ->firstOrFail(['id', 'day', 'days', 'start_time', 'end_time', 'label', 'bell_sound_id']);

                $log = $this->bellLogService->log($schedule, 'manual');
        $this->applySystemVolume();
        event(new BellRung($schedule));

        return $log;
    }
}
