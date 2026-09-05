<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::table('orders', function (Blueprint $table) {
        $table->string('reference')->unique()->nullable()->after('id');
        $table->decimal('subtotal', 12, 2)->default(0)->after('user_id');
        $table->decimal('shipping_fee', 12, 2)->default(0)->after('subtotal');

        $table->string('ship_full_name')->nullable();
        $table->string('ship_phone')->nullable();
        $table->string('ship_country')->nullable();
        $table->string('ship_state')->nullable();
        $table->string('ship_city')->nullable();
        $table->string('ship_street')->nullable();
        $table->string('ship_apartment')->nullable();
        $table->string('ship_postal_code')->nullable();
        $table->text('ship_instructions')->nullable();
    });
}

public function down(): void
{
    Schema::table('orders', function (Blueprint $table) {
        $table->dropColumn([
            'reference', 'subtotal', 'shipping_fee',
            'ship_full_name', 'ship_phone', 'ship_country', 'ship_state',
            'ship_city', 'ship_street', 'ship_apartment', 'ship_postal_code',
            'ship_instructions',
        ]);
    });
}
};
