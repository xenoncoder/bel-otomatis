<?php

namespace App\Services;

use App\Models\BellSound;
use App\Models\Schedule;
use App\Models\Setting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

class BackupRestoreService
{
    public function exportZip(): string
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'bel_backup_') . '.zip';
        $zip = new ZipArchive();

        if ($zip->open($tempFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new \RuntimeException('Gagal membuat file ZIP.');
        }

        $backup = [
            'version' => 2,
            'exported_at' => now()->toIso8601String(),
            'app' => 'bel-otomatis',
            'data' => [
                'settings' => Setting::query()->get(['key', 'value'])->toArray(),
                'bell_sounds' => BellSound::query()->get(['id', 'name', 'file_path'])->toArray(),
                'schedules' => Schedule::query()
                    ->orderBy('day')->orderBy('start_time')
                    ->get(['id', 'day', 'days', 'start_time', 'end_time', 'label', 'bell_sound_id', 'is_active', 'recurrence', 'specific_date', 'start_date', 'end_date', 'repeat_count', 'loop_until_stopped'])
                    ->toArray(),
            ],
        ];

        $zip->addFromString('backup.json', json_encode($backup, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        $disk = Storage::disk('public');
        $audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];

        if ($disk->exists('bells')) {
            foreach ($disk->allFiles('bells') as $filePath) {
                $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
                if (in_array($ext, $audioExtensions)) {
                    $zip->addFromString('sounds/' . $filePath, $disk->get($filePath));
                }
            }
        }

        $zip->close();

        return $tempFile;
    }

    public function importZip(UploadedFile $file, bool $overwrite = false): array
    {
        $tempDir = sys_get_temp_dir() . '/bel_restore_' . uniqid();
        @mkdir($tempDir, 0777, true);

        $zip = new ZipArchive();
        if ($zip->open($file->getRealPath()) !== true) {
            @rmdir($tempDir);
            throw new \InvalidArgumentException('File ZIP tidak valid.');
        }

        $zip->extractTo($tempDir);
        $zip->close();

        $jsonPath = $tempDir . '/backup.json';
        if (!file_exists($jsonPath)) {
            $this->cleanupDir($tempDir);
            throw new \InvalidArgumentException('File backup.json tidak ditemukan dalam ZIP.');
        }

        $data = json_decode(file_get_contents($jsonPath), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->cleanupDir($tempDir);
            throw new \InvalidArgumentException('File backup.json bukan JSON yang valid.');
        }

        $counts = $this->import($data, $overwrite);

        $soundsDir = $tempDir . '/sounds';
        if (is_dir($soundsDir)) {
            $counts['files'] = $this->restoreSounds($soundsDir, $overwrite);
        }

        $this->cleanupDir($tempDir);

        return $counts;
    }

    private function restoreSounds(string $soundsDir, bool $overwrite): int
    {
        $disk = Storage::disk('public');
        $count = 0;
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($soundsDir, \RecursiveDirectoryIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if (!$file->isFile()) continue;
            $relativePath = substr($file->getPathname(), strlen($soundsDir . '/'));
            $relativePath = str_replace('\\', '/', $relativePath);

            if (!$overwrite && $disk->exists($relativePath)) continue;

            $disk->put($relativePath, file_get_contents($file->getRealPath()));
            $count++;
        }

        return $count;
    }

    private function cleanupDir(string $dir): void
    {
        if (!is_dir($dir)) return;
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST
        );
        foreach ($iterator as $file) {
            $file->isDir() ? rmdir($file->getRealPath()) : unlink($file->getRealPath());
        }
        rmdir($dir);
    }

    public function import(array $backup, bool $overwrite = false): array
    {
        $data = $backup['data'] ?? $backup;
        $counts = ['settings' => 0, 'bell_sounds' => 0, 'schedules' => 0];

        DB::transaction(function () use ($data, $overwrite, &$counts) {
            if ($overwrite) {
                Schedule::query()->delete();
                BellSound::query()->delete();
                Setting::query()->delete();
            }

            $soundMap = [];

            foreach ($data['bell_sounds'] ?? [] as $sound) {
                $existing = $overwrite ? null : BellSound::where('name', $sound['name'])->first();
                if ($existing) {
                    $soundMap[$sound['id'] ?? null] = $existing->id;
                    continue;
                }
                $created = BellSound::create([
                    'name' => $sound['name'],
                    'file_path' => $sound['file_path'] ?? 'bells/default.mp3',
                ]);
                $soundMap[$sound['id'] ?? null] = $created->id;
                $counts['bell_sounds']++;
            }

            $settingsData = collect($data['settings'] ?? [])
                ->map(fn($s) => ['key' => $s['key'], 'value' => $s['value']])
                ->unique('key')
                ->toArray();

            foreach ($settingsData as $setting) {
                Setting::updateOrCreate(['key' => $setting['key']], ['value' => $setting['value']]);
                $counts['settings']++;
            }

            foreach ($data['schedules'] ?? [] as $schedule) {
                $bellSoundId = $schedule['bell_sound_id'] ?? null;
                $resolvedId = $bellSoundId ? ($soundMap[$bellSoundId] ?? null) : null;

                $existing = $overwrite ? null : Schedule::where('day', $schedule['day'])
                    ->where('start_time', $schedule['start_time'])
                    ->where('end_time', $schedule['end_time'])
                    ->where('label', $schedule['label'])
                    ->first();

                if ($existing) continue;

                Schedule::create([
                    'day' => $schedule['day'] ?? null,
                    'days' => $schedule['days'] ?? null,
                    'start_time' => $schedule['start_time'],
                    'end_time' => $schedule['end_time'],
                    'label' => $schedule['label'],
                    'bell_sound_id' => $resolvedId,
                    'is_active' => $schedule['is_active'] ?? true,
                    'recurrence' => $schedule['recurrence'] ?? 'weekly',
                    'specific_date' => $schedule['specific_date'] ?? null,
                    'start_date' => $schedule['start_date'] ?? null,
                    'end_date' => $schedule['end_date'] ?? null,
                    'repeat_count' => $schedule['repeat_count'] ?? null,
                    'loop_until_stopped' => $schedule['loop_until_stopped'] ?? false,
                ]);
                $counts['schedules']++;
            }

            cache()->forget('settings:all');
        });

        return $counts;
    }
}
