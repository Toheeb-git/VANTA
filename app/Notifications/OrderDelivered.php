<?php

namespace App\Notifications;

class OrderDelivered extends OrderNotification
{
    protected function subjectLine(): string
    {
        return "Order {$this->order->reference} delivered";
    }

    protected function heading(): string
    {
        return 'Delivered';
    }

    protected function body(): string
    {
        return "This order is complete. Thanks for shopping with us — we hope everything arrived exactly as you expected.";
    }

    protected function ctaLabel(): string
    {
        return 'View Order';
    }

    protected function accent(): string
    {
        return '#4ade80';
    }
}
