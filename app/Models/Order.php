<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Events\OrderStatusChanged;

class Order extends Model
{
    protected $fillable = [
    'reference',
    'user_id',
    'subtotal',
    'shipping_fee',
    'total_amount',
    'status',
    'paid_at',
    'payment_reference',
    'payment_attempts',
    'stock_deducted',
    'ship_full_name',
    'ship_phone',
    'ship_country',
    'ship_state',
    'ship_city',
    'ship_street',
    'ship_apartment',
    'ship_postal_code',
    'ship_instructions',
];

   protected $casts = [
    'subtotal' => 'decimal:2',
    'shipping_fee' => 'decimal:2',
    'total_amount' => 'decimal:2',
    'paid_at' => 'datetime',
    'stock_deducted' => 'boolean',
];

    protected static function booted(): void
    {
        static::creating(function (Order $order) {
            if (! $order->reference) {
                $alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
                $length = strlen($alphabet);

                do {
                    $code = '';
                    for ($i = 0; $i < 8; $i++) {
                        $code .= $alphabet[random_int(0, $length - 1)];
                    }
                    $reference = 'VNT-' . $code;
                } while (self::where('reference', $reference)->exists());

                $order->reference = $reference;
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public const STATUSES = [
    'pending',
    'paid',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
];

public const FULFILMENT_FLOW = [
    'paid',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
];

public function statusHistory(): HasMany
{
    return $this->hasMany(OrderStatusHistory::class)->latest();
}


public function canAdvanceTo(string $status): bool
{
    if ($status === 'cancelled') {
        return ! in_array($this->status, ['delivered', 'cancelled'], true);
    }

    $currentIndex = array_search($this->status, self::FULFILMENT_FLOW, true);
    $targetIndex = array_search($status, self::FULFILMENT_FLOW, true);

    if ($currentIndex === false || $targetIndex === false) {
        return false;
    }

    return $targetIndex === $currentIndex + 1;
}

public function recordStatus(
    string $status,
    ?string $note = null,
    ?int $userId = null,
    ?string $previous = null,
): void {
    $this->statusHistory()->create([
        'status' => $status,
        'note' => $note,
        'changed_by' => $userId,
    ]);

    OrderStatusChanged::dispatch($this, $status, $previous, $note);
}

}
