<?php

use App\Http\Controllers\Api\BackupRestoreController;
use App\Http\Controllers\Api\BellLogController;
use App\Http\Controllers\Api\BellSoundController;
use App\Http\Controllers\Api\DatabaseController;
use App\Http\Controllers\Api\FileManagerController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\SettingController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok']));

Route::get('backup/export', [BackupRestoreController::class, 'export']);
Route::post('backup/import', [BackupRestoreController::class, 'import']);

Route::get('schedules/today', [ScheduleController::class, 'today']);
Route::post('schedules/{id}/trigger', [ScheduleController::class, 'trigger']);
Route::apiResource('schedules', ScheduleController::class);

Route::get('settings', [SettingController::class, 'index']);
Route::put('settings', [SettingController::class, 'update']);

Route::get('bell-logs', [BellLogController::class, 'index']);
Route::delete('bell-logs', [BellLogController::class, 'truncate']);
Route::delete('bell-logs/{id}', [BellLogController::class, 'destroy']);

Route::get('bell-sounds', [BellSoundController::class, 'index']);

Route::prefix('files')->group(function () {
    Route::get('/', [FileManagerController::class, 'index']);
    Route::post('/upload', [FileManagerController::class, 'upload']);
    Route::post('/upload-url', [FileManagerController::class, 'uploadFromUrl']);
    Route::post('/folder', [FileManagerController::class, 'createFolder']);
    Route::post('/rename', [FileManagerController::class, 'rename']);
    Route::delete('/', [FileManagerController::class, 'destroy']);
});

Route::get('database/tables', [DatabaseController::class, 'tables']);
Route::post('database/query', [DatabaseController::class, 'query']);
Route::get('database/{table}/schema', [DatabaseController::class, 'schema']);
Route::get('database/{table}/export', [DatabaseController::class, 'export']);
Route::get('database/{table}', [DatabaseController::class, 'show']);
Route::post('database/{table}', [DatabaseController::class, 'insert']);
Route::delete('database/{table}/truncate', [DatabaseController::class, 'truncate']);
Route::put('database/{table}/{id}', [DatabaseController::class, 'updateRow']);
Route::delete('database/{table}/{id}', [DatabaseController::class, 'deleteRow']);
