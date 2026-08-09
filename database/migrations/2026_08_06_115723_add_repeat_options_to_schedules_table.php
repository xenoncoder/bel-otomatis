<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            $table->integer('repeat_count')->nullable()->after('end_date');
            $table->boolean('loop_until_stopped')->default(false)->after('repeat_count');
        });
    }

    public function down(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            $table->dropColumn(['repeat_count', 'loop_until_stopped']);
        });
    }
};
