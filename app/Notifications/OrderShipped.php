<?php

namespace App\Notifications;

class OrderShipped extends OrderNotification
{
    protected function subjectLine(): string
    {
        return "Your order {$this->order->reference} is on the way";
    }

    protected function heading(): string
    {
        return 'On The Way';
    }

    protected function body(): string
    {
        return "Your order has left us and is heading to your delivery address. Let us know once it arrives.";
    }

    protected function ctaLabel(): string
    {
        return 'Track Order';
    }

    protected function accent(): string
    {
        return '#ffaa3c';
    }
}
