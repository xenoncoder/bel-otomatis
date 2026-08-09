<?php

namespace App\Console\Commands;

use App\Services\BellTriggerService;
use Illuminate\Console\Command;

class CheckBellCommand extends Command
{
    protected $signature = 'bell:check';

    protected $description = 'Cek jadwal dan bunyikan bel otomatis';

    public function handle(BellTriggerService $bellTriggerService): int
    {
        $log = $bellTriggerService->checkAndTrigger();

        if ($log) {
            $this->info("Bell rung: {$log->schedule->label} at {$log->triggered_at}");
        } else {
            $this->info('No bell to ring at this time.');
        }

        return self::SUCCESS;
    }
}
