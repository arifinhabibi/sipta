<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStudentAccomplishmentsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('student_accomplishments', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignUuid('accomplishment_id')
                ->constrained('accomplishments')
                ->cascadeOnDelete();

            $table->boolean('is_capable')
                ->default(false)
                ->comment('true = mampu, false = tidak mampu');

            $table->text('note')->nullable()->comment('Teacher feedback or comment');
            $table->unsignedTinyInteger('score')->nullable();
            $table->timestamp('rated_at')->nullable();
            $table->timestamps();

            $table->unique(
                ['student_id', 'accomplishment_id'],
                'student_accomplishments_student_accomplishment_unique'
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
        Schema::dropIfExists('student_accomplishments');
    }
}
