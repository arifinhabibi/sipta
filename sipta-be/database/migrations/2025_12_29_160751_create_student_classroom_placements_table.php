<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStudentClassroomPlacementsTable extends Migration
{
    public function up()
    {
        Schema::create('student_classroom_placements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignUuid('classroom_id')->constrained('classrooms')->cascadeOnDelete();
            $table->foreignUuid('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->boolean('is_current')->default(true);
            $table->timestamps();

            $table->unique(
                ['student_id', 'academic_year_id'],
                'placements_student_academic_year_unique'
            );
            $table->index(
                ['classroom_id', 'academic_year_id'],
                'placements_classroom_academic_year_index'
            );
        });
    }

    public function down()
    {
        Schema::dropIfExists('student_classroom_placements');
    }
}
