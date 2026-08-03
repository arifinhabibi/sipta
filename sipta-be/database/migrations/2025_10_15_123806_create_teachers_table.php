<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTeachersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('teachers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('instance_id')->constrained('instances')->cascadeOnDelete();

            $table->string('full_name');
            $table->enum('gender', ['male', 'female']);
            $table->date('birth_date')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->string('degree')->nullable()->comment('e.g., B.Ed, M.Ed');
            $table->string('photo')->nullable()->comment('Profile picture path');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('teachers');
    }
}
