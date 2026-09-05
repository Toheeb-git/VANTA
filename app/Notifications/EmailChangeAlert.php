<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EmailChangeAlert extends Notification implements ShouldQueue
{
    use Queueable;

    public $tries = 3;
    public $backoff = [10, 60, 180];

    public function __construct(
        public string $newEmail,
        public string $userName,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Security alert: email change requested on your VANTA account')
            ->view('emails.security-alert', [
                'userName' => $this->userName,
                'heading' => 'Email Change Requested',
                'body' => "Someone asked to change the email address on your account to <strong>{$this->newEmail}</strong>. Your current address stays active until that new one is verified.",
                'actionText' => "If this wasn't you, change your password immediately — someone may have access to your account.",
                'ctaUrl' => url('/account/settings'),
                'ctaLabel' => 'Secure My Account',
                'subject' => 'Email change requested',
            ]);
    }
}
