<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTeacherAttendancesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('teacher_attendances', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->foreignUuid('schedule_id')->nullable()->constrained('schedules')->cascadeOnDelete();

            $table->enum('type', ['check_in', 'check_out']);
            $table->enum('status', ['present', 'absent', 'late', 'sick', 'permission'])->default('present');
            $table->string('longitude')->nullable();
            $table->string('latitude')->nullable();
            $table->string('real_time_photo')->nullable();
            $table->string('gmaps')->nullable();
            $table->string('notes', 225)->nullable();
            $table->timestamps();

            $table->unique(
                ['teacher_id', 'schedule_id', 'type'],
                'teacher_attendances_teacher_schedule_type_unique'
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
        Schema::dropIfExists('teacher_attendances');
    }
}
