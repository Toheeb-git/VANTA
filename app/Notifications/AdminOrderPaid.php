<?php

namespace App\Notifications;

class AdminOrderPaid extends AdminOrderNotification
{
    protected function subjectLine(): string
    {
        $total = number_format((float) $this->order->total_amount);

        return "Payment received — {$this->order->reference} (₦{$total})";
    }

    protected function heading(): string
    {
        return 'Payment Received';
    }

    protected function body(): string
    {
        $customer = $this->order->user->name ?? $this->order->ship_full_name;
        $total = number_format((float) $this->order->total_amount);
        $city = $this->order->ship_city;
        $state = $this->order->ship_state;

        return "₦{$total} confirmed from {$customer}. Shipping to {$city}, {$state}. Ready to be confirmed and packed.";
    }
}
