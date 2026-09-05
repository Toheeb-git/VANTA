<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordChanged extends Notification implements ShouldQueue
{
    use Queueable;

    public $tries = 3;
    public $backoff = [10, 60, 180];

    public function __construct(public string $userName) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your VANTA password was changed')
            ->view('emails.security-alert', [
                'userName' => $this->userName,
                'heading' => 'Password Changed',
                'body' => 'The password on your account was just changed. If you made this change, nothing further is needed.',
                'actionText' => "If you didn't change it, reset your password now and contact us — someone else may have access.",
                'ctaUrl' => url('/forgetPassword'),
                'ctaLabel' => 'Reset Password',
                'subject' => 'Password changed',
            ]);
    }
}
