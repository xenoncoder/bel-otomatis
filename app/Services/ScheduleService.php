<?php

namespace App\Services;

use App\Exceptions\ScheduleOverlapException;
use App\Models\Schedule;
use Illuminate\Database\Eloquent\Collection;

class ScheduleService
{
    public function __construct(
        private Schedule $schedule
    ) {}

    public function getAll(array $filters = []): Collection
    {
        return $this->schedule
            ->select(['id', 'day', 'days', 'start_time', 'end_time', 'label', 'bell_sound_id', 'is_active', 'recurrence', 'specific_date', 'start_date', 'end_date', 'repeat_count', 'loop_until_stopped'])
            ->when($filters['day'] ?? null, fn($q, $day) => $q->byDay($day))
            ->when(array_key_exists('is_active', $filters), fn($q) => $q->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN)))
            ->with('bellSound:id,name,file_path')
            ->orderBy('start_time')
            ->get();
    }

    public function getTodaySchedules(): Collection
    {
        $today = strtolower(now()->format('l'));
        $todayDate = now()->format('Y-m-d');
        $todayMonthDay = now()->format('m-d');

        $schedules = $this->schedule
            ->select(['id', 'day', 'days', 'start_time', 'end_time', 'label', 'bell_sound_id', 'is_active', 'recurrence', 'specific_date', 'start_date', 'end_date', 'repeat_count', 'loop_until_stopped'])
            ->active()
            ->where(function ($q) use ($today, $todayDate, $todayMonthDay) {
                $q->where(function ($q2) use ($today) {
                    $q2->whereIn('recurrence', ['daily', 'weekly']);
                })
                ->orWhere(function ($q2) use ($todayDate) {
                    $q2->byRecurrence('once')->whereDate('specific_date', $todayDate);
                })
                ->orWhere(function ($q2) use ($todayMonthDay) {
                    $q2->byRecurrence('yearly')
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
            ->orderBy('start_time')
            ->get();

        return $schedules->filter(function ($s) use ($today) {
            if (!in_array($s->recurrence, ['daily', 'weekly'])) {
                return true;
            }
            $days = $s->days ?? [];
            if ($s->recurrence === 'daily' && (empty($days))) {
                return true;
            }
            return in_array($today, $days);
        })->values();
    }

    public function create(array $data): Schedule
    {
        $recurrence = $data['recurrence'] ?? 'weekly';
        $days = $data['days'] ?? [];

        if (in_array($recurrence, ['daily', 'weekly']) && !empty($days)) {
            foreach ($days as $day) {
                $this->ensureNoOverlap($day, $data['start_time']);
            }
        }

        $data['is_active'] = $data['is_active'] ?? true;
        $data['recurrence'] = $recurrence;

        if (in_array($recurrence, ['daily', 'weekly']) && empty($data['specific_date'])) {
            $data['specific_date'] = null;
        }

        if (!in_array($recurrence, ['daily', 'weekly'])) {
            $data['days'] = null;
        }

        return $this->schedule->create($data);
    }

    public function update(Schedule $schedule, array $data): Schedule
    {
        $recurrence = $data['recurrence'] ?? $schedule->recurrence;
        $days = $data['days'] ?? $schedule->days ?? [];

        if (in_array($recurrence, ['daily', 'weekly']) && !empty($days)) {
            $startTime = $data['start_time'] ?? $schedule->start_time;
            foreach ($days as $day) {
                $this->ensureNoOverlap($day, $startTime, $schedule->id);
            }
        }

        if (!in_array($recurrence, ['daily', 'weekly'])) {
            $data['days'] = null;
        }

        $schedule->update($data);

        return $schedule->fresh(['bellSound:id,name,file_path']);
    }

    public function delete(Schedule $schedule): void
    {
        $schedule->delete();
    }

    private function ensureNoOverlap(string $day, string $start, ?int $excludeId = null): void
    {
        $all = $this->schedule
            ->whereIn('recurrence', ['daily', 'weekly'])
            ->where('start_time', $start)
            ->when($excludeId, fn($q) => $q->where('id', '!=', $excludeId))
            ->get(['id', 'days', 'recurrence']);

        $overlap = $all->contains(function ($s) use ($day) {
            $sDays = $s->days ?? [];
            if ($s->recurrence === 'daily' && empty($sDays)) {
                return true;
            }
            return in_array($day, $sDays);
        });

        if ($overlap) {
            throw new ScheduleOverlapException();
        }
    }
}
