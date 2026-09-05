<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::create('shipping_zones', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->string('country')->nullable();
        $table->json('states')->nullable();
        $table->decimal('fee', 10, 2);
        $table->boolean('is_fallback')->default(false);
        $table->boolean('is_active')->default(true);
        $table->unsignedInteger('priority')->default(0);
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('shipping_zones');
}
};
