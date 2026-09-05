<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WishlistItem extends Model
{
    protected $fillable = [
    'user_id',
    'product_id',
    'restock_notified_at',
];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }



protected function casts(): array
{
    return [
        'restock_notified_at' => 'datetime',
    ];
}

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
