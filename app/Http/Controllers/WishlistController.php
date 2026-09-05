<?php

namespace App\Http\Controllers;

use App\Models\CartItem;
use App\Models\Product;
use App\Models\WishlistItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class WishlistController extends Controller
{
    public function index()
    {
        $items = WishlistItem::with('product')
            ->where('user_id', Auth::id())
            ->get()
            ->filter(fn ($item) => $item->product !== null)
            ->values();

        return Inertia::render('wishlist', [
            'items' => $items,
            'appUrl' => config('app.url'),
        ]);
    }

    public function toggle(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        $existing = WishlistItem::where('user_id', Auth::id())
            ->where('product_id', $validated['product_id'])
            ->first();

        if ($existing) {
            $existing->delete();
            $saved = false;
        } else {
            WishlistItem::create([
                'user_id' => Auth::id(),
                'product_id' => $validated['product_id'],
            ]);
            $saved = true;
        }

        return response()->json([
            'saved' => $saved,
            'count' => WishlistItem::where('user_id', Auth::id())->count(),
        ]);
    }

    public function ids()
    {
        return response()->json([
            'ids' => WishlistItem::where('user_id', Auth::id())
                ->pluck('product_id'),
            'count' => WishlistItem::where('user_id', Auth::id())->count(),
        ]);
    }

    public function destroy(WishlistItem $wishlistItem)
    {
        if ($wishlistItem->user_id !== Auth::id()) {
            abort(403);
        }

        $wishlistItem->delete();

        return back();
    }

    public function moveToCart(WishlistItem $wishlistItem)
    {
        if ($wishlistItem->user_id !== Auth::id()) {
            abort(403);
        }

        $product = $wishlistItem->product;

        if (! $product) {
            $wishlistItem->delete();

            throw ValidationException::withMessages([
                'wishlist' => 'That product is no longer available.',
            ]);
        }

        if ($product->stock < 1) {
            throw ValidationException::withMessages([
                'wishlist' => "{$product->name} is out of stock right now.",
            ]);
        }

        DB::transaction(function () use ($wishlistItem, $product) {
            $cartItem = CartItem::where('user_id', Auth::id())
                ->where('product_id', $product->id)
                ->first();

            if ($cartItem) {
                if ($cartItem->quantity < $product->stock) {
                    $cartItem->increment('quantity');
                }
            } else {
                CartItem::create([
                    'user_id' => Auth::id(),
                    'product_id' => $product->id,
                    'quantity' => 1,
                ]);
            }

            $wishlistItem->delete();
        });

        return back();
    }

    public function clear()
    {
        WishlistItem::where('user_id', Auth::id())->delete();

        return back();
    }
}
