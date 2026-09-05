<?php

namespace App\Notifications;

class OrderPlaced extends OrderNotification
{
    protected function subjectLine(): string
    {
        return "Order {$this->order->reference} received — payment pending";
    }

    protected function heading(): string
    {
        return 'Order Received';
    }

    protected function body(): string
    {
        return "We've got your order and it's reserved for you. Complete payment to confirm it and we'll start getting it ready.";
    }

    protected function ctaLabel(): string
    {
        return 'Complete Payment';
    }
}
