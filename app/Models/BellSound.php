<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BellSound extends Model
{
    protected $fillable = ['name', 'file_path'];

    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
    }
}
