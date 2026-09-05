<?php

namespace App\Listeners;

use App\Events\ProductRestocked;
use App\Models\WishlistItem;
use App\Notifications\ProductBackInStock;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;
use Throwable;

class NotifyWishlistOnRestock implements ShouldQueue
{
    public $tries = 3;
    public $backoff = [30, 120, 300];

    public function handle(ProductRestocked $event): void
    {
        $items = WishlistItem::with('user')
            ->where('product_id', $event->product->id)
            ->where(function ($q) {
                $q->whereNull('restock_notified_at')
                  ->orWhere('restock_notified_at', '<', now()->subDays(7));
            })
            ->get();

        foreach ($items as $item) {
            if (! $item->user) {
                continue;
            }

            $item->user->notify(new ProductBackInStock($event->product));

            $item->update(['restock_notified_at' => now()]);
        }
    }

    public function failed(ProductRestocked $event, Throwable $e): void
    {
        Log::error('Restock notification failed', [
            'product_id' => $event->product->id,
            'error' => $e->getMessage(),
        ]);
    }
}
