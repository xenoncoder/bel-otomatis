<?php

namespace App\Http\Requests\Schedule;

use Illuminate\Foundation\Http\FormRequest;

class UpdateScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'day' => ['sometimes', 'nullable', 'string', 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday'],
            'days' => ['sometimes', 'nullable', 'array'],
            'days.*' => ['string', 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday'],
            'start_time' => ['sometimes', 'date_format:H:i:s'],
            'end_time' => ['nullable', 'date_format:H:i:s'],
            'label' => ['sometimes', 'string', 'max:100'],
            'bell_sound_id' => ['nullable', 'exists:bell_sounds,id'],
            'is_active' => ['boolean'],
            'recurrence' => ['sometimes', 'string', 'in:once,daily,weekly,yearly'],
            'specific_date' => ['nullable', 'date'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'repeat_count' => ['nullable', 'integer', 'min:1'],
            'loop_until_stopped' => ['boolean'],
        ];
    }
}
