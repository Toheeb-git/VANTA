<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\AddressController;
use App\Http\Controllers\AdminOrderController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ShippingZoneController;
use App\Http\Controllers\webcontroller;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\WishlistController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\AdminUserController;
/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Storefront
Route::get('/', [webcontroller::class, 'index']);
Route::get('/product', [webcontroller::class, 'index']);
Route::get('/product-page', [webcontroller::class, 'productPage']);
Route::get('/product/{slug}', [webcontroller::class, 'showProduct']);

// Login / register
Route::get('/login', [webcontroller::class, 'login'])->name('login');
Route::post('/login', [webcontroller::class, 'store']);
Route::get('/register', [webcontroller::class, 'register']);
Route::post('/register', [webcontroller::class, 'create']);
Route::get('/verify', [webcontroller::class, 'verify']);

// Google OAuth — must stay public; the user isn't signed in yet
Route::get('/auth/google', [GoogleAuthController::class, 'redirect'])->name('google.redirect');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback']);

// Forgot password
Route::get('/forgetPassword', [webcontroller::class, 'forgetPassword']);
Route::post('/forgot-password', [webcontroller::class, 'sendResetLink']);

// Reset password
Route::get('/reset-password/{token}', [webcontroller::class, 'ResetPassword'])->name('password.reset');
Route::post('/reset-password', [webcontroller::class, 'resetPasswordStore']);

// Email verification link — signed URL is the security, not the session,
// so this works even if the user opens it on another device
Route::get('/email/verify/{id}/{hash}', [AccountController::class, 'verifyEmail'])
    ->middleware('signed')
    ->name('verification.verify');

// Cart — public so guests can build a cart before signing in
Route::get('/cart', [CartController::class, 'index']);
Route::post('/cart', [CartController::class, 'store']);
Route::patch('/cart/{cartItem}', [CartController::class, 'update']);
Route::delete('/cart/{cartItem}', [CartController::class, 'destroy']);

// Paystack webhook — Paystack can't authenticate; protected by signature check
Route::post('/payment/webhook', [PaymentController::class, 'webhook']);

// subscriber Routes
Route::post('/subscribe', [webcontroller::class, 'subscribe'])
    ->middleware('throttle:5,1');

//Restoring Account
Route::post('/account/restore', [AccountController::class, 'cancelDeletion']);

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'active'])->group(function () {

    // Email verification (notice + resend)
    Route::get('/email/verify', [AccountController::class, 'verifyNotice'])
        ->name('verification.notice');
    Route::post('/email/verification-notification', [AccountController::class, 'resendVerification'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    // Profile
    Route::get('/account/profile', [AccountController::class, 'profile']);
    Route::post('/account/profile', [AccountController::class, 'updateProfile']);

    // Settings
    Route::get('/account/settings', [AccountController::class, 'settings']);
    Route::patch('/account/settings/password', [AccountController::class, 'updatePassword']);
    Route::post('/account/settings/set-password', [AccountController::class, 'setPassword']);

    // Email change flow
    Route::post('/account/email/change', [AccountController::class, 'requestEmailChange']);
    Route::post('/account/email/confirm', [AccountController::class, 'confirmEmailChange']);
    Route::post('/account/email/resend', [AccountController::class, 'resendEmailChangeCode'])
        ->middleware('throttle:5,1');
    Route::delete('/account/email/change', [AccountController::class, 'cancelEmailChange']);

    // Addresses
    Route::get('/account/addresses', [AddressController::class, 'index']);
    Route::post('/account/addresses', [AddressController::class, 'store']);
    Route::patch('/account/addresses/{address}', [AddressController::class, 'update']);
    Route::delete('/account/addresses/{address}', [AddressController::class, 'destroy']);
    Route::patch('/account/addresses/{address}/default', [AddressController::class, 'setDefault']);

    // Order history
    Route::get('/account/orders', [AccountController::class, 'orders']);

    // Notifications — literal route before {id} so "read-all" isn't matched as an id
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);

    // Checkout
    Route::get('/checkout', [CheckoutController::class, 'index']);
    Route::post('/checkout/shipping-fee', [CheckoutController::class, 'shippingFee']);
    Route::post('/checkout', [CheckoutController::class, 'store']);

    // Orders
    Route::get('/order/{reference}', [CheckoutController::class, 'show']);
    Route::post('/order/{reference}/cancel', [CheckoutController::class, 'cancel']);
    Route::patch('/order/{reference}/address', [CheckoutController::class, 'updateAddress']);
    Route::post('/order/{reference}/address', [CheckoutController::class, 'storeAddressForOrder']);
    Route::post('/order/{reference}/confirm-delivery', [CheckoutController::class, 'confirmDelivery']);

    // Payment
    Route::post('/order/{reference}/pay', [PaymentController::class, 'initialize']);
    Route::get('/payment/callback', [PaymentController::class, 'callback']);

    // Wishlists
    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::get('/wishlist/ids', [WishlistController::class, 'ids']);
    Route::post('/wishlist/toggle', [WishlistController::class, 'toggle']);
    Route::delete('/wishlist/clear', [WishlistController::class, 'clear']);
    Route::delete('/wishlist/{wishlistItem}', [WishlistController::class, 'destroy']);
    Route::post('/wishlist/{wishlistItem}/move-to-cart', [WishlistController::class, 'moveToCart']);

    //Review
    Route::post('/product/{product}/review', [ReviewController::class, 'store']);
    Route::patch('/review/{review}', [ReviewController::class, 'update']);
    Route::delete('/review/{review}', [ReviewController::class, 'destroy']);

    //Deletion Of Account
    Route::delete('/account/delete', [AccountController::class, 'requestDeletion']);
});

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'admin'])->group(function () {

    // Product management
    Route::get('/product-dashboard', [webcontroller::class, 'dashboard']);
    Route::get('/create-product', [webcontroller::class, 'createProduct']);
    Route::post('/create-product', [webcontroller::class, 'storeProduct']);
    Route::get('/edit-product/{id}/edit', [webcontroller::class, 'editProduct']);
    Route::put('/update-product/{id}', [webcontroller::class, 'updateProduct']);
    Route::delete('/delete-product/{id}', [webcontroller::class, 'deleteProduct']);

    // Shipping zones
    Route::get('/shipping-zones', [ShippingZoneController::class, 'index']);
    Route::post('/shipping-zones', [ShippingZoneController::class, 'store']);
    Route::patch('/shipping-zones/{shippingZone}', [ShippingZoneController::class, 'update']);
    Route::delete('/shipping-zones/{shippingZone}', [ShippingZoneController::class, 'destroy']);

    // Order management
    Route::get('/admin/orders', [AdminOrderController::class, 'index']);
    Route::get('/admin/orders/{reference}', [AdminOrderController::class, 'show']);
    Route::patch('/admin/orders/{reference}/status', [AdminOrderController::class, 'updateStatus']);

    //Suspend Routes
    Route::get('/admin/users', [AdminUserController::class, 'index']);
    Route::get('/admin/users/{id}', [AdminUserController::class, 'show']);
    Route::patch('/admin/users/{id}/suspend', [AdminUserController::class, 'suspend']);
    Route::patch('/admin/users/{id}/unsuspend', [AdminUserController::class, 'unsuspend']);
});
