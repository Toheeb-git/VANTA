<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Storage;
use App\Models\CartItem;
use Illuminate\Auth\Events\Registered;
use App\Models\OrderItem;
use App\Models\WishlistItem;
use App\Models\Review;
use App\Models\Subscriber;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class webcontroller extends Controller
{
    public function index()
    {
        $products = Product::where('is_active', true)
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->latest()
            ->limit(8)
            ->get();

        return Inertia::render('FirstPage', [
            'products' => $products,
            'appUrl' => config('app.url'),
        ]);
    }

    public function login()
    {
        return Inertia::render('login');
    }

    public function register()
    {
        return Inertia::render('Register');
    }

    public function verify()
    {
        return Inertia::render('verifyEmail');
    }

    public function forgetPassword()
    {
        return Inertia::render('forgetPassword');
    }

    public function sendResetLink(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $status = Password::sendResetLink($request->only('email'));

        if ($status == Password::RESET_LINK_SENT) {
            return back()->with('status', __($status));
        }

        throw ValidationException::withMessages([
            'email' => [trans($status)],
        ]);
    }

    public function create(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|min:4',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|max:20',
            'password' => 'required|min:8|confirmed',
        ]);

        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);

        event(new Registered($user));

        return redirect()->route('login')->with('status', 'Account created — verify your email.');
    }

    public function store(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // Capture the guest session ID BEFORE anything regenerates it
        $guestSessionId = $request->session()->getId();

        /*
    |----------------------------------------------------------------
    | Account pending deletion — offer restoration instead of failing
    |----------------------------------------------------------------
    | SoftDeletes hides these from Auth::attempt(), so without this
    | branch a returning user is told their password is wrong.
    */
        $trashed = User::onlyTrashed()
            ->whereNull('anonymised_at')
            ->where('email', $credentials['email'])
            ->first();

        if ($trashed) {
            if (! $trashed->password || ! Hash::check($credentials['password'], $trashed->password)) {
                throw ValidationException::withMessages([
                    'email' => 'These credentials do not match our records.',
                ]);
            }

            $trashed->restore();

            $trashed->forceFill([
                'suspended_at' => null,
                'suspension_reason' => null,
                'last_login_at' => now(),
            ])->save();

            Auth::login($trashed, $request->boolean('remember'));
            $request->session()->regenerate();

            $this->mergeGuestCart($guestSessionId, $trashed->id);

            return redirect('/account/profile')->with(
                'status',
                'Welcome back — your account has been restored.',
            );
        }

        /*
    |----------------------------------------------------------------
    | Normal login
    |----------------------------------------------------------------
    */
        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => 'These credentials do not match our records.',
            ]);
        }

        $user = Auth::user();

        // Suspended users are stopped here rather than after a session exists
        if ($user->isSuspended()) {
            $reason = $user->suspension_reason;

            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            throw ValidationException::withMessages([
                'email' => $reason
                    ? "Your account has been suspended: {$reason}"
                    : 'Your account has been suspended. Please contact support.',
            ]);
        }

        $request->session()->regenerate();

        $user->forceFill(['last_login_at' => now()])->save();

        $hadGuestCart = $this->mergeGuestCart($guestSessionId, $user->id);

        // Explicit redirect target wins
        if ($request->filled('redirect')) {
            return redirect($request->input('redirect'));
        }

        if ($user->role === 'admin') {
            return redirect('/product-dashboard');
        }

        // A guest who was mid-shop goes straight to checkout
        return redirect($hadGuestCart ? '/checkout' : '/product-page');
    }

    /**
     * Move any guest cart items onto the account. Returns true if there were any.
     */
    private function mergeGuestCart(?string $sessionId, int $userId): bool
    {
        if (! $sessionId) {
            return false;
        }

        $guestItems = CartItem::where('session_id', $sessionId)
            ->whereNull('user_id')
            ->get();

        if ($guestItems->isEmpty()) {
            return false;
        }

        DB::transaction(function () use ($guestItems, $userId) {
            foreach ($guestItems as $guestItem) {
                $existing = CartItem::where('user_id', $userId)
                    ->where('product_id', $guestItem->product_id)
                    ->first();

                if ($existing) {
                    $existing->increment('quantity', $guestItem->quantity);
                    $guestItem->delete();
                } else {
                    $guestItem->update([
                        'user_id' => $userId,
                        'session_id' => null,
                    ]);
                }
            }
        });

        return true;
    }
    public function ResetPassword(string $token)
    {
        return Inertia::render('ResetPassword', [
            'token' => $token,
            'email' => request('email'),
        ]);
    }

    public function resetPasswordStore(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user) use ($request) {
                $user->forceFill([
                    'password' => Hash::make($request->password),
                ])->save();
            }
        );

        if ($status == Password::PASSWORD_RESET) {
            return redirect()->route('login')->with('status', __($status));
        }

        throw ValidationException::withMessages([
            'email' => [trans($status)],
        ]);
    }
    public function dashboard()
    {
        $products = Product::latest('created_at')->get();

        return Inertia::render('productDashboard', [
            'products' => $products,
            'appUrl' => config('app.url'),
            'stats' => [
                'totalProducts' => $products->count(),
                'totalStock' => $products->sum('stock'),
                'outOfStock' => $products->where('stock', '<=', 0)->count(),
                'inventoryValue' => $products->sum(fn($p) => $p->price * $p->stock),
            ],
        ]);
    }

    public function productPage(Request $request)
    {
        $query = Product::query()
            ->withAvg('reviews', 'rating')
            ->withCount('reviews');

        // Search
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%");
            });
        }

        // Category
        if ($request->filled('category') && $request->input('category') !== 'all') {
            $query->where('category', $request->input('category'));
        }

        // Price range
        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->input('min_price'));
        }

        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->input('max_price'));
        }

        // Availability
        if ($request->filled('availability') && $request->input('availability') !== 'all') {
            if ($request->input('availability') === 'in_stock') {
                $query->where('stock', '>', 0);
            } elseif ($request->input('availability') === 'out_of_stock') {
                $query->where('stock', '<=', 0);
            }
        }

        // Discounted only
        if ($request->input('discounted') === '1') {
            $query->whereNotNull('discount_price');
        }

        // Minimum rating — uses the withAvg subquery, so it must be a HAVING
        if ($request->filled('rating') && $request->input('rating') !== 'all') {
            $query->having('reviews_avg_rating', '>=', (float) $request->input('rating'));
        }

        // Sorting
        match ($request->input('sort', 'newest')) {
            'oldest' => $query->oldest(),
            'price_asc' => $query->orderBy('price', 'asc'),
            'price_desc' => $query->orderBy('price', 'desc'),
            'rating_desc' => $query->orderByDesc('reviews_avg_rating'),
            'popular' => $query->orderByDesc('reviews_count'),
            default => $query->latest(),
        };

        $products = $query->paginate(8)->withQueryString();

        $categories = Product::select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');

        return Inertia::render('productPage', [
            'products' => $products,
            'appUrl' => config('app.url'),
            'categories' => $categories,
            'filters' => $request->only([
                'search',
                'category',
                'min_price',
                'max_price',
                'sort',
                'availability',
                'rating',
                'discounted',
            ]),
        ]);
    }

    public function editProduct(int $id)
    {
        return Inertia::render('editProduct', [
            'product' => Product::findOrFail($id),
            'appUrl' => config('app.url'),
            'categories' => Product::select('category')
                ->distinct()
                ->orderBy('category')
                ->pluck('category'),
        ]);
    }

    public function deleteProduct(int $id)
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return redirect('/product-dashboard')->with('success', 'Product deleted successfully');
    }

    public function updateProduct(Request $request, int $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => ['required', 'string', 'max:255', Rule::unique('products', 'slug')->ignore($product->id)],
            'category' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'discount_price' => 'nullable|numeric|min:0|lt:price',
            'stock' => 'required|integer|min:0',
            'description' => 'nullable|string|max:5000',
            'image' => 'nullable|file|mimes:jpg,jpeg,png,webp,avif|max:2048',
        ], [
            'discount_price.lt' => 'The sale price must be lower than the regular price.',
            'image.mimes' => 'The image must be a JPG, PNG, WEBP or AVIF file.',
        ]);

        $validated['category'] = strtolower(trim($validated['category']));
        $validated['discount_price'] = $validated['discount_price'] ?: null;
        $validated['description'] = $validated['description'] ?: null;

        if ($request->hasFile('image')) {
            if ($product->image && Storage::disk('public')->exists($product->image)) {
                Storage::disk('public')->delete($product->image);
            }

            $validated['image'] = $request->file('image')->store('product-page', 'public');
        }

        $product->update($validated);

        return redirect('/product-dashboard')->with(
            'success',
            "{$product->name} has been updated.",
        );
    }
    public function storeProduct(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:products,slug',
            'category' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'discount_price' => 'nullable|numeric|min:0|lt:price',
            'stock' => 'required|integer|min:0',
            'description' => 'nullable|string|max:5000',
            'image' => 'required|file|mimes:jpg,jpeg,png,webp,avif|max:2048',
        ], [
            'discount_price.lt' => 'The sale price must be lower than the regular price.',
            'image.required' => 'A product image is required.',
            'category.required' => 'Please choose or type a category.',
        ]);

        $validated['category'] = strtolower(trim($validated['category']));

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        // Guarantee uniqueness even if two products share a name
        $baseSlug = $validated['slug'];
        $suffix = 1;

        while (Product::where('slug', $validated['slug'])->exists()) {
            $validated['slug'] = $baseSlug . '-' . $suffix++;
        }

        $validated['image'] = $request->file('image')->store('product-page', 'public');

        $validated['discount_price'] = $validated['discount_price'] ?: null;
        $validated['description'] = $validated['description'] ?: null;

        $product = Product::create($validated);

        return redirect('/product-dashboard')->with(
            'success',
            "{$product->name} is now live on your store.",
        );
    }
    public function createProduct()
    {
        return Inertia::render('createProduct', [
            'categories' => Product::select('category')
                ->distinct()
                ->orderBy('category')
                ->pluck('category'),
        ]);
    }
    public function showProduct(string $slug)
    {
        $product = Product::where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        $related = Product::where('category', $product->category)
            ->where('id', '!=', $product->id)
            ->where('is_active', true)
            ->inRandomOrder()
            ->limit(4)
            ->get();

        $reviews = Review::with('user:id,name,profile_picture,avatar_url')
            ->where('product_id', $product->id)
            ->latest()
            ->get()
            ->map(fn($r) => [
                'id' => $r->id,
                'rating' => $r->rating,
                'title' => $r->title,
                'body' => $r->body,
                'created_at' => $r->created_at,
                'is_verified' => $r->is_verified,
                'is_mine' => Auth::check() && $r->user_id === Auth::id(),
                'user' => [
                    'name' => $r->user?->name ?? 'Deleted user',
                    'profile_picture' => $r->user?->profile_picture,
                    'avatar_url' => $r->user?->avatar_url,
                ],
            ]);

        $breakdown = [];
        foreach ([5, 4, 3, 2, 1] as $star) {
            $breakdown[$star] = $reviews->where('rating', $star)->count();
        }

        $inWishlist = false;
        $canReview = false;
        $myReview = null;

        if (Auth::check()) {
            $inWishlist = WishlistItem::where('user_id', Auth::id())
                ->where('product_id', $product->id)
                ->exists();

            $hasPurchased = OrderItem::where('product_id', $product->id)
                ->whereHas('order', function ($q) {
                    $q->where('user_id', Auth::id())
                        ->where('status', 'delivered');
                })
                ->exists();

            $mine = Review::where('user_id', Auth::id())
                ->where('product_id', $product->id)
                ->first();

            $myReview = $mine ? [
                'id' => $mine->id,
                'rating' => $mine->rating,
                'title' => $mine->title,
                'body' => $mine->body,
            ] : null;

            $canReview = $hasPurchased && ! $mine;
        }

        return Inertia::render('productDetail', [
            'product' => $product,
            'related' => $related,
            'appUrl' => config('app.url'),
            'inWishlist' => $inWishlist,
            'canReview' => $canReview,
            'myReview' => $myReview,
            'reviews' => $reviews,
            'ratingSummary' => [
                'average' => round((float) $reviews->avg('rating'), 1),
                'total' => $reviews->count(),
                'breakdown' => $breakdown,
            ],
        ]);
    }

    public function subscribe(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|max:255',
        ], [
            'email.required' => 'Please enter your email address.',
            'email.email' => 'That does not look like a valid email address.',
        ]);

        Subscriber::updateOrCreate(
            ['email' => strtolower(trim($validated['email']))],
            [
                'user_id' => Auth::id(),
                'unsubscribed_at' => null,
            ],
        );

        return back()->with('subscribed', true);
    }
}
