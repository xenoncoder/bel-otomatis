<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            $table->text('days')->nullable()->after('day');
        });

        // Migrate existing single `day` values into `days` JSON array
        $schedules = DB::table('schedules')->whereNotNull('day')->get(['id', 'day']);
        foreach ($schedules as $s) {
            DB::table('schedules')->where('id', $s->id)->update([
                'days' => json_encode([$s->day]),
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            $table->dropColumn('days');
        });
    }
};
