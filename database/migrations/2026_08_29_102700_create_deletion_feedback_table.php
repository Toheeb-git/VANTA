<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
{
    Schema::create('deletion_feedback', function (Blueprint $table) {
        $table->id();
        $table->string('reason');
        $table->text('comment')->nullable();
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('deletion_feedback');
}
};
