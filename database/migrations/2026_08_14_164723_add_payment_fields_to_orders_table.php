<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
{
    Schema::table('orders', function (Blueprint $table) {
        $table->timestamp('paid_at')->nullable()->after('status');
        $table->unsignedInteger('payment_attempts')->default(0)->after('payment_reference');
        $table->boolean('stock_deducted')->default(false)->after('payment_attempts');
    });
}

public function down(): void
{
    Schema::table('orders', function (Blueprint $table) {
        $table->dropColumn(['paid_at', 'payment_attempts', 'stock_deducted']);
    });
}
};
