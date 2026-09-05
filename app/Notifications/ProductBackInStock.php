<?php

namespace App\Notifications;

use App\Models\Product;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProductBackInStock extends Notification implements ShouldQueue
{
    use Queueable;

    public $tries = 3;
    public $backoff = [10, 60, 180];

    public function __construct(public Product $product) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Back in stock: {$this->product->name}")
            ->view('emails.back-in-stock', [
                'userName' => $notifiable->name,
                'product' => $this->product,
                'appUrl' => config('app.url'),
                'subject' => 'Back in stock',
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Back In Stock',
            'message' => "{$this->product->name} is available again — only {$this->product->stock} in stock.",
            'url' => '/wishlist',
            'status' => 'restock',
            'is_admin' => false,
        ];
    }
}
