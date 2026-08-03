<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStudentAttendancesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('student_attendances', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignUuid('schedule_id')->nullable()->constrained('schedules')->cascadeOnDelete();

            $table->enum('status', ['present', 'absent', 'sick', 'permission'])->default('present');
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(
                ['student_id', 'schedule_id'],
                'student_attendances_student_schedule_unique'
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
        Schema::dropIfExists('student_attendances');
    }
}
