<?php

namespace App\Exceptions;

use RuntimeException;

class ScheduleOverlapException extends RuntimeException
{
    protected $message = 'Jadwal tumpang tindih dengan jadwal lain.';
}
