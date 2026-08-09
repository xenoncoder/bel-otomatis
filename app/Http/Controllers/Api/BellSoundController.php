<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BellSoundResource;
use App\Services\BellSoundService;
use Illuminate\Http\JsonResponse;

class BellSoundController extends Controller
{
    public function __construct(
        private BellSoundService $bellSoundService
    ) {}

    public function index(): JsonResponse
    {
        $sounds = $this->bellSoundService->getAll();

        return BellSoundResource::collection($sounds)->response();
    }
}
