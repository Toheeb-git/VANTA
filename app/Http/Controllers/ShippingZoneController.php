<?php

namespace App\Http\Controllers;

use App\Models\ShippingZone;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ShippingZoneController extends Controller
{
    public function index()
    {
        return Inertia::render('shippingZones', [
            'zones' => ShippingZone::orderByDesc('priority')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateZone($request);

        if ($validated['is_fallback'] ?? false) {
            ShippingZone::where('is_fallback', true)->update(['is_fallback' => false]);
        }

        ShippingZone::create($validated);

        return back();
    }

    public function update(Request $request, ShippingZone $shippingZone)
    {
        $validated = $this->validateZone($request);

        if ($validated['is_fallback'] ?? false) {
            ShippingZone::where('is_fallback', true)
                ->where('id', '!=', $shippingZone->id)
                ->update(['is_fallback' => false]);
        }

        $shippingZone->update($validated);

        return back();
    }

    public function destroy(ShippingZone $shippingZone)
    {
        $shippingZone->delete();

        return back();
    }

    private function validateZone(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:100',
            'country' => 'nullable|string|max:100',
            'states' => 'nullable|array',
            'states.*' => 'string|max:100',
            'fee' => 'required|numeric|min:0',
            'is_fallback' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'priority' => 'nullable|integer|min:0|max:1000',
        ]);
    }
}
