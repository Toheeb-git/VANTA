<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
{
    Schema::create('addresses', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        $table->string('label')->nullable();
        $table->string('full_name');
        $table->string('phone');
        $table->string('country')->default('Nigeria');
        $table->string('state');
        $table->string('city');
        $table->string('street');
        $table->string('apartment')->nullable();
        $table->string('postal_code')->nullable();
        $table->text('delivery_instructions')->nullable();
        $table->boolean('is_default')->default(false);
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('addresses');
}
};
