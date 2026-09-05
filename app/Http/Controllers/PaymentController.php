<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
   public function initialize(string $reference)
{
    $order = Order::with(['items.product', 'user'])
        ->where('reference', $reference)
        ->firstOrFail();

    if ($order->user_id !== Auth::id()) {
        abort(403);
    }

    if ($order->status === 'paid') {
        return redirect("/order/{$order->reference}");
    }

    if ($order->status !== 'pending') {
        throw ValidationException::withMessages([
            'order' => 'This order can no longer be paid for.',
        ]);
    }

    foreach ($order->items as $item) {
        if (! $item->product || $item->quantity > $item->product->stock) {
            $name = $item->product->name ?? 'An item';
            throw ValidationException::withMessages([
                'order' => "{$name} is no longer available in the quantity ordered. Please cancel and reorder.",
            ]);
        }
    }

    $order->payment_reference = 'PSK-' . $order->reference . '-' . uniqid();
    $order->payment_attempts = $order->payment_attempts + 1;
    $order->save();

    $response = Http::withToken(config('paystack.secret_key'))
        ->post(config('paystack.payment_url') . '/transaction/initialize', [
            'email' => $order->user->email,
            'amount' => (int) round($order->total_amount * 100),
            'reference' => $order->payment_reference,
            'callback_url' => url('/payment/callback'),
            'metadata' => [
                'order_reference' => $order->reference,
                'user_id' => $order->user_id,
            ],
        ]);

    if (! $response->successful() || ! ($response['status'] ?? false)) {
        Log::error('Paystack init failed', [
            'order' => $order->reference,
            'response' => $response->body(),
        ]);

        throw ValidationException::withMessages([
            'order' => 'Could not start payment. Please try again in a moment.',
        ]);
    }

    return redirect()->away($response['data']['authorization_url']);
}
    public function callback(Request $request)
    {
        $reference = $request->query('reference');

        if (! $reference) {
            return redirect('/account/orders');
        }

        $order = Order::where('payment_reference', $reference)->first();

        if (! $order) {
            return redirect('/account/orders');
        }

        $this->verifyAndFulfil($order);

        return redirect("/order/{$order->reference}");
    }

    public function webhook(Request $request)
    {
        $signature = $request->header('x-paystack-signature');

        $expected = hash_hmac(
            'sha512',
            $request->getContent(),
            config('paystack.secret_key')
        );

        if (! $signature || ! hash_equals($expected, $signature)) {
            Log::warning('Paystack webhook: bad signature');
            return response('', 401);
        }

        $payload = $request->all();

        if (($payload['event'] ?? null) !== 'charge.success') {
            return response('', 200);
        }

        $reference = $payload['data']['reference'] ?? null;
        $order = Order::where('payment_reference', $reference)->first();

        if ($order) {
            $this->verifyAndFulfil($order);
        }

        return response('', 200);
    }

private function verifyAndFulfil(Order $order): bool
{
    if ($order->status === 'paid') {
        return true;
    }

    $response = Http::withToken(config('paystack.secret_key'))
        ->get(config('paystack.payment_url') . '/transaction/verify/' . $order->payment_reference);

    if (! $response->successful() || ! ($response['status'] ?? false)) {
        Log::error('Paystack verify failed', [
            'order' => $order->reference,
            'response' => $response->body(),
        ]);
        return false;
    }

    $data = $response['data'];

    if (($data['status'] ?? null) !== 'success') {
        return false;
    }

    $expectedKobo = (int) round($order->total_amount * 100);

    if ((int) ($data['amount'] ?? 0) !== $expectedKobo) {
        Log::critical('Paystack amount mismatch', [
            'order' => $order->reference,
            'expected' => $expectedKobo,
            'received' => $data['amount'] ?? null,
        ]);
        return false;
    }

    DB::transaction(function () use ($order) {
        $fresh = Order::where('id', $order->id)->lockForUpdate()->first();

        if ($fresh->status === 'paid') {
            return;
        }

        if (! $fresh->stock_deducted) {
            foreach ($fresh->items as $item) {
                Product::where('id', $item->product_id)
                    ->decrement('stock', $item->quantity);
            }
            $fresh->stock_deducted = true;
        }

        $fresh->status = 'paid';
        $fresh->paid_at = now();
        $fresh->save();

        $fresh->recordStatus('paid', 'Payment confirmed via Paystack');
    });

    return true;
}
}
