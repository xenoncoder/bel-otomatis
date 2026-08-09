<?php

namespace App\Http\Requests\Schedule;

use Illuminate\Foundation\Http\FormRequest;

class StoreScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'day' => ['nullable', 'string', 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday'],
            'days' => ['nullable', 'array'],
            'days.*' => ['string', 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday'],
            'start_time' => ['required', 'date_format:H:i:s'],
            'end_time' => ['nullable', 'date_format:H:i:s'],
            'label' => ['required', 'string', 'max:100'],
            'bell_sound_id' => ['nullable', 'exists:bell_sounds,id'],
            'is_active' => ['boolean'],
            'recurrence' => ['required', 'string', 'in:once,daily,weekly,yearly'],
            'specific_date' => ['nullable', 'date', 'required_if:recurrence,once,yearly'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'repeat_count' => ['nullable', 'integer', 'min:1'],
            'loop_until_stopped' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'specific_date.required_if' => 'Tanggal wajib diisi untuk jenis sekali atau tahunan.',
            'end_date.after_or_equal' => 'Tanggal selesai harus setelah tanggal mulai.',
        ];
    }
}
