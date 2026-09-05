<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->softDeletes();
            $table->timestamp('anonymised_at')->nullable()->after('deleted_at');
            $table->timestamp('suspended_at')->nullable()->after('anonymised_at');
            $table->string('suspension_reason')->nullable()->after('suspended_at');
            $table->timestamp('last_login_at')->nullable()->after('suspension_reason');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn([
                'anonymised_at',
                'suspended_at',
                'suspension_reason',
                'last_login_at',
            ]);
        });
    }
};
