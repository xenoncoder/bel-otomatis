<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            $table->enum('recurrence', ['once', 'daily', 'weekly', 'yearly'])->default('weekly')->after('day');
            $table->date('specific_date')->nullable()->after('recurrence');
            $table->date('start_date')->nullable()->after('specific_date');
            $table->date('end_date')->nullable()->after('start_date');
        });

        \DB::table('schedules')->whereNull('recurrence')->orWhere('recurrence', '')->update(['recurrence' => 'weekly']);
    }

    public function down(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            $table->dropColumn(['recurrence', 'specific_date', 'start_date', 'end_date']);
        });
    }
};
