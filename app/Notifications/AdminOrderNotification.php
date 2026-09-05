<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

abstract class AdminOrderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $tries = 3;
    public $backoff = [10, 60, 180];

    public function __construct(public Order $order) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    abstract protected function subjectLine(): string;
    abstract protected function heading(): string;
    abstract protected function body(): string;

    protected function accent(): string
    {
        return '#e8ff00';
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->subjectLine())
            ->view('emails.admin-order', [
                'order' => $this->order,
                'heading' => $this->heading(),
                'body' => $this->body(),
                'ctaUrl' => url("/admin/orders/{$this->order->reference}"),
                'accent' => $this->accent(),
                'subject' => $this->subjectLine(),
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'order_reference' => $this->order->reference,
            'order_id' => $this->order->id,
            'status' => $this->order->status,
            'total' => (string) $this->order->total_amount,
            'customer' => $this->order->user->name ?? $this->order->ship_full_name,
            'title' => $this->heading(),
            'message' => $this->body(),
            'url' => "/admin/orders/{$this->order->reference}",
            'is_admin' => true,
        ];
    }
}
