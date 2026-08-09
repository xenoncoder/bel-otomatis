<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Schedule\StoreScheduleRequest;
use App\Http\Requests\Schedule\UpdateScheduleRequest;
use App\Http\Resources\ScheduleResource;
use App\Services\ScheduleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function __construct(
        private ScheduleService $scheduleService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $schedules = $this->scheduleService->getAll($request->only(['day', 'is_active']));

        return ScheduleResource::collection($schedules)->response();
    }

    public function today(): JsonResponse
    {
        return ScheduleResource::collection($this->scheduleService->getTodaySchedules())->response();
    }

    public function store(StoreScheduleRequest $request): JsonResponse
    {
        $schedule = $this->scheduleService->create($request->validated());

        return (new ScheduleResource($schedule))
            ->response()
            ->setStatusCode(201);
    }

    public function show(int $id): JsonResponse
    {
        $schedule = $this->scheduleService->getAll(['day' => null])->firstWhere('id', $id);

        return new JsonResponse(new ScheduleResource($schedule));
    }

    public function update(UpdateScheduleRequest $request, int $id): JsonResponse
    {
        $schedule = \App\Models\Schedule::findOrFail($id);

        return new JsonResponse(new ScheduleResource($this->scheduleService->update($schedule, $request->validated())));
    }

    public function destroy(int $id): JsonResponse
    {
        $schedule = \App\Models\Schedule::findOrFail($id);
        $this->scheduleService->delete($schedule);

        return response()->json(null, 204);
    }

    public function trigger(int $id, \App\Services\BellTriggerService $bellTriggerService): JsonResponse
    {
        $log = $bellTriggerService->triggerManually($id);

        return response()->json(new \App\Http\Resources\BellLogResource($log), 200);
    }
}
