<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Schedule extends Model
{
    protected $fillable = [
        'day', 'days', 'start_time', 'end_time', 'label', 'bell_sound_id', 'is_active',
        'recurrence', 'specific_date', 'start_date', 'end_date',
        'repeat_count', 'loop_until_stopped',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'specific_date' => 'date',
        'start_date' => 'date',
        'end_date' => 'date',
        'loop_until_stopped' => 'boolean',
        'days' => 'array',
    ];

    public function bellSound(): BelongsTo
    {
        return $this->belongsTo(BellSound::class);
    }

    public function bellLogs(): HasMany
    {
        return $this->hasMany(BellLog::class);
    }

    public function scopeActive(Builder $q): Builder
    {
        return $q->where('is_active', true);
    }

    public function scopeByDay(Builder $q, string $day): Builder
    {
        return $q->where('day', $day);
    }

    public function scopeByRecurrence(Builder $q, string $recurrence): Builder
    {
        return $q->where('recurrence', $recurrence);
    }
}
