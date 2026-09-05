<?php

namespace App\Listeners;

use App\Events\OrderStatusChanged;
use App\Models\User;
use App\Notifications\AdminNewOrder;
use App\Notifications\AdminOrderPaid;
use App\Notifications\OrderCancelled;
use App\Notifications\OrderDelivered;
use App\Notifications\OrderPaid;
use App\Notifications\OrderPlaced;
use App\Notifications\OrderShipped;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class SendOrderStatusNotifications implements ShouldQueue
{
    public $tries = 3;
    public $backoff = [10, 60, 180];

    public function handle(OrderStatusChanged $event): void
    {
        $order = $event->order->loadMissing(['items.product', 'user']);

        $this->notifyCustomer($order, $event);
        $this->notifyAdmins($order, $event);
    }

    private function notifyCustomer($order, OrderStatusChanged $event): void
    {
        if (! $order->user) {
            return;
        }

        $notification = match ($event->status) {
            'pending' => new OrderPlaced($order, $event->note),
            'paid' => new OrderPaid($order, $event->note),
            'shipped' => new OrderShipped($order, $event->note),
            'delivered' => new OrderDelivered($order, $event->note),
            'cancelled' => new OrderCancelled($order, $event->note),
            default => null,
        };

        if ($notification) {
            $order->user->notify($notification);
        }
    }

    private function notifyAdmins($order, OrderStatusChanged $event): void
    {
        $notification = match ($event->status) {
            'pending' => new AdminNewOrder($order),
            'paid' => new AdminOrderPaid($order),
            default => null,
        };

        if (! $notification) {
            return;
        }

        $admins = User::where('role', 'admin')->get();

        if ($admins->isEmpty()) {
            Log::warning('No admin users to notify', [
                'order' => $order->reference,
            ]);
            return;
        }

        Notification::send($admins, $notification);
    }

    public function failed(OrderStatusChanged $event, \Throwable $e): void
    {
        Log::error('Order notification failed', [
            'order' => $event->order->reference,
            'status' => $event->status,
            'error' => $e->getMessage(),
        ]);
    }
}
