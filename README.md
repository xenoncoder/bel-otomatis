# Bel Otomatis Sekolah

Sistem bel otomatis sekolah — Laravel 13 + React 18 (Vite) + Chakra UI v3 + SQLite dalam **satu proyek**.

Desain neobrutalist ala saweria.co (font Comfortaa + IBM Plex Mono, border hitam, shadow tegas) dengan fitur alarm ala hotalarmclock.com (snooze, stopwatch, timer, world clock).

## Arsitektur MSCV

```
View (React)  ->  Controller  ->  Service  ->  Model
     ^                                              |
     |-------------- Response JSON <----------------|
```

- **Model** — hanya `$fillable`, `$casts`, relasi, scope (tanpa business logic)
- **Service** — satu-satunya tempat business logic (overlap, trigger bel, logging, backup, file manager)
- **Controller** — tipis: validasi (Form Request) + panggil Service + return Resource
- **View** — React, hanya presentasi

## Fitur

- **Dashboard**: Jam real-time WIB, Stopwatch, Timer, World Clock, Bell Player (snooze 5m + stop), countdown ke bel berikutnya, test bell
- **Jadwal**: tab per hari (Senin-Minggu), format `HH:MM:SS` (presisi detik), anti-overlap
- **Suara Bel**: upload mp3/wav/ogg, pilih per jadwal
- **File Manager**: browse folder, upload, buat folder, rename, hapus (dengan path-traversal guard)
- **Log Aktivitas**: riwayat trigger bel (manual/scheduled)
- **Backup/Restore**: export semua data ke JSON, import dengan dialog konfirmasi
- **Dark/Light Mode**: toggle dengan `next-themes` (class `.dark`)
- **Scheduler Otomatis**: cek jadwal tiap menit via `schedule:work`

## Cara Menjalankan

### 1. Install dependency

```bash
composer install
npm install
```

### 2. Setup database & seed

```bash
php artisan migrate:fresh --seed
php artisan storage:link
```

### 3. Jalankan

Pengembangan (Vite HMR + Laravel):
```bash
npm run dev         # terminal 1: Vite dev server (HMR)
php artisan serve   # terminal 2: Laravel server (port 8000)
```

Akses: http://localhost:8000

### 4. Scheduler bel otomatis

Jalankan scheduler (cek jadwal tiap menit) di terminal terpisah:
```bash
php artisan schedule:work
```

Atau test manual sekali:
```bash
php artisan bell:check
```

## Struktur

```
app/
  Console/Commands/CheckBellCommand.php   # php artisan bell:check
  Events/BellRung.php
  Exceptions/ScheduleOverlapException.php
  Http/
    Controllers/Api/                       # Controller (tipis)
      ScheduleController.php
      SettingController.php
      BellSoundController.php
      BellLogController.php
      FileManagerController.php
      BackupRestoreController.php
    Requests/                              # Form Request (validasi HH:MM:SS)
    Resources/                             # API Resource (response {data:[...]})
  Models/                                  # Schedule, Setting, BellSound, BellLog
  Services/                                # Business logic
    ScheduleService.php                    # CRUD + anti-overlap
    BellTriggerService.php                 # trigger manual/scheduled + logging
    BellLogService.php
    BellSoundService.php
    SettingService.php                     # cache (array plain, bukan Collection)
    FileManagerService.php                 # file ops + path-traversal guard
    BackupRestoreService.php              # export/import JSON
database/
  migrations/                              # 4 tabel utama
  seeders/DatabaseSeeder.php              # jadwal Senin-Jumat 07:00-15:00
resources/js/
  components/                              # Layout, NavClock, BellPlayer, Stopwatch, Timer, WorldClock
  hooks/                                   # useSchedules, useSettings, useBellPolling
  lib/                                     # api.ts (unwrap helper), types.ts
  pages/                                   # Dashboard, Schedules, Bells, Logs, FileManager, Settings
  styles/saweria.css                       # CSS variables, fonts, neobrutalist components
  theme.ts                                 # Chakra v3 + saweria color palette + button recipe
  main.tsx                                 # ThemeProvider + ChakraProvider + Toaster + ErrorBoundary
routes/
  api.php                                  # REST API
  web.php                                  # catch-all -> React SPA
  console.php                              # scheduler bell:check tiap menit
```

## API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/schedules` | List jadwal (filter `?day=&is_active=`) |
| GET | `/api/schedules/today` | Jadwal aktif hari ini |
| POST | `/api/schedules` | Tambah jadwal (validasi anti-overlap, format `HH:MM:SS`) |
| PUT | `/api/schedules/{id}` | Update jadwal |
| DELETE | `/api/schedules/{id}` | Hapus jadwal |
| POST | `/api/schedules/{id}/trigger` | Test bell (trigger manual) |
| GET | `/api/settings` | Ambil semua setting |
| PUT | `/api/settings` | Update setting |
| GET | `/api/bell-sounds` | List suara bel |
| POST | `/api/bell-sounds/upload` | Upload suara (mp3/wav/ogg) |
| DELETE | `/api/bell-sounds/{id}` | Hapus suara |
| GET | `/api/bell-logs` | Log aktivitas bel |
| GET | `/api/files?dir=` | List file/folder |
| POST | `/api/files/upload` | Upload file |
| POST | `/api/files/folder` | Buat folder |
| POST | `/api/files/rename` | Rename file/folder |
| DELETE | `/api/files?path=` | Hapus file/folder |
| GET | `/api/backup/export` | Export semua data ke JSON |
| POST | `/api/backup/import` | Import dari JSON (multipart `file=@backup.json`) |

## Build Production

```bash
npm run build
php artisan config:cache
php artisan route:cache
```

## Teknologi

- **Backend**: Laravel 13.24, PHP 8.4, SQLite
- **Frontend**: React 18, Vite 5, TypeScript, Chakra UI v3.36
- **Icons**: react-icons (Feather)
- **Fonts**: Comfortaa (heading), IBM Plex Mono (body) — via Google Fonts
- **Dark Mode**: next-themes (`attribute="class"`)
- **Timezone**: `Asia/Jakarta` (config/app.php + frontend `Intl.DateTimeFormat`)
