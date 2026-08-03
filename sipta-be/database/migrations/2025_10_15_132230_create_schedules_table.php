<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSchedulesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('schedules', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->foreignUuid('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignUuid('classroom_id')->constrained('classrooms')->cascadeOnDelete();
            $table->foreignUuid('academic_year_id')->constrained('academic_years')->cascadeOnDelete();

            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');

            $table->boolean('is_completed')->default(false);
            $table->enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled'])
                ->default('scheduled');
            $table->timestamp('completed_at')->nullable();
            $table->enum('assessment_period', ['regular', 'uts', 'uas'])
                ->default('regular');

            $table->timestamps();

            $table->unique(
                ['classroom_id', 'date', 'start_time', 'end_time'],
                'schedules_classroom_slot_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('schedules');
    }
}
