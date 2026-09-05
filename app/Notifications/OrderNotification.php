<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

abstract class OrderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $tries = 3;
    public $backoff = [10, 60, 180];

    public function __construct(public Order $order, public ?string $note = null) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    abstract protected function subjectLine(): string;
    abstract protected function heading(): string;
    abstract protected function body(): string;
    abstract protected function ctaLabel(): string;

    protected function accent(): string
    {
        return '#e8ff00';
    }

    protected function showReceipt(): bool
    {
        return false;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->subjectLine())
            ->view('emails.order', [
                'order' => $this->order,
                'heading' => $this->heading(),
                'body' => $this->body(),
                'ctaLabel' => $this->ctaLabel(),
                'ctaUrl' => url("/order/{$this->order->reference}"),
                'accent' => $this->accent(),
                'showReceipt' => $this->showReceipt(),
                'note' => $this->note,
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
            'title' => $this->heading(),
            'message' => $this->body(),
            'url' => "/order/{$this->order->reference}",
        ];
    }
}
