<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BackupRestoreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BackupRestoreController extends Controller
{
    public function __construct(
        private BackupRestoreService $backupRestoreService
    ) {}

    public function export(): BinaryFileResponse
    {
        $zipPath = $this->backupRestoreService->exportZip();
        $filename = 'bel-otomatis-backup-' . now()->format('Y-m-d_His') . '.zip';

        return response()->download($zipPath, $filename, [
            'Content-Type' => 'application/zip',
        ])->deleteFileAfterSend(true);
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:zip,json', 'max:51200'],
        ]);

        $overwrite = filter_var($request->input('overwrite', 'false'), FILTER_VALIDATE_BOOLEAN);
        $file = $request->file('file');

        try {
            $ext = strtolower($file->getClientOriginalExtension());

            if ($ext === 'zip') {
                $counts = $this->backupRestoreService->importZip($file, $overwrite);
            } else {
                $content = $file->get();
                $data = json_decode($content, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    throw new \InvalidArgumentException('File JSON tidak valid.');
                }
                $counts = $this->backupRestoreService->import($data, $overwrite);
            }

            return response()->json([
                'message' => 'Backup berhasil dipulihkan.',
                'imported' => $counts,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal memulihkan: ' . $e->getMessage()], 500);
        }
    }
}
