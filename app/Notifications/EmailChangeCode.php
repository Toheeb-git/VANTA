<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EmailChangeCode extends Notification implements ShouldQueue
{
    use Queueable;

    public $tries = 3;
    public $backoff = [10, 60, 180];

    public function __construct(
        public string $code,
        public string $userName,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Your VANTA verification code: {$this->code}")
            ->view('emails.verification-code', [
                'code' => $this->code,
                'userName' => $this->userName,
                'subject' => 'Verify your new email address',
            ]);
    }
}
