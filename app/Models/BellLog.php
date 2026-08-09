<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BellLog extends Model
{
    protected $fillable = ['schedule_id', 'triggered_at', 'status'];

    protected $casts = [
        'triggered_at' => 'datetime',
    ];

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(Schedule::class);
    }
}
