<?php

namespace App\Notifications;

class OrderCancelled extends OrderNotification
{
    protected function subjectLine(): string
    {
        return "Order {$this->order->reference} cancelled";
    }

    protected function heading(): string
    {
        return 'Order Cancelled';
    }

    protected function body(): string
    {
        return "This order has been cancelled. If it had already been paid for, a refund will follow separately — reply to this email if you haven't heard from us within a few days.";
    }

    protected function ctaLabel(): string
    {
        return 'View Order';
    }

    protected function accent(): string
    {
        return '#ff3d2e';
    }
}
