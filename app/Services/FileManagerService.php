<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileManagerService
{
    private const DISK = 'public';

    private const ROOT = 'bells';

    private function disk()
    {
        return Storage::disk(self::DISK);
    }

    private function normalize(string $path): string
    {
        $segments = [];
        foreach (explode('/', str_replace('\\', '/', $path)) as $seg) {
            if ($seg === '' || $seg === '.') {
                continue;
            }
            if ($seg === '..') {
                array_pop($segments);
                continue;
            }
            $segments[] = $seg;
        }

        return implode('/', $segments);
    }

    private function resolvePath(?string $dir): string
    {
        $dir = $this->normalize((string) $dir);

        if ($dir === '') {
            return self::ROOT;
        }

        return self::ROOT.'/'.$dir;
    }

    private function guardWithinRoot(string $path): string
    {
        $path = $this->normalize($path);

        abort_unless(
            $path === self::ROOT || str_starts_with($path, self::ROOT.'/'),
            403,
            'Akses path ditolak.'
        );

        return $path;
    }

    public function list(?string $dir = null): array
    {
        $path = $this->guardWithinRoot($this->resolvePath($dir));
        $disk = $this->disk();

        abort_unless($disk->exists($path), 404, 'Direktori tidak ditemukan.');

        $items = collect($disk->directories($path))
            ->map(fn ($d) => $this->formatItem($d, true))
            ->merge(
                collect($disk->files($path))->map(fn ($f) => $this->formatItem($f, false))
            )
            ->sortBy([['is_dir', 'desc'], ['name', 'asc']])
            ->values();

        $relative = $path === self::ROOT ? '' : Str::after($path, self::ROOT.'/');

        return [
            'dir' => $relative,
            'items' => $items,
        ];
    }

    private function formatItem(string $path, bool $isDir): array
    {
        $disk = $this->disk();
        $name = basename($path);
        $relative = $path === self::ROOT ? '' : Str::after($path, self::ROOT.'/');

        return [
            'name' => $name,
            'path' => $path,
            'relative' => $relative,
            'is_dir' => $isDir,
            'size' => $isDir ? 0 : $disk->size($path),
            'mime' => $isDir ? null : $disk->mimeType($path),
            'url' => $isDir ? null : '/storage/'.$path,
            'modified' => date('Y-m-d H:i:s', $disk->lastModified($path)),
        ];
    }

    private function uniqueName(string $dir, string $name): string
    {
        $disk = $this->disk();
        if (!$disk->exists($dir.'/'.$name)) {
            return $name;
        }

        $ext = pathinfo($name, PATHINFO_EXTENSION);
        $base = $ext ? Str::beforeLast($name, '.'.$ext) : $name;
        $i = 1;
        while ($disk->exists($dir.'/'.($ext ? "{$base}-{$i}.{$ext}" : "{$base}-{$i}"))) {
            $i++;
        }

        return $ext ? "{$base}-{$i}.{$ext}" : "{$base}-{$i}";
    }

    public function upload(?string $dir, UploadedFile $file): array
    {
        $path = $this->guardWithinRoot($this->resolvePath($dir));
        $name = $this->uniqueName($path, $file->getClientOriginalName());
        $stored = $file->storeAs($path, $name, ['disk' => self::DISK]);

        return $this->formatItem($stored, false);
    }

    public function uploadFromUrl(?string $dir, string $url, ?string $customName = null): array
    {
        $path = $this->guardWithinRoot($this->resolvePath($dir));

        try {
            $response = Http::timeout(30)->get($url);
        } catch (\Exception $e) {
            throw new \InvalidArgumentException('Gagal mengunduh file dari URL: ' . $e->getMessage());
        }

        if (!$response->successful()) {
            throw new \InvalidArgumentException('Gagal mengunduh file dari URL (HTTP ' . $response->status() . ').');
        }

        $contents = $response->body();
        if (empty($contents)) {
            throw new \InvalidArgumentException('File dari URL kosong.');
        }

        $urlPath = parse_url($url, PHP_URL_PATH) ?? '';
        $baseName = $customName && $customName !== '' ? $customName : basename($urlPath);

        if ($baseName === '' || !str_contains($baseName, '.')) {
            $baseName = 'download-' . time() . '.mp3';
        }

        $name = $this->uniqueName($path, $baseName);
        $fullPath = $path . '/' . $name;

        $this->disk()->put($fullPath, $contents);

        return $this->formatItem($fullPath, false);
    }

    public function createFolder(?string $dir, string $name): array
    {
        $path = $this->guardWithinRoot($this->resolvePath($dir));
        $name = $this->normalize($name);
        $newPath = $path.'/'.$name;

        $this->disk()->makeDirectory($newPath);

        return $this->formatItem($newPath, true);
    }

    public function rename(string $path, string $newName): array
    {
        $path = $this->guardWithinRoot($path);

        abort_unless($this->disk()->exists($path), 404, 'File/folder tidak ditemukan.');

        $dir = dirname($path);
        $newName = $this->normalize($newName);
        $newPath = $dir.'/'.$newName;

        if ($path !== $newPath) {
            $this->disk()->move($path, $newPath);
        }

        return $this->formatItem($newPath, $this->disk()->directoryExists($newPath));
    }

    public function delete(string $path): void
    {
        $path = $this->guardWithinRoot($path);

        if ($this->disk()->directoryExists($path)) {
            $this->disk()->deleteDirectory($path);
        } else {
            $this->disk()->delete($path);
        }
    }

}
