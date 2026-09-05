<?php

namespace App\Notifications;

class AdminNewOrder extends AdminOrderNotification
{
    protected function subjectLine(): string
    {
        $customer = $this->order->user->name ?? $this->order->ship_full_name;

        return "New order {$this->order->reference} from {$customer}";
    }

    protected function heading(): string
    {
        return 'New Order';
    }

    protected function body(): string
    {
        $customer = $this->order->user->name ?? $this->order->ship_full_name;
        $total = number_format((float) $this->order->total_amount);

        return "{$customer} placed an order for ₦{$total}. It's awaiting payment — nothing to do until it clears.";
    }
}
