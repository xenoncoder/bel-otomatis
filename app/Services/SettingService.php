<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class SettingService
{
    private const CACHE_KEY = 'settings:all';
    private const CACHE_TTL = 3600;

    public function __construct(
        private Setting $setting
    ) {}

    public function all(): Collection
    {
        $cached = Cache::get(self::CACHE_KEY);

        if (is_array($cached)) {
            return collect($cached);
        }

        $data = $this->setting->pluck('value', 'key')->all();
        Cache::put(self::CACHE_KEY, $data, self::CACHE_TTL);

        return collect($data);
    }

    public function update(array $data): Collection
    {
        if (isset($data['volume'])) {
            $volume = (int) $data['volume'];
            if (PHP_OS_FAMILY === 'Linux') {
                exec('amixer sset Master ' . $volume . '%');
            } else {
                $exe = base_path('setvol.exe');
                if (file_exists($exe)) {
                    exec('"' . $exe . '" ' . $volume);
                }
            }
        }

        foreach ($data as $key => $value) {
            $this->setting->updateOrCreate(
                ['key' => $key],
                ['value' => (string) $value]
            );
        }

        Cache::forget(self::CACHE_KEY);

        return $this->all();
    }
}
