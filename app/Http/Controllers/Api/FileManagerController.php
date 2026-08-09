<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FileManagerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FileManagerController extends Controller
{
    public function __construct(
        private FileManagerService $fileManagerService
    ) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json(
            $this->fileManagerService->list($request->input('dir'))
        );
    }

    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:10240'],
            'dir' => ['nullable', 'string'],
        ]);

        $item = $this->fileManagerService->upload(
            $request->input('dir'),
            $request->file('file')
        );

        return response()->json($item, 201);
    }

    public function uploadFromUrl(Request $request): JsonResponse
    {
        $request->validate([
            'url' => ['required', 'string', 'url'],
            'dir' => ['nullable', 'string'],
            'name' => ['nullable', 'string', 'max:100'],
        ]);

        try {
            $item = $this->fileManagerService->uploadFromUrl(
                $request->input('dir'),
                $request->input('url'),
                $request->input('name')
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json($item, 201);
    }

    public function createFolder(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'dir' => ['nullable', 'string'],
        ]);

        $item = $this->fileManagerService->createFolder(
            $request->input('dir'),
            $request->input('name')
        );

        return response()->json($item, 201);
    }

    public function rename(Request $request): JsonResponse
    {
        $request->validate([
            'path' => ['required', 'string'],
            'name' => ['required', 'string', 'max:100'],
        ]);

        return response()->json(
            $this->fileManagerService->rename($request->input('path'), $request->input('name'))
        );
    }

    public function destroy(Request $request): JsonResponse
    {
        $request->validate(['path' => ['required', 'string']]);

        $this->fileManagerService->delete($request->input('path'));

        return response()->json(null, 204);
    }
}
