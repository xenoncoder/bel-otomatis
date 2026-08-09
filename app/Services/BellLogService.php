<?php

namespace App\Services;

use App\Models\BellLog;
use App\Models\Schedule;
use Illuminate\Database\Eloquent\Collection;

class BellLogService
{
    public function __construct(
        private BellLog $bellLog
    ) {}

    public function recent(int $limit = 10): Collection
    {
        return $this->bellLog
            ->with('schedule:id,day,start_time,end_time,label')
            ->latest('triggered_at')
            ->limit($limit)
            ->get();
    }

    public function isAlreadyRungToday(int $scheduleId, string $time): bool
    {
        [$h, $m, $s] = array_map('intval', explode(':', $time));
        $window = now()->today()->setTime($h, $m, $s);

        return $this->bellLog
            ->where('schedule_id', $scheduleId)
            ->whereBetween('triggered_at', [$window->copy()->subSeconds(2), $window->copy()->addSeconds(2)])
            ->exists();
    }

    public function log(Schedule $schedule, string $status = 'success'): BellLog
    {
        return $this->bellLog->create([
            'schedule_id' => $schedule->id,
            'triggered_at' => now(),
            'status' => $status,
        ]);
    }

    public function delete(int $id): void
    {
        $this->bellLog->where('id', $id)->delete();
    }

    public function truncate(): void
    {
        $this->bellLog->truncate();
    }
}
