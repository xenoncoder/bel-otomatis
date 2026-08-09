<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateSettingRequest;
use App\Services\SettingService;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    public function __construct(
        private SettingService $settingService
    ) {}

    public function index(): JsonResponse
    {
        return response()->json($this->settingService->all());
    }

    public function update(UpdateSettingRequest $request): JsonResponse
    {
        return response()->json($this->settingService->update($request->validated()['settings']));
    }
}
