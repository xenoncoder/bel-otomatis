<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BellLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'schedule_id' => $this->schedule_id,
            'schedule' => new ScheduleResource($this->whenLoaded('schedule')),
            'triggered_at' => $this->triggered_at?->toIso8601String(),
            'status' => $this->status,
        ];
    }
}
