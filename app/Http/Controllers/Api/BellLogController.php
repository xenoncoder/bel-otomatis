<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BellLogResource;
use App\Services\BellLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BellLogController extends Controller
{
    public function __construct(
        private BellLogService $bellLogService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $limit = (int) ($request->input('limit', 10));

        return BellLogResource::collection($this->bellLogService->recent($limit))->response();
    }

    public function destroy(int $id): JsonResponse
    {
        $this->bellLogService->delete($id);

        return response()->json(['message' => 'Log deleted.'], 200);
    }

    public function truncate(): JsonResponse
    {
        $this->bellLogService->truncate();

        return response()->json(['message' => 'All logs cleared.'], 200);
    }
}
