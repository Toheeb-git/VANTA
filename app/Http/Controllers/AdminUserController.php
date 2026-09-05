<?php

namespace App\Http\Controllers;

use App\Models\DeletionFeedback;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::withTrashed()
            ->withCount([
                'orders as completed_orders' => fn ($q) =>
                    $q->whereNotIn('status', ['pending', 'cancelled']),
            ])
            ->withSum([
                'orders as total_spent' => fn ($q) =>
                    $q->whereIn('status', ['paid', 'confirmed', 'processing', 'shipped', 'delivered']),
            ], 'total_amount');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        match ($request->input('status', 'all')) {
            'active' => $query->whereNull('deleted_at')->whereNull('suspended_at'),
            'suspended' => $query->whereNotNull('suspended_at'),
            'pending_deletion' => $query->whereNotNull('deleted_at')->whereNull('anonymised_at'),
            'anonymised' => $query->whereNotNull('anonymised_at'),
            'admins' => $query->where('role', 'admin'),
            default => $query,
        };

        $users = $query->latest()->paginate(15)->withQueryString();

        $counts = [
            'all' => User::withTrashed()->count(),
            'active' => User::whereNull('suspended_at')->count(),
            'suspended' => User::withTrashed()->whereNotNull('suspended_at')->count(),
            'pending_deletion' => User::onlyTrashed()->whereNull('anonymised_at')->count(),
            'anonymised' => User::withTrashed()->whereNotNull('anonymised_at')->count(),
            'admins' => User::where('role', 'admin')->count(),
        ];

        $feedback = DeletionFeedback::selectRaw('reason, COUNT(*) as total')
            ->groupBy('reason')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($f) => [
                'reason' => DeletionFeedback::REASONS[$f->reason] ?? $f->reason,
                'total' => $f->total,
            ]);

        $recentComments = DeletionFeedback::whereNotNull('comment')
            ->latest()
            ->limit(20)
            ->get(['id', 'reason', 'comment', 'created_at'])
            ->map(fn ($f) => [
                'id' => $f->id,
                'reason' => DeletionFeedback::REASONS[$f->reason] ?? $f->reason,
                'comment' => $f->comment,
                'created_at' => $f->created_at,
            ]);

        return Inertia::render('adminUsers', [
            'users' => $users,
            'filters' => $request->only(['search', 'status']),
            'counts' => $counts,
            'feedback' => $feedback,
            'recentComments' => $recentComments,
            'appUrl' => config('app.url'),
        ]);
    }

    public function show(int $id)
    {
        $user = User::withTrashed()->findOrFail($id);

        $orders = Order::with('items.product:id,name')
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        $stats = [
            'orders' => $orders->whereNotIn('status', ['pending', 'cancelled'])->count(),
            'spent' => $orders->whereIn('status', ['paid', 'confirmed', 'processing', 'shipped', 'delivered'])
                ->sum('total_amount'),
            'cancelled' => $orders->where('status', 'cancelled')->count(),
            'reviews' => $user->reviews()->count(),
        ];

        return Inertia::render('adminUserDetail', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'profile_picture' => $user->profile_picture,
                'avatar_url' => $user->avatar_url,
                'role' => $user->role,
                'email_verified_at' => $user->email_verified_at,
                'google_linked' => ! is_null($user->google_id),
                'created_at' => $user->created_at,
                'last_login_at' => $user->last_login_at,
                'suspended_at' => $user->suspended_at,
                'suspension_reason' => $user->suspension_reason,
                'deleted_at' => $user->deleted_at,
                'anonymised_at' => $user->anonymised_at,
                'deletion_deadline' => $user->deletionDeadline(),
            ],
            'orders' => $orders,
            'stats' => $stats,
            'appUrl' => config('app.url'),
        ]);
    }

    public function suspend(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        $this->guardSelfOrAdmin($user);

        $validated = $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        $user->forceFill([
            'suspended_at' => now(),
            'suspension_reason' => $validated['reason'],
        ])->save();

        return back();
    }

    public function unsuspend(int $id)
    {
        $user = User::findOrFail($id);

        $user->forceFill([
            'suspended_at' => null,
            'suspension_reason' => null,
        ])->save();

        return back();
    }

    /**
     * Admins cannot suspend themselves or other admins.
     */
    private function guardSelfOrAdmin(User $user): void
    {
        if ($user->id === Auth::id()) {
            throw ValidationException::withMessages([
                'reason' => 'You cannot suspend your own account.',
            ]);
        }

        if ($user->role === 'admin') {
            throw ValidationException::withMessages([
                'reason' => 'Admin accounts cannot be suspended from here.',
            ]);
        }
    }
}
