<?php

namespace App\Http\Controllers;

use App\Models\CartItem;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class GoogleAuthController extends Controller
{
    public function redirect()
    {
        session(['guest_session_id' => session()->getId()]);

        return Socialite::driver('google')->redirect();
    }

    public function callback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (Throwable $e) {
            Log::error('Google auth failed', ['error' => $e->getMessage()]);

            return redirect('/login')->withErrors([
                'email' => 'Google sign-in failed. Please try again.',
            ]);
        }

        if (! $googleUser->getEmail()) {
            Log::warning('Google account returned no email', [
                'google_id' => $googleUser->getId(),
            ]);

            return redirect('/login')->withErrors([
                'email' => 'That Google account has no email address we can use.',
            ]);
        }

        $guestSessionId = session('guest_session_id');

        $user = $this->resolveUser($googleUser);

        // An anonymised account can never be signed back into
        if ($user->isAnonymised()) {
            return redirect('/login')->withErrors([
                'email' => 'That account has been permanently closed.',
            ]);
        }

        // Suspended accounts are stopped before a session exists
        if ($user->isSuspended()) {
            $reason = $user->suspension_reason;

            return redirect('/login')->withErrors([
                'email' => $reason
                    ? "Your account has been suspended: {$reason}"
                    : 'Your account has been suspended. Please contact support.',
            ]);
        }

        $wasRestored = $user->wasRecentlyRestored ?? false;

        Auth::login($user, true);

        $user->forceFill(['last_login_at' => now()])->save();

        $this->mergeGuestCart($guestSessionId, $user->id);

        session()->forget('guest_session_id');
        session()->regenerate();

        if ($wasRestored) {
            return redirect('/account/profile')->with(
                'status',
                'Welcome back — your account has been restored.',
            );
        }

        if ($user->role === 'admin') {
            return redirect('/product-dashboard');
        }

        return redirect($this->intendedDestination($user));
    }

    /**
     * Find, link, or create the account behind this Google identity.
     *
     * Trashed accounts are included so someone inside their 30-day
     * grace period is restored rather than given a duplicate account.
     */
    private function resolveUser($googleUser): User
    {
        // 1. Already linked — restore if pending deletion, then refresh avatar.
        $user = User::withTrashed()
            ->where('google_id', $googleUser->getId())
            ->first();

        if ($user) {
            if ($user->trashed() && ! $user->anonymised_at) {
                $user->restore();
                $user->forceFill([
                    'suspended_at' => null,
                    'suspension_reason' => null,
                ])->save();
                $user->wasRecentlyRestored = true;
            }

            if (! $user->isAnonymised()) {
                $user->update(['avatar_url' => $googleUser->getAvatar()]);
            }

            return $user;
        }

        // 2. Same email already registered — link the two accounts.
        $existing = User::withTrashed()
            ->where('email', $googleUser->getEmail())
            ->first();

        if ($existing) {
            if ($existing->trashed() && ! $existing->anonymised_at) {
                $existing->restore();
                $existing->forceFill([
                    'suspended_at' => null,
                    'suspension_reason' => null,
                ])->save();
                $existing->wasRecentlyRestored = true;
            }

            if (! $existing->isAnonymised()) {
                $existing->update([
                    'google_id' => $googleUser->getId(),
                    'avatar_url' => $googleUser->getAvatar(),
                ]);

                if (! $existing->email_verified_at) {
                    $existing->forceFill(['email_verified_at' => now()])->save();
                }
            }

            return $existing;
        }

        // 3. Brand new account.
        $user = User::create([
            'name' => $googleUser->getName() ?: 'VANTA Customer',
            'email' => $googleUser->getEmail(),
            'google_id' => $googleUser->getId(),
            'avatar_url' => $googleUser->getAvatar(),
            'password' => null,
        ]);

        // Server-controlled fields, deliberately kept out of $fillable.
        $user->forceFill([
            'email_verified_at' => now(),
            'role' => 'user',
        ])->save();

        return $user;
    }

    private function mergeGuestCart(?string $sessionId, int $userId): void
    {
        if (! $sessionId) {
            return;
        }

        $guestItems = CartItem::where('session_id', $sessionId)
            ->whereNull('user_id')
            ->get();

        if ($guestItems->isEmpty()) {
            return;
        }

        DB::transaction(function () use ($guestItems, $userId) {
            foreach ($guestItems as $guestItem) {
                $existing = CartItem::where('user_id', $userId)
                    ->where('product_id', $guestItem->product_id)
                    ->first();

                if ($existing) {
                    $existing->increment('quantity', $guestItem->quantity);
                    $guestItem->delete();
                } else {
                    $guestItem->update([
                        'user_id' => $userId,
                        'session_id' => null,
                    ]);
                }
            }
        });
    }

    private function intendedDestination(User $user): string
    {
        $hasCart = CartItem::where('user_id', $user->id)->exists();

        return $hasCart ? '/checkout' : '/product-page';
    }
}
