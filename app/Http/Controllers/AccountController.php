<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\User;
use App\Notifications\EmailChangeAlert;
use App\Notifications\EmailChangeCode;
use App\Notifications\PasswordChanged;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use App\Models\Address;
use Inertia\Inertia;
use App\Models\Review;
use App\Notifications\AccountDeletionScheduled;
use App\Models\DeletionFeedback;

class AccountController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Profile — name, phone, photo
    |--------------------------------------------------------------------------
    */

    public function profile()
    {
        $user = Auth::user();

        $orders = Order::where('user_id', $user->id);

        return Inertia::render('profile', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'profile_picture' => $user->profile_picture,
                'email_verified_at' => $user->email_verified_at,
                'created_at' => $user->created_at,
            ],
            'appUrl' => config('app.url'),
            'stats' => [
                'totalOrders' => (clone $orders)->whereNot('status', 'cancelled')->count(),
                'delivered' => (clone $orders)->where('status', 'delivered')->count(),
                'inProgress' => (clone $orders)
                    ->whereIn('status', ['paid', 'confirmed', 'processing', 'shipped'])
                    ->count(),
                'totalSpent' => (clone $orders)
                    ->whereIn('status', ['paid', 'confirmed', 'processing', 'shipped', 'delivered'])
                    ->sum('total_amount'),
                'addresses' => Address::where('user_id', $user->id)->count(),
            ],
        ]);
    }
    public function updateProfile(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'profile_picture' => 'nullable|file|mimes:jpg,jpeg,png,webp,avif|max:2048',
        ]);

        if ($request->hasFile('profile_picture')) {
            if ($user->profile_picture && Storage::disk('public')->exists($user->profile_picture)) {
                Storage::disk('public')->delete($user->profile_picture);
            }

            $validated['profile_picture'] = $request->file('profile_picture')
                ->store('profile-pictures', 'public');
        } else {
            unset($validated['profile_picture']);
        }

        $user->update($validated);

        return back();
    }

    /*
    |--------------------------------------------------------------------------
    | Settings — email and password
    |--------------------------------------------------------------------------
    */

    public function settings()
    {
        $user = Auth::user();

        $activeOrders = Order::where('user_id', $user->id)
            ->whereIn('status', ['pending', 'paid', 'confirmed', 'processing', 'shipped'])
            ->count();

        return Inertia::render('settings', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'profile_picture' => $user->profile_picture,
                'avatar_url' => $user->avatar_url,
                'email_verified_at' => $user->email_verified_at,
                'has_password' => $user->hasPassword(),
                'google_linked' => $user->isGoogleLinked(),
            ],
            'appUrl' => config('app.url'),
            'emailChange' => $user->emailChangeIsPending() ? [
                'pending_email' => $user->pending_email,
                'expires_at' => $user->email_change_expires_at->toIso8601String(),
            ] : null,
            'deletionReasons' => DeletionFeedback::REASONS,
            'activeOrders' => $activeOrders,
        ]);
    }

    public function setPassword(Request $request)
    {
        $user = Auth::user();

        if ($user->hasPassword()) {
            throw ValidationException::withMessages([
                'password' => 'You already have a password. Use the change form instead.',
            ]);
        }

        $request->validate([
            'password' => 'required|min:8|confirmed',
        ]);

        $user->forceFill([
            'password' => Hash::make($request->password),
        ])->save();

        $user->notify(new PasswordChanged($user->name));

        return back();
    }

    public function updatePassword(Request $request)
    {
        $user = Auth::user();

        if (! $user->hasPassword()) {
            throw ValidationException::withMessages([
                'current_password' => 'Your account has no password yet. Set one instead.',
            ]);
        }

        $request->validate([
            'current_password' => 'required',
            'password' => 'required|min:8|confirmed',
        ]);

        if (! Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => 'The current password is incorrect.',
            ]);
        }

        $user->update(['password' => Hash::make($request->password)]);

        $user->notify(new PasswordChanged($user->name));

        return back();
    }

    /*
    |--------------------------------------------------------------------------
    | Email change flow
    |--------------------------------------------------------------------------
    */

    public function requestEmailChange(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'new_email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email'),
                Rule::notIn([$user->email]),
            ],
            'password' => 'required',
        ], [
            'new_email.not_in' => 'That is already your email address.',
            'new_email.unique' => 'That email is already registered to another account.',
        ]);

        if (! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'password' => 'That password is incorrect.',
            ]);
        }

        $oldEmail = $user->email;
        $code = $user->startEmailChange($validated['new_email']);

        Notification::route('mail', $validated['new_email'])
            ->notify(new EmailChangeCode($code, $user->name));

        Notification::route('mail', $oldEmail)
            ->notify(new EmailChangeAlert($validated['new_email'], $user->name));

        return back();
    }

    public function confirmEmailChange(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'code' => 'required|string|size:6',
        ]);

        if (! $user->emailChangeIsPending()) {
            $user->clearEmailChange();

            throw ValidationException::withMessages([
                'code' => 'That request expired. Start again to get a new code.',
            ]);
        }

        if ($user->email_change_attempts >= 5) {
            $user->clearEmailChange();

            throw ValidationException::withMessages([
                'code' => 'Too many incorrect attempts. Start again to get a new code.',
            ]);
        }

        if (! Hash::check($validated['code'], $user->email_change_code)) {
            $user->increment('email_change_attempts');
            $remaining = 5 - $user->fresh()->email_change_attempts;

            throw ValidationException::withMessages([
                'code' => $remaining > 0
                    ? "Incorrect code. {$remaining} attempt" . ($remaining === 1 ? '' : 's') . ' left.'
                    : 'Too many incorrect attempts. Start again to get a new code.',
            ]);
        }

        $user->update([
            'email' => $user->pending_email,
            'email_verified_at' => now(),
        ]);

        $user->clearEmailChange();

        return back();
    }

    public function resendEmailChangeCode()
    {
        $user = Auth::user();

        if (! $user->pending_email) {
            throw ValidationException::withMessages([
                'code' => 'No email change in progress.',
            ]);
        }

        $code = $user->startEmailChange($user->pending_email);

        Notification::route('mail', $user->pending_email)
            ->notify(new EmailChangeCode($code, $user->name));

        return back();
    }

    public function cancelEmailChange()
    {
        Auth::user()->clearEmailChange();

        return back();
    }

    /*
    |--------------------------------------------------------------------------
    | Email verification (signup)
    |--------------------------------------------------------------------------
    */

  public function verifyNotice(Request $request)
{
    if (Auth::user()->hasVerifiedEmail()) {
        return redirect('/product-page');
    }

    return Inertia::render('verifyEmail', [
        'email' => Auth::user()->email,
        'status' => $request->session()->get('status'),
    ]);
}

    public function verifyEmail(string $id, string $hash)
    {
        $user = User::findOrFail($id);

        if (! hash_equals($hash, sha1($user->getEmailForVerification()))) {
            abort(403, 'Invalid verification link.');
        }

        if ($user->hasVerifiedEmail()) {
            return redirect('/product-page')->with('status', 'Email already verified.');
        }

        $user->markEmailAsVerified();
        event(new Verified($user));

        return redirect('/product-page')->with('status', 'Email verified — thanks!');
    }

    public function resendVerification(Request $request)
    {
        if ($request->user()->hasVerifiedEmail()) {
            return back();
        }

        $request->user()->sendEmailVerificationNotification();

        return back()->with('status', 'verification-link-sent');
    }

    /*
    |--------------------------------------------------------------------------
    | Orders
    |--------------------------------------------------------------------------
    */

    public function orders()
    {
        $orders = Order::with('items.product:id,name,slug,image')
            ->where('user_id', Auth::id())
            ->latest()
            ->get();

        $reviewedIds = Review::where('user_id', Auth::id())
            ->pluck('product_id')
            ->all();

        $orders->each(function ($order) use ($reviewedIds) {
            $order->items->each(function ($item) use ($order, $reviewedIds) {
                $item->can_review =
                    $order->status === 'delivered' && $item->product !== null;
                $item->reviewed = in_array($item->product_id, $reviewedIds, true);
            });
        });

        return Inertia::render('orders', [
            'orders' => $orders,
            'appUrl' => config('app.url'),
        ]);
    }

    public function requestDeletion(Request $request)
    {
        $user = Auth::user();

        $activeOrders = Order::where('user_id', $user->id)
            ->whereIn('status', ['pending', 'paid', 'confirmed', 'processing', 'shipped'])
            ->count();

        if ($activeOrders > 0) {
            throw ValidationException::withMessages([
                'confirm' => "You have {$activeOrders} order" . ($activeOrders === 1 ? '' : 's')
                    . ' still in progress. Please wait until they are delivered or cancelled.',
            ]);
        }

        $request->validate([
            'reason' => ['nullable', Rule::in(array_keys(DeletionFeedback::REASONS))],
            'comment' => 'nullable|string|max:1000',
        ]);

        if ($user->hasPassword()) {
            $request->validate(['password' => 'required']);

            if (! Hash::check($request->password, $user->password)) {
                throw ValidationException::withMessages([
                    'password' => 'That password is incorrect.',
                ]);
            }
        } else {
            $request->validate(['confirm' => 'required']);

            if (strtoupper(trim($request->confirm)) !== 'DELETE') {
                throw ValidationException::withMessages([
                    'confirm' => 'Please type DELETE to confirm.',
                ]);
            }
        }

        // Optional, and stored with no link back to the person
        if ($request->filled('reason') && $request->reason !== 'not_say') {
            DeletionFeedback::create([
                'reason' => $request->reason,
                'comment' => $request->comment ?: null,
            ]);
        }

        $user->notify(new AccountDeletionScheduled($user->name, now()->addDays(30)));

        $user->delete();

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/')->with('status', 'Your account is scheduled for deletion.');
    }
    public function cancelDeletion(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::onlyTrashed()
            ->whereNull('anonymised_at')
            ->where('email', $request->email)
            ->first();

        if (! $user || ! $user->password || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => 'No account pending deletion matches those details.',
            ]);
        }

        $user->restore();
        Auth::login($user);
        $request->session()->regenerate();

        return redirect('/account/profile')->with('status', 'Welcome back — your account has been restored.');
    }
}
