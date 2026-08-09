<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DatabaseController extends Controller
{
    private const TABLES = [
        'schedules' => ['id', 'day', 'days', 'start_time', 'end_time', 'label', 'bell_sound_id', 'is_active', 'recurrence', 'specific_date', 'start_date', 'end_date', 'repeat_count', 'loop_until_stopped', 'created_at', 'updated_at'],
        'bell_sounds' => ['id', 'name', 'file_path', 'created_at', 'updated_at'],
        'settings' => ['id', 'key', 'value', 'created_at', 'updated_at'],
        'bell_logs' => ['id', 'schedule_id', 'triggered_at', 'status', 'created_at', 'updated_at'],
    ];

    private const EDITABLE = ['schedules', 'bell_sounds', 'settings', 'bell_logs'];

    private const GUARDED = ['id', 'created_at', 'updated_at'];

    public function tables(): JsonResponse
    {
        $info = [];
        foreach (self::TABLES as $table => $columns) {
            $info[] = [
                'name' => $table,
                'columns' => $columns,
                'count' => DB::table($table)->count(),
            ];
        }

        return response()->json(['data' => $info]);
    }

    public function show(string $table, Request $request): JsonResponse
    {
        if (!isset(self::TABLES[$table])) {
            return response()->json(['message' => "Tabel '{$table}' tidak ditemukan."], 404);
        }

        $columns = self::TABLES[$table];
        
        $query = DB::table($table);
        $search = $request->query('search');
        
        if (!empty($search)) {
            $query->where(function ($q) use ($columns, $search) {
                foreach ($columns as $c) {
                    $q->orWhere($c, 'LIKE', "%{$search}%");
                }
            });
        }

        $rows = $query
            ->orderBy('id', 'desc')
            ->limit(200)
            ->get()
            ->toArray();

        return response()->json([
            'table' => $table,
            'columns' => $columns,
            'data' => $rows,
            'total' => DB::table($table)->count(),
        ]);
    }

    public function insert(string $table, Request $request): JsonResponse
    {
        if (!isset(self::TABLES[$table]) || !in_array($table, self::EDITABLE)) {
            return response()->json(['message' => "Tabel '{$table}' tidak dapat diubah."], 404);
        }

        $fillable = array_diff(self::TABLES[$table], self::GUARDED);
        $data = collect($request->only($fillable))
            ->map(fn($val) => $val === '' ? null : $val)
            ->toArray();

        if (empty(array_filter($data, fn($val) => $val !== null))) {
            return response()->json(['message' => 'Tidak ada data untuk disimpan.'], 422);
        }

        if ($table === 'schedules' && isset($data['days']) && is_array($data['days'])) {
            $data['days'] = json_encode($data['days']);
        }

        $data['created_at'] = now();
        $data['updated_at'] = now();

        $id = DB::table($table)->insertGetId($data);

        return response()->json(['message' => 'Data ditambahkan.', 'id' => $id], 201);
    }

    public function updateRow(string $table, int $id, Request $request): JsonResponse
    {
        if (!isset(self::TABLES[$table]) || !in_array($table, self::EDITABLE)) {
            return response()->json(['message' => "Tabel '{$table}' tidak dapat diubah."], 404);
        }

        if (!DB::table($table)->where('id', $id)->exists()) {
            return response()->json(['message' => 'Data tidak ditemukan.'], 404);
        }

        $fillable = array_diff(self::TABLES[$table], self::GUARDED);
        $data = collect($request->only($fillable))
            ->map(fn($val) => $val === '' ? null : $val)
            ->toArray();

        if ($table === 'schedules' && isset($data['days']) && is_array($data['days'])) {
            $data['days'] = json_encode($data['days']);
        }

        if (empty(array_filter($data, fn($val) => $val !== null))) {
            return response()->json(['message' => 'Tidak ada data untuk diperbarui.'], 422);
        }

        $data['updated_at'] = now();

        DB::table($table)->where('id', $id)->update($data);

        return response()->json(['message' => 'Data diperbarui.']);
    }

    public function deleteRow(string $table, int $id): JsonResponse
    {
        if (!isset(self::TABLES[$table]) || !in_array($table, self::EDITABLE)) {
            return response()->json(['message' => "Tabel '{$table}' tidak dapat diubah."], 404);
        }

        $deleted = DB::table($table)->where('id', $id)->delete();

        if (!$deleted) {
            return response()->json(['message' => 'Data tidak ditemukan.'], 404);
        }

        return response()->json(['message' => 'Data dihapus.']);
    }

    public function truncate(string $table): JsonResponse
    {
        if (!isset(self::TABLES[$table]) || !in_array($table, self::EDITABLE)) {
            return response()->json(['message' => "Tabel '{$table}' tidak dapat diubah."], 404);
        }

        DB::table($table)->truncate();

        return response()->json(['message' => "Semua data tabel '{$table}' dihapus."]);
    }

    public function schema(string $table): JsonResponse
    {
        if (!isset(self::TABLES[$table])) {
            return response()->json(['message' => "Tabel '{$table}' tidak ditemukan."], 404);
        }

        $columns = Schema::getColumns($table);
        $indexes = Schema::getIndexes($table);

        return response()->json([
            'columns' => $columns,
            'indexes' => $indexes
        ]);
    }

    public function query(Request $request): JsonResponse
    {
        $sql = trim($request->input('query'));
        if (empty($sql)) {
            return response()->json(['message' => 'Query tidak boleh kosong.'], 400);
        }

        try {
            if (stripos($sql, 'select') === 0 || stripos($sql, 'pragma') === 0) {
                $rows = DB::select($sql);
                $columns = !empty($rows) ? array_keys((array) $rows[0]) : [];
                return response()->json(['columns' => $columns, 'data' => $rows]);
            } else {
                $success = DB::statement($sql);
                return response()->json(['message' => 'Query berhasil dieksekusi.', 'success' => $success]);
            }
        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal: ' . $e->getMessage()], 400);
        }
    }

    public function export(string $table, Request $request)
    {
        if (!isset(self::TABLES[$table])) {
            return response()->json(['message' => "Tabel '{$table}' tidak ditemukan."], 404);
        }

        $format = $request->query('format', 'csv');
        $rows = DB::table($table)->get();

        if ($format === 'json') {
            return response()->json($rows)
                ->header('Content-Disposition', 'attachment; filename="' . $table . '.json"');
        }

        $csv = [];
        $columns = self::TABLES[$table];
        $csv[] = implode(',', $columns);
        foreach ($rows as $row) {
            $r = [];
            foreach ($columns as $c) {
                $val = $row->$c;
                if ($val === null) $val = '';
                $val = str_replace('"', '""', (string)$val);
                $r[] = '"' . $val . '"';
            }
            $csv[] = implode(',', $r);
        }

        return response(implode("\n", $csv))
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="' . $table . '.csv"');
    }
}
