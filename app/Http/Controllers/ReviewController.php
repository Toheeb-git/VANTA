<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class ReviewController extends Controller
{
    public function store(Request $request, Product $product)
    {
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'title' => 'nullable|string|max:120',
            'body' => 'nullable|string|max:2000',
        ]);

        $qualifyingOrder = $this->qualifyingOrder($product->id);

        if (! $qualifyingOrder) {
            throw ValidationException::withMessages([
                'rating' => 'You can only review products you have received.',
            ]);
        }

        $existing = Review::where('user_id', Auth::id())
            ->where('product_id', $product->id)
            ->first();

        if ($existing) {
            throw ValidationException::withMessages([
                'rating' => 'You have already reviewed this product. Edit your review instead.',
            ]);
        }

        Review::create([
            'user_id' => Auth::id(),
            'product_id' => $product->id,
            'order_id' => $qualifyingOrder->id,
            'rating' => $validated['rating'],
            'title' => $validated['title'] ?: null,
            'body' => $validated['body'] ?: null,
        ]);

        return back();
    }

    public function update(Request $request, Review $review)
    {
        if ($review->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'title' => 'nullable|string|max:120',
            'body' => 'nullable|string|max:2000',
        ]);

        $review->update([
            'rating' => $validated['rating'],
            'title' => $validated['title'] ?: null,
            'body' => $validated['body'] ?: null,
        ]);

        return back();
    }

    public function destroy(Review $review)
    {
        if ($review->user_id !== Auth::id()) {
            abort(403);
        }

        $review->delete();

        return back();
    }

    /**
     * The delivered order that entitles this user to review the product.
     */
    private function qualifyingOrder(int $productId): ?Order
    {
        $item = OrderItem::where('product_id', $productId)
            ->whereHas('order', function ($q) {
                $q->where('user_id', Auth::id())
                    ->where('status', 'delivered');
            })
            ->with('order')
            ->latest()
            ->first();

        return $item?->order;
    }
}
