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
        Schema::create('classrooms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('teacher_id')
                ->nullable()
                ->constrained('teachers')
                ->nullOnDelete();
            $table->foreignUuid('instance_id')
                ->constrained('instances')
                ->cascadeOnDelete();

            $table->string('name')->comment('e.g., Raudathul Atfal');
            $table->string('room_number')->nullable()->comment('classroom number, e.g., 01');
            $table->integer('capacity')->nullable()->comment('Maximum number of students');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(
                ['instance_id', 'name'],
                'classrooms_instance_name_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('classrooms');
    }
};
