<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->string('pending_email')->nullable()->after('email');
        $table->string('email_change_code')->nullable()->after('pending_email');
        $table->timestamp('email_change_expires_at')->nullable()->after('email_change_code');
        $table->unsignedTinyInteger('email_change_attempts')->default(0)->after('email_change_expires_at');
    });
}

public function down(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn([
            'pending_email',
            'email_change_code',
            'email_change_expires_at',
            'email_change_attempts',
        ]);
    });
}
};
