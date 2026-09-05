<?php

namespace App\Http\Controllers;

use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CartController extends Controller
{
    private function ownerColumn(Request $request): array
    {
        if (Auth::check()) {
            return ['user_id', Auth::id()];
        }

        return ['session_id', $request->session()->getId()];
    }

    public function index(Request $request)
    {
        [$column, $value] = $this->ownerColumn($request);

        $items = CartItem::with('product')->where($column, $value)->get();

        return response()->json([
            'items' => $items,
            'total' => $items->sum(fn ($item) => $item->quantity * $item->product->effective_price),
            'count' => $items->sum('quantity'),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'nullable|integer|min:1',
        ]);

        $product = Product::findOrFail($validated['product_id']);
        $quantity = $validated['quantity'] ?? 1;

        [$column, $value] = $this->ownerColumn($request);

        $existing = CartItem::where($column, $value)
            ->where('product_id', $product->id)
            ->first();

        $currentQty = $existing ? $existing->quantity : 0;

        if ($currentQty + $quantity > $product->stock) {
            return response()->json(['message' => 'Not enough stock available.'], 422);
        }

        if ($existing) {
            $existing->increment('quantity', $quantity);
        } else {
            CartItem::create([
                $column => $value,
                'product_id' => $product->id,
                'quantity' => $quantity,
            ]);
        }

        return $this->index($request);
    }

    public function update(Request $request, CartItem $cartItem)
    {
        [$column, $value] = $this->ownerColumn($request);

        if ($cartItem->{$column} !== $value) {
            abort(403);
        }

        $validated = $request->validate(['quantity' => 'required|integer|min:1']);

        if ($validated['quantity'] > $cartItem->product->stock) {
            return response()->json(['message' => 'Not enough stock available.'], 422);
        }

        $cartItem->update(['quantity' => $validated['quantity']]);

        return $this->index($request);
    }

    public function destroy(Request $request, CartItem $cartItem)
    {
        [$column, $value] = $this->ownerColumn($request);

        if ($cartItem->{$column} !== $value) {
            abort(403);
        }

        $cartItem->delete();

        return $this->index($request);
    }
}
