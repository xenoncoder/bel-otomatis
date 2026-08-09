<?php

namespace Database\Seeders;

use App\Models\BellSound;
use App\Models\Schedule;
use App\Models\Setting;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Setting::updateOrCreate(['key' => 'volume'], ['value' => '80']);
        Setting::updateOrCreate(['key' => 'timezone'], ['value' => 'Asia/Jakarta']);
        Setting::updateOrCreate(['key' => 'bell_duration'], ['value' => '10']);

        $sound = BellSound::firstOrCreate(
            ['name' => 'Bell Default'],
            ['file_path' => 'bells/default.mp3']
        );

        $days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        $template = [
            ['07:00:00', '07:15:00', 'Masuk Sekolah'],
            ['07:15:00', '08:00:00', 'Jam ke-1'],
            ['08:00:00', '08:45:00', 'Jam ke-2'],
            ['08:45:00', '09:30:00', 'Jam ke-3'],
            ['09:30:00', '09:45:00', 'Istirahat ke-1'],
            ['09:45:00', '10:30:00', 'Jam ke-4'],
            ['10:30:00', '11:15:00', 'Jam ke-5'],
            ['11:15:00', '12:00:00', 'Istirahat ke-2'],
            ['12:00:00', '12:45:00', 'Jam ke-6'],
            ['12:45:00', '13:30:00', 'Jam ke-7'],
            ['13:30:00', '14:15:00', 'Jam ke-8'],
            ['14:15:00', '15:00:00', 'Pulang'],
        ];

        foreach ($days as $day) {
            foreach ($template as [$start, $end, $label]) {
                Schedule::firstOrCreate(
                    ['day' => $day, 'start_time' => $start, 'end_time' => $end, 'label' => $label],
                    [
                        'bell_sound_id' => $sound->id,
                        'is_active' => true,
                        'recurrence' => 'weekly',
                    ]
                );
            }
        }
    }
}
