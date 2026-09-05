<?php

namespace App\Notifications;

class OrderPaid extends OrderNotification
{
    protected function subjectLine(): string
    {
        return "Payment received for {$this->order->reference}";
    }

    protected function heading(): string
    {
        return 'Payment Confirmed';
    }

    protected function body(): string
    {
        return "Thanks — your payment came through. We're preparing your order now and you'll hear from us again when it ships.";
    }

    protected function ctaLabel(): string
    {
        return 'View Order';
    }

    protected function showReceipt(): bool
    {
        return true;
    }
}
