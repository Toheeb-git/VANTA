<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up(): void
{
    Schema::create('products', function (Blueprint $table) {
        $table->id();

        // Basic Info
        $table->string('name');
        $table->string('slug')->unique();
        $table->text('description')->nullable();

        // Pricing
        $table->decimal('price', 10, 2);
        $table->decimal('discount_price', 10, 2)->nullable();

        // Inventory
        $table->integer('stock')->default(0);

        // Product Image
        $table->string('image')->nullable();

        // Status
        $table->boolean('is_active')->default(true);

        // Relationships (optional)

        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
