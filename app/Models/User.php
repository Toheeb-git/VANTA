<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'profile_picture',
        'password',
        'pending_email',
        'email_change_code',
        'email_change_expires_at',
        'email_change_attempts',
        'google_id',
        'avatar_url',
    ];
    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'email_change_expires_at' => 'datetime',
            'anonymised_at' => 'datetime',
            'suspended_at' => 'datetime',
            'last_login_at' => 'datetime',
        ];
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class);
    }

    public function defaultAddress(): HasOne
    {
        return $this->hasOne(Address::class)->where('is_default', true);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class)->latest();
    }

    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }


    // Email flow

    public function startEmailChange(string $newEmail): string
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $this->update([
            'pending_email' => $newEmail,
            'email_change_code' => Hash::make($code),
            'email_change_expires_at' => now()->addMinutes(10),
            'email_change_attempts' => 0,
        ]);

        return $code;
    }

    public function clearEmailChange(): void
    {
        $this->update([
            'pending_email' => null,
            'email_change_code' => null,
            'email_change_expires_at' => null,
            'email_change_attempts' => 0,
        ]);
    }

    public function emailChangeIsPending(): bool
    {
        return $this->pending_email
            && $this->email_change_expires_at
            && $this->email_change_expires_at->isFuture();
    }

    public function hasPassword(): bool
    {
        return ! is_null($this->password);
    }

    public function isGoogleLinked(): bool
    {
        return ! is_null($this->google_id);
    }

    public function wishlistItems(): HasMany
    {
        return $this->hasMany(WishlistItem::class)->latest();
    }

    public function isSuspended(): bool
    {
        return ! is_null($this->suspended_at);
    }

    public function isPendingDeletion(): bool
    {
        return ! is_null($this->deleted_at) && is_null($this->anonymised_at);
    }

    public function isAnonymised(): bool
    {
        return ! is_null($this->anonymised_at);
    }

    public function deletionDeadline(): ?\Carbon\CarbonInterface
    {
        return $this->deleted_at?->copy()->addDays(30);
    }

    /**
     * Strip personal data but keep the row so orders stay auditable.
     */
    public function anonymise(): void
    {
        $this->addresses()->delete();
        $this->wishlistItems()->delete();
        $this->cartItems()->delete();

        if ($this->profile_picture && Storage::disk('public')->exists($this->profile_picture)) {
            Storage::disk('public')->delete($this->profile_picture);
        }

        $this->forceFill([
            'name' => 'Deleted user',
            'email' => 'deleted-' . $this->id . '@removed.local',
            'phone' => null,
            'profile_picture' => null,
            'avatar_url' => null,
            'google_id' => null,
            'password' => null,
            'remember_token' => null,
            'pending_email' => null,
            'email_change_code' => null,
            'email_change_expires_at' => null,
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'anonymised_at' => now(),
        ])->save();
    }
}
