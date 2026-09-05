<?php

namespace App\Http\Controllers;

use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AddressController extends Controller
{
    public function index()
    {
        return Inertia::render('addresses', [
            'addresses' => Address::where('user_id', Auth::id())
                ->orderByDesc('is_default')
                ->latest()
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateAddress($request);

        if ($validated['is_default'] ?? false) {
            Address::where('user_id', Auth::id())->update(['is_default' => false]);
        }

        if (Address::where('user_id', Auth::id())->count() === 0) {
            $validated['is_default'] = true;
        }

        $validated['user_id'] = Auth::id();
        Address::create($validated);

        return back();
    }

    public function update(Request $request, Address $address)
    {
        $this->authorizeAddress($address);

        $validated = $this->validateAddress($request);

        if ($validated['is_default'] ?? false) {
            Address::where('user_id', Auth::id())
                ->where('id', '!=', $address->id)
                ->update(['is_default' => false]);
        }

        $address->update($validated);

        return back();
    }

    public function destroy(Address $address)
    {
        $this->authorizeAddress($address);

        $wasDefault = $address->is_default;
        $address->delete();

        if ($wasDefault) {
            $next = Address::where('user_id', Auth::id())->latest()->first();
            if ($next) {
                $next->update(['is_default' => true]);
            }
        }

        return back();
    }

    public function setDefault(Address $address)
    {
        $this->authorizeAddress($address);

        Address::where('user_id', Auth::id())->update(['is_default' => false]);
        $address->update(['is_default' => true]);

        return back();
    }

    private function validateAddress(Request $request): array
    {
        return $request->validate([
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
            'is_default' => 'nullable|boolean',
        ]);
    }

    private function authorizeAddress(Address $address): void
    {
        if ($address->user_id !== Auth::id()) {
            abort(403);
        }
    }
}
