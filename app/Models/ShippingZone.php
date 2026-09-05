<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShippingZone extends Model
{
    protected $fillable = [
        'name',
        'country',
        'states',
        'fee',
        'is_fallback',
        'is_active',
        'priority',
    ];

    protected $casts = [
        'states' => 'array',
        'fee' => 'decimal:2',
        'is_fallback' => 'boolean',
        'is_active' => 'boolean',
    ];

    public static function feeFor(?string $country, ?string $state): float
    {
        if (! $country) {
            return (float) (self::fallbackFee() ?? 0);
        }

        $zones = self::where('is_active', true)
            ->orderByDesc('priority')
            ->get();

        foreach ($zones as $zone) {
            if ($zone->is_fallback) {
                continue;
            }

            if ($zone->country && strcasecmp($zone->country, $country) !== 0) {
                continue;
            }

            if (! empty($zone->states)) {
                $match = collect($zone->states)->contains(
                    fn ($s) => strcasecmp($s, (string) $state) === 0
                );
                if (! $match) {
                    continue;
                }
            }

            return (float) $zone->fee;
        }

        return (float) (self::fallbackFee() ?? 0);
    }

    private static function fallbackFee(): ?string
    {
        return self::where('is_active', true)
            ->where('is_fallback', true)
            ->value('fee');
    }
}
