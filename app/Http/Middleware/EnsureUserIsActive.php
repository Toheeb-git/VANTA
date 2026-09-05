<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        if ($user && $user->isSuspended()) {
            $reason = $user->suspension_reason;

            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect('/login')->withErrors([
                'email' => $reason
                    ? "Your account has been suspended: {$reason}"
                    : 'Your account has been suspended. Please contact support.',
            ]);
        }

        return $next($request);
    }
}
