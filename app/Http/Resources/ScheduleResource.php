<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ScheduleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'day' => $this->day,
            'days' => $this->days,
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'label' => $this->label,
            'bell_sound_id' => $this->bell_sound_id,
            'bell_sound' => new BellSoundResource($this->whenLoaded('bellSound')),
            'is_active' => $this->is_active,
            'recurrence' => $this->recurrence,
            'specific_date' => $this->specific_date?->format('Y-m-d'),
            'start_date' => $this->start_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'repeat_count' => $this->repeat_count,
            'loop_until_stopped' => $this->loop_until_stopped,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
