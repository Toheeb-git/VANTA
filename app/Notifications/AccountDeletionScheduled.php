<?php

namespace App\Notifications;

use Carbon\CarbonInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AccountDeletionScheduled extends Notification implements ShouldQueue
{
    use Queueable;

    public $tries = 3;

    public function __construct(
        public string $userName,
        public CarbonInterface $deadline,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your VANTA account is scheduled for deletion')
            ->view('emails.security-alert', [
                'userName' => $this->userName,
                'heading' => 'Account Deletion Scheduled',
                'body' => 'Your account has been deactivated and is scheduled for permanent deletion on <strong>'
                    . $this->deadline->format('j F Y')
                    . '</strong>. Until then you can restore it by signing in.',
                'actionText' => "If you didn't request this, sign in now to cancel it — after that date your personal details are removed permanently.",
                'ctaUrl' => url('/login'),
                'ctaLabel' => 'Restore My Account',
                'subject' => 'Account deletion scheduled',
            ]);
    }
}
