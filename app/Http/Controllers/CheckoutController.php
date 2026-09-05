<?php

namespace App\Http\Controllers;

use App\Models\Address;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ShippingZone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class CheckoutController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        if (! $user->hasVerifiedEmail()) {
            return redirect()->route('verification.notice');
        }

        if (! $user->phone) {
            return redirect('/account/settings')->with(
                'status',
                'Please add a phone number before checking out — we need it for delivery.',
            );
        }

        $items = CartItem::with('product')
            ->where('user_id', Auth::id())
            ->get();

        if ($items->isEmpty()) {
            return redirect('/product-page');
        }

        $addresses = Address::where('user_id', Auth::id())
            ->orderByDesc('is_default')
            ->latest()
            ->get();

        $subtotal = $items->sum(
            fn($item) => $item->quantity * $item->product->effective_price
        );

        $default = $addresses->firstWhere('is_default', true) ?? $addresses->first();

        $shippingFee = $default
            ? ShippingZone::feeFor($default->country, $default->state)
            : 0;

        return Inertia::render('checkout', [
            'items' => $items,
            'addresses' => $addresses,
            'subtotal' => $subtotal,
            'shippingFee' => $shippingFee,
            'selectedAddressId' => $default?->id,
            'appUrl' => config('app.url'),
        ]);
    }

    public function shippingFee(Request $request)
    {
        $validated = $request->validate([
            'address_id' => 'required|exists:addresses,id',
        ]);

        $address = Address::findOrFail($validated['address_id']);

        if ($address->user_id !== Auth::id()) {
            abort(403);
        }

        return response()->json([
            'shippingFee' => ShippingZone::feeFor($address->country, $address->state),
        ]);
    }

    public function store(Request $request)
    {
        if (! Auth::user()->hasVerifiedEmail()) {
            throw ValidationException::withMessages([
                'cart' => 'Please verify your email address before placing an order.',
            ]);
        }
        $validated = $request->validate([
            'address_id' => 'required|exists:addresses,id',
        ]);

        $address = Address::findOrFail($validated['address_id']);

        if ($address->user_id !== Auth::id()) {
            abort(403);
        }

        $items = CartItem::with('product')
            ->where('user_id', Auth::id())
            ->get();

        if ($items->isEmpty()) {
            throw ValidationException::withMessages([
                'cart' => 'Your cart is empty.',
            ]);
        }

        foreach ($items as $item) {
            if (! $item->product) {
                throw ValidationException::withMessages([
                    'cart' => 'A product in your cart is no longer available.',
                ]);
            }

            if ($item->quantity > $item->product->stock) {
                throw ValidationException::withMessages([
                    'cart' => "Only {$item->product->stock} left of \"{$item->product->name}\". Please update your cart.",
                ]);
            }
        }

        $subtotal = $items->sum(
            fn($item) => $item->quantity * $item->product->effective_price
        );

        $shippingFee = ShippingZone::feeFor($address->country, $address->state);
        $total = $subtotal + $shippingFee;

        $order = DB::transaction(function () use ($items, $address, $subtotal, $shippingFee, $total) {
            $order = Order::create([
                'user_id' => Auth::id(),
                'subtotal' => $subtotal,
                'shipping_fee' => $shippingFee,
                'total_amount' => $total,
                'status' => 'pending',
                'ship_full_name' => $address->full_name,
                'ship_phone' => $address->phone,
                'ship_country' => $address->country,
                'ship_state' => $address->state,
                'ship_city' => $address->city,
                'ship_street' => $address->street,
                'ship_apartment' => $address->apartment,
                'ship_postal_code' => $address->postal_code,
                'ship_instructions' => $address->delivery_instructions,
            ]);

            foreach ($items as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item->product_id,
                    'quantity' => $item->quantity,
                    'price' => $item->product->effective_price,
                ]);
            }

            $order->recordStatus('pending', 'Order placed', Auth::id());

            CartItem::where('user_id', Auth::id())->delete();

            return $order;
        });

        return redirect("/order/{$order->reference}");
    }
    public function show(string $reference)
    {
        $order = Order::with(['items.product', 'statusHistory'])
            ->where('reference', $reference)
            ->firstOrFail();

        if ($order->user_id !== Auth::id() && Auth::user()->role !== 'admin') {
            abort(403);
        }

        $duplicate = null;

        if ($order->status === 'pending') {
            $duplicate = Order::where('user_id', $order->user_id)
                ->where('id', '!=', $order->id)
                ->where('status', 'pending')
                ->where('total_amount', $order->total_amount)
                ->latest()
                ->first();
        }

        return Inertia::render('orderConfirmation', [
            'order' => $order,
            'addresses' => Address::where('user_id', $order->user_id)
                ->orderByDesc('is_default')
                ->get(),
            'duplicateOrder' => $duplicate ? [
                'reference' => $duplicate->reference,
                'created_at' => $duplicate->created_at,
                'total_amount' => $duplicate->total_amount,
            ] : null,
            'appUrl' => config('app.url'),
        ]);
    }
    public function cancel(string $reference)
    {
        $order = Order::with('items')
            ->where('reference', $reference)
            ->firstOrFail();

        if ($order->user_id !== Auth::id()) {
            abort(403);
        }

        if ($order->status !== 'pending') {
            throw ValidationException::withMessages([
                'order' => 'This order can no longer be cancelled.',
            ]);
        }

        DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                CartItem::updateOrCreate(
                    [
                        'user_id' => Auth::id(),
                        'product_id' => $item->product_id,
                    ],
                    [
                        'quantity' => $item->quantity,
                    ],
                );
            }

            $order->update(['status' => 'cancelled']);
            $order->recordStatus('cancelled', 'Cancelled by customer', Auth::id());
        });

        return redirect('/checkout');
    }
    public function updateAddress(Request $request, string $reference)
    {
        $order = Order::where('reference', $reference)->firstOrFail();

        if ($order->user_id !== Auth::id()) {
            abort(403);
        }

        if ($order->status !== 'pending') {
            throw ValidationException::withMessages([
                'order' => 'This order can no longer be modified.',
            ]);
        }

        $validated = $request->validate([
            'address_id' => 'required|exists:addresses,id',
        ]);

        $address = Address::findOrFail($validated['address_id']);

        if ($address->user_id !== Auth::id()) {
            abort(403);
        }

        $shippingFee = ShippingZone::feeFor($address->country, $address->state);

        $order->update([
            'shipping_fee' => $shippingFee,
            'total_amount' => (float) $order->subtotal + $shippingFee,
            'ship_full_name' => $address->full_name,
            'ship_phone' => $address->phone,
            'ship_country' => $address->country,
            'ship_state' => $address->state,
            'ship_city' => $address->city,
            'ship_street' => $address->street,
            'ship_apartment' => $address->apartment,
            'ship_postal_code' => $address->postal_code,
            'ship_instructions' => $address->delivery_instructions,
        ]);

        return back();
    }

    public function storeAddressForOrder(Request $request, string $reference)
    {
        $order = Order::where('reference', $reference)->firstOrFail();

        if ($order->user_id !== Auth::id()) {
            abort(403);
        }

        if ($order->status !== 'pending') {
            throw ValidationException::withMessages([
                'order' => 'This order can no longer be modified.',
            ]);
        }

        $validated = $request->validate([
            'label' => 'nullable|string|max:50',
            'full_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'country' => 'required|string|max:100',
            'state' => 'required|string|max:100',
            'city' => 'required|string|max:100',
            'street' => 'required|string|max:255',
            'apartment' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'delivery_instructions' => 'nullable|string|max:500',
            'save_as_default' => 'nullable|boolean',
        ]);

        $saveAsDefault = $validated['save_as_default'] ?? false;
        unset($validated['save_as_default']);

        $address = DB::transaction(function () use ($validated, $saveAsDefault) {
            if ($saveAsDefault) {
                Address::where('user_id', Auth::id())->update(['is_default' => false]);
            }

            return Address::create([
                ...$validated,
                'user_id' => Auth::id(),
                'is_default' => $saveAsDefault,
            ]);
        });

        $shippingFee = ShippingZone::feeFor($address->country, $address->state);

        $order->update([
            'shipping_fee' => $shippingFee,
            'total_amount' => (float) $order->subtotal + $shippingFee,
            'ship_full_name' => $address->full_name,
            'ship_phone' => $address->phone,
            'ship_country' => $address->country,
            'ship_state' => $address->state,
            'ship_city' => $address->city,
            'ship_street' => $address->street,
            'ship_apartment' => $address->apartment,
            'ship_postal_code' => $address->postal_code,
            'ship_instructions' => $address->delivery_instructions,
        ]);

        return back();
    }
    public function confirmDelivery(string $reference)
    {
        $order = Order::where('reference', $reference)->firstOrFail();

        if ($order->user_id !== Auth::id()) {
            abort(403);
        }

        if ($order->status !== 'shipped') {
            throw ValidationException::withMessages([
                'order' => 'This order is not marked as shipped yet.',
            ]);
        }

        DB::transaction(function () use ($order) {
            $order->update(['status' => 'delivered']);
            $order->recordStatus('delivered', 'Receipt confirmed by customer', Auth::id());
        });

        return back();
    }
}
