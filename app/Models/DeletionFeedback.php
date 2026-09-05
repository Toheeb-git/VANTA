<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeletionFeedback extends Model
{
    protected $table = 'deletion_feedback';

    protected $fillable = [
        'reason',
        'comment',
    ];

    public const REASONS = [
        'not_shopping' => "I don't shop here anymore",
        'too_many_emails' => 'Too many emails',
        'privacy' => 'Privacy concerns',
        'shipping' => 'Shipping cost or delivery times',
        'found_better' => 'Found a better option',
        'order_problem' => 'Something went wrong with an order',
        'other' => 'Other',
        'not_say' => 'Prefer not to say',
    ];

    public function reasonLabel(): string
    {
        return self::REASONS[$this->reason] ?? $this->reason;
    }
}
