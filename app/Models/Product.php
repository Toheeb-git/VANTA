<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Events\ProductRestocked;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    /** @use HasFactory<\Database\Factories\ProductFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'price',
        'discount_price',
        'stock',
        'image',
        'description',
        'category',
        'is_active',
    ];

    public function cartItems()
    {
        return $this->hasMany(CartItem::class);
    }
    protected static function booted(): void
    {
        static::creating(function (Product $product) {
            if (! $product->slug) {
                $product->slug = Str::slug($product->name) . '-' . uniqid();
            }
        });

        static::updated(function (Product $product) {
            $wasOut = $product->getOriginal('stock') <= 0;
            $isNowIn = $product->stock > 0;

            if ($wasOut && $isNowIn && $product->is_active) {
                ProductRestocked::dispatch($product);
            }
        });
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class)->latest();
    }

    public function averageRating(): float
    {
        return round((float) $this->reviews()->avg('rating'), 1);
    }

    public function reviewCount(): int
    {
        return $this->reviews()->count();
    }

    public function getEffectivePriceAttribute(): float
    {
        return (float) ($this->discount_price ?? $this->price);
    }
}
