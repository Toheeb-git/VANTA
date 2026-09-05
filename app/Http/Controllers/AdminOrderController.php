<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AdminOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with('user')->latest();

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                    ->orWhere('ship_full_name', 'like', "%{$search}%")
                    ->orWhere('ship_phone', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($u) use ($search) {
                        $u->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        return Inertia::render('adminOrders', [
            'orders' => $query->paginate(15)->withQueryString(),
            'filters' => $request->only(['status', 'search']),
            'counts' => [
                'all' => Order::count(),
                'pending' => Order::where('status', 'pending')->count(),
                'paid' => Order::where('status', 'paid')->count(),
                'confirmed' => Order::where('status', 'confirmed')->count(),
                'processing' => Order::where('status', 'processing')->count(),
                'shipped' => Order::where('status', 'shipped')->count(),
                'delivered' => Order::where('status', 'delivered')->count(),
                'cancelled' => Order::where('status', 'cancelled')->count(),
            ],
            'revenue' => Order::whereIn('status', ['paid', 'confirmed', 'processing', 'shipped', 'delivered'])
                ->sum('total_amount'),
        ]);
    }

    public function show(string $reference)
    {
        $order = Order::with([
            'items.product',
            'user',
            'statusHistory.changedBy',
        ])->where('reference', $reference)->firstOrFail();

        return Inertia::render('adminOrderDetail', [
            'order' => $order,
            'appUrl' => config('app.url'),
            'nextStatus' => $this->nextStatusFor($order),
        ]);
    }

    public function updateStatus(Request $request, string $reference)
    {
        $order = Order::where('reference', $reference)->firstOrFail();

        $validated = $request->validate([
            'status' => 'required|string|in:' . implode(',', Order::STATUSES),
            'note' => 'nullable|string|max:500',
        ]);

        if (! $order->canAdvanceTo($validated['status'])) {
            throw ValidationException::withMessages([
                'status' => "Cannot move this order from {$order->status} to {$validated['status']}.",
            ]);
        }
        DB::transaction(function () use ($order, $validated) {
            $previous = $order->status;
            $order->update(['status' => $validated['status']]);
            $order->recordStatus(
                $validated['status'],
                $validated['note'] ?: null,
                Auth::id(),
                $previous,
            );
        });

        return back();
    }

    private function nextStatusFor(Order $order): ?string
    {
        $index = array_search($order->status, Order::FULFILMENT_FLOW, true);

        if ($index === false || $index === count(Order::FULFILMENT_FLOW) - 1) {
            return null;
        }

        return Order::FULFILMENT_FLOW[$index + 1];
    }
}
