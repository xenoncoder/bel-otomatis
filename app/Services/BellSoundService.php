<?php

namespace App\Services;

use App\Models\BellSound;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

class BellSoundService
{
    private const DISK = 'public';
    private const ROOT = 'bells';
    private const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];

    public function __construct(
        private BellSound $bellSound
    ) {}

    public function getAll(): Collection
    {
        $this->syncFromFiles();

        return $this->bellSound
            ->select(['id', 'name', 'file_path'])
            ->orderBy('name')
            ->get();
    }

    public function syncFromFiles(): void
    {
        $disk = Storage::disk(self::DISK);

        if (!$disk->exists(self::ROOT)) {
            $disk->makeDirectory(self::ROOT);
        }

        $audioFiles = collect($disk->allFiles(self::ROOT))
            ->filter(fn ($path) => in_array(
                strtolower(pathinfo($path, PATHINFO_EXTENSION)),
                self::AUDIO_EXTENSIONS
            ));

        $existingPaths = $this->bellSound->pluck('file_path')->toArray();

        foreach ($audioFiles as $path) {
            if (!in_array($path, $existingPaths)) {
                $this->bellSound->create([
                    'name' => pathinfo($path, PATHINFO_FILENAME),
                    'file_path' => $path,
                ]);
            }
        }

        $audioPaths = $audioFiles->toArray();
        $orphans = array_diff($existingPaths, $audioPaths);

        if ($orphans) {
            $this->bellSound->whereIn('file_path', $orphans)->delete();
        }
    }
}
