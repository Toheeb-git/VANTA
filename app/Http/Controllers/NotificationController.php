<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        return response()->json([
            'notifications' => $user->notifications()
                ->latest()
                ->limit(15)
                ->get()
                ->map(fn ($n) => [
                    'id' => $n->id,
                    'title' => $n->data['title'] ?? 'Notification',
                    'message' => $n->data['message'] ?? '',
                    'url' => $n->data['url'] ?? null,
                    'reference' => $n->data['order_reference'] ?? null,
                    'status' => $n->data['status'] ?? null,
                    'is_admin' => $n->data['is_admin'] ?? false,
                    'read' => $n->read_at !== null,
                    'created_at' => $n->created_at->toIso8601String(),
                ]),
            'unread' => $user->unreadNotifications()->count(),
        ]);
    }

    public function unreadCount()
    {
        return response()->json([
            'unread' => Auth::user()->unreadNotifications()->count(),
        ]);
    }

    public function markRead(string $id)
    {
        $notification = Auth::user()->notifications()->where('id', $id)->first();

        if ($notification) {
            $notification->markAsRead();
        }

        return response()->json([
            'unread' => Auth::user()->unreadNotifications()->count(),
        ]);
    }

    public function markAllRead()
    {
        Auth::user()->unreadNotifications->markAsRead();

        return response()->json(['unread' => 0]);
    }
}
