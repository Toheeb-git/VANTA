<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class AnonymiseDeletedAccounts extends Command
{
    protected $signature = 'accounts:anonymise';

    protected $description = 'Strip personal data from accounts deleted more than 30 days ago';

    public function handle(): int
    {
        $due = User::onlyTrashed()
            ->whereNull('anonymised_at')
            ->where('deleted_at', '<=', now()->subDays(30))
            ->get();

        if ($due->isEmpty()) {
            $this->info('Nothing to anonymise.');
            return self::SUCCESS;
        }

        foreach ($due as $user) {
            try {
                $user->anonymise();
                $this->line("Anonymised user #{$user->id}");
            } catch (\Throwable $e) {
                Log::error('Anonymisation failed', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
                $this->error("Failed on user #{$user->id}");
            }
        }

        $this->info("Anonymised {$due->count()} account(s).");

        return self::SUCCESS;
    }
}
